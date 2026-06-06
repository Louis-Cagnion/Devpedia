/**
 * Create any HTML tag
 * @param {string} tagName 
 * @param {object<key, values>} attributes 
 * @param {string} body 
 * @returns {HTMLElement}
 */
export function createTag(tagName= "", attributes = {}, body = "") {
    if (!tagName)
            return null;
    let tag = document.createElement(tagName);
    if (body && body !== "undefined")
        tag.textContent = body
    Object.entries(attributes).forEach(([key, value]) => {
        tag.setAttribute(key, value);
    })
    return tag;
}
