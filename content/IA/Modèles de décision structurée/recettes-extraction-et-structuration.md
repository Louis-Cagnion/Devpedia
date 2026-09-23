---
order: 9
---

# Recettes : extraire et restructurer du texte libre

Ce chapitre et les deux suivants appliquent la [méthodologie](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) à des problèmes concrets, documentés par TypeSafe AI sous forme de recettes ("cookbooks"). Cette première série porte sur l'extraction : retrouver une valeur précise, ou une structure, dans un texte qui n'en a pas.

## Récupération de structure : reconstruire un document mal formaté

Un texte collé sans mise en forme (titres, listes, citations perdus) se restructure en deux passes, sans jamais réécrire un seul caractère du texte source :

| Passe | Question posée | But |
|---|---|---|
| 1. Recollage (*stitching*) | Un Noul par paire de lignes voisines : "cette ligne continue-t-elle la phrase précédente ?" | Fusionner les lignes coupées par erreur |
| 2. Classification | Un Choice par bloc fusionné : titre, paragraphe, item de liste, citation, code, encadré | Retrouver la structure logique du document |

Le modèle ne répond qu'à des questions factuelles étroites ; c'est le code qui gère la ponctuation et les espaces, éliminant tout risque de réécriture involontaire du texte original.

## Cascade d'extraction structurée : économiser sans perdre en qualité

La **cascade SDE** (*structured-data-extraction cascade*) traite un document en plusieurs étapes de coût croissant, n'escaladant à l'étape suivante que si nécessaire :

```text
1. Un modele economique extrait les champs (rapide, bon marche)
        |
        v
2. Le modele de decision structuree VERIFIE chaque champ (Noul par champ,
   detecte une extraction douteuse ou hallucinee)
        |
        v
3. Seuls les champs juges douteux (confiance > seuil) sont retraites par un
   modele puissant (couteux, reserve aux cas difficiles)
```

Le modèle économique peut halluciner une valeur plausible mais fausse (ex : inventer une date d'inscription absente d'une page) ; le rôle du modèle de décision structurée est justement de repérer ce genre d'écart avant qu'il ne se propage, sans faire appel au modèle puissant pour les champs déjà corrects.

## Extraction de dates : lire puis résoudre en code

Conséquence directe du [piège n°4 du chapitre précédent](/?c=ia&s=modeles-de-decision-structuree&p=limites-et-pieges-jev) (le modèle calcule mal les dates) : on ne lui demande jamais de calculer une date, seulement de **lire comment elle est écrite**.

```text
1. Le modele repond a des questions Choice : date absolue ou relative ?
   quels composants sont nommes (mois, jour, annee, jour de semaine) ?
2. Le CODE convertit ces reponses en une date reelle (ex : quel jeudi pour
   "jeudi prochain"), en deduisant l'annee manquante si besoin
```

| Piège | Bonne pratique |
|---|---|
| Demander directement au modèle "quelle est la date exacte ?" | Lui demander comment le texte l'exprime, résoudre le calcul en code |

## Extraction de valeurs pré-repérées : le regex trouve, le modèle choisit

Pour des valeurs à motif reconnaissable (email, téléphone, montant), une expression régulière repère d'abord tous les candidats plausibles (quitte à en repérer trop), puis une question Choice sélectionne celui qui correspond réellement à ce qui est demandé :

```text
Texte -> regex (motifs email/telephone/montant) -> N candidats
Candidats + question -> Choice -> le candidat pertinent
Candidat retenu -> code -> copie verbatim + normalisation (ex : format E.164)
```

Le modèle ne recopie jamais lui-même une valeur : il **désigne** un candidat déjà trouvé par le regex, que le code copie tel quel. Il ne peut donc ni inventer une valeur, ni transposer un chiffre par erreur, contrairement à un LLM générateur qui retaperait la valeur lui-même.

> **Piège commun à ces quatre recettes :** laisser le modèle produire ou calculer directement une valeur exacte (une date résolue, un montant recopié), au lieu de le cantonner à un jugement (lequel ? quel type ? est-ce cohérent ?) et de laisser le code faire le calcul ou la copie exacte.
>
> **Bonne pratique commune :** toujours répartir le travail selon les forces de chacun : au modèle le jugement contextuel (lequel de ces candidats ? quel type de bloc ? cette extraction semble-t-elle correcte ?), au code tout calcul ou toute copie qui doit être exacte à 100 %.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Quatre recettes d'extraction partagent le même principe : le modèle de décision structurée ne fait jamais le calcul ou la copie exacte lui-même, il juge (cette ligne continue-t-elle ? ce champ semble-t-il correct ? comment cette date est-elle écrite ? quel candidat correspond ?), et le code exécute la partie qui doit être exacte. |
| **Outils utilisables** | Des questions Noul/Choice en cascade ou en passes successives ; une expression régulière en amont pour repérer des candidats ; du code de résolution/normalisation en aval. |
| **Pièges à éviter** | Faire calculer ou recopier une valeur exacte par le modèle plutôt que par le code. |
| **Bonnes pratiques** | Réserver le modèle au jugement contextuel, confier au code tout calcul ou toute copie qui doit rester exacte. |
