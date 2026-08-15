---
order: 2
---

# SSO et gestion d'identité en entreprise

Dans une entreprise, un salarié utilise souvent des dizaines d'outils différents : messagerie, discussion d'équipe, dépôts de code, gestion de tickets, applications internes... Sans solution centralisée, chaque outil demanderait son propre compte et son propre mot de passe : fatigant pour le salarié (qui finit par réutiliser les mêmes mots de passe partout, voir [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), et risqué pour l'entreprise, qui doit penser à révoquer l'accès sur *chacun* de ces outils quand quelqu'un part.

## Single Sign-On (SSO) : un seul compte pour tous les outils

Le **SSO** (*Single Sign-On*, authentification unique) permet à un salarié de se connecter **une seule fois** auprès d'un service central, puis d'accéder à tous les outils de l'entreprise connectés à ce service sans ressaisir d'identifiants. C'est le principe de la [délégation et fédération d'identité](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) vu au chapitre précédent, appliqué à l'échelle d'une entreprise entière plutôt qu'à un seul bouton "Se connecter avec...".

## Le fournisseur d'identité (IdP) : le point central

Le service central qui authentifie les salariés et atteste ensuite de leur identité auprès des autres outils s'appelle un **fournisseur d'identité** (*Identity Provider*, IdP). [Okta](https://www.okta.com) est l'un des fournisseurs les plus répandus : une entreprise y configure une fois ses salariés et les outils autorisés, et Okta prend ensuite en charge l'authentification réelle pour chacun de ces outils.

Deux protocoles standardisés permettent à un outil de faire confiance à l'identité attestée par un IdP comme Okta : [OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (vu au chapitre précédent), et [**SAML**](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) (*Security Assertion Markup Language*), plus ancien, toujours très répandu dans les grandes entreprises. Les deux répondent au même besoin (attester une identité auprès d'un tiers), avec un format d'échange différent (JSON pour OpenID Connect, XML pour SAML).

## Comment un salarié se connecte concrètement

```text
1. Le salarie ouvre "app-interne.entreprise.com"
2. L'application redirige vers la page de connexion Okta
3. Le salarie s'authentifie aupres d'Okta
   (ou passe directement a l'etape 5 s'il a deja une session Okta active,
    ouverte plus tot dans la journee sur un autre outil)
4. Okta verifie les identifiants (et peut exiger une authentification
   multifacteur, centralisee pour tous les outils connectes)
5. Okta redirige vers l'application avec une preuve d'identite
   (un jeton d'identite OpenID Connect, ou une assertion SAML)
6. L'application fait confiance a cette preuve et accorde l'acces
```

## Le vrai bénéfice : une révocation centralisée

Au-delà du confort (un seul mot de passe à retenir), le SSO résout un vrai problème de sécurité : quand un salarié quitte l'entreprise, désactiver son compte **une seule fois** dans l'IdP coupe instantanément son accès à *tous* les outils connectés, plutôt que de compter sur un service informatique qui doit penser à le faire outil par outil, avec le risque d'en oublier un.

> **Piège :** considérer le SSO uniquement comme un confort utilisateur, sans mesurer qu'il concentre l'accès à tous les outils de l'entreprise derrière un seul compte : un compte IdP compromis devient une cible bien plus intéressante pour un attaquant qu'un seul mot de passe isolé, puisqu'il ouvre tout d'un coup.
>
> **Bonne pratique :** protéger le compte IdP lui-même avec une sécurité renforcée (voir [Authentification multifacteur](/?c=authentification&s=renforcer-lauthentification&p=authentification-multifacteur)), puisque sa compromission a un impact démultiplié par rapport à un compte isolé.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le SSO permet de s'authentifier une seule fois auprès d'un fournisseur d'identité (IdP) central, comme Okta, pour accéder ensuite à tous les outils connectés sans ressaisir d'identifiants. OpenID Connect et SAML sont les deux protocoles standardisés qui permettent cette confiance déléguée. |
| **Outils utilisables** | Un IdP comme Okta pour centraliser l'authentification de tous les outils d'une entreprise. |
| **Pièges à éviter** | Voir le SSO uniquement comme un confort, sans mesurer qu'il concentre l'accès à tout derrière un seul compte. |
| **Bonnes pratiques** | Révoquer l'accès d'un salarié qui part en un seul geste, au niveau de l'IdP. Protéger le compte IdP avec une sécurité renforcée, puisqu'il donne accès à tout le reste. |
