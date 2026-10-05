---
order: 13
---

# Uma mensagem de erro para cada causa

Uma mensagem de erro é lida em um momento preciso: quando um programa acabou de falhar e seu leitor não sabe por quê. Ela deve então dizer a ele **o que corrigir**, sem que precise reler o código. Este capítulo mostra, com um programa que lê um número de porta em um arquivo, três maneiras de escrever essas mensagens (um texto comum a todas as causas, um texto «corrigido» supondo a causa, um texto por causa) e o que cada uma custa a quem recebe o erro. Mostra também que um caminho de erro que esquece de fechar um arquivo acaba produzindo... um erro com uma mensagem enganosa.

As regras adotadas: **uma mensagem por causa** (nunca o mesmo texto para duas causas, nunca uma mensagem vazia nem uma saída com erro sem mensagem); ela **nomeia o elemento defeituoso** (arquivo, linha, campo, valor recebido); dá a **causa real** lida no sistema (`strerror(errno)`), nunca uma causa suposta; não contém quebra de linha.

## O exemplo: ler `port=NNNN` em um arquivo

O programa lê a primeira linha de um arquivo de configuração, que deve valer `port=` seguido de um número de 1 a 65535. Ele existe em três versões, escolhidas por um argumento (`./cfg 1 arquivo`, `./cfg 2 arquivo`, `./cfg 3 arquivo`). Os erros vão para [`stderr`](/?c=langages&s=c&p=appels-systeme-et-descripteurs), o fluxo de erro padrão; o **código de saída** (0 se tudo vai bem, 1 em caso de falha) é o descrito em [exit e os códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour).

A **versão 1** escreve a mesma mensagem qualquer que seja a causa, converte com `atoi` (que devolve 0 para qualquer texto e para sem reclamar na primeira letra) e esquece de fechar o arquivo em dois caminhos:

```c
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

/* Versão 1: uma mensagem comum a todas as causas, um arquivo nunca fechado em um caminho. */
static int	load_v1(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f || !fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	*port = atoi(line + 5);                         /* 0 para qualquer coisa, 80 para «80x» */
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);                                /* fclose esquecido neste caminho */
	}
	fclose(f);
	return (0);
}
```

A **versão 2** é a «correção» de alguém que testou apenas o caso de um arquivo ausente: toda falha de abertura vira «file not found»:

```c
/* Versão 2: «corrigida» supondo a causa: toda falha de abertura vira «not found». */
static int	load_v2(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f)
	{
		fprintf(stderr, "error: %s: file not found\n", path);
		return (-1);
	}
	if (!fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		fclose(f);
		return (-1);
	}
	*port = atoi(line + 5);
	fclose(f);
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	return (0);
}
```

A **versão 3** dá uma mensagem por causa, com o arquivo, a linha e o valor recebido, verifica que o caminho é um arquivo comum com [`stat`](https://man7.org/linux/man-pages/man2/stat.2.html), converte com [`strtol` e suas verificações](/?c=langages&s=c&p=convertir-un-texte-en-nombre), e fecha o arquivo em **um único lugar**:

```c
static int	report(const char *path, int line_no, const char *fmt, ...)
{
	va_list	args;

	if (line_no)
		fprintf(stderr, "%s:%d: ", path, line_no);
	else
		fprintf(stderr, "%s: ", path);
	va_start(args, fmt);
	vfprintf(stderr, fmt, args);
	va_end(args);
	fputc('\n', stderr);
	return (-1);
}

/* Lê «port=NNNN»: uma mensagem por causa, com o arquivo, a linha e o valor recebido. */
static int	parse_port(const char *path, const char *line, int *port)
{
	char	*end;
	long	value;

	if (strncmp(line, "port=", 5) != 0)
		return (report(path, 1, "expected \"port=\", got \"%.20s\"", line));
	errno = 0;
	value = strtol(line + 5, &end, 10);
	if (end == line + 5 || *end)
		return (report(path, 1, "port \"%.20s\" is not a number", line + 5));
	if (errno == ERANGE || value < 1 || value > 65535)
		return (report(path, 1, "port %ld is out of range (1 to 65535)", value));
	*port = (int)value;
	return (0);
}

/* Versão 3: cada causa tem sua mensagem; o arquivo é fechado em um único lugar. */
static int	load_v3(const char *path, int *port)
{
	struct stat	st;
	FILE		*f;
	char		line[64];
	int			rc;

	if (stat(path, &st) != 0)
		return (report(path, 0, "%s", strerror(errno)));
	if (!S_ISREG(st.st_mode))
		return (report(path, 0, "not a regular file"));
	f = fopen(path, "r");
	if (!f)
		return (report(path, 0, "%s", strerror(errno)));
	if (!fgets(line, sizeof line, f))
		rc = report(path, 0, ferror(f) ? "%s" : "empty file", strerror(errno));
	else
	{
		line[strcspn(line, "\n")] = '\0';           /* a mensagem não deve conter quebra de linha */
		rc = parse_port(path, line, port);
	}
	fclose(f);
	return (rc);
}
```

```c
int	main(int argc, char **argv)
{
	int	failed = 0;

	if (argc < 3)
		return (fprintf(stderr, "usage: %s 1|2|3 file...\n", argv[0]), 2);
	for (int i = 2; i < argc; i++)
	{
		int	port = 0, rc;

		if (strcmp(argv[1], "1") == 0)
			rc = load_v1(argv[i], &port);
		else if (strcmp(argv[1], "2") == 0)
			rc = load_v2(argv[i], &port);
		else
			rc = load_v3(argv[i], &port);
		if (rc == 0)
			printf("port=%d\n", port);
		failed |= rc != 0;
	}
	return (failed);
}
```

Os arquivos de teste, um por causa (o arquivo `absent.cfg` não é criado: ele não existe), e a compilação:

```bash
printf 'port=8080\n' > ok.cfg                 # válido
: > empty.cfg                                 # vazio
printf 'listen=80\n' > noprefix.cfg           # sem «port=»
printf 'port=abc\n' > abc.cfg                 # não é um número
printf 'port=\n' > novalue.cfg                # valor ausente
printf 'port=99999\n' > big.cfg               # fora de 1 a 65535
printf 'port=80x\n' > trail.cfg               # número seguido de um caractere
mkdir dir.cfg                                 # um diretório
printf 'port=8080\n' > noperm.cfg; chmod 000 noperm.cfg   # arquivo sem permissão de leitura
gcc -Wall -Wextra -g -fsanitize=address,undefined cfg.c -o cfg
```

## O que recebe quem lê o erro

Mensagem exibida por cada versão (`./cfg 1 arquivo`, `./cfg 2 arquivo`, `./cfg 3 arquivo`), medida; o código de saída vale 1 a cada falha:

| Arquivo | Causa real | Versão 1 | Versão 2 | Versão 3 |
|---|---|---|---|---|
| `absent.cfg` | o arquivo não existe | `error: cannot load config` | `error: absent.cfg: file not found` | `absent.cfg: No such file or directory` |
| `noperm.cfg` | permissão de leitura negada | `error: cannot load config` | `error: noperm.cfg: file not found` (**errado**) | `noperm.cfg: Permission denied` |
| `dir.cfg` | é um diretório | `error: cannot load config` | `error: cannot load config` | `dir.cfg: not a regular file` |
| `empty.cfg` | arquivo vazio | `error: cannot load config` | `error: cannot load config` | `empty.cfg: empty file` |
| `noprefix.cfg` | sem `port=` | `error: cannot load config` | `error: cannot load config` | `noprefix.cfg:1: expected "port=", got "listen=80"` |
| `abc.cfg` | não é um número | `error: cannot load config` | `error: cannot load config` | `abc.cfg:1: port "abc" is not a number` |
| `novalue.cfg` | valor ausente | `error: cannot load config` | `error: cannot load config` | `novalue.cfg:1: port "" is not a number` |
| `big.cfg` | fora de 1 a 65535 | `error: cannot load config` | `error: cannot load config` | `big.cfg:1: port 99999 is out of range (1 to 65535)` |
| `trail.cfg` | `80x`: não é um número | **aceito: `port=80`**, código 0 | **aceito: `port=80`**, código 0 | `trail.cfg:1: port "80x" is not a number` |
| `ok.cfg` | válido | `port=8080` | `port=8080` | `port=8080` |

Três defeitos se leem nesta tabela.

- **Um único texto para oito causas** (versão 1): o usuário não sabe se deve criar o arquivo, mudar suas permissões, corrigir o valor ou colocá-lo em outra faixa.
- **Um valor aceito por engano**: `atoi("80x")` vale 80, então `80x` passa em silêncio pela porta 80 (a conversão estrita com `strtol`, que verifica onde a leitura terminou, o recusa); `atoi("abc")` vale 0, e esse 0 cai no teste de faixa em vez de ser recusado como «não é um número».
- **Uma causa suposta** (versão 2): `noperm.cfg` existe, mas a mensagem afirma «file not found». Essa mensagem é **pior que a vaga**: manda procurar um arquivo que está ali, em vez de olhar suas permissões. A versão 3 lê a causa real em `errno` com `strerror`.

## O caminho de erro que esquece de fechar

Na versão 1, dois caminhos de erro esquecem `fclose`: o do `fgets` que falha (arquivo vazio) e o da porta fora da faixa. Cada chamada que falha deixa aberto um **descritor de arquivo** (o número que o sistema dá a um arquivo aberto, veja [as chamadas de sistema e os descritores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)), e um processo só dispõe de um número limitado deles. Aqui, 60 leituras do arquivo `big.cfg` (recusado) e depois uma do arquivo válido `ok.cfg`, com no máximo 50 descritores (`ulimit -n 50`):

```bash
for v in 1 2 3; do
  echo "--- versão $v"
  ( ulimit -n 50; ASAN_OPTIONS=detect_leaks=0 ./cfg $v $(yes big.cfg | head -60) ok.cfg 2>&1 | sort | uniq -c | sort -rn )
done
```

```
--- versão 1
     61 error: cannot load config
--- versão 2
     60 error: cannot load config
      1 port=8080
--- versão 3
     60 big.cfg:1: port 99999 is out of range (1 to 65535)
      1 port=8080
```

Com a versão 1, as 61 leituras falham com **a mesma mensagem**, inclusive a do arquivo válido: os descritores estão esgotados, `fopen` falha, e o programa responde «cannot load config». Nada na mensagem permite relacionar essa falha a um vazamento. A versão 2 fecha o arquivo antes do teste de faixa e a versão 3 o fecha em um único lugar: o arquivo válido é lido.

Com um arquivo válido, mas sem nenhum descritor disponível (`ulimit -n 3`: só a entrada, a saída e o erro padrão estão abertos), a versão 3 dá **a causa real** onde a versão 1 mantém seu texto comum. O executável é ligado estaticamente (`-static`) porque o carregador de bibliotecas de um executável normal precisa ele próprio de um descritor:

```bash
gcc -static -Wall -Wextra -g cfg.c -o cfg_static
sh -c 'ulimit -n 3; exec ./cfg_static 1 ok.cfg'      # versão 1
sh -c 'ulimit -n 3; exec ./cfg_static 3 ok.cfg'      # versão 3
```

```
error: cannot load config
ok.cfg: Too many open files
```

> **Armadilha:** um vazamento de descritores não é um vazamento de memória: o LeakSanitizer não o vê (medido: nenhum relatório para a versão 1, a biblioteca C guarda o rastro dos arquivos abertos). Ele é descoberto baixando o limite de descritores (`ulimit -n`) durante um teste.

## Escrever uma mensagem por causa

| Regra | Por quê |
|---|---|
| Uma mensagem **por causa**, nunca o mesmo texto para duas causas | O leitor sabe o que corrigir sem reler o código |
| Nunca uma mensagem vazia, nem um `exit(1)` sem mensagem | Uma falha sem texto não pode ser diagnosticada |
| Nomear o **elemento defeituoso**: arquivo, linha, campo, **valor recebido** (`port "abc" is not a number`) | O leitor encontra o lugar a corrigir |
| Dar a **causa real** lida no sistema (`strerror(errno)`), nunca uma causa suposta | Uma mensagem falsa manda procurar no lugar errado |
| Nem quebra de linha nem caractere de controle na mensagem | Uma mensagem partida em duas linhas se lê mal e se filtra mal; aqui, a linha lida conservava seu `\n` antes de ser limpa |
| Com várias entradas, dizer **qual** é a culpada | `big.cfg:1:` em vez de «invalid port» |
| Fechar e liberar **em um único lugar**, em todos os caminhos | Um caminho de erro deixa de vazar quando passa pela mesma limpeza que o caminho normal (veja [Um contexto de trabalho para dividir uma função grande](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=contexte-de-travail-pour-decouper-une-fonction)) |
| Escrever em `stderr`, não em `stdout` | O resultado do programa continua aproveitável, os erros vão para outro lugar |

## Nunca anunciar «corrigido» sem um teste real

A versão 2 dá a impressão de uma correção: com `absent.cfg`, a mensagem mudou e está certa. No entanto, ela foi validada com **um único caso**, o único que seu autor imaginava, e erra com `noperm.cfg`. O que permite dizer que uma mensagem está corrigida:

| Etapa | Exemplo aqui |
|---|---|
| Produzir **cada** causa de verdade (não só a mais frequente) | Os nove arquivos de teste, entre eles um diretório e um arquivo sem permissão |
| Executar e **ler** a mensagem de cada caso | A tabela acima, célula por célula |
| Verificar que o caso válido continua passando | `ok.cfg` dá `port=8080` nas três versões |
| Empurrar até os limites do sistema | `ulimit -n 50` revelou o vazamento de descritores |
| Comparar com o comportamento anterior nas mesmas entradas | A tabela coloca as três versões lado a lado |

> **Armadilha:** deduzir a causa de uma falha só do lugar onde ela ocorre («`fopen` falhou, logo o arquivo não existe»). `fopen` falha também por uma permissão negada, um diretório ou arquivos abertos demais: é preciso ler `errno`.
>
> **Armadilha:** verificar uma correção com o caso que motivou a mudança e só com ele. É preciso repetir **todas** as causas, e o caso válido.
>
> **Boa prática:** para cada causa de falha, um arquivo ou entrada de teste que a produza, repetidos após cada modificação das mensagens.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma mensagem de erro deve dizer o que corrigir: uma mensagem por causa, que nomeie o arquivo, a linha e o valor recebido, com a causa real lida em `errno` (`strerror`). Um texto comum a todas as causas não pode ser diagnosticado; um texto que supõe a causa («file not found» para uma permissão negada) é pior. No exemplo, a versão 1 aceitava `80x` como a porta 80 e esgotava seus descritores em dois caminhos de erro, até recusar um arquivo válido com a mesma mensagem. |
| **Ferramentas utilizáveis** | `strerror(errno)`; `stat` e `S_ISREG` para recusar um diretório; `strtol` com verificação do fim da leitura, de `errno` e da faixa; uma função `report` que antepõe arquivo e linha; `ulimit -n` para verificar que nenhum descritor vaza; `ASAN_OPTIONS=exitcode=...` para distinguir a falha do ASan da do programa. |
| **Armadilhas a evitar** | A mesma mensagem para várias causas; uma mensagem vazia ou `exit(1)` sem texto; uma causa suposta; `atoi` (aceita `80x`, devolve 0 para `abc`); uma quebra de linha na mensagem; esquecer de fechar um arquivo em um caminho de erro; achar que uma correção está certa depois de um único teste. |
| **Boas práticas** | Uma mensagem por causa com arquivo, linha e valor recebido; a causa real lida no sistema; uma limpeza única para todos os caminhos; uma entrada de teste por causa, repetida após cada modificação; o caso válido e os limites do sistema (`ulimit -n`) testados antes de dizer «corrigido». |
