import { expect, test } from "@playwright/test";

const SEEDED_EMAIL = "student@example.com";
const SEEDED_PASSWORD = "Password123!";
const NEW_ACCOUNT_EMAIL = "e2e-new@example.com";

test("register and land on the home page", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email address").fill(NEW_ACCOUNT_EMAIL);
  await page.getByLabel("Name").fill("E2E New User");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
});

test("sign in and reach the profile", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(SEEDED_EMAIL);
  await page.getByLabel("Password").fill(SEEDED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText(SEEDED_EMAIL)).toBeVisible();
});

test("an unauthenticated visit to /profile lands on sign-in", async ({ page }) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login/);
});
