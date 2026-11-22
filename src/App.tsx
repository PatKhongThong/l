import React, { useEffect } from 'react';
import { getPilotRank, useShipStore } from './store/useShipStore';
import { getDefaultWsUrl, multiplayerClient } from './utils/multiplayer';
import { starshipAudio } from './utils/audio';
import { LoadingScreen } from './components/LoadingScreen';
import { StarshipScene } from './scene/StarshipScene';
import { CockpitHUD } from './components/CockpitHUD';
import { InteriorEvaHUD } from './components/InteriorEvaHUD';
import { EngineeringPanel } from './components/EngineeringPanel';
import { StarMapModal } from './components/StarMapModal';
import { MissionsPanel } from './components/MissionsPanel';
import { EmergencyPanel } from './components/EmergencyPanel';
import { CrewMedicalPanel } from './components/CrewMedicalPanel';
import { ScienceCommsPanel } from './components/ScienceCommsPanel';
import { SecurityCargoPanel } from './components/SecurityCargoPanel';
import { AriaTerminal } from './components/AriaTerminal';
import { FuelCoolantUpgradePanel } from './components/FuelCoolantUpgradePanel';
import { MultiplayerPanel } from './components/MultiplayerPanel';
import { EarthSurfaceHUD } from './components/EarthSurfaceHUD';
import { GalacticNetPanel } from './components/GalacticNetPanel';

export const App: React.FC = () => {
  const booted = useShipStore((s) => s.booted);
  const playerMode = useShipStore((s) => s.playerMode);
  const activeView = useShipStore((s) => s.activeView);

  // Auto-join ?fleet=CODE invite link on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fleetCode = params.get('fleet');
    if (fleetCode) {
      const s = useShipStore.getState();
      s.connectMultiplayer(fleetCode.toUpperCase(), s.mpCallsign, getDefaultWsUrl());
    }
  }, []);

  // Global Multiplayer Packet Listener & 10Hz Telemetry Broadcaster
  useEffect(() => {
    const unsub = multiplayerClient.onPacket((pkt) => {
      const s = useShipStore.getState();
      if (pkt.type === 'state' && pkt.player.id !== multiplayerClient.playerId) {
        const nextPeers = {
          ...s.remotePlayers,
          [pkt.player.id]: { ...pkt.player, lastSeen: Date.now() },
        };

        const myShipId = s.boardedHostId || multiplayerClient.playerId;
        const sameShip = pkt.player.shipHostId === myShipId;

        // Shared-Ship Co-Op Helm Lock (ONLY for players boarded onto the SAME ship!)
        if (sameShip && pkt.player.playerMode === 'flight') {
          if (s.playerMode === 'flight' && multiplayerClient.playerId > pkt.player.id) {
            starshipAudio.playDoor();
            s.addLog(`HELM CONTROLLED BY ${pkt.player.callsign} — SPAWNED AT REACTOR CORE`, 'warn');
            s.applyTick({
              remotePlayers: nextPeers,
              playerMode: 'interior',
              activeView: 'bridge',
              interiorRoomId: 'reactor-room',
              interiorPos: [0, 1.65, 25],
              interiorYaw: 0,
              position: pkt.player.position,
              quaternion: pkt.player.quaternion,
              currentSystemId: pkt.player.systemId,
            });
            return;
          }
          // Ride along when walking inside a ship that another crewmate is flying
          if (s.playerMode === 'interior') {
            s.applyTick({
              remotePlayers: nextPeers,
              position: pkt.player.position,
              quaternion: pkt.player.quaternion,
              currentSystemId: pkt.player.systemId,
            });
            return;
          }
        }

        // If boarded on a host's ship while host is also walking, keep ship world pos synced
        if (s.boardedHostId === pkt.player.id && s.playerMode === 'interior') {
          s.applyTick({
            remotePlayers: nextPeers,
            position: pkt.player.position,
            quaternion: pkt.player.quaternion,
            currentSystemId: pkt.player.systemId,
          });
          return;
        }

        s.applyTick({ remotePlayers: nextPeers });
      } else if (pkt.type === 'chat') {
        starshipAudio.playRadio();
        s.applyTick({ fleetChat: [...s.fleetChat, pkt.msg].slice(-40) });
      } else if (pkt.type === 'coop_reward') {
        starshipAudio.playSuccess();
        s.addLog(`CO-OP PAYOUT FROM ${pkt.sender}: ${pkt.missionTitle} (+${pkt.credits} CR)`, 'success');
        s.applyTick({ credits: s.credits + pkt.credits, xp: s.xp + 120 });
      } else if (pkt.type === 'leave') {
        const next = { ...s.remotePlayers };
        delete next[pkt.playerId];
        s.applyTick({ remotePlayers: next });
      }
    });

    const timer = window.setInterval(() => {
      const s = useShipStore.getState();
      // Passively tick Earth Planetary Factories even while flying in deep space!
      if (s.booted) s.tickFactories(0.11);
      if (!s.mpConnected) return;
      multiplayerClient.send({
        type: 'state',
        room: s.mpRoom,
        player: {
          id: multiplayerClient.playerId,
          callsign: s.mpCallsign,
          job: s.mpJob,
          systemId: s.currentSystemId,
          shipHostId: s.boardedHostId || multiplayerClient.playerId,
          playerMode: s.playerMode,
          position: s.position,
          quaternion: s.quaternion,
          interiorPos: s.interiorPos,
          interiorYaw: s.interiorYaw,
          interiorRoomId: s.interiorRoomId,
          liveryId: s.liveryId,
          rank: getPilotRank(s.xp),
          credits: s.credits,
          lastSeen: Date.now(),
        },
      });
      // Prune stale peers (> 6s silent)
      const now = Date.now();
      const entries = Object.entries(s.remotePlayers);
      if (entries.some(([, p]) => now - p.lastSeen > 6000)) {
        const active: typeof s.remotePlayers = {};
        for (const [k, p] of entries) {
          if (now - p.lastSeen <= 6000) active[k] = p;
        }
        s.applyTick({ remotePlayers: active });
      }
    }, 110);

    const marketTimer = window.setInterval(() => {
      const s = useShipStore.getState();
      if (!s.booted) return;
      s.tickStockMarket();
      s.checkAchievements();
      if (s.pointDefenseOn && s.playerMode === 'flight') s.firePulseCannon();
      if (s.autoMinerOn && s.playerMode === 'flight') s.fireMiningLaser();
    }, 6500);

    return () => {
      unsub();
      window.clearInterval(timer);
      window.clearInterval(marketTimer);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#02050a' }}>
      {!booted ? (
        <LoadingScreen />
      ) : (
        <>
          <StarshipScene />
          {playerMode === 'flight' ? (
            <CockpitHUD />
          ) : playerMode === 'earth_cutscene' || playerMode === 'earth_surface' ? (
            <EarthSurfaceHUD />
          ) : (
            <InteriorEvaHUD />
          )}
          {activeView === 'engineering' && <EngineeringPanel />}
          {activeView === 'starmap' && <StarMapModal />}
          {activeView === 'missions' && <MissionsPanel />}
          {activeView === 'emergency' && <EmergencyPanel />}
          {(activeView === 'crew' || activeView === 'medical') && <CrewMedicalPanel />}
          {(activeView === 'science' || activeView === 'comms') && <ScienceCommsPanel />}
          {(activeView === 'security' || activeView === 'cargo') && <SecurityCargoPanel />}
          {activeView === 'ai' && <AriaTerminal />}
          {activeView === 'multiplayer' && <MultiplayerPanel />}
          {activeView === 'galactic' && <GalacticNetPanel />}
          {(activeView === 'fuel' || activeView === 'coolant' || activeView === 'upgrades') && (
            <FuelCoolantUpgradePanel />
          )}
        </>
      )}
    </div>
  );
};

export default App;
