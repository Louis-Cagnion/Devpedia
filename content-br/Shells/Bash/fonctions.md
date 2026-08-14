---
order: 7
---

# As funções

Uma função Bash agrupa uma sequência de comandos sob um nome reutilizável. Ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=conditions) ou [C](/?c=langages-de-programmation&s=c&p=conditions), uma função Bash **nunca** declara uma lista de parâmetros nomeados: ela recebe seus argumentos exatamente como um script recebe os seus, via `$1`, `$2`, etc.

## Declarar e chamar uma função

```bash
saudar() {
    echo "Ola $1 !"
}

saudar "Joao"   # Ola Joao !
```

`function saudar { ... }` é uma escrita alternativa aceita pelo Bash (mas não portável para um `sh` estritamente POSIX): `saudar() { ... }` é a forma mais universal.

## Os argumentos de uma função

```bash
resumir() {
    echo "Nome da funcao: $FUNCNAME"
    echo "Primeiro argumento: $1"
    echo "Todos os argumentos: $@"
    echo "Numero de argumentos: $#"
}

resumir "Joao" "Silva"
```

> **Nota:** `$1`, `$2`... dentro de uma função designam os argumentos **da função**, nunca os do script que a envolve: eles são automaticamente substituídos durante a chamada, sem nada a configurar.

## Nenhum valor de retorno de verdade: apenas um código de saída

`return` em Bash **não** retorna um valor no sentido de PHP/C: ele só fixa o **código de saída** da função (um inteiro de 0 a 255, recuperável via `$?`), exatamente como `exit` para um script inteiro:

```bash
e_par() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = sucesso/verdadeiro, convencao Unix
    else
        return 1   # nao nulo = falha/falso
    fi
}

if e_par 4; then
    echo "4 e par"
fi
```

## "Retornar" um dado de verdade: `echo` + substituição de comando

Para recuperar um dado calculado (não apenas um sucesso/falha), a convenção é exibi-lo com `echo`, e capturar essa saída a partir de quem chama via [`$(...)`](/?c=shells&s=bash&p=variables):

```bash
soma() {
    echo $(($1 + $2))
}

resultado=$(soma 4 6)
echo "Resultado: $resultado"  # Resultado: 10
```

> **Nota:** nunca confundir os dois mecanismos. `return` comunica um status (0-255, para controle de fluxo com `if`), `echo` + `$(...)` comunica um dado de verdade (para ser armazenado/reutilizado). Uma mistura dos dois na mesma função é uma fonte clássica de confusão.

## Variáveis locais

Sem `local`, uma variável atribuída em uma função continua visível **globalmente** depois da primeira chamada: frequentemente um efeito colateral indesejado:

```bash
calcular() {
    local resultado=$(($1 * 2))  # local: so existe dentro de calcular()
    echo $resultado
}
```

Veja também [As variáveis](/?c=shells&s=bash&p=variables) (variáveis especiais `$1`, `$@`, `$#`, `$?`, já reutilizadas aqui no contexto das funções).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função Bash recebe seus argumentos como um script (`$1`, `$2`...), nunca via parâmetros nomeados. `return` só fixa um código de saída (0-255): para um dado de verdade, usa-se `echo` capturado via `$(...)`. |
| **Ferramentas utilizáveis** | `$FUNCNAME`, `$@`/`$#`, `local` para uma variável própria da função. |
| **Armadilhas a evitar** | Confundir `return` (status, para `if`) e `echo`+`$(...)` (dado, para ser armazenado); esquecer `local`, o que torna uma variável visível globalmente depois da primeira chamada. |
| **Boas práticas** | Sempre declarar `local` uma variável que não precisa existir fora da função. |
