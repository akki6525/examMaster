import axios from 'axios';

/**
 * Sends a real SMS with an OTP code to the user's mobile number.
 * Supports Twilio and Fast2SMS based on active environment variables.
 */
export async function sendRealSMS(phone: string, otp: string): Promise<boolean> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
        return false;
    }

    // 1. Fast2SMS Integration (India)
    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
    if (FAST2SMS_API_KEY) {
        try {
            console.log(`[SMS] Sending real SMS via Fast2SMS to ${cleanPhone}...`);
            const res = await axios.post(
                'https://www.fast2sms.com/dev/bulkV2',
                {
                    variables_values: otp,
                    route: 'otp',
                    numbers: cleanPhone
                },
                {
                    headers: {
                        authorization: FAST2SMS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (res.data && res.data.return === true) {
                console.log(`[SMS] Fast2SMS delivered successfully:`, res.data);
                return true;
            }
            console.warn(`[SMS] Fast2SMS returned error response:`, res.data);
        } catch (err: any) {
            console.error('[SMS] Fast2SMS API error:', err.response?.data || err.message);
        }
    }

    // 2. Twilio Integration (Global)
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
        try {
            console.log(`[SMS] Sending real SMS via Twilio to ${cleanPhone}...`);
            // Format phone number to E.164 standard (requires country code prefix)
            let formattedPhone = cleanPhone;
            if (!formattedPhone.startsWith('+')) {
                if (formattedPhone.length === 10) {
                    formattedPhone = '+91' + formattedPhone; // Prepends default country code (India) if 10-digits
                } else {
                    formattedPhone = '+' + formattedPhone;
                }
            }

            const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
            const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

            const params = new URLSearchParams();
            params.append('To', formattedPhone);
            params.append('From', TWILIO_PHONE_NUMBER);
            params.append('Body', `ExamMaster Secure OTP: Your verification code is ${otp}. Valid for 5 minutes.`);

            const res = await axios.post(url, params.toString(), {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (res.data && res.data.sid) {
                console.log(`[SMS] Twilio message dispatched successfully (SID: ${res.data.sid})`);
                return true;
            }
        } catch (err: any) {
            console.error('[SMS] Twilio API error:', err.response?.data || err.message);
        }
    }

    console.log(`[SMS Simulation] Real SMS credentials not configured. OTP: ${otp} logged to console log.`);
    return false;
}
