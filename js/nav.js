import { parseAppendText } from "./parser.js";
import { generateHomePage, loadCategory } from "./router.js";
import { appState } from "./state.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory } from "./utils.js";

/**
 * Create and attach categories to navBar, returns a menu div that contains
 * categories, it will be displayed for low width screens
 * @param {HTMLElement} navBar 
 * @param {Object} categories
 * 
 * @returns {HTMLElement} List element for low width screen
 */
function createAppendCategories(navBar, categories = []) {
    const categoriesDiv = createTag("div", {class: "categories"});
    const menuDiv = createTag("div", {class: "menuDiv"});
    categories.forEach(category => {
        const link = createTag("button", { class: `${category.id}-button`}, {textContent: category.label})
        const linkDup = link.cloneNode(true);
        const categoryLoader = () => {loadCategory(category.id, category.label);}
        link.addEventListener("click", categoryLoader);
        linkDup.addEventListener("click", categoryLoader);
        categoriesDiv.appendChild(link);
        menuDiv.appendChild(linkDup);
    })
    navBar.append(categoriesDiv);
    return menuDiv;
}

/**
 * 
 * @param {HTMLElement} navBar 
 */
function createAppendLogo(navBar) {
    const logo = createTag("button", {class: "logo"}, {textContent: "Devpedia"});
    logo.addEventListener("click", (e) => {
        if (appState.curCategory !== 'acceuil') {
            const home = findCategory({id: "acceuil"});
            loadCategory(home.id, home.label)
        }
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
 * Also creates a menu div for phone format that will be shown when the menu
 * button on the right will be pressed
 * 
 * @param {Object} categories The category list of what will be in the website
 */
function generateNavBar(categories = []) {
    //navbar
    const navBar = createTag("div", {class: "navBar"});

    ////logo
    createAppendLogo(navBar);

    ////categories (pc format)
    const menuDiv = createAppendCategories(navBar, categories);

    ////search bar and menu button (phone format)  
    const searchAndButtonDiv = createTag("div", {class: "searchAndButtonDiv"});
    createAppendSearchbarButton(searchAndButtonDiv, menuDiv);
    navBar.append(searchAndButtonDiv);

    //attach navbar to body
    document.body.append(navBar);

    //attach menu, will be displayed when menu button is pressed
    document.body.append(menuDiv);
}

async function fetchStructJson(structPath = "./structure/struct.json") {
    const dataJson = await fetchFileToTextOrJson(structPath, 'json')
    appState.categories = dataJson.categories;
    generateNavBar(appState.categories);
    const home = findCategory({id: "acceuil"});
    appState.curCategory = home.id;
    appState.navigationStack.push({categoryId: appState.curCategory, categoryLabel: home.label, subjectId: null})
    generateHomePage(appState.curCategory);
}

fetchStructJson();