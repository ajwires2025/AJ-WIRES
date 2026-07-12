"use client";

import * as React from "react";
import { Settings, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { subscribeToReminderSettings, updateReminderSettings } from "@/lib/accounts/reminders";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/accounts/types";
import type { ReminderSettings } from "@/lib/accounts/types";

export function SettingsClient() {
  const [settings, setSettings] = React.useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => subscribeToReminderSettings(setSettings), []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReminderSettings(settings);
      toast.success("Settings saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <Settings className="size-6 text-gold" /> Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">App-wide preferences for both Admin and CA.</p>

      <div className="mt-6 max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Reminders</h2>
        <div className="mt-4">
          <Label htmlFor="dueSoonDays">Flag bills as &quot;due soon&quot; this many days before the due date</Label>
          <Input
            id="dueSoonDays"
            type="number"
            min={1}
            max={30}
            className="mt-1.5 w-32"
            value={settings.dueSoonDays}
            onChange={(e) => setSettings({ dueSoonDays: Math.max(1, Number(e.target.value) || 1) })}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Used by the dashboard alerts panel and the daily overdue-digest email.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      </div>
    </div>
  );
}
