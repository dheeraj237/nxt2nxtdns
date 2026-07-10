import cron from 'node-cron';
import { profilesRepo, accountsRepo } from '@/lib/db/repo';
import { getProfileSetup, linkProfileToCurrentIp } from '@/lib/nextdns/endpoints';

export function initLinkedIpRefresherJob() {
  const job = cron.schedule('0 * * * *', async () => {
    console.log(`[LinkedIP] Starting hourly refresh job at ${new Date().toISOString()}`);

    const profiles = profilesRepo.getByAutoRefresh();
    if (profiles.length === 0) {
      console.log('[LinkedIP] No profiles with auto-refresh enabled');
      return;
    }

    console.log(`[LinkedIP] Processing ${profiles.length} profile(s) with auto-refresh enabled`);

    for (const profile of profiles) {
      try {
        const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
        const setup = await getProfileSetup(apiKey, profile.profile_id);

        if (!setup.linkedIpUpdateToken) {
          console.warn(
            `[LinkedIP] Profile ${profile.id} (${profile.account_label}/${profile.profile_id}): linkedIpUpdateToken not available`,
          );
          continue;
        }

        const linkedIp = await linkProfileToCurrentIp(setup.linkedIpUpdateToken, profile.profile_id);
        console.log(
          `[LinkedIP] Profile ${profile.id} (${profile.account_label}/${profile.profile_id}): re-linked to ${linkedIp}`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[LinkedIP] Profile ${profile.id} (${profile.account_label}/${profile.profile_id}): failed to re-link: ${message}`,
        );
      }
    }

    console.log(`[LinkedIP] Completed hourly refresh job at ${new Date().toISOString()}`);
  });

  return job;
}
