---
order: 3
---

# Desplegar e interactuar con un smart contract

El capítulo anterior mostró cómo escribir un contrato en [Solidity](/?c=blockchain&p=solidity-bases-du-langage). Un archivo de código por sí solo aún no hace nada: este capítulo cubre lo que ocurre entre escribir el contrato y usarlo realmente en la blockchain.

## Compilar: del código Solidity a dos artefactos

Compilar un contrato Solidity produce dos resultados distintos, ambos necesarios después:

| Artefacto | Papel |
|---|---|
| **Bytecode** | El código máquina que la blockchain ejecuta realmente, ilegible para un humano |
| **ABI** (*Application Binary Interface*) | Un archivo JSON que describe las funciones del contrato (nombres, parámetros, tipos de retorno), legible por las herramientas que necesitan llamarlo |

El ABI hace de manual de instrucciones: sin él, un wallet o una aplicación no sabría qué funciones existen en el contrato, ni cómo enviarles parámetros en el formato correcto.

```text
Extracto de ABI para retirar(uint256):

[
  {
    "name": "retirar",
    "type": "function",
    "inputs": [{ "name": "monto", "type": "uint256" }],
    "outputs": []
  }
]
```

## Desplegar: una transacción algo especial

**Desplegar** un contrato consiste en enviar una transacción cuyo contenido es el bytecode compilado, sin un destinatario concreto: la red responde creando una nueva dirección, la del contrato, donde ese bytecode queda almacenado de forma permanente. Esa dirección es la que se usará después para interactuar con el contrato.

## El gas: pagar para hacer funcionar la red

Cada operación ejecutada en la blockchain (desplegar un contrato, llamar a una función que modifica su estado) consume **gas**, una unidad que mide la cantidad de trabajo de cálculo pedido a la red. El coste real pagado es el producto de dos factores:

```text
Coste total = gas consumido × precio del gas

El precio del gas se expresa en gwei (1 gwei = 0,000000001 ether)
y varía según la demanda de la red en el momento de la transacción,
un poco como un precio que sube cuando la red está muy ocupada.
```

Una simple transferencia de criptomoneda cuesta una cantidad fija de gas (21.000 unidades en Ethereum); desplegar un contrato cuesta notablemente más, y aumenta con el tamaño del bytecode desplegado.

> **Trampa:** creer que el precio del gas es fijo o previsible de antemano. Fluctúa en tiempo real según la carga de la red: una transacción idéntica puede costar mucho más en un momento de mucha afluencia.
>
> **Buena práctica:** comprobar el precio del gas actual antes de una transacción costosa (un despliegue, por ejemplo), y evitar los periodos de mucha afluencia de red cuando la operación no es urgente.

## Interactuar desde un wallet: leer es gratis, escribir cuesta gas

Un wallet (como MetaMask) actúa de intermediario entre una persona y la blockchain: conoce las claves que prueban la identidad de su propietario, y usa el ABI de un contrato para construir llamadas comprensibles para él.

| Tipo de llamada | Ejemplo | Coste |
|---|---|---|
| **Lectura** (función `view`/`pure`) | Consultar un saldo | Gratis: no se escribe nada en la blockchain, no hace falta ninguna transacción |
| **Escritura** (función que modifica el estado) | Depositar fondos, transferir un saldo | De pago: el cambio debe ser validado por la red mediante una transacción, por tanto gas |

Es exactamente la misma distinción ya vista en el capítulo anterior con `view`/`pure`: una función correctamente marcada como `view` puede llamarse gratis por cualquiera, sin siquiera pasar por una transacción firmada.

> **Buena práctica:** comprobar siempre, antes de llamar a una función desde un wallet, si realmente modifica el estado del contrato (costosa) o solo lo lee (gratis); un wallet siempre pide confirmación antes de una transacción de pago, a diferencia de una lectura.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Compilar un contrato produce un bytecode (ejecutado por la blockchain) y un ABI (JSON que describe sus funciones, usado por las herramientas que lo llaman). Desplegar envía ese bytecode en una transacción sin destinatario. Toda operación que modifica el estado cuesta gas (cantidad de cálculo × precio, en gwei); una simple lectura sigue siendo gratis. |
| **Herramientas utilizables** | El ABI (JSON) para permitir que un wallet o una aplicación llame a un contrato. Un wallet (MetaMask) para firmar transacciones e interactuar con un contrato desplegado. |
| **Trampas a evitar** | Creer que el precio del gas es fijo o previsible de antemano. |
| **Buenas prácticas** | Comprobar el precio del gas actual antes de una transacción costosa. Distinguir una función de lectura (gratis) de una función de escritura (de pago) antes de llamarla. |
