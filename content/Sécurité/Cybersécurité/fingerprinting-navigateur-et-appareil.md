---
order: 12
---

# Le fingerprinting : reconnaître un appareil sans rien y stocker

Un site reconnaît habituellement un visiteur en déposant un identifiant dans un [cookie](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) sur son appareil, puis en le relisant à chaque visite. Le **fingerprinting** (ou "prise d'empreinte") atteint un but proche (reconnaître le même appareil d'une visite à l'autre) mais sans rien stocker du tout : il combine une série de détails techniques déjà exposés par le navigateur pour former une signature quasi unique.

## Le principe : combiner des détails anodins, individuellement peu uniques

Pris séparément, aucun des détails ci-dessous n'identifie personne : des millions de personnes partagent la même résolution d'écran, ou le même fuseau horaire. Mais leur **combinaison** devient rapidement unique :

| Détail collecté | Exemple de valeur |
|---|---|
| Résolution d'écran | 1920×1080 |
| Fuseau horaire | Europe/Paris |
| Langue du navigateur | fr-FR |
| Version du navigateur et de l'OS | Chrome 128 sur Windows 11 |
| Polices installées | Liste de 340 polices détectées |
| Rendu graphique (Canvas/WebGL) | Empreinte de pixels propre à la carte graphique |

```text
Résolution + Fuseau + Langue + Navigateur + Polices + Rendu graphique
        ↓ (combinés et réduits à une valeur unique, par hachage)
                    "empreinte" quasi unique de l'appareil
```

> **Analogie :** aucune des mensurations d'une personne (taille, pointure, couleur des yeux) ne l'identifie seule parmi des millions d'individus, mais leur combinaison précise réduit le champ à très peu de monde. Le fingerprinting fait la même chose avec des caractéristiques techniques du navigateur.

## Le canvas fingerprinting : un exemple concret

Une technique très utilisée consiste à faire dessiner par le navigateur, dans un élément invisible de la page, un texte ou une forme géométrique précise, puis à relire les pixels obtenus. Le résultat exact dépend de la carte graphique, du pilote et du moteur de rendu de police installés, si bien que deux machines différentes produisent presque toujours un résultat légèrement différent, même à partir du même code :

```text
1. Le site demande au navigateur : "dessine ce texte dans une zone cachée"
2. Le navigateur dessine, en utilisant sa carte graphique et ses polices
3. Le site relit les pixels obtenus, pixel par pixel
4. Ces pixels sont réduits à une empreinte unique (hachage)
5. Cette empreinte identifie la machine, sans avoir rien stocké dessus
```

## Pourquoi cette technique existe

| Usage | Explication |
|---|---|
| Lutte contre la fraude | Reconnaître un appareil déjà banni même après suppression de ses cookies ou passage en navigation privée |
| Détection de bots | Un vrai navigateur produit une empreinte cohérente et stable ; un robot d'automatisation produit souvent une empreinte incohérente ou absente |
| Publicité ciblée | Continuer à suivre un visiteur d'un site à l'autre, même si celui-ci refuse ou supprime les cookies |

> **Piège :** croire que refuser les cookies ou naviguer en mode privé empêche tout suivi. Le fingerprinting ne dépend d'aucun cookie : il ne stocke rien sur l'appareil, donc rien à supprimer ni à refuser via une simple bannière de consentement aux cookies.
>
> **Bonne pratique (développeur) :** réserver le fingerprinting à des usages défensifs justifiés (anti-fraude, anti-bot) et documentés, jamais comme contournement discret d'un refus de suivi exprimé par ailleurs (cookies refusés). Un usage publicitaire déguisé s'expose au même cadre légal que le suivi par cookie, avec une trace bien plus difficile à justifier a posteriori face à un utilisateur ou un régulateur.
>
> **Bonne pratique (utilisateur) :** certains navigateurs (Firefox, Safari) réduisent activement la précision de l'empreinte disponible (résultats de canvas légèrement randomisés, moins de détails exposés par défaut) ; une extension de blocage de fingerprinting peut compléter cette protection.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le fingerprinting reconnaît un appareil en combinant des détails techniques déjà exposés par le navigateur (écran, fuseau, polices, rendu graphique), sans rien stocker dessus, contrairement à un cookie. |
| **Outils utilisables** | Les protections anti-fingerprinting intégrées à Firefox/Safari, ou une extension dédiée. |
| **Pièges à éviter** | Croire que supprimer ses cookies ou naviguer en privé empêche tout suivi. |
| **Bonnes pratiques** | Réserver le fingerprinting aux usages défensifs justifiés (fraude, bots) plutôt qu'au contournement discret d'un refus de suivi. |
