---
order: 20
---

# Entraîner et fine-tuner un modèle de vision pour un cas métier

Les mécanismes génériques d'entraînement ([fonction de perte, descente de gradient, rétropropagation](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [boucle PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) s'appliquent tels quels à un modèle de vision : ce chapitre ne les répète pas. Il couvre ce qui est spécifique à l'entraînement d'un modèle de vision pour un cas métier précis (reconnaître les factures d'un fournisseur donné, par exemple) : repartir d'un modèle déjà entraîné plutôt que de zéro, et adapter les données d'image en conséquence.

## Repartir d'un modèle pré-entraîné plutôt que de zéro

Entraîner un modèle de vision **de zéro** (poids aléatoires) suppose des millions d'images annotées, un besoin déjà noté dans le chapitre sur l'entraînement générique. Pour un cas métier précis, ce volume n'existe presque jamais : quelques centaines à quelques milliers d'exemples est plus réaliste, largement insuffisant pour apprendre à reconnaître des formes depuis rien.

Le **transfer learning** (apprentissage par transfert) contourne ce problème : partir d'un modèle déjà entraîné sur un très grand jeu de données généraliste (par exemple [ImageNet](https://www.image-net.org/), des millions de photos, des milliers de catégories), puis continuer son entraînement sur les données spécifiques du cas métier :

```text
Entraînement generaliste (deja fait, par quelqu'un d'autre, sur des millions d'images) :
Poids aleatoires -> ... -> Modele qui reconnait bords, textures, formes courantes

Fine-tuning (a faire soi-meme, sur son propre cas metier) :
Modele pre-entraine -> poursuite de l'entrainement sur ses propres donnees -> modele adapte
```

Les premières couches d'un modèle de vision apprennent des motifs très généraux (bords, textures, coins), utiles à n'importe quelle tâche visuelle ; seules les couches les plus proches de la sortie sont réellement spécifiques à la tâche d'origine. Repartir d'un modèle pré-entraîné revient à réutiliser ce socle déjà appris, et à ne réajuster que ce qui doit réellement changer.

> **Piège :** entraîner un modèle de vision de zéro pour un cas métier disposant de peu de données, faute d'avoir cherché un modèle pré-entraîné équivalent. Le résultat surapprend presque toujours (voir le [surapprentissage](/?c=data-science&p=machine-learning-scikit-learn)) : le modèle mémorise les quelques exemples disponibles au lieu d'apprendre un motif général.
>
> **Bonne pratique :** chercher systématiquement un modèle pré-entraîné pertinent (sur une tâche proche) avant d'envisager un entraînement de zéro, réservé aux cas où le domaine visuel est si particulier qu'aucun modèle existant n'a rien appris d'utile pour lui.

## Geler des couches : ne réajuster que ce qui doit changer

Une fois le modèle pré-entraîné chargé, plusieurs stratégies existent, selon la quantité de données disponibles pour le fine-tuning :

| Stratégie | Ce qui est réajusté | Quand l'utiliser |
|---|---|---|
| **Geler tout, sauf la dernière couche** | Uniquement la couche de sortie (adaptée aux nouvelles catégories) | Très peu de données ; le domaine visuel ressemble à celui du pré-entraînement |
| **Geler les premières couches, réajuster les dernières** | Les couches profondes (motifs spécifiques), pas les premières (motifs génériques) | Quantité de données modérée ; compromis le plus courant |
| **Ne rien geler (fine-tuning complet)** | Toutes les couches | Données abondantes ; le domaine visuel diffère notablement du pré-entraînement (ex. documents scannés en noir et blanc, contre des photos couleur) |

**Geler** une couche signifie l'exclure du calcul de gradient : ses poids restent fixés à leur valeur pré-entraînée, la rétropropagation ne les modifie jamais.

```python
# Charger un modele pre-entraine et geler son "backbone" (les couches d'extraction de motifs)
for parametre in modele.backbone.parameters():
    parametre.requires_grad = False   # exclu du calcul de gradient, voir autograd

# Seule la nouvelle couche de sortie, ajoutee pour ce cas metier, reste entrainable
modele.tete_de_sortie = nn.Linear(taille_features, nombre_categories_metier)
```

> **Piège :** utiliser le même taux d'apprentissage que pour un entraînement de zéro. Un taux d'apprentissage trop élevé en fine-tuning modifie brutalement des poids déjà utiles, un phénomène appelé **oubli catastrophique** (*catastrophic forgetting*) : le modèle perd les motifs génériques qu'il avait déjà appris, sans les avoir remplacés par quelque chose de mieux.
>
> **Bonne pratique :** utiliser un taux d'apprentissage nettement plus faible qu'un entraînement de zéro (souvent 10 à 100 fois plus petit) pour les couches réajustées, précisément parce qu'elles partent déjà d'un bon point de départ plutôt que de valeurs aléatoires.

## Adapter les données : l'augmentation spécifique à l'image

Avec peu d'exemples disponibles, l'**augmentation de données** (*data augmentation*) crée artificiellement des variantes de chaque image d'entraînement, pour exposer le modèle à une diversité qu'un petit jeu de données ne couvre pas seul :

```python
from torchvision import transforms

augmentation = transforms.Compose([
    transforms.RandomRotation(degrees=5),                    # leger desalignement du scan
    transforms.ColorJitter(brightness=0.2, contrast=0.2),    # variation d'éclairage/qualité de scan
    transforms.GaussianBlur(kernel_size=3),                  # leger flou (photo plutot que scanner)
])
```

Chaque transformation doit correspondre à une variation **réellement rencontrée** dans les données de production : pour un document scanné, une légère rotation (scan mal aligné) ou un changement de luminosité (qualité du scanner) sont réalistes ; une rotation de 180° ou un miroir horizontal ne le sont presque jamais pour du texte.

> **Piège :** appliquer des augmentations génériques recopiées d'un tutoriel sur la classification de photos (rotation à 90°/180°, miroir horizontal), sans les avoir confrontées aux variations réellement observées sur ses propres documents. Une rotation à 180° apprendrait au modèle à reconnaître du texte à l'envers, un cas qui n'arrive jamais en pratique : de l'entraînement gaspillé sur un cas irréaliste, au détriment des cas réels.
>
> **Bonne pratique :** choisir chaque augmentation en fonction des variations concrètement observées sur des exemples réels du cas métier (qualité de scan, angle, éclairage), pas par défaut depuis un exemple générique.

Voir aussi [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) pour la boucle d'entraînement générique dans laquelle s'insère tout ce qui précède, et [OCR : de la reconnaissance de motifs classique au deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) pour un exemple de modèle qu'on pourrait vouloir fine-tuner sur un format de document propre à une entreprise.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le transfer learning repart d'un modèle pré-entraîné sur un grand jeu de données généraliste plutôt que de zéro, indispensable dès que les données du cas métier sont limitées. Geler les premières couches préserve les motifs génériques déjà appris ; ne réajuster que les dernières couches (ou toutes, avec un taux d'apprentissage réduit) selon le volume de données disponible. L'augmentation de données doit refléter les variations réellement rencontrées, pas des transformations génériques. |
| **Outils utilisables** | Modèles pré-entraînés des bibliothèques de vision (torchvision, Hugging Face) ; `requires_grad = False` pour geler des couches ; `torchvision.transforms` pour l'augmentation de données. |
| **Pièges à éviter** | Entraîner de zéro avec peu de données plutôt que de chercher un modèle pré-entraîné. Garder un taux d'apprentissage trop élevé en fine-tuning (oubli catastrophique). Appliquer des augmentations irréalistes pour le cas métier réel. |
| **Bonnes pratiques** | Toujours chercher un modèle pré-entraîné pertinent avant d'entraîner de zéro. Réduire nettement le taux d'apprentissage en fine-tuning. Choisir les augmentations selon les variations réellement observées sur ses propres documents. |
