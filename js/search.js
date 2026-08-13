import { loadCategory, navigateToSubject, navigateToChapter } from "./router.js";
import { createTag } from "./tags.js";
import { t } from "./i18n.js";

/**
 * @param {string} text
 * @returns {string} lowercased, accent-stripped text, for accent-insensitive matching
 */
function normalize(text) {
    return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Flattens the category tree into a searchable list of categories, subjects and chapters.
 *
 * @param {Object} categories
 * @returns {Array<{type: string, label: string, context: string, categoryId: string, subjectId: (string|null), chapterId: (string|null)}>}
 */
function buildIndex(categories) {
    const index = [];
    categories.forEach(category => {
        if (category.id === "acceuil")
            return;
        index.push({ type: "category", label: category.label, context: "", categoryId: category.id, subjectId: null, chapterId: null });
        (category.subjects ?? category.chapters ?? []).forEach(entry => {
            if (Array.isArray(entry.chapters)) {
                index.push({ type: "subject", label: entry.label, context: category.label, categoryId: category.id, subjectId: entry.id, chapterId: null });
                entry.chapters.forEach(chapter => {
                    index.push({ type: "chapter", label: chapter.label, context: `${category.label} / ${entry.label}`, categoryId: category.id, subjectId: entry.id, chapterId: chapter.id });
                });
            } else {
                index.push({ type: "chapter", label: entry.label, context: category.label, categoryId: category.id, subjectId: null, chapterId: entry.id });
            }
        });
    });
    return index;
}

function navigateToResult(result) {
    if (result.type === "category")
        loadCategory(result.categoryId);
    else if (result.type === "subject")
        navigateToSubject(result.categoryId, result.subjectId);
    else
        navigateToChapter(result.categoryId, result.subjectId, result.chapterId);
}

/**
 * Wire the navbar search input to a live dropdown of matching categories/subjects/chapters.
 *
 * @param {HTMLElement} container positioned-relative element the dropdown attaches to
 * @param {HTMLInputElement} searchBar
 * @param {Object} categories
 */
export function initSearch(container, searchBar, categories) {
    const index = buildIndex(categories);
    const resultsList = createTag("ul", { class: "searchResults" });
    container.append(resultsList);

    function renderResults(query) {
        resultsList.innerHTML = "";
        const trimmed = query.trim();
        if (!trimmed) {
            resultsList.classList.remove("visible");
            return;
        }
        const needle = normalize(trimmed);
        const matches = index.filter(entry => normalize(entry.label).includes(needle)).slice(0, 8);
        if (!matches.length) {
            resultsList.append(createTag("li", { class: "searchResultEmpty" }, { textContent: t("noResults") }));
        } else {
            matches.forEach(result => {
                const li = createTag("li");
                const button = createTag("button", { class: "searchResultButton" });
                button.append(createTag("span", { class: "searchResultLabel" }, { textContent: result.label }));
                if (result.context)
                    button.append(createTag("span", { class: "searchResultContext" }, { textContent: result.context }));
                button.addEventListener("click", () => {
                    navigateToResult(result);
                    searchBar.value = "";
                    resultsList.classList.remove("visible");
                });
                li.append(button);
                resultsList.append(li);
            });
        }
        resultsList.classList.add("visible");
    }

    searchBar.addEventListener("input", () => renderResults(searchBar.value));
    searchBar.addEventListener("focus", () => {
        if (searchBar.value.trim())
            renderResults(searchBar.value);
    });
    searchBar.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            resultsList.classList.remove("visible");
            searchBar.blur();
        }
    });
    document.addEventListener("click", (e) => {
        if (!container.contains(e.target))
            resultsList.classList.remove("visible");
    });
}
