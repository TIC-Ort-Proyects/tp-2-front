import { test, expect } from "@playwright/test";

test.describe("Unauthenticated access", () => {
  test("visiting /dashboard without a session redirects to the login page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
    await expect(page.getByText("LinkHub")).toBeVisible();
  });
});

test.describe("Main flow: sign up -> add link -> see it on the public profile", () => {
  test("a new user can sign up, add a link, and see it published", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const password = "password123";
    const name = `E2E Tester ${stamp}`;
    const linkTitle = "My GitHub";
    const linkUrl = "https://github.com/example";

    // Sign up
    await page.goto("/");
    await page.getByRole("button", { name: "¿No tenés cuenta? Registrate" }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Lands on dashboard (session established)
    await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });

    // Add a link via the "Agregar link" form
    await page.getByPlaceholder("Título").fill(linkTitle);
    await page.getByPlaceholder("https://...").fill(linkUrl);
    await page.locator('form:has(input[name="url"]) button[type="submit"]').click();

    await expect(page.getByText(linkTitle)).toBeVisible({ timeout: 10_000 });

    // Grab the public profile URL from the dashboard "share" card and visit it
    const publicProfileHref = await page.locator('a[href^="/"][target="_blank"]').first().getAttribute("href");
    expect(publicProfileHref).toBeTruthy();

    await page.goto(publicProfileHref!);
    await expect(page.getByText(linkTitle)).toBeVisible();
  });
});
