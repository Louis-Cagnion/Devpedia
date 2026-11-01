---
order: 14
---

# Redimensionner des images et servir du WebP (31/10/2026)

Dans beaucoup de pages web, les images sont la part la plus lourde. Une photo prise avec un appareil récent fait plusieurs millions de **pixels** (les petits carrés de couleur qui composent une image) et plusieurs centaines de milliers d'**octets** (un octet est un groupe de 8 **bits**, un bit étant une valeur qui vaut 0 ou 1 ; une lettre simple occupe un octet, voir [l'organisation en mémoire](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Un **serveur** (l'ordinateur qui conserve les fichiers d'un site et les envoie sur demande, voir [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) transmet ensuite ce fichier à un **navigateur** (le logiciel qui affiche les pages web). Si le serveur envoie le fichier tel quel pour l'afficher dans un cadre de 400 pixels de large sur un téléphone, on fait télécharger et traiter des dizaines de fois plus de données que nécessaire.

Ce chapitre montre comment **fabriquer plusieurs tailles** d'une même image, comment **choisir le format** le plus léger que le navigateur comprend, comment éviter qu'un visiteur malveillant abuse du système, et comment réserver la place de l'image pour que la page ne saute pas pendant le chargement. Les chiffres viennent d'un essai réel, fait avec le langage [Python](/?c=langages&s=python&p=python) et sa bibliothèque d'images **Pillow** ([documentation](https://pillow.readthedocs.io/)), lancé dans un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des commandes). Pour les balises `<img>` et l'attribut `alt`, voir [Liens et images](/?c=langages&s=html&p=liens-et-images) ; ce chapitre ne les répète pas. La réserve de place d'une image est un cas du chapitre [Chargement différé et espace réservé](/?c=qualite-performance-et-outils&s=performance&p=chargement-differe-et-espace-reserve), et les réponses servies se gardent dans un cache partagé, voir [Métadonnées de cache et invalidation](/?c=qualite-performance-et-outils&s=performance&p=metadonnees-de-cache-et-invalidation).

| Question | Section |
|---|---|
| Pourquoi une grande image ralentit-elle une page ? | [Pourquoi une image trop grande coûte cher](#pourquoi-une-image-trop-grande-coute-cher) |
| Comment produire plusieurs tailles ? | [Fabriquer des dérivés](#fabriquer-des-derives) |
| JPEG, PNG ou WebP ? | [Trois formats, trois usages](#trois-formats-trois-usages) |
| Comment le navigateur reçoit-il le bon fichier ? | [Servir le bon fichier](#servir-le-bon-fichier) |
| Fabriquer à l'avance ou à la demande ? | [À l'avance ou à la demande](#a-l-avance-ou-a-la-demande) |
| Comment la page évite-t-elle de sauter ? | [Réserver la place](#reserver-la-place) |

## Pourquoi une image trop grande coûte cher

Une image affichée passe par trois coûts, qui ne se règlent pas de la même façon.

| Coût | Ce qui se passe | Dépend de | Se règle avec |
|---|---|---|---|
| **Poids** | Le fichier est téléchargé sur le réseau | Octets du fichier | Une taille adaptée, un format compact |
| **Décodage** | Le navigateur transforme le fichier compressé en grille de pixels | Nombre de pixels | Moins de pixels |
| **Mémoire** | La grille de pixels reste en mémoire tant que l'image est affichée | Nombre de pixels, indépendamment du format | Moins de pixels |

Le troisième coût surprend : un fichier de 18 000 octets peut occuper beaucoup plus de mémoire une fois ouvert. Une fois décodée, chaque pixel prend en général 4 octets (un pour le rouge, un pour le vert, un pour le bleu, un pour la transparence), quel que soit le format d'origine. La mémoire se calcule donc par multiplication :

```text
mémoire (octets) = largeur × hauteur × 4

3000 × 2000 × 4 = 24 000 000 octets   (l'image d'essai en pleine taille)
 800 ×  533 × 4 =  1 705 600 octets   (une version de 800 pixels de large)
 400 ×  267 × 4 =    427 200 octets   (une version de 400 pixels de large)
```

Ce calcul n'est pas une mesure : c'est l'arithmétique du format décodé. Il explique pourquoi un format léger ne suffit pas : **une image de 3000 pixels de large reste lourde en mémoire même si son fichier est petit**. Il faut donc réduire le nombre de pixels, pas seulement le poids du fichier. Pour décider où investir, la règle générale s'applique : [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

> **Analogie :** envoyer une affiche d'un mètre de large pour remplir un cadre de timbre-poste. Le facteur porte l'affiche (poids), le destinataire doit la déplier (décodage), et elle occupe la table entière pendant qu'on regarde le timbre (mémoire).

## L'image d'essai

Pour mesurer sans dépendre d'une photo réelle, le script suivant fabrique une image de 3000 × 2000 pixels : un dégradé de couleurs, des disques, un léger flou (`GaussianBlur`, qui moyenne chaque pixel avec ses voisins) et du grain (`effect_noise`, un bruit aléatoire qui imite celui d'un capteur photo). Chaque pixel est codé en **RGB** : trois valeurs de 0 à 255, pour le rouge, le vert et le bleu. La « graine » du hasard ([`seed`](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) est fixée pour obtenir la même image à chaque exécution. Les fonctions de Pillow utilisées sont décrites dans sa [documentation des filtres](https://pillow.readthedocs.io/en/stable/reference/ImageFilter.html) et de son [module de dessin](https://pillow.readthedocs.io/en/stable/reference/ImageDraw.html). Pour rejouer les scripts de ce chapitre, enregistrez chacun sous le nom donné en première ligne, tous dans un même dossier, puis lancez-le depuis ce dossier avec `python3` suivi du nom du fichier (par exemple `python3 creer_image.py`) ; Pillow doit être installée (voir sa documentation). Le Python des blocs est expliqué par ailleurs : [variables](/?c=langages&s=python&p=variables) (dont les `tuple`, groupes de valeurs entre parenthèses), [boucles](/?c=langages&s=python&p=boucles) (`for ... in range(n)` répète n fois), [fonctions](/?c=langages&s=python&p=fonctions) (`print` affiche une valeur) et [modules](/?c=langages&s=python&p=modules-et-environnements) (`import` charge des outils).

```python
# creer_image.py : fabrique une image d'essai proche d'une photo
import random                                    # tirage de nombres au hasard

from PIL import Image, ImageDraw, ImageFilter    # outils de dessin de Pillow

LARGEUR, HAUTEUR = 3000, 2000                    # dimensions en pixels
random.seed(42)                                  # même hasard à chaque lancement

image = Image.new("RGB", (LARGEUR, HAUTEUR))     # image vide en rouge-vert-bleu
pinceau = ImageDraw.Draw(image)                  # objet qui dessine sur l'image
for y in range(HAUTEUR):                         # une ligne horizontale par rang
    t = y / HAUTEUR                              # position de 0 (haut) à 1 (bas)
    rouge, vert, bleu = int(60 + 80 * t), int(120 + 60 * t), int(220 - 140 * t)
    pinceau.line([(0, y), (LARGEUR, y)], fill=(rouge, vert, bleu))   # ligne colorée

for _ in range(150):                             # 150 disques de couleurs variées
    x, y = random.randrange(LARGEUR), random.randrange(HAUTEUR)      # centre au hasard
    r = random.randrange(20, 200)                # rayon au hasard
    couleur = tuple(random.randrange(40, 230) for _ in range(3))     # rouge, vert, bleu
    pinceau.ellipse([x - r, y - r, x + r, y + r], fill=couleur)      # disque dans ce carré

image = image.filter(ImageFilter.GaussianBlur(3))                    # flou, rayon 3 pixels
bruit = Image.effect_noise((LARGEUR, HAUTEUR), 18).convert("RGB")    # bruit, écart 18
image = Image.blend(image, bruit, 0.12)          # mélange : 88 % image, 12 % bruit
image.save("original.png")                       # enregistre sans perte
print(image.size, image.mode)                    # affiche les dimensions
```

Sortie obtenue :

```text
(3000, 2000) RGB
```

Un appareil photo livre un JPEG, pas un PNG de 7 188 291 octets. L'étape suivante enregistre donc cette image en JPEG de bonne qualité (92 sur une échelle de 100), pour simuler le fichier que l'on reçoit d'un appareil : **885 780 octets**. C'est la référence « avant » de tout le chapitre. Sur le contenu d'un tel fichier (métadonnées, format brut), voir [EXIF et RAW](/?c=donnees&s=representation-des-donnees&p=metadonnees-exif-et-format-raw).

## Fabriquer des dérivés

Un **dérivé** est une copie de l'image d'origine à une autre taille ou dans un autre format. L'**original** n'est jamais modifié : il reste la source dont on refait tous les dérivés si les règles changent. Le principe, utilisé par les systèmes de gestion de contenu (CMS, présentés en fin de chapitre) sous le nom de **styles d'image**, tient en un schéma :

```text
                         +--> chat-400.webp    (téléphone)
original (3000 px) ------+--> chat-800.webp    (tablette, ordinateur)
chat.jpg                 +--> chat-1200.webp   (écran large)
                         +--> chat-400.jpg ... (secours : navigateurs sans WebP)

1. une demande arrive pour "chat, 800 px, webp"
2. le dérivé existe sur le disque ? oui : on le renvoie, c'est tout
3. non : on le fabrique à partir de l'original, on l'écrit sur le disque, on le renvoie
```

Un **cache** est une réserve de résultats déjà calculés, gardés pour ne pas les recalculer. Le **cache sur disque** est l'étape 2 : le fichier fabriqué est conservé, donc le coût de fabrication n'est payé qu'une seule fois par dérivé. Trois règles accompagnent la fabrication :

| Règle | Pourquoi |
|---|---|
| Garder les **proportions** (largeur et hauteur réduites du même facteur) | Sinon l'image paraît étirée ou écrasée |
| Ne **jamais agrandir** au-delà de l'original | Agrandir ne crée aucun détail : le fichier grossit pour rien |
| Nommer le dérivé avec sa largeur et son format (`chat-800.webp`) | Une demande identique retombe toujours sur le même fichier |

Le script suivant fabrique quatre largeurs à partir de l'image d'essai et enregistre chacune en JPEG, en PNG, en WebP avec perte et en WebP sans perte (la différence est expliquée dans la section suivante), puis relève les poids. `Image.LANCZOS` désigne un filtre de réduction qui préserve les détails (voir les [filtres de rééchantillonnage](https://pillow.readthedocs.io/en/stable/handbook/concepts.html#filters) de Pillow).

```python
# deriver.py : fabrique des dérivés et relève leur poids
import os                                        # os.path.getsize donne le poids d'un fichier
import time                                      # time.perf_counter mesure une durée

from PIL import Image                            # ouverture et redimensionnement

original = Image.open("original.png").convert("RGB")      # image d'essai, sans transparence
original.save("source.jpg", "JPEG", quality=92)  # ce que livrerait un appareil photo
print("source.jpg", os.path.getsize("source.jpg"), "octets")     # poids de référence

for largeur in (3000, 1200, 800, 400):           # les quatre largeurs à fabriquer
    hauteur = round(original.height * largeur / original.width)  # proportions gardées
    debut = time.perf_counter()                  # départ du chronomètre
    if largeur == 3000:                          # pleine taille : rien à réduire
        copie = original                         # on garde l'image telle quelle
    else:                                        # sinon on réduit
        copie = original.resize((largeur, hauteur), Image.LANCZOS)   # réduction (Lanczos)
    duree_ms = (time.perf_counter() - debut) * 1000   # durée de la réduction en ms
    copie.save(f"d{largeur}.jpg", "JPEG", quality=80)          # JPEG avec perte
    copie.save(f"d{largeur}.webp", "WEBP", quality=80)         # WebP avec perte
    copie.save(f"d{largeur}.png", "PNG")                       # PNG sans perte
    copie.save(f"d{largeur}-sans-perte.webp", "WEBP", lossless=True)   # WebP sans perte
    print(
        largeur, hauteur,                        # dimensions du dérivé
        "jpg", os.path.getsize(f"d{largeur}.jpg"),             # poids JPEG
        "webp", os.path.getsize(f"d{largeur}.webp"),           # poids WebP avec perte
        "png", os.path.getsize(f"d{largeur}.png"),             # poids PNG
        "webp-sp", os.path.getsize(f"d{largeur}-sans-perte.webp"),   # poids WebP sans perte
        "redim_ms", round(duree_ms),             # durée de la réduction
    )
```

Sortie obtenue (poids en octets ; la durée `redim_ms`, en millisecondes, varie un peu d'un lancement à l'autre) :

```text
source.jpg 885780 octets
3000 2000 jpg 370822 webp 87574 png 7188291 webp-sp 4939106 redim_ms 0
1200 800 jpg 55538 webp 26410 png 988484 webp-sp 733690 redim_ms 52
800 533 jpg 33984 webp 18432 png 420204 webp-sp 308828 redim_ms 44
400 267 jpg 15373 webp 9576 png 111428 webp-sp 80728 redim_ms 37
```

| Largeur | Pixels | Mémoire décodée (calcul) | JPEG (qualité 80) | WebP (qualité 80) | Durée de réduction |
|---|---|---|---|---|---|
| 3000 | 6 000 000 | 24 000 000 | 370 822 | 87 574 | aucune |
| 1200 | 960 000 | 3 840 000 | 55 538 | 26 410 | quelques dizaines de ms |
| 800 | 426 400 | 1 705 600 | 33 984 | 18 432 | quelques dizaines de ms |
| 400 | 106 800 | 427 200 | 15 373 | 9 576 | quelques dizaines de ms |

Pour un cadre de 400 pixels de large, la source de 885 780 octets pèse environ 92 fois le WebP de 400 pixels (9 576 octets), et la mémoire décodée passe d'environ 24 millions d'octets à environ 0,4 million. Sur une connexion de 1 mégabit par seconde (un mégabit = un million de bits, un octet = 8 bits), le calcul donne 7,1 secondes pour la source et 0,08 seconde pour le WebP de 400 pixels : c'est un calcul de transfert théorique, sans **latence** (le délai d'attente avant l'arrivée des premières données) ni établissement de la connexion (voir [limiter les allers-retours](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) pour ce coût fixe). Cet essai sur une machine ne mesure pas un téléphone réel : les ordres de grandeur comptent, pas les décimales.

## Trois formats, trois usages

Un **format d'image** est une convention pour écrire les pixels dans un fichier. Les trois comparés ici sont [**JPEG**](https://developer.mozilla.org/fr/docs/Web/Media/Formats/Image_types) (*Joint Photographic Experts Group*, le format des photographies), [**PNG**](https://developer.mozilla.org/fr/docs/Web/Media/Formats/Image_types) (*Portable Network Graphics*, celui des logos et captures) et [**WebP**](https://developers.google.com/speed/webp) (un format plus récent créé pour le web). Deux familles de compression existent. La compression **avec perte** supprime des détails que l'œil remarque peu, ce qui réduit fortement le poids mais ne permet plus de retrouver l'image exacte. La compression **sans perte** garde chaque pixel identique, au prix d'un fichier plus gros. La **transparence** (un fond que l'on voit à travers l'image) se code dans une quatrième valeur par pixel, appelée canal **alpha**.

| | JPEG | PNG | WebP |
|---|---|---|---|
| Compression | Avec perte | Sans perte | Les deux, au choix à l'enregistrement |
| Transparence (canal alpha) | Non | Oui | Oui |
| Cas typique | Photographies | Logos, captures d'écran, schémas | Photographies et logos |
| Prise en charge par les navigateurs | Universelle | Universelle | Large aujourd'hui (voir la prudence ci-dessous) |

Les poids relevés sur l'image d'essai redimensionnée à 800 pixels (celle qui ressemble à une photo) :

| Format et mode | Octets | Rapport à JPEG qualité 80 |
|---|---|---|
| JPEG, qualité 80 | 33 984 | 1,00 |
| WebP avec perte, qualité 80 | 18 432 | 0,54 |
| WebP sans perte | 308 828 | 9,09 |
| PNG (sans perte) | 420 204 | 12,36 |

Deux enseignements. D'abord, **une photo ne se met pas en PNG** : douze fois plus lourd que le JPEG, sans bénéfice visible. Ensuite, le WebP sans perte est plus léger que le PNG (plus d'un quart de moins ici), mais il reste très loin d'une compression avec perte pour une photo. L'essai suivant vérifie la **transparence** avec un logo : un disque rouge sur fond transparent. Le bloc `try` / `except OSError` y attrape l'erreur que Pillow lève quand l'enregistrement échoue (voir [la gestion des erreurs en Python](/?c=langages&s=python&p=gestion-des-erreurs)).

```python
# transparence.py : un logo à fond transparent en PNG, WebP et JPEG
import os                                        # poids des fichiers

from PIL import Image, ImageDraw                 # création et dessin d'images

logo = Image.new("RGBA", (400, 400), (0, 0, 0, 0))   # RGBA : rouge, vert, bleu, alpha
dessin = ImageDraw.Draw(logo)                    # objet qui dessine sur le logo
dessin.ellipse([40, 40, 360, 360], fill=(220, 40, 40, 255))          # disque rouge opaque
dessin.rectangle([150, 150, 250, 250], fill=(255, 255, 255, 255))    # carré blanc au centre
logo.save("logo.png")                            # PNG sans perte
logo.save("logo.webp", "WEBP", lossless=True)    # WebP sans perte
logo.save("logo-avec-perte.webp", "WEBP", quality=80)    # WebP avec perte
try:                                             # JPEG ne sait pas coder l'alpha
    logo.save("logo.jpg", "JPEG")                # doit échouer
except OSError as erreur:                        # Pillow signale l'erreur
    print("JPEG refuse :", erreur)               # message affiché
for nom in ("logo.png", "logo.webp", "logo-avec-perte.webp"):    # relecture des trois
    image = Image.open(nom)                      # ouvre le fichier écrit
    print(nom, os.path.getsize(nom), image.mode, image.getpixel((5, 5)))   # coin du fond
```

Sortie obtenue :

```text
JPEG refuse : cannot write mode RGBA as JPEG
logo.png 2635 RGBA (0, 0, 0, 0)
logo.webp 720 RGBA (0, 0, 0, 0)
logo-avec-perte.webp 2944 RGBA (0, 0, 0, 0)
```

Le pixel du coin (0, 0, 0, 0) a un alpha de 0 : il est resté transparent dans les trois fichiers qui supportent l'alpha. Le JPEG ne peut pas porter ce logo : l'enregistrement échoue. Pour ce dessin plat, le WebP sans perte (720 octets) est environ 3,7 fois plus léger que le PNG (2 635 octets) ; le mode avec perte (2 944 octets) ne l'aide pas ici, car une forme aux bords nets n'a pas de détail « inutile » à supprimer.

### Peut-on comparer « qualité 80 » de JPEG et de WebP ?

Non. Le nombre de **qualité** est une échelle propre à chaque encodeur (le programme qui écrit le fichier) : « 80 » n'a pas le même sens pour JPEG et pour WebP. Pour comparer honnêtement, il faut mesurer la **fidélité** à l'original. Le **PSNR** ([*peak signal-to-noise ratio*](https://scikit-image.org/docs/stable/api/skimage.metrics.html#skimage.metrics.peak_signal_noise_ratio), rapport signal sur bruit de crête) la mesure en **décibels** (dB) : plus il est haut, plus l'image ressemble à l'original. Le décibel est une échelle [logarithmique](/?c=fondamentaux&s=mathematiques&p=le-logarithme) : 10 dB de plus signifient une erreur moyenne dix fois plus petite (`math.log10` calcule ce logarithme en base 10). Le PSNR ne remplace pas le regard humain (deux images de même PSNR peuvent paraître différentes), mais il donne un repère chiffré.

```python
# fidelite.py : compare la fidélité de JPEG et de WebP à l'original (800 px)
import io                                        # fichier en mémoire
import math                                      # logarithme pour les décibels

from PIL import Image, ImageChops, ImageStat     # comparaison de pixels

original = Image.open("original.png").convert("RGB").resize((800, 533), Image.LANCZOS)


def psnr(a, b):
    """Renvoie le PSNR en décibels entre deux images de même taille."""
    ecart = ImageChops.difference(a, b)          # écart pixel par pixel (valeur absolue)
    somme = sum(ImageStat.Stat(ecart).sum2)      # somme des carrés des écarts (3 couleurs)
    erreur = somme / (3 * a.width * a.height)    # moyenne : carré d'écart moyen par valeur
    return 10 * math.log10(255 * 255 / erreur)   # formule du PSNR, 255 = valeur maximale


for format_, qualite in (("JPEG", 80), ("WEBP", 80), ("WEBP", 90), ("WEBP", 95)):
    tampon = io.BytesIO()                        # fichier fictif en mémoire
    original.save(tampon, format_, quality=qualite)          # encode dans ce tampon
    relue = Image.open(io.BytesIO(tampon.getvalue())).convert("RGB")   # relit le résultat
    poids = len(tampon.getvalue())               # taille du fichier encodé
    print(format_, qualite, poids, "octets", round(psnr(original, relue), 2), "dB")
```

Sortie obtenue :

```text
JPEG 80 33984 octets 35.82 dB
WEBP 80 18432 octets 37.76 dB
WEBP 90 27104 octets 39.53 dB
WEBP 95 39298 octets 40.27 dB
```

Sur cette image, le WebP de qualité 80 est à la fois **plus léger** (18 432 contre 33 984 octets) et **plus fidèle** (37,76 contre 35,82 dB) que le JPEG de qualité 80. Il ne faut pas en tirer une loi : l'image est synthétique (dégradé, disques, grain régulier), et le résultat varie avec le contenu et le réglage de l'encodeur. La règle durable : **choisir le format et la qualité en mesurant sur ses propres images**, et comparer à fidélité égale, jamais au même nombre de qualité.

### Et la prise en charge ?

Les navigateurs courants lisent le WebP aujourd'hui, mais ce chapitre n'a pas pu le vérifier ici (aucun navigateur n'a été lancé pour l'essai). Pour une valeur à jour, consultez la [documentation sur les formats d'images](https://developer.mozilla.org/fr/docs/Web/Media/Formats/Image_types) de MDN. D'autres formats plus récents existent ([AVIF](https://developer.mozilla.org/fr/docs/Web/Media/Formats/Image_types) par exemple) et se servent par le même mécanisme que celui présenté ci-dessous : l'essai de ce chapitre se limite à ceux que l'outil local sait produire.

## Servir le bon fichier

Une fois les dérivés fabriqués, il reste à envoyer à chaque navigateur le bon : la bonne taille, et le format qu'il comprend. Deux mécanismes existent, qui peuvent se combiner : l'un se règle dans la page [HTML](/?c=langages&s=html&p=html) (le langage qui décrit le contenu d'une page), l'autre dans le serveur, qui lit l'en-tête `Accept` (une ligne de la demande, expliquée plus bas).

| | Choix par la page HTML (`<picture>`) | Choix par le serveur (en-tête `Accept`) |
|---|---|---|
| Qui décide | Le navigateur, parmi les adresses listées | Le serveur, à partir de la demande reçue |
| Adresses | Une par fichier (`chat-800.webp`, `chat-800.jpg`) | Une seule (`/images/chat.jpg?w=800`) |
| Cache partagé | Simple : une adresse, un contenu | Délicat : même adresse, contenus différents |
| Cas typique | Pages dont on contrôle le HTML | Anciennes pages, contenus tiers, HTML impossible à modifier |

### Par la page : `<picture>`, `srcset` et `sizes`

[`<picture>`](https://developer.mozilla.org/fr/docs/Web/HTML/Element/picture) regroupe plusieurs sources ; le navigateur retient la première dont il comprend le type. `srcset` (déjà présenté dans [Liens et images](/?c=langages&s=html&p=liens-et-images)) liste les fichiers disponibles avec leur largeur en pixels (`400w` veut dire « 400 pixels de large »). `sizes` dit au navigateur **quelle largeur l'image occupera dans la page**, avant même que le [CSS](/?c=langages&s=css&p=css) (le langage qui décrit l'apparence d'une page) soit appliqué ; `vw` est une unité qui vaut 1 % de la largeur de la fenêtre.

```html
<!-- conteneur : plusieurs sources possibles pour une seule image -->
<picture>
  <!-- première source : WebP, que le navigateur ignore s'il ne le lit pas -->
  <source
    type="image/webp"
    srcset="chat-400.webp 400w, chat-800.webp 800w, chat-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
  >
  <!-- image de secours : JPEG, aussi utilisée pour afficher dans tous les cas -->
  <img
    src="chat-800.jpg"
    srcset="chat-400.jpg 400w, chat-800.jpg 800w, chat-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
    width="800"
    height="533"
    alt="Un chat noir assis sur un canapé"
    loading="lazy"
  >
</picture>
```

| Élément | Rôle |
|---|---|
| `type="image/webp"` | Le **type MIME** (un nom standard de format de fichier) de la source : le navigateur saute la source s'il ne le connaît pas |
| `srcset="... 400w"` | Les fichiers disponibles et leur largeur réelle en pixels |
| `sizes="(max-width: 600px) 100vw, 600px"` | Si la fenêtre fait 600 pixels ou moins, l'image remplit toute la largeur ; sinon elle occupe 600 pixels |
| `<img src=...>` | Le repli : obligatoire, c'est lui qui s'affiche et qui porte `alt`, `width`, `height` |
| [`loading="lazy"`](https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#loading) | Le navigateur retarde le chargement jusqu'à ce que l'image approche de l'écran |

Exemple de raisonnement du navigateur : sur un téléphone dont la fenêtre fait 390 pixels de large et dont l'écran possède 3 pixels physiques par **pixel CSS** (l'unité de longueur de la page, indépendante de la finesse de l'écran ; ce rapport est la **densité de pixels**), `100vw` vaut 390 pixels CSS, soit 1 170 pixels physiques à remplir. Le plus petit fichier suffisant dans la liste est `chat-1200`. Le navigateur reste libre de son choix (il peut aussi tenir compte de la qualité du réseau) : `srcset` et `sizes` sont des **indications**, pas des ordres. Le comportement exact dans un navigateur réel n'a pas été observé pour ce chapitre.

> **Piège :** `loading="lazy"` sur l'image la plus haute de la page (celle que l'on voit sans défiler) la retarde au lieu de l'accélérer. Réservez-le aux images situées plus bas.

### Par le serveur : l'en-tête `Accept`

Une requête [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) comporte des **en-têtes**, de petites lignes « nom : valeur » qui décrivent la demande. L'en-tête [`Accept`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Accept) liste les types de contenu que le client sait lire. Un navigateur qui sait lire le WebP l'annonce en y mettant `image/webp` ; c'est un comportement très répandu mais non observé ici : vérifiez-le dans l'onglet « Réseau » des outils de développement du navigateur (le panneau intégré, souvent ouvert par la touche F12, qui liste chaque requête). Le serveur répond avec le format qui convient. Le test ci-dessous utilise le code de la section suivante : pour le rejouer, créez d'abord `styles.py` et le dossier `originaux/`, préparés dans [la section sur la génération à la demande](#le-piege-de-la-generation-a-la-demande-exposee), puis lancez `python3 serveur.py` depuis le même dossier. Le serveur est le module [`http.server`](https://docs.python.org/fr/3/library/http.server.html) de Python ; `127.0.0.1` est l'adresse de la machine elle-même et `58431` un **port**, le numéro qui distingue ce serveur des autres sur la machine (voir [serveur local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)). `GET` est la méthode HTTP qui demande un fichier. Le bloc `try` / `except urllib.error.HTTPError` attrape la réponse d'erreur du serveur (voir [la gestion des erreurs en Python](/?c=langages&s=python&p=gestion-des-erreurs)) ; `threading` fait tourner le serveur en arrière-plan pendant que le client l'interroge.

```python
# serveur.py : sert /images/<nom>?w=<largeur> et choisit le format selon Accept
import threading                                 # lance le serveur en arrière-plan
import urllib.error                              # erreurs HTTP côté client
import urllib.request                            # client HTTP de la bibliothèque standard
from http.server import BaseHTTPRequestHandler, HTTPServer   # serveur HTTP minimal
from urllib.parse import parse_qs, urlparse      # découpe d'une adresse

import styles                                    # le module de la section suivante

TYPES = {"webp": "image/webp", "jpeg": "image/jpeg"}     # extension -> type MIME


class Gestionnaire(BaseHTTPRequestHandler):
    """Répond à chaque requête GET reçue."""

    def do_GET(self):
        url = urlparse(self.path)                # sépare le chemin et les paramètres
        nom = url.path.removeprefix("/images/")  # nom du fichier demandé
        try:                                     # w peut ne pas être un nombre
            largeur = int(parse_qs(url.query).get("w", ["0"])[0])    # paramètre w, 0 sinon
        except ValueError:                       # ex. ?w=abc
            largeur = 0                          # hors liste : refusé comme les autres
        chemin = styles.servir(nom, largeur, self.headers.get("Accept", ""))
        if chemin is None:                       # demande refusée par styles.py
            self.send_error(400, "taille ou fichier refusé")     # code 400 : demande invalide
            return                               # rien d'autre à envoyer
        corps = chemin.read_bytes()              # contenu du dérivé
        self.send_response(200)                  # code 200 : succès
        type_mime = TYPES[chemin.suffix[1:]]     # type MIME déduit de l'extension du dérivé
        self.send_header("Content-Type", type_mime)              # format réellement envoyé
        self.send_header("Content-Length", str(len(corps)))          # taille en octets
        self.send_header("Vary", "Accept")       # la réponse dépend de l'en-tête Accept
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()                       # fin des en-têtes
        self.wfile.write(corps)                  # envoi du fichier

    def log_message(self, *arguments):
        pass                                     # pas de journal dans l'essai


serveur = HTTPServer(("127.0.0.1", 58431), Gestionnaire)     # écoute en local seulement
threading.Thread(target=serveur.serve_forever, daemon=True).start()   # démarre en parallèle

ESSAIS = (                                       # (en-tête Accept, valeur du paramètre w)
    ("image/webp,*/*", 800),
    ("image/png,*/*", 800),
    ("*/*", 777),
    ("*/*", "abc"),
)
for accept, largeur in ESSAIS:
    demande = urllib.request.Request(
        f"http://127.0.0.1:58431/images/chat.jpg?w={largeur}", headers={"Accept": accept}
    )                                            # simule un navigateur qui annonce Accept
    try:                                         # une réponse d'erreur lève une exception
        with urllib.request.urlopen(demande) as reponse:     # envoie la requête
            corps = reponse.read()               # lit la réponse
            print(reponse.status, reponse.headers["Content-Type"], len(corps),
                  reponse.headers["Vary"], reponse.headers["Cache-Control"])
    except urllib.error.HTTPError as erreur:     # code d'erreur reçu
        print(erreur.code, erreur.reason)        # affiche le code et la raison
serveur.shutdown()                               # arrête le serveur d'essai
```

Sortie obtenue :

```text
200 image/webp 18376 Accept public, max-age=31536000, immutable
200 image/jpeg 33981 Accept public, max-age=31536000, immutable
400 taille ou fichier refusé
400 taille ou fichier refusé
```

Le même chemin (`/images/chat.jpg?w=800`) a reçu un WebP de 18 376 octets quand `image/webp` figurait dans `Accept`, et un JPEG de 33 981 octets sinon. Les poids diffèrent légèrement du tableau précédent car ce serveur part du fichier `source.jpg` (déjà compressé) et non du PNG d'origine. La largeur 777, absente de la liste, a reçu un refus, de même que la valeur `abc`, qui n'est pas un nombre.

| En-tête de réponse | Rôle | Si on l'oublie |
|---|---|---|
| [`Content-Type`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Content-Type) | Dit au navigateur quel format il reçoit | Il peut deviner mal ou refuser d'afficher |
| [`Vary: Accept`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Vary) | Dit aux caches : « ma réponse change selon l'en-tête `Accept` » | Un cache partagé peut renvoyer un WebP à un navigateur qui ne le lit pas |
| [`Cache-Control`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Cache-Control) | Durée pendant laquelle le navigateur garde le fichier sans le redemander | Chaque visite retélécharge l'image |
| [`Content-Length`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Content-Length) | Taille du corps de la réponse, en octets | Le navigateur ne sait pas où la réponse s'arrête |

Dans `public, max-age=31536000, immutable`, `public` autorise les caches partagés (comme un CDN) à garder une copie, `max-age=31536000` fixe la durée en secondes (31 536 000 s, soit un an), et `immutable` dit que le fichier ne changera pas : le navigateur ne le revérifie pas avant la fin de cette durée.

> **Piège :** `Cache-Control: ... immutable` sur une adresse qui ne change pas quand l'original change. Si on remplace `chat.jpg`, les visiteurs gardent l'ancienne version pendant un an. Mettez une version ou une empreinte (un code calculé à partir du contenu du fichier) dans l'adresse (`chat.jpg?v=3`, ou `chat.3f9a1c.jpg`) à chaque changement de l'original.

> **Piège :** un [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) (réseau de copies du contenu proches des visiteurs) ne respecte pas toujours `Vary`. Vérifiez le réglage de celui que vous utilisez, ou préférez le choix par `<picture>`, où chaque adresse a un seul contenu.

## À l'avance ou à la demande

| | À l'avance (à l'envoi de l'original) | À la demande (à la première requête) |
|---|---|---|
| Quand les dérivés existent | Dès l'enregistrement de l'original | Après la première requête de chaque taille |
| Première visite | Rapide : le fichier est déjà là | Plus lente : il faut le fabriquer (de l'ordre de 140 ms pour 1200 px WebP ici) |
| Disque | Tous les dérivés prévus, même jamais demandés | Seulement ceux qui sont demandés |
| Changer de taille ou de format | Refaire tous les dérivés de toutes les images | Vider le cache : les dérivés se refabriquent seuls |
| Risque | Aucun lié aux visiteurs | Un visiteur peut déclencher des fabrications à volonté |

Sur la machine d'essai, le premier appel pour une taille a pris **de l'ordre de 140 ms** (ouverture de l'original, réduction, écriture) et le suivant **moins d'une milliseconde**, car le dérivé était déjà sur le disque. Le gain du cache est donc très grand, et la fabrication ne se paie qu'une fois. Mais la dernière ligne du tableau est le piège central de ce chapitre.

### Le piège de la génération à la demande exposée

Si l'adresse accepte n'importe quelle largeur (`/images/chat.jpg?w=1000`, `?w=1001`, `?w=1002`, ...), n'importe qui peut demander une largeur différente à chaque requête. Chaque demande fabrique un nouveau fichier, le stocke, et ne profitera jamais du cache. C'est un **déni de service** : une attaque qui ne vole rien mais épuise le serveur (processeur, mémoire, disque) jusqu'à ce que les visiteurs légitimes ne soient plus servis. Le chapitre [surcharge et déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) couvre cette famille ; la limitation du nombre de requêtes par client est expliquée dans [sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web), mais elle ne suffit pas ici : chaque requête, prise seule, a l'air normale.

La parade est une **liste de tailles autorisées** : toute demande hors liste est refusée avant le moindre calcul. Voici le module complet utilisé par le serveur précédent, et son essai.

```python
# styles.py : dérivés à la demande, liste de tailles autorisées, cache sur disque
import os                                        # os.replace : renomme en un bloc
from pathlib import Path                         # manipulation de chemins de fichiers

from PIL import Image                            # lecture et réduction d'image

DOSSIER_ORIGINAUX = Path("originaux")            # où vivent les originaux
DOSSIER_CACHE = Path("cache")                    # où vivent les dérivés fabriqués
LARGEURS_AUTORISEES = (400, 800, 1200)           # seules tailles que l'on fabrique


def choisir_format(accept):
    """Choisit webp si le navigateur l'annonce dans Accept, sinon jpeg."""
    return "webp" if "image/webp" in accept else "jpeg"      # test sur le texte de l'en-tête


def servir(nom, largeur, accept, liste_stricte=True):
    """Renvoie le chemin du dérivé (fabriqué si absent), ou None si la demande est refusée."""
    if liste_stricte and largeur not in LARGEURS_AUTORISEES:     # taille hors liste ?
        return None                              # refus avant tout calcul
    original = (DOSSIER_ORIGINAUX / nom).resolve()   # chemin réel, ".." résolus
    if DOSSIER_ORIGINAUX.resolve() not in original.parents or not original.is_file():
        return None                              # hors du dossier, ou fichier absent
    format_ = choisir_format(accept)             # webp ou jpeg selon le navigateur
    cible = DOSSIER_CACHE / f"{original.stem}-{largeur}.{format_}"   # nom (largeur demandée)
    if not cible.exists():                       # absent du cache : on le fabrique
        DOSSIER_CACHE.mkdir(exist_ok=True)       # crée le dossier de cache au besoin
        image = Image.open(original).convert("RGB")      # ouvre l'original
        largeur = min(largeur, image.width)      # jamais plus large que l'original
        hauteur = round(image.height * largeur / image.width)    # proportions gardées
        temporaire = cible.with_suffix(f".{os.getpid()}.tmp")    # nom unique (processus)
        reduite = image.resize((largeur, hauteur), Image.LANCZOS)    # réduction
        reduite.save(temporaire, format_.upper(), quality=80)    # écrit le fichier provisoire
        os.replace(temporaire, cible)            # renomme en un bloc : jamais de demi-fichier
    return cible                                 # chemin du dérivé prêt à l'emploi
```

Avant de lancer quoi que ce soit, il faut préparer les originaux. Dans cet exemple, ils sont dans un dossier `originaux/`, qui contient `chat.jpg`, une copie de `source.jpg` (fabriquée par `deriver.py`). Les deux commandes suivantes, tapées dans le terminal depuis le dossier où se trouvent `styles.py` et `source.jpg`, créent ce dossier (`mkdir`, *make directory*) puis y copient l'image sous le nom `chat.jpg` (`cp`, *copy*).

```bash
# crée le dossier originaux/ à côté de styles.py
mkdir originaux
# copie source.jpg dans ce dossier, sous le nom chat.jpg
cp source.jpg originaux/chat.jpg
```

Le paramètre `liste_stricte=False` n'existe que pour **mesurer l'attaque** ; une vraie application n'offre jamais cette option. Le module respecte aussi la règle « ne jamais agrandir » : `min(largeur, image.width)` plafonne la largeur à celle de l'original (le fichier garde alors dans son nom la largeur demandée). Voici l'essai.

```python
# essai_styles.py : cache, négociation, refus, puis 200 largeurs inventées
import shutil                                    # shutil.rmtree vide le dossier de cache
import time                                      # chronomètre
from pathlib import Path                         # liste des fichiers du cache

import styles                                    # le module ci-dessus

shutil.rmtree("cache", ignore_errors=True)       # part d'un cache vide
print(styles.servir("chat.jpg", 800, "image/webp,image/*"))      # webp annoncé
print(styles.servir("chat.jpg", 800, "image/png,*/*"))           # webp absent d'Accept
print(styles.servir("chat.jpg", 777, "image/webp"))              # taille hors liste
print(styles.servir("../styles.py", 800, "image/webp"))          # sortie du dossier

debut = time.perf_counter()                      # départ du chronomètre
styles.servir("chat.jpg", 1200, "image/webp")    # premier appel : fabrication
froid = (time.perf_counter() - debut) * 1000     # durée en millisecondes
debut = time.perf_counter()                      # nouveau départ
styles.servir("chat.jpg", 1200, "image/webp")    # second appel : déjà au cache
chaud = (time.perf_counter() - debut) * 1000     # durée en millisecondes
print(f"froid {froid:.1f} ms, chaud {chaud:.3f} ms")

shutil.rmtree("cache", ignore_errors=True)       # cache vide avant l'attaque simulée
debut = time.perf_counter()                      # départ du chronomètre
for largeur in range(1000, 1200):                # 200 largeurs distinctes
    styles.servir("chat.jpg", largeur, "image/webp")             # avec la liste
print("avec liste :", len(list(Path("cache").glob("*"))), "fichiers",
      round(time.perf_counter() - debut, 3), "s")

shutil.rmtree("cache", ignore_errors=True)       # cache vide à nouveau
debut = time.perf_counter()                      # départ du chronomètre
for largeur in range(1000, 1200):                # les mêmes 200 largeurs
    styles.servir("chat.jpg", largeur, "image/webp", liste_stricte=False)    # sans liste
fichiers = list(Path("cache").glob("*"))         # fichiers fabriqués
octets = sum(f.stat().st_size for f in fichiers) # poids total sur le disque
print("sans liste :", len(fichiers), "fichiers", octets, "octets",
      round(time.perf_counter() - debut, 3), "s")
```

Sortie obtenue (les durées varient d'un lancement à l'autre) :

```text
cache/chat-800.webp
cache/chat-800.jpeg
None
None
froid 136.1 ms, chaud 0.133 ms
avec liste : 0 fichiers 0.0 s
sans liste : 200 fichiers 4893402 octets 25.663 s
```

| Demande | Résultat | Pourquoi |
|---|---|---|
| 800 px avec `image/webp` dans `Accept` | `chat-800.webp` | Format annoncé par le client |
| 800 px sans `image/webp` | `chat-800.jpeg` | Secours pour les clients qui ne lisent pas le WebP |
| 777 px | `None` (refus) | Largeur absente de `LARGEURS_AUTORISEES` |
| `../styles.py` | `None` (refus) | Le chemin sort du dossier des originaux |
| 200 largeurs inventées, avec liste | 0 fichier, 0 s | Chaque demande est refusée avant tout calcul |
| 200 largeurs inventées, sans liste | 200 fichiers, 4 893 402 octets, environ 26 s | Chaque demande déclenche une fabrication complète |

200 demandes ont coûté environ 26 secondes de calcul et près de 5 mégaoctets sur le disque : environ 130 ms et 24 000 octets chacune. Par simple proportion (calcul, pas mesure), 10 000 demandes de ce genre coûteraient environ 21 minutes de calcul sur un seul cœur de processeur (une unité de calcul indépendante) et environ 245 mégaoctets de disque, pour une seule image. Avec plusieurs milliers d'originaux, le disque et le processeur saturent. La liste de tailles ramène ce coût à zéro, et borne aussi le nombre de fichiers du cache : (nombre d'originaux) × (nombre de tailles) × (nombre de formats).

| Défense | Ce qu'elle empêche | Limite |
|---|---|---|
| **Liste de tailles autorisées** | Les largeurs inventées | Il faut prévoir les tailles utiles à l'avance |
| Jeton signé dans l'adresse (un code calculé avec un secret du serveur) | Toute adresse non produite par le serveur lui-même | Demande de la gestion de secret ([gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Limiter le nombre de requêtes par client | Un client unique qui inonde | Inutile contre des milliers de clients, ou une requête unique très coûteuse |
| Plafonner la taille de l'original (en pixels) | Une image piégée qui explose en mémoire une fois décodée | À fixer aussi à l'envoi (voir [upload de fichiers](/?c=securite&s=cybersecurite&p=upload-de-fichiers)) |
| Pré-générer à l'envoi de l'original | Tout abus à la demande | Disque occupé par des dérivés jamais servis |

Le fichier temporaire suivi d'un `os.replace` règle un autre piège, plus discret : deux requêtes simultanées pour le même dérivé inexistant. Sans cette précaution, la seconde pourrait lire un fichier à moitié écrit. Avec un nom provisoire unique par processus (un serveur à plusieurs fils d'exécution, voir [parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme), devrait aussi y mettre l'identifiant du fil, ou utiliser le module `tempfile`) et un renommage **atomique** (qui s'effectue en un seul bloc indivisible, sans état intermédiaire visible), chaque lecteur voit soit rien, soit le fichier complet. Le nom d'original (`nom`) reçu de l'extérieur est contrôlé contre la **traversée de chemin** (une demande comme `../styles.py` qui sort du dossier prévu), détaillée dans [upload de fichiers](/?c=securite&s=cybersecurite&p=upload-de-fichiers). Dans `styles.py`, `.resolve()` transforme le chemin demandé en chemin complet en effaçant les `..` (voir [arborescence et chemins](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), et `.parents` liste les dossiers qui contiennent ce chemin : si le dossier des originaux n'en fait pas partie, la demande sort du dossier prévu et est refusée (voir aussi [`pathlib`](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

## Réserver la place

Tant que l'image n'est pas arrivée, le navigateur ne connaît pas sa taille. S'il n'a aucune indication, il affiche la page avec un espace vide, puis, à l'arrivée de l'image, pousse le texte situé en dessous : c'est le **décalage de mise en page** ([*layout shift*](https://web.dev/articles/cls)), très désagréable (on clique sur un bouton qui s'est déplacé). La solution est de déclarer les dimensions à l'avance.

```html
<!-- largeur et hauteur en pixels : le navigateur calcule le rapport 800/533 -->
<img src="chat-800.jpg" width="800" height="533" alt="Un chat noir">
```

La règle de mise en forme ci-dessous est écrite en CSS.

```css
/* règle appliquée à toutes les images */
img {
  max-width: 100%;   /* l'image ne dépasse jamais son conteneur */
  height: auto;      /* la hauteur suit la largeur en gardant le rapport déclaré */
}
```

| Élément | Rôle |
|---|---|
| `width="800" height="533"` | Fait connaître le **rapport largeur/hauteur** (800 / 533, environ 1,5) avant l'arrivée du fichier |
| `max-width: 100%` | Réduit l'image quand le conteneur est plus étroit que 800 pixels |
| `height: auto` | Recalcule la hauteur avec le rapport, pour ne pas écraser l'image |
| [`aspect-ratio: 3 / 2`](https://developer.mozilla.org/fr/docs/Web/CSS/aspect-ratio) (CSS) | Autre façon de réserver la place quand le HTML n'est pas modifiable |

Les attributs `width` et `height` ne décrivent pas la taille d'affichage finale (le CSS la décide) : ils donnent seulement le rapport. Ils doivent donc correspondre à celui du fichier, **tous dérivés confondus** : si les dérivés gardent les proportions (règle de la section précédente), le même couple convient à toutes les tailles. Le décalage n'a pas été observé dans un navigateur pour ce chapitre : le mécanisme est celui décrit dans [Liens et images](/?c=langages&s=html&p=liens-et-images).

## Un exemple dans un système de gestion de contenu : Drupal

Tout ce qui précède se retrouve dans les **systèmes de gestion de contenu** (CMS, des logiciels qui permettent de publier des pages sans écrire de code). **Drupal**, un CMS écrit en [PHP](/?c=langages&s=php&p=php), n'est ici qu'un exemple : ce qui compte, c'est le principe, valable avec n'importe quel outil. Les noms ci-dessous sont vérifiés sur le code source de Drupal 11.x ; la référence est la documentation officielle ([drupal.org/docs](https://www.drupal.org/docs)).

| Principe du chapitre | Ce que Drupal propose |
|---|---|
| Dérivé à une taille donnée | Un **style d'image** : un nom (par exemple `miniature`) associé à une suite d'**effets** (réduire, recadrer, convertir) |
| Fabrication à la demande, cache sur disque | Le dérivé est fabriqué à la première demande de l'adresse du style, puis conservé dans le dossier des fichiers |
| Liste de tailles autorisées | Seuls les styles définis par l'administrateur existent ; l'adresse d'un dérivé porte un **jeton** (paramètre d'adresse) calculé à partir du chemin et d'une clé privée du site ; sans lui, Drupal répond par une erreur `404`. Ce jeton limite la fabrication abusive de dérivés (il protège contre la génération en masse), il ne contrôle pas l'origine de la demande |
| Conversion vers un autre format | Un effet de **conversion** qui change l'extension de sortie, par exemple vers WebP |
| `<picture>`, `srcset`, `sizes` | Le module **Responsive image**, qui génère ces balises à partir de styles d'image |
| Convertisseurs WebP | Le cœur sait déjà convertir en WebP, avec l'effet de conversion (`image_convert`) ; des modules contribués (par exemple « WebP ») ajoutent en plus une copie WebP de chaque dérivé |

Deux avertissements propres à ce type d'outil. La conversion dépend de la bibliothèque d'images que PHP utilise : si elle n'a pas été compilée avec le support du WebP, l'effet n'est pas disponible. Et le réglage « adresses non sécurisées » (`image.settings:allow_insecure_derivatives`, désactivé par défaut) n'annule pas le jeton pour les chemins commençant par `styles/`, qui l'exigent toujours ; il ne le supprime que pour les autres chemins. L'activer reste déconseillé : il augmente l'exposition à la génération abusive de dérivés, donc au déni de service (la saturation du serveur par un flot de demandes).

## Les pièges

| Piège | Conséquence | Parade |
|---|---|---|
| Envoyer l'original de l'appareil photo | Poids et mémoire disproportionnés | Fabriquer des dérivés aux largeurs réellement affichées |
| Réduire le poids sans réduire les pixels | Mémoire toujours élevée | Réduire d'abord les dimensions, puis choisir le format |
| Agrandir un petit original | Fichier gros, image floue | Plafonner la largeur du dérivé à celle de l'original |
| Comparer « qualité 80 » de deux formats | Conclusion fausse | Comparer à fidélité égale (PSNR ou regard), ou à poids égal |
| Photo en PNG | Fichier plusieurs fois plus lourd que le JPEG | PNG pour logos, captures et schémas ; JPEG ou WebP pour les photos |
| Logo avec transparence en JPEG | Échec de l'enregistrement, ou fond opaque | PNG ou WebP |
| Tailles acceptées sans limite | Disque et processeur épuisés, déni de service | Liste de tailles autorisées, vérifiée avant tout calcul |
| `Vary: Accept` oublié | Un cache sert un WebP à un navigateur qui ne le lit pas | Envoyer `Vary: Accept`, ou passer par `<picture>` |
| `immutable` sans version dans l'adresse | L'ancienne image reste affichée pendant un an | Mettre une version ou une empreinte dans l'adresse |
| Nom d'original non contrôlé | Lecture d'un fichier hors du dossier prévu | Résoudre le chemin et vérifier qu'il reste dans le dossier des originaux |
| Écrire le dérivé directement à son emplacement final | Un lecteur lit un fichier à moitié écrit | Écrire un fichier provisoire, puis renommer |
| `width` et `height` absents | Décalage de mise en page à l'arrivée de l'image | Les déclarer, avec `height: auto` en CSS |
| `loading="lazy"` sur l'image du haut de page | Image principale retardée | Réserver `lazy` aux images hors écran au départ |

## Bonnes pratiques

| Pratique | Détail |
|---|---|
| Garder l'original intact | Tous les dérivés se refabriquent à partir de lui ; ne jamais ré-encoder un dérivé |
| Choisir un petit nombre de largeurs | Une courte liste (par exemple 400, 800, 1200) couvre la plupart des usages et borne le cache |
| Proposer le WebP avec un secours | Une source WebP, une image JPEG de repli dans `<picture>` |
| Décrire le contexte avec `sizes` | Sans `sizes`, le navigateur suppose que l'image occupe toute la largeur de la fenêtre |
| Mesurer sur ses propres images | Chaque contenu se comporte différemment ; voir [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) |
| Mettre les dérivés derrière un CDN | Le [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) garde une copie proche du visiteur ; le principe du cache sur disque est le même, voir aussi [éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) |
| Refuser avant de calculer | La vérification de la taille, du nom et du format se fait avant l'ouverture de l'original |
| Déclarer `width` et `height` | Pour réserver la place et éviter le décalage de mise en page |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une image coûte en poids, en décodage et en mémoire ; la mémoire dépend des pixels (largeur × hauteur × 4 octets), pas du fichier. On fabrique des dérivés de plusieurs largeurs, conservés sur le disque. Sur l'image d'essai, le WebP avec perte était à la fois plus léger et plus fidèle que le JPEG à la même valeur de qualité ; PNG et WebP gardent la transparence, pas JPEG. Le bon fichier se choisit par `<picture>` et `srcset`/`sizes`, ou par l'en-tête `Accept` avec `Vary: Accept`. |
| **Pièges à éviter** | Générer à la demande n'importe quelle taille : un visiteur peut saturer processeur et disque. Comparer des valeurs de qualité de formats différents. Photo en PNG, logo transparent en JPEG. Cache d'un an sur une adresse qui ne change pas. Dimensions non déclarées, qui provoquent un décalage de la page. |
| **Bonnes pratiques** | Conserver l'original, n'accepter qu'une liste de tailles, refuser avant de calculer, écrire par renommage atomique, proposer le WebP avec un format de repli, déclarer `width` et `height`, et mesurer sur ses propres images. |
