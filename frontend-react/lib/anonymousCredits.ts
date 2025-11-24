// Anonymous credits management
export class AnonymousCreditsManager {
  private static ANONYMOUS_USER_KEY = 'eternion_anonymous_user';
  private static CREDITS_KEY = 'eternion_anonymous_credits';
  private static MONTH_KEY = 'eternion_anonymous_month';

  // Generate a unique anonymous user ID
  private static generateAnonymousId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const screenInfo = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return btoa(`${timestamp}-${random}-${screenInfo}-${timezone}`).substring(0, 16);
  }

  // Get or create anonymous user ID
  static getAnonymousUserId(): string {
    let userId = localStorage.getItem(this.ANONYMOUS_USER_KEY);
    
    if (!userId) {
      userId = this.generateAnonymousId();
      localStorage.setItem(this.ANONYMOUS_USER_KEY, userId);
    }
    
    return userId;
  }

  // Get current month string (YYYY-MM)
  private static getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Check if we need to reset credits for new month
  private static checkMonthReset(): void {
    const currentMonth = this.getCurrentMonth();
    const storedMonth = localStorage.getItem(this.MONTH_KEY);
    
    if (storedMonth !== currentMonth) {
      // New month - reset credits
      localStorage.setItem(this.CREDITS_KEY, '3');
      localStorage.setItem(this.MONTH_KEY, currentMonth);
    }
  }

  // Get remaining anonymous credits
  static getRemainingCredits(): number {
    this.checkMonthReset();
    
    const credits = localStorage.getItem(this.CREDITS_KEY);
    return credits ? parseInt(credits) : 3;
  }

  // Use a credit
  static useCredit(): boolean {
    this.checkMonthReset();
    
    const currentCredits = this.getRemainingCredits();
    
    if (currentCredits > 0) {
      localStorage.setItem(this.CREDITS_KEY, (currentCredits - 1).toString());
      return true;
    }
    
    return false;
  }

  // Get anonymous user data for API calls
  static getAnonymousUserData() {
    return {
      anonymous_user_id: this.getAnonymousUserId(),
      ip_address: '', // Will be filled by backend
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      month: this.getCurrentMonth()
    };
  }

  // Clear anonymous data (when user signs up)
  static clearAnonymousData(): void {
    localStorage.removeItem(this.ANONYMOUS_USER_KEY);
    localStorage.removeItem(this.CREDITS_KEY);
    localStorage.removeItem(this.MONTH_KEY);
  }
}
