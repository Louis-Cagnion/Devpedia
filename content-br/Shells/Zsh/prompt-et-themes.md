---
order: 5
---

# Personalizar o prompt

O Bash constrói seu prompt via a variável `PS1`, com códigos de escape começando com `\` (`\u`, `\h`, `\w`...). O Zsh usa sua própria variável, `PROMPT` (alias histórico: `PS1`, ainda aceito), com códigos de escape começando com `%`: uma sintaxe inteiramente diferente, não apenas um nome trocado.

## A variável `PROMPT`

```bash
PROMPT='%n@%m %~ %# '
```

| Código | Exibe |
|---|---|
| `%n` | Nome do usuário atual |
| `%m` | Nome da máquina (curto) |
| `%~` | Diretório atual, com `~` se estiver dentro do diretório pessoal (equivalente a `\w` em Bash) |
| `%#` | `#` se root, `%` caso contrário (equivalente a `\$` em Bash) |
| `%*` | Hora atual (HH:MM:SS) |
| `%D` | Data atual |

> **Nota:** ao contrário do `\w` do Bash, que já abrevia automaticamente o caminho com `~`, o zsh distingue explicitamente `%~` (abreviado) de `%/` (caminho completo, nunca abreviado), uma escolha explícita a fazer conforme o comportamento desejado.

## Colorir o prompt

```bash
PROMPT='%F{green}%n@%m%f %F{blue}%~%f %# '
```

`%F{cor}` inicia uma cor de texto, `%f` a fecha: equivalente das sequências de escape ANSI (`\e[32m`, cf. noções de terminal) mas em uma sintaxe própria do zsh, sem precisar conhecer os códigos ANSI brutos.

## `RPROMPT`: um prompt secundário à direita da tela

Sem equivalente em Bash: o zsh pode exibir um segundo prompt, alinhado à borda direita do terminal, que desaparece automaticamente assim que se começa a digitar:

```bash
RPROMPT='%D{%H:%M:%S}'
# exibe a hora atual a direita, enquanto a linha de comando estiver vazia
```

## `vcs_info`: informações do Git integradas ao prompt

O zsh fornece nativamente uma função capaz de exibir a branch Git atual no prompt, sem dependência externa:

```bash
autoload -Uz vcs_info
precmd() { vcs_info }
setopt PROMPT_SUBST
PROMPT='%n@%m %~ ${vcs_info_msg_0_} %# '
```

`PROMPT_SUBST` (veja [O sistema de opções](/?c=shells&s=zsh&p=options-du-shell)) permite a avaliação de variáveis e substituições dentro de `PROMPT`: sem essa opção, `${vcs_info_msg_0_}` apareceria literalmente em vez de ser substituído pela branch atual.

> **Nota:** é exatamente esse mecanismo (`vcs_info` + um prompt personalizado) que temas populares como *robbyrussell* (o tema padrão do [Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)) ou o [*powerlevel10k*](https://github.com/romkatv/powerlevel10k) automatizam e enriquecem.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O zsh constrói seu prompt via `PROMPT` (códigos `%`), não `PS1`/`\` como o Bash. `RPROMPT` exibe um prompt secundário à direita, sem equivalente em Bash. |
| **Ferramentas utilizáveis** | `%n`/`%m`/`%~`/`%#`, `%F{cor}`/`%f`, `vcs_info` para a branch Git. |
| **Armadilhas a evitar** | Esquecer `setopt PROMPT_SUBST`: sem ele, uma substituição como `${vcs_info_msg_0_}` aparece literalmente em vez de ser avaliada. |
| **Boas práticas** | Usar `vcs_info` para integrar nativamente a branch Git atual, em vez de um script externo. |
