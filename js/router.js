import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js ";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory } from "./utils.js";

/**
 * @param {HTMLElement} pageDiv where the return button will be attached to 
 * @param {string} fileName
 */
function createAppendReturnButton(pageDiv, fileName) {
    const returnButton = createTag("button", {class: `${fileName}ReturnButton`}, {textContent: "← Retour"});
    returnButton.addEventListener("click", (e) => {
        const lastConnexion = appState.navigationStack.at(-1);
        const categoryId = lastConnexion.categoryId;
        const categoryLabel = lastConnexion.categoryLabel;
        appState.navigationStack.pop();
        loadCategory(categoryId, categoryLabel, true);
    })
    pageDiv.append(returnButton);
}

/**
 * @param {string} textInfos 
 * @param {string} fileName 
 * @returns {HTMLElement} page div
 */
function generatePageContent(textInfos, fileName) {
    const [yaml, text] = parseMdContent(textInfos);
    const pageDiv = createTag("div", {class: `${fileName}Div`});
    if (fileName !== "acceuil")
        createAppendReturnButton(pageDiv, fileName);
    parseAppendText(pageDiv, fileName, yaml, text);
    document.body.append(pageDiv);
    return pageDiv;
}

/**
 * @param {HTMLElement} pageDiv 
 * @param {Object} subject 
 * @param {string} categoryId 
 * @param {string} path path to subject
 */
async function selectSubject(pageDiv, subject, categoryId, path) {
    pageDiv.replaceChildren();
    const subjectInfos = await fetchFileToTextOrJson(path, 'text');
    pageDiv.append(generatePageContent(subjectInfos, subject.label));
}

/**
 * @param {HTMLElement} pageDiv where the list will be attached to
 * @param {Array} subjects subjects of category
 * @param {string} categoryId 
 * @param {string} categoryName 
 */
function generateSubjectList(pageDiv, subjects, categoryId, categoryName) {
    const ul = createTag("ul", {class: `${categoryId}List`})
    subjects.forEach(subject => {
        const button = createTag("button", {class: `${subject.id}button`}, {textContent: subject.label})
        button.addEventListener("click", (e) => {
            appState.navigationStack.push({categoryId: appState.curCategory, categoryLabel: categoryName, subjectId: null})
            selectSubject(pageDiv, subject, categoryId, `./content/${categoryName}/${subject.label}/${subject.id}.md`);
        })
        const li = createTag("li", {class: `${categoryId}List`})
        li.append(button);
        ul.append(li);
    });
    pageDiv.append(ul);
}

/**
 * @param {string} homeFileName the name of home file
 */
export async function generateHomePage(homeFileName) {
    const homeInfos = await fetchFileToTextOrJson(`./content/${homeFileName}.md`, 'text');
    generatePageContent(homeInfos, homeFileName);
}
/**
 * @param {string} categoryId 
 * @param {string} categoryName 
 */
async function generatePage(categoryId, categoryName) {
    const pageInfos = await fetchFileToTextOrJson(`./content/${categoryName}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, categoryId);
    generateSubjectList(pageDiv, findCategory({id: categoryId}).subjects, categoryId, categoryName);
}

/**
 * Load the category corresponding to the button name, if the current category displayed is
 * the one of the button, nothing happens
 * 
 * @param {string} categoryId
 * @param {string} categoryLabel
 * @param {Boolean} returnButton
 * 
 * @returns {string} The current category
 */
export function loadCategory(categoryId, categoryLabel, returnButton = false) {
    document.querySelector(".menuDiv").classList.remove("visible");
    if (categoryId === appState.curCategory && !returnButton)
        return ;
    const currentDiv = document.querySelector(`.${appState.curCategory}Div`)
    if (currentDiv)
        currentDiv.remove();
    appState.navigationStack.push({categoryId: appState.curCategory, categoryLabel: categoryLabel, subjectId: null})
    appState.curCategory = categoryId;
    if (appState.curCategory === 'acceuil') {
        generateHomePage(appState.curCategory);
    } else {
        generatePage(categoryId, categoryLabel);
    }
}
