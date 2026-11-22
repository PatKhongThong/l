import { STAR_SYSTEMS } from './starSystems';

export type MissionActionType = 'dock' | 'scan' | 'deliver' | 'visit_system' | 'land' | 'mine' | 'bounty';

export interface Mission {
  id: string;
  title: string;
  code: string;
  category: 'EXPLORATION' | 'SIGNAL' | 'LOGISTICS' | 'RECON' | 'RESCUE' | 'SCIENCE' | 'BOUNTY' | 'MINING' | 'CO-OP';
  description: string;
  objectiveText: string;
  targetSystemId: string;
  targetObjectId?: string;
  actionType: MissionActionType;
  targetCount?: number;
  progress?: number;
  rewardCredits: number;
  rewardXp?: number;
  isCoop?: boolean;
  completed: boolean;
  completedAt?: string;
}

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-shakedown',
    title: 'ORBITAL SHAKEDOWN',
    code: 'OPS-01',
    category: 'LOGISTICS',
    description: 'Command requests a flight systems check and supply pickup at Vanguard Orbital in Solaris Prime.',
    objectiveText: 'Approach Vanguard Orbital (< 95m) and engage DOCK [X].',
    targetSystemId: 'solaris-prime',
    targetObjectId: 'vanguard-orbital',
    actionType: 'dock',
    rewardCredits: 1200,
    rewardXp: 150,
    completed: false,
  },
  {
    id: 'm-earth-landing',
    title: 'TERRAN SHIPYARD TOUCHDOWN',
    code: 'OPS-02',
    category: 'EXPLORATION',
    description: 'Perform a surface landing check at Earth Heavy Shipyards to verify planetary descent protocols.',
    objectiveText: 'Approach EARTH in Solaris Prime (< 115m) and press LAND [L].',
    targetSystemId: 'solaris-prime',
    targetObjectId: 'earth',
    actionType: 'land',
    rewardCredits: 1600,
    rewardXp: 200,
    completed: false,
  },
  {
    id: 'm-mining-quota',
    title: 'CINDER BELT ORE HARVEST',
    code: 'MIN-03',
    category: 'MINING',
    description: 'Extract raw Deuterium or Titanium from asteroids in the Cinder Belt using your Industrial Mining Laser.',
    objectiveText: 'Mine 3 asteroids using MINE [M] within 105m of any asteroid.',
    targetSystemId: 'solaris-prime',
    actionType: 'mine',
    targetCount: 3,
    progress: 0,
    rewardCredits: 2200,
    rewardXp: 260,
    completed: false,
  },
  {
    id: 'm-bounty-raiders',
    title: 'PIRATE RAIDER INTERCEPT',
    code: 'BNT-04',
    category: 'BOUNTY',
    description: 'Rogue Raider Drones have been harassing freighters. Destroy 2 hostile Raider Drones using Pulse Cannons [B] or Torpedoes [T].',
    objectiveText: 'Destroy 2 Hostile Raider Drones in any sector.',
    targetSystemId: 'solaris-prime',
    actionType: 'bounty',
    targetCount: 2,
    progress: 0,
    rewardCredits: 3600,
    rewardXp: 400,
    isCoop: true,
    completed: false,
  },
  {
    id: 'm-signal-k9',
    title: 'UNIDENTIFIED SIGNAL K-9',
    code: 'SIG-05',
    category: 'SIGNAL',
    description: 'Long-range arrays detected an anomalous encrypted beacon inside the Cinder Belt of Solaris Prime.',
    objectiveText: 'Fly within scan range of Derelict Relay K-9 and run DEEP SCAN [R].',
    targetSystemId: 'solaris-prime',
    targetObjectId: 'relay-k9',
    actionType: 'scan',
    rewardCredits: 2400,
    rewardXp: 280,
    completed: false,
  },
  {
    id: 'm-commsat-repair',
    title: 'COMMSAT ALPHA-3 CALIBRATION',
    code: 'SCI-06',
    category: 'SCIENCE',
    description: 'Orbital relay CommSat Alpha-3 is drifting out of sync. Perform a close-range diagnostic scan to recalibrate its dish.',
    objectiveText: 'Approach CommSat Alpha-3 in Solaris Prime and execute DEEP SCAN [R].',
    targetSystemId: 'solaris-prime',
    targetObjectId: 'commsat-a3',
    actionType: 'scan',
    rewardCredits: 1850,
    rewardXp: 220,
    completed: false,
  },
  {
    id: 'm-supply-vela',
    title: 'FRONTIER SUPPLY RUN',
    code: 'LOG-07',
    category: 'LOGISTICS',
    description: 'Helios Mining Outpost in the Vela Nebula is running low on cryo-meds. Walk to Nav Room, jump to Vela Nebula, and dock.',
    objectiveText: 'Jump to Vela Nebula via Nav Room STARMAP and DOCK at Helios Mining Outpost.',
    targetSystemId: 'vela-nebula',
    targetObjectId: 'helios-outpost',
    actionType: 'dock',
    rewardCredits: 3800,
    rewardXp: 420,
    completed: false,
  },
  {
    id: 'm-ghost-station',
    title: 'GHOST OF SS-MERIDIAN',
    code: 'RCN-08',
    category: 'RECON',
    description: 'The abandoned science station SS-Meridian in Kepler Reach has reactivated its distress beacon. Investigate the wreckage.',
    objectiveText: 'Travel to Kepler Reach and DEEP SCAN Abandoned Station SS-Meridian.',
    targetSystemId: 'kepler-reach',
    targetObjectId: 'ss-meridian',
    actionType: 'scan',
    rewardCredits: 5200,
    rewardXp: 550,
    isCoop: true,
    completed: false,
  },
  {
    id: 'm-obsidian-gate',
    title: 'EDGE OF THE VOID (CO-OP)',
    code: 'EXP-09',
    category: 'CO-OP',
    description: 'Chart the uncharted Nyx Abyss pulsar sector and perform a quantum scan of the Obsidian Gate megastructure.',
    objectiveText: 'Jump to Nyx Abyss and DEEP SCAN The Obsidian Gate (Shared Co-Op Payout!).',
    targetSystemId: 'nyx-abyss',
    targetObjectId: 'obsidian-gate',
    actionType: 'scan',
    rewardCredits: 9500,
    rewardXp: 900,
    isCoop: true,
    completed: false,
  },
];

export function generateDynamicMission(existingCount: number): Mission {
  const roll = Math.random();
  const codeNum = String(existingCount + 1).padStart(2, '0');

  if (roll < 0.28) {
    const count = 2 + Math.floor(Math.random() * 2);
    return {
      id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: `CO-OP BOUNTY: RAIDER SQUADRON`,
      code: `BNT-${codeNum}`,
      category: 'CO-OP',
      description: 'Fleet Command posted an urgent shared bounty on rogue Raider Drones operating in local asteroid belts.',
      objectiveText: `Destroy ${count} Hostile Raider Drones with [B] Cannons or [T] Torpedoes.`,
      targetSystemId: 'solaris-prime',
      actionType: 'bounty',
      targetCount: count,
      progress: 0,
      rewardCredits: 2800 + count * 900,
      rewardXp: 350,
      isCoop: true,
      completed: false,
    };
  }

  if (roll < 0.52) {
    const count = 3 + Math.floor(Math.random() * 3);
    return {
      id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: `DEEP BELT MINING CONTRACT`,
      code: `MIN-${codeNum}`,
      category: 'MINING',
      description: 'Terran Shipyards need fresh Titanium and Deuterium ore from asteroid belts.',
      objectiveText: `Mine ${count} asteroids with MINE [M].`,
      targetSystemId: 'solaris-prime',
      actionType: 'mine',
      targetCount: count,
      progress: 0,
      rewardCredits: 1800 + count * 500,
      rewardXp: 240,
      completed: false,
    };
  }

  const sys = STAR_SYSTEMS[Math.floor(Math.random() * STAR_SYSTEMS.length)];
  const targets = sys.objects.filter((o) => o.type !== 'star');
  const target = targets[Math.floor(Math.random() * targets.length)];

  if (target.dockable) {
    return {
      id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: `CO-OP RELIEF TO ${target.name}`,
      code: `LOG-${codeNum}`,
      category: 'RESCUE',
      description: `Emergency medical & reactor parts requested by ${target.name} in ${sys.name}.`,
      objectiveText: `Travel to ${sys.name} and DOCK at ${target.name}.`,
      targetSystemId: sys.id,
      targetObjectId: target.id,
      actionType: 'dock',
      rewardCredits: 2600 + Math.floor(Math.random() * 2400),
      rewardXp: 300,
      isCoop: true,
      completed: false,
    };
  }

  return {
    id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    title: `DEEP SURVEY: ${target.name}`,
    code: `SCI-${codeNum}`,
    category: target.type === 'anomaly' || target.type === 'derelict' ? 'RECON' : 'SCIENCE',
    description: `Science Directorate requests fresh telemetry and spectral readings from ${target.name} in ${sys.name}.`,
    objectiveText: `Navigate to ${target.name} in ${sys.name} and execute DEEP SCAN [R].`,
    targetSystemId: sys.id,
    targetObjectId: target.id,
    actionType: 'scan',
    rewardCredits: 2600 + Math.floor(Math.random() * 3400),
    rewardXp: 320,
    completed: false,
  };
}
