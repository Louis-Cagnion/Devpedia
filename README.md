# Devpedia

Devpedia is a website created to document, explain, and share my knowledge of various software development topics. The project helps me deepen my understanding through research and teaching, practice building modern web interfaces, and make this knowledge accessible to anyone interested in learning about the concepts and technologies I have explored.

Live at: https://louis-cagnion.github.io/Devpedia/

Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`: a plain static-file deploy (`upload-pages-artifact` + `deploy-pages`), with no Jekyll build step — the site is a JS SPA that fetches Markdown at runtime, so a Jekyll build isn't just unnecessary, it actively breaks on any file with the wrong Liquid-looking syntax.

## Content

Chapters live under `content/`, grouped into 10 top-level categories, most split further into subjects (e.g. a language, a sub-topic). The full up-to-date tree is `structure/struct.json` (or the site's own sidebar); this section stays at the "what does each category cover" level rather than listing every chapter, so it doesn't go stale every time one is added:

- **Fondamentaux**: absolute-beginner groundwork the rest of the site leans on — computing vocabulary and tooling (*Bases de l'informatique*: files, the terminal, an editor/IDE, keyboard shortcuts), algorithm analysis independent of implementation (*Algorithmes*: Big-O, comparison sorting), and the math vocabulary the AI/Data Science chapters need, starting from zero (*Mathématiques*: functions, vectors, matrices, logarithms, probability, derivatives/gradients)
- **Langages**: general-purpose programming languages — C, C++, PHP, Python, JavaScript, OCaml (functional, contrasted with the imperative style of the others); markup languages — HTML, CSS; shells — Bash (incl. cron scheduling), Zsh, PowerShell; and domain-specific languages — Regex, SQL. Data science/AI tooling for Python lives in its own cross-cutting category below, not under Python itself
- **Données**: data end to end — how a value is actually represented in memory (*Représentation des données*: integer overflow, IEEE 754 floats, text encodings, memory layout, pseudo-randomness), organizing it once it outgrows a single table (*Bases de données*: star schema, medallion architecture, bridge tables, warehouses vs. data lakes, indexes, ORMs, high-traffic patterns), the Python tooling for data science and classical ML (*Data Science*: NumPy, pandas, Matplotlib, Jupyter, scikit-learn), and extracting information from existing documents (*Traitement de documents*)
- **Sécurité**: the major vulnerability families and secure development practices (*Cybersécurité*: OWASP Top 10, dependency/API/secrets security, WAF, HashiCorp Vault...), plus everything about a user's identity — authentication vs. authorization, sessions/tokens, OAuth2/OIDC/SSO, MFA
- **Infrastructure & DevOps**: networking basics, data exchange between systems (APIs, HTTP, WebSocket, JSON, the cloud), containers (Docker: images, Dockerfiles, volumes/networking, Compose, security), server administration, and CI/CD (the concept, Azure DevOps, pipeline YAML, vs. GitHub Actions)
- **Qualité, performance et outils**: single responsibility and low coupling, avoiding repetition via indexed/dispatch structures, single source of truth (*Qualité et architecture du code*); language-agnostic optimization — profiling, avoiding fixed delays, cutting round trips, parallelism, cache locality/SIMD, never recomputing a result nothing could have changed (*Performance*); and Git, from everyday commands to its internal object model
- **IA**: neural network fundamentals through production LLM systems (gradient descent, CNN/RNN/Transformer architectures, PyTorch, prompt engineering, agents, RAG, monitoring, EU AI Act, chatbots), vision (OCR, document understanding, layout detection), voice synthesis, and game AI by imitation
- **UI-UX**: interface design fundamentals for absolute beginners — visual hierarchy, color and contrast, typography, spacing/grid, Nielsen's heuristics, UX-level accessibility; each chapter redirects to the relevant CSS/HTML chapter for implementation
- **Gestion de projet et organisation**: the human side of a software project — team roles, a project's lifecycle, writing an actionable ticket (*Organisation en entreprise*), and Agile/Scrum/Kanban methodologies (*Gestion de projet*)

Each chapter is a plain Markdown file, its title given by a regular `# Heading` at the top of the file (an optional `---`-fenced frontmatter block above it can carry build-time metadata, currently just `order`, used to sort chapters pedagogically). Markdown is rendered by a parser I wrote myself for this project (`js/parser.js`), rather than an existing library.

Security isn't confined to the Sécurité category alone — it's also woven into whichever language chapter it concretely applies to (PHP's `securite.md` for the web attack taxonomy — CSRF, XSS, SQL injection, MITM, session hijacking...; command injection in Bash; buffer overflows in C; least-privilege database accounts in SQL), each cross-referencing the others rather than repeating the same explanation.

## Translations

`content/` is the French source of truth, translated by hand into `content-<lang>/` (the automated DeepL pipeline this project used to have was retired once its API subscription lapsed). `scripts/apply-variable-glossary.mjs` still retrofits `scripts/variable-glossary.json`'s identifier renaming onto translated files with zero API calls, reusing the text-segmentation logic in `scripts/markdown-segmenter.mjs` (which splits a chapter into natural-language vs. code/markdown-syntax pieces so only the former ever gets rewritten). Currently translated: English, Spanish, Portuguese (Brazil) — see `structure/languages.json`. The language switcher lives in the navbar (`js/lang.js`).

## Running locally

Devpedia is a static site: no build step, no dependencies. Because the app loads content as ES modules and fetches Markdown files at runtime, opening `index.html` directly (`file://`) won't work — serve the folder instead.

`scripts/dev.sh` regenerates `structure/struct.json` from `content/` (via `scripts/generate-struct.js`, see below) and then starts a local server, so the navigation is always in sync with whatever is on disk before you start working:

```bash
./scripts/dev.sh
```

then open `http://localhost:8000`. Node is only needed for that regeneration step — the site itself still runs on plain static files. To skip it and serve as-is, use `python3 -m http.server` directly.

## Content structure

`structure/struct.json` describes the navigation tree (categories → subjects → chapters) and is generated from `content/`, not hand-edited. After adding, removing, or renaming a chapter/subject/category folder, regenerate it:

```bash
node scripts/generate-struct.js
```

A subject's own description page is the `.md` file inside its folder whose title (its `# Heading`) matches the folder name (e.g. `cpp.md` titled "C++" inside `content/Langages/C++/`); every other `.md` file in that folder becomes one of its chapters. A category with no subject subfolders (currently just UI-UX) lists its `.md` files as chapters directly, and takes its intro text from `description.md`. Nesting stops at exactly these 2 levels (category → subject → chapters) — a subfolder inside a subject's own folder is silently ignored rather than erroring, see the comment above `buildCategory()` in `scripts/generate-struct.js`.

Ids are slugified from folder and file names, with diacritics transliterated — an accented folder name like `Représentation des données` yields `representation-des-donnees`, so it can be linked to from other chapters (`js/text.js`'s `slugify()`, shared between the browser and this script). Cross-chapter links are plain query strings (`?c=<category>&s=<subject>&p=<chapter>`, the `&s=` part only for categories that have subjects). Running `node scripts/generate-struct.js` validates every such link found in `content/` against the freshly built structure and throws (listing each broken link) if a rename left any dangling — no silent breakage; a link to a category folded away by a past reorganization resolves against `js/legacy-category-redirects.js` first (see "Interface" below) instead of being reported broken.

A `[label](url)` written in a chapter renders as a real link: `js/parser.js` turns it into an `<a>` (external URLs open in a new tab; internal ones get a `contentLink` class), and `js/router.js` makes it actually navigate — reading `?c=&s=&p=` from the URL at startup, and intercepting a plain click on a `contentLink` to route through the SPA instead of reloading the page.

## Interface

Besides Markdown rendering, the site includes a few hand-built pieces worth knowing about if you're navigating the code:

- `js/sidebar.js`: left sidebar (category → subject → chapter tree) and right sidebar (on-page outline), merged into a single mobile menu below a breakpoint
- `js/search.js`: navbar search over every category/subject/chapter title, accent-insensitive
- `js/lang.js`: language switcher, keeps you on the equivalent page after reloading in a new language
- `js/router.js`: besides SPA routing, a chapter page gets a return button plus, when applicable, previous/next chapter buttons (stacked, arrow pinned to the outer edge, label wrapping instead of truncating); ArrowLeft/ArrowRight trigger the same previous/next navigation from the keyboard, mirroring the on-screen arrows (including in RTL). A target (from a URL, a language switch, or a stale bookmark) that doesn't exist in the active language is resolved against English then French (`resolveAcrossLanguages`) instead of failing — the page renders in whichever language actually has it, with a translated notice, while the rest of the site (chrome, other pages) stays in the language the reader picked
- `js/legacy-category-redirects.js`: when a top-level category is folded into another as a subject (a "Content" reorganization), its old id is added here (`LEGACY_CATEGORY_REDIRECTS`) so a link still using it — an old bookmark, an external link, an unrewritten cross-chapter link — keeps resolving to the new location, following the chain if that location was itself folded away again later. Shared as-is between the browser router and `scripts/generate-struct.js`'s link validation
- `manifest.json` + `icons/` + the `apple-touch-icon`/`apple-mobile-web-app-*` tags in `index.html`: lets the site be added to a phone's home screen and launched in standalone mode (no browser chrome) — notably needed on iOS for the lock-screen/Bluetooth media controls in `js/reader.js` to target the site instead of falling through to another app
- `js/i18n.js`: fixed UI chrome (sidebar labels, search placeholder, return button, reader controls...) is looked up by key from `structure/ui-strings.json` (one table per language) via `t(key)`, instead of being hardcoded per language in each file — content translation (Markdown files) is unrelated and lives under `content-<lang>/`. A category's or subject's `label` in `struct-*.json` is always its raw folder name (in French — see "Content structure" above), since a folder name must stay identical across languages; `tEntityLabel(kind, id, fallback)` looks up a translated display label from `ui-strings.json`'s `categoryLabels`/`subjectLabels` tables and falls back to that raw name if none exists yet for the active language, so a category/subject can show a translated name in the sidebar, navbar, breadcrumb and search before every chapter under it is translated
