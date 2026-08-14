---
order: 3
---

# As variáveis

Para lembrar, [uma variável é uma caixa etiquetada que contém um valor](/?c=bases-de-l-informatique&p=la-variable): o que segue cobre apenas o que é específico do Bash.

O Bash só tem um único tipo de dado real: a **string**; até um número é manipulado como texto, exceto em um contexto aritmético explícito (veja mais abaixo o que isso cobre precisamente). As variáveis não são tipadas, e sua sintaxe de declaração/leitura é particular: sem `$` na atribuição, com `$` na leitura.

## Declarar e ler uma variável

```bash
nome="Joao"     # nenhum espaco ao redor do '=' : "nome = Joao" e um erro de sintaxe
echo $nome      # Joao
echo "${nome}"  # Joao -> as chaves delimitam explicitamente o nome da variavel
echo "Ola ${nome} !"
```

> **Armadilha:** `nome= "Joao"` (com um espaço depois do `=`) **não** funciona como esperado: o Bash entende "executar o comando `Joao` com a variável de ambiente `nome` vazia", não "atribuir Joao a nome". Um espaço antes do `=` (`nome ="Joao"`) falha igualmente: o Bash procura então um comando chamado `nome`.
>
> **Boa prática:** nunca deixar espaço antes nem depois do `=` de uma atribuição: é a regra mais simples de lembrar, sem exceção no Bash.

## Aspas simples vs duplas

```bash
nome="Joao"

echo "Ola $nome"  # Ola Joao -> as aspas duplas interpretam as variaveis
echo 'Ola $nome'  # Ola $nome -> as aspas simples desativam qualquer interpretacao
```

| Aspas | Variáveis interpretadas? | Uso típico |
|---|---|---|
| Duplas `"..."` | Sim: `$nome` substituído por seu valor | Caso padrão, assim que uma variável aparece na string |
| Simples `'...'` | Não: texto tomado literalmente, `$` incluído | Texto literal contendo um `$` que não deve de forma alguma ser interpretado (regex, senha exibida tal como é...) |
| Nenhuma | Sim, mas além disso o valor é dividido em palavras pelos espaços | Evitar quase sempre: veja a armadilha abaixo |

> **Armadilha:** usar uma variável sem aspas (`echo $nome`) em vez de `"$nome"`. Se o valor contém um espaço, o Bash o divide em várias palavras antes de usá-lo: `rm $arquivo` com um nome de arquivo contendo um espaço pode assim excluir algo diferente do previsto, silenciosamente.
>
> **Boa prática:** cercar sistematicamente uma variável com aspas duplas no uso (`"$nome"`), exceto necessidade precisa do contrário. Única exceção comum: dentro de um contexto numérico explícito (`[ $i -lt 5 ]`, `$(( i + 1 ))`), o Bash não faz nenhuma divisão em palavras sobre o valor: as aspas ali são então inúteis, o que explica por que os capítulos sobre condições e laços não as usam nesses casos específicos.

## Substituição de comando

Executa um comando e substitui a expressão por sua saída:

```bash
data_de_hoje=$(date +%Y-%m-%d)
echo "Estamos em $data_de_hoje"

numero_arquivos=$(ls | wc -l)
echo "Ha $numero_arquivos arquivos aqui"
```

`$(...)` é a sintaxe moderna, preferida em relação aos antigos \`crases\` (`` `date` ``), menos legíveis e impossíveis de aninhar facilmente.

> **Armadilha:** uma substituição de comando não protegida por aspas sofre a mesma divisão em palavras que uma variável não protegida (veja a armadilha das aspas acima): um resultado multilinha (`$(ls)`, `$(cat arquivo.txt)`) tem suas quebras de linha silenciosamente transformadas em simples espaços se exibido sem aspas.
>
> **Boa prática:** proteger com aspas uma substituição de comando assim que sua saída for multilinha ou puder conter espaços (`echo "$(cat arquivo.txt)"`), exatamente como para uma variável comum.

## Injeção de comando: nunca interpolar uma entrada não confiável

Se um script constrói um comando interpolando diretamente nele um valor externo (entrada do usuário, argumento, conteúdo de um arquivo baixado...), esse valor pode conter caracteres especiais do shell (`;`, `|`, `` ` ``, `$(...)`) que **mudam a estrutura do comando executado**, em vez de continuar sendo um simples dado:

```bash
nome_arquivo="relatorio.txt; rm -rf ~"   # valor recebido de fora, nao controlado

eval "cat $nome_arquivo"    # PERIGO: executa de fato "cat relatorio.txt" DEPOIS "rm -rf ~"
```

`eval` reinterpreta sua string como uma nova linha de comando completa: é exatamente esse mecanismo que transforma um `;` contido no dado em uma verdadeira **segunda ordem**, em vez de um caractere inofensivo em um nome de arquivo. Mesmo sem `eval`, a substituição de comando (`$(...)`, acima) ou uma variável não protegida por aspas em um comando que aceita ele mesmo código (ex. `ssh host "$comando"`) criam o mesmo risco.

> **Armadilha:** confiar em um valor externo (entrada do usuário, argumento de script, conteúdo de um arquivo baixado) para construir um comando, principalmente via `eval` ou um comando que aceita ele mesmo código (`ssh host "$comando"`), conceitualmente o equivalente Bash de uma [injeção SQL](/?c=langages-de-programmation&s=php&p=securite): uma entrada não controlada que modifica a estrutura do que é executado, em vez de continuar sendo um simples dado.
>
> **Boa prática:** nunca montar textualmente um valor externo em um comando executado em seguida. Quando for inevitável, tratá-lo como um dado puro: nunca interpolado diretamente no comando, muito menos repassado a `eval`.

## Aritmética

O Bash não calcula nativamente sobre strings: um contexto aritmético explícito é necessário:

```bash
a=5
b=3

echo $((a + b))  # 8
echo $((a * b))  # 15
echo $((a / b))  # 1 -> divisao inteira apenas, o Bash nao lida com decimais
```

> **O que é um "contexto aritmético explícito"?** É uma sintaxe precisa que o Bash reconhece e dentro da qual ele interpreta o conteúdo como uma expressão numérica em vez de como texto: `$((...))` (para obter o resultado), `((...))` sozinho (para um cálculo ou um teste, sem recuperar valor, usado por exemplo em `for ((i = 0; i < 5; i++))`, veja [Os laços](/?c=shells&s=bash&p=boucles)), o comando `let` (`let "a = a + 1"`), ou ainda os operadores numéricos `-eq`, `-lt`, `-gt`... dentro de `[ ]`/`[[ ]]` (veja [As condições](/?c=shells&s=bash&p=conditions)). Fora dessas sintaxes precisas, `+`, `-`, `*` são apenas caracteres comuns em uma string.

> **Armadilha:** `$((a / b))` trunca silenciosamente qualquer parte decimal, sem aviso nem erro: `echo $((5 / 2))` exibe `2`, não `2.5`. Um cálculo que deveria produzir um resultado decimal (média, porcentagem...) dá então um resultado errado sem que nenhum erro o sinalize.
>
> **Boa prática:** passar por uma ferramenta externa que lida com decimais ([`bc`](https://www.gnu.org/software/bc/), `awk`) assim que um cálculo puder produzir um resultado não inteiro, em vez da aritmética nativa do Bash.

## Variáveis especiais

Além das variáveis que se declara, o Bash fornece variáveis especiais sempre disponíveis (`$0`, `$1`, `$@`, `$#`, `$?`, `$$`): veja a tabela e os exemplos no capítulo sobre escrita de scripts, logo após a seção sobre os argumentos de um script.

## Variáveis locais em uma função

Por padrão, uma variável declarada em uma função continua **global** (visível em todo lugar depois de sua primeira chamada): `local` restringe seu escopo à função atual, o que evita efeitos colaterais inesperados:

```bash
contar() {
    local total=0   # visivel apenas dentro de contar()
    total=$((total + 1))
    echo $total
}

contar
echo "$total"  # vazio: total nao existe fora da funcao
```

> **Armadilha:** esquecer `local` em uma função que reutiliza um nome de variável comum (`i`, `total`, `resultado`...): a variável se torna global silenciosamente, e pode sobrescrever uma variável de mesmo nome usada em outro lugar do script, sem nenhum erro sinalizado.
>
> **Boa prática:** declarar `local` para toda variável que só precisa existir durante a função: um reflexo a adotar já na primeira linha da função, não apenas depois de já ter constatado um bug de escopo.

Veja também o capítulo sobre funções, e o de variáveis de ambiente (`export`) para compartilhar um valor com processos filhos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Bash só conhece um único tipo real, a string. Atribuição sem `$` (`nome="Joao"`), leitura com `$` (`$nome`) ou `${nome}`, sem nenhum espaço ao redor do `=`. `"$(...)"` captura a saída de um comando; `$((...))` avalia uma expressão numérica. `local` restringe uma variável à sua função. |
| **Ferramentas utilizáveis** | `$(comando)` para a substituição de comando; `$((...))`, `((...))` ou `let` para a aritmética; `bc`/`awk` assim que um cálculo decimal for necessário. |
| **Armadilhas a evitar** | Um espaço ao redor do `=` na atribuição. Uma variável ou uma substituição de comando não protegida por aspas (divisão em palavras silenciosa). Interpolar um valor externo não controlado em um comando (`eval`, `ssh host "$comando"`). Esquecer `local` em uma função. |
| **Boas práticas** | Sempre proteger uma variável com aspas (`"$nome"`) exceto em um contexto aritmético explícito. Nunca construir um comando a partir de um dado externo não controlado. Declarar `local` sistematicamente em uma função. |
