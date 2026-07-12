"use client";

import * as React from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buildReceivableReminderEmail } from "@/lib/accounts/reminder-template";
import { sendReceivableReminder } from "@/lib/accounts/reminders";
import type { AgingRow } from "@/lib/accounts/types";

export function SendReminderDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AgingRow | null;
}) {
  const [subject, setSubject] = React.useState("");
  const [html, setHtml] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!open || !row) return;
    const draft = buildReceivableReminderEmail({
      partyName: row.partyName,
      invoiceNumber: row.number,
      dueDate: row.dueDate,
      daysOverdue: row.daysOverdue,
      outstanding: row.outstanding,
    });
    setSubject(draft.subject);
    setHtml(draft.html);
  }, [open, row]);

  const handleSend = async () => {
    if (!row) return;
    setSending(true);
    try {
      const result = await sendReceivableReminder(row.id, subject, html);
      if (result.status === "sent") {
        toast.success(`Reminder sent to ${row.partyName}`);
        onOpenChange(false);
      } else if (result.status === "not_configured") {
        toast.error("Email isn't set up yet (RESEND_API_KEY missing) — logged as not_configured.");
      } else {
        toast.error(result.errorMessage || "Couldn't send. Try again.");
      }
    } catch {
      toast.error("Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="size-4.5 text-gold" /> Send Reminder</DialogTitle>
          <DialogDescription>
            Review and edit before sending to {row.partyName}
            {row.partyEmail ? ` (${row.partyEmail})` : " — no email on file yet"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reminder-subject">Subject</Label>
            <Input id="reminder-subject" className="mt-1.5" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reminder-body">Message (HTML)</Label>
            <Textarea id="reminder-body" className="mt-1.5" rows={10} value={html} onChange={(e) => setHtml(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !row.partyEmail}
            className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
