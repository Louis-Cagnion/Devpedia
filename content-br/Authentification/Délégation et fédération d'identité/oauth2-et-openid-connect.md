---
order: 1
---

# OAuth 2.0 e OpenID Connect

O botão "Entrar com o Google" (ou GitHub, Facebook...) está por toda parte na web. Ele nunca pede a senha do Google ao aplicativo que o exibe: este capítulo explica como.

## O problema: dar acesso sem dar a própria senha

Uma solução ruim, historicamente praticada, consiste em dar diretamente a senha do Google a um aplicativo de terceiros para que ele acesse certos dados (os contatos, por exemplo). Dois problemas concretos:

- o aplicativo obtém acesso **total** à conta do Google, quando só precisa dos contatos;
- revogar esse acesso exige mudar a própria senha do Google, o que desconecta de quebra todos os outros aplicativos legítimos.

O **OAuth 2.0** responde a esse problema: um protocolo que permite a um aplicativo de terceiros obter acesso limitado e revogável a um recurso, sem nunca conhecer a senha da conta envolvida.

## Os atores de uma troca OAuth

| Papel | Quem é na prática |
|---|---|
| Dono do recurso | O usuário (sua conta do Google, seus contatos) |
| Cliente | O aplicativo de terceiros que solicita o acesso |
| Servidor de autorização | O serviço que autentica o usuário e concede os acessos (Google, GitHub...) |
| Servidor de recursos | A API que detém o dado protegido (a API de Contatos do Google, por exemplo) |

## O fluxo simplificado

```text
1. O usuario clica "Entrar com o Google" no aplicativo de terceiros
2. O aplicativo de terceiros redireciona o usuario para o Google
3. O usuario se conecta NO GOOGLE (nunca no aplicativo de terceiros)
4. O Google pede o consentimento do usuario: "Este aplicativo quer
   acessar seus contatos, autorizar ?"
5. Se aceito, o Google redireciona para o aplicativo de terceiros com um codigo temporario
6. O aplicativo de terceiros troca esse codigo por um token de acesso
   (troca direta entre servidores, com seu proprio segredo)
7. O aplicativo de terceiros usa esse token para chamar a API do Google
   em nome do usuario
```

O aplicativo de terceiros nunca vê a senha: só o Google a recebe, na etapa 3.

## O token de acesso: escopo limitado e revogável

O **token de acesso** (*access token*) obtido na etapa 6 carrega um **escopo** (*scope*) preciso: "leitura de contatos", por exemplo, nunca um acesso total à conta. Ele também pode ser revogado a qualquer momento, independentemente da senha:

| | Compartilhamento direto da senha | OAuth 2.0 |
|---|---|---|
| Escopo do acesso | Total, sem limite possível | Limitado ao que foi explicitamente concedido |
| Revogação | Muda a senha em todo lugar, inclusive nos usos legítimos | Revoga apenas esse token específico |
| A senha transita até o terceiro? | Sim | Nunca |

## OAuth não prova uma identidade: o papel do OpenID Connect

O OAuth 2.0 foi projetado para a **autorização** (acessar um recurso), não para a **autenticação** (veja [Autenticação vs autorização](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation)). Obter um token de acesso aos contatos de alguém não prova formalmente quem se conectou: um aplicativo que usasse apenas esse token para "reconhecer" um usuário está desviando o OAuth de seu objetivo original.

O **OpenID Connect** (OIDC) adiciona uma camada de identidade sobre o OAuth 2.0, pensada especificamente para a autenticação: além do token de acesso, o servidor de autorização emite um **token de identidade** (*ID token*), que é um [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) padronizado contendo a identidade verificada do usuário (seu identificador, seu email...). É esse token de identidade, e não o token de acesso, que o botão "Entrar com o Google" realmente usa.

> **Cuidado:** usar um token de acesso OAuth bruto para autenticar um usuário, supondo que obtê-lo prova sua identidade. Um token de acesso prova apenas que um acesso foi autorizado, não quem se conectou: esse é o papel do token de identidade do OpenID Connect.
>
> **Boa prática:** usar o OpenID Connect (e seu token de identidade) sempre que a necessidade for saber *quem* está se conectando, e reservar o OAuth 2.0 sozinho para os casos em que a necessidade é apenas acessar um recurso em nome do usuário.

---

## O que reter

| | |
|---|---|
| **O que reter** | O OAuth 2.0 permite a um aplicativo de terceiros obter acesso limitado e revogável a um recurso, sem nunca conhecer a senha da conta. O OpenID Connect adiciona por cima um token de identidade (um JWT) especificamente projetado para a autenticação, o que o OAuth sozinho não fornece. |
| **Ferramentas úteis** | Uma biblioteca OAuth/OIDC da linguagem utilizada em vez de uma implementação manual do protocolo. |
| **Armadilhas a evitar** | Compartilhar diretamente uma senha com um aplicativo de terceiros. Usar um token de acesso OAuth para autenticar um usuário. |
| **Boas práticas** | Sempre limitar o escopo (*scope*) solicitado ao estritamente necessário. Usar o OpenID Connect quando a necessidade for provar uma identidade, não apenas acessar um recurso. |
