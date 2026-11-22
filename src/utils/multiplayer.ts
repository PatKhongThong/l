// Hybrid Real-Time Multiplayer Client (Built-in Same-Origin /ws WebSocket + BroadcastChannel)

export type MultiplayerJob =
  | 'PILOT'
  | 'ENGINEER'
  | 'WEAPONS'
  | 'NAVIGATOR'
  | 'SCIENTIST'
  | 'MEDIC'
  | 'FOREMAN'
  | 'QUARTERMASTER'
  | 'MINER'
  | 'ROBOTICS';

export interface RemotePlayer {
  id: string;
  callsign: string;
  job: MultiplayerJob;
  systemId: string;
  shipHostId: string;
  playerMode: 'flight' | 'interior' | 'eva' | 'earth_cutscene' | 'earth_surface';
  position: [number, number, number];
  quaternion: [number, number, number, number];
  interiorPos: [number, number, number];
  interiorYaw: number;
  interiorRoomId: string;
  liveryId: string;
  rank: string;
  credits: number;
  lastSeen: number;
}

export interface FleetChatMessage {
  id: string;
  sender: string;
  job: MultiplayerJob;
  text: string;
  time: string;
}

type Packet =
  | { type: 'state'; room: string; player: RemotePlayer }
  | { type: 'chat'; room: string; msg: FleetChatMessage }
  | { type: 'coop_reward'; room: string; sender: string; missionTitle: string; credits: number }
  | { type: 'leave'; room: string; playerId: string };

export function getDefaultWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

class MultiplayerClient {
  public readonly playerId = `plr-${Math.random().toString(36).slice(2, 8)}`;
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private room = 'STAR-01';
  private wsUrl = '';
  private connected = false;
  private wsConnected = false;
  private reconnectTimer: number | null = null;
  private listeners = new Set<(pkt: Packet) => void>();
  private statusListeners = new Set<(wsOnline: boolean) => void>();

  connect(roomCode: string, wsUrl?: string) {
    this.disconnect();
    this.room = (roomCode || 'STAR-01').toUpperCase().trim();
    this.wsUrl = (wsUrl && wsUrl.trim()) || getDefaultWsUrl();
    this.connected = true;

    // 1. Instant same-browser BroadcastChannel
    try {
      this.channel = new BroadcastChannel(`starship_mp_${this.room}`);
      this.channel.onmessage = (e) => {
        if (e.data && typeof e.data === 'object') {
          this.emit(e.data as Packet);
        }
      };
    } catch {
      // ignore
    }

    // 2. Built-in WebSocket relay (works across Incognito, different browsers, and LAN devices!)
    this.openWebSocket();
  }

  private openWebSocket() {
    if (!this.connected || !this.wsUrl.startsWith('ws')) return;
    try {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.wsConnected = true;
        this.emitStatus(true);
      };
      ws.onmessage = (e) => {
        try {
          const pkt = JSON.parse(String(e.data)) as Packet;
          this.emit(pkt);
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.wsConnected = false;
        this.emitStatus(false);
        if (this.connected) {
          this.reconnectTimer = window.setTimeout(() => this.openWebSocket(), 2000);
        }
      };
      ws.onerror = () => {
        // onclose handles reconnect
      };
    } catch {
      this.wsConnected = false;
      this.emitStatus(false);
    }
  }

  disconnect() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connected) {
      this.send({ type: 'leave', room: this.room, playerId: this.playerId });
    }
    this.connected = false;
    this.wsConnected = false;
    this.emitStatus(false);
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.close();
    }
  }

  isConnected() {
    return this.connected;
  }

  isWsConnected() {
    return this.wsConnected;
  }

  getRoom() {
    return this.room;
  }

  onPacket(cb: (pkt: Packet) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  onStatus(cb: (wsOnline: boolean) => void) {
    this.statusListeners.add(cb);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  private emit(pkt: Packet) {
    this.listeners.forEach((cb) => cb(pkt));
  }

  private emitStatus(wsOnline: boolean) {
    this.statusListeners.forEach((cb) => cb(wsOnline));
  }

  send(pkt: Packet) {
    if (!this.connected) return;
    try {
      this.channel?.postMessage(pkt);
    } catch {
      // ignore
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(pkt));
      } catch {
        // ignore
      }
    }
  }
}

export const multiplayerClient = new MultiplayerClient();
