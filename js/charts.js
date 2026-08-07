import { createTag } from "./tags.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgTag(name, attributes = {}) {
    const el = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
        el.setAttribute(key, value);
    }
    return el;
}

/**
 * Parses a chart block's raw body into a flat { key: value } spec.
 * Lines follow `key: value`, split on the first colon only (a value like
 * `x => x*x` has none, but nothing rules out a colon appearing later).
 */
function parseSpec(rawText) {
    const spec = {};
    for (const line of rawText.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const colonIndex = trimmed.indexOf(":");
        if (colonIndex === -1) continue;
        spec[trimmed.slice(0, colonIndex).trim()] = trimmed.slice(colonIndex + 1).trim();
    }
    return spec;
}

function parseDomain(domainSpec, fieldName = "domaine") {
    const parts = domainSpec.split(",").map(part => parseFloat(part.trim()));
    if (parts.length !== 2 || !parts.every(Number.isFinite) || parts[0] >= parts[1]) {
        throw new Error(`${fieldName} invalide : "${domainSpec}" (attendu "min, max", avec min < max)`);
    }
    return parts;
}

// --- Minimal math expression evaluator ---
// A hand-rolled tokenizer/parser rather than eval()/new Function(): chart specs are
// authored content here, not user input, but this module is a template for future
// chart kinds and should never normalize executing free-form text as code.

const MATH_FUNCTIONS = {
    sqrt: Math.sqrt, log: Math.log10, ln: Math.log,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    abs: Math.abs, exp: Math.exp,
};

function tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        const c = expr[i];
        if (/\s/.test(c)) { i++; continue; }
        if (/[0-9.]/.test(c)) {
            let j = i;
            while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
            tokens.push({type: "num", value: parseFloat(expr.slice(i, j))});
            i = j;
            continue;
        }
        if (/[a-zA-Z]/.test(c)) {
            let j = i;
            while (j < expr.length && /[a-zA-Z0-9]/.test(expr[j])) j++;
            tokens.push({type: "ident", value: expr.slice(i, j)});
            i = j;
            continue;
        }
        if ("+-*/^(),".includes(c)) {
            tokens.push({type: "op", value: c});
            i++;
            continue;
        }
        throw new Error(`caractère inattendu "${c}"`);
    }
    return tokens;
}

/**
 * @param {string} exprString a math expression using `x`, `+ - * / ^`, parentheses,
 *   and calls from MATH_FUNCTIONS (e.g. "x^2 + sqrt(x)")
 * @returns {object} an AST evaluable by evaluateAst
 */
function parseExpression(exprString) {
    const tokens = tokenize(exprString);
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseExpr() {
        let node = parseTerm();
        while (peek()?.type === "op" && (peek().value === "+" || peek().value === "-")) {
            node = {type: next().value, left: node, right: parseTerm()};
        }
        return node;
    }

    function parseTerm() {
        let node = parsePower();
        while (peek()?.type === "op" && (peek().value === "*" || peek().value === "/")) {
            node = {type: next().value, left: node, right: parsePower()};
        }
        return node;
    }

    function parsePower() {
        const base = parseUnary();
        if (peek()?.value === "^") {
            next();
            return {type: "^", left: base, right: parsePower()};
        }
        return base;
    }

    function parseUnary() {
        if (peek()?.value === "-") {
            next();
            return {type: "neg", operand: parseUnary()};
        }
        return parsePrimary();
    }

    function parsePrimary() {
        const token = next();
        if (!token) throw new Error("expression incomplète");
        if (token.type === "num") return {type: "num", value: token.value};
        if (token.type === "ident") {
            if (token.value === "x") return {type: "var"};
            if (peek()?.value === "(") {
                next();
                const args = [parseExpr()];
                while (peek()?.value === ",") {
                    next();
                    args.push(parseExpr());
                }
                if (peek()?.value !== ")") throw new Error(`parenthèse fermante attendue après ${token.value}(`);
                next();
                if (!MATH_FUNCTIONS[token.value]) throw new Error(`fonction inconnue : ${token.value}`);
                return {type: "call", name: token.value, args};
            }
            throw new Error(`identifiant inattendu "${token.value}" (seule la variable x est autorisée)`);
        }
        if (token.value === "(") {
            const node = parseExpr();
            if (peek()?.value !== ")") throw new Error("parenthèse fermante manquante");
            next();
            return node;
        }
        throw new Error(`élément inattendu "${token.value}"`);
    }

    const ast = parseExpr();
    if (pos < tokens.length) throw new Error("expression mal formée (caractères en trop)");
    return ast;
}

function evaluateAst(ast, x) {
    switch (ast.type) {
        case "num": return ast.value;
        case "var": return x;
        case "neg": return -evaluateAst(ast.operand, x);
        case "+": return evaluateAst(ast.left, x) + evaluateAst(ast.right, x);
        case "-": return evaluateAst(ast.left, x) - evaluateAst(ast.right, x);
        case "*": return evaluateAst(ast.left, x) * evaluateAst(ast.right, x);
        case "/": return evaluateAst(ast.left, x) / evaluateAst(ast.right, x);
        case "^": return Math.pow(evaluateAst(ast.left, x), evaluateAst(ast.right, x));
        case "call": return MATH_FUNCTIONS[ast.name](...ast.args.map(arg => evaluateAst(arg, x)));
        default: throw new Error(`nœud d'expression inconnu : ${ast.type}`);
    }
}

// `fn: x => x*x` accepts the arrow-function look content authors already know from
// JS/Python lambdas; only the body after `=>` is actually parsed as an expression.
function stripArrowPrefix(fnSpec) {
    return fnSpec.match(/^\s*x\s*=>\s*(.+)$/)?.[1] ?? fnSpec;
}

function formatTick(value) {
    const rounded = Math.round(value * 100) / 100;
    return rounded === 0 ? "0" : String(rounded);
}

// Picks a "nice" axis tick step (1/2/5 * 10^n) that yields roughly 8 ticks over `range`.
function niceStep(range) {
    const roughStep = range / 8;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    const step = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10;
    return step * magnitude;
}

const PLOT_WIDTH = 400;
const PLOT_HEIGHT = 260;
const PLOT_MARGIN = {top: 20, right: 20, bottom: 30, left: 40};

/**
 * @param {{fn: string, domaine: string, label?: string}} spec
 * @returns {SVGElement} an inline SVG plotting `fn` (a function of `x`) over `domaine`
 */
function renderFunctionPlot(spec) {
    if (!spec.fn) throw new Error('le champ "fn" est requis (ex: "fn: x => x*x")');
    if (!spec.domaine) throw new Error('le champ "domaine" est requis (ex: "domaine: -5, 5")');

    const [domainMin, domainMax] = parseDomain(spec.domaine);
    const ast = parseExpression(stripArrowPrefix(spec.fn));

    const SAMPLE_COUNT = 200;
    const points = [];
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const x = domainMin + (domainMax - domainMin) * (i / SAMPLE_COUNT);
        const y = evaluateAst(ast, x);
        points.push({x, y: Number.isFinite(y) ? y : null});
    }

    const finiteYs = points.map(p => p.y).filter(y => y !== null);
    if (finiteYs.length === 0) throw new Error("aucune valeur finie de la fonction sur ce domaine");

    let yMin = Math.min(...finiteYs);
    let yMax = Math.max(...finiteYs);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yPadding = (yMax - yMin) * 0.1;
    yMin -= yPadding;
    yMax += yPadding;

    const plotWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
    const plotHeight = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
    const toSvgX = x => PLOT_MARGIN.left + ((x - domainMin) / (domainMax - domainMin)) * plotWidth;
    const toSvgY = y => PLOT_MARGIN.top + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

    const svg = svgTag("svg", {
        viewBox: `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`,
        class: "chartSvg",
        role: "img",
        "aria-label": spec.label || `Courbe de la fonction ${spec.fn}`,
    });

    if (domainMin <= 0 && domainMax >= 0) {
        svg.append(svgTag("line", {
            x1: toSvgX(0), x2: toSvgX(0), y1: PLOT_MARGIN.top, y2: PLOT_MARGIN.top + plotHeight, class: "chartAxis",
        }));
    }
    if (yMin <= 0 && yMax >= 0) {
        svg.append(svgTag("line", {
            x1: PLOT_MARGIN.left, x2: PLOT_MARGIN.left + plotWidth, y1: toSvgY(0), y2: toSvgY(0), class: "chartAxis",
        }));
    }

    const xStep = niceStep(domainMax - domainMin);
    for (let tick = Math.ceil(domainMin / xStep) * xStep; tick <= domainMax + 1e-9; tick += xStep) {
        const sx = toSvgX(tick);
        svg.append(svgTag("line", {x1: sx, x2: sx, y1: PLOT_MARGIN.top + plotHeight, y2: PLOT_MARGIN.top + plotHeight + 4, class: "chartTick"}));
        const label = svgTag("text", {x: sx, y: PLOT_MARGIN.top + plotHeight + 16, class: "chartTickLabel", "text-anchor": "middle"});
        label.textContent = formatTick(tick);
        svg.append(label);
    }
    const yStep = niceStep(yMax - yMin);
    for (let tick = Math.ceil(yMin / yStep) * yStep; tick <= yMax + 1e-9; tick += yStep) {
        const sy = toSvgY(tick);
        svg.append(svgTag("line", {x1: PLOT_MARGIN.left - 4, x2: PLOT_MARGIN.left, y1: sy, y2: sy, class: "chartTick"}));
        const label = svgTag("text", {x: PLOT_MARGIN.left - 8, y: sy + 3, class: "chartTickLabel", "text-anchor": "end"});
        label.textContent = formatTick(tick);
        svg.append(label);
    }

    // Split into separate path segments across gaps (non-finite y, e.g. log(x) at x <= 0)
    // so the curve never draws a straight line jumping across an undefined region.
    const segments = [];
    let currentSegment = [];
    for (const point of points) {
        if (point.y === null) {
            if (currentSegment.length > 1) segments.push(currentSegment);
            currentSegment = [];
        } else {
            currentSegment.push(point);
        }
    }
    if (currentSegment.length > 1) segments.push(currentSegment);
    for (const segment of segments) {
        const d = segment.map((p, i) => `${i === 0 ? "M" : "L"} ${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`).join(" ");
        svg.append(svgTag("path", {d, class: "chartCurve"}));
    }

    if (spec.label) {
        const caption = svgTag("text", {x: PLOT_WIDTH / 2, y: 14, class: "chartLabel", "text-anchor": "middle"});
        caption.textContent = spec.label;
        svg.append(caption);
    }

    return svg;
}

const CHART_RENDERERS = {
    "plot-fonction": renderFunctionPlot,
};

/**
 * @param {string} language the fence's language tag
 * @param {string} rawText the fence's raw body (unparsed `key: value` spec lines)
 * @returns {HTMLElement|null} a wrapper element to render in place of the fence,
 *   or null if `language` isn't a registered chart kind (caller falls back to a
 *   regular code block)
 */
export function renderChartBlock(language, rawText) {
    const renderer = CHART_RENDERERS[language];
    if (!renderer) return null;

    const wrapper = createTag("div", {class: "chartWrapper"});
    try {
        wrapper.append(renderer(parseSpec(rawText)));
    } catch (error) {
        console.error(`Erreur de rendu du graphique "${language}" :`, error);
        wrapper.classList.add("chartError");
        wrapper.textContent = `Erreur de rendu du graphique (${language}) : ${error.message}`;
    }
    return wrapper;
}
