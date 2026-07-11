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
