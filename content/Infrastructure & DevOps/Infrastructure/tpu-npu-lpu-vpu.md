---
order: 6
---

# Au-delà du GPU : TPU, NPU, LPU et VPU

Le chapitre [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu) oppose deux familles de puces : le CPU, généraliste, et le GPU, taillé pour répéter une même opération simple sur des milliers de données en parallèle. Mais le GPU reste lui-même assez polyvalent : la même puce peut aussi bien afficher un jeu vidéo, simuler une météo qu'entraîner un [réseau de neurones](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones). Quand une seule tâche très spécifique se répète à une échelle massive (un centre de données qui exécute des milliards de fois le même type de calcul, ou un produit vendu à des millions d'exemplaires), il devient rentable de concevoir une puce qui ne sait faire que **cette** tâche, mais l'exécute plus vite et avec moins d'énergie qu'un GPU généraliste.

```text
Généraliste                                                    Ultra-spécialisé
   CPU        ─────────►        GPU        ─────────►   TPU / NPU / LPU / VPU
(tout faire,          (paralléliser une            (une seule famille de tâche,
 séquentiel)         opération quelconque)           à très grande échelle)
```

TPU, NPU, LPU et VPU sont quatre puces nées de ce même principe, chacune spécialisée sur une tâche différente.

## TPU (Tensor Processing Unit) : le calcul matriciel de l'IA, encore plus ciblé que le GPU

Un **TPU** (*Tensor Processing Unit*, "unité de traitement de tenseurs") est une puce conçue par [Google](https://cloud.google.com/tpu) spécifiquement pour un seul type de calcul : les opérations matricielles (multiplications et additions de grandes grilles de nombres) qui composent la quasi-totalité de l'entraînement et de l'usage d'un réseau de neurones. Un GPU sait faire ce calcul, mais reste conçu pour bien plus large ; un TPU ne sait faire que ça, ce qui lui permet d'aller plus vite et de consommer moins d'énergie sur cette tâche précise, au prix de ne servir à rien d'autre (impossible d'afficher un jeu vidéo sur un TPU).

> **Analogie :** si le GPU est une chaîne de montage capable de répéter n'importe quel geste simple, le TPU est une machine-outil construite pour un seul geste, et rien qu'un seul : multiplier deux grilles de nombres entre elles. Elle ne sait rien faire d'autre, mais elle le fait mieux que la chaîne de montage généraliste.

Google utilise ses TPU dans ses propres centres de données, notamment pour faire tourner Search ou Google Traduction à l'échelle de milliards de requêtes.

## NPU (Neural Processing Unit) : l'IA embarquée, sur batterie

Un **NPU** (*Neural Processing Unit*, "unité de traitement neuronal") est une puce présente aujourd'hui dans la plupart des smartphones et ordinateurs portables récents, dédiée à faire tourner un modèle d'IA déjà entraîné (l'**inférence**, pas l'entraînement) directement sur l'appareil, avec très peu d'énergie. C'est ce qui permet à un téléphone de flouter l'arrière-plan d'une photo en temps réel ou de reconnaître un mot-clé vocal ("Dis Siri", "OK Google") sans envoyer la moindre donnée à [un serveur distant](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) : le calcul reste local, ce qui est à la fois plus rapide (pas d'aller-retour réseau) et plus respectueux de la vie privée (rien ne quitte l'appareil).

| | GPU (data center) | NPU (appareil personnel) |
|---|---|---|
| Où le calcul a lieu | Sur un serveur distant | Directement sur le téléphone/laptop |
| Contrainte principale | Puissance de calcul brute | Consommation d'énergie (batterie) |
| Tâche typique | Entraîner un modèle | Faire tourner un modèle déjà entraîné |

## LPU (Language Processing Unit) : générer du texte, token par token, sans détour

Un **LPU** (*Language Processing Unit*) est une puce conçue par l'entreprise [Groq](https://groq.com/blog/the-groq-lpu-explained) uniquement pour l'inférence des grands modèles de langage (les [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) : produire le texte de réponse un mot (plus précisément un [token](/?c=ia&s=nlp-llm&p=nlp-et-llm)) après l'autre. Un GPU classique doit répétitivement aller chercher les poids du modèle dans une mémoire externe assez lente à chaque token généré, ce qui limite sa vitesse ("le mur de la mémoire"). Le LPU contourne ce problème en gardant tout le modèle dans une mémoire directement intégrée à la puce, beaucoup plus rapide, et en exécutant les calculs dans un ordre fixé à l'avance plutôt que décidé dynamiquement : cette exécution prévisible permet une génération de texte particulièrement rapide et régulière.

## VPU (Vision Processing Unit) : la vision par ordinateur en continu, sur batterie

Un **VPU** (*Vision Processing Unit*) est une puce spécialisée dans l'analyse d'image et de vidéo en temps réel, pour un coût énergétique minimal. Une puce comme le [Movidius Myriad X d'Intel](https://www.intel.com/content/www/us/en/developer/topic-technology/edge-5g/hardware/vision-accelerator-movidius-vpu.html) consomme environ 1,5 watt (contre plusieurs centaines de watts pour un GPU de data center) tout en analysant un flux vidéo en continu : c'est ce type de puce qui équipe des drones, des caméras de surveillance ou des casques de réalité augmentée, où la vidéo doit être analysée en permanence sans jamais épuiser une batterie.

## Comparatif des cinq puces

| Puce | Spécialité | Contexte d'usage typique | Exemple concret |
|---|---|---|---|
| **CPU** | Généraliste, séquentiel | Tout ordinateur | Faire tourner un système d'exploitation |
| **GPU** | Parallèle, généraliste | Data center, poste de travail | Entraîner un réseau de neurones, rendu 3D |
| **TPU** | Calcul matriciel IA uniquement | Data center (Google) | Faire tourner Google Traduction à grande échelle |
| **NPU** | Inférence IA embarquée, basse énergie | Smartphone, laptop | Flou de portrait en temps réel, assistant vocal local |
| **LPU** | Inférence LLM déterministe, faible latence | Serveur d'inférence dédié (Groq) | Génération de texte token par token très rapide |
| **VPU** | Vision par ordinateur, ultra basse énergie | Drone, caméra, casque AR/VR embarqué | Détection d'objets en continu sur batterie |

> **Piège :** croire qu'une puce plus spécialisée est "meilleure" dans l'absolu. Elle est plus rapide et plus économe en énergie **uniquement** sur la tâche précise pour laquelle elle a été conçue, et strictement inutilisable en dehors (contrairement au CPU, généraliste, ou même au GPU, qui reste assez polyvalent).
>
> **Bonne pratique :** ne réserver une puce ultra-spécialisée (TPU, NPU, LPU, VPU) qu'à un volume de calcul répétitif assez massif pour rentabiliser sa conception (l'échelle d'un centre de données, ou d'un produit vendu à des millions d'exemplaires) ; pour tout le reste, un CPU ou un GPU généraliste reste le bon choix.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | TPU, NPU, LPU et VPU appliquent tous le même principe que CPU vs GPU, en poussant la spécialisation encore plus loin : une puce qui ne sait faire qu'une seule tâche (respectivement calcul matriciel IA, inférence IA embarquée, inférence LLM, vision par ordinateur) va plus vite et consomme moins qu'une puce généraliste sur cette tâche précise. |
| **Outils utilisables** | TPU disponibles via [Google Cloud](https://cloud.google.com/tpu) ; NPU déjà intégrés dans la plupart des smartphones/laptops récents ; LPU accessibles via l'API de [Groq](https://groq.com/blog/the-groq-lpu-explained) ; VPU présents dans des modules embarqués comme le Movidius. |
| **Pièges à éviter** | Croire qu'une puce spécialisée est universellement meilleure qu'une puce généraliste. |
| **Bonnes pratiques** | Réserver chaque puce ultra-spécialisée à l'échelle qui justifie son coût de conception ; garder CPU/GPU pour tout le reste. |
