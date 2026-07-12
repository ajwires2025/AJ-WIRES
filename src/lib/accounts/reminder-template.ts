const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function buildReceivableReminderEmail(params: {
  partyName: string;
  invoiceNumber: string;
  dueDate: string;
  daysOverdue: number;
  outstanding: number;
}): { subject: string; html: string } {
  const overdueLine =
    params.daysOverdue > 0
      ? `which was due on ${params.dueDate} (${params.daysOverdue} day${params.daysOverdue === 1 ? "" : "s"} ago)`
      : `which is due on ${params.dueDate}`;

  const subject = `Payment reminder — Invoice ${params.invoiceNumber} (A.J. Wires)`;
  const html = `
    <p>Dear ${params.partyName},</p>
    <p>
      This is a friendly reminder that invoice <strong>${params.invoiceNumber}</strong> for
      <strong>${inr.format(params.outstanding)}</strong> is still outstanding, ${overdueLine}.
    </p>
    <p>
      If you've already made this payment, please disregard this message. Otherwise, we'd appreciate
      it if you could arrange payment at your earliest convenience. Feel free to reach out if you have
      any questions about this invoice.
    </p>
    <p>Thank you,<br/>A.J. Wires</p>
  `.trim();

  return { subject, html };
}
