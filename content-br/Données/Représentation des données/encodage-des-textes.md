---
order: 3
---

# A codificação de textos (ASCII, Unicode, UTF-8)

Um computador não armazena letras, apenas números. Uma **codificação** é a convenção que associa cada caractere a um número, e então esse número a uma sequência de bytes. Quando dois programas não concordam sobre a convenção, obtêm-se os famosos `Ã©` no lugar dos `é`.

## ASCII: 128 caracteres, 7 bits

O **ASCII** (*American Standard Code for Information Interchange*), padronizado em 1963, associa um número de 0 a 127 aos caracteres do inglês. Ele, portanto, cabe em 7 bits, armazenados em um byte.

| Caractere | Código |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| espaço | 32 |

Duas propriedades dessa tabela são exploradas o tempo todo:

```c
// Passar de uma minúscula para uma maiúscula: 32 de diferença, ou seja, um único bit
char maiuscula = minuscula - 32;

// Converter um digito-caractere em seu valor numérico
int valor = caractere - '0';    // '7' - '0' = 55 - 48 = 7
```

É por essa razão que em C um `char` **é** um inteiro: `'A'` e `65` são o mesmo valor. Veja o capítulo [As variáveis e tipos de dados](/?c=langages-de-programmation&s=c&p=variables).

Os códigos de 0 a 31 não são caracteres imprimíveis, mas **caracteres de controle**, herança dos teletipos: `\n` (10, salto de linha), `\t` (9, tabulação), `\0` (0, marcador de fim de string em C).

## O problema: 128 caracteres não bastam

Nem `é`, nem `ñ`, nem `京`, nem `😀` entram no ASCII. Cada região então criou sua própria extensão no 8º bit (códigos 128–255): [`ISO-8859-1`](https://en.wikipedia.org/wiki/ISO/IEC_8859-1) (Latin-1) para a Europa Ocidental, `ISO-8859-5` para o cirílico, [`Windows-1252`](https://en.wikipedia.org/wiki/Windows-1252)...

Daí o problema estrutural: **o mesmo byte designava caracteres diferentes dependendo da tabela usada**, e nada no arquivo indicava qual. Um texto em português lido com uma tabela cirílica dava caracteres sem sentido.

## Unicode: separar o caractere de seu armazenamento

O Unicode resolve o problema distinguindo duas perguntas que estavam misturadas:

1. **Qual caractere?** Cada caractere recebe um número único e definitivo, chamado **ponto de código**, anotado `U+XXXX`. `é` é `U+00E9`, `京` é `U+4EAC`, `😀` é `U+1F600`. Há mais de 150.000 deles.
2. **Como armazená-lo em bytes?** É o papel de um **formato de transformação**: UTF-8, UTF-16 ou UTF-32.

O Unicode não é, portanto, uma codificação: é um catálogo. O UTF-8 é uma codificação desse catálogo.

## UTF-8: o comprimento variável

O UTF-8 codifica um ponto de código em **1 a 4 bytes**, dependendo de seu valor:

| Faixa de pontos de código | Bytes | Conteúdo |
|---|---|---|
| `U+0000` → `U+007F` | 1 | idêntico ao ASCII |
| `U+0080` → `U+07FF` | 2 | latim acentuado, grego, cirílico, árabe, hebraico |
| `U+0800` → `U+FFFF` | 3 | chinês, japonês, coreano |
| `U+10000` → `U+10FFFF` | 4 | emojis, escritas raras |

Sua qualidade decisiva é a **compatibilidade retroativa com o ASCII**: um arquivo ASCII já é um arquivo UTF-8 válido, sem conversão. Foi isso que permitiu sua adoção universal: ele representa hoje mais de 98% da web.

```text
"A"  -> 1 byte  : 41
"é"  -> 2 bytes : C3 A9
"京" -> 3 bytes : E4 BA AC
"😀" -> 4 bytes : F0 9F 98 80
```

A codificação é feita para ser **autodescritiva**: os bits de maior peso do primeiro byte anunciam o comprimento da sequência, e os bytes seguintes todos começam com `10`. Assim, é possível se ressincronizar no meio de um fluxo, e um byte de continuação nunca é confundido com um início de caractere.

## A consequência: um caractere ≠ um byte

Esse é a armadilha prática mais comum. Em UTF-8, o comprimento em bytes não corresponde mais ao número de caracteres:

```python
texto = "cafe"
len(texto)                  # 4 -> Python conta os caracteres
len(texto.encode("utf-8"))  # 5 -> o "e" com acento ocupa 2 bytes
```

Em C, onde uma string é um array de bytes, `strlen("cafe")` retorna **5** (com o acento). Dividir uma string dessas exatamente no byte pode cortar um caractere no meio e produzir dados inválidos.

Pior, "um caractere" é em si ambíguo: certos sinais visíveis são compostos de **vários** pontos de código (uma letra mais um acento combinante, um emoji de bandeira, um emoji com modificador de tom de pele). A unidade que um humano percebe se chama **grafema**, e contar grafemas exige uma biblioteca dedicada.

## O mojibake: diagnosticar caracteres corrompidos

Quando um texto codificado em UTF-8 é lido como Latin-1, cada byte é interpretado separadamente:

```text
"é" em UTF-8    = bytes C3 A9
lidos em Latin-1 : C3 -> "Ã"   A9 -> "©"
resultado         : "Ã©"
```

Esse sintoma é muito reconhecível e permite rastrear a causa:

| Sintoma | Diagnóstico provável |
|---|---|
| `Ã©`, `Ã¨`, `Ã ` | UTF-8 lido como Latin-1 |
| `?` ou `�` | Caractere ausente na codificação de destino, substituído |
| Acentos corretos exceto em uma planilha | Separador ou BOM ausente na abertura |

A correção nunca é "substituir os caracteres", mas **declarar a codificação correta** no ponto de leitura. Cada camada precisa ser consistente: a tag [HTML](/?c=langages-de-balisage&s=html&p=html) (`<meta charset="utf-8">`, veja o capítulo [Estrutura de um documento](/?c=langages-de-balisage&s=html&p=structure-dun-document)), [o cabeçalho HTTP](/?c=infrastructure&p=api-et-http), a codificação dos arquivos-fonte, e o conjunto de caracteres do banco de dados (`utf8mb4` para o [MySQL](https://dev.mysql.com/doc/): `utf8` sozinho é um falso amigo limitado a 3 bytes, que rejeita emojis).

## O BOM

O **BOM** (*Byte Order Mark*, `U+FEFF`) é uma marca opcional no início de um arquivo indicando a codificação. Ele é indispensável em UTF-16 para indicar a ordem dos bytes, mas **inútil em UTF-8**, onde a ordem é fixa.

Ele continua, no entanto, comum no Windows, onde algumas ferramentas (incluindo o [Excel](https://www.microsoft.com/microsoft-365/excel)) o usam para reconhecer um arquivo UTF-8. Daí um dilema clássico: um CSV destinado ao Excel precisa do BOM para exibir corretamente os acentos, enquanto um arquivo-fonte [PHP](/?c=langages-de-programmation&s=php&p=php) com BOM provoca um envio prematuro de conteúdo e quebra os cabeçalhos HTTP.

## UTF-16 e UTF-32

- **UTF-16**: 2 ou 4 bytes por caractere. Usado internamente por Java, C#, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) e Windows. Os caracteres fora do plano básico (os emojis) ocupam duas unidades de 16 bits, chamadas *surrogate pair*: daí o fato de que em JavaScript, `"😀".length` retorna **2**.
- **UTF-32**: 4 bytes por caractere, tamanho fixo. Simples de indexar, mas gasta muito espaço; raramente usado para armazenamento.

## Um BOM em um arquivo lido por um programa: duas falhas silenciosas

Um programa em C que [lê um arquivo de texto linha a linha](/?c=langages&s=c&p=lecture-de-fichiers) (com `fgets`) supõe duas coisas: que um caractere cabe em um byte, e que o texto começa por seu primeiro caractere visível. Um [BOM](#o-bom) desmente uma ou outra, **sem produzir nenhum erro**. Cada codificação tem o seu, escrito com seus próprios bytes:

| Codificação | Bytes do BOM | Observação |
|---|---|---|
| UTF-8 | `EF BB BF` | Opcional; 3 bytes no início, depois o texto |
| UTF-16 little-endian | `FF FE` | O byte menos significativo de cada unidade primeiro (veja [a organização na memória](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)) |
| UTF-16 big-endian | `FE FF` | O byte mais significativo primeiro |
| UTF-32 little-endian | `FF FE 00 00` | Começa como o UTF-16 little-endian |
| UTF-32 big-endian | `00 00 FE FF` | |

Seis arquivos com as mesmas duas linhas (`title Meu texto` e `size 12`) nas diferentes codificações, com o comando [`file`](https://man7.org/linux/man-pages/man1/file.1.html) para identificá-los e [`iconv`](https://man7.org/linux/man-pages/man1/iconv.1.html) para converter de uma codificação para outra:

```bash
printf 'title Meu texto\nsize 12\n' > utf8.txt                          # UTF-8 sem BOM
printf '\xef\xbb\xbftitle Meu texto\nsize 12\n' > utf8bom.txt           # UTF-8 com BOM
iconv -f UTF-8 -t UTF-16LE utf8.txt > corpo16.bin                         # UTF-16 little-endian, sem BOM
printf '\xff\xfe' | cat - corpo16.bin > utf16.txt                         # acrescenta-se na frente o BOM FF FE
iconv -f UTF-8 -t UTF-16BE utf8.txt > corpo16be.bin
printf '\xfe\xff' | cat - corpo16be.bin > utf16be.txt
iconv -f UTF-8 -t UTF-32LE utf8.txt > corpo32le.bin
printf '\xff\xfe\x00\x00' | cat - corpo32le.bin > utf32le.txt
iconv -f UTF-8 -t UTF-32BE utf8.txt > corpo32be.bin
printf '\x00\x00\xfe\xff' | cat - corpo32be.bin > utf32be.txt
iconv -f UTF-16 -t UTF-8 utf16.txt > utf16_convertido.txt                   # de volta a UTF-8: o BOM desaparece
file utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_convertido.txt
```

```
utf8.txt:             ASCII text
utf8bom.txt:          Unicode text, UTF-8 (with BOM) text
utf16.txt:            Unicode text, UTF-16, little-endian text
utf16be.txt:          Unicode text, UTF-16, big-endian text
utf32le.txt:          Unicode text, UTF-32, little-endian
utf32be.txt:          Unicode text, UTF-32, big-endian
utf16_convertido.txt: ASCII text
```

Os bytes de `utf8bom.txt` (três bytes a mais) e de `utf16.txt` (cada letra seguida de um byte `00`), com [`xxd`](https://manpages.debian.org/xxd), que mostra um arquivo em hexadecimal:

```bash
xxd utf8bom.txt | head -1
xxd utf16.txt | head -2
```

```
00000000: efbb bf74 6974 6c65 204d 6575 2074 6578  ...title Meu tex
00000000: fffe 7400 6900 7400 6c00 6500 2000 4d00  ..t.i.t.l.e. .M.
00000010: 6500 7500 2000 7400 6500 7800 7400 6f00  e.u. .t.e.x.t.o.
```

### Um leitor ingênuo e um leitor que olha o início do arquivo

O programa lê **diretivas** (uma linha `palavra valor`: aqui `title` seguido de um texto, `size` seguido de um número). O leitor ingênuo compara cada linha com a palavra esperada e **ignora sem barulho** toda linha desconhecida; o leitor seguro lê primeiro os quatro primeiros bytes (`skip_bom`), pula um BOM UTF-8, recusa expressamente um UTF-16 ou um UTF-32, e sinaliza as linhas desconhecidas.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Lê um arquivo de diretivas «title texto» e «size número», sem se preocupar com o BOM. */
static void	parse_naive(const char *path)
{
	FILE	*f = fopen(path, "r");
	char	line[128], title[64] = "(ausente)";
	int		size = -1, ignored = 0;

	if (!f)
		return ;
	while (fgets(line, sizeof line, f))
	{
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			ignored++;                              /* diretiva desconhecida: ignorada sem barulho */
	}
	fclose(f);
	printf("ingênuo %-12s : título=%s, tamanho=%d, linhas ignoradas=%d\n", path, title, size, ignored);
}

/* Lê os 4 primeiros bytes: pula o BOM UTF-8, recusa UTF-16 e UTF-32. Devolve 0 ou -1. */
static int	skip_bom(FILE *f, const char *path)
{
	unsigned char	b[4] = {0};
	size_t			n = fread(b, 1, 4, f);

	if (n >= 4 && b[0] == 0xFF && b[1] == 0xFE && b[2] == 0 && b[3] == 0)
		return (fprintf(stderr, "%s : UTF-32 (BOM FF FE 00 00) não suportado\n", path), -1);
	if (n >= 4 && b[0] == 0 && b[1] == 0 && b[2] == 0xFE && b[3] == 0xFF)
		return (fprintf(stderr, "%s : UTF-32 (BOM 00 00 FE FF) não suportado\n", path), -1);
	if (n >= 2 && b[0] == 0xFF && b[1] == 0xFE)
		return (fprintf(stderr, "%s : UTF-16 (BOM FF FE) não suportado\n", path), -1);
	if (n >= 2 && b[0] == 0xFE && b[1] == 0xFF)
		return (fprintf(stderr, "%s : UTF-16 (BOM FE FF) não suportado\n", path), -1);
	if (n >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF)
		return (fseek(f, 3, SEEK_SET), 0);          /* BOM UTF-8: retoma-se logo depois */
	return (fseek(f, 0, SEEK_SET), 0);              /* sem BOM: retoma-se no início */
}

/* Mesma leitura, mas o BOM é tratado e uma diretiva desconhecida é sinalizada. */
static void	parse_safe(const char *path)
{
	FILE	*f = fopen(path, "rb");
	char	line[128], title[64] = "(ausente)";
	int		size = -1, line_no = 0, unknown = 0;

	if (!f || skip_bom(f, path) != 0)
		return ((void)(f && fclose(f)));
	while (fgets(line, sizeof line, f))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			unknown += fprintf(stderr, "%s:%d : diretiva desconhecida\n", path, line_no) > 0;
	}
	fclose(f);
	printf("seguro  %-12s : título=%s, tamanho=%d, diretivas desconhecidas=%d\n", path, title, size, unknown);
}

int	main(int argc, char **argv)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* mensagens e resultados em ordem */
	for (int i = 1; i < argc; i++)
		parse_naive(argv[i]);
	for (int i = 1; i < argc; i++)
		parse_safe(argv[i]);
	return (0);
}
```

```bash
gcc -Wall -Wextra -g -fsanitize=address,undefined directives.c -o directives
./directives utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_convertido.txt
```

```
ingênuo utf8.txt     : título=Meu texto, tamanho=12, linhas ignoradas=0
ingênuo utf8bom.txt  : título=(ausente), tamanho=12, linhas ignoradas=1
ingênuo utf16.txt    : título=(ausente), tamanho=-1, linhas ignoradas=3
ingênuo utf16be.txt  : título=(ausente), tamanho=-1, linhas ignoradas=2
ingênuo utf32le.txt  : título=(ausente), tamanho=-1, linhas ignoradas=3
ingênuo utf32be.txt  : título=(ausente), tamanho=-1, linhas ignoradas=2
ingênuo utf16_convertido.txt : título=Meu texto, tamanho=12, linhas ignoradas=0
seguro  utf8.txt     : título=Meu texto, tamanho=12, diretivas desconhecidas=0
seguro  utf8bom.txt  : título=Meu texto, tamanho=12, diretivas desconhecidas=0
utf16.txt : UTF-16 (BOM FF FE) não suportado
utf16be.txt : UTF-16 (BOM FE FF) não suportado
utf32le.txt : UTF-32 (BOM FF FE 00 00) não suportado
utf32be.txt : UTF-32 (BOM 00 00 FE FF) não suportado
seguro  utf16_convertido.txt : título=Meu texto, tamanho=12, diretivas desconhecidas=0
```

**Primeiro caso: o BOM UTF-8 colado à primeira diretiva.** O arquivo `utf8bom.txt` se parece com `utf8.txt` na tela, mas sua primeira linha começa pelos bytes `EF BB BF`: ela vale `\xEF\xBB\xBFtitle Meu texto`, que não é `title `; o leitor ingênuo a coloca entre as linhas desconhecidas, **a primeira diretiva desaparece** e nada o diz (`título=(ausente)`, uma linha ignorada). O resto do arquivo é lido normalmente, o que torna difícil relacionar o defeito à sua causa.

**Segundo caso: o UTF-16 e os bytes NUL.** Uma string em C termina com um byte de valor 0, o **NUL** (`'\0'`); `strlen` e a maioria das funções de texto param no primeiro. Em UTF-16 (e em UTF-32), uma letra ASCII é seguida de um ou três bytes NUL: `t` se escreve `74 00`. Medido na primeira linha de `utf16.txt`:

```c
#include <stdio.h>
#include <string.h>

int	main(void)
{
	FILE	*f = fopen("utf16.txt", "rb");
	char	line[128];
	long	start = ftell(f);                       /* posição antes da leitura */

	fgets(line, sizeof line, f);                    /* lê até o primeiro byte 0x0A */
	printf("bytes lidos: %ld, strlen: %zu\n", ftell(f) - start, strlen(line));
	printf("primeiros bytes: %02x %02x %02x %02x\n", (unsigned char)line[0],
		(unsigned char)line[1], (unsigned char)line[2], (unsigned char)line[3]);
	fclose(f);
	return (0);
}
```

```
bytes lidos: 33, strlen: 3
primeiros bytes: ff fe 74 00
```

`fgets` leu 33 bytes (até o primeiro byte `0A`, uma quebra de linha: em UTF-16 ela se escreve `0A 00`, então seu `00` abre a linha seguinte), mas `strlen` vê apenas 3: `FF`, `FE`, `74`, e depois o NUL interrompe tudo. Cada linha é vista como um único caractere precedido do BOM: **nenhuma diretiva corresponde**, o leitor ingênuo não preenche nada (`título=(ausente), tamanho=-1`, 3 linhas ignoradas) e não sinaliza nada.

O leitor seguro não tenta adivinhar: ele lê o BOM e **recusa expressamente** a codificação (`utf16.txt : UTF-16 (BOM FF FE) não suportado`), indicando o byte que a denunciou. A conversão é feita em outro lugar, com `iconv -f UTF-16 -t UTF-8`: o arquivo convertido é lido normalmente (`utf16_convertido.txt`).

| Arquivo | Leitor ingênuo | Leitor seguro |
|---|---|---|
| UTF-8 sem BOM | correto | correto |
| UTF-8 com BOM | **título perdido**, sem erro | correto (BOM pulado) |
| UTF-16 (LE ou BE) | **tudo ignorado**, sem erro | recusa expressa |
| UTF-32 (LE ou BE) | **tudo ignorado**, sem erro | recusa expressa |
| UTF-16 convertido em UTF-8 | correto | correto |

> **Armadilha:** um editor que salva «em UTF-8» às vezes acrescenta um BOM, que `cat` ou um simples `diff` não mostram. Um arquivo que parece idêntico na tela pode começar por três bytes invisíveis. O comando `file` (ou `xxd | head -1`) o revela.
>
> **Armadilha:** testar o BOM UTF-32 little-endian (`FF FE 00 00`) **depois** do de UTF-16 (`FF FE`): ambos começam pelos mesmos bytes, o mais curto sempre ganharia. Em `skip_bom`, o teste de quatro bytes vem primeiro.
>
> **Boa prática:** ler os primeiros bytes antes de analisar um arquivo de texto vindo de fora, pular um BOM UTF-8, recusar expressamente as outras codificações (com o BOM encontrado na mensagem), e sinalizar uma diretiva desconhecida em vez de ignorá-la em silêncio.

## Remover os acentos de um texto: a normalização Unicode (NFKD)

Comparar ou pesquisar texto ignorando os acentos (agrupar "café" e "cafe" como uma mesma entrada, por exemplo) exige separar cada letra acentuada de seu acento. O módulo padrão `unicodedata` fornece essa decomposição sem reinventar uma tabela de correspondência:

```python
import unicodedata

def remover_acentos(texto):
    decomposto = unicodedata.normalize("NFKD", texto)   # "é" -> "e" + acento agudo combinante
    return "".join(c for c in decomposto if not unicodedata.combining(c))

remover_acentos("café")   # "cafe"
```

`unicodedata.normalize("NFKD", ...)` decompõe cada caractere acentuado em sua letra base seguida de um **caractere combinante** separado (o acento em si, um ponto de código à parte); `unicodedata.combining(c)` retorna verdadeiro para esses caracteres combinantes, bastando então filtrá-los.

NFKD é uma das 4 formas de normalização Unicode padrão:

| Forma | Efeito |
|---|---|
| NFC | Recompõe: forma mais curta, um ponto de código por caractere visível quando possível |
| NFD | Decompõe: letra base + acentos combinantes separados |
| NFKC | Como NFC, unificando também as variantes de apresentação (ex. ligadura `ﬁ` → `fi`) |
| NFKD | Como NFD, com a mesma unificação que NFKC |

> **Cuidado:** dois textos visualmente idênticos podem estar compostos de forma diferente em memória (`é` em um único ponto de código `U+00E9`, ou em dois, `U+0065` + `U+0301`) e assim falhar uma comparação `==` mesmo exibindo-se do mesmo jeito. Normalizar os dois textos na mesma forma antes de compará-los evita essa armadilha.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Uma codificação associa cada caractere a um número (Unicode: o catálogo) e então a bytes (UTF-8: o formato). O UTF-8 é compatível com ASCII e codifica um caractere em 1 a 4 bytes: um caractere, portanto, não é necessariamente um byte. A normalização Unicode (NFC/NFD/NFKC/NFKD) recompõe ou decompõe um caractere acentuado, especialmente para comparar ou pesquisar texto ignorando os acentos. |
| **Ferramentas úteis** | `<meta charset="utf-8">`, `utf8mb4` para MySQL, uma biblioteca dedicada para contar grafemas, `unicodedata.normalize()`/`unicodedata.combining()` para normalizar um texto ou remover seus acentos. |
| **Armadilhas a evitar** | Ler um arquivo UTF-8 com a codificação errada declarada (mojibake, `Ã©`); dividir uma string exatamente no byte sem considerar caracteres multibyte; comparar dois textos visualmente idênticos mas compostos de forma diferente em memória sem normalizá-los antes; analisar um arquivo que começa por um BOM sem tratá-lo (diretiva perdida em UTF-8, todo o texto ignorado em UTF-16). |
| **Boas práticas** | Declarar a codificação correta em cada camada (arquivo, HTTP, banco de dados) em vez de "reparar" caracteres já corrompidos. Normalizar dois textos na mesma forma Unicode antes de compará-los ou pesquisá-los. Ler os primeiros bytes de um arquivo vindo de fora para detectar um BOM, e sinalizar uma codificação não suportada em vez de ignorá-la. |
