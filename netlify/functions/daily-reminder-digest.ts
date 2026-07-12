import { schedule } from "@netlify/functions";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { Resend } from "resend";

// Self-contained on purpose: Netlify's function bundler is a separate
// pipeline from Next.js's build and doesn't resolve the `@/*` tsconfig path
// alias, so this duplicates the handful of small helpers it needs rather
// than importing from src/lib/accounts.

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env vars are missing.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function daysOverdue(dueDate: string, asOf: Date = new Date()): number {
  const due = new Date(dueDate);
  const diffMs = asOf.setHours(0, 0, 0, 0) - due.setHours(0, 0, 0, 0);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Row = { number: string; partyName: string; dueDate: string; days: number; outstanding: number };

function rowsHtml(rows: Row[]): string {
  if (rows.length === 0) return "<p>None.</p>";
  const items = rows
    .sort((a, b) => b.days - a.days)
    .map(
      (r) =>
        `<li>${r.number} — ${r.partyName} — ${inr.format(r.outstanding)} — ${
          r.days > 0 ? `${r.days} day(s) overdue` : `due in ${-r.days} day(s)`
        }</li>`
    )
    .join("");
  return `<ul>${items}</ul>`;
}

const handler = schedule("0 3 * * *", async () => {
  const app = getAdminApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const settingsSnap = await db.collection("settings").doc("reminders").get();
  const dueSoonDays = (settingsSnap.data()?.dueSoonDays as number) ?? 3;

  const [salesSnap, purchasesSnap] = await Promise.all([
    db.collection("sales").where("paymentStatus", "!=", "paid").get(),
    db.collection("purchases").where("paymentStatus", "!=", "paid").get(),
  ]);

  const overdueReceivables: Row[] = [];
  const dueSoonReceivables: Row[] = [];
  for (const doc of salesSnap.docs) {
    const s = doc.data();
    const days = daysOverdue(s.dueDate);
    const row: Row = {
      number: s.invoiceNumber,
      partyName: s.customerName,
      dueDate: s.dueDate,
      days,
      outstanding: s.grandTotal - s.amountReceived,
    };
    if (days > 0) overdueReceivables.push(row);
    else if (days > -dueSoonDays) dueSoonReceivables.push(row);
  }

  const overduePayables: Row[] = [];
  const dueSoonPayables: Row[] = [];
  for (const doc of purchasesSnap.docs) {
    const p = doc.data();
    const days = daysOverdue(p.dueDate);
    const row: Row = {
      number: p.billNumber,
      partyName: p.supplierName,
      dueDate: p.dueDate,
      days,
      outstanding: p.grandTotal - p.amountPaid,
    };
    if (days > 0) overduePayables.push(row);
    else if (days > -dueSoonDays) dueSoonPayables.push(row);
  }

  const totalFlagged =
    overdueReceivables.length + dueSoonReceivables.length + overduePayables.length + dueSoonPayables.length;

  if (totalFlagged === 0) {
    console.log("Daily reminder digest: nothing overdue or due soon — skipping email.");
    return { statusCode: 200, body: "nothing to report" };
  }

  const html = `
    <h2>A.J. Wires — Overdue &amp; Due-Soon Bills</h2>
    <h3>Receivables — overdue (customers owe you)</h3>
    ${rowsHtml(overdueReceivables)}
    <h3>Receivables — due within ${dueSoonDays} day(s)</h3>
    ${rowsHtml(dueSoonReceivables)}
    <h3>Payables — overdue (you owe suppliers)</h3>
    ${rowsHtml(overduePayables)}
    <h3>Payables — due within ${dueSoonDays} day(s)</h3>
    ${rowsHtml(dueSoonPayables)}
  `.trim();

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.log("RESEND_API_KEY / RESEND_FROM_EMAIL not set — digest computed but not emailed.", html);
    return { statusCode: 200, body: "email not configured" };
  }

  const users = await auth.listUsers();
  const recipients = users.users.map((u) => u.email).filter((e): e is string => !!e);

  const resend = new Resend(apiKey);
  await Promise.all(
    recipients.map((to) =>
      resend.emails.send({ from, to, subject: "A.J. Wires — Daily overdue bills digest", html })
    )
  );

  console.log(`Daily reminder digest sent to ${recipients.length} recipient(s).`);
  return { statusCode: 200, body: "sent" };
});

export { handler };
