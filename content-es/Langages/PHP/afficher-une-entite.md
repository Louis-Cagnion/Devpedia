---
order: 17
---

# Mostrar una entidad: constructor de renderizado, ruta y control de acceso (31/10/2026)

Una **entidad** es un dato que la aplicación sabe identificar, guardar y volver a encontrar: un artículo, un usuario, un comentario, un pedido. Tiene un **tipo** («artículo»), un **número** (el 12) y campos (título, texto, autor). Mostrar una entidad en una página web parece sencillo: se lee el dato y se escribe [HTML](/?c=langages&s=html&p=structure-dun-document) (el lenguaje que describe el contenido de una página web). En realidad, detrás de ese gesto se esconden tres preguntas distintas, y mezclarlas produce código frágil y fallos de seguridad. Este capítulo las separa con un pequeño programa PHP que usted puede ejecutar, y después muestra cómo un sistema de gestión de contenidos (CMS, un programa que permite publicar y administrar contenidos) como [Drupal](https://www.drupal.org/docs/drupal-apis/entity-api) las realiza con tres herramientas: un constructor de renderizado, una ruta de entidad y un gestor de control de acceso.

Requiere **PHP 8.1 como mínimo** (las enumeraciones `enum` y las propiedades `readonly` no existen antes; el capítulo se ha probado en PHP 8.3). Supone conocidos [el enrutamiento sin framework](/?c=langages&s=php&p=routage) (una ruta asocia una dirección con código), [la POO en PHP](/?c=langages&s=php&p=poo) (clase, constructor, inyección de dependencias) y, para el parámetro de dirección convertido en objeto, [la conversión de parámetros de ruta](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre). Los códigos de estado `200`, `403` y `404` se presentan en [el intercambio de datos: API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

> En este capítulo, Drupal es solo un **ejemplo**: el principio vale para cualquier framework (una gran base de código que proporciona el esqueleto de una aplicación, véase [la inversión de control](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension); por ejemplo [Symfony](https://symfony.com/doc/current/index.html) o [Laravel](https://laravel.com/docs)) o para código escrito a mano. Lo específico de Drupal está agrupado principalmente en la sección «Un ejemplo: cómo Drupal 11 realiza este principio» (algunas menciones «en Drupal» reaparecen en «Las listas y las consultas» y en los resúmenes); el resto es PHP puro que el capítulo ejecuta de verdad.

## El problema: tres preguntas mezcladas

Cuando un visitante pide el artículo 12, el programa debe responder a tres preguntas, en este orden.

| Pregunta | Concierne a | Ejemplo de respuesta | Cambia cuando |
|---|---|---|---|
| ¿Cuál es el dato? | El **dato** | «Título: Hola, autor: 2, estado: publicado» | El contenido del artículo se modifica |
| ¿Tenemos derecho a verlo? | El **derecho de acceso** | «Sí» o «No» según la cuenta del visitante | Cambia una regla de seguridad |
| ¿Cómo mostrarlo? | La **maquetación** | Un título grande y después el texto; o solo el título en una lista | Cambia el diseño del sitio |

Esto es lo que produce el reflejo de escribirlo todo en el mismo sitio. Algunas referencias de sintaxis para este primer bloque (véase [la sintaxis de PHP](/?c=langages&s=php&p=syntaxe) y [las variables](/?c=langages&s=php&p=variables)): `<?php` abre el código PHP; `function nombre(...)` define una función, un bloque de código reutilizable; `array` y `string` son los tipos «array» y «texto»; `echo` escribe un texto en pantalla; `.` pega dos textos uno tras otro; `!==` significa «distinto (valor o tipo)»; `&&` significa «y» entre dos condiciones.

```php
<?php
// archivo: mezcla.php
// un artículo y dos cuentas, en arrays asociativos (pares clave => valor)
$articulo = ['titulo' => 'Hola', 'estado' => 'borrador', 'autor' => 2];
$autor = ['id' => 2];      // la cuenta que escribió el artículo
$visitante = ['id' => 5];  // otra cuenta

// la visualización de un artículo, con todo mezclado en una sola función
function mostrarArticulo(array $articulo, array $cuenta): string
{
    // regla de acceso: un borrador solo es visible para su autor
    if ($articulo['estado'] === 'borrador' && $articulo['autor'] !== $cuenta['id']) {
        return 'Acceso prohibido';
    }
    // maquetación: el título se pega tal cual en el HTML
    return '<h2>' . $articulo['titulo'] . '</h2>';
}

echo mostrarArticulo($articulo, $autor), "\n";     // esperado: el título en HTML
echo mostrarArticulo($articulo, $visitante), "\n"; // esperado: la negativa
```

Resultado obtenido:

```text
<h2>Hola</h2>
Acceso prohibido
```

Funciona, pero tres defectos aparecen en cuanto el sitio crece.

| Defecto | Consecuencia |
|---|---|
| La regla de acceso se copia en cada página que muestra un artículo (lista, fuente de novedades, búsqueda) | Una página olvida la regla y deja ver un borrador: es un *control de acceso defectuoso*, la primera familia de fallos del [Top 10 de OWASP](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| La maquetación está escrita en la misma función que la regla | Cambiar el diseño obliga a reabrir código de seguridad |
| El título se pega en el HTML sin neutralizarlo | Un título que contenga `<script>` se ejecutaría en el navegador: un fallo XSS (*Cross-Site Scripting*, véase [XSS en detalle](/?c=securite&s=cybersecurite&p=xss-en-detail)); véase también [proteger sus datos](/?c=langages&s=php&p=securite) |

La solución es la de [la responsabilidad única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage): una pieza por pregunta (el dato, el derecho, la presentación), y una cuarta pieza, la ruta, que las encadena.

```text
  solicitud: /articulo/12
        |
        v
  RUTA DE ENTIDAD       "esta dirección muestra un artículo, en modo completo,
        |                siempre que se tenga derecho a verlo"
        v
  CONVERSIÓN            "12" se convierte en el objeto Articulo número 12 (si no, 404)
        |
        v
  CONTROL DE ACCESO ---- denegado ----> respuesta 403
        |
    permitido
        v
  CONSTRUCTOR DE RENDERIZADO    dato + modo de visualización = tabla de renderizado
        |
        v
  MOTOR DE RENDERIZADO          tabla de renderizado = HTML (texto neutralizado)
        |
        v
  respuesta 200
```

Cada etapa del esquema se detalla más abajo. «Constructor de renderizado» y «motor de renderizado» son dos piezas distintas; el primero no tiene nada que ver con el `__construct` de una clase.

## Las piezas del mini ejemplo

El resto del capítulo construye estas piezas una a una, en PHP puro, en cuatro archivos, y después un script de prueba. Para probarlas, guarde los cinco archivos en una misma carpeta, abra una terminal (véase [la terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)), colóquese en esa carpeta y escriba el comando indicado al final.

| Pieza | Función | Archivo |
|---|---|---|
| `Articulo`, `Cuenta` | El dato y la persona que pide verlo | `datos.php` |
| `Acceso` | La respuesta de una regla: permitido, prohibido o neutro | `acceso.php` |
| `ReglaAcceso` y sus implementaciones | Cada regla da su opinión sobre un artículo | `acceso.php` |
| `GestorAcceso` | Reúne las opiniones y da una respuesta única | `acceso.php` |
| `ConstructorRenderizado` | Transforma el artículo en una tabla de renderizado, según un modo | `renderizado.php` |
| `MotorRenderizado` | Transforma la tabla de renderizado en HTML | `renderizado.php` |
| `TiposEntidad` | Registro: para un tipo de entidad, da sus gestores | `rutas.php` |
| `EnrutadorEntidad` | Encadena ruta, conversión, acceso y renderizado | `rutas.php` |

## El dato: el artículo y la cuenta

El dato es un objeto que solo contiene valores. Ignora todo sobre su visualización y sus derechos. En el código de abajo, `int`, `string`, `array` y `bool` son **tipos declarados** (entero, texto, array, verdadero/falso): indican qué clase de valor acepta una propiedad o un parámetro; `: bool` después de los paréntesis indica el tipo del valor devuelto; `public` hace una propiedad legible desde cualquier parte, `private` la reserva a su clase; `void` significa «no devuelve nada» (véase [la POO en PHP](/?c=langages&s=php&p=poo)).

```php
<?php
// archivo: datos.php

// el dato solo: un artículo no tiene idea de su visualización ni de sus derechos
final class Articulo
{
    // el constructor recibe los valores y los guarda en propiedades
    public function __construct(
        public readonly int $id,        // número; readonly: nunca modificable después
        public readonly string $titulo, // título mostrado
        public readonly string $cuerpo, // texto del artículo
        public readonly int $autor,     // número de la cuenta que lo escribió
        public readonly string $estado, // "publicado" o "borrador"
    ) {
    }
}

// la persona que pide ver: su número y sus permisos
final class Cuenta
{
    public function __construct(
        public readonly int $id,        // número de la cuenta (0 para un visitante anónimo)
        public readonly array $permisos // lista de textos, p. ej. ['ver los artículos']
    ) {
    }

    // indica si la cuenta tiene un permiso dado
    public function tiene(string $permiso): bool
    {
        return in_array($permiso, $this->permisos, true); // true: comparación estricta
    }
}
```

| Sintaxis PHP | Significado |
|---|---|
| `final class` | Clase que ninguna otra clase puede extender (véase [la POO en PHP](/?c=langages&s=php&p=poo)) |
| `public readonly int $id` en la lista del constructor | Crea una propiedad pública, legible desde cualquier parte, **de solo lectura** (asignada una vez en la construcción, nunca modificada después), y le da el valor recibido |
| `in_array($x, $lista, true)` | Busca `$x` en `$lista`; el `true` impone una comparación estricta (sin él, PHP a veces convierte los textos en números: `"1e1"` vale `"10"`, porque `1e1` también se escribe 10; con él, no), hay que usarlo siempre con textos |

Un visitante no conectado es una cuenta como las demás, aquí con número `0` y sin permisos: el código no necesita un caso particular. Un **permiso** es un derecho con nombre que se concede a una cuenta («ver los artículos»). Quién tiene qué permiso se gestiona en otra parte (véase [RBAC y ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac)); aquí, `Cuenta` se limita a listarlo.

## Una respuesta de acceso con tres valores

La pregunta «¿tenemos derecho?» no se reduce a sí o no. Una regla también puede **no tener opinión**: la regla «un borrador es visible para su autor» no dice nada sobre un artículo publicado. Hacen falta, por tanto, tres respuestas.

| Respuesta | Significado | Ejemplo |
|---|---|---|
| `Autorizado` | Esta regla dice sí | El autor abre su propio borrador |
| `Prohibido` | Esta regla dice no, **y ese no gana a todos los sí** | El artículo está bloqueado por la moderación |
| `Neutro` | Esta regla no tiene opinión | La regla de los borradores frente a un artículo publicado |

Cuando varias reglas responden, se combinan. Para escribirlo en PHP, se usa una **enumeración** (`enum`), que es un tipo cuyos únicos valores posibles se enumeran de antemano, aquí las tres respuestas.

```php
<?php
// archivo: acceso.php

// una respuesta de acceso tiene tres valores posibles, no dos: es una enumeración
enum Acceso
{
    case Autorizado; // una regla dice sí
    case Prohibido;  // una regla dice no, y ese no es definitivo
    case Neutro;     // la regla no tiene opinión sobre este caso

    // "o": basta un voto a favor, pero un Prohibido siempre gana
    public function o(Acceso $otro): Acceso
    {
        if ($this === self::Prohibido || $otro === self::Prohibido) {
            return self::Prohibido; // un solo veto basta
        }
        if ($this === self::Autorizado || $otro === self::Autorizado) {
            return self::Autorizado; // al menos un sí, ningún veto
        }
        return self::Neutro; // nadie tiene opinión
    }

    // "y": hace falta el acuerdo de los dos; un veto o un silencio bloquean
    public function y(Acceso $otro): Acceso
    {
        if ($this === self::Prohibido || $otro === self::Prohibido) {
            return self::Prohibido; // un veto sigue siendo un veto
        }
        if ($this === self::Autorizado && $otro === self::Autorizado) {
            return self::Autorizado; // los dos dicen sí
        }
        return self::Neutro; // uno de los dos no ha dicho sí
    }

    // la decisión final: solo un Autorizado abre la puerta (el Neutro deniega)
    public function estaAutorizado(): bool
    {
        return $this === self::Autorizado;
    }
}
```

| Sintaxis PHP | Significado |
|---|---|
| `enum Acceso { case Autorizado; ... }` | Declara el tipo `Acceso` y sus únicos valores posibles, llamados *casos* |
| `self::Prohibido` | El valor `Prohibido` de la enumeración actual |
| `$this` | El objeto sobre el que se llama al método: aquí, la primera de las dos respuestas comparadas |
| `===` | Igualdad estricta: mismo valor **y** mismo tipo |
| `\|\|` y `&&` | «o» e «y» entre dos condiciones (no confundir con los métodos `o` e `y` de la enumeración, que combinan respuestas de acceso) |
| `if (...) { return ...; }` | Si la condición es verdadera, se devuelve la respuesta enseguida y el resto del método no se lee (véase [las condiciones](/?c=langages&s=php&p=conditions)) |

La combinación `o` se usa cuando varias reglas comparten la decisión; `y`, cuando hay que reunir dos condiciones. Esto es lo que da cada par de respuestas, comprobado al ejecutar `Acceso::cases()` (la lista de los tres valores):

| Respuesta A | Respuesta B | `A->o(B)` | `A->y(B)` |
|---|---|---|---|
| Autorizado | Autorizado | Autorizado | Autorizado |
| Autorizado | Prohibido | Prohibido | Prohibido |
| Autorizado | Neutro | Autorizado | Neutro |
| Prohibido | Autorizado | Prohibido | Prohibido |
| Prohibido | Prohibido | Prohibido | Prohibido |
| Prohibido | Neutro | Prohibido | Prohibido |
| Neutro | Autorizado | Autorizado | Neutro |
| Neutro | Prohibido | Prohibido | Prohibido |
| Neutro | Neutro | Neutro | Neutro |

Dos hechos que recordar: un `Prohibido` siempre gana, sea cual sea el operador; y la decisión final solo abre la puerta con un `Autorizado`. Un `Neutro` final significa «ninguna regla ha dicho sí»: el acceso se deniega. Es el principio del **rechazo por defecto**: en ausencia de una regla favorable, la puerta permanece cerrada.

## Las reglas de acceso y su gestor

Una **interfaz** es un contrato: enumera los métodos que una clase promete ofrecer, sin escribir su contenido. Todas las reglas respetan la misma interfaz, así que el gestor puede llamarlas sin saber lo que hacen. A continuación de `acceso.php`:

```php
// contrato de una regla de acceso: opina sobre un artículo, una operación y una cuenta
interface ReglaAcceso
{
    public function verificar(Articulo $articulo, string $operacion, Cuenta $cuenta): Acceso;
}
```

La primera regla es la del propio artículo.

```php
// la regla propia de los artículos (operación "ver" solamente)
final class ReglaAccesoArticulo implements ReglaAcceso
{
    public function verificar(Articulo $articulo, string $operacion, Cuenta $cuenta): Acceso
    {
        if ($operacion !== 'ver') {
            return Acceso::Neutro; // operación desconocida: sin opinión
        }
        if ($cuenta->tiene('administrar los artículos')) {
            return Acceso::Autorizado; // el administrador lo ve todo
        }
        if ($articulo->estado === 'borrador') {
            // un borrador solo es visible para su autor
            return $articulo->autor === $cuenta->id ? Acceso::Autorizado : Acceso::Neutro;
        }
        return $cuenta->tiene('ver los artículos') ? Acceso::Autorizado : Acceso::Neutro;
    }
}
```

La segunda regla se añade «desde fuera». No pertenece a las reglas del artículo: se puede imaginar que un **módulo** (una extensión que añade funciones a la aplicación) de moderación la proporciona. Nunca dice sí, solo dice no cuando el artículo está bloqueado.

```php
// una regla añadida "desde fuera": prohíbe todo artículo cuyo número esté bloqueado
final class ReglaBloqueo implements ReglaAcceso
{
    public function __construct(private array $numerosBloqueados) // números bloqueados
    {
    }

    public function verificar(Articulo $articulo, string $operacion, Cuenta $cuenta): Acceso
    {
        $bloqueado = in_array($articulo->id, $this->numerosBloqueados, true); // ¿en la lista?
        return $bloqueado ? Acceso::Prohibido : Acceso::Neutro; // prohibido para todos
    }
}
```

El **gestor de control de acceso** reúne las reglas y da una sola respuesta. Las demás piezas del programa nunca llaman a una regla directamente: consultan al gestor.

```php
// el gestor de control de acceso: reúne las reglas y da UNA respuesta
final class GestorAcceso
{
    public function __construct(private array $reglas) // lista de objetos ReglaAcceso
    {
    }

    public function acceso(Articulo $articulo, string $operacion, Cuenta $cuenta): Acceso
    {
        $respuesta = Acceso::Neutro; // partimos del silencio
        foreach ($this->reglas as $regla) {
            // combinamos cada opinión con "o": un veto gana, un sí basta
            $respuesta = $respuesta->o($regla->verificar($articulo, $operacion, $cuenta));
        }
        return $respuesta;
    }
}
```

| Sintaxis PHP | Significado |
|---|---|
| `class X implements Y` | La clase `X` promete ofrecer todos los métodos de la interfaz `Y` |
| `condición ? a : b` | Vale `a` si la condición es verdadera; si no, `b` |
| `private array $reglas` en la lista del constructor | Crea una propiedad oculta desde fuera y le da el valor recibido |
| `foreach ($this->reglas as $regla)` | Repite el bloque para cada elemento del array, con el nombre `$regla` |
| `$respuesta->o(...)` | Llama al método `o` de la enumeración sobre el valor contenido en `$respuesta` |

Esto es lo que da cada combinación de reglas en tres situaciones.

| Caso | `ReglaAccesoArticulo` | `ReglaBloqueo` | Respuesta del gestor |
|---|---|---|---|
| Artículo publicado, lector con el permiso | Autorizado | Neutro | Autorizado |
| Borrador, otra cuenta | Neutro | Neutro | Neutro (por tanto, denegado) |
| Artículo bloqueado, administrador | Autorizado | Prohibido | Prohibido (el veto gana al administrador) |

## El constructor de renderizado y la tabla de renderizado

El **constructor de renderizado** (en inglés *view builder*) responde a la pregunta «¿cómo presentar este dato?». Todavía no produce HTML. Produce una **tabla de renderizado**: una tabla PHP que describe lo que hay que mostrar (qué campos, con qué valores, en qué modo). Otro componente, el **motor de renderizado**, la transformará en HTML. Esta etapa intermedia tiene una utilidad: la tabla puede completarse o modificarse con otros fragmentos de código antes de escribirse en HTML, y se puede probar sin analizar texto.

Un **modo de visualización** es una manera de mostrar el mismo dato: el artículo entero en su página, o solo su título en una lista.

| Modo | Campos mostrados | Dónde se ve |
|---|---|---|
| `completo` | título y cuerpo | La página del artículo |
| `vista_previa` | título | Una línea en una lista de artículos |

```php
<?php
// archivo: renderizado.php

// el contrato de un constructor de renderizado: del dato a una tabla de renderizado
interface ConstructorRenderizado
{
    public function ver(Articulo $articulo, string $modo = 'completo'): array;
}

// constructor de renderizado de artículos: elige los campos según el modo de visualización
final class ConstructorRenderizadoArticulo implements ConstructorRenderizado
{
    // para cada modo de visualización, la lista de campos que mostrar
    private const MODOS = [
        'completo' => ['titulo', 'cuerpo'], // la página del artículo
        'vista_previa' => ['titulo'],        // la línea de una lista
    ];

    public function ver(Articulo $articulo, string $modo = 'completo'): array
    {
        // throw dentro de un ??: si el modo no existe, se lanza un error
        $campos = self::MODOS[$modo]
            ?? throw new InvalidArgumentException("Modo desconocido: $modo");
        // claves "#": metadatos
        $tabla = ['#modo' => $modo, '#articulo' => $articulo->id];
        foreach ($campos as $campo) {
            $tabla[$campo] = $articulo->$campo; // propiedad cuyo nombre está en $campo
        }
        return $tabla;
    }
}
```

| Sintaxis PHP | Significado |
|---|---|
| `string $modo = 'completo'` | Valor por defecto de un parámetro: si quien llama no indica modo, `$modo` vale `'completo'` |
| `"Modo desconocido: $modo"` | Texto entre comillas dobles: PHP sustituye `$modo` por su valor |
| `throw new InvalidArgumentException(...)` | Lanza un error, aquí de la clase `InvalidArgumentException` («argumento no válido»); véase [las excepciones en PHP](/?c=langages&s=php&p=exceptions) |
| `private const MODOS = [...]` | Constante de la clase, oculta desde fuera: la lista de modos conocidos |
| `self::MODOS[$modo]` | Lee la constante de la clase actual, en la clave `$modo` |
| `$a ?? throw new ...` | Si `$a` no existe, lanza un error en lugar de seguir con un valor vacío |
| `'#modo'` | Clave que empieza por `#`: por convención, un metadato (información sobre la tabla) y no un campo que mostrar |
| `$articulo->$campo` | Lee la propiedad cuyo nombre está en la variable `$campo` |

Para un artículo número 1, de título `T` y cuerpo `C`, el constructor devuelve en modo `completo` (resultado de `print_r`, que muestra una tabla):

```text
Array
(
    [#modo] => completo
    [#articulo] => 1
    [titulo] => T
    [cuerpo] => C
)
```

Un modo desconocido lanza una excepción (véase [las excepciones en PHP](/?c=langages&s=php&p=exceptions)) cuyo mensaje es `Modo desconocido: desconocido`.

El motor de renderizado se añade a continuación de `renderizado.php`. Es él, y solo él, quien escribe HTML, así que es quien neutraliza el texto.

```php
// el motor de renderizado: transforma una tabla de renderizado en HTML, y protege el texto
final class MotorRenderizado
{
    public function html(array $tabla): string
    {
        $html = '<article>'; // etiqueta de apertura
        foreach (['titulo' => 'h2', 'cuerpo' => 'p'] as $campo => $etiqueta) {
            if (isset($tabla[$campo])) { // solo los campos presentes en este modo
                // htmlspecialchars neutraliza < > & y " : el texto no se convierte en HTML
                $html .= "<$etiqueta>" . htmlspecialchars($tabla[$campo]) . "</$etiqueta>";
            }
        }
        return $html . '</article>'; // etiqueta de cierre
    }
}
```

| Sintaxis PHP | Significado |
|---|---|
| `foreach (['titulo' => 'h2', ...] as $campo => $etiqueta)` | Recorre una lista de pares clave => valor: en cada vuelta, `$campo` recibe la clave y `$etiqueta` el valor |
| `isset($tabla[$campo])` | Verdadero si la clave existe en el array y no es `null` |
| `$html .= "..."` | Añade el texto al final de `$html` |
| `"<$etiqueta>"` | Texto entre comillas dobles: `$etiqueta` se sustituye por su valor, por ejemplo `h2` |
| `htmlspecialchars(...)` | Sustituye `<`, `>`, `&` y las comillas por códigos que el navegador muestra tal cual |

`htmlspecialchars` reemplaza `<` por `&lt;` (una *entidad HTML*, un código que se muestra como el carácter): el navegador muestra entonces el texto `<b>` en lugar de interpretarlo como negrita. Escribir esta protección en el motor, y no en cada página, evita que una página la olvide.

## El registro de tipos y la ruta de entidad

Queda por unir las piezas. El **registro de tipos de entidad** asocia a un tipo («artículo») sus gestores: su constructor de renderizado y su gestor de acceso. El enrutador no conoce entonces ningún tipo concreto: pregunta al registro.

```php
<?php
// archivo: rutas.php

// registro de tipos de entidad: para un tipo, proporciona sus gestores
final class TiposEntidad
{
    private array $gestores = []; // tipo => ['renderizado' => ..., 'acceso' => ...]

    public function declarar(string $tipo, array $gestores): void
    {
        $this->gestores[$tipo] = $gestores; // el tipo se registra él mismo
    }

    public function constructorRenderizado(string $tipo): ConstructorRenderizado
    {
        return $this->gestores[$tipo]['renderizado'];
    }

    public function controlAcceso(string $tipo): GestorAcceso
    {
        return $this->gestores[$tipo]['acceso'];
    }
}
```

Una **ruta de entidad** es una ruta que no designa un fragmento de código concreto, sino una **entidad y un modo de visualización**: `articulo.completo` quiere decir «la entidad de tipo `articulo`, en modo `completo`». También designa la operación que hay que autorizar: `articulo.ver`. El enrutador lee estos dos textos y busca los gestores correspondientes en el registro.

```php
// el enrutador de entidades: no conoce NINGÚN tipo concreto, solo los gestores
final class EnrutadorEntidad
{
    public function __construct(
        private TiposEntidad $tipos,  // registro de tipos
        private array $rutas,         // dirección => ['vista' => ..., 'acceso' => ...]
        private array $entidades      // [tipo => [número => objeto]]: almacén falso
    ) {
    }

    // devuelve [código HTTP, cuerpo de la respuesta]
    public function responder(string $camino, Cuenta $cuenta): array
    {
        foreach ($this->rutas as $modelo => $ruta) {
            // {articulo} es una captura con nombre: (?<articulo>[^/]+) = todo menos "/"
            $captura = preg_replace('#\{(\w+)\}#', '(?<$1>[^/]+)', $modelo);
            $patron = '#^' . $captura . '$#'; // el patrón completo, de ^ (inicio) a $ (fin)
            if (preg_match($patron, $camino, $encontrado) === 1) {
                return $this->tratar($ruta, $encontrado, $cuenta); // primera ruta encontrada
            }
        }
        return [404, 'Página desconocida']; // ninguna ruta coincide
    }

    private function tratar(array $ruta, array $encontrado, Cuenta $cuenta): array
    {
        [$tipo, $modo] = explode('.', $ruta['vista']); // "articulo.completo" -> tipo y modo
        $numero = (int) ($encontrado[$tipo] ?? 0); // el texto se convierte en número
        $entidad = $this->entidades[$tipo][$numero] ?? null; // conversión en objeto, o null
        if ($entidad === null) {
            return [404, 'No encontrado']; // el número no designa ninguna entidad
        }
        [, $operacion] = explode('.', $ruta['acceso']); // "articulo.ver" -> "ver"
        $acceso = $this->tipos->controlAcceso($tipo)->acceso($entidad, $operacion, $cuenta);
        if (!$acceso->estaAutorizado()) {
            return [403, 'Acceso prohibido']; // Prohibido o Neutro: la puerta sigue cerrada
        }
        $tabla = $this->tipos->constructorRenderizado($tipo)->ver($entidad, $modo);
        return [200, (new MotorRenderizado())->html($tabla)];
    }
}
```

| Elemento del enrutador | Función |
|---|---|
| `{articulo}` en `/articulo/{articulo}` | Un **parámetro** de ruta: la parte de la dirección que cambia (véase [el enrutamiento](/?c=langages&s=php&p=routage)). Su nombre es el del tipo de entidad, lo que permite saber qué cargar |
| `preg_replace` y `preg_match` | Convierten el modelo en una **expresión regular** (un patrón de búsqueda en un texto, con una sintaxis parecida a [la del capítulo sobre regex](/?c=langages&s=domain-specific-languages-dsl&p=regex)) y después comprueban la dirección |
| Trampa del modelo | El modelo de dirección se lee como regex sin escapar: un `.` o un `+` en `/articulo.html/{articulo}` se interpretaría como un símbolo del patrón. Los modelos de este capítulo no contienen ninguno; si los hubiera, proteger la parte fija con `preg_quote` (función de PHP que escapa esos símbolos) |
| `(?<articulo>[^/]+)` | Captura con nombre: «uno o más caracteres que no son `/`», guardados bajo el nombre `articulo` |
| `#\{(\w+)\}#` | Patrón que busca una llave de apertura, una palabra (`\w+`: letras, cifras y `_`) y después una llave de cierre; las `#` de los extremos delimitan el patrón, y `$1` en el reemplazo devuelve la palabra encontrada |
| `'#^' . $captura . '$#'` | `^` significa «inicio del texto» y `$` «fin del texto»: toda la dirección debe coincidir, no solo una parte |
| `explode('.', 'articulo.completo')` | Corta el texto en cada punto: se obtiene `['articulo', 'completo']` |
| `[$tipo, $modo] = ...` | Guarda los dos fragmentos en dos variables a la vez |
| `(int) $texto` | Convierte en entero; un texto como `abc` da `0`, que no designa ninguna entidad. Trampa: `1abc` da `1`, así que `/articulo/1abc` mostraría el artículo 1 (dirección duplicada); para ser estricto, probar antes con `ctype_digit($texto)` (verdadero solo si el texto tiene únicamente cifras) o escribir `\d+` en lugar de `[^/]+` en el patrón |
| `$tabla[$clave] ?? null` | Da `null` cuando la clave no existe: aquí, una entidad ausente, que lleva al `404` |
| `[, $operacion] = ...` | Guarda solo el **segundo** fragmento: la coma sola salta el primero |
| `preg_match($patron, $camino, $encontrado)` | Comprueba la dirección y guarda las capturas en `$encontrado`; devuelve `1` si la dirección coincide |
| `(new MotorRenderizado())->html(...)` | Crea un objeto y llama enseguida a uno de sus métodos |

El orden de las comprobaciones importa: primero la existencia (`404`), luego el derecho (`403`), y solo después la construcción del renderizado. El constructor de renderizado nunca se llama, por tanto, para un visitante que no tiene derecho.

## Ensamblar y probar

El archivo `prueba.php` crea tres artículos, cuatro cuentas y dos rutas, y después pide cada dirección con cada cuenta.

```php
<?php
// archivo: prueba.php
require __DIR__ . '/datos.php';       // Articulo y Cuenta
require __DIR__ . '/acceso.php';      // Acceso, reglas y gestor de acceso
require __DIR__ . '/renderizado.php'; // constructor y motor de renderizado
require __DIR__ . '/rutas.php';       // registro de tipos y enrutador

// tres artículos: publicado, borrador del autor 2, publicado pero bloqueado
$articulos = [
    1 => new Articulo(1, 'Hola', 'Un <i>eco</i>.', 2, 'publicado'),
    2 => new Articulo(2, 'Idea en curso', 'No terminado.', 2, 'borrador'),
    3 => new Articulo(3, 'Tema polémico', 'Retirado.', 2, 'publicado'),
];

// declaramos el tipo "articulo" con su constructor de renderizado y su control de acceso
$tipos = new TiposEntidad();
$tipos->declarar('articulo', [
    'renderizado' => new ConstructorRenderizadoArticulo(),
    'acceso' => new GestorAcceso([new ReglaAccesoArticulo(), new ReglaBloqueo([3])]),
]);

// dos rutas: la misma entidad vista en modo completo, y luego en vista previa
$rutas = [
    '/articulo/{articulo}' => ['vista' => 'articulo.completo', 'acceso' => 'articulo.ver'],
    '/previa/{articulo}' => ['vista' => 'articulo.vista_previa', 'acceso' => 'articulo.ver'],
];
$enrutador = new EnrutadorEntidad($tipos, $rutas, ['articulo' => $articulos]);

// cuatro cuentas: anónimo, lector, autor del borrador, administrador
$cuentas = [
    'anonimo' => new Cuenta(0, []),
    'lector' => new Cuenta(5, ['ver los artículos']),
    'autor' => new Cuenta(2, []),
    'admin' => new Cuenta(1, ['administrar los artículos']),
];

// cada línea: la cuenta, la dirección pedida, el código obtenido y el cuerpo
foreach (['/articulo/1', '/previa/1', '/articulo/2', '/articulo/3', '/articulo/99'] as $dir) {
    foreach ($cuentas as $nombre => $cuenta) {
        [$codigo, $cuerpo] = $enrutador->responder($dir, $cuenta);
        printf("%-8s %-12s %d %s\n", $nombre, $dir, $codigo, $cuerpo);
    }
}
```

Algunos elementos de sintaxis de este script:

| Sintaxis PHP | Significado |
|---|---|
| `require __DIR__ . '/datos.php'` | Carga otro archivo, situado en la misma carpeta que este (véase [include y require](/?c=langages&s=php&p=include)) |
| `new Articulo(1, 'Hola', ...)` | Crea un artículo; los valores siguen el orden del constructor: número, título, cuerpo, autor, estado |
| `foreach ($cuentas as $nombre => $cuenta)` | Recorre una lista conservando la clave (`$nombre`) y el valor (`$cuenta`) |
| `printf("%-8s %-12s %d %s\n", ...)` | Escribe una línea según un formato: `%-8s` y `%-12s` un texto completado a la derecha con espacios hasta 8 y 12 caracteres, `%d` un entero, `%s` un texto |

Resultado obtenido con `php prueba.php`:

```text
anonimo  /articulo/1  403 Acceso prohibido
lector   /articulo/1  200 <article><h2>Hola</h2><p>Un &lt;i&gt;eco&lt;/i&gt;.</p></article>
autor    /articulo/1  403 Acceso prohibido
admin    /articulo/1  200 <article><h2>Hola</h2><p>Un &lt;i&gt;eco&lt;/i&gt;.</p></article>
anonimo  /previa/1    403 Acceso prohibido
lector   /previa/1    200 <article><h2>Hola</h2></article>
autor    /previa/1    403 Acceso prohibido
admin    /previa/1    200 <article><h2>Hola</h2></article>
anonimo  /articulo/2  403 Acceso prohibido
lector   /articulo/2  403 Acceso prohibido
autor    /articulo/2  200 <article><h2>Idea en curso</h2><p>No terminado.</p></article>
admin    /articulo/2  200 <article><h2>Idea en curso</h2><p>No terminado.</p></article>
anonimo  /articulo/3  403 Acceso prohibido
lector   /articulo/3  403 Acceso prohibido
autor    /articulo/3  403 Acceso prohibido
admin    /articulo/3  403 Acceso prohibido
anonimo  /articulo/99 404 No encontrado
lector   /articulo/99 404 No encontrado
autor    /articulo/99 404 No encontrado
admin    /articulo/99 404 No encontrado
```

El mismo resultado, presentado en tabla (las líneas `/previa/1` y `/articulo/1` solo se diferencian por el modo):

| Dirección | Anónimo | Lector | Autor (sin permiso) | Administrador |
|---|---|---|---|---|
| `/articulo/1` (publicado) | 403 | 200 | 403 | 200 |
| `/previa/1` (publicado, modo vista previa) | 403 | 200 | 403 | 200 |
| `/articulo/2` (borrador del autor) | 403 | 403 | 200 | 200 |
| `/articulo/3` (bloqueado) | 403 | 403 | 403 | 403 |
| `/articulo/99` (inexistente) | 404 | 404 | 404 | 404 |

Tres observaciones. El autor ve su borrador pero no el artículo publicado (no tiene el permiso general). El administrador lo ve todo, salvo el artículo bloqueado: el veto de `ReglaBloqueo` gana. Y el texto `<i>eco</i>` del cuerpo se escribe como `&lt;i&gt;eco&lt;/i&gt;`: el navegador lo muestra tal cual, sin ponerlo en cursiva.

## `403` o `404`: ¿qué revelar al visitante?

El mini ejemplo responde `403` (prohibido) ante una negativa y `404` (no encontrado) ante una entidad que no existe. Esta elección tiene una consecuencia: un visitante puede **adivinar** qué números existen, puesto que un borrador responde `403` y un número vacío responde `404`.

| Elección | Lo que aprende el visitante | Cuándo usarla |
|---|---|---|
| `403` ante una negativa, `404` ante la ausencia | El número existe, pero le está cerrado | La existencia de la entidad no es un secreto (un artículo publicado del sitio) |
| `404` en ambos casos | Nada: la negativa y la ausencia son indistinguibles | La existencia misma es sensible (una historia clínica, el borrador de un competidor) |

En el mini ejemplo, pasar a la segunda elección cuesta una línea del enrutador: devolver `[404, 'No encontrado']` en lugar de `[403, 'Acceso prohibido']`. El código de estado `403` se describe en [autenticación y autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation); la [documentación de MDN](https://developer.mozilla.org/es/docs/Web/HTTP/Status/403) detalla su uso.

## Un ejemplo: cómo Drupal 11 realiza este principio

> Los nombres de API de Drupal de esta sección están verificados en el código fuente de Drupal 11.x; la referencia es la [documentación oficial](https://www.drupal.org/docs/drupal-apis/entity-api).

Drupal llama **tipo de entidad** (*entity type*) a la definición de una clase de dato (un artículo, un usuario), y **gestor** (*handler*) a un objeto asociado a ese tipo para una tarea precisa. El **núcleo** (*core*) es la parte de Drupal común a todos los sitios. El principio es el del registro `TiposEntidad` del mini ejemplo.

| Noción del mini ejemplo | Equivalente en Drupal |
|---|---|
| `TiposEntidad` | El gestor de tipos de entidad, obtenido con `\Drupal::entityTypeManager()` |
| `declarar('articulo', [...])` | La definición del tipo de entidad, en la cabecera de su clase (anotación, un comentario especial que lee Drupal, o atributo `#[...]`, una etiqueta nativa de PHP 8, según la versión, véase [la arquitectura por plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)), con una clave `handlers` |
| `'renderizado' => ConstructorRenderizadoArticulo` | El gestor `view_builder`, por defecto la clase `Drupal\Core\Entity\EntityViewBuilder` |
| `'acceso' => GestorAcceso` | El gestor `access`, una clase que extiende `Drupal\Core\Entity\EntityAccessControlHandler` |
| `Acceso::Autorizado`, `Prohibido`, `Neutro` | `AccessResult::allowed()`, `forbidden()`, `neutral()` |
| `o`, `y` | `orIf()`, `andIf()` sobre un resultado de acceso |
| Modo `completo`, `vista_previa` | Modo de visualización (*view mode*): `full`, `teaser`, o un modo creado por el sitio |
| Tabla de renderizado | *Render array*: array PHP cuyas propiedades (`#theme`, `#cache`...) empiezan por `#` |
| Ruta `articulo.completo` | Valor `_entity_view: 'tipo.modo'` en los valores por defecto de la ruta |
| Derecho `articulo.ver` | Requisito `_entity_access: 'tipo.view'` en la ruta |
| `EnrutadorEntidad` | El sistema de enrutamiento del núcleo, con un controlador genérico para `_entity_view` |

### Declarar los gestores del tipo

La clave `handlers` de un tipo de entidad nombra una clase por tarea. Solo se muestra aquí el contenido de la clave: la sintaxis que la rodea (anotación o atributo) depende de la versión de Drupal.

```php
<?php

// contenido de la clave "handlers": una tarea => la clase que la realiza
$gestores = [
  // el gestor de renderizado: a menudo basta con la clase del núcleo
  'view_builder' => 'Drupal\Core\Entity\EntityViewBuilder',
  // el gestor de control de acceso: nuestra clase
  'access' => 'Drupal\exemple_articles\ArticuloAccessControlHandler',
  // el proveedor de rutas: genera las rutas estándar del tipo
  'route_provider' => [
    'html' => 'Drupal\Core\Entity\Routing\DefaultHtmlRouteProvider',
  ],
];
```

`exemple_articles` y `exemple_article` son nombres inventados para este capítulo: un módulo (un paquete de código que Drupal carga) del mismo nombre contendría el tipo de entidad. Un tipo de entidad que no declara `view_builder` ni `access` recibe en general una clase por defecto del núcleo; el detalle depende del tipo (contenido o configuración).

### El constructor de renderizado

El gestor de renderizado se obtiene del gestor de tipos, y después devuelve una tabla de renderizado. El control de acceso consulta directamente a la entidad.

```php
<?php

// $articulo es una entidad cargada, $cuenta la cuenta del visitante (obtenidas en otro lugar)
// el gestor de renderizado del tipo de entidad, pedido al gestor de tipos
$constructor = \Drupal::entityTypeManager()->getViewBuilder('exemple_article');
// la tabla de renderizado de este artículo en modo "teaser" (vista previa)
$tabla = $constructor->view($articulo, 'teaser');

// el resultado de acceso para la operación "view"; TRUE pide el objeto, no un booleano
$respuesta = $articulo->access('view', $cuenta, TRUE);
// verdadero solo si el resultado es "allowed" (un "neutral" da falso)
$autorizado = $respuesta->isAllowed();
```

| Llamada | Función |
|---|---|
| `getViewBuilder('exemple_article')` | Devuelve el gestor de renderizado del tipo |
| `view($entidad, 'teaser')` | Devuelve la tabla de renderizado de **una** entidad en un modo |
| `viewMultiple($entidades, 'teaser')` | Lo mismo para varias entidades a la vez |
| `$entidad->access('view', $cuenta, TRUE)` | Devuelve un objeto resultado (`TRUE` como tercer argumento); sin él, un simple booleano |
| `$resultado->isAllowed()` | Verdadero solo para `allowed`: `neutral` da falso, como nuestro `estaAutorizado()` |

Un punto merece atención: en Drupal, la elección de los campos mostrados en cada modo no se escribe en PHP como nuestra constante `MODOS`. Se **configura** (por el administrador del sitio, en una configuración de visualización asociada al tipo y al modo), y el constructor de renderizado lee esa configuración. La tabla de renderizado contiene también **metadatos de caché** (bajo la clave `#cache`). Una **caché** es una copia de un resultado guardada para no volver a calcularlo; estos metadatos indican de qué depende el resultado, lo que evita reconstruir la página en cada visita, sin servirla al visitante equivocado. Este tema de la caché es aparte y no se detalla aquí.

El motor de renderizado de Drupal se apoya en plantillas ([Twig](https://twig.symfony.com/doc/), un lenguaje de plantillas de páginas) que escapan las variables por defecto (el texto queda inofensivo para el HTML): es el equivalente de nuestro `htmlspecialchars`, aplicado automáticamente.

### La ruta de entidad

Una ruta se declara en un archivo de configuración del módulo, en formato YAML (un formato de archivo de ajustes hecho de claves y valores, donde la indentación expresa la anidación; especificación en [yaml.org](https://yaml.org/)). Este es el espíritu de una ruta de entidad:

```yaml
# nombre de la ruta: el tipo de entidad, luego el papel "canonical" (la página de la entidad)
entity.exemple_article.canonical:
  # la dirección; {exemple_article} es el parámetro, con el nombre del tipo de entidad
  path: '/articulo/{exemple_article}'
  defaults:
    # muestra la entidad en modo "full" (completo)
    _entity_view: 'exemple_article.full'
  requirements:
    # exige que la operación "view" esté autorizada sobre esta entidad
    _entity_access: 'exemple_article.view'
```

| Clave | Función |
|---|---|
| `path` | La dirección, con el parámetro `{exemple_article}` nombrado como el tipo de entidad |
| `defaults._entity_view` | «Muestra la entidad de este tipo en este modo»: el núcleo proporciona el **controlador** (el código que responde a la ruta) |
| `requirements._entity_access` | «Exige que el acceso `view` esté autorizado sobre esta entidad» |

El parámetro `{exemple_article}`, nombre del tipo de entidad, se convierte en objeto mediante el conversor de parámetros del núcleo, como en [la conversión de parámetros de ruta](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre): un número inexistente da en principio un `404` antes de que se llame al control de acceso. Para los tipos de entidad habituales, Drupal también puede **generar** esta ruta a partir de la clave `route_provider` del tipo, sin que haya que escribirla a mano.

### El gestor de control de acceso

El gestor extiende la clase base del núcleo e implementa `checkAccess()`, que recibe la entidad, la operación (`'view'`, `'update'`, `'delete'`) y la cuenta.

```php
<?php

// espacio de nombres (véase la POO en PHP): la carpeta lógica donde vive la clase
namespace Drupal\exemple_articles;

use Drupal\Core\Access\AccessResult;                 // fábrica de resultados de acceso
use Drupal\Core\Access\AccessResultInterface;        // el tipo de un resultado de acceso
use Drupal\Core\Entity\EntityAccessControlHandler;   // clase base del núcleo
use Drupal\Core\Entity\EntityInterface;              // el tipo de toda entidad
use Drupal\Core\Session\AccountInterface;            // el tipo de una cuenta

// nuestro gestor de acceso: hereda todo el trabajo común del núcleo
class ArticuloAccessControlHandler extends EntityAccessControlHandler {

  // la llama el núcleo con la entidad, la operación pedida y la cuenta
  protected function checkAccess(
    EntityInterface $entity,
    $operation,
    AccountInterface $account
  ): AccessResultInterface {
    if ($operation === 'view') {
      // autorizado si la cuenta tiene el permiso, si no neutro (sin opinión)
      return AccessResult::allowedIfHasPermission($account, 'view exemple articles');
    }
    return AccessResult::neutral(); // cualquier otra operación: sin opinión
  }

}
```

| Elemento | Función |
|---|---|
| `AccessResult::allowedIfHasPermission($cuenta, 'texto')` | `allowed` si la cuenta tiene el permiso; si no, `neutral` |
| `AccessResult::neutral()` | «Sin opinión»: el rechazo por defecto se aplica si nadie dice sí |
| `AccessResult::forbidden()` | Veto definitivo |
| `checkAccess()` llamada por `access()` | El núcleo la llama después de consultar los hooks de los demás módulos, salvo que uno de ellos prohíba |
| Declaración de permisos | Un archivo del módulo (`*.permissions.yml`) enumera los permisos que existen |

Otros módulos pueden dar su opinión sobre cualquier entidad mediante **hooks** (véase [la inversión de control y los puntos de extensión](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)): `hook_entity_access()` para todos los tipos, `hook_ENTITY_TYPE_access()` para un tipo concreto. Sus respuestas se combinan con la del gestor mediante una lógica del mismo tipo que `o` (el orden es el siguiente: los hooks `hook_entity_access()` y `hook_ENTITY_TYPE_access()` se consultan primero; si uno de ellos prohíbe, `checkAccess()` no se llama; si no, su resultado se combina con los demás mediante `orIf()`): es exactamente el papel de nuestra `ReglaBloqueo`, un módulo exterior que pone un veto sin conocer las reglas de los artículos.

### Dónde están las piezas en la arquitectura

| Pieza | Capítulo que la explica |
|---|---|
| El registro de gestores es un **servicio** del núcleo, fabricado por un contenedor | [El contenedor de servicios](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services) |
| Los tipos de entidad los descubre el núcleo (anotación o atributo) | [La arquitectura por plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| Los hooks de acceso de los demás módulos | [Inversión de control y puntos de extensión](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) |
| El gestor recibe sus dependencias por su constructor | [La POO en PHP](/?c=langages&s=php&p=poo) |

En una clase de su módulo, se **inyecta** el gestor de tipos de entidad mediante el constructor en lugar de llamar a `\Drupal::entityTypeManager()`: la llamada estática hace difícil probar la clase (véase [el contenedor de servicios](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services), sección «Probar: reemplazar un servicio por un falso»).

## Las listas y las consultas: la otra puerta de entrada

El control de acceso de una página de entidad solo protege esa página. Una lista de artículos, un motor de búsqueda, una fuente de novedades o una interfaz de programación (API) pueden mostrar los mismos datos sin pasar por la ruta.

| Puerta de entrada | Dónde comprobar el acceso |
|---|---|
| Página de la entidad | La ruta (`_entity_access`) |
| Lista construida en PHP | Llamar al gestor de acceso para **cada** entidad de la lista (`$entidad->access('view')` en Drupal) |
| Consulta en [base de datos](/?c=domain-specific-languages-dsl&p=sql) filtrada | La propia consulta debe aplicar el filtro; en Drupal, una consulta de entidades pide `->accessCheck(TRUE)` (o `FALSE` cuando se sabe por qué) |
| Salida [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) de una API | El mismo control que la página, antes de convertir los datos en texto JSON |
| Modo vista previa en una página de otro tipo | El mismo gestor de renderizado, por tanto el mismo control de acceso antes |

En nuestro mini ejemplo, la solución es producir listas solo a partir de `GestorAcceso`: una función `listar(Cuenta $cuenta)` filtraría los artículos con `estaAutorizado()` antes de pasarlos al constructor de renderizado en modo `vista_previa`.

## Las trampas

| Trampa | Consecuencia | Solución |
|---|---|---|
| Comprobar el acceso en la página pero no en la lista o en la API | Un borrador aparece en una lista: control de acceso defectuoso | Un único punto de decisión (el gestor), llamado por todas las puertas |
| Tratar `Neutro` como `Autorizado` | Una entidad sin regla aplicable se vuelve pública | Rechazo por defecto: solo `Autorizado` abre |
| Tratar `Neutro` como `Prohibido` al combinar | Una regla que no tiene opinión bloquea a las demás: ya ningún módulo exterior puede abrir un acceso | Tres valores distintos, y un `o` que deja ganar un sí frente a un silencio |
| Un veto que puede ser anulado por un sí | Un administrador ve un artículo bloqueado | `Prohibido` siempre gana en la combinación |
| Escribir HTML en el constructor de renderizado o en la ruta | La maquetación y la seguridad del texto se mezclan, y otro modo tiene que copiarlo todo | Constructor: una tabla; motor: el HTML y la neutralización |
| Olvidar neutralizar el texto de un campo | Fallo XSS (véase [XSS en detalle](/?c=securite&s=cybersecurite&p=xss-en-detail)) | El motor de renderizado neutraliza todo, sin excepción campo por campo |
| Construir el renderizado antes de comprobar el acceso | Trabajo inútil, y acciones secundarias (lecturas en base de datos, escrituras en un registro) para un visitante denegado | Primero la existencia, luego el acceso, luego el renderizado |
| Responder `403` cuando la existencia es sensible | El visitante adivina qué números existen | `404` idéntico para «ausente» y «prohibido» |
| Guardar en caché un renderizado sin tener en cuenta al visitante | Un visitante recibe la página preparada para otro, borrador incluido | Indicar de qué depende el renderizado (la cuenta, sus permisos) en los metadatos de caché |
| Probar los derechos solo con una cuenta de administrador | Todos los rechazos pasan inadvertidos | Una prueba por tipo de cuenta: anónimo, lector, autor, administrador |
| Sustituir un gestor del núcleo por una clase incompleta | Una página del núcleo llama a un método que falta | Extender la clase base y redefinir solo `checkAccess()` |

## Buenas prácticas

| Buena práctica | Motivo |
|---|---|
| Tres piezas separadas: dato, renderizado, acceso | Cada motivo de cambio tiene su archivo |
| Una respuesta de acceso con tres valores y una combinación en la que gana el veto | Los módulos exteriores pueden prohibir o autorizar sin conocerse entre sí |
| Rechazo por defecto | Una regla olvidada cierra en lugar de abrir |
| Pasar por el gestor en cada puerta de entrada (página, lista, API) | Una regla modificada una vez se aplica en todas partes |
| Una tabla de renderizado y después un motor que escribe el HTML | El texto se neutraliza en un único lugar, y el renderizado se prueba sin HTML |
| Un modo de visualización por uso (página, lista, vista previa) | El mismo objeto se presenta de varias formas sin duplicar código |
| Una ruta de entidad que designa un tipo, un modo y una operación | Añadir un tipo de entidad no obliga a reescribir el enrutador |
| Comprobar existencia, luego derecho, luego construir | No se produce nada para un visitante denegado |
| Decidir el `403` o el `404` según la sensibilidad de la existencia | Sin fuga de información sobre lo que existe |
| Probar cada regla con una cuenta de cada tipo | Se verifican los casos de rechazo, no solo los casos felices |
| Inyectar el gestor de tipos en lugar de llamarlo de forma estática | La clase se prueba con un gestor falso |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Mostrar una entidad responde a tres preguntas que se separan: qué dato (la entidad), cómo presentarlo (el constructor de renderizado produce una tabla de renderizado según un modo de visualización, y después el motor de renderizado escribe el HTML), y si tenemos derecho (el gestor de control de acceso). Una ruta de entidad designa un tipo, un modo y una operación, sin conocer la entidad. Una regla de acceso responde autorizado, prohibido o neutro; un prohibido siempre gana, y un neutro final deniega. En Drupal 11, estas piezas son el `view_builder`, la ruta con `_entity_view` y `_entity_access`, y el gestor de acceso que devuelve `AccessResult`. |
| **Trampas que evitar** | Comprobar el acceso solo en la página y olvidar las listas y las API; tratar un neutro como un sí; dejar que un sí anule un veto; poner HTML en el constructor; olvidar neutralizar el texto; construir el renderizado antes del control; revelar la existencia con un `403`; guardar en caché sin tener en cuenta al visitante; probar solo con un administrador. |
| **Buenas prácticas** | Un único punto de decisión de acceso; rechazo por defecto; un veto que gana; una tabla de renderizado y después un motor; un modo por uso; existencia, derecho y renderizado en ese orden; `404` cuando la existencia es sensible; una prueba por tipo de cuenta; gestores inyectados. |

Para ir más lejos: la [documentación de la API de entidades de Drupal](https://www.drupal.org/docs/drupal-apis/entity-api), la del [sistema de enrutamiento](https://www.drupal.org/docs/drupal-apis/routing-system), y el manual de PHP sobre las [enumeraciones](https://www.php.net/manual/es/language.enumerations.php).
