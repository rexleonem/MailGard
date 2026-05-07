import prisma from './prisma';

export type EventType = 'SMTP' | 'QUEUE' | 'DIAGNOSTICS' | 'AI' | 'ADAPTIVE' | 'SECURITY';
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogOptions {
    type: EventType;
    severity: Severity;
    message: string;
    accountId?: string;
    userId?: string;
    payload?: any;
}

export const logger = {
    async log(options: LogOptions) {
        try {
            console.log(`[${options.severity}] ${options.type}: ${options.message}`);
            
            await prisma.systemEvent.create({
                data: {
                    type: options.type,
                    severity: options.severity,
                    message: options.message,
                    accountId: options.accountId,
                    userId: options.userId,
                    payload: options.payload || {}
                }
            });

            // Trigger alerts for critical/errors
            if (options.severity === 'CRITICAL' || (options.severity === 'ERROR' && options.type === 'SMTP')) {
                await this.createAlert(options);
            }
        } catch (error) {
            console.error('Logging failed:', error);
        }
    },

    async createAlert(options: LogOptions) {
        try {
            await prisma.alert.create({
                data: {
                    type: `${options.type}_FAILURE`,
                    severity: options.severity,
                    message: options.message,
                    accountId: options.accountId
                }
            });
        } catch (error) {
            console.error('Alert creation failed:', error);
        }
    }
};
