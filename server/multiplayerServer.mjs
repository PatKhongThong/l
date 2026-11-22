// Standalone Node.js WebSocket Relay Server for STARSHIP 3.0 Multiplayer
import http from 'node:http';
import { attachWebSocketRelay } from './wsRelay.mjs';

const PORT = Number(process.env.PORT || 8081);

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('STARSHIP 3.0 WebSocket Relay Server Online\n');
});

attachWebSocketRelay(server, '');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[STARSHIP 3.0] Standalone Multiplayer Relay listening on ws://0.0.0.0:${PORT}`);
});
