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

Você vai encontrar os diferentes capítulos abaixo:
