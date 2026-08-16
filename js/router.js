import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory, getContentDir } from "./utils.js";
import { setPageOutline, syncSidebars } from "./sidebar.js";
import { buildReadingPlan, stopReading } from "./reader.js";
import { t, tEntityLabel } from "./i18n.js";

/**
 * @param {Object} category
 * @param {string} subjectId
 * @returns {Object} the subject
 */
export function findSubject(category, subjectId) {
    return category.subjects?.find(subject => subject.id === subjectId);
}

/**
 * @param {string} lang "" for French, or one of structure/languages.json's codes
 * @returns {string} the content folder for that language
 */
function contentDirFor(lang) {
    return lang ? `content-${lang}` : "content";
}

/* ---- cross-language fallback for a page missing in the active language ----
   Folder/file names (hence ids) are never translated -- only each file's own content is -- so
   a categoryId/subjectId/pageId valid in one language's structure/struct-*.json is exactly the
   same id to look up in another's. Content translation is always a subset of the French source
   (content/), so French is the only fallback guaranteed to succeed if the id is valid at all. */

/* Struct files already fetched during a fallback lookup this session, keyed by language code
   ("" for French) -- avoids re-fetching the same struct on every subsequent missing page. */
const structCache = new Map();

async function fetchStructCategories(lang) {
    if (structCache.has(lang)) return structCache.get(lang);
    const path = lang ? `./structure/struct-${lang}.json` : "./structure/struct.json";
    const { categories } = await fetchFileToTextOrJson(path, 'json');
    structCache.set(lang, categories);
    return categories;
}

/**
 * @param {Array} categories one language's category tree (structure/struct-*.json's `categories`)
 * @returns {{category: Object, subject: Object|null, chapter: Object|null}|null} null if
 *   categoryId doesn't exist in `categories`, or if subjectId/pageId don't resolve within it
 */
function resolveInCategories(categories, categoryId, subjectId, pageId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    if (pageId === categoryId) return { category, subject: null, chapter: null };
    if (subjectId) {
        const subject = findSubject(category, subjectId);
        if (!subject) return null;
        if (pageId === subjectId) return { category, subject, chapter: null };
        const chapter = subject.chapters?.find(c => c.id === pageId);
        return chapter ? { category, subject, chapter } : null;
    }
    const chapter = category.chapters?.find(c => c.id === pageId);
    return chapter ? { category, subject: null, chapter } : null;
}

/**
 * Resolves categoryId/subjectId/pageId against the active language first, then English, then
 * French (skipping whichever of those is already the active language).
 *
 * @returns {Promise<{lang: string, category: Object, subject: Object|null, chapter: Object|null}|null>}
 *   null only if the id itself doesn't exist anywhere (a stale/broken link, not a missing
 *   translation)
 */
async function resolveAcrossLanguages(categoryId, subjectId, pageId) {
    const direct = resolveInCategories(appState.categories, categoryId, subjectId, pageId);
    if (direct) return { lang: appState.lang, ...direct };

    for (const lang of ["en", ""].filter(l => l !== appState.lang)) {
        const categories = await fetchStructCategories(lang);
        const found = resolveInCategories(categories, categoryId, subjectId, pageId);
        if (found) return { lang, ...found };
    }
    return null;
}

/**
 * Renders the result of {@link resolveAcrossLanguages} -- in the active language if that's
 * where it was found, otherwise in whichever fallback language had it, with a translated
 * notice (cf. renderCategory/renderSubject/renderChapter's own `lang` parameter).
 *
 * @param {{lang: string, category: Object, subject: Object|null, chapter: Object|null}} resolved
 */
function renderResolvedTarget({ lang, category, subject, chapter }) {
    if (chapter) {
        appState.navigationStack = subject
            ? [{type: 'home'}, {type: 'category', categoryId: category.id}, {type: 'subject', categoryId: category.id, subjectId: subject.id}]
            : [{type: 'home'}, {type: 'category', categoryId: category.id}];
        const contentDir = contentDirFor(lang);
        const path = subject
            ? `./${contentDir}/${category.folder}/${subject.folder}/${chapter.id}.md`
            : `./${contentDir}/${category.folder}/${chapter.id}.md`;
        pushNavUrl(buildNavUrl(category.id, subject?.id ?? null, chapter.id));
        renderChapter(category.id, path, chapter, subject?.id ?? null, category, subject, lang);
    } else if (subject) {
        appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId: category.id}];
        pushNavUrl(buildNavUrl(category.id, subject.id, subject.id));
        renderSubject(category, subject, lang);
    } else {
        appState.navigationStack = [{type: 'home'}];
        pushNavUrl(buildNavUrl(category.id, null, category.id));
        renderCategory(category, lang);
    }
}

/**
 * Resolves categoryId/subjectId/pageId across languages and renders whatever's found, or falls
 * back to the home page if the id doesn't exist anywhere (a stale/broken link).
 */
function renderAcrossLanguages(categoryId, subjectId, pageId) {
    resolveAcrossLanguages(categoryId, subjectId, pageId).then(resolved => {
        if (resolved) renderResolvedTarget(resolved);
        else generateHomePage();
    });
}

/* Session-only: read once at startup by resumePendingNavigation(), then cleared — carries the
   current page across a language switch's location.reload(), since ids (category/subject/chapter
   folder names) are language-independent while only their displayed `label` gets translated. */
export const PENDING_NAV_KEY = "devpedia-pending-nav";

/**
 * Call right before switching language (and reloading) to remember the page the user is
 * currently on, so {@link resumePendingNavigation} can restore it after the reload completes
 * in the new language, instead of dropping the user back on the home page.
 */
export function rememberCurrentPageForLanguageSwitch() {
    sessionStorage.setItem(PENDING_NAV_KEY, JSON.stringify({
        categoryId: appState.curCategory,
        subjectId: appState.curSubject,
        pageId: appState.curPageId
    }));
}

/**
 * Restores the page saved by {@link rememberCurrentPageForLanguageSwitch}, if any (consuming
 * it — it's a one-shot flag for the reload that follows a language switch), otherwise renders
 * the home page. Safe to call on every startup.
 */
/**
 * @param {string} url an absolute or root-relative URL, e.g. "/?c=shells&s=bash&p=variables"
 * @returns {{categoryId: string, subjectId: string|null, pageId: string}|null} the target
 *   described by its `c`/`s`/`p` query params, or null if it has no `c` param to navigate to
 */
function parseNavParams(url) {
    const params = new URLSearchParams(new URL(url, window.location.origin).search);
    const categoryId = params.get("c");
    if (!categoryId) return null;
    return { categoryId, subjectId: params.get("s"), pageId: params.get("p") ?? categoryId };
}

/* ---- browser history (back/forward + reload keep the current page) ----
   Requested by Louis on 2026-08-16: a full reload (e.g. from a live-reload dev server watching
   content files) always landed back on the home page, and the browser's own back/forward buttons
   did nothing, because nothing here ever touched `window.location` or `history` after the very
   first load -- every click just mutated appState/the DOM directly. `p`/`s`/`c` are exactly the
   same query params parseNavParams() above already reads at startup, so the fix is to also *write*
   them on every navigation instead of only reading them once. */

/**
 * @param {string} categoryId
 * @param {string|null} subjectId
 * @param {string} pageId
 * @returns {string} the URL parseNavParams() above would resolve back to this same target --
 *   `p` omitted when it's redundant with `c` (a category's or the home page's own intro page),
 *   the same default parseNavParams() already falls back to
 */
function buildNavUrl(categoryId, subjectId, pageId) {
    const params = new URLSearchParams({ c: categoryId });
    if (subjectId) params.set("s", subjectId);
    if (pageId !== categoryId) params.set("p", pageId);
    return `?${params.toString()}`;
}

/* True while a render is replaying whatever the current URL already says (the initial page load,
   or a browser back/forward navigation) rather than responding to a fresh click -- pushNavUrl()
   below is a no-op while this is set, so replaying the current URL never pushes it again as if it
   were a brand new destination. Every render dispatch function (loadCategory, navigateToSubject,
   navigateToChapter, generateHomePage, renderResolvedTarget, renderEntry) calls pushNavUrl() on its
   own, unconditionally, rather than threading a "should I push?" parameter through every one of
   them and every function that calls them -- simpler to reason about, at the cost of this one
   shared flag standing in for that parameter instead. */
let isReplayingUrl = false;

/**
 * @param {string} url see {@link buildNavUrl}
 */
function pushNavUrl(url) {
    if (!isReplayingUrl) history.pushState(null, "", url);
}

/**
 * Navigate to whatever `target` describes — a category's own page, a subject's own page, or a
 * chapter — the same dispatch {@link resumePendingNavigation} already did for a language-switch
 * restore, reused here for URL query params and in-content link clicks.
 *
 * @param {{categoryId: string, subjectId: string|null, pageId: string}} target
 * @returns {boolean} whether navigation happened -- directly, or (if `categoryId` doesn't
 *   exist in the active language) asynchronously via {@link renderAcrossLanguages}, which
 *   itself falls back to the home page if the id doesn't exist in any language
 */
function navigateToTarget({ categoryId, subjectId, pageId }) {
    const category = findCategory({ id: categoryId });
    if (!category) {
        renderAcrossLanguages(categoryId, subjectId, pageId);
        return true;
    }
    if (pageId === categoryId) {
        loadCategory(categoryId);
    } else if (subjectId && pageId === subjectId) {
        navigateToSubject(categoryId, subjectId);
    } else {
        navigateToChapter(categoryId, subjectId, pageId);
    }
    return true;
}

export function resumePendingNavigation() {
    isReplayingUrl = true;
    try {
        const raw = sessionStorage.getItem(PENDING_NAV_KEY);
        sessionStorage.removeItem(PENDING_NAV_KEY);
        if (raw) {
            const { categoryId, subjectId, pageId } = JSON.parse(raw);
            const category = findCategory({ id: categoryId });
            if (categoryId === "acceuil") {
                generateHomePage();
            } else if (!category) {
                renderAcrossLanguages(categoryId, subjectId, pageId);
            } else if (pageId === categoryId) {
                loadCategory(categoryId);
            } else if (pageId === subjectId) {
                navigateToSubject(categoryId, subjectId);
            } else {
                navigateToChapter(categoryId, subjectId, pageId);
            }
            return;
        }
        const target = parseNavParams(window.location.href);
        if (!target || !navigateToTarget(target))
            generateHomePage();
    } finally {
        isReplayingUrl = false;
    }
}

/**
 * The browser's own back/forward buttons -- re-renders whatever the URL now says (the same
 * parseNavParams()/navigateToTarget() dispatch resumePendingNavigation() uses at startup) without
 * pushing a new entry for it, since the browser already moved the history position on its own.
 */
window.addEventListener("popstate", () => {
    isReplayingUrl = true;
    try {
        const target = parseNavParams(window.location.href);
        if (!target || !navigateToTarget(target)) generateHomePage();
    } finally {
        isReplayingUrl = false;
    }
});

/**
 * Intercepts a plain click on an in-content cross-chapter link (`<a class="contentLink">`,
 * cf. parser.js) so it navigates through the SPA router instead of triggering a full page
 * reload — smoother (no white flash, current scroll/reader state discarded for nothing), even
 * though a reload now resolves to the same page too (cf. resumePendingNavigation()/pushNavUrl()).
 * A click carrying a modifier key (Ctrl/Cmd/Shift, or a non-primary button) is left alone so
 * "open in a new tab" still works. No `history.pushState` call needed directly here: it
 * delegates to navigateToTarget(), which reaches loadCategory()/navigateToSubject()/
 * navigateToChapter() the same way a sidebar click does, and each of those already pushes its own
 * URL.
 *
 * @param {HTMLElement} pageDiv
 */
function attachContentLinkHandler(pageDiv) {
    pageDiv.addEventListener("click", (e) => {
        const link = e.target.closest("a.contentLink");
        if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const target = parseNavParams(link.href);
        if (!target || !navigateToTarget(target)) return;
        e.preventDefault();
    });
}

function closeMobileMenu() {
    document.querySelector(".menuDiv").classList.remove("visible");
}

/* Current chapter's neighbors, kept in sync by renderChapter/clearChapterNeighbors so the
   ArrowLeft/ArrowRight handler below can navigate without re-deriving them from the DOM. */
let currentPreviousChapter = null;
let currentNextChapter = null;

function clearChapterNeighbors() {
    currentPreviousChapter = null;
    currentNextChapter = null;
}

/**
 * @param {HTMLElement} target the keydown event's target
 * @returns {boolean} whether `target` is where arrow keys should type a character
 *   (a text field) rather than navigate between chapters
 */
function isTextInput(target) {
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/**
 * ArrowLeft/ArrowRight moves to the previous/next chapter, mirroring the arrow glyphs used by
 * the on-screen prevButton/nextButton (which already flip in RTL, cf. createAppendPageNav) —
 * same left/right meaning, just from the keyboard instead of a click.
 */
document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (isTextInput(e.target)) return;
    const isRtl = document.documentElement.dir === "rtl";
    const wantsPrevious = (e.key === "ArrowLeft") !== isRtl;
    const chapter = wantsPrevious ? currentPreviousChapter : currentNextChapter;
    if (!chapter) return;
    navigateToChapter(chapter.categoryId, chapter.subjectId, chapter.id);
});

/**
 * Remove the page currently displayed, if any
 */
function clearCurrentPage() {
    stopReading();
    const currentDiv = document.querySelector(`.${appState.curPageId}Div`);
    if (currentDiv)
        currentDiv.remove();
}

/**
 * Builds a prev/next chapter button as two separate elements — an arrow pinned to the
 * button's outer edge, and a label that can wrap onto several lines on its own without
 * dragging the arrow along with it.
 *
 * @param {string} className
 * @param {string} label
 * @param {string} arrow
 * @param {Boolean} arrowFirst true for the previous-chapter button (arrow, then label),
 *   false for the next-chapter button (label, then arrow)
 * @returns {HTMLElement} button
 */
function createChapterNavButton(className, label, arrow, arrowFirst) {
    const button = createTag("button", {class: className});
    const arrowSpan = createTag("span", {class: "chapterNavArrow"}, {textContent: arrow});
    const labelSpan = createTag("span", {class: "chapterNavLabel"}, {textContent: label});
    button.append(...(arrowFirst ? [arrowSpan, labelSpan] : [labelSpan, arrowSpan]));
    return button;
}

/**
 * A chapter page's only permanent indication of where it sits (category, and subject if
 * any) — the left sidebar shows the same tree, but is hidden on mobile behind the menu
 * button, where this is otherwise the only such cue on screen.
 *
 * @param {Object} category
 * @param {Object|null} subject
 * @returns {HTMLElement}
 */
function createBreadcrumb(category, subject) {
    const nav = createTag("nav", {class: "pageBreadcrumb"});
    const categoryButton = createTag("button", {class: "breadcrumbCategory"}, {textContent: tEntityLabel("categoryLabels", category.id, category.label)});
    categoryButton.addEventListener("click", () => loadCategory(category.id));
    nav.append(categoryButton);
    if (subject) {
        nav.append(createTag("span", {class: "breadcrumbSeparator"}, {textContent: "›"}));
        const subjectButton = createTag("button", {class: "breadcrumbSubject"}, {textContent: tEntityLabel("subjectLabels", subject.id, subject.label)});
        subjectButton.addEventListener("click", () => navigateToSubject(category.id, subject.id));
        nav.append(subjectButton);
    }
    return nav;
}

/**
 * @param {string} pageId
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} previousChapter
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} nextChapter
 * @returns {HTMLElement|null} the previous/next chapter buttons, stacked and right-aligned rather
 *   than side by side (two chapter titles on one row can get uncomfortably long), or null if
 *   there's neither a previous nor a next chapter to link to
 */
function createChapterNav(pageId, previousChapter, nextChapter) {
    if (!previousChapter && !nextChapter) return null;
    const chapterNav = createTag("div", {class: "chapterNav"});
    if (previousChapter) {
        const arrow = document.documentElement.dir === "rtl" ? "→" : "←";
        const prevButton = createChapterNavButton(`prevButton ${pageId}PrevButton`, previousChapter.label, arrow, true);
        prevButton.addEventListener("click", (e) => {
            navigateToChapter(previousChapter.categoryId, previousChapter.subjectId, previousChapter.id);
        })
        chapterNav.append(prevButton);
    }
    if (nextChapter) {
        const arrow = document.documentElement.dir === "rtl" ? "←" : "→";
        const nextButton = createChapterNavButton(`nextButton ${pageId}NextButton`, nextChapter.label, arrow, false);
        nextButton.addEventListener("click", (e) => {
            navigateToChapter(nextChapter.categoryId, nextChapter.subjectId, nextChapter.id);
        })
        chapterNav.append(nextButton);
    }
    return chapterNav;
}

/**
 * @param {HTMLElement} pageDiv where the nav row will be attached to
 * @param {string} pageId
 * @param {Boolean} withReturnButton
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} previousChapter
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} nextChapter
 */
function createAppendPageNav(pageDiv, pageId, withReturnButton, previousChapter, nextChapter) {
    const nav = createTag("div", {class: "pageNav"});
    if (withReturnButton) {
        const arrow = document.documentElement.dir === "rtl" ? "→" : "←";
        const returnButton = createTag("button", {class: `returnButton ${pageId}ReturnButton`}, {textContent: `${arrow} ${t("return")}`});
        returnButton.addEventListener("click", (e) => {
            const previousEntry = appState.navigationStack.pop();
            renderEntry(previousEntry);
        })
        nav.append(returnButton);
    }
    const chapterNav = createChapterNav(pageId, previousChapter, nextChapter);
    if (chapterNav) nav.append(chapterNav);
    pageDiv.append(nav);
}

/**
 * Appends a second previous/next chapter nav at the very end of the page content, past the
 * bottom of a chapter's own text -- so moving to the next chapter doesn't require scrolling back
 * up to the one at the top first (requested by Louis on 2026-08-16). No return button here, only
 * the chapter buttons: the request was specifically about reaching the next/previous chapter
 * without scrolling, not about going back up a level (which the return button does).
 *
 * Laid out as its own full-width row (previous at the start, next at the end) rather than reusing
 * createChapterNav()'s stacked, right-aligned pair -- that layout exists specifically to leave
 * room for the return button sharing the row at the top of the page; with no return button down
 * here, the full page width is free to use instead (requested by Louis on 2026-08-16).
 *
 * @param {HTMLElement} pageDiv where the nav row will be attached to
 * @param {string} pageId
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} previousChapter
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} nextChapter
 */
function appendBottomChapterNav(pageDiv, pageId, previousChapter, nextChapter) {
    if (!previousChapter && !nextChapter) return;
    const nav = createTag("div", {class: "pageNavBottom"});
    if (previousChapter) {
        const arrow = document.documentElement.dir === "rtl" ? "→" : "←";
        const prevButton = createChapterNavButton(`prevButton ${pageId}PrevButton`, previousChapter.label, arrow, true);
        prevButton.addEventListener("click", (e) => {
            navigateToChapter(previousChapter.categoryId, previousChapter.subjectId, previousChapter.id);
        })
        nav.append(prevButton);
    }
    if (nextChapter) {
        const arrow = document.documentElement.dir === "rtl" ? "←" : "→";
        const nextButton = createChapterNavButton(`nextButton ${pageId}NextButton`, nextChapter.label, arrow, false);
        nextButton.addEventListener("click", (e) => {
            navigateToChapter(nextChapter.categoryId, nextChapter.subjectId, nextChapter.id);
        })
        nav.append(nextButton);
    }
    pageDiv.append(nav);
}

/**
 * @param {string} textInfos
 * @param {string} pageId
 * @param {Boolean} withReturnButton
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} [previousChapter]
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} [nextChapter]
 * @param {HTMLElement|null} [breadcrumb] see {@link createBreadcrumb} — chapter and subject pages
 * @param {string|null} [notice] see {@link resolveAcrossLanguages} — shown when this page had to
 *   be substituted from another language
 * @param {string|null} [titleOverride] a category's or subject's own intro page always has its
 *   `#` heading equal to its folder name (in French, even in a translated language — see
 *   README's "Content structure" section, and js/i18n.js's tEntityLabel doc comment) so that
 *   generate-struct.js can recognize it as that folder's main file; pass the translated label
 *   here to display it instead. Applied before buildReadingPlan() so the TTS reads it too.
 * @returns {HTMLElement} page div
 */
function generatePageContent(textInfos, pageId, withReturnButton, previousChapter = null, nextChapter = null, breadcrumb = null, notice = null, titleOverride = null) {
    const text = parseMdContent(textInfos);
    const pageDiv = createTag("div", {class: `page ${pageId}Div`});
    if (notice)
        pageDiv.append(createTag("div", {class: "pageFallbackNotice"}, {textContent: notice}));
    if (breadcrumb)
        pageDiv.append(breadcrumb);
    if (withReturnButton || previousChapter || nextChapter)
        createAppendPageNav(pageDiv, pageId, withReturnButton, previousChapter, nextChapter);
    const outline = parseAppendText(pageDiv, pageId, text);
    if (titleOverride) {
        const titleEl = pageDiv.querySelector(".pageTitle");
        if (titleEl)
            titleEl.textContent = titleOverride;
    }
    appendBottomChapterNav(pageDiv, pageId, previousChapter, nextChapter);
    attachContentLinkHandler(pageDiv);
    document.body.append(pageDiv);
    setPageOutline(outline);
    syncSidebars();
    buildReadingPlan(pageDiv);
    return pageDiv;
}

/**
 * @param {HTMLElement} pageDiv where the list will be attached to
 * @param {Array} items subjects or chapters to list
 * @param {string} listId
 * @param {Function} onSelect called with the selected item
 */
function generateChildList(pageDiv, items, listId, onSelect) {
    const ul = createTag("ul", {class: `childList ${listId}List`})
    items.forEach(item => {
        /* Subjects (their own `chapters` array) need a translated label (cf. i18n.js's
           tEntityLabel); a chapter's label is already correctly translated at the source. */
        const label = Array.isArray(item.chapters) ? tEntityLabel("subjectLabels", item.id, item.label) : item.label;
        const button = createTag("button", {class: `childButton ${item.id}button`}, {textContent: label})
        button.addEventListener("click", (e) => onSelect(item));
        const li = createTag("li", {class: `${listId}List`});
        li.append(button);
        ul.append(li);
    });
    pageDiv.append(ul);
}

/**
 * Render the home page.
 *
 * Pushes a bare URL with no query params, rather than buildNavUrl()'s usual "?c=..." -- "acceuil"
 * isn't a real entry in structure/struct.json (cf. resumePendingNavigation()'s own special-case
 * check for it), so a bare URL is what parseNavParams() already treats as "go home" today; pushing
 * "?c=acceuil" instead would send a future reload down its slower not-found-in-any-language
 * fallback path (cf. navigateToTarget()) to reach the exact same page.
 */
export async function generateHomePage() {
    clearCurrentPage();
    clearChapterNeighbors();
    appState.curCategory = 'acceuil';
    appState.curSubject = null;
    appState.curPageId = 'acceuil';
    pushNavUrl(window.location.pathname);
    const homeInfos = await fetchFileToTextOrJson(`./${getContentDir()}/acceuil.md`, 'text');
    generatePageContent(homeInfos, 'acceuil', false);
}

/**
 * @param {string} lang language a page is about to be rendered in
 * @returns {string|null} the translated substitution notice if `lang` isn't the active
 *   language (see {@link resolveAcrossLanguages}), null otherwise
 */
function fallbackNoticeFor(lang) {
    return lang !== appState.lang ? t("pageFallbackNotice") : null;
}

/**
 * Render a chapter page (leaf content, belonging to a subject or a flat category)
 *
 * @param {string} categoryId
 * @param {string} path path to the chapter's markdown file
 * @param {Object} chapter
 * @param {string} [subjectId] the subject this chapter belongs to, if any
 * @param {Object|null} [resolvedCategory] pre-resolved category, used instead of looking it up
 *   in the active language's structure -- see {@link resolveAcrossLanguages}, whose result may
 *   come from a different language's structure than the one currently loaded into appState
 * @param {Object|null} [resolvedSubject] same as `resolvedCategory`, for the subject
 * @param {string} [lang] the language `path` was built for -- see {@link fallbackNoticeFor}
 */
async function renderChapter(categoryId, path, chapter, subjectId = null, resolvedCategory = null, resolvedSubject = null, lang = appState.lang) {
    clearCurrentPage();
    appState.curCategory = categoryId;
    appState.curSubject = subjectId;
    appState.curPageId = chapter.id;
    const chapterInfos = await fetchFileToTextOrJson(path, 'text');
    const category = resolvedCategory ?? findCategory({id: categoryId});
    const subject = subjectId ? (resolvedSubject ?? findSubject(category, subjectId)) : null;
    const chapters = (subject ? subject.chapters : category.chapters) ?? [];
    const curIndex = chapters.findIndex(c => c.id === chapter.id);
    const previousChapter = chapters[curIndex - 1];
    const nextChapter = chapters[curIndex + 1];
    currentPreviousChapter = previousChapter && {categoryId, subjectId, id: previousChapter.id, label: previousChapter.label};
    currentNextChapter = nextChapter && {categoryId, subjectId, id: nextChapter.id, label: nextChapter.label};
    generatePageContent(chapterInfos, chapter.id, true, currentPreviousChapter, currentNextChapter, createBreadcrumb(category, subject), fallbackNoticeFor(lang));
}

/**
 * Render a subject page: its own description plus the list of its chapters
 *
 * @param {Object} category
 * @param {Object} subject
 * @param {string} [lang] language to render in -- see {@link fallbackNoticeFor}, defaults to
 *   the active one, propagated to every chapter reachable from this page so browsing onward
 *   stays in the same (possibly substituted) language rather than reverting mid-chapter
 */
async function renderSubject(category, subject, lang = appState.lang) {
    clearCurrentPage();
    clearChapterNeighbors();
    appState.curCategory = category.id;
    appState.curSubject = subject.id;
    appState.curPageId = subject.id;
    const contentDir = contentDirFor(lang);
    const path = `./${contentDir}/${category.folder}/${subject.folder}/${subject.id}.md`;
    const subjectInfos = await fetchFileToTextOrJson(path, 'text');
    const pageDiv = generatePageContent(subjectInfos, subject.id, true, null, null, createBreadcrumb(category, null), fallbackNoticeFor(lang), tEntityLabel("subjectLabels", subject.id, subject.label));
    generateChildList(pageDiv, subject.chapters ?? [], subject.id, (chapter) => {
        appState.navigationStack.push({type: 'subject', categoryId: category.id, subjectId: subject.id});
        renderChapter(category.id, `./${contentDir}/${category.folder}/${subject.folder}/${chapter.id}.md`, chapter, subject.id, category, subject, lang);
    });
}

/**
 * Render a category page: its description plus its subjects, or its chapters
 * when the category has no subjects (e.g. Bash, Git)
 *
 * @param {Object} category
 * @param {string} [lang] language to render in -- see {@link fallbackNoticeFor}, defaults to
 *   the active one, propagated onward the same way {@link renderSubject} does
 */
async function renderCategory(category, lang = appState.lang) {
    clearCurrentPage();
    clearChapterNeighbors();
    appState.curCategory = category.id;
    appState.curSubject = null;
    appState.curPageId = category.id;
    const contentDir = contentDirFor(lang);
    const pageInfos = await fetchFileToTextOrJson(`./${contentDir}/${category.folder}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, category.id, true, null, null, null, fallbackNoticeFor(lang));
    if (category.subjects) {
        generateChildList(pageDiv, category.subjects, category.id, (subject) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderSubject(category, subject, lang);
        });
    } else if (category.chapters) {
        generateChildList(pageDiv, category.chapters, category.id, (chapter) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderChapter(category.id, `./${contentDir}/${category.folder}/${chapter.id}.md`, chapter, null, category, null, lang);
        });
    }
}

/**
 * Render whatever page a navigation stack entry points to
 *
 * @param {Object} entry
 */
function renderEntry(entry) {
    if (!entry || entry.type === 'home') {
        generateHomePage();
        return;
    }
    const category = findCategory({id: entry.categoryId});
    const subject = entry.type === 'subject' && category && findSubject(category, entry.subjectId);
    if (!category || (entry.type === 'subject' && !subject)) {
        /* Reached by "Retour" from a cross-language fallback page (cf. renderResolvedTarget) --
           this category/subject doesn't exist in the active language either. */
        renderAcrossLanguages(entry.categoryId, entry.subjectId ?? null, entry.subjectId ?? entry.categoryId);
        return;
    }
    if (entry.type === 'subject') {
        pushNavUrl(buildNavUrl(category.id, subject.id, subject.id));
        renderSubject(category, subject);
    } else {
        pushNavUrl(buildNavUrl(category.id, null, category.id));
        renderCategory(category);
    }
}

/**
 * Load the category corresponding to the button name, if the current category displayed is
 * the one of the button, nothing happens
 *
 * @param {string} categoryId
 */
export function loadCategory(categoryId) {
    closeMobileMenu();
    if (categoryId === appState.curCategory && categoryId === appState.curPageId)
        return ;
    if (categoryId === 'acceuil') {
        appState.navigationStack = [];
        generateHomePage();
        return;
    }
    const category = findCategory({id: categoryId});
    if (!category) {
        /* Reached from the breadcrumb of a cross-language fallback page (cf. renderResolvedTarget)
           -- this category doesn't exist in the active language either. */
        renderAcrossLanguages(categoryId, null, categoryId);
        return;
    }
    appState.navigationStack = [{type: 'home'}];
    pushNavUrl(buildNavUrl(categoryId, null, categoryId));
    renderCategory(category);
}

/**
 * Navigate directly to a subject's page (used by the sidebar tree)
 *
 * @param {string} categoryId
 * @param {string} subjectId
 */
export function navigateToSubject(categoryId, subjectId) {
    closeMobileMenu();
    const category = findCategory({id: categoryId});
    const subject = category && findSubject(category, subjectId);
    if (!subject) {
        renderAcrossLanguages(categoryId, subjectId, subjectId);
        return;
    }
    appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}];
    pushNavUrl(buildNavUrl(categoryId, subjectId, subjectId));
    renderSubject(category, subject);
}

/**
 * Navigate directly to a chapter's page (used by the sidebar tree)
 *
 * @param {string} categoryId
 * @param {string} [subjectId] the subject this chapter belongs to, if any
 * @param {string} chapterId
 */
export function navigateToChapter(categoryId, subjectId, chapterId) {
    closeMobileMenu();
    const category = findCategory({id: categoryId});
    const subject = subjectId ? category && findSubject(category, subjectId) : null;
    const chapter = subjectId ? subject?.chapters.find(c => c.id === chapterId) : category?.chapters.find(c => c.id === chapterId);
    if (!chapter) {
        renderAcrossLanguages(categoryId, subjectId, chapterId);
        return;
    }
    pushNavUrl(buildNavUrl(categoryId, subjectId, chapterId));
    if (subjectId) {
        appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}, {type: 'subject', categoryId, subjectId}];
        renderChapter(categoryId, `./${getContentDir()}/${category.folder}/${subject.folder}/${chapter.id}.md`, chapter, subjectId);
    } else {
        appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}];
        renderChapter(categoryId, `./${getContentDir()}/${category.folder}/${chapter.id}.md`, chapter);
    }
}
