import { expect, test } from "@playwright/test";

/** Full $0 loop on template provider: home → onboard → plan → schedule → customers → results. */
test("full loop smoke", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("Growpilot")).toBeVisible();

  await page.goto("/onboarding");
  await page.getByPlaceholder("e.g. Ada's Kitchen").fill("E2E Bakery");
  await page.getByPlaceholder("Jollof catering and weekly meal prep in Lagos").fill("Sourdough bakery and Saturday classes in Yaba Lagos");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Busy parents, 25–40").fill("Neighbors 20-45");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByText("Supabase keys missing")).toBeVisible();

  const plan = await request.post("/api/autopilot/plan", { data: { count: 2 } });
  expect(plan.ok()).toBeTruthy();
  const planBody = await plan.json();
  expect(planBody.ideas.length).toBeGreaterThan(0);

  await page.goto("/autopilot");
  await page.getByPlaceholder(/Guide Me/).fill("Focus on sourdough");
  await page.getByRole("button", { name: "✨ Generate" }).click();
  await expect(page.getByText("Approve All & Schedule →")).toBeVisible({ timeout: 30000 });

  await page.goto("/schedule");
  await expect(page.getByText("Nothing scheduled yet")).toBeVisible();

  await page.goto("/customers");
  await page.getByPlaceholder(/Paste a comment/).fill("How much is the sourdough loaf?");
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText("potential customer", { exact: false }).first()).toBeVisible({ timeout: 15000 });

  await page.goto("/results");
  await expect(page.getByText("What's working")).toBeVisible();

  const health = await request.get("/api/health");
  expect((await health.json()).ok).toBe(true);
});
