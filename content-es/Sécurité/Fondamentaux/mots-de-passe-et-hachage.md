---
order: 2
---

# Contraseñas y hash seguro

Una contraseña nunca debe almacenarse tal cual (en texto plano) en una [base de datos](/?c=domain-specific-languages-dsl&p=sql): si esa base sufre una fuga algún día (pirateo, copia de seguridad mal protegida, empleado malintencionado), todas las contraseñas se vuelven inmediatamente legibles, para todas las cuentas, en todos los sitios donde el usuario las reutilizó. El **hash** es la técnica que evita este escenario.

## El hash: una función de un solo sentido

Una **función de hash** transforma una entrada (la contraseña) en una salida de tamaño fijo (el *hash*), con dos propiedades: la misma entrada siempre produce la misma salida, y en la práctica es imposible recuperar la entrada a partir de la sola salida.

```text
"contrasena123"  ->  hash  ->  ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94
```

> **No confundir:** una *tabla hash* (ver [el capítulo dedicado en C](/?c=langages-de-programmation&s=c&p=tables-de-hachage)) es una estructura de datos que acelera la búsqueda de un elemento; una *función de hash criptográfica*, aquí, sirve para hacer ilegible un secreto. Ambas usan la palabra "hash" para una operación matemática cercana (transformar una entrada en una salida de tamaño fijo), pero con fines totalmente distintos.

Almacenar el hash en lugar de la contraseña cambia la consecuencia de una fuga:

| | Contraseña almacenada en texto plano | Contraseña almacenada con hash |
|---|---|---|
| Fuga de la base de datos | Todas las contraseñas quedan inmediatamente legibles | Un atacante recupera hashes, no las contraseñas en sí |
| Conexión de un usuario legítimo | Comparación directa del texto introducido | El texto introducido se hashea a su vez, y se compara con el hash |

## Por qué un hash "rápido" es peligroso para una contraseña

Funciones de hash como [SHA-256](https://en.wikipedia.org/wiki/SHA-2) existen desde hace tiempo y son deliberadamente **rápidas**: ideal para verificar que un archivo descargado no se corrompió, catastrófico para una contraseña. Un atacante que recupera una base de hashes no necesita "romper" el hash en sí: prueba contraseñas candidatas (un **ataque de diccionario**), hasheando cada una y comparando con el resultado robado. Cuanto más rápido es el hash, más puede probar por segundo.

| Función | Diseñada para | Velocidad | ¿Adecuada para contraseñas? |
|---|---|---|---|
| [MD5](https://en.wikipedia.org/wiki/MD5), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), SHA-256 | Verificar la integridad de un archivo, indexar rápidamente | Miles de millones de hashes por segundo en hardware dedicado | No |
| [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [scrypt](https://en.wikipedia.org/wiki/Scrypt), [Argon2](https://en.wikipedia.org/wiki/Argon2) | Hashear específicamente contraseñas | Deliberadamente lenta, ajustable | Sí |

> **Trampa:** usar SHA-256 (o peor, MD5) para hashear una contraseña, pensando que un hash criptográfico "sólido" basta. Estas funciones son sólidas para su uso previsto (integridad), pero su misma rapidez es lo que las hace inadecuadas aquí: un atacante equipado con hardware especializado puede probar miles de millones de combinaciones por segundo.
>
> **Buena práctica:** usar una función específicamente diseñada para contraseñas (bcrypt, Argon2), cuya lentitud es una decisión de diseño deliberada, ajustable para seguir siendo costosa incluso a medida que el hardware avanza.

## La sal: impedir los ataques por precálculo

Sin precaución adicional, un atacante puede precalcular de una vez el hash de millones de contraseñas comunes (una [**rainbow table**](https://en.wikipedia.org/wiki/Rainbow_table)), y luego buscar una correspondencia instantánea en una base robada. La **sal** (*salt*) contrarresta esta estrategia: un valor aleatorio, único para cada contraseña, combinado con ella antes del hasheo.

```text
Sin sal  :  hash("contrasena123")                    -> siempre el mismo resultado
Con sal  :  hash("contrasena123" + "a8f3...")         -> resultado diferente para cada usuario
            hash("contrasena123" + "9c21...")         -> misma contrasena, hash diferente
```

Dos usuarios con la misma contraseña obtienen así hashes diferentes, y una rainbow table precalculada sin conocer la sal se vuelve inutilizable. La sal no necesita permanecer secreta: generalmente se almacena junto al hash mismo, solo la contraseña original debe permanecer imposible de recuperar.

> **Buena práctica:** generar la sal con un generador aleatorio criptográfico en lugar de un generador clásico (ver [Pseudoaleatoriedad y generadores](/?c=representation-des-donnees&p=aleatoire-et-generateurs), que cita precisamente la sal de contraseña como caso de uso que requiere un CSPRNG), para que siga siendo imprevisible.

## Pasar a la implementación

En la práctica, elegir el algoritmo, generar la sal y gestionar su integración al hash final lo asume una función dedicada del lenguaje utilizado, nunca a reimplementar uno mismo: ver [`password_hash()` y `password_verify()`](/?c=langages-de-programmation&s=php&p=securite) para la implementación concreta en PHP, que usa bcrypt por defecto y detalla cómo se integra la sal en el hash almacenado.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una contraseña siempre se hashea antes de almacenarse, nunca en texto plano. Una función de hash rápida (SHA-256, MD5) facilita los ataques de diccionario; una función lenta y ajustable dedicada (bcrypt, Argon2) los ralentiza deliberadamente. La sal impide los ataques por precálculo (rainbow tables) y garantiza un hash diferente para una misma contraseña entre dos usuarios. |
| **Herramientas utilizables** | bcrypt, Argon2, scrypt para el hasheo; un generador aleatorio criptográfico para la sal. |
| **Trampas a evitar** | Usar SHA-256/MD5 para hashear una contraseña. Reimplementar uno mismo la generación de la sal o la comparación de hashes en lugar de usar las funciones dedicadas del lenguaje. |
| **Buenas prácticas** | Usar siempre una función de hash diseñada para contraseñas, nunca una función de hash general. Dejar la generación de la sal a una función dedicada en lugar de programarla a mano. |
