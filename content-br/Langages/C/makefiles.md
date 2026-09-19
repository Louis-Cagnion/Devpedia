---
order: 12
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

## Escrever a receita na mesma linha: `;`

Uma receita sempre segue a linha `alvo: dependências`, indentada com uma tabulação, como visto acima. Um `;` depois da lista de dependências permite escrever uma receita curta diretamente nessa mesma linha, sem passar para a linha seguinte:

```makefile
clean: ; rm -f *.o
```

Estritamente equivalente a:

```makefile
clean:
	rm -f *.o
```

> **Armadilha:** confundir esse `;` do Makefile com um `;` de shell comum (que encadeia dois comandos). Aqui, ele só separa a lista de dependências da receita em si: nada a ver com encadear comandos.

## Incluir os cabeçalhos de uma biblioteca: `-I`

```makefile
programa: main.o
	$(CC) main.o -I includes -I libft/includes -o programa
```

`-I` adiciona uma pasta à lista onde o compilador procura um arquivo `#include "..."` ou `#include <...>` (veja [Os cabeçalhos](/?c=langages&s=c&p=headers)): indispensável assim que um projeto guarda seus `.h` em outro lugar além da pasta atual, ou depende de uma biblioteca de terceiros.

> **Armadilha:** apontar `-I` para o nível de pasta errado (ex. `-I includes` quando os arquivos estão em `includes/subpasta`). O compilador então falha com uma mensagem de "arquivo não encontrado", mesmo que o arquivo exista de fato em algum lugar do projeto.

## Encontrar os flags de compilação de uma biblioteca: `pkg-config`

Vincular uma biblioteca externa (ex. [GLFW](https://www.glfw.org) para abrir uma janela OpenGL) costuma exigir vários `-I` e `-l` (nome da biblioteca para o linker) diferentes conforme a máquina e sua distribuição. `pkg-config` evita ter que adivinhá-los na mão: cada biblioteca instala um pequeno arquivo `.pc` que descreve seus próprios flags, e `pkg-config` os lê sob demanda.

```bash
pkg-config --cflags glfw3        # -I/usr/include            (flags de compilação)
pkg-config --cflags --libs glfw3 # adiciona -lglfw -lm ...    (+ flags do linker)
```

Em um Makefile, `$(shell ...)` executa um comando de shell e substitui a chamada pela sua saída, o que permite injetar diretamente o resultado de `pkg-config`:

```makefile
GLFW_FLAGS = $(shell pkg-config --cflags --libs glfw3)

programa: main.o
	$(CC) main.o $(GLFW_FLAGS) -o programa
```

> **Armadilha:** o nome passado ao `pkg-config` (aqui `glfw3`) nem sempre é idêntico ao nome do pacote do sistema que o instala (ex. `libglfw3-dev` no Debian/Ubuntu). `pkg-config --list-all` lista todos os módulos `.pc` realmente disponíveis na máquina quando esse nome exato não é conhecido de antemão.

## Modo silencioso: `@` e `MAKEFLAGS`

Por padrão, `make` exibe cada comando antes de executá-lo. Um `@` como prefixo de linha suprime essa exibição, apenas para **essa linha**:

```makefile
compilar:
	@echo "Compilando..."
	@gcc main.c -o programa
```

Sem `@`, `make` exibiria primeiro a linha `gcc main.c -o programa` tal como está, além da mensagem `Compilando...` produzida pela sua execução.

Para aplicar esse comportamento a **todo** o arquivo sem prefixar cada linha individualmente, `MAKEFLAGS += -s` bem no início do arquivo tem o mesmo efeito, mas de forma global:

```makefile
MAKEFLAGS += -s

compilar:
	echo "Compilando..."   # já silencioso graças ao MAKEFLAGS; o @ fica redundante aqui
	gcc main.c -o programa
```

> **Nota:** os dois mecanismos se sobrepõem sem entrar em conflito. `MAKEFLAGS += -s` evita esquecer um `@` numa linha nova adicionada mais tarde; `@` linha por linha permite, ao contrário, manter certas linhas deliberadamente visíveis (uma mensagem de erro que se quer ver mesmo em modo silencioso, por exemplo). Combinar os dois, como faria um projeto cauteloso, é redundante mas inofensivo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um Makefile descreve regras (`alvo: dependências` + comando) que `make` executa, reconstruindo apenas o que realmente mudou. Uma receita curta também pode ficar na própria linha do alvo, depois de um `;`. |
| **Ferramentas utilizáveis** | Variáveis (`CC`, `CFLAGS`), alvos fictícios (`.PHONY`), `-I` para os cabeçalhos, `pkg-config` para os flags de uma biblioteca, `@`/`MAKEFLAGS += -s` para o modo silencioso. |
| **Armadilhas a evitar** | Indentar um comando com espaços em vez de uma tabulação; apontar `-I` para o nível de pasta errado; confundir o nome `pkg-config` de uma biblioteca com o nome do seu pacote do sistema. |
| **Boas práticas** | Declarar `.PHONY` para todo alvo que não produz um arquivo real (`clean`, `test`...), para evitar um conflito com um arquivo de mesmo nome; passar por `pkg-config` em vez de adivinhar `-I`/`-l` na mão para uma biblioteca de terceiros. |
