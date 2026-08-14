---
order: 4
---

# As condições

O Bash não possui operadores de comparação integrados na linguagem, como acontece no PHP ou no C — os testes baseiam-se em **comandos** (`test`, `[`, `[[`), cujo código de saída (`$?`) determina se a condição é verdadeira (`0`) ou falsa (diferente de zero).

## `if` / `then` / `elif` / `else` / `fi`

```bash
idade=18

if [ $idade -ge 18 ]; then
    echo "Vous êtes majeur."
else
    echo "Vous êtes mineur."
fi
```

- `if` na verdade, avalia o **código de saída** do comando seguinte (neste caso, `[ $idade -ge 18 ]`) — `[` é um comando real (frequentemente um link para `/usr/bin/test`), não um símbolo da linguagem.
- `fi` (`if` ao contrário) encerra o bloco, tal como «`endif`» faria noutras linguagens.

## `[ ]` vs `[[ ]]`

```bash
[[ $idade -ge 18 && $idade -lt 65 ]]  # [[ ]] : sintaxe alargada do Bash, com && e || diretamente utilizáveis
[ $idade -ge 18 ] && [ $idade -lt 65 ]  # [ ]: POSIX, requer a combinação de dois testes separados
```

`[[ ]]` (específica do Bash, não portável para um `sh` estritamente POSIX) aceita `&&` / `||` diretamente no seu interior, lida melhor com variáveis não definidas e permite a filtragem por padrão (`[[ $nome == J* ]]`).

## Comparar números

```bash
if [ $idade -eq 18 ]; then echo "Exactement 18"; fi
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Diferente |
| `-lt` | Inferior |
| `-le` | Menor ou igual a |
| `-gt` | Superior |
| `-ge` | Maior ou igual a |

> **Nota:** `==` e `!=` também funcionam em `[[ ]]`, mas apenas para comparar **cadeias** **de** **caracteres**. Utilizar `==` com números no `[ ]` clássico compara os valores como texto, e não numericamente (`"10" < "9"` compara textualmente, mas `10 -gt 9` compara numericamente).

## Comparar cadeias de caracteres

```bash
nome="Jean"

if [ "$nome" == "Jean" ]; then
    echo "Bonjour Jean"
fi

if [ -z "$nome" ]; then
    echo "nom est vide"
fi
```

| Operador | Significado |
|---|---|
| `==` / `=` | Igualdade de canais |
| `!=` | Diferença entre cadeias |
| `-z "$str"` | Verdadeiro se a cadeia estiver vazia |
| `-n "$str"` | Verdadeiro se a cadeia não estiver vazia |

## Testar arquivos

```bash
if [ -f "config.php" ]; then
    echo "Le fichier existe"
fi

if [ -d "/var/www" ]; then
    echo "Le dossier existe"
fi
```

| Operador | Verdadeiro se... |
|---|---|
| `-f caminho` | ...é um arquivo existente |
| `-d caminho` | ...é uma pasta já existente |
| `-e caminho` | ...existe algo neste caminho (arquivo ou pasta) |
| `-x caminho` | ...o arquivo é executável |
| `-r` / `-w` | ...o arquivo é legível / gravável |

## Combinar condições

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "Le fichier existe et est lisible"
fi
```

## O `case` (equivalente a `switch`)

```bash
jour="mer"

case $jour in
    lun|mar|mer|jeu|ven)
        echo "Jour de semaine"
        ;;
    sam|dim)
        echo "Week-end"
        ;;
    *)
        echo "Jour inconnu"
        ;;
esac
```

`|` Separa vários motivos para um mesmo bloco; `*)` captura todo o resto (equivalente ao «`default`» de um «`switch`»), e `;;` marca o fim de cada bloco.
