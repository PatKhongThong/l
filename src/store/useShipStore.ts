import { create } from 'zustand';
import { INITIAL_CREW, CrewMember } from '../data/crew';
import {
  ActiveEmergency,
  EMERGENCY_TEMPLATES,
  ResolvedEmergencyRecord,
} from '../data/emergencies';
import { generateDynamicMission, INITIAL_MISSIONS, Mission } from '../data/missions';
import { calculateJumpFuel, getStarSystem, HazardZone } from '../data/starSystems';
import { starshipAudio } from '../utils/audio';
import { FleetChatMessage, multiplayerClient, MultiplayerJob, RemotePlayer } from '../utils/multiplayer';

export type CameraMode = 'cockpit' | 'external';
export type PlayerMode =
  | 'flight'
  | 'interior'
  | 'eva'
  | 'earth_cutscene'
  | 'earth_surface'
  | 'earth_liftoff'
  | 'escape_pod';

export interface ExplosionFx {
  id: string;
  position: [number, number, number];
  createdAt: number;
  scale: number;
}

export const SPACE_RACE_GATES: Array<[number, number, number]> = [
  [0, 14, -75],
  [55, 28, -165],
  [125, 16, -260],
  [75, -8, -365],
  [-45, 22, -310],
  [-15, 14, -140],
];

export interface EngineModelDef {
  id:
    | 'standard-ion'
    | 'vanguard-fusion'
    | 'valkyrie-afterburner'
    | 'aether-quantum'
    | 'nova-antimatter'
    | 'singularity-warp';
  name: string;
  description: string;
  cost: number;
  speedMult: number;
  fuelMult: number;
  heatMult: number;
  flameColor: string;
}

export const ENGINE_MODELS: EngineModelDef[] = [
  {
    id: 'standard-ion',
    name: 'MK-I STANDARD ION DRIVE',
    description: 'Factory-issued Terran ion thrusters with balanced efficiency and cyan exhaust.',
    cost: 0,
    speedMult: 1.0,
    fuelMult: 1.0,
    heatMult: 1.0,
    flameColor: '#00e5ff',
  },
  {
    id: 'vanguard-fusion',
    name: 'VANGUARD FUSION THRUSTER',
    description: 'Heavy military plasma nozzles delivering +28% speed with electric-blue plumes.',
    cost: 1800,
    speedMult: 1.28,
    fuelMult: 1.08,
    heatMult: 1.15,
    flameColor: '#3b82f6',
  },
  {
    id: 'valkyrie-afterburner',
    name: 'VALKYRIE AFTERBURNER CORES',
    description: 'Extreme +48% thrust & boost power with blazing amber-gold plasma plumes.',
    cost: 3400,
    speedMult: 1.48,
    fuelMult: 1.25,
    heatMult: 1.32,
    flameColor: '#f59e0b',
  },
  {
    id: 'aether-quantum',
    name: 'AETHER QUANTUM MAGNETO-DRIVE',
    description: 'Cutting-edge +38% speed with -30% fuel burn, -25% heat, and violet plasma.',
    cost: 5200,
    speedMult: 1.38,
    fuelMult: 0.7,
    heatMult: 0.75,
    flameColor: '#a855f7',
  },
  {
    id: 'nova-antimatter',
    name: 'NOVA ANTIMATTER DRIVE',
    description: 'Experimental antimatter injector delivering ×2.20 SUPER-SPEED with crimson-magenta plumes!',
    cost: 28000,
    speedMult: 2.2,
    fuelMult: 0.9,
    heatMult: 1.1,
    flameColor: '#ec4899',
  },
  {
    id: 'singularity-warp',
    name: 'SINGULARITY WARP-CORE THRUSTER',
    description: 'Apex ×3.40 HYPER-VELOCITY propulsion with blinding white-cyan plumes and -40% fuel burn!',
    cost: 85000,
    speedMult: 3.4,
    fuelMult: 0.6,
    heatMult: 0.65,
    flameColor: '#e0f2fe',
  },
];

export interface EngineConfig {
  thrustBias: number; // 0..100 (agility vs top speed)
  fuelMix: number; // 0..100 (eco vs power)
  coolantFlow: number; // 0..100 (conserve vs high-flow cooling)
  sensorGain: number; // 0..100 (scan range)
}

export type RoofPartId = 'stock' | 'panoramic-dome' | 'command-bridge-deck' | 'solar-wing-roof';
export type AeroPartId = 'stock' | 'forward-canards' | 'twin-winglet-fins' | 'hypersonic-swept';
export type NosePartId = 'stock' | 'needle-lance' | 'heavy-ram-prow';
export type BoosterPartId = 'stock' | 'wing-turbo-jets' | 'antimatter-nitro' | 'apex-quad-rings';

export interface PlanetaryFactory {
  id: 'deuterium-refinery' | 'titanium-foundry' | 'quantum-fab' | 'ordnance-assembly';
  name: string;
  productLabel: string;
  level: number; // 0 = unbuilt, 1..5
  workers: number;
  buildCost: number;
  storedUnits: number;
  accentColor: string;
}

const INITIAL_FACTORIES: PlanetaryFactory[] = [
  {
    id: 'deuterium-refinery',
    name: 'DEUTERIUM REFINERY PLANT',
    productLabel: 'Deuterium Cores & Fuel',
    level: 1,
    workers: 1,
    buildCost: 4500,
    storedUnits: 2,
    accentColor: '#f59e0b',
  },
  {
    id: 'titanium-foundry',
    name: 'TITANIUM ALLOY FOUNDRY',
    productLabel: 'Titanium Alloy (+180 CR/unit)',
    level: 0,
    workers: 0,
    buildCost: 6000,
    storedUnits: 0,
    accentColor: '#38bdf8',
  },
  {
    id: 'quantum-fab',
    name: 'QUANTUM RELAY CHIP FAB',
    productLabel: 'Quantum Relays (+650 CR/unit)',
    level: 0,
    workers: 0,
    buildCost: 14000,
    storedUnits: 0,
    accentColor: '#a855f7',
  },
  {
    id: 'ordnance-assembly',
    name: 'DRONE & TORPEDO ASSEMBLY',
    productLabel: 'Torpedoes & Boost Cells',
    level: 0,
    workers: 0,
    buildCost: 18000,
    storedUnits: 0,
    accentColor: '#10b981',
  },
];

export interface ShipPartDef {
  id: string;
  slot: 'roof' | 'aero' | 'nose' | 'booster';
  name: string;
  description: string;
  perk: string;
  cost: number;
}

export interface XenoModDef {
  id: 'zero-mass-chassis' | 'quantum-slipstream' | 'xeno-overcharger';
  name: string;
  description: string;
  perk: string;
  cost: number;
}

export const XENO_BLACK_MARKET_MODS: XenoModDef[] = [
  {
    id: 'zero-mass-chassis',
    name: 'ZERO-MASS CARBON CHASSIS',
    description: 'Replaces internal frame with metamaterial lattice for insane acceleration & snap turns.',
    perk: '+45% ACCEL & +40% TURN',
    cost: 35000,
  },
  {
    id: 'quantum-slipstream',
    name: 'QUANTUM SLIPSTREAM FIELD',
    description: 'Warps local spacetime around the hull to eliminate speed caps & boost heat.',
    perk: '+80% MAX SPEED & COOL BOOST',
    cost: 95000,
  },
  {
    id: 'xeno-overcharger',
    name: 'XENO-PLASMA OVERCHARGER',
    description: 'Alien capacitor matrix tripling weapon power & expanding torpedo bay to 25 rounds.',
    perk: '3x CANNON DMG & +25 TORPS',
    cost: 150000,
  },
];

export const EARTH_SHOP_PARTS: ShipPartDef[] = [
  // ROOF PARTS
  { id: 'stock', slot: 'roof', name: 'STANDARD FLUSH ROOF', description: 'Factory armored dorsal hull plating.', perk: 'BALANCED', cost: 0 },
  { id: 'panoramic-dome', slot: 'roof', name: 'PANORAMIC GLASS SKY-ROOF', description: 'Full-length sapphire observation glass canopy over the dorsal deck.', perk: '+10% SCANNER LOCK', cost: 4500 },
  { id: 'command-bridge-deck', slot: 'roof', name: 'ELEVATED COMMAND TOWER', description: 'Armored raised fleet bridge superstructure with tactical sensor mast.', perk: '+15% SHIELD REGEN', cost: 9500 },
  { id: 'solar-wing-roof', slot: 'roof', name: 'SOLAR COLLECTOR ROOF ARRAY', description: 'Dorsal photovoltaic array wings that trickle-charge fuel & backup battery.', perk: 'PASSIVE FUEL + BATT', cost: 14000 },

  // AERODYNAMIC PARTS
  { id: 'stock', slot: 'aero', name: 'STANDARD DELTA WINGS', description: 'Baseline atmospheric and orbital delta wing configuration.', perk: 'BALANCED', cost: 0 },
  { id: 'forward-canards', slot: 'aero', name: 'STEALTH FORWARD CANARDS', description: 'Swept nose aerodynamic canards for razor-sharp pitch & yaw response.', perk: '+25% TURN AGILITY', cost: 5500 },
  { id: 'twin-winglet-fins', slot: 'aero', name: 'RAZOR AERO-WINGLETS', description: 'Extended carbon-titanium wingtips and vertical aero stabilizers.', perk: '+20% SPEED / +30% ROLL', cost: 11000 },
  { id: 'hypersonic-swept', slot: 'aero', name: 'HYPERSONIC SWEPT WINGS', description: 'Elongated cyan-trimmed hypersonic wings built for extreme velocity.', perk: '+35% TOP SPEED', cost: 22000 },

  // NOSE / PROW PARTS
  { id: 'stock', slot: 'nose', name: 'STANDARD BOW CONE', description: 'Standard angular titanium bow fairing.', perk: 'BALANCED', cost: 0 },
  { id: 'needle-lance', slot: 'nose', name: 'HYPERSONIC NEEDLE LANCE', description: 'Extended low-drag shock-cone nose lance for high-speed flight.', perk: '+15% MAX SPEED', cost: 6500 },
  { id: 'heavy-ram-prow', slot: 'nose', name: 'TITANIUM RAM PROW', description: 'Reinforced heavy industrial prow bumpers for asteroid belt runs.', perk: '-30% COLLISION DMG', cost: 12500 },

  // HYPER-THRUST BOOSTER PODS (TURBO LAB)
  { id: 'stock', slot: 'booster', name: 'NO AUXILIARY BOOSTERS', description: 'Standard twin nacelle exhaust layout.', perk: 'STANDARD', cost: 0 },
  { id: 'wing-turbo-jets', slot: 'booster', name: 'QUAD WING TURBO JETS', description: 'Bolts twin under-wing plasma turbine pods onto your delta wings.', perk: '+40% TOP SPEED', cost: 18000 },
  { id: 'antimatter-nitro', slot: 'booster', name: 'TWIN ANTIMATTER NITRO TANKS', description: 'Pressurized dorsal-aft magenta nitro thruster canisters.', perk: '+75% SPEED / +60% BOOST', cost: 45000 },
  { id: 'apex-quad-rings', slot: 'booster', name: 'APEX HYPER-THRUST QUAD-RINGS', description: 'Colossal glowing magnetic accelerator rings for blistering super-speed!', perk: '+125% TOP SPEED!', cost: 120000 },
];
export type StationView =
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
  | 'upgrades'
  | 'multiplayer'
  | 'galactic';

export type ShipClassId = 'corvette' | 'interceptor' | 'freighter' | 'dreadnought';
export type EarthWeatherMode = 'day' | 'sunset' | 'night' | 'storm';
export type HudThemeId = 'cyan' | 'emerald' | 'amber' | 'violet' | 'crimson';

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  owned: number;
}

export interface DeployedSatellite {
  id: string;
  systemId: string;
  position: [number, number, number];
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  reward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ach-earth', title: 'HOMEWORLD TOUCHDOWN', desc: 'Land on Earth at New Geneva Spaceport.', reward: 1500 },
  { id: 'ach-mach', title: 'MACH BREAKER', desc: 'Exceed 400 m/s in sub-light flight.', reward: 3000 },
  { id: 'ach-hypersonic', title: 'LIGHTSPEED DEMON', desc: 'Exceed 900 m/s with hyper-thrusters!', reward: 8000 },
  { id: 'ach-miner', title: 'BELT PROSPECTOR', desc: 'Mine 3 asteroids with the Mining Laser.', reward: 2000 },
  { id: 'ach-raider', title: 'RAIDER ACE', desc: 'Destroy 2 hostile Raider Drones.', reward: 3500 },
  { id: 'ach-boss', title: 'LEVIATHAN SLAYER', desc: 'Destroy the Leviathan Dreadnought Boss.', reward: 15000 },
  { id: 'ach-factory', title: 'INDUSTRIAL MOGUL', desc: 'Own 2+ active Earth factories.', reward: 5000 },
  { id: 'ach-rich', title: 'GALACTIC MILLIONAIRE', desc: 'Hold 1,000,000+ CR in your treasury.', reward: 10000 },
  { id: 'ach-sat', title: 'ORBITAL ARCHITECT', desc: 'Deploy a Deep-Space Recon Satellite.', reward: 2500 },
  { id: 'ach-emp', title: 'EMP WARFARE', desc: 'Fire an EMP Shockwave Pulse.', reward: 2000 },
  { id: 'ach-stock', title: 'WALL STREET IN SPACE', desc: 'Buy shares on the Galactic Stock Market.', reward: 2000 },
  { id: 'ach-xeno', title: 'XENO ENGINEER', desc: 'Install an exotic Xeno Black-Market Mod.', reward: 5000 },
];

export const SHIP_CLASSES: Array<{
  id: ShipClassId;
  name: string;
  perk: string;
  cost: number;
  speedMult: number;
  hullMult: number;
  shieldMult: number;
  dmgMult: number;
}> = [
  { id: 'corvette', name: 'HYPERION CORVETTE', perk: 'Balanced All-Rounder', cost: 0, speedMult: 1.0, hullMult: 1.0, shieldMult: 1.0, dmgMult: 1.0 },
  { id: 'interceptor', name: 'STARFIRE INTERCEPTOR', perk: '+35% Speed & Turn Agility', cost: 24000, speedMult: 1.35, hullMult: 0.85, shieldMult: 0.95, dmgMult: 1.1 },
  { id: 'freighter', name: 'TITAN HEAVY FREIGHTER', perk: '+40% Armor & 2x Factory Storage', cost: 32000, speedMult: 0.9, hullMult: 1.4, shieldMult: 1.25, dmgMult: 1.0 },
  { id: 'dreadnought', name: 'VALKYRIE DREADNOUGHT', perk: '+60% Shields & 2x Weapon Power', cost: 65000, speedMult: 1.05, hullMult: 1.5, shieldMult: 1.6, dmgMult: 2.0 },
];

export interface RaiderDrone {
  id: string;
  name: string;
  systemId: string;
  orbitCenter: [number, number, number];
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
  hp: number;
  maxHp: number;
  bounty: number;
}

export interface NavWaypoint {
  id: string;
  name: string;
  systemId: string;
  position: [number, number, number];
}

export function getPilotRank(xp: number): string {
  if (xp >= 2800) return 'FLEET ADMIRAL';
  if (xp >= 1800) return 'CAPTAIN';
  if (xp >= 1000) return 'COMMANDER';
  if (xp >= 500) return 'LIEUTENANT';
  if (xp >= 200) return 'ENSIGN';
  return 'CADET';
}

const INITIAL_RAIDERS: RaiderDrone[] = [
  { id: 'rdr-sol-1', name: 'RAIDER VIPER-1', systemId: 'solaris-prime', orbitCenter: [-180, 28, -320], orbitRadius: 75, orbitSpeed: 0.28, phase: 0.4, hp: 100, maxHp: 100, bounty: 950 },
  { id: 'rdr-sol-2', name: 'RAIDER VIPER-2', systemId: 'solaris-prime', orbitCenter: [-260, 40, -390], orbitRadius: 90, orbitSpeed: 0.24, phase: 2.6, hp: 100, maxHp: 100, bounty: 1100 },
  { id: 'rdr-vel-1', name: 'VELA CORSAIR-7', systemId: 'vela-nebula', orbitCenter: [40, 20, -410], orbitRadius: 85, orbitSpeed: 0.3, phase: 1.2, hp: 120, maxHp: 120, bounty: 1450 },
  { id: 'rdr-kep-1', name: 'KEPLER MARAUDER', systemId: 'kepler-reach', orbitCenter: [15, 65, -480], orbitRadius: 95, orbitSpeed: 0.32, phase: 3.1, hp: 140, maxHp: 140, bounty: 1750 },
  { id: 'rdr-nyx-1', name: 'VOID SENTINEL', systemId: 'nyx-abyss', orbitCenter: [85, 25, -440], orbitRadius: 105, orbitSpeed: 0.35, phase: 0.8, hp: 180, maxHp: 180, bounty: 2400 },
];

export interface ShipUpgrades {
  engines: number; // 1..5 (+18% max speed/accel per level)
  boost: number; // 1..5 (+25% boost power & lower boost heat)
  fuelEfficiency: number; // 1..5 (-14% fuel consumption per level)
  cooling: number; // 1..5 (+22% passive cooling & higher overheat threshold)
  shields: number; // 1..5 (+22% shield recharge & absorption)
  hullArmor: number; // 1..5 (-15% hull damage taken)
  sensors: number; // 1..5 (+80m scan range & radar lock)
  warpCoils: number; // 1..5 (-15% jump fuel cost & faster warp)
}

export interface PowerAllocation {
  engines: number;
  shields: number;
  lifeSupport: number;
  sensors: number;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  level: 'info' | 'warn' | 'alert' | 'success';
}

export interface WarpState {
  active: boolean;
  progress: number;
  targetSystemId: string | null;
}

export interface ComponentIntegrity {
  engines: number;
  reactor: number;
  comms: number;
  sensors: number;
  hullPort: number;
  hullStarboard: number;
  lifeSupport: number;
  doors: number;
}

export interface MaintenanceRobot {
  id: string;
  name: string;
  status: 'DOCKED' | 'DISPATCHED';
  assignedRoomId: string;
  targetEmergencyUid: string | null;
  battery: number;
}

export interface ScienceDiscovery {
  id: string;
  objectId: string;
  name: string;
  systemName: string;
  classification: string;
  sampleName: string;
  radiationReading: string;
  discoveredAt: string;
  notes: string;
}

export interface CommMessage {
  id: string;
  sender: string;
  channel: string;
  time: string;
  body: string;
  unread?: boolean;
}

export interface BlackBoxEntry {
  time: string;
  sector: string;
  event: string;
  speed: number;
  hull: number;
}

export interface MaintenanceRecord {
  id: string;
  time: string;
  system: string;
  action: string;
  performedBy: string;
}

export interface ShipLivery {
  id: string;
  name: string;
  hullColor: string;
  accentColor: string;
}

export const SHIP_LIVERIES: ShipLivery[] = [
  { id: 'obsidian', name: 'STEALTH OBSIDIAN', hullColor: '#1a2436', accentColor: '#00e5ff' },
  { id: 'orbital-white', name: 'ORBITAL DIRECTORATE', hullColor: '#cbd5e1', accentColor: '#0284c7' },
  { id: 'vanguard', name: 'VANGUARD COBALT', hullColor: '#1e3a8a', accentColor: '#38bdf8' },
  { id: 'frontier', name: 'FRONTIER AMBER', hullColor: '#451a03', accentColor: '#f59e0b' },
  { id: 'crimson', name: 'CRIMSON RECON', hullColor: '#450a0a', accentColor: '#ef4444' },
];

export interface CargoHold {
  deuterium: number;
  cryoMeds: number;
  titanium: number;
  quantumRelays: number;
  xenoArtifacts: number;
}

const SAVE_KEY = 'starship_2_save_v2';

function formatTime() {
  return new Date().toTimeString().slice(0, 8);
}

export function getUpgradeCost(currentLevel: number): number {
  return 900 * currentLevel * currentLevel;
}

export interface ShipState {
  // Boot & Modes
  booted: boolean;
  playerMode: PlayerMode;
  activeView: StationView;
  cameraMode: CameraMode;
  audioMuted: boolean;
  radarRange: number;
  redAlert: boolean;

  // Ship Customization
  shipName: string;
  shipRegistry: string;
  liveryId: string;

  // Simulation time & rare emergency scheduler
  simTime: number;
  nextEmergencyCheck: number;

  // 6-DOF Flight Physics
  position: [number, number, number];
  velocity: [number, number, number];
  quaternion: [number, number, number, number];
  angularVelocity: [number, number, number];
  speed: number;
  throttle: number;
  boostActive: boolean;
  braking: boolean;
  flightAssist: boolean;
  autopilot: boolean;
  headlights: boolean;
  hyperCruise: boolean;

  // Interior & EVA State
  interiorRoomId: string;
  interiorPos: [number, number, number];
  interiorYaw: number;
  evaOxygen: number;
  evaTetherDistance: number;
  evaSuitLights: boolean;
  landedPlanetId: string | null;
  earthCutsceneProgress: number;
  installedEngineId: EngineModelDef['id'];
  ownedEngines: Array<EngineModelDef['id']>;
  engineConfig: EngineConfig;
  roofPart: RoofPartId;
  aeroPart: AeroPartId;
  nosePart: NosePartId;
  boosterPart: BoosterPartId;
  xenoMods: string[];
  underglowColor: string | null;
  ownedParts: string[];
  factories: PlanetaryFactory[];
  cargoBayLevel: number;
  roboticArmOverdrive: boolean;

  // STARSHIP 5.0 MEGA-FEATURES (22+ New Systems)
  shipClass: ShipClassId;
  ownedShipClasses: ShipClassId[];
  earthWeather: EarthWeatherMode;
  hudTheme: HudThemeId;
  pointDefenseOn: boolean;
  autoMinerOn: boolean;
  empPulse: number;
  empCooldown: number;
  microJumpCooldown: number;
  peakSpeed: number;
  deployedSatellites: DeployedSatellite[];
  stocks: StockTicker[];
  bankVault: number;
  unlockedAchievements: string[];
  bossActive: boolean;
  raceActive: boolean;
  raceGateIndex: number;
  raceTimer: number;
  bestRaceTime: number | null;
  combatWave: number;
  explosions: ExplosionFx[];

  // Fuel Bay, Coolant Bay, Combat & Upgrades
  deuteriumCores: number;
  coolantCanisters: number;
  boostCells: number;
  torpedoes: number;
  overdriveTimer: number;
  coolantReserve: number;
  miningLaserActive: number;
  cannonPulse: number;
  tractorPulse: number;
  cloakActive: boolean;
  spaceRadioOn: boolean;
  upgrades: ShipUpgrades;

  // Multiplayer, Raiders, Waypoints & Pilot Career
  mpConnected: boolean;
  mpRoom: string;
  mpCallsign: string;
  mpJob: MultiplayerJob;
  boardedHostId: string | null;
  remotePlayers: Record<string, RemotePlayer>;
  fleetChat: FleetChatMessage[];
  raiders: RaiderDrone[];
  waypoints: NavWaypoint[];
  xp: number;
  raidersDestroyed: number;
  asteroidsMined: number;

  // Navigation & World
  currentSystemId: string;
  selectedTargetId: string | null;
  plottedSystemId: string | null;
  discoveredSystems: string[];
  scannedObjects: string[];
  dockedStationId: string | null;
  activeHazard: HazardZone | null;
  warp: WarpState;

  // Advanced Engineering & Subsystems
  reactorThrottle: number;
  reactorOutput: number;
  backupGeneratorOnline: boolean;
  backupBattery: number;
  power: PowerAllocation;
  enginesOnline: boolean;
  shieldsOnline: boolean;
  lifeSupportOnline: boolean;
  internalGravityOnline: boolean;
  commsOnline: boolean;
  navComputerOnline: boolean;
  waterRecyclingOnline: boolean;
  airFiltrationOnline: boolean;
  coolantCooldown: number;
  repairActive: boolean;
  scanPulse: number;

  // Ship Condition & Physical Component Damage
  hull: number;
  shields: number;
  fuel: number;
  oxygen: number;
  temperature: number;
  engineHealth: number;
  shieldImpactFlash: number;
  hullDamageFlash: number;
  components: ComponentIntegrity;

  // Emergencies & Robots
  activeEmergencies: ActiveEmergency[];
  emergencyHistory: ResolvedEmergencyRecord[];
  robots: MaintenanceRobot[];

  // Crew
  crew: CrewMember[];

  // Science, Comms, Security, Cargo, Black Box, Maintenance
  discoveries: ScienceDiscovery[];
  commsInbox: CommMessage[];
  lockedRooms: string[];
  escapePodsArmed: boolean;
  openPodIndex: number | null;
  cargo: CargoHold;
  blackBox: BlackBoxEntry[];
  maintenanceHistory: MaintenanceRecord[];

  // Missions & Progression
  missions: Mission[];
  activeMissionId: string;
  credits: number;
  logs: LogEntry[];

  // Actions
  finishBoot: () => void;
  setPlayerMode: (mode: PlayerMode) => void;
  setInteriorRoom: (roomId: string) => void;
  setActiveView: (view: StationView) => void;
  toggleCamera: () => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleAudio: () => void;
  cycleRadarRange: () => void;
  toggleRedAlert: () => void;

  setThrottle: (val: number) => void;
  toggleFlightAssist: () => void;
  toggleAutopilot: () => void;
  toggleHeadlights: () => void;
  toggleHyperCruise: () => void;
  toggleSystem: (
    sys:
      | 'enginesOnline'
      | 'shieldsOnline'
      | 'lifeSupportOnline'
      | 'internalGravityOnline'
      | 'commsOnline'
      | 'navComputerOnline'
      | 'waterRecyclingOnline'
      | 'airFiltrationOnline'
      | 'backupGeneratorOnline'
  ) => void;
  setReactorThrottle: (val: number) => void;
  setPowerAllocation: (key: keyof PowerAllocation, value: number) => void;
  applyPowerPreset: (preset: 'balanced' | 'thrust' | 'tactical' | 'stealth') => void;
  triggerCoolantFlush: () => void;
  toggleRepair: () => void;

  // Fuel Bay / Coolant Bay / Upgrade Bay actions
  loadDeuteriumCore: () => void;
  refineCargoToCore: () => void;
  loadCoolantCanister: () => void;
  activateBoostCell: () => void;
  fireMiningLaser: () => void;
  firePulseCannon: () => void;
  fireTorpedo: () => void;
  activateTractorBeam: () => void;
  toggleCloak: () => void;
  triggerShieldCapacitor: () => void;
  toggleSpaceRadio: () => void;
  dropWaypoint: () => void;
  connectMultiplayer: (room: string, callsign: string, wsUrl?: string) => void;
  disconnectMultiplayer: () => void;
  boardPlayerShip: (hostId: string) => void;
  leaveBoardedShip: () => void;
  setMpJob: (job: MultiplayerJob) => void;
  sendFleetChat: (text: string) => void;
  buySupply: (type: 'deuteriumCores' | 'coolantCanisters' | 'boostCells' | 'torpedoes', price: number) => void;
  purchaseUpgrade: (key: keyof ShipUpgrades) => void;
  replaceModuleOnEarth: (
    module: 'engines' | 'sensors' | 'cooling' | 'reactor' | 'comms' | 'hull',
    cost: number
  ) => void;

  // Navigation / Docking / Landing / Scan
  selectTarget: (id: string | null) => void;
  plotSystemRoute: (systemId: string | null) => void;
  initiateWarp: (targetSystemId: string) => void;
  triggerDeepScan: () => void;
  attemptDock: () => void;
  undock: () => void;
  attemptPlanetaryLanding: () => void;
  launchFromPlanet: () => void;
  launchFromEarth: () => void;
  installEngineModel: (id: EngineModelDef['id']) => void;
  setEngineConfig: (patch: Partial<EngineConfig>) => void;
  buyOrEquipEarthPart: (slot: 'roof' | 'aero' | 'nose' | 'booster', id: string) => void;
  buyXenoMod: (id: XenoModDef['id']) => void;
  buyBulkSupplies: () => void;
  setUnderglowColor: (color: string | null, cost?: number) => void;
  upgradeFactory: (id: PlanetaryFactory['id']) => void;
  hireFactoryWorker: (id: PlanetaryFactory['id']) => void;
  collectFactoryOutput: (id: PlanetaryFactory['id']) => void;
  toggleRoboticArmOverdrive: () => void;
  upgradeCargoBays: () => void;
  tickFactories: (dt: number) => void;

  // STARSHIP 5.0 Actions
  setEarthWeather: (w: EarthWeatherMode) => void;
  setHudTheme: (t: HudThemeId) => void;
  buyOrSelectShipClass: (id: ShipClassId) => void;
  fireEmpShockwave: () => void;
  triggerMicroJump: () => void;
  togglePointDefense: () => void;
  toggleAutoMiner: () => void;
  deployReconSatellite: () => void;
  summonLeviathanBoss: () => void;
  tradeStock: (symbol: string, qty: number) => void;
  tickStockMarket: () => void;
  bankTransfer: (amount: number) => void;
  hostHoloDeckParty: () => void;
  triggerFireSuppression: () => void;
  checkAchievements: () => void;
  startSpaceRace: () => void;
  advanceRaceGate: () => void;
  startCombatWave: () => void;
  sendFleetCredits: (peerCallsign: string, amount: number) => void;
  sendSquadPing: () => void;
  emergencyRefuelScoop: () => void;

  // Emergencies & Damage & EVA Repair
  triggerRandomEmergency: (force?: boolean) => void;
  diagnoseEmergency: (uid: string) => void;
  isolateEmergency: (uid: string) => void;
  engageBackupForEmergency: (uid: string) => void;
  dispatchRobotToEmergency: (uid: string) => void;
  manualRepairEmergency: (uid: string) => void;
  evaWeldComponent: (comp: keyof ComponentIntegrity) => void;

  // Crew & Medical
  assignCrewToRoom: (crewId: string, roomId: string, task: string) => void;
  restCrewMember: (crewId: string) => void;
  treatCrewMember: (crewId: string) => void;

  // Security / Comms / Cargo / Customization / Missions / Save
  toggleRoomLock: (roomId: string) => void;
  toggleEscapePods: () => void;
  togglePodLid: (idx: number) => void;
  launchEscapePod: (idx: number) => void;
  recoverFromEscapePod: () => void;
  sendCommHail: (recipient: string) => void;
  tradeCargo: (item: keyof CargoHold, delta: number, unitPrice: number) => void;
  setShipCustomization: (name: string, liveryId: string) => void;
  setActiveMission: (id: string) => void;
  generateNewMission: () => void;
  runFullDiagnostic: () => string;
  addLog: (message: string, level?: LogEntry['level']) => void;
  recordBlackBox: (event: string) => void;
  addMaintenanceRecord: (system: string, action: string, performedBy: string) => void;
  saveGame: (silent?: boolean) => void;
  loadGame: (silent?: boolean) => boolean;
  clearSavedGame: () => void;
  resetShip: () => void;
  applyTick: (partial: Partial<ShipState>) => void;
}

export const useShipStore = create<ShipState>((set, get) => ({
  booted: false,
  playerMode: 'flight',
  activeView: 'bridge',
  cameraMode: 'cockpit',
  audioMuted: false,
  radarRange: 900,
  redAlert: false,

  shipName: 'USS HYPERION',
  shipRegistry: 'NX-7420',
  liveryId: 'obsidian',

  simTime: 0,
  nextEmergencyCheck: 210,

  position: [0, 10, 40],
  velocity: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  angularVelocity: [0, 0, 0],
  speed: 0,
  throttle: 0,
  boostActive: false,
  braking: false,
  flightAssist: true,
  autopilot: false,
  headlights: true,
  hyperCruise: false,

  interiorRoomId: 'command-bridge',
  interiorPos: [0, 1.65, -12],
  interiorYaw: 0,
  evaOxygen: 100,
  evaTetherDistance: 0,
  evaSuitLights: true,
  landedPlanetId: null,
  earthCutsceneProgress: 0,
  installedEngineId: 'standard-ion',
  ownedEngines: ['standard-ion'],
  engineConfig: {
    thrustBias: 50,
    fuelMix: 50,
    coolantFlow: 50,
    sensorGain: 50,
  },
  roofPart: 'stock',
  aeroPart: 'stock',
  nosePart: 'stock',
  boosterPart: 'stock',
  xenoMods: [],
  underglowColor: null,
  ownedParts: ['roof:stock', 'aero:stock', 'nose:stock', 'booster:stock'],
  factories: INITIAL_FACTORIES,
  cargoBayLevel: 1,
  roboticArmOverdrive: false,

  shipClass: 'corvette',
  ownedShipClasses: ['corvette'],
  earthWeather: 'day',
  hudTheme: 'cyan',
  pointDefenseOn: false,
  autoMinerOn: false,
  empPulse: 0,
  empCooldown: 0,
  microJumpCooldown: 0,
  peakSpeed: 0,
  deployedSatellites: [],
  stocks: [
    { symbol: 'TSY', name: 'Terran Shipyards', price: 420, change: 2.4, owned: 0 },
    { symbol: 'VDC', name: 'Vela Deuterium Corp', price: 285, change: -1.1, owned: 0 },
    { symbol: 'NXL', name: 'Nyx Xeno Labs', price: 890, change: 5.8, owned: 0 },
    { symbol: 'HLR', name: 'Helios Robotics', price: 540, change: 1.9, owned: 0 },
  ],
  bankVault: 0,
  unlockedAchievements: [],
  bossActive: false,
  raceActive: false,
  raceGateIndex: 0,
  raceTimer: 0,
  bestRaceTime: null,
  combatWave: 0,
  explosions: [],

  deuteriumCores: 3,
  coolantCanisters: 3,
  boostCells: 2,
  torpedoes: 6,
  overdriveTimer: 0,
  coolantReserve: 100,
  miningLaserActive: 0,
  cannonPulse: 0,
  tractorPulse: 0,
  cloakActive: false,
  spaceRadioOn: false,
  upgrades: {
    engines: 1,
    boost: 1,
    fuelEfficiency: 1,
    cooling: 1,
    shields: 1,
    hullArmor: 1,
    sensors: 1,
    warpCoils: 1,
  },

  mpConnected: false,
  mpRoom: 'STAR-01',
  mpCallsign: `CMD-${Math.floor(100 + Math.random() * 900)}`,
  mpJob: 'PILOT',
  boardedHostId: null,
  remotePlayers: {},
  fleetChat: [],
  raiders: INITIAL_RAIDERS,
  waypoints: [],
  xp: 0,
  raidersDestroyed: 0,
  asteroidsMined: 0,

  currentSystemId: 'solaris-prime',
  selectedTargetId: 'vanguard-orbital',
  plottedSystemId: null,
  discoveredSystems: ['solaris-prime'],
  scannedObjects: [],
  dockedStationId: null,
  activeHazard: null,
  warp: { active: false, progress: 0, targetSystemId: null },

  reactorThrottle: 85,
  reactorOutput: 85,
  backupGeneratorOnline: false,
  backupBattery: 100,
  power: {
    engines: 35,
    shields: 25,
    lifeSupport: 25,
    sensors: 15,
  },
  enginesOnline: true,
  shieldsOnline: true,
  lifeSupportOnline: true,
  internalGravityOnline: true,
  commsOnline: true,
  navComputerOnline: true,
  waterRecyclingOnline: true,
  airFiltrationOnline: true,
  coolantCooldown: 0,
  repairActive: false,
  scanPulse: 0,

  hull: 100,
  shields: 100,
  fuel: 100,
  oxygen: 100,
  temperature: 345,
  engineHealth: 100,
  shieldImpactFlash: 0,
  hullDamageFlash: 0,
  components: {
    engines: 100,
    reactor: 100,
    comms: 100,
    sensors: 100,
    hullPort: 100,
    hullStarboard: 100,
    lifeSupport: 100,
    doors: 100,
  },

  activeEmergencies: [],
  emergencyHistory: [],
  robots: [
    { id: 'mbot-1', name: 'M-BOT ALPHA', status: 'DOCKED', assignedRoomId: 'maintenance-room', targetEmergencyUid: null, battery: 100 },
    { id: 'mbot-2', name: 'M-BOT BETA', status: 'DOCKED', assignedRoomId: 'maintenance-room', targetEmergencyUid: null, battery: 100 },
  ],

  crew: INITIAL_CREW,

  discoveries: [],
  commsInbox: [
    {
      id: 'comm-1',
      sender: 'VANGUARD ORBITAL CONTROL',
      channel: 'SUBSPACE-01',
      time: formatTime(),
      body: 'Welcome aboard USS Hyperion. Approach Vanguard Orbital for shakedown docking and supply loading.',
      unread: true,
    },
    {
      id: 'comm-2',
      sender: 'TERRAN SCIENCE DIRECTORATE',
      channel: 'SCI-NET',
      time: formatTime(),
      body: 'Anomalous telemetry detected near Derelict Relay K-9 in the Cinder Belt. Deep Scan authorization granted.',
      unread: true,
    },
  ],
  lockedRooms: [],
  escapePodsArmed: false,
  openPodIndex: 1,
  cargo: {
    deuterium: 4,
    cryoMeds: 2,
    titanium: 6,
    quantumRelays: 1,
    xenoArtifacts: 0,
  },
  blackBox: [
    {
      time: formatTime(),
      sector: 'SOLARIS PRIME',
      event: 'STARSHIP OS v2.0 INITIALIZED — FLIGHT RECORDER ACTIVE',
      speed: 0,
      hull: 100,
    },
  ],
  maintenanceHistory: [
    {
      id: 'mnt-0',
      time: formatTime(),
      system: 'FUSION REACTOR',
      action: 'Pre-flight magnetic containment calibration passed',
      performedBy: 'ENG. TARIQ AL-MANSOOR',
    },
  ],

  missions: INITIAL_MISSIONS,
  activeMissionId: INITIAL_MISSIONS[0].id,
  credits: 3500,
  logs: [
    {
      id: 'init-1',
      time: formatTime(),
      message: 'STARSHIP 2.0 OS ONLINE — ALL 15 DECK COMPARTMENTS PRESSURIZED',
      level: 'info',
    },
    {
      id: 'init-2',
      time: formatTime(),
      message: 'MISSION ASSIGNED: OPS-01 ORBITAL SHAKEDOWN (VANGUARD ORBITAL)',
      level: 'success',
    },
  ],

  finishBoot: () => {
    starshipAudio.init();
    starshipAudio.playSuccess();
    set({ booted: true });
  },

  setPlayerMode: (mode) => {
    const s = get();
    if (mode === 'eva' && s.warp.active) {
      s.addLog('CANNOT ENTER EVA DURING QUANTUM WARP', 'alert');
      return;
    }
    starshipAudio.playDoor();
    if (mode === 'flight') {
      const myShipId = s.boardedHostId || multiplayerClient.playerId;
      const activePilot = Object.values(s.remotePlayers).find(
        (p) => p.shipHostId === myShipId && p.playerMode === 'flight'
      );
      if (activePilot) {
        starshipAudio.playAlert('LOW');
        s.addLog(`HELM OCCUPIED BY ${activePilot.callsign} — ONLY ONE PILOT CAN FLY THIS SHIP`, 'warn');
        return;
      }
      s.addLog('SEATED AT COMMAND HELM', 'info');
      set({ playerMode: 'flight', activeView: 'bridge' });
    } else if (mode === 'interior') {
      s.addLog('LEAVING HELM — WALKING SHIP DECKS', 'info');
      set({ playerMode: 'interior', activeView: 'bridge', autopilot: false });
    } else if (mode === 'eva') {
      s.addLog('AIRLOCK DEPRESSURIZED — EVA SPACEWALK ACTIVE (TETHER ENGAGED)', 'warn');
      set({
        playerMode: 'eva',
        activeView: 'bridge',
        evaOxygen: 100,
        evaTetherDistance: 2,
        velocity: [0, 0, 0],
        throttle: 0,
        autopilot: false,
      });
    }
  },

  setInteriorRoom: (roomId) => {
    if (roomId !== get().interiorRoomId) set({ interiorRoomId: roomId });
  },

  setActiveView: (view) => {
    const s = get();
    const bridgeOnlyViews: StationView[] = ['bridge', 'missions', 'ai', 'multiplayer', 'galactic'];
    if (s.playerMode === 'flight' && !bridgeOnlyViews.includes(view)) {
      starshipAudio.playAlert('LOW');
      s.addLog(`LEAVE HELM AND WALK TO THE APPROPRIATE SHIP ROOM TO ACCESS ${view.toUpperCase()}`, 'warn');
      return;
    }
    starshipAudio.playClick(740);
    set({ activeView: view });
  },

  toggleCamera: () => {
    starshipAudio.playClick(620);
    set((s) => ({ cameraMode: s.cameraMode === 'cockpit' ? 'external' : 'cockpit' }));
  },

  setCameraMode: (mode) => {
    starshipAudio.playClick(620);
    set({ cameraMode: mode });
  },

  toggleAudio: () => {
    const next = !get().audioMuted;
    starshipAudio.setMuted(next);
    if (!next) starshipAudio.playClick(820);
    set({ audioMuted: next });
  },

  cycleRadarRange: () => {
    starshipAudio.playClick(880);
    set((s) => ({
      radarRange: s.radarRange === 400 ? 900 : s.radarRange === 900 ? 1800 : 400,
    }));
  },

  toggleRedAlert: () => {
    const next = !get().redAlert;
    starshipAudio.playAlert(next ? 'CRITICAL' : 'LOW');
    get().addLog(next ? 'RED ALERT CONDITION ENGAGED — ALL HANDS TO STATIONS' : 'RED ALERT STAND-DOWN', next ? 'alert' : 'info');
    set({ redAlert: next });
  },

  setThrottle: (val) => {
    set({ throttle: Math.max(-1, Math.min(1, val)), dockedStationId: null, landedPlanetId: null });
  },

  toggleFlightAssist: () => {
    starshipAudio.playClick(700);
    const next = !get().flightAssist;
    get().addLog(`INERTIAL DAMPENERS ${next ? 'ENGAGED' : 'DISENGAGED (NEWTONIAN DRIFT)'}`, next ? 'info' : 'warn');
    set({ flightAssist: next });
  },

  toggleAutopilot: () => {
    const state = get();
    if (!state.navComputerOnline) {
      state.addLog('AUTOPILOT UNAVAILABLE: NAVIGATION COMPUTER OFFLINE', 'alert');
      starshipAudio.playAlert('MODERATE');
      return;
    }
    if (!state.selectedTargetId) {
      state.addLog('AUTOPILOT REQUIRES A LOCKED TARGET', 'warn');
      starshipAudio.playAlert('LOW');
      return;
    }
    if (!state.enginesOnline || state.fuel <= 0.5) {
      state.addLog('AUTOPILOT FAILED: ENGINES OFFLINE OR FUEL DEPLETED', 'alert');
      starshipAudio.playAlert('MODERATE');
      return;
    }
    const next = !state.autopilot;
    starshipAudio.playClick(next ? 900 : 500);
    state.addLog(`NAV AUTOPILOT ${next ? 'ENGAGED' : 'DISENGAGED'}`, 'info');
    set({ autopilot: next, dockedStationId: null, landedPlanetId: null });
  },

  toggleHeadlights: () => {
    starshipAudio.playClick(650);
    set((s) => ({ headlights: !s.headlights }));
  },

  toggleHyperCruise: () => {
    const s = get();
    const next = !s.hyperCruise;
    if (next && (!s.enginesOnline || s.fuel <= 1)) {
      starshipAudio.playAlert('LOW');
      s.addLog('HYPER-CRUISE BLOCKED: ENGINES OFFLINE OR NO FUEL', 'warn');
      return;
    }
    starshipAudio.playWarp();
    s.addLog(
      next
        ? 'HYPER-CRUISE DRIVE ENGAGED — DEEP-SPACE ULTRA-VELOCITY ACTIVE (REACH 25M–100M m WORLDS!)'
        : 'HYPER-CRUISE DISENGAGED — SUB-LIGHT THRUSTERS',
      next ? 'success' : 'info'
    );
    set({ hyperCruise: next });
  },

  toggleSystem: (sys) => {
    const next = !get()[sys];
    starshipAudio.playClick(next ? 780 : 420);
    get().addLog(`${sys.replace('Online', '').toUpperCase()} ${next ? 'ONLINE' : 'OFFLINE'}`, next ? 'info' : 'warn');
    set({ [sys]: next } as Partial<ShipState>);
  },

  setReactorThrottle: (val) => {
    set({ reactorThrottle: Math.max(10, Math.min(120, Math.round(val))) });
  },

  setPowerAllocation: (key, value) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    const current = { ...get().power };
    const oldVal = current[key];
    const diff = clamped - oldVal;
    current[key] = clamped;

    const total = current.engines + current.shields + current.lifeSupport + current.sensors;
    if (total > 100 && diff > 0) {
      let excess = total - 100;
      const others = (['engines', 'shields', 'lifeSupport', 'sensors'] as const).filter((k) => k !== key);
      for (const other of others) {
        if (excess <= 0) break;
        const cut = Math.min(current[other], excess);
        current[other] -= cut;
        excess -= cut;
      }
    }
    set({ power: current });
  },

  applyPowerPreset: (preset) => {
    starshipAudio.playClick(820);
    const presets: Record<typeof preset, PowerAllocation> = {
      balanced: { engines: 30, shields: 25, lifeSupport: 25, sensors: 20 },
      thrust: { engines: 55, shields: 15, lifeSupport: 20, sensors: 10 },
      tactical: { engines: 25, shields: 45, lifeSupport: 20, sensors: 10 },
      stealth: { engines: 15, shields: 10, lifeSupport: 25, sensors: 50 },
    };
    get().addLog(`POWER PROFILE LOADED: ${preset.toUpperCase()}`, 'info');
    set({ power: presets[preset] });
  },

  triggerCoolantFlush: () => {
    const s = get();
    if (s.coolantCooldown > 0 || s.coolantReserve < 30) {
      starshipAudio.playAlert('LOW');
      s.addLog('COOLANT VENT UNAVAILABLE (NEED 30% CRYO TANK) — LOAD CANISTER IN COOLANT BAY', 'warn');
      return;
    }
    starshipAudio.playScan();
    const newTemp = Math.max(290, s.temperature - 160);
    s.addLog('CRYO-COOLANT VENTED (-160K TEMP, -30% CRYO TANK)', 'success');
    s.addMaintenanceRecord('COOLING LOOP', 'Cryogenic coolant vent (-160K)', 'ENGINEERING');
    set({ temperature: newTemp, coolantCooldown: 14, coolantReserve: Math.max(0, s.coolantReserve - 30) });
  },

  toggleRepair: () => {
    const s = get();
    const next = !s.repairActive;
    starshipAudio.playClick(next ? 850 : 480);
    s.addLog(`NANITE HULL/ENGINE REPAIR ${next ? 'INITIATED' : 'HALTED'}`, 'info');
    set({ repairActive: next });
  },

  // FUEL BAY: Load Deuterium Core
  loadDeuteriumCore: () => {
    const s = get();
    if (s.deuteriumCores <= 0) {
      starshipAudio.playAlert('LOW');
      s.addLog('NO DEUTERIUM CORES IN STORAGE — DOCK AT A STATION OR REFINE CARGO DEUTERIUM', 'warn');
      return;
    }
    if (s.fuel >= 99.5) {
      s.addLog('FUEL TANKS ALREADY AT 100% CAPACITY', 'info');
      return;
    }
    starshipAudio.playSuccess();
    const nextFuel = Math.min(100, s.fuel + 35);
    s.addLog(`DEUTERIUM CORE LOADED IN FUEL BAY (+35% FUEL -> ${Math.round(nextFuel)}%)`, 'success');
    s.addMaintenanceRecord('FUEL BAY', 'Loaded Deuterium Core (+35% fuel)', 'COMMANDER');
    set({ deuteriumCores: s.deuteriumCores - 1, fuel: nextFuel });
  },

  // FUEL BAY: Refine 2x Cargo Deuterium into +1 Deuterium Core in deep space
  refineCargoToCore: () => {
    const s = get();
    if (s.cargo.deuterium < 2) {
      starshipAudio.playAlert('LOW');
      s.addLog('NEED 2x REFINED DEUTERIUM IN CARGO HOLD TO SYNTHESIZE A CORE (MINE ASTEROIDS!)', 'warn');
      return;
    }
    starshipAudio.playSuccess();
    s.addLog('REFINED 2x CARGO DEUTERIUM INTO +1 DEUTERIUM CORE', 'success');
    set({
      cargo: { ...s.cargo, deuterium: s.cargo.deuterium - 2 },
      deuteriumCores: s.deuteriumCores + 1,
    });
  },

  // COOLANT BAY: Balanced Cryo-Coolant Canister (+45% Tank & -140K Chill)
  loadCoolantCanister: () => {
    const s = get();
    if (s.coolantCanisters <= 0) {
      starshipAudio.playAlert('LOW');
      s.addLog('NO CRYO-COOLANT CANISTERS — DOCK AT A STATION TO RESTOCK', 'warn');
      return;
    }
    starshipAudio.playScan();
    const nextReserve = Math.min(100, s.coolantReserve + 45);
    const nextTemp = Math.max(290, s.temperature - 140);
    s.addLog(`CRYO-COOLANT CANISTER LOADED (+45% TANK -> ${Math.round(nextReserve)}%, CORE ${Math.round(nextTemp)}K)`, 'success');
    s.addMaintenanceRecord('COOLANT BAY', 'Loaded Cryo-Coolant Canister (+45% tank)', 'COMMANDER');
    set({
      coolantCanisters: s.coolantCanisters - 1,
      coolantReserve: nextReserve,
      coolantCooldown: Math.max(0, s.coolantCooldown - 6),
      temperature: nextTemp,
    });
  },

  // HYPER-OVERDRIVE BOOST CELL
  activateBoostCell: () => {
    const s = get();
    if (s.boostCells <= 0) {
      starshipAudio.playAlert('LOW');
      s.addLog('NO BOOST CELLS AVAILABLE — DOCK AT A STATION TO PURCHASE', 'warn');
      return;
    }
    starshipAudio.playWarp();
    s.addLog('HYPER-OVERDRIVE BOOST CELL INJECTED — +60% THRUST FOR 10 SECONDS!', 'success');
    set({ boostCells: s.boostCells - 1, overdriveTimer: 10, temperature: Math.min(1150, s.temperature + 45) });
  },

  // MINING LASER: Extract Titanium & Deuterium + Track Mining Quests
  fireMiningLaser: () => {
    const s = get();
    if (s.dockedStationId || s.landedPlanetId) return;
    const system = getStarSystem(s.currentSystemId);
    starshipAudio.playWeld();
    set({ miningLaserActive: 1, temperature: Math.min(1150, s.temperature + 26) });

    let hit = false;
    for (const ast of system.asteroids) {
      const dist = Math.hypot(
        s.position[0] - ast.position[0],
        s.position[1] - ast.position[1],
        s.position[2] - ast.position[2]
      );
      if (dist <= ast.radius + 115) {
        hit = true;
        const yieldQty = s.mpJob === 'WEAPONS' ? 2 : 1;
        const foundDeut = Math.random() < 0.55;
        if (foundDeut) {
          set((prev) => ({
            cargo: { ...prev.cargo, deuterium: prev.cargo.deuterium + yieldQty },
            asteroidsMined: prev.asteroidsMined + 1,
            xp: prev.xp + 35,
          }));
          s.addLog(`MINING LASER: EXTRACTED +${yieldQty} REFINED DEUTERIUM (+35 XP)`, 'success');
        } else {
          set((prev) => ({
            cargo: { ...prev.cargo, titanium: prev.cargo.titanium + yieldQty },
            asteroidsMined: prev.asteroidsMined + 1,
            xp: prev.xp + 35,
          }));
          s.addLog(`MINING LASER: EXTRACTED +${yieldQty} TITANIUM ALLOY (+35 XP)`, 'success');
        }

        // Advance mining quests
        const updatedMissions = get().missions.map((m) => {
          if (!m.completed && m.actionType === 'mine') {
            const nextProg = (m.progress || 0) + 1;
            if (nextProg >= (m.targetCount || 3)) {
              starshipAudio.playSuccess();
              s.addLog(`QUEST COMPLETE: ${m.title} (+${m.rewardCredits} CR)`, 'success');
              set((prev) => ({ credits: prev.credits + m.rewardCredits, xp: prev.xp + (m.rewardXp || 200) }));
              return { ...m, progress: nextProg, completed: true, completedAt: formatTime() };
            }
            return { ...m, progress: nextProg };
          }
          return m;
        });
        set({ missions: updatedMissions });
        break;
      }
    }
    if (!hit) {
      s.addLog('MINING LASER: NO ASTEROID WITHIN 115m RANGE', 'warn');
    }
  },

  // TACTICAL PULSE CANNONS: Damages nearby Hostile Raider Drones!
  firePulseCannon: () => {
    const s = get();
    if (s.dockedStationId || s.landedPlanetId) return;
    starshipAudio.playClick(320);
    set({ cannonPulse: 1, temperature: Math.min(1150, s.temperature + 16), cloakActive: false });

    const dmg = s.mpJob === 'WEAPONS' ? 56 : 40;
    const hitRaider = s.raiders.find((r) => {
      if (r.systemId !== s.currentSystemId || r.hp <= 0) return false;
      const angle = r.phase + s.simTime * r.orbitSpeed;
      const rx = r.orbitCenter[0] + Math.cos(angle) * r.orbitRadius;
      const ry = r.orbitCenter[1] + Math.sin(angle * 1.4) * 18;
      const rz = r.orbitCenter[2] + Math.sin(angle) * r.orbitRadius;
      return Math.hypot(s.position[0] - rx, s.position[1] - ry, s.position[2] - rz) < 220;
    });

    if (hitRaider) {
      const nextHp = hitRaider.hp - dmg;
      if (nextHp <= 0) {
        starshipAudio.playExplosion();
        const angle = hitRaider.phase + s.simTime * hitRaider.orbitSpeed;
        const exPos: [number, number, number] = [
          hitRaider.orbitCenter[0] + Math.cos(angle) * hitRaider.orbitRadius,
          hitRaider.orbitCenter[1] + Math.sin(angle * 1.4) * 18,
          hitRaider.orbitCenter[2] + Math.sin(angle) * hitRaider.orbitRadius,
        ];
        const newFx: ExplosionFx = {
          id: `exp-${Date.now()}-${Math.random()}`,
          position: exPos,
          createdAt: performance.now(),
          scale: hitRaider.id === 'boss-leviathan' ? 3.5 : 1.4,
        };
        s.addLog(`RAIDER DESTROYED: ${hitRaider.name} (+${hitRaider.bounty} CR BOUNTY, +120 XP)`, 'success');
        s.recordBlackBox(`DESTROYED ${hitRaider.name}`);
        const remainingRaiders = s.raiders.filter((r) => r.id !== hitRaider.id);
        let extraCredits = hitRaider.bounty;
        let extraXp = 120;

        const updatedMissions = s.missions.map((m) => {
          if (!m.completed && m.actionType === 'bounty') {
            const nextProg = (m.progress || 0) + 1;
            if (nextProg >= (m.targetCount || 2)) {
              extraCredits += m.rewardCredits;
              extraXp += m.rewardXp || 300;
              s.addLog(`BOUNTY QUEST COMPLETE: ${m.title} (+${m.rewardCredits} CR)`, 'success');
              if (m.isCoop && s.mpConnected) {
                multiplayerClient.send({
                  type: 'coop_reward',
                  room: s.mpRoom,
                  sender: s.mpCallsign,
                  missionTitle: m.title,
                  credits: Math.round(m.rewardCredits * 0.5),
                });
              }
              return { ...m, progress: nextProg, completed: true, completedAt: formatTime() };
            }
            return { ...m, progress: nextProg };
          }
          return m;
        });

        set({
          raiders: remainingRaiders,
          explosions: [...s.explosions, newFx].slice(-8),
          credits: s.credits + extraCredits,
          xp: s.xp + extraXp,
          raidersDestroyed: s.raidersDestroyed + 1,
          cargo: { ...s.cargo, quantumRelays: s.cargo.quantumRelays + 1 },
          missions: updatedMissions,
        });
      } else {
        set({ raiders: s.raiders.map((r) => (r.id === hitRaider.id ? { ...r, hp: nextHp } : r)) });
        s.addLog(`PULSE HIT ${hitRaider.name} (-${dmg} HP, ${nextHp} LEFT)`, 'info');
      }
    }
  },

  // HOMING PLASMA TORPEDO [T]
  fireTorpedo: () => {
    const s = get();
    if (s.dockedStationId || s.landedPlanetId) return;
    if (s.torpedoes <= 0) {
      starshipAudio.playAlert('LOW');
      s.addLog('NO TORPEDOES REMAINING — RESTOCK AT A STATION', 'warn');
      return;
    }
    starshipAudio.playTorpedo();
    set({ torpedoes: s.torpedoes - 1, cannonPulse: 1, cloakActive: false });

    const target = s.raiders.find((r) => r.systemId === s.currentSystemId && r.hp > 0);
    if (!target) {
      s.addLog('TORPEDO LAUNCHED — NO HOSTILE RAIDER LOCKED IN SECTOR', 'warn');
      return;
    }
    starshipAudio.playExplosion();
    s.addLog(`HOMING TORPEDO OBLITERATED ${target.name} (+${target.bounty} CR, +140 XP)`, 'success');
    const remainingRaiders = s.raiders.filter((r) => r.id !== target.id);
    let extraCr = target.bounty;
    const updatedMissions = s.missions.map((m) => {
      if (!m.completed && m.actionType === 'bounty') {
        const nextProg = (m.progress || 0) + 1;
        if (nextProg >= (m.targetCount || 2)) {
          extraCr += m.rewardCredits;
          return { ...m, progress: nextProg, completed: true, completedAt: formatTime() };
        }
        return { ...m, progress: nextProg };
      }
      return m;
    });
    set({
      raiders: remainingRaiders,
      credits: s.credits + extraCr,
      xp: s.xp + 140,
      raidersDestroyed: s.raidersDestroyed + 1,
      missions: updatedMissions,
    });
  },

  // TRACTOR BEAM [G]: Pulls salvage & debris crates into cargo
  activateTractorBeam: () => {
    const s = get();
    starshipAudio.playScan();
    set({ tractorPulse: 1 });
    const bonus = Math.random() < 0.5 ? 'titanium' : 'deuterium';
    set((prev) => ({ cargo: { ...prev.cargo, [bonus]: prev.cargo[bonus] + 1 }, xp: prev.xp + 20 }));
    s.addLog(`TRACTOR BEAM: PULLED FLOATING SALVAGE (+1 ${bonus.toUpperCase()})`, 'success');
  },

  // CLOAKING / STEALTH FIELD [V]
  toggleCloak: () => {
    const next = !get().cloakActive;
    starshipAudio.playClick(next ? 420 : 780);
    get().addLog(`OPTICAL CLOAKING FIELD ${next ? 'ENGAGED (STEALTH ACTIVE)' : 'DISENGAGED'}`, next ? 'info' : 'warn');
    set({ cloakActive: next });
  },

  // EMERGENCY SHIELD CAPACITOR
  triggerShieldCapacitor: () => {
    const s = get();
    if (s.backupBattery < 15) {
      starshipAudio.playAlert('LOW');
      s.addLog('SHIELD CAPACITOR REQUIRES 15% BACKUP BATTERY', 'warn');
      return;
    }
    starshipAudio.playSuccess();
    set({
      backupBattery: Math.max(0, s.backupBattery - 15),
      shields: Math.min(100, s.shields + 35),
      shieldsOnline: true,
    });
    s.addLog('EMERGENCY SHIELD CAPACITOR DISCHARGED (+35% SHIELDS)', 'success');
  },

  toggleSpaceRadio: () => {
    const on = starshipAudio.toggleSpaceRadio();
    get().addLog(`AMBIENT SPACE RADIO ${on ? 'ONLINE' : 'OFFLINE'}`, 'info');
    set({ spaceRadioOn: on });
  },

  dropWaypoint: () => {
    const s = get();
    starshipAudio.playClick(960);
    const wp: NavWaypoint = {
      id: `wp-${Date.now()}`,
      name: `BEACON-${s.waypoints.length + 1}`,
      systemId: s.currentSystemId,
      position: [...s.position],
    };
    s.addLog(`NAV WAYPOINT DROPPED: ${wp.name} AT [${Math.round(s.position[0])}, ${Math.round(s.position[1])}, ${Math.round(s.position[2])}]`, 'success');
    set({ waypoints: [wp, ...s.waypoints].slice(0, 8) });
  },

  connectMultiplayer: (room, callsign, wsUrl) => {
    const s = get();
    const cleanRoom = (room || 'STAR-01').toUpperCase().trim();
    const cleanCall = (callsign || s.mpCallsign).toUpperCase().trim();
    multiplayerClient.connect(cleanRoom, wsUrl);
    starshipAudio.playSuccess();

    // Separate fleet ships in corvette-scale formation so wings never clip on spawn
    const atOrigin = Math.hypot(s.position[0], s.position[1] - 10, s.position[2] - 40) < 5;
    const nextPos: [number, number, number] = atOrigin
      ? [(Math.random() - 0.5) * 65, 10 + (Math.random() - 0.5) * 14, 15 + (Math.random() - 0.5) * 35]
      : s.position;

    set({ mpConnected: true, mpRoom: cleanRoom, mpCallsign: cleanCall, boardedHostId: null, remotePlayers: {}, position: nextPos });
    get().addLog(`CONNECTED TO FLEET [${cleanRoom}] IN YOUR OWN SHIP AS ${cleanCall}`, 'success');
  },

  disconnectMultiplayer: () => {
    multiplayerClient.disconnect();
    starshipAudio.playClick(420);
    set({ mpConnected: false, boardedHostId: null, remotePlayers: {} });
    get().addLog('DISCONNECTED FROM MULTIPLAYER FLEET', 'info');
  },

  boardPlayerShip: (hostId) => {
    const s = get();
    const host = s.remotePlayers[hostId];
    if (!host) return;
    starshipAudio.playDoor();
    const targetShipId = host.shipHostId || host.id;
    s.addLog(`DOCKED & BOARDED ${host.callsign}'S SHIP — SPAWNED AT REACTOR CORE`, 'success');
    set({
      boardedHostId: targetShipId,
      playerMode: 'interior',
      activeView: 'bridge',
      interiorRoomId: 'reactor-room',
      interiorPos: [0, 1.65, 25],
      interiorYaw: 0,
      position: host.position,
      quaternion: host.quaternion,
      currentSystemId: host.systemId,
    });
  },

  leaveBoardedShip: () => {
    const s = get();
    if (!s.boardedHostId) return;
    starshipAudio.playDoor();
    s.addLog('SHUTTLED BACK TO YOUR OWN STARSHIP', 'info');
    set({
      boardedHostId: null,
      playerMode: 'flight',
      activeView: 'bridge',
      position: [s.position[0] + 18, s.position[1] + 4, s.position[2] + 12],
      velocity: [0, 0, 0],
    });
  },

  setMpJob: (job) => {
    starshipAudio.playClick(820);
    set({ mpJob: job });
    get().addLog(`MULTIPLAYER CREW JOB SET TO: ${job}`, 'success');
  },

  sendFleetChat: (text) => {
    const s = get();
    if (!s.mpConnected || !text.trim()) return;
    const msg: FleetChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      sender: s.mpCallsign,
      job: s.mpJob,
      text: text.trim(),
      time: formatTime(),
    };
    multiplayerClient.send({ type: 'chat', room: s.mpRoom, msg });
    set({ fleetChat: [...s.fleetChat, msg].slice(-40) });
  },

  // DOCK- OR EARTH-GATED SUPPLY PURCHASING
  buySupply: (type, price) => {
    const s = get();
    if (!s.dockedStationId && s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('PURCHASE BLOCKED: DOCK AT A STATION OR LAND ON EARTH TO BUY SUPPLIES', 'warn');
      return;
    }
    if (s.credits < price) {
      starshipAudio.playAlert('LOW');
      s.addLog(`INSUFFICIENT CREDITS (NEED ${price} CR)`, 'warn');
      return;
    }
    starshipAudio.playClick(880);
    set({
      credits: s.credits - price,
      [type]: s[type] + 1,
    } as Partial<ShipState>);
    s.addLog(`LOGISTICS: PURCHASED +1 ${type.toUpperCase()} (-${price} CR)`, 'success');
  },

  // EARTH-ONLY PERMANENT SHIP UPGRADES
  purchaseUpgrade: (key) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('UPGRADE BLOCKED: YOU MUST LAND ON EARTH (SOLARIS PRIME) TO UPGRADE SHIP HARDWARE', 'warn');
      return;
    }
    const currentLv = s.upgrades[key];
    if (currentLv >= 5) return;
    const cost = getUpgradeCost(currentLv);
    if (s.credits < cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`INSUFFICIENT CREDITS FOR ${key.toUpperCase()} LV.${currentLv + 1} (NEED ${cost} CR)`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    const nextLv = currentLv + 1;
    s.addLog(`EARTH SHIPYARD: INSTALLED ${key.toUpperCase()} MK-${nextLv} (-${cost} CR)`, 'success');
    s.addMaintenanceRecord('EARTH SHIPYARD', `Upgraded ${key.toUpperCase()} to Mk-${nextLv}`, 'TERRAN DRYDOCK');
    set({
      credits: s.credits - cost,
      upgrades: { ...s.upgrades, [key]: nextLv },
    });
  },

  // EARTH-ONLY FACTORY MODULE REPLACEMENT (Engines, Sensors, Coolant, Reactor, Comms, Hull)
  replaceModuleOnEarth: (module, cost) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('REPLACEMENT BLOCKED: LAND ON EARTH (SOLARIS PRIME) TO REPLACE SHIP MODULES', 'warn');
      return;
    }
    if (s.credits < cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`INSUFFICIENT CREDITS TO REPLACE ${module.toUpperCase()} (NEED ${cost} CR)`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    const nextComps = { ...s.components };
    const patch: Partial<ShipState> = { credits: s.credits - cost, components: nextComps };

    if (module === 'engines') {
      nextComps.engines = 100;
      patch.engineHealth = 100;
      patch.enginesOnline = true;
    } else if (module === 'sensors') {
      nextComps.sensors = 100;
      patch.navComputerOnline = true;
    } else if (module === 'cooling') {
      nextComps.lifeSupport = 100;
      patch.coolantReserve = 100;
      patch.temperature = 300;
      patch.coolantCooldown = 0;
    } else if (module === 'reactor') {
      nextComps.reactor = 100;
      patch.backupBattery = 100;
    } else if (module === 'comms') {
      nextComps.comms = 100;
      patch.commsOnline = true;
    } else if (module === 'hull') {
      nextComps.hullPort = 100;
      nextComps.hullStarboard = 100;
      patch.hull = 100;
      patch.shields = 100;
    }

    s.addLog(`EARTH SHIPYARD: REPLACED ${module.toUpperCase()} WITH FACTORY-NEW ASSEMBLY (-${cost} CR)`, 'success');
    s.addMaintenanceRecord('EARTH SHIPYARD', `Replaced ${module.toUpperCase()} assembly (100%)`, 'TERRAN DRYDOCK');
    set(patch);
  },

  selectTarget: (id) => {
    if (id !== get().selectedTargetId) starshipAudio.playClick(920);
    set({ selectedTargetId: id });
  },

  plotSystemRoute: (systemId) => {
    starshipAudio.playClick(760);
    set({ plottedSystemId: systemId });
  },

  initiateWarp: (targetSystemId) => {
    const s = get();
    if (s.warp.active) return;
    if (targetSystemId === s.currentSystemId) {
      s.addLog('ALREADY IN SELECTED STAR SYSTEM', 'warn');
      return;
    }
    if (!s.enginesOnline) {
      s.addLog('QUANTUM DRIVE BLOCKED: ENGINES OFFLINE', 'alert');
      starshipAudio.playAlert('MODERATE');
      return;
    }
    const baseCost = calculateJumpFuel(s.currentSystemId, targetSystemId);
    const warpDiscount = Math.max(0.35, 1 - (s.upgrades.warpCoils - 1) * 0.15);
    const fuelCost = Math.max(5, Math.round(baseCost * warpDiscount));
    if (s.fuel < fuelCost) {
      s.addLog(`INSUFFICIENT FUEL FOR JUMP (NEED ${fuelCost}%, HAVE ${Math.round(s.fuel)}%) — LOAD DEUTERIUM CORE IN FUEL BAY`, 'alert');
      starshipAudio.playAlert('MODERATE');
      return;
    }
    starshipAudio.playWarp();
    const dest = getStarSystem(targetSystemId);
    s.addLog(`QUANTUM JUMP ENGAGED -> ${dest.name} (-${fuelCost}% FUEL)`, 'success');
    s.recordBlackBox(`QUANTUM JUMP TO ${dest.name}`);
    set({
      playerMode: 'flight',
      activeView: 'bridge',
      autopilot: false,
      dockedStationId: null,
      landedPlanetId: null,
      fuel: Math.max(0, s.fuel - fuelCost),
      warp: { active: true, progress: 0, targetSystemId },
    });
  },

  triggerDeepScan: () => {
    const s = get();
    const sensorFault = s.activeEmergencies.some((e) => e.affectedSystem === 'sensors');
    if (sensorFault) {
      starshipAudio.playAlert('MODERATE');
      s.addLog('DEEP SCAN BLOCKED: SENSOR ARRAY INTERFERENCE EMERGENCY', 'alert');
      return;
    }
    const system = getStarSystem(s.currentSystemId);
    starshipAudio.playScan();
    set({ scanPulse: 1 });

    const candidates = system.objects.filter((o) => o.scannable);
    let scannedAny = false;
    const sensorBonus = (s.upgrades.sensors - 1) * 80;

    for (const obj of candidates) {
      const dist = Math.hypot(
        s.position[0] - obj.position[0],
        s.position[1] - obj.position[1],
        s.position[2] - obj.position[2]
      );
      const scanRange = 200 + obj.radius + s.power.sensors * 2.5 + sensorBonus;
      if (dist <= scanRange) {
        scannedAny = true;
        const already = s.scannedObjects.includes(obj.id);
        if (!already) {
          const discovery: ScienceDiscovery = {
            id: `disc-${obj.id}`,
            objectId: obj.id,
            name: obj.name,
            systemName: system.name,
            classification: obj.classification,
            sampleName: obj.sampleName || 'Spectral Telemetry Package',
            radiationReading: `${(0.4 + Math.random() * 4.2).toFixed(2)} mSv/h`,
            discoveredAt: formatTime(),
            notes: obj.description,
          };
          const bonus = obj.scienceValue || 250;
          set((prev) => ({
            scannedObjects: [...prev.scannedObjects, obj.id],
            discoveries: [discovery, ...prev.discoveries],
            credits: prev.credits + bonus,
          }));
          s.addLog(`DISCOVERY LOGGED: ${obj.name} (+${bonus} CR SCIENCE GRANT)`, 'success');
          s.recordBlackBox(`SCANNED ${obj.name} [${obj.classification}]`);
        } else {
          s.addLog(`RESCAN CONFIRMED: ${obj.name} (${Math.round(dist)}m)`, 'info');
        }

        const updatedMissions = get().missions.map((m) => {
          if (!m.completed && m.actionType === 'scan' && m.targetObjectId === obj.id) {
            starshipAudio.playSuccess();
            s.addLog(`MISSION COMPLETED: ${m.title} (+${m.rewardCredits} CR)`, 'success');
            set((prev) => ({ credits: prev.credits + m.rewardCredits }));
            return { ...m, completed: true, completedAt: formatTime() };
          }
          return m;
        });
        set({ missions: updatedMissions });
      }
    }

    if (!scannedAny) {
      s.addLog('DEEP SCAN PULSE: NO SCANNABLE TARGETS IN RANGE — APPROACH CLOSER', 'warn');
    }
  },

  attemptDock: () => {
    const s = get();
    const system = getStarSystem(s.currentSystemId);
    const stations = system.objects.filter((o) => o.dockable);

    for (const st of stations) {
      const dist = Math.hypot(
        s.position[0] - st.position[0],
        s.position[1] - st.position[1],
        s.position[2] - st.position[2]
      );
      if (dist <= st.radius + 95) {
        starshipAudio.playSuccess();
        s.addLog(`DOCKED AT ${st.name} — FULL REFUEL, COOLANT, REPAIR & O2 RESTORED`, 'success');
        s.recordBlackBox(`DOCKED AT ${st.name}`);
        s.addMaintenanceRecord('ALL SYSTEMS', `Full drydock overhaul at ${st.name}`, 'STATION CREW');

        let bonusCredits = 0;
        const updatedMissions = s.missions.map((m) => {
          if (!m.completed && m.actionType === 'dock' && m.targetObjectId === st.id) {
            bonusCredits += m.rewardCredits;
            s.addLog(`MISSION COMPLETED: ${m.title} (+${m.rewardCredits} CR)`, 'success');
            return { ...m, completed: true, completedAt: formatTime() };
          }
          return m;
        });

        set({
          dockedStationId: st.id,
          landedPlanetId: null,
          velocity: [0, 0, 0],
          angularVelocity: [0, 0, 0],
          throttle: 0,
          autopilot: false,
          hull: 100,
          shields: 100,
          fuel: 100,
          oxygen: 100,
          coolantReserve: 100,
          engineHealth: 100,
          backupBattery: 100,
          temperature: 310,
          components: {
            engines: 100,
            reactor: 100,
            comms: 100,
            sensors: 100,
            hullPort: 100,
            hullStarboard: 100,
            lifeSupport: 100,
            doors: 100,
          },
          missions: updatedMissions,
          credits: s.credits + bonusCredits,
        });
        return;
      }
    }

    starshipAudio.playAlert('LOW');
    s.addLog('DOCKING DENIED: APPROACH WITHIN 95m OF A SPACE STATION', 'warn');
  },

  undock: () => {
    starshipAudio.playDoor();
    get().addLog('UNDOCKING CLAMPS RELEASED', 'info');
    set({ dockedStationId: null });
  },

  attemptPlanetaryLanding: () => {
    const s = get();
    const system = getStarSystem(s.currentSystemId);
    const landables = system.objects.filter((o) => o.landable);
    for (const pl of landables) {
      const dist = Math.hypot(
        s.position[0] - pl.position[0],
        s.position[1] - pl.position[1],
        s.position[2] - pl.position[2]
      );
      if (dist <= pl.radius + 115) {
        starshipAudio.playSuccess();
        s.addLog(`PLANETARY LANDING COMPLETE ON ${pl.name} — SURFACE SAMPLES COLLECTED`, 'success');
        s.recordBlackBox(`LANDED ON ${pl.name}`);
        let landBonus = 0;
        let landXp = 60;
        const updatedMissions = s.missions.map((m) => {
          if (!m.completed && m.actionType === 'land' && m.targetObjectId === pl.id) {
            landBonus += m.rewardCredits;
            landXp += m.rewardXp || 200;
            s.addLog(`QUEST COMPLETED: ${m.title} (+${m.rewardCredits} CR)`, 'success');
            return { ...m, completed: true, completedAt: formatTime() };
          }
          return m;
        });
        set({
          landedPlanetId: pl.id,
          playerMode: pl.id === 'earth' ? 'earth_cutscene' : s.playerMode,
          earthCutsceneProgress: 0,
          activeView: 'bridge',
          velocity: [0, 0, 0],
          angularVelocity: [0, 0, 0],
          throttle: 0,
          autopilot: false,
          oxygen: 100,
          credits: s.credits + landBonus,
          xp: s.xp + landXp,
          missions: updatedMissions,
        });
        return;
      }
    }
    starshipAudio.playAlert('LOW');
    s.addLog('LANDING UNAVAILABLE: APPROACH WITHIN 115m OF A LANDABLE PLANET', 'warn');
  },

  launchFromPlanet: () => {
    starshipAudio.playClick(760);
    get().addLog('ORBITAL ASCENT THRUSTERS FIRED — LEAVING SURFACE', 'info');
    set({ landedPlanetId: null, throttle: 0.35 });
  },

  launchFromEarth: () => {
    starshipAudio.playWarp();
    get().addLog('IGNITING ORBITAL ASCENT THRUSTERS — LIFTOFF FROM NEW GENEVA!', 'success');
    set({
      playerMode: 'earth_liftoff',
      earthCutsceneProgress: 0,
      activeView: 'bridge',
    });
  },

  installEngineModel: (id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('ENGINE REPLACEMENT IS ONLY AVAILABLE ON EARTH', 'warn');
      return;
    }
    const model = ENGINE_MODELS.find((e) => e.id === id);
    if (!model) return;
    const owned = s.ownedEngines.includes(id);
    if (!owned && s.credits < model.cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`NEED ${model.cost} CR TO INSTALL ${model.name}`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    s.addLog(`EARTH ENGINE FORGE: INSTALLED ${model.name}`, 'success');
    s.addMaintenanceRecord('EARTH ENGINE FORGE', `Installed ${model.name}`, 'TERRAN DRYDOCK');
    set({
      installedEngineId: id,
      ownedEngines: owned ? s.ownedEngines : [...s.ownedEngines, id],
      credits: owned ? s.credits : s.credits - model.cost,
      engineHealth: 100,
      components: { ...s.components, engines: 100 },
    });
  },

  setEngineConfig: (patch) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') return;
    set({ engineConfig: { ...s.engineConfig, ...patch } });
  },

  buyOrEquipEarthPart: (slot, id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('BODY & AERO PARTS CAN ONLY BE INSTALLED ON EARTH', 'warn');
      return;
    }
    const part = EARTH_SHOP_PARTS.find((p) => p.slot === slot && p.id === id);
    if (!part) return;
    const key = `${slot}:${id}`;
    const owned = s.ownedParts.includes(key);
    if (!owned && s.credits < part.cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`NEED ${part.cost.toLocaleString()} CR FOR ${part.name}`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    const patch: Partial<ShipState> = {
      credits: owned ? s.credits : s.credits - part.cost,
      ownedParts: owned ? s.ownedParts : [...s.ownedParts, key],
    };
    if (slot === 'roof') patch.roofPart = id as RoofPartId;
    if (slot === 'aero') patch.aeroPart = id as AeroPartId;
    if (slot === 'nose') patch.nosePart = id as NosePartId;
    if (slot === 'booster') patch.boosterPart = id as BoosterPartId;

    s.addLog(`NEW GENEVA CUSTOMS: INSTALLED ${part.name}`, 'success');
    s.addMaintenanceRecord('EARTH CUSTOMS', `Installed ${part.name}`, 'NEW GENEVA SHOP');
    set(patch);
  },

  buyXenoMod: (id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') return;
    if (s.xenoMods.includes(id)) return;
    const mod = XENO_BLACK_MARKET_MODS.find((m) => m.id === id);
    if (!mod) return;
    if (s.credits < mod.cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`NEED ${mod.cost.toLocaleString()} CR FOR ${mod.name}`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    const patch: Partial<ShipState> = {
      credits: s.credits - mod.cost,
      xenoMods: [...s.xenoMods, id],
    };
    if (id === 'xeno-overcharger') patch.torpedoes = Math.max(s.torpedoes, 25);
    s.addLog(`XENO BLACK MARKET: INSTALLED ${mod.name}`, 'success');
    set(patch);
  },

  buyBulkSupplies: () => {
    const s = get();
    if (s.landedPlanetId !== 'earth' || s.credits < 8500) {
      starshipAudio.playAlert('LOW');
      return;
    }
    starshipAudio.playSuccess();
    set({
      credits: s.credits - 8500,
      deuteriumCores: s.deuteriumCores + 10,
      coolantCanisters: s.coolantCanisters + 10,
      boostCells: s.boostCells + 10,
      torpedoes: s.torpedoes + 10,
    });
    s.addLog('BULK SUPPLY CRATE LOADED (+10 CORES, +10 COOLANT, +10 BOOST CELLS, +10 TORPS)', 'success');
  },

  setUnderglowColor: (color, cost = 0) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') return;
    if (cost > 0 && s.credits < cost) {
      starshipAudio.playAlert('LOW');
      return;
    }
    starshipAudio.playClick(880);
    set({ underglowColor: color, credits: s.credits - cost });
    s.addLog(`HULL PLASMA UNDERGLOW UPDATED`, 'success');
  },

  upgradeFactory: (id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') return;
    const f = s.factories.find((x) => x.id === id);
    if (!f || f.level >= 5) return;
    const cost = Math.round(f.buildCost * (f.level + 1));
    if (s.credits < cost) {
      starshipAudio.playAlert('LOW');
      s.addLog(`NEED ${cost.toLocaleString()} CR TO BUILD/UPGRADE ${f.name}`, 'warn');
      return;
    }
    starshipAudio.playSuccess();
    set({
      credits: s.credits - cost,
      factories: s.factories.map((x) =>
        x.id === id ? { ...x, level: x.level + 1, workers: Math.max(1, x.workers) } : x
      ),
    });
    s.addLog(`EARTH FACTORY EXPANDED: ${f.name} LEVEL ${f.level + 1}`, 'success');
  },

  hireFactoryWorker: (id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') return;
    const f = s.factories.find((x) => x.id === id);
    if (!f || f.level === 0 || f.workers >= f.level * 3) return;
    const wage = 1500;
    if (s.credits < wage) {
      starshipAudio.playAlert('LOW');
      return;
    }
    starshipAudio.playClick(920);
    set({
      credits: s.credits - wage,
      factories: s.factories.map((x) => (x.id === id ? { ...x, workers: x.workers + 1 } : x)),
    });
    s.addLog(`HIRED INDUSTRIAL WORKER FOR ${f.name} (+40% OUTPUT)`, 'success');
  },

  collectFactoryOutput: (id) => {
    const s = get();
    const f = s.factories.find((x) => x.id === id);
    if (!f || f.storedUnits < 1) return;
    const qty = Math.floor(f.storedUnits);
    starshipAudio.playSuccess();
    const patch: Partial<ShipState> = {
      factories: s.factories.map((x) => (x.id === id ? { ...x, storedUnits: x.storedUnits - qty } : x)),
    };
    if (id === 'deuterium-refinery') {
      patch.deuteriumCores = s.deuteriumCores + qty;
      s.addLog(`COLLECTED +${qty} DEUTERIUM CORES FROM EARTH REFINERY`, 'success');
    } else if (id === 'titanium-foundry') {
      patch.cargo = { ...s.cargo, titanium: s.cargo.titanium + qty };
      patch.credits = s.credits + qty * 180;
      s.addLog(`COLLECTED +${qty} TITANIUM & +${(qty * 180).toLocaleString()} CR DIVIDEND`, 'success');
    } else if (id === 'quantum-fab') {
      patch.cargo = { ...s.cargo, quantumRelays: s.cargo.quantumRelays + qty };
      patch.credits = s.credits + qty * 650;
      s.addLog(`COLLECTED +${qty} QUANTUM RELAYS & +${(qty * 650).toLocaleString()} CR`, 'success');
    } else if (id === 'ordnance-assembly') {
      patch.torpedoes = s.torpedoes + qty;
      patch.boostCells = s.boostCells + qty;
      s.addLog(`COLLECTED +${qty} TORPEDOES & +${qty} BOOST CELLS FROM ASSEMBLY`, 'success');
    }
    set(patch);
  },

  toggleRoboticArmOverdrive: () => {
    const next = !get().roboticArmOverdrive;
    starshipAudio.playClick(next ? 980 : 480);
    set({ roboticArmOverdrive: next });
    get().addLog(`MECHANICAL ROBOTIC ARMS ${next ? '2X OVERDRIVE ENGAGED' : 'STANDARD SPEED'}`, 'info');
  },

  upgradeCargoBays: () => {
    const s = get();
    if (s.landedPlanetId !== 'earth' || s.cargoBayLevel >= 4) return;
    const cost = 5000 * s.cargoBayLevel;
    if (s.credits < cost) {
      starshipAudio.playAlert('LOW');
      return;
    }
    starshipAudio.playSuccess();
    set({ credits: s.credits - cost, cargoBayLevel: s.cargoBayLevel + 1 });
    s.addLog(`CARGO BAYS EXPANDED TO TIER ${s.cargoBayLevel + 1} (+25% TRADE PROFIT)`, 'success');
  },

  tickFactories: (dt) => {
    const s = get();
    const jobMult = s.mpJob === 'FOREMAN' ? 1.5 : s.mpJob === 'ROBOTICS' ? 1.8 : 1.0;
    const armMult = s.roboticArmOverdrive ? 2.0 : 1.0;
    let changed = false;
    const next = s.factories.map((f) => {
      if (f.level <= 0) return f;
      const rate = (0.045 * f.level * (1 + f.workers * 0.4)) * jobMult * armMult;
      const cap = 20 * s.cargoBayLevel;
      if (f.storedUnits < cap) {
        changed = true;
        return { ...f, storedUnits: Math.min(cap, f.storedUnits + rate * dt) };
      }
      return f;
    });
    if (changed) set({ factories: next });
  },

  // STARSHIP 5.0 ACTIONS
  setEarthWeather: (w) => {
    starshipAudio.playClick(760);
    set({ earthWeather: w });
    get().addLog(`EARTH ATMOSPHERIC VIEW SET TO: ${w.toUpperCase()}`, 'info');
  },

  setHudTheme: (t) => {
    starshipAudio.playClick(840);
    const palette: Record<HudThemeId, [string, string]> = {
      cyan: ['#00e5ff', 'rgba(0, 229, 255, 0.48)'],
      emerald: ['#10b981', 'rgba(16, 185, 129, 0.5)'],
      amber: ['#f59e0b', 'rgba(245, 158, 11, 0.5)'],
      violet: ['#a855f7', 'rgba(168, 85, 247, 0.5)'],
      crimson: ['#ef4444', 'rgba(239, 68, 68, 0.5)'],
    };
    document.documentElement.style.setProperty('--cyan', palette[t][0]);
    document.documentElement.style.setProperty('--border-glow', palette[t][1]);
    set({ hudTheme: t });
  },

  buyOrSelectShipClass: (id) => {
    const s = get();
    if (s.landedPlanetId !== 'earth') {
      starshipAudio.playAlert('LOW');
      s.addLog('SHIP CLASS REFIT ONLY AVAILABLE AT EARTH SHIPYARDS', 'warn');
      return;
    }
    const cls = SHIP_CLASSES.find((c) => c.id === id);
    if (!cls) return;
    const owned = s.ownedShipClasses.includes(id);
    if (!owned && s.credits < cls.cost) {
      starshipAudio.playAlert('LOW');
      return;
    }
    starshipAudio.playSuccess();
    set({
      shipClass: id,
      ownedShipClasses: owned ? s.ownedShipClasses : [...s.ownedShipClasses, id],
      credits: owned ? s.credits : s.credits - cls.cost,
      hull: 100,
      shields: 100,
    });
    s.addLog(`COMMISSIONED SHIP CLASS: ${cls.name}`, 'success');
  },

  fireEmpShockwave: () => {
    const s = get();
    if (s.empCooldown > 0) return;
    starshipAudio.playWarp();
    set({ empPulse: 1, empCooldown: 12, cloakActive: false });
    let hits = 0;
    const nextRaiders = s.raiders
      .map((r) => {
        if (r.systemId !== s.currentSystemId || r.hp <= 0) return r;
        const angle = r.phase + s.simTime * r.orbitSpeed;
        const rx = r.orbitCenter[0] + Math.cos(angle) * r.orbitRadius;
        const ry = r.orbitCenter[1] + Math.sin(angle * 1.4) * 18;
        const rz = r.orbitCenter[2] + Math.sin(angle) * r.orbitRadius;
        if (Math.hypot(s.position[0] - rx, s.position[1] - ry, s.position[2] - rz) < 320) {
          hits++;
          return { ...r, hp: Math.max(0, r.hp - 120) };
        }
        return r;
      })
      .filter((r) => r.hp > 0);
    set({ raiders: nextRaiders });
    s.addLog(`EMP SHOCKWAVE DISCHARGED (${hits} HOSTILE CONTACTS HIT)`, hits > 0 ? 'success' : 'info');
    if (!s.unlockedAchievements.includes('ach-emp')) {
      set((prev) => ({ unlockedAchievements: [...prev.unlockedAchievements, 'ach-emp'], credits: prev.credits + 2000 }));
    }
  },

  triggerMicroJump: () => {
    const s = get();
    if (s.microJumpCooldown > 0 || s.fuel < 6 || s.dockedStationId || s.landedPlanetId) return;
    starshipAudio.playWarp();
    // Jump 180m along ship's forward vector (-Z rotated by ship quaternion)
    const [qx, qy, qz, qw] = s.quaternion;
    const fx = -2 * (qx * qz + qw * qy);
    const fy = -2 * (qy * qz - qw * qx);
    const fz = -(1 - 2 * (qx * qx + qy * qy));
    set({
      position: [s.position[0] + fx * 180, s.position[1] + fy * 180, s.position[2] + fz * 180],
      fuel: Math.max(0, s.fuel - 6),
      microJumpCooldown: 10,
    });
    s.addLog('MICRO-BLINK JUMP EXECUTED (+180m FORWARD, -6% FUEL)', 'success');
  },

  togglePointDefense: () => {
    const next = !get().pointDefenseOn;
    starshipAudio.playClick(next ? 880 : 420);
    set({ pointDefenseOn: next });
    get().addLog(`AUTOMATED POINT-DEFENSE TURRET ${next ? 'ONLINE' : 'STANDBY'}`, 'info');
  },

  toggleAutoMiner: () => {
    const next = !get().autoMinerOn;
    starshipAudio.playClick(next ? 880 : 420);
    set({ autoMinerOn: next });
    get().addLog(`AUTONOMOUS MINING DRONE SWARM ${next ? 'DEPLOYED' : 'RECALLED'}`, 'info');
  },

  deployReconSatellite: () => {
    const s = get();
    if (s.credits < 1200) {
      starshipAudio.playAlert('LOW');
      s.addLog('DEPLOYING RECON SATELLITE REQUIRES 1,200 CR', 'warn');
      return;
    }
    starshipAudio.playSuccess();
    const sat: DeployedSatellite = {
      id: `sat-${Date.now()}`,
      systemId: s.currentSystemId,
      position: [...s.position],
    };
    set({
      credits: s.credits - 1200,
      deployedSatellites: [...s.deployedSatellites, sat],
    });
    s.addLog('RECON SATELLITE DEPLOYED (+150 CR/MIN PASSIVE TELEMETRY)', 'success');
  },

  summonLeviathanBoss: () => {
    const s = get();
    if (s.raiders.some((r) => r.id === 'boss-leviathan')) {
      s.addLog('LEVIATHAN DREADNOUGHT IS ALREADY IN THIS SECTOR!', 'warn');
      return;
    }
    starshipAudio.playAlert('CRITICAL');
    const boss: RaiderDrone = {
      id: 'boss-leviathan',
      name: '☠ LEVIATHAN DREADNOUGHT (BOSS)',
      systemId: s.currentSystemId,
      orbitCenter: [s.position[0], s.position[1], s.position[2] - 140],
      orbitRadius: 65,
      orbitSpeed: 0.16,
      phase: 0,
      hp: 650,
      maxHp: 650,
      bounty: 25000,
    };
    set({ raiders: [...s.raiders, boss], bossActive: true });
    s.addLog('WARNING: LEVIATHAN DREADNOUGHT BOSS DETECTED — 25,000 CR BOUNTY!', 'alert');
  },

  tradeStock: (symbol, qty) => {
    const s = get();
    const st = s.stocks.find((x) => x.symbol === symbol);
    if (!st) return;
    if (qty > 0) {
      const cost = st.price * qty;
      if (s.credits < cost) {
        starshipAudio.playAlert('LOW');
        return;
      }
      starshipAudio.playClick(900);
      set({
        credits: s.credits - cost,
        stocks: s.stocks.map((x) => (x.symbol === symbol ? { ...x, owned: x.owned + qty } : x)),
      });
    } else if (qty < 0 && st.owned >= Math.abs(qty)) {
      const gain = st.price * Math.abs(qty);
      starshipAudio.playSuccess();
      set({
        credits: s.credits + gain,
        stocks: s.stocks.map((x) => (x.symbol === symbol ? { ...x, owned: x.owned + qty } : x)),
      });
    }
  },

  tickStockMarket: () => {
    const s = get();
    const nextStocks = s.stocks.map((st) => {
      const pct = (Math.random() - 0.48) * 7.5;
      const nextPrice = Math.max(80, Math.round(st.price * (1 + pct / 100)));
      return { ...st, price: nextPrice, change: Number(pct.toFixed(1)) };
    });
    // Passive Vault Interest + Recon Satellite Telemetry Income!
    const vaultInterest = Math.floor(s.bankVault * 0.008);
    const satIncome = s.deployedSatellites.length * 45;
    set({
      stocks: nextStocks,
      bankVault: s.bankVault + vaultInterest,
      credits: s.credits + satIncome,
    });
  },

  bankTransfer: (amount) => {
    const s = get();
    if (amount > 0 && s.credits >= amount) {
      starshipAudio.playClick(820);
      set({ credits: s.credits - amount, bankVault: s.bankVault + amount });
    } else if (amount < 0 && s.bankVault >= Math.abs(amount)) {
      starshipAudio.playSuccess();
      set({ credits: s.credits + Math.abs(amount), bankVault: s.bankVault + amount });
    }
  },

  hostHoloDeckParty: () => {
    const s = get();
    if (s.credits < 500) return;
    starshipAudio.playSuccess();
    set({
      credits: s.credits - 500,
      crew: s.crew.map((c) => ({ ...c, morale: 100, fatigue: 0, health: 100 })),
    });
    s.addLog('HOLO-DECK CREW BANQUET HOSTED — ALL CREW AT 100% MORALE & 0% FATIGUE!', 'success');
  },

  triggerFireSuppression: () => {
    const s = get();
    starshipAudio.playScan();
    set({ temperature: Math.max(290, s.temperature - 180) });
    s.addLog('HALON FIRE SUPPRESSION DEPLOYED — CORE TEMP DROPPED -180K', 'success');
  },

  checkAchievements: () => {
    const s = get();
    const checks: Array<[string, boolean]> = [
      ['ach-earth', s.landedPlanetId === 'earth' || s.playerMode === 'earth_surface'],
      ['ach-mach', s.peakSpeed >= 400],
      ['ach-hypersonic', s.peakSpeed >= 900],
      ['ach-miner', s.asteroidsMined >= 3],
      ['ach-raider', s.raidersDestroyed >= 2],
      ['ach-boss', s.bossActive && !s.raiders.some((r) => r.id === 'boss-leviathan')],
      ['ach-factory', s.factories.filter((f) => f.level > 0).length >= 2],
      ['ach-rich', s.credits >= 1_000_000],
      ['ach-sat', s.deployedSatellites.length >= 1],
      ['ach-stock', s.stocks.some((st) => st.owned > 0)],
      ['ach-xeno', s.xenoMods.length >= 1],
    ];
    let bonus = 0;
    const newlyUnlocked: string[] = [];
    for (const [id, ok] of checks) {
      if (ok && !s.unlockedAchievements.includes(id)) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          newlyUnlocked.push(id);
          bonus += def.reward;
          s.addLog(`🏆 ACHIEVEMENT UNLOCKED: ${def.title} (+${def.reward.toLocaleString()} CR)`, 'success');
        }
      }
    }
    if (newlyUnlocked.length > 0) {
      starshipAudio.playSuccess();
      set({
        unlockedAchievements: [...s.unlockedAchievements, ...newlyUnlocked],
        credits: s.credits + bonus,
      });
    }
  },

  startSpaceRace: () => {
    const s = get();
    starshipAudio.playSuccess();
    s.addLog('ORBITAL BOOST-RING RACE STARTED! FLY THROUGH ALL 6 GLOWING GATES FOR +15,000 CR!', 'success');
    set({
      currentSystemId: 'solaris-prime',
      playerMode: 'flight',
      activeView: 'bridge',
      dockedStationId: null,
      landedPlanetId: null,
      position: [0, 14, 15],
      velocity: [0, 0, -25],
      quaternion: [0, 0, 0, 1],
      raceActive: true,
      raceGateIndex: 0,
      raceTimer: 0,
    });
  },

  advanceRaceGate: () => {
    const s = get();
    if (!s.raceActive) return;
    starshipAudio.playSuccess();
    const nextIdx = s.raceGateIndex + 1;
    if (nextIdx >= SPACE_RACE_GATES.length) {
      const timeSec = Number(s.raceTimer.toFixed(1));
      const best = s.bestRaceTime === null ? timeSec : Math.min(s.bestRaceTime, timeSec);
      s.addLog(`🏁 RACE COMPLETE IN ${timeSec}s! (+15,000 CR, +400 XP)`, 'success');
      if (s.mpConnected) {
        s.sendFleetChat(`🏁 Finished the Orbital Boost-Ring Race in ${timeSec}s!`);
      }
      set({
        raceActive: false,
        raceGateIndex: 0,
        bestRaceTime: best,
        credits: s.credits + 15000,
        xp: s.xp + 400,
      });
    } else {
      s.addLog(`BOOST GATE ${nextIdx}/${SPACE_RACE_GATES.length} CLEARED! (+TURBO SURGE)`, 'info');
      set({ raceGateIndex: nextIdx });
    }
  },

  startCombatWave: () => {
    const s = get();
    const nextWave = s.combatWave + 1;
    starshipAudio.playAlert('MODERATE');
    const count = Math.min(5, 2 + nextWave);
    const spawned: RaiderDrone[] = [];
    for (let i = 0; i < count; i++) {
      spawned.push({
        id: `wave-${nextWave}-${i}-${Date.now()}`,
        name: `WAVE-${nextWave} GUNSHIP #${i + 1}`,
        systemId: s.currentSystemId,
        orbitCenter: [s.position[0], s.position[1], s.position[2] - 130],
        orbitRadius: 55 + i * 18,
        orbitSpeed: 0.28 + i * 0.04,
        phase: (i / count) * Math.PI * 2,
        hp: 80 + nextWave * 35,
        maxHp: 80 + nextWave * 35,
        bounty: 1400 + nextWave * 750,
      });
    }
    s.addLog(`⚔ COMBAT WAVE ${nextWave} INBOUND! (${count} RAIDER GUNSHIPS — DESTROY FOR MASSIVE BOUNTIES!)`, 'alert');
    if (s.mpConnected) {
      s.sendFleetChat(`⚔ Triggered Co-Op Combat Wave ${nextWave} (${count} gunships)!`);
    }
    set({ combatWave: nextWave, raiders: [...s.raiders, ...spawned] });
  },

  sendFleetCredits: (peerCallsign, amount) => {
    const s = get();
    if (!s.mpConnected || s.credits < amount) return;
    starshipAudio.playSuccess();
    set({ credits: s.credits - amount });
    multiplayerClient.send({
      type: 'coop_reward',
      room: s.mpRoom,
      sender: s.mpCallsign,
      missionTitle: `DIRECT CREDIT WIRE TO ${peerCallsign}`,
      credits: amount,
    });
    s.addLog(`WIRED ${amount.toLocaleString()} CR TO FLEET SQUAD`, 'success');
  },

  sendSquadPing: () => {
    const s = get();
    if (!s.mpConnected) return;
    starshipAudio.playRadio();
    s.dropWaypoint();
    s.sendFleetChat(`📍 SQUAD PING at [${Math.round(s.position[0])}, ${Math.round(s.position[1])}, ${Math.round(s.position[2])}] in ${s.currentSystemId.toUpperCase()}!`);
  },

  emergencyRefuelScoop: () => {
    const s = get();
    if (s.fuel >= 25) return;
    starshipAudio.playScan();
    s.addLog('EMERGENCY SOLAR RAMSCOOP ACTIVATED (+25% FUEL, +120K HEAT)', 'warn');
    set({ fuel: Math.min(100, s.fuel + 25), temperature: Math.min(1150, s.temperature + 120) });
  },

  triggerRandomEmergency: (force = false) => {
    const s = get();
    if (!force && s.activeEmergencies.length >= 1) return;
    const available = EMERGENCY_TEMPLATES.filter((t) => !s.activeEmergencies.some((a) => a.code === t.code));
    if (available.length === 0) return;

    const template = available[Math.floor(Math.random() * available.length)];
    const uid = `emg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newEmergency: ActiveEmergency = {
      ...template,
      uid,
      startedAt: formatTime(),
      diagnosed: false,
      isolated: false,
      backupEngaged: false,
      robotDispatched: false,
      repairProgress: 0,
    };

    const nextComponents = { ...s.components };
    if (template.affectedSystem === 'engines') nextComponents.engines = Math.max(25, nextComponents.engines - 38);
    if (template.affectedSystem === 'reactor') nextComponents.reactor = Math.max(30, nextComponents.reactor - 35);
    if (template.affectedSystem === 'comms') nextComponents.comms = Math.max(20, nextComponents.comms - 45);
    if (template.affectedSystem === 'sensors') nextComponents.sensors = Math.max(20, nextComponents.sensors - 45);
    if (template.affectedSystem === 'hull') nextComponents.hullPort = Math.max(30, nextComponents.hullPort - 35);
    if (template.affectedSystem === 'lifeSupport') nextComponents.lifeSupport = Math.max(30, nextComponents.lifeSupport - 35);

    const specialistRole =
      template.category === 'ENGINEERING'
        ? 'CHIEF ENGINEER'
        : template.category === 'LIFE SUPPORT'
          ? 'MEDICAL OFFICER'
          : template.category === 'NAVIGATION'
            ? 'SCIENCE OFFICER'
            : template.category === 'COMMUNICATIONS'
              ? 'COMMS OFFICER'
              : 'MAINTENANCE TECH';

    const updatedCrew = s.crew.map((c) => {
      if (c.role === specialistRole || c.role === 'MAINTENANCE TECH') {
        return {
          ...c,
          currentRoomId: template.compartmentId,
          status: 'RESPONDING' as const,
          currentTask: `Responding to ${template.title}`,
        };
      }
      return c;
    });

    starshipAudio.playAlert(template.severity);
    s.addLog(`EMERGENCY [${template.severity}]: ${template.title} IN ${template.compartmentId.toUpperCase()}`, 'alert');
    s.recordBlackBox(`EMERGENCY: ${template.title} (${template.severity})`);

    set({
      activeEmergencies: [newEmergency, ...s.activeEmergencies],
      components: nextComponents,
      crew: updatedCrew,
      redAlert: template.severity === 'CRITICAL' ? true : s.redAlert,
      navComputerOnline: template.affectedSystem === 'navComputer' ? false : s.navComputerOnline,
      commsOnline: template.affectedSystem === 'comms' ? false : s.commsOnline,
    });
  },

  diagnoseEmergency: (uid) => {
    starshipAudio.playScan();
    set((s) => ({
      activeEmergencies: s.activeEmergencies.map((e) =>
        e.uid === uid ? { ...e, diagnosed: true, repairProgress: Math.min(100, e.repairProgress + 18) } : e
      ),
    }));
    get().addLog('EMERGENCY DIAGNOSTIC COMPLETE — FAULT VECTOR MAPPED', 'info');
  },

  isolateEmergency: (uid) => {
    starshipAudio.playClick(640);
    set((s) => ({
      activeEmergencies: s.activeEmergencies.map((e) =>
        e.uid === uid ? { ...e, isolated: true, repairProgress: Math.min(100, e.repairProgress + 20) } : e
      ),
    }));
    get().addLog('DAMAGED CIRCUIT / COMPARTMENT ISOLATED — CONSEQUENCE SEVERITY HALVED', 'success');
  },

  engageBackupForEmergency: (uid) => {
    starshipAudio.playClick(820);
    set((s) => ({
      backupGeneratorOnline: true,
      activeEmergencies: s.activeEmergencies.map((e) =>
        e.uid === uid ? { ...e, backupEngaged: true, repairProgress: Math.min(100, e.repairProgress + 15) } : e
      ),
    }));
    get().addLog('BACKUP GENERATOR & AUXILIARY BUS ROUTED TO AFFECTED SYSTEM', 'info');
  },

  dispatchRobotToEmergency: (uid) => {
    const s = get();
    const emg = s.activeEmergencies.find((e) => e.uid === uid);
    if (!emg) return;
    const freeBot = s.robots.find((r) => r.status === 'DOCKED');
    if (!freeBot) {
      starshipAudio.playAlert('LOW');
      s.addLog('ALL MAINTENANCE ROBOTS CURRENTLY DEPLOYED', 'warn');
      return;
    }
    starshipAudio.playClick(920);
    s.addLog(`${freeBot.name} DISPATCHED TO ${emg.compartmentId.toUpperCase()}`, 'success');
    set({
      robots: s.robots.map((r) =>
        r.id === freeBot.id
          ? { ...r, status: 'DISPATCHED', assignedRoomId: emg.compartmentId, targetEmergencyUid: uid }
          : r
      ),
      activeEmergencies: s.activeEmergencies.map((e) =>
        e.uid === uid ? { ...e, robotDispatched: true } : e
      ),
    });
  },

  manualRepairEmergency: (uid) => {
    const s = get();
    const emg = s.activeEmergencies.find((e) => e.uid === uid);
    if (!emg) return;
    starshipAudio.playWeld();
    const nextProg = Math.min(100, emg.repairProgress + 34);
    if (nextProg >= 100) {
      const record: ResolvedEmergencyRecord = {
        uid: emg.uid,
        code: emg.code,
        title: emg.title,
        category: emg.category,
        severity: emg.severity,
        startedAt: emg.startedAt,
        resolvedAt: formatTime(),
      };
      const remaining = s.activeEmergencies.filter((e) => e.uid !== uid);
      const restoredComps = { ...s.components };
      if (emg.affectedSystem === 'engines') restoredComps.engines = 100;
      if (emg.affectedSystem === 'reactor' || emg.affectedSystem === 'cooling' || emg.affectedSystem === 'powerBus') {
        restoredComps.reactor = 100;
      }
      if (emg.affectedSystem === 'comms') restoredComps.comms = 100;
      if (emg.affectedSystem === 'sensors' || emg.affectedSystem === 'navComputer') restoredComps.sensors = 100;
      if (emg.affectedSystem === 'hull' || emg.affectedSystem === 'airlock') {
        restoredComps.hullPort = 100;
        restoredComps.doors = 100;
      }
      if (
        emg.affectedSystem === 'lifeSupport' ||
        emg.affectedSystem === 'airFiltration' ||
        emg.affectedSystem === 'waterRecycling'
      ) {
        restoredComps.lifeSupport = 100;
      }

      starshipAudio.playSuccess();
      s.addLog(`EMERGENCY RESOLVED: ${emg.title} — COMPONENT INTEGRITY RESTORED TO 100%`, 'success');
      s.addMaintenanceRecord(emg.affectedSystem.toUpperCase(), `Resolved ${emg.title} (100% integrity)`, 'COMMAND & CREW');
      set({
        activeEmergencies: remaining,
        emergencyHistory: [record, ...s.emergencyHistory],
        components: restoredComps,
        engineHealth: emg.affectedSystem === 'engines' ? Math.max(s.engineHealth, 100) : s.engineHealth,
        redAlert: remaining.some((e) => e.severity === 'CRITICAL'),
        navComputerOnline: emg.affectedSystem === 'navComputer' ? true : s.navComputerOnline,
        commsOnline: emg.affectedSystem === 'comms' ? true : s.commsOnline,
        robots: s.robots.map((r) =>
          r.targetEmergencyUid === uid
            ? { ...r, status: 'DOCKED', assignedRoomId: 'maintenance-room', targetEmergencyUid: null }
            : r
        ),
        crew: s.crew.map((c) =>
          c.status === 'RESPONDING'
            ? { ...c, currentRoomId: c.homeRoomId, status: 'ON DUTY', currentTask: 'Resumed nominal watch' }
            : c
        ),
      });
    } else {
      set({
        activeEmergencies: s.activeEmergencies.map((e) =>
          e.uid === uid ? { ...e, repairProgress: nextProg } : e
        ),
      });
    }
  },

  evaWeldComponent: (comp) => {
    const s = get();
    starshipAudio.playWeld();
    const nextVal = Math.min(100, s.components[comp] + 28);
    const nextComps = { ...s.components, [comp]: nextVal };
    let hullBoost = s.hull;
    if (comp === 'hullPort' || comp === 'hullStarboard') hullBoost = Math.min(100, s.hull + 14);
    const engBoost = comp === 'engines' ? Math.min(100, s.engineHealth + 18) : s.engineHealth;

    if (nextVal >= 100 && s.components[comp] < 100) {
      starshipAudio.playSuccess();
      s.addLog(`EVA WELD COMPLETE: ${comp.toUpperCase()} RESTORED TO 100%`, 'success');
      s.addMaintenanceRecord(comp.toUpperCase(), 'External EVA plasma weld repair', 'COMMANDER (EVA)');
    }
    set({ components: nextComps, hull: hullBoost, engineHealth: engBoost });
  },

  assignCrewToRoom: (crewId, roomId, task) => {
    starshipAudio.playClick(720);
    set((s) => ({
      crew: s.crew.map((c) =>
        c.id === crewId ? { ...c, currentRoomId: roomId, status: 'ON DUTY', currentTask: task } : c
      ),
    }));
  },

  restCrewMember: (crewId) => {
    starshipAudio.playClick(600);
    set((s) => ({
      crew: s.crew.map((c) =>
        c.id === crewId
          ? {
              ...c,
              currentRoomId: 'crew-quarters',
              status: 'RESTING',
              fatigue: Math.max(0, c.fatigue - 35),
              morale: Math.min(100, c.morale + 12),
              currentTask: 'Off-shift rest cycle in Crew Quarters',
            }
          : c
      ),
    }));
  },

  treatCrewMember: (crewId) => {
    starshipAudio.playSuccess();
    set((s) => ({
      crew: s.crew.map((c) =>
        c.id === crewId
          ? { ...c, health: 100, fatigue: Math.max(0, c.fatigue - 20), status: 'ON DUTY', currentRoomId: 'medical-bay' }
          : c
      ),
    }));
    get().addLog('MEDICAL BAY BIOBED TREATMENT COMPLETED', 'success');
  },

  toggleRoomLock: (roomId) => {
    starshipAudio.playDoor();
    set((s) => {
      const locked = s.lockedRooms.includes(roomId);
      return {
        lockedRooms: locked ? s.lockedRooms.filter((r) => r !== roomId) : [...s.lockedRooms, roomId],
      };
    });
  },

  toggleEscapePods: () => {
    const next = !get().escapePodsArmed;
    starshipAudio.playAlert(next ? 'MODERATE' : 'LOW');
    get().addLog(`ESCAPE PODS ${next ? 'ARMED FOR EMERGENCY EVACUATION' : 'DISARMED / STANDBY'}`, next ? 'warn' : 'info');
    set({ escapePodsArmed: next });
  },

  togglePodLid: (idx) => {
    starshipAudio.playDoor();
    set((s) => ({ openPodIndex: s.openPodIndex === idx ? null : idx }));
  },

  launchEscapePod: (idx) => {
    starshipAudio.playWarp();
    const s = get();
    s.addLog(`CP-12 ESCAPE POD #${idx + 1} EJECTED — EMERGENCY THRUSTERS FIRING!`, 'alert');
    s.recordBlackBox(`EJECTED IN CP-12 ESCAPE POD #${idx + 1}`);
    set({ playerMode: 'escape_pod', activeView: 'bridge', openPodIndex: null });
  },

  recoverFromEscapePod: () => {
    starshipAudio.playSuccess();
    get().addLog('ORBITAL RESCUE COMPLETE — RETURNED TO STARSHIP BRIDGE', 'success');
    set({ playerMode: 'flight', activeView: 'bridge' });
  },

  sendCommHail: (recipient) => {
    const s = get();
    if (!s.commsOnline) {
      starshipAudio.playAlert('MODERATE');
      s.addLog('TRANSMISSION FAILED: SUBSPACE COMMUNICATIONS OFFLINE', 'alert');
      return;
    }
    starshipAudio.playRadio();
    const replies: Record<string, string> = {
      'MISSION CONTROL': 'Copy USS Hyperion. Telemetry received loud and clear. Continue sector survey and report anomalies.',
      'NEAREST STATION': 'Approach docking ring within 95m and engage clamps [X]. Refuel, repair, and trade bay are standing by.',
      'DISTRESS BROADCAST': 'Automated subspace echo received. No hostile contacts detected in immediate sector.',
    };
    const msg: CommMessage = {
      id: `comm-${Date.now()}`,
      sender: recipient,
      channel: 'SUBSPACE-LIVE',
      time: formatTime(),
      body: replies[recipient] || 'Signal acknowledged by orbital relay.',
    };
    set({ commsInbox: [msg, ...s.commsInbox].slice(0, 20) });
    s.addLog(`COMM REPLY RECEIVED FROM ${recipient}`, 'success');
  },

  tradeCargo: (item, delta, unitPrice) => {
    const s = get();
    if (!s.dockedStationId) {
      starshipAudio.playAlert('LOW');
      s.addLog('CARGO TRADING REQUIRES DOCKING AT A SPACE STATION', 'warn');
      return;
    }
    const currentQty = s.cargo[item];
    if (delta > 0) {
      const cost = delta * unitPrice;
      if (s.credits < cost) {
        starshipAudio.playAlert('LOW');
        return;
      }
      starshipAudio.playClick(880);
      set({
        credits: s.credits - cost,
        cargo: { ...s.cargo, [item]: currentQty + delta },
      });
    } else if (delta < 0 && currentQty >= Math.abs(delta)) {
      const gain = Math.abs(delta) * unitPrice;
      starshipAudio.playSuccess();
      set({
        credits: s.credits + gain,
        cargo: { ...s.cargo, [item]: currentQty + delta },
      });
    }
  },

  setShipCustomization: (name, liveryId) => {
    starshipAudio.playClick(760);
    set({ shipName: name.trim() || 'USS HYPERION', liveryId });
    get().addLog(`HULL REGISTRY & LIVERY UPDATED: ${name.toUpperCase()}`, 'info');
  },

  setActiveMission: (id) => {
    starshipAudio.playClick(760);
    const m = get().missions.find((x) => x.id === id);
    if (m && m.targetSystemId === get().currentSystemId && m.targetObjectId) {
      set({ activeMissionId: id, selectedTargetId: m.targetObjectId });
    } else {
      set({ activeMissionId: id });
    }
  },

  generateNewMission: () => {
    const s = get();
    const next = generateDynamicMission(s.missions.length);
    starshipAudio.playRadio();
    s.addLog(`NEW CONTRACT GENERATED: ${next.title} (+${next.rewardCredits} CR)`, 'success');
    set({ missions: [next, ...s.missions], activeMissionId: next.id });
  },

  runFullDiagnostic: () => {
    const s = get();
    starshipAudio.playScan();
    const avgComp = Math.round(
      Object.values(s.components).reduce((a, b) => a + b, 0) / Object.values(s.components).length
    );
    const report = `DIAGNOSTIC COMPLETE // HULL ${Math.round(s.hull)}% | AVG SUBSYSTEMS ${avgComp}% | FUEL CORES: ${s.deuteriumCores} | COOLANT CANS: ${s.coolantCanisters} | ACTIVE EMERGENCIES: ${s.activeEmergencies.length}`;
    s.addLog(report, s.activeEmergencies.length > 0 ? 'warn' : 'success');
    return report;
  },

  addLog: (message, level = 'info') => {
    set((s) => ({
      logs: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: formatTime(),
          message,
          level,
        },
        ...s.logs,
      ].slice(0, 32),
    }));
  },

  recordBlackBox: (event) => {
    const s = get();
    const sys = getStarSystem(s.currentSystemId);
    set({
      blackBox: [
        {
          time: formatTime(),
          sector: sys.name,
          event,
          speed: Math.round(s.speed),
          hull: Math.round(s.hull),
        },
        ...s.blackBox,
      ].slice(0, 40),
    });
  },

  addMaintenanceRecord: (system, action, performedBy) => {
    set((s) => ({
      maintenanceHistory: [
        {
          id: `mnt-${Date.now()}`,
          time: formatTime(),
          system,
          action,
          performedBy,
        },
        ...s.maintenanceHistory,
      ].slice(0, 30),
    }));
  },

  saveGame: (silent = false) => {
    const s = get();
    const payload = {
      version: 5,
      savedAt: Date.now(),
      // Identity, Customization & Earth Parts
      shipName: s.shipName,
      shipRegistry: s.shipRegistry,
      liveryId: s.liveryId,
      shipClass: s.shipClass,
      ownedShipClasses: s.ownedShipClasses,
      installedEngineId: s.installedEngineId,
      ownedEngines: s.ownedEngines,
      engineConfig: s.engineConfig,
      roofPart: s.roofPart,
      aeroPart: s.aeroPart,
      nosePart: s.nosePart,
      boosterPart: s.boosterPart,
      xenoMods: s.xenoMods,
      underglowColor: s.underglowColor,
      ownedParts: s.ownedParts,
      hudTheme: s.hudTheme,
      earthWeather: s.earthWeather,

      // Earth Factories, Economy & Cargo
      factories: s.factories,
      cargoBayLevel: s.cargoBayLevel,
      roboticArmOverdrive: s.roboticArmOverdrive,
      stocks: s.stocks,
      bankVault: s.bankVault,
      credits: s.credits,
      cargo: s.cargo,

      // Position, Mode & Ship State
      currentSystemId: s.currentSystemId,
      position: s.position,
      quaternion: s.quaternion,
      landedPlanetId: s.landedPlanetId,
      dockedStationId: s.dockedStationId,
      playerMode:
        s.playerMode === 'earth_cutscene'
          ? 'earth_surface'
          : s.playerMode === 'earth_liftoff'
            ? 'flight'
            : s.playerMode,
      bestRaceTime: s.bestRaceTime,
      combatWave: s.combatWave,
      hull: s.hull,
      shields: s.shields,
      fuel: s.fuel,
      oxygen: s.oxygen,
      coolantReserve: s.coolantReserve,
      deuteriumCores: s.deuteriumCores,
      coolantCanisters: s.coolantCanisters,
      boostCells: s.boostCells,
      torpedoes: s.torpedoes,
      upgrades: s.upgrades,
      engineHealth: s.engineHealth,
      components: s.components,
      reactorThrottle: s.reactorThrottle,
      power: s.power,

      // World Objects, Missions & Career
      deployedSatellites: s.deployedSatellites,
      waypoints: s.waypoints,
      xp: s.xp,
      peakSpeed: s.peakSpeed,
      raidersDestroyed: s.raidersDestroyed,
      asteroidsMined: s.asteroidsMined,
      unlockedAchievements: s.unlockedAchievements,
      missions: s.missions,
      activeMissionId: s.activeMissionId,
      discoveries: s.discoveries,
      scannedObjects: s.scannedObjects,
      discoveredSystems: s.discoveredSystems,
      crew: s.crew,
      emergencyHistory: s.emergencyHistory,
      maintenanceHistory: s.maintenanceHistory,
      blackBox: s.blackBox,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      if (!silent) {
        starshipAudio.playSuccess();
        s.addLog('FULL SIMULATION STATE SAVED (SHIP, EARTH PARTS, FACTORIES & WORLD)', 'success');
      }
    } catch {
      if (!silent) s.addLog('SAVE FAILED: LOCAL STORAGE UNAVAILABLE', 'alert');
    }
  },

  loadGame: (silent = false) => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);

      // Merge any newly added story/deep-space missions into older saves
      const savedMissions: Mission[] = Array.isArray(data.missions) ? data.missions : [];
      const mergedMissions = [
        ...savedMissions,
        ...INITIAL_MISSIONS.filter((m) => !savedMissions.some((sm) => sm.id === m.id)),
      ];

      set({
        ...data,
        missions: mergedMissions,
        velocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        throttle: 0,
        autopilot: false,
        hyperCruise: false,
      });

      // Re-apply saved HUD color theme CSS variables
      if (data.hudTheme) {
        get().setHudTheme(data.hudTheme);
      }

      if (!silent) {
        starshipAudio.playSuccess();
        get().addLog('FULL SAVED SIMULATION RESTORED (EARTH PARTS, FACTORIES & WORLD)', 'success');
      }
      return true;
    } catch {
      return false;
    }
  },

  clearSavedGame: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
      starshipAudio.playAlert('LOW');
      get().addLog('LOCAL SAVE DATA CLEARED — REFRESH TO START FRESH', 'warn');
    } catch {
      // ignore
    }
  },

  resetShip: () => {
    starshipAudio.playSuccess();
    set({
      playerMode: 'flight',
      position: [0, 10, 40],
      velocity: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      angularVelocity: [0, 0, 0],
      speed: 0,
      throttle: 0,
      hull: 100,
      shields: 100,
      fuel: 100,
      oxygen: 100,
      coolantReserve: 100,
      temperature: 345,
      engineHealth: 100,
      backupBattery: 100,
      enginesOnline: true,
      shieldsOnline: true,
      lifeSupportOnline: true,
      commsOnline: true,
      navComputerOnline: true,
      autopilot: false,
      dockedStationId: null,
      landedPlanetId: null,
      redAlert: false,
      activeEmergencies: [],
      components: {
        engines: 100,
        reactor: 100,
        comms: 100,
        sensors: 100,
        hullPort: 100,
        hullStarboard: 100,
        lifeSupport: 100,
        doors: 100,
      },
    });
    get().addLog('EMERGENCY RECONSTRUCTION COMPLETE — VESSEL RESTORED AT SECTOR ORIGIN', 'success');
  },

  applyTick: (partial) => set(partial),
}));
