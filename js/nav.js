import { createTag } from "./tags.js";

/**
 * Create and attach categories to navBar, returns a burger div that contains
 * categories, it will be displayed for low width screens
 * @param {HTMLElement} navBar 
 * @param {Object} categories
 * 
 * @returns {HTMLElement} List element for low width screen
 */
function createAppendCategories(navBar, categories = []) {
    const categoriesDiv = createTag("div", {class: "categories"});
    const burgerDiv = createTag("div", {class: "burger"});
    categories.forEach(category => {
        const link = createTag(
            "a",
            {
                class: `${category.id}-link`,
                href: `${category.id}.html`
            },
            `${category.label}`
        )
        const linkDup = link.cloneNode();
        categoriesDiv.appendChild(link);
        burgerDiv.appendChild(linkDup);
    })
    navBar.append(categoriesDiv);
    return burgerDiv;
}

/**
 * 
 * @param {HTMLElement} navBar 
 */
function createAppendLogo(navBar) {
    const logo = createTag("div", {class: "logo"}, "Devpedia");
    navBar.append(logo);
}

/**
 * 
 * @param {HTMLElement} navBar 
 */
function createAppendSearchbar(navBar) {
    const searchBar = createTag("input", {class: "navBarSearch", type:"search", name: "search"});
    navBar.append(searchBar);
}

function generateNavBar(categories = []) {
    const navBar = createTag("div", {class: "navBar"});
    createAppendLogo(navBar);
    const burgerDiv = createAppendCategories(navBar, categories);
    const searchBurgerDiv = createTag("div", {class: "searchBurgerDiv"});
    createAppendSearchbar(searchBurgerDiv);
    searchBurgerDiv.append(burgerDiv);
    navBar.append(searchBurgerDiv);
    document.body.append(navBar);
}


async function fetchStructJson(structPath = "./structure/struct.json") {
    const struct = await fetch(structPath, {
        headers: {
            Accept: "application/json"
        }
    });
    let dataJson = await struct.json();
    generateNavBar(dataJson.categories);
}

fetchStructJson();