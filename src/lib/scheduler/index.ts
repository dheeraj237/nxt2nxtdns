import cron from 'node-cron';
import { initLinkedIpRefresherJob } from './linkedIpRefresher';
import { initScheduledProfileSwapJob } from './scheduledProfileSwapRunner';

let initialized = false;

export function initScheduler() {
  if (initialized) {
    console.warn('[Scheduler] Already initialized, skipping');
    return;
  }

  console.log('[Scheduler] Initializing background jobs');
  initLinkedIpRefresherJob();
  initScheduledProfileSwapJob();
  console.log('[Scheduler] All jobs initialized');

  initialized = true;
}
