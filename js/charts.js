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
 * @brief Parses a chart block's raw body into a flat { key: value } spec. Lines follow
 * `key: value`, split on the first colon only (a value like `x => x*x` has none, but
 * nothing rules out a colon appearing later).
 *
 * @param {string} rawText
 *
 * @returns {Object<string, string>}
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

/* --- Minimal math expression evaluator ---
   Hand-rolled rather than eval()/new Function(): chart specs are authored content here, not user
   input, but this module is a template for future kinds and shouldn't normalize executing text as code. */

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
 * @brief Parses a math expression into an AST evaluable by evaluateAst.
 *
 * @param {string} exprString a math expression using `x`, `+ - * / ^`, parentheses,
 *   and calls from MATH_FUNCTIONS (e.g. "x^2 + sqrt(x)")
 *
 * @returns {object}
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

/* `fn: x => x*x` accepts the arrow-function look content authors already know from
   JS/Python lambdas; only the body after `=>` is actually parsed as an expression. */
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
 * @brief Builds an inline SVG plotting `fn` (a function of `x`) over `domaine`.
 *
 * @param {{fn: string, domaine: string, label?: string}} spec
 *
 * @returns {SVGElement}
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

    /* Split into separate path segments across gaps (non-finite y, e.g. log(x) at x <= 0)
       so the curve never draws a straight line jumping across an undefined region. */
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

const WHEEL_SIZE = 280;
const WHEEL_RADIUS = 95;
const WHEEL_CENTER_X = WHEEL_SIZE / 2;
const WHEEL_CENTER_Y = WHEEL_SIZE / 2 + 15; // leaves room for the top caption
const WHEEL_SLICE_COUNT = 60;

/* Angle convention: 0deg (hue 0, red) at 12 o'clock, increasing clockwise --
   the usual layout for a "color wheel" in design tools. */
function hueToPoint(hueDegrees, radius) {
    const angleRad = (hueDegrees * Math.PI) / 180;
    return {
        x: WHEEL_CENTER_X + radius * Math.sin(angleRad),
        y: WHEEL_CENTER_Y - radius * Math.cos(angleRad),
    };
}

function parseHueList(huesSpec) {
    const hues = huesSpec.split(",").map(part => parseFloat(part.trim()));
    if (hues.length === 0 || !hues.every(Number.isFinite)) {
        throw new Error(`liste de teintes invalide : "${huesSpec}" (attendu une liste d'angles en degrés, ex: "200, 20")`);
    }
    return hues;
}

/**
 * @brief Builds a full hue wheel, with any given hues marked and connected.
 *
 * @param {{hues?: string, label?: string}} spec `hues`: an optional comma-separated
 *   list of hue angles (0-360°) to mark and connect on the wheel -- 2 for a
 *   complementary harmony, 3 for a triadic one, etc. Omit it for a bare wheel.
 *
 * @returns {SVGElement}
 */
function renderColorWheel(spec) {
    const hues = spec.hues ? parseHueList(spec.hues) : [];

    const svg = svgTag("svg", {
        viewBox: `0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`,
        class: "chartSvg",
        role: "img",
        "aria-label": spec.label || `Roue chromatique, teintes ${hues.join(", ")}`,
    });

    for (let i = 0; i < WHEEL_SLICE_COUNT; i++) {
        const startAngle = (i * 360) / WHEEL_SLICE_COUNT;
        const endAngle = ((i + 1) * 360) / WHEEL_SLICE_COUNT;
        const midHue = (startAngle + endAngle) / 2;
        const p1 = hueToPoint(startAngle, WHEEL_RADIUS);
        const p2 = hueToPoint(endAngle, WHEEL_RADIUS);
        const d = `M ${WHEEL_CENTER_X} ${WHEEL_CENTER_Y} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
        svg.append(svgTag("path", {d, fill: `hsl(${midHue}, 70%, 50%)`}));
    }

    if (hues.length >= 2) {
        const points = hues.map(hue => hueToPoint(hue, WHEEL_RADIUS));
        const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
        svg.append(svgTag("path", {d, class: "chartHarmonyLine"}));
    }

    for (const hue of hues) {
        const p = hueToPoint(hue, WHEEL_RADIUS);
        svg.append(svgTag("circle", {
            cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 7, fill: `hsl(${hue}, 70%, 50%)`, class: "chartHueMarker",
        }));
    }

    if (spec.label) {
        const caption = svgTag("text", {x: WHEEL_SIZE / 2, y: 14, class: "chartLabel", "text-anchor": "middle"});
        caption.textContent = spec.label;
        svg.append(caption);
    }

    return svg;
}

const VECTOR_WIDTH = 300;
const VECTOR_HEIGHT = 300;
const VECTOR_MARGIN = 30;
const VECTOR_COLOR_CLASSES = ["chartVector0", "chartVector1", "chartVector2"];

/**
 * @brief Parses a list of 2D vectors, e.g. "(3, 2), (1, 4)".
 *
 * @param {string} vectorsSpec
 *
 * @returns {Array<{x: number, y: number}>}
 */
function parseVectorList(vectorsSpec) {
    const matches = [...vectorsSpec.matchAll(/\(([^,()]+),([^,()]+)\)/g)];
    if (matches.length === 0) {
        throw new Error(`liste de vecteurs invalide : "${vectorsSpec}" (attendu "(x, y), (x, y)...")`);
    }
    return matches.map(([, x, y]) => {
        const point = {x: parseFloat(x.trim()), y: parseFloat(y.trim())};
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            throw new Error(`composante de vecteur invalide dans "${vectorsSpec}"`);
        }
        return point;
    });
}

/**
 * @brief Draws 2D vectors as arrows from the origin, same scale on both axes.
 *
 * @param {{vecteurs: string, label?: string}} spec
 *
 * @returns {SVGElement}
 */
function renderVectorDiagram(spec) {
    if (!spec.vecteurs) throw new Error('le champ "vecteurs" est requis (ex: "vecteurs: (3, 2), (1, 4)")');
    const vectors = parseVectorList(spec.vecteurs);

    const maxComponent = Math.max(1, ...vectors.flatMap(v => [Math.abs(v.x), Math.abs(v.y)]));
    const domainMax = maxComponent * 1.2;

    const plotSize = Math.min(VECTOR_WIDTH, VECTOR_HEIGHT) - VECTOR_MARGIN * 2;
    const centerX = VECTOR_WIDTH / 2;
    const centerY = VECTOR_HEIGHT / 2 + 10; // leaves room for the top caption
    const scale = plotSize / (2 * domainMax);
    const toSvg = point => ({x: centerX + point.x * scale, y: centerY - point.y * scale});

    const svg = svgTag("svg", {
        viewBox: `0 0 ${VECTOR_WIDTH} ${VECTOR_HEIGHT}`,
        class: "chartSvg",
        role: "img",
        "aria-label": spec.label || `Vecteurs ${vectors.map(v => `(${v.x}, ${v.y})`).join(", ")}`,
    });

    const defs = svgTag("defs");
    VECTOR_COLOR_CLASSES.forEach((colorClass, i) => {
        const marker = svgTag("marker", {
            id: `chartArrowhead${i}`, markerWidth: 8, markerHeight: 8, refX: 8, refY: 4, orient: "auto",
        });
        marker.append(svgTag("path", {d: "M 0 0 L 8 4 L 0 8 Z", class: colorClass}));
        defs.append(marker);
    });
    svg.append(defs);

    svg.append(svgTag("line", {x1: VECTOR_MARGIN, x2: VECTOR_WIDTH - VECTOR_MARGIN, y1: centerY, y2: centerY, class: "chartAxis"}));
    svg.append(svgTag("line", {x1: centerX, x2: centerX, y1: VECTOR_MARGIN, y2: VECTOR_HEIGHT - VECTOR_MARGIN, class: "chartAxis"}));

    vectors.forEach((vector, i) => {
        const tip = toSvg(vector);
        const colorClass = VECTOR_COLOR_CLASSES[i % VECTOR_COLOR_CLASSES.length];
        svg.append(svgTag("line", {
            x1: centerX, y1: centerY, x2: tip.x.toFixed(2), y2: tip.y.toFixed(2),
            class: `chartVectorArrow ${colorClass}`, "marker-end": `url(#chartArrowhead${i % VECTOR_COLOR_CLASSES.length})`,
        }));
        const pointsRight = tip.x >= centerX;
        const label = svgTag("text", {
            x: (tip.x + (pointsRight ? 6 : -6)).toFixed(2), y: (tip.y - 4).toFixed(2),
            class: `chartLabel ${colorClass}`, "text-anchor": pointsRight ? "start" : "end",
        });
        label.textContent = `(${vector.x}, ${vector.y})`;
        svg.append(label);
    });

    if (spec.label) {
        const caption = svgTag("text", {x: VECTOR_WIDTH / 2, y: 14, class: "chartLabel", "text-anchor": "middle"});
        caption.textContent = spec.label;
        svg.append(caption);
    }

    return svg;
}

/**
 * @brief Parses a comma-separated list of "étiquette=valeur" pairs,
 * e.g. "Pluie=0.8, Soleil=0.15, Neige=0.05".
 *
 * @param {string} barresSpec
 *
 * @returns {Array<{label: string, value: number}>}
 */
function parseBarList(barresSpec) {
    const entries = barresSpec.split(",").map(part => part.trim()).filter(Boolean);
    if (entries.length === 0) {
        throw new Error(`liste de barres invalide : "${barresSpec}" (attendu "étiquette=valeur, ...")`);
    }
    return entries.map(entry => {
        const eqIndex = entry.indexOf("=");
        if (eqIndex === -1) throw new Error(`barre invalide : "${entry}" (attendu "étiquette=valeur")`);
        const label = entry.slice(0, eqIndex).trim();
        const value = parseFloat(entry.slice(eqIndex + 1).trim());
        if (!label || !Number.isFinite(value) || value < 0) throw new Error(`barre invalide : "${entry}"`);
        return {label, value};
    });
}

const DISTRIBUTION_BAR_WIDTH_RATIO = 0.6;

/**
 * @brief Builds a vertical bar chart, one bar per entry of `barres`, with the y-axis
 * scaled to the largest bar (plus headroom) rather than a fixed range, so a distribution
 * far from its theoretical ceiling still fills the chart readably.
 *
 * @param {{barres: string, label?: string}} spec
 *
 * @returns {SVGElement}
 */
function renderDistributionChart(spec) {
    if (!spec.barres) throw new Error('le champ "barres" est requis (ex: "barres: Pluie=0.8, Soleil=0.15, Neige=0.05")');
    const bars = parseBarList(spec.barres);

    // `|| 1` guards the degenerate case where every bar is 0, avoiding a division by zero below.
    const maxValue = Math.max(...bars.map(b => b.value)) * 1.1 || 1;
    const plotWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
    const plotHeight = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
    const slotWidth = plotWidth / bars.length;
    const barWidth = slotWidth * DISTRIBUTION_BAR_WIDTH_RATIO;
    const barBottom = PLOT_MARGIN.top + plotHeight;
    const toSvgY = value => PLOT_MARGIN.top + plotHeight - (value / maxValue) * plotHeight;

    const svg = svgTag("svg", {
        viewBox: `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`,
        class: "chartSvg",
        role: "img",
        "aria-label": spec.label || `Distribution : ${bars.map(b => `${b.label} ${b.value}`).join(", ")}`,
    });

    svg.append(svgTag("line", {
        x1: PLOT_MARGIN.left, x2: PLOT_MARGIN.left + plotWidth, y1: barBottom, y2: barBottom, class: "chartAxis",
    }));

    const yStep = niceStep(maxValue);
    for (let tick = 0; tick <= maxValue + 1e-9; tick += yStep) {
        const sy = toSvgY(tick);
        svg.append(svgTag("line", {x1: PLOT_MARGIN.left - 4, x2: PLOT_MARGIN.left, y1: sy, y2: sy, class: "chartTick"}));
        const tickLabel = svgTag("text", {x: PLOT_MARGIN.left - 8, y: sy + 3, class: "chartTickLabel", "text-anchor": "end"});
        tickLabel.textContent = formatTick(tick);
        svg.append(tickLabel);
    }

    bars.forEach((bar, i) => {
        const slotCenter = PLOT_MARGIN.left + slotWidth * (i + 0.5);
        const barTop = toSvgY(bar.value);
        svg.append(svgTag("rect", {
            x: (slotCenter - barWidth / 2).toFixed(2), y: barTop.toFixed(2),
            width: barWidth.toFixed(2), height: (barBottom - barTop).toFixed(2), class: "chartBar",
        }));
        const valueLabel = svgTag("text", {x: slotCenter.toFixed(2), y: (barTop - 4).toFixed(2), class: "chartTickLabel", "text-anchor": "middle"});
        valueLabel.textContent = formatTick(bar.value);
        svg.append(valueLabel);
        const xLabel = svgTag("text", {x: slotCenter.toFixed(2), y: (barBottom + 14).toFixed(2), class: "chartTickLabel", "text-anchor": "middle"});
        xLabel.textContent = bar.label;
        svg.append(xLabel);
    });

    if (spec.label) {
        const caption = svgTag("text", {x: PLOT_WIDTH / 2, y: 14, class: "chartLabel", "text-anchor": "middle"});
        caption.textContent = spec.label;
        svg.append(caption);
    }

    return svg;
}

const CHART_RENDERERS = {
    "plot-fonction": renderFunctionPlot,
    "roue-chromatique": renderColorWheel,
    "vecteurs": renderVectorDiagram,
    "distribution": renderDistributionChart,
};

/**
 * @brief Builds a wrapper element to render in place of the fence, or null if `language`
 * isn't a registered chart kind (caller falls back to a regular code block).
 *
 * @param {string} language the fence's language tag
 * @param {string} rawText the fence's raw body (unparsed `key: value` spec lines)
 *
 * @returns {HTMLElement|null}
 */
export function renderChartBlock(language, rawText) {
    const renderer = CHART_RENDERERS[language];
    if (!renderer) return null;

    const wrapper = createTag("div", {class: `chartWrapper chartWrapper-${language}`});
    try {
        wrapper.append(renderer(parseSpec(rawText)));
    } catch (error) {
        console.error(`Erreur de rendu du graphique "${language}" :`, error);
        wrapper.classList.add("chartError");
        wrapper.textContent = `Erreur de rendu du graphique (${language}) : ${error.message}`;
    }
    return wrapper;
}
