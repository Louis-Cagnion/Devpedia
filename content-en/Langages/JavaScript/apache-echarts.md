---
order: 21
---

# The Apache ECharts charting library

Drawing a chart (bars, lines, pie slices) by hand on a [`<canvas>`](/?c=langages&s=javascript&p=canvas-2d-et-animations) means drawing every element yourself: axes, scale, curves, legend, hover tooltip. This chapter covers [Apache ECharts](https://echarts.apache.org/), a JavaScript charting library that replaces this manual drawing with a single configuration object.

## Declarative configuration instead of manual drawing

ECharts takes as input an object that describes the desired result (**declarative** approach), not the steps to get there (**imperative** approach, the one used by canvas): the library calculates the positions, scale and rendering itself.

| | Canvas 2D (imperative) | ECharts (declarative) |
|---|---|---|
| What you write | Every drawing instruction (`fillRect`, `moveTo`, `lineTo`...) | A configuration object (`option`) describing the desired result |
| Updating a value | Clear then redraw the whole area yourself | `chart.setOption()` with only the new data |
| Hover tooltip | Coded by hand (position detection, display) | Included, enabled with the `tooltip` key |

## Initializing a chart on a container

`echarts.init()` attaches a chart to a [DOM](/?c=langages&s=javascript&p=dom-et-evenements) element (an empty tag, with a size set in CSS); `setOption()` then applies a configuration to it:

```javascript
const chart = echarts.init(document.querySelector('#my-chart'));

const option = {
    xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },   // categories shown on the horizontal axis
    yAxis: { type: 'value' },                                      // numeric vertical axis, automatic scale
    tooltip: {},                                                   // tooltip shown when hovering a bar
    series: [{ type: 'bar', data: [120, 200, 150, 80] }]           // one "series" = one set of bars/points to draw
};

chart.setOption(option);   // applies the configuration: the chart draws itself
```

> **Best practice:** an `option` stays an ordinary JavaScript object, built dynamically from the real data (an [API](/?c=infrastructure&p=api-et-http) response, a computation) rather than hardcoded: build its keys (`xAxis.data`, `series[].data`) from the data to display, never the other way around.

## Updating data without redrawing everything: `setOption()`

Calling `setOption()` with a partial object merges the new values into the existing configuration: only the changed parts are recalculated and redrawn, without rebuilding the axes or the legend from scratch.

```javascript
// Adds a fifth category and its value, without recreating the whole chart
chart.setOption({
    xAxis: { data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'] },
    series: [{ data: [120, 200, 150, 80, 175] }]
});
```

## Adapting the chart to its container's size: `resize()`

By default, an ECharts chart keeps the size it had at initialization: resizing the window doesn't resize it on its own. You need to listen to the [`resize` event](/?c=langages&s=javascript&p=dom-et-evenements#listen-to-events) and explicitly request a new size calculation:

```javascript
window.addEventListener('resize', () => chart.resize());
```

> **Pitfall:** forgetting this listener. The container (a `<div>`) does follow the page's responsive CSS, but the chart drawn inside it stays frozen at its original size: an empty area appears next to it, or the chart overflows a container that has become smaller.

## Freeing memory when the chart disappears: `dispose()`

In a [single-page application (SPA)](/?c=langages&s=javascript&p=ssr-vs-csr#csr-the-server-sends-an-empty-shell), a chart component is created and destroyed on every navigation. Removing the `<div>` from the [DOM](/?c=langages&s=javascript&p=dom-et-evenements) isn't enough to free the chart: `echarts.init()` registered its own resize handler and allocated rendering resources, which stay active until `chart.dispose()` has been explicitly called.

```javascript
chart.dispose();   // call before removing the container from the DOM
```

> **Pitfall:** a chart component that gets destroyed without calling `dispose()` accumulates one ghost chart per navigation: the `resize` listener set up above keeps running on a chart that no longer visually exists, a classic memory leak in a frequently-navigated SPA.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | ECharts describes a chart with a single `option` object (`series`, `xAxis`/`yAxis`, `tooltip`) rather than drawing instructions (declarative vs. imperative approach). `echarts.init()` attaches it to a DOM element, `setOption()` displays or partially updates it. |
| **Usable tools** | `echarts.init()`, `chart.setOption()`, `chart.resize()`, `chart.dispose()`. |
| **Pitfalls to avoid** | Forgetting to listen for `resize` (chart frozen at its initial size). Forgetting `dispose()` before removing the container from the DOM (memory leak, especially in an SPA). |
| **Best practices** | Generate the `option` object dynamically from the real data rather than hardcoding it. Update an existing chart via a partial `setOption()` rather than recreating it entirely. |
