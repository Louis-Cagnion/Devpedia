---
order: 18
---

# The Google Maps JavaScript API

Displaying an interactive map in a web page (markers, a navigable base map) normally requires loading a third-party library. This chapter covers the [Google Maps](https://developers.google.com/maps/documentation/javascript) JavaScript API, with its official deferred loading, visual grouping of numerous markers, and the two ways to draw a marker.

## Loading the library on demand: `importLibrary()`

A full Google Maps setup uses several independent sub-libraries (`maps` for the map itself, `marker` for markers...), each useless until actually needed. Rather than loading them all at once when the page loads, Google provides a small startup script (*bootstrap loader*): it only loads the real API script on the first call to `google.maps.importLibrary()`, and caches subsequent calls.

```javascript
// Loads only the requested sub-libraries, the first time they're needed
const { Map } = await google.maps.importLibrary('maps');
const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
```

> **Note:** this startup script is provided as-is by Google (to paste into the page), deliberately minified and condensed into a single expression: there's no point rewriting it by hand, only understanding what it does once expanded, as above.

## Grouping numerous markers: clustering

Displaying hundreds of markers close to each other, at a low zoom level, makes the map unreadable (overlapping markers). A **clustering** library like [`@googlemaps/markerclusterer`](https://github.com/googlemaps/js-markerclusterer) replaces a group of nearby markers with a single badge showing their count, which automatically splits apart when zooming in:

```javascript
const clusterer = new markerClusterer.MarkerClusterer({
    map,
    markers: markerList,
});
```

Clustering works by **on-screen position**, recomputed on every zoom change: it needs no distance or threshold configuration to work correctly in the common case.

## Spreading out strictly co-located markers

Clustering solves readability at a distance, but not a specific case: several entries sharing the exact **same** coordinates (for example, several listings for the same establishment). Even zoomed all the way in, one marker would stay invisible under another, strictly overlapping, with no click ever able to reach it. The fix is to offset each co-located marker along a small circle, at a fixed radius:

```javascript
const SPREAD_RADIUS = 0.00020;   // ~20m at the equator

function spreadOutColocated(points) {
    const groups = new Map();
    points.forEach(p => {
        const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p);
    });

    groups.forEach(group => {
        if (group.length <= 1) return;
        const n = group.length;
        // Longitude correction based on latitude (otherwise the circles stretch north-south)
        const lonScale = 1 / Math.max(0.1, Math.cos(group[0].lat * Math.PI / 180));
        group.forEach((point, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            point.lat += SPREAD_RADIUS * Math.sin(angle);
            point.lng += SPREAD_RADIUS * Math.cos(angle) * lonScale;
        });
    });
}
```

> **Pitfall:** forgetting the longitude correction (`lonScale`). A degree of longitude doesn't cover the same real distance depending on latitude (it shrinks moving away from the equator, down to 0 at the poles): without this correction, the spread circle visually stretches from north to south instead of staying a true circle on screen.

## Two ways to draw a marker

The Google Maps API offers two rendering paths for a marker, with different capabilities:

| | `google.maps.Marker` (legacy) | `AdvancedMarkerElement` |
|---|---|---|
| Rendering | Fixed SVG image | Customizable [HTML](/?c=langages&s=html&p=html) element (`content`) |
| Customization | Limited (icon, color) | Total (CSS, animations, dynamic content) |
| Prerequisite | None | A map style identifier (*Map ID*) configured on the Google Cloud side |

```javascript
// AdvancedMarkerElement: free HTML content
const el = document.createElement('div');
el.className = 'my-animated-marker';
new AdvancedMarkerElement({ map, position, content: el });

// google.maps.Marker (legacy): fixed SVG rendering, no configuration prerequisite
new google.maps.Marker({ map, position, icon: mySvgIcon });
```

> **Best practice:** switch dynamically between the two depending on whether a *Map ID* is configured, rather than depending on a single rendering path: `AdvancedMarkerElement` when available (full customization), `google.maps.Marker` as a fallback otherwise, without breaking anything for a deployment that doesn't yet have that configuration.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `google.maps.importLibrary()` loads each sub-library on demand, once. A clusterer visually groups nearby markers; a circular spread (with longitude correction) separates strictly co-located markers. `AdvancedMarkerElement` allows customizable HTML rendering, `google.maps.Marker` a fixed SVG rendering with no prerequisite. |
| **Tools you can use** | `google.maps.importLibrary()`, `@googlemaps/markerclusterer` (`MarkerClusterer`), `AdvancedMarkerElement`/`google.maps.Marker`. |
| **Pitfalls to avoid** | Loading every sub-library at once rather than on demand. Forgetting the longitude correction when spreading out co-located points. |
| **Best practices** | Group numerous markers via clustering rather than letting them overlap visually. Switch between `AdvancedMarkerElement` and `google.maps.Marker` depending on available configuration, rather than depending on a single path. |
