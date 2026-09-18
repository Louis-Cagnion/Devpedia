---
order: 17
---

# Interceptar um setter de propriedade nativa: `Object.defineProperty`

O [capítulo anterior](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence) aponta um limite do `MutationObserver`: escrever `meuSelect.value = "x"` não dispara nenhuma mutação detectável, já que não toca nem um atributo HTML nem a estrutura do DOM. Este capítulo cobre a técnica que mesmo assim permite reagir a esse tipo de escrita: **redefinir o setter** da própria propriedade.

## O problema concreto

Um componente "select personalizado" (um `<select>` nativo escondido, substituído visualmente por um menu suspenso caseiro) precisa manter sua exibição sincronizada com o valor real do `<select>`. O problema: esse valor pode ser modificado a partir de qualquer código já existente do projeto (`select.value = "x"`), sem que nenhum desses chamadores precise mudar para avisar o componente.

```text
Codigo existente, em qualquer parte do projeto:
    meuSelect.value = "Renault";
                |
                v
    Nenhum evento 'change' e disparado (nao e uma acao do usuario)
    Nenhuma mutacao DOM detectavel (nem atributo, nem estrutura)
                |
                v
    A exibicao do menu suspenso caseiro fica dessincronizada
```

## A solução: redefinir o setter, manter o getter nativo

`Object.defineProperty()` permite substituir o getter e/ou o setter de uma propriedade existente por uma função personalizada. Aqui, só o setter precisa ser interceptado; o getter nativo é mantido como está:

```javascript
// Pega o getter/setter nativos ANTES de substitui-los, para poder chama-los depois
const propriedadeNativa = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

Object.defineProperty(meuSelect, 'value', {
    get() {
        return propriedadeNativa.get.call(meuSelect);   // comportamento nativo inalterado
    },
    set(novoValor) {
        propriedadeNativa.set.call(meuSelect, novoValor);   // escreve de fato o valor
        sincronizarExibicao();                                // + dispara a sincronizacao
    },
    configurable: true,
});
```

`Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')` pega o getter/setter nativos do `<select>` **antes** de sobrescrevê-los: sem essa etapa, o novo setter não teria como escrever de fato o valor, só reagir à sua mudança.

> **Armadilha:** esquecer `configurable: true`. Sem essa opção, `Object.defineProperty()` deixa a propriedade permanentemente travada: impossível redefini-la uma segunda vez (por exemplo para um teste, ou outro componente que queira fazer a mesma coisa), e qualquer tentativa lança um erro.

## Alcance da interceptação

Essa técnica redefine a propriedade em **uma instância específica** (`meuSelect`), não em `HTMLSelectElement.prototype`: todos os outros `<select>` da página mantêm seu comportamento nativo inalterado, só o explicitamente transformado em componente personalizado é afetado.

> **Boa prática:** sempre mirar na instância específica em vez do protótipo compartilhado (`HTMLSelectElement.prototype`) para esse tipo de interceptação. Modificar o protótipo mudaria o comportamento de **todos** os `<select>` da página, incluindo os que não têm nada a ver com o componente em questão.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `Object.defineProperty()` substitui o getter/setter de uma propriedade existente, o que permite reagir a uma escrita que um `MutationObserver` não consegue detectar (uma propriedade JS atribuída diretamente, sem passar por um atributo HTML). |
| **Ferramentas utilizáveis** | `Object.defineProperty()`, `Object.getOwnPropertyDescriptor()` para preservar o comportamento nativo antes de substituí-lo. |
| **Armadilhas a evitar** | Esquecer `configurable: true` (deixa a propriedade impossível de redefinir depois). Modificar o protótipo compartilhado em vez de uma instância específica. |
| **Boas práticas** | Sempre pegar o descritor nativo antes de substituí-lo, para que o novo setter ainda consiga escrever o valor real. Mirar na instância, nunca no protótipo compartilhado, para uma interceptação localizada a um único elemento. |
