import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";

const STORAGE_KEY = "devpedia-lang";
const FRENCH_OPTION = { code: "", label: "Français" };

/**
 * @returns {string} the language code stored from a previous visit, or "" (French)
 */
export function getStoredLanguage() {
    return localStorage.getItem(STORAGE_KEY) ?? "";
}

/**
 * @returns {Array<{code: string, label: string}>} French plus every language translate-content.mjs
 * has produced (read from structure/languages.json — absent until at least one translation exists)
 */
async function fetchAvailableLanguages() {
    try {
        const languages = await fetchFileToTextOrJson("./structure/languages.json", "json");
        return [FRENCH_OPTION, ...languages];
    } catch {
        return [FRENCH_OPTION];
    }
}

/**
 * Build the "Langue" button + dropdown in the navbar. Hidden entirely if no translation
 * exists yet. Selecting a language stores it and reloads the page to restart cleanly in it.
 *
 * @param {HTMLElement} container positioned-relative element the dropdown attaches to
 */
export async function initLanguageSwitcher(container) {
    const languages = await fetchAvailableLanguages();
    if (languages.length <= 1)
        return;

    const currentCode = getStoredLanguage();
    const button = createTag("button", { class: "langButton" }, {
        textContent: languages.find(l => l.code === currentCode)?.label ?? "Français"
    });
    const dropdown = createTag("ul", { class: "langDropdown" });
    languages.forEach(language => {
        const li = createTag("li");
        const optionButton = createTag("button", {
            class: `langOption${language.code === currentCode ? " current" : ""}`
        }, { textContent: language.label });
        optionButton.addEventListener("click", () => {
            localStorage.setItem(STORAGE_KEY, language.code);
            location.reload();
        });
        li.append(optionButton);
        dropdown.append(li);
    });

    button.addEventListener("click", () => dropdown.classList.toggle("visible"));
    document.addEventListener("click", (e) => {
        if (!container.contains(e.target))
            dropdown.classList.remove("visible");
    });

    container.append(button);
    container.append(dropdown);
}
