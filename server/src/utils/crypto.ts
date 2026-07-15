import crypto from 'crypto';

// A constant fallback key is established, but can be overridden by env variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'd6F3m1Z9x2N5v8B3u6C9x0Z2v5B8n1M4'; // Must be 32 bytes/characters
const IV_LENGTH = 16; // AES standard Initialization Vector length

export function encrypt(text: string): string {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        return text;
    }
}

export function decrypt(text: string): string {
    if (!text) return '';
    try {
        const textParts = text.split(':');
        if (textParts.length < 2) {
            return text; // Not encrypted (fallback mode)
        }
        const ivStr = textParts[0];
        const encryptedStr = textParts.slice(1).join(':');

        // Hex format validation
        if (!/^[0-9a-fA-F]+$/.test(ivStr) || !/^[0-9a-fA-F]+$/.test(encryptedStr)) {
            return text;
        }

        const iv = Buffer.from(ivStr, 'hex');
        const encryptedText = Buffer.from(encryptedStr, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        return text; // Fallback if decryption fails (e.g. wrong key)
    }
}
