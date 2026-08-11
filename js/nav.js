import { loadCategory, resumePendingNavigation } from "./router.js";
import { appState } from "./state.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";
import { initSidebars } from "./sidebar.js";
import { initSearch } from "./search.js";
import { initLanguageSwitcher, getStoredLanguage, applyDocumentLanguage } from "./lang.js";

/**
 * @param {string} label
 * @returns {string} the trailing "(ABBR)" part of a label, or the label itself if it has none
 */
function getShortLabel(label) {
    const match = label.match(/\(([^)]+)\)\s*$/);
    return match ? match[1] : label;
}

/**
 * Show the short form of any category button whose full label no longer fits,
 * and the full form otherwise. If even the short labels don't all fit on one line,
 * hide trailing buttons one by one (rather than letting the row overflow and clip
 * them mid-way) until the rest fit cleanly, and reveal the "Voir plus" button.
 * `moreButton` lives inside `categoriesDiv` (not as a separate sibling), so it shares
 * the exact same gap/centering as the category buttons — the spacing before it is
 * identical to the spacing between any two category buttons. It's made visible
 * *before* the hiding loop runs, so its own width is accounted for while deciding
 * how many category buttons still fit.
 * Re-evaluated whenever the categories bar is resized.
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
 * Build the (initially hidden) "Voir plus" button and its dropdown listing every category
 * alphabetically. The dropdown is attached to <body> and fixed below the navbar, independently
 * of where the button ends up in the navbar's flex layout, so it always spans the full width.
 *
 * @param {Object} categories
 * @returns {HTMLElement} the "Voir plus" button, not yet attached to navBar
 */
function createCategoriesOverflowMenu(categories) {
    const moreButton = createTag("button", {class: "categoriesMoreButton"}, {textContent: "Voir plus ▾"});
    const dropdown = createTag("ul", {class: "categoriesDropdown"});
    [...categories]
        .sort((a, b) => a.label.localeCompare(b.label, "fr"))
        .forEach(category => {
            const li = createTag("li");
            const optionButton = createTag("button", {class: "categoriesDropdownOption"}, {textContent: category.label});
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
 * Create and attach the (desktop) categories row to navBar
 * @param {HTMLElement} navBar
 * @param {Object} categories
 */
function createAppendCategories(navBar, categories = []) {
    const categoriesDiv = createTag("div", {class: "categories"});
    const categoryButtons = categories.map(category => {
        const link = createTag("button", { class: `${category.id}-button`}, {textContent: category.label})
        link.dataset.fullLabel = category.label;
        link.dataset.shortLabel = getShortLabel(category.label);
        link.addEventListener("click", () => loadCategory(category.id));
        categoriesDiv.appendChild(link);
        return link;
    });
    // moreButton lives inside categoriesDiv (not a navBar-level sibling) so it shares
    // the categories' own gap/centering — see watchCategoriesOverflow.
    const moreButton = createCategoriesOverflowMenu(categories);
    categoriesDiv.append(moreButton);
    navBar.append(categoriesDiv);
    watchCategoriesOverflow(categoriesDiv, categoryButtons, moreButton);
}

/**
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
            placeholder: "Rechercher..."
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
 * Generate the navigation bar and append it to the body
 *
 * Also builds the desktop sidebars and the mobile menu (shown when the menu
 * button on the right is pressed), both driven by sidebar.js
 *
 * @param {Object} categories The category list of what will be in the website
 */
function generateNavBar(categories = []) {
    //navbar
    const navBar = createTag("div", {class: "navBar"});

    ////logo
    createAppendLogo(navBar);

    ////categories (pc format)
    createAppendCategories(navBar, categories);

    ////search bar and menu button (phone format)
    const searchAndButtonDiv = createTag("div", {class: "searchAndButtonDiv"});
    const menuDiv = initSidebars(categories);
    createAppendSearchbarButton(searchAndButtonDiv, menuDiv, categories);
    navBar.append(searchAndButtonDiv);

    //attach navbar to body
    document.body.append(navBar);

    //attach menu, will be displayed when menu button is pressed
    document.body.append(menuDiv);

    //let the sidebars know how tall the navbar is, so they start right below it
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
    const dataJson = await fetchFileToTextOrJson(structPath, 'json')
    appState.categories = dataJson.categories;
    generateNavBar(appState.categories);
    resumePendingNavigation();
}

fetchStructJson();