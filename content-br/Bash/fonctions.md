---
order: 6
---

# As funções

Uma função Bash agrupa uma sequência de comandos sob um nome reutilizável. Ao contrário do PHP ou do C, uma função Bash **nunca** declara uma lista de parâmetros nomeados: recebe os seus argumentos exatamente da mesma forma que um script recebe os seus, através de `$1`, `$2`, etc.

## Declarar e chamar uma função

```bash
saluer() {
    echo "Bonjour $1 !"
}

saluer "Jean"   # Olá, Jean!
```

`function saluer { ... }` é uma sintaxe alternativa aceite pelo Bash (mas não compatível com um `sh` estritamente POSIX) — `saluer() { ... }` é a forma mais universal.

## Os argumentos de uma função

```bash
resumer() {
    echo "Nom de la fonction : $FUNCNAME"
    echo "Premier argument : $1"
    echo "Tous les arguments : $@"
    echo "Nombre d'arguments : $#"
}

resumer "Jean" "Dupont"
```

> **Nota:** `$1`, `$2`... dentro de uma função referem-se aos argumentos **da função**, nunca aos do script que a engloba — são substituídos automaticamente durante a chamada, sem necessidade de qualquer configuração.

## Sem valor de retorno efetivo: apenas um código de saída

`return` Em Bash**,** não devolve um valor no sentido do PHP/C — limita-se a definir o **código de saída** da função (um número inteiro de 0 a 255, recuperável através de `$?`), exatamente como `exit` para um script completo:

```bash
est_pair() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = sucesso/verdadeiro, convenção Unix
    else
        return 1   # diferente de zero = falha/falso
    fi
}

if est_pair 4; then
    echo "4 est pair"
fi
```

## «Devolver» um valor real: `echo` + substituição de comando

Para recuperar um dado calculado (não apenas um sucesso/falha), a convenção é exibi-lo com `echo` e capturar essa saída a partir do chamador através de `$(...)` (ver capítulo sobre variáveis):

```bash
addition() {
    echo $(($1 + $2))
}

resultado=$(addition 4 6)
echo "Résultat : $resultado"  # Resultado: 10
```

> **Nota:** nunca se deve confundir os dois mecanismos. `return` comunica um estado (0-255, para controle de fluxo com `if`), `echo` + `$(...)` comunica dados reais (para serem armazenados/reutilizados). A mistura dos dois na mesma função é uma fonte clássica de confusão.

## Variáveis locais

Sem o `local`, uma variável atribuída numa função permanece visível **globalmente** após a primeira chamada — o que constitui frequentemente um efeito colateral indesejado:

```bash
calculer() {
    local resultado=$(($1 * 2))  # local: existe apenas no interior da função calculer()
    echo $resultado
}
```

Ver também o capítulo sobre variáveis (variáveis especiais `$1`, `$@`, `$#`, `$?`, já mencionadas aqui no contexto das funções).
