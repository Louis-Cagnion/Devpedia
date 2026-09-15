---
order: 17
---

# Interceptar un setter de propiedad nativa: `Object.defineProperty`

El [capítulo anterior](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence) señala un límite de `MutationObserver`: escribir `miSelect.value = "x"` no dispara ninguna mutación detectable, ya que no toca ni un atributo HTML ni la estructura del DOM. Este capítulo cubre la técnica que permite pese a todo reaccionar a ese tipo de escritura: **redefinir el setter** de la propia propiedad.

## El problema concreto

Un componente "select personalizado" (un `<select>` nativo oculto, reemplazado visualmente por un menú desplegable casero) debe mantener su visualización sincronizada con el valor real del `<select>`. El problema: ese valor puede modificarse desde cualquier código ya existente del proyecto (`select.value = "x"`), sin que ninguno de esos llamadores necesite cambiar para avisar al componente.

```text
Codigo existente, en cualquier parte del proyecto:
    miSelect.value = "Renault";
                |
                v
    Ningun evento 'change' se dispara (no es una accion del usuario)
    Ninguna mutacion DOM detectable (ni atributo, ni estructura)
                |
                v
    La visualizacion del menu desplegable casero queda desincronizada
```

## La solución: redefinir el setter, conservar el getter nativo

`Object.defineProperty()` permite reemplazar el getter y/o el setter de una propiedad existente por una función personalizada. Aquí, solo el setter necesita interceptarse; el getter nativo se conserva tal cual:

```javascript
// Recupera el getter/setter nativos ANTES de reemplazarlos, para poder llamarlos despues
const propiedadNativa = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

Object.defineProperty(miSelect, 'value', {
    get() {
        return propiedadNativa.get.call(miSelect);   // comportamiento nativo sin cambios
    },
    set(nuevoValor) {
        propiedadNativa.set.call(miSelect, nuevoValor);   // escribe realmente el valor
        sincronizarVisualizacion();                         // + dispara la sincronizacion
    },
    configurable: true,
});
```

`Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')` recupera el getter/setter nativos de `<select>` **antes** de sobrescribirlos: sin este paso, el nuevo setter no tendría ninguna forma de escribir realmente el valor, solo de reaccionar a su cambio.

> **Trampa:** olvidar `configurable: true`. Sin esta opción, `Object.defineProperty()` deja la propiedad congelada para siempre: imposible redefinirla una segunda vez (por ejemplo para una prueba, u otro componente que quiera hacer lo mismo), y cualquier intento lanza un error.

## Alcance de la intercepción

Esta técnica redefine la propiedad en **una instancia concreta** (`miSelect`), no en `HTMLSelectElement.prototype`: todos los demás `<select>` de la página conservan su comportamiento nativo sin cambios, solo el explícitamente convertido en componente personalizado se ve afectado.

> **Buena práctica:** apuntar siempre a la instancia concreta en lugar del prototipo compartido (`HTMLSelectElement.prototype`) para este tipo de intercepción. Modificar el prototipo cambiaría el comportamiento de **todos** los `<select>` de la página, incluidos los que no tienen nada que ver con el componente en cuestión.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `Object.defineProperty()` reemplaza el getter/setter de una propiedad existente, lo que permite reaccionar a una escritura que un `MutationObserver` no puede detectar (una propiedad JS asignada directamente, sin pasar por un atributo HTML). |
| **Herramientas utilizables** | `Object.defineProperty()`, `Object.getOwnPropertyDescriptor()` para conservar el comportamiento nativo antes de reemplazarlo. |
| **Trampas a evitar** | Olvidar `configurable: true` (deja la propiedad imposible de redefinir después). Modificar el prototipo compartido en lugar de una instancia concreta. |
| **Buenas prácticas** | Recuperar siempre el descriptor nativo antes de reemplazarlo, para poder seguir escribiendo el valor real desde el nuevo setter. Apuntar a la instancia, nunca al prototipo compartido, para una intercepción localizada a un solo elemento. |
