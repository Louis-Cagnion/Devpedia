---
order: 6
---

# Le prompt engineering : structurer une requête pour de meilleurs résultats

Le chapitre sur le [NLP et les LLM](/?c=ia&p=nlp-et-llm) distingue le *prompting* du fine-tuning : sans toucher un seul poids du modèle, la façon de formuler l'entrée influence fortement la qualité de la sortie. Le **prompt engineering** est la pratique, en grande partie empirique, qui consiste à concevoir cette entrée méthodiquement plutôt qu'à l'improviser — quelques techniques reviennent suffisamment souvent pour être traitées comme un vocabulaire de base, pas comme de simples astuces isolées.

## Donner un rôle et des instructions explicites

Un modèle auquel on ne précise ni rôle ni contraintes doit deviner le registre attendu (ton, niveau de détail, format) à partir du seul contenu de la question. Le lever explicitement dans les instructions (souvent en tête de prompt, dans un rôle "système") réduit cette ambiguïté :

```
Mauvais prompt :  "Explique les index en base de données."

Meilleur prompt :  "Tu es un formateur qui s'adresse à des développeurs juniors.
                    Explique les index en base de données en 3 phrases maximum,
                    avec une analogie concrète, sans jargon SQL non expliqué."
```

Voir la configuration d'un system prompt dans [Construire un chatbot](/?c=ia&p=chatbot) pour ce même principe appliqué à un assistant conversationnel complet.

### Anticiper l'information manquante

Face à une information manquante, un modèle ne s'arrête pas de lui-même pour la demander : il comble le vide par une hypothèse silencieuse, qui peut diverger de ce qui était réellement voulu sans que rien ne le signale. Préciser dans les instructions la conduite à tenir dans ce cas retire ce choix implicite au modèle :

```
Si une information nécessaire manque, indique-le explicitement au lieu
de faire une hypothèse silencieuse — ou pose la question, si le contexte
s'y prête.
```

Le choix entre poser une question et avancer sur une hypothèse explicite dépend du contexte : un usage interactif (chat) profite de la question directe, alors qu'un usage automatisé (pipeline, agent, sans humain pour répondre en temps réel) a besoin que le modèle avance malgré tout, en indiquant clairement quelle hypothèse a été prise plutôt qu'en la laissant implicite.

## Le few-shot prompting : montrer plutôt que décrire

Plutôt que de décrire abstraitement le format ou le style attendu, donner directement un ou plusieurs exemples entrée → sortie dans le prompt (le *few-shot prompting*) exploite la capacité du modèle à repérer un motif et à le reproduire :

```
Classe le sentiment de chaque avis en positif/negatif/neutre.

Avis : "Livraison rapide, produit conforme."       -> positif
Avis : "Correct sans plus, rien d'exceptionnel."    -> neutre
Avis : "Colis arrivé abîmé, aucune réponse du SAV."  -> negatif

Avis : "Le produit fonctionne mais l'emballage était déchiré." -> ?
```

Un prompt sans exemple (*zero-shot*) fonctionne pour des tâches simples ou déjà bien représentées dans l'entraînement du modèle ; ajouter 2 à 5 exemples bien choisis améliore nettement la fiabilité sur un format ou un style spécifique, sans coûter le temps ni les données d'un fine-tuning.

## Le raisonnement étape par étape (*chain-of-thought*)

Un LLM génère sa réponse token par token, chaque token s'appuyant sur tous ceux déjà produits (voir [LLM en production](/?c=ia&p=llm-en-production)) — y compris ceux de sa propre réponse en train de s'écrire. Demander explicitement au modèle de détailler son raisonnement avant de conclure ("réfléchis étape par étape avant de répondre") lui donne ainsi, concrètement, plus de tokens intermédiaires sur lesquels s'appuyer pour construire une conclusion — un gain surtout net sur les tâches à plusieurs étapes (calcul, logique, décomposition d'un problème) :

```
Sans chain-of-thought :  "Un train part à 14h12 à 80km/h, un autre à 14h27
                          à 100km/h sur la même voie. À quelle heure le second
                          rattrape-t-il le premier ?"
                          -> risque de sortir un résultat directement, sans le vérifier

Avec chain-of-thought :  "... Détaille ton raisonnement étape par étape,
                          puis donne la réponse finale sur la dernière ligne."
                          -> le modèle pose les calculs intermédiaires avant de conclure
```

Demander en plus une étape de vérification avant de conclure ("relis ta réponse et vérifie qu'elle respecte bien [contrainte]") prolonge le même principe : ça donne au modèle l'occasion de détecter lui-même une contrainte non respectée avant qu'elle n'atteigne la sortie finale, plutôt que de découvrir l'écart seulement en la relisant après coup soi-même.

## Structurer le prompt : séparer instructions, contexte et données

Un prompt qui mélange instructions, contexte et données à traiter dans un seul bloc de texte laisse au modèle la charge de deviner où s'arrête l'un et où commence l'autre. Délimiter clairement chaque partie (balises, guillemets triples, titres) réduit cette ambiguïté — et rend aussi plus difficile qu'une donnée injectée dans le contexte soit interprétée comme une instruction (voir la *prompt injection* dans [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)) :

```
### Instructions
Résume le texte ci-dessous en 2 phrases, en français.

### Texte à résumer
"""
{texte_utilisateur}
"""
```

Préciser le format de sortie attendu (JSON avec des clés nommées, une liste à puces, un tableau) dans les instructions elles-mêmes évite de surcroît d'avoir à re-parser une réponse en langage libre.

## Template : un prompt unique pour une tâche simple

Le squelette ci-dessous rassemble toutes les techniques précédentes dans un seul gabarit réutilisable, à adapter tâche par tâche — chaque section correspond à une technique vue plus haut (rôle, gestion de l'ambiguïté, few-shot, vérification, format) :

```
## Rôle
Tu es [rôle / expertise attendue].
Ta mission : [objectif principal, en une phrase].

## Instructions
1. [instruction précise]
2. [instruction précise]

Contraintes : [contenu à respecter] ; [ce qu'il faut éviter].
Si une information nécessaire manque : [pose une question / signale l'hypothèse prise].

## Contexte
"""
[informations nécessaires pour réaliser la tâche]
"""

## Données à traiter
"""
[texte / code / fichier / problème concerné]
"""

## Exemple(s)
Entrée : [exemple d'entrée]  ->  Sortie attendue : [exemple de sortie]

## Méthode
Avant de conclure, vérifie que le résultat respecte bien les contraintes ci-dessus.

## Format de sortie
[format exact attendu — court / détaillé / structuré / directement utilisable]
```

Toutes ces sections ne sont pas systématiquement nécessaires : une question simple et déjà sans ambiguïté n'a besoin ni d'exemple, ni de rubrique "Contexte" séparée. Le gabarit sert de liste de vérification, pas de formulaire à remplir intégralement à chaque fois.

## Décomposer une tâche complexe plutôt qu'un seul prompt monolithique

Un prompt unique qui demande à la fois d'analyser, de calculer et de rédiger cumule les risques d'erreur de chaque sous-tâche. Découper en plusieurs prompts plus petits et enchaînés (*prompt chaining* — la sortie de l'un devient l'entrée du suivant) permet de vérifier un résultat intermédiaire avant de poursuivre, plutôt que de découvrir une erreur uniquement dans le résultat final. C'est le même principe, non automatisé ici, qui motive la boucle des [agents](/?c=ia&p=agents) — un agent n'est rien d'autre que ce chaînage devenu piloté par le modèle plutôt que par un développeur qui enchaîne les prompts à la main.

Sur un projet de taille significative, ce découpage se structure en étapes successives, chacune limitée à un objectif précis avant de passer à la suivante :

1. **Cadrage** — objectifs, contraintes, ressources disponibles ; demander au modèle d'identifier les informations manquantes et les risques, sans encore rien produire.
2. **Conception** — découpage en sous-tâches, dépendances entre elles, architecture générale ; toujours sans coder.
3. **Plan d'implémentation** — pour chaque sous-tâche : entrées, sortie attendue, critères de réussite, tests à effectuer.
4. **Réalisation**, une sous-tâche à la fois — en rappelant à chaque prompt le contexte pertinent et l'architecture validée, pour ne pas la faire redéduire au modèle à chaque étape.
5. **Vérification indépendante** — un prompt séparé où le modèle endosse un rôle de reviewer plutôt que d'auteur : cette séparation réduit le risque qu'il valide son propre travail sans esprit critique, un biais plus marqué quand rédaction et relecture se mélangent dans le même prompt.
6. **Correction**, ciblée sur les seuls problèmes relevés à l'étape précédente.
7. **Tests**, puis **finalisation** — une dernière revue globale qui compare le résultat aux exigences de départ.

> **Note :** demander explicitement au modèle de ne rien produire ("ne code pas encore") aux étapes de cadrage et de conception évite qu'il se précipite vers une implémentation avant que les bases ne soient validées — un empressement fréquent, cette instruction reste donc rarement superflue.

### Template : une chaîne de prompts pour un projet complexe

Chaque étape ci-dessous devient un prompt séparé, dont la sortie (validée avant de continuer) alimente le prompt suivant :

```
[1. Cadrage]
Objectifs : [...]  —  Contraintes : [...]  —  Ressources disponibles : """[...]"""
-> N'implémente rien : liste risques, informations manquantes, questions à trancher.

[2. Conception]
Cadrage validé : """[sortie de l'étape 1]"""
-> Découpage en sous-tâches, dépendances entre elles, architecture générale. Toujours sans coder.

[3. Plan d'implémentation]
Conception validée : """[sortie de l'étape 2]"""
-> Pour chaque sous-tâche : entrées, sortie attendue, fichiers concernés, critères de réussite.

[4. Réalisation d'une sous-tâche]
Contexte pertinent + architecture validée : """[...]"""  —  Sous-tâche actuelle : """[...]"""
-> Réalise uniquement cette sous-tâche ; signale sans corriger un problème détecté ailleurs.

[5. Vérification indépendante]
Résultat à vérifier : """[sortie de l'étape 4]"""  —  Critères de réussite : """[...]"""
-> Agis comme un reviewer indépendant. Ne modifie rien. Classe les problèmes trouvés
   (CRITIQUE / IMPORTANT / MINEUR), conclus par VALIDÉ ou À CORRIGER.

[6. Correction]
Résultat de la vérification : """[sortie de l'étape 5]"""
-> Corrige uniquement les problèmes listés, sans toucher au reste.

[7. Tests et finalisation]
État final : """[...]"""  —  Exigences initiales : """[sortie de l'étape 1]"""
-> Vérifie que chaque exigence est satisfaite ; liste ce qui reste, s'il y a lieu.
```

## Itérer et évaluer plutôt que juger sur un seul essai

Le non-déterminisme d'un LLM (voir [LLM en production](/?c=ia&p=llm-en-production)) rend un seul essai peu fiable pour juger qu'un prompt "fonctionne" : une bonne réponse une fois ne garantit pas qu'elle se reproduira sur un cas légèrement différent. Rejouer systématiquement un prompt candidat sur un petit jeu de cas représentatifs — le même *golden set* que celui utilisé pour évaluer un système en production (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)) — avant de le considérer stable est ce qui distingue le prompt engineering d'un simple bricolage par essais-erreurs.

## Les limites du prompt engineering

Aucune de ces techniques n'ajoute de connaissance ou de capacité que le modèle n'a pas déjà acquise pendant son entraînement — elles ne font qu'exploiter au mieux ce qui existe déjà (voir la distinction fine-tuning vs prompting dans [NLP et LLM](/?c=ia&p=nlp-et-llm)). Un modèle qui n'a jamais vu de données pertinentes sur un sujet, ou qui ignore des événements postérieurs à sa date de coupure, ne produira pas une meilleure réponse parce que le prompt est mieux écrit — c'est le rôle du [RAG](/?c=ia&p=rag) (données externes) ou du fine-tuning (nouvelles capacités), pas du prompt engineering.
