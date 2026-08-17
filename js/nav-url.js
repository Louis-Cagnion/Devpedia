import { appState } from "./state.js";

/* Session-only: read once at startup by router.js's resumePendingNavigation(), then cleared;
   carries the current page across a language switch's location.reload(), since ids are
   language-independent. */
export const PENDING_NAV_KEY = "devpedia-pending-nav";

/** @brief Remembers the current page before a language switch, so it can be restored after the reload. */
export function rememberCurrentPageForLanguageSwitch() {
    sessionStorage.setItem(PENDING_NAV_KEY, JSON.stringify({
        categoryId: appState.curCategory,
        subjectId: appState.curSubject,
        pageId: appState.curPageId
    }));
}

/**
 * @brief Parses a nav URL's `c`/`s`/`p` query params into a navigation target.
 *
 * @param {string} url an absolute or root-relative URL, e.g. "/?c=shells&s=bash&p=variables"
 *
 * @returns {{categoryId: string, subjectId: string|null, pageId: string}|null} null if there's
 *   no `c` param to navigate to
 */
export function parseNavParams(url) {
    const params = new URLSearchParams(new URL(url, window.location.origin).search);
    const categoryId = params.get("c");
    if (!categoryId) return null;
    return { categoryId, subjectId: params.get("s"), pageId: params.get("p") ?? categoryId };
}

/**
 * @brief Builds the URL parseNavParams() would resolve back to this same target.
 *
 * @param {string} categoryId
 * @param {string|null} subjectId
 * @param {string} pageId
 *
 * @returns {string} `p` omitted when it's redundant with `c`
 */
export function buildNavUrl(categoryId, subjectId, pageId) {
    const params = new URLSearchParams({ c: categoryId });
    if (subjectId) params.set("s", subjectId);
    if (pageId !== categoryId) params.set("p", pageId);
    return `?${params.toString()}`;
}

/* True while replayingUrl() is replaying the current URL (initial load, back/forward), making
   pushNavUrl() below a no-op. Every click to a new page must call pushNavUrl() itself, including
   generateChildList() callbacks in router.js -- skipping it stuck the URL on the previous page
   (Louis, 2026-08-16). */
let isReplayingUrl = false;

/**
 * @brief Pushes `url` to browser history, unless a render is currently replaying the current URL.
 *
 * @param {string} url see {@link buildNavUrl}
 */
export function pushNavUrl(url) {
    if (!isReplayingUrl) history.pushState(null, "", url);
}

/**
 * @brief Runs `fn` with pushNavUrl() disabled, for re-renders that must not push a new history
 * entry (initial load, back/forward navigation).
 *
 * @param {Function} fn
 */
export function replayingUrl(fn) {
    isReplayingUrl = true;
    try {
        fn();
    } finally {
        isReplayingUrl = false;
    }
}
