/**
 * Google AdSense Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Sign up for Google AdSense: https://www.google.com/adsense
 * 2. Get your Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Create ad units in your AdSense dashboard
 * 4. Replace the placeholder values below with your actual IDs
 * 
 * AD PLACEMENT STRATEGY:
 * - Share Page: High traffic from viral sharing, best ROI
 * - Leaderboard: Users browsing content, native-style ads blend well
 * - Results Panel: Non-premium users only, banner below analysis
 * 
 * BEST PRACTICES:
 * - Premium users don't see ads (they've paid)
 * - Ads don't interrupt critical user flows (camera, analysis)
 * - Native ads in content areas, banners in peripheral areas
 */

export const AD_CONFIG = {
  // Your Google AdSense Publisher ID
  publisherId: 'ca-pub-5633162123365401',

  // Ad unit slot IDs (create these in your AdSense dashboard)
  slots: {
    // Share page - Banner ad between content and CTA
    // Expected high CTR due to engaged viral traffic
    sharePageBanner: 'XXXXXXXXXX', // TODO: Replace with your ad slot ID

    // Leaderboard - Native in-feed ads
    // Blends with user-generated content
    leaderboardNative1: 'XXXXXXXXXX', // After position 5
    leaderboardNative2: 'XXXXXXXXXX', // After position 15

    // Results panel - Banner for non-premium users
    // Encourages premium upgrade to remove ads
    resultsPanelBanner: 'XXXXXXXXXX',
  },

  // Feature flags for testing
  features: {
    // Enable ads in development mode (shows placeholders)
    showInDevelopment: true,
    
    // Enable sticky bottom banner (more aggressive monetization)
    enableStickyBanner: false,
  },
} as const;

/**
 * Revenue Optimization Tips:
 * 
 * 1. SHARE PAGE (Highest Priority)
 *    - This catches all viral traffic from shared links
 *    - Users are curious visitors, not existing users
 *    - Consider adding a second ad unit if traffic is high
 * 
 * 2. LEADERBOARD (Medium Priority)
 *    - Native ads blend with the face cards
 *    - Users spend time browsing = more impressions
 *    - Keep ads to 2 max to avoid clutter
 * 
 * 3. RESULTS PANEL (Lower Priority)
 *    - Only for non-premium users
 *    - Acts as soft upsell ("Upgrade to remove ads")
 *    - Don't place above the fold - let users see value first
 * 
 * WHAT NOT TO MONETIZE:
 * - Camera view (critical functionality)
 * - Protocol view (premium content)
 * - Auth modals (friction = churn)
 * - Analysis loading (frustrating)
 */

