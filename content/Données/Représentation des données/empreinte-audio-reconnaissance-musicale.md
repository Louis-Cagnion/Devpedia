---
order: 8
---

# L'empreinte audio : reconnaître une chanson en quelques secondes

Le [hachage perceptuel](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) réduit une image à une petite empreinte robuste aux petites variations (recompression, recadrage). Le même principe s'applique au son : reconnaître une chanson à partir d'un extrait de quelques secondes, enregistré au micro d'un téléphone dans un bar bruyant, en la comparant à une base de dizaines de millions de morceaux, en moins d'une seconde. C'est le problème que résout l'**empreinte audio** (popularisée par Shazam).

## Étape 1 : transformer le son en image (le spectrogramme)

Un son est une onde qui varie dans le temps, mais cette seule dimension (le volume à chaque instant) ne suffit pas à le reconnaître : il faut aussi savoir quelles **fréquences** (graves, aigües) sont présentes à chaque instant. Un **spectrogramme** transforme l'audio en une sorte d'image :

```text
Fréquence (aigu)
      ▲
      │   ░░  ▓▓        ░░
      │  ░▓▓  ░░  ▓▓░░
      │  ▓▓░      ░▓▓  ░░
      └──────────────────────► Temps
      (grave)

Axe horizontal : le temps
Axe vertical    : la fréquence (grave en bas, aigu en haut)
Intensité (░/▓) : le volume de cette fréquence à cet instant
```

Cette image contient beaucoup plus d'information qu'une simple courbe de volume : elle montre précisément quelles notes/fréquences sonnent à quel moment.

## Étape 2 : ne garder que les pics les plus marquants

Un spectrogramme complet reste sensible au bruit ambiant (conversations, bruit de fond) : comparer deux spectrogrammes pixel par pixel échouerait dès qu'un bruit parasite s'ajoute au signal. La solution retenue par Shazam ne garde que les points les plus **intenses** du spectrogramme (les pics qui dépassent largement leur voisinage) : quelques dizaines de points par seconde, choisis pour rester visibles même à travers du bruit ambiant, une compression audio ou une qualité de micro médiocre.

```text
Spectrogramme complet          Ne garder que les pics
(sensible au bruit)             (robuste au bruit)

  ░▓▓░░▓░░▓▓░░░▓░░        →        •      •
  ░░▓░▓▓░░░▓▓░▓░░                    •  •
  ▓░░▓░░▓▓░░░▓░▓▓░                •        •
```

## Étape 3 : hacher des paires de pics, puis chercher dans une base gigantesque

Chaque pic est associé à un pic voisin, et la paire (fréquence du premier, fréquence du second, écart de temps entre les deux) est transformée en une empreinte compacte, exactement comme un [hachage perceptuel](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) réduit une image à une suite de bits. Ces empreintes sont précalculées pour des dizaines de millions de morceaux et stockées dans un immense index :

```text
Extrait enregistré → pics → empreintes → recherche dans l'index
                                              ↓
Si beaucoup d'empreintes correspondent à un même morceau,
avec un décalage temporel cohérent → morceau identifié
```

L'exigence d'un **décalage temporel cohérent** entre toutes les empreintes qui correspondent est ce qui élimine les faux positifs : quelques empreintes peuvent coïncider par hasard avec n'importe quel morceau, mais des dizaines d'entre elles coïncidant avec le même décalage de temps ne peuvent provenir que du même enregistrement.

> **Piège :** attendre de cette technique qu'elle reconnaisse un air fredonné ou chanté par l'utilisateur lui-même. L'empreinte audio identifie un **enregistrement précis** (les mêmes pics de fréquence que l'original) : une reprise, une version live ou un fredonnement produisent un spectrogramme différent de l'enregistrement studio, donc des empreintes différentes, même si un humain reconnaît immédiatement "la même chanson".
>
> **Bonne pratique :** utiliser un extrait de l'enregistrement original, même bref et bruité (quelques secondes suffisent, l'algorithme n'a besoin que de quelques dizaines de pics fiables) ; pour reconnaître un air fredonné, une technique différente est nécessaire (comparer la mélodie elle-même, indépendamment du timbre exact de l'enregistrement), hors du périmètre de l'empreinte audio classique.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une empreinte audio transforme le son en spectrogramme, n'en garde que les pics de fréquence les plus marquants (robustes au bruit), puis hache des paires de pics pour les retrouver dans un immense index, en exigeant un décalage temporel cohérent entre les correspondances. |
| **Outils utilisables** | Le principe (constellation de pics + hachage de paires), publié par Avery Wang (co-fondateur de Shazam), est repris par la plupart des services de reconnaissance musicale. |
| **Pièges à éviter** | Attendre une reconnaissance à partir d'un air fredonné ou d'une reprise différente de l'enregistrement original. |
| **Bonnes pratiques** | Utiliser un extrait de l'enregistrement original, même court et bruité ; recourir à une technique dédiée (comparaison de mélodie) pour un air fredonné. |
