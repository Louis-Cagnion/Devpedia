---
order: 4
---

# Autoscaling e rolling updates

## Autoscaling: ajustar o número de pods à carga real

Um [Deployment](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) declara um número fixo de réplicas, mas o tráfego real varia com o tempo. O **autoscaling** ajusta automaticamente esse número de acordo com uma métrica monitorada (o uso de CPU, o mais comum):

```text
CPU medio dos pods sobe    -> Kubernetes adiciona pods
CPU medio dos pods desce   -> Kubernetes remove pods
```

O princípio continua o mesmo já visto para um [autoscaling genérico](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge): adicionar capacidade só quando ela realmente serve, nunca permanentemente "só por precaução".

## Rolling update: entregar uma nova versão sem cortar o serviço

Substituir todas as cópias de uma aplicação de uma vez cortaria o serviço durante o reinício. Um **rolling update** substitui os pods progressivamente: novos pods (nova versão) sobem e precisam ficar saudáveis antes que um número equivalente de pods antigos seja removido, nunca o contrário:

```text
Estado inicial : [v1] [v1] [v1]
Etapa 1        : [v2] [v1] [v1]   (v2 sobe e fica saudavel)
Etapa 2        : [v2] [v2] [v1]   (um v1 antigo e removido)
Estado final   : [v2] [v2] [v2]
```

Em nenhum momento o número total de pods saudáveis fica abaixo do necessário para atender o tráfego: o serviço continua respondendo durante toda a atualização.

> **Boa prática:** se uma nova versão se mostrar defeituosa depois de implantada, um rollback volta à versão anterior seguindo exatamente o mesmo mecanismo progressivo, ao contrário.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O autoscaling ajusta o número de pods de um Deployment a uma métrica real (o uso de CPU, o mais comum). Um rolling update substitui os pods progressivamente, uma nova versão só se tornando ativa depois de saudável, sem nunca cortar o serviço. Um rollback segue o mesmo mecanismo, ao contrário. |
| **Ferramentas utilizáveis** | `kubectl rollout status`/`kubectl rollout undo` para acompanhar ou desfazer um rolling update em andamento. |
| **Armadilhas a evitar** | Substituir todos os pods de uma vez em vez de progressivamente, o que corta o serviço durante o reinício. |
| **Boas práticas** | Deixar o Kubernetes verificar que um novo pod está saudável antes de remover o antigo que ele substitui. Usar um rollback em vez de uma correção de emergência se uma nova versão se mostrar defeituosa. |
