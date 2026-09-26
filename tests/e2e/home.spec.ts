import { expect, test } from "@playwright/test";

test("home shell renders + health ok", async ({ request, page }) => {
  await page.goto("/");
  await expect(page.getByText("Growpilot dashboard shell")).toBeVisible();
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
});
