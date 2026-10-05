---
order: 12
---

# Os Makefiles

Um **Makefile** automatiza a compilação de um projeto C com vários arquivos: em vez de redigitar manualmente cada comando [`gcc`](https://gcc.gnu.org) (veja [O processo de compilação](/?c=langages-de-programmation&s=c&p=compilation)), descrevem-se uma vez as regras de construção, e a ferramenta [`make`](https://www.gnu.org/software/make/manual/make.html) as executa, recompilando apenas o que realmente mudou desde a última vez.

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
| `-g` | Adiciona as informações de depuração (necessárias para [`gdb`](https://sourceware.org/gdb/) e [Valgrind](/?c=langages&s=c&p=memoire#os-quatro-bugs-de-memoria-classicos)) |
| `-o nome` | Nomeia o arquivo de saída |
| `-O2` | Ativa [o nível de otimização](/?c=langages-de-programmation&s=c&p=compilation) recomendado em produção |

> **Armadilha:** `-O2`/`-O3` em `CFLAGS` pode fazer aparecer um aviso ausente em `-O0` (veja [Os níveis de otimização](/?c=langages-de-programmation&s=c&p=compilation)): testar o `make` com as `CFLAGS` realmente usadas em produção, não apenas com uma configuração de depuração (`-O0 -g`).

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
main.o: main.c
	$(CC) $(CFLAGS) -I includes -I libft/includes -c main.c -o main.o
```

`-I` adiciona uma pasta à lista onde o compilador procura um arquivo `#include "..."` ou `#include <...>` (veja [Os cabeçalhos](/?c=langages&s=c&p=headers)). Ela serve, portanto, na compilação de um `.c` (`-c`), nunca na ligação, que não lê mais nenhum cabeçalho: indispensável assim que um projeto guarda seus `.h` em outro lugar além da pasta atual, ou depende de uma biblioteca de terceiros.

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

## Uma regra para todos os arquivos: `%`, `$@`, `$<`, `$^`

Escrever uma regra por arquivo `.c` (como em [Encadear as regras](#encadear-as-regras)) logo fica longo. Uma **regra de padrão** (*pattern rule*) substitui todas elas: o `%` representa "qualquer nome", o mesmo dos dois lados da regra.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# a lista de fontes, escrita uma única vez
SRCS = main.c calculos.c
# a mesma lista, cada .c trocado por .o: main.o calculos.o
OBJS = $(SRCS:%.c=%.o)

# $@ vale programa, $^ vale main.o calculos.o
programa: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

# vale para cada .o: main.o a partir de main.c, calculos.o a partir de calculos.c
%.o: %.c calculos.h
	$(CC) $(CFLAGS) -c $< -o $@
```

`$@`, `$<` e `$^` são **variáveis automáticas**: o `make` as preenche sozinho, regra por regra, no momento de executar o comando.

| Variável | Contém | Para `main.o` na regra `%.o: %.c calculos.h` |
|---|---|---|
| `$@` | O alvo em construção | `main.o` |
| `$<` | A **primeira** dependência | `main.c` |
| `$^` | **Todas** as dependências, sem repetição | `main.c calculos.h` |

`$(SRCS:%.c=%.o)` é uma **referência de substituição**: ela copia a lista `SRCS` trocando, em cada palavra, o padrão à esquerda do `=` pelo da direita.

```text
$ make
gcc -Wall -Wextra -O2 -c main.c -o main.o
gcc -Wall -Wextra -O2 -c calculos.c -o calculos.o
gcc -Wall -Wextra -O2 -o programa main.o calculos.o
```

> **Armadilha:** `$^` no lugar de `$<` na regra `%.o` passa também `calculos.h` ao `gcc` (`gcc -c main.c calculos.h -o main.o`), que recusa: `cannot specify '-o' with '-c', '-S' or '-E' with multiple files`. Para compilar um `.c`, sempre `$<`.

## Mudar as opções não recompila nada

Uma variável do Makefile pode ser substituída no lançamento, só para aquela execução: `make CFLAGS="-O0 -g"` constrói com essas opções, sem modificar o arquivo. Mas o `make` decide o que reconstruir comparando apenas **datas de modificação**: as opções de compilação não entram na decisão.

```bash
make                    # compila main.o, calculos.o e programa com -O2
make CFLAGS="-O0 -g"    # make: 'programa' is up to date.  (nada é recompilado)
```

| Situação | Resultado |
|---|---|
| `make CFLAGS="-O0 -g"` logo depois de `make` | Nada muda: o programa continua em `-O2`, sem informações de depuração |
| Um único `.c` modificado entre as duas execuções | Programa **misturado**: esse arquivo compilado com as novas opções, os outros com as antigas |

| Solução | Princípio | Custo |
|---|---|---|
| `make clean` antes de cada mudança de opções | Não sobra nenhum `.o`: tudo é recompilado | Recompilação completa a cada mudança; um esquecimento passa despercebido |
| Uma pasta de objetos por conjunto de opções | Cada conjunto de opções tem seus próprios `.o`: voltar a opções já usadas não recompila nada | Uma pasta a mais por conjunto de opções testado |

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# obj/ seguido de um número calculado a partir do texto de CFLAGS
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculos.c
# obj/<número>/main.o obj/<número>/calculos.o
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)

# FORCE: a ligação é refeita a cada chamada (veja mais abaixo)
programa: $(OBJS) FORCE
	$(CC) $(CFLAGS) -o $@ $(OBJS)

# mkdir -p cria a pasta se ela faltar, sem erro se ela já existir
$(OBJDIR)/%.o: %.c calculos.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

# apaga de uma vez as pastas de objetos de todos os conjuntos de opções
clean:
	rm -rf obj programa

FORCE:
.PHONY: clean FORCE
```

O nome da pasta vem de um comando [shell](/?c=langages&s=bash&p=bash), executado por `$(shell ...)` (veja [`pkg-config`](#encontrar-os-flags-de-compilacao-de-uma-biblioteca-pkg-config)), cujas três etapas são ligadas por [pipes](/?c=langages&s=bash&p=redirections-et-pipes#os-pipes-encadear-comandos):

| Etapa | Papel | Saída para `-Wall -Wextra -O2` |
|---|---|---|
| [`printf '%s' '...'`](https://man7.org/linux/man-pages/man1/printf.1.html) | Escreve o texto das opções, sem quebra de linha | `-Wall -Wextra -O2` |
| [`cksum`](https://man7.org/linux/man-pages/man1/cksum.1.html) | Calcula uma **soma de verificação**: um número que resume o texto (como uma [função hash](/?c=langages&s=c&p=tables-de-hachage#a-funcao-hash)), diferente assim que um caractere muda | `364582449 17` (a soma, depois o número de bytes) |
| [`cut -d' ' -f1`](/?c=langages&s=bash&p=traitement-de-texte#cut-extrair-colunas-de-forma-simples) | Guarda o primeiro campo | `364582449` |

**Por que a [ligação](/?c=langages&s=c&p=compilation#4-a-ligacao-linking) é sempre refeita.** Um alvo que depende de `FORCE` (um alvo sem dependência nem comando, que não corresponde a nenhum arquivo) é reconstruído a cada chamada. Sem ele:

| Etapa | Comando | O que acontece sem `FORCE` |
|---|---|---|
| 1 | `make` | `obj/364582449/*.o` compilados, `programa` ligado em `-O2` |
| 2 | `make CFLAGS="-O0 -g"` | `obj/1873556349/*.o` compilados, `programa` ligado em `-O0`, portanto mais recente que `obj/364582449/*.o` |
| 3 | `make` | `programa` é mais recente que `obj/364582449/*.o`: "atualizado", ele continua em `-O0` |

Com `FORCE`, a etapa 3 liga de novo os objetos de `obj/364582449/`, sem recompilar nada: a ligação leva só um instante.

> **Armadilha:** `$^` no lugar de `$(OBJS)` no comando de ligação contém também `FORCE`: o ligador procura então um arquivo com esse nome e para (`cannot find FORCE: No such file or directory`).

> **Armadilha:** um comentário escrito no fim de uma linha de variável (`OBJDIR = obj/...   # objetos`) deixa no valor os espaços que o precedem: `$(OBJDIR)/%.o` vira `obj/364582449   /%.o`, ou seja, dois alvos distintos. O `make` para então com `mixed implicit and normal rules` e `No rule to make target '%.c'`, mensagens que não apontam para o comentário. Escrever os comentários de variáveis na própria linha, acima.

## Os cabeçalhos modificados: dependências automáticas (`-MMD -MP`)

As regras acima citam `calculs.h` à mão. Um cabeçalho esquecido na lista, ou incluído por outro cabeçalho, é invisível para o `make`: o `.o` não é recompilado e o programa mantém o código antigo. Exemplo medido, com `#define FACTEUR 1` em `calculs.h` e uma regra `%.o: %.c` sem nenhum cabeçalho:

```text
$ make                      # FACTEUR vale 1
$ ./programme
9
$ sed -i 's/FACTEUR 1/FACTEUR 2/' calculs.h
$ make
make: 'programme' is up to date.
$ ./programme
9                           # deveria mostrar 36: nada foi recompilado
```

O `gcc` sabe listar sozinho os cabeçalhos que lê. Com `-MMD`, ele escreve ao lado de cada `.o` um arquivo `.d` (*dependências*) durante a compilação habitual, sem os cabeçalhos do sistema (`<stdio.h>`...):

```text
$ cat main.d
main.o: main.c calculs.h
calculs.h:
```

A primeira linha é uma regra `make` completa. A segunda vem de `-MP`: uma regra **vazia** por cabeçalho. Falta carregar esses arquivos com `include`:

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2 -MMD -MP
SRCS = main.c calculs.c
OBJS = $(SRCS:%.c=%.o)

programme: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# carrega os .d; o traço ignora um arquivo ausente (primeiro build, antes de qualquer .d)
-include $(OBJS:.o=.d)
```

| Elemento | Papel | Sem ele |
|---|---|---|
| `-MMD` | o `gcc` escreve `main.d`: a lista de cabeçalhos realmente incluídos | modificar um cabeçalho não recompila nada |
| `-MP` | uma regra vazia por cabeçalho | um cabeçalho renomeado ou apagado interrompe o `make` (veja abaixo) |
| `-include` | carrega os `.d` sem erro se faltarem | o `make` para no primeiro build (`No rule to make target 'a.d'`), antes de existir qualquer `.d` |

A mesma mudança de cabeçalho (`FACTEUR` em 3) com essas regras: os dois `.c` são recompilados e o programa mostra `81`. Se um cabeçalho for depois renomeado, os antigos `.d` ainda o citam. Sem `-MP`, o `make` para:

```text
make: *** No rule to make target 'calculs.h', needed by 'main.o'.  Stop.
```

Com `-MP`, a regra vazia faz o `make` acreditar que o cabeçalho existe: ele recompila o `.c`, e é o compilador que aponta o erro real ou constata que os `#include` estão em dia.

**Outra dependência oculta: o próprio Makefile.** Mudar uma opção **dentro** do Makefile também não recompila nada, pois o `make` só compara datas de arquivos. Medido com `CFLAGS = -DOPT=1` mudado para `-DOPT=2`: sem `Makefile` entre as dependências (`programme: a.c`), o `make` responde «up to date» e o programa continua mostrando `opt=1`; com `programme: a.c Makefile`, ele recompila e mostra `opt=2`. O arquivo-fonte continua **em primeiro lugar**: `$<` designa a primeira dependência. Contrapartida: mexer no Makefile recompila tudo.

## Dependência de ordem: executar antes, sem forçar a reconstrução

Uma regra pode separar suas dependências em dois grupos com uma barra vertical: `alvo: dependências normais | dependências de ordem`. O `make` constrói primeiro as dependências de ordem (*order-only*) se faltarem, mas **a data delas nunca entra na decisão** de reconstruir o alvo.

**Primeiro caso: a pasta de objetos.** Uma pasta é um alvo como outro qualquer, mas sua data muda toda vez que um arquivo é criado nela. Colocada entre as dependências normais, ela deixa os `.o` «desatualizados» logo depois de criados. Medido com `obj/a.o` e `obj/b.o`, chamados três vezes seguidas:

| Chamada | Pasta como dependência normal | Pasta depois da barra `\|` |
|---|---|---|
| 1 | cria `obj/`, compila `a.o` e `b.o` | cria `obj/`, compila `a.o` e `b.o` |
| 2 | recompila `a.o` | `Nothing to be done` |
| 3 | recompila `b.o` | `Nothing to be done` |

```makefile
OBJDIR = obj
OBJS = $(OBJDIR)/a.o $(OBJDIR)/b.o

all: $(OBJS)

# depois da barra: a pasta deve existir antes de compilar, sua data é ignorada
$(OBJDIR)/%.o: %.c | $(OBJDIR)
	gcc -c $< -o $@

$(OBJDIR):
	mkdir -p $@
```

Na receita, `$^` contém apenas as dependências normais (`a.c`): as dependências de ordem ficam em outra variável automática, `$|` (aqui `obj`). Um `$^` passado ao compilador nunca carrega portanto a pasta (ao contrário de `FORCE`, visto acima, que é uma dependência normal).

**Segundo caso: um alvo fictício (`.PHONY`) a executar antes, sem forçar a reconstrução.** Um alvo `.PHONY` colocado entre as dependências **normais** é sempre considerado a refazer, e portanto o alvo que depende dele também. Medido com um alvo `verif` que mostra uma mensagem e um `programme` ligado a partir de `a.o` e `b.o`:

| Chamada | `programme: a.o b.o verif` | `programme: a.o b.o \| verif` |
|---|---|---|
| 1 | compila, `verif`, liga | compila, `verif`, liga |
| 2 | `verif`, **liga de novo** | somente `verif` |

Depois da barra, `verif` executa a cada chamada (útil para um controle prévio), sem forçar a ligação.

## Testar a presença de uma ferramenta ou de uma biblioteca

Um Makefile que supõe uma ferramenta instalada falha mais adiante, com uma mensagem que não nomeia a causa. Testa-se primeiro, e para-se com uma mensagem precisa.

**Uma ferramenta: `command -v`.** O comando `command -v nome` mostra o caminho da ferramenta se ela existe e não mostra nada caso contrário (código de saída diferente de 0). Ele é previsto pela norma POSIX, ao contrário de `which`, um programa à parte. `$(error texto)` interrompe o `make` com esse texto:

```makefile
# $(shell ...) devolve a saída do comando: vazia se a ferramenta não existe
ifeq ($(shell command -v pkg-config),)
$(error pkg-config nao encontrado: instale-o antes de rodar make)
endif
```

```text
Makefile:2: *** pkg-config nao encontrado: instale-o antes de rodar make.  Stop.
```

**Uma biblioteca: um teste de compilação.** O `pkg-config` (veja acima) pode faltar, ou não conhecer uma biblioteca instalada à mão, e seu `.pc` não prova que a compilação vai dar certo. O teste mais confiável faz o que o programa fará: compilar um programa mínimo que inclui o cabeçalho e liga a biblioteca.

```bash
printf '#include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | gcc -x c - -lm -o /dev/null
```

| Peça | Papel |
|---|---|
| `printf '...'` | escreve um pequeno programa C (`\n` = quebra de linha) |
| `\|` | envia-o ao `gcc` pela entrada padrão |
| `-x c -` | `-x c` diz que o texto é C (a entrada padrão não tem extensão `.c`); `-` significa «ler a entrada padrão» |
| `-lm` | liga a biblioteca testada |
| `-o /dev/null` | descarta o executável produzido: só conta o código de saída (`0` = cabeçalho encontrado **e** biblioteca ligada) |

**A armadilha do `#` em um Makefile.** Em uma definição de variável ou em uma linha de dependências, `#` começa um comentário: a linha `INCL := printf '#include <math.h>\n'` é cortada em `#` e a variável só vale `printf '` (medido). `\#` dá um `#` literal em uma definição comum. Mas **dentro de `$(shell ...)`, o `make` não retira a barra invertida**: o shell recebe `\#include`, e o `gcc` responde `stray '\' in program` (medido). Dois remédios: uma variável `HASH := \#` inserida com `$(HASH)`, ou o código octal `\043` do `printf`.

```makefile
CC = gcc
# uma variável que contém somente o caractere #
HASH := \#
TEST_MATH = printf '$(HASH)include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | $(CC) -x c - -lm -o /dev/null 2>/dev/null && echo sim
# "sim" se o teste der certo, vazio caso contrário
HAVE_MATH := $(shell $(TEST_MATH))

ifeq ($(HAVE_MATH),)
$(error teste de compilacao de math.h e -lm impossivel: cabecalho ou biblioteca ausente)
endif
```

Resultados medidos com este esquema em quatro testes:

| Teste | Valor obtido |
|---|---|
| `#include <math.h>` e `-lm` | `sim` |
| `#include <inexistant.h>` | vazio |
| `-lbibliotheque_absente` | vazio |
| `\043include <math.h>` (octal, sem `HASH`) | `sim` |

> **Armadilha:** `2>/dev/null` esconde as mensagens do compilador, e portanto a causa real da falha. Para diagnosticar, rodar de novo à mão o comando do teste, sem esse redirecionamento.

## Encadear as três etapas da PGO em um alvo

A [otimização guiada por perfil](/?c=langages&s=c&p=compilation#a-otimizacao-guiada-por-perfil-pgo) (PGO) compila o programa três vezes seguidas: versão instrumentada, execução de treino, versão otimizada. Um alvo do Makefile pode encadear as três, relançando o `make` sobre um alvo de compilação comum (`ligar`) com outras opções.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
NOME = programa
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculos.c
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)
# pasta dos perfis (arquivos .gcda)
PGO_DIR = pgo
# entradas de treino, diferentes das usadas nas medições de velocidade
PGO_ENTRADAS = teste1.txt teste2.txt

# alvo padrão: as três etapas, refeitas só se uma fonte ou o Makefile mudar
$(NOME): $(SRCS) calculos.h Makefile
	rm -rf $(PGO_DIR) obj/pgo
	$(MAKE) ligar NOME=instrumentado OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-generate=$(PGO_DIR)"
	for f in $(PGO_ENTRADAS); do ./instrumentado $$f > /dev/null || exit 1; done
	rm -f instrumentado obj/pgo/*.o
	$(MAKE) ligar NOME=$(NOME) OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-use=$(PGO_DIR)"

# compilação direta, sem PGO (testes, depuração), sempre ligada como com FORCE
ligar: $(OBJS)
	$(CC) $(CFLAGS) -o $(NOME) $(OBJS)

$(OBJDIR)/%.o: %.c calculos.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf obj $(PGO_DIR) instrumentado $(NOME)

.PHONY: ligar clean
```

| Detalhe | Por quê |
|---|---|
| [`$(MAKE)`](https://www.gnu.org/software/make/manual/html_node/MAKE-Variable.html) em vez de `make` | Relança exatamente o mesmo programa `make`, sinalizando-o como uma chamada recursiva: suas opções (`-j`, `-n`...) são repassadas corretamente ao sub-`make` |
| `NOME=... OBJDIR=... CFLAGS=...` depois de `ligar` | Substituem, só para essa chamada, os valores escritos no Makefile (seção anterior) |
| Mesmo `OBJDIR=obj/pgo` nas etapas 1 e 3 | O perfil de cada `.o` leva o nome desse `.o`: com outra pasta na etapa 3, o perfil não é encontrado, o que o `gcc` só sinaliza com um [aviso](/?c=langages&s=c&p=compilation#a-otimizacao-guiada-por-perfil-pgo) |
| `rm -f ... obj/pgo/*.o` antes da etapa 3 | Os `.o` instrumentados são mais recentes que as fontes: sem esse `rm`, o `make` não recompila nada, liga os objetos da etapa 1 sem a biblioteca que registra as contagens, e falha (`undefined reference to '__gcov_merge_add'`) |
| `\` no fim de uma linha | Cada linha de comando roda no seu próprio shell; `\` junta duas linhas em um único comando |
| `$$f` | Em um comando, `$` pertence ao `make`; `$$` repassa um `$` ao shell, para a variável do [laço `for`](/?c=langages&s=bash&p=boucles#o-laco-for-percorrer-uma-lista) |
| `\|\| exit 1` | Para tudo no primeiro treino que falhar: sem ele, o laço só devolve o [código de saída](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-saida-exit) da sua última volta, e uma falha anterior passaria despercebida |
| Dependências `$(SRCS) calculos.h Makefile` | As três etapas só são refeitas se o código ou o Makefile mudar |

## Saber se uma reconstrução é necessária: `make -q`

Com `-q` (*question*), o `make` não executa nenhum comando: ele só responde pelo seu [código de saída](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-saida-exit).

| Opção | Executa os comandos? | O que oferece |
|---|---|---|
| `make -n` | Não | Mostra os comandos que seriam executados |
| `make -q` | Não | Código de saída `0` se tudo estiver atualizado, `1` se uma reconstrução for necessária, `2` em caso de erro |

Útil em um script, para avisar antes de uma reconstrução longa (as três etapas da PGO levam cerca de 24 segundos no solucionador SAT citado em [compilação](/?c=langages&s=c&p=compilation#a-otimizacao-guiada-por-perfil-pgo)):

```bash
if ! make -q; then                         # 1 ou 2: há algo a fazer
    echo "Reconstrução (cerca de 24 s)..." # avisa antes da espera
fi
make -s || exit 1                          # constrói se preciso, em silêncio
```

> **Armadilha:** um alvo `.PHONY`, ou que depende de `FORCE`, nunca está "atualizado": `make -q ligar` responde sempre `1`. Fazer a pergunta sobre um alvo que seja um arquivo real, construído só quando suas dependências mudam (aqui `programa`, o alvo PGO).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um Makefile descreve regras (`alvo: dependências` + comando) que `make` executa, reconstruindo apenas o que realmente mudou. Uma receita curta também pode ficar na própria linha do alvo, depois de um `;`. O `make` só compara datas: mudar as opções de compilação não recompila nada. |
| **Ferramentas utilizáveis** | Variáveis (`CC`, `CFLAGS`), alvos fictícios (`.PHONY`), `-I` para os cabeçalhos, `pkg-config` para os flags de uma biblioteca, `@`/`MAKEFLAGS += -s` para o modo silencioso.; regras de padrão (`%`, `$@`, `$<`, `$^`); `make VARIÁVEL=valor`; `$(MAKE)` para encadear etapas (PGO); `make -n` e `make -q`; `-MMD -MP` com `-include` para os cabeçalhos; dependência de ordem (`alvo: normais \| ordem`); `command -v`, `$(error ...)` e um teste de compilação (`gcc -x c -`) para verificar uma ferramenta ou uma biblioteca. |
| **Armadilhas a evitar** | Indentar um comando com espaços em vez de uma tabulação; apontar `-I` para o nível de pasta errado; confundir o nome `pkg-config` de uma biblioteca com o nome do seu pacote do sistema.; `$^` para compilar um `.c`; um comentário no fim de uma linha de variável; achar que um novo `CFLAGS` foi aplicado; listar os cabeçalhos à mão (um esquecimento deixa um programa desatualizado); pôr uma pasta ou um alvo `.PHONY` entre as dependências normais (reconstrução a cada chamada); escrever `\#` dentro de um `$(shell ...)`; esconder os erros de um teste de compilação sem poder relê-los. |
| **Boas práticas** | Declarar `.PHONY` para todo alvo que não produz um arquivo real (`clean`, `test`...), para evitar um conflito com um arquivo de mesmo nome; passar por `pkg-config` em vez de adivinhar `-I`/`-l` na mão para uma biblioteca de terceiros.; uma pasta de objetos por conjunto de opções, com a ligação sempre refeita; `\|\| exit 1` em um laço de comando. Deixar o `gcc` produzir as dependências de cabeçalhos (`-MMD -MP`) e pôr o `Makefile` entre as dependências de um objeto; criar uma pasta de objetos por uma dependência de ordem; testar uma ferramenta antes de usá-la e parar com uma mensagem que a nomeie. |
