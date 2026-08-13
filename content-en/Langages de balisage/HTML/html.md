---
order: 1
---

# HTML

HTML (*HyperText Markup Language*) is not a programming language: it is a **markup** language that describes the structure and meaning of content (a title, a paragraph, an image, a link, etc.), not instructions that are executed sequentially. A browser reads an HTML document and builds a representation of that structure in memory—the DOM (*Document Object Model*; see [The DOM and Events](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements))—which it then displays on the screen.

Some of the key concepts in HTML include:

- Tags and attributes, which structure and enrich content
- Semantic elements (HTML5), which give explicit meaning to each part of the page
- Forms, for collecting data from users
- Accessibility, to ensure that content remains usable with assistive technologies (screen readers, etc.)

HTML does not deal with visual appearance (which is the role of CSS; see the dedicated chapter) **or** interactive behavior (which is the role of JavaScript)—its sole responsibility is to describe what each part of the content is. This separation of responsibilities (structure, presentation, and behavior) is a central principle of modern web development.

> **Note:** Unlike a programming language, an HTML syntax error almost never causes a "crash"—browsers are intentionally tolerant (unclosed tags, misspelled attributes, etc.) and attempt to correct them silently, which can hide errors for a long time if you don’t validate your HTML with a dedicated tool.
