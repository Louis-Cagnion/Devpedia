import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory, getContentDir } from "./utils.js";
import { setPageOutline, syncSidebars } from "./sidebar.js";

/**
 * @param {Object} category
 * @param {string} subjectId
 * @returns {Object} the subject
 */
export function findSubject(category, subjectId) {
    return category.subjects?.find(subject => subject.id === subjectId);
}

// Session-only: read once at startup by resumePendingNavigation(), then cleared — carries the
// current page across a language switch's location.reload(), since ids (category/subject/chapter
// folder names) are language-independent while only their displayed `label` gets translated.
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
export function resumePendingNavigation() {
    const raw = sessionStorage.getItem(PENDING_NAV_KEY);
    sessionStorage.removeItem(PENDING_NAV_KEY);
    if (!raw) {
        generateHomePage();
        return;
    }
    const { categoryId, subjectId, pageId } = JSON.parse(raw);
    const category = findCategory({ id: categoryId });
    if (!category || categoryId === "acceuil") {
        generateHomePage();
    } else if (pageId === categoryId) {
        loadCategory(categoryId);
    } else if (pageId === subjectId) {
        navigateToSubject(categoryId, subjectId);
    } else {
        navigateToChapter(categoryId, subjectId, pageId);
    }
}

function closeMobileMenu() {
    document.querySelector(".menuDiv").classList.remove("visible");
}

/**
 * Remove the page currently displayed, if any
 */
function clearCurrentPage() {
    const currentDiv = document.querySelector(`.${appState.curPageId}Div`);
    if (currentDiv)
        currentDiv.remove();
}

/**
 * @param {HTMLElement} pageDiv where the return button will be attached to
 * @param {string} pageId
 */
function createAppendReturnButton(pageDiv, pageId) {
    const arrow = document.documentElement.dir === "rtl" ? "→" : "←";
    const returnButton = createTag("button", {class: `returnButton ${pageId}ReturnButton`}, {textContent: `${arrow} Retour`});
    returnButton.addEventListener("click", (e) => {
        const previousEntry = appState.navigationStack.pop();
        renderEntry(previousEntry);
    })
    pageDiv.append(returnButton);
}

/**
 * @param {string} textInfos
 * @param {string} pageId
 * @param {Boolean} withReturnButton
 * @returns {HTMLElement} page div
 */
function generatePageContent(textInfos, pageId, withReturnButton) {
    const text = parseMdContent(textInfos);
    const pageDiv = createTag("div", {class: `page ${pageId}Div`});
    if (withReturnButton)
        createAppendReturnButton(pageDiv, pageId);
    const outline = parseAppendText(pageDiv, pageId, text);
    document.body.append(pageDiv);
    setPageOutline(outline);
    syncSidebars();
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
        const button = createTag("button", {class: `childButton ${item.id}button`}, {textContent: item.label})
        button.addEventListener("click", (e) => onSelect(item));
        const li = createTag("li", {class: `${listId}List`});
        li.append(button);
        ul.append(li);
    });
    pageDiv.append(ul);
}

/**
 * Render the home page
 */
export async function generateHomePage() {
    clearCurrentPage();
    appState.curCategory = 'acceuil';
    appState.curSubject = null;
    appState.curPageId = 'acceuil';
    const homeInfos = await fetchFileToTextOrJson(`./${getContentDir()}/acceuil.md`, 'text');
    generatePageContent(homeInfos, 'acceuil', false);
}

/**
 * Render a chapter page (leaf content, belonging to a subject or a flat category)
 *
 * @param {string} path path to the chapter's markdown file
 * @param {Object} chapter
 * @param {string} [subjectId] the subject this chapter belongs to, if any
 */
async function renderChapter(path, chapter, subjectId = null) {
    clearCurrentPage();
    appState.curSubject = subjectId;
    appState.curPageId = chapter.id;
    const chapterInfos = await fetchFileToTextOrJson(path, 'text');
    generatePageContent(chapterInfos, chapter.id, true);
}

/**
 * Render a subject page: its own description plus the list of its chapters
 *
 * @param {Object} category
 * @param {Object} subject
 */
async function renderSubject(category, subject) {
    clearCurrentPage();
    appState.curSubject = subject.id;
    appState.curPageId = subject.id;
    const path = `./${getContentDir()}/${category.folder}/${subject.folder}/${subject.id}.md`;
    const subjectInfos = await fetchFileToTextOrJson(path, 'text');
    const pageDiv = generatePageContent(subjectInfos, subject.id, true);
    generateChildList(pageDiv, subject.chapters ?? [], subject.id, (chapter) => {
        appState.navigationStack.push({type: 'subject', categoryId: category.id, subjectId: subject.id});
        renderChapter(`./${getContentDir()}/${category.folder}/${subject.folder}/${chapter.id}.md`, chapter, subject.id);
    });
}

/**
 * Render a category page: its description plus its subjects, or its chapters
 * when the category has no subjects (e.g. Bash, Git)
 *
 * @param {Object} category
 */
async function renderCategory(category) {
    clearCurrentPage();
    appState.curCategory = category.id;
    appState.curSubject = null;
    appState.curPageId = category.id;
    const pageInfos = await fetchFileToTextOrJson(`./${getContentDir()}/${category.folder}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, category.id, true);
    if (category.subjects) {
        generateChildList(pageDiv, category.subjects, category.id, (subject) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderSubject(category, subject);
        });
    } else if (category.chapters) {
        generateChildList(pageDiv, category.chapters, category.id, (chapter) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderChapter(`./${getContentDir()}/${category.folder}/${chapter.id}.md`, chapter);
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
    if (entry.type === 'subject') {
        renderSubject(category, findSubject(category, entry.subjectId));
    } else {
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
    } else {
        appState.navigationStack = [{type: 'home'}];
        renderCategory(findCategory({id: categoryId}));
    }
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
    appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}];
    renderSubject(category, findSubject(category, subjectId));
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
    if (subjectId) {
        const subject = findSubject(category, subjectId);
        const chapter = subject.chapters.find(c => c.id === chapterId);
        appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}, {type: 'subject', categoryId, subjectId}];
        renderChapter(`./${getContentDir()}/${category.folder}/${subject.folder}/${chapter.id}.md`, chapter, subjectId);
    } else {
        const chapter = category.chapters.find(c => c.id === chapterId);
        appState.navigationStack = [{type: 'home'}, {type: 'category', categoryId}];
        renderChapter(`./${getContentDir()}/${category.folder}/${chapter.id}.md`, chapter);
    }
}
