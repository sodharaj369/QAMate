import { TokenAnalytics } from '../analytics/tokenAnalytics.js';

/**
 * Backward-compatible wrapper for the new TokenAnalytics tracker.
 */
export class TelemetryTracker extends TokenAnalytics {}
