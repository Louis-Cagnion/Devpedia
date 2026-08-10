---
order: 6
---

# Le prompt engineering : structurer une requête pour de meilleurs résultats

Le chapitre sur le [NLP et les LLM](/?c=ia&p=nlp-et-llm) distingue le *prompting* du fine-tuning : sans toucher un seul poids du modèle, la façon de formuler l'entrée influence fortement la qualité de la sortie. Le **prompt engineering** est la pratique, en grande partie empirique, qui consiste à concevoir cette entrée méthodiquement plutôt qu'à l'improviser — quelques techniques reviennent suffisamment souvent pour être traitées comme un vocabulaire de base, pas comme de simples astuces isolées.

## Donner un rôle et des instructions explicites

Un modèle auquel on ne précise ni rôle ni contraintes doit deviner le registre attendu (ton, niveau de détail, format) à partir du seul contenu de la question. Le lever explicitement dans les instructions (souvent en tête de prompt, dans un rôle "système") réduit cette ambiguïté :

```text
Mauvais prompt :  "Explique les index en base de données."

Meilleur prompt :  "Tu es un formateur qui s'adresse à des développeurs juniors.
                    Explique les index en base de données en 3 phrases maximum,
                    avec une analogie concrète, sans jargon SQL non expliqué."
```

Voir la configuration d'un system prompt dans [Construire un chatbot](/?c=ia&p=chatbot) pour ce même principe appliqué à un assistant conversationnel complet.

### Anticiper l'information manquante

Face à une information manquante, un modèle ne s'arrête pas de lui-même pour la demander : il comble le vide par une hypothèse silencieuse, qui peut diverger de ce qui était réellement voulu sans que rien ne le signale. Préciser dans les instructions la conduite à tenir dans ce cas retire ce choix implicite au modèle :

```text
Si une information nécessaire manque, indique-le explicitement au lieu
de faire une hypothèse silencieuse — ou pose la question, si le contexte
s'y prête.
```

Le choix entre poser une question et avancer sur une hypothèse explicite dépend du contexte : un usage interactif (chat) profite de la question directe, alors qu'un usage automatisé (pipeline, agent, sans humain pour répondre en temps réel) a besoin que le modèle avance malgré tout, en indiquant clairement quelle hypothèse a été prise plutôt qu'en la laissant implicite.

> **Piège :** ne rien préciser sur ce cas, en supposant que le modèle demandera de lui-même une clarification si besoin. Sans instruction explicite, il complète le plus souvent silencieusement par l'hypothèse la plus plausible statistiquement — pas nécessairement celle que l'utilisateur avait en tête.
>
> **Bonne pratique :** toujours préciser explicitement la conduite attendue face à une information manquante, plutôt que de compter sur le bon sens du modèle.

## Repérer un prompt imprécis et proposer une version affinée

La section précédente traite le cas où une information manque *au milieu* de la tâche, une fois celle-ci commencée. Un prompt peut aussi être imprécis *dès le départ* — un objectif vague, un format non précisé, un choix qui appartient en réalité à la personne qui demande — au point qu'aucune tentative, même prudente, n'a de bonne raison de partir dans une direction plutôt qu'une autre. Dans ce cas, la meilleure réponse n'est ni de deviner, ni de produire un résultat générique : c'est de renvoyer une **version affinée du prompt**, qui liste précisément ce qui manque et propose une reformulation concrète, avant de s'engager dans un travail qui a de bonnes chances d'être à refaire :

```text
Prompt reçu :  "Fais un rapport sur les ventes."

Sans affinage  ->  un rapport produit au hasard des hypothèses implicites
                    (quelle période ? quels produits ? quel format ? pour qui ?)

Avec affinage  ->  "Pour ce rapport, précises-tu :
                    - la période couverte (mois en cours ? année ? comparaison
                      à l'an dernier ?)
                    - le format attendu (synthèse d'une page ? tableau détaillé ?)
                    - le destinataire (direction ? équipe commerciale ?)
                    Sinon, je pars sur : le mois en cours, une synthèse d'une
                    page, pour la direction."
```

Une question concrète, formulée en options identifiables (comme ci-dessus), s'obtient une réponse plus vite et plus utilement qu'une question ouverte du type "peux-tu préciser ?" — qui laisse à la personne la charge de deviner elle-même ce qui manquait.

> **Piège :** demander un affinage sur un prompt déjà suffisamment précis pour être exécuté sans ambiguïté réelle. Systématiser la question au lieu de la réserver aux cas qui le justifient ralentit l'échange et donne l'impression que le modèle esquive la tâche plutôt qu'il ne cherche à bien la faire.
>
> **Bonne pratique :** réserver l'affinage aux cas où plusieurs interprétations restent également plausibles, ou où un choix (portée, format, contrainte) appartient clairement à la personne qui demande — et toujours proposer, en même temps que la question, une hypothèse par défaut raisonnable pour ne pas bloquer totalement l'avancement si elle ne répond pas.

### Proposer plusieurs pistes plutôt qu'une seule question

La question ci-dessus fonctionne bien quand l'information manquante est un paramètre factuel (une période, un destinataire) : la personne sait immédiatement quoi répondre. Ça marche moins bien quand l'incertitude porte sur une direction stylistique ou créative (un ton, une structure, un angle) — difficile à trancher dans l'abstrait, sans rien de concret sous les yeux. Dans ce cas, plutôt qu'une question ouverte, esquisser directement deux ou trois pistes courtes et nettement différentes laisse la personne réagir à quelque chose de tangible, plutôt que devoir se projeter sur une description verbale :

```text
Prompt reçu :  "Écris une accroche pour notre nouvelle app de fitness."

Sans pistes  ->  une seule accroche, sur un ton choisi arbitrairement
                 par le modèle

Avec pistes  ->  "Trois directions possibles, dis-moi laquelle développer :
                  1. Humoristique : 'Votre canapé va devoir se trouver
                     un nouveau meilleur ami.'
                  2. Factuel : 'Suivez vos progrès, jour après jour.'
                  3. Premium : 'La performance, sans compromis.'"
```

Chaque piste doit rester courte (une ligne, pas un paragraphe) : l'objectif est de faire choisir une direction, pas de livrer un travail fini en plusieurs exemplaires — le développement complet vient après le choix, une fois la direction validée.

> **Piège :** multiplier les pistes au-delà de 3-4, ou proposer des variantes qui ne se distinguent que par des détails de formulation plutôt que par un axe réellement différent (ton, structure, angle). Au-delà d'un certain nombre, ou sans différence nette entre elles, la personne perd plus de temps à comparer qu'elle n'en aurait mis à répondre à une question directe.
>
> **Bonne pratique :** limiter les pistes à 2-3 options réellement distinctes sur l'axe qui pose problème, chacune assez courte pour rester bon marché à produire — et réserver la technique aux cas où la différence se juge mieux sur un exemple concret que sur une description abstraite.

## Le few-shot prompting : montrer plutôt que décrire

Plutôt que de décrire abstraitement le format ou le style attendu, donner directement un ou plusieurs exemples entrée → sortie dans le prompt (le *few-shot prompting*) exploite la capacité du modèle à repérer un motif et à le reproduire :

```text
Classe le sentiment de chaque avis en positif/negatif/neutre.

Avis : "Livraison rapide, produit conforme."       -> positif
Avis : "Correct sans plus, rien d'exceptionnel."    -> neutre
Avis : "Colis arrivé abîmé, aucune réponse du SAV."  -> negatif

Avis : "Le produit fonctionne mais l'emballage était déchiré." -> ?
```

Un prompt sans exemple (*zero-shot*) fonctionne pour des tâches simples ou déjà bien représentées dans l'entraînement du modèle ; ajouter 2 à 5 exemples bien choisis améliore nettement la fiabilité sur un format ou un style spécifique, sans coûter le temps ni les données d'un fine-tuning.

> **Piège :** choisir des exemples non représentatifs ou biaisés (tous positifs, tous écrits sur le même ton, tous très courts). Le modèle reproduit fidèlement le motif des exemples fournis — y compris leurs biais, pas seulement leur format.
>
> **Bonne pratique :** choisir des exemples qui couvrent la diversité réelle des cas attendus (styles, longueurs, cas limites), pas seulement des cas faciles ou similaires entre eux.

## Le raisonnement étape par étape (*chain-of-thought*)

Un LLM génère sa réponse token par token, chaque token s'appuyant sur tous ceux déjà produits (voir [LLM en production](/?c=ia&p=llm-en-production)) — y compris ceux de sa propre réponse en train de s'écrire. Demander explicitement au modèle de détailler son raisonnement avant de conclure ("réfléchis étape par étape avant de répondre") lui donne ainsi, concrètement, plus de tokens intermédiaires sur lesquels s'appuyer pour construire une conclusion — un gain surtout net sur les tâches à plusieurs étapes (calcul, logique, décomposition d'un problème) :

```text
Sans chain-of-thought :  "Un train part à 14h12 à 80km/h, un autre à 14h27
                          à 100km/h sur la même voie. À quelle heure le second
                          rattrape-t-il le premier ?"
                          -> risque de sortir un résultat directement, sans le vérifier

Avec chain-of-thought :  "... Détaille ton raisonnement étape par étape,
                          puis donne la réponse finale sur la dernière ligne."
                          -> le modèle pose les calculs intermédiaires avant de conclure
```

Demander en plus une étape de vérification avant de conclure ("relis ta réponse et vérifie qu'elle respecte bien [contrainte]") prolonge le même principe : ça donne au modèle l'occasion de détecter lui-même une contrainte non respectée avant qu'elle n'atteigne la sortie finale, plutôt que de découvrir l'écart seulement en la relisant après coup soi-même.

> **Piège :** prendre le raisonnement affiché par le modèle pour un compte-rendu fidèle de ce qui a réellement produit la réponse. Rien ne garantit que les étapes affichées correspondent exactement au mécanisme interne qui a mené à la conclusion — un raisonnement qui *semble* cohérent peut accompagner une conclusion fausse, ou l'inverse.
>
> **Bonne pratique :** traiter un raisonnement chain-of-thought comme une aide à la fiabilité de la réponse (et à sa relecture par un humain), pas comme une preuve garantie de son exactitude.

## Structurer le prompt : séparer instructions, contexte et données

Un prompt qui mélange instructions, contexte et données à traiter dans un seul bloc de texte laisse au modèle la charge de deviner où s'arrête l'un et où commence l'autre. Délimiter clairement chaque partie (balises, guillemets triples, titres) réduit cette ambiguïté — et rend aussi plus difficile qu'une donnée injectée dans le contexte soit interprétée comme une instruction (voir la [prompt injection](/?c=ia&p=prompt-injection)) :

```text
### Instructions
Résume le texte ci-dessous en 2 phrases, en français.

### Texte à résumer
"""
{texte_utilisateur}
"""
```

Préciser le format de sortie attendu (JSON avec des clés nommées, une liste à puces, un tableau) dans les instructions elles-mêmes évite de surcroît d'avoir à re-parser une réponse en langage libre.

> **Piège :** mélanger dans un seul bloc de texte les instructions et une donnée externe (saisie utilisateur, contenu d'un fichier ou d'un site récupéré automatiquement...) sans aucune séparation visuelle — le modèle n'a alors aucun moyen fiable de distinguer une instruction légitime d'un texte qui, à l'intérieur même de la donnée, se ferait passer pour une instruction (voir la [prompt injection](/?c=ia&p=prompt-injection)).
>
> **Bonne pratique :** toujours délimiter explicitement chaque partie (balises, guillemets triples, titres) et préciser dans les instructions que le contenu ainsi délimité est une donnée à traiter, jamais une commande à exécuter.

## Template : un prompt unique pour une tâche simple

Le squelette ci-dessous rassemble toutes les techniques précédentes dans un seul gabarit réutilisable, à adapter tâche par tâche — chaque section correspond à une technique vue plus haut (rôle, gestion de l'ambiguïté, few-shot, vérification, format) :

```text
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

> **Piège :** laisser le modèle se précipiter vers une implémentation avant que le cadrage et la conception ne soient validés — un empressement fréquent, qui produit un résultat technique avant même que le problème ne soit correctement posé.
>
> **Bonne pratique :** demander explicitement au modèle de ne rien produire ("ne code pas encore") aux étapes de cadrage et de conception, cette instruction reste rarement superflue.

### Template : une chaîne de prompts pour un projet complexe

Chaque étape ci-dessous devient un prompt séparé, dont la sortie (validée avant de continuer) alimente le prompt suivant :

```text
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

> **Piège :** valider un prompt sur un seul essai réussi, puis le considérer fiable. Le non-déterminisme du modèle signifie qu'un même prompt peut produire une sortie différente d'un appel à l'autre — un seul succès ne prouve rien sur la fiabilité générale.
>
> **Bonne pratique :** rejouer systématiquement un prompt candidat sur plusieurs cas représentatifs (un *golden set*) avant de le considérer stable, plutôt que de juger sur un seul essai.

## Les limites du prompt engineering

Aucune de ces techniques n'ajoute de connaissance ou de capacité que le modèle n'a pas déjà acquise pendant son entraînement — elles ne font qu'exploiter au mieux ce qui existe déjà (voir la distinction fine-tuning vs prompting dans [NLP et LLM](/?c=ia&p=nlp-et-llm)). Un modèle qui n'a jamais vu de données pertinentes sur un sujet, ou qui ignore des événements postérieurs à sa date de coupure, ne produira pas une meilleure réponse parce que le prompt est mieux écrit — c'est le rôle du [RAG](/?c=ia&p=rag) (données externes) ou du fine-tuning (nouvelles capacités), pas du prompt engineering.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le prompt engineering formule l'entrée d'un LLM méthodiquement : rôle et instructions explicites, repérage d'un prompt imprécis avant de s'engager (par une question ciblée ou par plusieurs pistes concrètes), exemples (few-shot), raisonnement étape par étape (chain-of-thought), séparation instructions/contexte/données, décomposition d'une tâche complexe en étapes vérifiables. Il n'ajoute aucune capacité que le modèle n'a pas déjà. |
| **Outils utilisables** | Un gabarit de prompt réutilisable (voir le template ci-dessus) ; un *golden set* de cas représentatifs pour évaluer un prompt avant de le considérer stable. |
| **Pièges à éviter** | Ne pas préciser la conduite à tenir face à une information manquante. Systématiser une demande d'affinage même sur un prompt déjà précis. Multiplier les pistes proposées ou les rendre trop proches les unes des autres. Des exemples few-shot non représentatifs ou biaisés. Mélanger instructions et données sans les délimiter. Prendre un raisonnement chain-of-thought pour une preuve d'exactitude. Se précipiter vers l'implémentation avant d'avoir validé cadrage et conception. Valider un prompt sur un seul essai réussi. |
| **Bonnes pratiques** | Toujours préciser la conduite attendue en cas d'ambiguïté. Réserver l'affinage aux cas d'ambiguïté réelle, avec une hypothèse par défaut en plus de la question. Face à une incertitude stylistique ou créative, proposer 2-3 pistes courtes et nettement distinctes plutôt qu'une question abstraite. Choisir des exemples few-shot représentatifs de la diversité réelle des cas. Toujours délimiter explicitement instructions, contexte et données. Rejouer un prompt sur plusieurs cas avant de le considérer fiable. |
