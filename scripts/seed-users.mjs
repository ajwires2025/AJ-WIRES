// One-off script to create the initial Admin and CA accounts.
// Run locally with: node scripts/seed-users.mjs
// Reads Firebase Admin credentials from .env.local — never commit real output.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value);
    env[key] = value;
  }
  return env;
}

// Fill these in before running, then delete your terminal history / this
// won't be committed since it's not read from any tracked file.
const USERS_TO_SEED = [
  { email: "admin@ajwires.com", password: "CHANGE_ME_ADMIN", name: "AJ Wires Admin", role: "admin" },
  { email: "ca@ajwires.com", password: "CHANGE_ME_CA", name: "AJ Wires CA", role: "ca" },
];

async function main() {
  const env = loadEnvLocal();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local");
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth();
  const db = getFirestore();

  for (const u of USERS_TO_SEED) {
    if (u.password.startsWith("CHANGE_ME")) {
      console.log(`Skipping ${u.email} — set a real password in scripts/seed-users.mjs first.`);
      continue;
    }

    const userRecord = await auth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: u.role, name: u.name });

    await db.collection("users").doc(userRecord.uid).set({
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: new Date().toISOString(),
    });

    console.log(`Created ${u.role}: ${u.email} (uid: ${userRecord.uid})`);
  }

  console.log("Done. Remember to change these passwords after first login.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
