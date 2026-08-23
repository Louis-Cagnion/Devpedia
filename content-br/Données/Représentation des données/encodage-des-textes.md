---
order: 3
---

# A codificação de textos (ASCII, Unicode, UTF-8)

Um computador não armazena letras, apenas números. Uma **codificação** é a convenção que associa cada caractere a um número, e então esse número a uma sequência de bytes. Quando dois programas não concordam sobre a convenção, obtêm-se os famosos `Ã©` no lugar dos `é`.

## ASCII: 128 caracteres, 7 bits

O **ASCII** (*American Standard Code for Information Interchange*), padronizado em 1963, associa um número de 0 a 127 aos caracteres do inglês. Ele, portanto, cabe em 7 bits, armazenados em um byte.

| Caractere | [C](/?c=langages-de-programmation&s=c&p=c)ódigo |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| espaço | 32 |

Duas propriedades dessa tabela são exploradas o tempo todo:

```c
// Passar de uma minuscula para uma maiuscula: 32 de diferenca, ou seja, um unico bit
char maiuscula = minuscula - 32;

// Converter um digito-caractere em seu valor numerico
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

## Resumo

| Noção | A reter |
|---|---|
| ASCII | 128 caracteres, 7 bits, base de tudo o resto |
| Unicode | Um catálogo de pontos de código, **não** uma codificação |
| UTF-8 | 1 a 4 bytes, compatível com ASCII, padrão de fato da web |
| Caractere ≠ byte | `strlen` em C conta bytes, não letras |
| Mojibake `Ã©` | UTF-8 lido como Latin-1: corrigir a declaração, não o texto |
| BOM | Inútil em UTF-8, mas esperado pelo Excel, prejudicial no início de um fonte PHP |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Uma codificação associa cada caractere a um número (Unicode: o catálogo) e então a bytes (UTF-8: o formato). O UTF-8 é compatível com ASCII e codifica um caractere em 1 a 4 bytes: um caractere, portanto, não é necessariamente um byte. |
| **Ferramentas úteis** | `<meta charset="utf-8">`, `utf8mb4` para MySQL, uma biblioteca dedicada para contar grafemas. |
| **Armadilhas a evitar** | Ler um arquivo UTF-8 com a codificação errada declarada (mojibake, `Ã©`); dividir uma string exatamente no byte sem considerar caracteres multibyte. |
| **Boas práticas** | Declarar a codificação correta em cada camada (arquivo, HTTP, banco de dados) em vez de "reparar" caracteres já corrompidos. |
