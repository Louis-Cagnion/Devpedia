---
order: 8
---

# Os Makefiles

Um **Makefile** automatiza a compilação de um projeto em C com vários ficheiros: em vez de ter de digitar manualmente cada comando «`gcc`» (ver capítulo sobre a compilação), basta definir uma vez as regras de compilação e a ferramenta `make` executa-as — recompilando apenas o que realmente mudou desde a última vez.

## Anatomia de uma regra

```makefile
alvo: dependances
	commande
```

```makefile
programa: main.o calculs.o
	gcc main.o calculs.o -o programa
```

«Para compilar `programa`, preciso de `main.o` e `calculs.o`; se um dos dois for mais recente do que `programa` (ou se `programa` ainda não existir), executa o comando.» A linha de comando **deve** ser indentada com uma tabulação, nunca com espaços — um dos erros mais frequentes com os Makefiles.

## Encadeamento de regras

```makefile
programa: main.o calculs.o
	gcc main.o calculs.o -o programa

main.o: main.c calculs.h
	gcc -c main.c -o main.o

calculs.o: calculs.c calculs.h
	gcc -c calculs.c -o calculs.o
```

Ao digitar simplesmente `make`, a ferramenta constrói a **primeira regra do ficheiro** (`programa`) e rastreia recursivamente as suas dependências: para obter `main.o`, consulta a regra `main.o: ...`, etc. Se `calculs.c` não tiver sofrido alterações desde a última compilação, `make` não recompila `calculs.o` — apenas a parte alterada do projeto é reconstruída.

## Variáveis

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programa: main.o calculs.o
	$(CC) main.o calculs.o -o programa

main.o: main.c calculs.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` e `$(CFLAGS)` são variáveis do Makefile: alterar o compilador ou as opções de aviso requer, assim, apenas uma única modificação, no início do ficheiro.

| Opção`gcc`e atual | Função |
|---|---|
| `-Wall -Wextra` | Ativa a maioria dos avisos úteis do compilador |
| `-g` | Adiciona as informações de depuração (necessárias para o `gdb` /Valgrind) |
| `-o nome` | Indica o nome do ficheiro de saída |

## 

Um destino como `clean` não corresponde a nenhum ficheiro real a ser produzido — serve apenas para executar um comando de utilitário (neste caso, eliminar os ficheiros compilados):

```makefile
.PHONY: clean

clean:
	rm -f *.o programa
```

`.PHONY` indica ao `make` que `clean` não é um nome de ficheiro: sem esta linha, se por acaso existisse um ficheiro chamado `clean` na pasta, o `make clean` poderia considerá-lo «atualizado» e não executar nada.

> **Nota:** chamar um alvo como argumento (`make clean`, `make programa`) cria **esse** alvo específico, em vez do primeiro do ficheiro.
