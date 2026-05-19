import type { CurrentUser } from "./auth";

const LOCAL_ADMIN_EMAILS = new Set([
  "haru.demo@enterping.local",
]);

const DEFAULT_ADMIN_USERNAMES = new Set([
  "mailron",
]);

export function isAdminUser(user: CurrentUser | null): boolean {
  if (!user) {
    return false;
  }

  const email = user.email.toLowerCase();
  const username = user.username.toLowerCase();
  const configuredEmails = getConfiguredAdminEmails();
  const adminUsernames = getAdminUsernames();

  if (configuredEmails.has(email)) {
    return true;
  }

  if (adminUsernames.has(username)) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && LOCAL_ADMIN_EMAILS.has(email);
}

function getConfiguredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getAdminUsernames(): Set<string> {
  const configuredUsernames = (process.env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((username) => username.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_ADMIN_USERNAMES, ...configuredUsernames]);
}
