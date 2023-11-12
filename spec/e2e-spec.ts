import * as puppeteer from "puppeteer";

const outDir = process.env.XTENSION_OUTPUT_DIR;

// To test other browsers like brave, opera, provide their executable path - https://stackoverflow.com/a/59484822.
describe("Browser test suite", () => {
  let browser: puppeteer.Browser;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
      args: [
        `--disable-extensions-except=${process.env.PWD}/${outDir}`,
        `--load-extension=${process.env.PWD}/${outDir}`,
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  /*
   * TODO: Add more tests:
   * 1. Welcome page is visible. Exercises the background script.
   * 2. Content script is loaded: It should modify the page.
   * 3. Popup script works.
   */

  // Run two tests in parallel (on different pages in same browser)
  describe("Google homepage test", () => {
    it("should have a title", async () => {
      const page = await browser.newPage();
      await page.goto("https://google.com");
      expect(await page.title()).toBe("Google");
      await page.close();
    });

    /*
     * This is useful when for identifying unexpected UI changes
     * even when unit tests pass.
     */
    it("take screenshot of welcome page", async () => {
      const pages = await browser.pages();
      const extPage = pages.find(
        (p) =>
          p.url().startsWith("chrome-extension://") &&
          p.url().endsWith("/welcome/welcome.html"),
      );
      if (!extPage) {
        fail("Welcome page should be open");
        return;
      }
      await extPage.screenshot({ path: "src/assets/screenshot.png" });
      await extPage.close();
    });
  });
});
