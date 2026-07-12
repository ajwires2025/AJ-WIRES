import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/accounts/email";

const bodySchema = z.object({
  saleId: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { saleId, subject, html } = parsed.data;

  const db = adminDb();
  const saleSnap = await db.collection("sales").doc(saleId).get();
  if (!saleSnap.exists) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  const sale = saleSnap.data()!;

  let partyEmail = "";
  if (sale.customerId) {
    const partySnap = await db.collection("parties").doc(sale.customerId).get();
    partyEmail = (partySnap.data()?.email as string) ?? "";
  }

  if (!partyEmail) {
    await db.collection("remindersLog").add({
      billType: "sale",
      billId: saleId,
      billNumber: sale.invoiceNumber ?? "",
      partyName: sale.customerName ?? "",
      sentTo: "",
      channel: "email",
      subject,
      status: "failed",
      errorMessage: "Customer has no email address on file.",
      sentBy: user.email,
      sentAt: new Date().toISOString(),
    });
    return NextResponse.json({ status: "failed", errorMessage: "Customer has no email address on file." });
  }

  const result = await sendEmail({ to: partyEmail, subject, html });

  await db.collection("remindersLog").add({
    billType: "sale",
    billId: saleId,
    billNumber: sale.invoiceNumber ?? "",
    partyName: sale.customerName ?? "",
    sentTo: partyEmail,
    channel: "email",
    subject,
    status: result.status,
    errorMessage: "errorMessage" in result ? result.errorMessage : "",
    sentBy: user.email,
    sentAt: new Date().toISOString(),
  });

  return NextResponse.json(result);
}
