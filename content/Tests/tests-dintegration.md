---
order: 5
---

# Les tests d'intégration

Le chapitre sur les [tests unitaires](/?c=tests&p=tests-unitaires) isole une fonction de tout ce qui l'entoure. Mais un programme qui fonctionne correctement fonction par fonction peut encore échouer une fois ces fonctions assemblées : c'est précisément ce que couvrent les tests d'intégration, le niveau intermédiaire de la [pyramide de test](/?c=tests&p=pyramide-de-test).

## Ce qu'un test d'intégration vérifie en plus

Un test d'intégration vérifie que plusieurs composants **fonctionnent correctement ensemble**, généralement en impliquant au moins une dépendance réelle (une vraie base de données, un vrai appel réseau vers un service, un vrai système de fichiers) plutôt qu'un test double.

```text
Test unitaire :
  la fonction enregistrerUtilisateur() appelle bien
  baseDeDonnees.inserer() avec les bons arguments
  -> baseDeDonnees est un test double (mock), rien n'est réellement écrit

Test d'intégration :
  enregistrerUtilisateur() écrit réellement une ligne dans une
  vraie base de données de test, puis on relit cette ligne pour
  vérifier qu'elle correspond aux données attendues
  -> vérifie que le code et la base de données s'entendent vraiment
```

Un test unitaire peut passer alors qu'un test d'intégration échoue sur le même code : par exemple si la fonction appelle correctement la base de données, mais avec une requête [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) syntaxiquement invalide que le mock, lui, ne détecte jamais.

## Où tracer la limite : quels composants inclure

Il n'existe pas de définition universelle et stricte de ce qui compte comme "intégration" : la limite dépend de ce qu'on choisit de tester réellement plutôt que de simuler.

| Composants impliqués | Type de test |
|---|---|
| Une seule fonction, tout le reste simulé | Unitaire |
| La fonction + une vraie base de données de test | Intégration (base de données) |
| La fonction + un vrai appel à une API externe | Intégration (service externe) |
| Toute l'application, du clic utilisateur à la réponse finale | End-to-end (chapitre suivant) |

> **Piège :** appeler "test d'intégration" un test qui simule en réalité toutes ses dépendances avec des mocks très détaillés. Sans dépendance réelle impliquée, ce test reste un test unitaire déguisé, avec la lenteur d'un test d'intégration sans son bénéfice réel.
>
> **Bonne pratique :** un test d'intégration doit impliquer au moins une vraie dépendance externe (base de données, service, système de fichiers) ; sinon, c'est un test unitaire, même s'il en a l'apparence.

## Une base de données de test, jamais la production

Les tests d'intégration qui impliquent une base de données ont besoin de leur propre instance, séparée de la production, généralement recréée avant chaque exécution pour repartir d'un état connu (voir les [fixtures](/?c=tests&p=architecture-de-test) déjà vues au chapitre sur l'architecture de test).

```text
Avant chaque test :
  1. Recréer la base de données de test (vide ou avec des données
     de départ connues)
  2. Exécuter le test (qui écrit/lit dans cette base)
  3. Vérifier le résultat

-> Aucune donnée d'un test ne doit survivre pour polluer le suivant
```

> **Piège :** faire tourner les tests d'intégration contre la base de données de production, par simplicité ou par manque de temps pour en mettre en place une dédiée. Un test qui écrit réellement des données peut alors corrompre ou polluer des données réelles.
>
> **Bonne pratique :** toujours utiliser une base de données (ou un service) de test entièrement séparée de la production, même si sa mise en place demande un effort initial.

## Un niveau plus lent, à utiliser avec discernement

Un test d'intégration coûte plus cher qu'un test unitaire : démarrer une vraie base de données, attendre une vraie réponse réseau, prend du temps. C'est ce coût qui justifie, dans la pyramide de test, d'en avoir moins que de tests unitaires : réservés aux points de jonction entre composants, là où un test unitaire ne peut pas donner confiance à lui seul.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un test d'intégration vérifie que plusieurs composants fonctionnent correctement ensemble, en impliquant au moins une vraie dépendance externe (base de données, service, fichier), contrairement à un test unitaire qui simule tout. Il utilise une base de données de test séparée, jamais la production. |
| **Outils utilisables** | Une base de données de test recréée avant chaque exécution. Un tableau des composants impliqués pour distinguer un test unitaire d'un test d'intégration. |
| **Pièges à éviter** | Appeler "intégration" un test qui simule en réalité toutes ses dépendances. Faire tourner des tests contre la base de données de production. |
| **Bonnes pratiques** | Impliquer au moins une vraie dépendance externe dans un test d'intégration. Utiliser une base de données de test entièrement séparée de la production. |
