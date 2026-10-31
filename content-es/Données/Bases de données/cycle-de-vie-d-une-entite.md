---
order: 11
---

# Ciclo de vida de una entidad, esquema por código y campo calculado

Una **entidad** es un objeto del programa que representa una línea de datos duradera: un libro, un cliente, un pedido. Se crea, se guarda, se modifica y, un día, se elimina. El código que gestiona estas entidades (a menudo un [ORM](/?c=donnees&s=bases-de-donnees&p=orm), que traduce objetos en filas de tabla, algo que este capítulo no repite) llama en cada etapa de su vida a métodos que el proyecto puede completar: son las etapas del **ciclo de vida**. Este capítulo explica qué se puede hacer en esas etapas, qué no hay que hacer en absoluto, y después dos ideas cercanas: describir el esquema de datos en una clase en lugar de en un archivo SQL, y no guardar nunca un valor que sabemos recalcular.

Los ejemplos están en [PHP](/?c=langages&s=php&p=poo) y en [JavaScript](/?c=langages&s=javascript&p=poo) genéricos. Algunos frameworks (Drupal, por ejemplo) funcionan así, pero nada de lo que aquí se explica depende de ello.

## Las cuatro etapas

Una etapa del ciclo de vida es un **método de devolución de llamada** (en inglés *callback*): el código del ORM lo llama por sí mismo, en el momento adecuado, sin que el proyecto tenga que pedirlo. Cuatro etapas cubren casi todas las necesidades:

| Etapa | Momento | Qué se puede hacer | Qué no hay que hacer |
|---|---|---|---|
| `preSave` | justo antes de la escritura | limpiar o completar un valor, calcular una fecha, rechazar un valor no válido (lanzando una excepción) | enviar un mensaje, llamar a otro servicio: la escritura todavía no ha ocurrido y puede fallar |
| `postSave` | justo después de la escritura | registrar en un diario, vaciar una caché, avisar a otro sistema | volver a guardar la misma entidad (bucle), llamar a la red antes del final de la transacción |
| `preDelete` | justo antes de la eliminación | rechazar la eliminación (excepción) si la entidad todavía está en uso | modificar otros datos de forma definitiva: la eliminación puede anularse |
| `postDelete` | justo después de la eliminación | eliminar los datos que dependían de la entidad, vaciar una caché | leer la entidad como si todavía existiera en la base |

El desarrollo de un guardado seguido de una eliminación:

```text
save(entidad)                               delete(entidad)
    |                                          |
    v                                          v
 preSave   -- excepción ? todo se detiene  preDelete -- excepción ? todo se detiene
    |                                          |
    v                                          v
 escritura en la base                       eliminación en la base
    |                                          |
    v                                          v
 postSave                                   postDelete
```

El código siguiente es un depósito mínimo que llama a estas cuatro etapas, para ver el orden real. Es ejecutable con Node.js (la herramienta que ejecuta JavaScript fuera de un navegador):

```javascript
// Un depósito mínimo que llama a las cuatro etapas del ciclo de vida
class Deposito {
  constructor() {
    this.lineas = new Map(); // la "tabla": identificador -> valores
    this.traza = []; // el orden de los eventos, para mostrarlo
  }

  save(entidad) {
    entidad.preSave(this); // 1. antes de la escritura
    this.lineas.set(entidad.id, { ...entidad.valores }); // 2. escritura
    this.traza.push(`escrito ${entidad.id}`); // 3. anotamos la escritura
    entidad.postSave(this); // 4. después de la escritura
  }

  delete(entidad) {
    entidad.preDelete(this); // 1. antes de la eliminación
    this.lineas.delete(entidad.id); // 2. eliminación
    this.traza.push(`eliminado ${entidad.id}`); // 3. anotamos la eliminación
    entidad.postDelete(this); // 4. después de la eliminación
  }
}

class Articulo {
  constructor(id, titulo) {
    this.id = id; // identificador de la línea
    this.valores = { titulo }; // valores almacenados
  }

  preSave(deposito) {
    this.valores.titulo = this.valores.titulo.trim(); // limpiar un valor
    deposito.traza.push("preSave : título limpiado");
  }

  postSave(deposito) {
    deposito.traza.push("postSave : registro escrito"); // efecto secundario local
  }

  preDelete(deposito) {
    deposito.traza.push("preDelete : verificación"); // rechazar aquí si hace falta
  }

  postDelete(deposito) {
    deposito.traza.push("postDelete : caché vaciada"); // limpiar lo que depende
  }
}

const deposito = new Deposito();
const articulo = new Articulo(1, "  Hola  ");
deposito.save(articulo);
deposito.delete(articulo);
console.log(deposito.traza.join("\n"));
console.log(JSON.stringify([...deposito.lineas]));
```

Resultado real:

```text
preSave : título limpiado
escrito 1
postSave : registro escrito
preDelete : verificación
eliminado 1
postDelete : caché vaciada
[]
```

La última línea (`[]`) muestra que la «tabla» está vacía después de la eliminación.

> **Sutileza:** una eliminación o una actualización hecha con una consulta SQL directa sobre muchas filas a la vez normalmente no pasa por estas etapas: el ORM no ve las filas una a una. Una regla programada en `preDelete` solo protege, por tanto, las eliminaciones hechas a través de la entidad.

## Los efectos secundarios

Un **efecto secundario** es todo lo que un fragmento de código cambia fuera de su resultado directo: escribir en un archivo, enviar un correo, modificar otra entidad, llamar a otro servidor. Las etapas del ciclo de vida son el lugar natural para dispararlos, pero dos trampas vuelven una y otra vez.

### Trampa 1: el bucle de guardado

Si `postSave` vuelve a guardar la misma entidad, ese guardado dispara un nuevo `postSave`, que vuelve a guardar, y así sucesivamente: un **bucle infinito** (el programa gira sin parar, o se bloquea por falta de memoria). El código siguiente coloca un dispositivo de seguridad voluntario (a partir de 5 pasadas, lanza un error) para observar el problema sin bloquear la máquina:

```javascript
// Bucle de guardado: postSave guarda de nuevo la misma entidad
let llamadas = 0; // cuenta las pasadas en postSave
const lineas = new Map(); // la "tabla"

function save(entidad) {
  lineas.set(entidad.id, { ...entidad.valores }); // escritura
  entidad.postSave(); // etapa después de la escritura
}

const malo = {
  id: 1,
  valores: { vistas: 0 },
  postSave() {
    llamadas += 1; // una pasada más
    if (llamadas > 5) throw new Error("bucle : más de 5 pasadas");
    this.valores.vistas += 1; // modificación de la entidad
    save(this); // guarda de nuevo: postSave volverá a llamarse
  },
};

try {
  save(malo);
} catch (error) {
  console.log("Malo :", error.message);
}

// Corrección: escribir directamente el valor derivado, sin volver a pasar por save
llamadas = 0;
const bueno = {
  id: 2,
  valores: { vistas: 0 },
  postSave() {
    llamadas += 1;
    const linea = lineas.get(this.id); // la línea ya escrita
    linea.vistas += 1; // actualización directa, ningún evento disparado
  },
};
save(bueno);
console.log("Bueno : pasadas =", llamadas, "linea =", JSON.stringify(lineas.get(2)));
```

Resultado real:

```text
Malo : bucle : más de 5 pasadas
Bueno : pasadas = 1 linea = {"vistas":1}
```

| Remedio | Principio | Límite |
|---|---|---|
| Calcular en `preSave` | el valor modificado sale con la escritura en curso: un solo registro | todavía no existe: no conocemos el identificador de una entidad nueva |
| Escribir sin pasar por el evento | una consulta directa solo sobre la columna afectada | también se saltan las demás reglas del ciclo de vida |
| Indicador «ya tratado» | una propiedad que corta la recursión en la segunda pasada | hay que acordarse de ponerla a cero, o bloqueamos los registros reales siguientes |
| Mover el efecto a otro lugar | un tratamiento diferido (tarea programada, cola de espera) | más código, y un retraso antes del efecto |

### Trampa 2: la llamada de red dentro de una transacción

Una **transacción** es un conjunto de escrituras que se validan juntas o se anulan juntas: si una falla, ninguna queda. Un guardado de entidad se hace a menudo dentro de una transacción, y `postSave` se ejecuta antes de que esa transacción haya terminado. Una **llamada de red** (un correo, una petición a otro servidor, ver [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) lanzada en ese momento plantea dos problemas:

| Problema | Explicación |
|---|---|
| Mensaje enviado para nada | si la transacción se anula después, la escritura desaparece pero el correo ya salió: el cliente recibe una confirmación de un pedido que no existe |
| Transacción abierta demasiado tiempo | un servidor remoto lento mantiene la base bloqueada durante la espera, y bloquea a los demás usuarios |

El código siguiente simula una transacción (una copia provisional de la «base», recopiada solo si todo sale bien) y compara dos formas de enviar un mensaje:

```javascript
// Una transacción: todo se valida junto, o todo se anula
const base = new Map(); // estado validado
const enviados = []; // correos realmente enviados

async function transaccion(trabajo) {
  const copia = new Map(base); // estado provisional
  const cola = []; // acciones a lanzar tras la validación
  try {
    await trabajo(copia, (accion) => cola.push(accion));
    base.clear(); // validación: la copia pasa a ser el estado real
    copia.forEach((v, k) => base.set(k, v));
    cola.forEach((accion) => accion()); // acciones diferidas
  } catch (error) {
    return `anulada : ${error.message}`; // no se escribe nada, nada sale
  }
  return "validada";
}

const enviar = (direccion) => enviados.push(direccion); // falsa llamada de red

// Malo: la llamada de red sale ANTES del final, y luego la transacción falla
const r1 = await transaccion(async (datos) => {
  datos.set(1, "pedido");
  enviar("a@example.com"); // enviado de verdad
  throw new Error("stock insuficiente");
});
console.log("Malo :", r1, "base =", base.size, "enviados =", enviados.length);

// Bueno: el envío se pone en cola y solo sale tras la validación
const r2 = await transaccion(async (datos, despues) => {
  datos.set(1, "pedido");
  despues(() => enviar("b@example.com")); // diferido
  throw new Error("stock insuficiente");
});
console.log("Bueno (fallo) :", r2, "base =", base.size, "enviados =", enviados.length);

const r3 = await transaccion(async (datos, despues) => {
  datos.set(1, "pedido");
  despues(() => enviar("c@example.com"));
});
console.log("Bueno (éxito) :", r3, "base =", base.size, "enviados =", enviados.length);
```

Resultado real:

```text
Malo : anulada : stock insuficiente base = 0 enviados = 1
Bueno (fallo) : anulada : stock insuficiente base = 0 enviados = 1
Bueno (éxito) : validada base = 1 enviados = 2
```

El primer intento muestra el defecto: `base = 0` (no se escribe nada) pero `enviados = 1` (un mensaje salió igualmente). El segundo intento no añade ningún mensaje (`enviados` sigue en 1); solo el tercero, que tiene éxito, añade uno. La misma idea aparece en una [cola de mensajes o un tratamiento por lotes](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots): se pone la acción en espera, otro proceso la ejecuta, y se puede volver a reproducir si falla.

## Un esquema de datos construido por código

El **esquema** de una tabla es su descripción: qué columnas, de qué tipo, con qué restricciones (ver [esquemas y tablas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) para el sentido de la palabra «esquema» en una base). Tradicionalmente se escribe en un archivo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) (`CREATE TABLE ...`). Otro enfoque consiste en declararlo en la clase de la entidad: cada campo es un pequeño objeto, una **definición de campo**, y el framework deduce la tabla.

| | Archivo SQL | Definiciones de campos en una clase |
|---|---|---|
| Dónde vive el esquema | un archivo separado del código | la clase de la entidad |
| Quién escribe el `CREATE TABLE` | el desarrollador, a mano | el código, deducido de los campos |
| Añadir un campo | modificar el archivo SQL y el código PHP | añadir una línea en la lista de campos |
| Riesgo principal | el código y el SQL se contradicen | un error de definición se propaga por todas partes |
| Otros usos posibles | ninguno | generar también un formulario, una validación, una API |

El código PHP siguiente declara tres campos y luego deduce la instrucción SQL. Después crea de verdad la tabla en una base SQLite en memoria con PDO (la biblioteca PHP estándar de acceso a bases de datos, [documentación oficial](https://www.php.net/manual/es/book.pdo.php)):

```php
<?php
// Una definición de campo: un nombre, un tipo SQL y una restricción
final class Campo
{
    public function __construct(
        public string $nombre,
        public string $tipoSql,
        public bool $obligatorio = false,
    ) {}

    // Escribe la columna SQL que corresponde al campo
    public function aSql(): string
    {
        return $this->nombre . ' ' . $this->tipoSql . ($this->obligatorio ? ' NOT NULL' : '');
    }
}

// Una entidad describe ella misma sus campos: el esquema vive en la clase
class Libro
{
    // Lista de los campos almacenados (una columna cada uno)
    public static function campos(): array
    {
        return [
            new Campo('id', 'INTEGER PRIMARY KEY'),
            new Campo('titulo', 'TEXT', true),
            new Campo('precio_base', 'REAL', true),
        ];
    }

    // Deduce la instrucción CREATE TABLE de la lista de campos
    public static function crearTabla(): string
    {
        $columnas = array_map(fn (Campo $c) => $c->aSql(), self::campos());
        return 'CREATE TABLE libro (' . implode(', ', $columnas) . ')';
    }

    public function __construct(private array $valores) {}

    // Campo calculado: nunca almacenado, recalculado en cada lectura
    public function precioConIva(): float
    {
        return round($this->valores['precio_base'] * 1.2, 2);
    }
}

echo Libro::crearTabla(), "\n";
$libro = new Libro(['id' => 1, 'titulo' => 'PHP', 'precio_base' => 10.0]);
echo $libro->precioConIva(), "\n";
$sqlite = new PDO('sqlite::memory:');
$sqlite->exec(Libro::crearTabla());
$filas = $sqlite->query('SELECT count(*) FROM libro')->fetchColumn();
echo 'tabla creada, filas : ', $filas, "\n";
```

Resultado real:

```text
CREATE TABLE libro (id INTEGER PRIMARY KEY, titulo TEXT NOT NULL, precio_base REAL NOT NULL)
12
tabla creada, filas : 0
```

Vocabulario PHP del bloque: `final` prohíbe heredar de la clase; `public`/`private` regulan quién puede leer una propiedad; `static` vincula el método a la clase, no a una instancia; `fn (...) =>` es una función corta aplicada a cada campo por `array_map`. Los fundamentos de la [programación orientada a objetos en PHP](/?c=langages&s=php&p=poo) están en su capítulo.

> **Trampa:** cambiar una definición de campo solo tiene efecto sobre una tabla creada después. Una tabla ya llena no se modifica sola: hay que mover y convertir sus filas, lo que corresponde a las migraciones de datos seguras, tratadas en un capítulo aparte.

## El campo calculado

Un **campo calculado** se parece a un campo para quien lo usa (`libro.precioConIva`), pero no tiene ninguna columna: su valor se **recalcula en cada lectura** a partir de otros campos. Un precio con impuestos incluidos, un nombre completo (nombre y apellidos), una edad (a partir de una fecha de nacimiento) son ejemplos típicos.

| | Valor almacenado | Valor calculado |
|---|---|---|
| Dónde vive | una columna, escrita al guardar | una función, releída en cada acceso |
| Frescura | caducado si el origen cambia sin actualización | siempre al día |
| Coste en lectura | una simple lectura | un cálculo cada vez |
| Filtrar u ordenar en SQL | posible (e indexable con un [índice](/?c=donnees&s=bases-de-donnees&p=les-index)) | imposible directamente: la base no lo conoce |
| Adecuado para | un valor costoso de producir y raramente modificado | un valor derivado, barato de producir |

El código siguiente muestra el valor almacenado que se vuelve falso, y el valor calculado que sigue siendo exacto. `Object.defineProperty` con `get` declara una propiedad cuyo valor produce una función en cada lectura:

```javascript
// Valor almacenado: copiado una vez, se vuelve falso cuando cambia el origen
const libro = { precioBase: 10, iva: 0.2 };
libro.precioConIvaGuardado = libro.precioBase * (1 + libro.iva); // escrito una sola vez

// Valor calculado: una función releída en cada acceso
Object.defineProperty(libro, "precioConIva", {
  get() {
    return libro.precioBase * (1 + libro.iva); // recalculado en cada lectura
  },
});

libro.precioBase = 20; // cambia el origen
console.log("guardado :", libro.precioConIvaGuardado); // 12: caducado
console.log("calculado :", libro.precioConIva); // 24: al día
console.log(JSON.stringify(libro)); // el campo calculado no se serializa
```

Resultado real:

```text
guardado : 12
calculado : 24
{"precioBase":20,"iva":0.2,"precioConIvaGuardado":12}
```

La última línea muestra que un campo calculado no aparece en los datos escritos: no tiene sitio en la base, así que no hay nada que sincronizar.

## Las trampas

| Trampa | Consecuencia | Remedio |
|---|---|---|
| Volver a registrar la entidad en `postSave` | bucle infinito, bloqueo | calcular en `preSave`, o escribir la única columna con una consulta directa |
| Llamada de red en `postSave` | mensaje enviado por una transacción anulada, base bloqueada mucho tiempo | poner la acción en cola, ejecutarla tras la validación |
| Confiar en `preDelete` para protegerlo todo | una consulta SQL directa masiva lo salta | mantener también una restricción en la base (clave foránea) |
| Efecto secundario en `preSave` | la escritura puede fallar después | reservar `preSave` para los valores de la propia entidad |
| Guardar un valor derivado | se vuelve falso en cuanto cambia el origen | calcularlo al leer, o recalcularlo en cada guardado |
| Campo calculado costoso | lento en cada lectura, sobre todo en una lista (ver el problema N+1 del [ORM](/?c=donnees&s=bases-de-donnees&p=orm)) | guardar el resultado, con una regla clara de actualización |
| Modificar una definición de campo sobre una tabla llena | la tabla y el código divergen | una migración de datos segura (capítulo vecino) |

## Buenas prácticas

| Práctica | Razón |
|---|---|
| Mantener cada etapa corta y rápida | se ejecuta en cada guardado de cada entidad |
| `preSave` para corregir, `postSave` para reaccionar | el valor que sale con la escritura es el correcto desde la primera pasada |
| Diferir toda llamada externa hasta después de la validación | ningún mensaje para una escritura anulada |
| Probar el orden de las etapas con una traza, como en el primer ejemplo | se ve lo que realmente se llama |
| Declarar un campo calculado en lugar de duplicar un dato | una única fuente de verdad, nada que sincronizar |
| Guardar el esquema de una sola forma (código o SQL) | evitar que se contradigan |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un ciclo de vida ofrece cuatro etapas de devolución de llamada: `preSave`, `postSave`, `preDelete`, `postDelete`. Un esquema puede declararse mediante definiciones de campos en una clase. Un campo calculado nunca se almacena y se recalcula en cada lectura. |
| **Herramientas utilizables** | Un [ORM](/?c=donnees&s=bases-de-donnees&p=orm) que llama a las etapas; las transacciones de la base; una cola para diferir los efectos; un accesor (`get`, método) para un campo calculado. |
| **Trampas a evitar** | El bucle de guardado; la llamada de red dentro de una transacción; una eliminación masiva que salta `preDelete`; un valor derivado almacenado que envejece. |
| **Buenas prácticas** | Corregir en `preSave`, reaccionar en `postSave`, diferir la red tras la validación, guardar solo lo que no se puede recalcular a bajo coste. |
