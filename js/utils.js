import { appState } from "./state.js";

/**
 * Find and return the category
 * 
 * @param {string} toFind 
 * @returns The category
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
 * @param {string} path 
 * @param {string} type 
 * @returns json or text content of file
 */
export async function fetchFileToTextOrJson(path, type) {
    const file = await fetch(path, {
        headers: {
            Accept: type === 'text' ? "text/plain" : "application/json"
        }
    });
    return await type === 'text' ? file.text() : file.json();
}
