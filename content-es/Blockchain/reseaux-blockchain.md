---
order: 4
---

# Las redes blockchain

Los capítulos anteriores hablaban de "la" blockchain como un concepto genérico. En realidad, no existe una única blockchain sino numerosas **redes** distintas (Ethereum, Avalanche, y muchas otras), cada una con su propio historial, su propio token nativo, y su propio conjunto de nodos que la hace funcionar.

## Una red, una cadena, un token nativo

Cada red blockchain funciona de forma independiente: Ethereum tiene su propio historial de bloques y su propio token (el ether, ETH), Avalanche tiene el suyo (AVAX), y así sucesivamente. Un smart contract desplegado en una red solo existe en ella; habría que desplegarlo por separado en otra red para que también estuviera disponible allí.

## La compatibilidad EVM: el mismo bytecode en varias redes

La **EVM** (*Ethereum Virtual Machine*) es el componente que ejecuta el bytecode de los smart contracts en Ethereum, ya mencionado implícitamente en el capítulo sobre el [despliegue](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract). Varias otras redes, entre ellas Avalanche (en su cadena llamada **C-Chain**), implementan esta misma EVM: un contrato escrito en [Solidity](/?c=blockchain&p=solidity-bases-du-langage) y compilado para Ethereum puede entonces desplegarse tal cual en esas redes compatibles, sin reescribir el código.

```text
Contrato.sol
    │
    ├── compilado una vez → bytecode idéntico
    │
    ├── desplegado en Ethereum   → funciona, se paga en ETH
    └── desplegado en Avalanche  → funciona, se paga en AVAX
        (C-Chain, compatible con EVM)
```

Esta compatibilidad no hace intercambiables las redes por ello: cada una tiene sus propias comisiones de transacción, su propia velocidad, su propio mecanismo de consenso (Avalanche usa un protocolo distinto al de Ethereum), y un contrato desplegado en una nunca está automáticamente disponible en la otra.

> **Trampa:** suponer que un contrato desplegado en una red es accesible desde otra red solo porque ambas son compatibles con EVM. Cada despliegue crea una dirección propia de una red dada; usar un contrato en otra red exige desplegarlo allí por separado (una nueva transacción, un nuevo coste en gas, una nueva dirección).
>
> **Buena práctica:** comprobar explícitamente en qué red es válida una dirección de contrato antes de interactuar con ella; un wallet siempre muestra la red activa, a verificar antes de cualquier transacción.

## Testnet y mainnet: practicar sin riesgo

Cada red importante ofrece, junto a su red de producción (la **mainnet**, donde los tokens tienen un valor real), una o varias **testnets**: redes paralelas que funcionan de forma idéntica, pero donde los tokens no tienen ningún valor real.

| | Mainnet | Testnet |
|---|---|---|
| **Tokens** | Valor real | Sin valor, distribuidos gratis |
| **Obtener tokens** | Compra, intercambio | Un *faucet* (sitio que distribuye pequeñas cantidades gratis) |
| **Uso** | Producción, contratos realmente usados | Desarrollo, pruebas antes de la puesta en producción |

```text
Ejemplos de testnets:
  Ethereum  -> Sepolia
  Avalanche -> Fuji
```

> **Trampa:** desplegar y probar un contrato directamente en la mainnet por desconocimiento de las testnets. Un error descubierto tras un despliegue en mainnet cuesta comisiones de transacción reales por cada intento, y un bug desplegado sigue siendo, por naturaleza, difícil de corregir.
>
> **Buena práctica:** desarrollar y probar siempre un contrato en una testnet, con tokens obtenidos gratis mediante un faucet, antes de cualquier despliegue en la mainnet correspondiente.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Cada red blockchain (Ethereum, Avalanche...) funciona de forma independiente, con su propio token nativo. La compatibilidad EVM permite que un mismo contrato Solidity funcione en varias redes, pero cada despliegue sigue siendo propio de una red dada. Una testnet permite desarrollar y probar sin riesgo, con tokens sin valor real. |
| **Herramientas utilizables** | Un faucet para obtener tokens de prueba gratis. Sepolia (Ethereum) o Fuji (Avalanche) como testnets comunes. |
| **Trampas a evitar** | Suponer que un contrato desplegado en una red es accesible desde otra red compatible con EVM. Desarrollar y probar directamente en la mainnet. |
| **Buenas prácticas** | Comprobar la red activa antes de cualquier transacción. Probar siempre en una testnet antes de un despliegue en producción. |
