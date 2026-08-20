---
order: 9
---

# Os Makefiles

Um **Makefile** automatiza a compilação de um projeto C com vários arquivos: em vez de redigitar manualmente cada comando [`gcc`](https://gcc.gnu.org) (veja [O processo de compilação](/?c=langages-de-programmation&s=c&p=compilation)), descrevem-se uma vez as regras de construção, e a ferramenta `make` as executa, recompilando apenas o que realmente mudou desde a última vez.

## Anatomia de uma regra

```makefile
alvo: dependencias
	comando
```

```makefile
programa: main.o calculos.o
	gcc main.o calculos.o -o programa
```

"Para construir `programa`, preciso de `main.o` e `calculos.o`; se um dos dois for mais recente que `programa` (ou se `programa` ainda não existir), execute o comando." A linha de comando **deve** ser indentada com uma tabulação, nunca espaços: um dos erros mais frequentes com Makefiles.

## Encadear as regras

```makefile
programa: main.o calculos.o
	gcc main.o calculos.o -o programa

main.o: main.c calculos.h
	gcc -c main.c -o main.o

calculos.o: calculos.c calculos.h
	gcc -c calculos.c -o calculos.o
```

Ao digitar simplesmente `make`, a ferramenta constrói a **primeira regra do arquivo** (`programa`), e sobe recursivamente por suas dependências: para obter `main.o`, ela olha a regra `main.o: ...`, etc. Se `calculos.c` não mudou desde a última compilação, `make` não recompila `calculos.o`: apenas a parte modificada do projeto é reconstruída.

## Variáveis

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programa: main.o calculos.o
	$(CC) main.o calculos.o -o programa

main.o: main.c calculos.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` e `$(CFLAGS)` são variáveis do Makefile: mudar o compilador ou as opções de aviso então exige apenas uma única modificação, no topo do arquivo.

| Opção `gcc` comum | Função |
|---|---|
| `-Wall -Wextra` | Ativa a maioria dos avisos úteis do compilador |
| `-g` | Adiciona as informações de depuração (necessárias para `gdb`/Valgrind) |
| `-o nome` | Nomeia o arquivo de saída |

## Alvos fictícios (`.PHONY`)

Um alvo como `clean` não corresponde a nenhum arquivo real a produzir: ele serve apenas para executar um comando utilitário (aqui, remover os arquivos compilados):

```makefile
.PHONY: clean

clean:
	rm -f *.o programa
```

`.PHONY` indica ao `make` que `clean` não é um nome de arquivo: sem essa linha, se um arquivo chamado `clean` existisse por coincidência na pasta, `make clean` poderia considerá-lo "atualizado" e não executar nada.

> **Nota:** chamar um alvo como argumento (`make clean`, `make programa`) constrói **esse** alvo específico em vez do primeiro do arquivo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um Makefile descreve regras (`alvo: dependências` + comando) que `make` executa, reconstruindo apenas o que realmente mudou. |
| **Ferramentas utilizáveis** | Variáveis (`CC`, `CFLAGS`), alvos fictícios (`.PHONY`). |
| **Armadilhas a evitar** | Indentar um comando com espaços em vez de uma tabulação: erro muito frequente que quebra a regra. |
| **Boas práticas** | Declarar `.PHONY` para todo alvo que não produz um arquivo real (`clean`, `test`...), para evitar um conflito com um arquivo de mesmo nome. |
