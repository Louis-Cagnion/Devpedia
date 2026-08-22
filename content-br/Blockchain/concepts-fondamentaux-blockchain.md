---
order: 1
---

# Conceitos fundamentais da blockchain

Um banco mantém um registro de quem possui o quê: quando você paga alguém, ele atualiza as contas, e você confia que ele não vai trapacear. Uma **blockchain** busca o mesmo resultado, um registro confiável de transações, mas sem banco nem autoridade central: a confiança repousa nas próprias regras do sistema, distribuídas entre milhares de computadores independentes.

## O registro: uma cadeia de blocos

Uma blockchain é um registro (uma lista de transações) dividido em **blocos**. Cada bloco contém um lote de transações recentes, e principalmente uma referência ao bloco anterior: é isso que forma a "cadeia".

| Elemento | Papel |
|---|---|
| **Bloco** | Um pacote de transações validadas e com carimbo de tempo |
| **Hash** | Uma impressão digital única do bloco (ver mais abaixo) |
| **Cadeia** | Cada bloco contém o hash do bloco anterior, encadeando-os em ordem |

```text
Bloco 1                Bloco 2                Bloco 3
[transações]            [transações]            [transações]
[hash do bloco 0]       [hash do bloco 1]  <--  [hash do bloco 2]
[seu próprio hash]  <-- [seu próprio hash]       [seu próprio hash]
```

## O hash: uma impressão que detecta a menor alteração

Um **hash** é o resultado de uma função matemática que transforma qualquer dado (por maior que seja) em uma sequência de caracteres de tamanho fixo, de forma determinística: o mesmo dado de entrada sempre produz o mesmo hash de saída, e alterar um único caractere do dado produz um hash completamente diferente e imprevisível.

```text
hash("Olá")  -> a1b2c3...  (exemplo simplificado)
hash("Olá!") -> 9f8e7d...  (totalmente diferente apesar de um único caractere adicionado)
```

Como cada bloco contém o hash do bloco anterior, modificar uma transação em um bloco antigo muda seu hash, o que quebra o vínculo com o bloco seguinte (que continha o hash antigo), o que por sua vez quebra o vínculo com o próximo, e assim por diante até o fim da cadeia. Falsificar uma transação antiga exige, portanto, recalcular todos os blocos que vêm depois dela.

> **Cilada:** achar que um hash é uma criptografia (reversível, é possível recuperar o dado original). Isso é falso: um hash não é reversível, não é possível voltar ao dado de origem a partir dele sozinho.
>
> **Boa prática:** entender o hash como uma impressão de verificação ("esse dado foi alterado?"), nunca como uma forma de esconder informação.

## O consenso: chegar a um acordo sem autoridade central

O registro não fica armazenado em um único lugar: milhares de computadores independentes (os **nós**) guardam, cada um, sua própria cópia. O **consenso** é a regra que permite a essa rede se pôr de acordo sobre qual versão da cadeia é a válida, sem que nenhum nó tenha por padrão mais poder de decisão que outro.

| Mecanismo de consenso | Princípio |
|---|---|
| **Prova de trabalho** (*Proof of Work*, ex. Bitcoin) | Os nós competem para resolver um cálculo custoso; o primeiro a conseguir propõe o próximo bloco, o que custa energia e desestimula trapaças |
| **Prova de participação** (*Proof of Stake*, ex. Ethereum desde 2022) | Os nós colocam em jogo uma quantia em criptomoeda como garantia; o escolhido para propor o próximo bloco perde sua aposta se trapacear |

Em ambos os casos, o princípio permanece o mesmo: tornar trapacear mais custoso do que seguir as regras honestamente.

> **Cilada:** pensar que uma blockchain é "inquebrável" por mágica. Sua segurança vem do custo econômico do ataque (cálculo ou capital a mobilizar), não de uma propriedade matemática absoluta: um atacante que controlasse mais da metade do poder de cálculo (ou da participação) da rede poderia, em teoria, reescrever o histórico.
>
> **Boa prática:** avaliar a segurança real de uma blockchain específica pelo tamanho e pela descentralização de sua rede de nós, não apenas pelo princípio teórico do consenso utilizado.

## O smart contract: código que roda na blockchain

Um **smart contract** (contrato inteligente) é um programa armazenado na blockchain, que roda automaticamente quando certas condições são atendidas, sem intervenção humana. É a peça que transforma uma blockchain de um simples registro de transações em uma plataforma capaz de executar qualquer lógica.

```text
Exemplo simplificado: uma aposta automática
  SE o time A vencer a partida
  ENTÃO transferir os fundos para quem apostou no time A
  -> executado automaticamente pela rede, sem árbitro humano
```

Uma vez implantado, o código de um smart contract geralmente não pode mais ser modificado: isso é uma garantia de confiabilidade (ninguém pode mudar as regras depois), mas também um risco, um erro no código fica congelado do jeito que está. Esse tema será desenvolvido em um capítulo dedicado à escrita de smart contracts.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Uma blockchain é um registro compartilhado entre muitos computadores independentes, organizado em blocos ligados pelo seu hash. O consenso permite à rede chegar a um acordo sobre a versão válida da cadeia sem autoridade central. Um smart contract é um programa que roda automaticamente na blockchain. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta prática nesta etapa: este capítulo estabelece os conceitos, os capítulos seguintes abordarão Solidity e as redes concretas. |
| **Ciladas a evitar** | Confundir hash com criptografia. Achar que uma blockchain é inquebrável por princípio em vez de por custo econômico. |
| **Boas práticas** | Ver o hash como uma impressão de verificação, não uma criptografia. Avaliar a segurança real pela descentralização da rede. |
