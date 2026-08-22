---
order: 1
---

# Conceptos fundamentales de la blockchain

Un banco lleva un registro de quién posee qué: cuando pagas a alguien, actualiza sus cuentas, y confías en que no hará trampa. Una **blockchain** busca el mismo resultado, un registro fiable de transacciones, pero sin banco ni autoridad central: la confianza reside en las propias reglas del sistema, repartidas entre miles de ordenadores independientes.

## El registro: una cadena de bloques

Una blockchain es un registro (una lista de transacciones) dividido en **bloques**. Cada bloque contiene un lote de transacciones recientes, y sobre todo una referencia al bloque anterior: eso es lo que forma la "cadena".

| Elemento | Papel |
|---|---|
| **Bloque** | Un paquete de transacciones validadas y con marca de tiempo |
| **Hash** | Una huella digital única del bloque (ver más abajo) |
| **Cadena** | Cada bloque contiene el hash del bloque anterior, encadenándolos en orden |

```text
Bloque 1               Bloque 2               Bloque 3
[transacciones]         [transacciones]         [transacciones]
[hash del bloque 0]     [hash del bloque 1] <-- [hash del bloque 2]
[su propio hash]    <-- [su propio hash]         [su propio hash]
```

## El hash: una huella que detecta el más mínimo cambio

Un **hash** es el resultado de una función matemática que transforma cualquier dato (por grande que sea) en una cadena de caracteres de longitud fija, de forma determinista: el mismo dato de entrada siempre produce el mismo hash de salida, y cambiar un solo carácter del dato produce un hash completamente distinto e impredecible.

```text
hash("Hola")  -> a1b2c3...  (ejemplo simplificado)
hash("Hola!") -> 9f8e7d...  (totalmente distinto pese a un solo carácter añadido)
```

Como cada bloque contiene el hash del bloque anterior, modificar una transacción en un bloque antiguo cambia su hash, lo que rompe el enlace con el bloque siguiente (que contenía el antiguo hash), lo que a su vez rompe el enlace con el siguiente, y así hasta el final de la cadena. Falsificar una transacción antigua obliga por tanto a recalcular todos los bloques que la siguen.

> **Trampa:** creer que un hash es un cifrado (reversible, se puede recuperar el dato original). Es falso: un hash no es reversible, no se puede volver al dato de partida a partir de él solo.
>
> **Buena práctica:** entender el hash como una huella de verificación ("¿se ha modificado este dato?"), nunca como una forma de ocultar información.

## El consenso: ponerse de acuerdo sin autoridad central

El registro no se almacena en un único lugar: miles de ordenadores independientes (los **nodos**) guardan cada uno su propia copia. El **consenso** es la regla que permite a esta red ponerse de acuerdo sobre qué versión de la cadena es la válida, sin que ningún nodo tenga por defecto más poder de decisión que otro.

| Mecanismo de consenso | Principio |
|---|---|
| **Prueba de trabajo** (*Proof of Work*, ej. Bitcoin) | Los nodos compiten por resolver un cálculo costoso; el primero en conseguirlo propone el siguiente bloque, lo que cuesta energía y desalienta las trampas |
| **Prueba de participación** (*Proof of Stake*, ej. Ethereum desde 2022) | Los nodos ponen en juego una cantidad de criptomoneda como garantía; el elegido para proponer el siguiente bloque pierde su depósito si hace trampa |

En ambos casos, el principio es el mismo: hacer que hacer trampa sea más costoso que seguir las reglas honestamente.

> **Trampa:** pensar que una blockchain es "inrompible" por arte de magia. Su seguridad viene del coste económico del ataque (cálculo o capital a movilizar), no de una propiedad matemática absoluta: un atacante que controlara más de la mitad de la potencia de cálculo (o de la participación) de la red podría en teoría reescribir el historial.
>
> **Buena práctica:** evaluar la seguridad real de una blockchain concreta por el tamaño y la descentralización de su red de nodos, no solo por el principio teórico del consenso utilizado.

## El smart contract: código que se ejecuta en la blockchain

Un **smart contract** (contrato inteligente) es un programa almacenado en la blockchain, que se ejecuta automáticamente cuando se cumplen ciertas condiciones, sin intervención humana. Es la pieza que convierte una blockchain de un simple registro de transacciones en una plataforma capaz de ejecutar cualquier lógica.

```text
Ejemplo simplificado: una apuesta automática
  SI el equipo A gana el partido
  ENTONCES transferir los fondos a quien apostó por A
  -> ejecutado automáticamente por la red, sin árbitro humano
```

Una vez desplegado, el código de un smart contract generalmente ya no puede modificarse: es una garantía de fiabilidad (nadie puede cambiar las reglas después), pero también un riesgo, un error en el código queda fijado tal cual. Este tema se desarrollará en un capítulo dedicado a la escritura de smart contracts.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una blockchain es un registro compartido entre muchos ordenadores independientes, organizado en bloques enlazados por su hash. El consenso permite a la red ponerse de acuerdo sobre la versión válida de la cadena sin autoridad central. Un smart contract es un programa que se ejecuta automáticamente en la blockchain. |
| **Herramientas utilizables** | Ninguna herramienta práctica en esta etapa: este capítulo sienta los conceptos, los capítulos siguientes abordarán Solidity y las redes concretas. |
| **Trampas a evitar** | Confundir hash con cifrado. Creer que una blockchain es inrompible por principio en lugar de por coste económico. |
| **Buenas prácticas** | Ver el hash como una huella de verificación, no como un cifrado. Evaluar la seguridad real por la descentralización de la red. |
