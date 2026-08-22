---
order: 7
---

# Segurança de APIs web

Uma [API web](/?c=infrastructure&p=api-et-http) expõe dados e ações a programas clientes, que podem rodar em contextos que o servidor não controla (um navegador, um aplicativo móvel, outro servidor). Este capítulo cobre as preocupações próprias desse contexto; a autenticação por token (JWT, sessões) já é detalhada na categoria [Autenticação](/?c=authentification), e os mecanismos genéricos de CSRF/força bruta em [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite).

## CORS: autorizar (ou não) que um site chame uma API de outro domínio

Por padrão, um navegador aplica a **política de mesma origem** (*same-origin policy*): uma página carregada a partir de `site-a.example` não pode ler a resposta de uma requisição para `api.site-b.example`, mesmo que a requisição tecnicamente saia. Essa restrição protege o usuário: sem ela, qualquer site visitado poderia ler dados de outro site em que o usuário está logado, sem que ele soubesse.

**CORS** (*Cross-Origin Resource Sharing*) é o mecanismo que permite a um servidor autorizar explicitamente certas origens a ler suas respostas, apesar dessa restrição padrão:

```text
Navegador (pagina carregada a partir de site-a.example)
        |
        | requisicao para api.site-b.example
        v
   Servidor api.site-b.example
        |
        | resposta + cabecalho:
        | Access-Control-Allow-Origin: https://site-a.example
        v
Navegador: origem autorizada -> a pagina pode ler a resposta
```

```http
Access-Control-Allow-Origin: https://site-a.example
```

| Configuração | Efeito | Risco |
|---|---|---|
| `Access-Control-Allow-Origin: https://site-a.example` | Somente essa origem exata pode ler a resposta | Nenhum, desde que a lista permaneça restrita a origens realmente legítimas |
| `Access-Control-Allow-Origin: *` | Qualquer origem pode ler a resposta | Aceitável para uma API pública sem dado sensível nem ação ligada a uma conta; perigoso caso contrário |

> **Armadilha:** responder `Access-Control-Allow-Origin: *` por reflexo para "fazer o erro de CORS sumir" durante o desenvolvimento, e depois esquecer de restringi-lo antes de colocar em produção uma API que manipula dados de conta.
>
> **Boa prática:** autorizar apenas as origens específicas que realmente precisam acessar a API, nunca `*` quando dados sensíveis ou de um usuário autenticado estiverem envolvidos.

## Autenticando uma API: chave ou token, dependendo do cliente

| Mecanismo | Adequado para | Detalhe |
|---|---|---|
| Chave de API | Um serviço de terceiros, um script, um acesso servidor-a-servidor | Ver [Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets) para armazená-la corretamente |
| Token (JWT, sessão) | Um usuário humano autenticado | Ver [JWT e tokens](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) e [Sessões e cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies) |
| Delegação OAuth 2.0 | Um acesso concedido pelo usuário a um aplicativo de terceiros, sem compartilhar sua senha | Ver [OAuth 2.0 e OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |

## Limitando a taxa de requisições (*rate limiting*)

Sem um limite, uma API fica exposta a dois abusos relacionados, mas distintos: a [força bruta](/?c=langages-de-programmation&s=php&p=securite) (adivinhar uma senha ou token testando um grande número de valores) e a simples sobrecarga por um cliente exagerado, intencional ou não (um bug do lado do cliente que chama a API em loop).

```text
Cliente                         API com rate limiting

requisicao 1  ------------->    aceita (1/100 neste mes)
requisicao 2  ------------->    aceita (2/100)
...
requisicao 101 ------------>    429 Too Many Requests
                                 (cota excedida, tentar novamente mais tarde)
```

O código de status `429 Too Many Requests` (ver os códigos de status em [As trocas de dados: API e HTTP](/?c=infrastructure&p=api-et-http)) sinaliza precisamente essa recusa, distinta de um erro de requisição comum.

| Estratégia | Princípio |
|---|---|
| Por IP | Limita o número de requisições vindas de um mesmo endereço IP |
| Por conta/chave de API | Limita o número de requisições para um usuário ou chave específicos, independentemente do IP de origem |
| Janela deslizante | Recalcula a cota continuamente em vez de em intervalos fixos, para evitar que um cliente "esvazie" sua cota logo antes de cada reinício |

## Nunca expor mais do que o necessário

Uma resposta de API que retorna um registro interno inteiro (incluindo campos que o cliente nunca usa: senha com hash, anotações internas, identificadores técnicos) amplia desnecessariamente o que um atacante poderia obter caso ocorra um acesso não previsto a essa resposta. Esse reflexo se alinha com o princípio do menor privilégio já visto em [Princípios de desenvolvimento seguro](/?c=cybersecurite&p=principes-de-developpement-securise), aplicado desta vez ao dado exposto em vez de a um acesso do sistema.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O CORS autoriza explicitamente certas origens a ler a resposta de uma API apesar da política de mesma origem do navegador. O rate limiting protege contra força bruta e sobrecarga. Uma API deve expor apenas os campos que o cliente realmente precisa. |
| **Ferramentas utilizáveis** | Cabeçalho `Access-Control-Allow-Origin`, código de status `429 Too Many Requests`, chave de API/JWT/OAuth 2.0 conforme o tipo de cliente. |
| **Armadilhas a evitar** | `Access-Control-Allow-Origin: *` em uma API que manipula dados sensíveis; ausência de limite de taxa; retornar um registro interno inteiro em uma resposta. |
| **Boas práticas** | Restringir o CORS às origens realmente legítimas; limitar a taxa por conta/chave além do IP; retornar apenas os campos que o cliente realmente precisa. |
