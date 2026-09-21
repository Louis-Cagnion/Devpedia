---
order: 15
---

# Lógica de negocio y elusiones automatizadas

Los capítulos anteriores cubren fallos TÉCNICOS (un dato mal validado, un acceso mal verificado). Esta familia es diferente: el código puede ser técnicamente impecable y seguir siendo explotable, porque la REGLA DE NEGOCIO en sí misma está incompleta o mal situada. Ningún escáner automático detecta estos fallos: hay que conocer el negocio de la aplicación para saber qué probar.

## Mass assignment: aceptar más campos de los previstos

Un endpoint que actualiza un objeto aceptando directamente TODOS los campos recibidos en la petición (en lugar de una lista explícita de campos permitidos) deja que el cliente envíe un campo que nunca debería poder modificar por sí mismo.

```php
// PELIGROSO: acepta todos los campos recibidos, incluidos los que un formulario
// legitimo nunca expondria
$usuario->update($_POST);
// Si el cliente añade discretamente "role=admin" a su petición de edición de perfil,
// y la tabla "usuarios" tiene efectivamente una columna "role"...
// ese campo se actualiza como cualquier otro, sin distinción

// SEGURO: lista blanca explicita de los campos que ESTE endpoint puede modificar
$campos_permitidos = ['nombre', 'email', 'bio'];
$datos = array_intersect_key($_POST, array_flip($campos_permitidos));
$usuario->update($datos);
```

> **Buena práctica:** definir explícitamente, para cada endpoint, la lista de campos que tiene permitido modificar, en lugar de transmitir tal cual cualquier dato recibido a la actualización de un objeto.

## Salami slicing: acumular numerosas ganancias pequeñas e insignificantes

El nombre viene de las finas rodajas de salami: un fraude que sustrae, en cada operación, una cantidad individualmente tan pequeña que ningún control unitario la nota, pero que se vuelve significativa una vez repetida a gran escala. Caso de manual: un redondeo de cálculo (división, tasa, conversión) truncado sistemáticamente en el mismo sentido en lugar de redondeado correctamente, cuyo remanente se redirige a una cuenta controlada por el atacante.

```text
1.000.000 transacciones x 0,004 centimos "perdidos" en cada redondeo = 4000 centimos = 40 euros
-> invisible transaccion por transaccion, significativo a la escala del volumen procesado
```

> **Trampa:** probar una regla de cálculo financiero con un único importe de referencia, que nunca revela una desviación que solo aparece a gran escala o sobre una distribución de valores variados.
>
> **Buena práctica:** probar una lógica de redondeo/distribución sobre un gran volumen de valores variados verificando la suma acumulada en lugar de un solo caso; asegurarse de que un remanente de redondeo siempre se contabiliza en algún lugar trazable, nunca perdido silenciosamente ni redirigido sin rastro.

## Enumeración de usuarios: un mensaje de error demasiado preciso

Un formulario de inicio de sesión (o de restablecimiento de contraseña) que distingue "contraseña incorrecta" de "esta cuenta no existe" revela, sin dar acceso, qué cuentas existen realmente.

| Respuesta | Qué revela |
|---|---|
| "Ninguna cuenta asociada a este email" | Confirma que el email NO está registrado (información útil para un atacante sobre otros emails probados) |
| "Contraseña incorrecta" | Confirma que la cuenta EXISTE, restringe el resto del ataque a adivinar solo la contraseña |
| "Credenciales inválidas" (mismo mensaje en ambos casos) | No revela nada más que un par email/contraseña incorrecto, sin precisar cuál |

Esta información, gratuita para el atacante, ahorra una etapa entera de un ataque de fuerza bruta o de un phishing dirigido (saber QUIÉN tiene una cuenta antes incluso de intentar conectarse a ella).

> **Buena práctica:** devolver un mensaje de error estrictamente idéntico, exista o no el email, tanto en el formulario de inicio de sesión COMO en el de restablecimiento de contraseña.

## Race condition / TOCTOU: explotar el retraso entre verificar y actuar

**TOCTOU** (*time-of-check to time-of-use*) nombra el retraso, aunque sea muy corto, entre el momento en que el código VERIFICA que una condición es cierta y el momento en que ACTÚA en consecuencia. Si el estado puede cambiar durante esa ventana, dos peticiones simultáneas pueden pasar ambas la verificación antes de que ninguna de las dos haya actuado todavía.

```text
Codigo vulnerable (uso de un cupon de un solo uso):

  Peticion A                          Peticion B
  -----------                         -----------
  1. Verifica: el cupon "PROMO"
     ya esta usado? NO
                                       2. Verifica: el cupon "PROMO"
                                          ya esta usado? NO
                                          (estado aun no modificado por A)
  3. Marca "PROMO" como usado
     aplica el descuento
                                       4. Marca "PROMO" como usado
                                          aplica el descuento UNA 2a VEZ
```

Ambas peticiones, enviadas con unos milisegundos de diferencia (a menudo automatizadas expresamente para esto), pasan ambas la verificación ANTES de que ninguna haya tenido tiempo de marcar el cupón como usado.

> **Buena práctica:** hacer que la operación "verificar y luego actuar" sea ATÓMICA (un único paso indivisible, garantizado por la propia base de datos: una restricción de unicidad, una actualización condicional en una sola consulta) en lugar de dos pasos separados en el código de la aplicación, donde otra petición siempre puede intercalarse entre los dos.

## Suplantación por homógrafo Unicode

Dos caracteres pueden mostrarse de forma idéntica o casi idéntica en pantalla siendo, para el ordenador, caracteres totalmente DIFERENTES (puntos de código [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) distintos). Un nombre de usuario o dominio elegido con estos caracteres engaña al ojo humano sin provocar un conflicto de unicidad en la base de datos.

```text
"admin"  (caracteres latinos estandar)
"аdmin"  (la "а" es cirilica, U+0430, visualmente identica a la "a" latina U+0061)

-> Ambos textos PARECEN identicos a la vista, pero son dos valores
   DIFERENTES para una comparacion de cadena clasica: un atacante puede
   crear "аdmin" junto a una cuenta real "admin" ya existente, sin conflicto
```

> **Buena práctica:** normalizar (véanse las funciones de normalización Unicode estándar, ej. NFKC) y/o restringir el conjunto de caracteres permitido para cualquier identificador destinado a compararse por su unicidad (nombre de usuario, subdominio), en lugar de aceptar cualquier carácter Unicode.

## Elusión de filtro mediante codificación

Un filtro de validación que decodifica o normaliza un dato UNA SOLA VEZ antes de verificarlo puede eludirse con una capa adicional de codificación, revelada solo en un procesamiento posterior.

```text
Filtro que bloquea el caracter "/" (path traversal):
  Entrada recibida directamente:      ../secret          -> bloqueada (contiene "/")
  Entrada doblemente codificada:      %252e%252e%252f     -> decodificada UNA vez da
                                                              "%2e%2e%2f" (aun no
                                                              contiene un "/" literal)
                                                           -> pasa el filtro
                                       luego una capa POSTERIOR (servidor web,
                                       framework) la decodifica una SEGUNDA vez
                                                           -> se convierte en "../secret"
                                                              DESPUES del filtro
```

> **Buena práctica:** decodificar completamente un dato (hasta que sea estable, sin más cambios en una nueva decodificación) ANTES de validarlo, nunca validar una codificación intermedia esperando que ninguna capa posterior la decodifique de nuevo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un fallo de lógica de negocio sigue siendo explotable incluso con un código técnicamente limpio: un endpoint que acepta demasiados campos (mass assignment), una desviación de redondeo acumulada a gran escala (salami slicing), un retraso explotable entre verificación y acción (TOCTOU), un mensaje de error demasiado preciso (enumeración), un identificador visualmente engañoso (homógrafo Unicode), o un filtro aplicado antes de una codificación adicional. |
| **Herramientas utilizables** | Lista blanca explícita de campos modificables por endpoint; restricción de unicidad o actualización condicional en base de datos para una operación atómica; normalización Unicode (NFKC) en cualquier identificador comparado por su unicidad. |
| **Trampas a evitar** | Transmitir cualquier dato recibido tal cual a la actualización de un objeto. Probar un cálculo financiero con un solo caso en lugar de un gran volumen. Separar "verificar" y "actuar" en dos pasos no atómicos. Un mensaje de error que distingue cuenta inexistente de contraseña incorrecta. Validar un dato antes de su decodificación completa. |
| **Buenas prácticas** | Lista blanca de campos por endpoint. Prueba de desviación acumulada sobre un gran volumen de valores. Hacer atómica toda operación sensible de "verificar y luego actuar". Mensaje de error genérico e idéntico en caso de fallo de autenticación. Normalización/restricción del conjunto de caracteres para un identificador único. Decodificación completa antes de la validación, nunca al revés. |
