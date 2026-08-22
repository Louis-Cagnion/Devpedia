---
order: 5
---

# As condições

O Bash não tem operadores de comparação embutidos na linguagem como em [PHP](/?c=langages-de-programmation&s=php&p=conditions) ou em [C](/?c=langages-de-programmation&s=c&p=conditions): os testes se apoiam em **comandos** (`test`, `[`, `[[`) cujo código de saída (`$?`) determina se a condição é verdadeira (`0`) ou falsa (não nulo).

## `if` / `then` / `elif` / `else` / `fi`

```bash
idade=18

if [ $idade -ge 18 ]; then
    echo "Voce e maior de idade."
else
    echo "Voce e menor de idade."
fi
```

- `if` na verdade avalia o **código de saída** do comando que segue (aqui, `[ $idade -ge 18 ]`): `[` é um comando de verdade (frequentemente um link para `/usr/bin/test`), não um símbolo da linguagem.
- `fi` (`if` ao contrário) fecha o bloco, como `endif` faria em outras linguagens.

## `[ ]` vs `[[ ]]`

```bash
[[ $idade -ge 18 && $idade -lt 65 ]]    # [[ ]] : sintaxe estendida Bash, && e || diretamente utilizaveis
[ $idade -ge 18 ] && [ $idade -lt 65 ]  # [ ] : POSIX, exige combinar dois testes separados
```

`[[ ]]` (específico do Bash, não portável para um `sh` estritamente POSIX) aceita `&&`/`||` diretamente dentro, lida melhor com variáveis não definidas, e permite o filtro por padrão (`[[ $nome == J* ]]`).

## Comparar números

```bash
if [ $idade -eq 18 ]; then echo "Exatamente 18"; fi
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Diferente |
| `-lt` | Menor |
| `-le` | Menor ou igual |
| `-gt` | Maior |
| `-ge` | Maior ou igual |

> **Nota:** `==` e `!=` também funcionam em `[[ ]]`, mas apenas para comparar **strings**. Usar `==` em números dentro de `[ ]` clássico compara os valores como texto, não numericamente (`"10" < "9"` textualmente, mas `10 -gt 9` numericamente).

## Comparar strings

```bash
nome="Joao"

if [ "$nome" == "Joao" ]; then
    echo "Ola Joao"
fi

if [ -z "$nome" ]; then
    echo "nome esta vazio"
fi
```

| Operador | Significado |
|---|---|
| `==` / `=` | Igualdade de strings |
| `!=` | Diferença de strings |
| `-z "$str"` | Verdadeiro se a string está vazia |
| `-n "$str"` | Verdadeiro se a string não está vazia |

## Testar arquivos

```bash
if [ -f "config.php" ]; then
    echo "O arquivo existe"
fi

if [ -d "/var/www" ]; then
    echo "O diretorio existe"
fi
```

| Operador | Verdadeiro se... |
|---|---|
| `-f caminho` | ...é um arquivo existente |
| `-d caminho` | ...é um diretório existente |
| `-e caminho` | ...algo existe nesse caminho (arquivo ou diretório) |
| `-x caminho` | ...o arquivo é executável |
| `-r` / `-w` | ...o arquivo é legível / gravável |

## Combinar condições

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "O arquivo existe e e legivel"
fi
```

## O `case` (equivalente do `switch`)

```bash
dia="qua"

case $dia in
    seg|ter|qua|qui|sex)
        echo "Dia de semana"
        ;;
    sab|dom)
        echo "Fim de semana"
        ;;
    *)
        echo "Dia desconhecido"
        ;;
esac
```

`|` separa vários padrões para um mesmo bloco, `*)` captura todo o resto (equivalente do `default` de um `switch`), e `;;` marca o fim de cada bloco.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Bash não tem operadores de comparação embutidos na linguagem: `if` avalia o código de saída de um comando (`test`, `[`, `[[`). `[[ ]]` (Bash) é mais permissivo que `[ ]` (POSIX). |
| **Ferramentas utilizáveis** | Operadores numéricos (`-eq`, `-lt`...), operadores de strings (`==`, `-z`, `-n`), testes de arquivo (`-f`, `-d`, `-e`), `case`. |
| **Armadilhas a evitar** | Usar `==` em `[ ]` clássico pensando comparar números: a comparação é feita como texto, não numericamente. |
| **Boas práticas** | Preferir `[[ ]]` a `[ ]` em Bash (lida melhor com variáveis não definidas, `&&`/`\|\|` diretos) exceto necessidade de portabilidade estrita para `sh`. |
