---
order: 3
---

# SELinux vs AppArmor

Les permissions Unix classiques (voir [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers)) suivent un modèle **discrétionnaire** (*DAC*, *Discretionary Access Control*) : le propriétaire d'un fichier décide lui-même qui y accède. Un **contrôle d'accès obligatoire** (*MAC*, *Mandatory Access Control*) ajoute une couche de règles imposées par le système, que même le propriétaire d'un fichier ne peut pas contourner : utile pour limiter les dégâts si un programme est compromis, en l'empêchant d'accéder à des fichiers hors de son périmètre normal, même s'il tourne avec des permissions Unix suffisantes pour le faire.

## Deux implémentations, deux distributions

SELinux et AppArmor répondent au même besoin (le MAC) avec des approches différentes ; chaque distribution en intègre une par défaut, cohérente avec [le choix vu précédemment](/?c=administration-systeme&p=virtualisation-et-choix-dos) :

| | SELinux | AppArmor |
|---|---|---|
| Distribution par défaut | Rocky Linux (RHEL) | Debian, Ubuntu |
| Modèle | Basé sur des **étiquettes** (*labels*) posées sur chaque fichier/processus | Basé sur des **chemins de fichiers** |
| Où sont les règles | Une politique centrale, qui associe des étiquettes autorisées entre elles | Un profil par programme, listant les chemins et permissions autorisés |
| Courbe d'apprentissage | Plus raide, mais plus précise | Plus simple à lire et à écrire |

## SELinux : un système d'étiquettes

Chaque fichier et chaque processus reçoit une **étiquette** (*label*, ex : `httpd_sys_content_t` pour les fichiers servis par un serveur web). La politique SELinux définit quelles étiquettes ont le droit d'interagir avec quelles autres : un processus étiqueté `httpd_t` peut lire des fichiers étiquetés `httpd_sys_content_t`, mais se voit refuser l'accès à des fichiers portant une autre étiquette, même si les permissions Unix classiques l'autoriseraient.

```bash
getenforce          # affiche le mode actuel
setenforce 1         # active le mode "enforcing" (bloque les violations)
```

| Mode | Effet |
|---|---|
| `Enforcing` | Bloque et journalise toute violation de la politique |
| `Permissive` | Journalise les violations sans les bloquer (utile pour tester une politique) |
| `Disabled` | SELinux totalement désactivé |

## AppArmor : des profils par chemin

AppArmor associe directement un **profil** à chaque programme, listant les chemins de fichiers auxquels il peut accéder (et avec quelles permissions), plutôt que de passer par un système d'étiquettes séparé :

```text
/usr/sbin/nginx {
    /var/www/html/** r,      # lecture seule sur les fichiers du site
    /var/log/nginx/*.log w,  # écriture sur ses propres logs
}
```

| Mode | Effet |
|---|---|
| `enforce` | Bloque et journalise toute violation du profil |
| `complain` | Journalise les violations sans les bloquer |

> **Note :** dans les deux systèmes, un mode "journalise sans bloquer" (`permissive`/`complain`) sert à valider une nouvelle politique ou un nouveau profil avant de l'activer réellement, en observant dans les journaux système ce qui aurait été bloqué.

> **Piège :** désactiver purement et simplement SELinux ou AppArmor pour "faire disparaître" une erreur d'accès sans comprendre pourquoi elle survient : cela supprime toute la protection MAC plutôt que de corriger l'étiquette ou le profil réellement en cause.
>
> **Bonne pratique :** utiliser le mode journalisation seule (`Permissive`/`complain`) pour identifier précisément la règle manquante, l'ajouter à la politique/au profil, puis repasser en mode strict (`Enforcing`/`enforce`).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le contrôle d'accès obligatoire (MAC) ajoute des règles système imposées, au-dessus des permissions Unix classiques. SELinux (Rocky) étiquette fichiers et processus ; AppArmor (Debian) définit des profils par chemin. |
| **Outils utilisables** | `getenforce`/`setenforce` pour SELinux ; les profils sous `/etc/apparmor.d/` pour AppArmor. |
| **Pièges à éviter** | Désactiver complètement la protection MAC pour contourner une erreur d'accès mal comprise. |
| **Bonnes pratiques** | Diagnostiquer en mode journalisation seule (`Permissive`/`complain`) avant de corriger puis repasser en mode strict. |
