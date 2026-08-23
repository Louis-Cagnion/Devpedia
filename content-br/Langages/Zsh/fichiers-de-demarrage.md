---
order: 1
---

# Os arquivos de inicialização

O [Bash](/?c=shells&s=bash&p=bash) carrega, dependendo do caso, `~/.bashrc`, `~/.bash_profile` ou `~/.profile` (veja [Variáveis de ambiente](/?c=shells&s=bash&p=variables-denvironnement) em Bash). O Zsh divide essa mesma necessidade em **quatro arquivos distintos**, cada um com um papel preciso: entender essa distinção evita as surpresas clássicas ("minha variável não aparece no meu script mas funciona no meu terminal").

## Os quatro arquivos, e quando cada um carrega

| Arquivo | Carregado para... |
|---|---|
| `~/.zshenv` | **Toda** invocação do zsh, incluindo scripts não interativos e [subshells](/?c=shells&s=bash&p=architecture-dun-shell) (o mesmo que seria o comportamento de `~/.bashrc` se o Bash o carregasse sistematicamente, o que ele não faz) |
| `~/.zprofile` | Apenas um shell de login (*login shell*), equivalente a `~/.bash_profile` |
| `~/.zshrc` | Apenas um shell interativo, equivalente a `~/.bashrc`, é o arquivo mais modificado na prática (aliases, `PROMPT`, plugins [Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)) |
| `~/.zlogin` | Apenas um shell de login, **depois** de `~/.zshrc`, raramente usado, para comandos que precisam rodar depois que o ambiente interativo estiver pronto |

> **Nota:** ao contrário do Bash, onde a ordem exata de carregamento entre "login" ou "não-login" é uma fonte recorrente de confusão, o zsh sempre carrega na mesma ordem fixa: `.zshenv` → `.zprofile` (se login) → `.zshrc` (se interativo) → `.zlogin` (se login). É previsível, independentemente do contexto de invocação.

## Onde colocar o quê

```bash
# ~/.zshenv : variaveis necessarias mesmo em um script nao interativo
export EDITOR="vim"

# ~/.zshrc : tudo que so faz sentido em modo interativo
alias ll="ls -la"
export PROMPT='%n@%m %~ %# '
```

> **Nota:** `~/.zshenv` é carregado até por ferramentas que invocam o zsh nos bastidores (scripts, alguns gerenciadores de janelas): colocar ali comandos lentos ou que exibem algo pode atrasar ou perturbar programas que não esperam um shell interativo. Reservar `~/.zshenv` para o estritamente necessário (variáveis de ambiente), e colocar o resto em `~/.zshrc`.

## Recarregar sem abrir um novo terminal

Como `source ~/.bashrc` em Bash:

```bash
source ~/.zshrc
# equivalente, mais curto:
. ~/.zshrc
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O zsh sempre carrega na mesma ordem fixa: `.zshenv` → `.zprofile` (login) → `.zshrc` (interativo) → `.zlogin` (login), mais previsível que a lógica Bash login/não-login. |
| **Ferramentas utilizáveis** | `~/.zshenv` (toda invocação), `~/.zshrc` (interativo, o mais modificado na prática), `source`/`.`. |
| **Armadilhas a evitar** | Colocar um comando lento ou que exibe algo em `~/.zshenv`: ele é carregado até por ferramentas que invocam o zsh nos bastidores. |
| **Boas práticas** | Reservar `~/.zshenv` para as variáveis de ambiente estritamente necessárias; colocar aliases, `PROMPT` e plugins em `~/.zshrc`. |
