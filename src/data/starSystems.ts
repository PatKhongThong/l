export type SpaceObjectType =
  | 'star'
  | 'planet'
  | 'station'
  | 'anomaly'
  | 'asteroid'
  | 'ship'
  | 'satellite'
  | 'derelict'
  | 'comet';

export type PlanetStyle = 'oceanic' | 'cryogenic' | 'volcanic' | 'gas' | 'barren';

export type HazardZoneType = 'RADIATION' | 'GRAVITY_WELL' | 'SOLAR_FLARE' | 'NEBULA_INTERFERENCE';

export interface HazardZone {
  id: string;
  name: string;
  type: HazardZoneType;
  position: [number, number, number];
  radius: number;
  intensity: number; // 0.5..2.0
  color: string;
  description: string;
}

export interface SpaceObject {
  id: string;
  name: string;
  type: SpaceObjectType;
  position: [number, number, number];
  radius: number;
  color: string;
  secondaryColor?: string;
  atmosphereColor?: string;
  planetStyle?: PlanetStyle;
  hasRings?: boolean;
  ringColor?: string;
  description: string;
  classification: string;
  dockable?: boolean;
  landable?: boolean;
  scannable?: boolean;
  repairable?: boolean;
  sampleName?: string;
  scienceValue?: number;
  hazardLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

export interface NpcShipDef {
  id: string;
  name: string;
  callsign: string;
  role: string;
  orbitCenter: [number, number, number];
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  initialPhase: number;
  color: string;
}

export interface AsteroidDef {
  id: string;
  position: [number, number, number];
  radius: number;
  rotationSpeed: [number, number, number];
}

export interface StarSystem {
  id: string;
  name: string;
  sectorCode: string;
  starClass: string;
  starColor: string;
  starEmissive: string;
  nebulaColor: string;
  galaxyPos: [number, number, number];
  connections: string[];
  description: string;
  objects: SpaceObject[];
  npcs: NpcShipDef[];
  asteroids: AsteroidDef[];
  hazards: HazardZone[];
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateAsteroids(
  seed: number,
  prefix: string,
  center: [number, number, number],
  count: number,
  spread: number,
  minR = 3.5,
  maxR = 11
): AsteroidDef[] {
  const rand = mulberry32(seed);
  const list: AsteroidDef[] = [];
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const dist = 35 + rand() * spread;
    const x = center[0] + Math.sin(phi) * Math.cos(theta) * dist;
    const y = center[1] + (rand() - 0.5) * spread * 0.45;
    const z = center[2] + Math.sin(phi) * Math.sin(theta) * dist;
    list.push({
      id: `${prefix}-ast-${i}`,
      position: [x, y, z],
      radius: minR + rand() * (maxR - minR),
      rotationSpeed: [(rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4],
    });
  }
  return list;
}

export const STAR_SYSTEMS: StarSystem[] = [
  {
    id: 'solaris-prime',
    name: 'SOLARIS PRIME',
    sectorCode: 'SEC-01 // CORE',
    starClass: 'G2V MAIN SEQUENCE',
    starColor: '#fff4d6',
    starEmissive: '#ffae42',
    nebulaColor: '#0b1e3b',
    galaxyPos: [0, 0, 0],
    connections: ['vela-nebula', 'kepler-reach'],
    description:
      'Primary command sector of the Terran Orbital Directorate. Home to Aurelia IV, Vanguard Orbital Shipyard, CommSat Alpha-3, and the outer Cinder Belt.',
    objects: [
      {
        id: 'solaris-star',
        name: 'SOLARIS A',
        type: 'star',
        position: [-950, 120, -1400],
        radius: 170,
        color: '#ffdf9e',
        description: 'Stable G-class yellow dwarf illuminating the core colonies.',
        classification: 'G2V STAR',
        hazardLevel: 'EXTREME',
      },
      {
        id: 'earth',
        name: 'EARTH',
        type: 'planet',
        position: [190, -18, -360],
        radius: 82,
        color: '#1d4ed8',
        secondaryColor: '#15803d',
        atmosphereColor: '#60a5fa',
        planetStyle: 'oceanic',
        description:
          'Homeworld of humanity and Terran Heavy Shipyards. Land on Earth [L] to replace damaged modules and install permanent Engine, Sensor, and Coolant upgrades.',
        classification: 'HOMEWORLD // SHIPYARD',
        scannable: true,
        landable: true,
        sampleName: 'Terran Biosphere Reference',
        scienceValue: 200,
        hazardLevel: 'LOW',
      },
      {
        id: 'aurelia-iv',
        name: 'AURELIA IV',
        type: 'planet',
        position: [320, -40, -680],
        radius: 95,
        color: '#1b6ca8',
        secondaryColor: '#2d8a68',
        atmosphereColor: '#38bdf8',
        planetStyle: 'oceanic',
        hasRings: true,
        ringColor: '#67e8f9',
        description: 'Temperate oceanic colony world with orbital elevator rings and habitable surface landing pads.',
        classification: 'TERRESTRIAL OCEANIC',
        scannable: true,
        landable: true,
        sampleName: 'Aurelian Bio-Plankton Core',
        scienceValue: 350,
        hazardLevel: 'LOW',
      },
      {
        id: 'vanguard-orbital',
        name: 'VANGUARD ORBITAL',
        type: 'station',
        position: [95, 18, -240],
        radius: 26,
        color: '#38bdf8',
        description: 'Fleet command drydock and logistics hub. Full hull repair, refuel, cargo trading, and O2 cycling.',
        classification: 'COMMAND CITADEL',
        dockable: true,
        scannable: true,
        hazardLevel: 'LOW',
      },
      {
        id: 'commsat-a3',
        name: 'COMMSAT ALPHA-3',
        type: 'satellite',
        position: [-110, 52, -195],
        radius: 12,
        color: '#38bdf8',
        description: 'Orbital subspace relay satellite with solar wings. Occasionally requires field calibration.',
        classification: 'COMM SATELLITE',
        scannable: true,
        repairable: true,
        sampleName: 'Encrypted Relay Telemetry',
        scienceValue: 220,
        hazardLevel: 'LOW',
      },
      {
        id: 'relay-k9',
        name: 'DERELICT RELAY K-9',
        type: 'anomaly',
        position: [-290, 48, -420],
        radius: 16,
        color: '#f59e0b',
        description: 'Unidentified encrypted subspace beacon broadcasting an anomalous telemetry pulse from the Cinder Belt.',
        classification: 'UNIDENTIFIED SIGNAL',
        scannable: true,
        sampleName: 'Quantum Cipher Fragment',
        scienceValue: 500,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'kronos-moon',
        name: 'KRONOS V',
        type: 'planet',
        position: [-520, -90, 260],
        radius: 62,
        color: '#64748b',
        secondaryColor: '#334155',
        atmosphereColor: '#94a3b8',
        planetStyle: 'barren',
        description: 'Barren silicate world rich in titanium deposits and automated listening posts.',
        classification: 'SILICATE BARREN',
        scannable: true,
        landable: true,
        sampleName: 'Titanium-Silicate Regolith',
        scienceValue: 280,
        hazardLevel: 'LOW',
      },
      {
        id: 'comet-halcyon',
        name: 'COMET HALCYON-7',
        type: 'comet',
        position: [260, 140, -160],
        radius: 10,
        color: '#bae6fd',
        description: 'Long-period icy comet venting a luminous ionized cyan tail across inner Solaris.',
        classification: 'IONIZED COMET',
        scannable: true,
        sampleName: 'Cometary Cryo-Isotope',
        scienceValue: 420,
        hazardLevel: 'LOW',
      },
      // ULTRA-DISTANT DEEP-SPACE WORLDS (REACHABLE WITH HYPER-CRUISE [H] & MAXED ENGINES!)
      {
        id: 'deep-hyperion-ix',
        name: 'HYPERION-IX (50 km)',
        type: 'planet',
        position: [12000, 1400, -48500],
        radius: 420,
        color: '#059669',
        secondaryColor: '#34d399',
        atmosphereColor: '#6ee7b7',
        planetStyle: 'oceanic',
        hasRings: true,
        ringColor: '#fcd34d',
        description: 'Emerald super-Earth 50,000m beyond Solaris core with twin golden dust rings.',
        classification: 'DEEP-SPACE SUPER-EARTH',
        scannable: true,
        landable: true,
        sampleName: 'Hyperion Emerald Flora',
        scienceValue: 12000,
        hazardLevel: 'LOW',
      },
      {
        id: 'deep-valhalla',
        name: 'VALHALLA FORGE (250 km)',
        type: 'planet',
        position: [-85000, 6000, -235000],
        radius: 620,
        color: '#991b1b',
        secondaryColor: '#f97316',
        atmosphereColor: '#fb923c',
        planetStyle: 'volcanic',
        hasRings: true,
        ringColor: '#f59e0b',
        description: 'Colossal molten forge world 250,000m out in the outer rim.',
        classification: 'MOLTEN TITAN WORLD',
        scannable: true,
        sampleName: 'Valhalla Neutronium Slag',
        scienceValue: 25000,
        hazardLevel: 'HIGH',
      },
      {
        id: 'deep-astralis',
        name: 'ASTRALIS PRIME (1M m)',
        type: 'planet',
        position: [260000, -45000, -965000],
        radius: 950,
        color: '#4c1d95',
        secondaryColor: '#c084fc',
        atmosphereColor: '#a855f7',
        planetStyle: 'cryogenic',
        hasRings: true,
        ringColor: '#e879f9',
        description: 'Crystalline violet ice giant located 1,000,000 meters from Solaris origin.',
        classification: 'CRYSTALLINE GIANT',
        scannable: true,
        landable: true,
        sampleName: 'Astralis Violet Diamond',
        scienceValue: 50000,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'deep-chronos',
        name: 'CHRONOS TITAN (5M m)',
        type: 'planet',
        position: [-1400000, 220000, -4800000],
        radius: 1600,
        color: '#b45309',
        secondaryColor: '#fde68a',
        atmosphereColor: '#fbbf24',
        planetStyle: 'gas',
        hasRings: true,
        ringColor: '#fef08a',
        description: 'Ancient golden gas titan 5,000,000m deep in uncharted space.',
        classification: 'GOLDEN GAS TITAN',
        scannable: true,
        sampleName: 'Chronos Golden Aerosol',
        scienceValue: 100000,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'deep-elysium',
        name: 'ELYSIUM EXODUS (12M m)',
        type: 'planet',
        position: [3500000, -600000, -11450000],
        radius: 2200,
        color: '#0e7490',
        secondaryColor: '#2dd4bf',
        atmosphereColor: '#00e5ff',
        planetStyle: 'oceanic',
        hasRings: true,
        ringColor: '#67e8f9',
        description: 'Mythical turquoise paradise world 12,000,000m out in the deep void.',
        classification: 'MYTHIC EXODUS WORLD',
        scannable: true,
        landable: true,
        sampleName: 'Elysium Living Crystal',
        scienceValue: 250000,
        hazardLevel: 'LOW',
      },
      {
        id: 'deep-oblivion',
        name: 'OBLIVION HORIZON (25M m)',
        type: 'planet',
        position: [-6500000, 1200000, -24100000],
        radius: 3400,
        color: '#3b0764',
        secondaryColor: '#ec4899',
        atmosphereColor: '#f43f5e',
        planetStyle: 'volcanic',
        hasRings: true,
        ringColor: '#ec4899',
        description: 'Colossal abyssal singularity world 25,000,000 meters from Earth. Only Hyper-Cruise ships can reach it.',
        classification: 'SINGULARITY WORLD',
        scannable: true,
        sampleName: 'Oblivion Dark-Matter Core',
        scienceValue: 500000,
        hazardLevel: 'EXTREME',
      },
      {
        id: 'deep-celestia',
        name: 'CELESTIA OMEGA (50M m)',
        type: 'planet',
        position: [12000000, -2500000, -48500000],
        radius: 4800,
        color: '#e0f2fe',
        secondaryColor: '#38bdf8',
        atmosphereColor: '#ffffff',
        planetStyle: 'cryogenic',
        hasRings: true,
        ringColor: '#bae6fd',
        description: 'Radiant diamond-white star-touched superworld at 50,000,000 meters.',
        classification: 'DIAMOND SUPERWORLD',
        scannable: true,
        landable: true,
        sampleName: 'Celestia Star-Diamond',
        scienceValue: 1000000,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'deep-creation',
        name: 'EDGE OF CREATION (100M m)',
        type: 'planet',
        position: [0, 4000000, -99900000],
        radius: 7500,
        color: '#f59e0b',
        secondaryColor: '#00e5ff',
        atmosphereColor: '#fde047',
        planetStyle: 'gas',
        hasRings: true,
        ringColor: '#00e5ff',
        description: 'Legendary golden-cyan mythic world standing 100,000,000 meters out at the edge of the cosmos.',
        classification: 'COSMIC ENDGAME WORLD',
        scannable: true,
        sampleName: 'Genesis Zero-Point Shard',
        scienceValue: 5000000,
        hazardLevel: 'EXTREME',
      },
    ],
    npcs: [
      {
        id: 'npc-patrol-01',
        name: 'UEF CORVETTE HALCYON',
        callsign: 'HLC-04',
        role: 'ORBITAL PATROL',
        orbitCenter: [95, 18, -240],
        orbitRadius: 95,
        orbitSpeed: 0.12,
        orbitInclination: 0.18,
        initialPhase: 0.4,
        color: '#38bdf8',
      },
      {
        id: 'npc-freighter-02',
        name: 'CARGO HAULER BOREALIS',
        callsign: 'BRS-19',
        role: 'LOGISTICS FREIGHTER',
        orbitCenter: [210, -10, -450],
        orbitRadius: 180,
        orbitSpeed: 0.06,
        orbitInclination: -0.1,
        initialPhase: 2.3,
        color: '#22d3ee',
      },
    ],
    asteroids: generateAsteroids(101, 'sol', [-260, 30, -390], 36, 175),
    hazards: [
      {
        id: 'hz-sol-rad',
        name: 'CINDER RADIATION POCKET',
        type: 'RADIATION',
        position: [-360, 35, -480],
        radius: 110,
        intensity: 0.9,
        color: '#f59e0b',
        description: 'Elevated gamma radiation from decaying isotopes in the Cinder Belt.',
      },
    ],
  },
  {
    id: 'vela-nebula',
    name: 'VELA NEBULA',
    sectorCode: 'SEC-04 // RIM',
    starClass: 'B1V BLUE GIANT',
    starColor: '#bae6fd',
    starEmissive: '#38bdf8',
    nebulaColor: '#0e1b3d',
    galaxyPos: [2.8, 0.9, -1.6],
    connections: ['solaris-prime', 'nyx-abyss'],
    description:
      'Ionized blue-violet dust cloud surrounding a luminous B-type giant. Dense nebula interference and cryogenic mineral belts.',
    objects: [
      {
        id: 'vela-star',
        name: 'VELA MAJORIS',
        type: 'star',
        position: [900, 220, -1350],
        radius: 195,
        color: '#7dd3fc',
        description: 'Intense blue-white supergiant bathing the nebula in Cherenkov radiation.',
        classification: 'B1V GIANT',
        hazardLevel: 'EXTREME',
      },
      {
        id: 'cryos-prime',
        name: 'CRYOS PRIME',
        type: 'planet',
        position: [-240, -30, -560],
        radius: 82,
        color: '#93c5fd',
        secondaryColor: '#e0f2fe',
        atmosphereColor: '#60a5fa',
        planetStyle: 'cryogenic',
        hasRings: true,
        ringColor: '#bae6fd',
        description: 'Sub-zero cryogenic ice world with subsurface geothermal oceans and polar research pads.',
        classification: 'CRYOGENIC WORLD',
        scannable: true,
        landable: true,
        sampleName: 'Sub-Glacial Cryo-Sample',
        scienceValue: 480,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'helios-outpost',
        name: 'HELIOS MINING OUTPOST',
        type: 'station',
        position: [130, 12, -290],
        radius: 24,
        color: '#34d399',
        description: 'Frontier deuterium extraction platform. Trades refined deuterium and pays top credits for cryo-meds.',
        classification: 'INDUSTRIAL OUTPOST',
        dockable: true,
        scannable: true,
        hazardLevel: 'LOW',
      },
      {
        id: 'derelict-orion',
        name: 'ABANDONED SURVEYOR ORION-6',
        type: 'derelict',
        position: [-75, 45, -340],
        radius: 18,
        color: '#f97316',
        description: 'Powerless deep-space research hulk drifting in the nebula. Black box transponder still pulsing.',
        classification: 'ABANDONED SPACECRAFT',
        scannable: true,
        sampleName: 'Orion-6 Flight Core',
        scienceValue: 610,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'anomaly-07x',
        name: 'MONOLITH 07-X',
        type: 'anomaly',
        position: [360, 85, -620],
        radius: 18,
        color: '#a855f7',
        description: 'Unexplained gravimetric distortion emitting harmonic electromagnetic pulses.',
        classification: 'GRAVIMETRIC ANOMALY',
        scannable: true,
        sampleName: 'Graviton Resonance Log',
        scienceValue: 750,
        hazardLevel: 'HIGH',
      },
    ],
    npcs: [
      {
        id: 'npc-miner-01',
        name: 'EXCAVATOR RIG-7',
        callsign: 'XCV-07',
        role: 'DEUTERIUM HARVESTER',
        orbitCenter: [130, 12, -290],
        orbitRadius: 110,
        orbitSpeed: 0.09,
        orbitInclination: 0.25,
        initialPhase: 1.1,
        color: '#34d399',
      },
    ],
    asteroids: generateAsteroids(202, 'vel', [40, 10, -430], 42, 220),
    hazards: [
      {
        id: 'hz-vela-neb',
        name: 'VELA IONIZED CLOUD',
        type: 'NEBULA_INTERFERENCE',
        position: [180, 40, -480],
        radius: 170,
        intensity: 1.1,
        color: '#6366f1',
        description: 'Dense ionized dust causing sensor interference and reduced radar lock.',
      },
    ],
  },
  {
    id: 'kepler-reach',
    name: 'KEPLER REACH',
    sectorCode: 'SEC-07 // FRONTIER',
    starClass: 'K4V AMBER DWARF',
    starColor: '#fed7aa',
    starEmissive: '#f97316',
    nebulaColor: '#24110b',
    galaxyPos: [-2.6, -0.7, -1.9],
    connections: ['solaris-prime', 'nyx-abyss'],
    description:
      'Harsh amber-lit frontier system scarred by solar flare storms. Contains the derelict science station SS-Meridian.',
    objects: [
      {
        id: 'kepler-star',
        name: 'KEPLER IGNIS',
        type: 'star',
        position: [-780, -140, -1300],
        radius: 155,
        color: '#fb923c',
        description: 'Flare-active K-type orange dwarf with elevated solar wind.',
        classification: 'K4V STAR',
        hazardLevel: 'EXTREME',
      },
      {
        id: 'pyros-world',
        name: 'PYROS IV',
        type: 'planet',
        position: [290, 45, -620],
        radius: 88,
        color: '#9a3412',
        secondaryColor: '#f97316',
        atmosphereColor: '#fb923c',
        planetStyle: 'volcanic',
        description: 'Tidally heated volcanic world with glowing magma rifts visible from high orbit.',
        classification: 'VOLCANIC TERRESTRIAL',
        scannable: true,
        sampleName: 'Obsidian Magma Isotope',
        scienceValue: 540,
        hazardLevel: 'HIGH',
      },
      {
        id: 'aegis-deep',
        name: 'AEGIS DEEP STATION',
        type: 'station',
        position: [-140, -15, -260],
        radius: 25,
        color: '#f59e0b',
        description: 'Armored frontier relay and emergency repair berth.',
        classification: 'FRONTIER RELAY',
        dockable: true,
        scannable: true,
        hazardLevel: 'LOW',
      },
      {
        id: 'ss-meridian',
        name: 'ABANDONED STATION SS-MERIDIAN',
        type: 'derelict',
        position: [15, 70, -520],
        radius: 24,
        color: '#ef4444',
        description: 'Decommissioned deep-space science platform drifting without power. Emergency transponder still active.',
        classification: 'DERELICT STATION',
        scannable: true,
        sampleName: 'Meridian Research Vault',
        scienceValue: 820,
        hazardLevel: 'HIGH',
      },
    ],
    npcs: [
      {
        id: 'npc-recon-03',
        name: 'RECON DRONE VALKYRIE',
        callsign: 'VLK-9',
        role: 'AUTOMATED SCOUT',
        orbitCenter: [15, 70, -520],
        orbitRadius: 85,
        orbitSpeed: 0.16,
        orbitInclination: -0.35,
        initialPhase: 3.8,
        color: '#fb923c',
      },
    ],
    asteroids: generateAsteroids(303, 'kep', [10, 40, -490], 38, 200),
    hazards: [
      {
        id: 'hz-kep-solar',
        name: 'IGNIS SOLAR FLARE STREAM',
        type: 'SOLAR_FLARE',
        position: [-190, 20, -540],
        radius: 155,
        intensity: 1.25,
        color: '#f97316',
        description: 'Coronal mass ejection stream causing elevated hull thermal load.',
      },
    ],
  },
  {
    id: 'nyx-abyss',
    name: 'NYX ABYSS',
    sectorCode: 'SEC-99 // UNCHARTED',
    starClass: 'PSR MILLISECOND PULSAR',
    starColor: '#e0e7ff',
    starEmissive: '#6366f1',
    nebulaColor: '#120826',
    galaxyPos: [0.3, 1.4, -4.1],
    connections: ['vela-nebula', 'kepler-reach'],
    description:
      'Uncharted deep-void sector anchored by a rapidly spinning pulsar, unstable gravity wells, and the ancient Obsidian Gate.',
    objects: [
      {
        id: 'nyx-pulsar',
        name: 'NYX PULSAR',
        type: 'star',
        position: [0, 260, -1500],
        radius: 110,
        color: '#a5b4fc',
        description: 'Magnetized neutron remnant emitting relativistic polar jets.',
        classification: 'NEUTRON PULSAR',
        hazardLevel: 'EXTREME',
      },
      {
        id: 'umbra-giant',
        name: 'UMBRA IX',
        type: 'planet',
        position: [-340, -65, -580],
        radius: 115,
        color: '#312e81',
        secondaryColor: '#6366f1',
        atmosphereColor: '#818cf8',
        planetStyle: 'gas',
        hasRings: true,
        ringColor: '#a5b4fc',
        description: 'Colossal ringed gas giant shrouded in dark methane storms.',
        classification: 'RINGED GAS GIANT',
        scannable: true,
        sampleName: 'Hyper-Dense Methane Aerosol',
        scienceValue: 690,
        hazardLevel: 'MODERATE',
      },
      {
        id: 'obsidian-gate',
        name: 'THE OBSIDIAN GATE',
        type: 'anomaly',
        position: [85, 25, -440],
        radius: 32,
        color: '#00e5ff',
        description: 'Ancient non-human ring megastructure resonating with zero-point quantum harmonics.',
        classification: 'XENO MEGASTRUCTURE',
        scannable: true,
        sampleName: 'Zero-Point Harmonic Artifact',
        scienceValue: 1500,
        hazardLevel: 'EXTREME',
      },
    ],
    npcs: [
      {
        id: 'npc-probe-99',
        name: 'DEEP VOID PROBE OMEGA',
        callsign: 'OMG-01',
        role: 'AUTONOMOUS SURVEYOR',
        orbitCenter: [85, 25, -440],
        orbitRadius: 120,
        orbitSpeed: 0.14,
        orbitInclination: 0.4,
        initialPhase: 0.2,
        color: '#818cf8',
      },
    ],
    asteroids: generateAsteroids(404, 'nyx', [85, 25, -440], 30, 240),
    hazards: [
      {
        id: 'hz-nyx-grav',
        name: 'VOID GRAVITY SHEAR',
        type: 'GRAVITY_WELL',
        position: [85, 25, -440],
        radius: 145,
        intensity: 1.35,
        color: '#818cf8',
        description: 'Unstable gravitational eddy exerting continuous pull toward the Obsidian Gate.',
      },
    ],
  },
];

export function getStarSystem(id: string): StarSystem {
  return STAR_SYSTEMS.find((s) => s.id === id) || STAR_SYSTEMS[0];
}

export function getNpcPosition(npc: NpcShipDef, simTime: number): [number, number, number] {
  const angle = npc.initialPhase + simTime * npc.orbitSpeed;
  const x = npc.orbitCenter[0] + Math.cos(angle) * npc.orbitRadius;
  const y = npc.orbitCenter[1] + Math.sin(angle * 1.2) * npc.orbitRadius * npc.orbitInclination;
  const z = npc.orbitCenter[2] + Math.sin(angle) * npc.orbitRadius;
  return [x, y, z];
}

export function calculateJumpFuel(fromId: string, toId: string): number {
  const a = getStarSystem(fromId);
  const b = getStarSystem(toId);
  const dx = a.galaxyPos[0] - b.galaxyPos[0];
  const dy = a.galaxyPos[1] - b.galaxyPos[1];
  const dz = a.galaxyPos[2] - b.galaxyPos[2];
  const dist = Math.hypot(dx, dy, dz);
  return Math.max(12, Math.round(dist * 7.5));
}
