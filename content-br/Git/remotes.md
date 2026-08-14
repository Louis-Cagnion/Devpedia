---
order: 8
---

# Os repositórios remotos (remotes)

Um **remote** é uma referência a uma cópia do repositório hospedada em outro lugar ([GitHub](/?c=git&p=github-et-plateformes), [GitLab](https://gitlab.com), um servidor da empresa...), usada para sincronizar trabalho entre várias pessoas ou várias máquinas.

## Ver e adicionar um remote

```bash
git remote -v                                  # lista os remotes configurados (frequentemente so "origin")
git remote add origin https://exemplo.com/projeto.git
```

`origin` é o nome convencional dado ao remote principal (nada obriga esse nome exato, mas é a convenção quase universal).

## `push`: enviar commits locais

```bash
git push origin main     # envia os commits da branch local "main" para o remote "origin"
git push -u origin main  # -u: memoriza essa ligacao, para poder depois escrever apenas "git push"
git push                 # uma vez a ligacao memorizada
```

## Forçar um push depois de uma reescrita de histórico

Depois de um `rebase`, um `commit --amend`, ou uma reescrita de histórico (veja [A arquitetura interna do Git](/?c=git&p=architecture-interne)), os commits locais não têm mais os mesmos hashes que os já enviados: um `push` normal é então rejeitado (*non fast-forward*), o remote não encontrando seus antigos commits como ancestrais dos novos.

```bash
git push --force origin main             # sobrescreve o historico remoto sem condicao, perigoso se outra pessoa enviou algo nesse meio tempo
git push --force-with-lease origin main  # sobrescreve apenas se o remote ainda estiver no estado visto no ultimo fetch
```

> **Nota:** `--force-with-lease` compara o estado real do remote com o que a branch de rastreamento local (`origin/main`) conhecia no último `fetch`: se forem diferentes (outra pessoa enviou algo nesse meio tempo, ou essa branch de rastreamento foi ela mesma modificada por uma operação local), o push é rejeitado (`stale info`) em vez de sobrescrever um trabalho que você não viu. Sempre preferir `--force-with-lease` a `--force`, exceto certeza absoluta de estar sozinho na branch.

## `fetch` vs `pull`

```bash
git fetch origin      # baixa os novos commits do remote, SEM tocar no diretorio de trabalho
git pull origin main  # equivalente a: git fetch + git merge (mescla imediatamente)
```

> **Nota:** `git fetch` sozinho é a operação mais "segura" para inspecionar o que mudou do lado do remote (`git log origin/main`) antes de decidir como integrá-lo; `git pull` faz essa mesclagem automaticamente, o que pode surpreender se conflitos aparecerem sem que se espere.

## Branches de rastreamento (*tracking branches*)

Uma branch local pode ser ligada a uma branch remota, o que permite ao Git saber onde enviar/buscar sem precisar especificar toda vez:

```bash
git branch -vv                  # mostra qual branch remota cada branch local rastreia
git push -u origin minha-branch # estabelece essa ligacao de rastreamento ja no primeiro push
```

## Clonar um remote já configurado

```bash
git clone https://exemplo.com/projeto.git
```

`git clone` configura automaticamente `origin` para apontar para o endereço clonado: é por isso que um simples `git pull`/`git push` funciona imediatamente depois de um clone, sem configuração manual.

## Salvar ou transferir um repositório sem servidor: `git bundle`

`git bundle` empacota tudo ou parte de um repositório (commits, branches, tags) em um único arquivo binário, sem precisar de um servidor remoto:

```bash
git bundle create backup.bundle --all     # captura todas as refs (branches, tags, HEAD) em um unico arquivo
git bundle verify backup.bundle           # verifica que o bundle esta completo e utilizavel
git clone backup.bundle novo-diretorio    # um bundle se clona como um remote comum
```

> **Nota:** um bundle é um instantâneo congelado: ele não se atualiza sozinho. É a ferramenta natural para um backup pontual antes de uma operação arriscada (reescrita de histórico, por exemplo), ou para transferir um repositório para uma máquina sem rede (pendrive).

## Remover um remote

```bash
git remote remove origin
```

Veja também [GitHub e as plataformas de hospedagem Git](/?c=git&p=github-et-plateformes) para o que uma plataforma como o GitHub adiciona sobre um simples remote ([pull requests](/?c=git&p=pull-requests-github), [issues](/?c=git&p=issues-et-projets-github)), e [Resolver um conflito de mesclagem](/?c=git&p=resoudre-conflits), frequentemente necessário depois de um `pull` quando várias pessoas modificaram as mesmas linhas.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um remote referencia uma cópia do repositório hospedada em outro lugar. `push`/`pull`/`fetch` sincronizam o trabalho entre o repositório local e esse remote. |
| **Ferramentas utilizáveis** | `git remote`, `git push`/`pull`/`fetch`, `git bundle` (backup ou transferência sem servidor). |
| **Armadilhas a evitar** | `git push --force` pode sobrescrever o trabalho de outra pessoa sem avisar. |
| **Boas práticas** | Preferir `--force-with-lease` a `--force`; usar `fetch` para inspecionar as mudanças remotas antes de decidir como integrá-las, em vez de um `pull` direto em caso de dúvida. |
