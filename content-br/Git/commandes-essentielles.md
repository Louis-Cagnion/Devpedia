---
order: 2
---

# Os comandos essenciais

Este capítulo aborda o ciclo de trabalho mais comum do Git: inicializar um repositório (ou recuperar um já existente), acompanhar as alterações e registá-las sob a forma de commits.

## Criar ou recuperar um repositório

```bash
git init                              # transforma a pasta atual num repositório Git (vazio, sem histórico)
git clone https://exemple.com/projet.git   # recupera um repositório existente, com todo o seu histórico
```

## Ver o estado do dossier de trabalho

```bash
git status
```

Mostra quais os arquivos que foram alterados, quais se encontram na área de staging e quais não estão sendo acompanhados (ver capítulo sobre conceitos básicos).

## Adicionar alterações ao ambiente de teste

```bash
git add arquivo.txt        # adiciona um arquivo específico
git add pasta/            # adiciona uma pasta inteira
git add .                   # adiciona tudo o que foi alterado na pasta atual e nas suas subpastas
git add -p                  # modo interativo: escolher com precisão quais os blocos de linhas a adicionar
```

> **Nota:** O comando «`git add .`» também adiciona arquivos não controlados — certifique-se de que o arquivo «`.gitignore`» (ver capítulo dedicado) está atualizado antes de executar o comando, para não adicionar acidentalmente arquivos que nunca devem entrar no histórico (informações confidenciais, dependências, arquivos gerados...).

## Criar um commit

```bash
git commit -m "Corrige le calcul de la remise"
git commit -am "Message"   # atalho: adiciona automaticamente os arquivos já monitorizados E modificados, sem necessidade de um «git add» prévio
```

> **Nota:** «`-a`» (em «`-am`») apenas adiciona os arquivos já controlados pelo Git — um arquivo totalmente novo, que nunca tenha sido adicionado anteriormente, deve sempre passar por um comando «`git add`» explícito, pelo menos uma vez.

Uma boa mensagem de commit descreve o **motivo** da alteração, e não apenas o que foi alterado (o diff já mostra o que mudou) — útil para compreender o histórico muito tempo depois.

## Consultar o histórico

```bash
git log                     # histórico completo, do mais recente ao mais antigo
git log --oneline            # uma linha por commit, mais legível para uma análise rápida
git log --oneline --graph --all   # também visualiza as ramificações e os seus pontos de divergência/fusão
git log -p arquivo.txt        # histórico detalhado (com diff) de um arquivo específico
```

## Ver as diferenças

```bash
git diff                     # diferenças ainda não adicionadas ao ambiente de teste
git diff --staged             # alterações já adicionadas ao ambiente de teste, mas ainda não submetidas
git diff commit1 commit2      # diferenças entre dois commits específicos
```

## Ver os detalhes de um commit

```bash
git show a3f9c1d   # apresenta a mensagem, o autor, a data e o diff completo deste commit específico
```
