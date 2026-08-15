---
order: 2
---

# JWT e tokens

O capítulo anterior mostra que a sessão obriga o servidor a manter um espaço de armazenamento dedicado, consultado a cada requisição. Isso funciona muito bem para um único servidor, mas se torna mais complicado assim que vários servidores tratam as requisições de um mesmo site: cada um precisa então acessar o mesmo espaço de sessões, uma dependência a mais para fazer funcionar. Outra abordagem evita esse problema: em vez de armazenar a informação do lado do servidor, ela é codificada diretamente **dentro** do token que o cliente carrega.

## O JWT: uma informação autossuficiente e verificável

Um **JWT** (*JSON Web Token*) codifica informações em [JSON](/?c=infrastructure&p=json) diretamente no token, e depois as assina criptograficamente. Um JWT sempre é composto de três partes separadas por um ponto:

```text
cabecalho.dados.assinatura

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMiwiZXhwIjoxNzM1Njg5NjAwfQ.4f8a2c...
     |                          |                                  |
  cabecalho                  dados                             assinatura
  (algoritmo                (as informacoes                  (calculada a partir
   utilizado)                codificadas, em JSON)             das duas primeiras
                                                                 partes + um segredo
                                                                 conhecido pelo servidor)
```

O servidor que recebe um JWT recalcula a assinatura a partir do cabeçalho e dos dados recebidos, com seu próprio segredo, e a compara com a fornecida: se corresponderem, o conteúdo não foi modificado desde sua emissão. Essa verificação não exige **nenhum acesso a um espaço de armazenamento**: é isso que torna um JWT *stateless* (sem estado), ao contrário de uma sessão.

## O que um JWT contém: nunca criptografado, apenas assinado

Os dados de um JWT são codificados em [Base64](https://en.wikipedia.org/wiki/Base64), não criptografados: qualquer pessoa pode decodificar esses dados e lê-los, inclusive um atacante que intercepte o token. Só a assinatura impede que sejam **modificados** sem que isso seja percebido; ela não impede ninguém de **lê-los**.

```text
Dados decodificados de um JWT :  { "user_id": 12, "exp": 1735689600 }
                                  -> legivel por qualquer um que possua o token,
                                     mesmo sem conhecer o segredo do servidor
```

> **Cuidado:** colocar um dado sensível (senha, número de cartão de crédito, informação confidencial) nos dados de um JWT, pensando que a assinatura o protege. A assinatura garante a integridade (nada foi modificado), nunca a confidencialidade (todo mundo pode ler).
>
> **Boa prática:** colocar em um JWT apenas informações que podem ser lidas sem risco caso o token seja interceptado (um identificador de usuário, uma data de expiração, um papel), nunca um segredo.

## A verdadeira armadilha do stateless: revogar um JWT antes de sua expiração

Uma sessão é revogada instantaneamente: basta excluir o dado correspondente do lado do servidor, e o identificador se torna inútil. Um JWT, por sua vez, permanece válido até que sua data de expiração seja atingida, precisamente porque o servidor não guarda nenhum registro dos tokens que emitiu: desconectá-lo à força antes de sua expiração natural (uma conta invadida, um funcionário que deixa a empresa) exige um mecanismo adicional (uma lista negra consultada a cada requisição), o que anula parte da vantagem stateless buscada de início.

| | Sessão | JWT |
|---|---|---|
| Onde a informação vive | Do lado do servidor | No próprio token |
| Revogação antes da expiração | Imediata (excluir do lado do servidor) | Difícil sem mecanismo adicional |
| Compartilhamento entre vários servidores | Exige um espaço de armazenamento comum | Nenhum espaço compartilhado necessário |
| Conteúdo legível se interceptado | Não (apenas um identificador opaco) | Sim (dados em texto puro, apenas assinados) |

> **Cuidado:** escolher um JWT por sua simplicidade aparente sem ter antecipado o caso em que um token precisa ser revogado antes de sua expiração natural (desconexão forçada, conta comprometida).
>
> **Boa prática:** manter um tempo de vida curto para um JWT (alguns minutos a algumas horas), e prever um mecanismo de renovação em vez de um token válido por vários dias, para limitar a janela em que uma revogação antecipada seria necessária.

---

## O que reter

| | |
|---|---|
| **O que reter** | Um JWT codifica informações em JSON diretamente no token e as assina, o que permite verificá-las sem armazenamento do lado do servidor (stateless). Seus dados são codificados, nunca criptografados: legíveis por qualquer um que possua o token, apenas sua modificação é impedida pela assinatura. |
| **Ferramentas úteis** | Uma biblioteca JWT da linguagem utilizada para gerar e verificar a assinatura, em vez de uma implementação manual. |
| **Armadilhas a evitar** | Colocar um dado sensível em um JWT pensando que ele está protegido. Escolher um JWT sem ter antecipado a necessidade de revogação antecipada. |
| **Boas práticas** | Colocar em um JWT apenas dados que podem ser lidos sem risco. Manter um tempo de vida curto e prever uma renovação em vez de um token de longa duração. |
