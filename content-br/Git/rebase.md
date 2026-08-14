---
order: 10
---

# O rebase

`git rebase` Oferece uma alternativa ao «`git merge`» (ver capítulo sobre os ramos) para integrar alterações entre dois ramos: em vez de criar um commit de fusão com dois pais, **repete** os commits de um ramo sobre o outro, produzindo um histórico linear.

## Merge vs. rebase, visualmente

```
Avant :
main:     A -- B -- C
                \
feature:         D -- E

Après un merge :                Après un rebase de feature sur main :
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebasée)
```

O rebase não «desloca» literalmente os commits `D` e `E`: cria **novos** commits (`D'`, `E'`) com o mesmo conteúdo, mas com um pai diferente: daí os hashes diferentes dos originais.

## Efetuar um rebase

```bash
git checkout feature
git rebase main
```

O Git repete, um a um, cada commit de `feature` (ausente em `main`) sobre o último commit de `main`. Em caso de conflito num commit específico (ver capítulo sobre resolução de conflitos), o rebase pára para o resolver:

```bash
# Após resolver os conflitos nos arquivos em questão:
git add fichier_en_conflit.txt
git rebase --continue

# ou, para anular completamente o rebase em curso e regressar ao estado anterior:
git rebase --abort
```

## O rebase interativo: reescrever o histórico local

```bash
git rebase -i HEAD~3   # abre um editor para os últimos 3 commits
```

```
pick a1b2c3d Ajoute le formulaire de contact
pick e4f5g6h Corrige une typo
pick i7j8k9l Ajoute la validation email
```

Cada linha pode ser alterada antes de guardar:

| Ação | Efeito |
|---|---|
| `pick` | Manter o commit tal como está |
| `reword` | Manter o commit, mas alterar a sua mensagem |
| `squash` | Fundir este commit com o anterior (mantém as duas mensagens, a fundir) |
| `fixup` | Tal como `squash`, mas ignora a mensagem deste commit |
| `drop` | Elimina completamente este commit |

Útil, por exemplo, para limpar um histórico de trabalho («Corrigir um erro ortográfico», «Oops», «Desta vez, corrigir mesmo o erro ortográfico») num único commit limpo antes de o partilhar.

## A regra de ouro: nunca reescrever um histórico já partilhado

```bash
# A EVITAR se outras pessoas já tiverem recuperado estes commits:
git rebase main
git push --force
```

> **Nota:** quando um «force-push» é realmente legítimo (rebasar e, em seguida, voltar a enviar um ramo que só o usuário está utilizando), `git push --force-with-lease` é mais seguro do que `--force`: verifica primeiro se mais ninguém enviou um commit para esse ramo desde o último `fetch` e, nesse caso, recusa a operação, em vez de sobrescrever cegamente um trabalho que não se tenha visto a ser feito.

Uma vez que o rebase cria **novos** commits com hashes diferentes, enviá-lo sobrepondo o histórico remoto (`--force`) desincroniza abruptamente qualquer pessoa que já tivesse baseado o seu trabalho nos commits antigos: os seus ramos locais passariam a referenciar commits que já não existem no servidor. O rebase é seguro quando aplicado a commits **estritamente locais**, que ainda não tenham sido partilhados.

Ver também o capítulo sobre ramos (merge, a alternativa mais segura para um histórico já partilhado) e o capítulo sobre a resolução de conflitos.
