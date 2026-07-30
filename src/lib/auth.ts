export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenInfo {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: UserInfo;
  tokenInfo?: TokenInfo;
  error?: string;
}

export interface ServerConfig {
  token: string;
  backendUrl: string;
  transport: "stdio" | "sse";
  port: number;
  skipAuth: boolean;
}

export interface AuthState {
  authenticated: boolean;
  user?: UserInfo;
  tokenInfo?: TokenInfo;
  error?: string;
}

export function getConfig(): ServerConfig {
  const args = process.argv.slice(2);
  let token = process.env.MCP_TOKEN || process.env.AUTH_TOKEN || "";
  let backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  let transport: "stdio" | "sse" = (process.env.TRANSPORT as "stdio" | "sse") || "stdio";
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  let skipAuth = process.env.SKIP_AUTH === "true";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && args[i + 1]) {
      token = args[i + 1];
      i++;
    } else if (args[i] === "--backend-url" && args[i + 1]) {
      backendUrl = args[i + 1];
      i++;
    } else if (args[i] === "--transport" && args[i + 1]) {
      transport = args[i + 1] as "stdio" | "sse";
      i++;
    } else if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--skip-auth") {
      skipAuth = true;
    }
  }

  return { token, backendUrl, transport, port, skipAuth };
}

export async function verifyToken(
  token: string,
  backendUrl: string = process.env.BACKEND_URL || "http://localhost:5000"
): Promise<VerifyTokenResponse> {
  const baseUrl = backendUrl.replace(/\/$/, "");
  const url = `${baseUrl}/mcp/verify-token`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let parsedError: string | undefined;
      try {
        const json = JSON.parse(text);
        parsedError = json.message || json.error;
      } catch {
        // ignore json parse error
      }
      return {
        valid: false,
        error: parsedError || `HTTP ${res.status}: ${res.statusText || text}`,
      };
    }

    const data = (await res.json()) as VerifyTokenResponse;
    return data;
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to connect to authentication backend at ${url}: ${err.message || String(err)}`,
    };
  }
}

export async function checkAuth(config: ServerConfig): Promise<AuthState> {
  if (config.skipAuth) {
    return { authenticated: true };
  }

  if (!config.token) {
    return {
      authenticated: false,
      error: "Missing required MCP authentication token (MCP_TOKEN env or --token flag)",
    };
  }

  const authResult = await verifyToken(config.token, config.backendUrl);
  if (!authResult.valid) {
    return {
      authenticated: false,
      error: authResult.error || "Token verification failed (Invalid or revoked token)",
    };
  }

  return {
    authenticated: true,
    user: authResult.user,
    tokenInfo: authResult.tokenInfo,
  };
}
