import { requestSafariDriver } from "./lib/safari-webdriver.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { ensureServer } from "../scripts/qa-runtime.mjs";
import { isComingSoon } from "../src/lib/site-feature-access.mjs";

let base = process.env.AQW_QA_URL || null;
let server;
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
  return requestSafariDriver({
    base: driverBase, method, endpoint: url, body, step: { ...report.currentStep, check: report.activeCheck, target: report.currentCommandTarget },
    onError: diagnostic => (report.webdriverErrors ||= []).push(diagnostic),
  });
}
const command = (method, url, body) =>
  request(method, `/session/${session}${url}`, body);
// Send selectors via args so CSS quotes never become JavaScript string delimiters.
const execute = (script, args = []) =>
  command("POST", "/execute/sync", { script: `
    if(!window.__aqwQaErrorTypes){
      window.__aqwQaErrorTypes=[];
      window.addEventListener('error',()=>window.__aqwQaErrorTypes.push('error'));
      window.addEventListener('unhandledrejection',()=>window.__aqwQaErrorTypes.push('unhandledrejection'));
      const original=console.error;
      console.error=function(...values){window.__aqwQaErrorTypes.push('console.error');return original.apply(this,values);};
    }
    ${script}
  `, args });
async function waitFor(script, message, args = []) {
  for (let i = 0; i < 40; i++) {
    if (await execute(script, args)) return;
    await pause(100);
  }
  throw Error(message);
}
async function find(script, args = []) {
  const el = await execute(script, args);
  assert(el, "Element not found: " + script + " args=" + JSON.stringify(args));
  return el["element-6066-11e4-a52e-4f735466cecf"];
}
async function click(script, args = []) {
  const id = await find(script, args);
  await revealElement({ "element-6066-11e4-a52e-4f735466cecf": id });
  report.currentCommandTarget = await execute(`
    const element=arguments[0],rect=element.getBoundingClientRect();
    return {tag:element.tagName,type:element.getAttribute('type'),label:element.getAttribute('aria-label'),
      disabled:!!element.disabled,visible:!!element.getClientRects().length,
      closedDetails:!!Array.from(element.closest('details')?[element.closest('details')]:[]).find(d=>!d.open&&element.tagName!=='SUMMARY'),
      hiddenAncestor:!!element.closest('[hidden],[inert]'),rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
  `, [{ "element-6066-11e4-a52e-4f735466cecf": id }]);
  try { await command("POST", `/element/${id}/click`, {}); }
  finally { delete report.currentCommandTarget; }
}
// Safari's Element Click can emit mouse-up before mouse-down after text entry.
// Use an explicit native pointer sequence for the affected Class controls.
// AQW_SAFARI_ULTRA_KEYBOARD_CONTROLS_V2
// Focus a real control and activate it through native WebDriver keyboard actions.
async function activateUltraControl(selector, index = 0, key = "\uE007") {
  const info = await execute(`
    const matches = [...document.querySelectorAll(arguments[0])];
    const el = typeof arguments[1] === "string"
      ? matches.find(candidate => candidate.getAttribute("aria-label") === arguments[1])
      : matches[arguments[1]];
    if (!el) return {ready:false, reason:"missing", selector:arguments[0], index:arguments[1]};
    const valid = el.tagName === "BUTTON" || (el.tagName === "INPUT" && el.type === "checkbox");
    if (!valid || el.disabled || el.closest("[hidden],[inert]") || !el.getClientRects().length)
      return {ready:false, reason:"hidden-or-disabled", html:el.outerHTML.slice(0,250)};
    el.scrollIntoView({block:"center", inline:"center", behavior:"instant"});
    el.focus({preventScroll:true});
    return {ready:document.activeElement === el, reason:"focus", html:el.outerHTML.slice(0,250)};
  `, [selector, index]);
  assert.ok(info?.ready, "Ultra control not keyboard-focusable: " + JSON.stringify(info));
  try {
    await command("POST", "/actions", {
      actions: [{type:"key", id:"aqw-ultra-keyboard-v2", actions:[
        {type:"keyDown", value:key},
        {type:"keyUp", value:key}
      ]}]
    });
  } finally {
    try {await command("DELETE", "/actions");} catch {}
  }
}

async function pointerClick(selector) {
  // Ensure Safari's native pointer target is inside the visible viewport.
  await revealControl(selector);
  const id = await find("return document.querySelector(arguments[0])", [selector]);
  await execute(`
    const element=document.querySelector(arguments[0]);
    window.__aqwClassPointer={down:false,up:false};
    element.addEventListener('pointerdown',()=>{window.__aqwClassPointer.down=true;window.__aqwClassPointer.up=false;},{once:true});
    element.addEventListener('pointerup',()=>{if(window.__aqwClassPointer.down)window.__aqwClassPointer.up=true;},{once:true});
  `, [selector]);
  try {
    await command("POST", "/actions", {
      actions: [{ type: "pointer", id: "class-controls", parameters: { pointerType: "mouse" }, actions: [
        { type: "pointerMove", origin: { "element-6066-11e4-a52e-4f735466cecf": id }, x: 0, y: 0 },
        { type: "pointerDown", button: 0 },
      ] }],
    });
    await waitFor('return window.__aqwClassPointer.down', "Class control did not receive pointerdown");
    await command("POST", "/actions", {
      actions: [{ type: "pointer", id: "class-controls", parameters: { pointerType: "mouse" }, actions: [
        { type: "pointerUp", button: 0 },
      ] }],
    });
    await waitFor('return window.__aqwClassPointer.up', "Class control did not receive pointerup");
  } finally {
    await command("DELETE", "/actions");
  }
}
// WebDriver has no select-by-value endpoint. Use the select DOM API and its
// input/change events; verify the rendered filter result separately below.
async function selectValue(selector, value) {
  const selected = await execute(`
    const select=document.querySelector(arguments[0]);
    if(select?.tagName !== 'SELECT')throw Error('Select not found: '+arguments[0]);
    const option=Array.from(select.options).find(o=>o.value===arguments[1]);
    if(!option || option.disabled || option.parentElement.disabled)throw Error('Enabled option not found: '+arguments[1]);
    select.value=option.value;
    select.dispatchEvent(new Event('input',{bubbles:true}));
    select.dispatchEvent(new Event('change',{bubbles:true}));
    return select.value;
  `, [selector, value]);
  assert.equal(selected, value, "Select value did not update");
}
async function revealElement(element) {
  await execute(`
    const element=arguments[0],rect=element.getBoundingClientRect();
    if(rect.top<0||rect.bottom>innerHeight||rect.left<0||rect.right>innerWidth)
      element.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"});
  `, [element]);
  await waitFor(`
    const element=arguments[0],rect=element.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return rect.width>0&&rect.height>0&&rect.top>=0&&rect.bottom<=innerHeight&&!!hit&&(hit===element||element.contains(hit));
  `, "Control is not visible/hittable", [element]);
}
async function revealControl(selector) {
  const element=await execute('return document.querySelector(arguments[0])', [selector]);
  assert.ok(element, "Control not found: " + selector);
  await revealElement(element);
}
async function fill(selector, value) {
  const id = await find("return document.querySelector(arguments[0])", [
    selector,
  ]);
  if (value === "") {
    // Safari Element Clear changes the DOM value without the native input
    // event needed by a controlled search field. Delete through the keyboard.
    await revealControl(selector);
    let length = await execute("return document.querySelector(arguments[0]).value.length", [selector]);
    while (length > 0) {
      await command("POST", `/element/${id}/value`, { text: "\uE003" }); // native Backspace
      await waitFor('return document.querySelector(arguments[0]).value.length < arguments[1]', "Search did not receive native deletion", [selector, length]);
      length = await execute("return document.querySelector(arguments[0]).value.length", [selector]);
    }
  } else {
    await command("POST", `/element/${id}/clear`, {});
    await command("POST", `/element/${id}/value`, { text: value });
  }
}
async function navigate(route) {
  // AQW_SAFARI_ROUTE_COLLECT_STABILITY_V3: pageLoadStrategy=none returns
  // before the new document is ready. Check the destination, not old DOM.
  const target = new URL(route, base);
  report.currentStep = {
    name: "navigate", route, url: target.href, selector: "h1",
  };
  await command("POST", "/frame", { id: null });
  await command("POST", "/url", { url: target.href });
  let lastObserved = null;
  let lastTransientError = null;
  // Up to ~24s wall time plus WebDriver latency, only if page loads slowly.
  // Most navigations return immediately as soon as the correct h1 exists.
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const state = await execute(`
        return {
          href: location.href,
          pathname: location.pathname,
          readyState: document.readyState,
          title: document.title,
          h1: document.querySelector("h1")?.textContent?.trim()?.slice(0,120) || null,
          bodySnippet: document.body?.innerText?.trim()?.slice(0,160) || null,
          width: innerWidth, height: innerHeight
        };
      `);
      lastObserved = state;
      if (state.pathname === target.pathname && state.readyState === "complete" && state.h1) {
        report.currentStep.width = state.width;
        report.currentStep.height = state.height;
        await pause(200);
        return;
      }
    } catch (error) {
      const message = String(error?.message ?? error);
      // Safari can briefly invalidate its JS execution context mid-navigation.
      // A permanent session/window failure is fatal, never swallowed.
      if (/no such window|invalid session id|session not created|ECONNREFUSED|connection refused/i.test(message)) throw error;
      if (!/no such frame|javascript error|stale element reference/i.test(message)) throw error;
      lastTransientError = message;
      if (/no such frame/i.test(message)) {
        try { await command("POST", "/frame", { id: null }); }
        catch (frameError) {
          if (!/no such frame/i.test(String(frameError?.message))) throw frameError;
        }
      }
    }
    await pause(200);
  }
  // Distinguish a wrong URL, a partially loaded document, and a missing h1.
  report.currentStep.lastObserved = lastObserved;
  report.currentStep.lastTransientError = lastTransientError;
  throw Error("Page did not render: " + JSON.stringify(report.currentStep));
}

async function classDirectoryState() {
  return execute(`
    const input = document.querySelector('.class-search input');
    const reset = document.querySelector('.class-empty button');
    const rect = reset?.getBoundingClientRect();
    const hit = rect && document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return {
      route: location.pathname + location.search,
      width: innerWidth, height: innerHeight,
      query: input?.value ?? null,
      cards: document.querySelectorAll('.class-card').length,
      results: document.querySelector('.class-results')?.textContent ?? null,
      empty: !!document.querySelector('.class-empty'),
      reset: reset ? {text: reset.textContent, disabled: reset.disabled,
        rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
        hit: hit ? {tag: hit.tagName, className: hit.className, text: hit.textContent?.slice(0, 160)} : null,
        hitIsReset: hit === reset || reset.contains(hit)} : null,
      activeElement: document.activeElement?.outerHTML.slice(0, 400),
      error: document.querySelector('.message-page')?.textContent ?? null
    };
  `);
}
// AQW_SAFARI_COLLECT_ALL_V1 — optional, diagnostic-only mode.
// Normal npm run test:safari behavior is unchanged unless the env var is set.
const collectAll = process.env.AQW_SAFARI_COLLECT_ALL === "1";
const collectedFailures = [];
async function check(name, fn) {
  report.activeCheck = name;
  const context = await execute(
    "return {route:location.pathname+location.search, width:innerWidth, height:innerHeight}",
  );
  report.currentStep = { name, ...context };
  try {
    await fn();
    const browserErrors = await execute("return window.__aqwQaErrorTypes");
    assert.deepEqual(browserErrors, [], "Browser runtime/console errors during " + name);
    (report.consoleChecks ||= []).push({ name, errorCount: browserErrors.length });
    report.checks.push({ name, status: "pass", ...context });
    console.log("PASS", name);
    delete report.activeCheck;
  } catch (error) {
    // Capture the actual failed UI without replacing the original error.
    let diagnostics, diagnosticError;
    try {
      diagnostics = await classDirectoryState();
      await screenshot(`failure-${report.checks.length + 1}`);
    } catch (captureError) {
      diagnosticError = captureError.message;
    }
    report.checks.push({
      name,
      status: "failed",
      ...context,
      error: error.message,
      diagnostics,
      diagnosticError,
    });
    // AQW_SAFARI_COLLECT_ALL_V1: collect independent UI failures, but never
    // continue with an invalid WebDriver session/window/frame.
    const safariFailure = String(error?.message ?? error);
    const sessionBroken = /no such (?:frame|window)|invalid session id|session not created|ECONNREFUSED|connection refused|not connected to (?:the )?browser/i.test(safariFailure);
    if (!collectAll || sessionBroken) throw error;
    collectedFailures.push({ name, route: context.route, error: safariFailure });
    console.error("FAIL", name, "—", safariFailure);
    delete report.activeCheck;
    // Prevent one already-recorded browser console error from causing every
    // subsequent check to fail for the same event. The original error remains
    // in report.checks and cannot turn into PASS.
    try { await execute("window.__aqwQaErrorTypes=[]; return true"); } catch {}
  }
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
  report.phase = "server_start";
  server = await ensureServer();
  base = server.url;
  report.base = base;
  report.phase = "browser_launch";
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
    // Safari's normal page-load wait hangs when Back traverses iframe history.
    // Every navigation below instead waits for the destination UI explicitly.
    capabilities: { alwaysMatch: { browserName: "safari", pageLoadStrategy: "none" } },
  });
  session = created.sessionId;
  report.capabilities = created.capabilities;
  report.phase = "ui";
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
      const overflowing =
        await execute(`return Array.from(document.querySelectorAll('body *')).filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => ({tag:e.tagName,className:e.className?.baseVal ?? e.className,
        width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}));`);
      report.layoutDiagnostics ??= [];
      report.layoutDiagnostics.push({ route: targetRoute, width, overflowing });
      assert.equal(
        await execute(
          "return document.documentElement.scrollWidth > innerWidth",
        ),
        false,
        `Overflow at ${width} on ${targetRoute}: ${JSON.stringify(overflowing)}`,
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
  // Retain the legacy assertions for when those product features are enabled.
  // The active deployment intentionally serves a coming-soon page on these routes.
  if (!isComingSoon("/huong-dan") && !isComingSoon("/class/thu-vien")) {
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
        message.includes("Đã sao chép") ||
          message.includes("Không thể sao chép"),
      );
      report.clipboard = { message, contentsIndependentlyRead: false };
      report.limitations.push(
        "Clipboard feedback checked; clipboard contents require a manual paste in Safari.",
      );
    });
    await check("TOC anchor", async () => {
      await click(
        "return document.querySelector(arguments[0])",
        ['a[href="#progress-title"]'],
      );
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
  } else {
    for (const route of ["/huong-dan", "/class/thu-vien"]) {
      await navigate(route);
      await check("Declared feature gate " + route, async () => {
        assert.equal(
          await execute('return !!document.querySelector(".coming-soon-page")'),
          true,
        );
        assert.equal(
          await execute('return document.querySelector("h1").textContent'),
          "Thông tin đang được cập nhật",
        );
        await click(
          "return document.querySelector(arguments[0])",
          ['.coming-soon-page a[href="/"]'],
        );
        await waitFor(
          'return location.pathname === "/" && !!document.querySelector(".hero") && !document.querySelector(".coming-soon-page")',
          "Coming-soon recovery failed",
        );
        await command("POST", "/back", {});
        await waitFor(
          'return location.pathname === arguments[0] && !!document.querySelector(".coming-soon-page")',
          "Coming-soon history recovery failed",
          [route],
        );
      });
    }
    report.limitations.push(
      "Legacy Library search, comparison, bookmarks, saved-only filter and article TOC are unavailable in the gated Library and replaced Farm article UI. Current Class/Farm Codex interactions are checked separately; legacy assertions are retained.",
    );
    report.checks.push({
      name: "Legacy Library interactions",
      status: "skipped",
      reason:
        "Declared coming-soon routes; no legacy interaction PASS claimed.",
    });
  }
  await navigate("/class");
  await check("Current Class search, empty state and reset", async () => {
    await fill(".class-search input", "archpaladin");
    await waitFor(
      'return document.querySelectorAll(".class-card").length===1 && document.querySelector(".class-card h2").textContent.includes("ArchPaladin")',
      "Class search failed",
    );
    await fill(".class-search input", "zzzzzzzz");
    await waitFor(
      'return !!document.querySelector(".class-empty")',
      "Class empty state missing",
    );
    report.classResetBeforeClick = await classDirectoryState();
    await pointerClick(".class-empty button");
    await waitFor(
      'return document.querySelectorAll(".class-card").length>1 && document.querySelector(".class-search input").value === "" && !document.querySelector(".class-empty")',
      "Class reset failed",
    );
  });
  await check("Current Class role filter", async () => {
    await selectValue('select[aria-label="Vai trò"]', "Support");
    await waitFor(
      'return document.querySelector(arguments[0]).value === "Support" && document.querySelectorAll(".class-card").length>0 && Array.from(document.querySelectorAll(".class-card")).every(e=>e.textContent.includes("Support"))',
      "Support role filter failed",
      ['select[aria-label="Vai trò"]'],
    );
  });
  await navigate("/class/archpaladin-ap");
  await check(
    "Class keyboard tabs and durable acquisition progress",
    async () => {
      await waitFor(
        'return !!document.querySelector(".class-inspection-tabs")',
        "Class body missing",
      );
      await click(
        'return document.querySelector(".class-inspection-tabs button")',
      );
      const keyboardTab = async (key, label) => {
        report.currentStep.action = "Keyboard tab " + label;
        await revealControl('.class-inspection-tabs button[aria-selected="true"]');
        const tab = await find('return document.querySelector(".class-inspection-tabs button[aria-selected=true]")');
        await command("POST", `/element/${tab}/value`, { text: key });
        await waitFor(`
          const selected=document.querySelector('.class-inspection-tabs button[aria-selected=true]');
          return selected?.getAttribute('aria-label')===arguments[0]&&selected.tabIndex===0&&document.activeElement===selected;
        `, "Class keyboard tab failed: " + label, [label]);
        report.classKeyboardProgress.keys.push(label);
      };
      report.classKeyboardProgress = { keys: [] };
      await keyboardTab("\uE010", "CÁCH LẤY CLASS"); // End
      await keyboardTab("\uE011", "BỘ SKILL"); // Home
      await keyboardTab("\uE014", "HƯỚNG DẪN COMBO"); // ArrowRight
      await keyboardTab("\uE012", "BỘ SKILL"); // ArrowLeft
      await keyboardTab("\uE010", "CÁCH LẤY CLASS");
      await waitFor('return !document.querySelector("[data-class-panel=acquisition]").hidden', "Acquisition panel did not open");
      await revealControl(".acquisition-unlock-route > summary");
      await click('return document.querySelector(".acquisition-unlock-route > summary")');
      await waitFor('return document.querySelector(".acquisition-unlock-route").open', "Class acquisition route did not open");
      const previous = await execute(
        'return document.querySelector(".class-obtain-steps input").checked',
      );
      report.classKeyboardProgress.before = previous;
      await click('return document.querySelector(".class-obtain-steps input")');
      await waitFor('return document.querySelector(".class-obtain-steps input").checked === arguments[0]', "Progress checkbox did not update", [!previous]);
      await command("POST", "/refresh", {});
      await command("POST", "/frame", { id: null });
      await waitFor(
        'return location.pathname === "/class/archpaladin-ap" && !!document.querySelector(arguments[0])',
        "Class acquisition tab did not finish reloading",
        ['.class-inspection-tabs button[aria-label="CÁCH LẤY CLASS"]'],
      );
      await revealControl('.class-inspection-tabs button[aria-label="CÁCH LẤY CLASS"]');
      await click(
        "return document.querySelector(arguments[0])",
        ['.class-inspection-tabs button[aria-label="CÁCH LẤY CLASS"]'],
      );
      await revealControl(".acquisition-unlock-route > summary");
      await click('return document.querySelector(".acquisition-unlock-route > summary")');
      await waitFor('return document.querySelector(".acquisition-unlock-route").open', "Class acquisition route did not open");
      await waitFor(
        'return !!document.querySelector(".class-obtain-steps input:not(:disabled)")',
        "Progress did not load",
      );
      assert.equal(
        await execute(
          'return document.querySelector(".class-obtain-steps input").checked',
        ),
        !previous,
      );
      report.classKeyboardProgress.afterRefresh = await execute('return document.querySelector(".class-obtain-steps input").checked');
      await keyboardTab("\uE011", "BỘ SKILL");
      await keyboardTab("\uE010", "CÁCH LẤY CLASS");
      assert.equal(await execute('return document.querySelector(".class-obtain-steps input").checked'), !previous, "Progress reset after tab switch");
      report.classKeyboardProgress.afterTabSwitch = await execute('return document.querySelector(".class-obtain-steps input").checked');
      await revealControl(".class-obtain-steps input");
      await click('return document.querySelector(".class-obtain-steps input")');
      await waitFor('return document.querySelector(".class-obtain-steps input").checked === arguments[0]', "Progress cleanup did not restore prior state", [previous]);
    },
  );
  await navigate("/farm/item/blade-of-awe");
  await check(
    "Farm deep link, category counts and browser history",
    async () => {
      await waitFor(
        'return !!document.querySelector("[data-item-id=blade-of-awe]")',
        "Farm deep link failed",
      );
      assert.equal(
        await execute(
          'return document.querySelector("[data-item-id=blade-of-awe] h2").textContent',
        ),
        "Blade of Awe",
      );
      await navigate("/farm");
      const before = await execute(
        'return document.querySelector(".fv2-count").textContent',
      );
      await fill(".fv2-search input", "zzzzzzzz");
      await waitFor(
        'return document.querySelector(".fv2-count").textContent.startsWith("0 trang bị")',
        "Farm search/count failed",
      );
      await fill(".fv2-search input", "");
      await waitFor(
        'return !document.querySelector(".fv2-count").textContent.startsWith("0 trang bị")',
        "Farm reset failed",
      );
      assert.equal(
        await execute(
          'return document.querySelector(".fv2-count").textContent',
        ),
        before,
      );
      const selectedItem = await execute('return document.querySelector(".fv2-item").dataset.inventoryItem');
      await revealControl(".fv2-item");
      const inventoryButton = await find('return document.querySelector(".fv2-item")');
      await command("POST", `/element/${inventoryButton}/value`, { text: "\uE007" }); // native Enter activates the button
      await waitFor('return new URLSearchParams(location.search).get("item")===arguments[0]&&document.querySelector("[data-item-id]")?.dataset.itemId===arguments[0]', "Farm item selection did not finish before history navigation", [selectedItem]);
      await command("POST", "/back", {});
      await waitFor(
        'return location.pathname === "/farm" && !new URLSearchParams(location.search).has("item")',
        "Farm history failed",
      );
    },
  );
  await navigate("/farm/item/legion-revenant-class?farm-tab=guide");
  await check(
    "Current Farm quest progress persists across refresh",
    async () => {
      // AQW_SAFARI_FARM_SETTLE_V1: SSR can briefly show a Quest checkbox
      // before React hydrates and replaces the selected Farm workflow.
      // Require several consecutive observations, not one transient match.
      let farmStableObservations = 0;
      for (let attempt = 0; attempt < 60 && farmStableObservations < 5; attempt++) {
        const ready = await execute(
          'return location.pathname === "/farm/item/legion-revenant-class" && !!document.querySelector(".fv31-step-complete input")',
        );
        farmStableObservations = ready ? farmStableObservations + 1 : 0;
        if (farmStableObservations < 5) await pause(150);
      }
      assert.equal(farmStableObservations, 5, "Farm checkbox missing or unstable after React hydration");
      const previous = await execute(
        'return document.querySelector(".fv31-step-complete input")?.checked ?? null',
      );
      assert.notEqual(previous, null, "Farm checkbox disappeared immediately after settling");
      await execute(`
        window.__aqwFarmProgressEvents=[];
        const input=document.querySelector('.fv31-step-complete input');
        if(!input)throw Error('Farm checkbox disappeared before event instrumentation');
        for(const type of ['pointerdown','pointerup','click','input','change'])
          input.addEventListener(type,event=>window.__aqwFarmProgressEvents.push({type,trusted:event.isTrusted,checked:input.checked}));
      `);
      await click('return document.querySelector(".fv31-step-complete input")');
      await waitFor('return document.querySelector(".fv31-step-complete input")?.checked === arguments[0]', "Farm quest checkbox did not update", [!previous]);
      report.farmProgressBeforeRefresh = await execute(`return {checked:document.querySelector('.fv31-step-complete input')?.checked ?? null,events:window.__aqwFarmProgressEvents}`);
      assert.notEqual(report.farmProgressBeforeRefresh.checked, null, "Farm checkbox disappeared after click");
      // AQW_SAFARI_FARM_REFRESH_DOCUMENT_V2: pageLoadStrategy "none" lets
      // /refresh return while the OLD document is still visible. Check a
      // new document's timeOrigin before accepting persisted progress.
      // React hydration can replace SSR nodes, so require stable observations.
      const farmDocumentOriginBeforeRefresh = await execute('return performance.timeOrigin');
      await command("POST", "/refresh", {});
      let farmRefreshStable = 0;
      let farmRefreshState = null;
      for (let attempt = 0; attempt < 100 && farmRefreshStable < 7; attempt++) {
        try {
          farmRefreshState = await execute(`
            const input = document.querySelector('.fv31-step-complete input');
            return {
              origin: performance.timeOrigin,
              pathname: location.pathname,
              search: location.search,
              readyState: document.readyState,
              checked: input ? input.checked : null,
            };
          `);
          const freshDocument = farmRefreshState.origin !== farmDocumentOriginBeforeRefresh;
          const correctRoute = farmRefreshState.pathname === '/farm/item/legion-revenant-class' &&
            new URLSearchParams(farmRefreshState.search).get('farm-tab') === 'guide';
          const ready = freshDocument && correctRoute &&
            farmRefreshState.readyState === 'complete' &&
            farmRefreshState.checked === !previous;
          farmRefreshStable = ready ? farmRefreshStable + 1 : 0;
        } catch (error) {
          // Navigation may temporarily invalidate the SafariDriver frame.
          // Only recover that known transient error; never hide test failures.
          if (!/no such frame/i.test(String(error?.message))) throw error;
          farmRefreshStable = 0;
          try {
            await command("POST", "/frame", { id: null });
          } catch (resetError) {
            if (!/no such frame/i.test(String(resetError?.message))) throw resetError;
          }
        }
        if (farmRefreshStable < 7) await pause(150);
      }
      assert.equal(farmRefreshStable, 7,
        'Farm quest progress did not persist in the NEW document: ' +
        JSON.stringify({ previous, expected: !previous, state: farmRefreshState })
      );
      report.farmProgressAfterRefresh = farmRefreshState.checked;
      await click('return document.querySelector(".fv31-step-complete input")');
      await waitFor('return document.querySelector(".fv31-step-complete input")?.checked === arguments[0]', "Farm progress cleanup failed", [previous]);
    },
  );
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
    assert.equal(
      await execute(
        'return document.activeElement.classList.contains("menu-button")',
      ),
      true,
    );
    await click('return document.querySelector(".menu-button")');
    await click(
      "return document.querySelector(arguments[0])",
      ['#mobile-nav a[href="/class"]'],
    );
    await waitFor(
      'return location.pathname === "/class" && !!document.querySelector(".class-search input") && !document.querySelector("#mobile-nav")',
      "Mobile Class navigation failed",
    );
    await command("POST", "/back", {});
    await waitFor(
      'return location.pathname === "/"',
      "Mobile navigation history failed",
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
    // AQW_SAFARI_ROUTE_COLLECT_STABILITY_V3: route checks are independent.
    // In collect-all only, report the failed navigation and try the next route.
    try {
      await navigate(route);
    } catch (error) {
      const message = String(error?.message ?? error);
      if (!collectAll || /no such (?:window|frame)|invalid session id|session not created|ECONNREFUSED|connection refused/i.test(message)) throw error;
      const failure = { name: "Route " + route, route, status: "failed", error: message };
      report.checks.push(failure);
      collectedFailures.push({ name: failure.name, route, error: message });
      console.error("FAIL", failure.name, "—", message);
      continue;
    }
    await check("Route " + route, async () =>
      assert.equal(
        await execute('return document.querySelectorAll("h1").length'),
        1,
      ),
    );
  }
  if (!isComingSoon("/trang-bi/general-boosted")) {
    await navigate("/trang-bi/general-boosted");
    await check("Native Boosted Items guide contains source text", async () => {
      await waitFor(
        'return document.querySelector("article").textContent.includes("2.3625")',
        "Full Boosted Items body missing",
      );
      assert.equal(
        await execute(
          "return document.querySelectorAll(arguments[0]).length",
          ['article a[href*="docs.google.com/document"]:not(.sources a)'],
        ),
        0,
      );
    });
  } else {
    await check("Boosted guide declared feature gate", async () =>
      assert.equal(
        await execute('return !!document.querySelector(".coming-soon-page")'),
        true,
      ),
    );
    report.limitations.push(
      "Native Boosted Items article is behind its declared feature gate; full source-body assertion retained for enabled deployments.",
    );
    report.checks.push({
      name: "Native Boosted Items source body",
      status: "skipped",
      reason: "Declared coming-soon route.",
    });
  }

  await navigate("/ultra-boss");
  await check("Ultra directory and client navigation", async () => {
    // AQW_ULTRA_DIRECTORY_WAIT_FOR_CARD_V1
    // The directory can retain its Daily/Weekly/Seasonal filter across navigations.
    // Interact with the real UI to expose Ultra Dage; never bypass the assertion.
    await waitFor(
      'return !!document.querySelector(".challenge-filters button")',
      "Ultra directory filters did not render",
    );
    await click(
      'return Array.from(document.querySelectorAll(".challenge-filters button")).find(b=>b.textContent.trim()==="Tất cả")',
    );
    await waitFor(
      'return !!document.querySelector(arguments[0])',
      "Ultra Dage card missing even with All filter",
      ['a[href="/ultra-boss/ultra-dage"]'],
    );
    await execute('window.__aqwNavigationProbe="alive"');
    await click(
      "return document.querySelector(arguments[0])",
      ['a[href="/ultra-boss/ultra-dage"]'],
    );
    await waitFor(
      'return location.pathname==="/ultra-boss/ultra-dage" && !!document.querySelector(".ultra-inspect")',
      "Ultra detail did not open",
    );
    assert.equal(await execute("return window.__aqwNavigationProbe"), "alive");
  });
  await check(
    "Current Ultra copy command or actionable Safari refusal",
    async () => {
      // Safari may reject a native pointer click on the visible Copy button.
      // Activate the focused real button using WebDriver keyboard actions,
      // preserving trusted user input and verifying the resulting feedback.
      await activateUltraControl(".command button");
      await waitFor(
        'return !!document.querySelector(".copy-status").textContent.trim()',
        "Copy feedback missing",
      );
      const message = await execute(
        'return document.querySelector(".copy-status").textContent',
      );
      assert(
        message.includes("Đã sao chép") ||
          message.includes("Không thể sao chép"),
      );
      report.clipboard = { message, contentsIndependentlyRead: false };
      report.limitations.push(
        "Clipboard feedback checked; clipboard contents require a manual paste in Safari.",
      );
    },
  );

  await check("Ultra tabs, skills and restored stats layout", async () => {
    const before = await execute(
      'return document.querySelector(".enemy-inspection").getBoundingClientRect().height',
    );
    await click(
      'return document.querySelector(".inspection-main-tabs button[data-panel=skills]")',
    );
    await pause(400);
    assert.equal(
      await execute(
        'return document.querySelector(".inspection-main-tabs button[data-panel=skills]").getAttribute("aria-selected")',
      ),
      "true",
    );
    assert.equal(
      await execute(
        'return !!document.querySelector(".enemy-skill-section.active-mode")',
      ),
      true,
    );
    await click(
      'return Array.from(document.querySelectorAll(".enemy-skill-tabs button")).find(e=>e.textContent.trim()==="PASSIVE SKILL")',
    );
    await waitFor(
      'return !!document.querySelector(".enemy-skill-section.passive-mode")',
      "Passive skills did not open",
    );
    await click(
      'return document.querySelector(".inspection-main-tabs button[data-panel=stats]")',
    );
    assert.match(
      await execute(
        'return document.querySelector(".enemy-status").textContent',
      ),
      /6\.500\.000/,
    );
    assert(
      Math.abs(
        before -
          (await execute(
            'return document.querySelector(".enemy-inspection").getBoundingClientRect().height',
          )),
      ) < 2,
    );
  });
  await check("Ultra multiple team accordions", async () => {
    const toggleCount = await execute(
      'return document.querySelectorAll(".ultra-team-toggle").length',
    );
    assert.ok(toggleCount >= 2, "Expected multiple team accordions");
    for (let i = 0; i < toggleCount; i++) {
      const alreadyOpen = await execute(
        'return document.querySelectorAll(".ultra-team-toggle")[arguments[0]]?.getAttribute("aria-expanded") === "true"',
        [i],
      );
      if (alreadyOpen) {
        await activateUltraControl(".ultra-team-toggle", i);
        await waitFor(
          'return document.querySelectorAll(".ultra-team-toggle")[arguments[0]]?.getAttribute("aria-expanded") === "false"',
          "Team accordion did not close", [i],
        );
      }
      await activateUltraControl(".ultra-team-toggle", i);
      await waitFor(
        'return document.querySelectorAll(".ultra-team-toggle")[arguments[0]]?.getAttribute("aria-expanded") === "true"',
        "Team accordion did not open with Enter", [i],
      );
    }
    assert.equal(
      await execute(
        'return document.querySelectorAll(".ultra-team-toggle[aria-expanded=true]").length',
      ),
      toggleCount,
    );
  });
  await check(
    "Ultra equipment switch and durable scoped progress",
    async () => {
      const initialEquipment = await execute(
        'return document.querySelector(".ultra-equipment-choice[aria-pressed=true]")?.getAttribute("aria-label")',
      );
      assert.ok(initialEquipment, "Initial Ultra equipment selection is present");
      const previous = await execute(
        'return document.querySelector(".ultra-quest-check input").checked',
      );
      await activateUltraControl(".ultra-quest-check input", 0, "\uE00D");
      await activateUltraControl(".ultra-equipment-choice", "Empowered Undead Champion");
      await waitFor(
        'return Array.from(document.querySelectorAll(".ultra-equipment-choice")).some(e=>e.getAttribute("aria-label")==="Empowered Undead Champion" && e.getAttribute("aria-pressed")==="true")',
        "Ultra equipment selection did not switch",
      );
      await waitFor(
        'return document.querySelector(".equipment-selected-content h3")?.textContent.includes("Empowered Undead Champion")',
        "Selected Ultra equipment details did not update",
      );
      assert.match(
        await execute(
          'return document.querySelector(".equipment-selected-content h3").textContent',
        ),
        /Empowered Undead Champion/,
      );
      await activateUltraControl(".ultra-equipment-choice", initialEquipment);
      await waitFor(
        'return document.querySelector(".equipment-selected-content h3")?.textContent.includes(arguments[0])',
        "Initial Ultra equipment details did not return",
        [initialEquipment],
      );
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
      await activateUltraControl(".ultra-quest-check input", 0, "\uE00D");
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
    await click('return document.querySelector(".back-to-top")');
    await waitFor("return scrollY<5", "Back to top failed");
  });
  await navigate("/missing-route");
  await check("404 recovery", async () =>
    assert.match(
      await execute('return document.querySelector("h1").textContent'),
      /Lạc khỏi bản đồ/,
    ),
  );
  // AQW_SAFARI_COLLECT_ALL_V1: the process must be nonzero if ANY check failed.
  if (collectAll && collectedFailures.length) {
    report.status = "failed";
    report.error = `${collectedFailures.length} Safari checks failed in collect-all mode`;
    process.exitCode = 1;
    console.error(`SAFARI COLLECT ALL: ${collectedFailures.length} failed checks`);
  } else {
    report.status = "passed";
  }
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
  try {
    await server?.close();
  } catch (error) {
    report.status = "failed";
    report.cleanupError = error.message;
    process.exitCode = 1;
  }
  if (collectAll) {
    report.collectAll = true;
    report.collectedFailures = collectedFailures;
    report.failedCheckCount = report.checks.filter(check => check.status === "failed").length;
  }
  report.driverLog = driverLog;
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log("Safari report:", path.join(output, "report.json"));
}
