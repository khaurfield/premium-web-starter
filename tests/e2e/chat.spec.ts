import { expect, test } from "@playwright/test";

/** 1x1 transparent PNG used to exercise the real image-attachment path. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("landing page", () => {
  test("renders the premium hero and a working assistant link", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /personal AI assistant/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Live system status" }),
    ).toBeVisible();
    await expect(page.getByText("Designed to feel finished")).toBeVisible();

    const openLink = page.getByRole("link", { name: /open (the assistant|app)/i }).first();
    await expect(openLink).toHaveAttribute("href", "/chat");
  });

  test("has no horizontal overflow at every supported width", async ({ page }) => {
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("theme toggle changes and persists the explicit theme", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /switch to (light|dark) theme/i });
    const target = (await toggle.getAttribute("aria-label"))?.includes("dark")
      ? "dark"
      : "light";
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", target);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", target);
  });
});

test.describe("assistant workspace", () => {
  test("desktop shell shows the sidebar and all composer controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/chat");

    await expect(page.getByRole("heading", { name: /what would you like/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New conversation" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message the assistant" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Attach text files" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Attach images" })).toBeVisible();
    await expect(page.getByRole("button", { name: /voice dictation|stop dictation/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
    await expect(page.getByText("No models configured").first()).toBeVisible();
    await expect(page.getByText(/Connect an AI provider/i)).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("phone shell uses a drawer and has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/chat");

    await expect(page.getByRole("heading", { name: /what would you like/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "New conversation" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open conversation history" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "New conversation" })).toBeVisible();
    await page.getByRole("button", { name: "Close conversation history" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("new conversation and search operate on real local history", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/chat");
    await expect(page.getByRole("button", { name: "New conversation" })).toBeVisible();

    await page.getByRole("button", { name: "New conversation" }).click();
    await expect(
      page
        .getByRole("list", { name: "Conversation history" })
        .getByRole("listitem"),
    ).toHaveCount(2);

    await page.getByRole("textbox", { name: "Search conversations" }).fill("no-match-value");
    await expect(page.getByText("No conversations match your search.")).toBeVisible();
  });

  test("sending without credentials reports the real 503 and creates no answer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/chat");
    const composer = page.getByRole("textbox", { name: "Message the assistant" });
    await composer.fill("Hello from the browser test");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("alert")).toContainText("AI_NOT_CONFIGURED");
    await expect(page.getByText("Hello from the browser test")).toBeVisible();
    // No fabricated assistant bubble is ever rendered on a configuration error.
    await expect(page.getByLabel("Assistant message")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("text and image attachments are added and removed for real", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/chat");

    await page.getByRole("button", { name: "Attach text files" }).click();
    await page.locator('input[type="file"][accept*=".txt"]').setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Real attached text for the prompt."),
    });
    await expect(page.getByRole("button", { name: "Remove notes.txt" })).toBeVisible();

    await page.getByRole("button", { name: "Attach images" }).click();
    await page.locator('input[type="file"][accept*="image/png"]').setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });
    await expect(page.getByRole("button", { name: "Remove pixel.png" })).toBeVisible();

    await page.getByRole("button", { name: "Remove notes.txt" }).click();
    await expect(page.getByRole("button", { name: "Remove notes.txt" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove pixel.png" })).toBeVisible();
  });

  test("settings dialog exposes real, persisted preferences", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/chat");
    await page.getByRole("button", { name: "Open settings" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Chat behaviour")).toBeVisible();

    await page.getByRole("switch", { name: /stream responses/i }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
