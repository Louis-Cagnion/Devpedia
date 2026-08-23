---
order: 8
---

# O processo de compilação

Ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), interpretados diretamente na execução, um programa C precisa ser **traduzido em código de máquina** antes de poder ser executado. Essa tradução acontece em quatro etapas distintas, geralmente invisíveis atrás de um único comando ([`gcc`](https://gcc.gnu.org) `main.c -o programa`), mas que vale a pena saber separar para entender certos erros.

## As quatro etapas

```text
main.c --[1. preprocessador]--> main.i --[2. compilacao]--> main.s --[3. montagem]--> main.o --[4. ligacao]--> programa
```

### 1. O preprocessador

Processa tudo que começa com `#` **antes** de o compilador ver o código: substitui os `#include` pelo conteúdo real do arquivo incluído, substitui as macros `#define`, resolve os `#ifdef`/`#ifndef`. O resultado é um único arquivo fonte, "achatado", sem mais nenhuma diretiva `#`.

```bash
gcc -E main.c -o main.i
```

### 2. A compilação propriamente dita

Traduz o código fonte (C) em **assembly**, uma linguagem ainda legível por um humano mas bem próxima das instruções do processador.

```bash
gcc -S main.i -o main.s
```

### 3. A montagem

Traduz o assembly em **código de máquina binário**, agrupado em um arquivo objeto (`.o`). Esse arquivo já contém instruções executáveis, mas ainda não é um programa completo: as chamadas a funções externas (como `printf`) ainda não estão resolvidas.

```bash
gcc -c main.s -o main.o
```

### 4. A ligação (*linking*)

Junta um ou vários arquivos `.o` entre si, e resolve as referências a funções definidas em outro lugar (em outros arquivos `.o`, ou em [bibliotecas](/?c=langages-de-programmation&s=c&p=bibliotheques)) para produzir um executável final completo.

```bash
gcc main.o -o programa
```

## Por que separar compilação e ligação

Um projeto com vários arquivos fonte pode compilar cada `.c` em `.o` independentemente, e depois ligar (*link*) apenas os arquivos que mudaram: mais rápido do que uma recompilação completa a cada modificação. É exatamente isso que um [**Makefile**](/?c=langages-de-programmation&s=c&p=makefiles) automatiza:

```bash
gcc -c arquivo1.c -o arquivo1.o
gcc -c arquivo2.c -o arquivo2.o
gcc arquivo1.o arquivo2.o -o programa
```

## Erros de compilação vs erros de ligação

Saber em qual etapa um erro ocorre ajuda a diagnosticá-lo:

| Mensagem típica | Etapa envolvida | Causa frequente |
|---|---|---|
| `error: expected ';' before...` | Compilação | Erro de sintaxe no código fonte |
| `fatal error: xxx.h: No such file or directory` | Preprocessador | Arquivo de cabeçalho não encontrado (veja [Os arquivos de cabeçalho](/?c=langages-de-programmation&s=c&p=headers)) |
| `undefined reference to 'minha_funcao'` | Ligação | Função declarada mas nunca definida/ligada (arquivo `.o` ou biblioteca ausente) |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um programa C passa por 4 etapas antes da execução: preprocessador → compilação (assembly) → montagem (código de máquina, `.o`) → ligação (executável final). |
| **Ferramentas utilizáveis** | `gcc -E`/`-S`/`-c` para observar cada etapa separadamente. |
| **Armadilhas a evitar** | Confundir um erro de compilação (sintaxe) com um erro de ligação (`undefined reference`, função nunca ligada): a mensagem indica a etapa envolvida. |
| **Boas práticas** | Compilar cada arquivo `.c` em `.o` separadamente em um projeto com vários arquivos, para ligar apenas o que mudou em vez de recompilar tudo. |
