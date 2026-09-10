---
order: 9
---

# Mettre en place un environnement local pour une application PHP connectée à SQL Server

Développer une application qui parle à une base de données qui vit ailleurs (un serveur d'entreprise, un environnement de production) pose un problème récurrent : travailler directement sur cette base distante est risqué (une erreur touche les vraies données) et souvent impossible (accès réseau restreint). La solution habituelle est de restaurer une copie de la base **en local**, puis de faire tourner l'application dessus le temps du développement. Ce chapitre couvre les pièges rencontrés lors de cette mise en place, avec [Microsoft SQL Server](/?c=langages-de-programmation&s=domain-specific-languages-dsl&p=sql) comme exemple concret.

## Restaurer une sauvegarde `.bak` en local

SQL Server exporte une base sous forme d'un fichier **`.bak`**, une sauvegarde complète (schéma + données) à un instant donné. **SSMS** (*SQL Server Management Studio*, l'outil graphique officiel d'administration de SQL Server) permet de la restaurer sur une instance locale : *Restore Database* > *Device*, en pointant vers le fichier `.bak` reçu. Une fois restaurée, la base porte le même nom et la même structure que l'originale, mais vit entièrement sur la machine locale.

## Créer un utilisateur dédié plutôt que `sa`

`sa` (*system administrator*) est le compte administrateur intégré de SQL Server, avec tous les droits sur l'instance entière (toutes les bases, pas seulement celle restaurée). Une application ne devrait jamais s'y connecter :

```sql
CREATE LOGIN app_backoffice WITH PASSWORD = 'un-mot-de-passe-fort';

USE MaBaseRestauree;
CREATE USER app_backoffice FOR LOGIN app_backoffice;
ALTER ROLE db_owner ADD MEMBER app_backoffice;
```

`app_backoffice` obtient ainsi tous les droits (`db_owner`) sur la seule base `MaBaseRestauree`, sans pouvoir toucher aux autres bases ni à la configuration de l'instance.

> **Bonne pratique :** un identifiant applicatif n'a besoin que des droits sur les bases qu'il utilise réellement, jamais des droits d'administration de l'instance entière. Une fuite de ces identifiants (fichier de configuration commité par erreur, log qui les affiche) a un impact limité à ces bases précises, plutôt qu'à tout le serveur.

## Lancer le serveur de développement PHP sur la bonne adresse

`php -S` démarre un serveur HTTP intégré, pratique pour développer sans configurer un vrai serveur web :

```bash
php -S localhost:8000
```

> **Piège (Windows) :** `localhost` peut se résoudre en IPv6 (`[::1]`) plutôt qu'en IPv4 (`127.0.0.1`), et le serveur intégré de PHP ne se bind alors que sur l'adresse résolue. Un navigateur ou un outil qui insiste sur `127.0.0.1:8000` ne trouve donc personne à cette adresse, alors que le serveur tourne bel et bien sur `[::1]:8000`. Correctif : binder explicitement l'adresse voulue plutôt que le nom générique `localhost` :
> ```bash
> php -S 127.0.0.1:8000
> ```

## Extensions PHP manquantes : un blocage à la fois

`composer install` télécharge et installe les dépendances déclarées d'un projet PHP. S'il manque une extension PHP requise par l'une d'elles, l'installation échoue -- mais uniquement sur la **première** extension manquante rencontrée, pas sur la liste complète :

```text
1er essai : composer install
  -> erreur : l'extension "openssl" est requise

(openssl activée)

2e essai : composer install
  -> erreur : l'extension "gd" est requise

(gd activée, puis zip, puis sodium...)
```

Chaque extension se réactive dans le fichier `php.ini` (repérer lequel est utilisé avec `php --ini`) en retirant le `;` qui commente sa ligne (`;extension=gd` devient `extension=gd`), à condition que le fichier `.dll`/`.so` correspondant existe bien dans le dossier `ext/` de l'installation PHP.

> **Piège :** s'arrêter après avoir corrigé la première erreur et conclure que "ça ne marche toujours pas" au deuxième échec, sans remarquer qu'il s'agit d'une extension **différente** de la précédente. Le message d'erreur nomme toujours l'extension manquante : le relire à chaque nouvel échec plutôt que de supposer que c'est encore la même.

## Le fichier hosts : donner un nom à `127.0.0.1`

Le fichier **hosts** du système associe manuellement un nom de domaine à une adresse IP, avant même toute résolution DNS réseau :

| Système | Emplacement |
|---|---|
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| Linux/macOS | `/etc/hosts` |

```text
127.0.0.1   mondomaine.local
```

Une fois cette ligne ajoutée, `http://mondomaine.local:8000` désigne le serveur local, exactement comme `http://127.0.0.1:8000`, mais sous un nom stable et lisible.

> **Piège :** ce fichier n'est modifiable qu'avec des droits administrateur (accès refusé sinon, même pour un outil qui tente de l'éditer automatiquement). Sous Windows, ouvrir l'éditeur de texte lui-même en tant qu'administrateur avant d'y accéder.

## Pourquoi un hostname stable compte : le `redirect_uri` OAuth

Un flux [OAuth 2.0](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (utilisé par exemple pour "Se connecter avec Google") exige de déclarer à l'avance, dans la console d'administration du fournisseur (Google Cloud Console, admin Okta...), l'URL exacte vers laquelle il renverra l'utilisateur une fois connecté : le **`redirect_uri`**.

> **Piège :** le fournisseur OAuth refuse toute requête dont le `redirect_uri` ne correspond pas **exactement, caractère pour caractère**, à une URL déjà déclarée de son côté. Un simple `localhost:8000` fonctionne rarement en pratique (beaucoup de fournisseurs l'interdisent, ou l'application change de port d'une exécution à l'autre) : donner un nom stable au serveur local via le fichier hosts (`mondomaine.local`) puis déclarer `http://mondomaine.local:8000/callback` côté fournisseur résout le problème -- mais les deux étapes sont nécessaires, ajouter le hostname au fichier hosts sans le déclarer aussi côté fournisseur ne suffit pas.

## Note : un proxy d'entreprise peut ralentir Composer sans le bloquer

Sur un réseau d'entreprise filtré par un proxy TLS (qui inspecte le trafic chiffré en réémettant ses propres certificats), chaque paquet Composer peut échouer une première fois en téléchargement direct (`SSL routines::certificate verify failed`, le certificat du proxy n'étant pas reconnu par la configuration OpenSSL de PHP) avant de réussir via un clone Git en repli automatique. Cela ralentit `composer install` sans le bloquer complètement -- une lenteur inhabituelle vaut la peine d'être vérifiée dans les logs de Composer plutôt que d'être ignorée.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Restaurer une copie locale (`.bak` via SSMS) plutôt que de développer sur une base distante. Créer un utilisateur applicatif dédié (`db_owner` sur la seule base concernée), jamais `sa`. `php -S localhost` peut se binder en IPv6 seul sous Windows. `composer install` échoue une extension PHP manquante à la fois, pas toutes d'un coup. Le fichier hosts (droits admin requis) donne un nom stable à `127.0.0.1`, utile notamment pour un `redirect_uri` OAuth qui doit correspondre exactement à ce qui est déclaré côté fournisseur. |
| **Outils utilisables** | SSMS (*Restore Database* > *Device*) pour restaurer un `.bak`. `CREATE LOGIN`/`CREATE USER`/`ALTER ROLE db_owner` pour un utilisateur applicatif dédié. `php --ini` pour localiser le `php.ini` actif. Le fichier hosts pour un hostname local stable. |
| **Pièges à éviter** | Se connecter en `sa` depuis une application. Binder `php -S` sur `localhost` plutôt qu'une adresse IPv4 explicite. Corriger une seule extension PHP manquante et supposer le problème résolu. Modifier le fichier hosts sans droits administrateur. Ajouter un hostname local sans le déclarer aussi comme `redirect_uri` côté fournisseur OAuth. |
| **Bonnes pratiques** | Toujours restaurer une copie locale plutôt que développer sur des données de production. Limiter les droits d'un compte applicatif aux seules bases qu'il utilise. Relire le nom exact de l'extension manquante à chaque nouvel échec de `composer install`. Vérifier les logs de Composer en cas de lenteur inhabituelle plutôt que de l'ignorer. |
