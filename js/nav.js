import { loadCategory, resumePendingNavigation } from "./router.js";
import { appState } from "./state.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";
import { initSidebars } from "./sidebar.js";
import { initSearch } from "./search.js";
import { initLanguageSwitcher, getStoredLanguage, applyDocumentLanguage } from "./lang.js";
import { initI18n, t, tEntityLabel } from "./i18n.js";

/**
 * @brief Returns the trailing "(ABBR)" part of a label, or the label itself if it has none.
 *
 * @param {string} label
 *
 * @returns {string}
 */
function getShortLabel(label) {
    const match = label.match(/\(([^)]+)\)\s*$/);
    return match ? match[1] : label;
}

/**
 * @brief Shows the short form of any category button whose full label no longer fits, hiding
 * trailing buttons one by one (revealing "Voir plus") if even the short labels don't all fit.
 * Re-evaluated whenever the categories bar is resized.
 *
 * @param {HTMLElement} categoriesDiv
 * @param {HTMLElement[]} categoryButtons
 * @param {HTMLElement} moreButton
 */
function watchCategoriesOverflow(categoriesDiv, categoryButtons, moreButton) {
    const setCompact = (compact) => {
        categoryButtons.forEach(button => {
            button.textContent = compact ? button.dataset.shortLabel : button.dataset.fullLabel;
        });
    };
    const showFirst = (count) => {
        categoryButtons.forEach((button, i) => {
            button.style.display = i < count ? "" : "none";
        });
    };
    const fits = () => categoriesDiv.scrollWidth <= categoriesDiv.clientWidth;
    const recheck = () => {
        moreButton.classList.remove("overflowing");
        showFirst(categoryButtons.length);
        setCompact(false);
        if (!fits()) setCompact(true);

        if (!fits()) {
            moreButton.classList.add("overflowing");
            let visible = categoryButtons.length;
            while (!fits() && visible > 0) {
                showFirst(--visible);
            }
        }
    };
    new ResizeObserver(recheck).observe(categoriesDiv);
}

/**
 * @brief Builds the (initially hidden) "Voir plus" button and its dropdown listing every
 * category alphabetically.
 *
 * @param {Object} categories
 *
 * @returns {HTMLElement} the button, not yet attached to navBar
 */
function createCategoriesOverflowMenu(categories) {
    const moreButton = createTag("button", {class: "categoriesMoreButton"}, {textContent: t("seeMore")});
    const dropdown = createTag("ul", {class: "categoriesDropdown"});
    [...categories]
        .map(category => ({ category, label: tEntityLabel("categoryLabels", category.id, category.label) }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr"))
        .forEach(({ category, label }) => {
            const li = createTag("li");
            const optionButton = createTag("button", {class: "categoriesDropdownOption"}, {textContent: label});
            optionButton.addEventListener("click", () => {
                dropdown.classList.remove("visible");
                loadCategory(category.id);
            });
            li.append(optionButton);
            dropdown.append(li);
        });

    moreButton.addEventListener("click", () => dropdown.classList.toggle("visible"));
    document.addEventListener("click", (e) => {
        if (!moreButton.contains(e.target) && !dropdown.contains(e.target))
            dropdown.classList.remove("visible");
    });

    document.body.append(dropdown);
    return moreButton;
}

/**
 * @brief Creates and attaches the (desktop) categories row to navBar.
 *
 * @param {HTMLElement} navBar
 * @param {Object} categories
 */
function createAppendCategories(navBar, categories = []) {
    const categoriesDiv = createTag("div", {class: "categories"});
    const categoryButtons = categories.map(category => {
        const label = tEntityLabel("categoryLabels", category.id, category.label);
        const link = createTag("button", { class: `${category.id}-button`}, {textContent: label})
        link.dataset.fullLabel = label;
        link.dataset.shortLabel = getShortLabel(label);
        link.addEventListener("click", () => loadCategory(category.id));
        categoriesDiv.appendChild(link);
        return link;
    });
    /* moreButton lives inside categoriesDiv (not a navBar-level sibling) so it shares
       the categories' own gap/centering (see watchCategoriesOverflow). */
    const moreButton = createCategoriesOverflowMenu(categories);
    categoriesDiv.append(moreButton);
    navBar.append(categoriesDiv);
    watchCategoriesOverflow(categoriesDiv, categoryButtons, moreButton);
}

/**
 * @brief Creates and attaches the navbar logo, which navigates home when clicked.
 *
 * @param {HTMLElement} navBar
 */
function createAppendLogo(navBar) {
    const logo = createTag("button", {class: "logo"}, {textContent: "Devpedia"});
    logo.addEventListener("click", (e) => {
        if (appState.curCategory !== 'acceuil')
            loadCategory('acceuil');
    })
    navBar.append(logo);
}

/**
 * @brief Creates and attaches the search bar, language switcher, and mobile menu button.
 *
 * @param {HTMLElement} navBarRightSide
 * @param {HTMLElement} menuDiv
 * @param {Object} categories
 */
function createAppendSearchbarButton(navBarRightSide, menuDiv, categories) {
    const searchBar = createTag("input", {
            class: "navBarSearch",
            type:"search",
            name: "search",
            placeholder: t("search")
        });
    navBarRightSide.append(searchBar);
    initSearch(navBarRightSide, searchBar, categories);
    initLanguageSwitcher(navBarRightSide);

    const menuButton = createTag("button", {class: "NavBarButton"}, {textContent: '☰'})
    navBarRightSide.append(menuButton);
    menuButton.addEventListener("click", e => {
        menuDiv.classList.toggle("visible");
    })
}

/**
 * @brief Generates the navigation bar, the desktop sidebars, and the mobile menu, and appends
 * them to the body.
 *
 * @param {Object} categories the category list of what will be in the website
 */
function generateNavBar(categories = []) {
    const navBar = createTag("div", {class: "navBar"});
    createAppendLogo(navBar);
    createAppendCategories(navBar, categories);

    const searchAndButtonDiv = createTag("div", {class: "searchAndButtonDiv"});
    const { menuDiv, floatingBar } = initSidebars(categories);
    createAppendSearchbarButton(searchAndButtonDiv, menuDiv, categories);
    navBar.append(searchAndButtonDiv);

    document.body.append(navBar);
    document.body.append(menuDiv);
    if (floatingBar)
        document.body.append(floatingBar);

    // Lets the sidebars know how tall the navbar is, so they start right below it.
    const setNavBarHeightVar = () => {
        document.documentElement.style.setProperty("--navbar-height", `${navBar.getBoundingClientRect().height}px`);
    };
    setNavBarHeightVar();
    new ResizeObserver(setNavBarHeightVar).observe(navBar);
}

async function fetchStructJson() {
    appState.lang = getStoredLanguage();
    applyDocumentLanguage(appState.lang);
    const structPath = appState.lang ? `./structure/struct-${appState.lang}.json` : "./structure/struct.json";
    const [dataJson] = await Promise.all([fetchFileToTextOrJson(structPath, 'json'), initI18n()]);
    appState.categories = dataJson.categories;
    generateNavBar(appState.categories);
    resumePendingNavigation();
}

fetchStructJson();