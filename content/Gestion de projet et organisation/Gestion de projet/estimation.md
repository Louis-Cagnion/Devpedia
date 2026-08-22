---
order: 3
---

# L'estimation

Une fois le [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) rempli de user stories priorisées, une question reste ouverte : combien de temps chacune va-t-elle prendre ? L'**estimation** répond à cette question, avec des méthodes différentes selon ce qu'on cherche vraiment à mesurer.

## Deux façons d'estimer, deux problèmes différents

| Approche | Ce qu'elle mesure | Problème qu'elle pose |
|---|---|---|
| **Estimation en temps** | Une durée précise (« 3 jours ») | Une estimation en temps est souvent prise pour un engagement ferme, alors que ce n'est qu'une prévision |
| **Estimation en points de complexité** | Une taille relative par rapport à d'autres tâches déjà estimées | Ne se convertit pas directement en date, demande une étape supplémentaire (la vélocité, voir plus bas) |

L'estimation en temps se heurte à un biais humain bien documenté : sous-estimer systématiquement la durée d'une tâche, en particulier pour un travail nouveau ou mal connu (le [biais de planification](https://fr.wikipedia.org/wiki/Biais_de_planification)). Les points de complexité contournent en partie ce biais en évitant de demander une date précise.

## Les points de complexité : comparer plutôt que mesurer

Un **point de complexité** (*story point*) n'a pas d'unité de temps fixe : il représente une taille relative, obtenue en comparant une user story à d'autres déjà estimées par le passé.

```text
Story déjà estimée à 3 points : "ajouter un champ de recherche simple"

Nouvelle story à estimer : "ajouter un filtre par catégorie avec
plusieurs critères combinables"

-> plus complexe que la story de référence (3 points), mais pas
   énormément plus -> estimée à 5 points
```

L'échelle utilisée suit le plus souvent la suite de Fibonacci (1, 2, 3, 5, 8, 13...), avec des écarts volontairement croissants : forcer un choix entre 5 et 8 plutôt qu'entre 5 et 6 évite de perdre du temps sur une précision illusoire que l'équipe ne peut de toute façon pas garantir.

> **Piège :** convertir mentalement les points de complexité en jours dès leur attribution (« 3 points = 1 jour »). Cette conversion informelle réintroduit exactement le problème que les points cherchaient à éviter : un engagement de durée déguisé.
>
> **Bonne pratique :** garder les points de complexité comme une mesure relative pure, et ne les convertir en durée que via la vélocité de l'équipe (voir plus bas), jamais par une règle de conversion fixe décidée à l'avance.

## Le planning poker : estimer collectivement

Le **planning poker** est une méthode d'estimation collective, pensée pour éviter qu'une seule personne (souvent la plus expérimentée, ou la plus à l'aise pour s'exprimer) influence tout le groupe :

```text
1. La story à estimer est présentée à l'équipe
2. Chaque personne choisit en secret une carte (1, 2, 3, 5, 8...)
   représentant son estimation
3. Toutes les cartes sont révélées en même temps
4. Si les estimations divergent fortement, les personnes aux
   extrêmes expliquent leur raisonnement, puis un nouveau tour
   a lieu
5. Répéter jusqu'à convergence vers une estimation partagée
```

> **Piège :** révéler les estimations une par une plutôt que simultanément. La première personne à annoncer un chiffre ancre inconsciemment les estimations suivantes autour de sa valeur, ce qui annule l'intérêt du vote secret.
>
> **Bonne pratique :** toujours révéler les cartes en même temps, et traiter un désaccord marqué comme un signal utile (la story cache peut-être une complexité ou une ambiguïté que tout le monde n'a pas identifiée), pas comme un problème à résoudre au plus vite.

## La vélocité : convertir les points en calendrier

La **vélocité** d'une équipe est le nombre de points de complexité qu'elle parvient à traiter en moyenne par sprint (ou par période fixe), mesurée a posteriori sur plusieurs itérations passées.

```text
Sprint 1 : 18 points traités
Sprint 2 : 22 points traités
Sprint 3 : 20 points traités

-> vélocité moyenne ≈ 20 points par sprint

Backlog restant : 100 points
-> prévision : environ 5 sprints pour l'écouler
```

C'est cette vélocité, propre à chaque équipe et mesurée dans le temps, qui permet de traduire des points de complexité en prévision de calendrier, sans jamais avoir eu à demander une durée précise sur une story individuelle.

> **Piège :** comparer la vélocité de deux équipes différentes, ou l'utiliser comme mesure de performance individuelle. Deux équipes n'attribuent pas les points de la même façon ; comparer leurs vélocités revient à comparer des unités différentes malgré une apparence chiffrée identique.
>
> **Bonne pratique :** utiliser la vélocité uniquement pour prévoir le rythme d'une même équipe dans le temps, jamais pour comparer des équipes entre elles.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'estimation en temps se heurte au biais de sous-estimation systématique ; les points de complexité mesurent une taille relative plutôt qu'une durée. Le planning poker fait estimer chaque personne en secret avant de révéler simultanément, pour éviter l'influence d'ancrage. La vélocité (mesurée a posteriori) convertit les points en prévision de calendrier. |
| **Outils utilisables** | Une échelle de type Fibonacci (1, 2, 3, 5, 8, 13...) pour les points de complexité. Le planning poker pour une estimation collective. La vélocité moyenne des derniers sprints pour prévoir un calendrier. |
| **Pièges à éviter** | Convertir mentalement les points en jours dès leur attribution. Révéler les cartes du planning poker une par une. Comparer la vélocité de deux équipes différentes. |
| **Bonnes pratiques** | Garder les points comme mesure relative pure. Révéler les cartes simultanément et traiter un désaccord marqué comme un signal utile. N'utiliser la vélocité que pour prévoir le rythme d'une même équipe dans le temps. |
