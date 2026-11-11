import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const base = process.env.AQW_QA_URL || "http://127.0.0.1:4173";
const driverBase = process.env.AQW_SAFARI_DRIVER_URL || "http://127.0.0.1:4444";
const output = "qa/safari";
fs.mkdirSync(output, { recursive: true });
const report = {
  browser: "Safari via Apple safaridriver",
  base,
  startedAt: new Date().toISOString(),
  status: "running",
  checks: [],
  viewports: [],
  screenshots: [],
  limitations: [],
};
let driver,
  session,
  driverExit,
  driverLog = "";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function request(method, url, body) {
  const res = await fetch(driverBase + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!res.ok || json.value?.error)
    throw Error(json.value?.message || `WebDriver HTTP ${res.status}`);
  return json.value;
}
const command = (method, url, body) =>
  request(method, `/session/${session}${url}`, body);
const execute = (script, args = []) =>
  command("POST", "/execute/sync", { script, args });
async function waitFor(script, message) {
  for (let i = 0; i < 40; i++) {
    if (await execute(script)) return;
    await pause(100);
  }
  throw Error(message);
}
async function find(script, args = []) {
  const el = await execute(script, args);
  assert(el, "Element not found: " + script);
  return el["element-6066-11e4-a52e-4f735466cecf"];
}
async function click(script, args = []) {
  const id = await find(script, args);
  await command("POST", `/element/${id}/click`, {});
}
async function fill(selector, value) {
  const id = await find("return document.querySelector(arguments[0])", [
    selector,
  ]);
  await command("POST", `/element/${id}/clear`, {});
  await command("POST", `/element/${id}/value`, { text: value });
}
async function navigate(route) {
  await command("POST", "/url", { url: base + route });
  await waitFor(
    'return document.readyState === "complete" && !!document.querySelector("h1")',
    "Page did not render",
  );
  await pause(200);
}
async function check(name, fn) {
  await fn();
  report.checks.push({ name, status: "pass" });
  console.log("PASS", name);
}
async function screenshot(name) {
  const value = await command("GET", "/screenshot");
  const file = path.join(output, name + ".png");
  fs.writeFileSync(file, Buffer.from(value, "base64"));
  report.screenshots.push(file);
}
async function viewport(width, height) {
  await command("POST", "/window/rect", { width, height, x: 0, y: 0 });
  for (let i = 0; i < 2; i++) {
    const d = await execute(
      "return {w:innerWidth,h:innerHeight,dw:outerWidth-innerWidth,dh:outerHeight-innerHeight}",
    );
    if (d.w === width && d.h === height)
      return { width, height, mode: "window" };
    await command("POST", "/window/rect", {
      width: width + d.dw,
      height: height + d.dh,
      x: 0,
      y: 0,
    });
  }
  const actual = await execute("return {width:innerWidth,height:innerHeight}");
  return { width, height, actual, mode: "window-clamped" };
}
try {
  if (!process.env.AQW_SAFARI_DRIVER_URL) {
    driver = spawn("/usr/bin/safaridriver", ["--port", "4444"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    driver.on("error", (e) => (driverLog += e.message));
    driver.stdout.on("data", (v) => (driverLog += v));
    driver.stderr.on("data", (v) => (driverLog += v));
    driver.on("exit", (code, signal) => (driverExit = { code, signal }));
  }
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (driverExit)
      throw Error(
        `safaridriver exited: ${JSON.stringify(driverExit)}. ${driverLog || "Enable Safari Remote Automation from a normal macOS terminal, and check sandbox/GUI access."}`,
      );
    try {
      await request("GET", "/status");
      ready = true;
      break;
    } catch {}
    await pause(100);
  }
  if (!ready)
    throw Error("Cannot connect to SafariDriver. See README Safari setup.");
  const created = await request("POST", "/session", {
    capabilities: { alwaysMatch: { browserName: "safari" } },
  });
  session = created.sessionId;
  report.capabilities = created.capabilities;
  await navigate("/");
  await execute(
    'localStorage.removeItem("aqw:bookmarks");localStorage.removeItem("aqw:progress:blade-of-awe");',
  );
  for (const targetRoute of ["/", "/ultra-boss", "/ultra-boss/ultra-dage"]) {
    for (const width of [375, 768, 1440, 1920]) {
      await navigate(targetRoute);
      const dimensions = await viewport(width, width === 375 ? 812 : 1000);
      if (dimensions.mode === "window-clamped") {
        // Desktop Safari has a minimum window size. Use an explicitly reported same-origin frame for narrow CSS layout checks.
        await execute(
          'const frame=document.createElement("iframe");frame.id="aqw-qa-frame";frame.src=arguments[0];frame.style.cssText="position:fixed;inset:0;z-index:2147483647;border:0;width:"+arguments[1]+"px;height:"+arguments[2]+"px;background:white";document.body.appendChild(frame);',
          [base + targetRoute, width, dimensions.height],
        );
        const frame = await execute(
          'return document.getElementById("aqw-qa-frame")',
        );
        await command("POST", "/frame", { id: frame });
        await waitFor(
          'return document.readyState==="complete" && !!document.querySelector("h1")',
          "Narrow frame did not render",
        );
        dimensions.mode = "same-origin-frame";
        report.limitations.push(
          `${width}px uses a frame viewport in desktop Safari, not an iOS device.`,
        );
      }
      await waitFor(
        'return document.fonts.status === "loaded"',
        "Fonts did not load",
      );
      assert.equal(await execute("return innerWidth"), width);
      assert.equal(
        await execute(
          "return document.documentElement.scrollWidth > innerWidth",
        ),
        false,
        `Overflow at ${width}`,
      );
      const pages = await execute(
        "return Math.ceil(document.documentElement.scrollHeight/innerHeight)",
      );
      for (let n = 0; n < pages; n++) {
        await execute("scrollTo(0,arguments[0]*innerHeight)", [n]);
        await pause(850);
        await screenshot(
          `${targetRoute === "/" ? "home" : targetRoute.replaceAll("/", "-")}-${width}-${String(n + 1).padStart(2, "0")}`,
        );
      }
      report.viewports.push({ ...dimensions, route: targetRoute });
      if (dimensions.mode === "same-origin-frame")
        await command("POST", "/frame", { id: null });
    }
  }
  await viewport(1440, 1000);
  await navigate("/huong-dan");
  await check("Search without Vietnamese accents", async () => {
    await fill("#library-search", "phep thuat");
    await waitFor(
      'return Array.from(document.querySelectorAll("h3")).some(e=>e.textContent==="Mage")',
      "Mage not found",
    );
  });
  await check("Empty state and reset", async () => {
    await fill("#library-search", "zzzzzzzz");
    await waitFor(
      'return !!document.querySelector(".empty-state")',
      "Missing empty state",
    );
    await click(
      'return Array.from(document.querySelectorAll("button")).find(e=>e.textContent.includes("Đặt lại bộ lọc"))',
    );
    await waitFor(
      'return !!document.querySelector(".entry-row")',
      "Reset failed",
    );
  });
  await navigate("/class/thu-vien");
  await check("Role filter", async () => {
    await execute(
      'const s=document.querySelector("select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(s,"Hỗ trợ");s.dispatchEvent(new Event("change",{bubbles:true}));',
    );
    await waitFor(
      'return document.querySelectorAll(".entry-row").length===1 && document.querySelector("h3").textContent==="Healer"',
      "Role filter failed",
    );
  });
  await navigate("/class/thu-vien");
  await check("Compare Class facts", async () => {
    const inputs = await execute(
      'return Array.from(document.querySelectorAll(".compare-choice input"))',
    );
    for (const el of inputs.slice(0, 2)) {
      await command(
        "POST",
        `/element/${el["element-6066-11e4-a52e-4f735466cecf"]}/click`,
        {},
      );
    }
    await waitFor(
      'return document.querySelectorAll("tbody tr").length===2',
      "Comparison failed",
    );
  });
  await navigate("/farm/blade-of-awe");
  await check("Bookmark and farm persistence", async () => {
    await click(
      'return document.querySelector(".article-intro button[aria-pressed]")',
    );
    await click('return document.querySelector(".check-step input")');
    await command("POST", "/refresh", {});
    await waitFor(
      'return document.querySelector(".article-intro button[aria-pressed=true]") && document.querySelector(".check-step input").checked',
      "Persistence failed",
    );
  });
  await check("Copy command or actionable Safari refusal", async () => {
    await click('return document.querySelector(".command button")');
    await waitFor(
      'return !!document.querySelector(".copy-status").textContent.trim()',
      "Copy feedback missing",
    );
    const message = await execute(
      'return document.querySelector(".copy-status").textContent',
    );
    assert(
      message.includes("Đã sao chép") || message.includes("Không thể sao chép"),
    );
    report.clipboard = { message, contentsIndependentlyRead: false };
    report.limitations.push(
      "Clipboard feedback checked; clipboard contents require a manual paste in Safari.",
    );
  });
  await check("TOC anchor", async () => {
    await click('return document.querySelector("a[href=\"#progress-title\"]")');
    assert.equal(await execute("return location.hash"), "#progress-title");
  });
  await navigate("/huong-dan");
  await check("Saved-only filter", async () => {
    await click('return document.querySelector(".saved-filter input")');
    await waitFor(
      'return document.querySelectorAll(".entry-row").length===1 && document.querySelector("h3").textContent==="Ghép Blade of Awe"',
      "Saved-only filter failed",
    );
  });
  await navigate("/");
  await check("Mobile menu and Escape", async () => {
    await execute(
      'const f=document.createElement("iframe");f.id="aqw-menu-frame";f.src=arguments[0];f.style.cssText="width:375px;height:812px;position:fixed;inset:0;z-index:2147483647;border:0;background:white";document.body.appendChild(f);',
      [base],
    );
    await command("POST", "/frame", {
      id: await execute('return document.querySelector("#aqw-menu-frame")'),
    });
    await waitFor(
      'return !!document.querySelector(".menu-button")',
      "Menu frame failed",
    );
    await click('return document.querySelector(".menu-button")');
    await waitFor(
      'return document.querySelector(".menu-button").getAttribute("aria-expanded")==="true"',
      "Menu did not open",
    );
    const toggle = await find('return document.querySelector(".menu-button")');
    await command("POST", `/element/${toggle}/value`, { text: "\uE00C" });
    await waitFor(
      'return document.querySelector(".menu-button").getAttribute("aria-expanded")==="false"',
      "Escape did not close menu",
    );
    await command("POST", "/frame", { id: null });
  });
  for (const route of [
    "/trang-bi",
    "/he-thong",
    "/cot-truyen",
    "/gioi-thieu",
    "/class/warrior",
    "/he-thong/hanh-trang",
    "/huong-dan/cam-nang-aqw-vietnam",
    "/he-thong/thuat-ngu-aqw",
    "/trang-bi/general-boosted",
  ]) {
    await navigate(route);
    await check("Route " + route, async () =>
      assert.equal(
        await execute('return document.querySelectorAll("h1").length'),
        1,
      ),
    );
  }
  await navigate("/trang-bi/general-boosted");
  await check("Native Boosted Items guide contains source text", async () => {
    await waitFor(
      'return document.querySelector("article").textContent.includes("2.3625")',
      "Full Boosted Items body missing",
    );
    assert.equal(
      await execute(
        'return document.querySelectorAll("article a[href*=\"docs.google.com/document\"]:not(.sources a)").length',
      ),
      0,
    );
  });

  await navigate("/ultra-boss");
  await check("Ultra directory and client navigation", async () => {
    await execute(
      'window.__aqwNavigationProbe="alive";document.querySelector("a[href=\"/ultra-boss/ultra-dage\"]").click()',
    );
    await waitFor(
      'return location.pathname==="/ultra-boss/ultra-dage" && !!document.querySelector(".ultra-inspect")',
      "Ultra detail did not open",
    );
    assert.equal(await execute("return window.__aqwNavigationProbe"), "alive");
  });
  await check("Ultra tabs and stable panel height", async () => {
    const before = await execute(
      'return document.querySelector(".ultra-panel-stage").getBoundingClientRect().height',
    );
    await execute('document.querySelectorAll(".ultra-tabs button")[1].click()');
    await pause(400);
    assert.equal(
      await execute(
        'return document.querySelectorAll(".ultra-tabs button")[1].getAttribute("aria-selected")',
      ),
      "true",
    );
    assert.match(
      await execute(
        'return document.querySelector(".ultra-inspect-content.active").textContent',
      ),
      /6\.500\.000/,
    );
    assert(
      Math.abs(
        before -
          (await execute(
            'return document.querySelector(".ultra-panel-stage").getBoundingClientRect().height',
          )),
      ) < 2,
    );
    await execute('document.querySelectorAll(".ultra-tabs button")[0].click()');
  });
  await check("Ultra multiple team accordions", async () => {
    await execute(
      'document.querySelectorAll(".ultra-team-toggle").forEach(b=>b.click())',
    );
    assert.equal(
      await execute(
        'return document.querySelectorAll(".ultra-team-toggle[aria-expanded=true]").length',
      ),
      2,
    );
  });
  await check(
    "Ultra equipment switch and durable scoped progress",
    async () => {
      await execute(
        'document.querySelectorAll(".ultra-equipment-choice")[0].click();',
      );
      const previous = await execute(
        'return document.querySelector(".ultra-quest-check input").checked',
      );
      await execute(
        'document.querySelector(".ultra-quest-check input").click()',
      );
      await execute(
        'document.querySelectorAll(".ultra-equipment-choice")[1].click()',
      );
      await pause(100);
      assert.match(
        await execute(
          'return document.querySelector(".ultra-route-heading h3").textContent',
        ),
        /Empowered Undead Champion/,
      );
      await execute(
        'document.querySelectorAll(".ultra-equipment-choice")[0].click()',
      );
      await pause(100);
      assert.equal(
        await execute(
          'return document.querySelector(".ultra-quest-check input").checked',
        ),
        !previous,
      );
      await command("POST", "/refresh", {});
      await waitFor(
        'return document.readyState==="complete" && !document.querySelector(".ultra-route-quests [role=status]")?.textContent.includes("Đang đọc")',
        "Progress did not reload",
      );
      assert.equal(
        await execute(
          'return document.querySelector(".ultra-quest-check input").checked',
        ),
        !previous,
      );
      await execute(
        'document.querySelector(".ultra-quest-check input").click()',
      );
    },
  );
  await check("Ultra back to top has icon only", async () => {
    await execute("scrollTo(0,1000)");
    await pause(300);
    assert.equal(
      await execute(
        'return document.querySelector(".back-to-top").getAttribute("aria-label")',
      ),
      "Cuộn lên đầu trang",
    );
    assert.equal(
      await execute(
        'return document.querySelector(".back-to-top").textContent.trim()',
      ),
      "",
    );
    await execute('document.querySelector(".back-to-top").click()');
    await waitFor("return scrollY<5", "Back to top failed");
  });
  await navigate("/missing-route");
  await check("404 recovery", async () =>
    assert.match(
      await execute('return document.querySelector("h1").textContent'),
      /Lạc khỏi bản đồ/,
    ),
  );
  report.status = "passed";
  report.limitations.push(
    "Reduced motion follows macOS accessibility settings; verify enabled state manually.",
    "Safari screenshots are viewport captures, one per scroll segment.",
  );
} catch (e) {
  report.status = "failed";
  report.error = e.message;
  console.error("Safari acceptance failed:", e.message);
  process.exitCode = 1;
} finally {
  if (session) {
    try {
      await command("DELETE", "");
    } catch {}
  }
  if (driver && !driverExit) driver.kill();
  report.driverLog = driverLog;
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log("Safari report:", path.join(output, "report.json"));
}
