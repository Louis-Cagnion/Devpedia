---
order: 2
---

# Solidity: fundamentos del lenguaje

El capítulo sobre los [conceptos fundamentales](/?c=blockchain&p=concepts-fondamentaux-blockchain) presentaba el smart contract como un programa almacenado en la blockchain, que se ejecuta automáticamente. **Solidity** es el lenguaje más usado para escribir estos programas, en Ethereum y en la mayoría de redes compatibles con ella (entre ellas Avalanche). Este capítulo cubre su sintaxis básica.

## La cabecera obligatoria: licencia y versión del compilador

Todo archivo Solidity empieza con dos líneas convencionales: un identificador de licencia, y la versión del compilador aceptada.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

El comentario `SPDX-License-Identifier` declara la licencia del código (`MIT` es muy habitual en el ecosistema); las herramientas de compilación avisan si falta. La línea `pragma` fija la versión del compilador Solidity esperada (aquí, `^0.8.20` acepta la 0.8.20 y cualquier versión 0.8.x más reciente, pero no la 0.9): esta restricción evita que un cambio de compilador posterior modifique silenciosamente el comportamiento de un contrato ya escrito.

## Un contrato: datos y funciones en un mismo lugar

La palabra clave `contract` define un contrato, que agrupa **variables de estado** (datos almacenados de forma duradera en la blockchain) y **funciones** (el código que las lee o las modifica):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Almacenamiento {
    uint256 valor;

    function establecer(uint256 x) public {
        valor = x;
    }

    function leer() public view returns (uint256) {
        return valor;
    }
}
```

`uint256` es un entero sin signo (positivo o cero) de 256 bits, el tipo numérico más común en Solidity. Una **variable de estado** como `valor` sigue escrita en la blockchain entre llamadas: a diferencia de una variable local en una función clásica, sobrevive al final de la función que la modificó.

> **Trampa:** olvidar la palabra clave `view` en una función que solo lee una variable de estado (como `leer()`). Una función sin `view` es considerada por la red como potencialmente capaz de modificar el estado, lo que la hace costosa de llamar aunque en realidad solo lea un valor.
>
> **Buena práctica:** marcar como `view` toda función que no modifique ninguna variable de estado, y como `pure` la que ni siquiera lea ninguna: la red puede entonces ejecutar esas llamadas sin coste, a diferencia de una llamada que realmente modifica la blockchain.

## `msg.sender` y `msg.value`: saber quién llama, y con cuánto

Cada llamada a una función de un contrato lleva consigo dos informaciones suministradas automáticamente por la red: `msg.sender` (la dirección de la persona o del contrato que llama) y `msg.value` (la cantidad de criptomoneda enviada con la llamada, si la función está marcada como `payable`).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Boveda {
    mapping(address => uint256) public saldos;

    function depositar() public payable {
        saldos[msg.sender] += msg.value;
    }

    function retirar(uint256 monto) public {
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");
        saldos[msg.sender] -= monto;
        payable(msg.sender).transfer(monto);
    }
}
```

Un `mapping(address => uint256)` asocia una dirección con un valor, como un diccionario: aquí, cada dirección tiene su propio saldo. `require(condicion, mensaje)` detiene la ejecución (y revierte cualquier cambio ya hecho) si la condición es falsa, un mecanismo de guardia usado sistemáticamente al inicio de una función para validar sus precondiciones.

## El orden checks / effects / interactions: una regla de seguridad, no de estilo

Observa el orden exacto de las tres líneas en `retirar()`: primero la verificación (`require`), luego la actualización del estado interno (`saldos[msg.sender] -= monto`), y solo después el envío real de los fondos (`transfer`). Este orden se llama el patrón **checks / effects / interactions** (verificaciones / efectos / interacciones), y no es una cuestión de gusto.

> **Trampa:** enviar los fondos *antes* de actualizar el saldo interno. Un contrato destinatario malicioso puede, en el momento de recibir los fondos, volver a llamar inmediatamente a `retirar()` antes de que el saldo haya sido decrementado: como el saldo todavía muestra su valor antiguo, la verificación vuelve a pasar, y los fondos pueden retirarse varias veces por un solo depósito. Es un **ataque por reentrada** (*reentrancy*), una de las causas más frecuentes de robos reales de fondos en smart contracts.
>
> **Buena práctica:** verificar siempre las condiciones, luego actualizar todas las variables de estado, y solo al final interactuar con el exterior (enviar fondos, llamar a otro contrato), nunca al revés.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un archivo Solidity empieza con una licencia y una versión de compilador (`pragma`). Un `contract` agrupa variables de estado (persistentes en la blockchain) y funciones. `msg.sender`/`msg.value` identifican al llamante y los fondos enviados. El orden checks/effects/interactions protege contra los ataques por reentrada. |
| **Herramientas utilizables** | `view`/`pure` para marcar una función sin coste que no modifica nada. `require()` para validar una precondición. `mapping` para asociar una dirección con un dato. |
| **Trampas a evitar** | Olvidar `view` en una función de lectura pura. Enviar fondos antes de actualizar el estado interno (reentrada). |
| **Buenas prácticas** | Marcar `view`/`pure` en toda función que no necesite modificar el estado. Seguir siempre el orden checks/effects/interactions antes de cualquier envío de fondos o llamada externa. |
