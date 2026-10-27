/**
 * State Transition Matrix for RolloutGuard Releases
 * 
 * Valid statuses:
 * - Draft: Created but rollout not started
 * - Running: Rollout currently in progress
 * - Healthy: Progressive rollout healthy (can be active stage or transitioning)
 * - Degraded: Rollout stopped due to threshold breach
 * - Rolled Back: Release safely rolled back to stable version
 * - Completed: 100% rollout verified and promoted to new stable
 * - Cancelled: Rollout terminated by operator
 */

const ALLOWED_TRANSITIONS = {
  Draft: ['Running', 'Cancelled'],
  Running: ['Running', 'Healthy', 'Degraded', 'Completed', 'Cancelled', 'Rolled Back'],
  Healthy: ['Running', 'Degraded', 'Completed', 'Cancelled', 'Rolled Back'],
  Degraded: ['Rolled Back', 'Running', 'Cancelled'],
  'Rolled Back': [], // Terminal state
  Completed: [],     // Terminal state
  Cancelled: []      // Terminal state
};

function canTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

function assertValidTransition(currentStatus, targetStatus) {
  if (!canTransition(currentStatus, targetStatus)) {
    const error = new Error(`Cannot transition release from '${currentStatus}' to '${targetStatus}'.`);
    error.statusCode = 400;
    error.name = 'InvalidStateTransitionError';
    throw error;
  }
}

module.exports = {
  ALLOWED_TRANSITIONS,
  canTransition,
  assertValidTransition
};
