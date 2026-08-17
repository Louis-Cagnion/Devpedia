---
order: 3
---

# Propagação de identidade entre serviços (On-Behalf-Of)

Um aplicativo quase nunca é um único serviço isolado: um frontend chama um serviço A, que precisa chamar um serviço B para terminar a requisição. Quando o usuário se autenticou via [OAuth 2.0](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) junto ao serviço A, uma pergunta surge imediatamente: com **qual identidade** o serviço A deve chamar o serviço B?

## A resposta ruim: uma conta de serviço genérica

A solução mais simples, mas a menos segura, consiste em dar ao serviço A uma **conta de serviço** própria, com direitos amplos, para chamar o serviço B:

```text
Usuario -> Servico A -> Servico B
(identidade      (conta de       (recebe uma requisicao da
 perdida          servico,        "conta de servico do Servico A",
 no caminho)      direitos amplos) nao do usuario)
```

> **Cuidado:** o serviço B nunca vê a identidade do usuário final, apenas a do serviço A. Impossível saber, do lado do serviço B, qual usuário realmente disparou a ação; e a conta de serviço, para cobrir todos os usuários possíveis, precisa carregar direitos mais amplos do que os de um usuário individual, um risco em caso de comprometimento do serviço A.
>
> **Boa prática:** propagar a identidade real do usuário de um serviço a outro, em vez de substituí-la por uma conta técnica genérica.

## A resposta boa: o fluxo On-Behalf-Of

O fluxo **On-Behalf-Of** (OBO) resolve esse problema: o serviço A troca o token recebido do usuário por um novo token, ainda em nome desse usuário, mas **escopado** para chamar o serviço B:

```text
1. O usuario se autentica, obtem um token para o Servico A
2. O Servico A precisa chamar o Servico B para responder a requisicao
3. O Servico A troca seu token de usuario por um novo token
   (junto ao servidor de autorizacao), ainda em nome do mesmo usuario,
   mas com o escopo (scope) do Servico B
4. O Servico A chama o Servico B com esse novo token
5. O Servico B ve a identidade real do usuario, e aplica
   AS permissoes dele, nao as de uma conta de servico
```

O serviço B pode então aplicar um [controle de acesso (RBAC/ABAC)](/?c=authentification&s=fondamentaux&p=rbac-et-abac) baseado nos direitos reais do usuário final, exatamente como se o tivesse recebido diretamente, em vez dos direitos (geralmente mais amplos) de uma conta técnica.

## Comparativo

| | Conta de serviço genérica | On-Behalf-Of |
|---|---|---|
| Identidade vista pelo serviço final | O serviço chamador | O usuário final |
| Direitos aplicados | Os, amplos, da conta de serviço | Os, reais, do usuário |
| Rastreabilidade | Impossível saber qual usuário disparou a chamada | O usuário exato permanece identificável a cada salto |
| Risco em caso de comprometimento de um serviço intermediário | Elevado: a conta de serviço pode agir por qualquer usuário | Limitado ao que o usuário atual pode fazer sozinho |

> **Cuidado:** propagar o token **original** do usuário tal como está para o serviço B, em vez de trocá-lo por um novo token escopado para esse serviço. Um token pensado para o serviço A (com o escopo do serviço A) aceito tal como está pelo serviço B quebra o isolamento entre serviços: um token roubado no serviço B daria acesso também ao serviço A.
>
> **Boa prática:** sempre trocar por um novo token, escopado especificamente para o serviço chamado, em vez de fazer o mesmo token circular de um serviço a outro.

---

## 📋 Resumo

| | |
|---|---|
| **O que reter** | O fluxo On-Behalf-Of permite que um serviço backend chame outro serviço em nome do usuário final, trocando seu token por um novo token escopado, em vez de usar uma conta de serviço genérica com direitos amplos. |
| **Ferramentas úteis** | O mecanismo de troca de token (*token exchange*) fornecido pela maioria dos servidores de autorização OAuth 2.0 / OpenID Connect. |
| **Armadilhas a evitar** | Usar uma conta de serviço genérica para as chamadas entre serviços. Fazer o token original do usuário circular tal como está entre vários serviços. |
| **Boas práticas** | Propagar a identidade real do usuário a cada salto. Trocar por um novo token escopado para cada serviço chamado. |
