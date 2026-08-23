---
order: 3
---

# Expansão e coringas avançados

O globbing básico (`*`, `?`, `[abc]`) funciona de forma idêntica no zsh (veja [Expansão e coringas](/?c=shells&s=bash&p=expansion-et-jokers) em [Bash](/?c=shells&s=bash&p=bash)). O zsh vai bem mais longe uma vez que o modo estendido está ativado, com padrões que o Bash simplesmente não entende.

## Ativar o globbing estendido

```bash
setopt EXTENDED_GLOB
```

Sem essa opção (veja [O sistema de opções](/?c=shells&s=zsh&p=options-du-shell)), os padrões deste capítulo não são reconhecidos e são tratados como texto literal.

## `**`: busca recursiva em subdiretórios

```bash
ls **/*.txt
# todos os arquivos .txt, em qualquer profundidade abaixo do diretorio atual
```

> **Nota:** em Bash, esse comportamento recursivo exige `shopt -s globstar` (opção equivalente, mas ausente por padrão e específica do Bash 4+); em zsh, `**` funciona assim que `EXTENDED_GLOB` (ou mesmo sem, `**` sozinho já está ativo por padrão na maioria das configurações recentes) está ativo, sem ajuste adicional.

## Negação: excluir um padrão

```bash
ls *.^txt
# todos os arquivos, EXCETO os que terminam em .txt (Bash nao tem equivalente direto)
```

## Os qualificadores de glob: filtrar por tipo ou metadado

Entre parênteses depois de um padrão, um **qualificador** filtra os resultados sem precisar de um comando separado como `find`:

```bash
ls *(.)          # apenas arquivos regulares (nao diretorios, nao links)
ls *(/)          # apenas diretorios
ls *(*)          # apenas arquivos executaveis
ls *(.om[1])     # o arquivo regular modificado mais recentemente (ordenado por data, pega o 1o)
ls *.log(.Lm-7)  # arquivos .log com mais de 7 dias de modificacao
```

| Qualificador | Filtra por... |
|---|---|
| `.` | Apenas arquivos regulares |
| `/` | Apenas diretórios |
| `*` | Arquivos executáveis |
| `@` | Links simbólicos |
| `Lm-N` / `Lm+N` | Modificado há menos de / mais de N dias |
| `om[N]` | Ordena por data de modificação, mantém o N-ésimo resultado |

> **Nota:** esses qualificadores substituem, em muitos casos simples, um `find . -type f` ou um `find . -mtime -7` (veja [Permissões e manipulação de arquivos](/?c=shells&s=bash&p=permissions-et-fichiers) em Bash), diretamente no padrão do glob, sem lançar um comando externo.

## Combinar globbing estendido e aspas

Como em Bash, envolver um padrão em aspas desativa sua interpretação (veja [As variáveis](/?c=shells&s=bash&p=variables) em Bash para a lógica de aspas simples/duplas):

```bash
echo *(.)    # lista real dos arquivos regulares
echo "*(.)"  # exibe literalmente *(.)
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O globbing básico funciona como em Bash; `EXTENDED_GLOB` libera padrões próprios do zsh (`**` recursivo, negação `^`, qualificadores entre parênteses). |
| **Ferramentas utilizáveis** | `**/*.ext` (recursivo), `*.^txt` (negação), qualificadores de glob (`.`, `/`, `*`, `Lm-N`). |
| **Armadilhas a evitar** | Usar esses padrões sem ter ativado `EXTENDED_GLOB`: eles são então tratados como texto literal. |
| **Boas práticas** | Usar um qualificador de glob (`*(.Lm-7)`) em vez de um `find` externo para um filtro simples. |
