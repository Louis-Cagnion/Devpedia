/**
 * @brief On-page diagnostic log for the iOS lock-screen audio bug, for when no Mac is available
 * for Safari's remote Web Inspector. Persisted to localStorage (survives iOS silently killing and
 * reloading the page while backgrounded, unlike an in-memory log) and shown as an on-screen overlay
 * so it can be read directly on the phone.
 *
 * A home-screen "standalone" app on iOS keeps its own separate storage, not shared with a regular
 * Safari tab on the same page (confirmed on a real iPhone, 22/08/2026: a ?debug=1 flag set from a
 * Safari tab never reached the installed icon) -- so the flag has to be toggled from inside whichever
 * context needs it, without relying on a URL (the standalone app has no address bar). 5 taps on the
 * navbar logo within 2.5s flips it and reloads, working the same in a Safari tab or the installed app.
 *
 * Each session logs its own random boot id first: two different ids in the log with no "pagehide"
 * between them means iOS killed the page process outright rather than merely suspending it.
 */
const DEBUG_STORAGE_KEY = "devpedia-reader-debug-log";
const DEBUG_FLAG_KEY = "devpedia-reader-debug-enabled";
const MAX_LOG_ENTRIES = 300;
const TOGGLE_TAP_COUNT = 5;
const TOGGLE_TAP_WINDOW_MS = 2500;

export const DEBUG_ENABLED = localStorage.getItem(DEBUG_FLAG_KEY) === "1";

/**
 * @brief Wires the 5-taps-on-the-logo gesture that flips DEBUG_ENABLED and reloads. Delegated on
 * `document` (rather than queried once) since the navbar is rendered asynchronously by js/nav.js,
 * possibly after this runs. Call once at startup, regardless of whether debug mode is currently on.
 */
export function initReaderDebugToggle() {
    let tapCount = 0;
    let resetTimeoutId = null;
    document.addEventListener("click", e => {
        if (!e.target.closest(".logo")) return;
        tapCount++;
        clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(() => { tapCount = 0; }, TOGGLE_TAP_WINDOW_MS);
        if (tapCount < TOGGLE_TAP_COUNT) return;
        if (DEBUG_ENABLED) localStorage.removeItem(DEBUG_FLAG_KEY);
        else localStorage.setItem(DEBUG_FLAG_KEY, "1");
        location.reload();
    });
}

function readLog() {
    try {
        return JSON.parse(localStorage.getItem(DEBUG_STORAGE_KEY)) ?? [];
    } catch {
        return [];
    }
}

let overlayEl = null;

/** @brief Appends one timestamped line to the persisted log and refreshes the overlay. No-op unless DEBUG_ENABLED. */
export function logEvent(label, detail = "") {
    if (!DEBUG_ENABLED) return;
    const log = readLog();
    log.push(`${new Date().toISOString().slice(11, 23)} ${label}${detail ? " " + detail : ""}`);
    while (log.length > MAX_LOG_ENTRIES) log.shift();
    localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(log));
    if (overlayEl) {
        overlayEl.textContent = log.join("\n");
        overlayEl.scrollTop = overlayEl.scrollHeight;
    }
}

/**
 * @brief Mounts the log overlay and starts tracking page lifecycle events (visibility, bfcache
 * restore/eviction). No-op unless DEBUG_ENABLED. Call once at startup.
 */
export function initReaderDebugOverlay() {
    if (!DEBUG_ENABLED) return;
    overlayEl = document.createElement("pre");
    overlayEl.id = "readerDebugOverlay";
    document.body.append(overlayEl);
    logEvent("boot", Math.random().toString(36).slice(2, 8));

    document.addEventListener("visibilitychange", () => logEvent("visibilitychange", document.visibilityState));
    window.addEventListener("pageshow", e => logEvent("pageshow", `persisted=${e.persisted}`));
    window.addEventListener("pagehide", e => logEvent("pagehide", `persisted=${e.persisted}`));
}
