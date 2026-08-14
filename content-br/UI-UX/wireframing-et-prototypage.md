---
order: 8
---

# Wireframing e prototipagem

A [pesquisa com usuários](/?c=ui-ux&p=recherche-utilisateur) diz *quem* usa o produto e *qual problema* resolver. Antes de passar para uma tela pronta (cores, tipografia, acabamento visual), uma etapa intermediária verifica se a **estrutura** da tela funciona (o **wireframing**), e depois se o **fluxo** entre as telas funciona (a **prototipagem**).

## O wireframe: a estrutura, sem o visual

Um **wireframe** representa o arranjo dos elementos de uma tela (onde vai o título, onde vai o botão principal, onde vai a lista de resultados) sem nenhuma decisão de estilo: sem cor definitiva, sem fonte escolhida, frequentemente só retângulos e texto de preenchimento:

```text
+------------------------------------------+
| [Logo]              [Busca...]     [Menu] |
+------------------------------------------+
|                                            |
|  Titulo principal                         |
|  Subtitulo descritivo                     |
|                                            |
|  [ Botao de acao principal ]              |
|                                            |
+------------------+------------------------+
|  Filtro A         |  Resultado 1           |
|  Filtro B         |  Resultado 2           |
|  Filtro C         |  Resultado 3           |
+------------------+------------------------+
```

Esse esquema aplica diretamente as alavancas da [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle) (posição, tamanho dos blocos) sem ainda tocar nas alavancas puramente visuais (cor, tipografia): a ideia é validar o arranjo antes de investir tempo no acabamento final, que teria que ser refeito se a estrutura mudasse.

## Os níveis de fidelidade

Um wireframe (ou um protótipo) se apresenta em diferentes níveis de detalhe, cada um adequado a uma pergunta diferente:

| Fidelidade | O que mostra | Custo de modificação | Adequado para verificar |
|---|---|---|---|
| Baixa | Retângulos, texto de preenchimento, arranjo grosseiro | Muito baixo (papel, ou alguns minutos em uma ferramenta) | A estrutura geral e o fluxo lógico |
| Média | Hierarquia real, textos reais, ainda sem estilo visual final | Baixo a moderado | A organização detalhada do conteúdo, os casos limite (texto longo, lista vazia) |
| Alta | Renderização quase final (cores, tipografia, componentes reais) | Alto (cada mudança retoca um visual acabado) | O detalhe das microinterações, a coerência visual final |

> **Armadilha:** apresentar um protótipo de alta fidelidade em um estágio em que só a estrutura ainda precisa ser validada. Uma renderização já polida desvia a atenção dos testadores para a estética ("gostei desse azul") em vez do que ainda importa nesse estágio (o fluxo faz sentido? a informação é encontrada?); e cada mudança de estrutura passa então a custar bem mais para ser aplicada.
>
> **Boa prática:** fazer o nível de fidelidade corresponder à pergunta do momento: baixa fidelidade enquanto a estrutura ainda pode mudar, alta fidelidade só uma vez estabilizada.

## O protótipo clicável: simular o fluxo

Um **protótipo clicável** liga vários wireframes ou telas entre si (um clique em "Ver o produto" leva à tela do produto, um clique em "Voltar" retorna à lista), para que uma pessoa possa *navegar* no produto antes que uma única linha de código real exista:

```text
[Lista de resultados] --clique em um resultado--> [Ficha do produto]
        ^                                                  |
        |                                                  |
        +---------------------clique em "Voltar"-----------+
```

Esse fluxo simulado permite retomar exatamente o método do [teste de usabilidade](/?c=ui-ux&p=recherche-utilisateur) (observar uma pessoa tentando realizar uma tarefa, sem ajudá-la), mas bem antes de o desenvolvimento começar, quando corrigir um problema de fluxo custa apenas um link a redesenhar em vez de uma funcionalidade já codificada a refazer.

> **Armadilha:** prototipar apenas o caminho "ideal" (o que a equipe de projeto tem em mente) e deixar qualquer saída desse caminho levar a uma tela não prevista, ou a nada. Uma pessoa que testa o protótipo quase sempre desvia do caminho previsto em algum momento: é exatamente o que um wireframe em papel ou um protótipo pouco conectado não revela antes da colocação em produção.
>
> **Boa prática:** prototipar também os caminhos secundários plausíveis (uma busca sem resultado, um erro de digitação), não apenas o cenário que funciona de primeira.

## A ida e volta com a pesquisa com usuários

Wireframing/prototipagem e [pesquisa com usuários](/?c=ui-ux&p=recherche-utilisateur) não são duas etapas sequenciais isoladas, mas um ciclo repetido: um protótipo (mesmo de baixa fidelidade) serve de suporte a um novo teste de usabilidade, cujos resultados guiam a versão seguinte do wireframe, testada por sua vez:

```text
Wireframe/prototipo -> Teste de usabilidade -> Constatacoes -> Wireframe revisado -> ...
```

Cada volta desse ciclo custa tanto menos quanto a fidelidade permaneceu baixa: mais uma razão para só aumentar a fidelidade uma vez a estrutura estabilizada por várias voltas desse ciclo.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | O wireframe fixa a estrutura de uma tela sem estilo visual; o protótipo clicável liga várias telas para simular um fluxo completo. Os dois existem em diferentes níveis de fidelidade (baixa/média/alta), cada um adequado a uma pergunta diferente, e se articulam em ciclo com a pesquisa com usuários em vez de uma etapa isolada. |
| **Ferramentas utilizáveis** | Papel e caneta ou uma ferramenta digital para um wireframe de baixa fidelidade; uma ferramenta de prototipagem para ligar várias telas em um fluxo clicável. |
| **Armadilhas a evitar** | Apresentar uma alta fidelidade quando a estrutura ainda precisa mudar. Prototipar apenas o caminho ideal, sem as saídas de fluxo plausíveis. |
| **Boas práticas** | Fazer a fidelidade corresponder à pergunta do momento. Prototipar também os caminhos secundários (erro, resultado vazio). Repetir o ciclo com um teste de usabilidade a cada iteração em vez de uma única vez no fim do projeto. |
