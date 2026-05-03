import nodemailer from 'nodemailer';
import { decrypt } from '../lib/encryption';

export interface MailConfig {
    host: string;
    port: number;
    user: string;
    pass: string; // This will be the encrypted password object from DB as string
}

export const createTransporter = (config: MailConfig) => {
    // Parse the encrypted password
    let password = config.pass;
    try {
        const passObj = JSON.parse(config.pass);
        password = decrypt(passObj);
    } catch (e) {
        // If not JSON, assume it's plain text (fallback for dev)
    }

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
            user: config.user,
            pass: password,
        },
    });
};

export const sendMail = async (transporter: nodemailer.Transporter, mailOptions: nodemailer.SendMailOptions) => {
    return transporter.sendMail(mailOptions);
};
