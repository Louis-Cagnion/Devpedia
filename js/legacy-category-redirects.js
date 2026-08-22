/* Old top-level category ids folded into a new parent category as a subject, kept here so
   existing internal/external links (?c=<old-id>&...) keep working after a site reorganization
   without rewriting every markdown file that references them. */

/**
 * @brief Maps an old top-level category id to where its content now lives.
 *
 * `asSubject: true` means the old category had no subjects of its own (flat chapters): those
 * chapters become a new subject under `newCategory`, identified by the old category id.
 * `asSubject: false` means the old category already had its own subjects: those subjects become
 * direct subjects of `newCategory`, keeping their own ids unchanged.
 */
export const LEGACY_CATEGORY_REDIRECTS = {
    "bases-de-l-informatique": { newCategory: "fondamentaux", asSubject: true },
    "algorithmes": { newCategory: "fondamentaux", asSubject: true },
    "mathematiques": { newCategory: "fondamentaux", asSubject: true },
    "graphisme": { newCategory: "fondamentaux", asSubject: true },

    "bases-de-donnees": { newCategory: "donnees", asSubject: true },
    "data-science": { newCategory: "donnees", asSubject: true },
    "representation-des-donnees": { newCategory: "donnees", asSubject: true },
    "traitement-de-documents": { newCategory: "donnees", asSubject: true },

    "infrastructure": { newCategory: "infrastructure-devops", asSubject: true },
    "docker": { newCategory: "infrastructure-devops", asSubject: true },
    "ci-cd": { newCategory: "infrastructure-devops", asSubject: true },
    "administration-systeme": { newCategory: "infrastructure-devops", asSubject: true },
    "reseaux": { newCategory: "infrastructure-devops", asSubject: true },
    "automatisation": { newCategory: "infrastructure-devops", asSubject: true },

    "cybersecurite": { newCategory: "securite", asSubject: true },
    "authentification": { newCategory: "securite", asSubject: false },

    "qualite-et-architecture-du-code": { newCategory: "qualite-performance-et-outils", asSubject: true },
    "performance": { newCategory: "qualite-performance-et-outils", asSubject: true },
    "git": { newCategory: "qualite-performance-et-outils", asSubject: true },

    "organisation-en-entreprise": { newCategory: "gestion-de-projet-et-organisation", asSubject: true },
    "gestion-de-projet": { newCategory: "gestion-de-projet-et-organisation", asSubject: true },

    "langages-de-programmation": { newCategory: "langages", asSubject: false },
    "langages-de-balisage": { newCategory: "langages", asSubject: false },
    "domain-specific-languages-dsl": { newCategory: "langages", asSubject: true },
    "shells": { newCategory: "langages", asSubject: false },
};

/**
 * @brief Rewrites a navigation target to its new location if `target.categoryId` is a folded-away
 * top-level category, following the chain if that new location was itself folded away again by a
 * later reorganization, otherwise returns it unchanged.
 *
 * @param {{categoryId: string, subjectId: string|null, pageId: string}} target
 *
 * @returns {{categoryId: string, subjectId: string|null, pageId: string}}
 */
export function resolveLegacyCategory(target) {
    let current = target;
    const seen = new Set();
    while (LEGACY_CATEGORY_REDIRECTS[current.categoryId] && !seen.has(current.categoryId)) {
        seen.add(current.categoryId);
        const redirect = LEGACY_CATEGORY_REDIRECTS[current.categoryId];
        if (redirect.asSubject)
            current = { categoryId: redirect.newCategory, subjectId: current.categoryId, pageId: current.pageId };
        else if (!current.subjectId)
            current = { categoryId: redirect.newCategory, subjectId: null, pageId: redirect.newCategory };
        else
            current = { categoryId: redirect.newCategory, subjectId: current.subjectId, pageId: current.pageId };
    }
    return current;
}
