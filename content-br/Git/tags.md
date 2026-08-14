---
order: 7
---

# As etiquetas

Uma **etiqueta** é um ponteiro para um commit específico, tal como um ramo, mas, ao contrário de um ramo, uma etiqueta **nunca** **se** **altera** depois de criada. É normalmente utilizada para identificar uma versão publicada de um projeto (`v1.0.0`, `v2.3.1`...).

## Criar uma etiqueta

```bash
git tag v1.0.0                 # etiqueta «leve»: simples indicador, sem metadados
git tag -a v1.0.0 -m "Première version stable"   # etiqueta «anotada»: com autor, data e mensagem
```

> **Nota:** uma etiqueta anotada (`-a`) é geralmente preferível para uma versão efetivamente publicada: é registada como um objeto Git completo (com a sua própria mensagem e autor), ao contrário da etiqueta leve, que é apenas um simples alias para um hash de commit.

## Listar e inspecionar as etiquetas

```bash
git tag                     # lista todas as etiquetas
git tag -l "v1.*"            # filtro por padrão
git show v1.0.0               # mostra os detalhes da etiqueta (e o commit associado)
```

## Marcar um commit anterior

```bash
git tag -a v0.9.0 a3f9c1d -m "Version bêta"   # marcar um commit específico, não necessariamente o mais recente
```

## Enviar tags para um servidor remoto

As tags não são enviadas automaticamente por um `git push` clássico:

```bash
git push origin v1.0.0     # insere uma tag específica
git push origin --tags      # envia todas as etiquetas locais de uma só vez
```

## Eliminar uma etiqueta

```bash
git tag -d v1.0.0                    # elimina localmente
git push origin --delete v1.0.0       # elimina também do lado remoto
```

## Voltar a uma versão marcada

```bash
git checkout v1.0.0
```

> **Nota:** isto coloca o repositório no estado **«detached HEAD»** (`HEAD` aponta diretamente para um commit, e não mais para um ramo), útil para inspecionar esta versão específica, mas qualquer novo commit feito neste estado não pertenceria a nenhum ramo e poderia ser facilmente perdido. Para continuar a trabalhar a partir daqui, crie primeiro um ramo: `git checkout -b nouvelle-branche v1.0.0`.
