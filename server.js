const express = require("express");
const {
  createProxyMiddleware
} = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Set this to the origin of a website you own
// or have permission to proxy.
const targetValue = process.env.UPSTREAM_URL;

if (!targetValue) {
  throw new Error(
    "Set UPSTREAM_URL to an authorized upstream website."
  );
}

const target = new URL(targetValue);

if (
  !["https:", "http:"].includes(target.protocol) ||
  !target.hostname
) {
  throw new Error("UPSTREAM_URL must be a valid HTTP(S) URL.");
}

app.disable("x-powered-by");

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport"
          content="width=device-width, initial-scale=1">
        <title>OpenGate Proxy</title>
      </head>
      <body style="font:16px system-ui;max-width:700px;
        margin:60px auto;padding:20px">
        <h1>OpenGate</h1>
        <p>Server-side reverse proxy is running.</p>
        <p>
          <a href="/site/">Open the configured website</a>
        </p>
      </body>
    </html>
  `);
});

// Only proxy to the server configured above.
// Do not accept arbitrary target URLs from visitors.
app.use(
  "/site",
  createProxyMiddleware({
    target: target.origin,
    changeOrigin: true,
    pathRewrite: (path) => {
      const prefix = target.pathname.replace(/\/$/, "");
      return prefix + path;
    },
    on: {
      error(_error, _req, res) {
        if (!res.headersSent) {
          res.writeHead(502, {
            "Content-Type": "text/plain; charset=utf-8"
          });
        }
        res.end("The upstream website could not be reached.");
      }
    }
  })
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`OpenGate running at http://127.0.0.1:${PORT}`);
});
