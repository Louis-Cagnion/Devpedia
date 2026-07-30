import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";
import { rememberCurrentPageForLanguageSwitch } from "./router.js";

const STORAGE_KEY = "devpedia-lang";
const FRENCH_OPTION = { code: "", label: "Français" };

// Among the languages this site targets, only Arabic is written right-to-left.
const RTL_LANGUAGE_CODES = new Set(["ar"]);

/**
 * Sets `<html lang>` and `<html dir>` to match the active language, so the browser and screen
 * readers apply the right script direction and per-language rendering rules — right-to-left
 * layout for Arabic, correct hyphenation/line-breaking hints for every other language (Latin
 * scripts as well as CJK, which browsers already break and wrap correctly by default).
 *
 * @param {string} langCode "" for French, or one of structure/languages.json's codes
 */
export function applyDocumentLanguage(langCode) {
    document.documentElement.lang = langCode || "fr";
    document.documentElement.dir = RTL_LANGUAGE_CODES.has(langCode) ? "rtl" : "ltr";
}

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
    const currentLabel = languages.find(l => l.code === currentCode)?.label ?? "Français";
    const button = createTag("button", { class: "langButton" }, { title: "Language / Langue" });
    button.append("🌐 ", createTag("span", { class: "langLabel" }, { textContent: currentLabel }));
    const dropdown = createTag("ul", { class: "langDropdown" });
    languages.forEach(language => {
        const li = createTag("li");
        const optionButton = createTag("button", {
            class: `langOption${language.code === currentCode ? " current" : ""}`
        }, { textContent: language.label });
        optionButton.addEventListener("click", () => {
            if (language.code === currentCode)
                return;
            localStorage.setItem(STORAGE_KEY, language.code);
            rememberCurrentPageForLanguageSwitch();
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
