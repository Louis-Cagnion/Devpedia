---
order: 3
---

# Os protocolos ponto a ponto (P2P)

Um site clássico segue um modelo **cliente-servidor**: um servidor central hospeda o recurso, cada cliente se conecta a ele para obtê-lo (veja [Fundamentos de rede](/?c=reseaux&p=fondamentaux-reseau)). Uma rede **ponto a ponto** (*peer-to-peer*, P2P) funciona de forma diferente: cada participante, chamado **par** (*peer*), é ao mesmo tempo cliente e servidor, sem que um ponto central seja obrigatório para trocar o próprio recurso.

```text
Cliente-servidor :      Cliente A -->\
                         Cliente B --> Servidor (unica fonte) --> cada cliente
                         Cliente C -->/

Ponto a ponto :          Par A <---> Par B
                            ^            ^
                            |            |
                            v            v
                          Par C <---> Par D
                          (cada par pode enviar E receber, para/de qualquer outro)
```

## O swarm, seeders e leechers

O conjunto de pares que trocam atualmente um mesmo recurso forma um **swarm** (literalmente "enxame"). Dois papéis convivem em um swarm:

| Papel | Situação |
|---|---|
| **Seeder** | Já possui o recurso completo, só faz enviá-lo aos outros |
| **Leecher** | Possui apenas parte do recurso, baixa o restante mas já pode reenviar os pedaços que tem |

## A divisão em pedaços

O recurso (frequentemente um arquivo) nunca é trocado como um bloco único: ele é dividido em **pedaços** (*pieces*) de tamanho fixo, cada um acompanhado de um hash (veja a noção de hash em [Senhas e hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage) para o princípio geral) que permite verificar sua integridade assim que é recebido.

```text
Arquivo completo :  [ pedaco 1 | pedaco 2 | pedaco 3 | pedaco 4 | ... ]

Um par pode baixar o pedaco 3 do par A,
o pedaco 1 do par B, em paralelo,
e depois reenviar imediatamente o pedaco 3 a um par C que ainda nao o tem.
```

Essa divisão permite duas coisas ao mesmo tempo: baixar vários pedaços em paralelo a partir de pares diferentes (mais rápido que uma única fonte), e detectar imediatamente um pedaço corrompido ou modificado graças ao seu hash, sem esperar o fim do download completo.

## Encontrar pares: tracker e DHT

Um par que entra em um swarm precisa primeiro saber quais outros pares o compõem:

| Mecanismo | Princípio |
|---|---|
| **Tracker** | Um servidor central que cada par contata para obter a lista dos pares ativos do swarm; continua sendo uma passagem obrigatória, mesmo sem nunca hospedar o próprio recurso |
| **DHT** (*Distributed Hash Table*) | Uma tabela de correspondência distribuída entre os próprios pares, que permite encontrar os pares de um swarm sem depender de um tracker central |

Um **magnet link** é uma simples referência (um identificador único do recurso) que permite entrar em um swarm diretamente via o DHT, sem precisar baixar antes um arquivo que descreva o recurso.

## O incentivo a retribuir: choke/unchoke

Nada obriga um par a reenviar o que ele baixa. Para evitar que todo mundo se contente em receber sem nunca retribuir, cada par limita o número de pares para os quais envia dados em um dado momento (*choke* = bloqueado, *unchoke* = autorizado), priorizando aqueles que já mais lhe retribuem. Um par que nunca reenvia nada acaba assim sendo *choked* pela maioria dos outros.

## Além do compartilhamento de arquivos entre particulares

O princípio P2P também atende a necessidades de distribuição em larga escala: distribuir uma atualização volumosa (ex.: um jogo eletrônico) para milhões de jogadores ao mesmo tempo sem sobrecarregar um único servidor, cada jogador que já baixou parte da atualização a redistribuindo para os outros. É uma alternativa descentralizada a uma [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), que distribui a carga entre servidores dedicados em vez de entre os próprios usuários.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma rede ponto a ponto faz de cada participante ao mesmo tempo um cliente e um servidor. O swarm reúne os pares que trocam um recurso dividido em pedaços verificados por hash; um tracker ou um DHT permite encontrar esses pares. |
| **Ferramentas utilizáveis** | Um tracker para um swarm simples de administrar; um DHT para não depender de nenhum servidor central. |
| **Armadilhas a evitar** | Confundir o papel do tracker (que apenas coloca em contato) com o de um hospedeiro clássico (que serve ele mesmo o recurso). |
| **Boas práticas** | Verificar o hash de cada pedaço recebido antes de redistribuí-lo, para nunca propagar um dado corrompido. |
