import {
  startVesselTracking,
  stopVesselTracking,
  getSimulatedVessels,
} from './transportMaritime.js';
import {
  startAircraftTracking,
  stopAircraftTracking,
  getSimulatedAircraft,
} from './transportAir.js';
import { RAIL_CORRIDORS } from './transportRail.js';
import { PIPELINE_CORRIDORS } from './transportPipeline.js';

export const LAYER_CONFIG = {
  vessels: { enabled: true, label: 'Ships', icon: '🚢', color: '#00ffcc' },
  aircraft: { enabled: true, label: 'Air Cargo', icon: '✈', color: '#ffffff' },
  rail: { enabled: true, label: 'Rail', icon: '🚂', color: '#ff9900' },
  pipelines: { enabled: true, label: 'Pipelines', icon: '⚡', color: '#ff4400' },
};

export const startAllTransportTracking = ({ onVesselUpdate, onAircraftUpdate, onStatusChange }) => {
  const wsRef = startVesselTracking(onVesselUpdate, onStatusChange);
  const intervalRef = startAircraftTracking(onAircraftUpdate, onStatusChange);
  return { wsRef, intervalRef };
};

export const stopAllTransportTracking = ({ wsRef, intervalRef }) => {
  stopVesselTracking(wsRef);
  stopAircraftTracking(intervalRef);
};

export const getStaticLayers = () => ({
  rail: RAIL_CORRIDORS,
  pipelines: PIPELINE_CORRIDORS,
});

export const getFallbackTransport = (routes) => ({
  vessels: getSimulatedVessels(routes),
  aircraft: getSimulatedAircraft(routes),
  rail: RAIL_CORRIDORS,
  pipelines: PIPELINE_CORRIDORS,
});
