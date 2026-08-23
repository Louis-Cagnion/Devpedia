---
order: 6
---

# A variável

Um [programa](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) executa instruções: a maioria delas manipula valores que precisam ser mantidos em memória de uma linha para outra. É essa a função da variável.

Uma **variável** é uma caixa etiquetada que contém um valor, consultável ou modificável mais tarde.

```text
nome = "Joao"  → cria uma caixa chamada "nome", guarda nela o valor "Joao"
idade = 25     → cria uma caixa chamada "idade", guarda nela o valor 25
exibir nome    → vai ler a caixa "nome", exibe "Joao"
idade = 26     → substitui o conteudo da caixa "idade" por 26: o valor muda, a caixa permanece a mesma
```

> **Analogia:** um armário etiquetado em um vestiário: pode-se mudar o que ele contém sem nunca mudar a etiqueta colada nele.

> **Cuidado:** confundir o nome da variável com seu valor. `idade = 26` não renomeia "idade": isso substitui o que a caixa contém, a caixa em si (seu nome) nunca muda.
>
> **Boa prática:** escolher um nome de variável que descreva o que ela contém (`idade` em vez de `x`): o código depois se relê sem precisar adivinhar o que há dentro.

## Alguns tipos de valores comuns

Todo valor tem um **tipo**, que determina o que se pode fazer com ele (somar dois números tem sentido, somar dois textos não: o tipo decide):

| Tipo | O que armazena | Exemplo | Caso de uso típico |
|---|---|---|---|
| Número | Uma quantidade, inteira ou decimal | `25`, `19.99` | Contar, calcular um preço |
| Texto (*string*) | Uma sequência de caracteres | `"Joao"` | Um nome, uma mensagem exibida |
| Booleano | Apenas dois valores possíveis: verdadeiro ou falso | `verdadeiro`, `falso` | Uma condição ("o usuário está conectado?") |

> **Aprofundar:** um tipo como "número" tem na realidade seus próprios limites e sutilezas (um tamanho máximo, um arredondamento possível em decimal); veja [Os inteiros, os bits e os overflows](/?c=representation-des-donnees&p=entiers-et-debordements) para o que realmente acontece na memória por trás de um tipo.
>
> **Cuidado:** misturar tipos em uma mesma operação, por exemplo somar um número e um texto (`5 + "25"`). O resultado depende inteiramente da linguagem: algumas geram um erro, outras convertem silenciosamente um dos dois, com um resultado às vezes inesperado (concatenar em vez de somar).
>
> **Boa prática:** converter explicitamente um valor para o tipo desejado antes de uma operação que mistura tipos, em vez de contar com uma conversão automática cujo comportamento exato não é garantido de uma linguagem para outra.

A sintaxe exata para criar uma variável muda de uma linguagem para outra (o símbolo `=` não é sempre suficiente, algumas linguagens exigem especificar o tipo com antecedência); cada capítulo de linguagem neste site ([Python](/?c=langages-de-programmation&s=python&p=python), C, [PHP](/?c=langages-de-programmation&s=php&p=php)...) cobre sua própria sintaxe em detalhes.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Uma variável associa um nome a um valor, modificável mais tarde sem mudar o nome. Cada valor tem um **tipo** (número, texto, booleano...), que determina as operações possíveis sobre ele. |
| **Ferramentas úteis** | Nenhuma ferramenta específica: a criação de uma variável é uma instrução da própria linguagem, escrita diretamente no código. |
| **Armadilhas a evitar** | Confundir o nome da variável com seu valor: `idade = 26` não renomeia "idade", substitui o que a caixa contém. |
| **Boas práticas** | Escolher um nome de variável que descreva o que ela contém (`idade` em vez de `x`): o código depois se relê sem precisar adivinhar. |
