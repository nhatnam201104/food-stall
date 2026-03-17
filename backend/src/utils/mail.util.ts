import { mailer } from '../config/mailer';
import { config } from '../config';

export const sendPasswordResetEmail = async (
  toEmail: string,
  fullName: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = `${config.frontend.url}/auth/reset-password?token=${resetToken}`;

  await mailer.sendMail({
    from: config.mail.from,
    to: toEmail,
    subject: 'Đặt lại mật khẩu — Audio Tour Guide',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xin chào, ${fullName}!</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Audio Tour Guide.</p>
        <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>1 giờ</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#1677ff;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#666;font-size:13px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.<br/>
          Link reset: <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};
