---
order: 2
---

# Microsserviços: dividir uma aplicação em serviços independentes

[Responsabilidade única e baixo acoplamento](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) se aplica a uma função ou um arquivo; a arquitetura de **microsserviços** aplica a mesma ideia na escala de uma aplicação inteira: em vez de um único programa que gerencia todos os domínios de negócio, vários **serviços** independentes, cada um responsável por um único domínio, comunicando-se entre si pela rede em vez de compartilhar memória ou um banco de dados.

## Do monolito aos serviços separados

Um **monolito** reúne todo o código aplicativo (catálogo, carrinho, pagamento, notificações...) em um único programa, implantado como uma única unidade:

```text
Monolito:                            Microsserviços:

+----------------------+             +-----------+   +-----------+
|  Catálogo            |             | Catálogo  |   | Carrinho  |
|  Carrinho             |             +-----------+   +-----------+
|  Pagamento            |                   |               |
|  Notificações         |             +-----------+   +---------------+
+----------------------+             | Pagamento |   | Notificações  |
   (uma única implantação)            +-----------+   +---------------+
                                        (uma implantação por serviço, conectadas pela rede)
```

Cada serviço pode ser escrito em uma linguagem diferente, implantado e escalado de forma independente dos outros, e modificado sem reimplantar a aplicação inteira: exatamente a mesma intenção de uma [responsabilidade única](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) no nível de um arquivo, transposta para o nível da implantação.

## Cada serviço possui seus próprios dados

Um serviço nunca deve ler ou escrever diretamente no banco de dados de outro: ele passa pela [API](/?c=infrastructure&p=api-et-http) que esse outro serviço expõe, nunca por um acesso direto ao seu armazenamento.

> **Armadilha:** deixar vários serviços acessarem diretamente um mesmo banco de dados compartilhado "para simplificar". Isso recria exatamente o acoplamento que um arquivo que compartilha uma [constante entre dois mecanismos independentes](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) já provoca em pequena escala: uma mudança de esquema em um serviço quebra silenciosamente outro serviço que lia diretamente essa tabela, sem que nenhuma chamada de API torne isso visível na leitura do código.
>
> **Boa prática:** cada serviço possui seu próprio banco de dados (ou seu próprio esquema isolado), inacessível diretamente pelos outros; qualquer dado necessário a outro serviço passa por uma [API](/?c=infrastructure&p=api-et-http) explícita.

## Comunicar entre serviços: síncrono ou assíncrono

| | Chamada síncrona (HTTP/API) | Mensagem assíncrona (fila de mensagens) |
|---|---|---|
| Princípio | O serviço chamador espera a resposta antes de continuar | O serviço deposita uma mensagem e continua sem esperar que ela seja processada |
| Acoplamento de disponibilidade | O serviço de pagamento indisponível faz o pedido falhar imediatamente | A mensagem espera na fila até que o serviço de pagamento esteja disponível novamente |
| Simplicidade | Mais simples de seguir e depurar (uma chamada, uma resposta) | Consistência adiada (*eventual consistency*) a ser gerenciada explicitamente |

Veja [WebSocket](/?c=infrastructure&p=websocket-et-temps-reel) para uma terceira forma de comunicação, pertinente quando um serviço precisa notificar um cliente continuamente em vez de outro serviço pontualmente.

## O gateway de API (API Gateway)

Um [proxy reverso](/?c=docker&p=docker-compose) (Nginx, Traefik) redireciona uma requisição para o serviço certo no nível de rede (endereço, porta, caminho da URL), sem nunca ler seu conteúdo. Um **gateway de API (API Gateway)** é um serviço de aplicação por si só, posicionado logo atrás desse proxy reverso: ele recebe todas as requisições do cliente em um único ponto de entrada, sabe interpretar cada uma para roteá-la ao microsserviço certo, e de passagem cuida de preocupações transversais que um proxy reverso não conhece.

```text
Cliente
  |
  v
Proxy reverso (Nginx)                 <- redirecionamento de rede, nao le a requisicao
  |
  v
Gateway de API (servico de aplicacao) <- roteia por dominio, cuida de CORS/metricas...
  |                    \
  v                     v
Servico Usuarios       Servico Pedidos
```

| | Proxy reverso de rede | Gateway de API (API Gateway) |
|---|---|---|
| Nível | Rede (endereço, porta, caminho) | Aplicação (entende cada requisição) |
| Papel | Redirecionar para o serviço certo | Rotear por domínio de negócio + centralizar CORS, métricas, etc. |
| Exemplo | Nginx, Traefik | Um serviço ([NestJS](https://nestjs.com), [Express](https://expressjs.com)...) dedicado a esse papel |

> **Armadilha:** achar que o gateway necessariamente verifica a identidade de quem chama (seu [JWT](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens)) só porque é o ponto de entrada único. Rotear não é autenticar: nada garante que um gateway que só encaminha a requisição verifique alguma coisa.
>
> **Boa prática:** decidir explicitamente onde vive a verificação do token, nunca deixar isso implícito. Duas escolhas válidas: o gateway verifica uma vez para todos os serviços (evita repetir a checagem, mas o transforma em um único ponto de confiança a proteger bem); ou cada serviço verifica de forma independente (o gateway só roteia, a confiança nunca é delegada a um único ponto).

## O benefício principal: a escalabilidade independente

Em um monolito, uma carga elevada sobre uma única funcionalidade (o pagamento durante um pico de vendas, por exemplo) obriga a multiplicar a aplicação inteira, incluindo as partes que não precisam disso. Com serviços separados, apenas o serviço envolvido é escalado, sem afetar os outros.

## A armadilha do monolito distribuído

Dividir o código em vários serviços não basta para obter os benefícios dos microsserviços se o acoplamento entre eles continuar forte:

> **Armadilha:** aplicar o teste de verdade da [responsabilidade única](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) ("se eu modifico isto, é pelo mesmo motivo que aquilo?") apenas à divisão em arquivos, nunca à divisão em serviços. Serviços que precisam ser sistematicamente implantados juntos, ou cuja mudança no contrato de API de um obriga a modificar imediatamente todos os outros, não passam de um **monolito distribuído**: toda a complexidade operacional dos microsserviços, nenhum de seus benefícios de independência.
>
> **Boa prática:** dividir os serviços ao longo das mesmas fronteiras de uma responsabilidade única bem definida (domínios de negócio realmente independentes), nunca por conveniência técnica (um serviço por tipo de arquivo, por exemplo), e verificar regularmente que dois serviços podem realmente ser implantados um sem o outro.

## O custo: uma complexidade que não desaparece, ela se desloca

Os microsserviços não são gratuitos: a complexidade que um monolito gerencia em memória (uma chamada de função, uma transação de banco de dados única) agora precisa ser gerenciada através da rede (latência, falha parcial possível, não há mais uma transação única cobrindo vários serviços). Observar o que está acontecendo (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) para um exemplo desse tipo de supervisão, aplicado a um LLM em vez de microsserviços) torna-se indispensável assim que vários serviços interagem: um erro agora pode vir de qualquer um deles, ou da comunicação entre eles.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Os microsserviços aplicam a responsabilidade única na escala da implantação: um serviço por domínio de negócio, seu próprio banco de dados, comunicação por API em vez de acesso direto aos dados de outro serviço. O benefício principal é a escalabilidade independente de um serviço específico, sem multiplicar toda a aplicação. |
| **Ferramentas utilizáveis** | Uma chamada síncrona (HTTP/API) para uma necessidade de resposta imediata; uma fila de mensagens assíncrona para desacoplar a disponibilidade de dois serviços. |
| **Armadilhas a evitar** | Compartilhar um banco de dados entre vários serviços. Dividir em serviços sem reduzir o acoplamento entre eles (monolito distribuído). |
| **Boas práticas** | Fazer cada serviço ter seu próprio armazenamento, nunca compartilhado. Dividir ao longo de fronteiras de domínio de negócio realmente independentes, e verificar regularmente que um serviço pode ser implantado sem os outros. |
