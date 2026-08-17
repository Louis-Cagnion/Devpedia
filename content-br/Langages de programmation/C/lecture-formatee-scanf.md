---
order: 20
---

# A leitura formatada: `scanf` e `sscanf`

O capítulo sobre as [funções variádicas](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) cobre `printf`: converter valores tipados em uma string formatada. `scanf` (e sua variante `sscanf`) faz a operação **inversa**: extrair valores tipados a partir de uma string, seguindo um formato dado.

## `sscanf`: extrair valores de uma string

```c
#include <stdio.h>

int jour, mois, annee;
int trouves = sscanf("25/12/2026", "%d/%d/%d", &jour, &mois, &annee);

// trouves vale 3: jour=25, mois=12, annee=2026
```

`sscanf` lê a string de origem comparando-a com o formato dado: cada `%d`/`%s`/`%f`... consome a parte correspondente da string e escreve o valor convertido no endereço fornecido (daí o `&` antes de cada variável, como para qualquer ponteiro de saída em C). Os caracteres do formato que **não** são um especificador (o `/` aqui) devem aparecer **exatamente como estão** na string de origem para que o parsing continue.

| Especificador | Tipo esperado | Exemplo de string de origem |
|---|---|---|
| `%d` | `int` | `"42"` |
| `%f` | `float` | `"3.14"` |
| `%c` | `char` (um único caractere) | `"a"` |
| `%s` | String (`char*`), para no primeiro espaço | `"bonjour"` |

## O valor de retorno: o número de campos realmente lidos

`sscanf` retorna o **número de conversões bem-sucedidas**, não um simples sucesso/falha binário: uma informação indispensável, porque o parsing pode parar bem no meio do formato sem provocar erro visível:

```c
int jour, mois, annee;
int trouves = sscanf("25-12", "%d/%d/%d", &jour, &mois, &annee);

// trouves vale 0: o primeiro "/" esperado nao corresponde ao "-" real,
// o parsing para antes mesmo de ler "jour" -> jour permanece NAO INICIALIZADO
```

> **Armadilha:** ignorar o valor de retorno de `sscanf` e usar diretamente as variáveis que deveriam ter sido preenchidas. Se o formato não corresponder inteiramente à string de origem, algumas variáveis **nunca são escritas**: lê-las depois lê um valor não inicializado, um comportamento indefinido que pode funcionar "por sorte" em teste e falhar silenciosamente em outro lugar.
>
> **Boa prática:** sempre comparar o valor de retorno de `sscanf` com o número de campos esperados antes de usar as variáveis preenchidas, exatamente como se verificaria o código de retorno de qualquer chamada de sistema (veja [Chamadas de sistema e descritores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)).

## `%s` sem limite: um risco de estouro de buffer

Ao contrário de `%d`/`%f`, que sempre escrevem um tamanho fixo, `%s` copia uma string de **comprimento variável** para o buffer fornecido, sem nunca verificar seu tamanho:

```c
char nom[16];
sscanf(entree_utilisateur, "%s", nom);   // se entree_utilisateur tiver mais de 15 caracteres: estouro de buffer
```

> **Armadilha:** a mesma classe de vulnerabilidade já encontrada com as strings de formato de `printf` (veja o capítulo sobre as [funções variádicas](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)): uma entrada não controlada que ultrapassa o tamanho do buffer escreve fora da memória alocada para ele.
>
> **Boa prática:** sempre limitar `%s` com uma largura máxima explícita, `%15s` para um buffer de 16 bytes (15 caracteres + o `\0` final), nunca um `%s` nu em uma entrada cujo tamanho não é garantido.

## Reimplementar `sscanf`: um exercício clássico

Escrever sua própria versão simplificada de `sscanf` (frequentemente chamada de `ft_sscanf` nos exercícios que a pedem) é um exercício comum para entender esse mecanismo por dentro: a função deve ela mesma ser [variádica](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) (ela recebe um número variável de ponteiros de saída, guiada como `printf` pelos `%` da string de formato), e percorrer simultaneamente a string de origem e a string de formato caractere por caractere, avançando em uma delas apenas quando um especificador do formato corresponde a ela.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `sscanf` extrai valores tipados de uma string segundo um formato, a operação inversa de `printf`. Seu valor de retorno indica o número de campos realmente lidos, não um simples sucesso/falha. |
| **Ferramentas utilizáveis** | `sscanf(origem, formato, ...)`, uma largura máxima explícita (`%15s`) para limitar uma leitura de string. |
| **Armadilhas a evitar** | Usar uma variável sem verificar que `sscanf` realmente a preencheu. Ler uma string com `%s` sem limite de tamanho em uma entrada não controlada. |
| **Boas práticas** | Sempre comparar o valor de retorno de `sscanf` com o número de campos esperados. Sempre limitar `%s` com uma largura máxima explícita. |
