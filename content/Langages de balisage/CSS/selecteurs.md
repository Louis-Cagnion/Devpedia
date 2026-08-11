---
order: 1
---

# Les sélecteurs

Un **sélecteur** détermine à quels éléments HTML une règle CSS s'applique : du plus simple (une balise) au plus précis (une combinaison d'attributs et de position dans l'arbre du document).

## Sélecteurs de base

```css
h1 { }        /* tous les éléments <h1> */
.carte { }    /* tous les éléments avec class="carte" */
#en-tete { }  /* l'unique élément avec id="en-tete" */
* { }         /* absolument tous les éléments */
```

> **Note :** une `class` peut être réutilisée sur plusieurs éléments, un `id` doit rester **unique** dans toute la page : un sélecteur `#id` cible donc toujours un seul élément précis, contrairement à `.classe`.

## Combinateurs

```css
article p { }    /* tout <p> descendant de <article>, à N'IMPORTE quelle profondeur */
article > p { }  /* tout <p> ENFANT DIRECT de <article>, pas plus profond */
h2 + p { }       /* le <p> immédiatement APRÈS un <h2>, au même niveau */
h2 ~ p { }       /* TOUS les <p> qui suivent un <h2>, au même niveau */
```

## Sélecteurs d'attributs

```css
input[type="email"] { }  /* tout <input> avec cet attribut ET cette valeur exacte */
a[href^="https"] { }     /* href qui COMMENCE par "https" */
a[href$=".pdf"] { }      /* href qui SE TERMINE par ".pdf" */
a[href*="exemple"] { }   /* href qui CONTIENT "exemple" n'importe où */
```

## Pseudo-classes : cibler un état

```css
a:hover { }            /* quand la souris survole l'élément */
input:focus { }        /* quand le champ a le focus (clic ou tabulation) */
li:first-child { }     /* le premier enfant de son parent */
li:last-child { }      /* le dernier enfant de son parent */
li:nth-child(2) { }    /* le 2e enfant précisément */
li:nth-child(odd) { }  /* tous les enfants impairs (1er, 3e, 5e...) */
input:disabled { }     /* un champ désactivé */
input:required { }     /* un champ marqué "required" en HTML (voir Les formulaires) */
```

## Pseudo-éléments : cibler une partie d'un élément

```css
p::first-line { }             /* uniquement la première ligne affichée du paragraphe */
p::before { content: "→ "; }  /* insère du contenu AVANT le texte réel du paragraphe */
p::after { content: " ✓"; }   /* insère du contenu APRÈS */
```

> **Note :** `::before`/`::after` nécessitent une propriété `content` pour être visibles (même vide, `content: "";`), très utilisés pour ajouter un élément purement décoratif (icône, flèche...) sans alourdir le HTML d'une balise supplémentaire sans réelle signification sémantique (voir [Sémantique HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5)).

## La spécificité : que se passe-t-il en cas de conflit ?

```css
p { color: blue; }
.texte-important { color: red; }
#paragraphe-unique { color: green; }
```

```html
<p id="paragraphe-unique" class="texte-important">Quelle couleur ?</p>
```

Un `id` a une spécificité plus forte qu'une `class`, elle-même plus forte qu'un sélecteur de balise : le paragraphe s'affichera donc en **vert** (`#paragraphe-unique` gagne), quel que soit l'ordre d'écriture des règles dans le fichier.

| Type de sélecteur | Poids (du plus faible au plus fort) |
|---|---|
| Sélecteur universel (`*`) | Le plus faible |
| Balise (`p`, `div`...) | Faible |
| Classe (`.carte`), attribut (`[type=...]`), pseudo-classe (`:hover`) | Moyen |
| `id` (`#en-tete`) | Fort |
| Style en ligne (`style="..."`) | Très fort |
| `!important` | Écrase tout le reste (à éviter, voir [Variables CSS et la cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade)) |

Voir aussi [Variables CSS et la cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade), qui détaille précisément l'ordre de résolution entre spécificité, ordre d'écriture et origine de la règle.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un sélecteur détermine à quels éléments une règle CSS s'applique, du plus simple (balise) au plus précis (attributs, position, état). En cas de conflit, le sélecteur le plus **spécifique** l'emporte (id > classe > balise), sinon la règle écrite en dernier. |
| **Outils utilisables** | Sélecteurs de base, combinateurs (`>`, `+`, `~`), sélecteurs d'attributs, pseudo-classes (`:hover`, `:nth-child`...), pseudo-éléments (`::before`/`::after`). |
| **Pièges à éviter** | Confondre spécificité et ordre d'écriture : un sélecteur plus spécifique gagne toujours, même écrit avant un sélecteur moins spécifique. |
| **Bonnes pratiques** | Préférer les classes aux id pour le style courant (plus faciles à réutiliser et à surcharger) ; réserver `id` à un usage réellement unique sur la page. |
