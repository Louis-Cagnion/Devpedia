---
order: 5
---

# Transmissão ao vivo e chat em grande escala

O capítulo [CDN e transmissão adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) cobre um vídeo que já existe por inteiro antes de ser assistido (um filme da Netflix, codificado e armazenado com antecedência). Uma transmissão ao vivo (Twitch, mas o princípio se aplica a qualquer live streaming) apresenta um problema diferente: o vídeo ainda não existe quando o espectador o solicita, ele é produzido **neste exato momento**, e precisa chegar a dezenas de milhares de espectadores poucos segundos depois de ter sido filmado.

## O caminho de uma transmissão ao vivo: ingestão, transcodificação, distribuição

```text
Streamer (software de captura)
   |  envia um fluxo de video continuo
   v
Servidor de ingestao (o mais proximo possivel do streamer)
   |  transcodifica ao vivo, em varias qualidades
   v
Rede CDN (mesmos nos usados para um video sob demanda)
   |  transmissao adaptativa, como visto no capitulo anterior
   v
Espectadores (dezenas de milhares, cada um escolhendo sua qualidade)
```

A diferença em relação a um vídeo sob demanda acontece nas duas primeiras etapas: um **servidor de ingestão** recebe continuamente o fluxo bruto enviado pelo streamer, e a **transcodificação** (recodificação em várias qualidades, como na Netflix) precisa acontecer em poucos segundos, continuamente, em vez de uma única vez com antecedência sobre um arquivo já completo.

## O preço do ao vivo: um atraso incompressível

Cada etapa (transcodificação, divisão em segmentos, propagação até o nó de CDN mais próximo do espectador) leva um pouco de tempo. Somadas, essas etapas criam um **atraso de transmissão** (*stream delay*) de vários segundos entre o instante real e o que o espectador vê, mesmo nas melhores condições.

> **Cuidado:** esperar de uma transmissão ao vivo uma latência nula, idêntica a uma conversa cara a cara. A passagem pela transcodificação e pelo CDN, indispensável para atender dezenas de milhares de espectadores ao mesmo tempo, adiciona mecanicamente vários segundos de atraso: é por isso que uma mensagem de chat pode parecer reagir a um evento "antes" de o próprio espectador vê-lo na tela.
>
> **Boa prática:** para uma interação que exige latência mínima entre um pequeno número de participantes (dois jogadores em uma mesma partida, por exemplo), passar por uma conexão direta do tipo [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) em vez do pipeline de vídeo, sem por isso tentar eliminar o atraso do próprio vídeo, estruturalmente incompressível nessa escala.

## O chat: transmitir a mesma mensagem para todo mundo, não um fluxo personalizado

O [feed de notícias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out) constrói um conteúdo **diferente para cada usuário** (as publicações das contas que ele segue). O chat de uma transmissão ao vivo resolve um problema inverso: centenas de milhares de mensagens por segundo, mas **todos os espectadores de um mesmo canal precisam receber exatamente as mesmas mensagens**, na mesma ordem, no mesmo momento.

```text
Espectador 1 ─┐
Espectador 2 ─┼── todos inscritos no mesmo canal
Espectador 3 ─┘

Mensagem enviada -> publicada uma unica vez -> distribuida a todos os inscritos do canal simultaneamente
```

Esse modelo se chama **publicação/assinatura** (*publish/subscribe*, ou *pub/sub*): cada espectador se inscreve no canal da transmissão que assiste, e cada mensagem é processada apenas uma vez pelo servidor e depois reenviada a todos os inscritos, em vez de ser recalculada individualmente para cada um.

| | Feed de notícias (fan-out) | Chat de uma transmissão ao vivo (pub/sub) |
|---|---|---|
| Conteúdo recebido | Diferente para cada usuário (conforme quem ele segue) | Idêntico para todos os inscritos de um mesmo canal |
| O que varia | A lista de contas seguidas | Nada: todo mundo recebe tudo |

## O que reter

| | |
|---|---|
| **O que reter** | Uma transmissão ao vivo adiciona uma etapa de ingestão e uma transcodificação contínua antes de chegar ao mesmo CDN que um vídeo sob demanda, o que cria um atraso de transmissão incompressível de alguns segundos. O chat associado transmite a mesma mensagem a todos os inscritos de um canal (pub/sub), ao contrário de um feed de notícias que personaliza o conteúdo por usuário (fan-out). |
| **Ferramentas úteis** | Um WebSocket para uma interação que exige latência mínima, independente do atraso do vídeo. |
| **Armadilhas a evitar** | Esperar latência nula de uma transmissão ao vivo distribuída em grande escala. |
| **Boas práticas** | Separar as interações de baixa latência (WebSocket direto) do pipeline de vídeo, sem tentar reduzir o atraso estrutural deste último. |
