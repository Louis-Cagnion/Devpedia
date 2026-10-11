---
order: 9
---

# Graphèmes, points de code et unités UTF-16 : découper un texte sans le casser (11/10/2026)

Combien de « caractères » contient `"👨‍👩‍👧"` ? Un lecteur voit un seul dessin (une famille), [JavaScript](/?c=langages&s=javascript&p=javascript) en compte **8**. Cet écart casse les compteurs de caractères, les textes tronqués, les inversions et les curseurs. Un **émoji** est un petit dessin (visage, drapeau, main...) qui s'écrit comme une lettre. Ce chapitre explique les trois façons de compter un texte et comment le découper sans casser un émoji. Il complète [l'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), qui explique comment un caractère est enregistré en mémoire ou sur disque : ici, on traite le découpage de ce qu'on voit.

Il suppose connus [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les strings](/?c=langages&s=javascript&p=strings) (une **chaîne** est un texte, suite de caractères), [les tableaux](/?c=langages&s=javascript&p=tableaux) (une liste ordonnée dont chaque valeur a un **indice**, sa position, qui commence à 0), [les boucles](/?c=langages&s=javascript&p=boucles) (dont `for...of`), [les fonctions](/?c=langages&s=javascript&p=fonctions) (dont les fonctions fléchées `=>`), [les conditions](/?c=langages&s=javascript&p=conditions) et [les objets](/?c=langages&s=javascript&p=objets). Les exemples s'exécutent avec [Node.js](https://nodejs.org), un programme qui exécute du [JavaScript](/?c=langages&s=javascript&p=javascript) hors d'un navigateur, lancé depuis [un terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), ou dans la console d'un navigateur (le logiciel qui affiche les pages web). `console.log(x)` affiche la valeur `x`. Les résultats ont été vérifiés avec Node.js 22.22.3 (Unicode 17.0).

## Trois façons de compter un « caractère »

Le mot « caractère » désigne trois choses différentes selon qui parle. Un **bit** vaut 0 ou 1 (voir [les entiers et les bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)), un **octet** en groupe huit.

| Niveau | Terme | Définition | Qui s'en sert |
|---|---|---|---|
| Ce que l'œil voit | **graphème** (*grapheme cluster*) | L'unité perçue comme un seul caractère : une lettre avec ses accents, un émoji complet | L'utilisateur, le curseur (le trait clignotant de saisie), les limites de saisie |
| Ce qu'Unicode numérote | **point de code** (*code point*) | Le numéro `U+XXXX` d'un élément du catalogue [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Un graphème en compte un ou plusieurs | `for...of`, `codePointAt`, le catalogue lui-même |
| Ce que JavaScript stocke | **unité de code UTF-16** (*code unit*) | Un bloc de 16 bits (2 octets) de l'encodage [UTF-16](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Un point de code en occupe une ou deux | `length`, `[i]`, `slice`, `charAt` |
| Ce que le disque stocke | **octet** | Un groupe de 8 bits. En [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), un point de code en occupe de 1 à 4 | Fichiers et échanges de données |

Voici la famille `"👨‍👩‍👧"` aux trois premiers niveaux (les nombres sont écrits en **hexadécimal**, ou base 16 : les chiffres 0 à 9 puis `a` à `f`, où `a` vaut 10 et `f` vaut 15) :

```text
graphème         1 seul dessin : 👨‍👩‍👧
                      |
points de code   U+1F468    U+200D    U+1F469    U+200D    U+1F467     (5)
                   |          |         |          |         |
unités UTF-16    D83D DC68   200D    D83D DC69    200D    D83D DC67    (8)
```

`U+200D` est le **joiner de largeur nulle** (*zero width joiner*, ZWJ) : un caractère invisible qui dit « colle ce qui précède à ce qui suit ». Les trois personnages se fondent alors en un dessin unique, si la police le permet (voir [les limites](#les-limites-honnêtes)). Voici les neuf exemples du chapitre, mesurés avec les outils vus plus bas :

| Texte | Points de code | `length` (unités UTF-16) | `[...s].length` (points de code) | Graphèmes | Octets UTF-8 |
|---|---|---|---|---|---|
| `"a"` | `U+0061` | 1 | 1 | 1 | 1 |
| `"é"` en une forme (U+00E9) | `U+00E9` | 1 | 1 | 1 | 2 |
| `"é"` en deux formes (e + accent combinant) | `U+0065` `U+0301` | 2 | 2 | 1 | 3 |
| `"😀"` | `U+1F600` | 2 | 1 | 1 | 4 |
| `"👍🏽"` (émoji + modificateur de teint) | `U+1F44D` `U+1F3FD` | 4 | 2 | 1 | 8 |
| `"👨‍👩‍👧"` (trois émojis reliés par des ZWJ) | `U+1F468` `U+200D` `U+1F469` `U+200D` `U+1F467` | 8 | 5 | 1 | 18 |
| `"🇫🇷"` (deux lettres indicatrices régionales) | `U+1F1EB` `U+1F1F7` | 4 | 2 | 1 | 8 |
| `"한"` en syllabe composée | `U+D55C` | 1 | 1 | 1 | 3 |
| `"한"` en trois jamos | `U+1112` `U+1161` `U+11AB` | 3 | 3 | 1 | 9 |

Le **modificateur de teint** `U+1F3FD` change la couleur de peau de l'émoji qui précède. Les **lettres indicatrices régionales** sont 26 caractères de `U+1F1E6` (A) à `U+1F1FF` (Z) : deux d'affilée forment un drapeau (F puis R donnent 🇫🇷). Les **jamos** sont les lettres de l'alphabet coréen (consonnes et voyelles), qui se regroupent en syllabes : `한` existe aussi en un seul point de code. L'**accent combinant** `U+0301` s'ajoute à la lettre qui précède, voir [l'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Les deux `"é"` sont visuellement identiques, mais pas leurs nombres.

## Les unités UTF-16 : ce que `length` et `slice` comptent

JavaScript stocke un texte en UTF-16. Un point de code jusqu'à `U+FFFF` tient sur une unité. Au-delà (la plupart des émojis), il en faut deux, appelées **paire de substitution** (*surrogate pair*) : une unité « haute » puis une « basse ».

| Unité | Plage (hexadécimal) | Rôle |
|---|---|---|
| Hors paire | `0000` à `D7FF` et `E000` à `FFFF` | Un point de code à elle seule |
| Haute | `D800` à `DBFF` | Première moitié d'une paire |
| Basse | `DC00` à `DFFF` | Seconde moitié d'une paire |

Ces opérations travaillent toutes en unités : [`length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) (le nombre d'unités), `texte[i]` et [`charAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) (l'unité à l'indice `i`), [`charCodeAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) (son nombre), [`slice`](/?c=langages&s=javascript&p=strings) (une portion entre deux indices).

```javascript
const smiley = "😀";
// length compte les unités UTF-16 : ce smiley en occupe deux
console.log(smiley.length);   // -> 2
// charCodeAt(i) renvoie le nombre de l'unité d'indice i
console.log(smiley.charCodeAt(0));   // -> 55357
console.log(smiley.charCodeAt(1));   // -> 56832
// toString(16) écrit ce nombre en hexadécimal : une paire haute (d83d) puis basse (de00)
console.log(smiley.charCodeAt(0).toString(16));   // -> d83d
console.log(smiley.charCodeAt(1).toString(16));   // -> de00
// charAt(0) et smiley[0] sont la même unité, une moitié de paire
console.log(smiley.charAt(0) === smiley[0]);   // -> true
// isWellFormed() teste l'absence de moitié de paire isolée
console.log(smiley.charAt(0).isWellFormed());   // -> false
```

[`toString(16)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) écrit un nombre en base 16, et [`isWellFormed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) vaut `false` si le texte contient une moitié de paire sans l'autre. Couper un texte entre ces deux moitiés produit exactement ce cas :

```javascript
const salut = "Salut 😀";
// slice(0, 7) garde les unités d'indice 0 à 6 : « Salut » et la moitié haute du smiley
const coupe = salut.slice(0, 7);
console.log(coupe);   // -> Salut �
console.log(coupe.length);   // -> 7
console.log(coupe.isWellFormed());   // -> false
// TextEncoder convertit un texte en octets UTF-8
// 6 octets pour « Salut » et l'espace, 3 pour la moitié de paire, remplacée par U+FFFD
console.log(new TextEncoder().encode(coupe).length);   // -> 9
// encodeURIComponent prépare un texte pour une adresse web (URL) et refuse la moitié de paire
try {
    encodeURIComponent(coupe);
} catch (erreur) {
    console.log(erreur.name);   // -> URIError
}
```

Le texte coupé n'est plus du texte valide. Selon l'outil, la moitié isolée est **silencieusement remplacée** par le caractère de remplacement `U+FFFD` (�, 3 octets en UTF-8 : `EF BF BD`, d'où les 9 octets, voir [le mojibake](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) ou **refusée avec une erreur** (`URIError`). Dans le bloc, `try` exécute du code et `catch` attrape l'erreur s'il en lève une (voir [la gestion des erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs)). [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) et [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) sont des outils standards de JavaScript ; les URL sont expliquées dans [le chapitre sur HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

## Les points de code : un cran plus fin

Pour parcourir un texte point de code par point de code, JavaScript offre :

| Outil | Ce qu'il fait | Sur `"a😀é"` |
|---|---|---|
| [`codePointAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt) | Le point de code qui commence à l'indice `i` (en unités) | `codePointAt(1)` donne `128512` |
| [`String.fromCodePoint(n)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) | Le texte d'un point de code | `fromCodePoint(0x1F600)` donne `"😀"` |
| `for (const c of texte)` | Une boucle qui livre un point de code à la fois | 3 tours |
| `[...texte]` | L'opérateur `...` (*spread*, [vu avec les tableaux](/?c=langages&s=javascript&p=tableaux)) déroule le texte en tableau de points de code | 3 éléments |
| [`Array.from(texte)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) | Même résultat, accepte une fonction de transformation en second argument | 3 éléments |
| `texte.split("")` | Coupe en unités (à éviter) | 4 éléments |

Une chaîne est un **itérable** : une valeur que `for...of` ou `...` parcourent élément par élément, grâce à un **itérateur**, l'objet qui livre ces éléments un par un. L'itérateur d'une chaîne livre des points de code, pas des unités.

```javascript
const melange = "a😀é";
// length compte les unités : a (1) + smiley (2) + é (1)
console.log(melange.length);   // -> 4
// codePointAt(1) lit le point de code qui commence à l'indice 1 : le smiley entier
console.log(melange.codePointAt(1));   // -> 128512
console.log(melange.codePointAt(1).toString(16));   // -> 1f600
// l'indice 2 tombe au milieu de la paire : on lit seulement la moitié basse
console.log(melange.codePointAt(2));   // -> 56832
// 0x1F600 est un nombre écrit en hexadécimal dans le code
console.log(String.fromCodePoint(0x1F600));   // -> 😀
// le spread et Array.from comptent des points de code
console.log([...melange]);   // -> [ 'a', '😀', 'é' ]
console.log(Array.from(melange).length);   // -> 3
// split("") coupe en unités : la paire du smiley est brisée
console.log(melange.split(""));   // -> [ 'a', '\ud83d', '\ude00', 'é' ]
```

```javascript
// for...of livre un point de code par tour, avec sa longueur en unités
for (const element of melange) {
    console.log(element, element.length);
}
```

```text
a 1
😀 2
é 1
```

Les points de code ne suffisent pourtant pas : `"👍🏽"` en compte 2 et `"👨‍👩‍👧"` en compte 5, alors qu'ils s'affichent comme un seul dessin. Couper entre deux points de code sépare un émoji de son modificateur ou de son ZWJ (exemple plus bas).

## Les graphèmes avec `Intl.Segmenter`

[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) est l'ensemble des fonctions standards de JavaScript qui dépendent de la langue (dates, nombres, tri de textes...), au cœur de l'[internationalisation](/?c=ui-ux&p=internationalisation-i18n-et-rtl). Son outil [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) découpe un texte selon les règles d'Unicode ([UAX #29](https://unicode.org/reports/tr29/), l'annexe n° 29 de la norme, consacrée au découpage du texte). Il est disponible dans les navigateurs récents depuis avril 2024 (« Baseline 2024 » selon [MDN](https://developer.mozilla.org/), la documentation de référence du web) et dans Node.js 22.

| Élément | Rôle |
|---|---|
| `new Intl.Segmenter(langue, options)` | Crée un découpeur (`new` crée un objet à partir d'un modèle, voir [les classes](/?c=langages&s=javascript&p=poo)). `langue` est un code comme `"fr"` ; `options` est un [objet](/?c=langages&s=javascript&p=objets) |
| `{ granularity: "grapheme" }` | Découpe en graphèmes (valeur par défaut) |
| `{ granularity: "word" }` / `{ granularity: "sentence" }` | Découpe en mots / en phrases : utile surtout pour les langues écrites sans espaces (japonais, chinois, thaï) ; pour les mots, `isWordLike` distingue un mot de la ponctuation |
| `decoupeur.segment(texte)` | Renvoie un itérable de morceaux |
| Un morceau | Un objet `{ segment, index, input }` : le texte du morceau, son indice de départ (en unités UTF-16), le texte entier |
| `.containing(indice)` | Le morceau qui contient cet indice, `undefined` (la valeur qui signifie « rien ») si l'indice est hors du texte |

Le bloc suivant définit le découpeur et trois fonctions réutilisées par tous les blocs de la suite du chapitre. Chaque fonction a un commentaire de description : `@param` donne la forme de l'argument, `@returns` celle du résultat (`string[]` signifie « tableau de chaînes »).

```javascript
// Un seul découpeur, créé une fois et réutilisé : langue "fr", un morceau par graphème
const decoupeur = new Intl.Segmenter("fr", { granularity: "grapheme" });

/**
 * @brief Découpe un texte en graphèmes.
 *
 * @param {string} texte
 *
 * @returns {string[]} un élément par graphème
 */
function graphemes(texte) {
    // Array.from(itérable, fonction) applique la fonction à chaque morceau
    return Array.from(decoupeur.segment(texte), (morceau) => morceau.segment);
}

/**
 * @brief Compte les graphèmes d'un texte.
 *
 * @param {string} texte
 *
 * @returns {number}
 */
function compterGraphemes(texte) {
    return Array.from(decoupeur.segment(texte)).length;
}

/**
 * @brief Compte un texte en unités UTF-16, points de code, graphèmes et octets UTF-8.
 *
 * @param {string} texte
 *
 * @returns {{unites: number, pointsDeCode: number, graphemes: number, octets: number}}
 */
function mesurer(texte) {
    return {
        unites: texte.length,
        pointsDeCode: [...texte].length,
        graphemes: compterGraphemes(texte),
        octets: new TextEncoder().encode(texte).length,
    };
}

const exemple = "Hé👍🏽🇫🇷";
// chaque graphème est un élément : la teinte et le drapeau ne sont pas séparés
console.log(graphemes(exemple));   // -> [ 'H', 'é', '👍🏽', '🇫🇷' ]
// un morceau complet, avec son indice de départ (H = 1 unité, é = 1 unité)
const decoupes = Array.from(decoupeur.segment(exemple));
console.log(decoupes[2]);   // -> { segment: '👍🏽', index: 2, input: 'Hé👍🏽🇫🇷' }
console.log(mesurer("a"));   // -> { unites: 1, pointsDeCode: 1, graphemes: 1, octets: 1 }
console.log(mesurer("😀"));   // -> { unites: 2, pointsDeCode: 1, graphemes: 1, octets: 4 }
const famille = "👨‍👩‍👧";
console.log(mesurer(famille));   // -> { unites: 8, pointsDeCode: 5, graphemes: 1, octets: 18 }
console.log(mesurer("🇫🇷"));   // -> { unites: 4, pointsDeCode: 2, graphemes: 1, octets: 8 }
```

## Tronquer à N graphèmes

Tronquer « à 20 caractères » est l'usage le plus courant. La fonction suivante coupe sur une frontière de graphème, donc jamais au milieu d'un émoji ou d'une lettre accentuée :

```javascript
/**
 * @brief Tronque un texte à max graphèmes et ajoute « … » s'il a été coupé.
 *
 * @param {string} texte
 * @param {number} max entier supérieur ou égal à 0
 *
 * @returns {string}
 */
function tronquer(texte, max) {
    const morceaux = graphemes(texte);
    if (morceaux.length <= max) {
        return texte;
    }
    return morceaux.slice(0, max).join("") + "…";
}

const annonce = "Bravo 👨‍👩‍👧 et 🇫🇷 !";
console.log(annonce.length);   // -> 24
console.log([...annonce].length);   // -> 19
console.log(compterGraphemes(annonce));   // -> 14
// à 7 unités, la paire de l'homme est coupée en deux
console.log(annonce.slice(0, 7));   // -> Bravo �
// à 7 points de code, l'homme reste mais la famille est brisée
console.log([...annonce].slice(0, 7).join(""));   // -> Bravo 👨
// à 7 graphèmes, la famille est entière
console.log(tronquer(annonce, 7));   // -> Bravo 👨‍👩‍👧…
console.log(tronquer(annonce, 8));   // -> Bravo 👨‍👩‍👧 …
// un texte assez court est rendu tel quel
console.log(tronquer(annonce, 14) === annonce);   // -> true
```

| Méthode (limite 7) | Résultat | Défaut |
|---|---|---|
| `annonce.slice(0, 7)` | `"Bravo �"` | Moitié de paire isolée |
| `[...annonce].slice(0, 7).join("")` | `"Bravo 👨"` | Famille réduite à un homme (avec 8, il reste un ZWJ orphelin) |
| `tronquer(annonce, 7)` | `"Bravo 👨‍👩‍👧…"` | Aucun |

`tronquer` ajoute « … » après `max` graphèmes : le texte rendu peut donc en compter `max + 1`.

## La normalisation : deux « é » qui ne sont pas égaux

Le « é » existe en deux écritures : le point de code unique `U+00E9`, ou `e` suivi de l'accent combinant `U+0301`. Elles s'affichent pareil, mais le texte n'est pas le même. La **normalisation** convertit un texte vers une forme canonique, pour que deux écritures équivalentes deviennent identiques. Dans le code, `\u00E9` écrit le point de code `U+00E9` (quatre chiffres hexadécimaux) et `\u{1F600}` ceux qui dépassent `U+FFFF`.

| Forme | Effet | Quand l'utiliser |
|---|---|---|
| `"NFC"` | Recompose : un seul point de code quand c'est possible | Comparer et stocker (la forme la plus courante) |
| `"NFD"` | Décompose : lettre de base + accents combinants | Séparer les accents d'une lettre |
| `"NFKC"` / `"NFKD"` | Comme les précédentes, et unifient aussi les variantes de présentation (la ligature `ﬁ`, deux lettres dessinées en un signe, devient `fi`) | Recherche tolérante |

[`normalize(forme)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) applique ces formes, que [l'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) détaille ; le standard est [UAX #15](https://unicode.org/reports/tr15/).

```javascript
// \u00E9 : le point de code U+00E9 ; e\u0301 : e suivi de l'accent aigu combinant U+0301
const eUnique = "\u00E9";
const eCombine = "e\u0301";
console.log(eUnique, eCombine);   // -> é é
// === compare les deux textes unité par unité : ils diffèrent
console.log(eUnique === eCombine);   // -> false
console.log(eUnique.length, eCombine.length);   // -> 1 2
// pour l'œil et pour Intl.Segmenter, c'est un seul graphème dans les deux cas
console.log(compterGraphemes(eUnique), compterGraphemes(eCombine));   // -> 1 1
// après normalisation dans la même forme, les deux textes sont égaux
console.log(eCombine.normalize("NFC") === eUnique);   // -> true
console.log(eUnique.normalize("NFD") === eCombine);   // -> true
```

Pour comparer deux textes saisis par des humains, normaliser les deux dans la même forme avant `===` :

```javascript
/**
 * @brief Indique si deux textes s'écrivent pareil, quelle que soit leur composition.
 *
 * @param {string} texteA
 * @param {string} texteB
 *
 * @returns {boolean}
 */
function memeTexte(texteA, texteB) {
    return texteA.normalize("NFC") === texteB.normalize("NFC");
}

console.log(memeTexte(eUnique, eCombine));   // -> true
// les jamos coréens se recomposent en syllabe avec NFC
console.log("\u1112\u1161\u11AB".normalize("NFC") === "\uD55C");   // -> true
// NFC ne donne pas toujours un seul point de code : q + tilde (˜) n'a pas de forme composée
console.log("q\u0303".normalize("NFC").length);   // -> 2
// NFC garde la ligature ﬁ, NFKC la remplace par fi
console.log("\uFB01".normalize("NFKC"));   // -> fi
// localeCompare compare selon la langue et juge ces deux textes équivalents (0)
console.log(eUnique.localeCompare(eCombine));   // -> 0
```

[`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) compare deux textes selon les règles d'une langue (utile pour trier), et renvoie un nombre négatif ou positif selon l'ordre, ou 0 s'ils sont équivalents. La normalisation sert aussi à retirer les accents :

```javascript
// NFD sépare les accents, \p{M} désigne les « marques » (accents combinants)
const phrase = "Éléphant à l'été";
console.log(phrase.normalize("NFD").replace(/\p{M}/gu, ""));   // -> Elephant a l'ete
```

`replace` et [les regex](/?c=langages&s=javascript&p=regex) (dont le drapeau `g`, « partout », et le drapeau `u`, qui active le mode Unicode) sont vus dans leurs chapitres ; [`\p{M}`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) est une classe de caractères Unicode. La normalisation ne fusionne pas les séquences d'émojis : `"👍🏽"` reste deux points de code.

## Cas pratiques : le mauvais code, le bon code

| Besoin | Mauvais code | Problème | Bon code |
|---|---|---|---|
| Limite de saisie | `texte.length <= 10` | Compte des unités : une famille pèse 8 | `compterGraphemes(texte) <= 10` |
| Inverser | `texte.split("").reverse().join("")` | Paires brisées, accents devant leur lettre | `graphemes(texte).reverse().join("")` |
| Majuscule initiale | `texte[0].toUpperCase() + texte.slice(1)` | Échoue si la première lettre est sur deux unités | Mettre en majuscule le premier graphème |
| Suppression arrière | `texte.slice(0, -1)` | Laisse une moitié d'émoji | Retirer le dernier graphème |
| Curseur | `position + 1` | Le curseur tombe au milieu d'un graphème | Avancer jusqu'à la fin du graphème |

### Limiter la longueur d'un champ

L'attribut [HTML](/?c=langages&s=html&p=html) `maxlength` d'un champ de [formulaire](/?c=langages&s=html&p=formulaires) mesure en unités UTF-16 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength)) : trois familles de suite pèsent 24 unités. La norme UAX #29 précise qu'une limite en graphèmes est une limite « perçue », pas une taille de données : elle conseille de la combiner avec une limite en octets (par exemple 300 graphèmes et 3000 octets UTF-8) pour borner le stockage.

```javascript
const message = "Salut 👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧";
const LIMITE = 10;
console.log(message.length);   // -> 30
console.log(compterGraphemes(message));   // -> 9
// la limite en unités refuse ce message à tort
console.log(message.length <= LIMITE);   // -> false
console.log(compterGraphemes(message) <= LIMITE);   // -> true

/**
 * @brief Vérifie les deux limites : graphèmes (perçu) et octets UTF-8 (stockage).
 *
 * @param {string} texte
 * @param {number} maxGraphemes
 * @param {number} maxOctets
 *
 * @returns {boolean}
 */
function respecteLimites(texte, maxGraphemes, maxOctets) {
    const octets = new TextEncoder().encode(texte).length;
    return compterGraphemes(texte) <= maxGraphemes && octets <= maxOctets;
}

console.log(respecteLimites(message, 10, 100));   // -> true
console.log(respecteLimites(message, 10, 40));   // -> false
```

Le message pèse 6 octets pour « Salut » et 3 fois 18 pour les familles, soit 60 octets : la seconde limite (40) le refuse.

### Inverser une chaîne

```javascript
const mot = "Noe\u0301 🇫🇷👍🏽";
// split("") + reverse : les moitiés de paires se recollent n'importe comment
console.log(mot.split("").reverse().join(""));   // -> �🁍🗷🇫� ́eoN
// [...mot] + reverse : le modificateur passe avant l'émoji, le drapeau devient 🇷🇫
console.log([...mot].reverse().join(""));   // -> 🏽👍🇷🇫 ́eoN
// graphemes + reverse : chaque graphème garde son intégrité
console.log(graphemes(mot).reverse().join(""));   // -> 👍🏽🇫🇷 éoN
```

`reverse()` inverse l'ordre d'un tableau sur place et `join("")` recolle ses éléments (voir [les tableaux](/?c=langages&s=javascript&p=tableaux)). Inverser un texte garde une limite : en arabe ou en hébreu, qui s'écrivent de droite à gauche, l'ordre d'affichage n'est pas l'ordre de stockage (voir [l'internationalisation](/?c=ui-ux&p=internationalisation-i18n-et-rtl)).

### Mettre la première lettre en majuscule

Les accents combinants se trouvent après la lettre : `texte[0]` suffit donc souvent. Le défaut apparaît pour une lettre hors de `U+FFFF` (comme `U+10428`, une lettre minuscule de l'alphabet déséret), dont `texte[0]` n'est qu'une moitié de paire que `toUpperCase` laisse intacte. [`toLocaleUpperCase(langue)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) tient en plus compte de la langue (en turc, `i` donne `İ`, avec un point).

```javascript
/**
 * @brief Met la première lettre en majuscule, en prenant tout le premier graphème.
 *
 * @param {string} texte
 * @param {string} langue code de langue, par exemple "fr"
 *
 * @returns {string}
 */
function majusculeInitiale(texte, langue) {
    if (texte === "") {
        return texte;
    }
    const premier = graphemes(texte)[0];
    return premier.toLocaleUpperCase(langue) + texte.slice(premier.length);
}

/**
 * @brief Version naïve : majuscule sur la première unité seulement.
 *
 * @param {string} texte
 *
 * @returns {string}
 */
function majusculeInitialeNaive(texte) {
    return texte[0].toUpperCase() + texte.slice(1);
}

const deseret = "\u{10428}x";
// la version naïve laisse U+10428 inchangé
console.log(majusculeInitialeNaive(deseret).codePointAt(0).toString(16));   // -> 10428
// la version par graphème obtient la majuscule U+10400
console.log(majusculeInitiale(deseret, "fr").codePointAt(0).toString(16));   // -> 10400
// "tr" désigne le turc : le i devient un İ avec point
console.log(majusculeInitiale("ilyes", "tr"));   // -> İlyes
console.log(majusculeInitiale("ilyes", "fr"));   // -> Ilyes
```

La longueur peut aussi changer : `"ß".toUpperCase()` donne `"SS"`, deux lettres.

### Suppression arrière et curseur

Un champ de saisie standard gère son curseur tout seul ; ces fonctions servent quand on gère soi-même le texte et la position (un éditeur maison). La **position du curseur** est un indice en unités, placé entre deux unités.

```javascript
const reponse = "Oui 👍🏽";
// slice(0, -1) retire la dernière unité : il reste un bout du modificateur de teint
console.log(reponse.slice(0, -1).isWellFormed());   // -> false

/**
 * @brief Retire le dernier graphème (touche « retour arrière »).
 *
 * @param {string} texte
 *
 * @returns {string}
 */
function supprimerDernier(texte) {
    const morceaux = graphemes(texte);
    morceaux.pop();
    return morceaux.join("");
}

// il reste « Oui » et son espace : le pouce et sa teinte partent ensemble
console.log(supprimerDernier(reponse) === "Oui ");   // -> true

/**
 * @brief Renvoie la position après le graphème qui contient position.
 *
 * @param {string} texte
 * @param {number} position indice en unités, de 0 à texte.length
 *
 * @returns {number}
 */
function avancerCurseur(texte, position) {
    const morceau = decoupeur.segment(texte).containing(position);
    if (morceau === undefined) {
        return position;
    }
    return morceau.index + morceau.segment.length;
}

/**
 * @brief Renvoie la position de début du graphème qui précède position.
 *
 * @param {string} texte
 * @param {number} position indice en unités, de 0 à texte.length
 *
 * @returns {number}
 */
function reculerCurseur(texte, position) {
    if (position <= 0) {
        return 0;
    }
    return decoupeur.segment(texte).containing(position - 1).index;
}

const ligne = "a👍🏽b";
console.log(ligne.length);   // -> 6
// de 1 (avant le pouce), le curseur saute à 5 (après les 4 unités du pouce)
console.log(avancerCurseur(ligne, 1));   // -> 5
console.log(avancerCurseur(ligne, 6));   // -> 6
console.log(reculerCurseur(ligne, 5));   // -> 1
console.log(reculerCurseur(ligne, 0));   // -> 0
```

`pop()` retire le dernier élément d'un tableau.

## Les limites honnêtes

Compter les graphèmes est la meilleure approximation du « caractère perçu » qu'on sache calculer, pas une vérité.

| Limite | Détail |
|---|---|
| La définition évolue | Chaque version d'Unicode peut changer les règles. Dans UAX #29, la règle GB9c (les groupes de consonnes des écritures indiennes) est absente de la révision pour [Unicode 15.0](https://www.unicode.org/reports/tr29/tr29-41.html) (2022), présente et modifiée dans celle pour [Unicode 15.1](https://www.unicode.org/reports/tr29/tr29-43.html) (2023), puis modifiée de nouveau pour [Unicode 18.0](https://www.unicode.org/reports/tr29/tr29-49.html) (2026) |
| Le résultat dépend de l'environnement | Node.js 22.22.3 embarque Unicode 17.0 (valeur lue dans `process.versions.unicode`). Un navigateur ou une autre version de Node.js peut compter autrement. Exemple ci-dessous |
| Une largeur n'est pas un nombre de graphèmes | Dans une police à chasse fixe (comme celle d'un terminal), chaque lettre latine occupe la même largeur, mais les idéogrammes et beaucoup d'émojis sont classés « larges » (propriété East Asian Width, [UAX #11](https://unicode.org/reports/tr11/)) et en occupent en général le double. Aligner des colonnes demande la largeur affichée, pas le nombre de graphèmes |
| La police décide du dessin | Une **police** est le fichier qui contient le dessin (**glyphe**) de chaque caractère. Si elle n'a pas celui d'une séquence, le système peut afficher les composants séparés (👨 👩 👧 au lieu de 👨‍👩‍👧). Le découpeur ne regarde pas la police : le nombre de graphèmes ne change pas |
| La langue et le contexte comptent | UAX #29 précise qu'un caractère perçu peut varier selon la langue, le style d'écriture ou le contexte, et que l'algorithme est une approximation sans métadonnées de langue |
| Un graphème n'a pas de taille maximale | Il n'y a pas de limite à la taille d'un graphème : une limite en graphèmes ne borne ni les unités ni les octets |

```javascript
const conjonction = "\u0915\u094D\u0937";
// trois points de code (क, un virama et ष) forment un seul graphème ici
console.log(conjonction.length, [...conjonction].length);   // -> 3 3
console.log(compterGraphemes(conjonction));   // -> 1
```

Ce groupe de consonnes de l'écriture devanagari (utilisée pour le hindi) est écrit avec trois points de code : la consonne क, un **virama** (signe qui supprime la voyelle de la consonne qui précède) puis la consonne ष. Ils forment un seul graphème avec Unicode 17.0, grâce à la règle GB9c, absente de la révision pour Unicode 15.0. Un autre outil, ou une version plus ancienne, peut donc compter différemment.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Croire que `length` compte les caractères | Il compte des unités UTF-16 : `"😀".length` vaut 2 et `"👨‍👩‍👧".length` vaut 8 |
| `slice`, `split("")`, `charAt` au milieu d'un texte | Coupent entre deux unités : moitié de paire isolée, � ou erreur (`URIError`) plus loin |
| Couper aux points de code (`[...texte].slice`) | Sépare un émoji de son modificateur, de son ZWJ ou de la seconde lettre d'un drapeau |
| Comparer deux textes avec `===` sans normaliser | Deux « é » identiques à l'écran peuvent être différents |
| Inverser avec `split("").reverse()` | Casse les paires, place les accents devant leur lettre |
| Utiliser `maxlength` comme limite en caractères | Il compte en unités UTF-16 |
| Appeler `new Intl.Segmenter` sans le vérifier | Absent des environnements anciens : l'appel provoque une erreur |
| Croire qu'un nombre de graphèmes borne la taille | Un graphème peut peser beaucoup d'octets (18 pour la famille) et sa taille n'est pas bornée |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Compter et couper avec `Intl.Segmenter` quand le résultat est montré à l'utilisateur | Le graphème est l'unité qu'il perçoit |
| Utiliser `length` pour un calcul de taille interne (indice dans `slice`, mémoire) | C'est l'unité réelle de JavaScript, lue sans aucun découpage |
| Créer le découpeur une seule fois et le réutiliser | Inutile de le reconstruire à chaque appel |
| Combiner une limite en graphèmes et une limite en octets | Borne à la fois l'affichage et le stockage |
| Normaliser en NFC avant de comparer ou de stocker | Deux écritures du même texte deviennent égales |
| Vérifier `typeof Intl.Segmenter === "function"` si la cible est ancienne (`typeof x` donne le type de `x` sous forme de texte) | Évite une erreur dans un environnement sans cet outil |
| Appeler `isWellFormed()` sur un texte reçu de l'extérieur | Détecte une moitié de paire avant qu'elle ne casse un traitement |
| Tester avec des émojis, des accents combinants, un drapeau et du coréen | Les cas simples cachent presque tous les défauts |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un « caractère » se compte à trois niveaux : le graphème (ce que l'œil voit), le point de code (ce qu'Unicode numérote), l'unité UTF-16 (ce que `length` et `slice` comptent). `"👨‍👩‍👧"` vaut 1 graphème, 5 points de code, 8 unités et 18 octets UTF-8. `Intl.Segmenter` découpe en graphèmes, `normalize("NFC")` rend comparables deux écritures du même texte. Le résultat dépend de la version d'Unicode, et la largeur affichée n'est pas le nombre de graphèmes. |
| **Pièges à éviter** | `length`, `slice` et `split("")` au milieu d'un texte ; couper aux points de code ; comparer sans normaliser ; inverser avec `split("").reverse()` ; `maxlength` pris pour un compte de caractères ; `Intl.Segmenter` non vérifié ; confondre limite en graphèmes et limite d'octets. |
| **Bonnes pratiques** | Compter et couper en graphèmes pour ce que l'utilisateur voit, en unités pour les calculs internes ; créer un seul découpeur ; normaliser en NFC avant de comparer ; doubler la limite en graphèmes d'une limite en octets ; tester avec émojis, accents combinants, drapeaux et coréen. |
