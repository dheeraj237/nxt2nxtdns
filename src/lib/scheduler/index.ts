import { initLinkedIpRefresherJob } from './linkedIpRefresher';

let initialized = false;

export function initScheduler() {
  if (initialized) {
    console.warn('[Scheduler] Already initialized, skipping');
    return;
  }

  console.log('[Scheduler] Initializing background jobs');
  initLinkedIpRefresherJob();
  console.log('[Scheduler] All jobs initialized');

  initialized = true;
}
