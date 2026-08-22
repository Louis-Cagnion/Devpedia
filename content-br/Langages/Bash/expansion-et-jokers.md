---
order: 8
---

# Expansão e coringas (globbing)

Antes de executar um comando, o Bash substitui certos padrões que ele contém por seu valor real: [variáveis](/?c=shells&s=bash&p=variables) (`$nome`), mas também padrões de arquivo (*globbing*) e expansões de chaves. Entender essa etapa (invisível mas sistemática) explica por que alguns comandos se comportam de forma diferente conforme as aspas usadas.

## O globbing: `*`, `?`, `[]`

```bash
ls *.txt             # todos os arquivos que terminam em .txt
ls arquivo?.txt      # arquivo1.txt, arquivoA.txt... ('?' = exatamente 1 caractere, qualquer um)
ls arquivo[123].txt  # arquivo1.txt, arquivo2.txt ou arquivo3.txt apenas
ls arquivo[a-z].txt  # uma unica letra minuscula nessa posicao
```

| Padrão | Significa |
|---|---|
| `*` | Qualquer sequência de caracteres (inclusive vazia) |
| `?` | Exatamente um caractere, qualquer um |
| `[abc]` | Um único caractere entre `a`, `b` ou `c` |
| `[a-z]` | Um único caractere nessa faixa |
| `[^abc]` | Um único caractere que não é `a`, `b`, nem `c` |

> **Nota:** isso **não** é uma [regex](/?c=domain-specific-languages-dsl&p=regex): o globbing é mais simples, próprio da interpretação dos nomes de arquivo pelo próprio shell, antes mesmo de o comando ser lançado.

## Atenção: o que acontece se nenhum arquivo corresponder?

```bash
echo *.xyz
# se nenhum arquivo .xyz existe, o Bash exibe literalmente "*.xyz" (o padrao nao e substituido)
```

Isso é uma fonte clássica de bugs: um script que supõe que `*.xyz` sempre designa uma lista de arquivos reais pode receber o texto bruto `*.xyz` como único "nome de arquivo" se o diretório não contiver nada assim.

## A expansão de chaves (*brace expansion*)

Gera várias strings a partir de um único padrão, **antes** de qualquer busca de arquivos reais no disco:

```bash
echo arquivo{1,2,3}.txt
# arquivo1.txt arquivo2.txt arquivo3.txt

mkdir -p projeto/{src,tests,docs}
# cria os tres diretorios em um unico comando

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Nota:** ao contrário do globbing, a expansão de chaves não depende de nenhum arquivo existente: `arquivo{1,2,3}.txt` sempre gera essas três strings, existam ou não os arquivos correspondentes.

## A expansão do til (`~`)

```bash
cd ~          # equivalente a cd $HOME
cd ~/projetos # equivalente a cd $HOME/projetos
```

## Impedir a expansão: as aspas

```bash
echo *.txt    # substituido pela lista real dos arquivos .txt
echo "*.txt"  # exibe literalmente *.txt -> as aspas duplas desativam o globbing
echo '*.txt'  # mesmo resultado, aspas simples ainda mais estritas (tambem desativam $variavel)
```

Veja também [As variáveis](/?c=shells&s=bash&p=variables) para a distinção aspas simples/duplas em relação à interpretação de `$variavel`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Antes de executar um comando, o Bash substitui variáveis, padrões de arquivo (globbing) e expansões de chaves: uma etapa invisível mas sistemática. O globbing depende dos arquivos realmente presentes; a expansão de chaves nunca depende disso. |
| **Ferramentas utilizáveis** | `*`/`?`/`[abc]` (globbing), `{1,2,3}`/`{1..5}` (chaves), `~` (til). |
| **Armadilhas a evitar** | Um padrão de globbing que não corresponde a nenhum arquivo é transmitido literalmente ao comando, sem erro nem aviso. |
| **Boas práticas** | Cercar com aspas duplas toda variável suscetível de conter um espaço ou um caractere especial, para desativar a divisão em palavras e o globbing indesejados. |
