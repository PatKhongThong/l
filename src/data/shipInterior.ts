export interface InteriorRoom {
  id: string;
  name: string;
  shortName: string;
  center: [number, number, number];
  size: [number, number, number];
  accentColor: string;
  purpose: string;
  linkedStation?:
    | 'bridge'
    | 'engineering'
    | 'starmap'
    | 'missions'
    | 'emergency'
    | 'crew'
    | 'science'
    | 'medical'
    | 'security'
    | 'comms'
    | 'cargo'
    | 'ai'
    | 'fuel'
    | 'coolant'
    | 'upgrades';
  isAirlock?: boolean;
  isObservation?: boolean;
}

// Connected 15-room spacecraft deck arranged around a central glass-roofed spine corridor
export const SHIP_ROOMS: InteriorRoom[] = [
  {
    id: 'observation-deck',
    name: 'OBSERVATION DECK',
    shortName: 'OBS DECK',
    center: [0, 0, -24],
    size: [10, 4.4, 8],
    accentColor: '#38bdf8',
    purpose: 'Panoramic glass forward viewport overlooking live planets, stars, and stations.',
    isObservation: true,
  },
  {
    id: 'command-bridge',
    name: 'COMMAND BRIDGE',
    shortName: 'BRIDGE',
    center: [0, 0, -14],
    size: [12, 4.2, 10],
    accentColor: '#00e5ff',
    purpose: 'Primary flight helm, tactical radar, and forward space viewport.',
    linkedStation: 'bridge',
  },
  {
    id: 'navigation-room',
    name: 'NAVIGATION ROOM',
    shortName: 'NAV ROOM',
    center: [-10, 0, -6],
    size: [8, 3.8, 8],
    accentColor: '#38bdf8',
    purpose: 'Astrogation holo-table, quantum route plotting, and autopilot control.',
    linkedStation: 'starmap',
  },
  {
    id: 'comms-room',
    name: 'COMMUNICATIONS ROOM',
    shortName: 'COMMS',
    center: [10, 0, -6],
    size: [8, 3.8, 8],
    accentColor: '#60a5fa',
    purpose: 'Subspace transceiver array, station hails, and signal decryption.',
    linkedStation: 'comms',
  },
  {
    id: 'science-lab',
    name: 'SCIENCE LABORATORY',
    shortName: 'SCI LAB',
    center: [-10, 0, 3],
    size: [8, 3.8, 8],
    accentColor: '#a855f7',
    purpose: 'Planetary spectroscopy, anomaly analysis, and sample containment.',
    linkedStation: 'science',
  },
  {
    id: 'medical-bay',
    name: 'MEDICAL BAY',
    shortName: 'MED BAY',
    center: [10, 0, 3],
    size: [8, 3.8, 8],
    accentColor: '#10b981',
    purpose: 'Biobed diagnostics, crew injury treatment, and radiation therapy.',
    linkedStation: 'medical',
  },
  {
    id: 'crew-quarters',
    name: 'CREW QUARTERS',
    shortName: 'QUARTERS',
    center: [-10, 0, 12],
    size: [8, 3.8, 8],
    accentColor: '#f59e0b',
    purpose: 'Rest bunks, crew morale recovery, and personal terminals.',
    linkedStation: 'crew',
  },
  {
    id: 'cargo-bay',
    name: 'CARGO BAY',
    shortName: 'CARGO BAY',
    center: [10, 0, 12],
    size: [8, 4.2, 8],
    accentColor: '#fb923c',
    purpose: 'Pressurized freight containers, security CCTV, trading, and hull liveries.',
    linkedStation: 'cargo',
  },
  {
    id: 'maintenance-room',
    name: 'MAINTENANCE ROOM',
    shortName: 'MAINT BAY',
    center: [-10, 0, 21],
    size: [8, 3.8, 8],
    accentColor: '#facc15',
    purpose: 'Emergency response desk, M-BOT robot cradles, and damage control.',
    linkedStation: 'emergency',
  },
  {
    id: 'airlock',
    name: 'AIRLOCK & EVA BAY',
    shortName: 'AIRLOCK',
    center: [10, 0, 21],
    size: [8, 3.8, 8],
    accentColor: '#ef4444',
    purpose: 'EVA spacesuit lockers, external spacewalk hatch, and Escape Pod bay.',
    isAirlock: true,
  },
  {
    id: 'fuel-bay',
    name: 'DEUTERIUM FUEL BAY',
    shortName: 'FUEL BAY',
    center: [-10, 0, 30],
    size: [8, 4.0, 8],
    accentColor: '#f59e0b',
    purpose: 'Load glowing Deuterium Cores into the intake manifold to refuel the ship.',
    linkedStation: 'fuel',
  },
  {
    id: 'coolant-bay',
    name: 'CRYO-COOLANT BAY',
    shortName: 'COOLANT',
    center: [10, 0, 30],
    size: [8, 4.0, 8],
    accentColor: '#22d3ee',
    purpose: 'Load Cryo-Coolant Canisters and purge thermal manifolds to chill the core.',
    linkedStation: 'coolant',
  },
  {
    id: 'upgrade-bay',
    name: 'UPGRADE & BOOST BAY',
    shortName: 'UPGRADES',
    center: [0, 0, 10],
    size: [8, 4.2, 8],
    accentColor: '#34d399',
    purpose: 'Spend CR on permanent engine boosts, warp coils, shields, armor, and supply cores.',
    linkedStation: 'upgrades',
  },
  {
    id: 'main-engineering',
    name: 'MAIN ENGINEERING',
    shortName: 'ENGINEERING',
    center: [0, 0, 19],
    size: [10, 4.2, 8],
    accentColor: '#00e5ff',
    purpose: 'Power distribution bus, thermal manifolds, and subsystem circuit breakers.',
    linkedStation: 'engineering',
  },
  {
    id: 'reactor-room',
    name: 'REACTOR ROOM',
    shortName: 'REACTOR',
    center: [0, 0, 29],
    size: [10, 4.8, 10],
    accentColor: '#38bdf8',
    purpose: 'Magnetic confinement fusion core and emergency backup generator.',
    linkedStation: 'engineering',
  },
  {
    id: 'cargo-bay-b',
    name: 'CARGO BAY B (HEAVY FREIGHT)',
    shortName: 'CARGO B',
    center: [10, 0, -15],
    size: [8, 4.2, 8],
    accentColor: '#f97316',
    purpose: 'Expanded heavy freight bay for factory alloys, ore pallets, and trade goods.',
    linkedStation: 'cargo',
  },
  {
    id: 'hangar-bay',
    name: 'DRONE & SHUTTLE HANGAR',
    shortName: 'HANGAR',
    center: [-10, 0, -15],
    size: [8, 4.2, 8],
    accentColor: '#22d3ee',
    purpose: 'Launch bay for mining skiffs, salvage drones, and M-BOT maintenance units.',
    linkedStation: 'emergency',
  },
  {
    id: 'fabricator-bay',
    name: 'ROBOTIC FABRICATOR BAY',
    shortName: 'FABRICATOR',
    center: [0, 0, 1],
    size: [8, 4.2, 8],
    accentColor: '#facc15',
    purpose: 'Onboard mechanical robotic arm assembling Deuterium Cores & Torpedoes from ore.',
    linkedStation: 'fuel',
  },
];

export function getRoomById(id: string): InteriorRoom {
  return SHIP_ROOMS.find((r) => r.id === id) || SHIP_ROOMS[1];
}

export function findRoomAtPosition(x: number, z: number): InteriorRoom | null {
  for (const room of SHIP_ROOMS) {
    const hw = room.size[0] / 2 + 0.4;
    const hd = room.size[2] / 2 + 0.4;
    if (Math.abs(x - room.center[0]) <= hw && Math.abs(z - room.center[2]) <= hd) {
      return room;
    }
  }
  return null;
}
