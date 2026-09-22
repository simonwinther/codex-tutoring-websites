import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "html { scroll-behavior: auto !important; }";
      document.head.append(style);
    });
  });
});
const ids = [
  "generation",
  "flow",
  "euler",
  "average",
  "identity",
  "training",
  "model",
  "guidance",
  "sampling",
  "evidence",
  "perspective",
  "walkthrough",
];
test("all chapters render, use local assets, and fit the viewport", async ({
  page,
}, testInfo) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (
      !req.url().startsWith("http://127.0.0.1:5173") &&
      !req.url().startsWith("data:")
    )
      external.push(req.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-flow circle")).toHaveCount(520);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-hero.png`,
  });
  for (const id of ids) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.evaluate(
      (id) =>
        document
          .getElementById(id)!
          .scrollIntoView({ behavior: "instant", block: "start" }),
      id,
    );
    await expect(page.locator(`#${id} h2`)).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/${testInfo.project.name}-${id}.png`,
    });
  }
  await page.getByRole("button", { name: "+ The math", exact: true }).click();
  await expect(page.locator(".deep-dive:not([open])")).toHaveCount(0);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  for (const id of ids) {
    await page.evaluate(
      (id) =>
        document.getElementById(id)!.scrollIntoView({ behavior: "instant" }),
      id,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  const broken = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs
        .filter(
          (img) =>
            (img as HTMLImageElement).complete &&
            !(img as HTMLImageElement).naturalWidth,
        )
        .map((img) => img.getAttribute("src")),
    );
  expect(broken).toEqual([]);
});
test("laboratories, selectors, checkpoints and playback respond", async ({
  page,
}) => {
  await page.goto("/");
  for (const slider of await page.locator("input[type=range]").all()) {
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    await slider.press("ArrowRight");
    await slider.press("ArrowLeft");
    await expect(slider).toBeVisible();
  }
  const flow = page.locator("#flow");
  await flow
    .getByRole("button", { name: "Marginal field", exact: true })
    .click();
  const drag = flow.getByRole("button", { name: /data x. Drag/ });
  const before = await drag.getAttribute("cx");
  await drag.focus();
  await drag.press("ArrowRight");
  expect(await drag.getAttribute("cx")).not.toBe(before);
  await drag.scrollIntoViewIfNeeded();
  const box = await drag.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 18,
    box!.y + box!.height / 2 + 10,
  );
  await page.mouse.up();
  expect(await drag.getAttribute("cx")).not.toBe(before);
  for (const n of [1, 2, 4, 16, 64])
    await page
      .locator("#euler")
      .getByRole("button", { name: String(n), exact: true })
      .click();
  await page
    .locator("#average")
    .getByRole("button", { name: "Set r = t" })
    .click();
  await expect(page.locator("#average .metric-strip")).toContainText("0.000");
  for (const b of await page.locator(".derivation-tabs button").all())
    await b.click();
  const train = page.locator("#training");
  for (const b of await train.locator(".algorithm button").all())
    await b.click();
  await train.getByRole("button", { name: "Apply parameter update" }).click();
  await expect(train.locator("p[role=status]")).toContainText("Update 1");
  await train.getByLabel("Detach target").uncheck();
  await train.getByRole("button", { name: "Apply parameter update" }).click();
  await train.getByRole("button", { name: "Reset predictor" }).click();
  const model = page.locator("#model");
  for (const name of ["B/4", "B/2", "M/2", "L/2", "XL/2", "XL/2+"])
    await model.getByRole("button", { name, exact: true }).click();
  await expect(model.locator(".metric-strip")).toContainText("1000 epochs");
  for (const b of await model.locator(".architecture-flow button").all())
    await b.click();
  const guide = page.locator("#guidance");
  await guide.getByRole("button", { name: "uniform", exact: true }).click();
  await guide.getByRole("button", { name: "logit", exact: true }).click();
  await guide.getByLabel(/Illustrate a dropped class/).check();
  await expect(guide.locator(".metric-strip")).toContainText("No");
  await guide.getByLabel(/Illustrate a dropped class/).uncheck();
  const sampling = page.locator("#sampling");
  for (const n of [1, 2, 4]) {
    await sampling
      .getByRole("button", { name: String(n), exact: true })
      .click();
    for (let i = 0; i < n; i++)
      await sampling
        .getByRole("button", { name: "Take a step →", exact: true })
        .click();
    await sampling
      .getByRole("button", { name: "↻ Restart", exact: true })
      .click();
  }
  for (const checkpoint of await page.locator(".checkpoint").all()) {
    for (const b of await checkpoint.getByRole("button").all()) await b.click();
    await expect(checkpoint.getByRole("status")).toBeVisible();
  }
  const walk = page.locator("#walkthrough");
  await walk.getByRole("button", { name: "▶ Play", exact: true }).click();
  await expect(
    walk.getByRole("button", { name: "Ⅱ Pause", exact: true }),
  ).toBeVisible();
  await walk.getByRole("button", { name: "Ⅱ Pause", exact: true }).click();
  for (let i = 0; i < 8; i++)
    await walk.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(walk).toContainText("Subtract, then decode");
  await walk.getByRole("button", { name: "← Previous", exact: true }).click();
  await walk.getByRole("button", { name: "↻ Restart", exact: true }).click();
  await expect(walk).toContainText("Choose a training example");
});
test("evidence filters, source coverage, glossary, and gallery work", async ({
  page,
}) => {
  await page.goto("/#evidence");
  const section = page.locator("#evidence");
  for (const value of ["1", "2", "3", "4", "5", "All"]) {
    await section
      .getByLabel("Paper table", { exact: true })
      .selectOption(value);
    await expect(
      section.locator(".evidence-tables tbody tr").first(),
    ).toBeVisible();
  }
  await section.getByLabel("Search experiment tables").fill("SiT-XL/2");
  await expect(section.locator(".evidence-tables tbody")).toContainText("2.06");
  await section
    .getByLabel("Search experiment tables")
    .fill("No matching model");
  await expect(
    section.locator(".evidence-tables p[role=status]"),
  ).toContainText("No rows match");
  await section.getByLabel("Search experiment tables").clear();
  await section.getByLabel("Sort experimental results").selectOption("asc");
  await expect(
    section.locator(".evidence-tables tbody tr").first(),
  ).toContainText("1.42");
  const chart = section.locator(".evidence-chart");
  for (const f of ["Figure 1 · Compute", "Figure 4 · Scaling"]) {
    await chart.getByRole("button", { name: f, exact: true }).click();
    for (const b of await chart
      .locator('[aria-label="Plot filter"] button')
      .all())
      await b.click();
    await chart.getByRole("button", { name: "All", exact: true }).click();
    await chart.locator(".chart-point").first().click();
    await expect(chart.getByRole("status")).not.toContainText("Select a point");
  }
  await section
    .getByRole("button", {
      name: "Enlarge original paper sample 1",
      exact: true,
    })
    .click();
  const gallery = page.getByRole("dialog", {
    name: "Original paper sample viewer",
  });
  await gallery.getByRole("button", { name: "Zoom 1×" }).click();
  for (let i = 0; i < 24; i++)
    await gallery.getByRole("button", { name: "Next image →" }).click();
  await gallery.getByRole("button", { name: "← Previous image" }).click();
  await expect(gallery.locator("img")).toHaveAttribute("src", /023/);
  await page.keyboard.press("Escape");
  await expect(gallery).not.toBeVisible();
  await page.locator(".glossary-trigger").click();
  const refs = page.locator(".reference-dialog");
  await refs.getByRole("searchbox").fill("JVP");
  await expect(refs).toContainText("Jacobian-vector product");
  await refs.getByRole("searchbox").clear();
  for (const summary of await refs.locator(".glossary-list summary").all()) {
    await summary.click();
    await summary.click();
  }
  await page.keyboard.press("Escape");
  await page
    .locator(".site-footer")
    .getByRole("button", { name: "Coverage manifest ↗" })
    .click();
  await refs.getByRole("searchbox").fill("Equation 24");
  await expect(refs).toContainText("Sufficiency");
  await refs.getByRole("link", { name: /Equation 24/ }).click();
  await expect(page).toHaveURL(/#identity/);
  await expect(page.locator("#identity .deep-dive:not([open])")).toHaveCount(0);
});
test("deep links, history, resume, reduced motion and accessibility", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#training");
  await expect(page.locator("#training h2")).toBeInViewport();
  await page.locator("#training .chapter-footer>a").click();
  await expect(page).toHaveURL(/#model/);
  await page.goBack();
  await expect(page).toHaveURL(/#training/);
  await page.getByRole("button", { name: "+ The math", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "+ The math", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/");
  await expect(page.locator(".resume")).toBeVisible();
  await page.locator(".resume a").click();
  await expect(page).toHaveURL(/#training/);
  await page.getByRole("button", { name: "The story", exact: true }).click();
  if (testInfo.project.name !== "desktop") {
    await page.locator(".mobile-menu").click();
    await expect(page.locator(".mobile-navigation")).toBeVisible();
    await page.locator('.mobile-navigation nav a[href="#average"]').click();
    await expect(page.locator(".mobile-navigation")).not.toBeVisible();
  }
  await page.locator("#walkthrough").scrollIntoViewIfNeeded();
  await expect(page.locator("#walkthrough")).toContainText(
    "Reduced motion is enabled",
  );
  await page
    .locator("#walkthrough")
    .getByRole("button", { name: "Advance", exact: true })
    .click();
  await expect(page.locator("#walkthrough")).toContainText(
    "Make a noisy input",
  );
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    scan.violations.map((v) => ({
      id: v.id,
      description: v.description,
      nodes: v.nodes
        .slice(0, 5)
        .map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  ).toEqual([]);
});
