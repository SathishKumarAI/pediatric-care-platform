import { expect, test } from "@playwright/test";

test("dashboard loads and navigates to the symptom checker", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pediatric Care Platform" })).toBeVisible();

  await page.getByRole("link", { name: "Symptom Checker" }).click();
  await expect(page.getByRole("heading", { name: "Symptom Checker" })).toBeVisible();
});

test("growth stages page is reachable", async ({ page }) => {
  await page.goto("/stages");
  await expect(page.getByRole("heading", { name: "Growth Stages" })).toBeVisible();
});
