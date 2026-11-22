import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getStarSystem, HazardZone } from '../data/starSystems';
import { ENGINE_MODELS, SHIP_CLASSES, useShipStore } from '../store/useShipStore';
import { starshipAudio } from '../utils/audio';
import { PlayerShipModel } from './PlayerShipModel';
import { CockpitInterior } from './CockpitInterior';

export const hudTargetScreenPos = {
  x: 0.5,
  y: 0.5,
  visible: false,
  distance: 0,
  name: '',
  classification: '',
  dockable: false,
  landable: false,
  alignmentError: 0,
};

const keys: Record<string, boolean> = {};

export const FlightController: React.FC = () => {
  const { camera } = useThree();
  const shipGroupRef = useRef<THREE.Group>(null);
  const cameraMode = useShipStore((s) => s.cameraMode);
  const headlights = useShipStore((s) => s.headlights);

  const posVec = useRef(new THREE.Vector3(0, 10, 40));
  const velVec = useRef(new THREE.Vector3());
  const quat = useRef(new THREE.Quaternion());
  const angVel = useRef(new THREE.Vector3());
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3());
  const camTargetPos = useRef(new THREE.Vector3());
  const camCurrentPos = useRef(new THREE.Vector3(0, 14, 54));
  const camTargetQuat = useRef(new THREE.Quaternion());
  const tmpVec = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());
  const alertTimer = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (!keys[code]) {
        const s = useShipStore.getState();
        if (s.booted && s.playerMode === 'flight') {
          if (code === 'KeyC') s.toggleCamera();
          if (code === 'KeyF') s.toggleFlightAssist();
          if (code === 'KeyR') s.triggerDeepScan();
          if (code === 'KeyX') s.attemptDock();
          if (code === 'KeyL') s.attemptPlanetaryLanding();
          if (code === 'KeyM') s.fireMiningLaser();
          if (code === 'KeyB') s.firePulseCannon();
          if (code === 'KeyT') s.fireTorpedo();
          if (code === 'KeyG') s.activateTractorBeam();
          if (code === 'KeyV') s.toggleCloak();
          if (code === 'KeyP') s.fireEmpShockwave();
        }
      }
      keys[code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useShipStore.getState();
    if (!s.booted || s.playerMode !== 'flight') return;

    posVec.current.set(s.position[0], s.position[1], s.position[2]);
    velVec.current.set(s.velocity[0], s.velocity[1], s.velocity[2]);
    quat.current.set(s.quaternion[0], s.quaternion[1], s.quaternion[2], s.quaternion[3]);
    angVel.current.set(s.angularVelocity[0], s.angularVelocity[1], s.angularVelocity[2]);

    const system = getStarSystem(s.currentSystemId);

    // 1. Quantum Warp Transition
    if (s.warp.active && s.warp.targetSystemId) {
      const nextProgress = s.warp.progress + dt * 0.42;
      if (nextProgress >= 1) {
        const destId = s.warp.targetSystemId;
        const destSys = getStarSystem(destId);
        const discovered = s.discoveredSystems.includes(destId)
          ? s.discoveredSystems
          : [...s.discoveredSystems, destId];
        s.addLog(`ARRIVED IN ${destSys.name} [${destSys.sectorCode}]`, 'success');
        s.applyTick({
          currentSystemId: destId,
          discoveredSystems: discovered,
          selectedTargetId: destSys.objects[1]?.id || null,
          plottedSystemId: null,
          position: [0, 15, 65],
          velocity: [0, 0, -18],
          quaternion: [0, 0, 0, 1],
          angularVelocity: [0, 0, 0],
          warp: { active: false, progress: 0, targetSystemId: null },
        });
      } else {
        s.applyTick({
          simTime: s.simTime + dt,
          warp: { ...s.warp, progress: nextProgress },
          speed: 450 + nextProgress * 2200,
        });
      }
      return;
    }

    // 2. Very Rare Random Emergency Scheduler (mean interval ~4 minutes)
    const nextSimTime = s.simTime + dt;
    let nextEmergencyCheck = s.nextEmergencyCheck;
    if (!s.dockedStationId && !s.landedPlanetId && nextSimTime >= s.nextEmergencyCheck) {
      // Schedule next check 180-320 seconds later so emergencies remain very rare
      nextEmergencyCheck = nextSimTime + 180 + Math.random() * 140;
      if (s.activeEmergencies.length === 0 && Math.random() < 0.35) {
        s.triggerRandomEmergency(false);
      }
    }

    // 3. Active Emergency Consequences & Robot Repair Progression
    let emergencyEngineMult = 1.0;
    let emergencyCoolingMult = 1.0;
    let emergencyPowerMult = 1.0;
    let emergencyFuelBleed = 0;
    let emergencyO2Bleed = 0;
    let emergencyHeatAdd = 0;

    let emergenciesChanged = false;
    const updatedEmergencies = s.activeEmergencies.map((emg) => {
      const mitigation = emg.isolated ? 0.45 : 1.0;
      if (emg.affectedSystem === 'engines') emergencyEngineMult *= emg.isolated ? 0.78 : 0.55;
      if (emg.affectedSystem === 'cooling') emergencyCoolingMult *= 0.4;
      if (emg.affectedSystem === 'powerBus' && !s.backupGeneratorOnline) emergencyPowerMult *= 0.65;
      if (emg.affectedSystem === 'fuelSystem') emergencyFuelBleed += 0.9 * mitigation;
      if (emg.affectedSystem === 'hull' || emg.affectedSystem === 'lifeSupport') emergencyO2Bleed += 1.4 * mitigation;
      if (emg.affectedSystem === 'reactor') emergencyHeatAdd += 26 * mitigation;

      // Maintenance Robots & responding crew automatically advance repair progress!
      if (emg.robotDispatched) {
        emergenciesChanged = true;
        return { ...emg, repairProgress: Math.min(100, emg.repairProgress + dt * 9.5) };
      }
      return emg;
    });

    // Auto-resolve any emergency that reached 100% via robot repair
    for (const emg of updatedEmergencies) {
      if (emg.repairProgress >= 100) {
        s.manualRepairEmergency(emg.uid);
      }
    }

    // 4. Environmental Hazard Zone Effects
    let activeHazard: HazardZone | null = null;
    for (const hz of system.hazards) {
      const dist = Math.hypot(
        posVec.current.x - hz.position[0],
        posVec.current.y - hz.position[1],
        posVec.current.z - hz.position[2]
      );
      if (dist <= hz.radius) {
        activeHazard = hz;
        if (hz.type === 'GRAVITY_WELL' && !s.dockedStationId && !s.landedPlanetId) {
          tmpVec.current.set(hz.position[0], hz.position[1], hz.position[2]).sub(posVec.current).normalize();
          velVec.current.addScaledVector(tmpVec.current, 14 * hz.intensity * dt);
        }
        break;
      }
    }

    // 5. Engineering Power & Backup Generator Multipliers
    let backupBattery = s.backupBattery;
    let backupGeneratorOnline = s.backupGeneratorOnline;
    if (backupGeneratorOnline) {
      backupBattery = Math.max(0, backupBattery - dt * 1.4);
      if (backupBattery <= 0.1) {
        backupGeneratorOnline = false;
        s.addLog('BACKUP GENERATOR BATTERY DEPLETED', 'warn');
      }
    } else if (s.reactorThrottle >= 50) {
      backupBattery = Math.min(100, backupBattery + dt * 0.8);
    }

    const reactorFactor = (s.reactorThrottle / 100) * emergencyPowerMult + (backupGeneratorOnline ? 0.25 : 0);
    const installedEngine = ENGINE_MODELS.find((e) => e.id === s.installedEngineId) || ENGINE_MODELS[0];
    const cfgSpeedMult = 0.88 + (s.engineConfig.thrustBias / 100) * 0.28 + (s.engineConfig.fuelMix / 100) * 0.16;
    const cfgFuelMult = 0.78 + (s.engineConfig.fuelMix / 100) * 0.45;
    const cfgCoolMult = 0.8 + (s.engineConfig.coolantFlow / 100) * 0.42;

    const aeroSpeedMult = s.aeroPart === 'hypersonic-swept' ? 1.35 : s.aeroPart === 'twin-winglet-fins' ? 1.2 : 1.0;
    const noseSpeedMult = s.nosePart === 'needle-lance' ? 1.15 : 1.0;
    const boosterSpeedMult =
      s.boosterPart === 'apex-quad-rings'
        ? 2.25
        : s.boosterPart === 'antimatter-nitro'
          ? 1.75
          : s.boosterPart === 'wing-turbo-jets'
            ? 1.4
            : 1.0;
    const hasZeroMass = s.xenoMods.includes('zero-mass-chassis');
    const hasSlipstream = s.xenoMods.includes('quantum-slipstream');
    const xenoSpeedMult = hasSlipstream ? 1.8 : 1.0;
    const xenoAccelMult = hasZeroMass ? 1.45 : 1.0;

    const aeroTurnMult =
      (s.aeroPart === 'twin-winglet-fins' ? 1.3 : s.aeroPart === 'forward-canards' ? 1.25 : s.aeroPart === 'hypersonic-swept' ? 1.2 : 1.0) *
      (hasZeroMass ? 1.4 : 1.0);
    const roofShieldMult = s.roofPart === 'command-bridge-deck' ? 1.15 : 1.0;

    const shipCls = SHIP_CLASSES.find((c) => c.id === s.shipClass) || SHIP_CLASSES[0];
    const engineUpgMult =
      (1 + (s.upgrades.engines - 1) * 0.18) *
      installedEngine.speedMult *
      cfgSpeedMult *
      aeroSpeedMult *
      noseSpeedMult *
      boosterSpeedMult *
      xenoSpeedMult *
      xenoAccelMult *
      shipCls.speedMult;
    const boostUpgMult =
      (1 + (s.upgrades.boost - 1) * 0.25) * (s.boosterPart === 'antimatter-nitro' ? 1.6 : 1.0);
    const fuelEffMult = Math.max(0.35, (1 - (s.upgrades.fuelEfficiency - 1) * 0.14) * installedEngine.fuelMult * cfgFuelMult);
    const coolingUpgMult = (1 + (s.upgrades.cooling - 1) * 0.22) * cfgCoolMult;
    const shieldUpgMult = (1 + (s.upgrades.shields - 1) * 0.22) * roofShieldMult;
    const armorDmgMult = Math.max(0.4, 1 - (s.upgrades.hullArmor - 1) * 0.15);
    const overdriveTimer = Math.max(0, s.overdriveTimer - dt);
    const overdriveMult = overdriveTimer > 0 ? 1.6 : 1.0;

    const enginePowerEff = s.enginesOnline
      ? (0.35 + (s.power.engines / 100) * 1.45) *
        reactorFactor *
        (0.3 + (s.engineHealth / 100) * 0.7) *
        emergencyEngineMult *
        engineUpgMult *
        overdriveMult
      : 0;
    const shieldPowerEff = s.shieldsOnline ? (s.power.shields / 100) * reactorFactor * shieldUpgMult : 0;
    const lifePowerEff = s.lifeSupportOnline ? (s.power.lifeSupport / 100) * reactorFactor : 0;
    const overheatLimit = 880 + (s.upgrades.cooling - 1) * 45;
    const overheatThrottle = s.temperature > overheatLimit ? 0.45 : 1.0;

    // 6. Controls & Flight Kinematics
    const controlsActive = s.activeView === 'bridge' && !s.dockedStationId && !s.landedPlanetId && s.hull > 0;
    let throttle = s.throttle;
    let boostActive = false;
    let braking = false;
    let autopilot = s.autopilot;

    if (controlsActive) {
      const pitchInput = (keys['ArrowUp'] ? 1 : 0) - (keys['ArrowDown'] ? 1 : 0);
      const yawInput = (keys['ArrowLeft'] ? 1 : 0) - (keys['ArrowRight'] ? 1 : 0);
      const rollInput = (keys['KeyA'] ? 1 : 0) - (keys['KeyD'] ? 1 : 0);
      const thrustInput = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
      const strafeInput = (keys['KeyE'] ? 1 : 0) - (keys['KeyQ'] ? 1 : 0);

      boostActive = Boolean((keys['ShiftLeft'] || keys['ShiftRight']) && s.enginesOnline && s.fuel > 0.2);
      braking = Boolean(keys['Space']);

      if (pitchInput || yawInput || rollInput || thrustInput || braking) {
        autopilot = false;
      }

      const turnRate = 1.9 * (0.5 + 0.5 * Math.min(1.2, enginePowerEff + 0.3)) * aeroTurnMult;
      angVel.current.x += pitchInput * turnRate * dt;
      angVel.current.y += yawInput * turnRate * dt;
      angVel.current.z += rollInput * turnRate * 1.25 * dt;

      if (thrustInput !== 0) {
        throttle = THREE.MathUtils.clamp(throttle + thrustInput * dt * 1.35, -0.6, 1.0);
      } else if (braking) {
        throttle = THREE.MathUtils.lerp(throttle, 0, Math.min(1, dt * 6));
      } else if (s.flightAssist && Math.abs(throttle) < 0.04) {
        throttle = 0;
      }

      forwardVec.current.set(0, 0, -1).applyQuaternion(quat.current);
      rightVec.current.set(1, 0, 0).applyQuaternion(quat.current);
      upVec.current.set(0, 1, 0).applyQuaternion(quat.current);

      if (s.enginesOnline && s.fuel > 0.05) {
        const accelBase = 48 * enginePowerEff * overheatThrottle;
        const boostMult = boostActive ? 2.15 * boostUpgMult : 1.0;
        if (Math.abs(throttle) > 0.01) {
          velVec.current.addScaledVector(forwardVec.current, throttle * accelBase * boostMult * dt);
        } else if (boostActive) {
          velVec.current.addScaledVector(forwardVec.current, accelBase * 1.6 * boostUpgMult * dt);
        }
        if (strafeInput !== 0) {
          velVec.current.addScaledVector(rightVec.current, strafeInput * accelBase * 0.55 * dt);
        }
      }

      if (braking) {
        velVec.current.multiplyScalar(Math.exp(-dt * 4.2));
        angVel.current.multiplyScalar(Math.exp(-dt * 6));
      } else if (s.flightAssist) {
        velVec.current.multiplyScalar(Math.exp(-dt * (Math.abs(throttle) < 0.02 && !boostActive ? 1.4 : 0.55)));
        angVel.current.multiplyScalar(Math.exp(-dt * 4.5));
      } else {
        angVel.current.multiplyScalar(Math.exp(-dt * 0.8));
      }
    } else if (s.dockedStationId || s.landedPlanetId) {
      velVec.current.set(0, 0, 0);
      angVel.current.set(0, 0, 0);
      throttle = 0;
    }

    // 7. Autopilot Navigation
    if (autopilot && s.selectedTargetId && s.enginesOnline && s.navComputerOnline && s.fuel > 0.2) {
      const targetObj = system.objects.find((o) => o.id === s.selectedTargetId);
      if (targetObj) {
        tmpVec.current.set(targetObj.position[0], targetObj.position[1], targetObj.position[2]);
        const toTarget = tmpVec.current.clone().sub(posVec.current);
        const dist = toTarget.length();
        const stopDist = targetObj.radius + (targetObj.dockable ? 55 : 105);

        if (dist <= stopDist) {
          velVec.current.multiplyScalar(Math.exp(-dt * 5));
          throttle = 0;
          if (velVec.current.length() < 1.5) {
            autopilot = false;
            s.addLog(`AUTOPILOT ARRIVED AT ${targetObj.name}`, 'success');
            starshipAudio.playClick(980);
          }
        } else {
          const lookMat = new THREE.Matrix4().lookAt(posVec.current, tmpVec.current, new THREE.Vector3(0, 1, 0));
          tmpQuat.current.setFromRotationMatrix(lookMat);
          quat.current.slerp(tmpQuat.current, Math.min(1, dt * 2.5));
          const desiredSpeed = Math.min(85 * enginePowerEff, Math.max(12, (dist - stopDist) * 0.65));
          velVec.current.lerp(toTarget.normalize().multiplyScalar(desiredSpeed), Math.min(1, dt * 2.2));
          throttle = Math.min(1, desiredSpeed / 80);
        }
      } else {
        autopilot = false;
      }
    }

    const maxSpeed = (boostActive ? 155 : 92) * Math.max(0.35, enginePowerEff) * overheatThrottle;
    if (velVec.current.length() > maxSpeed && s.flightAssist) {
      velVec.current.setLength(THREE.MathUtils.lerp(velVec.current.length(), maxSpeed, dt * 3));
    }

    if (angVel.current.lengthSq() > 1e-7) {
      const dPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angVel.current.x * dt);
      const dYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angVel.current.y * dt);
      const dRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angVel.current.z * dt);
      quat.current.multiply(dYaw).multiply(dPitch).multiply(dRoll).normalize();
    }

    posVec.current.addScaledVector(velVec.current, dt);

    // 8. Resource, Thermal, Hazard & Collision Simulation
    const speed = velVec.current.length();
    const thrustLoad = s.enginesOnline ? Math.abs(throttle) + (boostActive ? 1.4 : 0) : 0;

    let fuel = s.fuel;
    let oxygen = s.oxygen;
    let shields = s.shields;
    let hull = s.hull;
    let temperature = s.temperature;
    let engineHealth = s.engineHealth;
    let shieldImpactFlash = Math.max(0, s.shieldImpactFlash - dt * 2.2);
    let hullDamageFlash = Math.max(0, s.hullDamageFlash - dt * 2.0);
    let coolantCooldown = Math.max(0, s.coolantCooldown - dt);
    let coolantReserve = s.coolantReserve;
    let miningLaserActive = Math.max(0, s.miningLaserActive - dt * 2.2);
    let cannonPulse = Math.max(0, s.cannonPulse - dt * 4.5);
    let empPulse = Math.max(0, s.empPulse - dt * 1.4);
    let empCooldown = Math.max(0, s.empCooldown - dt);
    let microJumpCooldown = Math.max(0, s.microJumpCooldown - dt);
    let scanPulse = Math.max(0, s.scanPulse - dt * 0.85);
    let repairActive = s.repairActive;
    const components = { ...s.components };

    if (!s.dockedStationId && !s.landedPlanetId) {
      const fuelBurn = ((0.035 + thrustLoad * 0.4) * reactorFactor * fuelEffMult + emergencyFuelBleed) * dt;
      const solarTrickle = s.roofPart === 'solar-wing-roof' ? 0.35 * dt : 0;
      fuel = THREE.MathUtils.clamp(fuel - fuelBurn + solarTrickle, 0, 100);
      if (s.roofPart === 'solar-wing-roof') {
        backupBattery = Math.min(100, backupBattery + 0.5 * dt);
      }

      if (s.lifeSupportOnline && lifePowerEff >= 0.16 && emergencyO2Bleed === 0) {
        oxygen = Math.min(100, oxygen + (lifePowerEff - 0.12) * 3.8 * dt);
      } else {
        oxygen = Math.max(0, oxygen - (1.45 + emergencyO2Bleed) * dt);
      }

      // Radiation hazard drains shields
      if (activeHazard?.type === 'RADIATION') {
        shields = Math.max(0, shields - 4.2 * activeHazard.intensity * dt);
        shieldImpactFlash = Math.max(shieldImpactFlash, 0.2);
      } else if (s.shieldsOnline && shieldPowerEff > 0.05) {
        shields = Math.min(100, shields + shieldPowerEff * 4.8 * dt);
      } else if (!s.shieldsOnline) {
        shields = Math.max(0, shields - 2.5 * dt);
      }

      const solarHeat = activeHazard?.type === 'SOLAR_FLARE' ? 32 * activeHazard.intensity : 0;
      const boostHeat = boostActive ? Math.max(12, 35 - (s.upgrades.boost - 1) * 5) : 0;
      const heatGen =
        (s.reactorThrottle > 95 ? (s.reactorThrottle - 90) * 1.4 : 0) +
        thrustLoad * 22 +
        boostHeat +
        emergencyHeatAdd +
        solarHeat;
      // Balanced Coolant Loop: consumes cryo-coolant reserve while actively cooling hot core; dry tank cuts cooling by 55%
      if (temperature > 520 && coolantReserve > 0) {
        coolantReserve = Math.max(0, coolantReserve - ((temperature - 500) / 360) * 1.2 * dt);
      }
      const cryoTankFactor = coolantReserve > 1 ? 1.0 : 0.45;
      const passiveCool = (temperature - 310) * 0.11 * emergencyCoolingMult * coolingUpgMult * cryoTankFactor;
      temperature = THREE.MathUtils.clamp(temperature + (heatGen - passiveCool) * dt, 290, 1200);

      if (temperature > overheatLimit) {
        engineHealth = Math.max(15, engineHealth - 2.2 * dt);
        components.engines = Math.max(20, components.engines - 1.8 * dt);
        hull = Math.max(0, hull - 0.85 * armorDmgMult * dt);
        hullDamageFlash = Math.max(hullDamageFlash, 0.35);
      }

      if (oxygen < 5) hull = Math.max(0, hull - 0.4 * dt);

      if (repairActive) {
        if (hull >= 100 && engineHealth >= 100) {
          repairActive = false;
        } else if (fuel > 1) {
          hull = Math.min(100, hull + 2.4 * dt);
          engineHealth = Math.min(100, engineHealth + 3.5 * dt);
          fuel = Math.max(0, fuel - 0.35 * dt);
        } else {
          repairActive = false;
        }
      }

      // Asteroid Collisions + Physical Component Damage
      for (const ast of system.asteroids) {
        const dx = posVec.current.x - ast.position[0];
        const dy = posVec.current.y - ast.position[1];
        const dz = posVec.current.z - ast.position[2];
        const dist = Math.hypot(dx, dy, dz);
        const minDist = ast.radius + 3.8;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          posVec.current.set(
            ast.position[0] + nx * (minDist + 1.5),
            ast.position[1] + ny * (minDist + 1.5),
            ast.position[2] + nz * (minDist + 1.5)
          );
          const impactSpeed = Math.max(10, speed);
          velVec.current.set(nx * impactSpeed * 0.55, ny * impactSpeed * 0.55, nz * impactSpeed * 0.55);

          const dmg = Math.min(35, 8 + impactSpeed * 0.25);
          if (shields > 0 && s.shieldsOnline) {
            const absorbed = Math.min(shields, dmg);
            shields -= absorbed;
            shieldImpactFlash = 1;
            const overflow = dmg - absorbed;
            if (overflow > 0) {
              hull = Math.max(0, hull - overflow);
              components.hullPort = Math.max(15, components.hullPort - overflow * 1.1);
              hullDamageFlash = 1;
            }
          } else {
            hull = Math.max(0, hull - dmg);
            engineHealth = Math.max(10, engineHealth - dmg * 0.35);
            components.hullStarboard = Math.max(15, components.hullStarboard - dmg * 1.2);
            components.engines = Math.max(20, components.engines - dmg * 0.5);
            hullDamageFlash = 1;
          }
          starshipAudio.playAlert('CRITICAL');
          s.addLog(`ASTEROID IMPACT DETECTED (-${Math.round(dmg)} DMG)`, 'alert');
          s.recordBlackBox(`ASTEROID COLLISION (-${Math.round(dmg)} DMG)`);
          break;
        }
      }

      // Planetary / Star collision boundary
      for (const obj of system.objects) {
        const dx = posVec.current.x - obj.position[0];
        const dy = posVec.current.y - obj.position[1];
        const dz = posVec.current.z - obj.position[2];
        const dist = Math.hypot(dx, dy, dz);
        const minDist = obj.radius + 8;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          posVec.current.set(
            obj.position[0] + nx * (minDist + 2),
            obj.position[1] + ny * (minDist + 2),
            obj.position[2] + nz * (minDist + 2)
          );
          velVec.current.multiplyScalar(-0.35);
          if (obj.type === 'star') temperature = Math.min(1200, temperature + 180 * dt);
        }
      }
    }

    // Periodic critical alarm
    alertTimer.current += dt;
    if (alertTimer.current > 3.2 && (hull < 25 || oxygen < 20 || temperature > 900)) {
      alertTimer.current = 0;
      starshipAudio.playAlert('CRITICAL');
    }

    starshipAudio.updateEngine(Math.min(1, speed / 90), boostActive, s.enginesOnline && !s.dockedStationId && !s.landedPlanetId);

    // 9. Update Ship Mesh & Camera
    if (shipGroupRef.current) {
      shipGroupRef.current.position.copy(posVec.current);
      shipGroupRef.current.quaternion.copy(quat.current);
    }

    if (s.cameraMode === 'cockpit') {
      const localEye = tmpVec.current.set(0, 0.55, -0.75).applyQuaternion(quat.current);
      camera.position.copy(posVec.current).add(localEye);
      camera.quaternion.copy(quat.current);
    } else {
      const offset = tmpVec.current.set(0, 6.8, 25.5).applyQuaternion(quat.current);
      camTargetPos.current.copy(posVec.current).add(offset);
      camCurrentPos.current.lerp(camTargetPos.current, Math.min(1, dt * 8.5));
      camera.position.copy(camCurrentPos.current);

      const lookAhead = forwardVec.current.set(0, 0, -45).applyQuaternion(quat.current).add(posVec.current);
      upVec.current.set(0, 1, 0).applyQuaternion(quat.current);
      const m = new THREE.Matrix4().lookAt(camera.position, lookAhead, upVec.current);
      camTargetQuat.current.setFromRotationMatrix(m);
      camera.quaternion.slerp(camTargetQuat.current, Math.min(1, dt * 10));
    }

    // 10. Project Target Bracket + Docking Alignment Telemetry
    if (s.selectedTargetId) {
      const targetObj = system.objects.find((o) => o.id === s.selectedTargetId);
      if (targetObj) {
        tmpVec.current.set(targetObj.position[0], targetObj.position[1], targetObj.position[2]);
        const dist = tmpVec.current.distanceTo(posVec.current);
        const dirToTarget = tmpVec.current.clone().sub(posVec.current).normalize();
        forwardVec.current.set(0, 0, -1).applyQuaternion(quat.current);
        const alignDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(forwardVec.current.dot(dirToTarget), -1, 1)));

        const projected = tmpVec.current.clone().project(camera);
        hudTargetScreenPos.x = (projected.x + 1) * 0.5;
        hudTargetScreenPos.y = (-projected.y + 1) * 0.5;
        hudTargetScreenPos.visible = projected.z < 1 && projected.z > -1;
        hudTargetScreenPos.distance = Math.max(0, dist - targetObj.radius);
        hudTargetScreenPos.name = targetObj.name;
        hudTargetScreenPos.classification = targetObj.classification;
        hudTargetScreenPos.dockable = Boolean(targetObj.dockable);
        hudTargetScreenPos.landable = Boolean(targetObj.landable);
        hudTargetScreenPos.alignmentError = alignDeg;
      } else {
        hudTargetScreenPos.visible = false;
      }
    } else {
      hudTargetScreenPos.visible = false;
    }

    // 11. Commit Tick
    const tickPatch: Partial<typeof s> = {
      simTime: nextSimTime,
      nextEmergencyCheck,
      position: [posVec.current.x, posVec.current.y, posVec.current.z],
      velocity: [velVec.current.x, velVec.current.y, velVec.current.z],
      quaternion: [quat.current.x, quat.current.y, quat.current.z, quat.current.w],
      angularVelocity: [angVel.current.x, angVel.current.y, angVel.current.z],
      speed,
      throttle,
      boostActive,
      overdriveTimer,
      braking,
      autopilot,
      activeHazard,
      backupBattery,
      backupGeneratorOnline,
      reactorOutput: Math.round(s.reactorThrottle * (0.4 + 0.6 * (engineHealth / 100))),
      fuel,
      oxygen,
      shields,
      hull,
      temperature,
      engineHealth,
      components,
      shieldImpactFlash,
      hullDamageFlash,
      coolantCooldown,
      coolantReserve,
      miningLaserActive,
      cannonPulse,
      empPulse,
      empCooldown,
      microJumpCooldown,
      peakSpeed: Math.max(s.peakSpeed, speed),
      scanPulse,
      repairActive,
    };
    if (emergenciesChanged) tickPatch.activeEmergencies = updatedEmergencies;
    s.applyTick(tickPatch);
  });

  return (
    <group ref={shipGroupRef}>
      {cameraMode === 'external' ? <PlayerShipModel /> : <CockpitInterior />}
      {headlights && (
        <spotLight
          position={[0, -0.3, -3.5]}
          angle={0.48}
          penumbra={0.5}
          intensity={18}
          distance={220}
          color="#bae6fd"
        />
      )}
    </group>
  );
};
