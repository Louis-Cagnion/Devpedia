---
order: 3
---

# Typographie

La taille et le poids du texte ont déjà été présentés comme des leviers de [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle). Ce chapitre va plus loin : quelles polices choisir, et comment les associer sans nuire à la lisibilité.

## Les familles de polices

Toute police appartient à l'une de ces trois familles :

| Famille | Caractéristique visuelle | Connotation | Usage typique | Exemples |
|---|---|---|---|---|
| Serif (avec empattements) | Petits traits aux extrémités des lettres | Confiance, tradition | Imprimé, textes longs | Georgia, Times New Roman, Merriweather |
| Sans-serif (sans empattement) | Lignes nettes, sans décoration | Moderne, épuré | Interfaces à l'écran (la majorité des sites) | Helvetica, Arial, Inter, Roboto |
| Monospace | Chaque caractère occupe exactement la même largeur | Technique, précis | Code, données tabulaires | Courier New, Fira Code, Consolas |

> **Pourquoi ça compte :** une police mal choisie envoie un signal contraire au message. Une police manuscrite sur un site bancaire, par exemple, contredit le sérieux attendu du contenu, même si le texte reste parfaitement lisible.

## Hiérarchie typographique : une échelle, pas des tailles au hasard

Les tailles et graisses utilisées sur un site doivent suivre une échelle définie à l'avance, pas être choisies au cas par cas :

| Élément | Taille indicative | Graisse |
|---|---|---|
| Titre principal (`h1`) | 32-48px | Gras (700) |
| Sous-titre (`h2`) | 24-32px | Semi-gras (600) |
| Titre de section (`h3`) | 18-24px | Semi-gras (600) |
| Corps de texte | 16px | Normal (400) |
| Texte secondaire | 14px | Normal (400) |

> **Piège :** utiliser plus de 2-3 polices différentes sur un même projet. Chaque police supplémentaire ajoute du bruit visuel et dilue la [hiérarchie](/?c=ui-ux&p=hierarchie-visuelle) au lieu de la renforcer.
>
> **Bonne pratique :** se limiter à 2-3 polices par projet : typiquement une pour les titres, une pour le corps de texte, et éventuellement une monospace réservée au code ou aux données.

## Lisibilité : longueur de ligne, interlignage, espacement

Trois réglages déterminent si un texte se lit confortablement ou fatigue l'œil :

| Réglage | Valeur recommandée | Effet si mal réglé |
|---|---|---|
| Longueur de ligne | ~50-75 caractères | Trop long : l'œil perd le fil en revenant à la ligne suivante. Trop court : la lecture est hachée par des retours à la ligne trop fréquents |
| Interlignage (*line-height*) | 1.4 à 1.6 fois la taille du texte | Trop serré : les lignes se chevauchent visuellement. Trop espacé : le texte perd sa cohésion, semble décousu |
| Espacement des lettres | Valeur par défaut de la police, sauf cas particulier | Un espacement resserré sur un titre en majuscules réduit la lisibilité ; l'écarter légèrement aide au contraire |

```text
❌ Trop long (page pleine largeur, plus de 100 caractères par ligne) : l'œil doit
   parcourir une trop grande distance pour retrouver le début de la ligne suivante.

✅ Correct (~65 caractères par ligne) : l'œil retrouve facilement le début
   de la ligne suivante, la lecture reste fluide sur toute la longueur du texte.
```

## Le pairing : associer deux polices

Le **pairing** consiste à choisir une police pour les titres et une autre pour le corps de texte :

| Titres | Corps de texte | Pourquoi ça fonctionne |
|---|---|---|
| Playfair Display (serif) | Inter (sans-serif) | Contraste marqué entre les deux : chacune reste identifiable dans son rôle |
| Montserrat (sans-serif, gras) | Open Sans (sans-serif, normal) | Même style général, distinction par la graisse plutôt que par la forme des lettres |

> **Piège :** associer deux polices qui se ressemblent presque, sans être identiques. Le résultat ressemble à une erreur (la mauvaise police appliquée par mégarde) plutôt qu'à un choix voulu.
>
> **Bonne pratique :** viser un contraste net entre les deux polices (styles clairement différents), ou à défaut rester dans la même famille en jouant sur la graisse, jamais un entre-deux ambigu.

> **Tendance actuelle (2026) :** une typographie audacieuse et surdimensionnée, parfois volontairement "désordonnée", utilisée comme élément central de l'identité visuelle plutôt que comme simple habillage du texte.

## Passer à l'implémentation

Comme pour une palette de couleurs, une échelle de tailles et une liste de polices se déclarent en [CSS](/?c=langages-de-balisage&s=css&p=css) comme des valeurs réutilisables : voir [Variables CSS et la cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque police appartient à une famille (serif, sans-serif, monospace) porteuse d'une connotation. Une échelle de tailles/graisses cohérente et une lisibilité soignée (longueur de ligne, interlignage) priment sur le choix esthétique des polices elles-mêmes. |
| **Outils utilisables** | Aucun outil spécifique : le choix et l'échelle des polices se décident à la conception, puis se déclarent en [CSS](/?c=langages-de-balisage&s=css&p=css). |
| **Pièges à éviter** | Utiliser plus de 2-3 polices sur un même projet ; associer deux polices trop proches visuellement sans que ce soit un choix assumé. |
| **Bonnes pratiques** | Limiter le projet à 2-3 polices maximum ; viser un contraste net entre police de titre et police de corps de texte (ou rester dans la même famille en jouant sur la graisse). |
