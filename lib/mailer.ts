import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { JWT } from "google-auth-library";

// 공용 메일 발송 — (A) Google 서비스계정 위임(Gmail API) 우선, 없으면 (B) Gmail SMTP 앱비번 폴백.
// env: GMAIL_SA_CLIENT_EMAIL / GMAIL_SA_PRIVATE_KEY / GMAIL_FROM  또는  GMAIL_USER / GMAIL_APP_PASSWORD
function env() {
  const SA_EMAIL = process.env.GMAIL_SA_CLIENT_EMAIL;
  const SA_KEY = process.env.GMAIL_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const GMAIL_FROM = process.env.GMAIL_FROM || GMAIL_USER || SA_EMAIL;
  return { SA_EMAIL, SA_KEY, GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM };
}

// 메일 발송 환경이 갖춰졌는지
export function mailerConfigured() {
  const { SA_EMAIL, SA_KEY, GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM } = env();
  return !!((SA_EMAIL && SA_KEY && GMAIL_FROM) || (GMAIL_USER && GMAIL_APP_PASSWORD));
}

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const { SA_EMAIL, SA_KEY, GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM } = env();
  const useServiceAccount = !!(SA_EMAIL && SA_KEY && GMAIL_FROM);
  const useSmtp = !!(GMAIL_USER && GMAIL_APP_PASSWORD);
  if (!useServiceAccount && !useSmtp) throw new Error("mailer not configured");

  const fromHeader = `"Supercoder" <${GMAIL_FROM}>`;
  const { to, subject, html, replyTo } = opts;

  if (useServiceAccount) {
    const client = new JWT({
      email: SA_EMAIL,
      key: SA_KEY,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      subject: GMAIL_FROM, // 위임(impersonate) 대상 = 발신 계정
    });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("서비스 계정 토큰 발급 실패");
    const mime = await new MailComposer({ from: fromHeader, to, subject, html, replyTo }).compile().build();
    const raw = mime.toString("base64url");
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
  } else {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER!, pass: GMAIL_APP_PASSWORD! },
    });
    await transporter.sendMail({ from: fromHeader, to, subject, html, replyTo });
  }
}
