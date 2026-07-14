import { getSessionUser } from "@/lib/firebase/session";
import { GstSummaryClient } from "@/components/accounts/gst-summary-client";

export default async function GstSummaryPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <GstSummaryClient />;
}
