import app from "./index.ts";

const server = Bun.serve({
  port: parseInt(process.env.PORT || "3001"),
  hostname: process.env.HOST || "0.0.0.0",
  fetch: app.fetch,
});

console.log(`Server running at http://localhost:${server.port}`);
