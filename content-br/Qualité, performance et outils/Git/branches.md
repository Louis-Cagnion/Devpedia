---
order: 4
---

# As branches

Uma **branch** é simplesmente um ponteiro móvel para um commit: ela permite fazer evoluir uma versão do código (uma nova funcionalidade, uma correção) sem tocar na branch principal, e depois reunir as duas linhas de trabalho mais tarde.

## Criar e trocar de branch

```bash
git branch                        # lista as branches existentes, a atual e marcada com um *
git branch nova-funcionalidade    # cria uma nova branch, sem mudar para ela
git checkout nova-funcionalidade  # muda para essa branch
git checkout -b nova-funcionalidade  # atalho: cria E muda em um unico comando

git switch nova-funcionalidade     # equivalente moderno de "checkout" para trocar de branch
git switch -c nova-funcionalidade  # equivalente moderno de "checkout -b"
```

> **Nota:** `git switch` (mais recente) e `git checkout` (histórico, mais versátil mas menos explícito) fazem aqui a mesma coisa: `checkout` também serve para outros usos (restaurar um arquivo, veja [Desfazer mudanças e navegar no histórico](/?c=git&p=annuler-et-historique)), o que o torna mais ambíguo de ler.

## O que acontece de fato ao trocar de branch

Cada branch é um simples ponteiro para um commit preciso. Trocar de branch move `HEAD` para esse ponteiro, e o Git atualiza o diretório de trabalho para que corresponda exatamente ao instantâneo desse commit:

```text
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (se estiver em "feature")
```

## Mesclar uma branch (`merge`)

```bash
git checkout main
git merge feature
```

O que o Git faz depende de uma única pergunta: **`main` recebeu novos commits desde a criação de `feature`?** A resposta determina se uma mesclagem de verdade (com um novo commit) é necessária, ou se o Git pode simplesmente fazer `main` "alcançar".

**Fast-forward: `main` não se moveu, não há nada a reunir.** Todos os commits de `feature` (`C`, `D`) já descendem diretamente do último commit de `main` (`B`): o histórico de `feature` já **contém** todo o histórico de `main`, sem nenhuma divergência. Mesclar então só exige uma coisa: avançar o ponteiro `main` até `D`, exatamente como avançar o marcador de um livro. Nenhuma combinação de conteúdo acontece, então nenhum commit de mesclagem é necessário:

```text
Antes:  main: A -- B                    feature: A -- B -- C -- D
                   ^main                                        ^feature

Depois: main: A -- B -- C -- D          (main e simplesmente realinhado com feature)
                             ^main, feature
```

**Merge commit: `main` evoluiu por conta própria, é preciso realmente reunir duas histórias.** Se `main` recebeu seu próprio commit (`E`) enquanto `feature` avançava com `C`/`D`, as duas branches **divergiram**: nenhuma das duas contém mais o histórico da outra, então "avançar um ponteiro" não basta mais. O Git precisa criar um novo commit que tenha **dois pais** ao mesmo tempo (o último commit de `main` e o de `feature`), o único jeito de representar "aqui está um ponto do histórico que reúne essas duas linhas de trabalho":

```text
Antes:  main:     A -- B -- E                    feature: A -- B -- C -- D
                           ^main

Depois: main:     A -- B -- E ------- F (merge commit, dois pais)
                       \             /
        feature:        C --------- D
                                     ^feature
```

## Remover uma branch

```bash
git branch -d feature  # remove, apenas se a branch ja foi mesclada (seguranca)
git branch -D feature  # forca a remocao, mesmo que nunca tenha sido mesclada
```

> **Nota:** `git branch -D` em uma branch nunca mesclada pode fazer perder o acesso a commits que não existem mais em nenhum outro lugar. Eles geralmente continuam recuperáveis por um tempo via `git reflog` (veja [Desfazer mudanças e navegar no histórico](/?c=git&p=annuler-et-historique)), mas é melhor verificar com `git log feature` (ou uma mesclagem/`git branch -d`) antes de forçar a remoção.

Veja também [O rebase](/?c=git&p=rebase), uma alternativa ao merge para integrar mudanças sem commit de mesclagem, e [Resolver um conflito de mesclagem](/?c=git&p=resoudre-conflits), para o caso em que as duas branches modificaram as mesmas linhas.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma branch é um ponteiro móvel para um commit. `git merge` reúne duas branches: avanço simples (*fast-forward*) se possível, senão um commit de mesclagem com dois pais. |
| **Ferramentas utilizáveis** | `git branch`, `git switch`/`checkout`, `git merge`. |
| **Armadilhas a evitar** | `git branch -D` em uma branch nunca mesclada pode tornar seus commits difíceis de recuperar. |
| **Boas práticas** | Preferir `-d` (seguro, recusa se não mesclada) a `-D`; usar `switch` em vez de `checkout` para trocar de branch, menos ambíguo de ler. |
