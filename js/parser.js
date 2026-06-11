import { createTag } from "./tags.js";

let openList = false

/**
 * Parse the content of a md file
 * 
 * - The first variable is an object containing pieces of content as keys
 * and their corresponding type as values.
 * - The second value is the text content
 * 
 * @param {string} homeInfos 
 * @returns {Object<Object<string, string>, string>}
 */
export function parseMdContent(homeInfos) {
    let [, yaml, text] = homeInfos.split("---");
    yaml = yaml.trim();
    let fileStruct = {}
    yaml.split('\n').forEach(info => {
        const [type, content] = info.split(': ');
        fileStruct[content] = type;
    });
    text = text.trim();
    return [fileStruct, text]
}

/**
 * 
 * @param {*} yaml 
 * @param {*} line 
 */
function assignTag(type, title, content) {
    return createTag(type, {class: `${title}${type}`}, {textContent: content})
}

function mdToHtmlFormatting(line) {
    line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    line = line.replace(/\*(.*?)\*/g, "<em>$1</em>")    
    return line;
}

function createListFromText(line, homeDiv, title, listDiv, listRegex) {
    if (!openList) {
        openList = true;
        const type = /^\d+\) /.test(line) ? 'ol' : 'ul';
        listDiv = createTag(type, {class: `${title}${type}`});
        homeDiv.append(listDiv);
    }
    line = line.replace(listRegex, "")
    listDiv.append(createTag("li", {}, {innerHTML: line}))
    return listDiv;
}

/**
 * 
 * @param {HTMLElement} homeDiv 
 * @param {Object<string, string>} yaml 
 * @param {string} text 
 */
export function parseAppendText(homeDiv, homeFileName, yaml, text) {
    const summary = Object.keys(yaml);
    const title = summary[0];
    const fileTitle = createTag("h2", {class: `${homeFileName}Title`}, {textContent: title})
    homeDiv.append(fileTitle)
    const lengths = summary.map(title => title.length)
    const keyMaxlenght = Math.max(...lengths);
    const lines = text.split("\n").filter(line => line.trim() !== "");

    const listRegex = /^(\* |- |\d+\) )/;
    let listDiv = null;
    
    lines.forEach(line => {
        if (line.length <= keyMaxlenght && summary.includes(line)) {
            const type = yaml[line];
            homeDiv.append(createTag(type, {class: `${homeFileName}${type}`}, {textContent: line}));
        } else {
            line = mdToHtmlFormatting(line);
            if (listRegex.test(line)) {
                listDiv = createListFromText(line, homeDiv, title, listDiv, listRegex);
            } else {
                if (openList)
                    openList = false;
                homeDiv.append(createTag('p', {class: `${homeFileName}P`}, {innerHTML: line}));
            }
        }
    })
}