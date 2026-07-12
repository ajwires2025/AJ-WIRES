import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_REMINDER_SETTINGS, type ReminderLog, type ReminderSettings } from "@/lib/accounts/types";

const remindersLogCol = collection(db, "remindersLog");
const settingsRef = doc(db, "settings", "reminders");

export function subscribeToReminderLogs(onChange: (logs: ReminderLog[]) => void) {
  const q = query(remindersLogCol, orderBy("sentAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ReminderLog));
  });
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) return DEFAULT_REMINDER_SETTINGS;
  return { ...DEFAULT_REMINDER_SETTINGS, ...snap.data() } as ReminderSettings;
}

export function subscribeToReminderSettings(onChange: (settings: ReminderSettings) => void) {
  return onSnapshot(settingsRef, (snap) => {
    onChange(snap.exists() ? ({ ...DEFAULT_REMINDER_SETTINGS, ...snap.data() } as ReminderSettings) : DEFAULT_REMINDER_SETTINGS);
  });
}

export async function updateReminderSettings(settings: ReminderSettings) {
  await setDoc(settingsRef, settings, { merge: true });
}

export type SendReminderResponse = {
  status: "sent" | "failed" | "not_configured";
  errorMessage?: string;
};

// Approval-gated: this only fires when the Admin/CA has reviewed the drafted
// email in the UI and explicitly clicked Send — never automatically.
export async function sendReceivableReminder(saleId: string, subject: string, html: string): Promise<SendReminderResponse> {
  const res = await fetch("/api/accounts/reminders/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saleId, subject, html }),
  });
  return res.json();
}
