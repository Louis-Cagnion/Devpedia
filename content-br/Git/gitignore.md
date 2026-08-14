---
order: 3
---

# O arquivo .gitignore

`.gitignore` lista os arquivos e diretórios que o Git deve **ignorar**: nunca sugerir para adicionar, nunca rastrear, mesmo com um `git add .`. Indispensável para não poluir o histórico com arquivos gerados, dependências, ou segredos.

## Sintaxe básica

```text
# Comentario
*.log              # ignora todos os arquivos terminados em .log, onde estiverem
node_modules/       # ignora esse diretorio inteiro, na raiz ou em qualquer lugar
/build              # o '/' como prefixo restringe apenas a raiz do repositorio
.env                # ignora esse arquivo especifico
!important.log      # excecao: NAO ignorar esse arquivo especifico, apesar da regra *.log acima
```

| Padrão | Significado |
|---|---|
| `*.ext` | Qualquer arquivo com essa extensão, em qualquer nível |
| `diretorio/` | Esse diretório e todo seu conteúdo |
| `/caminho` | Apenas na raiz do repositório (não em um subdiretório de mesmo nome) |
| `!padrão` | Exceção a uma regra anterior |

## O que tipicamente se deve ignorar

- As dependências instaladas (`node_modules/`, `vendor/`), reconstruíveis a partir de um arquivo de dependências (`package.json`, `composer.json`...).
- Os arquivos de configuração contendo segredos (`.env`, chaves de API...).
- Os arquivos gerados pela compilação ou pelo build (`*.o`, `dist/`, `build/`).
- Os arquivos próprios de um editor ou sistema operacional (`.DS_Store`, `.vscode/`, `*.swp`).

## `.gitignore` só age sobre arquivos **nunca rastreados**

```bash
git rm --cached arquivo_ja_rastreado.txt
```

> **Nota:** adicionar um arquivo ao `.gitignore` **não tem nenhum efeito** se ele já estiver rastreado pelo Git (já commitado pelo menos uma vez): o Git continua rastreando suas modificações como antes. É preciso primeiro removê-lo explicitamente do rastreamento com `git rm --cached` (que o deixa intacto no disco, mas para de rastreá-lo), antes que a regra do `.gitignore` faça efeito.

## Escopo do `.gitignore`

Um repositório pode conter vários arquivos `.gitignore`, cada um se aplicando ao diretório onde se encontra e a seus subdiretórios, útil para regras específicas de um subprojeto, além das regras globais na raiz.

## Regras pessoais, fora do repositório: `~/.gitignore_global`

Um `.gitignore` clássico (visto acima) é um arquivo do projeto como qualquer outro: ele próprio é rastreado e commitado, portanto compartilhado com todos os colaboradores. Isso é um problema para arquivos que dependem apenas da **sua própria máquina** (os arquivos temporários de um editor que só você usa, por exemplo): adicioná-los ao `.gitignore` do projeto imporia essa regra a colegas que talvez não usem o mesmo editor.

A solução é um segundo arquivo, colocado fora de qualquer repositório, no seu diretório pessoal:

```bash
# 1. Criar o arquivo, onde voce quiser (ex. o diretorio pessoal)
echo ".idea/" > ~/.gitignore_global
echo "*.swp" >> ~/.gitignore_global

# 2. Dizer ao Git, de uma vez por todas, onde encontra-lo
git config --global core.excludesfile ~/.gitignore_global
```

`git config --global` (veja também o capítulo [Os remotes](/?c=git&p=remotes) para outras configurações `--global`) grava essa configuração em `~/.gitconfig`, um arquivo de configuração próprio da sua conta de usuário nessa máquina, fora de qualquer repositório Git: `core.excludesfile` indica ali ao Git a localização de um `.gitignore` adicional a aplicar a **todos os seus repositórios locais**, além do `.gitignore` próprio de cada um.

| | `.gitignore` (no repositório) | `~/.gitignore_global` |
|---|---|---|
| Rastreado pelo Git, commitado | Sim | Não: nunca é colocado dentro de um repositório |
| Visível para os outros colaboradores | Sim, assim que clonam o projeto | Não: a configuração vive em `~/.gitconfig`, própria da sua máquina |
| Escopo | Um único projeto (e seus subdiretórios) | Todos os repositórios Git da sua máquina |
| Conteúdo típico | Dependências, segredos, arquivos de build do projeto | Arquivos próprios do seu editor/SO (`.idea/`, `.DS_Store`, `*.swp`) |

É essa diferença (arquivo rastreado e compartilhado vs configuração local à máquina) que explica por que uma regra colocada em `~/.gitignore_global` nunca aparece para os outros colaboradores, mesmo depois de um `git push`: ela nunca foi commitada, já que não vive no repositório.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `.gitignore` exclui arquivos do rastreamento do Git: nunca são sugeridos para adição, mesmo com `git add .`. As regras se aplicam por diretório, com `!padrão` para criar exceções. |
| **Ferramentas utilizáveis** | Padrões `*.ext`, `diretorio/`, `/caminho`, `!padrão`; `git rm --cached` para retirar do rastreamento um arquivo já rastreado. |
| **Armadilhas a evitar** | Adicionar um arquivo ao `.gitignore` **não tem nenhum efeito** se ele já está rastreado (já commitado): é preciso primeiro `git rm --cached` antes que a regra faça efeito. |
| **Boas práticas** | Excluir dependências, segredos e arquivos gerados já na criação do repositório, antes do primeiríssimo commit. |
