---
order: 2
---

# La corrupción de memoria

Las grandes familias de fallos ya cubiertas en [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles) (inyección, control de acceso, configuración...) afectan sobre todo a aplicaciones web. La **corrupción de memoria** es una familia aparte, propia de los programas compilados (C, C++...) que manipulan directamente la memoria vista en [Cómo se ejecuta realmente un programa](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme): agrupa los casos en los que un programa lee o escribe en un lugar de la memoria distinto del previsto por su autor.

## El buffer overflow: escribir más allá del espacio reservado

Un **buffer** es un espacio de memoria de tamaño fijo reservado para un dato (ej.: una cadena de caracteres de 16 bytes). Un **buffer overflow** (desbordamiento de búfer) ocurre cuando un programa escribe más datos de los que ese espacio puede contener, sin comprobarlo, desbordando sobre la memoria vecina.

```text
Espacio reservado para "nombre": 8 bytes

Escritura normal:   [ L | U | I | S | \0 |   |   |   ]   -> cabe en el espacio reservado

Escritura en desbordamiento (entrada demasiado larga, nunca verificada):
                      [ A | A | A | A | A | A | A | A ] [ A | A | A | A ]
                        espacio reservado para "nombre"    desborda sobre la memoria vecina
                                                            (potencialmente la direccion de retorno,
                                                             vease el capitulo anterior)
```

En la pila, la memoria vecina de un buffer local suele contener la **dirección de retorno** de la función en curso (véase el capítulo anterior): un desbordamiento suficientemente preciso puede sustituirla por una dirección elegida por el atacante, desviando la ejecución del programa hacia el código de su elección en cuanto la función termina.

> **Trampa:** creer que un fallo con caída del programa (*crash*) es el único síntoma posible. Un buffer overflow que solo sobrescribe una variable vecina, sin hacer caer el programa, puede pasar desapercibido y aun así modificar su comportamiento (ej.: un indicador `es_administrador` puesto a verdadero por accidente).

## El use-after-free: usar una memoria ya liberada

Visto en el capítulo anterior, un dato en el [montón](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) debe liberarse explícitamente cuando ya no es útil. Un **use-after-free** ocurre cuando el programa sigue usando un puntero hacia esa zona después de haberla liberado: ese espacio de memoria puede, mientras tanto, haber sido reasignado a un dato totalmente distinto, que el programa leerá o escribirá por error creyendo manipular el dato antiguo.

```text
1. El programa asigna memoria para un objeto A y guarda un puntero hacia el
2. El programa libera ese espacio (A ya no existe, pero el puntero sigue existiendo)
3. El programa asigna memoria para un objeto B: el sistema reutiliza el mismo espacio
4. El programa, a traves de su antiguo puntero (caducado), lee/escribe -> en realidad toca B
```

## El format string: una entrada tratada como instrucción de formato

Algunas funciones (como `printf` en C) aceptan una **cadena de formato**, que describe cómo mostrar los valores que la siguen (`%d` para un entero, `%s` para una cadena...). Un **bug de format string** ocurre cuando un dato proporcionado por el usuario se usa directamente como cadena de formato, en lugar de ser un simple argumento a mostrar:

```text
// Codigo vulnerable: el dato del usuario ES la cadena de formato
printf(entrada_usuario);

// Si entrada_usuario vale "%x %x %x %x", printf lee 4 valores
// de la pila alli donde no se proporciono ningun argumento: muestra
// contenido de memoria arbitrario, potencialmente sensible.

// Codigo correcto: el dato del usuario es un ARGUMENTO, nunca el formato
printf("%s", entrada_usuario);
```

La misma trampa ya vista para la inyección SQL en [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles): un dato externo tratado como una instrucción en lugar de como un simple valor.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La corrupción de memoria agrupa los casos en los que un programa lee o escribe en un lugar imprevisto de la memoria: buffer overflow (escritura más allá de un espacio reservado, capaz de sobrescribir la dirección de retorno), use-after-free (uso de un puntero hacia una memoria ya liberada y reasignada), format string (dato externo usado como instrucción de formato). |
| **Herramientas utilizables** | Un depurador (capítulo siguiente) para observar concretamente un desbordamiento en memoria; un fuzzer (véase más adelante en esta categoría) para descubrirlos automáticamente. |
| **Errores a evitar** | Verificar una entrada solo por su presencia, nunca por su tamaño real frente al espacio reservado; reutilizar un puntero después de haber liberado la memoria a la que apunta. |
| **Buenas prácticas** | Acotar siempre explícitamente una escritura al tamaño realmente reservado; poner un puntero a `NULL` inmediatamente después de liberar su memoria, para que una reutilización accidental falle de inmediato en lugar de pasar desapercibida. |
