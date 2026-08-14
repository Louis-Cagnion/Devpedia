---
order: 7
---

# As tags

Uma **tag** é um ponteiro para um commit específico, como uma branch, mas ao contrário de uma branch, uma tag **nunca se move** depois de criada. Serve tipicamente para marcar uma versão publicada de um projeto (`v1.0.0`, `v2.3.1`...).

## Criar uma tag

```bash
git tag v1.0.0                                  # tag "leve": simples ponteiro, sem metadados
git tag -a v1.0.0 -m "Primeira versao estavel"  # tag "anotada": com autor, data e mensagem
```

> **Nota:** uma tag anotada (`-a`) geralmente é preferível para uma versão realmente publicada: ela é registrada como um objeto Git completo (com sua própria mensagem e autor), ao contrário da tag leve, que é apenas um simples alias para um hash de commit.

## Listar e inspecionar as tags

```bash
git tag            # lista todas as tags
git tag -l "v1.*"  # filtra por padrao
git show v1.0.0    # exibe os detalhes da tag (e o commit associado)
```

## Marcar um commit passado

```bash
git tag -a v0.9.0 a3f9c1d -m "Versao beta"   # marca um commit especifico, nao necessariamente o mais recente
```

## Enviar tags para um remote

As tags **não** são enviadas automaticamente por um `git push` comum:

```bash
git push origin v1.0.0  # envia uma tag especifica
git push origin --tags  # envia todas as tags locais de uma vez
```

## Remover uma tag

```bash
git tag -d v1.0.0                # remove localmente
git push origin --delete v1.0.0  # remove tambem do lado do remote
```

## Voltar a uma versão marcada por tag

```bash
git checkout v1.0.0
```

> **Nota:** isso coloca o repositório em estado de **"detached HEAD"** (`HEAD` aponta diretamente para um commit, não mais para uma branch), útil para inspecionar essa versão específica, mas qualquer novo commit feito nesse estado não pertenceria a nenhuma branch e seria facilmente perdido. Para continuar trabalhando a partir dali, criar primeiro uma branch: `git checkout -b nova-branch v1.0.0`.

**Voltar atrás uma vez terminada a inspeção.** Se nenhum commit foi feito durante o detached HEAD (o caso mais comum depois de uma simples inspeção), basta voltar para a branch de onde se veio para que `HEAD` volte a se ligar a ela, exatamente como qualquer [troca de branch](/?c=git&p=branches):

```bash
git checkout main   # ou: git switch main
```

Nada se perde nem precisa ser desfeito: o commit marcado nunca foi modificado, e `HEAD` simplesmente retoma seu lugar normal, apontando para `main` em vez de diretamente para um commit.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma tag é um ponteiro fixo para um commit; ao contrário de uma branch, ela nunca se move. Serve tipicamente para marcar uma versão publicada. |
| **Ferramentas utilizáveis** | `git tag`, `git tag -a`, `git push origin --tags`. |
| **Armadilhas a evitar** | As tags não são enviadas automaticamente por um `git push` comum; mover-se para uma tag coloca em *detached HEAD*. |
| **Boas práticas** | Preferir uma tag anotada (`-a`) para uma versão realmente publicada; criar uma branch antes de continuar trabalhando a partir de uma tag. |
