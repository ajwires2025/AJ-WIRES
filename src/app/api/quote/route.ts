import { NextResponse } from "next/server";
import { z } from "zod";

const quoteSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().min(7),
  email: z.email(),
  product: z.string().min(1),
  quantity: z.string().optional(),
  specifications: z.string().optional(),
  deliveryLocation: z.string().min(2),
  message: z.string().optional(),
});

// TODO: wire up an email/CRM provider (e.g. Resend) to deliver these leads.
export async function POST(request: Request) {
  const body = await request.json();
  const result = quoteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  console.log("New quote request:", result.data);

  return NextResponse.json({ ok: true });
}
