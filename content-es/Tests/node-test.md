---
order: 13
---

# El ejecutor de pruebas integrado de Node: node:test (31/10/2026)

**Node.js** ([nodejs.org](https://nodejs.org)) es el programa que ejecuta JavaScript fuera de un navegador, directamente desde la terminal. Incluye de serie un **ejecutor de pruebas**: una herramienta que encuentra los archivos de prueba, los ejecuta, compara los resultados con los valores esperados y muestra un informe. Se llama `node:test` y no requiere ninguna instalación adicional. Su documentación oficial es [la página node:test de Node.js](https://nodejs.org/api/test.html).

Este capítulo complementa [las pruebas unitarias](/?c=tests&p=tests-unitaires), que explican qué es una buena prueba, y [las pruebas end-to-end](/?c=tests&p=tests-end-to-end), que simulan un recorrido completo. El capítulo sobre [el navegador sin ventana](/?c=tests&p=tests-navigateur-sans-fenetre) escribió su propio pequeño ejecutor a mano: `node:test` ofrece todo eso ya listo (informe, código de salida, filtros), y puede perfectamente servir de base a ese tipo de serie. Supone conocidos [la terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben los comandos), [un editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions), [los errores](/?c=langages&s=javascript&p=gestion-des-erreurs) (`throw`, `try`, `catch`) y [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) (`async`, `await`, promesas).

La fecha del título es la de la verificación: los ejemplos se ejecutaron todos ese día, y algunas opciones (la cobertura, en particular) pueden cambiar de una versión de Node a otra.

## El principio: un comando, un informe, un código

```text
  archivos *.test.mjs         node --test                     terminal
 ┌───────────────────┐   ┌───────────────────────┐   ┌─────────────────────────┐
 │ test("...", ...)  │-->│ 1. busca los archivos  │-->│ ✔ prueba superada       │
 │ test("...", ...)  │   │ 2. ejecuta cada prueba │   │ ✖ error + detalle       │
 └───────────────────┘   │ 3. cuenta resultados   │   │ resumen: pass / fail    │
                         └───────────┬───────────┘   └─────────────────────────┘
                                     v
                          código de salida: 0 o 1
```

Una **prueba** es una pequeña función que prepara una situación, llama al código que se quiere verificar y compara el resultado con el que se espera. Una prueba tiene éxito si no lanza ningún error, y falla si lanza uno. El **código de salida** es el número que un programa devuelve al terminar: `0` significa «todo va bien», cualquier otro valor señala un fallo. Es ese número, y solo ese, el que lee un script o un servidor de integración continua para decidir si las pruebas han pasado.

| Necesidad | Lo que aporta `node:test` | Equivalente que instalar en otra parte |
|---|---|---|
| Declarar pruebas | `test`, `describe`, `it` | Jest, Mocha, Vitest |
| Comparar valores | `node:assert/strict` (incluido con Node) | Chai, `expect` de Jest |
| Preparar y limpiar | `before`, `after`, `beforeEach`, `afterEach` | los mismos nombres en otros sitios |
| Sustituir una función | `mock.fn`, `mock.method` | `jest.fn`, Sinon |
| Medir la cobertura | opción `--experimental-test-coverage` | nyc, c8 |
| Elegir el formato del informe | opción `--test-reporter` | plugins de informe |

## Preparar una carpeta y un primer módulo

Cree una carpeta vacía, abra en ella una terminal y cree el archivo que aparece más abajo. Un **módulo** es un archivo JavaScript que pone herramientas a disposición de otros archivos: `export` hace visible una función desde fuera, `import` va a buscar la de otro archivo. La extensión `.mjs` indica a Node que el archivo usa esa sintaxis, sin ningún otro ajuste. La función probada calcula un precio tras un descuento y rechaza un porcentaje absurdo.

```javascript
// remise.mjs
// Calcula el precio tras el descuento; rechaza un porcentaje fuera de 0 a 100
export function calcularDescuento(precio, porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) {          // porcentaje imposible
        throw new RangeError("porcentaje fuera de 0 a 100");   // error con nombre RangeError
    }
    return precio * (1 - porcentaje / 100);            // 10 %: precio * 0,9
}
```

## Una primera prueba

El archivo siguiente importa `test` desde `node:test` (el prefijo `node:` designa una herramienta incluida con Node, por oposición a un archivo suyo), el comparador `assert` (de «assert», que en inglés significa «afirmar»), y luego la función probada. Una **aserción** es una frase que afirma que algo es verdadero; si es falsa, lanza un error y la prueba falla. El módulo `node:assert/strict` añade el modo **estricto**: `1` y `"1"` se consideran distintos, lo que evita malas sorpresas.

```javascript
// remise.test.mjs
import test from "node:test";                    // la función test, aportada por Node
import assert from "node:assert/strict";         // las aserciones, en modo estricto
import { calcularDescuento } from "./remise.mjs";   // la función que hay que verificar

// Arrange: los valores están escritos en la llamada; Act: llamamos a calcularDescuento;
// Assert: equal compara el resultado obtenido (1er argumento) con el esperado (2.º)
test("10 % de descuento sobre 100 dan 90", () => {
    assert.equal(calcularDescuento(100, 10), 90);
});
```

La estructura Arrange / Act / Assert (preparar, actuar, verificar) se detalla en el capítulo sobre [las pruebas unitarias](/?c=tests&p=tests-unitaires). Ejecute después:

```bash
# verifica la sintaxis de los dos archivos, sin ejecutar nada
node --check remise.mjs
node --check remise.test.mjs
# ejecuta todas las pruebas de la carpeta actual
node --test
# muestra el código de salida del comando anterior
echo $?
```

Salida observada en una terminal (las duraciones varían de una ejecución a otra):

```text
✔ 10 % de descuento sobre 100 dan 90 (0.517131ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.865271
```

El código de salida que mostró `echo $?` era `0`. Las líneas `ℹ` forman el resumen: `pass` cuenta los éxitos, `fail` los fallos, `skipped` las pruebas omitidas, `todo` las pruebas marcadas «pendientes».

## Cómo encuentra Node los archivos de prueba

`node --test` sin nombre de archivo explora la carpeta actual y sus subcarpetas. No lanza todos los archivos JavaScript, solo los cuyo nombre sigue una convención. Esta tabla viene de pruebas reales: cinco archivos colocados uno junto a otro, y solo uno no fue encontrado.

| Archivo | ¿Lo encuentra `node --test`? | Por qué |
|---|---|---|
| `remise.test.mjs` | sí | el nombre termina en `.test` |
| `mon-test.mjs` | sí | el nombre termina en `-test` |
| `test/a.mjs` | sí | cualquier archivo de una carpeta llamada `test` |
| `b.spec.mjs` | no | `.spec` no se reconoce por defecto |
| `remise.mjs` | no | no es un archivo de prueba (solo se importa) |

Para ejecutar un archivo concreto, aunque no tenga un nombre reconocido, dé su ruta: `node --test b.spec.mjs` lo ejecuta (observado).

## Cuando una prueba falla

Cambiemos el valor esperado por uno falso a propósito (20 % de 50 dan 40, no 35):

```javascript
// echec.test.mjs
import test from "node:test";                    // la función test
import assert from "node:assert/strict";         // las aserciones estrictas
import { calcularDescuento } from "./remise.mjs";   // la función que hay que verificar

test("20 % de descuento sobre 50 dan 35 (falso a propósito)", () => {
    assert.equal(calcularDescuento(50, 20), 35);    // se obtiene 40, se espera 35: fallo
});
```

Salida observada (inicio del detalle; el resto es una lista de las llamadas internas de Node, la «pila de llamadas», que indica dónde nació el error):

```text
✖ 20 % de descuento sobre 50 dan 35 (falso a propósito) (0.952109ms)
ℹ tests 1
ℹ fail 1
✖ failing tests:

test at echec.test.mjs:5:1
✖ 20 % de descuento sobre 50 dan 35 (falso a propósito) (0.952109ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  40 !== 35
```

El mensaje de Node está en inglés: `Expected values to be strictly equal` significa «los valores deberían ser estrictamente iguales». La línea `40 !== 35` muestra a la izquierda el valor obtenido y a la derecha el valor esperado. El código de salida era `1`: es lo que hace «ponerse rojo» a un servidor de integración continua.

## Organizar: `test`, `describe` e `it`

`describe` («describir») agrupa pruebas en una **suite** (un grupo con nombre); `it` («debería») declara una prueba dentro de él. `it` y `test` hacen exactamente el mismo trabajo: `describe` e `it` se leen como una frase («describir calcularDescuento: aplica 10 % sobre 100»).

| Función | Papel | Ejemplo de lectura |
|---|---|---|
| `test(nombre, función)` | declara una prueba suelta | «prueba: 10 % sobre 100 dan 90» |
| `it(nombre, función)` | declara una prueba, igual que `test` | «aplica 10 % sobre 100» |
| `describe(nombre, función)` | agrupa pruebas en una suite | «describir calcularDescuento» |
| `it(nombre, { skip: "motivo" }, f)` | omite la prueba y muestra el motivo | «todavía no escrita» |
| `it(nombre, { todo: "motivo" }, f)` | marca «pendiente»: se ejecuta, pero no cuenta como éxito | «por terminar» |

Esta es una suite completa, con los casos límite (cero, cien, valores prohibidos) vistos en [las pruebas unitarias](/?c=tests&p=tests-unitaires). Reemplace el contenido de `remise.test.mjs`:

```javascript
// remise.test.mjs
import { describe, it } from "node:test";        // describe agrupa, it declara una prueba
import assert from "node:assert/strict";         // las aserciones estrictas
import { calcularDescuento } from "./remise.mjs";   // la función que hay que verificar

describe("calcularDescuento", () => {            // la suite lleva el nombre de la función
    it("aplica 10 % sobre 100", () => {
        assert.equal(calcularDescuento(100, 10), 90);       // caso normal
    });

    it("no cambia nada con 0 %", () => {
        assert.equal(calcularDescuento(80, 0), 80);         // límite inferior
    });

    it("devuelve 0 con 100 %", () => {
        assert.equal(calcularDescuento(80, 100), 0);        // límite superior
    });

    it("rechaza un porcentaje negativo", () => {
        // throws espera un error; RangeError precisa cuál
        assert.throws(() => calcularDescuento(80, -5), RangeError);
    });

    it("rechaza un porcentaje por encima de 100", () => {
        assert.throws(
            () => calcularDescuento(80, 101),                 // la llamada que debe fallar
            { name: "RangeError", message: "porcentaje fuera de 0 a 100" },   // error exacto
        );
    });
});
```

Salida observada: `describe` muestra un título `▶ calcularDescuento`, las cinco pruebas con sangría y `✔`, y el resumen `tests 5`, `suites 1`, `pass 5`, `fail 0`.

## Las aserciones de `node:assert/strict`

Cada aserción compara valores y lanza un error si la comparación es falsa. Todas las de la tabla se ejecutaron.

| Aserción | Verifica | Ejemplo que tiene éxito |
|---|---|---|
| `equal(a, b)` | `a` y `b` son estrictamente iguales (números, textos) | `assert.equal(1 + 1, 2)` |
| `notEqual(a, b)` | `a` y `b` son distintos | `assert.notEqual(1, "1")` |
| `ok(valor)` | el valor es «verdadero» | `assert.ok("texto".includes("ex"))` |
| `deepEqual(a, b)` | dos objetos o listas tienen el mismo **contenido** | `assert.deepEqual({ a: 1 }, { a: 1 })` |
| `match(texto, patrón)` | el texto corresponde a una [expresión regular](/?c=langages&s=javascript&p=regex) | `assert.match("ref-042", /^ref-\d+$/)` |
| `throws(función, error)` | la llamada lanza el error esperado | `assert.throws(() => JSON.parse("{"), SyntaxError)` |
| `rejects(promesa, error)` | la promesa falla con el error esperado | véase la sección siguiente |

Dos sutilezas, verificadas por ejecución. `assert.equal({ a: 1 }, { a: 1 })` **falla**: dos objetos distintos son dos «cajas» diferentes aunque su contenido sea idéntico, y `equal` compara las cajas. Para comparar el contenido, use `deepEqual`. Y `deepEqual` en modo estricto distingue `[1]` de `["1"]`. La lista completa está en la [documentación de node:assert](https://nodejs.org/api/assert.html).

## Probar código asíncrono

Una operación **asíncrona** devuelve su resultado más tarde (lectura de un archivo, llamada de red): devuelve una **promesa**, un objeto que representa ese resultado futuro (véase [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone)). Si la función de una prueba se declara `async`, Node espera a que termine antes de juzgar la prueba. Cree primero el código que se va a probar:

```javascript
// utilisateurs.mjs
// Busca un usuario; la «base» es aquí un simple objeto en memoria
const BASE = { 1: "Ada", 2: "Linus" };                   // número -> nombre

export async function buscarNombre(id) {
    await new Promise((resolve) => setTimeout(resolve, 10));   // simula 10 ms de espera
    if (!(id in BASE)) {                                 // número ausente de la base
        throw new Error(`usuario ${id} no encontrado`);   // en async: promesa rechazada
    }
    return BASE[id];                                     // el nombre encontrado
}
```

```javascript
// asynchrone.test.mjs
import test from "node:test";                        // la función test
import assert from "node:assert/strict";             // las aserciones estrictas
import { buscarNombre } from "./utilisateurs.mjs";   // la función asíncrona a verificar

test("encuentra a Ada", async () => {              // async: Node espera el final de la prueba
    const nombre = await buscarNombre(1);            // await: esperamos el resultado real
    assert.equal(nombre, "Ada");                     // luego lo comparamos
});

test("señala un usuario desconocido", async () => {
    // rejects verifica que una promesa falla; el await es indispensable
    await assert.rejects(buscarNombre(99), { message: "usuario 99 no encontrado" });
});
```

Salida observada: las dos pruebas muestran `✔` (unos 11 ms cada una, el tiempo de la espera simulada) y el resumen indica `pass 2`.

## Preparar y limpiar: los hooks

Un **hook** («gancho») es una función que el ejecutor llama automáticamente en un momento preciso, para evitar copiar la misma preparación en cada prueba. El archivo siguiente prueba un pequeño carrito de compra, con un carrito nuevo antes de cada prueba:

```javascript
// panier.mjs
// Un carrito de compra: una lista de artículos con un total
export class Carrito {
    articulos = [];                                  // la lista de { nombre, precio }

    agregar(nombre, precio) {
        this.articulos.push({ nombre, precio });     // añade un artículo al final
    }

    get total() {                                    // se lee como carrito.total, sin ()
        return this.articulos.reduce((suma, articulo) => suma + articulo.precio, 0);
    }

    get cantidad() {                                 // número de artículos
        return this.articulos.length;
    }
}
```

```javascript
// hooks.test.mjs
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";             // las aserciones estrictas
import { Carrito } from "./panier.mjs";              // la clase que hay que verificar

describe("Carrito", () => {
    let carrito;                                     // se recreará antes de cada prueba

    before(() => console.log("[before] una vez, antes de todas las pruebas"));
    after(() => console.log("[after] una vez, después de todas las pruebas"));
    beforeEach(() => {
        carrito = new Carrito();                     // un carrito nuevo para cada prueba
        console.log("[beforeEach] carrito nuevo");
    });
    afterEach(() => console.log("[afterEach] limpieza"));

    it("empieza vacío", () => {
        assert.equal(carrito.cantidad, 0);           // ningún artículo al principio
    });

    it("suma los precios", () => {
        carrito.agregar("bolígrafo", 2);             // 2
        carrito.agregar("cuaderno", 5);              // 5
        assert.equal(carrito.total, 7);              // 2 + 5
    });

    it("no conserva nada de la prueba anterior", () => {
        assert.equal(carrito.cantidad, 0);           // el carrito anterior ha desaparecido
    });
});
```

| Hook | Momento de llamada | Uso típico |
|---|---|---|
| `before` | una vez, antes de la primera prueba de la suite | abrir un recurso costoso (conexión, archivo temporal) |
| `beforeEach` | antes de cada prueba | recrear un objeto nuevo (el carrito) |
| `afterEach` | después de cada prueba | borrar lo que la prueba ha dejado |
| `after` | una vez, después de la última prueba | cerrar el recurso abierto por `before` |

Salida observada: las 8 líneas `[before]`, `[beforeEach]`, `[afterEach]`, `[after]` aparecen en el orden esperado (un `before`, luego tres veces el par `beforeEach` y `afterEach`, y un `after`), pero **antes** del árbol de `✔`, porque el informe `spec` se imprime en bloque al final de la suite. Las tres pruebas tuvieron éxito.

## Reemplazar una dependencia por una función espía

Un **mock** («simulacro») es un falso componente que sustituye a uno real; una **función espía** (*spy*) es un mock que se limita a anotar cómo fue llamado. El capítulo sobre [los mocks, stubs y fakes](/?c=tests&p=mocks-stubs-et-fakes-en-detail) explica sus familias y la trampa de la sobresimulación. Aquí, `mock.fn()` crea el espía: la función `recordar` recibe `enviar` como argumento, y se le da un falso que no envía nada, así que ningún correo y ninguna red.

```javascript
// mock.test.mjs
import { describe, it, mock } from "node:test";      // mock aporta las funciones espía
import assert from "node:assert/strict";             // las aserciones estrictas

// Envía un recordatorio a cada rezagado mediante la función «enviar» recibida como argumento
function recordar(rezagados, enviar) {
    for (const persona of rezagados) {               // un mensaje por persona
        enviar(persona.email, `Hola ${persona.nombre}, recuerde devolver el libro.`);
    }
    return rezagados.length;                         // número de mensajes enviados
}

describe("recordar", () => {
    it("envía un mensaje por rezagado, sin red", () => {
        const enviar = mock.fn();                    // espía: no hace nada, lo anota todo
        const lista = [
            { nombre: "Ada", email: "ada@example.org" },
            { nombre: "Linus", email: "linus@example.org" },
        ];

        const total = recordar(lista, enviar);       // pasamos el espía en lugar del real

        assert.equal(total, 2);                      // dos personas, dos mensajes
        assert.equal(enviar.mock.callCount(), 2);    // el espía fue llamado dos veces
        assert.deepEqual(enviar.mock.calls[0].arguments, [   // argumentos de la 1.ª llamada
            "ada@example.org",
            "Hola Ada, recuerde devolver el libro.",
        ]);
    });

    it("puede devolver un valor elegido", () => {
        const decir = mock.fn(() => "hola");         // mock.fn acepta un sustituto
        assert.equal(decir(), "hola");               // el sustituto responde
        assert.equal(decir.mock.callCount(), 1);     // y el espía contó la llamada
    });

    it("sustituye fetch para evitar la red", async (t) => {
        // fetch es la función de Node que envía una petición por la red;
        // t.mock la reemplaza solo durante la prueba
        t.mock.method(globalThis, "fetch", async () => ({
            ok: true,                                // falsa respuesta correcta
            json: async () => ({ nombre: "Ada" }),   // falsa lectura del contenido
        }));

        const respuesta = await fetch("https://exemple.invalid/api");   // dirección ficticia
        const datos = await respuesta.json();        // lee la falsa respuesta

        assert.equal(datos.nombre, "Ada");           // contenido de la falsa respuesta
        assert.equal(fetch.mock.callCount(), 1);     // una sola llamada ha tenido lugar
    });
});

it("fetch se restaura tras la prueba", () => {
    assert.equal(fetch.mock, undefined);             // ya no hay espía: está el fetch real
});
```

| Herramienta | Qué hace | Restauración |
|---|---|---|
| `mock.fn()` | crea una función espía, con o sin sustituto | nada que restaurar: es una función nueva |
| `mock.method(objeto, "nombre", sustituto)` | sustituye un método existente | a mano: `mock.restoreAll()` |
| `t.mock.method(...)` | igual, ligado a la prueba `t` | automática al final de la prueba |
| `espía.mock.callCount()` | número de llamadas | sin objeto |
| `espía.mock.calls[i].arguments` | lista de los argumentos de la i-ésima llamada | sin objeto |

Salida observada: las cuatro pruebas tuvieron éxito, incluida la última, que demuestra que `t.mock` devolvió el verdadero `fetch`. La dirección `exemple.invalid` no existe: si la sustitución hubiera fallado, la prueba lanzaría un error de red en lugar de pasar.

## Ejecutar solo algunas pruebas

| Opción o ajuste | Efecto | Observado |
|---|---|---|
| `node --test archivo.test.mjs` | ejecuta solo ese archivo | sí |
| `--test-name-pattern="suma"` | ejecuta solo las pruebas cuyo nombre contiene `suma` (patrón de [expresión regular](/?c=langages&s=javascript&p=regex)) | sí: 1 prueba de 4 |
| `--test-name-pattern="^matemáticas"` | apunta a una suite entera por su nombre | sí: las 4 pruebas de la suite |
| `{ only: true }` + `--test-only` | ejecuta solo las pruebas marcadas `only` | sí: `uno` se ejecuta, `dos` no |
| `{ skip: "motivo" }` | omite una prueba y muestra el motivo | sí: símbolo `﹣` |
| `{ todo: "motivo" }` | marca «pendiente» sin contar un éxito | sí: contado en `todo` |

Trampa de orden: dentro de un archivo, las pruebas se ejecutan en el orden en que se escribieron, pero un filtro salta algunas. Una prueba que cuenta con el estado dejado por una anterior puede, por tanto, acertar o fallar según el filtro (véase [Las trampas](#las-trampas)).

## Elegir el formato del informe y leer el código de salida

Un **informe** (*reporter*) es el formato en el que el ejecutor escribe sus resultados. La opción `--test-reporter=<nombre>` lo elige. Observado: en una terminal, el formato por defecto es `spec` (legible, con `✔` y `✖`); cuando la salida se redirige a un archivo o a otro programa, el formato por defecto es `tap`.

| Informe | Aspecto | Uso |
|---|---|---|
| `spec` | árbol con `✔` y `✖`, resumen al final | lectura humana en la terminal |
| `tap` | líneas `ok 1 - nombre` y `not ok 1 - nombre`, detalles con sangría | lectura por un programa |
| `dot` | un punto por prueba superada (`.....` observado para 4 pruebas) | suites muy largas |

**TAP** (*Test Anything Protocol*, «protocolo para probar cualquier cosa») es un formato de texto simple, comprendido por muchas herramientas de integración continua. Extracto observado de `node --test --test-reporter=tap`:

```text
TAP version 13
# Subtest: matemáticas
ok 1 - matemáticas
1..1
# tests 4
# suites 1
# pass 2
# fail 0
# cancelled 0
# skipped 1
# todo 1
```

| Situación | Código de salida observado |
|---|---|
| todas las pruebas tienen éxito | `0` |
| al menos una prueba falla | `1` |
| umbral de cobertura no alcanzado | `1` |

En un script, `node --test && echo "verde"` muestra «verde» solo si el código es `0`. En un `package.json` (el archivo que describe un proyecto Node), la línea `"test": "node --test"` dentro de la sección `scripts` permite después ejecutar `npm test`; este comando no se ejecutó para este capítulo.

## Medir la cobertura

La [cobertura de código](/?c=tests&p=couverture-de-code) mide la parte del código ejecutada durante las pruebas. Node puede calcularla sin herramienta externa, con la opción `--experimental-test-coverage` (la palabra «experimental» indica que su comportamiento puede cambiar: por eso el capítulo lleva fecha). Con la única prueba `10 % sobre 100` de la sección anterior y la función `calcularDescuento`, observado:

```bash
# ejecuta las pruebas y añade una tabla de cobertura al final del informe
node --test --experimental-test-coverage
```

```text
ℹ start of coverage report
ℹ ----------------------------------------------------------------
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ ----------------------------------------------------------------
ℹ remise.mjs      |  71.43 |    66.67 |  100.00 | 4-5
ℹ remise.test.mjs | 100.00 |   100.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ all files       |  85.71 |    80.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ end of coverage report
```

| Columna | Significado en este ejemplo |
|---|---|
| `line %` | parte de las líneas ejecutadas: 71,43 % para `remise.mjs` |
| `branch %` | parte de los caminos (los dos lados de un `if`) recorridos |
| `funcs %` | parte de las funciones llamadas al menos una vez |
| `uncovered lines` | líneas nunca ejecutadas: `4-5` es el `throw` del porcentaje prohibido |

El archivo de prueba aparece también en la tabla (100 %): distorsiona la media `all files`. La opción `--test-coverage-lines=90` fija un mínimo: con 85,71 %, Node mostró `85.71% line coverage does not meet threshold of 90%` y devolvió el código `1`; con `--test-coverage-lines=50`, el código era `0`. Las opciones `--test-coverage-branches` y `--test-coverage-functions` también existen (listadas por `node --help`, sin probar). Recordatorio del capítulo sobre la cobertura: un porcentaje alto demuestra que las líneas se ejecutaron, no que se verificaran.

## Las trampas

Cada trampa descrita aquí se ha reproducido.

| Trampa | Lo que ocurrió | Alternativa |
|---|---|---|
| **Prueba sin aserción** | una prueba que calcula `2 + 2` sin comparar nada muestra `✔` y el código de salida es `0`: nunca puede fallar | una aserción por comportamiento; hacer fallar la prueba a propósito para comprobar que sabe fallar |
| **`await` olvidado delante de `assert.rejects`** | la prueba muestra `✔` aunque la promesa no era rechazada; Node señala después una actividad tras el fin de la prueba y marca el **archivo** como fallido (código `1`) | escribir `await assert.rejects(...)`; no contar con este filtro de seguridad, cuyo mensaje designa el archivo y no la línea culpable |
| **`await` olvidado sobre un valor** | `assert.equal(buscarNombre(1), "Grace")` compara una promesa en espera con un texto: la prueba falla, con `Promise { <pending> }` en el mensaje | `await buscarNombre(1)` antes de comparar |
| **Código que se ejecuta después del fin de la prueba** | un `setTimeout` que falla 50 ms más tarde deja su prueba en `✔`; Node muestra un mensaje de advertencia y marca el **archivo** como fallido (código `1`) | esperar el fin de la operación dentro de la prueba (`await`) |
| **Estado compartido entre pruebas** | un carrito creado una sola vez para toda la suite conserva el bolígrafo de la primera prueba: la segunda (`empieza vacío`) falla (`1 !== 0`); ejecutada sola con `--test-name-pattern`, tiene éxito | recrear el objeto en `beforeEach` |
| **Archivo no encontrado** | `b.spec.mjs` no lo ejecuta `node --test` sin nombre de archivo | nombrar el archivo `.test.mjs` o colocarlo en `test/` |
| **Comparar dos objetos con `equal`** | `assert.equal({ a: 1 }, { a: 1 })` falla: son dos objetos distintos | `deepEqual` |

## Buenas prácticas

| Hacer | Por qué |
|---|---|
| Importar `node:assert/strict`, nunca `node:assert` solo | el modo estricto evita que `1` y `"1"` se consideren iguales |
| Nombrar cada prueba según el comportamiento verificado | el informe se lee sin abrir el código (véase [las pruebas unitarias](/?c=tests&p=tests-unitaires)) |
| Escribir `async` y `await` en todas partes donde el código probado sea asíncrono | Node solo espera lo que se le pide que espere |
| Recrear en `beforeEach` lo que se modifica | cada prueba se vuelve independiente del orden y de los filtros |
| Usar `t.mock` en lugar de `mock` para reemplazar un método global | la restauración es automática, incluso si la prueba falla |
| Hacer fallar una prueba a propósito antes de confiar en ella | una prueba que no puede fallar no demuestra nada |
| Ejecutar `node --test` en la integración continua y leer su código de salida | `0` o `1` basta para decidir si el proyecto está sano |
| Reservar el ejecutor integrado para el código Node, y un ejecutor de navegador para la interfaz | véase [el navegador sin ventana](/?c=tests&p=tests-navigateur-sans-fenetre) |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | `node:test` es el ejecutor de pruebas incluido con Node: `node --test` encuentra los archivos `*.test.mjs` (o `*-test.mjs`, o los de una carpeta `test`), ejecuta cada prueba, muestra un resumen y devuelve el código `0` (éxito) o `1` (fallo). |
| **Herramientas utilizables** | `test`, `describe`, `it` para declarar; `node:assert/strict` para comparar; `before`, `beforeEach`, `afterEach`, `after` para preparar y limpiar; `mock.fn` y `t.mock.method` para sustituir una dependencia sin red; `--test-name-pattern`, `--test-only`, `--test-reporter` y `--experimental-test-coverage` para filtrar, formatear y medir. |
| **Trampas a evitar** | una prueba sin aserción (siempre en verde); un `await` olvidado (prueba en verde por error o mensaje engañoso); un estado compartido entre pruebas (resultado que depende del orden); `equal` entre dos objetos; un archivo de prueba con un nombre no reconocido. |
| **Buenas prácticas** | aserciones estrictas; un comportamiento por prueba, con nombre claro; `beforeEach` para partir de un estado nuevo; `await` delante de toda operación asíncrona; sustituciones limitadas a la prueba; comprobar que una prueba sabe fallar; confiar la decisión a la integración continua mediante el código de salida. |
