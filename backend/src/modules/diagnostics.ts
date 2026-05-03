import dns from 'dns/promises';
import axios from 'axios';

export interface DiagnosticResult {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    ipScore: number;
    rawData: any;
}

export const runDiagnostics = async (domain: string, ip?: string): Promise<DiagnosticResult> => {
    const results: DiagnosticResult = {
        spf: false,
        dkim: false,
        dmarc: false,
        ipScore: 0,
        rawData: {}
    };

    try {
        // SPF Check
        const txtRecords = await dns.resolveTxt(domain);
        results.spf = txtRecords.some(records => records.some(record => record.includes('v=spf1')));
        results.rawData.spfRecords = txtRecords;

        // DMARC Check
        try {
            const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
            results.dmarc = dmarcRecords.some(records => records.some(record => record.includes('v=DMARC1')));
            results.rawData.dmarcRecords = dmarcRecords;
        } catch (e) {
            results.dmarc = false;
        }

        // DKIM Check (Basic check if any DKIM selector exists, usually requires a specific selector)
        // In a real scenario, we might check common selectors or wait for a test email.
        // For now, we'll look for default._domainkey
        try {
            const dkimRecords = await dns.resolveTxt(`default._domainkey.${domain}`);
            results.dkim = dkimRecords.length > 0;
            results.rawData.dkimRecords = dkimRecords;
        } catch (e) {
            results.dkim = false;
        }

        // IP Reputation (AbuseIPDB placeholder)
        if (ip && process.env.ABUSEIPDB_API_KEY) {
            try {
                const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
                    params: { ipAddress: ip, maxAgeInDays: 90 },
                    headers: { 'Key': process.env.ABUSEIPDB_API_KEY, 'Accept': 'application/json' }
                });
                results.ipScore = response.data.data.abuseConfidenceScore;
                results.rawData.ipReputation = response.data.data;
            } catch (e) {
                console.error('IP Reputation check failed:', e);
                results.ipScore = 0;
            }
        }

    } catch (error) {
        console.error('Diagnostics failed for domain:', domain, error);
    }

    return results;
};
