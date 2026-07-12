# A.J. Wires Accounts — internal guide

This is the internal bookkeeping/accounting app, built inside the same repo and
deploy as the public ajwires.com site. It lives under `/accounts/*` and is not
linked from the public nav — only Admin and CA accounts can sign in.

## Stack

- **Framework**: Next.js App Router, same codebase/deploy as the marketing site (Netlify).
- **Auth + database + file storage**: Firebase — Firestore (data), Firebase Auth
  (login, with a custom `role` claim of `admin` or `ca`), Firebase Storage (bill scans).
- **Email**: Resend, for the daily overdue digest and approval-gated customer reminders.
- **Charts**: Recharts, on the Dashboard.
- **Scheduled job**: a Netlify Scheduled Function (`netlify/functions/daily-reminder-digest.ts`)
  runs daily at 03:00 UTC (~8:30am IST).

## Environment variables

Local dev reads `.env.local` (never committed — see `.gitignore`). Production reads the
same variable names from Netlify's Site settings → Environment variables (set these
independently; `.env.local` is not deployed).

| Variable | Where it comes from | Required for |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Firebase Console → Project settings → your web app's config | Client-side Firebase (safe to expose) |
| `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Console → Project settings → Service accounts → Generate new private key | Server-side Admin SDK (session verification, the scheduled function). **Secret** — never commit or paste in chat. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | resend.com → API Keys, and a verified sending domain | Actually sending reminder emails. **Not set up yet** — until it is, reminders compute correctly but log as `not_configured` instead of sending. |

## Adding a user (Admin or CA)

There's no self-service signup or in-app "invite user" screen yet — this matches the
spec's "accounts are created by the Admin only (or seeded once)." To add or replace an
account today:

1. Open `scripts/seed-users.mjs`.
2. Edit the `USERS_TO_SEED` array with the real email/name/role you want (`role` must be
   `"admin"` or `"ca"`).
3. Run `node scripts/seed-users.mjs` from the project root (needs the `FIREBASE_ADMIN_*`
   vars in `.env.local`). It creates the Firebase Auth user and sets their role claim.
4. Tell the person their email + the temporary password you set, and ask them to change
   it after first login (Firebase Auth doesn't have a self-service password-reset flow
   wired up in this app yet — that'd be a future improvement).

To change an existing user's password without going through the app, use the Firebase
Admin SDK directly (`auth.updateUser(uid, { password })`) — there's no in-app UI for this.

## Firestore security rules

`firestore.rules` and `storage.rules` at the repo root are the source of truth. After
changing them, deploy with:

```
npx firebase deploy --only firestore:rules --project aj-wires-accounts
```

This requires `npx firebase login` once per machine (interactive browser login — can't
be scripted non-interactively without a service account that has the right IAM role,
which the default Firebase Admin SDK service account does not have).

## Day-to-day usage

- **Parties** and **Items** are master data — set these up first (or use "Add default
  items" on the Items page, which seeds GI Wire / Barbed Wire / Chain Link Fencing with
  placeholder HSN codes — verify those with your CA before relying on them).
- **Purchases** / **Sales**: record bills with line items; GST (CGST+SGST vs IGST),
  totals, and — for sales — margin are all calculated automatically from the place of
  supply and each item's GST rate.
- **Payments**: record money in/out against a specific bill; this updates that bill's
  paid amount and status automatically.
- **Dashboard**: month/FY-scoped summary tiles, trend charts, and an overdue alerts
  panel (red = overdue, amber = due soon, green = clear).
- **Reports** (top nav dropdown): Profit & Loss, Cash Flow, Aging (with a per-row "send
  reminder" action), Reconciliation, Stock Ledger, General Ledger, Trial Balance,
  Balance Sheet — each exportable to CSV where relevant.
- **Settings**: the "due soon" day threshold (used by the alerts panel and the daily
  digest), and the full-data Excel backup export.

## Known gaps / things to revisit

- **Bill scan uploads**: the upload field on Purchase/Sale forms saves the record either
  way, but the file itself won't actually upload until Firebase Storage is enabled on a
  plan that supports it (Storage requires the Blaze pay-as-you-go plan). Enable it in the
  Firebase Console → Storage when ready.
- **Resend email**: see the environment variables table above — reminders compute
  correctly today but don't send until this is configured.
- **No expense-voucher module**: the P&L report is revenue − COGS only (no rent,
  salaries, utilities, etc.), so Net Profit currently equals Gross Profit. Add an
  expenses collection + report if/when that's needed.
- **GST figures need CA sign-off**: HSN codes, GST rates, and the required HSN
  digit-length are working defaults throughout, not verified against your actual GST
  registration/turnover bracket.
