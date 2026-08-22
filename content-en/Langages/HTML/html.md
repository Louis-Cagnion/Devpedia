---
order: 7
---

# HTML

HTML (*HyperText Markup Language*) is not a programming language: it is a **markup** language that describes the structure and meaning of content (a title, a paragraph, an image, a link, etc.), not instructions that are executed sequentially. A browser reads an HTML document and builds an in-memory representation of that structure, the DOM (*Document Object Model*, see [The DOM and Events](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)), which it then displays on the screen.

Some of the key concepts in HTML include:

- Tags and attributes, which structure and enrich content
- Semantic elements (HTML5), which give explicit meaning to each part of the page
- Forms, for collecting data from users
- Accessibility, to ensure that content remains usable with assistive technologies (screen readers, etc.)

HTML deals with **neither** the visual appearance (the role of [CSS](/?c=langages-de-balisage&s=css&p=css)) **nor** interactive behavior (the role of [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)): its sole responsibility is to describe what each part of the content **is**. This separation of responsibilities (structure / presentation / behavior) is a central principle of modern web development.

> **Note:** unlike a programming language, an HTML syntax error almost never causes a "crash": browsers are deliberately tolerant (unclosed tag, misspelled attribute...) and try to silently correct it, which can hide errors for a long time if you don't validate your HTML with a dedicated tool.
