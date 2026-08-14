---
order: 6
---

# Oh My Zsh

Configurar manualmente [o prompt](/?c=shells&s=zsh&p=prompt-et-themes), [a completação](/?c=shells&s=zsh&p=completion-avancee) e [dezenas de opções](/?c=shells&s=zsh&p=options-du-shell) demanda tempo. O **Oh My Zsh** é um framework open source que fornece tudo isso pré-configurado, com centenas de temas e plugins prontos para uso: a forma mais comum de ter um `~/.zshrc` confortável sem escrever tudo você mesmo.

## Instalação

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

O instalador salva o `~/.zshrc` antigo (em `~/.zshrc.pre-oh-my-zsh`), instala o Oh My Zsh em `~/.oh-my-zsh/`, e gera um novo `~/.zshrc` que o carrega.

## A estrutura de um `.zshrc` com Oh My Zsh

```bash
export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh
```

- `ZSH_THEME` seleciona um tema entre os fornecidos (em `~/.oh-my-zsh/themes/`), ele configura `PROMPT`/`RPROMPT` por você (veja [Personalizar o prompt](/?c=shells&s=zsh&p=prompt-et-themes)), não é preciso redefini-los manualmente também.
- `plugins=(...)` ativa uma lista de plugins, cada um adicionando aliases, funções ou completações específicas.
- `source $ZSH/oh-my-zsh.sh` deve permanecer a **última** linha relevante: é essa linha que efetivamente carrega o tema e os plugins declarados acima.

## Alguns plugins comuns

| Plugin | Traz |
|---|---|
| `git` | Dezenas de aliases Git (`gst` = `git status`, `gco` = `git checkout`...) e o nome da branch atual no prompt via `vcs_info` |
| `zsh-autosuggestions` | Sugere o final de um comando já digitado no passado, em cinza, a confirmar com → |
| `zsh-syntax-highlighting` | Colore a linha de comando em tempo real (verde = comando válido, vermelho = inválido) antes mesmo de executá-lo |
| `docker`, `npm`, `python`... | Completação e aliases específicos da ferramenta correspondente |

> **Nota:** `zsh-autosuggestions` e `zsh-syntax-highlighting` **não** vêm incluídos por padrão com o Oh My Zsh (ao contrário de `git`): eles se instalam separadamente em `~/.oh-my-zsh/custom/plugins/` antes de poderem ser adicionados à lista `plugins=(...)`.

## Aliases fornecidos pelo plugin `git`

```bash
gst    # git status
gco    # git checkout
gaa    # git add --all
gcmsg  # git commit -m
gp     # git push
```

Esses aliases (veja [Variáveis de ambiente](/?c=shells&s=bash&p=variables-denvironnement) em Bash para o mecanismo `alias` em si, idêntico no zsh) são definidos pelo plugin, não pelo zsh nem pelo Oh My Zsh em si; sua lista completa depende da versão do plugin instalada.

## Personalizar sem tocar no núcleo do Oh My Zsh

```bash
# ~/.oh-my-zsh/custom/meus-alias.zsh
alias meualias="meu_comando --com --opcoes"
```

Todo arquivo `.zsh` colocado em `~/.oh-my-zsh/custom/` é carregado automaticamente, o que evita modificar os arquivos internos do framework (que seriam sobrescritos na próxima atualização) para adicionar seus próprios aliases ou funções.

## Atualizar o Oh My Zsh

```bash
omz update
```

Como o Oh My Zsh se atualiza via seu próprio repositório Git interno (`~/.oh-my-zsh/` é um clone Git), esse comando faz o equivalente de um `git pull` nele, sem precisar se preocupar manualmente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Oh My Zsh pré-configura prompt, completação e opções via um framework de temas e plugins, em vez de ajustar tudo manualmente. |
| **Ferramentas utilizáveis** | `ZSH_THEME`, `plugins=(...)`, `~/.oh-my-zsh/custom/` para personalizar sem tocar no núcleo do framework, `omz update`. |
| **Armadilhas a evitar** | Modificar diretamente os arquivos internos do Oh My Zsh: sobrescritos na próxima atualização. |
| **Boas práticas** | Colocar seus próprios aliases/funções em `~/.oh-my-zsh/custom/`; manter `source $ZSH/oh-my-zsh.sh` como última linha relevante do `.zshrc`. |
