---
order: 2
---

# SSO e gestão de identidade corporativa

Em uma empresa, um funcionário costuma usar dezenas de ferramentas diferentes: email, chat de equipe, repositórios de código, gestão de tickets, aplicativos internos... Sem uma solução centralizada, cada ferramenta pediria sua própria conta e sua própria senha: cansativo para o funcionário (que acaba reutilizando as mesmas senhas em todo lugar, veja [Senhas e hash seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), e arriscado para a empresa, que precisa lembrar de revogar o acesso em *cada* uma dessas ferramentas quando alguém sai.

## Single Sign-On (SSO): uma única conta para todas as ferramentas

O **SSO** (*Single Sign-On*, autenticação única) permite que um funcionário se conecte **uma única vez** a um serviço central, e então acesse todas as ferramentas da empresa conectadas a esse serviço sem digitar as credenciais de novo. É o princípio da [delegação e federação de identidade](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) vista no capítulo anterior, aplicada na escala de uma empresa inteira em vez de a um único botão "Entrar com...".

## O provedor de identidade (IdP): o ponto central

O serviço central que autentica os funcionários e depois atesta sua identidade às demais ferramentas se chama **provedor de identidade** (*Identity Provider*, IdP). O [Okta](https://www.okta.com) é um dos provedores mais difundidos: uma empresa configura ali uma vez seus funcionários e as ferramentas autorizadas, e o Okta assume então a autenticação real para cada uma dessas ferramentas.

Dois protocolos padronizados permitem que uma ferramenta confie na identidade atestada por um IdP como o Okta: o [OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (visto no capítulo anterior), e o [**SAML**](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) (*Security Assertion Markup Language*), mais antigo, ainda muito difundido em grandes empresas. Ambos atendem à mesma necessidade (atestar uma identidade a um terceiro), com um formato de troca diferente (JSON para o OpenID Connect, XML para o SAML).

## Como um funcionário se conecta na prática

```text
1. O funcionario abre "app-interno.empresa.com"
2. O aplicativo redireciona para a pagina de login do Okta
3. O funcionario se autentica no Okta
   (ou pula direto para a etapa 5 se ja tiver uma sessao Okta ativa,
    aberta mais cedo no dia em outra ferramenta)
4. O Okta verifica as credenciais (e pode exigir uma autenticacao
   multifator, centralizada para todas as ferramentas conectadas)
5. O Okta redireciona de volta para o aplicativo com uma prova de identidade
   (um token de identidade OpenID Connect, ou uma asserção SAML)
6. O aplicativo confia nessa prova e concede o acesso
```

## O real benefício: uma revogação centralizada

Além do conforto (uma única senha para lembrar), o SSO resolve um problema real de segurança: quando um funcionário deixa a empresa, desativar sua conta **uma única vez** no IdP corta instantaneamente seu acesso a *todas* as ferramentas conectadas, em vez de depender de uma equipe de TI que precisa lembrar de fazer isso ferramenta por ferramenta, com o risco de esquecer alguma.

> **Cuidado:** tratar o SSO apenas como um conforto para o usuário, sem levar em conta que ele concentra o acesso a todas as ferramentas da empresa atrás de uma única conta: uma conta IdP comprometida se torna um alvo muito mais interessante para um atacante do que uma única senha isolada, já que abre tudo de uma vez.
>
> **Boa prática:** proteger a própria conta IdP com segurança reforçada (veja [Autenticação multifator](/?c=authentification&s=renforcer-lauthentification&p=authentification-multifacteur)), já que seu comprometimento tem um impacto multiplicado em relação a uma conta isolada.

---

## O que reter

| | |
|---|---|
| **O que reter** | O SSO permite se autenticar uma única vez junto a um provedor de identidade (IdP) central, como o Okta, para depois acessar todas as ferramentas conectadas sem digitar as credenciais de novo. OpenID Connect e SAML são os dois protocolos padronizados que possibilitam essa confiança delegada. |
| **Ferramentas úteis** | Um IdP como o Okta para centralizar a autenticação de todas as ferramentas de uma empresa. |
| **Armadilhas a evitar** | Ver o SSO apenas como um conforto, sem levar em conta que ele concentra o acesso a tudo atrás de uma única conta. |
| **Boas práticas** | Revogar o acesso de um funcionário que sai em um único gesto, no nível do IdP. Proteger a conta IdP com segurança reforçada, já que ela dá acesso a tudo o resto. |
