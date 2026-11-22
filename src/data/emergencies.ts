export type EmergencyCategory =
  | 'ENGINEERING'
  | 'SHIP STRUCTURE'
  | 'LIFE SUPPORT'
  | 'NAVIGATION'
  | 'COMMUNICATIONS';

export type EmergencySeverity = 'LOW' | 'MODERATE' | 'CRITICAL';

export type AffectedSystemKey =
  | 'reactor'
  | 'engines'
  | 'powerBus'
  | 'cooling'
  | 'fuelSystem'
  | 'hull'
  | 'airlock'
  | 'lifeSupport'
  | 'airFiltration'
  | 'waterRecycling'
  | 'navComputer'
  | 'sensors'
  | 'comms';

export interface EmergencyTemplate {
  code: string;
  title: string;
  category: EmergencyCategory;
  severity: EmergencySeverity;
  compartmentId: string;
  affectedSystem: AffectedSystemKey;
  description: string;
  recommendedAction: string;
  consequenceSummary: string;
  requiredRepair: number; // 0..100 progress needed
}

export interface ActiveEmergency extends EmergencyTemplate {
  uid: string;
  startedAt: string;
  diagnosed: boolean;
  isolated: boolean;
  backupEngaged: boolean;
  robotDispatched: boolean;
  repairProgress: number; // 0..100
}

export interface ResolvedEmergencyRecord {
  uid: string;
  code: string;
  title: string;
  category: EmergencyCategory;
  severity: EmergencySeverity;
  startedAt: string;
  resolvedAt: string;
}

export const EMERGENCY_TEMPLATES: EmergencyTemplate[] = [
  // ENGINEERING
  {
    code: 'ENG-01',
    title: 'REACTOR CORE OVERHEATING',
    category: 'ENGINEERING',
    severity: 'CRITICAL',
    compartmentId: 'reactor-room',
    affectedSystem: 'reactor',
    description: 'Magnetic containment coils are drifting out of phase, causing rapid thermal runaway in the fusion core.',
    recommendedAction: 'Diagnose core, flush coolant, engage Backup Generator, and dispatch Maintenance Robot.',
    consequenceSummary: 'Core temp rises rapidly; reactor output capped until stabilized.',
    requiredRepair: 100,
  },
  {
    code: 'ENG-02',
    title: 'THRUSTER INJECTOR MALFUNCTION',
    category: 'ENGINEERING',
    severity: 'MODERATE',
    compartmentId: 'main-engineering',
    affectedSystem: 'engines',
    description: 'Port plasma injector manifold is misfiring, reducing net propulsion efficiency by 45%.',
    recommendedAction: 'Isolate faulty manifold and dispatch Engineering crew or repair drone.',
    consequenceSummary: 'Max thrust and acceleration reduced by 45%.',
    requiredRepair: 100,
  },
  {
    code: 'ENG-03',
    title: 'POWER DISTRIBUTION BUS FAULT',
    category: 'ENGINEERING',
    severity: 'CRITICAL',
    compartmentId: 'main-engineering',
    affectedSystem: 'powerBus',
    description: 'Primary electrical bus relay tripped from harmonic overload. Auxiliary circuits are browning out.',
    recommendedAction: 'Activate Backup Generator, isolate damaged bus, and repair relay.',
    consequenceSummary: 'Total power efficiency drops 35% unless Backup Generator is active.',
    requiredRepair: 100,
  },
  {
    code: 'ENG-04',
    title: 'COOLING LOOP PRESSURE DROP',
    category: 'ENGINEERING',
    severity: 'MODERATE',
    compartmentId: 'reactor-room',
    affectedSystem: 'cooling',
    description: 'Micro-fracture in the liquid helium heat exchanger is slowing passive thermal dissipation.',
    recommendedAction: 'Diagnose loop and dispatch maintenance robot to seal exchanger.',
    consequenceSummary: 'Passive cooling reduced by 60%; engine heat builds faster.',
    requiredRepair: 100,
  },
  {
    code: 'ENG-05',
    title: 'DEUTERIUM FUEL LINE LEAK',
    category: 'ENGINEERING',
    severity: 'MODERATE',
    compartmentId: 'main-engineering',
    affectedSystem: 'fuelSystem',
    description: 'Cryo-valve seal failure is venting deuterium reserves into space.',
    recommendedAction: 'Isolate fuel line immediately and conduct field repair.',
    consequenceSummary: 'Continuous fuel bleed until isolated or repaired.',
    requiredRepair: 100,
  },

  // SHIP STRUCTURE
  {
    code: 'STR-01',
    title: 'COMPARTMENT PRESSURE LOSS',
    category: 'SHIP STRUCTURE',
    severity: 'CRITICAL',
    compartmentId: 'cargo-bay',
    affectedSystem: 'hull',
    description: 'Micrometeoroid puncture in Cargo Bay bulkhead is venting internal atmosphere.',
    recommendedAction: 'Isolate compartment bulkheads and dispatch Maintenance Robot or perform EVA hull patch.',
    consequenceSummary: 'Oxygen reserve drains rapidly and hull integrity degrades.',
    requiredRepair: 100,
  },
  {
    code: 'STR-02',
    title: 'AIRLOCK SEAL DEGRADATION',
    category: 'SHIP STRUCTURE',
    severity: 'LOW',
    compartmentId: 'airlock',
    affectedSystem: 'airlock',
    description: 'Outer EVA hatch magnetic gasket is showing intermittent micro-leaks.',
    recommendedAction: 'Diagnose hatch seal and run automated repair cycle.',
    consequenceSummary: 'Minor O2 bleed; EVA hatch requires seal patch.',
    requiredRepair: 100,
  },

  // LIFE SUPPORT
  {
    code: 'LIF-01',
    title: 'OXYGEN GENERATOR FAILURE',
    category: 'LIFE SUPPORT',
    severity: 'CRITICAL',
    compartmentId: 'medical-bay',
    affectedSystem: 'lifeSupport',
    description: 'Electrolysis O2 scrubbers stalled due to catalyst contamination.',
    recommendedAction: 'Engage Backup Life Support circuit and dispatch technician/robot.',
    consequenceSummary: 'Oxygen generation halted; reserves decline continuously.',
    requiredRepair: 100,
  },
  {
    code: 'LIF-02',
    title: 'AIR FILTRATION CO2 BUILDUP',
    category: 'LIFE SUPPORT',
    severity: 'MODERATE',
    compartmentId: 'crew-quarters',
    affectedSystem: 'airFiltration',
    description: 'Atmospheric carbon scrubber efficiency dropped below 40% in Crew Quarters.',
    recommendedAction: 'Isolate vent loop, engage backup scrubbers, and repair filter array.',
    consequenceSummary: 'Crew fatigue increases faster and morale drops.',
    requiredRepair: 100,
  },
  {
    code: 'LIF-03',
    title: 'WATER RECYCLING SYSTEM FAULT',
    category: 'LIFE SUPPORT',
    severity: 'LOW',
    compartmentId: 'crew-quarters',
    affectedSystem: 'waterRecycling',
    description: 'Osmosis pump bearing seized in the potable water reclamation unit.',
    recommendedAction: 'Diagnose pump and repair in Engineering or via Maintenance Robot.',
    consequenceSummary: 'Gradual crew morale reduction until restored.',
    requiredRepair: 100,
  },

  // NAVIGATION
  {
    code: 'NAV-01',
    title: 'NAVIGATION COMPUTER DESYNC',
    category: 'NAVIGATION',
    severity: 'MODERATE',
    compartmentId: 'navigation-room',
    affectedSystem: 'navComputer',
    description: 'Star-tracker gyroscopes have drifted, disabling automated course plotting.',
    recommendedAction: 'Diagnose nav core and recalibrate via Navigation/Emergency console.',
    consequenceSummary: 'Autopilot disabled until Nav Computer is restored.',
    requiredRepair: 100,
  },
  {
    code: 'NAV-02',
    title: 'SENSOR ARRAY INTERFERENCE',
    category: 'NAVIGATION',
    severity: 'MODERATE',
    compartmentId: 'science-lab',
    affectedSystem: 'sensors',
    description: 'External particle burst overloaded the forward phased-array radar transceivers.',
    recommendedAction: 'Isolate surge relay and repair external sensor node (or dispatch robot).',
    consequenceSummary: 'Radar range halved and Deep Scan disabled.',
    requiredRepair: 100,
  },

  // COMMUNICATIONS
  {
    code: 'COM-01',
    title: 'SUBSPACE ANTENNA MISALIGNMENT',
    category: 'COMMUNICATIONS',
    severity: 'LOW',
    compartmentId: 'comms-room',
    affectedSystem: 'comms',
    description: 'High-gain dorsal dish actuator jammed during orbital maneuver.',
    recommendedAction: 'Diagnose actuator and repair via Maintenance Robot or EVA spacewalk.',
    consequenceSummary: 'Station hails and mission control uplinks offline.',
    requiredRepair: 100,
  },
];

