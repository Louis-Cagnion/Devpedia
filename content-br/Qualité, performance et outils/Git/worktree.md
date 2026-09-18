---
order: 15
---

# O worktree: várias branches abertas ao mesmo tempo

Um diretório de trabalho Git clássico só tem uma branch extraída (*checked out*) por vez: trocar de branch substitui o conteúdo do diretório pelo da branch de destino. Um **worktree** é um diretório de trabalho adicional, conectado ao mesmo repositório, com sua própria branch extraída à parte: várias branches ficam assim disponíveis ao mesmo tempo, cada uma em sua própria pasta.

## O problema que o worktree resolve

Uma funcionalidade está pela metade em `feature`, e cai um bug urgente em `main`. Trocar de branch para corrigir o bug obriga a escolher entre commitar um trabalho incompleto, ou usar um [`git stash`](/?c=git&p=stash) que guarda tudo de lado enquanto dura a correção. Um worktree evita essa escolha: a correção acontece em uma segunda pasta, enquanto a primeira mantém `feature` intacta.

```text
Sem worktree                         Com worktree
uma pasta, uma branch                uma pasta por branch, em paralelo
por vez -> stash para trocar         meu-projeto/         (main)
                                      meu-projeto-hotfix/  (hotfix)
                                      meu-projeto-feature/ (feature)
```

## Criar, listar e remover um worktree

```bash
git worktree add ../meu-projeto-hotfix hotfix   # cria uma pasta, branch "hotfix" extraida
git worktree list                               # lista os worktrees do repo e sua branch
git worktree remove ../meu-projeto-hotfix       # remove um worktree terminado
```

`git worktree add` também aceita uma branch que ainda não existe (`-b nova-branch`), criada na hora a partir do commit atual.

## Histórico compartilhado, arquivos de trabalho separados

Todos os worktrees de um repositório compartilham o mesmo histórico (`.git`): não é preciso clonar o repositório inteiro para cada branch. Só os arquivos de trabalho (diretório de trabalho + índice) são próprios de cada worktree.

> **Cuidado:** o histórico é compartilhado, mas as dependências instaladas não (`node_modules`, um ambiente virtual Python...). Cada worktree mantém sua própria cópia dessas pastas, o que consome espaço em disco e exige reinstalar por worktree.

> **Nota:** um merge entre duas branches de worktrees diferentes continua sendo um merge Git comum, com os mesmos conflitos possíveis que entre duas branches de um único diretório de trabalho. O worktree isola o trabalho em andamento, nunca dispensa resolver um conflito real ao fazer o merge.

## Caso de uso típico: vários agentes em paralelo

Um uso cada vez mais comum: dar a cada agente que programa em paralelo (ou a cada tarefa independente) seu próprio worktree, para que nenhum deles modifique arquivos em que outro já está trabalhando:

```bash
git worktree add ../projeto-auth autenticacao
git worktree add ../projeto-faturamento faturamento
# um agente trabalha em cada pasta, sem nunca pisar no trabalho do outro
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um worktree é um diretório de trabalho adicional conectado ao mesmo repositório, com sua própria branch extraída. Várias branches ficam assim abertas ao mesmo tempo, sem `stash` nem clone separado: só o histórico é compartilhado, os arquivos de trabalho (dependências instaladas inclusive) continuam próprios de cada worktree. |
| **Ferramentas utilizáveis** | `git worktree add`/`list`/`remove`. |
| **Armadilhas a evitar** | Achar que as dependências instaladas (`node_modules`...) são compartilhadas entre worktrees: cada um tem sua própria cópia para reinstalar. |
| **Boas práticas** | Dar um worktree separado para cada branch/tarefa executada em paralelo (um hotfix urgente, vários agentes programando ao mesmo tempo), em vez de encadear `stash`. |
