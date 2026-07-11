import { hashPassword, newSalt } from "./adminAuth";
import { readCollection, writeCollection } from "./appStore";

/** Server-only: admin user records (Mongo or file store). */

export interface AdminUser {
  username: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

/** Loads users; bootstraps the first one from ADMIN_USER/ADMIN_KEY. */
export async function getAdminUsers(): Promise<AdminUser[]> {
  let users = await readCollection<AdminUser>("admin-users", []);
  if (users.length === 0 && process.env.ADMIN_KEY) {
    const salt = newSalt();
    users = [
      {
        username: (process.env.ADMIN_USER || "admin").trim(),
        salt,
        passwordHash: hashPassword(process.env.ADMIN_KEY, salt),
        createdAt: new Date().toISOString(),
      },
    ];
    await writeCollection("admin-users", users);
  }
  return users;
}

export async function saveAdminUsers(users: AdminUser[]) {
  await writeCollection("admin-users", users);
}

export async function verifyCredentials(username: string, password: string) {
  const users = await getAdminUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user) return null;
  return hashPassword(password, user.salt) === user.passwordHash ? user : null;
}

/**
 * ADMIN_KEY acts as a master password for the bootstrap user: logging
 * in as ADMIN_USER with the current ADMIN_KEY always works and re-syncs
 * the stored hash. This heals the trap where the user record was seeded
 * with an older key and later env changes stopped matching.
 */
export async function resetBootstrapUser(): Promise<AdminUser | null> {
  const key = process.env.ADMIN_KEY;
  if (!key) return null;
  const username = (process.env.ADMIN_USER || "admin").trim();
  const users = await readCollection<AdminUser>("admin-users", []);
  const salt = newSalt();
  const passwordHash = hashPassword(key, salt);
  let user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (user) {
    user.salt = salt;
    user.passwordHash = passwordHash;
  } else {
    user = { username, salt, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
  }
  await saveAdminUsers(users);
  return user;
}
