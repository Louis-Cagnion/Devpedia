---
order: 7
---

# Expansão e caracteres curinga (globbing)

Antes de executar um comando, o Bash substitui certos padrões nele contidos pelos seus valores reais — variáveis (`$nome`, ver capítulo dedicado), mas também padrões de arquivos (*globbing*) e expansões de chaves. Compreender esta etapa (invisível, mas sistemática) explica por que razão certos comandos se comportam de forma diferente consoante as aspas utilizadas.

## Globbing: `*`, `?`, `[]`

```bash
ls *.txt        # todos os arquivos com a extensão .txt
ls arquivo?.txt  # arquivo1.txt, arquivoA.txt... («?» = exatamente 1 carácter, qualquer um)
ls arquivo[123].txt  # apenas arquivo1.txt, arquivo2.txt ou arquivo3.txt
ls arquivo[a-z].txt  # uma única letra minúscula nessa posição
```

| Motivo | Significado |
|---|---|
| `*` | Qualquer sequência de caracteres (incluindo a sequência vazia) |
| `?` | Exatamente um carácter, qualquer um |
| `[abc]` | Um único carácter entre `a`, `b` ou `c` |
| `[a-z]` | Um único carácter neste intervalo |
| `[^abc]` | Um único carácter que não é nem `a`, nem `b`, nem `c` |

> **Nota:** isto não é uma expressão regular (ver o capítulo dedicado às expressões regulares) — o globbing é mais simples e específico da interpretação dos nomes de arquivos pelo próprio shell, antes mesmo de o comando ser executado.

## Atenção: o que acontece se nenhum arquivo corresponder?

```bash
echo *.xyz
# Se não existir nenhum arquivo .xyz, o Bash exibe literalmente «*.xyz» (o padrão não é substituído)
```

Esta é uma fonte clássica de erros: um script que pressupõe que `*.xyz` remete sempre para uma lista de arquivos reais pode receber o texto simples `*.xyz` como único «nome de arquivo», caso a pasta não contenha nada do género.

## A expansão de chaves (*brace expansion*)

Gera várias cadeias a partir de um único padrão, **antes** **de** qualquer pesquisa de arquivos reais no disco:

```bash
echo arquivo{1,2,3}.txt
# arquivo1.txt arquivo2.txt arquivo3.txt

mkdir -p projet/{src,tests,docs}
# cria as três pastas com um único comando

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Nota:** ao contrário do globbing, a expansão das chaves não depende de nenhum arquivo existente — o comando «`arquivo{1,2,3}.txt`» gera sempre estas três cadeias, independentemente de os arquivos correspondentes existirem ou não.

## A expansão do til (`~`)

```bash
cd ~          # equivalente a cd $HOME
cd ~/projets   # equivalente a cd $HOME/projetos
```

## Impedir a expansão: as aspas

```bash
echo *.txt      # substituída pela lista real de arquivos .txt
echo "*.txt"     # exibe literalmente *.txt -> as aspas duplas desativam o globbing
echo '*.txt'     # mesmo resultado, aspas simples ainda mais restritivas (desativam também $variável)
```

Consulte também o capítulo sobre variáveis para conhecer a distinção entre aspas simples e duplas no que diz respeito à interpretação de `$variable`.
