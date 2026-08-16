import { appState } from "./state.js";
import { fetchFileToTextOrJson } from "./utils.js";

let uiStrings = null;

/**
 * @brief Fetches structure/ui-strings.json once at startup. Must be awaited before any UI that
 * calls t() is built (t() reads the cached result synchronously).
 */
export async function initI18n() {
    uiStrings = await fetchFileToTextOrJson("./structure/ui-strings.json", "json");
}

/**
 * @brief Looks up the label for `key` in the active language (appState.lang), falling back
 * to French for a language that doesn't have this key translated yet.
 *
 * @param {string} key a key present in structure/ui-strings.json's "fr" table
 *
 * @returns {string}
 */
export function t(key) {
    const label = uiStrings[appState.lang]?.[key] ?? uiStrings.fr[key];
    if (label === undefined)
        throw new Error(`i18n: missing UI string key "${key}"`);
    return label;
}

/**
 * @brief Category and subject labels come from struct-*.json as the raw (French) folder name -
 * see js/sidebar.js and js/nav.js - because a folder name must stay identical across
 * languages for cross-language linking to work (see README's "Content structure" section).
 * This looks up a translated display label for one, added to ui-strings.json's
 * "categoryLabels"/"subjectLabels" tables as its content gets translated, so a category or
 * subject not yet in that table (or a French page, which never has one) just keeps showing
 * its folder name - never throws, unlike t().
 *
 * @param {"categoryLabels"|"subjectLabels"} kind
 * @param {string} id the category's or subject's id
 * @param {string} fallback the raw folder-derived label to use if no translation exists yet
 *
 * @returns {string}
 */
export function tEntityLabel(kind, id, fallback) {
    return uiStrings[appState.lang]?.[kind]?.[id] ?? fallback;
}
