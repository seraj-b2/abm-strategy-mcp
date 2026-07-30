# nginx changes needed for OAuth support

Add these two `location` blocks inside the existing `server { listen 443 ssl; ... }`
block for `mcp.seraj.live`, alongside the current `/api/`, `/mcp/`, and `/`
blocks. Order matters in nginx only for overlapping prefixes — these are
exact-match locations so they can go anywhere before the `location /` catch-all,
e.g. right after the `# 1. Backend Express API` block.

```nginx
    # OAuth: Protected Resource Metadata (served by the MCP server itself)
    location = /.well-known/oauth-protected-resource {
        proxy_pass http://127.0.0.1:3000/.well-known/oauth-protected-resource;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OAuth: Authorization Server Metadata (served by the Express backend)
    location = /.well-known/oauth-authorization-server {
        proxy_pass http://127.0.0.1:3001/.well-known/oauth-authorization-server;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

After editing, test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Why this is needed

- `.well-known/*` URIs are required by spec (RFC 8615) to live at the literal
  root of the host — they cannot be served under `/api/oauth/...` or
  `/mcp/...`. Without these blocks, both paths fall through to the
  `location /` catch-all and return the React dashboard's HTML instead of
  JSON metadata, which is why Claude's connector could not discover the
  OAuth flow.
- `oauth-authorization-server` metadata (issuer, authorization_endpoint,
  token_endpoint, registration_endpoint) is served by the Express backend
  (port 3001) and internally reports paths prefixed with `/api` (e.g.
  `https://mcp.seraj.live/api/oauth/token`), matching the existing `/api/`
  proxy rule that already strips the prefix before forwarding.
- `oauth-protected-resource` is served by the MCP server itself (port 3000)
  and points Claude at the authorization server above.

## Also required: environment variables

On the EC2 instance, update both `.env` files before restarting the
processes:

**abm-strategy-backend/.env** — add:
```
PUBLIC_BASE_URL=https://mcp.seraj.live/api
PUBLIC_ORIGIN=https://mcp.seraj.live
```
(`PUBLIC_ORIGIN` has no `/api` suffix — it's the RFC 8414 `issuer` value,
which must be the bare origin since the metadata document is served at
`/.well-known/oauth-authorization-server` with no path suffix.)

**abm-strategy-mcp-server/.env** — add:
```
OAUTH_AUTHORIZATION_SERVER_URL=https://mcp.seraj.live/api
```

Then restart both processes (pm2 restart or equivalent) after `git pull` +
`npm run build`/`npm install` in each repo.
