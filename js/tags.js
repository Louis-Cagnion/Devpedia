/**
 * @brief Creates any HTML tag.
 *
 * @param {string} tagName
 * @param {Object<string, string>} attributes
 * @param {Object<string, *>} DOMProperties
 *
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
