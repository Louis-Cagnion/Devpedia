import { appState } from "./state.js";

/**
 * @brief Finds a category by id or label.
 *
 * @param {{id?: string, label?: string}} toFind
 *
 * @returns {object|undefined}
 */
export function findCategory(toFind = {}) {
    return appState.categories.find(category => {
        if (toFind.id !== undefined)
            return category.id === toFind.id
        else
            return category.label === toFind.label
    });
}

/**
 * @brief Returns a category's subject matching `subjectId`.
 *
 * @param {Object} category
 * @param {string} subjectId
 *
 * @returns {Object}
 */
export function findSubject(category, subjectId) {
    return category.subjects?.find(subject => subject.id === subjectId);
}

/**
 * @brief Returns the content folder to fetch pages from: the translated `content-<lang>`
 * folder if a language other than French is selected, `content` otherwise.
 *
 * @param {string} [lang] "" for French, or one of structure/languages.json's codes; defaults
 *   to the currently selected language (appState.lang)
 *
 * @returns {string}
 */
export function getContentDir(lang = appState.lang) {
    return lang ? `content-${lang}` : "content";
}

/**
 * @brief Fetches `path` and parses its response as JSON or plain text.
 *
 * @param {string} path
 * @param {"text"|"json"} type
 *
 * @returns {Promise<string|object>}
 */
export async function fetchFileToTextOrJson(path, type) {
    const file = await fetch(path, {
        headers: {
            Accept: type === 'text' ? "text/plain" : "application/json"
        }
    });
    return await type === 'text' ? file.text() : file.json();
}
