---
order: 10
---

# Recettes : classer et router à grande échelle

Deuxième série de recettes appliquant la [méthodologie](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) : classer un contenu parmi de nombreuses catégories possibles, et décider quand faire confiance à ce classement.

## Classification hiérarchique : descendre dans un arbre de catégories

Classer un contenu dans une taxonomie profonde (des catégories qui se subdivisent en sous-catégories, sur plusieurs niveaux) pose une question Choice à **chaque niveau**, sur les seules options enfants du nœud déjà atteint, plutôt qu'une seule question à plat sur des centaines de feuilles :

| Stratégie | Principe | Risque |
|---|---|---|
| Gourmande (*greedy*) | Ne garder que le meilleur enfant à chaque niveau | Une erreur précoce est irréversible, rien ne la corrige plus bas |
| Faisceau (*beam search*) | Garder plusieurs chemins plausibles en parallèle, choisir à la fin celui au meilleur score global | Une preuve trouvée plus profondément peut réparer une décision ambiguë prise plus haut |

Sur quatre taxonomies testées par le fournisseur (brevets, produits, sujets scientifiques, fichiers de code), la recherche en faisceau a classé correctement 4 cas sur 4, contre 2 sur 4 pour la stratégie gourmande.

## Classification RAG : filtrer avant de générer

Dans un pipeline de [RAG](/?c=ia&s=nlp-llm&p=rag) (récupération de documents avant génération), chaque passage récupéré peut être jugé par quatre questions avant d'être transmis au LLM générateur :

```python
def router(reponses: dict) -> str:
    if reponses["contient_injection"] > 0.70:
        return "exclure"                       # tentative de manipulation du modele
    if reponses["contredit_la_requete"] > 0.70:
        return "preuve_contradictoire"         # a presenter separement, pas fusionne
    if reponses["est_pertinent"] < 0.45:
        return "exclure"
    if reponses["contient_la_reponse"] > 0.55:
        return "inclure"
    return "exclure"
```

Ce filtrage intercepte à la fois les [injections de prompt](/?c=ia&s=nlp-llm&p=prompt-injection) cachées dans un document récupéré et les contradictions factuelles, avant qu'elles n'atteignent le LLM générateur.

## Classification par confiance : ajuster la granularité à la certitude

Plutôt que de forcer une réponse précise même quand le modèle hésite, cette recette **remonte d'un niveau** dans la hiérarchie quand la confiance est insuffisante, au lieu de rejeter la classification ou de la forcer à tort :

| Confiance | Granularité rapportée |
|---|---|
| ≥ 0,9 | Le groupe précis (ex : un sous-secteur industriel exact) |
| < 0,9 | La catégorie plus large qui l'englobe (ex : la division industrielle) |

Sur un test à 75 groupes industriels, cette approche a maintenu 90 % de précision sur les cas sûrs, contre seulement 40 % en forçant une classification précise sur les cas incertains, et 70 % en remontant simplement d'un niveau plutôt que de forcer.

## Suggestion de compétence : choisir parmi des centaines d'options

Un agent qui dispose de nombreuses compétences ou extensions ne peut pas toutes les décrire en détail dans son contexte sans en dégrader les performances. La recette procède en deux requêtes :

```text
Requete 1 : une question Choice evalue TOUTES les competences (descriptions
            courtes), retient les 3 meilleures candidates
Requete 2 : une question Noul par candidate, avec sa description COMPLETE,
            confirme ou rejette chacune individuellement
```

Sur 488 requêtes testées, cette double vérification a divisé par plus de deux le taux de mauvais chargement de compétence (de 16,8 % à 7,3 %) et de chargement inutile (de 9,8 % à 4,0 %).

## Alignement d'entités : la même chose, ou juste une chose proche ?

Pour relier deux entrées de sources différentes qui pourraient décrire le même objet (deux fiches produit, deux entités d'un graphe de connaissances), une question Score évalue le degré de correspondance sur un spectre à trois niveaux (différents / proches / identiques), complétée par des questions Noul sur des critères précis (même nom, même origine...).

| Résultat | Action |
|---|---|
| Produits différents | Laisser les entités séparées |
| Possiblement identiques | Envoyer à un curateur humain |
| Même produit | Fusionner les entrées |

> **Piège :** fusionner deux entités à tort. La documentation du fournisseur le souligne : fusionner incorrectement coûte plus cher que manquer une correspondance, puisque tout fait attaché à l'une des deux entités devient ensuite attribué à l'entité fusionnée.
>
> **Bonne pratique :** réserver la fusion automatique aux cas de très haute confiance, et router systématiquement la zone grise (correspondance possible mais incertaine) vers une validation humaine plutôt que de trancher par défaut dans un sens ou dans l'autre.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Classer à grande échelle se fait par une question Choice à la fois (par niveau de taxonomie, ou par candidat présélectionné), jamais par une seule question à plat sur des centaines d'options. La confiance obtenue guide la granularité de la réponse (remonter d'un niveau plutôt que forcer) et la décision de fusionner ou non deux entités. |
| **Outils utilisables** | Choice par niveau de taxonomie (gourmand ou en faisceau) ; questions Noul de filtrage pour du RAG ; double vérification Choice puis Noul pour une sélection parmi de nombreuses options ; Score + Noul pour l'alignement d'entités. |
| **Pièges à éviter** | Forcer une classification précise malgré une confiance insuffisante. Fusionner deux entités sur la base d'une correspondance seulement possible. |
| **Bonnes pratiques** | Remonter d'un niveau de granularité plutôt que de forcer une réponse incertaine. Router la zone grise vers un humain plutôt que de trancher par défaut. |
