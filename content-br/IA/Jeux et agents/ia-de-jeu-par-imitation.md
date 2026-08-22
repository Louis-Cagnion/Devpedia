---
order: 1
---

# IA de jogo por imitação: aprender com um jogador humano

Um adversário controlado pelo computador (um **bot**) pode ser construído de duas formas fundamentalmente diferentes: **roteirizado** (um desenvolvedor escreve à mão as regras de decisão: "se o inimigo estiver visível, atirar") ou **aprendido por imitação** (o comportamento é deduzido automaticamente de gravações de partidas jogadas por humanos, sem que ninguém escreva a regra explicitamente).

## Bot roteirizado vs bot aprendido por imitação

| | Bot roteirizado | Bot aprendido por imitação |
|---|---|---|
| Origem do comportamento | Regras escritas à mão por um desenvolvedor | Deduzido de gravações de partidas humanas |
| Realismo | Muitas vezes reconhecível como "artificial" (padrões repetitivos) | Pode reproduzir hábitos e imperfeições humanas |
| Custo de criação | Escrever e manter cada regra | Coletar dados de jogo, depois treinar um modelo |
| Comportamento diante de uma situação nunca prevista | Segue a regra mais próxima, previsível | Imprevisível: o modelo nunca "viu" essa situação no treinamento |

## Gravar partidas para transformá-las em dados de treinamento

O princípio retoma o do aprendizado supervisionado (veja [Redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)): cada instante de uma partida humana se torna um exemplo de treinamento, onde o **estado do jogo** naquele instante (posição dos jogadores, munição restante, o que o jogador vê na tela...) é associado à **ação** que o jogador realmente realizou naquele momento (atirar, se mover, mirar em tal direção).

```text
Partida humana gravada, instante a instante:

Estado do jogo (entrada)          Acao do jogador (saida esperada)
------------------------          -----------------------------------
inimigo visivel, 30 municoes   -> atirar
inimigo fora de vista            -> mover-se ate o ponto A
saude baixa                      -> recuar
```

Milhares desses pares (estado, ação) formam o conjunto de dados. O modelo aprende a prever a ação mais provável a partir de um estado dado, exatamente como um modelo de classificação de imagens aprende a prever uma categoria a partir de pixels.

> **Cuidado:** coletar partidas de um único jogador, ou de um estilo de jogo homogêneo demais. O modelo reproduz então fielmente os hábitos daquele jogador específico (defeitos inclusos), em vez de um comportamento representativo de um adversário humano "genérico".
>
> **Boa prática:** diversificar as fontes de gravação (vários jogadores, vários níveis de habilidade, vários estilos) para que o modelo generalize além dos hábitos de um único indivíduo.

## A armadilha da generalização: uma situação nunca vista

Um modelo treinado por imitação só sabe reagir a situações suficientemente próximas das vistas nos dados de treinamento. Uma configuração de jogo inédita (um mapa nunca jogado nas gravações, uma combinação de itens rara) pode produzir uma ação absurda, sem que exista nenhuma regra explícita para corrigi-la, ao contrário de um bot roteirizado que sempre segue sua regra mais próxima mesmo em um caso raro.

> **Cuidado:** supor que um modelo treinado sobre um conteúdo de jogo (um mapa, um modo) se comportará corretamente sobre um conteúdo diferente, nunca visto no treinamento.
>
> **Boa prática:** testar explicitamente o bot em conteúdo ausente dos dados de treinamento antes de implantá-lo, em vez de supor que o comportamento aprendido generaliza automaticamente.

## Simular a imperfeição humana: a degradação voluntária de precisão

Um modelo treinado para maximizar sua precisão pode acabar mirando com uma exatidão quase perfeita, um comportamento que não se parece com nenhum jogador humano real e que faz o adversário ser percebido como injusto em vez de crível. Uma técnica corrige esse descompasso: degradar voluntariamente a precisão do bot, por exemplo adicionando ruído aleatório à direção da mira ou simulando um tempo de reação variável, para imitar a fadiga e a imperfeição de um jogador humano em vez da perfeição mecânica de um algoritmo.

```text
Precisao do modelo "bruta"       ->  quase perfeita, percebida como "trapaca"
Precisao + ruido aleatorio       ->  variavel, parece um jogador humano fatigavel
```

> **Boa prática:** calibrar esse ruído conforme o nível de dificuldade desejado (mais ruído = adversário mais fácil), em vez de aplicar um valor fixo único para todos os níveis.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um bot aprendido por imitação deduz seu comportamento de gravações de partidas humanas (pares estado → ação), em vez de regras escritas à mão. Ele generaliza mal para uma situação ausente dos dados de treinamento. Degradar voluntariamente sua precisão (ruído, tempo de reação variável) o torna mais crível que uma precisão mecânica perfeita. |
| **Ferramentas utilizáveis** | Um modelo de classificação que prevê uma ação a partir de um estado de jogo, treinado sobre pares (estado, ação) gravados. |
| **Armadilhas a evitar** | Treinar sobre as partidas de um único jogador. Implantar um bot em conteúdo nunca visto no treinamento sem testá-lo antes. |
| **Boas práticas** | Diversificar as fontes de gravação. Testar em conteúdo inédito antes da implantação. Adicionar ruído à precisão para simular a imperfeição humana, calibrado conforme o nível de dificuldade desejado. |
