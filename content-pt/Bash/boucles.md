---
order: 5
---

# Os loops

O Bash disponibiliza três estruturas de loop (`for`, `while`, `until`), utilizadas tanto para repetir comandos como para percorrer listas de ficheiros, linhas ou resultados de comandos.

## O ciclo «`for`» (iteração pela lista)

```bash
for fruto in pomme banane cerise; do
    echo "$fruto"
done
```

Percorrer os ficheiros de uma pasta utilizando o globbing (ver capítulo sobre expansão):

```bash
for ficheiro in *.txt; do
    echo "Traitement de $ficheiro"
done
```

Percorrer um intervalo de números:

```bash
for i in {1..5}; do
    echo "$i"
done
```

## O ciclo «`for`» ao estilo C

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## O ciclo `while`

O bloco é executado enquanto a condição se mantiver verdadeira (testada **antes de** cada iteração):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Ler um ficheiro linha a linha

A combinação mais comum em scripts Bash para processar um ficheiro de texto:

```bash
while read -r linha; do
    echo "Ligne lue : $linha"
done < ficheiro.txt
```

- `read -r` Lê uma linha da entrada padrão para a variável `linha` em cada iteração (o `-r` impede que os caracteres `\` sejam interpretados como caracteres de escape, o que é quase sempre o desejado).
- `< ficheiro.txt` redireciona o conteúdo do ficheiro para a entrada padrão de todo o ciclo (ver capítulo sobre redirecionamentos).

## O ciclo `until`

O oposto de «`while`»: o bloco é executado enquanto a condição for **falsa**, até que se torne verdadeira:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` equivale exatamente a `while [ $i -lt 5 ]` — a escolha entre as duas opções é uma questão de legibilidade, dependendo da condição que se pretenda expressar de forma natural.

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
