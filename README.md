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

Devpedia is a static site: no build step, no dependencies. Because the app loads content as ES modules and fetches Markdown files at runtime, opening `index.html` directly (`file://`) won't work — serve the folder instead, for example:

```bash
python3 -m http.server
```

then open `http://localhost:8000`.
