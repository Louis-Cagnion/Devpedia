# Devpedia

Devpedia is a website created to document, explain, and share my knowledge of various software development topics. The project helps me deepen my understanding through research and teaching, practice building modern web interfaces, and make this knowledge accessible to anyone interested in learning about the concepts and technologies I have explored.

## Content

Chapters live under `content/`, grouped by category and subject. Currently covered:

- **Programming languages**: C, C++, PHP, Python (including data science / AI: NumPy, pandas, Matplotlib, scikit-learn, neural networks, gradient descent, CNN/RNN/Transformers, PyTorch, NLP & LLMs), JavaScript
- **Markup & style languages**: HTML, CSS
- **Domain-specific languages**: Regex, SQL
- **Tools**: Bash, Git (both include a dedicated "internals" chapter — syscalls for Bash, the object model for Git — for anyone who wants to understand them well enough to build something similar)

Each chapter is a plain Markdown file with a small frontmatter (`title`), rendered by a Markdown-to-HTML parser I wrote myself for this project (`js/parser.js`), rather than an existing library.

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

A subject's own description page is the `.md` file inside its folder whose frontmatter `title` matches the folder name (e.g. `cpp.md` titled "C++" inside `content/Langages de programmation/C++/`); every other `.md` file in that folder becomes one of its chapters. Categories without subject subfolders (Bash, Git, the DSL category) list their `.md` files as chapters directly.
