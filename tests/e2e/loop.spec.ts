import { expect, test } from "@playwright/test";

/** Beginner flow: logged-out users land on login; setup and review render. */
test("beginner flow renders", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("Taking you to sign in")).toBeVisible();

  await page.goto("/login");
  await expect(page.getByText("Sign up")).toBeVisible();

  await page.goto("/onboarding");
  await expect(page.getByText("Your business")).toBeVisible();
  await page.getByPlaceholder("Fashion Store").fill("E2E Bakery");
  await page.getByPlaceholder("Women's native dresses").fill("Sourdough loaves");

  await page.goto("/review");
  await expect(page.getByText("Posts waiting for you")).toBeVisible();

  await page.goto("/schedule");
  await expect(page.getByText("Upcoming posts")).toBeVisible();

  const health = await request.get("/api/health");
  expect((await health.json()).ok).toBe(true);
});
