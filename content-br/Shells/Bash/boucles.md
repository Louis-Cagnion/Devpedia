---
order: 6
---

# Os laços

O Bash oferece três estruturas de laço (`for`, `while`, `until`), usadas tanto para repetir comandos quanto para percorrer listas de arquivos, linhas ou resultados de comando.

## O laço `for` (percorrer uma lista)

```bash
for fruta in maca banana cereja; do
    echo "$fruta"
done
```

Percorrer os arquivos de um diretório graças ao [globbing](/?c=shells&s=bash&p=expansion-et-jokers):

```bash
for arquivo in *.txt; do
    echo "Processando $arquivo"
done
```

Percorrer uma faixa de números:

```bash
for i in {1..5}; do
    echo "$i"
done
```

## O laço `for` estilo C

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## O laço `while`

O bloco executa enquanto a condição permanece verdadeira (testada **antes** de cada volta):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Ler um arquivo linha por linha

O combo mais comum em scripting Bash para processar um arquivo de texto:

```bash
while read -r linha; do
    echo "Linha lida: $linha"
done < arquivo.txt
```

- `read -r` lê uma linha da entrada padrão na variável `linha` a cada volta (`-r` impede a interpretação de `\` como caractere de escape, quase sempre o que se quer).
- `< arquivo.txt` redireciona o conteúdo do arquivo para a entrada padrão de todo o laço (veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes)).

## O laço `until`

Simétrico do `while`: o bloco executa enquanto a condição permanece **falsa**, até que ela se torne verdadeira:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` equivale exatamente a `while [ $i -lt 5 ]`: a escolha entre os dois é uma questão de legibilidade conforme a condição que se quer expressar naturalmente.

## `break` e `continue`

Funcionam como na maioria das linguagens:

```bash
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        break
    fi
    if [ $((i % 2)) -eq 0 ]; then
        continue
    fi
    echo "$i"
done
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `for` percorre uma lista, arquivos (globbing) ou uma faixa de números; `while`/`until` repetem enquanto uma condição permanece verdadeira/falsa. `while read -r linha` é o combo padrão para ler um arquivo linha por linha. |
| **Ferramentas utilizáveis** | Expansão de chaves (`{1..5}`), `for` estilo C, `break`/`continue`. |
| **Armadilhas a evitar** | Esquecer `-r` com `read`: sem ele, os `\` são interpretados como caracteres de escape. |
| **Boas práticas** | Usar `while read -r linha; do ... done < arquivo.txt` para processar um arquivo de texto linha por linha, em vez de outra abordagem menos idiomática. |
