import fs from "fs";
import path from "path";

/**
 * Server-only JSON stores for the airdrop.
 * Do NOT import from client components — uses the filesystem.
 */

export interface Application {
  address: string;
  ts: string;
  ip?: string;
  ref?: string;
  tweetUrl?: string;
  status: "pending";
}

export interface ReferralRegistration {
  address: string;
  /** first time this wallet generated its referral link */
  ts: string;
  ip?: string;
  /** how many times the link was (re)generated */
  hits: number;
}

export type ApplicationsFile = Record<string, Application>;
export type ReferralsFile = Record<string, ReferralRegistration>;

const APPLICATIONS_PATH = path.join(process.cwd(), "airdrop-applications.json");
const REFERRALS_PATH = path.join(process.cwd(), "referral-links.json");

function loadJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function loadApplications(): ApplicationsFile {
  return loadJson<ApplicationsFile>(APPLICATIONS_PATH) ?? {};
}

export function saveApplications(apps: ApplicationsFile) {
  fs.writeFileSync(APPLICATIONS_PATH, JSON.stringify(apps, null, 2), "utf8");
}

export function loadReferralRegs(): ReferralsFile {
  return loadJson<ReferralsFile>(REFERRALS_PATH) ?? {};
}

export function saveReferralRegs(regs: ReferralsFile) {
  fs.writeFileSync(REFERRALS_PATH, JSON.stringify(regs, null, 2), "utf8");
}

/** Number of applications that came in through this wallet's link */
export function referralCount(apps: ApplicationsFile, address: string) {
  const key = address.toLowerCase();
  return Object.values(apps).filter((a) => a.ref?.toLowerCase() === key).length;
}
