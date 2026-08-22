---
order: 1
---

# O "system design" como tipo de exercício

"Projete o Uber." "Projete o LeetCode." Esse tipo de instrução, muito comum em entrevista técnica, não pede para escrever código: pede para raciocinar sobre os grandes blocos que comporiam o produto, como eles se comunicam, e por que essa escolha em vez de outra na escala visada. É um exercício diferente daquele coberto por [Qualidade e arquitetura do código](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=qualite-et-architecture-du-code): esse trata da qualidade de um código já escrito, o "system design" trata de escolhas feitas **antes** de escrever a menor linha de código, em um nível em que só componentes (cliente, servidor, banco de dados...) e suas trocas são desenhados, na forma de caixas ligadas por setas.

## A estrutura típica de um exercício de system design

| Etapa | Pergunta a que ela responde |
|---|---|
| 1. Enquadrar a necessidade e a escala | Quantos usuários, quantas requisições por segundo, qual proporção de leituras contra escritas? |
| 2. Desenhar a arquitetura global | Quais componentes (cliente, servidores, bancos de dados, cache...) e como eles se comunicam, ainda sem detalhá-los |
| 3. Aprofundar 1 ou 2 componentes críticos | Qual é o ponto mais difícil do sistema, e como resolvê-lo com precisão? |
| 4. Discutir os compromissos | O que essa escolha sacrifica (custo, complexidade, consistência dos dados) em troca do que ela traz? |

> **Cuidado:** buscar "a" resposta certa para um exercício de system design. Não existe uma única: a resposta certa depende inteiramente das hipóteses definidas na etapa 1 (a escala visada muda radicalmente a arquitetura pertinente). Duas respostas diferentes podem estar ambas corretas, se cada uma assumir claramente uma escala diferente.
>
> **Boa prática:** sempre declarar explicitamente as hipóteses de partida (número de usuários, de requisições por segundo) antes de propor uma arquitetura, em vez de desenhar caixas diretamente sem nunca precisar para qual escala elas foram pensadas.

## Exemplo: "Projete o Uber"

Aplicando as 4 etapas a uma necessidade simplificada (localizar motoristas, conectar com um passageiro):

```text
Passageiro                        Motorista
   |  pede uma corrida               |  envia sua posicao
   v                                  v
   Servidor de conexao <----- Posicao atualizada continuamente
   |
   |  busca os motoristas mais proximos
   v
   Banco de dados de posicoes (indice geoespacial)
```

Dois pontos merecem um aprofundamento (etapa 3):

- **Atualizar a posição de um motorista continuamente**: uma conexão clássica de requisição/resposta obrigaria o telefone a perguntar sem parar "tem algo novo?"; uma conexão [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) evita esse desperdício mantendo uma ligação aberta, na qual o servidor empurra cada atualização assim que ela ocorre.
- **Encontrar os motoristas mais próximos de um passageiro**: um [índice](/?c=donnees&s=bases-de-donnees&p=les-index) clássico acelera uma busca por igualdade ou por intervalo em uma coluna, mas "os pontos mais próximos de uma coordenada" é uma pergunta diferente. Um **índice geoespacial** (por exemplo um [geohash](https://en.wikipedia.org/wiki/Geohash) ou uma estrutura do tipo quadtree) responde especificamente a esse tipo de busca, dividindo o espaço geográfico em zonas para comparar apenas um pequeno número de candidatos plausíveis em vez de todas as posições conhecidas.

## Exemplo: "Projete o LeetCode"

Mesmo método, aplicado a uma plataforma que executa o código enviado por seus usuários:

```text
Usuario envia codigo
   |
   v
Fila de submissoes  <-- mesmo principio de "Filas
   |                     e processamento assincrono" (alto trafego)
   v
Worker: executa o codigo em um ambiente isolado
   |
   v
Resultado armazenado, usuario notificado
```

O ponto mais delicado aqui (etapa 3): **executar código fornecido por um desconhecido sem colocar em risco o resto da plataforma**. A resposta se apoia em um princípio já visto em outro lugar na Devpedia: isolar a execução em um ambiente isolado, como um [contêiner Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) descartável, destruído após cada execução, sem acesso ao resto do sistema. A fila que absorve os picos de submissões retoma exatamente o princípio já detalhado em [Bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic): desacoplar a requisição do seu processamento em vez de fazer o usuário esperar.

## Depois de definida a arquitetura: como dividi-la em serviços

Uma vez identificados os grandes blocos (etapas 1-2), resta uma escolha em aberto: agrupá-los em um único programa, ou distribuí-los em vários [microsserviços](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices) independentes. Essa escolha é assunto do capítulo dedicado: o system design identifica **quais** componentes são necessários e como eles se articulam, não necessariamente **como** distribuí-los em programas separados.

## O que reter

| | |
|---|---|
| **O que reter** | O system design raciocina sobre os grandes blocos de um sistema (componentes, trocas, escala) antes de escrever código, em 4 etapas: enquadrar a escala, desenhar a arquitetura global, aprofundar os pontos críticos, discutir os compromissos. |
| **Ferramentas úteis** | WebSocket para um fluxo de atualizações contínuo; um índice geoespacial para uma busca por proximidade; uma fila para absorver picos de demanda; um contêiner isolado para executar código não confiável. |
| **Armadilhas a evitar** | Buscar "a" arquitetura certa sem nunca precisar a escala visada. |
| **Boas práticas** | Sempre declarar as hipóteses de escala antes de propor uma arquitetura. |
