/* Pure string logic for splitting a markdown file's optional `---`-fenced frontmatter from its
   body, shared between the browser (js/parser.js) and Node build scripts
   (scripts/generate-struct.js, scripts/markdown-segmenter.mjs) so the fence convention only
   needs to change in one place. No Node or DOM API used here, importable from either side. */

/**
 * @brief Splits a markdown file's raw content into its optional frontmatter and its body.
 *
 * @param {string} raw
 *
 * @returns {{frontmatter: string|null, body: string}} frontmatter is the raw YAML between the
 *   fences (not re-wrapped), null if `raw` has no frontmatter at all; body is always trimmed
 */
export function splitFrontmatter(raw) {
    if (!raw.startsWith("---"))
        return { frontmatter: null, body: raw.trim() };
    const parts = raw.split("---");
    return { frontmatter: parts[1], body: parts.slice(2).join("---").trim() };
}
