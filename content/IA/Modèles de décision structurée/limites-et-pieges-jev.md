---
order: 8
---

# Les limites documentées d'un modèle de décision structurée

Le chapitre [Les modèles de décision structurée](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#a-quoi-ca-sert-et-a-quoi-ca-ne-sert-pas) liste déjà, en tableau, les usages adaptés ou non à cette famille de modèles. TypeSafe AI documente, pour son modèle Jev en version 1.13, neuf modes de défaillance concrets, qui illustrent tous la même idée de fond : un modèle entraîné pour du jugement rapide de "système 1" (voir le [chapitre d'introduction](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#d-ou-vient-l-idee-systeme-1-et-systeme-2)) échoue sur tout ce qui demande un raisonnement construit en plusieurs étapes explicites ("système 2").

| # | Mode de défaillance | Ce que ça signifie concrètement |
|---|---|---|
| 1 | Lecture littérale | Répond à ce que la question dit mot pour mot, sans inférer une condition implicite qu'un humain déduirait du contexte |
| 2 | Calculs et nombres | Ne compte pas de façon fiable (caractères, occurrences dans une longue liste) : ce n'est pas une calculatrice. Juge aussi mal des valeurs numériques proches entre elles (ex : deux couleurs RGB voisines) ; préfère une description en mots ("rouge vif") à un nombre brut |
| 3 | Dates et horaires | Lit une date comme du texte, pas comme une quantité ordonnée : comparaisons temporelles peu fiables, surtout avec des formats mixtes ou des expressions relatives ("la semaine prochaine") |
| 4 | Indirection complexe | Une double négation ou un raisonnement à plusieurs niveaux d'indirection fait chuter la précision |
| 5 | États volumineux | Un état contenant des détails inutiles à la question posée distrait le modèle et dégrade la réponse |
| 6 | Contenu adversarial | Des instructions injectées dans le contenu évalué, ou un contenu formulé pour tromper, peuvent influencer la réponse (voir la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), un risque de même nature déjà couvert pour les LLM génératifs) |
| 7 | Instructions contradictoires | Des critères et des instructions qui demandent des choses différentes créent de la confusion plutôt qu'un arbitrage cohérent |
| 8 | Invariants logiques non garantis | Deux formulations censées être équivalentes en toute rigueur (ex : la probabilité d'un Noul et 1 moins la probabilité de sa négation) ne donnent pas forcément le même résultat : ne pas compter sur une identité logique supposée, formuler chaque question pour qu'elle dise directement ce qu'on veut savoir |
| 9 | Génération de texte | Le modèle n'est pas entraîné pour rédiger du texte libre (voir le [chapitre sur l'entraînement](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd#rlcd-optimiser-pour-une-probabilite-fiable-pas-pour-un-texte)) : le lui demander est à la fois lent et peu fiable |

## Le fil conducteur : bon sens rapide, pas raisonnement construit

Ces neuf limites ne sont pas des bugs isolés mais la conséquence directe de ce que ce type de modèle a été entraîné à faire : répondre vite à un jugement étroit, jamais dérouler un raisonnement explicite. Un modèle de décision structurée excelle sur des jugements de bon sens immédiat, et échoue sur tout ce qui exigerait plusieurs étapes de raisonnement enchaînées.

> **Piège :** demander au modèle une tâche qui recoupe un ou plusieurs de ces neuf points (compter des occurrences, comparer des dates relatives, décider sur la base d'une double négation) en espérant la même fiabilité que sur un jugement simple.
>
> **Bonne pratique :** pré-traiter en code tout ce qui relève d'un calcul exact (comptage, arithmétique, comparaison de dates, cf. le pattern de résolution en code vu pour l'[extraction de dates](/?c=ia&s=modeles-de-decision-structuree&p=recettes-extraction-et-structuration#extraction-de-dates-lire-puis-resoudre-en-code) plus loin dans cette partie), et ne confier au modèle que le jugement qui reste réellement subjectif ou contextuel une fois ce calcul isolé.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un modèle de décision structurée comme Jev échoue de façon documentée sur neuf types de tâches (lecture littérale, calculs et nombres, dates relatives, indirection complexe, états volumineux, contenu adversarial, instructions contradictoires, invariants logiques non garantis, génération de texte), toutes liées à son entraînement pour un jugement rapide plutôt qu'un raisonnement construit. |
| **Outils utilisables** | Aucun outil correctif direct : la parade est architecturale (déplacer le calcul exact en code). |
| **Pièges à éviter** | Confier au modèle un calcul exact, une comparaison de dates relatives, ou un raisonnement à plusieurs niveaux d'indirection. |
| **Bonnes pratiques** | Isoler en code tout ce qui relève d'un calcul vérifiable, ne réserver le modèle qu'au jugement réellement contextuel qui reste une fois ce calcul extrait. |
