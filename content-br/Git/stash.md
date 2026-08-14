---
order: 6
---

# O stash

`git stash` guarda temporariamente modificações não commitadas, para recuperar um diretório de trabalho limpo, útil quando é preciso trocar de branch com urgência (ex. corrigir um bug crítico) sem querer nem perder o trabalho em andamento, nem commitá-lo em um estado incompleto.

## Guardar suas modificações

```bash
git stash                                             # guarda todas as modificacoes rastreadas, deixa o diretorio "limpo"
git stash push -m "em andamento: formulario de contato"  # com uma mensagem, para se localizar depois
git stash -u                                          # inclui tambem os arquivos nao rastreados (novos, nunca adicionados)
```

Depois de um `git stash`, `git status` não mostra mais nenhuma modificação, como se você tivesse acabado de commitar, exceto que nada aparece no histórico (`git log`): as modificações são armazenadas à parte, em uma pilha.

## Ver e recuperar seus stashes

```bash
git stash list
# stash@{0}: em andamento: formulario de contato
# stash@{1}: WIP on main: a3f9c1d Corrige o calculo de desconto

git stash apply            # reaplica o stash mais recente, SEM retira-lo da pilha
git stash apply stash@{1}  # reaplica um stash especifico
git stash pop              # reaplica o stash mais recente, E o retira da pilha
```

> **Nota:** `apply` mantém o stash na pilha depois de reaplicá-lo (útil para aplicá-lo em várias branches sucessivamente), enquanto `pop` o retira: a escolha depende de você ter certeza de não precisar mais dele em outro lugar.

## Remover um stash

```bash
git stash drop stash@{0}  # remove um stash especifico, sem reaplica-lo
git stash clear           # remove TODOS os stashes da pilha
```

## Por baixo do capô: um stash é um commit um tanto particular

Um stash não é nada mais nem menos do que um commit (veja [A arquitetura interna do Git](/?c=git&p=architecture-interne) para a estrutura de objeto subjacente), apontado pela ref `refs/stash`. Seu primeiro pai é o commit atual no momento do stash, e um segundo pai captura o estado do index (um terceiro se `-u` foi usado, para os arquivos não rastreados): é essa estrutura com vários pais que `git stash apply`/`pop` interpretam para reconstruir separadamente o index e o diretório de trabalho.

> **Armadilha:** uma ferramenta que reescreve o histórico sem conhecer essa convenção (`git filter-branch`, veja [A arquitetura interna do Git](/?c=git&p=architecture-interne)) pode achatar esse commit para um único pai: `apply`/`pop` então se tornam inutilizáveis (`fatal: ... is not a stash-like commit`). O conteúdo continua mesmo assim recuperável diretamente, já que o tree do commit reflete o estado completo do diretório de trabalho no momento do stash: `git checkout refs/stash -- arquivo.txt`.

## Por que não simplesmente trocar de branch sem stash?

Uma troca de branch comum (`git checkout`/`switch`, veja [As branches](/?c=git&p=branches)) não guarda **nada** por conta própria: o Git compara o arquivo modificado com sua versão na branch de destino.

| Situação | O que acontece sem `stash` |
|---|---|
| O arquivo modificado não existe, ou é idêntico, na branch de destino | O Git **permite** a troca de branch, e leva a modificação não commitada junto: ela acaba na nova branch, fora de qualquer commit, sem que tenha sido pedido |
| O arquivo modificado também difere na branch de destino | O Git **recusa** a troca de branch (`error: your local changes ... would be overwritten by checkout`), para nunca sobrescrever um trabalho não commitado |

Nenhum dos dois casos corresponde ao que realmente se quer no cenário abaixo: o primeiro mistura silenciosamente um trabalho em andamento com outra branch (fácil de commitar por engano no lugar errado), o segundo bloqueia completamente enquanto nada é feito. `git stash` retira explicitamente a modificação de **todas** as branches (diretório de trabalho fica limpo), a guarda à parte com uma mensagem, e depois a devolve apenas quando solicitado, na branch escolhida: é essa guarda explícita, e não a simples troca de branch, que garante não misturar nem perder nada.

## Caso de uso típico

```bash
# em pleno trabalho em "feature", um bug urgente aparece em "main"
git stash push -m "trabalho em andamento em feature"
git checkout main
# ... corrigir o bug, commitar, enviar ...
git checkout feature
git stash pop   # retoma exatamente de onde parou
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `git stash` guarda modificações não commitadas para recuperar um diretório limpo. É na verdade um commit especial com vários pais, apontado por `refs/stash`. |
| **Ferramentas utilizáveis** | `git stash push`/`list`/`apply`/`pop`/`drop`/`clear`. |
| **Armadilhas a evitar** | Uma ferramenta que reescreve o histórico sem conhecer a estrutura de um stash pode quebrá-lo (achatado para um único pai, `apply`/`pop` se tornam inutilizáveis). |
| **Boas práticas** | Nomear seus stashes com `-m` para se localizar; só usar `pop` se tiver certeza de não precisar mais dele em outro lugar, `apply` caso contrário. |
