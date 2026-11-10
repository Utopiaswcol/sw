/**
 * Web Haptics API Centralized Service
 * Safely invokes navigator.vibrate with predefined sensory patterns for mobile UX.
 */
class HapticsService {
  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Ultra-light pulse (8ms) for standard tab navigation, pill clicks and subtle selections.
   */
  selection(): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate(8);
      } catch (e) {
        // Silently ignore if blocked by browser policy
      }
    }
  }

  /**
   * Light pulse (20ms) for state toggles, identity mode switches, and action confirmations.
   */
  toggle(): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Rhythmic success pattern ([15, 35, 20] ms) for vault unlocks, matches, and approvals.
   */
  success(): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate([15, 35, 20]);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Warning alert pattern ([40, 50, 40] ms) for security breaches, screenshot attempts, or privacy curtain triggers.
   */
  warning(): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Alias for warning vibration pattern for error states.
   */
  error(): void {
    this.warning();
  }
}

export const haptics = new HapticsService();
