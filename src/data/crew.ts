export type CrewRole =
  | 'CAPTAIN'
  | 'PILOT'
  | 'CHIEF ENGINEER'
  | 'MEDICAL OFFICER'
  | 'SCIENCE OFFICER'
  | 'SECURITY OFFICER'
  | 'COMMS OFFICER'
  | 'MAINTENANCE TECH';

export type CrewStatus = 'ON DUTY' | 'RESPONDING' | 'REPAIRING' | 'RESTING' | 'INJURED';

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  skill: number; // 1..100
  health: number; // 0..100
  morale: number; // 0..100
  fatigue: number; // 0..100
  homeRoomId: string;
  currentRoomId: string;
  status: CrewStatus;
  currentTask: string;
  avatarColor: string;
  dialogue: {
    normal: string;
    emergency: string;
    tired: string;
  };
}

export const INITIAL_CREW: CrewMember[] = [
  {
    id: 'crew-captain',
    name: 'CDR. ELENA VANCE',
    role: 'CAPTAIN',
    skill: 94,
    health: 100,
    morale: 92,
    fatigue: 12,
    homeRoomId: 'command-bridge',
    currentRoomId: 'command-bridge',
    status: 'ON DUTY',
    currentTask: 'Supervising bridge operations & fleet directives',
    avatarColor: '#00e5ff',
    dialogue: {
      normal: 'All decks report green, Commander. Ready to chart the next sector on your mark.',
      emergency: 'Stay sharp! Prioritize critical containment and keep the crew coordinated.',
      tired: 'Long watch on the bridge. Rotate shifts when we reach safe orbit.',
    },
  },
  {
    id: 'crew-pilot',
    name: 'LT. MARCUS CHEN',
    role: 'PILOT',
    skill: 91,
    health: 100,
    morale: 88,
    fatigue: 18,
    homeRoomId: 'navigation-room',
    currentRoomId: 'navigation-room',
    status: 'ON DUTY',
    currentTask: 'Calibrating inertial dampeners & jump vectors',
    avatarColor: '#38bdf8',
    dialogue: {
      normal: 'RCS thrusters are crisp. Give me a target lock and we can engage autopilot anytime.',
      emergency: 'Compensating for attitude drift—stabilize propulsion or nav core ASAP!',
      tired: 'My eyes are blurring from the star-tracker telemetry. Could use a quick bunk cycle.',
    },
  },
  {
    id: 'crew-engineer',
    name: 'ENG. TARIQ AL-MANSOOR',
    role: 'CHIEF ENGINEER',
    skill: 96,
    health: 100,
    morale: 90,
    fatigue: 15,
    homeRoomId: 'main-engineering',
    currentRoomId: 'main-engineering',
    status: 'ON DUTY',
    currentTask: 'Monitoring fusion core containment & power bus',
    avatarColor: '#f59e0b',
    dialogue: {
      normal: 'Fusion core is purring at nominal Kelvin. Keep reactor throttle under 95% to avoid thermal creep.',
      emergency: 'Moving to isolate the fault! Dispatch a maintenance drone if you want double repair speed.',
      tired: 'Spent six hours crawling through coolant conduits. Need a coffee and a rest.',
    },
  },
  {
    id: 'crew-medic',
    name: 'DR. SORA TAKAHASHI',
    role: 'MEDICAL OFFICER',
    skill: 93,
    health: 100,
    morale: 94,
    fatigue: 10,
    homeRoomId: 'medical-bay',
    currentRoomId: 'medical-bay',
    status: 'ON DUTY',
    currentTask: 'Monitoring crew biometrics & O2 scrubbers',
    avatarColor: '#10b981',
    dialogue: {
      normal: 'Crew vitals are optimal. Biobeds are prepped in case of radiation exposure or impact trauma.',
      emergency: 'Atmospheric or medical alert detected! Checking life support scrubbers and crew vitals.',
      tired: 'Medbay telemetry is automated for now—rotating to quarters soon.',
    },
  },
  {
    id: 'crew-science',
    name: 'DR. ARIS KOWALSKI',
    role: 'SCIENCE OFFICER',
    skill: 95,
    health: 100,
    morale: 91,
    fatigue: 14,
    homeRoomId: 'science-lab',
    currentRoomId: 'science-lab',
    status: 'ON DUTY',
    currentTask: 'Analyzing deep-space spectroscopy & anomalies',
    avatarColor: '#a855f7',
    dialogue: {
      normal: 'Bring us close to planets or anomalous signals and run a Deep Scan—I will catalog the data.',
      emergency: 'Sensor calibration compromised! Protecting lab specimens while we restore array power.',
      tired: 'Running spectral inversions all night. Fascinating readings, exhausting shift.',
    },
  },
  {
    id: 'crew-security',
    name: 'SGT. NORA REYES',
    role: 'SECURITY OFFICER',
    skill: 89,
    health: 100,
    morale: 86,
    fatigue: 16,
    homeRoomId: 'airlock',
    currentRoomId: 'airlock',
    status: 'ON DUTY',
    currentTask: 'Monitoring internal bulkheads, CCTV & EVA lock',
    avatarColor: '#ef4444',
    dialogue: {
      normal: 'All internal hatches and escape pods verified secure. EVA suits are pressurized and ready.',
      emergency: 'Bulkhead seals on standby! Securing affected compartments against decompression.',
      tired: 'Deck patrol complete. Everything is quiet across all twelve compartments.',
    },
  },
  {
    id: 'crew-comms',
    name: 'ENS. LIAM O’CONNOR',
    role: 'COMMS OFFICER',
    skill: 87,
    health: 100,
    morale: 90,
    fatigue: 11,
    homeRoomId: 'comms-room',
    currentRoomId: 'comms-room',
    status: 'ON DUTY',
    currentTask: 'Scanning subspace relays & station transponders',
    avatarColor: '#60a5fa',
    dialogue: {
      normal: 'Subspace channels are clear. We can hail any orbital station or decrypt distress beacons.',
      emergency: 'Carrier wave breaking up! Re-routing through auxiliary dish.',
      tired: 'Listening to static across four light-years wears on you.',
    },
  },
  {
    id: 'crew-tech',
    name: 'TECH. MAYA PATEL',
    role: 'MAINTENANCE TECH',
    skill: 92,
    health: 100,
    morale: 89,
    fatigue: 19,
    homeRoomId: 'maintenance-room',
    currentRoomId: 'maintenance-room',
    status: 'ON DUTY',
    currentTask: 'Servicing M-BOT repair drones & hull patch kits',
    avatarColor: '#facc15',
    dialogue: {
      normal: 'Both maintenance robots are charged and docked. Say the word and I will send them out.',
      emergency: 'Grabbing my arc-welder! Heading straight to the damaged compartment.',
      tired: 'Replaced three plasma relays today. My wrench arm is feeling it.',
    },
  },
];

