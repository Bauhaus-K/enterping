import type { CurrentUser } from "./auth";

const LOCAL_ADMIN_EMAILS = new Set([
  "haru.demo@enterping.local",
]);

const LOCAL_ADMIN_USERNAMES = new Set([
  "mailron",
]);

export function isAdminUser(user: CurrentUser | null): boolean {
  if (!user) {
    return false;
  }

  const configuredEmails = getConfiguredAdminEmails();
  const configuredUsernames = getConfiguredAdminUsernames();

  if (configuredEmails.size > 0) {
    return configuredEmails.has(user.email.toLowerCase());
  }

  if (configuredUsernames.size > 0) {
    return configuredUsernames.has(user.username.toLowerCase());
  }

  return (
    process.env.NODE_ENV !== "production" &&
    (LOCAL_ADMIN_EMAILS.has(user.email.toLowerCase()) ||
      LOCAL_ADMIN_USERNAMES.has(user.username.toLowerCase()))
  );
}

function getConfiguredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getConfiguredAdminUsernames(): Set<string> {
  return new Set(
    (process.env.ADMIN_USERNAMES ?? "")
      .split(",")
      .map((username) => username.trim().toLowerCase())
      .filter(Boolean),
  );
}
