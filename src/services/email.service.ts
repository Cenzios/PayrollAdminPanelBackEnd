import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendPaymentConfirmationEmail = async (userEmail: string, fullName: string) => {
    const mailOptions = {
        from: `"CenzHRM" <${process.env.EMAIL_FROM}>`,
        to: userEmail,
        subject: 'Payment Confirmed - Welcome to CenzHRM',
        html: `
            // <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Payment Confirmation</h2>
                <p>Dear ${fullName},</p>
                <p>We are pleased to inform you that your manual payment has been successfully approved.</p>
                <p>Your subscription is now active, and you have full access to all features of CenzHRM.</p>
                <p><strong>You can now log in to your dashboard:</strong></p>
                <p><a href="https://payrolladmin.cenzios.com" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
                <p>Thank you for choosing CenzHRM!</p>
                <br>
                <p>Best regards,<br>Team CenzHRM</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};
