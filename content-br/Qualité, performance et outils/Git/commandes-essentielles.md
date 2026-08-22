---
order: 2
---

# Os comandos essenciais

Este capítulo cobre o ciclo de trabalho do Git mais comum: iniciar um repositório (ou recuperar um existente), rastrear modificações, e registrá-las em forma de commits.

## Criar ou recuperar um repositório

```bash
git init                                  # transforma o diretorio atual em um repositorio Git (vazio, sem historico)
git clone https://exemplo.com/projeto.git # recupera um repositorio existente, com todo seu historico
```

## Ver o estado do diretório de trabalho

```bash
git status
```

Exibe quais arquivos estão modificados, quais estão na área de staging, e quais não estão rastreados (veja [Os conceitos básicos do Git](/?c=git&p=concepts-de-base)).

## Adicionar modificações ao staging

```bash
git add arquivo.txt  # adiciona um arquivo especifico
git add diretorio/   # adiciona um diretorio inteiro
git add .            # adiciona tudo que mudou no diretorio atual e seus subdiretorios
git add -p           # modo interativo: escolher precisamente quais blocos de linhas adicionar
```

> **Nota:** `git add .` também adiciona os arquivos não rastreados: garanta que o [.gitignore](/?c=git&p=gitignore) esteja atualizado antes, para não adicionar acidentalmente arquivos que nunca deveriam entrar no histórico (segredos, dependências, arquivos gerados...).

## Criar um commit

```bash
git commit -m "Corrige o calculo do desconto"
git commit -am "Mensagem"   # atalho: adiciona automaticamente os arquivos ja rastreados E modificados, sem "git add" previo
```

> **Nota:** `-a` (em `-am`) só adiciona os arquivos já rastreados pelo Git: um arquivo totalmente novo, nunca adicionado antes, sempre precisa passar por um `git add` explícito pelo menos uma vez.

Uma boa mensagem de commit descreve o **porquê** da mudança, não apenas o quê (o diff já mostra o que mudou), útil para entender o histórico bem depois.

## Uma mensagem de commit em dois níveis: título e descrição

Uma mensagem de commit é, para o Git, apenas um único bloco de texto: nada a força a virar "título" ou "descrição" distintos. É uma **convenção**, não uma restrição técnica, mas ela é tão amplamente adotada ([GitHub](/?c=git&p=github-et-plateformes), `git log`, a maioria das ferramentas que exibem um histórico) que vale a pena segui-la sistematicamente:

- A **primeira linha** é o título: um resumo curto (tradicionalmente abaixo de 50-72 caracteres), no imperativo ("Corrige", "Adiciona", não "Corrigido" nem "Eu adicionei").
- Uma **linha vazia** separa o título do resto.
- Tudo que segue é a **descrição**: o detalhe, o contexto, o "porquê" desenvolvido, em quantas linhas forem necessárias.

```text
Corrige o calculo do desconto para pedidos com varios itens

O percentual so era aplicado ao primeiro item do pedido,
em vez do total: um bug introduzido no ultimo refactor de
`calcularDesconto()`, nunca coberto pelos testes existentes.
```

É essa linha vazia, e somente ela, que indica a uma ferramenta como o [GitHub](/?c=git&p=github-et-plateformes) onde o título termina: na lista de commits de um repositório ou de uma pull request, apenas a primeira linha é exibida por padrão (em negrito); a descrição só aparece ao expandir o commit. `git log --oneline` faz a mesma coisa: uma linha por commit, apenas o título.

## Escrever uma mensagem multilinha na linha de comando

`git commit -m "mensagem"` com um único `-m` só produz um título, sem descrição. Três formas de obter os dois:

```bash
# 1. Sem -m: abre o editor configurado (vim, nano...), onde se digita titulo, linha vazia, e depois descricao
git commit

# 2. Varios -m: cada um se torna um paragrafo separado por uma linha vazia, sem abrir editor
git commit -m "Corrige o calculo do desconto" -m "O percentual so era aplicado ao primeiro item, nao ao total."

# 3. Uma string multilinha passada a um unico -m (util para automatizar um commit, ou a partir de uma ferramenta que gera a mensagem)
git commit -m "$(cat <<'EOF'
Corrige o calculo do desconto

O percentual so era aplicado ao primeiro item, nao ao total.
EOF
)"
```

> **Nota:** a opção 3 (`$(cat <<'EOF' ... EOF)`) não é uma funcionalidade do Git: é um **heredoc**, uma sintaxe do shell (veja [Escrever e executar um script Bash](/?c=shells&s=bash&p=scripts-et-shebang)) que constrói uma string multilinha, depois passada tal como está para `-m`. `$(...)` captura a saída do comando `cat` (aqui, tudo que está entre os dois `EOF`) para injetá-la como um único argumento.

> **Armadilha:** escrever um título de commit longo demais, ou que descreve o *como* em vez do *porquê* ("Modifica linha 42 de carrinho.php"). Um título deve continuar compreensível sozinho, isolado em uma lista de dezenas de outros títulos, sem precisar abrir o commit para entender o que ele faz.
>
> **Boa prática:** reservar o título para um resumo breve e acionável, e detalhar todo contexto útil (por que essa mudança, qual bug, qual alternativa descartada) na descrição em vez de alongar o título indefinidamente.

## Consultar o histórico

```bash
git log                          # historico completo, do mais recente ao mais antigo
git log --oneline                # uma linha por commit, mais legivel para uma visao rapida
git log --oneline --graph --all  # visualiza tambem as branches e seus pontos de divergencia/mesclagem
git log -p arquivo.txt           # historico detalhado (com diff) de um arquivo especifico
```

## Ver as diferenças

```bash
git diff                  # diferencas ainda nao adicionadas ao staging
git diff --staged         # diferencas ja adicionadas ao staging, ainda nao commitadas
git diff commit1 commit2  # diferencas entre dois commits especificos
```

## Ver o detalhe de um commit

```bash
git show a3f9c1d   # exibe a mensagem, o autor, a data e o diff completo desse commit especifico
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `git init`/`clone` criam ou recuperam um repositório; `git add` coloca modificações em staging; `git commit` as registra; `git log`/`diff`/`show` inspecionam o histórico. Uma mensagem de commit tem um título (primeira linha) e uma descrição opcional, separados por uma linha vazia: é essa linha vazia que o GitHub e o `git log` usam para exibir apenas o título por padrão. |
| **Ferramentas utilizáveis** | `git status`, `git add`, `git commit` (vários `-m`, ou sem `-m` para o editor), `git log`, `git diff`, `git show`. |
| **Armadilhas a evitar** | `git add .` também adiciona arquivos não rastreados: verificar o `.gitignore` antes; `-am` não adiciona arquivos nunca rastreados, um `git add` explícito continua necessário pelo menos uma vez; um título de commit longo demais ou que descreve o *como* em vez do *porquê*. |
| **Boas práticas** | Descrever o *porquê* da mudança na mensagem de commit, não apenas o *quê*; verificar `git status` antes de cada commit; manter o título curto e acionável, detalhando o contexto na descrição. |
