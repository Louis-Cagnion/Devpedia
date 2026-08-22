import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory, findSubject, getContentDir } from "./utils.js";
import { setPageOutline, syncSidebars } from "./sidebar.js";
import {
    buildReadingPlan,
    stopReading,
    onPlaybackComplete,
    onStatusChange,
    getReaderStatus,
    resumeReading,
    pauseReading,
    continueAfterCode,
} from "./reader.js";
import { t, tEntityLabel } from "./i18n.js";
import { resolveAcrossLanguages } from "./router-language-fallback.js";
import { PENDING_NAV_KEY, buildNavUrl, parseNavParams, pushNavUrl, replayingUrl } from "./nav-url.js";
import { resolveLegacyCategory } from "./legacy-category-redirects.js";

/**
 * @brief Renders the result of {@link resolveAcrossLanguages}, in the active language if found
 * there, otherwise in the fallback language with a translated notice.
 *
 * @param {{lang: string, category: Object, subject: Object|null, chapter: Object|null}} resolved
 */
function renderResolvedTarget({ lang, category, subject, chapter }) {
    if (chapter) {
        appState.navigationStack = subject
            ? [{type: 'home'}, {type: 'category', categoryId: category.id}, {type: 'subject', categoryId: category.id, subjectId: subject.id}]
            : [{type: 'home'}, {type: 'category', categoryId: category.id}];
        const contentDir = getContentDir(lang);
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

/** @brief Resolves categoryId/subjectId/pageId across languages and renders it, or falls back to the home page. */
function renderAcrossLanguages(categoryId, subjectId, pageId) {
    resolveAcrossLanguages(categoryId, subjectId, pageId).then(resolved => {
        if (resolved) renderResolvedTarget(resolved);
        else generateHomePage();
    });
}

/**
 * @brief Navigates to whatever `rawTarget` describes: a category's, subject's, or chapter's page.
 * Resolved through {@link resolveLegacyCategory} first, so an old folded-away category id still
 * lands on its new location.
 *
 * @param {{categoryId: string, subjectId: string|null, pageId: string}} rawTarget
 *
 * @returns {boolean} whether navigation happened, directly or (if `categoryId` doesn't exist in
 *   the active language) asynchronously via {@link renderAcrossLanguages}
 */
function navigateToTarget(rawTarget) {
    const { categoryId, subjectId, pageId } = resolveLegacyCategory(rawTarget);
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

/**
 * @brief Restores the page saved by lang.js's rememberCurrentPageForLanguageSwitch(), if any,
 * otherwise renders whatever the current URL says, or the home page. Safe to call on every startup.
 */
export function resumePendingNavigation() {
    replayingUrl(() => {
        const raw = sessionStorage.getItem(PENDING_NAV_KEY);
        sessionStorage.removeItem(PENDING_NAV_KEY);
        if (raw) {
            const { categoryId, subjectId, pageId } = resolveLegacyCategory(JSON.parse(raw));
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
    });
}

/* The browser's own back/forward buttons -- re-renders whatever the URL now says, without
   pushing a new entry for it since the browser already moved the history position on its own. */
window.addEventListener("popstate", () => {
    replayingUrl(() => {
        const target = parseNavParams(window.location.href);
        if (!target || !navigateToTarget(target)) generateHomePage();
    });
});

/**
 * @brief Intercepts a plain click on an in-content cross-chapter link so it navigates through
 * the SPA router instead of triggering a full page reload. A click carrying a modifier key or a
 * non-primary button is left alone so "open in a new tab" still works.
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

/* Chapter auto-advance: reader.js reports only that the plan finished, with no notion of
   navigation itself, so the site-wide "what's next" resolution and the actual page change happen
   here instead. */
const AUTO_ADVANCE_DELAY_MS = 5000;
let autoAdvanceTimeoutId = null;

/** @brief Cancels a pending chapter auto-advance, if any, removing its on-screen notice everywhere it was shown. */
function cancelAutoAdvance() {
    if (autoAdvanceTimeoutId === null) return;
    clearTimeout(autoAdvanceTimeoutId);
    autoAdvanceTimeoutId = null;
    document.querySelectorAll(".readerAutoAdvanceNotice").forEach(notice => notice.remove());
}

/**
 * @brief Returns every chapter of the site in reading order, subjects and subject-less
 * categories both flattened to the same {categoryId, subjectId, id} shape.
 *
 * @returns {Array<{categoryId: string, subjectId: string|null, id: string}>}
 */
function flattenChapters() {
    const entries = [];
    // Excludes "acceuil": a synthetic entry generate-struct.js adds only so internal home links
    // validate, with no `folder` -- navigateToChapter() can't render it (cf. generateHomePage()).
    appState.categories.filter(category => category.id !== "acceuil").forEach(category => {
        (category.subjects ?? [{ id: null, chapters: category.chapters ?? [] }]).forEach(subject => {
            (subject.chapters ?? []).forEach(chapter => {
                entries.push({ categoryId: category.id, subjectId: subject.id, id: chapter.id });
            });
        });
    });
    return entries;
}

/**
 * @brief Returns the index, within the site-wide flattened chapter list, of the chapter currently
 * displayed.
 *
 * @param {Array<{categoryId: string, subjectId: string|null, id: string}>} entries
 *
 * @returns {number} -1 if the current page isn't a chapter (home, a category, a subject)
 */
function curChapterIndex(entries) {
    return entries.findIndex(entry =>
        entry.categoryId === appState.curCategory && entry.subjectId === appState.curSubject && entry.id === appState.curPageId
    );
}

/**
 * @brief Returns the chapter right after the one currently displayed, crossing subject and
 * category boundaries -- unlike currentNextChapter above, which stops at the end of the current
 * subject/category. Used both for read-aloud auto-advance and for MediaSession's "next track".
 *
 * @returns {{categoryId: string, subjectId: string|null, id: string}|null} null past the site's last chapter
 */
export function resolveNextChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex === -1 ? null : (entries[curIndex + 1] ?? null);
}

/**
 * @brief Returns the chapter right before the one currently displayed, crossing subject and
 * category boundaries the same way resolveNextChapterAcrossSite() does. Used by MediaSession's
 * "previous track".
 *
 * @returns {{categoryId: string, subjectId: string|null, id: string}|null} null before the site's first chapter
 */
export function resolvePreviousChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex <= 0 ? null : entries[curIndex - 1];
}

// Read-aloud reaching the end of a chapter on its own offers to move on to the next one.
onPlaybackComplete(() => {
    const next = resolveNextChapterAcrossSite();
    if (!next) return;
    document.querySelectorAll(".readerControl").forEach(control => {
        control.append(createTag("p", { class: "readerAutoAdvanceNotice" }, { textContent: t("readerAutoAdvanceNotice") }));
    });
    autoAdvanceTimeoutId = setTimeout(() => {
        autoAdvanceTimeoutId = null;
        navigateToChapter(next.categoryId, next.subjectId, next.id);
    }, AUTO_ADVANCE_DELAY_MS);
});

// Any interaction with either reader control (desktop/mobile) cancels a pending auto-advance.
document.addEventListener("click", e => {
    if (e.target.closest(".readerControl")) cancelAutoAdvance();
});

/* Bluetooth headset media buttons (play/pause/next/previous), synced both ways with the reader
   control: a Bluetooth press drives the same actions as the on-screen buttons, and any on-screen
   change (including a manual chapter change) updates what the OS shows as the playback state. */
if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
        const status = getReaderStatus();
        if (status.isPausedAtCode) continueAfterCode();
        else if (status.isPaused) resumeReading();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        if (getReaderStatus().isPlaying) pauseReading();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        const next = resolveNextChapterAcrossSite();
        if (next) navigateToChapter(next.categoryId, next.subjectId, next.id);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        const previous = resolvePreviousChapterAcrossSite();
        if (previous) navigateToChapter(previous.categoryId, previous.subjectId, previous.id);
    });
    onStatusChange(status => {
        navigator.mediaSession.playbackState = status.isPlaying ? "playing"
            : (status.isPaused || status.isPausedAtCode) ? "paused"
            : "none";
    });
}

/**
 * @brief Reports whether arrow keys should type a character at `target` rather than navigate.
 *
 * @param {HTMLElement} target the keydown event's target
 *
 * @returns {boolean}
 */
function isTextInput(target) {
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/* ArrowLeft/ArrowRight moves to the previous/next chapter, mirroring the on-screen
   prevButton/nextButton arrows (which already flip in RTL). */
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

/** @brief Removes the page currently displayed, if any. */
function clearCurrentPage() {
    cancelAutoAdvance();
    stopReading();
    const currentDiv = document.querySelector(`.${appState.curPageId}Div`);
    if (currentDiv)
        currentDiv.remove();
}

/**
 * @brief Builds a prev/next chapter button as an arrow pinned to its outer edge plus a label
 * that can wrap onto several lines without dragging the arrow along.
 *
 * @param {string} className
 * @param {string} label
 * @param {string} arrow
 * @param {Boolean} arrowFirst true for the previous-chapter button, false for the next-chapter one
 *
 * @returns {HTMLElement}
 */
function createChapterNavButton(className, label, arrow, arrowFirst) {
    const button = createTag("button", {class: className});
    const arrowSpan = createTag("span", {class: "chapterNavArrow"}, {textContent: arrow});
    const labelSpan = createTag("span", {class: "chapterNavLabel"}, {textContent: label});
    button.append(...(arrowFirst ? [arrowSpan, labelSpan] : [labelSpan, arrowSpan]));
    return button;
}

/**
 * @brief Builds a chapter page's breadcrumb (category, and subject if any).
 *
 * @param {Object} category
 * @param {Object|null} subject
 *
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
 * @brief Builds the previous/next chapter buttons, stacked and right-aligned.
 *
 * @param {string} pageId
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} previousChapter
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} nextChapter
 *
 * @returns {HTMLElement|null} null if there's neither a previous nor a next chapter
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
 * @brief Builds and appends the top-of-page nav row (return button, previous/next chapter).
 *
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
 * @brief Appends a second previous/next chapter nav at the very end of the page content, full
 * width (no return button down here), so reaching the next chapter doesn't require scrolling
 * back up to the one at the top.
 *
 * @param {HTMLElement} pageDiv where the nav row will be attached to
 * @param {string} pageId
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} previousChapter
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} nextChapter
 */
function appendBottomChapterNav(pageDiv, pageId, previousChapter, nextChapter) {
    const chapterNav = createChapterNav(pageId, previousChapter, nextChapter);
    if (!chapterNav) return;
    chapterNav.className = "pageNavBottom";
    pageDiv.append(chapterNav);
}

/**
 * @brief Renders a markdown page's full content (notice, breadcrumb, nav, body, chapter nav)
 * into a new page div and builds its reading plan.
 *
 * @param {string} textInfos
 * @param {string} pageId
 * @param {Boolean} withReturnButton
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} [previousChapter]
 * @param {{categoryId: string, subjectId: string|null, id: string, label: string}|null} [nextChapter]
 * @param {HTMLElement|null} [breadcrumb]
 * @param {string|null} [notice] shown when this page had to be substituted from another language
 * @param {string|null} [titleOverride] translated title to use instead of the page's own `#` heading
 *
 * @returns {HTMLElement} the page div
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
 * @brief Builds and appends a clickable list of subjects or chapters.
 *
 * @param {HTMLElement} pageDiv where the list will be attached to
 * @param {Array} items subjects or chapters to list
 * @param {string} listId
 * @param {Function} onSelect called with the selected item
 */
function generateChildList(pageDiv, items, listId, onSelect) {
    const ul = createTag("ul", {class: `childList ${listId}List`})
    items.forEach(item => {
        // A subject needs a translated label; a chapter's label is already translated at the source.
        const label = Array.isArray(item.chapters) ? tEntityLabel("subjectLabels", item.id, item.label) : item.label;
        const button = createTag("button", {class: `childButton ${item.id}button`}, {textContent: label})
        button.addEventListener("click", (e) => onSelect(item));
        const li = createTag("li", {class: `${listId}List`});
        li.append(button);
        ul.append(li);
    });
    pageDiv.append(ul);
}

/** @brief Renders the home page. Pushes a bare URL (no query params) rather than buildNavUrl()'s usual "?c=...", since "acceuil" isn't a real struct.json entry. */
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
 * @brief Returns the translated substitution notice for a page rendered in a fallback language.
 *
 * @param {string} lang language a page is about to be rendered in
 *
 * @returns {string|null} null if `lang` is the active language
 */
function fallbackNoticeFor(lang) {
    return lang !== appState.lang ? t("pageFallbackNotice") : null;
}

/**
 * @brief Renders a chapter page (leaf content, belonging to a subject or a flat category).
 *
 * @param {string} categoryId
 * @param {string} path path to the chapter's markdown file
 * @param {Object} chapter
 * @param {string} [subjectId] the subject this chapter belongs to, if any
 * @param {Object|null} [resolvedCategory] pre-resolved category (cf. {@link resolveAcrossLanguages})
 * @param {Object|null} [resolvedSubject] pre-resolved subject, same as `resolvedCategory`
 * @param {string} [lang] the language `path` was built for
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
 * @brief Renders a subject page: its own description plus the list of its chapters.
 *
 * @param {Object} category
 * @param {Object} subject
 * @param {string} [lang] language to render in, propagated to every chapter reachable from this page
 */
async function renderSubject(category, subject, lang = appState.lang) {
    clearCurrentPage();
    clearChapterNeighbors();
    appState.curCategory = category.id;
    appState.curSubject = subject.id;
    appState.curPageId = subject.id;
    const contentDir = getContentDir(lang);
    const path = `./${contentDir}/${category.folder}/${subject.folder}/${subject.id}.md`;
    const subjectInfos = await fetchFileToTextOrJson(path, 'text');
    const pageDiv = generatePageContent(subjectInfos, subject.id, true, null, null, createBreadcrumb(category, null), fallbackNoticeFor(lang), tEntityLabel("subjectLabels", subject.id, subject.label));
    generateChildList(pageDiv, subject.chapters ?? [], subject.id, (chapter) => {
        appState.navigationStack.push({type: 'subject', categoryId: category.id, subjectId: subject.id});
        pushNavUrl(buildNavUrl(category.id, subject.id, chapter.id));
        renderChapter(category.id, `./${contentDir}/${category.folder}/${subject.folder}/${chapter.id}.md`, chapter, subject.id, category, subject, lang);
    });
}

/**
 * @brief Renders a category page: its description plus its subjects, or its chapters when the
 * category has no subjects.
 *
 * @param {Object} category
 * @param {string} [lang] language to render in, propagated the same way {@link renderSubject} does
 */
async function renderCategory(category, lang = appState.lang) {
    clearCurrentPage();
    clearChapterNeighbors();
    appState.curCategory = category.id;
    appState.curSubject = null;
    appState.curPageId = category.id;
    const contentDir = getContentDir(lang);
    const pageInfos = await fetchFileToTextOrJson(`./${contentDir}/${category.folder}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, category.id, true, null, null, null, fallbackNoticeFor(lang));
    if (category.subjects) {
        generateChildList(pageDiv, category.subjects, category.id, (subject) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            pushNavUrl(buildNavUrl(category.id, subject.id, subject.id));
            renderSubject(category, subject, lang);
        });
    } else if (category.chapters) {
        generateChildList(pageDiv, category.chapters, category.id, (chapter) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            pushNavUrl(buildNavUrl(category.id, null, chapter.id));
            renderChapter(category.id, `./${contentDir}/${category.folder}/${chapter.id}.md`, chapter, null, category, null, lang);
        });
    }
}

/**
 * @brief Renders whatever page a navigation stack entry points to.
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
        // Reached by "Retour" from a cross-language fallback page that doesn't exist here either.
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
 * @brief Loads the category matching `categoryId`. No-op if it's already the one displayed.
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
        // Reached from the breadcrumb of a cross-language fallback page that doesn't exist here either.
        renderAcrossLanguages(categoryId, null, categoryId);
        return;
    }
    appState.navigationStack = [{type: 'home'}];
    pushNavUrl(buildNavUrl(categoryId, null, categoryId));
    renderCategory(category);
}

/**
 * @brief Navigates directly to a subject's page. Used by the sidebar tree.
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
 * @brief Navigates directly to a chapter's page. Used by the sidebar tree.
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
