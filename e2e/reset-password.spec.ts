import { expect, test, type Page } from "@playwright/test";
import { clearMailbox, readLatestResetLink } from "./helpers";

const SEEDED_EMAIL = "student@example.com";
const ORIGINAL_PASSWORD = "Password123!";
const NEW_PASSWORD = "NewPassw0rd!";

async function requestReset(page: Page): Promise<void> {
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(SEEDED_EMAIL);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If that address is registered, a reset link is on its way.")).toBeVisible();
}

async function completeReset(page: Page, newPassword: string): Promise<void> {
  const resetLink = await readLatestResetLink();
  await page.goto(resetLink);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL("/login");
}

async function signIn(page: Page, password: string): Promise<void> {
  await page.getByLabel("Email address").fill(SEEDED_EMAIL);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

test("reset the seeded student's password by email link", async ({ page }) => {
  await clearMailbox();
  await requestReset(page);
  await completeReset(page, NEW_PASSWORD);

  await signIn(page, NEW_PASSWORD);

  // Restore the seeded password so the suite is re-runnable.
  await clearMailbox();
  await requestReset(page);
  await completeReset(page, ORIGINAL_PASSWORD);

  await signIn(page, ORIGINAL_PASSWORD);
});
