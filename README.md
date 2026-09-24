# deploy-with-back4app-mcp

[![Deploy on Back4app](https://img.shields.io/badge/Deploy%20on-Back4app-1568B8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3djEwbDEwIDUgMTAtNVY3eiIvPjwvc3ZnPg==)](https://www.back4app.com/signup?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp)

**Ship a built folder to your own backend from your editor, in one prompt — no CI, no FTP, no dashboard upload.**  The Back4app MCP server gives an AI editor hands on your account; this is the smallest useful thing that connection buys you.

Measured on September 23, 2026: a three-file production build deployed in **9.4 s**, and the public address came back in **813 ms**. Re-tested end to end on September 24 before publishing.

> **Read the article:** [How to Deploy a Figma Make Site With an MCP Server](https://www.back4app.com/blog/deploy-a-figma-make-site-with-an-mcp-server?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp)

## What it does

`deploy-dist.mjs` drives the MCP server over stdio, uploads every file in a folder and returns a live HTTPS address. Files are passed by **path**, not by content, so a 229 KB bundle never travels through a model's context window.

With the server connected to your editor, the same thing is a sentence: *"Deploy the dist folder to my blog-demo app's web hosting."*

## What we measured

| Measurement | Result |
|---|---|
| `deploy_web_hosting_files`, three files | 9.4 s |
| `activate_web_hosting` | 813 ms |
| Files served | exact byte sizes of the build, `Server: nginx` |
| Free-plan address | `preview-*.b4a.app`, expires **60 minutes** after activation |

Two limits worth knowing: there is **no single-page-app fallback** — an unmatched path returns `403 {"error":"unauthorized"}` rather than rewriting to `index.html` — and everything is served `cache-control: public, max-age=0`, including content-hashed assets.

## Files

- `mcp.json` — the editor configuration, ready to copy.
- `deploy-dist.mjs` — upload a folder and get an address. No dependencies beyond Node 22.

## Deploy your own

1. **Create a free account.** Sign up at [https://www.back4app.com/signup?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp](https://www.back4app.com/signup?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp).
2. **Account key:** Account Settings → Account Keys.
3. **Point your editor at the server** — Cursor, Claude Code and VS Code all take the same shape, and the package is fetched on demand:

   ```json
   {
     "mcpServers": {
       "back4app": {
         "command": "npx",
         "args": ["-y", "@back4app/mcp-server-back4app@latest",
                  "--account-key", "YOUR_ACCOUNT_KEY"]
       }
     }
   }
   ```

**Security:** the account key reaches **every app on the account**, and the server fetches each app's master key so its tools can act. Give it a key of its own that you can revoke, keep it out of the repository, and point it at a scratch app rather than anything with real users on it.

## Run locally

```bash
export BACK4APP_ACCOUNT_KEY=...
node deploy-dist.mjs <appName> <dir>

# node deploy-dist.mjs blog-demo dist
#   deploying 3 file(s) from dist to blog-demo
#   deploy_web_hosting_files -> 9376ms
#   activate_web_hosting -> 813ms
```

## What the platform gives you

Web hosting serves the files you deploy behind HTTPS, and the backend behind it is a managed Parse Server with a database, REST and GraphQL APIs and Cloud Code — so the same connection that publishes your front end can give it a backend later. Documentation: [https://www.back4app.com/docs/mcp?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp](https://www.back4app.com/docs/mcp?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp) · [https://www.back4app.com/docs?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp](https://www.back4app.com/docs?utm_source=github&utm_medium=repo&utm_campaign=deploy-with-back4app-mcp).

## License

MIT.
