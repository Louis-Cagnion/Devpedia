---
order: 5
---

# Os backends no ICP

Os capítulos anteriores cobrem um modelo centrado no Ethereum e nas [redes compatíveis com EVM](/?c=blockchain&p=reseaux-blockchain): contratos que executam uma lógica limitada, com o usuário pagando gas a cada interação. O **ICP** (*Internet Computer Protocol*) parte de um paradigma diferente, pensado para hospedar aplicações inteiras, não apenas contratos.

## O canister: mais que um smart contract

Um **canister** é, no ICP, o equivalente a um smart contract implantado, mas com um papel mais amplo: ele reúne código *e* estado (dados persistentes), compilados em [WebAssembly](https://webassembly.org) (um formato binário portátil, executável rapidamente em qualquer máquina compatível), e pode responder diretamente a requisições web. Um canister não se limita então a uma lógica de negócio isolada: ele pode hospedar uma aplicação completa, backend incluído, sem um servidor tradicional por trás.

## Duas linguagens principais: Motoko e Rust

| Linguagem | Particularidade |
|---|---|
| **Motoko** | Projetada especificamente para o ICP, em torno do conceito de **ator**: cada canister é um ator isolado, que se comunica com os outros por mensagens assíncronas |
| **Rust** | Linguagem generalista, a mais usada em produção no ICP (os componentes da própria rede, como seu registro de contas, são escritos em Rust) |

Um canister mínimo em Motoko:

```motoko
actor Contador {
  stable var valor : Nat = 0;

  public func incrementar() : async Nat {
    valor += 1;
    valor
  };

  public query func ler() : async Nat {
    valor
  };
};
```

A palavra-chave `stable` marca uma variável como persistente através das atualizações do canister (ela sobrevive a uma reimplantação do código, ao contrário de uma variável comum); `query` marca uma função que só lê, sem modificar o estado, comparável ao `view` já visto em [Solidity](/?c=blockchain&p=solidity-bases-du-langage).

## O modelo de gas invertido: quem paga é o desenvolvedor, não o usuário

No Ethereum ou na Avalanche, cada interação com um contrato custa gas pago por quem chama a função (ver o capítulo sobre a [implantação](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract)). O ICP inverte esse modelo: o custo de computação é pago pelo **desenvolvedor** do canister, por meio de **cycles**, uma unidade obtida convertendo tokens ICP.

```text
Modelo clássico (Ethereum/Avalanche):
  Usuário chama uma função -> usuário paga o gas

Modelo invertido (ICP):
  Usuário chama uma função -> o canister consome cycles já
  pré-carregados pelo desenvolvedor -> usuário não paga nada
  pela interação em si
```

Esse modelo aproxima a experiência do usuário da de uma aplicação web comum: ninguém precisa de uma wallet nem de tokens só para usar a aplicação, ao contrário de um contrato no Ethereum onde cada ação envolve uma transação paga.

> **Cilada:** achar que esse modelo torna o uso de um canister gratuito para todo mundo em qualquer circunstância. O desenvolvedor precisa recarregar regularmente os cycles do canister; se eles se esgotarem, o canister primeiro **congela** (para de aceitar novas requisições, após um limiar de segurança padrão de 30 dias), e depois seu código e seus dados são **apagados** se os cycles não forem recarregados a tempo.
>
> **Boa prática:** monitorar o saldo de cycles de um canister em produção e prever um mecanismo de recarga automática antes de atingir o limiar de congelamento, em vez de descobrir a exclusão depois que ela acontecer.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um canister do ICP reúne código e estado, compilado em WebAssembly, e pode hospedar uma aplicação inteira em vez de uma simples lógica de contrato. Motoko (projetada para o ICP, em torno do conceito de ator) e Rust (a mais usada em produção) são as duas linguagens principais. O modelo de gas invertido faz o desenvolvedor pagar (em cycles) em vez do usuário final a cada interação. |
| **Ferramentas utilizáveis** | `stable` para uma variável persistente através das atualizações. `query` para uma função somente leitura, equivalente ao `view` do Solidity. |
| **Ciladas a evitar** | Achar que o modelo de gas invertido torna um canister gratuito de manter indefinidamente sem monitoramento. |
| **Boas práticas** | Monitorar o saldo de cycles de um canister em produção, com um mecanismo de recarga antes do limiar de congelamento. |
