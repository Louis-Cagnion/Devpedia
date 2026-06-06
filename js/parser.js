import { createTag } from "./tags.js";

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
    console.log(text);
    console.log(fileStruct);
    return [fileStruct, text]
}

/**
 * 
 * @param {*} yaml 
 * @param {*} line 
 */
function assignTag(type, title, content) {
    return createTag(type, {class: `${title}${type}`}, content)
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
    const fileTitle = createTag("h2", {class: `${homeFileName}Title`}, title)
    homeDiv.append(fileTitle)
    const lengths = summary.map(title => title.length)
    const keyMaxlenght = Math.max(...lengths);
    const lines = text.split("\n");
    lines.forEach(line => {
        if (line.length <= keyMaxlenght && summary.find(line)) {
            const type = yaml[line];
            homeDiv.append(createTag(type, {class: `${homeFileName}${type}`}, line));
        } else {
            homeDiv.append(createTag('p', {class: `${homeFileName}P`}, line));
        }
    })
}