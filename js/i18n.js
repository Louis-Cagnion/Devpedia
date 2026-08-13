import { appState } from "./state.js";
import { fetchFileToTextOrJson } from "./utils.js";

let uiStrings = null;

/**
 * Fetches structure/ui-strings.json once at startup. Must be awaited before any UI that
 * calls t() is built (t() reads the cached result synchronously).
 */
export async function initI18n() {
    uiStrings = await fetchFileToTextOrJson("./structure/ui-strings.json", "json");
}

/**
 * @param {string} key a key present in structure/ui-strings.json's "fr" table
 * @returns {string} the label for the active language (appState.lang), falling back to
 *   French for a language that doesn't have this key translated yet
 */
export function t(key) {
    const label = uiStrings[appState.lang]?.[key] ?? uiStrings.fr[key];
    if (label === undefined)
        throw new Error(`i18n: missing UI string key "${key}"`);
    return label;
}
