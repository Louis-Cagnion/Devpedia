---
order: 8
---

# Repositórios remotos (remotes)

Um **«remote»** é uma referência a uma cópia do repositório alojada noutro local (GitHub, GitLab, um servidor da empresa...), utilizada para sincronizar o trabalho entre várias pessoas ou vários computadores.

## Ver e adicionar um remote

```bash
git remote -v                                  # enumera os remotes configurados (muitas vezes apenas «origin»)
git remote add origin https://exemple.com/projet.git
```

`origin` é o nome convencional atribuído ao «remote» principal (não é obrigatório utilizar este nome específico, mas trata-se de uma convenção quase universal).

## `push` : enviar commits locais

```bash
git push origin main               # envia os commits do ramo local «main» para o remoto «origin»
git push -u origin main             # -u: guarda este link, para que depois se possa escrever apenas «git push»
git push                             # assim que o link for guardado
```

## `fetch` vs `pull`

```bash
git fetch origin    # descarrega os novos commits do remote, SEM alterar a pasta de trabalho
git pull origin main # equivalente a: git fetch + git merge (fusiona imediatamente)
```

> **Nota:** «`git fetch`» é, por si só, a operação mais «segura» para verificar o que mudou no lado remoto (`git log origin/main`) antes de decidir como integrar essas alterações — «`git pull`» efetua essa fusão automaticamente, o que pode ser surpreendente se surgirem conflitos inesperados.

## Ramos de acompanhamento (*tracking branches*)

Um ramo local pode ser vinculado a um ramo remoto, o que permite ao Git saber para onde enviar/receber sem que seja necessário especificá-lo de cada vez:

```bash
git branch -vv                     # mostra qual o ramo remoto que cada ramo local segue
git push -u origin ma-branche       # estabelece esta ligação de acompanhamento logo a partir do primeiro envio
```

## Clonar um controle remoto já configurado

```bash
git clone https://exemple.com/projet.git
```

`git clone` configura automaticamente o arquivo «`origin`» para apontar para o endereço clonado — é por isso que um simples `git pull` / `git push` funciona imediatamente após uma clonagem, sem necessidade de configuração manual.

## Remover um comando remoto

```bash
git remote remove origin
```

Consulte também o capítulo sobre a resolução de conflitos, frequentemente necessária após um «`pull`» quando várias pessoas alteraram as mesmas linhas.
