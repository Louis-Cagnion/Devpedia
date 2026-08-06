---
order: 8
---

# Le heap d'un runtime managé

Le chapitre C sur [la gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) distingue la stack (automatique) du heap (manuel, `malloc`/`free`). Un runtime managé — la JVM (Java/Elasticsearch/Kafka...), le CLR .NET, le moteur V8 de Node.js — a lui aussi un heap, mais avec un sens différent : c'est **toute la zone mémoire réservée aux objets alloués dynamiquement**, gérée automatiquement par un ramasse-miettes (*garbage collector*) plutôt que par des appels explicites. Le développeur ne l'alloue ni ne le libère lui-même ; il en fixe seulement la taille.

## Une taille souvent auto-détectée, pas toujours adaptée

Faute d'indication explicite, la plupart des runtimes managés choisissent une taille de heap par défaut en fonction de la RAM disponible sur la machine — une heuristique pensée pour un serveur dédié qui tourne à pleine charge, pas pour un usage local ponctuel. La JVM d'Elasticsearch, par exemple, vise par défaut jusqu'à 50 % de la RAM du système : sur une machine à 32 Go, cela réserve 16 Go au démarrage, que l'usage réel (une instance locale, peu de données) ne justifie pas.

Deux effets concrets d'un heap surdimensionné par rapport au besoin réel :

- **Moins de RAM pour le cache disque de l'OS.** Un moteur comme Elasticsearch (basé sur Lucene) s'appuie énormément sur le cache fichier du système pour ses performances de lecture — un heap qui monopolise la moitié de la RAM laisse d'autant moins de place à ce cache, et peut pousser le système vers le swap.
- **Un ramasse-miettes plus lent à s'échauffer.** Plus le heap est grand, plus les premiers cycles de ramasse-miettes ont de travail à faire pour établir leurs statistiques internes — un effet qui se ressent surtout au démarrage, avant que le régime de croisière ne s'installe.

## Fixer la taille explicitement

La plupart des runtimes managés exposent un réglage explicite pour la taille du heap (`-Xmx`/`-Xms` pour la JVM, par exemple) — plafonner cette taille à ce que l'usage réel demande, plutôt que de laisser l'heuristique par défaut réserver une fraction de toute la RAM disponible, évite les deux effets ci-dessus. C'est ce que fait un script comme `start-elasticsearch.ps1` en imposant 1 Go par défaut (`-HeapSize` pour ajuster) au lieu des 16 Go auto-détectés : largement suffisant pour un usage local, et un démarrage nettement plus rapide.

> **Note :** contrairement au heap C, où une taille trop petite provoque un échec d'allocation immédiat et visible (`malloc` renvoie `NULL`), un heap managé trop petit se traduit plutôt par des cycles de ramasse-miettes plus fréquents, voire une erreur `OutOfMemoryError` si même la mémoire libérable ne suffit plus — une dégradation progressive plutôt qu'un échec net.
