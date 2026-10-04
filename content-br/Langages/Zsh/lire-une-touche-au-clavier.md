---
order: 7
---

# Ler uma tecla do teclado no zsh: `read -k`, Esc e setas

Um script interativo muitas vezes precisa de uma resposta imediata: «Enter para continuar, Esc para parar». O script que lança o solucionador de Skyscraper sobre uma série de grades faz exatamente isso. Mas o comando habitual, `read`, espera que uma **linha** seja confirmada com Enter. Este capítulo mostra como ler **uma única tecla**, o que uma tecla realmente envia ao programa e como distinguir a tecla Esc de uma seta.

## Uma linha ou uma tecla: `read` e `read -k`

| Comando | O que faz |
|---|---|
| `read linha` | Espera que uma linha inteira seja confirmada com Enter |
| `read -k 1 tecla` | Lê **uma tecla** assim que ela é digitada: o terminal passa então a tratar a entrada tecla a tecla |
| `read -s ...` | Não exibe o que é digitado |
| `read -t 0.05 ...` | Espera apenas 0,05 segundo (um número decimal é aceito); código de retorno 1 se nada chegou |

Segundo o manual do zsh, `-k` lê **do terminal**. Sem terminal (script lançado pelo `cron`, entrada redirecionada), `read -k` falha com a mensagem `not interactive and can't open terminal` e o código 1.

A mesma operação existe no bash, com outras opções (comportamentos verificados em um terminal simulado):

| | bash | zsh |
|---|---|---|
| Ler uma tecla | `read -n 1 tecla` | `read -k 1 tecla` |
| Sem eco | `-s` | `-s` |
| Prazo de 0,05 s esgotado | Código **142** | Código **1** |
| `read -n 1 tecla` | Lê uma tecla | **Não lê nada**: `tecla` fica vazia, código 0, nenhuma mensagem |

> **Armadilha:** copiar o `read -n 1` do bash para um script zsh não produz nenhum erro: o manual do zsh reserva `-n` para as funções de completação; em qualquer outro lugar a opção é ignorada em silêncio.

## O que uma tecla envia: bytes

O teclado não envia «a tecla Esc»: o terminal transmite **bytes**, e `read -k 1` lê um de cada vez. O script a seguir (`bytes.zsh`) mostra cada byte recebido; a flag `(q)` escreve os caracteres invisíveis de forma legível:

```zsh
#!/bin/zsh
# Mostra os bytes recebidos a cada tecla: digitar uma letra, Enter, Esc, uma seta...
# Para parar: digitar q.
while read -s -k 1 key; do
    print -r -- "byte recebido: ${(q)key}"
    [[ $key == q ]] && break
done
```

Saída ao digitar, em ordem: `a`, Enter, Esc, seta para cima, seta para a esquerda, Alt+x, F1 e depois `q`:

```
byte recebido: a
byte recebido: $'\n'
byte recebido: $'\033'
byte recebido: $'\033'
byte recebido: \[
byte recebido: A
byte recebido: $'\033'
byte recebido: \[
byte recebido: D
byte recebido: $'\033'
byte recebido: x
byte recebido: $'\033'
byte recebido: O
byte recebido: P
byte recebido: q
```

| Tecla | Bytes recebidos | Leitura |
|---|---|---|
| Letra `a` | `a` | Um byte |
| Enter | `\n` | Um byte (o terminal converte o retorno de carro) |
| Esc | `\033` | Um byte: o caractere **ESC**, de código 27 |
| Seta para cima, baixo, direita, esquerda | `\033`, `[`, depois `A`, `B`, `C` ou `D` | **Três** bytes: ESC, `[` e uma letra |
| Alt+x | `\033`, `x` | Dois bytes: ESC seguido da letra |
| F1 | `\033`, `O`, `P` | Três bytes |
| Tab, backspace | `\t`, `\177` | Um byte cada |

ESC é o caractere que abre uma **sequência de escape** (o mesmo que serve para os [códigos ANSI de cor](/?c=langages&s=bash&p=architecture-dun-shell#colorir-a-saida-de-um-terminal-os-codigos-ansi) no sentido contrário, do programa para o terminal). Uma seta começa, portanto, exatamente como a tecla Esc: só o que vem depois permite distingui-las.

## Distinguir Esc de uma seta

Depois de ler ESC, espera-se muito brevemente um byte a mais. Se ele chega, é o começo de uma sequência (seta, F1...). Se não chega, é a tecla Esc, digitada sozinha. A função `wait_for_key` (`espera.zsh`) devolve `0` com Enter, `1` com Esc sozinho e `2` se não há terminal:

```zsh
#!/bin/zsh
# Espera Enter (código 0) ou Esc (código 1); código 2 se não há terminal.
wait_for_key() {
    local key
    while read -s -k 1 key 2>/dev/null; do
        [[ $key == $'\n' || $key == $'\r' ]] && return 0       # Enter
        [[ $key != $'\e' ]] && continue                        # qualquer outra tecla: continua esperando
        # uma seta envia Esc seguido de outros bytes: só um Esc isolado interrompe
        read -s -t 0.05 -k 1 key || return 1                   # nada se segue: Esc sozinho
        while read -s -t 0.01 -k 1 key; do :; done             # esvazia o resto da seta
    done
    return 2
}

wait_for_key
echo "código de retorno: $?"
```

| Linha | Papel |
|---|---|
| `while read -s -k 1 key 2>/dev/null` | Lê uma tecla sem exibi-la; falha sem terminal (mensagem oculta) |
| `[[ $key == $'\n' \|\| $key == $'\r' ]] && return 0` | Enter (retorno de carro ou quebra de linha): termina com o código 0 |
| `[[ $key != $'\e' ]] && continue` | Qualquer tecla diferente de ESC é ignorada: lê-se de novo |
| `read -s -t 0.05 -k 1 key \|\| return 1` | Após ESC, espera 0,05 s um byte a mais; nenhum chega: Esc sozinho, código 1 |
| `while read -s -t 0.01 -k 1 key; do :; done` | Chegou um byte: esvazia-se o resto da sequência (`[` e `A`...) para que não sejam lidos como duas digitações |
| `return 2` | O laço parou porque o `read` falhou: não há terminal |

Resultados (terminal simulado, teclas enviadas como pelo teclado):

| Teclas digitadas | Código devolvido | Leitura |
|---|---|---|
| Enter | 0 | Continuar |
| Esc sozinho | 1 | Parar |
| Seta para cima, depois Enter | 0 | A seta é ignorada |
| `abc`, depois Enter | 0 | As letras são ignoradas |
| Esc, depois `x` 20 ms mais tarde (como Alt+x) | 0 | Tomado pelo começo de uma sequência: Esc não reconhecido |
| Nenhum terminal (`< /dev/null`) | 2 | Sem terminal |

## As armadilhas

| Armadilha | O que acontece | Remédio |
|---|---|---|
| `read -n 1` escrito por hábito do bash | Nenhum erro, mas a variável fica vazia (verificado) | `read -k 1` no zsh |
| Script sem terminal (cron, pipe) | `read -k` falha com uma mensagem e o código 1 | Ocultar a mensagem (`2>/dev/null`) e prever um código próprio, como o `return 2` acima |
| Alt+tecla ou tecla de função | ESC e a letra chegam quase juntos: são lidos como uma sequência, nunca como Esc (verificado com 20 ms) | Aceitar esse limite, ou ler a sequência inteira |
| Não esvaziar o fim de uma sequência | `[` e `A` seriam lidos como duas digitações comuns | O laço `while read -t 0.01` |
| Prazo de 0,05 s curto demais | Em um enlace lento (ssh), os bytes de uma seta podem chegar separados por mais de 0,05 s e a seta ser tomada por Esc | Testar no enlace realmente usado e ajustar |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | `read -k 1` lê uma tecla sem esperar Enter (zsh; `read -n 1` no bash). Uma tecla envia bytes: Esc é um único byte ESC (`\033`), uma seta envia três (ESC, `[`, uma letra). Para distinguir Esc de uma seta, lê-se ESC e depois espera-se brevemente um byte a mais com `-t`. |
| **Ferramentas utilizáveis** | `read -k`, `-s`, `-t`, a comparação com `$'\e'`, a flag `(q)` para ver os bytes, `[[ -t 0 ]]` para testar a presença de um terminal. |
| **Armadilhas a evitar** | `read -n 1` em um script zsh (variável vazia sem erro). Esquecer de esvaziar o fim de uma sequência. Ler uma tecla sem terminal. Tomar Alt+tecla por Esc. |
| **Boas práticas** | Verificar o que cada tecla envia com um pequeno script de bytes. Ocultar a mensagem de erro e tratar o caso «sem terminal» com um código de retorno próprio. Escolher os prazos conforme o enlace usado. |
