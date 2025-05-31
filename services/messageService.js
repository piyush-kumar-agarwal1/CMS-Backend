import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

// Force reload environment variables - this is the key fix!
dotenv.config();

// FIXED: Corrected development mode logic
const DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production';

let emailTransporter;
let twilioClient;

// Only initialize real services if not in development mode and credentials are provided
if (!DEVELOPMENT_MODE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        emailTransporter = nodemailer.createTransporter({
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

// Add debugging
console.log('🔧 Twilio Setup Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DEVELOPMENT_MODE:', DEVELOPMENT_MODE);
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');

// Force Twilio initialization regardless of NODE_ENV for testing
const forceRealSMS = true; // Set to true to force real SMS sending

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        console.log('✅ Twilio client initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error);
    }
} else {
    console.log('⚠️ Twilio credentials missing - running in simulation mode');
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
        // Force real SMS sending if credentials are available
        if (!forceRealSMS && (DEVELOPMENT_MODE || !twilioClient)) {
            console.log('💬 SMS SIMULATION:');
            console.log(`To: ${to}`);
            console.log(`Content: ${content}`);
            console.log('---');

            return {
                success: true,
                messageId: 'sms-sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            };
        }

        // Real SMS sending - this is what you want!
        if (!twilioClient) {
            // Try to initialize again if it failed before
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                twilioClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
            } else {
                throw new Error('Twilio credentials not available');
            }
        }

        const message = await twilioClient.messages.create({
            body: content,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });

        console.log('📱 REAL SMS SENT:', message.sid);
        console.log(`To: ${to}`);
        console.log(`Content: ${content}`);
        console.log(`Message ID: ${message.sid}`);
        console.log('---');

        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('SMS sending error:', error);
        console.log('💬 SMS SIMULATION (fallback):');
        console.log(`To: ${to}`);
        console.log(`Content: ${content}`);
        console.log('---');

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