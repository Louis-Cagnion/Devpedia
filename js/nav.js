import { loadCategory } from "./router.js";
import { appState } from "./state.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson } from "./utils.js";
import { initSidebars } from "./sidebar.js";

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
 * and the full form otherwise. Re-evaluated whenever the categories bar is resized.
 * @param {HTMLElement} categoriesDiv
 */
function watchCategoriesOverflow(categoriesDiv) {
    const setCompact = (compact) => {
        Array.from(categoriesDiv.children).forEach(button => {
            button.textContent = compact ? button.dataset.shortLabel : button.dataset.fullLabel;
        });
    };
    const recheck = () => {
        setCompact(false);
        if (categoriesDiv.scrollWidth > categoriesDiv.clientWidth)
            setCompact(true);
    };
    new ResizeObserver(recheck).observe(categoriesDiv);
}

/**
 * Create and attach the (desktop) categories row to navBar
 * @param {HTMLElement} navBar
 * @param {Object} categories
 */
function createAppendCategories(navBar, categories = []) {
    const categoriesDiv = createTag("div", {class: "categories"});
    categories.forEach(category => {
        const link = createTag("button", { class: `${category.id}-button`}, {textContent: category.label})
        link.dataset.fullLabel = category.label;
        link.dataset.shortLabel = getShortLabel(category.label);
        link.addEventListener("click", () => loadCategory(category.id));
        categoriesDiv.appendChild(link);
    })
    navBar.append(categoriesDiv);
    watchCategoriesOverflow(categoriesDiv);
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
 */
function createAppendSearchbarButton(navBarRightSide, menuDiv) {
    const searchBar = createTag("input", {
            class: "navBarSearch",
            type:"search",
            name: "search",
            placeholder: "Rechercher..."
        });
    navBarRightSide.append(searchBar);

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
    createAppendSearchbarButton(searchAndButtonDiv, menuDiv);
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

async function fetchStructJson(structPath = "./structure/struct.json") {
    const dataJson = await fetchFileToTextOrJson(structPath, 'json')
    appState.categories = dataJson.categories;
    generateNavBar(appState.categories);
    loadCategory('acceuil');
}

fetchStructJson();