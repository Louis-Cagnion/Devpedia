---
order: 10
---

# A inundação de logs: sinalizar cada causa uma única vez

Um **log** (ou registro) é o rastro que um programa escreve para dizer o que está fazendo e o que está dando errado. Em C, as mensagens de erro saem por **`stderr`**, o fluxo de erro padrão (o descritor número 2, veja [as chamadas de sistema e os descritores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)), que aparece no terminal ou é redirecionado para um arquivo. Uma **inundação de logs** acontece quando a mesma mensagem é escrita milhares de vezes: a informação útil fica afogada e o programa desacelera de tanto escrever. Este capítulo mostra como isso acontece em um laço que roda continuamente e como evitá-la com uma lista limitada de causas já sinalizadas.

## Por que um laço repete sua mensagem

Um **laço de renderização** é o laço de um programa gráfico: a cada volta, ele desenha uma imagem na tela (veja [o laço de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Uma mensagem de erro colocada nesse laço é, portanto, escrita **a cada quadro**.

```c
/* Executado a cada quadro: uma mensagem de erro por volta do laço. */
GLint loc = glGetUniformLocation(program, "light_dir");
if (loc == -1)
	fprintf(stderr, "uniform light_dir ausente\n");
```

Aqui, um **`uniform`** é um valor que o programa C define para o **shader** (o pequeno programa executado pela placa de vídeo), e `glGetUniformLocation` devolve `-1` quando o nome não existe: veja [os shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-shaders-os-programas-da-placa-de-video). Há duas causas possíveis: um erro de digitação no nome, ou uma variável que o compilador removeu porque ela não serve para nada no shader.

| Cadência do laço | Linhas escritas por segundo | Linhas em 1 hora |
|---|---|---|
| 60 quadros/s (tela de 60 Hz, [sincronização vertical](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#a-sincronizacao-vertical-vsync) ativa) | 60 | 216 000 |
| Cerca de 150 quadros/s (sem sincronização) | 150 | 540 000 |

As consequências se encadeiam:

- a mensagem **esconde** as outras, porque o primeiro erro útil sai da tela em poucos segundos;
- escrever em um terminal é **lento**: pode custar mais do que o próprio desenho;
- redirecionada para um arquivo, ela o faz **crescer sem fim** até encher o disco.

> **Armadilha:** achar que uma mensagem de erro é sempre inofensiva. Em um laço, o que causa o estrago é a frequência, não o conteúdo da mensagem.

## Uma única vez por causa: a lista limitada

A mensagem de erro é útil **uma vez**. A solução consiste em lembrar as causas já sinalizadas e parar de escrever para elas. Uma **causa** é aqui um texto curto que identifica o problema (`"uniform:light_dir"`): duas causas diferentes são sinalizadas cada uma uma vez, uma mesma causa nunca duas.

```c
#include <stdio.h>
#include <string.h>

#define MAX_CAUSES 16                      /* número máximo de causas lembradas */
#define CAUSE_SIZE 64                      /* comprimento máximo de uma causa, '\0' incluído */

/* Devolve 1 na primeira vez que uma causa é vista, 0 depois (ou se a lista estiver cheia). */
static int	first_report(const char *cause)
{
	static char	seen[MAX_CAUSES][CAUSE_SIZE];   /* static: mantido entre as chamadas */
	static int	count;                          /* static: começa em 0, nunca é reiniciado */

	for (int i = 0; i < count; i++)
		if (strcmp(seen[i], cause) == 0)
			return (0);                     /* já sinalizada: fica calado */
	if (count == MAX_CAUSES)
		return (0);                         /* lista cheia: a memória continua limitada */
	snprintf(seen[count++], CAUSE_SIZE, "%s", cause);
	return (1);
}

/* No laço de renderização: */
if (loc == -1 && first_report("uniform:light_dir"))
	fprintf(stderr, "uniform light_dir ausente\n");
```

A palavra-chave **`static`** diante de uma variável local faz com que ela viva durante todo o programa, em vez de desaparecer ao fim da função (veja [a memória em C](/?c=langages-de-programmation&s=c&p=memoire)): é isso que permite à lista lembrar de uma chamada para outra. A função `strcmp` compara duas cadeias e devolve 0 se forem idênticas; `snprintf` copia parando no tamanho indicado.

Medido em 1 000 quadros com dois uniforms ausentes (`light_dir` e `shininess`):

| | Linhas em `stderr` |
|---|---|
| Mensagem a cada quadro | 2 000 |
| Uma única vez por causa | 2 |

A medição se faz simplesmente contando linhas: `./programa 2>&1 | wc -l` redireciona `stderr` para a saída padrão (`2>&1`) e depois conta as linhas (`wc -l`).

## Os limites dessa solução

| Escolha | Efeito | Quando usar |
|---|---|---|
| Lista de causas já sinalizadas (acima) | Cada causa aparece uma vez, memória limitada | Erros em número finito e conhecido de antemão |
| No máximo uma mensagem por segundo | A mensagem volta com regularidade, útil para um problema que some e reaparece | Programa longo, em que "continua com defeito" importa |
| Contador exibido no fim | "uniform light_dir ausente (repetido 3 400 vezes)" em uma linha ao encerrar | Quando a frequência é, ela própria, uma informação |

> **Armadilha:** uma lista cheia não sinaliza mais nada. Com 16 vagas, a décima sétima causa diferente fica em silêncio. Prever um teto bem acima do número de causas esperadas e considerar escrever uma última linha "causas diferentes demais, mensagens seguintes suprimidas" quando a lista encher.
>
> **Armadilha:** uma causa longa demais é truncada em `CAUSE_SIZE - 1` caracteres pelo `snprintf`: duas causas que só diferem depois desse limite são confundidas. Manter identificadores de causa curtos (`"uniform:light_dir"`), não o texto completo da mensagem.
>
> **Boa prática:** nunca escrever sem limite em `stderr` a partir de um laço que roda a cada quadro, a cada requisição ou a cada linha lida. Ao escrever a mensagem, perguntar: "quantas vezes essa linha pode ser executada durante a vida do programa?"

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma mensagem de erro colocada em um laço é escrita a cada volta: de 60 a 150 linhas por segundo em um laço de renderização. Ela esconde as outras mensagens, desacelera o programa e pode encher o disco. Ela é sinalizada uma única vez por causa. |
| **Ferramentas utilizáveis** | Uma lista limitada de causas já sinalizadas (vetor `static` e `strcmp`); o redirecionamento `2>&1` e `wc -l` para contar as linhas produzidas. |
| **Armadilhas a evitar** | Escrever em `stderr` a cada quadro; uma lista cheia que se cala sem avisar; causas longas truncadas e confundidas. |
| **Boas práticas** | Uma linha de log por causa, nunca por ocorrência; limitar a memória da lista; medir o número de linhas produzidas em uma execução real. |
