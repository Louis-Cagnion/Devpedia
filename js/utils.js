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
 * @brief Returns the content folder to fetch pages from: the translated `content-<lang>`
 * folder if a language other than French is selected, `content` otherwise.
 *
 * @returns {string}
 */
export function getContentDir() {
    return appState.lang ? `content-${appState.lang}` : "content";
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
