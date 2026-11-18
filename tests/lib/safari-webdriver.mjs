const privateField =
  /(?:session.?id|token|cookie|authorization|password|secret|api.?key)/i;
function redact(value, sessionId) {
  if (Array.isArray(value)) return value.map((v) => redact(v, sessionId));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        privateField.test(key) ? "[redacted]" : redact(v, sessionId),
      ]),
    );
  if (typeof value !== "string") return value;
  let safe = value
    .replace(/(https?:\/\/)[^/\s@]+@/gi, "$1[redacted]@")
    .replace(/((?:Set-)?Cookie\s*:)[^\r\n]*/gi, "$1 [redacted]")
    .replace(/\/session\/[^\s/?"'<>]+/g, "/session/[redacted]")
    .replace(/Bearer\s+[^\s"'<>]+/gi, "Bearer [redacted]")
    .replace(
      /((?:token|cookie|password|secret|authorization|api.?key)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;<>]+)/gi,
      "$1[redacted]",
    );
  if (sessionId) safe = safe.replaceAll(sessionId, "[redacted]");
  return safe;
}
function bounded(text) {
  const bytes = Buffer.from(text),
    suffix = " [truncated]";
  return bytes.length <= 3072
    ? text
    : new TextDecoder().decode(
        bytes.subarray(0, 3072 - Buffer.byteLength(suffix)),
        { stream: true },
      ) + suffix;
}
export function webdriverDiagnostic(method, endpoint, status, raw, step) {
  const sessionId = endpoint.match(/\/session\/([^/?]+)/)?.[1];
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = raw;
  }
  const safe = redact(body, sessionId),
    w3c = safe?.value?.error ? safe.value : safe?.error ? safe : null;
  const command = /\/element\/[^/]+\/value$/.test(endpoint)
    ? "Element Send Keys"
    : /\/actions$/.test(endpoint)
      ? "Actions"
      : /\/execute\/sync$/.test(endpoint)
        ? "Execute Script"
        : /\/element\/[^/]+\/click$/.test(endpoint)
          ? "Element Click"
          : method + " " + redact(endpoint, sessionId);
  return {
    method,
    endpoint: redact(endpoint, sessionId),
    command,
    httpStatus: status,
    w3cError: w3c?.error || null,
    w3cMessage: w3c?.message ?? null,
    responseBody: bounded(
      typeof safe === "string" ? safe : JSON.stringify(safe),
    ),
    step: redact(step, sessionId),
  };
}
export async function requestSafariDriver({
  base,
  method,
  endpoint,
  body,
  step,
  onError,
  fetcher = fetch,
}) {
  let res;
  try {
    res = await fetcher(base + endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (cause) {
    const diagnostic = webdriverDiagnostic(method, endpoint, null, "", step);
    diagnostic.transportError = cause.name;
    onError?.(diagnostic);
    const error = new Error(`WebDriver ${diagnostic.command}: ${method} ${diagnostic.endpoint}; no HTTP response; ${cause.name}`);
    error.webdriver = diagnostic;
    throw error;
  }
  const raw = await res.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : { value: null };
  } catch {
    json = null;
  }
  if (!res.ok || json?.value?.error || json?.error || !json) {
    const diagnostic = webdriverDiagnostic(
      method,
      endpoint,
      res.status,
      raw,
      step,
    );
    onError?.(diagnostic);
    const error = new Error(
      `WebDriver ${diagnostic.command}: ${method} ${diagnostic.endpoint}; HTTP ${res.status}; ${diagnostic.w3cError || "no W3C code"}; ${diagnostic.w3cMessage || "see responseBody"}`,
    );
    error.webdriver = diagnostic;
    throw error;
  }
  return json.value;
}
