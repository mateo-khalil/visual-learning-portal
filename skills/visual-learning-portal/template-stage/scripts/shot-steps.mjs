#!/usr/bin/env node
/*
 * Screenshots of every step of a lesson (or of any route) with headless Chrome.
 *
 *   node scripts/shot-steps.mjs /example/binary-search             all steps, light, 1440×900
 *   node scripts/shot-steps.mjs /example/binary-search 3,7 --dark  steps 3 and 7 in dark mode
 *   node scripts/shot-steps.mjs /example/binary-search all --mobile
 *   node scripts/shot-steps.mjs / --page                           a single screenshot of the route
 *   node scripts/shot-steps.mjs /example/binary-search 4 --mid=350 halfway through the transition from the previous step
 *
 * Variables: PORT (3002), CHROME (path to Chrome), OUT (folder; default ./shots).
 * Steps are loaded with ?anim=0 (no animation), except with --mid.
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const route = args.find((a) => a.startsWith("/")) ?? "/";
const list = args.find((a) => /^(all|\d+(,\d+)*)$/.test(a)) ?? "all";
const dark = args.includes("--dark");
const mobile = args.includes("--mobile");
const pageOnly = args.includes("--page");
const midArg = args.find((a) => a.startsWith("--mid="));
const mid = midArg ? Number(midArg.split("=")[1]) : null;
const PORT = process.env.PORT ?? "3002";
const OUT = process.env.OUT ?? "shots";
const CHROME =
  process.env.CHROME ??
  ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });
const page = await browser.newPage();
const vp = mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900, deviceScaleFactor: 1 };
await page.setViewport(vp);
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }]);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const base = `http://localhost:${PORT}${route}`;
const slug = route.replace(/^\//, "").replace(/\//g, "-") || "home";
const tag = `${dark ? "dark" : "light"}${mobile ? "-m" : ""}`;

async function shot(url, file) {
  await page.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: file, fullPage: mobile || pageOnly });
  console.log(file);
}

if (pageOnly) {
  await shot(base, path.join(OUT, `${slug}-${tag}.png`));
} else {
  await page.goto(`${base}?anim=0`, { waitUntil: "networkidle0" });
  const total = await page.evaluate(() => document.querySelectorAll("[data-step]").length);
  const steps = list === "all" ? Array.from({ length: total }, (_, i) => i + 1) : list.split(",").map(Number);
  for (const n of steps) {
    if (mid != null) {
      await page.goto(`${base}?step=${Math.max(1, n - 1)}`, { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1200));
      await page.keyboard.press("ArrowRight");
      await new Promise((r) => setTimeout(r, mid));
      const file = path.join(OUT, `${slug}-${String(n).padStart(2, "0")}-mid${mid}-${tag}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    } else await shot(`${base}?step=${n}&anim=0`, path.join(OUT, `${slug}-${String(n).padStart(2, "0")}-${tag}.png`));
  }
}
if (errors.length) console.log("PAGE ERRORS:\n" + [...new Set(errors)].join("\n"));
await browser.close();
