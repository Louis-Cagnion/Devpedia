---
order: 11
---

# A arquitetura interna do Git

Os comandos abordados nos outros capítulos (`add`, `commit`, `branch`...) são apenas a parte visível («porcelana») de um mecanismo de armazenamento surpreendentemente simples: uma base de dados chave-valor **endereçada por conteúdo**, em que a chave de cada dado é o hash do seu próprio conteúdo. Compreender este modelo permite «ver através» de qualquer comando Git e fornece os elementos necessários para conceber um sistema de controle de versões semelhante.

## Uma base de dados indexada por conteúdo

Cada dado armazenado pelo Git (o conteúdo de um arquivo, uma estrutura de pastas, um commit...) é guardado sob a forma de um **objeto**, identificado exclusivamente pelo hash SHA-1 do seu próprio conteúdo:

```
contenu -> SHA-1(contenu) -> clé de stockage
```

```bash
echo "Bonjour" | git hash-object --stdin
# c6b7f... -> sempre o mesmo hash para o mesmo conteúdo, independentemente de onde ou quando
```

> **Nota:** uma **função de hash** (neste caso, SHA-1) transforma uma entrada de qualquer tamanho num número de tamanho fixo, de forma determinística (a mesma entrada → sempre o mesmo resultado) e bem distribuída (dois conteúdos, mesmo que muito semelhantes, produzem resultados muito diferentes: é isso que torna uma colisão acidental extremamente improvável). Consulte o capítulo sobre tabelas de hash (secção C) para conhecer este mecanismo aplicado a uma estrutura de dados concreta.

Concretamente, cada objeto é comprimido (zlib, um algoritmo de compressão sem perdas) e armazenado n`.git/objects/`, num caminho derivado do seu hash: os dois primeiros caracteres hexadecimais formam uma subpasta, os 38 restantes constituem o nome do arquivo (`.git/objects/c6/b7f4a2...`). Trata-se, nem mais nem menos, de uma **tabela de hash** (ver capítulo dedicado, secção C) armazenada diretamente no sistema de arquivos: a subpasta desempenha o papel de um compartimento (*bucket*).

> **Consequência direta:** dois arquivos com conteúdo estritamente idêntico produzem o **mesmo** hash e, portanto, o **mesmo** objeto armazenado uma única vez: uma deduplicação automática e gratuita, propriedade inerente ao modelo, e não uma otimização adicionada posteriormente.

## Os quatro tipos de objetos

| Tipo | Conteúdo |
|---|---|
| **blob** | O conteúdo bruto de um arquivo: apenas os bytes, sem nome de arquivo nem metadados |
| **tree** | Uma lista de entradas (modo, tipo, nome, hash): representa uma pasta, sendo que cada entrada aponta para um blob (arquivo) ou para outra árvore (subpasta) |
| **commit** | Um hash da árvore (instantâneo raiz), um ou mais hashes de commits pai(s), autor, data, mensagem |
| **tag** (anotada) | Um hash de um objeto de destino (geralmente um commit), uma mensagem (utilizada por `git tag -a`) |

```
commit ---> tree (racine du projet)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (parent)
```

> **Nota:** um blob não conhece o seu próprio nome de arquivo: é o `tree` que contém a associação «este nome de arquivo corresponde a este hash de blob». É por isso que renomear um arquivo sem alterar o seu conteúdo não cria nenhum blob novo: apenas o `tree` (e, consequentemente, o commit) é alterado.

## O que faz realmente `git add` e, posteriormente, `git commit`

1. `git add arquivo.txt`: calcula o SHA-1 do conteúdo do arquivo, comprime-o, grava-o como um objeto **blob** em `.git/objects/` e regista uma entrada no índice (`.git/índice`, o nome verdadeiro do arquivo na área de staging) associando o caminho do arquivo a esse hash do blob.
2. `git commit`: constrói recursivamente os objetos **«tree»** correspondentes ao estado atual do índice (uma «tree» por pasta), cria um objeto **«commit»** que aponta para a «tree» raiz e para o «commit» atual de `HEAD` (que se torna o seu pai) e, em seguida, atualiza a referência do ramo atual para que aponte para este novo «commit».

## As referências: simples arquivos de texto

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> apenas 40 caracteres hexadecimais, nada mais
```

Um ramo não é, **literalmente, mais do que** um arquivo que contém um hash de um commit. O comando «`git branch nouvelle`» cria simplesmente um novo arquivo em «`.git/refs/heads/`», copiado a partir do commit atual.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD não contém um hash, mas sim o CAMINHO para a referência atual
```

`HEAD` é um ponteiro para um ponteiro: mudar de ramo (`git checkout autre-branche`) altera apenas uma linha em `.git/HEAD`, que passa a referenciar outro arquivo de `refs/heads/`. No modo *detached HEAD* (ver capítulo sobre as tags), `.git/HEAD` contém diretamente um hash de commit, sem passar por uma referência nomeada.

## Por que razão a alteração de um commit altera todos os seus descendentes

O hash de um commit depende de **todo o seu conteúdo**, incluindo o hash do seu commit pai. Alterar um commit antigo (através de um rebase ou de um «`commit --amend`») altera, portanto, o seu próprio hash; e, como cada commit seguinte faz referência ao hash do seu pai, o seu conteúdo (e, consequentemente, também os seus próprios hashes) altera-se em cadeia. É precisamente este mecanismo que explica por que razão um rebase (ver capítulo dedicado) produz commits com hashes diferentes dos originais, mesmo que o conteúdo dos arquivos seja idêntico.

## Objetos isolados vs. arquivos de pacote

Cada novo objeto começa a sua existência como um arquivo comprimido independente («*loose object*»). Periodicamente (por `git gc` ou automaticamente durante um «`push`»), o Git agrupa esses objetos num **«packfile**»: um único arquivo grande onde os objetos semelhantes são armazenados na forma de **deltas** (um objeto de referência completo, seguido de uma sequência de diferenças, em vez de cópias completas), o que é muito mais compacto para um histórico volumoso.

## Canalização vs. porcelana

Os comandos do dia-a-dia (`add`, `commit`, `merge`...) são a **«porcelana**»: uma interface intuitiva construída inteiramente sobre comandos de nível mais baixo, a **«canalização»**, que manipulam diretamente os objetos:

```bash
echo "contenu" | git hash-object -w --stdin   # cria um blob, apresenta o seu hash
git cat-file -p a3f9c1d                        # exibe o conteúdo descompactado de um objeto
git cat-file -t a3f9c1d                        # indica o seu tipo (blob/árvore/commit/tag)
git write-tree                                  # constrói um objeto «tree» a partir do índice atual
git commit-tree a3f9c1d -m "message"             # cria manualmente um objeto commit
git update-ref refs/heads/main a3f9c1d           # desloca manualmente um ramo para um commit
```

Um «`git commit`» «normal» não é, nos bastidores, mais do que uma sequência de `write-tree`, `commit-tree` e `update-ref`.

## Criar o seu próprio sistema de controle de versões

Os componentes necessários para um sistema mínimo, nesta ordem lógica:

1. **Um armazenamento chave-valor endereçado por conteúdo**: uma função de hash (SHA-1, ou mais simples para um protótipo) + compressão + um sistema de arquivos ou uma tabela de hash para armazenar cada objeto sob a sua própria chave.
2. **Uma estrutura em árvore** para representar um instantâneo completo de uma árvore de pastas num determinado momento (o «`tree`»).
3. **Objetos de commit encadeados** por um ponteiro para o(s) seu(s) pai(s): é esta cadeia que constitui o histórico.
4. **Ponteiros nomeados e mutáveis** (os «branches») que apontam para um commit, além de um ponteiro especial (`HEAD`) que indica «em que ponto estamos» atualmente.
5. **Um algoritmo de comparação** (por exemplo, o algoritmo de Myers): necessário apenas para apresentar diferenças legíveis ou para fundir ramos, mas não para o próprio modelo de armazenamento, que, estruturalmente, não necessita dele.
