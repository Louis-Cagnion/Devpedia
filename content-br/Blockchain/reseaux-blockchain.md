---
order: 4
---

# As redes blockchain

Os capítulos anteriores falaram de "a" blockchain como um conceito genérico. Na realidade, não existe uma única blockchain, mas numerosas **redes** distintas (Ethereum, Avalanche, e muitas outras), cada uma com seu próprio histórico, seu próprio token nativo, e seu próprio conjunto de nós que a faz funcionar.

## Uma rede, uma cadeia, um token nativo

Cada rede blockchain funciona de forma independente: o Ethereum tem seu próprio histórico de blocos e seu próprio token (o ether, ETH), a Avalanche tem o seu (AVAX), e assim por diante. Um smart contract implantado em uma rede só existe nela; seria preciso implantá-lo separadamente em outra rede para que também estivesse disponível ali.

## A compatibilidade EVM: o mesmo bytecode em várias redes

A **EVM** (*Ethereum Virtual Machine*) é o componente que executa o bytecode dos smart contracts no Ethereum, já mencionado implicitamente no capítulo sobre a [implantação](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract). Várias outras redes, entre elas a Avalanche (em sua cadeia chamada **C-Chain**), implementam essa mesma EVM: um contrato escrito em [Solidity](/?c=blockchain&p=solidity-bases-du-langage) e compilado para o Ethereum pode então ser implantado tal como está nessas redes compatíveis, sem reescrever o código.

```text
Contrato.sol
    │
    ├── compilado uma vez → bytecode idêntico
    │
    ├── implantado no Ethereum  → funciona, paga-se em ETH
    └── implantado na Avalanche → funciona, paga-se em AVAX
        (C-Chain, compatível com EVM)
```

Essa compatibilidade não torna as redes intercambiáveis por isso: cada uma tem suas próprias taxas de transação, sua própria velocidade, seu próprio mecanismo de consenso (a Avalanche usa um protocolo diferente do Ethereum), e um contrato implantado em uma nunca fica automaticamente disponível na outra.

> **Cilada:** supor que um contrato implantado em uma rede é acessível a partir de outra rede só porque ambas são compatíveis com EVM. Cada implantação cria um endereço próprio de uma rede específica; usar um contrato em outra rede exige implantá-lo lá separadamente (uma nova transação, um novo custo em gas, um novo endereço).
>
> **Boa prática:** verificar explicitamente em qual rede um endereço de contrato é válido antes de interagir com ele; uma wallet sempre mostra a rede ativa, a conferir antes de qualquer transação.

## Testnet e mainnet: praticar sem risco

Cada rede importante oferece, além de sua rede de produção (a **mainnet**, onde os tokens têm valor real), uma ou várias **testnets**: redes paralelas que funcionam de forma idêntica, mas onde os tokens não têm nenhum valor real.

| | Mainnet | Testnet |
|---|---|---|
| **Tokens** | Valor real | Sem valor, distribuídos gratuitamente |
| **Obter tokens** | Compra, troca | Um *faucet* (site que distribui pequenas quantidades de graça) |
| **Uso** | Produção, contratos realmente usados | Desenvolvimento, testes antes de ir para produção |

```text
Exemplos de testnets:
  Ethereum  -> Sepolia
  Avalanche -> Fuji
```

> **Cilada:** implantar e testar um contrato diretamente na mainnet por desconhecimento das testnets. Um erro descoberto após uma implantação na mainnet custa taxas de transação reais a cada tentativa, e um bug implantado continua sendo, por natureza, difícil de corrigir.
>
> **Boa prática:** sempre desenvolver e testar um contrato em uma testnet, com tokens obtidos gratuitamente por um faucet, antes de qualquer implantação na mainnet correspondente.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Cada rede blockchain (Ethereum, Avalanche...) funciona de forma independente, com seu próprio token nativo. A compatibilidade EVM permite que um mesmo contrato Solidity rode em várias redes, mas cada implantação continua própria de uma rede específica. Uma testnet permite desenvolver e testar sem risco, com tokens sem valor real. |
| **Ferramentas utilizáveis** | Um faucet para obter tokens de teste gratuitos. Sepolia (Ethereum) ou Fuji (Avalanche) como testnets comuns. |
| **Ciladas a evitar** | Supor que um contrato implantado em uma rede é acessível a partir de outra rede compatível com EVM. Desenvolver e testar diretamente na mainnet. |
| **Boas práticas** | Verificar a rede ativa antes de qualquer transação. Sempre testar em uma testnet antes de uma implantação em produção. |
