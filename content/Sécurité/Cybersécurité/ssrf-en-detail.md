---
order: 12
---

# SSRF : contourner la liste blanche

[Sécuriser vos données](/?c=langages&s=php&p=securite) pose le principe du SSRF (forcer le serveur à requêter une destination interne pour le compte de l'attaquant) et sa défense de référence : valider l'hôte cible contre une liste blanche explicite plutôt que de faire confiance à une URL fournie par le client. Ce chapitre couvre deux façons dont cette liste blanche, pourtant en place, peut être contournée.

## Contourner la liste blanche par une redirection HTTP

Une validation qui vérifie seulement l'URL de DÉPART fournie par l'utilisateur, sans revérifier où une redirection HTTP mène ensuite, laisse une porte ouverte : l'attaquant héberge lui-même une redirection vers sa vraie cible.

```text
1. Liste blanche autorisée : uniquement "images.example.com"

2. Attaquant fournit : http://images.example.com/redirige-vers-cible
   -> passe la validation : l'hote de depart EST bien images.example.com

3. Le serveur suit la requete... qui repond en realite par une redirection HTTP :
   HTTP/1.1 302 Found
   Location: http://169.254.169.254/latest/meta-data/

4. Si le code qui effectue la requete SUIT automatiquement cette redirection
   (comportement par defaut de la plupart des bibliotheques HTTP), il atteint
   la vraie cible interne, jamais revalidee contre la liste blanche
```

| | |
|---|---|
| **Piège** | Valider l'hôte une seule fois, avant d'envoyer la requête, en supposant que la destination reste la même tout au long de l'échange |
| **Bonne pratique** | Désactiver le suivi automatique des redirections pour toute requête sortante construite à partir d'une donnée utilisateur, ou revalider l'hôte de destination à CHAQUE redirection suivie, pas seulement à la requête initiale |

## SSRF via un générateur de document (HTML vers PDF)

Un outil qui transforme du HTML en PDF (facture téléchargeable, export de rapport) est, techniquement, un mini-navigateur : il charge et affiche des ressources comme le ferait Chrome ou Firefox, y compris des images ou des `iframe` référencées par une URL. Si le contenu HTML à transformer intègre une donnée utilisateur non filtrée, cette fonctionnalité devient candidate au même risque SSRF qu'un appel HTTP explicite.

```html
<!-- Contenu inséré par l'utilisateur dans un champ censé n'afficher qu'une image de profil -->
<img src="http://169.254.169.254/latest/meta-data/iam/security-credentials/">
<!-- ou, selon le moteur de rendu utilisé, un chemin de fichier LOCAL au lieu d'une URL -->
<img src="file:///etc/passwd">
```

Si le moteur de rendu affiche réellement le résultat de cette requête dans le PDF généré (ou le retourne d'une façon exploitable), le contenu d'une ressource interne ou d'un fichier local se retrouve exposé dans un document que l'attaquant peut ensuite télécharger.

| | |
|---|---|
| **Piège** | Considérer un générateur de PDF comme un simple outil de mise en forme, sans réaliser qu'il fait des requêtes réseau/fichier comme un navigateur pour résoudre chaque ressource référencée dans le HTML |
| **Bonne pratique** | Désactiver, dans la configuration du moteur de rendu, le chargement de ressources externes et l'accès au système de fichiers local ; à défaut, appliquer la même liste blanche d'hôtes que pour un appel SSRF classique sur toute URL insérée dans le contenu à transformer |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une liste blanche d'hôtes protège contre un SSRF direct, mais reste contournable par une redirection HTTP non revalidée, ou par un générateur de document (HTML→PDF) qui charge des ressources comme un navigateur sans que ça saute aux yeux comme une "requête réseau". |
| **Outils utilisables** | Option de désactivation du suivi de redirection d'une bibliothèque HTTP ; option de désactivation du chargement de ressources externes/fichiers locaux d'un moteur de rendu PDF. |
| **Pièges à éviter** | Ne valider l'hôte qu'à la requête initiale, jamais après une redirection suivie. Traiter un générateur de PDF comme incapable de faire des requêtes réseau. |
| **Bonnes pratiques** | Désactiver le suivi automatique de redirection ou revalider à chaque saut. Restreindre les ressources chargeables par un moteur de rendu de document à ce qui est strictement nécessaire. |
