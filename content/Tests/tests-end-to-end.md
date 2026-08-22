---
order: 6
---

# Les tests end-to-end

Les [tests d'intégration](/?c=tests&p=tests-dintegration) vérifient que plusieurs composants s'entendent entre eux, mais restent généralement internes au programme (pas d'interface graphique, pas de vrai navigateur). Le sommet de la [pyramide de test](/?c=tests&p=pyramide-de-test), les tests **end-to-end** (E2E, « de bout en bout »), va plus loin : simuler un parcours utilisateur complet, exactement comme une personne réelle l'exécuterait.

## Simuler l'utilisateur, pas le code

Un test E2E ne connaît rien de l'implémentation interne du programme : il pilote l'application comme le ferait un humain, en cliquant sur des boutons, en remplissant des champs, en lisant ce qui s'affiche à l'écran.

```text
Test E2E : "un client peut passer commande de bout en bout"

  1. Ouvrir la page d'accueil du site
  2. Cliquer sur un produit
  3. Cliquer sur "Ajouter au panier"
  4. Aller sur la page de paiement
  5. Remplir le formulaire de livraison
  6. Valider la commande
  7. Vérifier que la page de confirmation s'affiche bien
```

Ce test aurait pu échouer à cause d'un bug dans n'importe laquelle de ces sept étapes : c'est justement ce qui en fait la valeur, il vérifie que le parcours fonctionne réellement dans son ensemble, pas seulement chaque brique prise séparément.

## Le prix de cette couverture large

Un test E2E fait tourner l'application entière (souvent dans un vrai navigateur automatisé), ce qui le rend nettement plus lent qu'un test unitaire ou d'intégration, et plus fragile : un changement d'apparence anodin (un bouton déplacé, un texte reformulé) peut casser le test sans qu'il y ait de bug réel.

> **Piège :** identifier les éléments de la page par leur texte affiché ou leur position visuelle (« le troisième bouton », « le lien qui dit Continuer »). Un simple changement de texte ou de mise en page, même sans bug, casse alors le test.
>
> **Bonne pratique :** identifier les éléments par un attribut dédié et stable (un `id`, un attribut `data-testid`), indépendant du texte affiché ou de la mise en page, pour que seul un vrai changement de comportement fasse échouer le test.

## Réserver l'E2E aux parcours vraiment critiques

Ce coût (lenteur, fragilité relative) justifie directement la forme de la pyramide de test : un test E2E par parcours réellement critique pour l'utilisateur (créer un compte, payer, envoyer un message), pas un test E2E pour chaque détail que couvrirait déjà un test unitaire plus rapide et plus stable.

```text
Bon candidat pour un test E2E :
  "un client peut passer commande" (parcours métier critique,
  implique plusieurs pages et plusieurs composants)

Mauvais candidat pour un test E2E :
  "le champ email refuse une adresse mal formée" (déjà couvert,
  plus vite et plus fiablement, par un test unitaire sur la
  fonction de validation)
```

> **Piège :** essayer de couvrir toutes les combinaisons possibles avec des tests E2E, faute d'avoir des tests unitaires suffisants sur les mêmes cas. La suite devient alors lente au point de ralentir toute l'équipe, sans gain de fiabilité proportionnel.
>
> **Bonne pratique :** ne garder en E2E que les parcours dont l'échec aurait un impact métier réel, et déléguer la vérification des détails (validation d'un champ, calcul isolé) aux niveaux plus bas de la pyramide.

## Tests instables : un problème encore plus marqué qu'ailleurs

Le problème des tests **fragiles** (*flaky*, déjà vu au chapitre sur les tests unitaires) touche particulièrement l'E2E : un délai réseau variable, une animation qui n'est pas encore terminée quand le test tente de cliquer, un ordre de chargement légèrement différent d'une exécution à l'autre, peuvent faire échouer un test sans aucun rapport avec un vrai bug.

> **Bonne pratique :** attendre explicitement qu'un élément soit présent et interactif avant d'agir dessus (plutôt qu'une pause fixe de quelques secondes, qui reste soit trop courte, soit inutilement longue), et traiter tout échec E2E répété comme un signal à investiguer, jamais comme un bruit de fond normal.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un test end-to-end simule un parcours utilisateur complet dans l'application réelle, sans connaître son implémentation interne. Plus lent et plus fragile qu'un test unitaire ou d'intégration, il se réserve aux parcours vraiment critiques pour l'utilisateur. |
| **Outils utilisables** | Des attributs dédiés et stables (`data-testid`) pour identifier les éléments de page. Une attente explicite sur la présence/interactivité d'un élément plutôt qu'une pause fixe. |
| **Pièges à éviter** | Identifier les éléments par leur texte ou leur position visuelle. Couvrir en E2E des cas déjà couverts par des tests unitaires plus rapides. |
| **Bonnes pratiques** | Identifier les éléments par un attribut stable et dédié. Réserver l'E2E aux parcours dont l'échec aurait un impact métier réel. Traiter un échec E2E répété comme un signal à investiguer. |
