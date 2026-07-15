import nodemailer from 'nodemailer';

let testAccount: any = null;

// Dynamic Transporter builder
async function getTransporter() {
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');

    if (EMAIL_USER && EMAIL_PASS) {
        // Real SMTP configuration (Gmail or other providers)
        console.log(`[Mailer] Configuring SMTP transporter for: ${EMAIL_USER}`);
        return nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: EMAIL_PORT === 465, // true for 465, false for 587
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });
    }

    // Fallback: Generate real Ethereal SMTP test account for free real-time testing
    console.log('[Mailer] Email credentials missing. Initializing Ethereal Mail virtual sandbox...');
    if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
    }
    
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
}

/**
 * Sends a real secure OTP verification code to the user's email address.
 * If credentials are not set in .env, it utilizes Ethereal sandbox and returns the live preview link.
 */
export async function sendEmailOTP(recipientEmail: string, username: string, otp: string): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
        const transporter = await getTransporter();
        const EMAIL_USER = process.env.EMAIL_USER;

        const sender = EMAIL_USER || (testAccount ? testAccount.user : 'noreply@exammaster.com');
        
        const mailOptions = {
            from: `"ExamMaster Security" <${sender}>`,
            to: recipientEmail,
            subject: '🔒 Secure One-Time Password (OTP) - Account Recovery',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4f46e5; margin-top: 0; font-family: Outfit, sans-serif;">Account Recovery Verification</h2>
                    <p style="font-size: 14px; color: #4b5563;">Hello <strong>${username}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563;">You are receiving this email because you requested a password reset for your ExamMaster account.</p>
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; display: block; margin-bottom: 8px; font-weight: 600;">Your One-Time Password (OTP)</span>
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937; font-family: monospace;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">This OTP code is secure and will expire in 5 minutes. If you did not request this, you can safely ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Verification email dispatched to ${recipientEmail}. MessageId: ${info.messageId}`);

        // If using Ethereal, generate the virtual inbox preview link
        if (!EMAIL_USER) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`\n======================================================`);
                console.log(`[TEST INBOX] Real OTP email arrived in virtual sandbox!`);
                console.log(`View live email here: ${previewUrl}`);
                console.log(`======================================================\n`);
                return { 
                    success: true, 
                    url: previewUrl, 
                    message: 'Email sent successfully via test sandbox.'
                };
            }
        }

        return { success: true };
    } catch (e: any) {
        console.error('[Mailer] Send mail failed:', e);
        return { success: false, message: e.message };
    }
}
