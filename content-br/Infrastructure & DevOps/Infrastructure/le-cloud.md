---
order: 5
---

# O que é a nuvem (cloud)?

Rodar um programa ou armazenar um dado exige uma máquina física em algum lugar. A **nuvem** (*cloud*) designa o uso de máquinas remotas, possuídas e gerenciadas por um fornecedor terceiro ([Amazon AWS](https://aws.amazon.com), [Google Cloud](https://cloud.google.com), [Microsoft Azure](https://azure.microsoft.com)...), em vez de equipamento comprado e gerenciado pela própria empresa.

> **Analogia:** alugar um apartamento mobiliado em vez de comprar e manter sua própria casa: você paga pelo uso, sem possuir nem cuidar da manutenção do que está por trás.

## Por que alugar em vez de ter o próprio servidor

| | Servidor próprio (*on-premise*) | Cloud |
|---|---|---|
| Investimento inicial | Alto (comprar o equipamento com antecedência) | Baixo (pagar pelo uso real) |
| Ajustar a capacidade | Limitada pelo equipamento já comprado | Em poucos cliques ou minutos |
| Manutenção do hardware | A cargo da empresa | A cargo do fornecedor cloud |
| Custo em um uso constante e previsível ao longo do tempo | Pode ser mais barato no total | Pode ser mais caro no total |

## As grandes categorias de serviços cloud

| Categoria | Gerenciado pelo fornecedor | Gerenciado pelo usuário | Exemplo |
|---|---|---|---|
| **IaaS** (*Infrastructure as a Service*) | Hardware físico, rede | Sistema operacional, aplicativos | Uma máquina virtual alugada |
| **PaaS** (*Platform as a Service*) | + sistema operacional, ambiente de execução | Apenas o código da aplicação | Um serviço que executa diretamente o código fornecido |
| **SaaS** (*Software as a Service*) | Tudo, incluindo a aplicação | Nada, só o uso | Um serviço de e-mail online, um software acessado pelo navegador |

Quanto mais alto uma categoria está nessa tabela, mais controle (e responsabilidade) o usuário mantém sobre o que roda; quanto mais baixo, mais é o fornecedor que gerencia tudo, ao custo de menos controle.

## A nuvem e a IA: alugar poder de cálculo por demanda

Treinar um modelo de deep learning exige uma ou mais [GPUs](/?c=infrastructure&p=cpu-vs-gpu) potentes: um equipamento caro de comprar, e raramente usado em plena capacidade continuamente depois que o treinamento termina. A nuvem permite alugar esse poder de cálculo apenas durante a duração real do treinamento, em vez de investir em equipamento dedicado que ficaria depois amplamente sem uso.

## Cuidado: onde meus dados realmente ficam armazenados?

> **Cuidado:** supor que um dado enviado "para a nuvem" permanece sob o mesmo controle e as mesmas regras legais que se ficasse nas instalações da empresa. Ele está na realidade armazenado em equipamento pertencente a um terceiro, às vezes localizado em um país diferente, com suas próprias regras de proteção de dados.
>
> **Boa prática:** verificar as condições contratuais e a localização geográfica dos dados antes de enviar um dado sensível a um serviço cloud (veja a [classificação dos dados antes do envio](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)), em vez de supor que isso é neutro por padrão.

## Cuidado: o custo pode escapar do controle habitual

> **Cuidado:** esquecer de desligar um recurso cloud alugado após o uso (uma máquina virtual, uma GPU reservada). A cobrança continua enquanto o recurso estiver rodando, mesmo sem uso: nenhum alerta de "erro" é disparado, já que tecnicamente tudo funciona como previsto.
>
> **Boa prática:** configurar alertas de custo, ou até um desligamento automático de recursos não utilizados, em vez de contar com uma verificação manual periódica.

## O que reter

| | |
|---|---|
| **O que reter** | A nuvem consiste em alugar máquinas remotas gerenciadas por um fornecedor terceiro, em vez de possuir o próprio equipamento. IaaS, PaaS e SaaS se distinguem pelo que o fornecedor gerencia no lugar do usuário. |
| **Ferramentas úteis** | Os principais fornecedores (AWS, Google Cloud, Azure) oferecem painéis de custo e alertas configuráveis. |
| **Armadilhas a evitar** | Supor que um dado enviado para a nuvem permanece sujeito às mesmas regras que internamente. Deixar um recurso alugado rodando sem necessidade após o uso. |
| **Boas práticas** | Verificar a localização e as condições contratuais antes de enviar um dado sensível. Configurar alertas de custo ou um desligamento automático de recursos não utilizados. |
