---
order: 3
---

# Arbitrage local vs cloud pour un modèle de vision

Le chapitre [Le stack IA](/?c=ia&p=stack-ia) détaille le choix entre API hébergée et modèle auto-hébergé pour un **LLM**. Un modèle de [vision par ordinateur](/?c=ia&p=architectures-cnn-rnn-transformers) (un OCR structuré, par exemple) pose la même question de fond, mais avec des réponses parfois inversées : ce chapitre reprend les mêmes critères (exposition des données, coût, latence) en les recalculant pour ce cas précis, sans répéter le principe déjà posé pour les LLM.

## Ce qui change par rapport à un LLM

| Critère | LLM (rappel) | Modèle de vision/OCR |
|---|---|---|
| Taille typique du modèle | Souvent des dizaines de milliards de paramètres : auto-héberger un modèle compétitif exige un [GPU](/?c=infrastructure&p=cpu-vs-gpu) conséquent, parfois plusieurs | Souvent bien plus petit (quelques centaines de millions de paramètres pour un pipeline d'OCR structuré) : tourne sans difficulté sur un GPU modeste, parfois même sur CPU pour un volume raisonnable |
| Facturation d'une API hébergée | Au token, lu et généré | À la page ou à l'image traitée, un modèle de coût différent (pas de notion de longueur de texte générée) |
| Nature de la donnée exposée | Le prompt (texte, potentiellement confidentiel) | L'image envoyée (un document scanné entier), qui peut contenir bien plus d'information que ce qui est réellement utile (toute la page, pas seulement le tableau à lire) |
| Tolérance à la latence | Souvent interactive (un utilisateur attend une réponse) | Souvent un traitement par lot (*batch*), en arrière-plan, sur un ensemble de documents : quelques secondes de plus par page ont peu d'impact réel |

Ces différences déplacent le point d'équilibre : la taille de modèle plus petite rend l'auto-hébergement accessible à une équipe qui n'aurait jamais envisagé d'auto-héberger un LLM, et une latence tolérante réduit l'avantage habituel d'une API hébergée (réponse rapide, sans investissement matériel).

## L'exposition des données : le critère qui décide souvent seul

Envoyer un document à une API de vision hébergée signifie transmettre l'**image complète** de la page à un tiers, pas seulement l'information qu'on cherche à en extraire. Pour un document interne ou confidentiel (un contrat, une fiche technique propriétaire), cette exposition peut à elle seule disqualifier une API hébergée, indépendamment de son coût ou de sa qualité :

> **Piège :** évaluer une API de vision hébergée uniquement sur son prix par page et sa qualité de reconnaissance, sans avoir vérifié au préalable si le type de document traité est autorisé à transiter par un tiers (voir les principes de [gouvernance des données](/?c=ia&p=gouvernance-des-donnees), applicables ici de la même façon que pour un LLM).
>
> **Bonne pratique :** trancher la question de l'exposition des données **avant** de comparer les coûts : si la nature des documents traités l'interdit, l'auto-hébergement devient la seule option valable, quel que soit le résultat d'un calcul de coût par ailleurs favorable au cloud.

## Le coût, recalculé pour un traitement par lot

Un pipeline qui traite en routine un grand volume de documents (des centaines de PDF par jour, par exemple) accumule un coût par page qui grandit linéairement avec le volume, sans jamais s'arrêter tant que le service tourne. Un modèle auto-hébergé, une fois le matériel amorti, traite un volume supplémentaire à un coût marginal presque nul :

| | API hébergée | Modèle auto-hébergé |
|---|---|---|
| Coût à faible volume | Compétitif : aucun investissement matériel | Coût fixe du matériel à amortir, désavantageux tant que le volume reste faible |
| Coût à fort volume, régulier | Croît indéfiniment avec le volume traité | Devient rentable : le matériel déjà amorti absorbe un volume croissant sans coût marginal significatif |

> **Piège :** projeter le coût d'une API hébergée sur son volume actuel, sans anticiper sa croissance. Un pipeline de traitement documentaire a tendance à voir son volume augmenter avec le temps (plus de documents, plus de sources), déplaçant progressivement l'équilibre vers l'auto-hébergement.
>
> **Bonne pratique :** chiffrer les deux options sur une projection de volume à moyen terme, pas seulement sur le volume du jour, avant d'arrêter un choix qui sera coûteux à changer une fois le pipeline construit autour.

## La latence : un avantage qui s'efface en traitement par lot

Une API hébergée gagne en général sur la latence d'une requête isolée, un critère décisif pour un usage interactif. Un pipeline documentaire qui traite des documents en arrière-plan, sans utilisateur en attente immédiate d'un résultat, tire beaucoup moins parti de cet avantage : quelques secondes de plus par page, multipliées par un traitement asynchrone, ont un impact négligeable sur l'expérience réelle.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le choix API hébergée / auto-hébergé pour un modèle de vision reprend les critères déjà vus pour un LLM, mais recalculés : modèles plus petits (auto-hébergement plus accessible), facturation à la page plutôt qu'au token, image complète exposée plutôt qu'un prompt texte, tolérance à la latence plus élevée en traitement par lot. |
| **Outils utilisables** | Une projection de volume à moyen terme pour chiffrer le coût des deux options ; une classification préalable des documents traités (voir la gouvernance des données) pour trancher la question de l'exposition avant celle du coût. |
| **Pièges à éviter** | Comparer les options sur le seul prix sans avoir vérifié si l'exposition des documents est acceptable. Chiffrer une API hébergée sur le volume actuel sans anticiper sa croissance. |
| **Bonnes pratiques** | Trancher l'exposition des données avant le coût. Projeter le coût sur un volume à moyen terme. Ne pas surestimer l'avantage de latence d'une API hébergée pour un traitement par lot. |
