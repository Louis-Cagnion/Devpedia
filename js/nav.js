import { parseAppendText } from "./parser.js";
import { generateHomePage, loadCategory } from "./router.js";
import { createTag } from "./tags.js";
import { fetchFileToTextOrJson, findCategory } from "./utils.js";

export let currentCategory = ""

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
        const categoryLoader = () => {currentCategory = loadCategory(category.id, category.label, currentCategory, categories);}
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
    const logo = createTag("div", {class: "logo"}, {textContent: "Devpedia"});
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
    generateNavBar(dataJson.categories);
    currentCategory = findCategory(dataJson.categories, "acceuil").id;
    generateHomePage(currentCategory);
}

fetchStructJson();