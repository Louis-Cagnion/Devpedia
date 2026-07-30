---
order: 4
---

# As áreas

Um **ramo** é simplesmente um ponteiro móvel para um commit — permite desenvolver uma versão do código (uma nova funcionalidade, uma correção) sem alterar o ramo principal e, posteriormente, reunir as duas linhas de trabalho.

## Criar e mudar de ramo

```bash
git branch                     # enumera os ramos existentes; o ramo atual está assinalado com um *
git branch nouvelle-fonctionnalite   # cria um novo ramo, sem mudar para ele
git checkout nouvelle-fonctionnalite  # mudança para este ramo
git checkout -b nouvelle-fonctionnalite  # atalho: cria E alterna com um único comando

git switch nouvelle-fonctionnalite      # equivalente moderno de «checkout» para mudar de ramo
git switch -c nouvelle-fonctionnalite    # equivalente moderno de «checkout -b»
```

> **Nota:** `git switch` (mais recente) e `git checkout` (histórico, mais versátil mas menos explícito) têm aqui a mesma função — `checkout` também serve para outros fins (restaurar um ficheiro, ver o capítulo sobre a anulação), o que torna a sua leitura mais ambígua.

## O que acontece realmente quando se muda de ramificação

Cada ramificação é um simples ponteiro para um commit específico. Mudar de ramificação desloca `HEAD` para esse ponteiro, e o Git atualiza a pasta de trabalho para que corresponda exatamente ao instantâneo desse commit:

```
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si on est sur "feature")
```

## 

```bash
git checkout main
git merge feature
```

Dois casos possíveis:

**Avanço rápido**: se `main` não tiver recebido nenhum commit desde a criação de `feature`, o Git simplesmente avança o ponteiro `main` até ao último commit de `feature` — não é criado nenhum novo commit de fusão.

```
Avant :  main: A -- B          feature: A -- B -- C -- D
Après :  main: A -- B -- C -- D
```

**Merge commit**: se `main` tiver evoluído em paralelo, o Git cria um commit especial com **dois pais**, que reúne os dois históricos:

```
main:     A -- B ------- E (merge commit)
                \        /
feature:         C -- D
```

## Eliminar um ramo

```bash
git branch -d feature    # elimina, apenas se o ramo já tiver sido fundido (segurança)
git branch -D feature    # obriga à eliminação, mesmo que nunca tenha sido incorporada
```

> **Nota:** `git branch -D` num ramo que nunca foi fundido pode fazer com que se perca o acesso a commits que já não existem em mais nenhum outro local. Normalmente, estes continuam acessíveis durante algum tempo através de `git reflog` (ver o capítulo sobre a anulação e o histórico), mas é melhor verificar em `git log feature` (ou numa fusão/`git branch -d`) antes de forçar a eliminação.

Consulte também o capítulo sobre o rebase, uma alternativa ao merge para integrar alterações sem um commit de fusão, e o capítulo sobre a resolução de conflitos, para o caso de ambos os ramos terem alterado as mesmas linhas.
