---
order: 4
---

# Le fil d'actualité : construire le flux de chacun (fan-out)

Un fil d'actualité (Instagram, mais le principe est identique sur la plupart des réseaux sociaux) doit afficher, pour chaque utilisateur, les publications de tous les comptes qu'il suit, dans l'ordre. Le problème n'est pas de stocker les publications : il est de savoir **quand** assembler, pour chaque utilisateur, la liste de ce qu'il doit voir. Deux stratégies opposées répondent à cette question, appelées **fan-out** (diffusion) sur écriture ou sur lecture.

## Fan-out sur écriture (push) : préparer le flux à l'avance

Dès qu'un compte publie, le système écrit immédiatement cette publication dans le flux **déjà précalculé** de chacun de ses abonnés :

```text
Compte A publie
   |
   v
Écrit la publication dans le flux précalculé de :
   Abonné 1, Abonné 2, Abonné 3, ... Abonné n
   (autant d'écritures que d'abonnés)

Plus tard, l'abonné 1 ouvre son fil :
   -> lit directement son flux déjà prêt (rapide)
```

Lire son fil devient alors très rapide (une simple lecture d'une liste déjà prête), au prix d'un travail d'écriture démultiplié à chaque publication.

## Fan-out sur lecture (pull) : tout assembler au moment de consulter

À l'inverse, rien n'est précalculé à la publication. Quand un utilisateur ouvre son fil, le système va chercher en direct les dernières publications de tous les comptes qu'il suit, et les assemble à ce moment-là :

```text
Compte A publie
   |
   v
Rien ne se passe pour les abonnés (écriture unique, peu coûteuse)

Plus tard, l'abonné 1 ouvre son fil :
   -> va chercher les dernières publications de CHAQUE compte suivi
   -> les assemble et les trie à cet instant (coûteux si beaucoup de comptes suivis)
```

## Comparatif et le "problème de la célébrité"

| | Fan-out sur écriture (push) | Fan-out sur lecture (pull) |
|---|---|---|
| Coût à la publication | Une écriture par abonné | Une seule écriture, peu coûteuse |
| Coût à la lecture du fil | Une simple lecture, très rapide | Assembler et trier en direct, plus lent |
| Cas problématique | Un compte suivi par des millions de personnes : une seule publication déclenche des millions d'écritures simultanées | Un utilisateur qui suit des milliers de comptes : chaque ouverture du fil interroge des milliers de sources |

> **Piège :** choisir uniquement le fan-out sur écriture pour un réseau où certains comptes comptent des millions d'abonnés (le "problème de la célébrité"). Une seule publication d'un tel compte déclencherait autant d'écritures que d'abonnés en une fois, un pic que même un système avec [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) absorbe difficilement.
>
> **Bonne pratique :** un modèle **hybride**, utilisé par la plupart des grands réseaux sociaux : fan-out sur écriture pour la majorité des comptes (peu d'abonnés, lecture rapide garantie), et bascule automatique vers un fan-out sur lecture au-delà d'un certain nombre d'abonnés (les publications d'un compte-célébrité sont récupérées en direct au moment de la lecture, plutôt que poussées en masse à chaque publication). Les écritures massives du fan-out sur écriture sont elles-mêmes déléguées à une [file d'attente](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) en arrière-plan, pour que l'auteur de la publication n'attende pas la fin de toutes ces écritures avant de recevoir une confirmation.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le fan-out sur écriture précalcule le flux de chaque abonné à la publication (lecture rapide, écriture coûteuse à grande échelle) ; le fan-out sur lecture assemble le flux à la demande (écriture légère, lecture plus coûteuse). Un modèle hybride bascule vers la lecture pour les comptes à très grand nombre d'abonnés. |
| **Outils utilisables** | Une file d'attente pour distribuer les écritures massives du fan-out sur écriture en arrière-plan. |
| **Pièges à éviter** | Généraliser le fan-out sur écriture à tous les comptes sans exception, y compris ceux à des millions d'abonnés. |
| **Bonnes pratiques** | Modèle hybride, avec un seuil de nombre d'abonnés qui bascule le comportement. |
