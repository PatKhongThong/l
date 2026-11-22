// Launches both STARSHIP WebSocket Multiplayer Relay (port 8081) and Vite Dev Server (port 5173)
import { spawn } from 'node:child_process';
import os from 'node:os';

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const lanIp = getLanIp();
console.log('\n======================================================');
console.log('  STARSHIP 3.0 // FULL MULTIPLAYER LAUNCHER');
console.log('======================================================');
console.log(`  LOCAL GAME : http://localhost:5173`);
console.log(`  LAN GAME   : http://${lanIp}:5173`);
console.log(`  FLEET WS   : ws://${lanIp}:8081`);
console.log('  TIP: Share the LAN URL + your Fleet Code with friends!');
console.log('======================================================\n');

const wsServer = spawn(process.execPath, ['server/multiplayerServer.mjs'], {
  stdio: 'inherit',
});

const vite = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '--port', '5173'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const shutdown = () => {
  wsServer.kill();
  vite.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

