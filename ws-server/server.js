// Import Node's built-in HTTP module so we can create a basic HTTP server.
const http = require("http");
// Import the WebSocket server implementation used by y-websocket.
const WebSocket = require("ws");
// Import y-websocket's helper that wires a raw socket to a Yjs room/document.
// const { setupWSConnection } = require("y-websocket/bin/utils.js");

const path = require("path");
const { setupWSConnection } = require(
  path.join(__dirname, "node_modules/y-websocket/bin/utils.js")
);

// Read HOST from environment so platforms like Railway/Render can bind correctly.
const HOST = process.env.HOST || "0.0.0.0";
// Read PORT from environment (provided by hosting platform) with a local default.
const PORT = Number(process.env.PORT || 1234);

// Create a tiny HTTP server mainly for health checks and "is it alive?" checks.
const server = http.createServer((req, res) => {
  // Return HTTP 200 and plaintext content type for easy curl/browser checks.
  res.writeHead(200, { "Content-Type": "text/plain" });
  // End the response with a simple message.
  res.end("y-websocket server is running\n");
});

// Attach a WebSocket server to the same HTTP server/port.
const wss = new WebSocket.Server({ server });

// Handle every new incoming WebSocket connection.
wss.on("connection", (conn, req) => {
  // Delegate protocol handling to y-websocket for real-time CRDT sync.
  setupWSConnection(conn, req, {
    // Enable Yjs garbage collection to clean up deleted document structures.
    gc: true,
  });
});

// Start listening so clients can connect from your Next.js app.
server.listen(PORT, HOST, () => {
  // Log startup info to help verify the server booted with expected host/port.
  console.log(`y-websocket server listening on ws://${HOST}:${PORT}`);
});
