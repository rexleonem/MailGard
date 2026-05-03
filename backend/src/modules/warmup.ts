export const calculateDailyLimit = (dayNumber: number, aiLimit: number): number => {
    let baseLimit = 5;
    
    if (dayNumber >= 1 && dayNumber <= 3) {
        baseLimit = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
    } else if (dayNumber >= 4 && dayNumber <= 7) {
        baseLimit = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    } else {
        baseLimit = aiLimit;
    }

    // Never exceed hard cap for shared hosting
    return Math.min(baseLimit, 20, aiLimit);
};

export const shouldThrottle = (bounceRate: number, failureCount: number): boolean => {
    if (bounceRate > 10) return true;
    if (failureCount > 3) return true; // 3 consecutive failures
    return false;
};
