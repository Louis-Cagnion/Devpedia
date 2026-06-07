/**
 * Create any HTML tag
 * @param {string} tagName 
 * @param {object<key, values>} attributes 
 * @param {object<key, values>} DOMProperties 
 * @returns {HTMLElement}
 */
export function createTag(tagName= "", attributes = {}, DOMProperties = {}) {
    if (!tagName)
            return null;
    let tag = document.createElement(tagName);
    Object.entries(DOMProperties).forEach(([key, value]) => {
        tag[key] = value;
    })
    Object.entries(attributes).forEach(([key, value]) => {
        tag.setAttribute(key, value);
    })
    return tag;
}
