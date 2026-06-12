import { appState } from "./state.js";

/**
 * Find and return the category
 * 
 * @param {string} idToFind 
 * @returns The category
 */
export function findCategory(idToFind) {
    return appState.categories.find(category => category.id === idToFind);
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
