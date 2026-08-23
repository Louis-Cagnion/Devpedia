---
order: 2
---

# O sistema de opções (`setopt`)

O [Bash](/?c=shells&s=bash&p=bash) ativa comportamentos opcionais caso a caso (`shopt -s nome`, `set -o nome`, cada um com seu próprio comando). O Zsh centraliza isso em um único mecanismo coerente: `setopt`/`unsetopt`, com dezenas de opções nomeadas que mudam o comportamento do shell.

## Ativar e desativar uma opção

```bash
setopt AUTO_CD    # ativa uma opcao
unsetopt AUTO_CD  # desativa

setopt            # lista todas as opcoes atualmente ativas
```

> **Nota:** os nomes de opções não diferenciam maiúsculas/minúsculas nem underscores: `AUTO_CD`, `autocd` e `auto_cd` designam a mesma opção. A convenção `MAIUSCULAS_COM_UNDERSCORES` é a mais legível e a mais comum nos `.zshrc` encontrados online.

## Algumas opções úteis no dia a dia

```bash
setopt AUTO_CD           # digitar um nome de diretorio sozinho (sem "cd") ja move para ele
setopt EXTENDED_GLOB     # ativa o globbing estendido (veja Expansao e coringas avancados)
setopt SHARE_HISTORY     # compartilha o historico de comandos em tempo real entre todos os terminais abertos
setopt HIST_IGNORE_DUPS  # nao registra um comando identico ao anterior no historico
setopt CORRECT           # sugere uma correcao se um comando digitado nao existe ("did you mean...")
```

| Opção | Efeito |
|---|---|
| `AUTO_CD` | `nome_diretorio` sozinho equivale a `cd nome_diretorio` |
| `EXTENDED_GLOB` | ativa os padrões de globbing estendidos (veja [Expansão e coringas avançados](/?c=shells&s=zsh&p=expansion-et-jokers-avances)) |
| `SHARE_HISTORY` | histórico compartilhado ao vivo entre terminais abertos simultaneamente |
| `HIST_IGNORE_DUPS` | sem duplicata consecutiva no histórico |
| `CORRECT` | sugere uma correção ortográfica de comando |
| `NO_CASE_GLOB` | o globbing (`*.txt`) fica insensível a maiúsculas/minúsculas |

## `setopt` vs `shopt`/`set -o`: não é só um nome diferente

Ao contrário do Bash, onde as opções ficam dispersas entre `shopt` (opções específicas do Bash) e `set -o` (opções POSIX compartilhadas), o zsh agrupa tudo sob `setopt`/`unsetopt`, com uma lista de várias centenas de opções cobrindo aspectos que o Bash simplesmente não torna configuráveis (comportamento do globbing, do histórico, da completação...).

> **Nota:** essas opções tipicamente são colocadas em `~/.zshrc` (veja [Os arquivos de inicialização](/?c=shells&s=zsh&p=fichiers-de-demarrage)) para ficarem ativas em cada novo terminal, exatamente como um `shopt -s` seria colocado em `~/.bashrc`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O zsh agrupa todas as suas opções de comportamento em um único mecanismo (`setopt`/`unsetopt`), onde o Bash as dispersa entre `shopt` e `set -o`. |
| **Ferramentas utilizáveis** | `setopt`/`unsetopt`, `AUTO_CD`, `EXTENDED_GLOB`, `SHARE_HISTORY`, `CORRECT`. |
| **Armadilhas a evitar** | Procurar uma opção equivalente do Bash uma por uma: o zsh frequentemente cobre aspectos que o Bash simplesmente não torna configuráveis. |
| **Boas práticas** | Colocar os `setopt` em `~/.zshrc` para que fiquem ativos em cada novo terminal. |
