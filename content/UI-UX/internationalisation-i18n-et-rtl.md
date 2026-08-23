---
order: 7
---

# Internationalisation (i18n) et RTL : concevoir au-delà d'une seule langue

**i18n** (*internationalization*, 18 lettres entre le i et le n) désigne le fait de concevoir un produit pour qu'il **puisse** être adapté à d'autres langues et régions sans le repenser ; **l10n** (*localization*) désigne le travail concret d'adaptation à une langue et une région précises (traduction, format de date, sens de lecture). L'i18n est un prérequis de conception, la l10n en est le résultat pour chaque langue ajoutée.

## i18n vs l10n : rendre possible, puis faire concrètement

| | i18n | l10n |
|---|---|---|
| Moment | Décidé dès la conception et l'architecture du produit | Réalisé pour chaque langue/région ciblée, potentiellement après coup |
| Nature | Structurel : aucun texte en dur, formats adaptables, mise en page qui tolère un texte plus long | Concret : traduction réelle, format de date local, devise locale |
| Coût si oublié | Coûteux à rattraper (restructuration du code et des maquettes) | Coûteux mais isolé (ajouter une langue de plus) |

Un produit pensé i18n dès le départ peut ajouter une langue en l10n presque sans toucher au code ; un produit qui ne l'a pas été doit d'abord être restructuré avant qu'une seule traduction supplémentaire ne soit possible.

## Le piège du texte qui change de longueur

Une traduction n'occupe presque jamais le même espace que le texte d'origine : un mot anglais court peut devenir une expression allemande deux fois plus longue, un espace suffisant en français peut ne pas l'être dans une autre langue.

> **Piège :** concevoir une maquette avec des conteneurs de taille fixe, calibrés sur la longueur du texte dans une seule langue (souvent l'anglais, la langue de conception d'origine). Un texte traduit plus long déborde, se tronque, ou casse la mise en page, découvert seulement une fois la traduction ajoutée.
>
> **Bonne pratique :** tester la mise en page avec un texte artificiellement allongé dès la conception (une technique appelée *pseudo-localisation*), plutôt que d'attendre une vraie traduction pour découvrir le problème ; prévoir des conteneurs qui s'adaptent au contenu plutôt qu'une largeur figée.

## RTL : bien plus qu'un sens de lecture inversé

Une langue **RTL** (*right-to-left*, comme l'arabe ou l'hébreu) ne se contente pas d'inverser le sens de lecture du texte : elle **inverse la mise en page entière**, comme si toute l'interface était reflétée dans un miroir.

| Élément | En LTR (gauche à droite) | En RTL (droite à gauche) |
|---|---|---|
| Alignement du texte | À gauche | À droite |
| Icône "retour" | Flèche vers la gauche | Flèche vers la droite |
| Ordre de la navigation principale | De gauche à droite | De droite à gauche |
| Barre de progression | Se remplit vers la droite | Se remplit vers la gauche |

> **Piège :** ne traduire que le texte et laisser la mise en page identique (icônes de navigation, alignement, ordre des éléments). Le résultat mélange un texte qui se lit de droite à gauche avec une interface toujours pensée de gauche à droite, incohérent et déroutant pour un utilisateur RTL.
>
> **Bonne pratique :** utiliser des propriétés [CSS](/?c=langages&s=css&p=css) "logiques" (`margin-inline-start` plutôt que `margin-left`, par exemple) qui s'inversent automatiquement selon le sens de la page, plutôt que des propriétés physiques figées qu'il faudrait dupliquer manuellement pour chaque sens.

Certaines icônes ne s'inversent volontairement **jamais**, même en RTL : celles qui représentent un objet du monde réel dont l'orientation a un sens universel (une horloge, un symbole de lecture ▶ dans beaucoup de conventions) restent identiques, alors que les icônes purement directionnelles (flèches, chevrons de navigation) s'inversent.

## Ne jamais coder un texte en dur

Un texte écrit directement dans le code (`<button>Valider</button>`) ne peut être traduit qu'en modifiant le code lui-même, langue par langue. La technique standard en i18n externalise chaque texte dans un fichier de traduction, référencé par une **clé** plutôt que par sa valeur :

```json
// fr.json
{ "bouton_valider": "Valider" }

// en.json
{ "bouton_valider": "Confirm" }
```

```javascript
<button>{traduire("bouton_valider")}</button>
```

Ajouter une langue devient alors ajouter un fichier de clés traduites, sans toucher au code qui les affiche.

## Formats sensibles à la locale : dates, nombres, devises

Au-delà du texte, plusieurs formats changent selon la région, indépendamment de la langue elle-même :

| Donnée | Exemple France (fr-FR) | Exemple États-Unis (en-US) |
|---|---|---|
| Date | 20/08/2026 | 08/20/2026 |
| Nombre décimal | 1 234,56 | 1,234.56 |
| Devise | 1 234,56 € | $1,234.56 |

> **Piège :** formater soi-même une date ou un nombre avec une logique écrite à la main (concaténation de chaînes), valable uniquement pour le format d'une seule région. Un utilisateur d'une autre région lit alors une date ambiguë ou mal formée (`08/20/2026` lu comme le 8ᵉ jour du 20ᵉ mois par un lecteur habitué au format jour/mois).
>
> **Bonne pratique :** utiliser les fonctions de formatage sensibles à la locale déjà fournies par le langage ou la plateforme plutôt qu'un formatage écrit à la main, pour que la date, le nombre ou la devise s'affichent automatiquement dans la convention attendue par chaque région.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | L'i18n (rendre un produit adaptable) précède la l10n (l'adapter concrètement à une langue). Un texte traduit change de longueur, ce qui casse une mise en page à taille fixe. Le RTL inverse toute la mise en page, pas seulement le sens du texte. Tout texte doit être externalisé dans un fichier de traduction, jamais codé en dur. |
| **Outils utilisables** | La pseudo-localisation pour tester une mise en page avec un texte allongé. Les propriétés CSS logiques (`margin-inline-start`...) pour un layout qui s'inverse automatiquement en RTL. Les fonctions de formatage sensibles à la locale pour les dates, nombres et devises. |
| **Pièges à éviter** | Une mise en page à taille fixe calibrée sur une seule langue. Ne traduire que le texte sans inverser la mise en page en RTL. Coder un texte en dur plutôt que dans un fichier de traduction. Formater une date ou un nombre à la main plutôt qu'avec les fonctions sensibles à la locale. |
| **Bonnes pratiques** | Tester avec un texte artificiellement allongé dès la conception. Utiliser des propriétés CSS logiques pour la mise en page. Externaliser tout texte dans un fichier de traduction référencé par clé. Utiliser les fonctions de formatage natives sensibles à la locale. |
