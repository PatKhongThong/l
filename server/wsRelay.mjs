// Zero-dependency RFC-6455 WebSocket Relay attachable to Vite's HTTP server or standalone Node HTTP server
import crypto from 'node:crypto';

function encodeFrame(text, opcode = 0x1) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeFrames(buffer) {
  const messages = [];
  const pongs = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const opcode = buffer[offset] & 0x0f;
    const masked = (buffer[offset + 1] & 0x80) !== 0;
    let payloadLen = buffer[offset + 1] & 0x7f;
    let pos = offset + 2;
    if (payloadLen === 126) {
      if (pos + 2 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(pos);
      pos += 2;
    } else if (payloadLen === 127) {
      if (pos + 8 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(pos));
      pos += 8;
    }
    const maskLen = masked ? 4 : 0;
    if (pos + maskLen + payloadLen > buffer.length) break;
    const mask = masked ? buffer.subarray(pos, pos + 4) : null;
    pos += maskLen;
    const data = Buffer.from(buffer.subarray(pos, pos + payloadLen));
    if (mask) {
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
    }
    offset = pos + payloadLen;
    if (opcode === 0x8) return { messages, pongs, rest: Buffer.alloc(0), closed: true };
    if (opcode === 0x9) pongs.push(data);
    if (opcode === 0x1) messages.push(data.toString('utf8'));
  }
  return { messages, pongs, rest: buffer.subarray(offset), closed: false };
}

export function attachWebSocketRelay(httpServer, pathPrefix = '/ws') {
  const clients = new Set();

  httpServer.on('upgrade', (req, socket) => {
    const urlPath = (req.url || '').split('?')[0];
    if (pathPrefix && urlPath !== pathPrefix) return;

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = crypto
      .createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const client = { socket, room: 'STAR-01', buf: Buffer.alloc(0) };
    clients.add(client);

    socket.on('data', (chunk) => {
      client.buf = Buffer.concat([client.buf, chunk]);
      const { messages, pongs, rest, closed } = decodeFrames(client.buf);
      client.buf = rest;

      for (const pingPayload of pongs) {
        if (!socket.destroyed) socket.write(encodeFrame(pingPayload.toString('utf8'), 0xa));
      }

      if (closed) {
        clients.delete(client);
        socket.end();
        return;
      }

      for (const raw of messages) {
        try {
          const msg = JSON.parse(raw);
          if (msg.room) client.room = String(msg.room).toUpperCase().trim();
          const frame = encodeFrame(raw, 0x1);
          for (const other of clients) {
            if (other !== client && other.room === client.room && !other.socket.destroyed) {
              other.socket.write(frame);
            }
          }
        } catch {
          // Ignore malformed JSON frames
        }
      }
    });

    const cleanup = () => clients.delete(client);
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });

  return { clients };
}

