---
order: 4
---

# Ser eficiente no código graças aos atalhos de teclado

Depois de instalar o [VS Code](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide), o mouse continua útil para tudo, mas cada ida e volta até ele custa um tempo que um atalho de teclado economiza. Este capítulo cobre os atalhos do VS Code mais úteis no dia a dia; no macOS, `Ctrl` vira `Cmd` para a maioria deles.

## Navegar na árvore do projeto

| Atalho | Ação |
|---|---|
| `Ctrl+Shift+E` | Abrir/fechar o explorador de arquivos (a árvore do projeto, na lateral) |
| `Ctrl+P` | Abrir um arquivo pelo nome, sem navegar na árvore com o mouse |
| Setas para cima/baixo no explorador | Mover para o arquivo/pasta seguinte ou anterior |
| Seta direita/esquerda sobre uma pasta | Expandir/recolher essa pasta |

`Ctrl+P` é o que mais economiza tempo no dia a dia: digitar algumas letras do nome de um arquivo o abre diretamente, sem nunca expandir a árvore manualmente para encontrá-lo.

## Navegar rapidamente dentro de um arquivo

| Atalho | Ação |
|---|---|
| `Ctrl+G` | Ir diretamente para um número de linha |
| `Ctrl+Shift+O` | Ir a um símbolo do arquivo (uma função, uma classe...) pelo nome |
| `Ctrl+Seta esquerda/direita` | Pular de uma palavra para a seguinte/anterior, em vez de um caractere por vez |
| `Ctrl+Cima/Baixo` (ou `Alt+Seta` dependendo do layout) | Pular para o bloco de código seguinte/anterior |

`Ctrl+Shift+O` se apoia na mesma análise de código que a [detecção de erros de um IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide): o VS Code já sabe onde começa cada função ou classe do arquivo, esse atalho apenas pula até lá diretamente em vez de rolar o arquivo a olho.

## Seleção múltipla e multicursor

O multicursor coloca vários pontos de inserção ativos ao mesmo tempo: uma tecla digitada se aplica então a todos os cursores de uma vez, em vez de apenas um.

```text
Antes (1 cursor)               Depois de Alt+Clique x3 (3 cursores)

nome = "Alice"                  nome = "Alice"
nome2 = "Bob"                   nome2 = "Bob"
nome3 = "Eva"                   nome3 = "Eva"
                                 ^ cada | representa um cursor ativo
```

| Atalho | Ação |
|---|---|
| `Alt+Clique` | Adicionar um cursor no local clicado |
| `Ctrl+D` | Selecionar a próxima ocorrência da palavra já selecionada (repetir para selecionar várias de uma vez) |
| `Ctrl+Shift+L` | Selecionar **todas** as ocorrências da palavra já selecionada no arquivo |
| `Ctrl+Alt+Cima/Baixo` | Adicionar um cursor diretamente acima/abaixo do cursor atual |

> **Cuidado:** usar `Ctrl+D` repetido para renomear uma variável em todos os lugares onde ela aparece no arquivo. Isso é uma renomeação **textual**, às cegas: também afeta um nome de variável que compartilhe o mesmo texto por coincidência dentro de um comentário ou uma string.
>
> **Boa prática:** para renomear uma variável em todos os lugares onde ela realmente é usada no código (sem afetar comentários ou coincidências textuais), usar a renomeação de símbolo do IDE (`F2` no VS Code) em vez do multicursor.

## Gerenciar as abas de arquivos abertos

| Atalho | Ação |
|---|---|
| `Ctrl+W` | Fechar a aba ativa |
| `Ctrl+Shift+T` | Reabrir a última aba fechada |
| `Ctrl+Tab` | Passar para a próxima aba |
| `Ctrl+K` e depois `Ctrl+W` | Fechar todas as abas abertas |

## Pré-visualização de Markdown

Para um arquivo `.md` (como este), `Ctrl+Shift+V` abre uma pré-visualização mostrando o resultado final renderizado (títulos, tabelas, links) ao lado do texto fonte, sem sair do editor para conferir a formatação.

## A paleta de comandos: além dos atalhos fixos

`Ctrl+Shift+P` abre a **paleta de comandos**: uma busca textual que dá acesso a qualquer ação do VS Code, incluindo as que não têm um atalho de teclado dedicado.

> **Boa prática:** diante de uma ação repetida cujo atalho não é conhecido de cor, abrir a paleta de comandos e digitar algumas palavras do que se busca fazer, em vez de procurar com o mouse nos menus. A paleta também mostra o atalho associado ao lado de cada comando encontrado, o que ajuda a memorizá-lo com o uso.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | `Ctrl+P` abre um arquivo pelo nome, `Ctrl+Shift+O` pula para um símbolo do arquivo, `Alt+Clique`/`Ctrl+D` posicionam vários cursores para editar em vários lugares de uma vez, `Ctrl+Shift+P` abre a paleta de comandos que dá acesso a qualquer ação do editor. |
| **Ferramentas utilizáveis** | A paleta de comandos (`Ctrl+Shift+P`) para encontrar uma ação sem conhecer seu atalho. |
| **Armadilhas a evitar** | Renomear uma variável com o multicursor (`Ctrl+D` repetido) em vez da renomeação de símbolo (`F2`): isso também afeta coincidências textuais dentro de comentários e strings. |
| **Boas práticas** | Usar `F2` para uma renomeação de variável confiável. Consultar a paleta de comandos para descobrir e memorizar progressivamente os atalhos. |
