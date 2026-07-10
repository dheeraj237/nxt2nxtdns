export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const port = process.env.PORT || '3000';
    console.log(`Application configured to listen on port ${port}`);

    const { initScheduler } = await import('@/lib/scheduler');
    initScheduler();
  }
}
