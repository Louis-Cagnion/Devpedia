---
order: 10
---

# Zsh

O Zsh (*Z shell*) é, como o [Bash](/?c=shells&s=bash&p=bash), um shell compatível com [POSIX](/?c=shells&s=bash&p=scripts-et-shebang): quase tudo que é visto no tópico Bash (variáveis, condições, laços, funções, redirecionamentos e pipes, permissões e arquivos, gerenciamento de processos, processamento de texto) funciona **de forma idêntica** no zsh, sintaxe incluída -- exceto algumas divergências pontuais e silenciosas, detalhadas mais abaixo. Aliás, é o shell padrão no macOS desde 2019, e uma escolha comum no Linux pelo seu conforto de uso interativo.

> **O que é coberto aqui:** apenas o que realmente difere do Bash ou o que não existe de forma alguma no Bash: os arquivos de inicialização, o sistema de opções (`setopt`), o globbing estendido, a completação avançada, a personalização do prompt, o framework **Oh My Zsh**, e duas divergências de comportamento que quebram silenciosamente um script Bash portado tal como está (veja abaixo). Para todo o resto (variáveis, condições, laços, funções, redirecionamentos, permissões, processos, processamento de texto), os capítulos do tópico Bash se aplicam diretamente.

## Em que o zsh difere concretamente do Bash

O zsh adiciona por cima da base POSIX (compartilhada com o Bash) várias camadas de conforto voltadas ao uso **interativo** em vez do scripting puro:

- uma completação por tabulação bem mais rica (menus navegáveis, completação contextual por comando);
- um globbing mais poderoso, ativável com `setopt extendedglob`;
- um sistema de personalização de prompt independente do Bash (`PROMPT` em vez de `PS1`, com seus próprios códigos de escape);
- um sistema de opções nomeadas (`setopt`/`unsetopt`) mais legível do que as opções pontuais do Bash (`shopt`, `set -o`);
- um ecossistema de frameworks de configuração, dos quais **Oh My Zsh** é o mais popular.

## Duas divergências que quebram silenciosamente um script Bash portado tal como está

Ao contrário dos acréscimos de conforto acima (globbing, completação...), esses dois pontos mudam o **resultado** de um script idêntico conforme o shell que o executa, sem nenhum erro ou aviso -- o script roda, só que não como esperado.

### A quebra de palavras em uma variável sem aspas

No [Bash](/?c=shells&s=bash&p=bash), uma variável escalar sem aspas (`$var`) é quebrada por espaços (*word splitting*), assim como uma substituição de comando (`$(cmd)`). No zsh, apenas a substituição de comando continua sendo quebrada: uma variável escalar sem aspas permanece uma **string única**, espaços incluídos.

```bash
etapas="um dois tres"

for e in $etapas; do
    echo "$e"
done
```

| Shell | Resultado do laço |
|---|---|
| Bash | 3 voltas: `um`, depois `dois`, depois `tres` (`$etapas` quebrado por espaços) |
| Zsh | 1 única volta: `um dois tres` (string inteira, sem quebra) |

> **Boa prática:** nunca contar com essa quebra implícita, em nenhum dos dois shells. Usar um array de verdade (`etapas=(um dois tres)`, depois `for e in "${etapas[@]}"`) torna o comportamento idêntico e explícito nos dois lados.

### Aritmética de ponto flutuante nativa

No Bash, a aritmética `$(( ))` só lida com inteiros: uma divisão como `$((1 / 2))` trunca o resultado (`0`), e uma expressão com um número decimal literal falha. No zsh, `$(( ))` lida nativamente com números de ponto flutuante:

```zsh
echo $((1 / 2))       # 0 no Bash (divisão inteira) -- 0.5 no zsh
echo $((0.53 / 1))    # erro no Bash -- 0.53 no zsh
```

> **Armadilha:** um script escrito e testado no zsh pode, portanto, produzir silenciosamente um resultado numérico diferente (ou um erro) ao ser executado com `bash script.sh` ou via um `#!/bin/bash` explícito. Para um cálculo decimal portável, usar [`bc`](https://www.gnu.org/software/bc) ou `awk` em vez de `$(( ))`, seja qual for o shell de destino.

## Ler uma tecla: `read -k` (zsh) e `read -n` (Bash)

O `read` normalmente espera uma linha inteira confirmada com Enter. Para reagir a **uma única tecla** (um menu, "pressione uma tecla"), cada shell tem sua opção:

| | Zsh | Bash |
|---|---|---|
| Ler um caractere, sem mostrá-lo | `read -s -k 1 tecla` | `read -rsn1 tecla` |
| Limitar a espera | `-t 0.05` (segundos) | `-t 0.05` (segundos) |

Um script de zsh que usa `-k` falha no Bash: `read: -k: invalid option` (código de saída 2).

**As teclas de seta enviam vários bytes.** A seta para cima transmite de uma vez três bytes: Esc (código 27, escrito `033` em octal), `[` e depois `A`. Uma leitura de um único caractere vê, portanto, três "teclas" sucessivas. Medido no zsh, seta para cima digitada e depois `x`:

```text
leitura 1 :  033
leitura 2 :  [
leitura 3 :  A
```

A solução: depois de um Esc, ler os bytes seguintes com um **prazo muito curto**. Se chegarem, é uma sequência; se não, é a tecla Esc sozinha.

```zsh
lire_touche() {
  local k suite
  read -s -k 1 k
  if [[ $k == $'\e' ]]; then    # Esc: início de uma sequência, ou tecla Esc sozinha
    read -s -k 2 -t 0.05 suite  # os dois bytes seguintes, se chegarem em 50 ms
    k+=$suite
  fi
  REPLY=$k
}
```

Medido: a seta para cima devolve `033 [ A` em uma única chamada, a tecla Esc sozinha devolve `033`, e uma tecla comum (`x`) continua sendo lida sozinha. A mesma função se escreve no Bash com `read -rsn1` e `read -rsn2 -t 0.05` (resultado idêntico).

> **Armadilha:** um prazo curto demais. Em uma conexão lenta (SSH), os três bytes podem chegar separados: a seta é então lida como Esc seguido de caracteres parasitas.
>
> **Armadilha:** outras teclas (Home, End, F1…) enviam sequências mais longas, que um `-k 2` não lê por inteiro.
>
> **Boa prática:** testar a função com uma seta **e** com Esc sozinho, em um terminal real; para um menu complexo, usar uma ferramenta dedicada em vez de decodificar as sequências à mão.

Outra diferença silenciosa entre os dois shells (o `trap … EXIT` que não executa diante de um sinal no zsh) está descrita em [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus).

Você vai encontrar os diferentes capítulos abaixo:
