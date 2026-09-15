---
order: 15
---

# Répondre au client puis continuer de travailler (PHP-FPM)

Parfois, une requête doit répondre tout de suite tout en déclenchant un calcul lourd derrière (rafraîchir un [cache périmé](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant), par exemple). **PHP-FPM**, le moteur d'exécution le plus courant en production, permet justement de couper la connexion avec le client sans arrêter le script : la réponse part immédiatement, le reste du code continue de tourner, invisible pour l'utilisateur. Ce chapitre explique comment, et où sont les pièges.

## PHP-FPM : un pool de processus, chacun une requête à la fois

Un script PHP a besoin d'un programme pour l'exécuter. Ce programme s'appelle une **SAPI** (*Server API*) : selon celle utilisée, PHP tourne différemment.

| SAPI | Ce que c'est | Usage typique |
|---|---|---|
| CLI | Exécute un script depuis la ligne de commande, sans requête HTTP | Scripts de tâche planifiée, outils en ligne de commande |
| Serveur intégré (`php -S`) | Petit serveur HTTP fourni avec PHP, un seul processus | Développement local uniquement (voir [mettre en place un environnement local](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) |
| **PHP-FPM** (*FastCGI Process Manager*) | Un groupe (*pool*) de processus PHP déjà démarrés, qui reçoivent chacun une requête à la fois via le protocole **FastCGI** | Production, derrière un serveur web comme Nginx ou Apache |

Chaque processus du pool (un **worker**, même notion que dans le chapitre sur le [parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) traite une requête, puis redevient disponible pour la suivante dès que son script se termine :

```text
Nginx (recoit la requete HTTP)
        |
        v  (protocole FastCGI)
   Pool PHP-FPM
   +---------+  +---------+  +---------+
   | worker1 |  | worker2 |  | worker3 |   <- N processus, demarres a l'avance
   | occupe  |  | libre   |  | occupe  |
   +---------+  +---------+  +---------+
```

Un worker occupé ne traite qu'une seule requête jusqu'à ce que son script se termine : c'est justement ce détail que la technique de ce chapitre vient contourner.

## `register_shutdown_function()` : exécuter du code à la toute fin du script

Cette fonction enregistre un rappel (*callback*) qui s'exécute juste après la fin du script : que ce soit une fin normale, un `exit()`/`die()`, ou la plupart des erreurs fatales. Elle fonctionne sur n'importe quelle SAPI, pas seulement PHP-FPM.

```php
<?php
register_shutdown_function(function () {
    error_log('Script terminé à ' . date('H:i:s'));
});

echo 'Bonjour';   // le message de log ne s'affiche qu'après cette ligne, à la toute fin du script
```

> **Note :** un rappel enregistré ainsi ne reçoit aucun paramètre automatiquement ; pour lui transmettre des données du contexte environnant, on utilise une fonction anonyme avec `use (...)`, comme dans l'exemple plus haut.

## `fastcgi_finish_request()` : fermer la connexion sans arrêter le script

Spécifique à PHP-FPM (absente des autres SAPI), cette fonction envoie immédiatement au client tout ce qui a déjà été produit (`echo`...) et ferme la connexion, sans pour autant arrêter le script : le worker continue d'exécuter la suite du code, mais le client, lui, est déjà reparti.

```text
Sans fastcgi_finish_request() :        Avec fastcgi_finish_request() :

requete -> calcul (6 min) -> reponse   requete -> reponse immediate
   le client attend 6 minutes             |
                                           v
                                   calcul (6 min), invisible pour
                                   un client deja reparti
```

```php
<?php
echo 'Traitement lancé, revenez plus tard.';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

genererRapportCouteux();
```

> **Piège :** tout ce qui est écrit après `fastcgi_finish_request()` (`echo`, en-tête HTTP) part dans le vide, sans la moindre erreur : la connexion est déjà fermée, ces sorties sont simplement perdues.

> **Piège :** appeler `fastcgi_finish_request()` sans vérifier `function_exists()` d'abord. Le même code exécuté en CLI ou via le serveur intégré (`php -S`) lève une erreur fatale, puisque la fonction n'existe tout simplement pas sur ces SAPI.

## Combiner les deux : répondre, puis rafraîchir un cache périmé en tâche de fond

Le cas d'usage typique : servir un cache disque périmé tout de suite, et planifier son rafraîchissement pour après la réponse.

```php
<?php
public function getCatalogue(): array
{
    $frais = $this->lireCache();
    if ($frais !== null) return $frais;   // cache encore valide : rien d'autre à faire

    $perime = $this->lireCache(ignorerTtl: true);
    if ($perime !== null) {
        $this->planifierRafraichissementEnFond($this->fichierCache);
        return $perime;                   // répond avec la valeur périmée en attendant le calcul
    }

    return $this->rafraichirMaintenant($this->fichierCache);   // tout premier appel : pas d'autre choix qu'attendre
}

private function planifierRafraichissementEnFond(string $fichier): void
{
    $verrou = $fichier . '.en_cours';

    if (is_file($verrou) && (time() - (int) @filemtime($verrou)) < 600) {
        return;                        // un rafraîchissement tourne déjà, inutile d'en relancer un
    }

    $poignee = @fopen($verrou, 'x');   // 'x' : échoue si le fichier existe déjà (création atomique)
    if ($poignee === false) return;    // un autre worker a gagné la course entre-temps
    fclose($poignee);

    ignore_user_abort(true);           // va au bout même si le client a déjà quitté la page

    register_shutdown_function(function () use ($fichier, $verrou) {
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();  // le client reçoit sa réponse ici, la connexion se ferme
        }
        try {
            $this->rafraichirMaintenant($fichier);
        } finally {
            @unlink($verrou);          // toujours libéré, même si le calcul a levé une exception
        }
    });
}
```

- Le fichier `.en_cours` sert de verrou anti-concurrence : sans lui, chaque requête qui voit le cache périmé relancerait son propre recalcul en parallèle (même piège que celui déjà détaillé dans [stale-while-revalidate](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).
- `fopen(..., 'x')` crée le fichier de façon atomique : si deux workers arrivent en même temps, un seul obtient une vraie poignée, l'autre reçoit `false`.
- Le `finally` (voir [gérer les erreurs en PHP](/?c=langages&s=php&p=exceptions)) garantit que le verrou est levé même si `rafraichirMaintenant()` lève une exception, sans quoi le verrou resterait bloqué jusqu'à expiration de la marge de 10 minutes.

## `ignore_user_abort()` : ne pas dépendre du client déjà reparti

Par défaut, si le client se déconnecte (ferme l'onglet, coupe sa connexion) avant la fin du script, PHP peut interrompre l'exécution en cours de route. `ignore_user_abort(true)` désactive cette interruption : le script va jusqu'au bout quoi qu'il arrive côté client, ce qui est indispensable ici puisque tout l'intérêt de la technique est justement que le client n'attend pas la fin.

> **Piège :** oublier `ignore_user_abort(true)` avant d'enregistrer le rappel. Le travail de fond peut alors s'arrêter en plein milieu si le client a déjà fermé la page, ce qui n'a pourtant plus rien à voir avec lui à ce stade.

## Une limite à garder en tête

Cette technique accélère la réponse perçue par le client, pas la capacité totale du pool : le worker reste occupé jusqu'à la fin réelle du script, travail de fond compris. Un rafraîchissement fréquent ou lourd peut donc quand même saturer le pool, exactement comme s'il bloquait la réponse. Pour un vrai traitement asynchrone découplé du pool de workers, la bonne réponse est une file d'attente dédiée (voir [file d'attente](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=system-design-lexercice)), pas cette astuce, réservée à un travail occasionnel et raisonnablement court.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | PHP-FPM traite chaque requête dans un worker dédié, libéré à la fin du script. `fastcgi_finish_request()` ferme la connexion client sans arrêter le script ; `register_shutdown_function()` exécute du code juste après la fin normale du script, sur n'importe quelle SAPI. |
| **Outils utilisables** | `register_shutdown_function()`, `fastcgi_finish_request()`, `ignore_user_abort()`, `function_exists()` pour vérifier la disponibilité d'une fonction spécifique à une SAPI. |
| **Pièges à éviter** | Appeler `fastcgi_finish_request()` sans `function_exists()` (erreur fatale hors PHP-FPM) ; écrire après cet appel en pensant que ça atteindra le client ; oublier `ignore_user_abort(true)` ; oublier le verrou anti-concurrence sur un cache partagé ; croire que cette technique augmente la capacité du pool plutôt que la latence perçue. |
| **Bonnes pratiques** | Vérifier `function_exists('fastcgi_finish_request')` avant tout appel ; libérer une ressource (verrou, fichier) dans un `finally` à l'intérieur du rappel de fin ; réserver la technique à un travail de fond occasionnel et court, une vraie file d'attente pour le reste. |
