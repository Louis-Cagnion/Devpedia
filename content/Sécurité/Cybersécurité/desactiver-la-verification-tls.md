---
order: 23
---

# Désactiver la vérification TLS : ce que l'option coupe vraiment (01/11/2026)

Quand un programme appelle une adresse en `https://`, il est le **client** (celui qui demande) et la machine appelée est le **serveur** (celle qui répond), comme expliqué dans [les échanges de données : API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). **HTTPS** est HTTP transporté dans une connexion protégée par **TLS** (*Transport Layer Security*), le protocole qui chiffre la conversation et permet au client de **vérifier l'identité du serveur** grâce à un **certificat** (une pièce d'identité numérique que le serveur présente). Presque tous les outils offrent une option pour **sauter cette vérification** : `curl -k` (le [programme curl](https://curl.se/docs/manpage.html), qui envoie une requête à une adresse depuis le terminal), `verify=False` (en Python) ou `verify => FALSE` (en PHP), par exemple. Elle fait disparaître l'erreur qui bloque, en une ligne, et c'est précisément ce qui la rend dangereuse : le programme marche, et plus rien ne garantit à qui il parle.

Ce chapitre explique ce que la vérification contrôle, pourquoi on est tenté de la couper, ce qu'elle expose (avec un laboratoire exécuté sur votre machine, qui ne touche aucun réseau, hormis un essai facultatif vers un site public signalé en son lieu), puis les solutions qui règlent la vraie cause. Il complète [la cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (qui explique le chiffrement et fabrique un certificat auto-signé) et la partie [attaques réseau](/?c=langages&s=php&p=securite#attaques-reseau) du chapitre PHP sur la sécurité (qui présente l'attaque de l'homme du milieu en une définition) ; il ne les répète pas.

| Partie | Question |
|---|---|
| [Ce que la vérification garantit](#ce-que-la-verification-tls-garantit) | Que contrôle exactement le client, et que fait le chiffrement seul ? |
| [Pourquoi on est tenté de la couper](#pourquoi-on-est-tente-de-la-couper) | Quelles erreurs poussent à écrire `verify=False` ? |
| [Ce que la coupure expose](#ce-que-la-coupure-expose) | Que peut faire un tiers placé entre le client et le serveur ? |
| [Le laboratoire local](#laboratoire-local-voir-la-coupure-en-action) | Comment le voir de ses yeux, sans danger ? |
| [Les options équivalentes](#la-meme-coupure-dans-chaque-outil) | Comment s'écrit la coupure dans chaque outil ? |
| [Un exemple dans un framework PHP](#un-exemple-dans-un-framework-php-drupal-et-guzzle) | À quoi ressemble-t-elle dans un vrai projet ? |
| [Les bonnes solutions](#les-bonnes-solutions) | Que faire à la place, et comment détecter l'oubli ? |

## Ce que la vérification TLS garantit

TLS apporte **trois garanties**, dont une seule est retirée par l'option qui coupe la vérification, et la confusion entre elles est la source du danger :

| Garantie | Question à laquelle elle répond | Qui l'apporte |
|---|---|---|
| **Confidentialité** | Quelqu'un qui écoute le câble peut-il lire ? | Le chiffrement de la conversation |
| **Intégrité** | Quelqu'un peut-il modifier un message en route sans que ça se voie ? | Le chiffrement authentifié (un contrôle d'altération attaché à chaque message) |
| **Authenticité du serveur** | Le serveur en face est-il bien celui que je crois ? | **La vérification du certificat** |

Le chiffrement seul protège contre un curieux qui observe de l'extérieur. Il ne dit rien sur l'interlocuteur : on peut très bien chiffrer parfaitement une conversation avec un inconnu. Image : une porte blindée sur le couloir (le chiffrement) ne sert à rien si la personne que l'on a fait entrer n'est pas celle qu'on attendait. La vérification du certificat est le contrôle de la pièce d'identité à la porte.

### Ce qui se passe à la connexion

Deux termes du schéma : la **clé publique** est la moitié non secrète d'une paire de clés (l'autre moitié, la clé privée, ne quitte jamais le serveur), et la **clé de session** est une clé temporaire, inventée pour cette seule conversation, qui sert à chiffrer les messages (le chapitre [cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) détaille les clés).

```
 CLIENT                                              SERVEUR
   |  1. « Bonjour, je veux parler à api.exemple.org » |
   |-------------------------------------------------->|
   |  2. Voici mon certificat (et ma clé publique)     |
   |<--------------------------------------------------|
   |                                                   |
   |  3. LE CLIENT VÉRIFIE (c'est ce qu'on coupe) :    |
   |     a. la signature remonte à une autorité connue |
   |     b. le nom du certificat = le nom demandé      |
   |     c. le certificat est dans sa période de       |
   |        validité                                   |
   |                                                   |
   |  4. Si tout est bon : échange d'une clé de session|
   |<=================================================>|
   |  5. Conversation chiffrée avec cette clé          |
```

Une **autorité de certification** (*certificate authority*, CA) est un organisme de confiance qui signe les certificats après avoir vérifié l'identité du demandeur (le chapitre [cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#le-certificat-tls-auto-signe) en donne la définition complète, avec la clé publique et la clé privée). Chaque système d'exploitation (ou chaque outil) embarque une liste de CA qu'il croit sur parole : c'est le **magasin de confiance** (*trust store*). Un certificat est accepté si sa signature **remonte**, de signature en signature, jusqu'à une CA de ce magasin : cette suite de signatures est la **chaîne de certificats**.

| Contrôle du client | Il vérifie que... | Message typique quand il échoue |
|---|---|---|
| **Chaîne** | La signature du certificat remonte à une CA du magasin de confiance | `self-signed certificate` ; `unable to get local issuer certificate` (message d'OpenSSL, non reproduit ici) |
| **Nom** | Le nom demandé (`api.exemple.org`) figure dans la liste des noms du certificat (le champ **SAN**, *Subject Alternative Name*) | `no alternative certificate subject name matches target host name` |
| **Dates** | La date du jour est entre la date de début et la date de fin du certificat | `certificate has expired` |
| **Clé** | Le serveur possède bien la clé privée liée au certificat (il le prouve pendant l'échange) | Échec de la connexion (le message varie selon l'outil) |

Un certificat sert à relier **un nom** à **une clé publique**, et la CA se porte garante de ce lien. Si le client ne contrôle pas la chaîne, n'importe qui peut fabriquer un certificat au nom de `api.exemple.org` ; s'il ne contrôle pas le nom, n'importe quel certificat valide (celui d'un autre site) est accepté à sa place. Un cinquième contrôle, la **révocation** (un certificat annulé avant sa date de fin), dépend du client et n'est pas détaillé ici.

## Pourquoi on est tenté de la couper

L'option n'est pas écrite par malveillance. Elle apparaît presque toujours au moment où une erreur bloque le travail et où la cause réelle demande du temps :

| Situation | Ce que l'on voit | Cause réelle | Pourquoi la coupure tente |
|---|---|---|---|
| Serveur de développement avec un certificat **auto-signé** (fabriqué par soi-même) | `self-signed certificate` | Le certificat ne remonte à aucune CA du magasin | « Ce n'est que mon poste, ça n'a pas d'importance » |
| Certificat **expiré** sur un serveur de test ou interne | `certificate has expired` | Personne n'a renouvelé le certificat | Le renouvellement dépend d'un autre service, la livraison est demain |
| Appel par une **adresse IP** ou un alias | `no alternative certificate subject name matches...` | Le certificat est établi pour un autre nom | Le bon nom n'est pas encore dans le DNS (l'annuaire qui traduit un nom en adresse) |
| Réseau d'entreprise avec un **proxy** (un intermédiaire par lequel passent tous les appels) qui inspecte le trafic | `certificate verify failed` | Le proxy réémet ses propres certificats, que l'outil ne connaît pas (voir [la note sur le proxy TLS](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#note-un-proxy-d-entreprise-peut-ralentir-composer-sans-le-bloquer)) | Tous les appels échouent d'un coup |
| Magasin de confiance trop ancien (ancien système, conteneur minimal) | `unable to get local issuer certificate` | La CA qui a signé le certificat n'est pas dans la liste | Le site marche dans le navigateur, pas dans le script |

Dans chacun de ces cas, l'option qui coupe la vérification **supprime le contrôle** au lieu de **corriger la cause**. L'erreur disparaît, comme un voyant d'alerte qu'on débrancherait au lieu de réparer le moteur. Et l'option, une fois écrite, a une fâcheuse tendance à rester : elle est copiée dans un autre fichier, validée en revue sans commentaire, puis livrée. Le test qui passe en développement passe aussi en production, y compris quand il ne devrait pas.

## Ce que la coupure expose

Le scénario à craindre s'appelle l'**attaque de l'homme du milieu** (*man-in-the-middle*, MITM). Un tiers s'intercale entre le client et le serveur : il discute avec le client en se faisant passer pour le serveur, et avec le vrai serveur en se faisant passer pour le client.

```
 Vérification ACTIVE
   CLIENT ----> ATTAQUANT        Le certificat de l'attaquant ne remonte à aucune CA
                   X             connue : le client REFUSE, la connexion s'arrête.

 Vérification COUPÉE
   CLIENT ====== ATTAQUANT ====== SERVEUR
      conversation 1     conversation 2
      chiffrée avec la   chiffrée avec la
      clé de l'attaquant clé du vrai serveur

   L'attaquant déchiffre la conversation 1, lit ou modifie, rechiffre la conversation 2.
```

Le client croit parler à `api.exemple.org` : la conversation est bien chiffrée, mais **avec l'attaquant**. Qui peut se placer au milieu ? Plus de monde qu'on ne l'imagine :

| Position de l'attaquant | Comment il se retrouve entre les deux |
|---|---|
| Réseau Wi-Fi public ou partagé | Il tient le point d'accès, ou se fait passer pour la passerelle (l'équipement par lequel sort tout le trafic du réseau) |
| Nom de domaine détourné | Il corrompt la réponse du DNS pour que le nom pointe vers sa machine |
| Équipement compromis sur le trajet | Un routeur (l'équipement qui aiguille le trafic entre réseaux), un proxy, une machine d'un réseau d'hébergement partagé |
| Fournisseur d'accès ou hébergeur compromis | Il voit passer le trafic et peut le rediriger |

Sans coupure, l'attaquant devrait présenter un certificat valide pour `api.exemple.org`, signé par une CA de confiance : c'est très difficile à obtenir. **Avec la coupure, un certificat fabriqué en trois secondes suffit.** La difficulté de l'attaque tombe à zéro.

Ce qu'il peut faire dépend de ce que le programme envoie et reçoit :

| Ce qui circule | Ce que l'attaquant en fait |
|---|---|
| Un **jeton** (un texte secret qui prouve l'identité de l'appelant) ou une clé d'API dans l'**en-tête** `Authorization` (une ligne d'information jointe à la requête) | Il le copie et appelle l'API à votre place (voir [authentifier une API](/?c=securite&s=cybersecurite&p=securite-api-web#authentifier-une-api-cle-ou-jeton-selon-le-client)) |
| Un mot de passe, des données personnelles | Il les lit |
| Une réponse (solde, statut de paiement, configuration) | Il la remplace par une fausse : « paiement accepté », « utilisateur autorisé » |
| Un fichier téléchargé (mise à jour, dépendance, script) | Il le remplace par une version piégée, qui s'exécutera chez vous |
| Un appel de serveur à serveur ([webhook](/?c=securite&s=cybersecurite&p=securite-des-webhooks), synchronisation entre deux applications, appel d'une API partenaire) | Tout ce qui précède, sans qu'aucun humain ne voie jamais d'avertissement |

Le dernier cas est le plus insidieux : un **navigateur** affiche un grand écran rouge devant un certificat suspect, et un humain peut renoncer. Un **programme** qui a l'option coupée n'affiche rien et ne renonce jamais. Le thème des requêtes sortantes d'un serveur est aussi celui du chapitre [SSRF : contourner la liste blanche](/?c=securite&s=cybersecurite&p=ssrf-en-detail) : un serveur qui appelle d'autres serveurs est une cible, et la vérification TLS est l'un de ses garde-fous.

> **À retenir :** la coupure ne désactive pas le chiffrement. La conversation reste chiffrée. Elle désactive la **preuve de l'identité de l'interlocuteur**, donc la seule chose qui garantit que le chiffrement mène au bon destinataire.

## Laboratoire local : voir la coupure en action

Tout ce qui suit se passe **sur votre machine**, à l'adresse `127.0.0.1` (l'adresse de la machine elle-même, aussi appelée `localhost`), sur un **port** libre (le numéro qui distingue plusieurs services sur la même machine ; ici 7231, bien au-dessus des ports courants). Aucun paquet ne sort sur Internet. Le laboratoire demande un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), un [éditeur de texte](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide) pour créer les fichiers, et quatre outils : [`openssl`](https://docs.openssl.org/3.0/man1/openssl/) (le programme de référence pour fabriquer des certificats), `python3` (le langage [Python](/?c=langages&s=python&p=python)), [`curl`](https://curl.se/docs/manpage.html) (le programme qui envoie une requête à une adresse, vu plus haut) et `node` (l'environnement qui exécute [JavaScript](/?c=langages&s=javascript&p=javascript) hors du navigateur). La bibliothèque Python `requests` s'installe avec `pip install requests` (`pip` est l'installeur de paquets de Python, voir [les modules et environnements](/?c=langages&s=python&p=modules-et-environnements)). Les lignes `PHP` (le langage [PHP](/?c=langages&s=php&p=php)) sont facultatives. Les messages et les sorties de ce chapitre ont été obtenus avec curl 8.5, Python 3.12 (requests 2.31), Node.js 22, PHP 8.3 et OpenSSL 3.0 : selon les versions, la formulation d'un message varie un peu.

Le plan, en trois temps :

| Temps | Serveur sur le port 7231 | Ce que l'on montre |
|---|---|---|
| 1 | Le serveur **A**, avec le certificat A | L'erreur de vérification, puis les options qui la « réparent » |
| 2 | Le serveur **B**, avec un **autre** certificat B, au même endroit | Le client à vérification coupée ne remarque rien |
| 3 | A puis B, avec l'épinglage | Un contrôle plus strict que la simple confiance |

Le serveur B joue ici le rôle de l'attaquant : il a pris la place de A. Sur un vrai réseau, c'est le DNS corrompu, le Wi-Fi piégé ou le proxy qui y amènerait le client ; le résultat côté client est le même.

### Étape 1 : deux certificats auto-signés

```bash
# mkdir crée un dossier de travail jetable, cd s'y place
# && : la 2e commande ne part que si la 1re a réussi (voir les commandes de base)
mkdir labo-tls && cd labo-tls
# boucle : deux tours, avec la variable n valant a puis b (un certificat par tour)
# $n donne la valeur de n : cle-$n.pem devient cle-a.pem, puis cle-b.pem
for n in a b; do
  # req -x509 fabrique un certificat auto-signé ; -nodes laisse la clé privée en clair
  # -days 30 : valable 30 jours
  # -newkey rsa:2048 : crée en même temps une paire de clés RSA de 2048 bits
  # -keyout / -out : les fichiers où écrire la clé privée / le certificat
  # -subj "/CN=localhost" : CN (nom courant) = le nom du titulaire du certificat
  # -addext : ajoute la liste des noms valables (SAN) : localhost, 127.0.0.1
  # \ en fin de ligne : la commande continue sur la ligne suivante
  # 2>/dev/null : jette les messages d'erreur (le canal 2) que openssl affiche,
  # ici des points de progression (/dev/null est un fichier poubelle)
  openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout cle-$n.pem -out cert-$n.pem \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
done
```

Les commandes `mkdir`, `cd`, `&&`, `>` et `2>/dev/null` sont expliquées dans [les commandes de base](/?c=langages&s=bash&p=commandes-de-base) et [les redirections](/?c=langages&s=bash&p=redirections-et-pipes). Les options de `openssl req` sont détaillées dans [le chapitre sur le certificat auto-signé](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#le-certificat-tls-auto-signe) et dans la [documentation d'OpenSSL](https://docs.openssl.org/3.0/man1/openssl-req/). Les deux certificats portent **le même nom** (`localhost`) et la même durée, mais ont chacun **leur propre paire de clés** : ils sont indiscernables à l'œil, et pourtant le client doit pouvoir les distinguer.

### Étape 2 : un petit serveur HTTPS

Les fichiers de ce laboratoire (`serveur.py`, puis `client.py`, `client.mjs`, `client-ssl.py`, `client.php`) se créent avec l'éditeur de texte : on y colle le contenu du bloc, puis on l'enregistre sous le nom indiqué, dans ce même dossier `labo-tls`. Le fichier `serveur.py` démarre un serveur HTTPS qui répond « reponse du serveur » suivi de son nom, et qui note l'en-tête `Authorization` reçu (l'en-tête qui sert à envoyer un jeton d'identification, vu plus haut).

```python
# ssl : le module Python qui ajoute TLS à une connexion
import ssl
# sys : lecture des arguments de la ligne de commande
import sys
# http.server : un serveur web minimal fourni avec Python
from http.server import BaseHTTPRequestHandler, HTTPServer

# arguments : le port, le fichier du certificat, le fichier de la clé, le nom du serveur
# a, b = x, y : affectation multiple (a reçoit x et b reçoit y, voir les tuples)
# int convertit le texte du port en nombre ; sys.argv[1] est le 1er argument donné
port, certificat, cle, nom = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]


# une classe regroupe des fonctions ; celle-ci décrit comment répondre aux requêtes
class Gestionnaire(BaseHTTPRequestHandler):
    # do_GET est appelée à chaque requête GET reçue ; self désigne la requête en cours
    def do_GET(self):
        # affiche l'en-tête Authorization reçu
        # (le f devant le texte y insère les {variables})
        # flush=True : écrit tout de suite dans le journal, sans attendre un tampon plein
        print(f"[{nom}] Authorization reçu :", self.headers.get("Authorization"), flush=True)
        # le texte renvoyé (\n : retour à la ligne) ; encode le convertit en octets
        corps = f"reponse du serveur {nom}\n".encode()
        # code 200 : la requête a réussi
        self.send_response(200)
        # annonce la taille de la réponse en octets
        self.send_header("Content-Length", str(len(corps)))
        # termine les en-têtes
        self.end_headers()
        # envoie le corps de la réponse
        self.wfile.write(corps)

    # remplace le journal par défaut par rien, pour garder une sortie lisible
    # (*args accepte n'importe quels arguments ; pass : ne fait rien)
    def log_message(self, *args):
        pass


# crée le serveur : il écoute sur 127.0.0.1 (cette machine uniquement) au port donné
serveur = HTTPServer(("127.0.0.1", port), Gestionnaire)
# contexte TLS côté serveur : il porte le certificat et la clé privée
contexte = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# charge le certificat présenté aux clients et la clé privée qui lui correspond
contexte.load_cert_chain(certificat, cle)
# enveloppe la socket (le point d'entrée réseau) dans TLS : le serveur parle HTTPS
# server_side=True : cette socket est celle d'un serveur (qui présente un certificat)
serveur.socket = contexte.wrap_socket(serveur.socket, server_side=True)
# attend les requêtes jusqu'à ce que le programme soit arrêté
serveur.serve_forever()
```

L'affectation multiple de la ligne `port, certificat, cle, nom = ...` est le déballage de tuple vu dans [les listes et les tuples](/?c=langages&s=python&p=listes-et-tuples#deballage-unpacking). La commande de lancement prend quatre arguments : le port, le certificat, la clé et le nom du serveur.

```bash
# lance le serveur A en arrière-plan (&), borné à 120 secondes par timeout
# > journal-a.txt : ce que le serveur affiche va dans ce fichier
timeout 120 python3 serveur.py 7231 cert-a.pem cle-a.pem A > journal-a.txt &
# $! : numéro du dernier processus lancé en arrière-plan ; on le garde pour l'arrêter
PID_A=$!
# attend une seconde que le serveur soit prêt à écouter
sleep 1
```

`timeout` arrête le serveur de lui-même au bout de 120 secondes, même si l'on oublie de le faire (relancer les commandes de l'étape si le délai est dépassé, voir [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout#arreter-une-commande-trop-longue-timeout)). Le `&` en fin de ligne renvoie la main au terminal tout en laissant le serveur tourner (voir [la gestion des processus](/?c=langages&s=bash&p=gestion-des-processus)), et `>` envoie ce que le serveur affiche dans un fichier (voir [les redirections](/?c=langages&s=bash&p=redirections-et-pipes)). Le code Python utilise [les classes](/?c=langages&s=python&p=poo) et [la gestion des erreurs](/?c=langages&s=python&p=gestion-des-erreurs).

### Étape 3 : la vérification échoue

```bash
# -s : pas de barre de progression ; -S : mais les erreurs restent affichées
curl -sS https://localhost:7231/
# $? : le code de sortie de la dernière commande lancée (ici curl)
echo $?
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
60
```

C'est exactement le bon comportement : le certificat A est **auto-signé**, il ne remonte à aucune CA du magasin de confiance, et `curl` refuse. Il termine avec le **code de sortie** 60, le dernier nombre affiché par `echo $?` (un nombre que tout programme rend à la fin ; 0 veut dire « succès », autre chose « échec »). Les autres outils disent la même chose avec leurs mots :

| Outil | Message obtenu |
|---|---|
| `curl` | `curl: (60) SSL certificate problem: self-signed certificate` |
| Python `requests` | `certificate verify failed: self-signed certificate` (le client Python lève l'erreur `CERTIFICATE_VERIFY_FAILED`) |
| Node.js (`fetch`) | `DEPTH_ZERO_SELF_SIGNED_CERT` (« certificat auto-signé, profondeur zéro » : la chaîne n'a qu'un maillon) |
| PHP (extension cURL) | `SSL certificate problem: self-signed certificate` |

### Étape 4 : l'option « répare » l'erreur

```bash
# -k (ou --insecure) : curl ne vérifie plus rien
curl -sS -k https://localhost:7231/
```

```
reponse du serveur A
```

L'erreur a disparu, la réponse arrive. Voici les mêmes essais avec les autres outils. Le script Python, enregistré dans `client.py` (le module `re` des expressions régulières est présenté dans [les regex en Python](/?c=langages&s=python&p=regex-en-python)) :

```python
# re : les expressions régulières, qui cherchent un motif dans un texte
import re
# sys : lecture des arguments de la ligne de commande
import sys
# requests : la bibliothèque Python courante pour appeler une adresse web
import requests

# premier argument : l'adresse à appeler
adresse = sys.argv[1]
# 2e argument : "non" donne False (vérification coupée), sinon le fichier de confiance
verification = False if sys.argv[2] == "non" else sys.argv[2]
# try : essaie le bloc ; si l'erreur nommée par except survient, le bloc except s'exécute
try:
    # verify=False coupe la vérification ; verify="fichier.pem" la fait avec ce fichier
    # de confiance, qui remplace la liste habituelle
    # timeout=5 : abandonne l'appel après 5 secondes sans réponse
    reponse = requests.get(adresse, verify=verification, timeout=5)
    # affiche le texte reçu
    print(reponse.text.strip())
except requests.exceptions.SSLError as erreur:
    # la vérification a échoué : cherche le motif, qui suit « certificate verify failed »
    # [^(]* : tous les caractères qui suivent, jusqu'à la première parenthèse (exclue)
    # re.search renvoie le premier endroit du texte qui correspond au motif
    motif = re.search(r"certificate verify failed: [^(]*", str(erreur))
    # .group(0) : le texte trouvé en entier ; .strip() retire les espaces de fin
    print("REFUSE :", motif.group(0).strip())
```

```bash
# premier argument : l'adresse ; second argument : « non » (couper la vérification)
python3 client.py https://localhost:7231/ non
```

```
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
reponse du serveur A
```

(Les lignes trop longues sont coupées ici par `[...]` ; le chemin de la première dépend de votre installation. `urllib3` est la bibliothèque HTTP sur laquelle repose `requests`, voir sa [documentation](https://urllib3.readthedocs.io/en/stable/).) Python **prévient** : c'est un avertissement, pas une erreur. Il se glisse dans la sortie d'erreur d'un programme, où il se perd facilement, et certains projets le font taire (voir [les pièges](#les-pieges)). Le script JavaScript, enregistré dans `client.mjs` (l'extension `.mjs` indique à Node.js un fichier de module, ce qui autorise `await` en dehors d'une fonction ; `fetch` demande Node.js 18 ou plus, `node --version` affiche la version installée ; `await` est présenté dans [le JavaScript asynchrone](/?c=langages&s=javascript&p=asynchrone)) :

```javascript
// process.argv : le tableau des arguments de la ligne de commande
// [0] est node, [1] est le script, donc [2] est le premier argument donné par l'utilisateur
// const déclare une variable qui ne changera plus
// try/catch : essaie le bloc try ; en cas d'erreur, le bloc catch s'exécute
// await : attend le résultat d'une opération asynchrone avant de continuer
const adresse = process.argv[2];
try {
  // fetch appelle l'adresse ; la vérification TLS est faite par Node.js
  const reponse = await fetch(adresse);
  // affiche le texte reçu
  console.log((await reponse.text()).trim());
} catch (erreur) {
  // échec : affiche le code de la cause s'il existe (?.), sinon le message (??)
  console.log("REFUSE :", erreur.cause?.code ?? erreur.message);
}
```

Une particularité de Node.js : la coupure se règle par une **variable d'environnement** (une valeur que le terminal passe au programme qu'il lance, voir [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement)), donc **sans toucher au code**.

```bash
# vérification active (par défaut) : le programme refuse
node client.mjs https://localhost:7231/
# la variable NODE_TLS_REJECT_UNAUTHORIZED=0 coupe la vérification de TOUT le processus
NODE_TLS_REJECT_UNAUTHORIZED=0 node client.mjs https://localhost:7231/
```

```
REFUSE : DEPTH_ZERO_SELF_SIGNED_CERT
(node:131186) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment [...]
(Use `node --trace-warnings ...` to show where the warning was created)
reponse du serveur A
```

Cette variable est la plus dangereuse des options de ce chapitre : une seule ligne dans un fichier de configuration, un script de démarrage ou une définition de conteneur coupe la vérification pour **chaque** appel du programme, y compris ceux des bibliothèques tierces que l'on n'a pas écrites.

### La bonne façon de réparer cette erreur : faire confiance à CE certificat

Le certificat A est connu : c'est nous qui l'avons fabriqué. Au lieu de tout couper, on dit au client « fais confiance à ce certificat-là » :

```bash
# --cacert : donne le fichier de certificats de confiance, pour cet appel seulement
curl -sS --cacert cert-a.pem https://localhost:7231/
# Python : le 2e argument est le fichier de confiance (verify="cert-a.pem")
python3 client.py https://localhost:7231/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS ajoute des certificats de confiance sans rien retirer
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://localhost:7231/
```

```
reponse du serveur A
reponse du serveur A
reponse du serveur A
```

Les trois appels réussissent **avec** la vérification active. La différence avec `-k` ne se voit pas ici, parce que c'est bien le serveur A qui répond. Elle va se voir à l'étape suivante.

#### Ajouter ou remplacer : ce que fait chaque option de confiance

Ces options ne se comportent pas toutes de la même façon. Certaines **ajoutent** le certificat donné à la liste de confiance habituelle (celle des CA publiques), d'autres la **remplacent** : avec elles, un site public comme `https://example.com/` serait refusé, car sa CA n'est plus dans la liste. Essai facultatif (il contacte ce vrai site public, le seul de ce chapitre) avec le serveur A toujours lancé :

```bash
# curl : -o /dev/null jette la page, -w '%{http_code}\n' affiche seulement le code HTTP
curl -sS -o /dev/null -w '%{http_code}\n' --cacert cert-a.pem https://example.com/
# Python : le fichier de confiance est cert-a.pem seul
python3 client.py https://example.com/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS ajoute cert-a.pem aux CA publiques
# head -c 15 ne garde que les 15 premiers caractères de la page
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://example.com/ | head -c 15; echo
```

```
200
REFUSE : certificate verify failed: unable to get local issuer certificate
<!doctype html>
```

| Outil | Option | Effet sur la liste de confiance | Résultat sur `https://example.com/` |
|---|---|---|---|
| Python `requests` | `verify="fichier.pem"` (ou la variable `REQUESTS_CA_BUNDLE`) | **Remplace** la liste | Refusé |
| Python (module `ssl`) | `create_default_context(cafile="fichier.pem")` | **Remplace** la liste | Refusé |
| Node.js (code) | `ca: contenu du certificat` | **Remplace** la liste | Refusé (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) |
| Node.js (variable) | `NODE_EXTRA_CA_CERTS=fichier.pem` | **Ajoute** à la liste | Accepté |
| `curl` | `--cacert fichier.pem` | Remplace le **fichier** de CA par défaut ; mais le **dossier** de CA du système, lu aussi par le curl de Debian et d'Ubuntu, reste utilisé | Accepté ici ; refusé avec en plus `--capath` vers un dossier vide (`unable to get local issuer certificate`) |
| PHP (extension cURL) | `CURLOPT_CAINFO` | Comme `curl`, dont elle reprend la bibliothèque | Accepté ici |

Retenir : seul `NODE_EXTRA_CA_CERTS` **ajoute** vraiment. Pour les autres, ne mettre dans le fichier que la CA de son serveur de test **coupe l'accès aux sites publics** ; pour garder les deux, on y recopie aussi les CA publiques (le fichier du système, souvent `/etc/ssl/certs/ca-certificates.crt` sous Debian et Ubuntu). Le comportement de `curl` dépend de la façon dont il a été compilé : ne comptez pas sur le dossier système.

### Étape 5 : un autre serveur prend la place du premier

On arrête A, puis on lance B au **même port**, avec **l'autre certificat** (B). Du point de vue du client, la même adresse `https://localhost:7231/` répond, mais ce n'est plus la même machine.

```bash
# arrête le serveur A (wait attend qu'il ait fini, sleep laisse le port se libérer)
kill $PID_A; wait $PID_A 2>/dev/null; sleep 1
# lance le serveur B : même port, certificat et clé différents
timeout 120 python3 serveur.py 7231 cert-b.pem cle-b.pem B > journal-b.txt &
# garde son numéro de processus et attend qu'il écoute
PID_B=$!
sleep 1
```

Le client dont la vérification est **coupée** :

```bash
# -H ajoute un en-tête : ici un jeton d'API inventé, comme en enverrait un vrai client
curl -sS -k -H "Authorization: Bearer jeton-secret-123" https://localhost:7231/
# code de sortie de curl : 0, tout s'est bien passé
echo $?
# Python, vérification coupée
python3 client.py https://localhost:7231/ non
```

```
reponse du serveur B
0
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
reponse du serveur B
```

Le client **ne voit que du feu** : la réponse est bien formée, le code de sortie vaut 0 (lisible avec `echo $?`, comme à l'étape 3). La seule trace est dans le journal du serveur B, que le client ne verra jamais :

```bash
# affiche ce que le serveur B a noté
cat journal-b.txt
```

```
[B] Authorization reçu : Bearer jeton-secret-123
[B] Authorization reçu : None
```

Le serveur B a **lu le jeton en clair**. Il pourrait aussi bien renvoyer une réponse falsifiée. La première ligne vient de `curl`, la seconde de Python (qui n'envoyait pas d'en-tête `Authorization`).

Le client qui **connaît le bon certificat** (celui de A) :

```bash
# vérification active, avec la confiance donnée au certificat A
curl -sS --cacert cert-a.pem https://localhost:7231/
# la même chose en Python
python3 client.py https://localhost:7231/ cert-a.pem
# la même chose en Node.js
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://localhost:7231/
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
REFUSE : certificate verify failed: self-signed certificate
REFUSE : DEPTH_ZERO_SELF_SIGNED_CERT
```

Les trois outils **refusent** : le certificat présenté par B n'est pas celui auquel ils font confiance. Voici le bilan du laboratoire :

| Client | Serveur A (légitime) | Serveur B (imposteur) |
|---|---|---|
| Vérification **coupée** (`-k`, `verify=False`) | Réponse | **Réponse aussi : B a lu le jeton** |
| Vérification **sur le certificat A** (`--cacert`, `verify="cert-a.pem"`) | Réponse | **Refus** |

Remarquez que le certificat de B a le **même nom** `localhost` que celui de A, et qu'il est lui aussi valide dans le temps : un contrôle du nom ne l'aurait pas arrêté. C'est la **chaîne de confiance** (savoir à qui l'on fait confiance) qui protège ici.

### Étape 6 : épingler une empreinte

Faire confiance à un certificat précis est l'**épinglage** (*pinning*) : le client n'accepte qu'un serveur dont la clé publique correspond à une empreinte connue d'avance. Une **empreinte** est le résultat d'un [hachage](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hachage-contre-chiffrement-une-confusion-frequente) (ici SHA-256) : une courte valeur qui change dès que la donnée change.

```bash
# extrait la clé publique du certificat A, la convertit en format binaire (DER), la hache
# en SHA-256 puis l'écrit en base64 (un codage de texte) ; | enchaîne les commandes
# $(...) : exécute la commande à l'intérieur et range son résultat dans EMPREINTE
# x509 -pubkey -noout : affiche la clé publique du certificat, mais pas le certificat lui-même
# pkey -pubin -outform der : lit une clé publique (-pubin) et la sort en binaire DER
# dgst -sha256 -binary : calcule l'empreinte SHA-256, en binaire
# enc -base64 : transforme ce binaire en texte lisible
EMPREINTE=$(openssl x509 -in cert-a.pem -pubkey -noout | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64)
# --pinnedpubkey : curl exige que la clé publique du serveur ait cette empreinte
# -k est ajouté ici pour montrer que l'épinglage agit
# même sans la vérification de la chaîne
curl -sS -k --pinnedpubkey "sha256//$EMPREINTE" https://localhost:7231/
```

```
curl: (90) SSL: public key does not match pinned public key
```

Le serveur B (toujours en place) est refusé avec le code 90. On remplace B par A et on recommence :

```bash
# arrête B, relance A (journal-a2.txt), puis rejoue exactement la même commande curl
kill $PID_B; wait $PID_B 2>/dev/null; sleep 1
timeout 120 python3 serveur.py 7231 cert-a.pem cle-a.pem A > journal-a2.txt &
PID_A=$!
sleep 1
curl -sS -k --pinnedpubkey "sha256//$EMPREINTE" https://localhost:7231/
# arrête ce serveur A (les exemples suivants le relancent)
kill $PID_A
```

```
reponse du serveur A
```

Dans un usage réel, on **ne retire pas** la vérification normale : l'épinglage s'ajoute à elle. Les empreintes changent à chaque fabrication de certificat, c'est pourquoi elles ne sont pas recopiées ici. Les limites de l'épinglage sont dans [les bonnes solutions](#les-bonnes-solutions).

### Les deux autres contrôles, avec de vrais messages

Le nom et la date se vérifient de la même façon. Ces essais utilisent un certificat établi pour le seul nom `autre.example`, et un certificat daté de janvier 2025. Le premier se fabrique comme à l'étape 1, avec un autre `-subj` ; le second demande `openssl ca`, dont les options `-startdate` et `-enddate` permettent de choisir les dates (`openssl req` ne le permet pas) :

```bash
# certificat établi pour le nom autre.example (et non localhost)
openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout cle-nom.pem -out cert-nom.pem \
  -subj "/CN=autre.example" -addext "subjectAltName=DNS:autre.example" 2>/dev/null
# demande de certificat (-new), signée ensuite par openssl ca ; elle crée une clé cle-exp.pem
openssl req -new -nodes -newkey rsa:2048 -keyout cle-exp.pem -out exp.csr \
  -subj "/CN=localhost" 2>/dev/null
# fichiers de travail de openssl ca : le registre des certificats émis (vide) et un numéro
: > index.txt
echo 01 > serial.txt
# configuration minimale de openssl ca ; <<'FIN' écrit les lignes suivantes jusqu'à FIN
cat > ca.cnf <<'FIN'
[ca]
default_ca = ca_labo
[ca_labo]
database = index.txt
new_certs_dir = .
serial = serial.txt
default_md = sha256
policy = politique
[politique]
commonName = supplied
FIN
# les noms valables (SAN) du certificat, lus par -extfile
echo "subjectAltName = DNS:localhost,IP:127.0.0.1" > ext.cnf
# -selfsign : signe avec sa propre clé (auto-signé) ; valable le seul 1er janvier 2025
openssl ca -batch -selfsign -config ca.cnf -keyfile cle-exp.pem -in exp.csr \
  -out cert-exp.pem -startdate 20250101000000Z -enddate 20250102000000Z \
  -extfile ext.cnf -notext
```

Pour les essayer, on arrête le serveur en cours, puis on lance le serveur avec l'un de ces deux certificats (`python3 serveur.py 7231 cert-nom.pem cle-nom.pem N` ou `python3 serveur.py 7231 cert-exp.pem cle-exp.pem E`), puis on appelle avec `curl --cacert cert-nom.pem https://localhost:7231/` (ou `cert-exp.pem`). Messages obtenus :

| Situation | `curl` | Python `requests` | Node.js |
|---|---|---|---|
| Nom différent | `SSL: no alternative certificate subject name matches target host name 'localhost'` | `certificate verify failed: Hostname mismatch, certificate is not valid for 'localhost'.` | `ERR_TLS_CERT_ALTNAME_INVALID` |
| Certificat expiré | `SSL certificate problem: certificate has expired` | `certificate verify failed: certificate has expired` | `CERT_HAS_EXPIRED` |

Dans les deux cas, le client avait reçu le certificat du serveur comme certificat de confiance (il était auto-signé, comme A) : seule la propriété testée posait problème, et un client à vérification coupée (`curl -k`) accepte sans réagir, que le nom soit faux ou le certificat expiré.

## La même coupure dans chaque outil

Chaque outil a son nom pour la même idée. Le tableau indique aussi **jusqu'où va** la coupure, car sa portée change l'ampleur du dégât :

| Outil | Écriture qui coupe | Portée | Écriture sûre à la place |
|---|---|---|---|
| `curl` | `curl -k` ou `curl --insecure` | Un appel | `curl --cacert fichier.pem` ([manuel de curl](https://curl.se/docs/manpage.html)) |
| Python `requests` | `requests.get(url, verify=False)` | Un appel | `verify="fichier.pem"` ([documentation de requests](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification)) |
| Python (module `ssl`) | `contexte.check_hostname = False` puis `contexte.verify_mode = ssl.CERT_NONE` | Tous les appels qui utilisent ce contexte | `ssl.create_default_context(cafile="fichier.pem")` ([module `ssl`](https://docs.python.org/3/library/ssl.html)) |
| Node.js (variable) | `NODE_TLS_REJECT_UNAUTHORIZED=0` | **Tout le processus** | `NODE_EXTRA_CA_CERTS=fichier.pem` ([options de Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)) |
| Node.js (code) | `https.get({ rejectUnauthorized: false })` | Un appel (ou un agent partagé) | L'option `ca: contenu du certificat` de la même requête, lu par exemple avec `fs.readFileSync("fichier.pem")` ([module `https`](https://nodejs.org/api/https.html)) |
| PHP, extension cURL | `CURLOPT_SSL_VERIFYPEER` à `false` et `CURLOPT_SSL_VERIFYHOST` à `0` | Un appel | `CURLOPT_CAINFO` (le fichier de CA, voir [`curl_setopt`](https://www.php.net/curl_setopt)) |
| PHP, flux | `'ssl' => ['verify_peer' => false]` | Un appel | `'cafile'` (voir [`verify_peer` en PHP](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verifier-le-certificat-du-serveur-distant)) |
| Guzzle (PHP) | `'verify' => FALSE` | Un appel, ou **tous** si posé dans la configuration commune | `'verify' => '/chemin/ca.pem'` ([options de Guzzle](https://docs.guzzlephp.org/en/stable/request-options.html#verify)) |

Les écritures Python (`verify=False`, `check_hostname`, `CERT_NONE`, `cafile`), Node.js (`rejectUnauthorized`, `ca`, les deux variables) et PHP cURL peuvent toutes être essayées contre le serveur du laboratoire. Le serveur A a été arrêté à la fin de l'étape 6 : on le relance d'abord, avec la même commande qu'à l'étape 2.

```bash
# relance le serveur A, borné à 120 secondes, et garde son numéro de processus
timeout 120 python3 serveur.py 7231 cert-a.pem cle-a.pem A > journal-a3.txt &
PID_A=$!
# attend une seconde que le serveur soit prêt à écouter
sleep 1
```

Exemple de la ligne « module `ssl` », qui doit couper le contrôle du **nom** avant celui de la **chaîne** (sinon Python refuse de modifier le contexte). Enregistré dans `client-ssl.py`, il se lance par `python3 client-ssl.py` (`urllib.request` est la bibliothèque HTTP fournie avec Python, [documentation](https://docs.python.org/3/library/urllib.request.html)) :

```python
# ssl : le module Python de TLS ; urllib.request : un client HTTP fourni avec Python
import ssl
import urllib.request

# contexte par défaut : vérifie la chaîne et le nom
contexte = ssl.create_default_context()
# premier essai : la vérification reste active
try:
    urllib.request.urlopen("https://localhost:7231/", context=contexte)
except Exception as erreur:
    # affiche le motif du refus
    print("REFUSE :", erreur.reason.verify_message)
# coupe la vérification du nom, puis celle de la chaîne (dans cet ordre)
contexte.check_hostname = False
contexte.verify_mode = ssl.CERT_NONE
# deuxième essai : la connexion réussit
reponse = urllib.request.urlopen("https://localhost:7231/", context=contexte)
# affiche le texte reçu
print(reponse.read().decode().strip())
```

```
REFUSE : self-signed certificate
reponse du serveur A
```

Et l'équivalent PHP avec l'extension cURL, enregistré dans `client.php`, qui montre les trois cas (défaut, coupée, confiance donnée). La syntaxe de base de PHP (variables en `$`, fonctions) est dans [les variables PHP](/?c=langages&s=php&p=variables) et [les fonctions PHP](/?c=langages&s=php&p=methodes) ; `===` et le ternaire `? :` sont dans [les conditions PHP](/?c=langages&s=php&p=conditions) :

```php
<?php
// $verification : null garde la vérification par défaut,
// false la coupe, un chemin de fichier donne ce certificat de confiance
// string $adresse : le paramètre doit être un texte ; : void : la fonction ne renvoie rien
function appeler(string $adresse, $verification): void
{
    // curl_init prépare un appel vers l'adresse donnée
    $appel = curl_init($adresse);
    // CURLOPT_RETURNTRANSFER : curl_exec renvoie le texte reçu au lieu de l'afficher
    curl_setopt($appel, CURLOPT_RETURNTRANSFER, true);
    // === : égal ET du même type (0 === false est faux, alors que 0 == false est vrai)
    if ($verification === false) {
        // coupe la vérification de la chaîne de certificats
        curl_setopt($appel, CURLOPT_SSL_VERIFYPEER, false);
        // coupe la vérification du nom (0 : ne pas comparer le nom du certificat)
        curl_setopt($appel, CURLOPT_SSL_VERIFYHOST, 0);
    } elseif ($verification !== null) {
        // CURLOPT_CAINFO : le fichier des certificats de confiance pour cet appel
        curl_setopt($appel, CURLOPT_CAINFO, $verification);
    }
    // exécute l'appel : renvoie false en cas d'échec
    $texte = curl_exec($appel);
    // condition ? a : b (ternaire) vaut a si la condition est vraie, sinon b
    // . colle deux textes ; trim retire les espaces de fin ; "\n" : retour à la ligne
    // affiche donc le texte reçu, ou le message d'erreur de cURL
    echo $texte === false ? 'REFUSE : ' . curl_error($appel) : trim($texte), "\n";
}

// sans option : la vérification reste active par défaut
appeler('https://localhost:7231/', null);
// avec false : la vérification est coupée
appeler('https://localhost:7231/', false);
// $argv : les arguments de la ligne de commande ; $argv[1] est le premier (le fichier)
appeler('https://localhost:7231/', $argv[1]);
```

Le serveur A relancé pour l'exemple précédent tourne encore s'il a moins de 120 secondes ; sinon `timeout` l'a arrêté. Cette commande ne le relance que s'il est arrêté :

```bash
# kill -0 ne tue rien : il teste seulement si le processus existe encore
# || : si ce test échoue, le bloc entre accolades relance le serveur A
kill -0 $PID_A 2>/dev/null || {
  # même commande de lancement qu'à l'étape 2
  timeout 120 python3 serveur.py 7231 cert-a.pem cle-a.pem A > journal-a4.txt &
  # garde le nouveau numéro de processus, puis attend une seconde
  PID_A=$!; sleep 1
}
```

```bash
# contre le serveur A : l'argument est le fichier du certificat de confiance
php client.php cert-a.pem
# arrête le serveur A à la fin du laboratoire
# (2>/dev/null cache l'erreur s'il est déjà arrêté)
kill $PID_A 2>/dev/null
```

```
REFUSE : SSL certificate problem: self-signed certificate
reponse du serveur A
reponse du serveur A
```

| Appel | Résultat |
|---|---|
| `appeler(..., null)` (vérification par défaut) | Refusé : le certificat est auto-signé |
| `appeler(..., false)` (coupée) | Accepté |
| `appeler(..., 'cert-a.pem')` (confiance donnée à A) | Accepté |

## Un exemple dans un framework PHP : Drupal et Guzzle

> **Exemple illustratif d'un framework.** Il montre comment la coupure s'écrit dans un projet réel ; les adresses et noms sont inventés, les noms d'API sont vérifiés sur le code source de Drupal 11.x.

**Drupal** ([drupal.org](https://www.drupal.org/)) est un **CMS** (*content management system*, système de gestion de contenu : un logiciel pour construire et administrer un site) écrit en [PHP](/?c=langages&s=php&p=php). C'est aussi un **framework** : une boîte à outils de code déjà écrit, sur laquelle on construit un site sur mesure. Il fournit un service qui renvoie un **client HTTP** (un [objet](/?c=langages&s=php&p=poo) qui envoie des requêtes), basé sur **Guzzle**, la bibliothèque PHP de référence pour cela (une **bibliothèque** est un ensemble de code réutilisable écrit par d'autres ; voir [sa documentation](https://docs.guzzlephp.org/en/stable/)). Un appel à une API partenaire s'écrit ainsi :

```php
<?php
// service d'un framework qui renvoie un client HTTP (ici, un client Guzzle)
// \Drupal::httpClient() : :: appelle la fonction httpClient rattachée à la classe \Drupal
$client = \Drupal::httpClient();
// $client->get(...) : -> appelle la méthode get de l'objet $client (une requête GET)
// [ 'clé' => valeur, ... ] est un tableau d'options : => associe une valeur à un nom
// DANGEREUX : 'verify' => FALSE coupe toute la vérification TLS pour cet appel
$reponse = $client->get('https://api.partenaire.example/clients', [
  'verify' => FALSE,
  'timeout' => 10,
]);
// lit le corps de la réponse ; (string) le convertit en texte
$texte = (string) $reponse->getBody();
```

La ligne `'verify' => FALSE` est celle qu'on trouve, copiée d'un forum ou d'un ancien projet, quand l'API partenaire présente un certificat qui fait échouer l'appel. Elle fait la même chose que `curl -k` : plus aucun contrôle de la chaîne ni du nom. Le chapitre sur les flux PHP présente la même idée avec `verify_peer`, dans [Faire des appels HTTP en natif](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verifier-le-certificat-du-serveur-distant).

Deux variantes aggravantes, fréquentes dans ce genre de projet :

| Variante | Pourquoi c'est pire |
|---|---|
| L'option posée dans la **configuration commune** des appels sortants du framework | Elle coupe la vérification pour tous les modules du site, y compris ceux de tiers, y compris pour des appels qui transportent des secrets |
| L'option posée **conditionnellement** (« seulement si l'environnement est le développement ») mais la condition lit une variable que la production définit aussi | La coupure arrive en production sans que personne ne l'ait voulu |

Ce que cet exemple doit faire à la place : voir [les bonnes solutions](#les-bonnes-solutions). Pour Guzzle, `'verify'` accepte `TRUE` (le défaut, vérification active), `FALSE` (coupée) ou **le chemin d'un fichier** de CA de confiance. D'après sa [documentation](https://docs.guzzlephp.org/en/stable/faq.html), Guzzle utilise cURL quand l'extension est disponible, mais n'en dépend pas. Avec son gestionnaire cURL, `'verify' => FALSE` met `CURLOPT_SSL_VERIFYPEER` à faux et `CURLOPT_SSL_VERIFYHOST` à 0, les deux options de la ligne « PHP, extension cURL » du tableau précédent ; avec son gestionnaire de flux PHP, ce sont d'autres options (`verify_peer` et `verify_peer_name`). Cet exemple ne s'exécute pas dans le laboratoire : il demande Drupal et Guzzle installés.

## Les bonnes solutions

La règle générale : **corriger la cause de l'erreur, pas la supprimer**. Chaque cas du tableau « Pourquoi on est tenté » a une réponse :

| Cause de l'erreur | Solution durable |
|---|---|
| Certificat auto-signé en développement | Donner **ce** certificat au client comme certificat de confiance (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`), exactement comme dans le laboratoire. Pour un poste de développeur, un outil comme [mkcert](https://github.com/FiloSottile/mkcert) crée une petite CA locale que le système accepte, évitant de multiplier les exceptions. Node.js embarque sa propre liste de CA et ne lit pas toujours celle du système : il faut lui donner la CA locale avec `NODE_EXTRA_CA_CERTS` (voir [la documentation de Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)) ; `requests` peut lire la liste du système ou la sienne selon l'installation |
| Certificat expiré | Le **renouveler**, et surtout **automatiser** le renouvellement : [Let's Encrypt](https://letsencrypt.org/docs/) délivre gratuitement des certificats de CA reconnue, renouvelables par un programme grâce au protocole **ACME** (un échange standardisé entre le serveur et la CA) |
| Nom qui ne correspond pas | Appeler le serveur **par le nom du certificat**, ou faire établir un certificat qui contient le nom réellement utilisé (le SAN) |
| Proxy d'entreprise qui réémet les certificats | Ajouter la **CA du proxy** (fournie par l'équipe informatique) au magasin de confiance de l'outil, au lieu de tout couper. Avec `NODE_EXTRA_CA_CERTS`, elle s'ajoute ; avec `--cacert` ou `verify=`, le fichier remplace la liste (voir [ajouter ou remplacer](#ajouter-ou-remplacer-ce-que-fait-chaque-option-de-confiance)) : il faut alors y recopier aussi les CA publiques |
| Magasin de confiance trop ancien | Mettre à jour le paquet des CA du système ou de l'image du conteneur |
| Appel vers un partenaire qui présente un certificat fixe connu | **Épingler** son empreinte, en plus de la vérification normale |

### Épingler : ce que ça apporte et ce que ça coûte

| | Apport | Coût |
|---|---|---|
| **Épinglage de la clé publique** (comme à l'étape 6) | Même une CA mal intentionnée ou compromise ne peut pas se faire passer pour le serveur | Si le serveur change de clé (renouvellement, incident), tous les clients épinglés **cessent de marcher** tant qu'on ne met pas à jour l'empreinte |
| **Épingler la clé et non le certificat entier** | Un renouvellement qui garde la même clé reste accepté | Il faut contrôler que le serveur garde sa clé |
| **Prévoir une empreinte de secours** | Une seconde clé, générée d'avance et gardée au chaud, évite la panne le jour du changement | Un secret de plus à conserver (voir [la gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

L'épinglage convient à un client que l'on maîtrise et à un serveur que l'on maîtrise (une application mobile qui parle à sa propre API, deux services d'une même équipe). Il convient mal à un site public tiers dont on ne contrôle ni les clés ni les renouvellements.

### Ne jamais livrer l'option coupée en production

Même quand une coupure est acceptable un temps sur un poste de développement, elle ne doit pas pouvoir atteindre la production :

| Règle | Comment l'appliquer |
|---|---|
| La vérification est **active par défaut** | Ne jamais écrire `verify=False` en dur dans le code : lire le réglage dans la configuration, dont la valeur par défaut est « vérifier » |
| Le développement n'a pas besoin de la coupure | Donner le certificat local de confiance (ci-dessus) plutôt qu'un interrupteur |
| Un réglage de coupure, s'il existe, **refuse de démarrer** en production | Le programme s'arrête avec un message clair si l'environnement est la production et que la vérification est coupée : c'est le principe d'[échouer de façon sûre](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise#echouer-de-facon-sure-fail-securely) |
| Les avertissements du langage ne sont **pas** réduits au silence | Ne pas filtrer l'avertissement (par exemple avec `urllib3.disable_warnings` en Python, la fonction de `urllib3` qui fait taire cet avertissement) : il est la dernière alarme |
| Le secret qui passe par cette connexion est traité comme exposé | Si la vérification a été coupée en production, renouveler le jeton qui a transité (voir [la rotation des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

### Détecter le défaut : revue et analyse statique

Ce défaut est facile à trouver, car il s'écrit avec des motifs reconnaissables. En **revue de code** (relecture par un autre développeur avant la fusion), on cherche ces motifs dans les modifications. Une **analyse statique** (*SAST*, qui lit le code sans l'exécuter, voir [SAST : analyser le code sans l'exécuter](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite#sast-analyser-le-code-sans-l-executer)) peut les chercher automatiquement à chaque modification, par exemple dans un [pipeline d'intégration continue](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd). Une règle de départ très simple est un `grep` (la recherche de texte du terminal), ici essayé sur un petit dossier d'exemple qui contient un fichier par motif, plus un fichier correct :

```bash
# -r : tous les fichiers du dossier ; -n : affiche le numéro de ligne ; -E : motifs étendus
# -i : sans tenir compte de la casse (FALSE ou false) ; chaque | sépare un motif cherché
# \ en fin de ligne : la commande continue ; le détail des symboles est dans le tableau
grep -rnE -i "verify[\"']?\s*(=>|=|:)\s*false|rejectUnauthorized\s*:\s*false|\
NODE_TLS_REJECT_UNAUTHORIZED|CURLOPT_SSL_VERIFY(PEER|HOST)|(^|\s)(-k|--insecure)(\s|$)|\
CERT_NONE|check_hostname\s*=\s*False|verify_peer" exemple
```

```
exemple/src/Appel.php:1:$client->get($url, ["verify" => FALSE]);
exemple/src/agent.js:1:const agent = { rejectUnauthorized: false };
exemple/src/sauvegarde.sh:1:curl -k https://interne.example/api
exemple/src/client.py:1:reponse = requests.get(url, verify=False)
exemple/src/appel.js:1:process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
exemple/src/legacy.php:1:curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
```

Les symboles de ces motifs sont des [expressions régulières](/?c=langages&s=python&p=regex-en-python) :

| Symbole | Sens | Exemple dans le motif |
|---|---|---|
| `\s*` | zéro espace ou plus (`\s` : un espace, une tabulation) | `verify\s*=` trouve `verify=` et `verify  =` |
| `["']?` | un guillemet double ou simple, ou rien (`?` : zéro ou une fois) | `"verify"` ou `verify` |
| `(=>\|=\|:)` | l'un des trois signes `=>`, `=` ou `:` (ici `\|` : « ou ») | `verify=false`, `'verify' => false` |
| `(PEER\|HOST)` | l'un des deux mots | `CURLOPT_SSL_VERIFYPEER` ou `...VERIFYHOST` |
| `(^\|\s)` et `(\s\|$)` | début de ligne ou espace, fin de ligne ou espace (`^` : début, `$` : fin) | `-k` seul, mais pas le `-k` collé dans `fichier-k8s` |

Les six motifs coupés sont trouvés ; le fichier correct (`verify=True`) ne l'est pas. Le motif `verify_peer` trouverait aussi une valeur à `true` (une fausse alerte à lire à la main). Et chaque résultat n'est qu'un **indice** : il faut lire la ligne pour savoir si elle vaut `false` en production. Une règle de pipeline qui bloque la fusion quand le motif apparaît, avec une exception documentée au cas par cas (par exemple un test qui vise un serveur local), est plus fiable qu'un rappel oral.

Enfin, trois indices d'exécution à ne pas ignorer : l'`InsecureRequestWarning` de Python, l'avertissement de Node.js sur `NODE_TLS_REJECT_UNAUTHORIZED`, et tout programme qui accepte un certificat qu'un navigateur, lui, refuserait.

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| « C'est seulement du développement » | L'option se copie, se valide en revue et se livre ; le code de développement devient le code de production | Donner le certificat local au client de confiance, sans interrupteur dans le code |
| Croire que `verify=False` coupe le chiffrement | La conversation reste chiffrée : le piège est de se croire protégé alors qu'on parle peut-être à un imposteur | Retenir que la coupure supprime la preuve d'identité, pas le chiffrement |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` dans un fichier de configuration ou un conteneur | Coupe la vérification de **tous** les appels du processus, bibliothèques tierces comprises | Utiliser `NODE_EXTRA_CA_CERTS` |
| Option posée dans la configuration commune d'un framework | Tous les modules et tous les appels sortants sont concernés, dont ceux qui portent des secrets | Aucune coupure globale ; au besoin une CA de confiance globale |
| Faire taire l'avertissement (`disable_warnings`) | L'avertissement est le seul signal qui reste | Corriger la cause, jamais l'alarme |
| Couper seulement le contrôle du nom (`verify_peer_name`, `check_hostname`) | Un certificat valide d'un **autre** site est accepté à la place du bon | Corriger le nom ou le certificat |
| Épingler le certificat entier sans plan de renouvellement | Le jour où le certificat change, tous les clients tombent | Épingler la clé, prévoir une empreinte de secours |
| Croire qu'un certificat auto-signé chiffre moins bien | Le chiffrement est le même ; seule la preuve d'identité manque | Donner ce certificat en confiance au client concerné |
| Appels de serveur à serveur sans humain pour voir une alerte | Aucun avertissement visible, personne ne renonce | Refuser en production toute configuration à vérification coupée |
| Ne pas renouveler le jeton qui a transité par une connexion non vérifiée | Un jeton déjà lu par un tiers reste valable | Le renouveler après avoir corrigé la connexion |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Laisser la vérification active partout, et corriger la cause de l'erreur | Une erreur de vérification est un diagnostic : elle dit exactement ce qui ne va pas (chaîne, nom, date) |
| Donner au client le certificat ou la CA de confiance (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`) | La confiance est précise et limitée à ce que l'on connaît |
| Automatiser le renouvellement des certificats avec Let's Encrypt ou l'outil de l'organisation | Un certificat expiré ne doit plus tenter personne |
| Ajouter la CA d'un proxy d'entreprise au magasin de confiance (sans perdre les CA publiques) plutôt que de tout couper | Le proxy est de confiance, pas le premier venu |
| Épingler la clé publique pour un client et un serveur que l'on maîtrise, avec une empreinte de secours | Même une CA compromise ne peut pas se faire passer pour le serveur |
| Lire le réglage de vérification dans la configuration, « vérifier » par défaut, et refuser de démarrer en production si elle est coupée | Une coupure ne peut pas arriver en production par accident |
| Chercher les motifs de coupure en revue de code et dans un pipeline (analyse statique, `grep`) | Le défaut s'écrit avec des motifs reconnaissables |
| Laisser les avertissements du langage visibles | C'est le dernier signal si la coupure passe quand même |
| Renouveler les secrets qui ont transité par une connexion non vérifiée | Un tiers a pu les lire |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | TLS apporte la confidentialité, l'intégrité **et** la preuve de l'identité du serveur ; seule la vérification du certificat (chaîne vers une CA de confiance, nom, dates) apporte la dernière. `curl -k`, `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, `verify => FALSE` ne coupent pas le chiffrement mais cette preuve : un tiers placé entre le client et le serveur (DNS corrompu, Wi-Fi, proxy) présente son propre certificat, et lit ou modifie tout, sans que le client voie rien. Le laboratoire l'a montré : un second serveur au certificat différent a lu un jeton envoyé par le client à vérification coupée, et a été refusé par le client qui connaissait le bon certificat. La bonne réponse corrige la cause : donner le certificat de confiance (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`), renouveler et automatiser (Let's Encrypt), corriger le nom, ajouter la CA du proxy, épingler une clé. |
| **Pièges à éviter** | « C'est seulement du développement » ; une variable d'environnement ou une configuration commune qui coupe tout le processus ou tout le site ; faire taire l'avertissement ; ne couper que le contrôle du nom ; épingler sans empreinte de secours ; ne pas renouveler un jeton qui a transité par une connexion non vérifiée. |
| **Bonnes pratiques** | Vérification active par défaut et lue dans la configuration ; certificat ou CA donnés au client plutôt que tout couper ; renouvellement automatique des certificats ; refus de démarrer en production si la vérification est coupée ; recherche des motifs de coupure en revue de code et par analyse statique ; avertissements du langage laissés visibles. |
