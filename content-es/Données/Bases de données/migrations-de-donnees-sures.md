---
order: 12
---

# Migraciones de datos seguras

Una **base de datos** es un programa que guarda información en **tablas** (como hojas de cálculo: una **línea** por elemento, una **columna** por característica). Cuando una aplicación evoluciona, a menudo hay que modificar líneas que ya existen: corregir la escritura de un estado, rellenar una columna nueva, borrar cuentas antiguas. Esta operación se llama una **migración de datos**. Es más arriesgada que un cambio de código: un código defectuoso se corrige volviendo a la versión anterior, pero las líneas destruidas o reescritas mal no vuelven solas. Este capítulo presenta cuatro protecciones: la migración versionada, la simulación, el SQL en masa y la salvaguarda antes de borrar.

Las migraciones que cambian la **estructura** de las tablas (añadir una columna, una tabla) se presentan en la sección «Las migraciones» del capítulo sobre [el ORM](/?c=donnees&s=bases-de-donnees&p=orm); aquí nos ocupamos de los **datos**. El ciclo de vida de una entidad (lo que se dispara alrededor del guardado de un objeto) es objeto de otro capítulo.

Los ejemplos usan [SQLite](https://www.sqlite.org/docs.html), una base de datos contenida en un solo archivo, sin servidor que instalar, y [PHP](/?c=langages&s=php&p=syntaxe) para manejar la base. Los comandos se escriben en una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). El lenguaje de consultas es [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

## La migración versionada

Una **migración versionada** es un archivo que describe **un solo cambio**, numerado para fijar el orden, y que ya no se modifica una vez aplicado. Una **tabla de seguimiento** guarda qué migraciones ya se han ejecutado, para no ejecutar nunca la misma dos veces. Aquí tenemos tres archivos de una carpeta `migrations/`. Cada línea de SQL que empieza por `--` es un comentario.

Primer archivo, `migrations/0001_creer_clients.sql`:

```sql
-- Crea la tabla de clientes (una línea por cliente)
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,      -- número único de la línea
    email TEXT NOT NULL,         -- dirección del cliente
    estado TEXT NOT NULL         -- situación de la cuenta, escrita a mano al principio
);
-- Datos de partida, con estados escritos de distintas maneras
INSERT INTO clientes (email, estado) VALUES
    ('ana@ejemplo.org', 'Actif'),
    ('bob@ejemplo.org', 'actif '),
    ('chloe@ejemplo.org', 'ACTIF'),
    ('dan@ejemplo.org', 'inactif'),
    ('eva@ejemplo.org', 'Inactif');
```

Segundo archivo, `migrations/0002_normaliser_statuts.sql`: un `UPDATE` (orden SQL que modifica líneas existentes), que se apoya en la tabla creada por el primero.

```sql
-- Uniforma el estado: minúsculas, sin espacios alrededor
UPDATE clientes SET estado = lower(trim(estado));
```

Tercer archivo, `migrations/0003_ajouter_derniere_connexion.sql`:

```sql
-- Añade una columna para la fecha de la última conexión
ALTER TABLE clientes ADD COLUMN ultima_conexion TEXT;
-- Rellena la columna para las líneas que ya existen
UPDATE clientes SET ultima_conexion = '2020-01-01' WHERE estado = 'inactif';
UPDATE clientes SET ultima_conexion = '2026-10-01' WHERE estado = 'actif';
```

| Regla | Por qué |
|---|---|
| Un archivo por cambio | Un fallo se localiza enseguida; el archivo se relee entero |
| Un número al inicio del nombre (`0001`, `0002`) | El orden de ejecución es el mismo en todos los equipos y servidores |
| Nunca modificar después de aplicar | Las bases ya migradas no volverían a ejecutar el archivo: los entornos divergirían |
| Una tabla que guarda las migraciones ejecutadas | Volver a lanzar el programa no ejecuta nada; un archivo nuevo se detecta solo |
| Una huella por archivo | Una modificación posterior se detecta en lugar de ignorarse |

Una **huella** (*hash*) es una cadena corta de caracteres calculada a partir del texto del archivo; si cambia una sola letra, la huella cambia (véase [el hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) para el principio). El siguiente programa, `migrate.php`, aplica todas las migraciones que todavía no se han ejecutado. Las envuelve en una **transacción**, un grupo de operaciones que se completa en su totalidad o se anula por entero (`beginTransaction`, `commit` para validar, `rollBack` para anular). `PDO` es la interfaz de PHP para hablar con una base (véase [Manejar SQL desde PHP con PDO](/?c=langages&s=domain-specific-languages-dsl&p=sql)); la función SQL `total_changes()` de SQLite devuelve el número de líneas modificadas desde que se abrió la conexión, lo que sirve para contar el efecto de cada archivo.

```php
<?php
// Uso: php migrate.php [--dry-run]
$simulacion = in_array('--dry-run', $argv, true);   // verdadero si se da la opción
$pdo = new PDO('sqlite:app.db');                    // abre (o crea) la base
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // error = excepción

// Tabla que guarda las migraciones ya ejecutadas, con la huella del archivo
$pdo->exec('CREATE TABLE IF NOT EXISTS migraciones (
    nombre TEXT PRIMARY KEY, huella TEXT NOT NULL, ejecutada_el TEXT NOT NULL)');

// Lee las migraciones ya ejecutadas: nombre => huella
$ejecutadas = $pdo->query('SELECT nombre, huella FROM migraciones')
    ->fetchAll(PDO::FETCH_KEY_PAIR);

$archivos = glob(__DIR__ . '/migrations/*.sql');    // lista los archivos
sort($archivos);                                    // orden del número: 0001, 0002...

/** Cuenta todas las líneas modificadas desde que se abrió la conexión. */
function lineasModificadas(PDO $pdo): int
{
    return (int) $pdo->query('SELECT total_changes()')->fetchColumn();
}

$pdo->beginTransaction();       // abre la transacción: todo o nada
try {
    foreach ($archivos as $archivo) {
        $nombre = basename($archivo);
        $sql = file_get_contents($archivo);
        $huella = hash('sha256', $sql);
        if (isset($ejecutadas[$nombre])) {
            if ($ejecutadas[$nombre] !== $huella) {     // archivo modificado después
                throw new RuntimeException("$nombre fue modificado después de aplicarse");
            }
            continue;                                   // ya ejecutada: se omite
        }
        $antes = lineasModificadas($pdo);
        $pdo->exec($sql);                               // ejecuta la migración
        $afectadas = lineasModificadas($pdo) - $antes;  // líneas que ha modificado
        $pdo->prepare('INSERT INTO migraciones VALUES (?, ?, datetime())')
            ->execute([$nombre, $huella]);              // la anota como ejecutada
        echo "$nombre : $afectadas línea(s)\n";
    }
    if ($simulacion) {
        $pdo->rollBack();                           // simulación: se anula todo
        echo "Simulación terminada: no se ha guardado nada.\n";
    } else {
        $pdo->commit();                             // aplicación: se valida todo
    }
} catch (Throwable $error) {
    $pdo->rollBack();                               // a la mínima falla: vuelta atrás
    fwrite(STDERR, 'Fallo: ' . $error->getMessage() . "\n");
    exit(1);
}
```

La primera ejecución se describe en la sección siguiente. Después de una aplicación real, volver a lanzar el comando no muestra nada, porque los tres nombres figuran en la tabla `migraciones`. Si añadimos una línea a `0002_normaliser_statuts.sql` después de aplicarlo, el comando falla:

```text
Fallo: 0002_normaliser_statuts.sql fue modificado después de aplicarse
```

La corrección de un error pasa por un archivo **nuevo** (`0004_...`), nunca por reescribir `0002`. Las migraciones de datos de este tipo deben ser también **idempotentes** si es posible: ejecutarlas de nuevo por error no cambia nada más. El `lower(trim(...))` de arriba lo es (poner en minúsculas lo que ya está en minúsculas no cambia nada); un `UPDATE ... SET precio = precio * 2` no lo es.

Para un proceso que debe retomarse tras una interrupción, véase también [el punto de control](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

## El modo simulación («dry run»)

El **modo simulación** (*dry run*, «ensayo en seco») ejecuta la migración de verdad, cuenta lo que habría modificado y luego **anula todo**. Responde a la pregunta: «¿qué pasaría si la lanzara?» antes de que la respuesta sea irreversible.

Aquí basta con no validar la transacción: la opción `--dry-run` de `migrate.php` llama a `rollBack` al final en lugar de `commit`. Todas las migraciones pendientes se ejecutan en la misma transacción, para que la segunda vea las tablas de la primera.

```text
$ php migrate.php --dry-run
0001_creer_clients.sql : 5 línea(s)
0002_normaliser_statuts.sql : 5 línea(s)
0003_ajouter_derniere_connexion.sql : 5 línea(s)
Simulación terminada: no se ha guardado nada.
$ php migrate.php
0001_creer_clients.sql : 5 línea(s)
0002_normaliser_statuts.sql : 5 línea(s)
0003_ajouter_derniere_connexion.sql : 5 línea(s)
```

| Manera de simular | Principio | Límite |
|---|---|---|
| Transacción anulada (este ejemplo) | Se ejecuta todo y luego `rollBack` | Funciona si la base también anula los cambios de estructura, que es lo que hace SQLite; otros motores validan algunos comandos de estructura de oficio |
| Contar antes (`SELECT COUNT(*)` con la misma condición) | Se lee el volumen previsto sin escribir nada | No prueba que la consulta de modificación vaya a tener éxito |
| Copia de la base | Se migra una copia, no el original | Requiere tiempo y espacio en una base grande |
| Entorno de prueba | Se migra una base de preproducción | Sus datos se parecen pocas veces a los de producción |

Un detalle: el número mostrado cuenta las líneas que la consulta **seleccionó**, no aquellas cuyo valor cambió realmente. Aquí `0002` anuncia 5 líneas, pero solo 3 cambian de valor: dos ya estaban en minúsculas. Para saber qué cambia de verdad, añadir a la condición `WHERE estado <> lower(trim(estado))`.

## SQL en masa o registro por registro

Para cambiar 20.000 líneas existen dos enfoques. **Uno por uno**: el programa lee cada línea, calcula el nuevo valor y envía una consulta por línea. **En masa**: una sola consulta SQL describe el cambio y el motor de la base hace el bucle por sí mismo. El siguiente programa mide los dos, más dos variantes.

```php
<?php
$archivo = __DIR__ . '/bench.db';
@unlink($archivo);                                   // empieza con una base vacía
$pdo = new PDO("sqlite:$archivo");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/** Recrea 20.000 clientes con estados mal escritos. */
function preparar(PDO $pdo): void
{
    $pdo->exec('DROP TABLE IF EXISTS clientes');
    $pdo->exec('CREATE TABLE clientes (id INTEGER PRIMARY KEY, estado TEXT)');
    $pdo->beginTransaction();                        // una sola transacción: rápido
    $insercion = $pdo->prepare('INSERT INTO clientes (estado) VALUES (?)');
    for ($i = 0; $i < 20000; $i++) {
        $insercion->execute([$i % 2 ? 'Actif ' : 'ACTIF']);
    }
    $pdo->commit();
}

/** Mide la duración de una acción, en segundos. */
function medir(string $titulo, callable $accion): void
{
    $inicio = microtime(true);                       // hora antes de la acción
    $accion();
    printf("%-34s %6s s\n", $titulo, number_format(microtime(true) - $inicio, 2, ',', ''));
}

// 1. Uno por uno, cada UPDATE es su propia transacción (valor por defecto)
preparar($pdo);
medir('uno por uno, sin transacción', function () use ($pdo) {
    $actualizacion = $pdo->prepare('UPDATE clientes SET estado = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, estado FROM clientes')->fetchAll() as $c) {
        $actualizacion->execute([strtolower(trim($c['estado'])), $c['id']]);
    }
});

// 2. Uno por uno, pero todas las escrituras en una sola transacción
preparar($pdo);
medir('uno por uno, una transacción', function () use ($pdo) {
    $pdo->beginTransaction();
    $actualizacion = $pdo->prepare('UPDATE clientes SET estado = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, estado FROM clientes')->fetchAll() as $c) {
        $actualizacion->execute([strtolower(trim($c['estado'])), $c['id']]);
    }
    $pdo->commit();
});

// 3. En masa: una sola consulta, el motor hace el bucle por sí mismo
preparar($pdo);
medir('una consulta en masa', function () use ($pdo) {
    $pdo->exec('UPDATE clientes SET estado = lower(trim(estado))');
});

// 4. En masa por tramos: una consulta y una transacción por tramo
preparar($pdo);
medir('en masa, tramos de 5.000', function () use ($pdo) {
    $actualizacion = $pdo->prepare(
        'UPDATE clientes SET estado = lower(trim(estado)) WHERE id > ? AND id <= ?'
    );
    for ($inicio = 0; $inicio < 20000; $inicio += 5000) {
        $actualizacion->execute([$inicio, $inicio + 5000]); // un tramo de identificadores
    }
});
```

En la máquina de prueba, el resultado es:

```text
uno por uno, sin transacción        48,91 s
uno por uno, una transacción         0,02 s
una consulta en masa                 0,01 s
en masa, tramos de 5.000             0,01 s
```

Las duraciones dependen de la máquina y del disco; solo importa el orden de magnitud. Sin transacción explícita, cada `UPDATE` se valida y fuerza la escritura en el disco, 20.000 veces; eso es lo que cuesta, no el cálculo.

| Criterio | Uno por uno | En masa (una consulta) | En masa por tramos |
|---|---|---|---|
| Coste | Un viaje de ida y vuelta con la base por línea (véase [limitar los viajes de ida y vuelta](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)) | Un solo viaje de ida y vuelta | Pocos viajes de ida y vuelta |
| Bloqueo | Corto, pero repetido en cada línea | Largo: la tabla (o las líneas) queda bloqueada para los demás durante toda la consulta | Corto por tramo; los demás usuarios pasan entre dos tramos |
| Memoria | Todas las líneas leídas en memoria por el programa si se cargan de una vez | Casi nula en el lado del programa | Baja y acotada |
| Transacción | Una por línea (por defecto): un fallo deja la mitad migrada | Una sola: todo o nada | Una por tramo: un fallo deja los tramos ya validados |
| Caso adecuado | Cálculo imposible en SQL (llamada a un servicio, regla compleja) | Cambio expresable en SQL, volumen moderado | Volumen muy grande, base en uso durante la migración |

Un **bloqueo** (*lock*) es una reserva que la base coloca sobre líneas o una tabla mientras las modifica: las demás consultas que las tocan esperan. Una consulta en masa muy larga puede, por tanto, congelar el sitio; los tramos de la última prueba (`WHERE id > ? AND id <= ?`) devuelven el control entre cada tramo. Una migración por tramos debe seguir siendo **reanudable**: si se detiene en el tramo 3, al relanzarla no deben rehacerse los tramos 1 y 2, de ahí el interés de la idempotencia vista antes.

## La salvaguarda antes de borrar

Borrar es la operación que no se puede recuperar: un `DELETE` cuya condición es demasiado amplia (o vacía) elimina todo. Una **salvaguarda** es una comprobación que bloquea la operación cuando algo no cuadra. Cuatro gestos, en este orden:

| Gesto | Pregunta que plantea | Ejemplo en el programa |
|---|---|---|
| Contar | ¿A cuántas líneas apunta la condición? | `SELECT COUNT(*)` con la misma condición que el `DELETE` |
| Limitar | ¿Es verosímil este volumen? | Rechazo por encima de `MAXIMO` (100) líneas por ejecución |
| Confirmar | ¿La persona espera realmente este número? | El número pasado como argumento debe ser igual al número contado, y luego `--confirmar` |
| Guardar | ¿Se puede volver atrás? | `VACUUM INTO` (comando de SQLite que escribe una copia completa de la base en un archivo nuevo) antes del borrado |

El programa `purge.php` borra los clientes inactivos desde antes de 2021. Sin `--confirmar`, se queda en simulación; con él, guarda una copia, borra en una transacción y comprueba que el número de líneas borradas es el que se había contado.

```php
<?php
// Uso: php purge.php <cantidad esperada> [--confirmar]
$esperado = (int) ($argv[1] ?? -1);                 // número de líneas a borrar
$confirmado = in_array('--confirmar', $argv, true); // sin esta opción: simulación
const MAXIMO = 100;                                 // límite: nunca más por ejecución
$pdo = new PDO('sqlite:' . __DIR__ . '/app.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$filtro = "estado = 'inactif' AND ultima_conexion < '2021-01-01'";

// 1. Contar: ¿a cuántas líneas apunta la condición?
$cuenta = (int) $pdo->query("SELECT COUNT(*) FROM clientes WHERE $filtro")->fetchColumn();
echo "$cuenta línea(s) objetivo\n";

// 2. Limitar: rechazar un volumen anormal
if ($cuenta > MAXIMO) {
    exit("Rechazado: más de " . MAXIMO . " líneas.\n");
}
// 3. Confirmar: el número anunciado por la persona debe igualar al número contado
if ($cuenta !== $esperado) {
    exit("Rechazado: $esperado esperada(s), $cuenta encontrada(s).\n");
}
if (!$confirmado) {
    exit("Simulación: añade --confirmar para borrar.\n");
}

// 4. Guardar: copia completa de la base antes de cualquier borrado
$copia = __DIR__ . '/copia-' . date('Ymd-His') . '.db';
$pdo->exec("VACUUM INTO '$copia'");
echo "Copia de seguridad: $copia\n";

// 5. Borrar en una transacción, comprobando el resultado
$pdo->beginTransaction();
$borradas = $pdo->exec("DELETE FROM clientes WHERE $filtro");
if ($borradas !== $cuenta) {
    $pdo->rollBack();                               // desajuste: se anula todo
    exit("Cancelado: $borradas borrada(s) en lugar de $cuenta.\n");
}
$pdo->commit();
echo "$borradas línea(s) borrada(s).\n";
```

Cuatro llamadas sobre la base del capítulo (el nombre de la copia lleva la fecha y la hora):

```text
$ php purge.php 5
2 línea(s) objetivo
Rechazado: 5 esperada(s), 2 encontrada(s).
$ php purge.php 2
2 línea(s) objetivo
Simulación: añade --confirmar para borrar.
$ php purge.php 2 --confirmar
2 línea(s) objetivo
Copia de seguridad: /ruta/copia-20261031-111248.db
2 línea(s) borrada(s).
$ php purge.php 2 --confirmar
0 línea(s) objetivo
Rechazado: 2 esperada(s), 0 encontrada(s).
```

La última línea muestra una ventaja: volver a lanzar por error el mismo comando no borra nada más, porque el recuento baja a 0 y ya no coincide con lo esperado. Para una tabla muy voluminosa, la copia completa puede ser demasiado pesada: entonces se copian solo las líneas afectadas en una tabla de archivo (`INSERT INTO archivo SELECT ... WHERE <misma condición>`) antes del `DELETE`.

## Las trampas

| Trampa | Consecuencia | Remedio |
|---|---|---|
| Modificar un archivo de migración ya aplicado | Las bases ya migradas no lo vuelven a ejecutar: los entornos divergen sin aviso | Escribir una nueva migración; controlar la huella |
| Migrar directamente en producción sin simulación | La sorpresa (volumen, condición falsa) llega cuando ya es tarde | Simular, contar y luego aplicar |
| `UPDATE` o `DELETE` sin `WHERE` | Se tocan todas las líneas de la tabla | Contar antes; rechazar una condición vacía |
| Un `UPDATE` por línea fuera de transacción | Muy lento, y una parada deja la tabla a medio migrar | Una consulta en masa, o una transacción por tramo |
| Una única consulta enorme sobre una tabla muy usada | Bloqueo largo: el sitio se congela | Trabajar por tramos |
| Migración no idempotente relanzada por error | Los valores se modifican dos veces | Escribir la condición para que solo toque lo que queda por hacer |
| Borrar sin copia de seguridad | Ningún retorno posible | Copiar la base o archivar las líneas antes |
| Confundir «líneas seleccionadas» y «líneas modificadas» en un informe | Un informe que parece falso | Filtrar por las líneas realmente distintas |

## Buenas prácticas

| Práctica | Detalle |
|---|---|
| Un archivo numerado por cambio | Nunca se modifica tras aplicarlo; un error se corrige con el archivo siguiente |
| Registrar cada migración ejecutada | Tabla de seguimiento con nombre y huella, como `migraciones` más arriba |
| Simular antes de aplicar | Transacción anulada, o copia de la base, y lectura de los recuentos |
| Preferir el SQL en masa | Tramos para los volúmenes muy grandes; línea por línea solo si SQL no basta |
| Todo en transacción | Un fallo deja la base en el estado anterior |
| Salvaguarda antes de borrar | Contar, limitar, confirmar con el número esperado, guardar |
| Escribir migraciones idempotentes | Un reenvío accidental no cambia nada |

## Lo que hay que recordar

| Noción | A recordar |
|---|---|
| Migración versionada | Un archivo numerado por cambio, nunca modificado tras aplicarlo, una tabla que guarda las migraciones ejecutadas |
| Simulación (*dry run*) | Se ejecuta, se cuenta, se anula: la respuesta llega antes de lo irreversible |
| En masa o uno por uno | Una consulta SQL es mucho más rápida; los tramos limitan el bloqueo y el riesgo; uno por uno queda para los cálculos fuera de SQL |
| Transacción | Todo o nada: un fallo no deja la mitad de las líneas migradas |
| Salvaguarda de borrado | Contar, limitar, confirmar el número, guardar; luego verificar el número borrado |
