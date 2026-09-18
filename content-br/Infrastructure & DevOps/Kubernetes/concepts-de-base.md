---
order: 1
---

# Os conceitos básicos

## O problema que o Kubernetes resolve

Uma aplicação em um contêiner Docker roda em um servidor. O tráfego cresce: agora são necessárias cinco cópias. Uma trava às 3h da manhã: alguém precisa reiniciá-la manualmente. O servidor cai: os contêineres precisam migrar para outro lugar. Uma nova versão precisa ser entregue sem cortar o serviço. Cada uma dessas operações, feita manualmente, acaba chegando tarde demais ou nunca.

O Kubernetes automatiza esse trabalho: declara-se o estado desejado ("5 cópias desta aplicação, sempre"), e um controlador compara continuamente esse **estado desejado** com o **estado real**, corrigindo a diferença assim que ela aparece. Essa é toda a filosofia da ferramenta, aplicada em cada uma de suas peças.

## Cluster, node e control plane

Um **cluster** Kubernetes é um grupo de máquinas chamadas **nodes**. Alguns nodes executam o **control plane** (o "cérebro": decide o que roda onde), os outros executam as aplicações em si:

```text
Cluster
├── Control plane (decide o que roda onde)
└── Nodes (executam as aplicacoes)
    ├── Node 1
    ├── Node 2
    └── Node 3
```

O control plane monitora continuamente o estado real do cluster (quais contêineres rodam onde) e o compara com o estado desejado declarado nos arquivos de configuração.

## Pod: a menor unidade implantada

Um **pod** é a menor unidade que o Kubernetes implanta, geralmente um único contêiner dentro (às vezes vários contêineres estreitamente ligados que compartilham a mesma rede e o mesmo armazenamento). Nunca se implanta um contêiner Docker diretamente: sempre através de um pod que o envolve.

## Deployment: declarar quantas cópias e deixar o Kubernetes mantê-las

Um **Deployment** declara quantas **réplicas** (cópias) de um pod devem rodar. Dizer "5 réplicas" faz o Kubernetes criar 5 pods. Se um trava, o controlador percebe que restam apenas 4 e cria outro imediatamente, sem intervenção humana:

```text
Estado desejado : 5 pods
Estado real     : 4 pods (um travou)
-> Kubernetes cria 1 pod para fechar a diferenca
```

> **Boa prática:** nunca criar um pod diretamente em produção. Passar por um Deployment garante que um pod que desaparece (travamento, migração após falha de node) seja recriado automaticamente em outro lugar do cluster.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Kubernetes compara continuamente um estado desejado (declarado) com o estado real do cluster, e corrige a diferença automaticamente. Um cluster agrupa nodes (control plane + nodes de execução). Um pod é a menor unidade implantada; um Deployment declara quantas réplicas de um pod devem rodar e as recria em caso de falha. |
| **Ferramentas utilizáveis** | `kubectl get pods`/`kubectl get deployments` para observar o estado real de um cluster. |
| **Armadilhas a evitar** | Criar um pod diretamente em vez de através de um Deployment: um pod isolado que trava nunca é recriado automaticamente. |
| **Boas práticas** | Sempre passar por um Deployment para se beneficiar da autorreparação (recriação automática de um pod desaparecido). |
