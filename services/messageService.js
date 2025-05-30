import nodemailer from 'nodemailer';
import twilio from 'twilio';

// FIXED: Corrected development mode logic
const DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production';

let emailTransporter;
let twilioClient;

// Only initialize real services if not in development mode and credentials are provided
if (!DEVELOPMENT_MODE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        // FIXED: Correct function name
        emailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } catch (error) {
        console.error('Failed to initialize email transporter:', error);
    }
}

if (!DEVELOPMENT_MODE && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
    }
}

export const sendEmail = async (to, subject, content) => {
    try {
        // Development mode or missing credentials - simulate
        if (DEVELOPMENT_MODE || !emailTransporter) {
            console.log('📧 EMAIL SIMULATION:');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content: ${content}`);
            console.log('---');

            return {
                success: true,
                messageId: 'email-sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            };
        }

        // Real email sending
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html: content,
        };

        const result = await emailTransporter.sendMail(mailOptions);
        console.log('📧 Real email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

export const sendSMS = async (to, content) => {
    try {
        // Development mode or missing credentials - simulate
        if (DEVELOPMENT_MODE || !twilioClient) {
            console.log('💬 SMS SIMULATION:');
            console.log(`To: ${to}`);
            console.log(`Content: ${content}`);
            console.log('---');

            return {
                success: true,
                messageId: 'sms-sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            };
        }

        // Real SMS sending
        const message = await twilioClient.messages.create({
            body: content,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });

        console.log('💬 Real SMS sent:', message.sid);
        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('SMS sending error:', error);
        return { success: false, error: error.message };
    }
};

export const sendPushNotification = async (to, content) => {
    try {
        console.log('🔔 PUSH NOTIFICATION SIMULATION:');
        console.log(`To: ${to}`);
        console.log(`Content: ${content}`);
        console.log('---');

        return {
            success: true,
            messageId: 'push-sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        };
    } catch (error) {
        console.error('Push notification error:', error);
        return { success: false, error: error.message };
    }
};