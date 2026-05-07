import prisma from './prisma';
import { logger } from './logger';

export type TrustLevel = 'NEW' | 'LEARNING' | 'STABLE' | 'ELEVATED' | 'DEGRADED';

export interface AdaptiveConfig {
    maxDailyLimit: number;
    baseIncrement: number;
    cooldownPeriodHrs: number;
}

const DEFAULT_CONFIG: AdaptiveConfig = {
    maxDailyLimit: 1000,
    baseIncrement: 5,
    cooldownPeriodHrs: 24
};

export async function calculateAdaptiveState(accountId: string) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
            warmupState: true,
            diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 },
            emailLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
        }
    });

    if (!account || !account.warmupState) return null;

    const state = account.warmupState;
    const diag = account.diagnostics[0];
    const logs = account.emailLogs;
    const aiData = (diag?.rawData as any) || {};

    // 1. ANALYZE RECENT STABILITY
    const recentFailures = logs.filter(l => l.status === 'FAILED' || l.status === 'BOUNCED').length;
    const failureRate = logs.length > 0 ? recentFailures / logs.length : 0;
    
    let newTrustTrend = state.trustTrend;
    let newTrustLevel = state.trustLevel as TrustLevel;
    let anomalyDetected = state.anomalyDetected;

    // 2. DETECT ANOMALIES (Sudden failure spike)
    if (failureRate > 0.2 && logs.length >= 10) {
        anomalyDetected = true;
        newTrustLevel = 'DEGRADED';
        newTrustTrend = Math.max(-1.0, newTrustTrend - 0.5);
    }

    // 3. CRITICAL AUTHENTICATION ENFORCEMENT
    const authFailed = !diag?.spf || !diag?.dkim || !diag?.dmarc;
    if (authFailed) {
        await logger.log({
            type: 'SECURITY',
            severity: 'CRITICAL',
            message: `Authentication failure detected for ${account.email}. SPF/DKIM/DMARC must pass.`,
            accountId
        });
        
        await prisma.account.update({
            where: { id: accountId },
            data: { status: 'RISK_BLOCKED' }
        });

        newTrustLevel = 'DEGRADED';
        anomalyDetected = true;
    }

    // 4. TRUST EVOLUTION
    if (!authFailed) {
        if (failureRate < 0.05 && logs.length >= 20) {
            newTrustTrend = Math.min(1.0, newTrustTrend + 0.1);
            if (newTrustTrend > 0.5 && newTrustLevel === 'LEARNING') newTrustLevel = 'STABLE';
            if (newTrustTrend > 0.8 && newTrustLevel === 'STABLE') newTrustLevel = 'ELEVATED';
        } else if (failureRate > 0.1) {
            newTrustTrend = Math.max(-1.0, newTrustTrend - 0.2);
            if (newTrustTrend < -0.5) newTrustLevel = 'DEGRADED';
        }
    }

    // 5. CALCULATE ADAPTIVE LIMIT
    let adaptiveLimit = aiData.recommended_daily_limit || 0;
    
    if (newTrustLevel === 'NEW') adaptiveLimit = Math.min(adaptiveLimit, 10);
    if (newTrustLevel === 'DEGRADED') adaptiveLimit = Math.floor(adaptiveLimit * 0.5);
    if (anomalyDetected) adaptiveLimit = Math.min(adaptiveLimit, 5);

    const trendMultiplier = 1 + (newTrustTrend * 0.2);
    adaptiveLimit = Math.floor(adaptiveLimit * trendMultiplier);

    const updatedState = await prisma.warmupState.update({
        where: { accountId },
        data: {
            trustLevel: newTrustLevel,
            trustTrend: newTrustTrend,
            anomalyDetected,
            cooldownUntil: anomalyDetected ? new Date(Date.now() + DEFAULT_CONFIG.cooldownPeriodHrs * 3600000) : state.cooldownUntil
        }
    });

    return {
        ...updatedState,
        adaptiveLimit: Math.max(0, Math.min(adaptiveLimit, DEFAULT_CONFIG.maxDailyLimit)),
        failureRate,
        isRecovering: anomalyDetected && failureRate < 0.05
    };
}

export function getNaturalDelay() {
    return Math.floor(Math.random() * (4 * 3600000 - 3600000) + 3600000);
}
