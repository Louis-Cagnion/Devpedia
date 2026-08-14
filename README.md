# Devpedia

Devpedia is a website created to document, explain, and share my knowledge of various software development topics. The project helps me deepen my understanding through research and teaching, practice building modern web interfaces, and make this knowledge accessible to anyone interested in learning about the concepts and technologies I have explored.

Live at: https://louis-cagnion.github.io/Devpedia/

Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`: a plain static-file deploy (`upload-pages-artifact` + `deploy-pages`), with no Jekyll build step — the site is a JS SPA that fetches Markdown at runtime, so a Jekyll build isn't just unnecessary, it actively breaks on any file with the wrong Liquid-looking syntax.

## Content

Chapters live under `content/`, grouped by category and, when relevant, by subject. Currently covered:

- **Programming languages**: C, C++, PHP, Python, JavaScript, OCaml (functional programming, contrasted throughout with the imperative style of every other language above) — data science and AI tooling for Python live in their own cross-cutting categories below, not under Python itself
- **Markup & style languages**: HTML, CSS
- **UI/UX**: interface design fundamentals for absolute beginners — visual hierarchy, color and contrast (WCAG ratios, color blindness), typography, spacing and grid systems, Nielsen's 10 usability heuristics, and UX-level accessibility (touch target sizes, keyboard navigation planned at the design stage); each chapter redirects to the relevant CSS/HTML chapter for implementation
- **Domain-specific languages**: Regex, SQL
- **Shells**: Bash (including task scheduling with cron), PowerShell, Zsh (Bash and PowerShell each include a dedicated "internals" chapter — syscalls and the REPL loop for Bash, the .NET pipeline for PowerShell; Zsh instead points back to Bash for everything shared and only covers what's genuinely different — startup files, `setopt`, extended globbing, completion, prompt theming, and Oh My Zsh)
- **Git**: from everyday commands to its internal object model
- **Docker**: images and containers, Dockerfiles, volumes and networking, Compose, and container-specific security practices
- **Data representation**: what a value actually looks like in memory, and the behaviours that follow from it — integers and overflow (two's complement), IEEE 754 floats, text encodings (ASCII/Unicode/UTF-8), memory layout (alignment, padding, endianness), pseudo-randomness and CSPRNGs
- **Performance**: language-agnostic optimisation principles — profiling before optimising, replacing fixed delays with condition-based waits, cutting round trips (the N+1 pattern), when parallelism helps and when it backfires, what changes once a job runs for minutes, why CPU cache locality and SIMD vectorisation (not raw operation count) drive compute-bound speed, and never recomputing a result nothing could have changed (memoization, incremental updates, dirty-rectangle rendering)
- **Code quality & architecture**: single responsibility and low coupling, avoiding repetition via indexed/dispatch structures, single source of truth, checking dependency direction before centralizing shared config, depending on data structure rather than hardcoded values, and never representing the same information through two overlapping mechanisms
- **Mathematics**: the math vocabulary the AI and Data Science chapters lean on, starting from zero — not even high-school math assumed: the function concept, vectors and the dot product, matrices and matrix multiplication, logarithms, basic probability, and derivatives/gradients
- **Infrastructure**: the systems vocabulary the AI chapters lean on, starting from zero: JSON, APIs and HTTP, CPU vs GPU, and the cloud
- **AI**: neural network fundamentals through production LLM systems — gradient descent, CNN/RNN/Transformer architectures, PyTorch, NLP & LLM basics, prompt engineering, production use cases and limits, agents, RAG, LLM monitoring, data governance for AI systems, EU AI regulation (the AI Act), and chatbots
- **Data Science**: the Python tooling for data science and classical ML — NumPy, pandas, Matplotlib, Jupyter, scikit-learn

These last six categories are deliberately cross-cutting: they explain once what would otherwise be repeated (and half-explained) in every language section. `0.1 + 0.2 != 0.3` is not a JavaScript quirk, so it is documented as an encoding property, and the language chapters link to it instead of re-deriving it.

More recent additions, outside that cross-cutting set:

- **Databases**: organizing data beyond the single-table view covered in SQL: the star schema (fact and dimension tables), the medallion architecture (bronze/silver/gold), bridge tables for many-to-many relationships, schemas and technical tables (staging, load tracking), data warehouses vs data lakes, and indexes
- **CI/CD**: what a pipeline automates and why: the CI/CD concept itself, Azure DevOps as a platform (Boards, Repos, Pipelines, Artifacts), the YAML structure of an Azure pipeline, and a syntax comparison with GitHub Actions
- **Business organization**: the human side of a software project: team roles (product owner, tech lead, QA, Scrum Master), Agile/Scrum/Kanban methodologies, a project's lifecycle from requirements to maintenance, and writing an actionable ticket or flagging a blocker

Each chapter is a plain Markdown file, its title given by a regular `# Heading` at the top of the file (an optional `---`-fenced frontmatter block above it can carry build-time metadata, currently just `order`, used to sort chapters pedagogically). Markdown is rendered by a parser I wrote myself for this project (`js/parser.js`), rather than an existing library.

Security isn't its own category — it's woven into whichever chapter it concretely applies to (PHP's `securite.md` for the web attack taxonomy — CSRF, XSS, SQL injection, MITM, session hijacking...; command injection in Bash; buffer overflows in C; least-privilege database accounts in SQL), each cross-referencing the others rather than repeating the same explanation.

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

A subject's own description page is the `.md` file inside its folder whose title (its `# Heading`) matches the folder name (e.g. `cpp.md` titled "C++" inside `content/Langages de programmation/C++/`); every other `.md` file in that folder becomes one of its chapters. Categories without subject subfolders (Git, Performance, Data representation, the DSL category, Code quality & architecture, AI, Data Science, UI/UX, Databases, CI/CD, Business organization) list their `.md` files as chapters directly, and take their intro text from `description.md`.

Ids are slugified from folder and file names, with diacritics transliterated — an accented folder name like `Représentation des données` yields `representation-des-donnees`, so it can be linked to from other chapters. Cross-chapter links are plain query strings (`?c=<category>&s=<subject>&p=<chapter>`, the `&s=` part only for categories that have subjects). Running `node scripts/generate-struct.js` validates every such link found in `content/` against the freshly built structure and throws (listing each broken link) if a rename left any dangling — no silent breakage.

A `[label](url)` written in a chapter renders as a real link: `js/parser.js` turns it into an `<a>` (external URLs open in a new tab; internal ones get a `contentLink` class), and `js/router.js` makes it actually navigate — reading `?c=&s=&p=` from the URL at startup, and intercepting a plain click on a `contentLink` to route through the SPA instead of reloading the page.

## Interface

Besides Markdown rendering, the site includes a few hand-built pieces worth knowing about if you're navigating the code:

- `js/sidebar.js`: left sidebar (category → subject → chapter tree) and right sidebar (on-page outline), merged into a single mobile menu below a breakpoint
- `js/search.js`: navbar search over every category/subject/chapter title, accent-insensitive
- `js/lang.js`: language switcher, keeps you on the equivalent page after reloading in a new language
- `js/router.js`: besides SPA routing, a chapter page gets a return button plus, when applicable, previous/next chapter buttons (stacked, arrow pinned to the outer edge, label wrapping instead of truncating); ArrowLeft/ArrowRight trigger the same previous/next navigation from the keyboard, mirroring the on-screen arrows (including in RTL). A target (from a URL, a language switch, or a stale bookmark) that doesn't exist in the active language is resolved against English then French (`resolveAcrossLanguages`) instead of failing — the page renders in whichever language actually has it, with a translated notice, while the rest of the site (chrome, other pages) stays in the language the reader picked
- `js/i18n.js`: fixed UI chrome (sidebar labels, search placeholder, return button, reader controls...) is looked up by key from `structure/ui-strings.json` (one table per language) via `t(key)`, instead of being hardcoded per language in each file — content translation (Markdown files) is unrelated and lives under `content-<lang>/`. A category's or subject's `label` in `struct-*.json` is always its raw folder name (in French — see "Content structure" above), since a folder name must stay identical across languages; `tEntityLabel(kind, id, fallback)` looks up a translated display label from `ui-strings.json`'s `categoryLabels`/`subjectLabels` tables and falls back to that raw name if none exists yet for the active language, so a category/subject can show a translated name in the sidebar, navbar, breadcrumb and search before every chapter under it is translated
