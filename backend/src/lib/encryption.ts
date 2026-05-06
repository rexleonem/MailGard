import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';

// Ensure key is 32 bytes
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export const encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

export const decrypt = (hash: { iv: string, content: string }) => {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};
