import { appState } from "./state.js";
import { createTag } from "./tags.js";
import { loadCategory, navigateToSubject, navigateToChapter } from "./router.js";
import { createReaderControl } from "./reader-control.js";
import { t, tEntityLabel } from "./i18n.js";

let categories = [];
let currentOutline = [];
let leftSidebarDiv = null;
let rightSidebarDiv = null;
let mobileMenuDiv = null;

const desktopOpenState = { categoryId: null, subjectId: null };
const mobileOpenState = { categoryId: null, subjectId: null };

/**
 * @brief Returns a category's subjects, or its own chapters if it has none.
 *
 * @param {Object} category
 *
 * @returns {Array}
 */
function childrenOf(category) {
    return category.subjects ?? category.chapters ?? [];
}

/**
 * @brief Reports whether `entry` is a subject rather than a chapter.
 *
 * @param {Object} entry a subject or a chapter
 *
 * @returns {boolean}
 */
function isSubject(entry) {
    return Array.isArray(entry.chapters);
}

/**
 * @brief Builds an "Introduction" entry, linking to a category's or subject's own page.
 *
 * @param {Function} onClick
 * @param {boolean} isCurrent
 *
 * @returns {HTMLElement}
 */
function createIntroItem(onClick, isCurrent) {
    const li = createTag("li");
    const button = createTag("button", { class: `sidebarChapterButton sidebarIntroButton${isCurrent ? " current" : ""}` }, { textContent: t("introduction") });
    button.addEventListener("click", onClick);
    li.append(button);
    return li;
}

/**
 * @brief Builds one collapsible category/subject/chapter tree into `container`, reading and
 * mutating `openState` on click (one category open at a time, one subject open at a time).
 *
 * @param {HTMLElement} container
 * @param {{categoryId: string|null, subjectId: string|null}} openState
 */
/**
 * @brief Builds a chapter's sidebar button, current chapter or under a subject alike.
 *
 * @param {string} categoryId
 * @param {string|null} subjectId
 * @param {{id: string, label: string}} chapter
 *
 * @returns {HTMLElement}
 */
function createChapterButton(categoryId, subjectId, chapter) {
    const isCurrent = appState.curPageId === chapter.id;
    const button = createTag("button", { class: `sidebarChapterButton${isCurrent ? " current" : ""}` }, { textContent: chapter.label });
    button.addEventListener("click", () => navigateToChapter(categoryId, subjectId, chapter.id));
    return button;
}

function renderTree(container, openState) {
    container.innerHTML = "";
    const ul = createTag("ul", { class: "sidebarTree" });
    categories.forEach(category => {
        if (category.id === "acceuil")
            return;
        const isOpen = openState.categoryId === category.id;
        const isCategoryCurrent = isOpen && appState.curPageId === category.id;
        const li = createTag("li", { class: "sidebarCategoryItem" });
        const button = createTag("button", { class: `sidebarCategoryButton${isOpen ? " open" : ""}${isCategoryCurrent ? " current" : ""}` }, { textContent: tEntityLabel("categoryLabels", category.id, category.label) });
        button.addEventListener("click", () => {
            if (isOpen) {
                // already open: just collapse it, without navigating away from the current page
                openState.categoryId = null;
                renderTree(container, openState);
            } else {
                openState.categoryId = category.id;
                openState.subjectId = null;
                loadCategory(category.id);
                renderTree(container, openState);
            }
        });
        li.append(button);

        if (isOpen) {
            const childUl = createTag("ul", { class: "sidebarChildList" });
            childUl.append(createIntroItem(() => loadCategory(category.id), isCategoryCurrent));
            childrenOf(category).forEach(entry => {
                const childLi = createTag("li");
                if (isSubject(entry)) {
                    const subjectOpen = openState.subjectId === entry.id;
                    const subjectCurrent = subjectOpen && appState.curPageId === entry.id;
                    const subjectButton = createTag("button", { class: `sidebarSubjectButton${subjectOpen ? " open" : ""}${subjectCurrent ? " current" : ""}` }, { textContent: tEntityLabel("subjectLabels", entry.id, entry.label) });
                    subjectButton.addEventListener("click", () => {
                        if (subjectOpen) {
                            openState.subjectId = null;
                            renderTree(container, openState);
                        } else {
                            openState.subjectId = entry.id;
                            navigateToSubject(category.id, entry.id);
                            renderTree(container, openState);
                        }
                    });
                    childLi.append(subjectButton);
                    if (subjectOpen) {
                        const chapterUl = createTag("ul", { class: "sidebarChapterList" });
                        chapterUl.append(createIntroItem(() => navigateToSubject(category.id, entry.id), subjectCurrent));
                        entry.chapters.forEach(chapter => {
                            const chapterLi = createTag("li");
                            chapterLi.append(createChapterButton(category.id, entry.id, chapter));
                            chapterUl.append(chapterLi);
                        });
                        childLi.append(chapterUl);
                    }
                } else {
                    childLi.append(createChapterButton(category.id, null, entry));
                }
                childUl.append(childLi);
            });
            li.append(childUl);
        }
        ul.append(li);
    });
    container.append(ul);
}

/**
 * @brief Builds the "on this page" outline (the current chapter's `##`-`######` headings) into
 * `container`.
 *
 * @param {HTMLElement} container
 */
function renderOutline(container) {
    container.innerHTML = "";
    if (!currentOutline.length)
        return;
    container.append(createTag("div", { class: "sidebarSectionTitle" }, { textContent: t("onThisPage") }));
    const ul = createTag("ul", { class: "pageOutlineList" });
    currentOutline.forEach(({ level, id, text }) => {
        const li = createTag("li", { class: `outline-h${level}` });
        li.append(createTag("a", { href: `#${id}` }, { textContent: text }));
        ul.append(li);
    });
    container.append(ul);
}

function renderAll() {
    renderTree(leftSidebarDiv.querySelector(".sidebarTreeContainer"), desktopOpenState);
    renderOutline(rightSidebarDiv.querySelector(".sidebarOutlineContainer"));
    renderTree(mobileMenuDiv.querySelector(".sidebarTreeContainer"), mobileOpenState);
    renderOutline(mobileMenuDiv.querySelector(".sidebarOutlineContainer"));
}

/**
 * @brief Called after every page render with that page's heading outline.
 *
 * @param {Array<{level: number, id: string, text: string}>} outline
 */
export function setPageOutline(outline) {
    currentOutline = outline;
}

/**
 * @brief Re-syncs both sidebars (and the mobile menu) with the current page: only its own branch
 * starts expanded, everything else collapsed, and the outline is refreshed.
 */
export function syncSidebars() {
    desktopOpenState.categoryId = appState.curCategory;
    desktopOpenState.subjectId = appState.curSubject;
    mobileOpenState.categoryId = appState.curCategory;
    mobileOpenState.subjectId = appState.curSubject;
    renderAll();
}

/**
 * @brief Builds the desktop left/right sidebars and the mobile menu panel, and keeps
 * `categories` for later re-renders.
 *
 * @param {Object} initialCategories
 *
 * @returns {{menuDiv: HTMLElement, floatingBar: HTMLElement|null}} the mobile menu panel and the
 *   mobile read-aloud floating bar (null with no Web Speech API), neither yet attached to the document
 */
export function initSidebars(initialCategories) {
    categories = initialCategories;

    leftSidebarDiv = createTag("nav", { class: "leftSidebar" });
    leftSidebarDiv.append(createTag("div", { class: "sidebarSectionTitle" }, { textContent: t("categories") }));
    leftSidebarDiv.append(createTag("div", { class: "sidebarTreeContainer" }));
    document.body.append(leftSidebarDiv);

    rightSidebarDiv = createTag("aside", { class: "rightSidebar" });
    rightSidebarDiv.append(createTag("div", { class: "sidebarOutlineContainer" }));
    const desktopReaderControl = createReaderControl();
    if (desktopReaderControl)
        rightSidebarDiv.append(desktopReaderControl);
    document.body.append(rightSidebarDiv);

    mobileMenuDiv = createTag("div", { class: "menuDiv" });
    mobileMenuDiv.append(createTag("div", { class: "sidebarSectionTitle" }, { textContent: t("categories") }));
    mobileMenuDiv.append(createTag("div", { class: "sidebarTreeContainer" }));
    mobileMenuDiv.append(createTag("div", { class: "sidebarOutlineContainer" }));

    /* Independent of .menuDiv (rather than living inside it): "Continuer après le bloc de
       code" must stay reachable without first reopening the hamburger menu. */
    let floatingBar = null;
    const mobileReaderControl = createReaderControl();
    if (mobileReaderControl) {
        floatingBar = createTag("div", { class: "readerFloatingBar" });
        floatingBar.append(mobileReaderControl);
    }

    return { menuDiv: mobileMenuDiv, floatingBar };
}
