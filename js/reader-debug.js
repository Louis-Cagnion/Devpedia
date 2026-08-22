/**
 * @brief On-page diagnostic log for the iOS lock-screen audio bug, for when no Mac is available
 * for Safari's remote Web Inspector. Persisted to localStorage (survives iOS silently killing and
 * reloading the page while backgrounded, unlike an in-memory log) and shown as an on-screen overlay
 * so it can be read directly on the phone. Opt-in via a `?debug=1` URL param -- never active
 * otherwise, so it costs nothing for a normal visit.
 *
 * Each session logs its own random boot id first: two different ids in the log with no "pagehide"
 * between them means iOS killed the page process outright rather than merely suspending it.
 */
const DEBUG_STORAGE_KEY = "devpedia-reader-debug-log";
const MAX_LOG_ENTRIES = 300;
export const DEBUG_ENABLED = new URLSearchParams(location.search).has("debug");

function readLog() {
    try {
        return JSON.parse(localStorage.getItem(DEBUG_STORAGE_KEY)) ?? [];
    } catch {
        return [];
    }
}

let overlayEl = null;

/** @brief Appends one timestamped line to the persisted log and refreshes the overlay. No-op unless `?debug=1`. */
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
 * restore/eviction). No-op unless `?debug=1`. Call once at startup.
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
