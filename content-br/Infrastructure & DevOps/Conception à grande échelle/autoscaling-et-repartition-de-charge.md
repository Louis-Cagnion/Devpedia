---
order: 2
---

# Autoscaling e distribuição de carga

[Bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) detalha como absorver um alto tráfego **do lado do banco de dados** (cache, réplicas, sharding). Este capítulo cobre a outra metade do problema: como absorver esse tráfego **do lado dos servidores de aplicação**, aqueles que executam o código da aplicação em si.

## O problema: um único servidor tem capacidade limitada

Um servidor de aplicação só consegue processar um número finito de requisições simultâneas, limitado por seu poder de cálculo e sua memória. Duas formas de aumentar essa capacidade:

| | Escalonamento vertical | Escalonamento horizontal |
|---|---|---|
| Princípio | Uma máquina mais potente (mais CPU, mais memória) | Várias máquinas idênticas em paralelo |
| Teto | Limitado pela maior máquina disponível no mercado | Praticamente ilimitado (adicionar mais uma máquina) |
| Custo de uma parada | Uma parada dessa máquina única para todo o serviço | A perda de uma máquina entre várias não para o serviço |

O escalonamento horizontal é preferido assim que um tráfego importante é esperado, justamente porque não tem teto fixo e tolera a falha de uma máquina.

## O balanceador de carga (load balancer)

Uma vez disponíveis vários servidores idênticos, cada requisição recebida precisa ser direcionada a um deles: esse é o papel do **balanceador de carga** (*load balancer*), posicionado entre os usuários e os servidores.

```text
                    ┌──► Servidor 1
Usuarios ──► Balanceador ──► Servidor 2
                    └──► Servidor 3
```

| Estratégia de distribuição | Princípio |
|---|---|
| *Round-robin* | Distribui as requisições aos servidores por rodízio, em ordem |
| *Least connections* | Envia a requisição ao servidor que está processando atualmente o menor número de requisições em andamento |

O balanceador também monitora a saúde de cada servidor (um **health check**, uma requisição de teste enviada periodicamente): um servidor que para de responder é automaticamente removido da rotação, sem intervenção humana, até que volte a ficar disponível.

> **Cuidado:** distribuir as requisições de um mesmo usuário entre servidores diferentes, supondo que cada servidor guarda na memória o que diz respeito a esse usuário (sua sessão). O capítulo [JWT e tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) já detalha esse problema e sua solução: não depender da memória de um servidor específico, justamente para que qualquer servidor atrás do balanceador possa processar qualquer requisição indiferentemente.

## O autoscaling: ajustar o número de servidores automaticamente

Provisionar de antemão servidores suficientes para absorver o pico de tráfego mais alto imaginável desperdiça dinheiro o resto do tempo, quando esses servidores rodam amplamente subutilizados. O **autoscaling** (escalonamento automático) resolve esse dilema: o número de servidores ativos se ajusta automaticamente à carga real, medida continuamente (uso de CPU, número de requisições em espera...).

```text
Carga medida continuamente
   |
   ├─ ultrapassa um limiar (ex: CPU > 70% por 5 min)  -> adiciona um servidor
   |
   └─ volta abaixo de um limiar baixo                 -> remove um servidor
```

Um pico de tráfego repentino (um anúncio viral, um pico de pedidos) assim dispara a adição automática de servidores extras, e depois sua remoção uma vez que o pico baixa, sem que um humano precise monitorar o tráfego permanentemente nem adivinhar de antemão sua intensidade.

> **Cuidado:** achar que o autoscaling reage instantaneamente. Iniciar um novo servidor (alocar a máquina, implantar a aplicação nela, iniciá-la) leva tempo, de alguns segundos a vários minutos conforme o caso: um pico tão brutal que dobra o tráfego em poucos segundos pode saturar os servidores existentes antes que os novos terminem de iniciar.
>
> **Boa prática:** manter uma margem de capacidade disponível o tempo todo (nunca rodar os servidores existentes a 100% de sua capacidade logo antes de disparar a adição de um novo), e prever uma degradação progressiva do serviço (responder mais devagar, desativar uma funcionalidade secundária) em vez de uma parada completa se um pico ultrapassar mesmo assim a velocidade de escalonamento.

## O que reter

| | |
|---|---|
| **O que reter** | O escalonamento horizontal (vários servidores idênticos) em vez do vertical (uma máquina maior) permite absorver um tráfego importante sem teto fixo. Um balanceador de carga distribui as requisições entre esses servidores e remove automaticamente os que pararam de responder. O autoscaling ajusta o número deles à carga real medida continuamente. |
| **Ferramentas úteis** | Um balanceador de carga com health checks integrados; um serviço de autoscaling fornecido pela maioria dos [provedores de nuvem](/?c=infrastructure-devops&s=infrastructure&p=le-cloud). |
| **Armadilhas a evitar** | Distribuir as requisições de um usuário entre servidores que dependem de sua própria memória local. Esperar do autoscaling uma reação instantânea a um pico brutal. |
| **Boas práticas** | Manter uma margem de capacidade permanente. Prever uma degradação progressiva em vez de uma parada completa em caso de pico que ultrapasse a velocidade de escalonamento. |
