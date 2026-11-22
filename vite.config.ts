import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { attachWebSocketRelay } from './server/wsRelay.mjs';

function starshipMultiplayerPlugin(): Plugin {
  return {
    name: 'starship-multiplayer-ws',
    configureServer(server) {
      if (server.httpServer) {
        attachWebSocketRelay(server.httpServer, '/ws');
        console.log('[STARSHIP] Built-in Multiplayer WebSocket Relay active on /ws');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), starshipMultiplayerPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
