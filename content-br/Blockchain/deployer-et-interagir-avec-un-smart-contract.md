---
order: 3
---

# Implantar e interagir com um smart contract

O capítulo anterior mostrou como escrever um contrato em [Solidity](/?c=blockchain&p=solidity-bases-du-langage). Um arquivo de código sozinho ainda não faz nada: este capítulo cobre o que acontece entre escrever o contrato e usá-lo de fato na blockchain.

## Compilar: do código Solidity a dois artefatos

Compilar um contrato Solidity produz dois resultados distintos, ambos necessários depois:

| Artefato | Papel |
|---|---|
| **Bytecode** | O código de máquina que a blockchain realmente executa, ilegível para um humano |
| **ABI** (*Application Binary Interface*) | Um arquivo JSON que descreve as funções do contrato (nomes, parâmetros, tipos de retorno), legível pelas ferramentas que precisam chamá-lo |

A ABI funciona como um manual de instruções: sem ela, uma wallet ou uma aplicação não saberia quais funções existem no contrato, nem como enviar parâmetros a elas no formato certo.

```text
Trecho de ABI para sacar(uint256):

[
  {
    "name": "sacar",
    "type": "function",
    "inputs": [{ "name": "valor", "type": "uint256" }],
    "outputs": []
  }
]
```

## Implantar: uma transação um tanto especial

**Implantar** (*deploy*) um contrato consiste em enviar uma transação cujo conteúdo é o bytecode compilado, sem um destinatário específico: a rede responde criando um novo endereço, o do contrato, onde esse bytecode fica armazenado de forma permanente. É esse endereço que será usado depois para interagir com o contrato.

## O gas: pagar para fazer a rede funcionar

Cada operação executada na blockchain (implantar um contrato, chamar uma função que modifica seu estado) consome **gas**, uma unidade que mede a quantidade de trabalho de cálculo pedido à rede. O custo real pago é o produto de dois fatores:

```text
Custo total = gas consumido × preço do gas

O preço do gas é expresso em gwei (1 gwei = 0,000000001 ether)
e varia conforme a demanda da rede no momento da transação, um
pouco como um preço que sobe quando a rede está muito ocupada.
```

Uma simples transferência de criptomoeda custa uma quantidade fixa de gas (21.000 unidades no Ethereum); implantar um contrato custa nitidamente mais, e aumenta com o tamanho do bytecode implantado.

> **Cilada:** achar que o preço do gas é fixo ou previsível de antemão. Ele flutua em tempo real conforme a carga da rede: uma transação idêntica pode custar muito mais em um momento de grande movimento.
>
> **Boa prática:** verificar o preço atual do gas antes de uma transação custosa (uma implantação, por exemplo), e evitar períodos de grande movimento na rede quando a operação não é urgente.

## Interagir a partir de uma wallet: ler é grátis, escrever custa gas

Uma wallet (como a MetaMask) atua como intermediária entre uma pessoa e a blockchain: ela conhece as chaves que provam a identidade de seu dono, e usa a ABI de um contrato para construir chamadas compreensíveis por ele.

| Tipo de chamada | Exemplo | Custo |
|---|---|---|
| **Leitura** (função `view`/`pure`) | Consultar um saldo | Grátis: nada é escrito na blockchain, nenhuma transação é necessária |
| **Escrita** (função que modifica o estado) | Depositar fundos, transferir um saldo | Pago: a mudança precisa ser validada pela rede por meio de uma transação, logo gas |

É exatamente a mesma distinção já vista no capítulo anterior com `view`/`pure`: uma função corretamente marcada como `view` pode ser chamada gratuitamente por qualquer pessoa, sem sequer passar por uma transação assinada.

> **Boa prática:** verificar sempre, antes de chamar uma função a partir de uma wallet, se ela realmente modifica o estado do contrato (custosa) ou apenas o lê (grátis); uma wallet sempre pede confirmação antes de uma transação paga, ao contrário de uma leitura.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Compilar um contrato produz um bytecode (executado pela blockchain) e uma ABI (JSON descrevendo suas funções, usado pelas ferramentas que o chamam). Implantar envia esse bytecode em uma transação sem destinatário. Toda operação que modifica o estado custa gas (quantidade de cálculo × preço, em gwei); uma simples leitura continua grátis. |
| **Ferramentas utilizáveis** | A ABI (JSON) para permitir que uma wallet ou aplicação chame um contrato. Uma wallet (MetaMask) para assinar transações e interagir com um contrato implantado. |
| **Ciladas a evitar** | Achar que o preço do gas é fixo ou previsível de antemão. |
| **Boas práticas** | Verificar o preço atual do gas antes de uma transação custosa. Distinguir uma função de leitura (grátis) de uma função de escrita (paga) antes de chamá-la. |
