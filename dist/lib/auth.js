export function getConfig() {
    const args = process.argv.slice(2);
    let token = process.env.MCP_TOKEN || process.env.AUTH_TOKEN || "";
    let backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    let transport = process.env.TRANSPORT || "stdio";
    let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    let skipAuth = process.env.SKIP_AUTH !== "false";
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--token" && args[i + 1]) {
            token = args[i + 1];
            i++;
        }
        else if (args[i] === "--backend-url" && args[i + 1]) {
            backendUrl = args[i + 1];
            i++;
        }
        else if (args[i] === "--transport" && args[i + 1]) {
            transport = args[i + 1];
            i++;
        }
        else if (args[i] === "--port" && args[i + 1]) {
            port = parseInt(args[i + 1], 10);
            i++;
        }
        else if (args[i] === "--skip-auth") {
            skipAuth = true;
        }
        else if (args[i] === "--require-auth") {
            skipAuth = false;
        }
    }
    return { token, backendUrl, transport, port, skipAuth };
}
export async function verifyToken(token, backendUrl = process.env.BACKEND_URL || "http://localhost:3001") {
    const baseUrl = backendUrl.replace(/\/$/, "");
    const candidateUrls = Array.from(new Set([
        `${baseUrl}/mcp/verify-token`,
        `${baseUrl}/api/mcp/verify-token`,
        "http://127.0.0.1:3001/mcp/verify-token",
        "http://127.0.0.1:3001/api/mcp/verify-token",
        "http://127.0.0.1:5000/mcp/verify-token",
        "http://127.0.0.1:5000/api/mcp/verify-token"
    ]));
    let lastError = "";
    for (const url of candidateUrls) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token })
            });
            if (res.ok) {
                const data = (await res.json());
                if (data.valid)
                    return data;
            }
            else {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    lastError = json.message || json.error || text;
                }
                catch {
                    lastError = `HTTP ${res.status}: ${text}`;
                }
            }
        }
        catch (err) {
            lastError = err.message || String(err);
        }
    }
    return {
        valid: false,
        error: `Failed token verification across backend endpoints: ${lastError}`,
    };
}
export async function checkAuth(config) {
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
