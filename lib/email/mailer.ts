/**
 * mailer.ts — nodemailer transporter configured from environment variables.
 *
 * Required .env keys:
 *   SMTP_HOST   e.g. smtp.gmail.com
 *   SMTP_PORT   e.g. 587
 *   SMTP_USER   your Gmail address
 *   SMTP_PASS   Gmail App Password (not your login password)
 *   SMTP_FROM   e.g. "LOOP Reports <you@gmail.com>"
 *
 * To get a Gmail App Password:
 *   1. Go to https://myaccount.google.com/apppasswords
 *   2. Select "Mail" and your device
 *   3. Copy the 16-character password into SMTP_PASS
 */
import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
    if (_transporter) return _transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new Error(
            "Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env"
        );
    }

    _transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });

    return _transporter;
}

export async function sendMail(opts: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}): Promise<void> {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "LOOP";

    await transporter.sendMail({
        from,
        to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
    });
}
