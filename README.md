# deploy-with-back4app-mcp

**Ship a built folder to your own backend from your editor, in one prompt — no CI, no FTP, no dashboard upload.**

The [Back4app MCP server](https://www.back4app.com/docs/mcp) gives an AI editor hands on your account. `deploy-dist.mjs` here is the smallest useful thing that connection buys you: point it at a `dist/` folder and it uploads the files and returns a live HTTPS address.

Measured on September 23, 2026: a three-file production build deployed in **9.4 s**, and the address came back in **813 ms**.

> **Read the article:** [How to Deploy a Figma Make Site With an MCP Server](https://www.back4app.com/blog/deploy-a-figma-make-site-with-an-mcp-server)

## Connect the server

Create an account key in the Back4app dashboard under **Account Settings → Account Keys**, then add this to your editor's MCP configuration — Cursor, Claude Code, VS Code all take the same shape. The package is fetched on demand, so there is nothing to install first.

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

With that in place, deploying is a sentence: *"Deploy the dist folder to my blog-demo app's web hosting."*

## Or run it without an editor

`deploy-dist.mjs` drives the same server over stdio, so you can use it from a terminal or a CI job:

```bash
export BACK4APP_ACCOUNT_KEY=...
node deploy-dist.mjs <appName> <dir>

# node deploy-dist.mjs blog-demo dist
#   deploying 3 file(s) from dist to blog-demo
#   deploy_web_hosting_files -> 9376ms
#   activate_web_hosting -> 813ms
#   { "subdomain": "preview-...b4a.app", "expiresAt": "..." }
```

Files are passed by **path**, not by content, so a 229 KB bundle never travels through a model's context window.

## What you get, and what you don't

`activate_web_hosting` returns a working address on the **free plan**, even though the dashboard's Domain Settings page answers *"Please upgrade your plan to activate your web hosting."* The catch is in the response: the subdomain is prefixed `preview-` and carries an `expiresAt` exactly **60 minutes** ahead. That is a sharing window, not hosting — a permanent subdomain or your own domain needs a paid plan.

Two more things worth knowing before you build on this:

- **There is no SPA fallback.** A request for a path with no matching file returns `403 {"error":"unauthorized"}`, not a rewrite to `index.html`. Single-view apps are fine; a router needs hash routes or a rewrite layer in front.
- **Everything is served `cache-control: public, max-age=0`**, including content-hashed assets that could safely be cached for a year.

## Security

The account key reaches **every app on the account**, and the server fetches each app's master key so its tools can act. Give it a key of its own that you can revoke, keep it out of the repository, and point it at a scratch app rather than anything with real users on it.

## Files

- `mcp.json` — the editor configuration, ready to copy.
- `deploy-dist.mjs` — upload a folder and get an address. No dependencies beyond Node 22.

## License

MIT.
