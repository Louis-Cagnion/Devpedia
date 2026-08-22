---
order: 2
---

# Solidity: fundamentos da linguagem

O capítulo sobre os [conceitos fundamentais](/?c=blockchain&p=concepts-fondamentaux-blockchain) apresentava o smart contract como um programa armazenado na blockchain, que roda automaticamente. **Solidity** é a linguagem mais usada para escrever esses programas, no Ethereum e na maioria das redes compatíveis com ele (entre elas a Avalanche). Este capítulo cobre sua sintaxe básica.

## O cabeçalho obrigatório: licença e versão do compilador

Todo arquivo Solidity começa com duas linhas convencionais: um identificador de licença, e a versão do compilador aceita.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

O comentário `SPDX-License-Identifier` declara a licença do código (`MIT` é bem comum no ecossistema); as ferramentas de compilação avisam se ele estiver ausente. A linha `pragma` fixa a versão do compilador Solidity esperada (aqui, `^0.8.20` aceita a 0.8.20 e qualquer versão 0.8.x mais recente, mas não a 0.9): essa restrição evita que uma mudança de compilador mais tarde altere silenciosamente o comportamento de um contrato já escrito.

## Um contrato: dados e funções no mesmo lugar

A palavra-chave `contract` define um contrato, que agrupa **variáveis de estado** (dados armazenados de forma duradoura na blockchain) e **funções** (o código que as lê ou as modifica):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Armazenamento {
    uint256 valor;

    function definir(uint256 x) public {
        valor = x;
    }

    function ler() public view returns (uint256) {
        return valor;
    }
}
```

`uint256` é um inteiro sem sinal (positivo ou zero) de 256 bits, o tipo numérico mais comum em Solidity. Uma **variável de estado** como `valor` continua escrita na blockchain entre chamadas: ao contrário de uma variável local em uma função comum, ela sobrevive ao fim da função que a modificou.

> **Cilada:** esquecer a palavra-chave `view` em uma função que só lê uma variável de estado (como `ler()`). Uma função sem `view` é considerada pela rede como potencialmente capaz de modificar o estado, o que a torna custosa de chamar mesmo que na realidade só leia um valor.
>
> **Boa prática:** marcar como `view` toda função que não modifica nenhuma variável de estado, e como `pure` a que nem sequer lê nenhuma: a rede pode então executar essas chamadas sem custo, ao contrário de uma chamada que realmente modifica a blockchain.

## `msg.sender` e `msg.value`: saber quem chama, e com quanto

Cada chamada a uma função de um contrato carrega consigo duas informações fornecidas automaticamente pela rede: `msg.sender` (o endereço da pessoa ou do contrato que chama) e `msg.value` (a quantidade de criptomoeda enviada com a chamada, se a função estiver marcada como `payable`).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Cofre {
    mapping(address => uint256) public saldos;

    function depositar() public payable {
        saldos[msg.sender] += msg.value;
    }

    function sacar(uint256 valor) public {
        require(saldos[msg.sender] >= valor, "Saldo insuficiente");
        saldos[msg.sender] -= valor;
        payable(msg.sender).transfer(valor);
    }
}
```

Um `mapping(address => uint256)` associa um endereço a um valor, como um dicionário: aqui, cada endereço tem seu próprio saldo. `require(condicao, mensagem)` interrompe a execução (e desfaz qualquer mudança já feita) se a condição for falsa, um mecanismo de guarda usado sistematicamente no início de uma função para validar suas precondições.

## A ordem checks / effects / interactions: uma regra de segurança, não de estilo

Repare na ordem exata das três linhas em `sacar()`: primeiro a verificação (`require`), depois a atualização do estado interno (`saldos[msg.sender] -= valor`), e só então o envio real dos fundos (`transfer`). Essa ordem se chama padrão **checks / effects / interactions** (verificações / efeitos / interações), e não é uma questão de estilo.

> **Cilada:** enviar os fundos *antes* de atualizar o saldo interno. Um contrato destinatário malicioso pode, no momento de receber os fundos, chamar imediatamente `sacar()` de novo antes que o saldo tenha sido decrementado: como o saldo ainda mostra seu valor antigo, a verificação passa novamente, e os fundos podem ser sacados várias vezes por um único depósito. É um **ataque de reentrância** (*reentrancy*), uma das causas mais frequentes de roubos reais de fundos em smart contracts.
>
> **Boa prática:** sempre verificar as condições, depois atualizar todas as variáveis de estado, e só por último interagir com o exterior (enviar fundos, chamar outro contrato), nunca o contrário.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um arquivo Solidity começa com uma licença e uma versão de compilador (`pragma`). Um `contract` agrupa variáveis de estado (persistentes na blockchain) e funções. `msg.sender`/`msg.value` identificam quem chama e os fundos enviados. A ordem checks/effects/interactions protege contra ataques de reentrância. |
| **Ferramentas utilizáveis** | `view`/`pure` para marcar uma função sem custo que não modifica nada. `require()` para validar uma precondição. `mapping` para associar um endereço a um dado. |
| **Ciladas a evitar** | Esquecer `view` em uma função de leitura pura. Enviar fundos antes de atualizar o estado interno (reentrância). |
| **Boas práticas** | Marcar `view`/`pure` em toda função que não precise modificar o estado. Sempre seguir a ordem checks/effects/interactions antes de qualquer envio de fundos ou chamada externa. |
