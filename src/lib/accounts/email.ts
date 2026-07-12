import "server-only";
import { Resend } from "resend";

export type SendEmailResult =
  | { status: "sent" }
  | { status: "not_configured"; errorMessage: string }
  | { status: "failed"; errorMessage: string };

// RESEND_API_KEY isn't set up yet — every caller degrades gracefully (logged
// as "not_configured" rather than throwing) so the rest of the reminders
// feature works before email is wired up.
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      status: "not_configured",
      errorMessage: "RESEND_API_KEY / RESEND_FROM_EMAIL not set yet — email sending is disabled.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      return { status: "failed", errorMessage: error.message };
    }
    return { status: "sent" };
  } catch (err) {
    return { status: "failed", errorMessage: err instanceof Error ? err.message : "Unknown error" };
  }
}
