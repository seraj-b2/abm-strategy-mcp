import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "node:http";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, callTool } from "./tools/index.js";
import { RESOURCES, readResource } from "./resources/index.js";
import { getConfig, checkAuth, verifyToken, AuthState } from "./lib/auth.js";

const SERVER_INSTRUCTIONS = `
This server replaces the abm-strategy-presentation-v5 Claude Code plugin's
orchestrator and workspace-conventions logic. It owns all mechanical
bookkeeping (project state, stage gates, draft versioning, file moves,
logging). You own all analytical reasoning.

Loop for running the pipeline:
1. Call advance_stage(client_slug) to find the next non-completed stage.
2. Tell the user which stage is next and what it produces; wait for the
   user to confirm in chat before proceeding (plain text, not a tool call).
3. Call get_stage_context(client_slug, stage) to get everything already
   known: conventions, project inputs, prior text inputs, and this stage's
   upstream outputs. Read the matching stage resource (abm://stages/<stage>)
   for the analytical framework to follow.
4. Ask the user only for whatever get_stage_context reports as missing, and
   call record_text_input to persist each answer. Do your own web research
   for anything the framework calls for. Call record_assumption for every
   assumption you make along the way, not only missing-data fallbacks.
5. Do the actual analytical work yourself, then call create_draft to stage it.
6. Present the draft and ask the user: Approve, Edit, or Redo? This must be
   a plain-text question — do not assume tool-approval dialogs convey this
   choice.
   - Edit: revise the content yourself, call edit_draft, re-present, ask again.
   - Redo: regenerate with different input, call redo_draft, re-present, ask again.
   - Approve: call approve_draft. Only on a verified approve does the stage
     gate become "completed".
7. Once completed, call advance_stage again and repeat from step 2. When
   21-abm-strategy-presentation is completed, report both final deliverables
   in outputs/.

Every tool call is stateless and takes client_slug explicitly - never assume
you remember project state from earlier in the conversation, especially
across a session gap. Always re-fetch via get_project_status or
get_stage_context and trust what they report over your own memory.
`.trim();

function createMcpServer(authState: AuthState) {
  const server = new Server(
    {
      name: "abm-strategy-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (!authState.authenticated) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `[MCP Authentication Error] ${
              authState.error || "Valid token required"
            }. Please generate a valid MCP token from your backend and update your MCP server configuration.`,
          },
        ],
      };
    }
    return callTool(request.params.name, request.params.arguments ?? {});
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (!authState.authenticated) {
      return {
        isError: true,
        contents: [
          {
            uri: request.params.uri,
            text: `[MCP Authentication Error] ${
              authState.error || "Valid token required"
            }. Please generate a valid MCP token from your backend and update your MCP server configuration.`,
          },
        ],
      };
    }
    return readResource(request.params.uri);
  });

  return server;
}

let currentAuthState: AuthState = {
  authenticated: false,
  error: "Authentication not performed yet",
};

async function main() {
  const config = getConfig();

  // Perform initial authentication check
  currentAuthState = await checkAuth(config);

  if (currentAuthState.authenticated) {
    if (currentAuthState.user) {
      console.error(
        `[MCP Auth Success] Verified user: ${currentAuthState.user.name} (${currentAuthState.user.email}) | Token: ${
          currentAuthState.tokenInfo?.name || "Valid"
        }`
      );
    } else {
      console.error("[MCP Auth Info] Running with auth verification skipped (--skip-auth / SKIP_AUTH=true).");
    }
  } else {
    console.error(`\x1b[33m[MCP Auth Warning] ${currentAuthState.error}\x1b[0m`);
    console.error(
      "\x1b[33m[MCP Auth Warning] Server will remain connected, but tool calls will require a valid MCP token.\x1b[0m"
    );
  }

  if (config.transport === "stdio") {
    const stdioServer = createMcpServer(currentAuthState);
    const transport = new StdioServerTransport();
    await stdioServer.connect(transport);
    console.error("[MCP Server] Connected via Stdio transport.");
  } else {
    const httpTransports = new Map<string, StreamableHTTPServerTransport>();

    async function readJsonBody(req: import("node:http").IncomingMessage): Promise<unknown> {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      return raw ? JSON.parse(raw) : undefined;
    }

    const httpServer = createServer(async (req, res) => {
      try {
        await handleRequest(req, res);
      } catch (err) {
        console.error("[MCP Server] Unhandled request error:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal Server Error" }));
        } else {
          res.end();
        }
      }
    });

    async function handleRequest(
      req: import("node:http").IncomingMessage,
      res: import("node:http").ServerResponse
    ): Promise<void> {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID"
      );
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, Mcp-Protocol-Version");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const host = req.headers.host || `localhost:${config.port}`;
      const urlParts = new URL(req.url || "/", `http://${host}`);
      const rawPath = urlParts.pathname;
      const pathname = rawPath.replace(/^\/mcp/, "") || "/";

      console.error(
        `[MCP Request] ${req.method} ${req.url} | Path: ${rawPath} | Session: ${
          req.headers["mcp-session-id"] || "None"
        } | Auth: ${req.headers.authorization ? "Present" : "None"}`
      );

      // Normalize Accept header for SDK streamable HTTP transport requirements
      if (!req.headers["accept"] || !req.headers["accept"].includes("text/event-stream")) {
        req.headers["accept"] = "application/json, text/event-stream";
      }

      if (rawPath === "/.well-known/oauth-protected-resource") {
        const rawAuthServer = process.env.OAUTH_AUTHORIZATION_SERVER_URL || `https://${host}`;
        const authServerUrl = rawAuthServer.replace(/\/api\/?$/, "").replace(/\/$/, "");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            resource: `https://${host}/mcp`,
            authorization_servers: [authServerUrl],
            scopes_supported: ["abm:read", "abm:write", "mcp:execute"],
            bearer_methods_supported: ["header"],
          })
        );
        return;
      }

      if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", service: "abm-strategy-mcp-server" }));
        return;
      }

      if (pathname !== "/") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
        return;
      }

      function sendUnauthorized(message: string) {
        const resourceMetadataUrl = `https://${host}/.well-known/oauth-protected-resource`;
        res.writeHead(401, {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
        });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: `Unauthorized: ${message}`,
            },
            id: null,
          })
        );
      }

      const existingSessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport = existingSessionId ? httpTransports.get(existingSessionId) : undefined;

      if (transport) {
        let parsedBody: unknown;
        if (req.method === "POST") {
          try {
            parsedBody = await readJsonBody(req);
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32700,
                  message: "Parse error: Invalid JSON body",
                },
                id: null,
              })
            );
            return;
          }
        }
        await transport.handleRequest(req, res, parsedBody);
        return;
      }

      // No active session transport found. Verify authentication token.
      const authHeader = req.headers.authorization;
      const queryToken = urlParts.searchParams.get("token");
      const token = authHeader?.replace(/^Bearer\s+/i, "") || queryToken || config.token;

      let sessionAuth: AuthState = { authenticated: true };

      if (!config.skipAuth) {
        if (!token) {
          sendUnauthorized("Missing authentication token");
          return;
        }

        const authRes = await verifyToken(token, config.backendUrl);
        if (!authRes.valid) {
          sendUnauthorized(authRes.error || "Invalid token");
          return;
        }

        sessionAuth = {
          authenticated: true,
          user: authRes.user,
          tokenInfo: authRes.tokenInfo,
        };
      }

      let parsedBody: unknown;
      if (req.method === "POST") {
        try {
          parsedBody = await readJsonBody(req);
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32700,
                message: "Parse error: Invalid JSON body",
              },
              id: null,
            })
          );
          return;
        }
      }

      if (req.method === "POST" && isInitializeRequest(parsedBody)) {
        // Create new stateful session transport for initialize request
        const sessionTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            httpTransports.set(sessionId, sessionTransport);
          },
        });

        sessionTransport.onclose = () => {
          if (sessionTransport.sessionId) {
            httpTransports.delete(sessionTransport.sessionId);
          }
        };

        const sessionServer = createMcpServer(sessionAuth);
        await sessionServer.connect(sessionTransport);
        await sessionTransport.handleRequest(req, res, parsedBody);
        return;
      }

      // Fallback for GET requests (SSE streams) or stateless POST requests without a session ID
      const statelessTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      const statelessServer = createMcpServer(sessionAuth);
      await statelessServer.connect(statelessTransport);
      await statelessTransport.handleRequest(req, res, parsedBody);
    }

    httpServer.listen(config.port, () => {
      console.error(`[MCP Server] Running over Streamable HTTP on port ${config.port}`);
      console.error(`[MCP Server] MCP Endpoint: http://localhost:${config.port}/mcp`);
    });
  }
}

main().catch((err) => {
  console.error("Fatal error starting abm-strategy-mcp-server:", err);
  process.exit(1);
});
