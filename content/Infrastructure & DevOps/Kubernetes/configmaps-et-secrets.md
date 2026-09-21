---
order: 3
---

# ConfigMaps et Secrets : sortir la config de l'image

## Le problème : une image ne devrait pas contenir sa configuration

Une [image Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) est censée rester identique entre les environnements (développement, préproduction, production). Si l'URL de la base de données ou le mot de passe d'un service externe étaient écrits en dur dedans, il faudrait reconstruire une image différente pour chaque environnement, et un secret finirait versionné avec le reste du code.

## ConfigMap : la configuration non sensible

Un **ConfigMap** stocke des paires clé/valeur de configuration (URL d'une API, niveau de log, nom d'un environnement) en dehors de l'image, injectées dans le pod au démarrage sous forme de variables d'environnement ou de fichiers montés :

```text
ConfigMap (cle: valeur)  -->  injecte dans le pod au demarrage
API_URL: https://api.exemple.com
LOG_LEVEL: info
```

Changer une valeur du ConfigMap ne demande jamais de reconstruire l'image : seul le pod redémarre avec la nouvelle configuration.

## Secret : la même idée, pour les données sensibles

Un **Secret** suit le même principe qu'un ConfigMap, réservé aux données sensibles (mot de passe, clé d'API, certificat). Kubernetes les stocke et les transmet séparément du reste de la configuration, pour permettre un contrôle d'accès plus strict que sur un ConfigMap ordinaire.

> **Piège :** un Secret Kubernetes de base n'est encodé qu'en Base64, pas chiffré par défaut : ce n'est pas un coffre-fort, seulement un mécanisme séparé des ConfigMaps pour appliquer des permissions distinctes. Un vrai chiffrement au repos ou un gestionnaire de secrets dédié restent nécessaires pour des données réellement critiques.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un ConfigMap externalise la configuration non sensible d'une image, un Secret fait de même pour les données sensibles ; les deux s'injectent dans le pod au démarrage sans jamais nécessiter de reconstruire l'image. |
| **Outils utilisables** | `kubectl get configmaps`/`kubectl get secrets` pour lister la configuration externalisée d'un cluster. |
| **Pièges à éviter** | Écrire une configuration ou un secret en dur dans l'image plutôt que dans un ConfigMap/Secret. Traiter un Secret Kubernetes de base comme un stockage chiffré. |
| **Bonnes pratiques** | Externaliser systématiquement toute configuration qui varie entre environnements. Réserver les données réellement critiques à un gestionnaire de secrets dédié plutôt qu'à un Secret Kubernetes de base. |
