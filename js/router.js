import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory } from "./utils.js";

/**
 * @param {Object} category
 * @param {string} subjectId
 * @returns {Object} the subject
 */
function findSubject(category, subjectId) {
    return category.subjects?.find(subject => subject.id === subjectId);
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
    const returnButton = createTag("button", {class: `${pageId}ReturnButton`}, {textContent: "← Retour"});
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
    const [yaml, text] = parseMdContent(textInfos);
    const pageDiv = createTag("div", {class: `${pageId}Div`});
    if (withReturnButton)
        createAppendReturnButton(pageDiv, pageId);
    parseAppendText(pageDiv, pageId, yaml, text);
    document.body.append(pageDiv);
    return pageDiv;
}

/**
 * @param {HTMLElement} pageDiv where the list will be attached to
 * @param {Array} items subjects or chapters to list
 * @param {string} listId
 * @param {Function} onSelect called with the selected item
 */
function generateChildList(pageDiv, items, listId, onSelect) {
    const ul = createTag("ul", {class: `${listId}List`})
    items.forEach(item => {
        const button = createTag("button", {class: `${item.id}button`}, {textContent: item.label})
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
    appState.curPageId = 'acceuil';
    const homeInfos = await fetchFileToTextOrJson(`./content/acceuil.md`, 'text');
    generatePageContent(homeInfos, 'acceuil', false);
}

/**
 * Render a chapter page (leaf content, belonging to a subject or a flat category)
 *
 * @param {string} path path to the chapter's markdown file
 * @param {Object} chapter
 */
async function renderChapter(path, chapter) {
    clearCurrentPage();
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
    appState.curPageId = subject.id;
    const path = `./content/${category.label}/${subject.label}/${subject.id}.md`;
    const subjectInfos = await fetchFileToTextOrJson(path, 'text');
    const pageDiv = generatePageContent(subjectInfos, subject.id, true);
    generateChildList(pageDiv, subject.chapters ?? [], subject.id, (chapter) => {
        appState.navigationStack.push({type: 'subject', categoryId: category.id, subjectId: subject.id});
        renderChapter(`./content/${category.label}/${subject.label}/${chapter.id}.md`, chapter);
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
    appState.curPageId = category.id;
    const pageInfos = await fetchFileToTextOrJson(`./content/${category.label}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, category.id, true);
    if (category.subjects) {
        generateChildList(pageDiv, category.subjects, category.id, (subject) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderSubject(category, subject);
        });
    } else if (category.chapters) {
        generateChildList(pageDiv, category.chapters, category.id, (chapter) => {
            appState.navigationStack.push({type: 'category', categoryId: category.id});
            renderChapter(`./content/${category.label}/${chapter.id}.md`, chapter);
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
    document.querySelector(".menuDiv").classList.remove("visible");
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
