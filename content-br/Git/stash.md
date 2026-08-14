---
order: 6
---

# O stash

`git stash` Guarda temporariamente as alterações não submetidas, para recuperar uma pasta de trabalho limpa — útil quando é necessário mudar de ramo com urgência (por exemplo, para corrigir um bug crítico) sem querer perder o trabalho em curso nem submetê-lo num estado incompleto.

## Guardar as alterações

```bash
git stash                          # guarda todas as alterações acompanhadas e devolve a pasta «limpa»
git stash push -m "en cours : formulaire de contact"  # com uma nota, para se orientar mais tarde
git stash -u                        # inclui também os arquivos não acompanhados (novos, nunca adicionados)
```

Após um «`git stash`», `git status` já não apresenta quaisquer alterações — como se tivéssemos acabado de efetuar um commit, só que nada aparece no histórico (`git log`): as alterações são armazenadas separadamente, numa pilha.

## Ver e recuperar os seus stashes

```bash
git stash list
# stash@{0}: em curso: formulário de contato
# stash@{1}: WIP no ramo principal: a3f9c1d Corrige o cálculo do desconto

git stash apply          # reaplica o stash mais recente, SEM o retirar da pilha
git stash apply stash@{1} # reaplica um stash específico
git stash pop             # reaplica o stash mais recente E retira-o da pilha
```

> **Nota:** `apply` mantém o stash na pilha após o ter reaplicado (útil para o aplicar em vários ramos sucessivamente), enquanto que `pop` o retira — a escolha depende de se ter a certeza de que já não é necessário noutro local.

## Eliminar um stash

```bash
git stash drop stash@{0}   # elimina um stash específico, sem o reaplicar
git stash clear             # elimina TODOS os stashes da pilha
```

## Caso de utilização típico

```bash
# Enquanto se está trabalhando num «feature», surge um bug urgente no «main»
git stash push -m "travail en cours sur feature"
git checkout main
# ... corrigir o bug, fazer o commit, enviar...
git checkout feature
git stash pop   # retoma exatamente onde tínhamos ficado
```
