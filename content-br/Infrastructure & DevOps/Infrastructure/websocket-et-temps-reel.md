---
order: 2
---

# WebSocket: a comunicação em tempo real

[HTTP](/?c=infrastructure&p=api-et-http) responde bem a uma demanda pontual, mas continua mal adaptado a um fluxo contínuo em que o servidor precisa poder falar **sem esperar uma pergunta**: uma mensagem de chat que chega, o placar de uma partida que muda para outro jogador, uma notificação em tempo real. O **WebSocket** responde a essa necessidade específica com uma conexão que permanece aberta, nos dois sentidos, em vez de uma ida e volta a cada troca.

## O problema: o HTTP foi pensado para uma pergunta, não para um fluxo

Com o [HTTP](/?c=infrastructure&p=api-et-http) sozinho, o servidor nunca pode iniciar um envio: ele apenas responde a uma requisição do cliente. Simular um fluxo em tempo real exige, portanto, **perguntar de novo** em loop:

```text
Polling (consultar em intervalos regulares):

Cliente -> GET /novas-mensagens -> Servidor: nada de novo
Cliente -> GET /novas-mensagens -> Servidor: nada de novo
Cliente -> GET /novas-mensagens -> Servidor: 1 nova mensagem!
```

Cada requisição recria uma conexão, com seus cabeçalhos e sua negociação, para um resultado quase sempre vazio: ou o intervalo é curto e a maioria das requisições não serve para nada, ou é longo e a atualização chega atrasada.

## WebSocket: uma conexão que permanece aberta

Uma conexão WebSocket começa como uma requisição [HTTP](/?c=infrastructure&p=api-et-http) normal, com um cabeçalho `Upgrade: websocket` que pede ao servidor para evoluir essa mesma conexão TCP para um protocolo diferente, em vez de fechar uma e abrir outra:

```text
Cliente                                   Servidor
  ---- GET /chat  Upgrade: websocket -->
  <--- 101 Switching Protocols ---------

  (a partir daqui: a conexao permanece aberta, nos dois sentidos)

  ---- mensagem "Ola" ------------------>
  <--- mensagem "Oi!" -------------------
  <--- mensagem "Um terceiro acabou de chegar" ---   (o servidor inicia, sem requisicao previa)
```

Uma vez estabelecida a conexão, cada parte pode enviar uma mensagem a qualquer momento, sem que a outra tenha pedido nada: é exatamente isso que o [HTTP](/?c=infrastructure&p=api-et-http) sozinho não permite.

> **Nota:** a troca inicial ("handshake") usa o [HTTP](/?c=infrastructure&p=api-et-http), o que permite a uma conexão WebSocket passar pelas mesmas portas (80/443) e pela maior parte da mesma infraestrutura de rede (proxies, firewalls) que um tráfego web comum; só a conexão, uma vez estabelecida, muda para um protocolo diferente.

## Socket.IO: uma biblioteca construída sobre o protocolo WebSocket

O **Socket.IO** não é sinônimo de WebSocket, mas uma biblioteca construída sobre ele, que adiciona o que o protocolo bruto não fornece:

| | WebSocket (protocolo bruto) | Socket.IO (biblioteca) |
|---|---|---|
| Nível | Protocolo de rede padronizado | Biblioteca, com um servidor e um cliente dedicados |
| Fallback se a conexão falhar | Nenhum | Recai automaticamente para *long-polling* se o WebSocket estiver indisponível |
| Reconexão | Precisa ser gerenciada manualmente | Automática, com reentrega dos eventos perdidos conforme a configuração |
| Modelo | Enviar/receber mensagens brutas (texto ou binário) | Emitir **eventos** nomeados, com dados estruturados, opcionalmente agrupados em salas (*rooms*) |

> **Cuidado:** supor que um cliente WebSocket bruto pode se conectar diretamente a um servidor Socket.IO (ou o inverso). O Socket.IO adiciona sua própria camada de protocolo sobre o WebSocket (identificação de eventos, confirmações de recebimento): um cliente que só fala o protocolo WebSocket padrão não entende essas mensagens, mesmo que a conexão inicial se estabeleça sem erro.
>
> **Boa prática:** escolher WebSocket bruto para uma necessidade simples e controle total sobre o formato das mensagens; escolher Socket.IO (ou uma biblioteca equivalente) assim que a reconexão automática, o fallback de compatibilidade ou um modelo por eventos nomeados economizarem um tempo real de desenvolvimento, aceitando a dependência dessa biblioteca nos dois lados (servidor e cliente).

## Um caso de uso concreto: o loop de jogo autoritário do lado do servidor

Em um jogo multijogador em tempo real (um jogo de bolinha tipo Pong, por exemplo), o servidor não se limita a retransmitir mensagens: ele executa sua própria simulação do jogo (posição da bola, colisões, placar) em intervalos regulares, e só aceita dos clientes suas **entradas** (teclas pressionadas), nunca sua posição. Esse é o modelo de **servidor autoritário**: a posição real do jogo só existe em um único lugar (o servidor), o que impede um cliente de trapacear anunciando ele mesmo uma posição falsa.

```text
Cliente A -- entradas (cima/baixo) -->
Cliente B -- entradas (cima/baixo) -->   Servidor: simula o jogo em um ritmo fixo (ex. 60 Hz)
                                          (posicao, colisoes, placar...), depois
                                          transmite o estado obtido via WebSocket

Os clientes nunca enviam sua propria posicao: eles recebem o estado e apenas o exibem.
```

## O ritmo de simulação (tick rate) pode diferir do ritmo de emissão

O loop de simulação roda em um intervalo fixo (o **tick**, por exemplo a cada 1/60 de segundo, ou seja 60 Hz), tipicamente via um temporizador repetido (`setInterval`). Mas nada obriga a enviar o estado do jogo em cada tick: transmitir um tick a cada dois, por exemplo, reduz a metade a largura de banda de rede sem perder precisão de cálculo, já que a simulação continua rodando a todo vapor.

| | Tick rate (simulação) | Emit rate (transmissão de rede) |
|---|---|---|
| Papel | Calcular o próximo estado do jogo | Enviar esse estado aos clientes via WebSocket |
| Pode ser mais rápido que o outro? | Sim, sempre pelo menos tão rápido | Não, nunca mais rápido que o tick rate |
| Custo se muito alto | Carga de CPU do servidor | Largura de banda de rede |

> **Cuidado:** calcular o deslocamento de um tick a partir de um tempo decorrido (`dt`) sem limite. Se o servidor desacelerar momentaneamente (um pico de carga, uma pausa do coletor de lixo), o `dt` do tick seguinte pode ficar anormalmente grande, fazendo um objeto atravessar uma parede que, em um ritmo normal, teria sido parado pela colisão em um tick intermediário.
>
> **Boa prática:** limitar `dt` a um valor máximo razoável (por exemplo nunca mais de 50 ms simulados de uma vez, mesmo que o tick real tenha demorado mais), para que a simulação permaneça consistente mesmo após uma desaceleração momentânea do servidor.

## Quando o WebSocket é a resposta certa, quando outra solução basta

| Necessidade | Solução adequada |
|---|---|
| O cliente pede, o servidor responde uma vez | [HTTP](/?c=infrastructure&p=api-et-http) clássico |
| Um serviço terceiro precisa notificar o outro sobre um evento pontual, servidor a servidor | Um *webhook* ([HTTP](/?c=infrastructure&p=api-et-http) simples, disparado pelo evento) |
| As duas partes precisam poder trocar mensagens continuamente, sem latência de espera | WebSocket |

Um *webhook* parece tempo real do lado do servidor (ele notifica sem requisição explícita), mas continua sendo uma requisição [HTTP](/?c=infrastructure&p=api-et-http) pontual e de mão única: ele não mantém nenhuma conexão aberta, ao contrário do WebSocket.

## O que reter

| | |
|---|---|
| **O que reter** | O WebSocket transforma uma conexão HTTP inicial em uma conexão bidirecional que permanece aberta, permitindo ao servidor enviar uma mensagem sem requisição prévia do cliente. O Socket.IO é uma biblioteca construída sobre esse protocolo, que adiciona fallback automático, reconexão e um modelo por eventos nomeados. |
| **Ferramentas úteis** | WebSocket bruto para controle total e uma necessidade simples; Socket.IO (ou equivalente) quando a reconexão automática e o fallback de compatibilidade valem a dependência adicionada. |
| **Armadilhas a evitar** | Simular tempo real por polling repetido, caro e atrasado. Conectar um cliente WebSocket bruto a um servidor Socket.IO esperando que eles se entendam nativamente. Calcular um tick de simulação com um `dt` sem limite. |
| **Boas práticas** | Reservar o WebSocket para trocas realmente bidirecionais e contínuas; um webhook HTTP simples é suficiente para uma notificação pontual servidor a servidor. Em um jogo ou simulação multijogador, manter o servidor autoritário e desacoplar o tick rate do emit rate. |
