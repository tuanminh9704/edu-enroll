import nodemailer from 'nodemailer';
import { config } from '../../configs';

class EmailService {
  private isConfigured() {
    if (config.nodeEnv === 'test') return false;
    return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async sendOtp(email: string, otp: string, type: 'register' | 'forgot_password') {
    const subject = type === 'register'
      ? 'Ma OTP xac thuc tai khoan Trung tam ngon ngu Apex'
      : 'Ma OTP dat lai mat khau Trung tam ngon ngu Apex';

    if (!this.isConfigured()) {
      console.log(`[OTP][EMAIL_DISABLED] ${subject} - ${email} => ${otp}`);
      return { sent: false, reason: 'SMTP is not configured' };
    }

    try {
      await this.createTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject,
        text: `Ma OTP cua ban la ${otp}. Ma co hieu luc trong 1 phut.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827">
            <h2 style="color:#4f46e5">Trung tâm ngôn ngữ Apex</h2>
            <p>${type === 'register' ? 'Cam on ban da dang ky tai khoan.' : 'Ban dang yeu cau dat lai mat khau.'}</p>
            <p>Ma OTP cua ban:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #4f46e5; margin: 16px 0">${otp}</div>
            <p>Ma co hieu luc trong <strong>1 phut</strong>. Khong chia se ma nay cho nguoi khac.</p>
          </div>
        `,
      });
      return { sent: true };
    } catch (err) {
      console.error(`[OTP][EMAIL_FAILED] ${email}:`, (err as Error).message);
      console.log(`[OTP][FALLBACK] ${subject} - ${email} => ${otp}`);
      return { sent: false, reason: (err as Error).message };
    }
  }

  async sendNotification(email: string, subject: string, message: string, link?: string) {
    if (!this.isConfigured()) {
      console.log(`[NOTIFY][EMAIL_DISABLED] ${subject} - ${email}: ${message}`);
      return { sent: false, reason: 'SMTP is not configured' };
    }

    try {
      await this.createTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject,
        text: `${message}${link ? `\n\nXem chi tiet: ${link}` : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827">
            <h2 style="color:#4f46e5">Trung tâm ngôn ngữ Apex</h2>
            <p>${message}</p>
            ${link ? `<p><a href="${link}" style="color:#4f46e5">Xem chi tiet</a></p>` : ''}
          </div>
        `,
      });
      return { sent: true };
    } catch (err) {
      console.error(`[NOTIFY][EMAIL_FAILED] ${email}:`, (err as Error).message);
      return { sent: false, reason: (err as Error).message };
    }
  }
}

export const emailService = new EmailService();
