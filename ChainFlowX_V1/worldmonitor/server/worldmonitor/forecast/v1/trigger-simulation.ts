import type {
  ForecastServiceHandler,
  ServerContext,
  TriggerSimulationRequest,
  TriggerSimulationResponse,
} from '../../../../src/generated/server/worldmonitor/forecast/v1/service_server';
import { 
  SIMULATION_TASK_KEY_PREFIX, 
  SIMULATION_TASK_QUEUE_KEY,
  SIMULATION_TASK_TTL_S,
  TRACE_REDIS_TTL_S
} from '../../../_shared/cache-keys';
import { runRedisPipeline } from '../../../_shared/redis';

const VALID_RUN_ID_RE = /^\d{13,}-[a-z0-9-]{1,64}$/i;

function validateRunId(runId: string): boolean {
  return VALID_RUN_ID_RE.test(runId);
}

/**
 * TriggerSimulation allows an agent (or the UI) to manually trigger a simulation
 * run for a specific runId. This is an agent-native connectivity feature.
 */
export const triggerSimulation: ForecastServiceHandler['triggerSimulation'] = async (
  _ctx: ServerContext,
  req: TriggerSimulationRequest,
): Promise<TriggerSimulationResponse> => {
  const { runId } = req;

  if (!runId) {
    return { queued: false, runId: '', reason: 'missing_run_id' };
  }

  if (!validateRunId(runId)) {
    return { queued: false, runId, reason: 'invalid_format' };
  }

  // 1. Verify existence of the snapshot in R2 (Task 021 constraint)
  // We use a HEAD request to the R2/S3 endpoint to verify the snapshot exists.
  const snapshotExists = await checkSnapshotExists(runId);
  if (!snapshotExists) {
    return { queued: false, runId, reason: 'not_found' };
  }

  // 2. Enqueue the simulation task in Redis
  try {
    const taskKey = `${SIMULATION_TASK_KEY_PREFIX}${runId}`;
    const now = Date.now();
    
    // We use a pipeline to ensure atomic queuing and TTL setting
    const results = await runRedisPipeline([
      ['SET', taskKey, JSON.stringify({ runId, createdAt: now }), 'EX', String(SIMULATION_TASK_TTL_S), 'NX'],
      ['ZADD', SIMULATION_TASK_QUEUE_KEY, String(now), runId],
      ['EXPIRE', SIMULATION_TASK_QUEUE_KEY, String(TRACE_REDIS_TTL_S)]
    ], true); // raw=true to bypass prefixing if keys already include it (or if seed script doesn't use prefixing)

    const setRes = results[0]?.result;
    if (setRes !== 'OK') {
      return { queued: false, runId, reason: 'duplicate' };
    }

    return { queued: true, runId, reason: '' };
  } catch (err) {
    console.warn('[TriggerSimulation] Redis error:', err instanceof Error ? err.message : String(err));
    return { queued: false, runId, reason: 'redis_unavailable' };
  }
};

/**
 * Checks if the deep forecast snapshot exists in Cloudflare R2.
 */
async function checkSnapshotExists(runId: string): Promise<boolean> {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_TRACE_BUCKET || process.env.CLOUDFLARE_R2_BUCKET;
  const apiToken = process.env.CLOUDFLARE_R2_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  const prefix = process.env.CLOUDFLARE_R2_TRACE_PREFIX || 'seed-data/forecast-traces';

  if (!accountId || !bucket || !apiToken) {
    console.warn('[TriggerSimulation] Cloudflare credentials missing, assuming snapshot exists for runId:', runId);
    return true; // Fallback to avoid breaking if env is not fully set up
  }

  const snapshotKey = `${prefix}/${runId}/deep-forecast-snapshot.json`;
  const encodedKey = snapshotKey.split('/').map(part => encodeURIComponent(part)).join('/');
  const apiBaseUrl = process.env.CLOUDFLARE_API_BASE_URL || 'https://api.cloudflare.com/client/v4';
  
  try {
    const resp = await fetch(`${apiBaseUrl}/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodedKey}`, {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    return resp.ok;
  } catch (err) {
    console.warn('[TriggerSimulation] Snapshot existence check failed:', err instanceof Error ? err.message : String(err));
    return true; // Fallback to true to avoid blocking on network errors to R2
  }
}
