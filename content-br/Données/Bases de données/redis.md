---
order: 9
---

# Redis: o armazenamento chave-valor em memória

Um banco de dados clássico (veja [Bancos de dados](/?c=bases-de-donnees)) grava seus dados em disco: eles sobrevivem a uma reinicialização, mas cada leitura ou escrita precisa passar por esse disco, mais lento que a memória RAM. O **Redis** é um **armazenamento chave-valor** (cada dado é associado a uma chave única, como em um dicionário) que mantém tudo **em memória RAM** por padrão: os acessos passam a ser da ordem do microssegundo em vez do milissegundo, ao custo de perder o dado se o processo parar sem nenhum cuidado especial (veja a persistência mais adiante).

```text
Banco relacional classico :  Aplicacao --> requisicao --> Disco --> resposta
                              (cada acesso atravessa o disco)

Redis :                      Aplicacao --> requisicao --> RAM --> resposta
                              (o disco so entra em cena de forma opcional, para nao perder tudo)
```

## As estruturas de dados suportadas

Ao contrário de um simples cache que apenas associaria uma string a uma chave, o Redis entende várias formas de valores, cada uma adequada a uma necessidade específica:

| Estrutura | O que ela contém | Exemplo de uso |
|---|---|---|
| **String** | Uma string ou um número | Contador de visualizações, token de sessão |
| **List** | Uma sequência ordenada de valores | Fila de tarefas a processar |
| **Hash** | Um conjunto de campos nomeados, como um mini-objeto | As propriedades de um perfil de usuário |
| **Set** | Um conjunto de valores únicos, sem ordem | As tags associadas a um artigo |
| **Sorted set** | Um conjunto de valores únicos, ordenados por score | Um ranking (score, tempo de jogo) |

## Casos de uso típicos

### O cache de aplicação

O caso mais comum: evitar refazer um cálculo ou uma consulta custosa mantendo seu resultado à mão por um tempo limitado, um princípio já apresentado em [Bancos de dados de alto tráfego](/?c=bases-de-donnees&p=bases-de-donnees-a-fort-trafic).

```text
1. A aplicacao recebe uma requisicao
2. Ela consulta primeiro o Redis com a chave correspondente
   -> Presente (cache hit)  : resposta imediata, disco nunca acionado
   -> Ausente  (cache miss) : requisicao ao banco relacional,
                                depois resultado gravado no Redis para a proxima vez
```

Esse esquema, em que o cache só é consultado e preenchido sob demanda, tem um nome: o padrão ***cache-aside***.

### Armazenamento de sessão, fila e pub/sub

- **Armazenamento de sessão**: as informações de um usuário conectado (identificador, permissões) são lidas a cada requisição; mantê-las em RAM em vez de em um banco relacional evita uma consulta ao disco a cada página.
- **Fila leve**: uma `List` serve de buffer entre um serviço que produz tarefas e outro que as processa, sem depender de um sistema de fila dedicado mais pesado.
- **Pub/sub** (*publish/subscribe*): um serviço publica uma mensagem em um canal nomeado, todos os serviços inscritos nesse canal a recebem imediatamente, sem ligação direta entre eles.

## O TTL: uma chave que se autodestrói

Um **TTL** (*Time To Live*) é um tempo de vida opcional atribuído a uma chave: passado esse prazo, o Redis a remove sozinho. É isso que torna o Redis adequado para um cache: em vez de precisar remover manualmente um dado que ficou obsoleto, já se define uma data de expiração no momento em que ele é criado.

## A persistência: RDB e AOF

O Redis continua sendo antes de tudo uma ferramenta de memória RAM, mas oferece dois mecanismos opcionais para sobreviver a uma reinicialização:

| Mecanismo | Princípio | Compromisso |
|---|---|---|
| **RDB** (*Redis Database*) | Um retrato completo da memória, gravado em disco em intervalos regulares | Rápido para restaurar, mas perde as escritas ocorridas desde o último retrato |
| **AOF** (*Append Only File*) | Cada escrita também é registrada em disco, na ordem em que chega | Perde muito menos dados em caso de queda, mas arquivo maior e restauração mais lenta |

> **Armadilha:** usar o Redis sem RDB nem AOF para armazenar um dado que não se pode dar ao luxo de perder (ex.: um carrinho de compras ainda não finalizado). Sem persistência ativada, um simples reinício do processo apaga tudo.

## Escalando: replicação e Redis Cluster

Assim como em um banco relacional, dois mecanismos permitem superar a capacidade de um único servidor: a **replicação** (uma ou várias cópias somente leitura de um servidor principal, para distribuir as leituras e sobreviver à sua perda) e o **Redis Cluster**, que distribui as próprias chaves entre vários servidores (particionamento), para superar a RAM de uma única máquina.

## O Redis não é um banco relacional

O Redis não substitui um banco como os abordados em [Bancos de dados](/?c=bases-de-donnees): sem junção entre várias estruturas, sem consulta complexa no estilo [SQL](/?c=domain-specific-languages-dsl&p=sql), e uma capacidade de armazenamento limitada pela RAM disponível em vez do espaço em disco. Ele complementa um banco já existente para os acessos que precisam ser imediatos, não o substitui para aqueles que precisam permanecer exaustivos e duráveis.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Redis é um armazenamento chave-valor que mantém seus dados em RAM por padrão, para acessos muito rápidos. Ele suporta várias estruturas (string, list, hash, set, sorted set), um TTL para expiração automática, e uma persistência opcional (RDB, AOF). |
| **Ferramentas utilizáveis** | RDB/AOF para a persistência; replicação e Redis Cluster para escalar. |
| **Armadilhas a evitar** | Armazenar um dado crítico sem persistência ativada; esperar do Redis as capacidades de um banco relacional (junções, consultas complexas). |
| **Boas práticas** | Reservar o Redis para cache, sessão, ou uma necessidade de latência mínima; sempre definir um TTL em um dado de cache para evitar que ele fique obsoleto silenciosamente. |
