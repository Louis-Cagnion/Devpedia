---
order: 13
---

# Le banc de tests intégré de Node : node:test (31/10/2026)

**Node.js** ([nodejs.org](https://nodejs.org)) est le programme qui exécute du JavaScript en dehors d'un navigateur, directement depuis le terminal. Il embarque de série un **banc de tests** : un outil qui trouve les fichiers de tests, les exécute, compare les résultats aux valeurs attendues et affiche un rapport. Il s'appelle `node:test` et ne demande aucune installation supplémentaire. Sa documentation officielle est [la page node:test de Node.js](https://nodejs.org/api/test.html).

Ce chapitre complète [les tests unitaires](/?c=tests&p=tests-unitaires), qui expliquent ce qu'est un bon test, et [les tests end-to-end](/?c=tests&p=tests-end-to-end), qui simulent un parcours complet. Le chapitre sur [le navigateur sans fenêtre](/?c=tests&p=tests-navigateur-sans-fenetre) a écrit son propre petit banc à la main : `node:test` fournit tout cela déjà prêt (rapport, code de sortie, filtres), et peut très bien servir de base à ce genre de série. Il suppose connus [le terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des commandes), [un éditeur de code](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions), [les erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs) (`throw`, `try`, `catch`) et [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone) (`async`, `await`, promesses).

La date en titre est celle de la vérification : les exemples ont tous été exécutés ce jour-là, et certaines options (la couverture, en particulier) peuvent évoluer d'une version de Node à l'autre.

## Le principe : une commande, un rapport, un code

```text
  fichiers *.test.mjs         node --test                     terminal
 ┌───────────────────┐   ┌───────────────────────┐   ┌─────────────────────────┐
 │ test("...", ...)  │-->│ 1. cherche les fichiers│-->│ ✔ test réussi           │
 │ test("...", ...)  │   │ 2. exécute chaque test │   │ ✖ test en échec + détail│
 └───────────────────┘   │ 3. compte les résultats│   │ bilan : pass / fail     │
                         └───────────┬───────────┘   └─────────────────────────┘
                                     v
                          code de sortie : 0 ou 1
```

Un **test** est une petite fonction qui prépare une situation, appelle le code à vérifier et compare le résultat à celui qu'on attend. Un test réussit s'il ne lève aucune erreur, et échoue s'il en lève une. Le **code de sortie** est le nombre qu'un programme rend en se terminant : `0` signifie « tout va bien », toute autre valeur signale un échec. C'est ce nombre, et lui seul, que lit un script ou un serveur d'intégration continue pour décider si les tests sont passés.

| Besoin | Ce que fournit `node:test` | Équivalent à installer ailleurs |
|---|---|---|
| Déclarer des tests | `test`, `describe`, `it` | Jest, Mocha, Vitest |
| Comparer des valeurs | `node:assert/strict` (livré avec Node) | Chai, `expect` de Jest |
| Préparer et nettoyer | `before`, `after`, `beforeEach`, `afterEach` | les mêmes noms ailleurs |
| Remplacer une fonction | `mock.fn`, `mock.method` | `jest.fn`, Sinon |
| Mesurer la couverture | option `--experimental-test-coverage` | nyc, c8 |
| Choisir le format du rapport | option `--test-reporter` | plugins de rapport |

## Préparer un dossier et un premier module

Créez un dossier vide, ouvrez-y un terminal et créez le fichier ci-dessous. Un **module** est un fichier JavaScript qui met des outils à disposition d'autres fichiers : `export` rend une fonction visible de l'extérieur, `import` va chercher celle d'un autre fichier. L'extension `.mjs` indique à Node que le fichier utilise cette syntaxe, sans autre réglage. La fonction testée calcule un prix après remise et refuse un pourcentage absurde.

```javascript
// remise.mjs
// Calcule le prix après remise ; refuse un pourcentage hors de 0 à 100
export function calculerRemise(prix, pourcentage) {
    if (pourcentage < 0 || pourcentage > 100) {         // pourcentage impossible
        throw new RangeError("pourcentage hors de 0 à 100");   // erreur nommée RangeError
    }
    return prix * (1 - pourcentage / 100);              // 10 % : prix * 0,9
}
```

## Un premier test

Le fichier suivant importe `test` depuis `node:test` (le préfixe `node:` désigne un outil livré avec Node, par opposition à un fichier à vous), l'outil de comparaison `assert` (de l'anglais « affirmer »), puis la fonction à tester. Une **assertion** est une phrase qui affirme que quelque chose est vrai ; si c'est faux, elle lève une erreur et le test échoue. Le module `node:assert/strict` ajoute le mode **strict** : `1` et `"1"` y sont considérés comme différents, ce qui évite les mauvaises surprises.

```javascript
// remise.test.mjs
import test from "node:test";                    // la fonction test, fournie par Node
import assert from "node:assert/strict";         // les assertions, en mode strict
import { calculerRemise } from "./remise.mjs";   // la fonction à vérifier

// Arrange : les valeurs sont écrites dans l'appel ; Act : on appelle calculerRemise ;
// Assert : equal compare le résultat obtenu (1er argument) au résultat attendu (2e)
test("10 % de remise sur 100 donnent 90", () => {
    assert.equal(calculerRemise(100, 10), 90);
});
```

La structure Arrange / Act / Assert (préparer, agir, vérifier) est détaillée dans le chapitre sur [les tests unitaires](/?c=tests&p=tests-unitaires). Lancez ensuite :

```bash
# vérifie la syntaxe des deux fichiers, sans rien exécuter
node --check remise.mjs
node --check remise.test.mjs
# lance tous les tests du dossier courant
node --test
# affiche le code de sortie de la commande précédente
echo $?
```

Sortie observée dans un terminal (les durées varient d'une exécution à l'autre) :

```text
✔ 10 % de remise sur 100 donnent 90 (0.517131ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.865271
```

Le code de sortie affiché par `echo $?` était `0`. Les lignes `ℹ` forment le bilan : `pass` compte les réussites, `fail` les échecs, `skipped` les tests ignorés, `todo` les tests marqués « à faire ».

## Comment Node trouve les fichiers de tests

`node --test` sans nom de fichier explore le dossier courant et ses sous-dossiers. Il ne lance pas tous les fichiers JavaScript, seulement ceux dont le nom suit une convention. Ce tableau vient d'essais réels : cinq fichiers placés côte à côte, un seul n'a pas été trouvé.

| Fichier | Trouvé par `node --test` ? | Pourquoi |
|---|---|---|
| `remise.test.mjs` | oui | le nom finit par `.test` |
| `mon-test.mjs` | oui | le nom finit par `-test` |
| `test/a.mjs` | oui | tout fichier d'un dossier nommé `test` |
| `b.spec.mjs` | non | `.spec` n'est pas reconnu par défaut |
| `remise.mjs` | non | ce n'est pas un fichier de test (il est seulement importé) |

Pour lancer un fichier précis, même s'il n'a pas un nom reconnu, donnez son chemin : `node --test b.spec.mjs` l'exécute (observé).

## Quand un test échoue

Remplaçons l'attendu par une valeur fausse exprès (20 % de 50 font 40, pas 35) :

```javascript
// echec.test.mjs
import test from "node:test";                    // la fonction test
import assert from "node:assert/strict";         // les assertions strictes
import { calculerRemise } from "./remise.mjs";   // la fonction à vérifier

test("20 % de remise sur 50 donnent 35 (faux exprès)", () => {
    assert.equal(calculerRemise(50, 20), 35);    // 40 est obtenu, 35 est attendu : échec
});
```

Sortie observée (début du détail ; le reste est une liste des appels internes de Node, la « pile d'appels », qui indique où l'erreur est née) :

```text
✖ 20 % de remise sur 50 donnent 35 (faux exprès) (0.952109ms)
ℹ tests 1
ℹ fail 1
✖ failing tests:

test at echec.test.mjs:5:1
✖ 20 % de remise sur 50 donnent 35 (faux exprès) (0.952109ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  40 !== 35
```

Le message de Node est en anglais : `Expected values to be strictly equal` signifie « les valeurs devraient être strictement égales ». La ligne `40 !== 35` donne à gauche la valeur obtenue et à droite la valeur attendue. Le code de sortie était `1` : c'est ce qui fait « devenir rouge » un serveur d'intégration continue.

## Organiser : `test`, `describe` et `it`

`describe` (« décrire ») regroupe des tests dans une **suite** (un groupe nommé) ; `it` (« ça devrait ») déclare un test à l'intérieur. `it` et `test` font exactement le même travail : `describe` et `it` se lisent comme une phrase (« décrire calculerRemise : il applique 10 % sur 100 »).

| Fonction | Rôle | Exemple de lecture |
|---|---|---|
| `test(nom, fonction)` | déclare un test seul | « test : 10 % sur 100 donnent 90 » |
| `it(nom, fonction)` | déclare un test, comme `test` | « il applique 10 % sur 100 » |
| `describe(nom, fonction)` | regroupe des tests en suite | « décrire calculerRemise » |
| `it(nom, { skip: "raison" }, f)` | ignore le test et affiche la raison | « pas encore écrit » |
| `it(nom, { todo: "raison" }, f)` | marque « à faire » : il s'exécute, mais ne compte pas comme réussite | « à finir » |

Voici une suite complète, avec les cas limites (zéro, cent, valeurs interdites) vus dans [les tests unitaires](/?c=tests&p=tests-unitaires). Remplacez le contenu de `remise.test.mjs` :

```javascript
// remise.test.mjs
import { describe, it } from "node:test";        // describe regroupe, it déclare un test
import assert from "node:assert/strict";         // les assertions strictes
import { calculerRemise } from "./remise.mjs";   // la fonction à vérifier

describe("calculerRemise", () => {               // la suite porte le nom de la fonction
    it("applique 10 % sur 100", () => {
        assert.equal(calculerRemise(100, 10), 90);       // cas normal
    });

    it("ne change rien avec 0 %", () => {
        assert.equal(calculerRemise(80, 0), 80);         // limite basse
    });

    it("renvoie 0 avec 100 %", () => {
        assert.equal(calculerRemise(80, 100), 0);        // limite haute
    });

    it("refuse un pourcentage négatif", () => {
        // throws attend une erreur ; RangeError précise laquelle
        assert.throws(() => calculerRemise(80, -5), RangeError);
    });

    it("refuse un pourcentage au-dessus de 100", () => {
        assert.throws(
            () => calculerRemise(80, 101),                         // l'appel qui doit échouer
            { name: "RangeError", message: "pourcentage hors de 0 à 100" },   // erreur exacte
        );
    });
});
```

Sortie observée : `describe` affiche un titre `▶ calculerRemise`, les cinq tests en retrait avec `✔`, et le bilan `tests 5`, `suites 1`, `pass 5`, `fail 0`.

## Les assertions de `node:assert/strict`

Chaque assertion compare des valeurs et lève une erreur si la comparaison est fausse. Toutes celles du tableau ont été exécutées.

| Assertion | Vérifie | Exemple qui réussit |
|---|---|---|
| `equal(a, b)` | `a` et `b` sont strictement égaux (nombres, textes) | `assert.equal(1 + 1, 2)` |
| `notEqual(a, b)` | `a` et `b` sont différents | `assert.notEqual(1, "1")` |
| `ok(valeur)` | la valeur est « vraie » | `assert.ok("texte".includes("ex"))` |
| `deepEqual(a, b)` | deux objets ou listes ont le même **contenu** | `assert.deepEqual({ a: 1 }, { a: 1 })` |
| `match(texte, motif)` | le texte correspond à une [expression régulière](/?c=langages&s=javascript&p=regex) | `assert.match("ref-042", /^ref-\d+$/)` |
| `throws(fonction, erreur)` | l'appel lève l'erreur attendue | `assert.throws(() => JSON.parse("{"), SyntaxError)` |
| `rejects(promesse, erreur)` | la promesse échoue avec l'erreur attendue | voir la section suivante |

Deux subtilités, vérifiées par exécution. `assert.equal({ a: 1 }, { a: 1 })` **échoue** : deux objets distincts sont deux « boîtes » différentes même si leur contenu est identique, et `equal` compare les boîtes. Pour comparer le contenu, utilisez `deepEqual`. Et `deepEqual` en mode strict distingue `[1]` de `["1"]`. La liste complète est dans la [documentation de node:assert](https://nodejs.org/api/assert.html).

## Tester du code asynchrone

Une opération **asynchrone** rend son résultat plus tard (lecture d'un fichier, appel réseau) : elle renvoie une **promesse**, un objet qui représente ce résultat à venir (voir [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone)). Si la fonction d'un test est déclarée `async`, Node attend qu'elle se termine avant de juger le test. Créez d'abord le code à tester :

```javascript
// utilisateurs.mjs
// Cherche un utilisateur ; la « base » est ici un simple objet en mémoire
const BASE = { 1: "Ada", 2: "Linus" };                   // numéro -> nom

export async function chercherNom(id) {
    await new Promise((resolve) => setTimeout(resolve, 10));   // simule 10 ms d'attente
    if (!(id in BASE)) {                                 // numéro absent de la base
        throw new Error(`utilisateur ${id} introuvable`);   // dans async : promesse rejetée
    }
    return BASE[id];                                     // le nom trouvé
}
```

```javascript
// asynchrone.test.mjs
import test from "node:test";                        // la fonction test
import assert from "node:assert/strict";             // les assertions strictes
import { chercherNom } from "./utilisateurs.mjs";    // la fonction asynchrone à vérifier

test("trouve Ada", async () => {                     // async : Node attend la fin du test
    const nom = await chercherNom(1);                // await : on attend le résultat réel
    assert.equal(nom, "Ada");                        // puis on le compare
});

test("signale un utilisateur inconnu", async () => {
    // rejects vérifie qu'une promesse échoue ; le await est indispensable
    await assert.rejects(chercherNom(99), { message: "utilisateur 99 introuvable" });
});
```

Sortie observée : les deux tests affichent `✔` (environ 11 ms chacun, le temps de l'attente simulée) et le bilan donne `pass 2`.

## Préparer et nettoyer : les hooks

Un **hook** (« crochet ») est une fonction que le banc appelle automatiquement à un moment précis, pour éviter de recopier la même préparation dans chaque test. Le fichier suivant teste un petit panier d'achats, avec un panier neuf avant chaque test :

```javascript
// panier.mjs
// Un panier d'achats : une liste d'articles avec un total
export class Panier {
    articles = [];                                   // la liste des { nom, prix }

    ajouter(nom, prix) {
        this.articles.push({ nom, prix });           // ajoute un article à la fin
    }

    get total() {                                    // lu comme panier.total, sans ()
        return this.articles.reduce((somme, article) => somme + article.prix, 0);
    }

    get taille() {                                   // nombre d'articles
        return this.articles.length;
    }
}
```

```javascript
// hooks.test.mjs
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";             // les assertions strictes
import { Panier } from "./panier.mjs";               // la classe à vérifier

describe("Panier", () => {
    let panier;                                      // sera recréé avant chaque test

    before(() => console.log("[before] une fois, avant tous les tests"));
    after(() => console.log("[after] une fois, après tous les tests"));
    beforeEach(() => {
        panier = new Panier();                       // un panier neuf pour chaque test
        console.log("[beforeEach] panier neuf");
    });
    afterEach(() => console.log("[afterEach] nettoyage"));

    it("démarre vide", () => {
        assert.equal(panier.taille, 0);              // aucun article au départ
    });

    it("additionne les prix", () => {
        panier.ajouter("stylo", 2);                  // 2
        panier.ajouter("cahier", 5);                 // 5
        assert.equal(panier.total, 7);               // 2 + 5
    });

    it("ne garde rien du test précédent", () => {
        assert.equal(panier.taille, 0);              // le panier du test d'avant a disparu
    });
});
```

| Hook | Moment d'appel | Usage typique |
|---|---|---|
| `before` | une fois, avant le premier test de la suite | ouvrir une ressource coûteuse (connexion, fichier temporaire) |
| `beforeEach` | avant chaque test | recréer un objet neuf (le panier) |
| `afterEach` | après chaque test | effacer ce que le test a laissé |
| `after` | une fois, après le dernier test | fermer la ressource ouverte par `before` |

Sortie observée : les 8 lignes `[before]`, `[beforeEach]`, `[afterEach]`, `[after]` apparaissent dans l'ordre attendu (un `before`, puis trois fois la paire `beforeEach` et `afterEach`, puis un `after`), mais **avant** l'arbre des `✔`, car le rapport `spec` s'imprime en bloc à la fin de la suite. Les trois tests ont réussi.

## Remplacer une dépendance par une fonction espionne

Un **mock** est un faux composant qui remplace un vrai ; une **fonction espionne** (*spy*) est un mock qui se contente de noter comment on l'a appelée. Le chapitre sur [les mocks, stubs et fakes](/?c=tests&p=mocks-stubs-et-fakes-en-detail) en explique les familles et le piège de la sur-simulation. Ici, `mock.fn()` crée l'espion : la fonction `relancer` reçoit `envoyer` en argument, on lui donne un faux qui n'envoie rien, donc aucun courriel, aucun réseau.

```javascript
// mock.test.mjs
import { describe, it, mock } from "node:test";      // mock fournit les fonctions espionnes
import assert from "node:assert/strict";             // les assertions strictes

// Envoie un rappel à chaque retardataire via la fonction « envoyer » reçue en argument
function relancer(retardataires, envoyer) {
    for (const personne of retardataires) {          // un message par personne
        envoyer(personne.email, `Bonjour ${personne.nom}, pensez à rendre le livre.`);
    }
    return retardataires.length;                     // nombre de messages envoyés
}

describe("relancer", () => {
    it("envoie un message par retardataire, sans réseau", () => {
        const envoyer = mock.fn();                   // espion : ne fait rien, note tout
        const liste = [
            { nom: "Ada", email: "ada@example.org" },
            { nom: "Linus", email: "linus@example.org" },
        ];

        const total = relancer(liste, envoyer);      // on passe l'espion à la place du vrai

        assert.equal(total, 2);                      // deux personnes, deux messages
        assert.equal(envoyer.mock.callCount(), 2);   // l'espion a été appelé deux fois
        assert.deepEqual(envoyer.mock.calls[0].arguments, [   // arguments du 1er appel
            "ada@example.org",
            "Bonjour Ada, pensez à rendre le livre.",
        ]);
    });

    it("peut renvoyer une valeur choisie", () => {
        const dire = mock.fn(() => "bonjour");       // mock.fn accepte un remplaçant
        assert.equal(dire(), "bonjour");             // le remplaçant répond
        assert.equal(dire.mock.callCount(), 1);      // et l'espion a compté l'appel
    });

    it("remplace fetch pour éviter le réseau", async (t) => {
        // fetch est la fonction de Node qui envoie une requête sur le réseau ;
        // t.mock la remplace le temps du test seulement
        t.mock.method(globalThis, "fetch", async () => ({
            ok: true,                                // fausse réponse réussie
            json: async () => ({ nom: "Ada" }),      // fausse lecture du contenu
        }));

        const reponse = await fetch("https://exemple.invalid/api");   // adresse bidon
        const donnees = await reponse.json();        // lit la fausse réponse

        assert.equal(donnees.nom, "Ada");            // contenu de la fausse réponse
        assert.equal(fetch.mock.callCount(), 1);     // un seul appel a eu lieu
    });
});

it("fetch est restaurée après le test", () => {
    assert.equal(fetch.mock, undefined);             // plus d'espion : le vrai fetch est là
});
```

| Outil | Fait quoi | Remise en état |
|---|---|---|
| `mock.fn()` | crée une fonction espionne, avec ou sans remplaçant | rien à restaurer : c'est une fonction neuve |
| `mock.method(objet, "nom", remplaçant)` | remplace une méthode existante | à la main : `mock.restoreAll()` |
| `t.mock.method(...)` | idem, rattaché au test `t` | automatique à la fin du test |
| `espion.mock.callCount()` | nombre d'appels | sans objet |
| `espion.mock.calls[i].arguments` | liste des arguments du i-ème appel | sans objet |

Sortie observée : les quatre tests ont réussi, y compris le dernier, qui prouve que `t.mock` a bien rendu le vrai `fetch`. L'adresse `exemple.invalid` n'existe pas : si le remplacement échouait, le test lèverait une erreur de réseau au lieu de passer.

## Lancer seulement certains tests

| Option ou réglage | Effet | Observé |
|---|---|---|
| `node --test fichier.test.mjs` | lance ce fichier seulement | oui |
| `--test-name-pattern="addition"` | ne lance que les tests dont le nom contient `addition` (motif d'[expression régulière](/?c=langages&s=javascript&p=regex)) | oui : 1 test sur 4 |
| `--test-name-pattern="^maths"` | cible une suite entière par son nom | oui : les 4 tests de la suite |
| `{ only: true }` + `--test-only` | ne lance que les tests marqués `only` | oui : `un` lancé, `deux` non |
| `{ skip: "raison" }` | ignore un test et affiche la raison | oui : symbole `﹣` |
| `{ todo: "raison" }` | marque « à faire » sans compter une réussite | oui : compté dans `todo` |

Piège d'ordre : dans un fichier, les tests s'exécutent dans l'ordre d'écriture, mais un filtre en saute certains. Un test qui compte sur l'état laissé par un précédent peut donc réussir ou échouer selon le filtre (voir [Les pièges](#les-pieges)).

## Choisir le format du rapport et lire le code de sortie

Un **rapport** (*reporter*) est le format dans lequel le banc écrit ses résultats. L'option `--test-reporter=<nom>` le choisit. Observé : dans un terminal, le format par défaut est `spec` (lisible, avec `✔` et `✖`) ; quand la sortie est redirigée vers un fichier ou un autre programme, le format par défaut est `tap`.

| Rapport | Aspect | Usage |
|---|---|---|
| `spec` | arbre avec `✔` et `✖`, bilan en fin | lecture humaine dans le terminal |
| `tap` | lignes `ok 1 - nom` et `not ok 1 - nom`, détails indentés | lecture par un programme |
| `dot` | un point par test réussi (`.....` observé pour 4 tests) | suites très longues |

**TAP** (*Test Anything Protocol*, « protocole pour tout tester ») est un format texte simple, compris par de nombreux outils d'intégration continue. Extrait observé de `node --test --test-reporter=tap` :

```text
TAP version 13
# Subtest: maths
ok 1 - maths
1..1
# tests 4
# suites 1
# pass 2
# fail 0
# cancelled 0
# skipped 1
# todo 1
```

| Situation | Code de sortie observé |
|---|---|
| tous les tests réussissent | `0` |
| au moins un test échoue | `1` |
| seuil de couverture non atteint | `1` |

Dans un script, `node --test && echo "vert"` n'affiche « vert » que si le code est `0`. Dans un `package.json` (le fichier qui décrit un projet Node), la ligne `"test": "node --test"` dans la rubrique `scripts` permet ensuite de lancer `npm test` ; cette commande n'a pas été exécutée pour ce chapitre.

## Mesurer la couverture

La [couverture de code](/?c=tests&p=couverture-de-code) mesure la part du code exécutée pendant les tests. Node sait la calculer sans outil externe, avec l'option `--experimental-test-coverage` (le mot « experimental » signale que son comportement peut changer : c'est pourquoi le chapitre est daté). Avec le seul test `10 % sur 100` de la section précédente et la fonction `calculerRemise`, observé :

```bash
# lance les tests et ajoute un tableau de couverture à la fin du rapport
node --test --experimental-test-coverage
```

```text
ℹ start of coverage report
ℹ ----------------------------------------------------------------
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ ----------------------------------------------------------------
ℹ remise.mjs      |  71.43 |    66.67 |  100.00 | 4-5
ℹ remise.test.mjs | 100.00 |   100.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ all files       |  85.71 |    80.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ end of coverage report
```

| Colonne | Signification dans cet exemple |
|---|---|
| `line %` | part des lignes exécutées : 71,43 % pour `remise.mjs` |
| `branch %` | part des chemins (les deux côtés d'un `if`) parcourus |
| `funcs %` | part des fonctions appelées au moins une fois |
| `uncovered lines` | lignes jamais exécutées : `4-5` est le `throw` du pourcentage interdit |

Le fichier de test lui-même apparaît dans la table (100 %) : il fausse la moyenne `all files`. L'option `--test-coverage-lines=90` fixe un minimum : avec 85,71 %, Node a affiché `85.71% line coverage does not meet threshold of 90%` et rendu le code `1` ; avec `--test-coverage-lines=50`, le code était `0`. Les options `--test-coverage-branches` et `--test-coverage-functions` existent aussi (listées par `node --help`, non essayées). Rappel du chapitre sur la couverture : un pourcentage élevé prouve que les lignes ont été exécutées, pas qu'elles ont été vérifiées.

## Les pièges

Chaque piège ci-dessous a été reproduit.

| Piège | Ce qui s'est passé | Alternative |
|---|---|---|
| **Test sans assertion** | un test qui calcule `2 + 2` sans rien comparer affiche `✔` et le code de sortie est `0` : il ne peut jamais échouer | une assertion par comportement ; faire échouer le test exprès pour vérifier qu'il sait échouer |
| **`await` oublié devant `assert.rejects`** | le test affiche `✔` alors que la promesse ne rejetait pas ; Node signale ensuite une activité après la fin du test et marque le **fichier** en échec (code `1`) | écrire `await assert.rejects(...)` ; ne pas compter sur ce filet de sécurité, dont le message désigne le fichier et non la ligne fautive |
| **`await` oublié sur une valeur** | `assert.equal(chercherNom(1), "Grace")` compare une promesse en attente à un texte : le test échoue, avec `Promise { <pending> }` dans le message | `await chercherNom(1)` avant de comparer |
| **Code lancé après la fin du test** | un `setTimeout` qui échoue 50 ms plus tard laisse son test à `✔` ; Node affiche un message d'avertissement et marque le **fichier** en échec (code `1`) | attendre la fin de l'opération dans le test (`await`) |
| **État partagé entre tests** | un panier créé une seule fois pour toute la suite garde le stylo du premier test : le deuxième (`démarre vide`) échoue (`1 !== 0`) ; lancé seul avec `--test-name-pattern`, il réussit | recréer l'objet dans `beforeEach` |
| **Fichier non trouvé** | `b.spec.mjs` n'est pas lancé par `node --test` sans nom de fichier | nommer le fichier `.test.mjs` ou le placer dans `test/` |
| **Comparer deux objets avec `equal`** | `assert.equal({ a: 1 }, { a: 1 })` échoue : ce sont deux objets distincts | `deepEqual` |

## Bonnes pratiques

| À faire | Pourquoi |
|---|---|
| Importer `node:assert/strict`, jamais `node:assert` seul | le mode strict évite que `1` et `"1"` soient jugés égaux |
| Nommer chaque test d'après le comportement vérifié | le rapport devient lisible sans ouvrir le code (voir [les tests unitaires](/?c=tests&p=tests-unitaires)) |
| Écrire `async` et `await` partout où le code testé est asynchrone | Node n'attend que ce qu'on lui demande d'attendre |
| Recréer ce qui est modifié dans `beforeEach` | chaque test devient indépendant de l'ordre et des filtres |
| Utiliser `t.mock` plutôt que `mock` pour remplacer une méthode globale | la remise en état est automatique, même si le test échoue |
| Faire échouer un test exprès avant de lui faire confiance | un test qui ne peut pas échouer ne prouve rien |
| Lancer `node --test` dans l'intégration continue et lire son code de sortie | `0` ou `1` suffit pour décider si le projet est sain |
| Garder le banc intégré pour le code Node, un banc de navigateur pour l'interface | voir [le navigateur sans fenêtre](/?c=tests&p=tests-navigateur-sans-fenetre) |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `node:test` est le banc de tests livré avec Node : `node --test` trouve les fichiers `*.test.mjs` (ou `*-test.mjs`, ou ceux d'un dossier `test`), exécute chaque test, affiche un bilan et rend le code `0` (succès) ou `1` (échec). |
| **Outils utilisables** | `test`, `describe`, `it` pour déclarer ; `node:assert/strict` pour comparer ; `before`, `beforeEach`, `afterEach`, `after` pour préparer et nettoyer ; `mock.fn` et `t.mock.method` pour remplacer une dépendance sans réseau ; `--test-name-pattern`, `--test-only`, `--test-reporter` et `--experimental-test-coverage` pour filtrer, formater et mesurer. |
| **Pièges à éviter** | un test sans assertion (toujours vert) ; un `await` oublié (test vert à tort ou message trompeur) ; un état partagé entre tests (résultat qui dépend de l'ordre) ; `equal` entre deux objets ; un fichier de test au nom non reconnu. |
| **Bonnes pratiques** | assertions strictes ; un comportement par test, nommé clairement ; `beforeEach` pour repartir d'un état neuf ; `await` devant toute opération asynchrone ; remplacements limités au test ; vérifier qu'un test sait échouer ; confier la décision à l'intégration continue via le code de sortie. |
