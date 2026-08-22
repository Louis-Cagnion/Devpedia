---
order: 10
---

# Zsh

O Zsh (*Z shell*) é, como o Bash, um shell compatível com [POSIX](/?c=shells&s=bash&p=scripts-et-shebang): quase tudo que é visto no tópico Bash (variáveis, condições, laços, funções, redirecionamentos e pipes, permissões e arquivos, gerenciamento de processos, processamento de texto) funciona **de forma idêntica** no zsh, sintaxe incluída. Aliás, é o shell padrão no macOS desde 2019, e uma escolha comum no Linux pelo seu conforto de uso interativo.

> **O que é coberto aqui:** apenas o que realmente difere do Bash ou o que não existe de forma alguma no Bash: os arquivos de inicialização, o sistema de opções (`setopt`), o globbing estendido, a completação avançada, a personalização do prompt, e o framework **Oh My Zsh**. Para todo o resto (variáveis, condições, laços, funções, redirecionamentos, permissões, processos, processamento de texto), os capítulos do tópico Bash se aplicam diretamente.

## Em que o zsh difere concretamente do Bash

O zsh adiciona por cima da base POSIX (compartilhada com o Bash) várias camadas de conforto voltadas ao uso **interativo** em vez do scripting puro:

- uma completação por tabulação bem mais rica (menus navegáveis, completação contextual por comando);
- um globbing mais poderoso, ativável com `setopt extendedglob`;
- um sistema de personalização de prompt independente do Bash (`PROMPT` em vez de `PS1`, com seus próprios códigos de escape);
- um sistema de opções nomeadas (`setopt`/`unsetopt`) mais legível do que as opções pontuais do Bash (`shopt`, `set -o`);
- um ecossistema de frameworks de configuração, dos quais **Oh My Zsh** é o mais popular.

Você vai encontrar os diferentes capítulos abaixo:
