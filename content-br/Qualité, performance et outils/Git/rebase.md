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

## Reformular sem editor interativo: `reset --soft` + recommit direcionado

`rebase -i` abre um editor de texto interativo, o que falha nesse formato em um contexto sem terminal anexado (script, CI, agente automatizado). Para reformular a mensagem de um commit que não é o último, sem passar por um editor, `git reset --soft` até a base comum permite recolocar tudo em stage e então recommitar cada commit um a um com a mensagem correta:

```bash
git reset --soft <commit-antes-do-mais-antigo-a-reformular>
git reset            # desempilha tudo (a pasta de trabalho mantém o estado final)

# para cada commit a recriar na ordem original:
git show <hash-antigo-do-commit>:caminho/arquivo.py > caminho/arquivo.py  # restaura ESSE arquivo ao seu estado nesse commit
git add caminho/arquivo.py ...
git commit -F mensagem-corrigida.txt   # nunca -m para uma mensagem multilinha com acentos: veja mais abaixo
```

`git show <hash>:<caminho>` extrai o conteúdo de um arquivo tal como ele estava em um commit específico, o que permite reconstruir o estado intermediário de cada commit antes de recommitá-lo, mesmo quando um mesmo arquivo mudou em vários dos commits a reformular.

> **Nota:** redigir uma mensagem multilinha acentuada diretamente em `git commit -m "$(cat <<'EOF' ... EOF)"` (heredoc bash) é uma fonte de erro frequente: a mensagem digitada "na hora" em uma chamada de comando cai facilmente numa convenção ASCII (ex. "veiculo" em vez de "veículo") sem que nada sinalize isso. Escrever a mensagem em um arquivo de texto, revisá-la, e então `git commit -F arquivo.txt` evita essa armadilha separando a redação da execução do comando.

Esse método não muda nem o conteúdo nem a ordem dos commits, apenas suas mensagens: é um `reword` manual, mais verboso que `rebase -i` mas utilizável sem nenhuma interação humana.

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
