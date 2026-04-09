export const CLOUD_SYNC_KEYS = [
  'chainflowx-panels',
  'chainflowx-monitors',
  'chainflowx-layers',
  'chainflowx-disabled-feeds',
  'chainflowx-panel-spans',
  'chainflowx-panel-col-spans',
  'chainflowx-panel-order',
  'chainflowx-theme',
  'chainflowx-variant',
  'chainflowx-map-mode',
  'cfx-breaking-alerts-v1',
  'cfx-market-watchlist-v1',
  'aviation:watchlist:v1',
  'cfx-pinned-webcams',
  'cfx-map-provider',
  'cfx-font-family',
  'cfx-globe-visual-preset',
  'cfx-stream-quality',
  'cfx-ai-flow-cloud-llm',
  'cfx-analysis-frameworks',
  'cfx-panel-frameworks',
  // Provider-specific map themes (cfx-map-theme:<provider>)
  'cfx-map-theme:auto',
  'cfx-map-theme:pmtiles',
  'cfx-map-theme:openfreemap',
  'cfx-map-theme:carto',
  // Live-stream mode
  'cfx-live-streams-always-on',
] as const;

export type CloudSyncKey = (typeof CLOUD_SYNC_KEYS)[number];
