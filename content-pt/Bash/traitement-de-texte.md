---
order: 9
---

# Processamento de texto (grep, sed, awk...)

Grande parte do poder do terminal Unix provém de um conjunto de ferramentas especializadas no tratamento de texto, concebidas para serem combinadas entre si através de pipes (ver capítulo sobre redirecionamentos). Este capítulo apresenta as ferramentas mais utilizadas no dia-a-dia.

## `grep` : pesquisar texto

```bash
grep "erreur" arquivo.log         # exibe as linhas que contêm «erro»
grep -i "erreur" arquivo.log      # indiferente às maiúsculas e minúsculas (-i)
grep -v "erreur" arquivo.log      # inverso: apresenta as linhas que NÃO contêm «erro»
grep -r "TODO" .                  # Pesquisa recursiva em todos os arquivos de uma pasta
grep -n "erreur" arquivo.log      # também apresenta o número da linha
grep -c "erreur" arquivo.log      # conta o número de linhas correspondentes, sem as apresentar
grep -E "erreur|warning" arquivo.log  # -E ativa as expressões regulares estendidas (ver capítulo sobre expressões regulares)
```

## `sed` : procurar e substituir

```bash
sed 's/ancien/nouveau/' arquivo.txt        # substitui a primeira ocorrência em cada linha e apresenta o resultado
sed 's/ancien/nouveau/g' arquivo.txt        # «g» (global): substitui TODAS as ocorrências em cada linha
sed -i 's/ancien/nouveau/g' arquivo.txt     # -i: altera o arquivo diretamente (no local)
sed -n '2,4p' arquivo.txt                    # apresenta apenas as linhas 2 a 4
```

> **Nota:** O comando «`sed`» processa o texto linha a linha e utiliza expressões regulares (ver capítulo dedicado) para o padrão de pesquisa — «`s/motif/remplacement/`» é o seu comando mais utilizado («s» significa *«substituir*»).

## `awk` : tratar texto em colunas

`awk` Divide automaticamente cada linha em campos (`$1`, `$2`...), separados, por padrão, por espaços/tabulações:

```bash
echo "Jean Dupont 25" | awk '{ print $1 }'        # Jean -> primeiro campo
echo "Jean Dupont 25" | awk '{ print $3, $1 }'    # 25 de janeiro

awk -F ',' '{ print $2 }' dados.csv    # -F ',' : altera o separador de campos para uma vírgula
```

`$0` refere-se à linha completa, enquanto «`$NF`» se refere ao **último** campo da linha (`NF` = *Number of Fields*):

```bash
awk '{ print $NF }' arquivo.txt   # exibe a última palavra de cada linha
```

## `cut` : extrair colunas de forma simples

Mais limitada do que a `awk`, mas suficiente para casos simples:

```bash
cut -d ',' -f 2 dados.csv       # -d: separador, -f: número do campo a extrair
cut -c 1-5 arquivo.txt            # extraia os caracteres 1 a 5 de cada linha
```

## `sort` e `uniq`: ordenar e eliminar duplicados

```bash
sort arquivo.txt                  # ordenação alfabética
sort -n números.txt                # ordenação numérica (indispensável para números; caso contrário, ordenação por cadeia)
sort -r arquivo.txt                 # ordenação decrescente
sort arquivo.txt | uniq            # elimina apenas as linhas duplicadas CONSECUTIVAS
sort arquivo.txt | uniq -c          # conta o número de ocorrências de cada linha
```

> **Nota:** O comando «`uniq`» deteta apenas duplicados **adjacentes** — é por isso que é quase sempre combinado com o comando «`sort`», executado anteriormente, que agrupa as linhas idênticas.

## `wc` : contar

```bash
wc -l arquivo.txt   # número de linhas
wc -w arquivo.txt    # número de palavras
wc -c arquivo.txt    # número de bytes
```

## Combinar estas ferramentas

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) mantém as linhas de erro 404
# 2) extrai o endereço IP (1.º campo)
# 3) ordena para agrupar os endereços IP idênticos
# 4) conta as ocorrências de cada IP
# 5) ordenação por número de ocorrências decrescente -> os IP mais frequentes em primeiro lugar
```
