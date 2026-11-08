import { expect, test } from "@playwright/test";

test("home page renders the premium hero and the live status card", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /personal AI assistant/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Live system status" }),
  ).toBeVisible();
  await expect(page.getByText("Designed to feel finished")).toBeVisible();
  await expect(page.getByText("Three honest boundaries")).toBeVisible();
});

test("health endpoint returns a validated envelope without secrets", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-request-id"]).toBeTruthy();
  expect(response.headers()["cache-control"]).toBe("no-store");

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.data.status).toBe("ok");
  expect(typeof body.data.integrations.ai.configured).toBe("boolean");
  expect(typeof body.data.integrations.database.configured).toBe("boolean");
  expect(JSON.stringify(body)).not.toMatch(/sk-|service_role/i);
});

test("layout has no horizontal overflow on a narrow phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
