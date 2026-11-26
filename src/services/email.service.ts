import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { formatMoney } from '../utils/money';

dotenv.config();

export interface EmailResult {
    success: boolean;
    messageId?: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Fail fast instead of hanging requests when SMTP is unreachable/misconfigured
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

const escapeHtml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Customer app base URL (CUSTOMER_APP_URL), without a trailing slash; null when not configured. */
const customerAppUrl = (): string | null => {
    const value = (process.env.CUSTOMER_APP_URL ?? '').trim().replace(/\/+$/, '');
    return value.length > 0 ? value : null;
};

/** Button linking to the customer app's login page; omitted (with a warning) when CUSTOMER_APP_URL is unset. */
const loginButton = (label: string): string => {
    const base = customerAppUrl();
    if (!base) {
        console.warn('CUSTOMER_APP_URL is not set: customer emails are sent without a login link');
        return '';
    }
    return `<p><a href="${escapeHtml(`${base}/login`)}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px;">${escapeHtml(label)}</a></p>`;
};

// Never throws: SMTP failures are logged (without credentials) and reported as { success: false }
const deliver = async (mailOptions: nodemailer.SendMailOptions): Promise<EmailResult> => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error';
        console.error(`Error sending email "${String(mailOptions.subject)}": ${reason}`);
        return { success: false };
    }
};

/** What an approval did, so the confirmation email states exactly that. */
export interface PaymentConfirmationDetails {
    outcome: 'ACTIVATED' | 'EXTENDED' | 'INVOICE_ONLY';
    billingMonth: string;
    /** Invoice total, decimal string. */
    amount: string;
    subscriptionStatus: string;
    endDate: Date;
}

interface ConfirmationCopy {
    subject: string;
    paragraphs: string[];
    linkLabel: string;
}

const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const _confirmationCopy = (details: PaymentConfirmationDetails): ConfirmationCopy => {
    const paid = `Your manual payment of LKR ${formatMoney(details.amount)} for the ${escapeHtml(details.billingMonth)} invoice has been approved and the invoice is marked as paid.`;
    if (details.outcome === 'ACTIVATED') {
        return {
            subject: 'Payment Confirmed - Your CenzPayroll subscription is active',
            paragraphs: [paid, `Your subscription is now active until <strong>${formatDate(details.endDate)}</strong>, and you have full access to all features of CenzPayroll.`],
            linkLabel: 'Login to Dashboard',
        };
    }
    if (details.outcome === 'EXTENDED') {
        return {
            subject: 'Payment Confirmed - Your CenzPayroll subscription has been extended',
            paragraphs: [paid, `Your subscription has been extended. Your new end date is <strong>${formatDate(details.endDate)}</strong>.`],
            linkLabel: 'Login to Dashboard',
        };
    }
    return {
        subject: 'Payment Confirmed - Invoice settled',
        paragraphs: [
            paid,
            `Your subscription status has not changed: it is still <strong>${escapeHtml(details.subscriptionStatus.toLowerCase().replace(/_/g, ' '))}</strong>. `
            + 'If you expected this payment to activate or renew your subscription, please log in to check your plan or contact our support team.',
        ],
        linkLabel: 'Login to CenzPayroll',
    };
};

export const sendPaymentConfirmationEmail = async (
    userEmail: string,
    fullName: string,
    details: PaymentConfirmationDetails
): Promise<EmailResult> => {
    const copy = _confirmationCopy(details);
    const mailOptions = {
        from: `"CenzPayroll" <${process.env.EMAIL_FROM}>`,
        to: userEmail,
        subject: copy.subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Payment Confirmation</h2>
                <p>Dear ${escapeHtml(fullName)},</p>
                ${copy.paragraphs.map((text) => `<p>${text}</p>`).join('\n                ')}
                ${loginButton(copy.linkLabel)}
                <p>Thank you for choosing CenzPayroll!</p>
                <br>
                <p>Best regards,<br>Team CenzPayroll</p>
            </div>
        `,
    };

    return deliver(mailOptions);
};

export const sendPaymentRejectionEmail = async (userEmail: string, fullName: string): Promise<EmailResult> => {
    const mailOptions = {
        from: `"CenzPayroll" <${process.env.EMAIL_FROM}>`,
        to: userEmail,
        subject: 'Payment Rejected - Action Required for CenzPayroll',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #c0392b;">Payment Rejected</h2>
                <p>Dear ${escapeHtml(fullName)},</p>
                <p>We were unable to verify the bank slip submitted for your manual payment. This may be due to unclear, incomplete or mismatched payment details.</p>
                <p>To continue activating your subscription, please resubmit a valid bank slip with clear and accurate payment details.</p>
                ${loginButton('Resubmit Bank Slip')}
                <p>For any assistance, please contact our support team.</p>
                <br>
                <p>Best regards,<br>Team CenzPayroll</p>
            </div>
        `,
    };

    return deliver(mailOptions);
};

export const sendPaymentReminderEmail = async (
    userEmail: string,
    fullName: string,
    billingMonth: string,
    amount: string
): Promise<EmailResult> => {
    const mailOptions = {
        from: `"CenzPayroll" <${process.env.EMAIL_FROM}>`,
        to: userEmail,
        subject: `Payment Reminder - ${billingMonth} Invoice Overdue`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #c0392b;">Payment Reminder</h2>
                <p>Dear ${escapeHtml(fullName)},</p>
                <p>This is a friendly reminder that your invoice for <strong>${escapeHtml(billingMonth)}</strong> (LKR ${formatMoney(amount)}) is currently overdue.</p>
                <p>Please make the payment at your earliest convenience to avoid any disruption to your account.</p>
                ${loginButton('Pay Now')}
                <p>If you've already made this payment, please disregard this notice.</p>
                <br>
                <p>Best regards,<br>Team CenzPayroll</p>
            </div>
        `,
    };

    return deliver(mailOptions);
};