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

function generateSubjectList(pageDiv, subjects) {
    const ul = createTag("ul", {class: `${pageDiv.class}List`})
    subjects.forEach(subject => {
        const li = createTag("li", {class: `${pageDiv.class}List`}, {textContent: subject.label})
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
    generateSubjectList(pageDiv, findCategory(categories, categoryId).subjects);
}

/**
 * Load the category corresponding to the button name, if the current category displayed is
 * the one of the button, nothing happens
 * 
 * @param {string} buttonId 
 * @param {string} currentCategory
 * 
 * @returns {string} The current category
 */
export function loadCategory(buttonId, buttonText, currentCategory, categories) {
    document.querySelector(".menuDiv").classList.remove("visible");
    if (buttonId === currentCategory)
        return currentCategory;
    const currentDiv = document.querySelector(`.${currentCategory}Div`)
    if (currentDiv)
        currentDiv.remove();
    currentCategory = buttonId;
    if (currentCategory === 'acceuil') {
        generateHomePage(currentCategory);
    } else {
        generatePage(buttonId, buttonText, categories);
    }
    return currentCategory;
}