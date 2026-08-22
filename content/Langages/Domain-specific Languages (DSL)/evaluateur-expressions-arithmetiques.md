---
order: 4
---

# Évaluateur d'expressions arithmétiques : gérer la précédence des opérateurs

Évaluer une chaîne comme `"2 + 3 * 4"` demande plus qu'un simple parcours de gauche à droite : la multiplication doit s'effectuer avant l'addition (résultat `14`, pas `20`), et des parenthèses peuvent forcer un ordre différent. Écrire ce petit interpréteur est un exercice classique, souvent la première brique avant un interpréteur plus large (voir [Parsing incrémental par machine à états](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) pour une autre famille de format à interpréter).

## Le problème : lire de gauche à droite ne suffit pas

```text
"2 + 3 * 4"

Lecture naive gauche->droite :  (2 + 3) * 4 = 20   -> faux
Avec precedence des operateurs : 2 + (3 * 4) = 14   -> correct
```

Une évaluation correcte doit connaître la **précédence** de chaque opérateur (`*`/`/` avant `+`/`-`) avant même de commencer à calculer quoi que ce soit.

## Deux étapes : tokeniser, puis évaluer

La chaîne brute n'est jamais évaluée caractère par caractère : elle est d'abord découpée en une liste de **tokens** (nombres et opérateurs), comme le fait tout interpréteur (voir la tokenisation d'un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), le même principe appliqué à du texte naturel plutôt qu'à une expression).

```python
import re

def tokeniser(expression):
    return re.findall(r"\d+\.?\d*|[()+\-*/]", expression)

tokeniser("2 + 3 * 4")       # ['2', '+', '3', '*', '4']
tokeniser("(2 + 3) * 4")     # ['(', '2', '+', '3', ')', '*', '4']
```

## Respecter la précédence : une fonction par niveau

La technique la plus directe encode chaque niveau de précédence dans sa propre fonction, chacune appelant le niveau immédiatement supérieur avant de traiter son propre opérateur, une fonction appelant les parenthèses puis se rappelant elle-même pour gérer une expression imbriquée :

```text
expression := terme (('+' | '-') terme)*
terme       := facteur (('*' | '/') facteur)*
facteur     := NOMBRE | '(' expression ')'
```

```python
class Evaluateur:
    def __init__(self, tokens):
        self.tokens = tokens
        self.position = 0

    def token_courant(self):
        return self.tokens[self.position] if self.position < len(self.tokens) else None

    def expression(self):
        resultat = self.terme()
        while self.token_courant() in ("+", "-"):
            operateur = self.tokens[self.position]
            self.position += 1
            droite = self.terme()
            resultat = resultat + droite if operateur == "+" else resultat - droite
        return resultat

    def terme(self):
        resultat = self.facteur()
        while self.token_courant() in ("*", "/"):
            operateur = self.tokens[self.position]
            self.position += 1
            droite = self.facteur()
            resultat = resultat * droite if operateur == "*" else resultat / droite
        return resultat

    def facteur(self):
        token = self.token_courant()
        if token == "(":
            self.position += 1          # consomme '('
            resultat = self.expression()
            self.position += 1          # consomme ')'
            return resultat
        self.position += 1
        return float(token)

Evaluateur(tokeniser("2 + 3 * 4")).expression()        # 14.0
Evaluateur(tokeniser("(2 + 3) * 4")).expression()      # 20.0
```

`expression()` traite le niveau le moins prioritaire (`+`/`-`) mais délègue chaque opérande à `terme()`, qui épuise d'abord tout ce qui est prioritaire (`*`/`/`) avant de rendre la main : c'est cet ordre d'appel, pas une comparaison explicite de priorités, qui garantit que la multiplication se calcule avant l'addition. Une parenthèse rencontrée dans `facteur()` relance `expression()` depuis le niveau le plus bas, ce qui gère naturellement n'importe quelle profondeur d'imbrication.

> **Piège :** faire évoluer `self.position` indépendamment dans plusieurs fonctions sans qu'aucune ne soit la source unique de vérité sur "où on en est" dans la liste de tokens. Une seule variable d'état partagée (ici `self.position`, un attribut de l'instance) doit avancer de façon cohérente, quelle que soit la fonction qui consomme le token courant : deux positions qui divergent produisent un décalage de lecture difficile à diagnostiquer.
>
> **Bonne pratique :** avancer `self.position` au moment exact où un token est consommé, jamais avant ni après, et ne jamais le lire deux fois pour la même décision.

## Une autre approche : conversion en notation polonaise inversée

Une alternative répandue, l'algorithme du *shunting-yard* (Dijkstra), convertit d'abord l'expression en notation postfixée (`2 3 4 * +`) à l'aide d'une pile d'opérateurs, avant de l'évaluer avec une seconde pile d'opérandes. Le résultat final est identique ; le choix entre les deux techniques est surtout une question de préférence d'implémentation (récursion contre piles explicites) plutôt qu'une différence de capacité.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une expression est d'abord tokenisée (nombres/opérateurs séparés), puis évaluée par une fonction par niveau de précédence, chacune délégant à la suivante avant de traiter son propre opérateur. Une parenthèse relance l'évaluation depuis le niveau le plus bas. |
| **Outils utilisables** | Une expression régulière pour la tokenisation ; une fonction par niveau de précédence (descente récursive) ou l'algorithme du shunting-yard (piles explicites) pour l'évaluation elle-même. |
| **Pièges à éviter** | Évaluer de gauche à droite sans tenir compte de la précédence des opérateurs. Faire avancer la position dans les tokens depuis plusieurs endroits sans source unique de vérité. |
| **Bonnes pratiques** | Faire porter la précédence par l'ordre d'appel entre fonctions (`expression` -> `terme` -> `facteur`), pas par une comparaison explicite de priorités numériques. |
