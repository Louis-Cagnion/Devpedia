---
order: 7
---

# Contêineres gerenciados na nuvem: ECS e Fargate

O [Docker](/?c=infrastructure-devops&s=docker&p=docker) permite empacotar uma aplicação em um [contêiner](/?c=infrastructure-devops&s=docker&p=concepts-de-base) e rodá-la em qualquer lugar. Mas rodar esse contêiner em produção, de verdade, levanta uma questão que o Docker sozinho não resolve: em qual máquina, por quanto tempo, e quem reinicia o contêiner se ele quebrar às 3h da manhã? Um **serviço de contêineres gerenciados** responde a essa questão delegando toda ou parte dessa gestão a um provedor de [nuvem](/?c=infrastructure-devops&s=infrastructure&p=le-cloud).

## O problema: o Docker não gerencia a produção no seu lugar

Rodar você mesmo contêineres Docker em produção supõe gerenciar, continuamente:

| Responsabilidade | Detalhe |
|---|---|
| Os servidores subjacentes | Provisioná-los, atualizá-los, substituir uma máquina com defeito |
| O posicionamento dos contêineres | Decidir qual contêiner roda em qual máquina, conforme a carga |
| A resiliência | Reiniciar automaticamente um contêiner que trava ou para de responder |
| O aumento de escala | Adicionar contêineres (ou máquinas) se o tráfego aumentar |

Um serviço como o **Amazon ECS** (*Elastic Container Service*) assume esses quatro pontos: você fornece uma imagem de contêiner (o resultado de um [Dockerfile](/?c=infrastructure-devops&s=docker&p=dockerfile)), e ele cuida de rodá-la, monitorá-la e reiniciá-la se necessário.

## Duas formas de rodar o ECS: ainda gerenciando ou não os servidores

O capítulo sobre [a nuvem](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) distingue IaaS (o provedor gerencia só o hardware, você gerencia o resto) e PaaS (o provedor também gerencia o ambiente de execução). O ECS oferece exatamente essa escolha, na forma de dois "modos de execução":

| | ECS no EC2 | ECS no [Fargate](https://aws.amazon.com/fargate/) |
|---|---|---|
| Quem gerencia os servidores subjacentes? | Você (escolha do tipo de máquina, atualização) | A Amazon, inteiramente |
| O que você fornece | A imagem do contêiner + as máquinas para rodá-lo | Apenas a imagem do contêiner |
| Cobrança | Pela máquina alugada, usada ou não | Pelo contêiner realmente usado (CPU/memória, por segundo) |
| Próximo de | IaaS | PaaS |

> **Analogia:** ECS no EC2 é alugar um imóvel comercial vazio e instalar você mesmo as prateleiras; o Fargate é alugar um estande já equipado, pronto para receber a mercadoria, sem nunca ter que cuidar do imóvel em si.

Outros provedores oferecem serviços equivalentes ao Fargate (Google Cloud Run, Azure Container Apps): o princípio (fornecer um contêiner, nunca gerenciar a máquina subjacente) continua o mesmo de um provedor para outro.

> **Cuidado:** achar que um serviço gerenciado dispensa qualquer reflexão sobre dimensionamento. Ainda é preciso indicar quanta memória e poder de cálculo alocar a cada contêiner, e quantas cópias rodar em paralelo: um dimensionamento ruim continua possível, só a gestão física das máquinas desaparece.
>
> **Boa prática:** começar pelo Fargate por padrão (nenhuma máquina para gerenciar, cobrança mais próxima do uso real) e só migrar para o ECS no EC2 se uma necessidade precisa exigir isso (acesso a um hardware específico, otimização fina de custos em um uso constante e previsível).

## O que reter

| | |
|---|---|
| **O que reter** | O ECS roda contêineres Docker em produção no lugar do desenvolvedor (posicionamento, reinício, aumento de escala). O Fargate vai além, eliminando até a gestão das máquinas subjacentes. |
| **Ferramentas úteis** | [Amazon ECS](https://aws.amazon.com/ecs/) e [Fargate](https://aws.amazon.com/fargate/); equivalentes em outros provedores (Google Cloud Run, Azure Container Apps). |
| **Armadilhas a evitar** | Achar que um serviço gerenciado dispensa dimensionar corretamente cada contêiner. |
| **Boas práticas** | Começar com um serviço inteiramente gerenciado (tipo Fargate) e só gerenciar as máquinas você mesmo se uma necessidade precisa justificar isso. |
