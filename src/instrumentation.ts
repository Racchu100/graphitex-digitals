export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.NEXT_PHASE?.includes('build')) {
    console.log("[Social Sync] Next.js Server started! Initializing social stats sync loop...");
    try {
      const { startSocialSyncLoop } = await import("./lib/social-sync");
      startSocialSyncLoop();
    } catch (err) {
      console.error("[Social Sync] Failed to initialize startup hook sync loop:", err);
    }
  }
}
