"use client";

import * as React from "react";
import { History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subscribeToReminderLogs } from "@/lib/accounts/reminders";
import type { ReminderLog } from "@/lib/accounts/types";

const STATUS_BADGE: Record<ReminderLog["status"], string> = {
  sent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  not_configured: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const STATUS_ICON: Record<ReminderLog["status"], React.ReactNode> = {
  sent: <CheckCircle2 className="size-3.5" />,
  failed: <XCircle className="size-3.5" />,
  not_configured: <AlertCircle className="size-3.5" />,
};

export function RemindersLogClient() {
  const [logs, setLogs] = React.useState<ReminderLog[]>([]);

  React.useEffect(() => subscribeToReminderLogs(setLogs), []);

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <History className="size-6 text-gold" /> Reminders Log
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Every reminder email sent or attempted, newest first.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Sent at</th>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-left">Sent to</th>
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Sent by</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No reminders sent yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(log.sentAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{log.billNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.partyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.sentTo || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.sentBy}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className={`gap-1 ${STATUS_BADGE[log.status]}`}>
                        {STATUS_ICON[log.status]} {log.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
