---
order: 17
---

# La máquina de estados de una aplicación

Un artículo de blog pasa por varias etapas: se escribe, alguien lo revisa, se publica y, un día, se archiva. Esta etapa se guarda en un campo, a menudo llamado **estado**. Si cualquier fragmento de código puede escribir cualquier valor ahí, la aplicación acaba con artículos «publicados» que nadie ha revisado, o «archivados» aunque nunca estuvieron en línea. Una **máquina de estados de aplicación** resuelve este problema: se declara una sola vez, en una tabla, qué estados existen y qué pasos de uno a otro están permitidos, y un único lugar del código aplica esa tabla.

Este capítulo se apoya en las [excepciones en PHP](/?c=langages&s=php&p=exceptions) y en las [clases y métodos](/?c=langages&s=php&p=poo). El mismo principio sirve para analizar un texto paso a paso, como muestra el [análisis incremental mediante máquina de estados](/?c=langages&s=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats); aquí, la máquina no lee un texto sino que protege la vida de un registro. Sistemas de gestión de contenidos como Drupal (un software PHP que permite construir y administrar un sitio web) funcionan así en lo que respecta a su estado de publicación. Los ejemplos siguientes siguen siendo genéricos y no utilizan código de ese software.

## Las palabras clave

| Palabra | Significado | Ejemplo |
|---|---|---|
| Estado (o estatus) | La situación de un objeto en un instante dado, una sola a la vez | `borrador` |
| Transición | El paso de un estado a otro | de `borrador` a `en_revision` |
| Transición permitida | Un paso que la regla de negocio autoriza | `en_revision` a `publicado` |
| Transición prohibida | Un paso que la regla rechaza | `borrador` a `publicado` |
| Estado final | Un estado del que ya no se sale | `archivado` |
| Efecto | Una acción desencadenada por una transición precisa | registrar la fecha de publicación |

## El esquema de los estados

Cada flecha es una transición permitida. Todo lo que no está dibujado está prohibido.

```text
              +--------------+
              |   borrador   |<-----------+
              +------+-------+            |
                     |                    |
                     v                    |
              +--------------+            |
              | en_revision  |------------+
              +------+-------+   (vuelta para corregir)
                     |
                     v
              +--------------+
              |   publicado  |
              +------+-------+
                     |
                     v
              +--------------+
              |   archivado  |   (estado final)
              +--------------+
```

## El problema: un estado libre, sin guarda

Sin máquina de estados, el estado es una simple cadena de caracteres que cada parte del código modifica a su antojo.

```php
<?php
$articulo = ['titulo' => 'Los estados', 'estado' => 'borrador']; // un artículo recién creado
$articulo['estado'] = 'publicado';        // salta la revisión: nadie lo impide
$articulo['estado'] = 'publicado ';       // una errata también se acepta
$articulo['estado'] = 'archivado';        // y se puede archivar lo que nunca existió
```

Cada línea se acepta sin la menor comprobación. La **guarda** (el control colocado antes del cambio, que rechaza o autoriza) está ausente.

## Los estados imposibles

Otro error frecuente sustituye un estado único por varias casillas de verificación (booleanos, valores verdadero o falso). Dos casillas dan cuatro combinaciones, y algunas de ellas no tienen sentido.

| `esta_publicado` | `esta_archivado` | Significado |
|---|---|---|
| falso | falso | Borrador o revisión, no sabemos cuál |
| verdadero | falso | Publicado |
| falso | verdadero | Archivado, ¿pero nunca publicado? Caso ambiguo |
| verdadero | verdadero | Publicado y archivado a la vez: estado imposible |

Un campo único que solo puede tomar los valores de la tabla hace que esas combinaciones sean **imposibles de representar**: no se puede escribir lo que no existe. Es el mismo principio que el de [un solo mecanismo por información](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-seul-mecanisme-par-information).

## Los `if` dispersos

Otra pendiente resbaladiza: comprobar la regla a mano, en cada lugar que cambia el estado.

```php
<?php
function botonPublicar(array $articulo): void      // llamada por la página de edición
{
    if ($articulo['estado'] === 'en_revision') {   // regla escrita una primera vez
        echo "Publicar";                           // muestra el botón
    }
}

function importarArticulo(array $fila): array      // llamada por una importación de archivo
{
    if ($fila['estado'] === 'publicado') {         // regla reescrita, ya distinta
        $fila['fecha'] = date('Y-m-d');            // olvida el control de la revisión
    }
    return $fila;                                  // devuelve la fila, nunca rechazada
}
```

Estas dos funciones aplican cada una su propia versión de la regla. El día en que se añade un estado, hay que encontrar todos los `if`, y siempre se olvida uno. La solución es la que describe [evitar la repetición mediante estructuras indexadas](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees): una tabla de datos, recorrida por un único código.

## La tabla de transiciones

Un **arreglo asociativo** (una lista donde cada valor se localiza mediante un nombre, su clave) indica, para cada estado, la lista de estados siguientes permitidos. Una **constante** (`const`) es un valor con nombre que ya no se puede modificar después de su declaración.

| Estado actual | Transiciones permitidas |
|---|---|
| `borrador` | `en_revision` |
| `en_revision` | `borrador`, `publicado` |
| `publicado` | `archivado` |
| `archivado` | ninguna |

```php
<?php
const TRANSITIONS = [                           // la tabla: una única fuente de verdad
    'borrador'    => ['en_revision'],           // un borrador pasa a revisión
    'en_revision' => ['borrador', 'publicado'], // la revisión corrige o publica
    'publicado'   => ['archivado'],             // un artículo publicado termina archivado
    'archivado'   => [],                        // estado final: ninguna salida
];
```

Añadir un estado equivale a añadir una fila a esta tabla, y en ningún otro sitio. Es la [fuente única de verdad](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite).

## Rechazar una transición ilegal, con un mensaje claro

Una única función, `changerStatut`, es la única puerta de acceso. Comprueba la tabla y lanza una **excepción** (una señal de error que el código que llama puede capturar, véase el capítulo sobre las [excepciones](/?c=langages&s=php&p=exceptions)) cuyo mensaje nombra la causa. El principio es el de [un mensaje de error para cada causa](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-message-d-erreur-par-cause): el mensaje dice qué estado, qué destino y qué estaba permitido.

```php
<?php
class TransitionInterdite extends DomainException {}  // un tipo de error propio de este caso

function changerStatut(array $articulo, string $destino): array
{
    $actual = $articulo['estado'] ?? '';               // lee el estado, vacío si falta
    if (!array_key_exists($actual, TRANSITIONS)) {     // ¿es conocido el estado actual?
        throw new TransitionInterdite(                 // si no, rechaza indicando la causa
            "Estado actual desconocido: « $actual »."
        );
    }
    if (!array_key_exists($destino, TRANSITIONS)) {    // ¿existe el destino?
        throw new TransitionInterdite(                 // si no, rechaza indicando la causa
            "Estado destino desconocido: « $destino »."
        );
    }
    $permitidos = TRANSITIONS[$actual];                // los destinos permitidos desde aquí
    if (!in_array($destino, $permitidos, true)) {      // ¿está el destino en la lista?
        $lista = $permitidos ? implode(', ', $permitidos) : 'ninguna';  // texto de la lista
        throw new TransitionInterdite(                 // rechaza nombrando las opciones
            "Paso de « $actual » a « $destino » prohibido. Permitidos: $lista."
        );
    }
    $articulo['estado'] = $destino;                    // la única línea que escribe el estado
    return $articulo;                                  // devuelve el artículo modificado
}
```

| Caso probado | Resultado |
|---|---|
| `borrador` a `en_revision` | aceptado |
| `borrador` a `publicado` | rechazado, mensaje: permitido `en_revision` |
| `archivado` a `borrador` | rechazado, mensaje: permitido `ninguna` |
| `publicado` a `Publicado` (error de mayúscula) | rechazado, estado destino desconocido |

El tercer parámetro `true` de `in_array` impone una comparación estricta: sin él, PHP puede considerar iguales valores de tipos distintos.

## Los efectos ligados a una transición

Algunas acciones solo tienen sentido para un paso preciso: anotar la fecha en el momento de la publicación, avisar al autor cuando se devuelve a borrador, retirar el artículo del sitio al archivarlo. Se colocan en una segunda tabla, indexada por la pareja `origen>destino`. Cada efecto es una **función anónima** (una función sin nombre, escrita directamente en el lugar donde se guarda, aquí con la forma corta `fn`).

| Transición | Efecto |
|---|---|
| `borrador>en_revision` | anotar la fecha de la solicitud de revisión |
| `en_revision>publicado` | anotar la fecha de publicación |
| `publicado>archivado` | anotar la fecha de archivado |

```php
<?php
const FORMAT_DATE = 'Y-m-d';                              // formato de las fechas guardadas

function effets(): array                                  // la tabla de efectos
{
    return [
        'borrador>en_revision' => fn(array $a): array     // al solicitar la revisión
            => $a + ['revision_el' => date(FORMAT_DATE)],
        'en_revision>publicado' => fn(array $a): array    // al publicar
            => $a + ['publicado_el' => date(FORMAT_DATE)],
        'publicado>archivado' => fn(array $a): array      // al archivar
            => $a + ['archivado_el' => date(FORMAT_DATE)],
    ];
}

function transiter(array $articulo, string $destino): array
{
    $origen = $articulo['estado'] ?? '';                  // guarda el estado de partida
    $articulo = changerStatut($articulo, $destino);       // valida, lanza si está prohibido
    $clave = "$origen>$destino";                          // clave de la tabla de efectos
    $efecto = effets()[$clave] ?? null;                   // busca un efecto para este paso
    return $efecto ? $efecto($articulo) : $articulo;      // lo ejecuta si existe
}
```

El orden importa: la validación va **antes** que los efectos. Una transición rechazada lanza la excepción en la línea de `changerStatut`, y la línea que ejecuta el efecto nunca se alcanza. El operador `+` entre dos arreglos añade las claves que faltan sin modificar las que ya existen.

Los efectos que prolongan una transición (enviar un correo, vaciar una caché) también pueden pasar por puntos de extensión que otros módulos enganchan, como en un capítulo vecino dedicado a los hooks y a los eventos; este capítulo conserva la tabla, más sencilla mientras los efectos sean pocos.

## Ver la máquina en funcionamiento

```php
<?php
$articulo = ['titulo' => 'Los estados', 'estado' => 'borrador'];   // punto de partida
$articulo = transiter($articulo, 'en_revision');                    // transición permitida
$articulo = transiter($articulo, 'publicado');                      // transición permitida
echo $articulo['estado'], ' el ', $articulo['publicado_el'], "\n";  // muestra el estado final
try {
    transiter($articulo, 'borrador');                           // publicado hacia borrador
} catch (TransitionInterdite $e) {                                  // captura el rechazo
    echo $e->getMessage(), "\n";                                    // muestra la causa
}
```

La salida del último bloque se parece a:

```text
publicado el 2026-10-31
Paso de « publicado » a « borrador » prohibido. Permitidos: archivado.
```

## Probar la propia tabla

Una tabla puede contener una errata: un destino que no existe, un estado del que se puede salir por error o del que no se puede salir nunca. Una [prueba unitaria](/?c=tests&p=tests-unitaires) la verifica en pocas líneas.

```php
<?php
function verifierTable(array $tabla): array               // devuelve la lista de anomalías
{
    $anomalias = [];                                      // lista vacía al principio
    foreach ($tabla as $origen => $destinos) {            // recorre cada estado
        foreach ($destinos as $destino) {                 // recorre sus destinos
            if (!array_key_exists($destino, $tabla)) {    // ¿tiene el destino una entrada?
                $anomalias[] = "$origen conduce a $destino, desconocido";  // la anota
            }
        }
    }
    return $anomalias;                                    // vacía si la tabla está sana
}
```

La función anterior realiza el primer control de la tabla siguiente; los otros dos se escriben de la misma manera, recorriendo la tabla.

| Control | Lo que detecta |
|---|---|
| Todo destino es también una clave | Errata en un destino |
| Al menos un estado final | Máquina sin fin posible |
| Todo estado es alcanzable desde el primero | Estado añadido pero no conectado a nada |

## Estado libre, `if` dispersos o tabla

| Criterio | Estado libre | `if` dispersos | Tabla de transiciones |
|---|---|---|---|
| Valor inválido aceptado | sí | a veces | no |
| Regla escrita en un solo lugar | no | no | sí |
| Añadir un estado | nada guía | buscar todos los `if` | una fila en la tabla |
| Mensaje de error claro | ninguno | distinto en todas partes | uno solo, nombra la causa |
| Regla legible de un vistazo | no | no | sí |

## Las trampas

| Trampa | Por qué es un problema | Reflejo |
|---|---|---|
| Estado libre sin guarda | Se acepta cualquier valor, incluida una errata | Una sola función escribe el estado y valida primero |
| Varias casillas en lugar de un estado | Los estados imposibles se vuelven representables | Un campo único cuyos valores están enumerados |
| Regla copiada en varios `if` | Las copias divergen y una se olvida | Una tabla leída por un solo código |
| Escribir el estado directamente en la base de datos, fuera de la función | Salta la guarda, por ejemplo en una importación | Hacer pasar toda ruta, importación incluida, por `transiter` |
| Efecto ejecutado antes de la validación | Una transición rechazada ya ha tenido consecuencias | Validar primero, aplicar después |
| Dos usuarios que cambian el estado a la vez | Cada uno valida sobre un estado ya caducado | Escribir con una condición sobre el estado anterior, véanse las [bases de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) |
| Mensaje vago («error de estado») | El usuario no sabe qué hacer | Nombrar el origen, el destino y las opciones permitidas |
| Estados renombrados después | Los valores antiguos guardados se vuelven desconocidos | Prever una migración de los datos antes de renombrar |

## Buenas prácticas

| Práctica | Razón |
|---|---|
| Declarar estados y transiciones en una tabla de datos | Una única fuente de verdad, legible de un vistazo |
| Una única función autorizada a escribir el estado | Ningún camino salta la guarda |
| Validar antes de aplicar los efectos | Un rechazo no deja ningún rastro |
| Un mensaje de error que nombre el estado, el destino y las opciones | La depuración se hace en una sola lectura |
| Un identificador de estado estable, en minúsculas, sin espacios | Los datos ya guardados siguen siendo válidos |
| Una prueba que controle la propia tabla | Detecta un destino desconocido antes de la puesta en línea |
| Guardar los efectos en una tabla mientras sean pocos | Más sencillo que un sistema de puntos de extensión |

Documentación oficial de referencia: [arreglos de PHP](https://www.php.net/manual/es/language.types.array.php) y [excepciones de PHP](https://www.php.net/manual/es/language.exceptions.php).

## Lo que hay que recordar

| Noción | Qué recordar |
|---|---|
| Máquina de estados | Un campo con valores enumerados y una tabla de los pasos permitidos |
| Transición | Un paso de un estado a otro, permitido o prohibido por la tabla |
| Guarda | El control colocado antes del cambio, que rechaza con una excepción clara |
| Efecto | Una acción ligada a una transición precisa, ejecutada tras la validación |
| Punto de entrada único | Una sola función escribe el estado, importación e interfaz incluidas |
| Estado imposible | Se evita sustituyendo varios booleanos por un solo estado |
| Trampa principal | Un estado libre, o una regla dispersa en `if` que divergen |
