---
order: 2
---

# Service e Ingress: rotear o tráfego para os pods

## O problema: os pods não são alvos estáveis

Um [pod](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) pode ser destruído e recriado a qualquer momento (travamento, atualização, migração), recebendo um novo endereço IP a cada vez. Um cliente que contatasse diretamente o IP de um pod perderia a conexão assim que esse pod desaparecesse.

## Service: um ponto de entrada estável

Um **Service** é um ponto de entrada de rede estável (um IP e um nome que nunca mudam) colocado na frente de um grupo de pods. Ele distribui o tráfego recebido entre os pods atualmente saudáveis, independentemente de suas idas e vindas:

```text
Cliente --> Service (endereco estavel) --> Pod 1 (saudavel)
                                        --> Pod 2 (saudavel)
                                        --> Pod 3 (reiniciando, excluido)
```

O Service detecta automaticamente quais pods estão saudáveis e exclui os que não estão, sem nunca mudar seu próprio endereço.

## Ingress: rotear por nome de domínio

Um cluster costuma hospedar várias aplicações atrás de Services diferentes. O **Ingress** roteia o tráfego recebido para o Service correto de acordo com o nome de domínio solicitado:

| Domínio solicitado | Service alvo |
|---|---|
| `app.exemplo.com` | Service do frontend |
| `api.exemplo.com` | Service do backend |

Sem Ingress, cada Service precisaria expor seu próprio endereço público separado; o Ingress centraliza esse roteamento em um único ponto de entrada para todo o cluster.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Os pods mudam de endereço IP o tempo todo (travamento, atualização, migração): um Service dá a eles um endereço estável e distribui o tráfego entre os saudáveis. Um Ingress então roteia o tráfego recebido para o Service correto de acordo com o domínio solicitado. |
| **Ferramentas utilizáveis** | `kubectl get services`/`kubectl get ingress` para listar os pontos de entrada de um cluster. |
| **Armadilhas a evitar** | Fazer um cliente depender do IP direto de um pod em vez do endereço estável do Service. |
| **Boas práticas** | Sempre passar por um Service para alcançar um grupo de pods; usar um Ingress assim que várias aplicações compartilharem o mesmo cluster. |
