---
order: 17
---

# Intercepting a native property setter: `Object.defineProperty`

The [previous chapter](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence) notes a limit of `MutationObserver`: writing `mySelect.value = "x"` triggers no detectable mutation, since it touches neither an HTML attribute nor the DOM's structure. This chapter covers the technique that still allows reacting to that kind of write: **redefining the setter** of the property itself.

## The concrete problem

A "custom select" component (a hidden native `<select>`, visually replaced by a homemade dropdown menu) has to keep its display in sync with the `<select>`'s real value. The problem: that value can be modified from any existing code in the project (`select.value = "x"`), without any of those callers needing to change to notify the component.

```text
Existing code, anywhere in the project:
    mySelect.value = "Renault";
                |
                v
    No 'change' event fires (this isn't a user action)
    No detectable DOM mutation (neither attribute nor structure)
                |
                v
    The homemade dropdown's display stays out of sync
```

## The fix: redefine the setter, keep the native getter

`Object.defineProperty()` lets you replace the getter and/or setter of an existing property with a custom function. Here, only the setter needs intercepting; the native getter is kept as-is:

```javascript
// Grabs the native getter/setter BEFORE replacing them, so they can still be called afterward
const nativeProperty = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

Object.defineProperty(mySelect, 'value', {
    get() {
        return nativeProperty.get.call(mySelect);   // native behavior unchanged
    },
    set(newValue) {
        nativeProperty.set.call(mySelect, newValue);   // actually writes the value
        syncDisplay();                                  // + triggers the sync
    },
    configurable: true,
});
```

`Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')` grabs `<select>`'s native getter/setter **before** overwriting them: without this step, the new setter would have no way to actually write the value, only to react to its change.

> **Pitfall:** forgetting `configurable: true`. Without this option, `Object.defineProperty()` makes the property permanently frozen: impossible to redefine it a second time (for a test, for example, or another component that wants to do the same thing), and any attempt throws an error.

## Scope of the interception

This technique redefines the property on **one specific instance** (`mySelect`), not on `HTMLSelectElement.prototype`: every other `<select>` on the page keeps its native behavior unchanged, only the one explicitly turned into a custom component is affected.

> **Best practice:** always target the specific instance rather than the shared prototype (`HTMLSelectElement.prototype`) for this kind of interception. Modifying the prototype would change the behavior of **every** `<select>` on the page, including ones that have nothing to do with the component in question.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `Object.defineProperty()` replaces an existing property's getter/setter, which lets you react to a write that a `MutationObserver` cannot detect (a JS property assigned directly, without going through an HTML attribute). |
| **Tools you can use** | `Object.defineProperty()`, `Object.getOwnPropertyDescriptor()` to preserve the native behavior before replacing it. |
| **Pitfalls to avoid** | Forgetting `configurable: true` (makes the property impossible to redefine afterward). Modifying the shared prototype rather than one specific instance. |
| **Best practices** | Always grab the native descriptor before replacing it, so the new setter can still write the real value. Target the instance, never the shared prototype, for an interception localized to a single element. |
