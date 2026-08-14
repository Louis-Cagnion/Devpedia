---
order: 7
---

# O processo de compilação

Ao contrário do PHP ou do JavaScript, que são interpretados diretamente durante a execução, um programa em C tem de ser **compilado em código de máquina** antes de poder ser executado. Esta compilação decorre em quatro etapas distintas, geralmente ocultas por trás de um único comando (`gcc main.c -o programa`), mas que é útil saber distinguir para compreender certos erros.

## As quatro etapas

```
main.c --[1. préprocesseur]--> main.i --[2. compilation]--> main.s --[3. assemblage]--> main.o --[4. édition de liens]--> programme
```

### 1. O pré-processador

Aborda tudo o que começa por `#` **antes** de o compilador ver o código: substitui os `#include` pelo conteúdo real do arquivo incluído, substitui as macros `#define`, resolve os `#ifdef` / `#ifndef`. O resultado é um único arquivo-fonte «simplificado», sem mais nenhuma diretiva `#`.

```bash
gcc -E main.c -o main.i
```

### 2. A compilação propriamente dita

Converte o código-fonte (C) em **linguagem de montagem**, uma linguagem ainda legível por um ser humano, mas muito próxima das instruções do processador.

```bash
gcc -S main.i -o main.s
```

### 3. A montagem

Converte o código em assembler em **código de máquina binário**, agrupado num arquivo objeto (`.o`). Este arquivo já contém instruções executáveis, mas ainda não é um programa completo: as chamadas a funções externas (como `printf`) ainda não foram resolvidas.

```bash
gcc -c main.s -o main.o
```

### 4. A ligação de arquivos (*linking*)

Junta um ou mais arquivos «`.o`» e resolve as referências a funções definidas noutros locais (noutros arquivos «`.o`» ou em bibliotecas, ver capítulo dedicado) para produzir um executável final completo.

```bash
gcc main.o -o programa
```

## Por que separar a compilação da ligação?

Um projeto com vários arquivos-fonte pode compilar cada `.c` em `.o` de forma independente e, em seguida, ligar (*link*) apenas os arquivos que foram alterados, o que é mais rápido do que uma recompilação completa a cada alteração. É exatamente isso que um **Makefile** automatiza (ver capítulo dedicado):

```bash
gcc -c fichier1.c -o fichier1.o
gcc -c fichier2.c -o fichier2.o
gcc fichier1.o fichier2.o -o programa
```

## Erros de compilação vs. erros de ligação

Saber em que etapa ocorre um erro ajuda a diagnosticá-lo:

| Mensagem típica | Etapa em questão | Causa frequente |
|---|---|---|
| `error: expected ';' before...` | Compilação | Erro de sintaxe no código-fonte |
| `fatal error: xxx.h: No such file or directory` | Pré-processador | Arquivo de cabeçalho não encontrado (ver capítulo sobre cabeçalhos) |
| `undefined reference to 'ma_fonction'` | Edição de ligações | Função declarada mas nunca definida/ligada (arquivo `.o` ou biblioteca em falta) |
