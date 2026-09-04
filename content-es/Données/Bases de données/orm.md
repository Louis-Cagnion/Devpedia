---
order: 7
---

# El ORM: mapear objetos sobre tablas relacionales

Un programa orientado a objetos manipula clases e instancias; una base relacional almacena tablas y filas. Los dos modelos no se superponen de forma natural (una relación entre dos objetos no es una clave foránea, una herencia de clases no tiene equivalente directo en [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)): un **ORM** (*Object-Relational Mapping*) automatiza la traducción entre ambos, para escribir código contra objetos en lugar de consultas SQL manuales.

## Lo que un ORM automatiza

Un ORM asocia una clase a una tabla, una instancia a una fila, un atributo a una columna, y luego genera él mismo el SQL correspondiente:

```text
Modelo objeto:                    Modelo relacional:

class Usuario {              <->  TABLE usuarios (
  id                                id INTEGER PRIMARY KEY,
  email                             email TEXT,
  pedidos: Pedido[]                 ...
}                                  )
                                   TABLE pedidos (
                                     id_usuario INTEGER REFERENCES usuarios(id),
                                     ...
                                   )
```

```javascript
// Con un ORM (ejemplo Prisma): un objeto, no una consulta SQL escrita a mano
const usuario = await prisma.usuario.create({
  data: { email: "alice@ejemplo.com" }
});

// El SQL generado por el ORM, nunca escrito directamente:
// INSERT INTO usuarios (email) VALUES ('alice@ejemplo.com');
```

El [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) básico (crear, leer, modificar, eliminar) se genera automáticamente para cada tabla declarada, sin escribir uno mismo la más mínima consulta para esos casos simples.

## Las migraciones: versionar el esquema como código

El esquema de una base evoluciona con la aplicación (nueva columna, nueva tabla, restricción modificada). Una **migración** es un script que describe ese cambio de forma incremental y reversible, seguido por [Git](/?c=git&p=git) igual que el código de la aplicación:

```text
migrations/
  20260101_crear_usuarios.sql
  20260115_anadir_columna_email_verificado.sql
  20260201_crear_tabla_pedidos.sql
```

Cada migración se aplica en orden, una sola vez, en cada entorno (máquina de desarrollo, preproducción, producción): el esquema de la base se vuelve reproducible a partir del historial de migraciones, en lugar de depender de una serie de modificaciones manuales nunca rastreadas.

> **Trampa:** modificar el esquema directamente en producción (un `ALTER TABLE` ejecutado a mano), sin la migración versionada correspondiente. El esquema real diverge entonces silenciosamente de lo que describe el código, hasta que un despliegue en otro entorno falla o reproduce un estado distinto.
>
> **Buena práctica:** hacer pasar todo cambio de esquema por una migración versionada, incluso para un ajuste en apariencia menor, exactamente como un cambio de código pasa por un commit.

## Type-safety: detectar un error antes de la ejecución

Un ORM como Prisma genera tipos a partir del esquema de la base: un error tipográfico en un nombre de columna o un tipo de valor incorrecto se detecta en la compilación, incluso antes de ejecutar el programa, en lugar de en el momento en que la consulta SQL inválida falla en producción:

```javascript
prisma.usuario.create({ data: { emial: "alice@ejemplo.com" } });
// Error de compilacion inmediato: "emial" no existe en este modelo
```

Una consulta SQL escrita a mano en una cadena de caracteres no ofrece ninguna de estas garantías: el mismo error tipográfico solo se detectaría ahí en la ejecución, si es que se detecta.

## La trampa clásica: el problema N+1

Acceder a una relación (los pedidos de un usuario, por ejemplo) dentro de un bucle suele disparar una consulta separada en **cada iteración**, en lugar de una única consulta que lo obtenga todo de una vez:

```javascript
const usuarios = await prisma.usuario.findMany(); // 1 consulta

for (const u of usuarios) {
  const pedidos = await prisma.pedido.findMany({ where: { id_usuario: u.id } });
  // 1 consulta adicional POR usuario: N usuarios -> N+1 consultas en total
}
```

> **Trampa:** cargar una relación dentro de un bucle sin darse cuenta, porque el ORM hace que esa llamada sea tan sencilla sintácticamente como acceder a un atributo normal. Con 1000 usuarios, este código dispara 1001 consultas separadas donde una sola, con un join, bastaría.
>
> **Buena práctica:** precargar las relaciones necesarias en una única consulta (`include`/`with`/*eager loading* según el ORM), antes del bucle, en lugar de dejar que el ORM dispare una nueva en cada iteración.

```javascript
// 1 sola consulta, con join, en lugar de N+1
const usuarios = await prisma.usuario.findMany({ include: { pedidos: true } });
```

## Cuándo un ORM no es la respuesta adecuada

Un ORM destaca en [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) simple, pero a veces fuerza una consulta de análisis compleja (agregaciones múltiples, ventaneo, muchos joins; ver [Data warehouse vs data lake](/?c=bases-de-donnees&p=entrepot-vs-data-lake) para ese tipo de necesidad OLAP) dentro de una sintaxis pensada para manipular objetos, no para expresar una consulta analítica. El SQL puro, o un *query builder* más cercano al SQL que un ORM completo, suele seguir siendo más claro y más eficiente para este tipo de caso.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un ORM traduce automáticamente entre el modelo objeto del código y el modelo relacional de la base (clase/tabla, instancia/fila). Las migraciones versionan el esquema como código. La generación de tipos detecta un error de esquema en la compilación en lugar de en la ejecución. |
| **Herramientas utilizables** | Un ORM (Prisma y equivalentes) para el CRUD habitual; migraciones versionadas para todo cambio de esquema; la precarga de relaciones (`include`/`with`) para evitar una consulta por iteración. |
| **Trampas a evitar** | Modificar el esquema en producción sin migración versionada. Cargar una relación dentro de un bucle (problema N+1). |
| **Buenas prácticas** | Hacer pasar todo cambio de esquema por una migración versionada. Precargar las relaciones necesarias en una única consulta, antes del bucle que las usa. Reservar el SQL puro para consultas analíticas complejas que la abstracción del ORM haría menos claras. |
