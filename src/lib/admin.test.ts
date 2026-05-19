import type { CurrentUser } from "./auth";
import { isAdminUser } from "./admin";

const baseUser: CurrentUser = {
  id: "user-1",
  email: "mailron@enterping.local",
  username: "mailron",
  displayName: "mailron",
  avatarUrl: null,
  isPremium: false,
  consecutiveLoginDays: 0,
};

describe("isAdminUser", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  const originalAdminUsernames = process.env.ADMIN_USERNAMES;

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
    process.env.ADMIN_USERNAMES = originalAdminUsernames;
  });

  it("allows mailron as a default administrator", () => {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_USERNAMES;

    expect(isAdminUser(baseUser)).toBe(true);
  });

  it("keeps mailron as an administrator even when admin emails are configured", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    delete process.env.ADMIN_USERNAMES;

    expect(isAdminUser(baseUser)).toBe(true);
  });

  it("allows additional administrator usernames from ADMIN_USERNAMES", () => {
    process.env.ADMIN_USERNAMES = "sakura_admin";

    expect(isAdminUser({ ...baseUser, username: "sakura_admin" })).toBe(true);
  });

  it("rejects regular users", () => {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_USERNAMES;

    expect(isAdminUser({ ...baseUser, email: "user@enterping.local", username: "regular_user" })).toBe(false);
  });
});
