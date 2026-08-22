---
order: 13
---

# O rebase

`git rebase` propõe uma alternativa ao `git merge` (veja [As branches](/?c=git&p=branches)) para integrar mudanças entre duas branches: em vez de criar um commit de mesclagem com dois pais, ele **reaplica** os commits de uma branch por cima de outra, produzindo um histórico linear.

## Merge vs rebase, visualmente

```text
Antes:
main:     A -- B -- C
                \
feature:         D -- E

Depois de um merge:             Depois de um rebase de feature em main:
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebaseada)
```

O rebase não "move" literalmente os commits `D` e `E`: ele cria **novos** commits (`D'`, `E'`) com o mesmo conteúdo mas um pai diferente, daí hashes diferentes dos originais.

## Realizar um rebase

```bash
git checkout feature
git rebase main
```

O Git reaplica um a um cada commit de `feature` (ausente em `main`) por cima do último commit de `main`. Em caso de conflito em um commit específico (veja [Resolver um conflito de mesclagem](/?c=git&p=resoudre-conflits)), o rebase para para resolvê-lo:

```bash
# depois de resolver os conflitos nos arquivos envolvidos:
git add arquivo_em_conflito.txt
git rebase --continue

# ou, para cancelar completamente o rebase em andamento e voltar ao estado anterior:
git rebase --abort
```

## O rebase interativo: reescrever seu histórico local

```bash
git rebase -i HEAD~3   # abre um editor para os 3 ultimos commits
```

```text
pick a1b2c3d Adiciona o formulario de contato
pick e4f5g6h Corrige um erro de digitacao
pick i7j8k9l Adiciona a validacao de email
```

Cada linha pode ser modificada antes de salvar:

| Ação | Efeito |
|---|---|
| `pick` | Manter o commit tal como está |
| `reword` | Manter o commit, mas modificar sua mensagem |
| `squash` | Mesclar esse commit com o anterior (mantém as duas mensagens, a fundir) |
| `fixup` | Como `squash`, mas descarta a mensagem desse commit |
| `drop` | Remove completamente esse commit |

Útil por exemplo para limpar um histórico de trabalho ("Corrige um erro de digitação", "Ops", "Realmente corrige o erro dessa vez") em um único commit limpo antes de compartilhá-lo.

## A regra de ouro: nunca rebasear um histórico já compartilhado

```bash
# EVITAR se outras pessoas ja obtiveram esses commits:
git rebase main
git push --force
```

> **Nota:** quando um force-push é realmente legítimo (rebasear e depois reenviar uma branch que só você usa), `git push --force-with-lease` é mais seguro que `--force`: ele verifica antes se ninguém mais enviou um commit nessa branch desde o último `fetch`, e recusa a operação nesse caso em vez de sobrescrever cegamente um trabalho que você não viu passar.

Como o rebase cria **novos** commits com hashes diferentes, enviá-lo sobrescrevendo o histórico remoto (`--force`) dessincroniza brutalmente qualquer pessoa que já tivesse baseado trabalho nos commits antigos: suas branches locais passariam a referenciar commits que não existem mais do lado do servidor. O rebase é seguro em commits **estritamente locais**, ainda nunca compartilhados.

Veja também [As branches](/?c=git&p=branches) (merge, a alternativa mais segura para um histórico já compartilhado) e [Resolver um conflito de mesclagem](/?c=git&p=resoudre-conflits).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `git rebase` reaplica os commits de uma branch por cima de outra, produzindo um histórico linear, ao custo de novos commits (hashes diferentes) em vez de um commit de mesclagem. |
| **Ferramentas utilizáveis** | `git rebase`, `git rebase -i` (reescrita interativa: pick/reword/squash/fixup/drop), `git rebase --continue`/`--abort`. |
| **Armadilhas a evitar** | Rebasear um histórico já compartilhado: os hashes mudam, o que dessincroniza qualquer pessoa que já tivesse baseado trabalho nos commits antigos. |
| **Boas práticas** | Só rebasear commits estritamente locais; se um push forçado for realmente necessário, preferir `--force-with-lease` a `--force`. |
