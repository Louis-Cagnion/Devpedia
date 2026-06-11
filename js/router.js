import { parseAppendText, parseMdContent } from "./parser.js ";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";

function generatePageContent(textInfos, fileName) {
    const [yaml, text] = parseMdContent(textInfos);
    const Pagediv = createTag("div", {class: `${fileName}Div`});
    parseAppendText(Pagediv, fileName, yaml, text);
    document.body.append(Pagediv);
}

export async function generateHomePage(homeFileName) {
    const homeInfos = await fetchFileToTextOrJson(`./content/${homeFileName}.md`, 'text');
    generatePageContent(homeInfos, homeFileName);
}

async function generatePage(categoryId, categoryName) {
    const pageInfos = await fetchFileToTextOrJson(`./content/${categoryName}/description.md`, 'text');
    generatePageContent(pageInfos, categoryId);
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
export function loadCategory(buttonId, buttonText, currentCategory) {
    if (buttonId === currentCategory)
        return currentCategory;
    const currentDiv = document.querySelector(`.${currentCategory}Div`)
    if (currentDiv)
        currentDiv.remove();
    currentCategory = buttonId;
    if (currentCategory === 'acceuil') {
        generateHomePage(currentCategory);
    } else {
        generatePage(buttonId, buttonText);
    }
    return currentCategory;
}