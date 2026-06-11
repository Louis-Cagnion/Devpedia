import { appState } from "./state.js";
import { parseAppendText, parseMdContent } from "./parser.js ";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory } from "./utils.js";

function generatePageContent(textInfos, fileName) {
    const [yaml, text] = parseMdContent(textInfos);
    const pageDiv = createTag("div", {class: `${fileName}Div`});
    parseAppendText(pageDiv, fileName, yaml, text);
    document.body.append(pageDiv);
    return pageDiv;
}

async function selectSubject(pageDiv, subject, categoryId, categoryName) {
    appState.navigationStack.push({categoryId: appState.curCategory, subjectId: null})
    pageDiv.replaceChildren();
    const subjectInfos = await fetchFileToTextOrJson(`./content/${categoryName}/${subject.label}/${subject.id}.md`, 'text');
    generatePageContent(subjectInfos, subject.label);
}

function generateSubjectList(pageDiv, subjects, categoryId, categoryName) {
    const ul = createTag("ul", {class: `${categoryId}List`})
    subjects.forEach(subject => {
        const button = createTag("button", {class: `${subject.id}button`}, {textContent: subject.label})
        button.addEventListener("click", (e) => {
            selectSubject(pageDiv, subject, categoryId, categoryName);
        })
        const li = createTag("li", {class: `${categoryId}List`})
        li.append(button);
        ul.append(li);
    });
    pageDiv.append(ul);
}

export async function generateHomePage(homeFileName) {
    const homeInfos = await fetchFileToTextOrJson(`./content/${homeFileName}.md`, 'text');
    generatePageContent(homeInfos, homeFileName);
}

async function generatePage(categoryId, categoryName, categories) {
    const pageInfos = await fetchFileToTextOrJson(`./content/${categoryName}/description.md`, 'text');
    const pageDiv = generatePageContent(pageInfos, categoryId);
    generateSubjectList(pageDiv, findCategory(categories, categoryId).subjects, categoryId, categoryName);
}

/**
 * Load the category corresponding to the button name, if the current category displayed is
 * the one of the button, nothing happens
 * 
 * @param {string} categoryId
 * @param {string} categoryLabel
 * @param {Array} categories All the categories in struct.json
 * 
 * @returns {string} The current category
 */
export function loadCategory(categoryId, categoryLabel, categories) {
    document.querySelector(".menuDiv").classList.remove("visible");
    if (categoryId === appState.curCategory)
        return ;
    const currentDiv = document.querySelector(`.${appState.curCategory}Div`)
    if (currentDiv)
        currentDiv.remove();
    appState.navigationStack.push({categoryId: appState.curCategory, subjectId: null})
    appState.curCategory = categoryId;
    if (appState.curCategory === 'acceuil') {
        generateHomePage(appState.curCategory);
    } else {
        generatePage(categoryId, categoryLabel, categories);
    }
}