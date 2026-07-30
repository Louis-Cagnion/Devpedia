# Devpedia

Devpedia is a website created to document, explain, and share my knowledge of various software development topics. The project helps me deepen my understanding through research and teaching, practice building modern web interfaces, and make this knowledge accessible to anyone interested in learning about the concepts and technologies I have explored.

Live at: https://louis-cagnion.github.io/Devpedia/

## Content

Chapters live under `content/`, grouped by category and, when relevant, by subject. Currently covered:

- **Programming languages**: C, C++, PHP, Python (including data science / AI: NumPy, pandas, Matplotlib, scikit-learn, neural networks, gradient descent, CNN/RNN/Transformers, PyTorch, NLP & LLMs), JavaScript
- **Markup & style languages**: HTML, CSS
- **Domain-specific languages**: Regex, SQL
- **Shells**: Bash, PowerShell, Zsh (Bash and PowerShell each include a dedicated "internals" chapter — syscalls and the REPL loop for Bash, the .NET pipeline for PowerShell; Zsh instead points back to Bash for everything shared and only covers what's genuinely different — startup files, `setopt`, extended globbing, completion, prompt theming, and Oh My Zsh)
- **Git**: from everyday commands to its internal object model

Each chapter is a plain Markdown file, its title given by a regular `# Heading` at the top of the file (an optional `---`-fenced frontmatter block above it can carry build-time metadata, currently just `order`, used to sort chapters pedagogically). Markdown is rendered by a parser I wrote myself for this project (`js/parser.js`), rather than an existing library.

Security isn't its own category — it's woven into whichever chapter it concretely applies to (PHP's `securite.md` for the web attack taxonomy — CSRF, XSS, SQL injection, MITM, session hijacking...; command injection in Bash; buffer overflows in C; least-privilege database accounts in SQL), each cross-referencing the others rather than repeating the same explanation.

## Translations

`content/` is the French source of truth. `scripts/translate-content.mjs` translates it into `content-<lang>/` via the DeepL API — natural language only, never code (comments are detected per language, code identifiers are matched against `scripts/variable-glossary.json` so they read naturally in each target language too). Currently translated: English, Spanish, Portuguese (Brazil) — see `structure/languages.json`. The language switcher lives in the navbar (`js/lang.js`).

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

A subject's own description page is the `.md` file inside its folder whose title (its `# Heading`) matches the folder name (e.g. `cpp.md` titled "C++" inside `content/Langages de programmation/C++/`); every other `.md` file in that folder becomes one of its chapters. Categories without subject subfolders (Git, the DSL category) list their `.md` files as chapters directly.

## Interface

Besides Markdown rendering, the site includes a few hand-built pieces worth knowing about if you're navigating the code:

- `js/sidebar.js`: left sidebar (category → subject → chapter tree) and right sidebar (on-page outline), merged into a single mobile menu below a breakpoint
- `js/search.js`: navbar search over every category/subject/chapter title, accent-insensitive
- `js/lang.js`: language switcher, keeps you on the equivalent page after reloading in a new language
