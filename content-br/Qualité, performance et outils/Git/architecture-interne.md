---
order: 14
---

# A arquitetura interna do Git

Os comandos vistos nos outros capítulos (`add`, `commit`, `branch`...) são apenas a parte visível ("porcelana") de um mecanismo de armazenamento surpreendentemente simples: um banco de dados chave-valor **endereçado por conteúdo**, onde a chave de cada dado é o hash do seu próprio conteúdo. Entender esse modelo permite "enxergar através" de qualquer comando Git, e dá os blocos de construção necessários para projetar um sistema de controle de versão semelhante.

## Um banco de dados endereçado por conteúdo

Cada dado armazenado pelo Git (o conteúdo de um arquivo, uma estrutura de diretório, um commit...) é salvo na forma de um **objeto**, identificado unicamente pelo hash SHA-1 do seu próprio conteúdo:

```text
conteudo -> SHA-1(conteudo) -> chave de armazenamento
```

```bash
echo "Ola" | git hash-object --stdin
# c6b7f... -> sempre o mesmo hash para o mesmo conteudo, nao importa onde/quando
```

> **Nota:** uma **função de hash** (aqui SHA-1) transforma uma entrada de tamanho qualquer em um número de tamanho fixo, de forma determinística (mesma entrada → sempre o mesmo resultado) e bem distribuída (dois conteúdos, mesmo muito parecidos, produzem resultados bem diferentes: é isso que torna uma colisão acidental extremamente improvável). Veja [As tabelas de hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) para esse mecanismo aplicado a uma estrutura de dados concreta.

Na prática, cada objeto é comprimido ([zlib](https://zlib.net), um algoritmo de compressão sem perdas) e armazenado em `.git/objects/`, sob um caminho derivado do seu hash: os 2 primeiros caracteres hexadecimais formam um subdiretório, os 38 restantes o nome do arquivo (`.git/objects/c6/b7f4a2...`). Isso não é nada mais nem menos do que uma [tabela de hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) armazenada diretamente no sistema de arquivos: o subdiretório desempenha o papel de uma posição (*bucket*).

> **Consequência direta:** dois arquivos com conteúdo estritamente idêntico produzem o **mesmo** hash, e portanto o **mesmo** objeto armazenado uma única vez, uma deduplicação automática e gratuita, propriedade inerente ao modelo, não uma otimização adicionada depois.

## Os quatro tipos de objetos

| Tipo | Conteúdo |
|---|---|
| **blob** | O conteúdo bruto de um arquivo: apenas os bytes, nenhum nome de arquivo nem metadado |
| **tree** | Uma lista de entradas (modo, tipo, nome, hash): representa um diretório, cada entrada apontando para um blob (arquivo) ou outro tree (subdiretório) |
| **commit** | Um hash de tree (o instantâneo raiz), um ou vários hashes de commit pai(s), autor, data, mensagem |
| **tag** (anotada) | Um hash de objeto visado (geralmente um commit), uma mensagem, usado por `git tag -a` |

```text
commit ---> tree (raiz do projeto)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (pai)
```

> **Nota:** um blob **não** conhece seu próprio nome de arquivo: é o `tree` que contém a associação "esse nome de arquivo corresponde a esse hash de blob". É por isso que renomear um arquivo sem mudar seu conteúdo não cria nenhum blob novo: apenas o `tree` (e portanto, em cascata, o commit) muda.

## O que `git add` e depois `git commit` realmente fazem

1. `git add arquivo.txt`: calcula o SHA-1 do conteúdo do arquivo, o comprime, o grava como objeto **blob** em `.git/objects/`, e registra uma entrada no **index** (`.git/index`, o nome de arquivo real da área de staging) associando o caminho do arquivo a esse hash de blob.
2. `git commit`: constrói recursivamente os objetos **tree** correspondentes ao estado atual do index (um tree por diretório), cria um objeto **commit** apontando para o tree raiz e para o commit atual de `HEAD` (que se torna seu pai), e depois atualiza a referência da branch atual para que aponte para esse novo commit.

## As refs: simples arquivos de texto

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> apenas 40 caracteres hexadecimais, nada mais
```

Uma branch **não é literalmente nada mais** do que um arquivo contendo um hash de commit. `git branch nova` simplesmente cria um novo arquivo em `.git/refs/heads/`, copiado a partir do commit atual.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD nao contem um hash, mas o CAMINHO para a ref atual
```

`HEAD` é um ponteiro para um ponteiro: trocar de branch (`git checkout outra-branch`) só modifica uma única linha em `.git/HEAD`, que passa a referenciar outro arquivo de `refs/heads/`. Em modo *detached HEAD* (veja [As tags](/?c=git&p=tags)), `.git/HEAD` contém diretamente um hash de commit, sem passar por uma ref nomeada.

## Por que modificar um commit muda todos os seus descendentes

O hash de um commit depende de **todo o seu conteúdo**, incluindo o hash de seu commit pai. Modificar um commit antigo (via um rebase ou um `commit --amend`) então muda seu próprio hash, e como cada commit seguinte referencia o hash de seu pai, o conteúdo deles (e portanto o hash deles também) muda em cascata. É exatamente esse mecanismo que explica por que um [rebase](/?c=git&p=rebase) produz commits com hashes diferentes dos originais, mesmo com conteúdo de arquivo idêntico.

## Objetos isolados vs packfiles

Cada novo objeto começa sua vida como um arquivo comprimido independente ("*loose object*"). Periodicamente (`git gc`, ou automaticamente durante um `push`), o Git agrupa esses objetos em um **packfile**: um único arquivo grande onde objetos semelhantes são armazenados na forma de **deltas** (um objeto completo de referência, e depois uma sequência de diferenças em vez de cópias completas), bem mais compacto para um histórico volumoso.

## Encanamento vs porcelana

Os comandos do dia a dia (`add`, `commit`, `merge`...) são a **porcelana**: uma interface amigável construída inteiramente sobre comandos de nível mais baixo, o **encanamento**, que manipulam diretamente os objetos:

```bash
echo "conteudo" | git hash-object -w --stdin  # cria um blob, exibe seu hash
git cat-file -p a3f9c1d                       # exibe o conteudo descomprimido de um objeto
git cat-file -t a3f9c1d                       # exibe seu tipo (blob/tree/commit/tag)
git write-tree                                # constroi um objeto tree a partir do index atual
git commit-tree a3f9c1d -m "mensagem"         # cria manualmente um objeto commit
git update-ref refs/heads/main a3f9c1d        # move manualmente uma branch para um commit
```

Um `git commit` "normal" não é, por baixo dos panos, nada mais do que um encadeamento de `write-tree`, `commit-tree` e `update-ref`.

## Reescrever todo o histórico: purgar um arquivo de cada commit

Um `rebase` ou um `commit --amend` só reescrevem os commits **depois** do ponto modificado. Às vezes é preciso ir mais longe: retirar um arquivo (segredo, binário grande...) de **cada** commit onde ele existiu, do primeiríssimo ao último: um simples `rm` + novo commit não basta, já que o arquivo continua legível nos commits anteriores.

```bash
git filter-branch --index-filter "git rm --cached --ignore-unmatch secreto.pem" --prune-empty -- --all
```

`--index-filter` reaplica esse comando no index de **cada** commit do histórico (em todas as refs, via `--all`), reconstrói um novo tree sem o arquivo, e depois um novo commit, o que, pela mecânica vista acima (o hash de um commit depende do de seu pai), muda o hash de **todos** os commits a partir do primeiro afetado.

> **Nota:** `git filter-branch` é oficialmente descontinuado em favor do [`git filter-repo`](https://github.com/newren/git-filter-repo) (mais rápido, menos armadilhas), mas este último não vem junto com o Git: instalação separada ([Python](/?c=langages-de-programmation&s=python&p=python)) necessária. `filter-branch` continua disponível em qualquer lugar onde o Git esteja instalado, suficiente para uma operação pontual.

Consequências diretas dessa mudança de hash em cascata:
- Qualquer clone ou fork existente do repositório vai divergir irremediavelmente da nova versão: um push normal será rejeitado, um `push --force`/`--force-with-lease` (veja [Os repositórios remotos](/?c=git&p=remotes)) é necessário, e quem já clonou o repositório precisa re-clonar ou reinicializar drasticamente sua cópia.
- Sempre fazer um backup completo (`git bundle create ... --all`, veja [Os repositórios remotos](/?c=git&p=remotes)) **antes** de lançar uma reescrita desse tipo: um erro no filtro é tão irreversível quanto a operação em si.

## Objetos inacessíveis: uma remoção nunca é imediata

Depois de uma reescrita de histórico (ou um simples `reset --hard`), os commits antigos não são mais referenciados por nenhuma branch, mas seus objetos continuam fisicamente presentes em `.git/objects/`. Dois mecanismos ainda os mantêm vivos:

- `git filter-branch` mantém ele mesmo um backup automático em `refs/original/` (a remover explicitamente com `git update-ref -d refs/original/refs/heads/main`, uma vez certo de não precisar mais dele).
- O **reflog** (veja [Desfazer mudanças e navegar no histórico](/?c=git&p=annuler-et-historique)) guarda um registro de cada commit antigo por várias semanas por padrão, mesmo sem nenhuma ref apontando para ele.

Um objeto só é realmente removido do repositório local quando nada mais o retém:

```bash
git reflog expire --expire=now --all  # esvazia imediatamente o reflog de todas as refs (em vez de esperar a expiracao padrao)
git gc --prune=now                    # remove qualquer objeto que se tornou inacessivel ("unreachable")
git fsck --unreachable                # lista os objetos ainda presentes mas nao referenciados por nenhuma branch/tag/reflog
```

> **Nota:** essa limpeza diz respeito apenas ao repositório **local**. Um repositório remoto ([GitHub](/?c=git&p=github-et-plateformes), GitLab...) aplica seu próprio `gc` conforme seu próprio calendário: depois de um `push --force` que remove um arquivo sensível do histórico, o commit antigo pode continuar acessível do lado do servidor via seu hash exato (uma requisição direcionada, não uma navegação normal) até que o servidor faça sua própria limpeza. Para uma garantia de remoção imediata do lado do servidor, apenas o suporte da plataforma pode agir.

## Projetar seu próprio sistema de controle de versão

Os blocos necessários para um sistema mínimo, nesta ordem lógica:

1. **Um armazenamento chave-valor endereçado por conteúdo**: uma função de hash (SHA-1, ou mais simples para um protótipo) + compressão + um sistema de arquivos ou uma tabela de hash para armazenar cada objeto sob sua própria chave.
2. **Uma estrutura de árvore** para representar um instantâneo completo de uma árvore de diretórios em um dado momento (o `tree`).
3. **Objetos commit encadeados** por um ponteiro para seu(s) pai(s): é essa cadeia que constitui o histórico.
4. **Ponteiros nomeados e mutáveis** (as branches) apontando para um commit, mais um ponteiro especial (`HEAD`) indicando "onde estamos" atualmente.
5. **Um algoritmo de diff**: necessário apenas para exibir diferenças legíveis ou mesclar branches, mas não para o modelo de armazenamento em si, que estruturalmente não precisa dele. [O algoritmo de Myers](https://en.wikipedia.org/wiki/Diff#Algorithm), usado pelo Git, encontra a sequência mais curta de adições/remoções de linhas que transforma um texto em outro: é isso que faz um `git diff` exibir uma mudança mínima e legível em vez de "apagar tudo e reescrever tudo".

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Git armazena cada dado como um objeto identificado pelo hash do seu próprio conteúdo (blob, tree, commit, tag). Os comandos do dia a dia ("porcelana") são apenas uma interface sobre esse modelo de armazenamento de baixo nível ("encanamento"). |
| **Ferramentas utilizáveis** | `git hash-object`, `git cat-file`, `git write-tree`, `git commit-tree`, `git update-ref`, `git fsck --unreachable`. |
| **Armadilhas a evitar** | Reescrever o histórico (`filter-branch`) sem backup prévio: um erro no filtro é tão irreversível quanto a operação em si. |
| **Boas práticas** | Sempre fazer backup (`git bundle`) antes de uma reescrita de histórico; verificar `git fsck --unreachable` antes de supor um objeto definitivamente perdido. |
