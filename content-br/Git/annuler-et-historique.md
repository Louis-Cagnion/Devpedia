---
order: 5
---

# Anular alterações e navegar pelo histórico

O Git disponibiliza vários comandos para voltar atrás, a diferentes níveis: anular uma alteração não submetida, um commit já efetuado ou até mesmo recuperar um commit que pareça ter desaparecido.

## Anular alterações não submetidas

```bash
git checkout -- arquivo.txt   # restaura um arquivo para o seu último estado confirmado, substituindo as alterações locais
git restore arquivo.txt        # equivalente moderno do comando acima

git restore --staged arquivo.txt  # retira um arquivo da área de preparação, SEM alterar as suas modificações na pasta de trabalho
```

> **Nota:** «`git checkout -- arquivo.txt`» e «`git restore arquivo.txt`» são **irreversíveis**: as alterações não submetidas são perdidas definitivamente, ao contrário de um commit, que pode sempre ser recuperado (ver `git reflog` mais abaixo).

## `git reset` : recuar o ramo atual

```bash
git reset --soft HEAD~1    # Anula o último commit, mas mantém tudo na área de preparação (pronto para ser submetido novamente)
git reset --mixed HEAD~1   # Anula o último commit E o staging, mantendo as alterações na pasta de trabalho (por padrão)
git reset --hard HEAD~1    # anula o último commit, o staging e as próprias alterações -> perda definitiva
```

| Opção | Commit cancelado | Staging | Pasta de trabalho |
|---|---|---|---|
| `--soft` | Sim | Conservada | Conservada |
| `--mixed` (padrão) | Sim | Reinicializado | Mantido |
| `--hard` | Sim | Reinicializado | **Reinicializado (perda de dados)** |

> **Nota:** «`git reset --hard`» é um dos comandos mais destrutivos do Git: substitui silenciosamente todas as alterações não submetidas, sem possibilidade de recuperação fácil. Deve ser utilizado apenas quando se tiver a certeza do que se está descartando.

## `git revert` : anular um commit já partilhado

Ao contrário de `reset` (que reescreve o histórico ao eliminar commits), `revert` cria um **novo** commit que aplica o inverso de um commit anterior: o histórico original permanece intacto, o que torna esta operação segura mesmo em commits já enviados e partilhados:

```bash
git revert a3f9c1d
```

## `git reflog` : recuperar um commit «perdido»

Mesmo após um «`reset --hard`» ou uma operação mal sucedida, o Git mantém, na realidade, um registro de todas as alterações de `HEAD` durante algum tempo:

```bash
git reflog
# a3f9c1d HEAD@{0}: reinicialização: a passar para HEAD~1
# e4f5g6h HEAD@{1}: commit: Corrige o cálculo do desconto
```

```bash
git checkout e4f5g6h        # recupera o estado de um commit «perdido» recuperado através do reflog
git branch recuperation e4f5g6h   # ou crie diretamente um ramo a partir deste commit
```

> **Nota:** «`git reflog`» é frequentemente a solução de recurso após uma operação no Git que correu mal: desde que um commit tenha existido localmente em determinado momento, geralmente permanece localizável durante várias semanas, mesmo que já não seja referenciado por nenhum ramo.

Ver também o capítulo sobre ramos e o capítulo sobre rebase, cujas operações são as mais relevantes para este capítulo.
