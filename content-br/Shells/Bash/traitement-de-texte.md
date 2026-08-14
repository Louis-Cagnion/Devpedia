---
order: 10
---

# Processamento de texto (grep, sed, awk...)

Boa parte do poder do [terminal Unix](/?c=shells&s=bash&p=scripts-et-shebang) vem de um punhado de ferramentas especializadas em processamento de texto, projetadas para serem combinadas entre si via [pipes](/?c=shells&s=bash&p=redirections-et-pipes). Este capítulo apresenta as mais usadas no dia a dia.

## `grep`: buscar texto

```bash
grep "erro" arquivo.log              # exibe as linhas contendo "erro"
grep -i "erro" arquivo.log           # insensivel a maiusculas/minusculas (-i)
grep -v "erro" arquivo.log           # inverte: exibe as linhas que NAO contem "erro"
grep -r "TODO" .                     # busca recursiva em todos os arquivos de um diretorio
grep -n "erro" arquivo.log           # exibe tambem o numero da linha
grep -c "erro" arquivo.log           # conta o numero de linhas correspondentes, sem exibi-las
grep -E "erro|warning" arquivo.log   # -E ativa as regex estendidas (cf. capitulo sobre regex)
grep -l "TODO" *.md                  # exibe apenas os NOMES dos arquivos que contem o padrao
grep -q "TODO" *.md                  # nao exibe nada: serve apenas para testar a presenca (veja abaixo)
```

Como muitas ferramentas Unix, essas flags são iniciais de palavras em inglês em vez de letras arbitrárias: `-i` = *ignore case*, `-v` = *invert*, `-r` = *recursive*, `-n` = *line number*, `-c` = *count*, `-E` = *extended (regex)*, `-l` = *files with matches (list)*, `-q` = *quiet*. Uma vez conhecidas essas palavras, lembrar a flag se torna natural: esse princípio se repete na maioria dos comandos deste capítulo e do seguinte.

As flags se combinam, às vezes com interações a conhecer: `grep -rln "padrao" *.md` acumula recursivo + lista de arquivos + número de linha, mas `-l` **prevalece sobre `-n`** (não é possível exibir um número de linha quando só se exibem nomes de arquivo). A flag ignorada não provoca nenhum aviso.

### Buscar vários padrões: `\|` ou `-E`

`grep` usa por padrão as regex **básicas** (BRE), nas quais a alternância precisa ser escapada. Com `-E` (regex estendidas), ela se escreve naturalmente:

```bash
grep "erro\|warning" arquivo.log     # BRE: a alternancia se escreve \|
grep -E "erro|warning" arquivo.log   # ERE: mais legivel, a preferir
```

Um `|` não escapado sem `-E` é buscado **literalmente**: `grep "a|b"` busca a string `a|b`, e portanto não encontra nada na maioria das vezes, sem erro nem aviso. É uma armadilha clássica. Veja o capítulo [A regex](/?c=domain-specific-languages-dsl&p=regex) para a diferença BRE/ERE.

### O código de retorno de `grep`

`grep` não serve só para exibir: seu **código de saída** responde à pergunta "você encontrou algo?".

| Código | Significado |
|---|---|
| `0` | pelo menos uma correspondência encontrada |
| `1` | nenhuma correspondência (isso **não** é um erro) |
| `2` | um erro de verdade (arquivo ilegível, padrão inválido) |

É isso que permite encadeá-lo com `&&` ou `||` (veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
grep -rl "padrao" *.md || echo "ausente"  # mensagem de reserva se nada e encontrado
grep -q "padrao" f.txt && processar f.txt # so processa o arquivo se ele contem o padrao
```

Com `-q`, `grep` para na primeira correspondência e não exibe nada: é a forma a privilegiar quando só o resultado do teste importa, principalmente em arquivos grandes.

> Esse código de retorno `1` explica um comportamento confuso sob `set -e`: um `grep` que não encontra nada faz um script inteiro falhar. A solução costumeira é `grep padrao arquivo || true`.

> **`grep` vs `pgrep`**: apesar do nome parecido, são dois comandos independentes que não buscam na mesma coisa. `grep` busca um padrão em **texto** (arquivo, saída de um comando...). `pgrep` (*process grep*, veja [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus)) busca um padrão na **lista dos processos em execução** e retorna PIDs, não linhas de texto: `ps aux | grep padrao` e `pgrep padrao` respondem aliás quase à mesma pergunta, por dois caminhos diferentes.

## `sed`: buscar e substituir

`sed` (*stream editor*) lê o texto **uma linha por vez** e aplica a cada uma um ou vários comandos de edição, sem nunca carregar o arquivo inteiro em memória. Por padrão, ele não modifica nada em disco: exibe o resultado na saída padrão, linha por linha, à medida que processa.

Um comando `sed` se decompõe em duas partes: um **endereço** opcional (quais linhas afetar) e um **comando** a aplicar a elas.

```bash
sed 's/antigo/novo/' arquivo.txt     # sem endereco -> o comando se aplica a TODAS as linhas
sed '3s/antigo/novo/' arquivo.txt    # endereco "3" -> apenas a linha 3
sed '2,4s/antigo/novo/' arquivo.txt  # endereco "2,4" -> apenas as linhas 2 a 4
```

O comando mais usado é `s/padrao/substituicao/` (o "s" de *substitute*): ele busca `padrao` (uma [regex](/?c=domain-specific-languages-dsl&p=regex)) e o substitui por `substituicao`. Por padrão, `sed` só substitui a **primeira** ocorrência encontrada em cada linha, daí a flag `g` para tratar também as seguintes:

```bash
sed 's/antigo/novo/' arquivo.txt      # substitui a 1a ocorrencia por linha, exibe o resultado
sed 's/antigo/novo/g' arquivo.txt     # 'g' (global): substitui TODAS as ocorrencias de cada linha
sed -i 's/antigo/novo/g' arquivo.txt  # -i: modifica o arquivo diretamente (in place), sem exibir nada
```

O outro comando comum é `p` (*print*), que exibe explicitamente uma linha; combinado com `-n` (que desativa a exibição automática de cada linha processada), ele permite exibir apenas certas linhas em vez do arquivo inteiro:

```bash
sed -n '2,4p' arquivo.txt   # -n: nao exibe NADA por padrao ; '2,4p': exibe explicitamente as linhas 2 a 4
```

> **Nota:** sem `-n`, `sed '2,4p'` exibiria cada linha do arquivo uma vez (comportamento padrão), e as linhas 2 a 4 uma segunda vez (por causa do `p`): `-n` e `p` funcionam quase sempre em par.

## `awk`: processar texto em colunas

`awk` divide automaticamente cada linha em campos (`$1`, `$2`...), separados por padrão por espaços/tabulações:

```bash
echo "Joao Silva 25" | awk '{ print $1 }'      # Joao -> primeiro campo
echo "Joao Silva 25" | awk '{ print $3, $1 }'  # 25 Joao

awk -F ',' '{ print $2 }' dados.csv    # -F ',' : muda o separador de campo para uma virgula
```

`$0` designa a linha inteira, `$NF` o **último** campo da linha (`NF` = *Number of Fields*):

```bash
awk '{ print $NF }' arquivo.txt   # exibe a ultima palavra de cada linha
```

## `cut`: extrair colunas de forma simples

Mais limitado que o `awk`, mas suficiente para casos simples:

```bash
cut -d ',' -f 2 dados.csv    # -d: separador, -f: numero do campo a extrair
cut -c 1-5 arquivo.txt       # extrai os caracteres 1 a 5 de cada linha
```

## `sort` e `uniq`: ordenar e deduplicar

```bash
sort arquivo.txt            # ordenacao alfabetica
sort -n numeros.txt         # ordenacao numerica (indispensavel para numeros, senao ordena como texto)
sort -r arquivo.txt         # ordenacao decrescente
sort arquivo.txt | uniq     # remove as linhas duplicadas CONSECUTIVAS apenas
sort arquivo.txt | uniq -c  # conta as ocorrencias de cada linha
```

> **Nota:** `uniq` só detecta duplicatas **adjacentes**: por isso quase sempre se combina com `sort` antes, que agrupa as linhas idênticas juntas.

## `wc`: contar

```bash
wc -l arquivo.txt  # numero de linhas
wc -w arquivo.txt  # numero de palavras
wc -c arquivo.txt  # numero de bytes
```

## Combinar essas ferramentas

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) mantem as linhas de erro 404
# 2) extrai o endereco IP (1o campo)
# 3) ordena para agrupar os IPs identicos
# 4) conta as ocorrencias de cada IP
# 5) ordena por numero de ocorrencias decrescente -> os IPs mais frequentes primeiro
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `grep` busca, `sed` substitui, `awk` processa por colunas: projetados para se combinar via pipes em vez de serem usados isoladamente. |
| **Ferramentas utilizáveis** | `grep -i`/`-v`/`-r`/`-E`, `sed 's/.../.../'`, `awk '{ print $1 }'`, `cut`, `sort`/`uniq`, `wc`. |
| **Armadilhas a evitar** | Um `\|` não escapado sem `-E` em `grep` é buscado literalmente, sem erro nem aviso; `uniq` sem `sort` antes só detecta duplicatas adjacentes. |
| **Boas práticas** | Combinar `sort` antes de `uniq` para deduplicar corretamente; usar `grep -q` em vez de `grep` simples quando só o resultado do teste (encontrado/não encontrado) importa. |
