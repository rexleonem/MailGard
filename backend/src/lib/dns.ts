import { resolveTxt } from 'dns/promises';

export const checkSPF = async (domain: string) => {
    try {
        const records = await resolveTxt(domain);
        return records.some(record => record.join(' ').includes('v=spf1'));
    } catch {
        return false;
    }
};

export const checkDMARC = async (domain: string) => {
    try {
        const records = await resolveTxt(`_dmarc.${domain}`);
        return records.some(record => record.join(' ').includes('v=DMARC1'));
    } catch {
        return false;
    }
};

export const checkDKIM = async (domain: string, selector: string = 'default') => {
    try {
        const records = await resolveTxt(`${selector}._domainkey.${domain}`);
        return records.length > 0;
    } catch {
        return false;
    }
};
