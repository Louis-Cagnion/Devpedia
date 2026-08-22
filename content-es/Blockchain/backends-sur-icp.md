---
order: 5
---

# Los backends en ICP

Los capítulos anteriores cubren un modelo centrado en Ethereum y las [redes compatibles con EVM](/?c=blockchain&p=reseaux-blockchain): contratos que ejecutan una lógica limitada, pagando el usuario gas en cada interacción. **ICP** (*Internet Computer Protocol*) parte de un paradigma distinto, pensado para alojar aplicaciones enteras, no solo contratos.

## El canister: más que un smart contract

Un **canister** es, en ICP, el equivalente a un smart contract desplegado, pero con un papel más amplio: agrupa código *y* estado (datos persistentes), compilados en [WebAssembly](https://webassembly.org) (un formato binario portable, ejecutable rápidamente en cualquier máquina compatible), y puede responder directamente a peticiones web. Un canister no se limita entonces a una lógica de negocio aislada: puede alojar una aplicación completa, backend incluido, sin un servidor tradicional detrás.

## Dos lenguajes principales: Motoko y Rust

| Lenguaje | Particularidad |
|---|---|
| **Motoko** | Diseñado específicamente para ICP, en torno al concepto de **actor**: cada canister es un actor aislado, que se comunica con los demás mediante mensajes asíncronos |
| **Rust** | Lenguaje generalista, el más usado en producción en ICP (los componentes de la propia red, como su registro de cuentas, están escritos en Rust) |

Un canister mínimo en Motoko:

```motoko
actor Contador {
  stable var valor : Nat = 0;

  public func incrementar() : async Nat {
    valor += 1;
    valor
  };

  public query func leer() : async Nat {
    valor
  };
};
```

La palabra clave `stable` marca una variable como persistente a través de las actualizaciones del canister (sobrevive a un redespliegue del código, a diferencia de una variable clásica); `query` marca una función que solo lee, sin modificar el estado, comparable al `view` ya visto en [Solidity](/?c=blockchain&p=solidity-bases-du-langage).

## El modelo de gas inverso: paga el desarrollador, no el usuario

En Ethereum o Avalanche, cada interacción con un contrato cuesta gas pagado por quien llama a la función (ver el capítulo sobre el [despliegue](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract)). ICP invierte este modelo: el coste de cálculo lo paga el **desarrollador** del canister, mediante **cycles**, una unidad obtenida convirtiendo tokens ICP.

```text
Modelo clásico (Ethereum/Avalanche):
  El usuario llama a una función -> el usuario paga el gas

Modelo inverso (ICP):
  El usuario llama a una función -> el canister consume cycles
  ya precargados por el desarrollador -> el usuario no paga
  nada por la interacción en sí
```

Este modelo acerca la experiencia de usuario a la de una aplicación web clásica: nadie necesita un wallet ni tokens solo para usar la aplicación, a diferencia de un contrato en Ethereum donde cada acción implica una transacción de pago.

> **Trampa:** creer que este modelo hace que usar un canister sea gratis para todos en cualquier circunstancia. El desarrollador debe recargar regularmente los cycles del canister; si se agotan, el canister primero se **congela** (deja de aceptar nuevas peticiones, tras un umbral de seguridad por defecto de 30 días), y después su código y sus datos se **eliminan** si los cycles no se recargan a tiempo.
>
> **Buena práctica:** vigilar el saldo de cycles de un canister en producción y prever un mecanismo de recarga automática antes de alcanzar el umbral de congelación, en lugar de descubrir la eliminación después de que ocurra.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un canister de ICP agrupa código y estado, compilado en WebAssembly, y puede alojar una aplicación entera en lugar de una simple lógica de contrato. Motoko (diseñado para ICP, en torno al concepto de actor) y Rust (el más usado en producción) son los dos lenguajes principales. El modelo de gas inverso hace pagar al desarrollador (en cycles) en lugar de al usuario final en cada interacción. |
| **Herramientas utilizables** | `stable` para una variable persistente a través de las actualizaciones. `query` para una función de solo lectura, el equivalente al `view` de Solidity. |
| **Trampas a evitar** | Creer que el modelo de gas inverso hace que un canister sea gratis de mantener indefinidamente sin vigilancia. |
| **Buenas prácticas** | Vigilar el saldo de cycles de un canister en producción, con un mecanismo de recarga antes del umbral de congelación. |
