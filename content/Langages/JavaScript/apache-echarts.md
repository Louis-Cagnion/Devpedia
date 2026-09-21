---
order: 21
---

# La bibliothèque de graphiques Apache ECharts

Tracer un graphique (barres, courbes, secteurs) à la main sur un [`<canvas>`](/?c=langages&s=javascript&p=canvas-2d-et-animations) demande de dessiner soi-même chaque élément : axes, échelle, courbes, légende, infobulle au survol. Ce chapitre couvre [Apache ECharts](https://echarts.apache.org/), une bibliothèque JavaScript de graphiques qui remplace ce dessin manuel par un seul objet de configuration.

## Configuration déclarative plutôt que dessin manuel

ECharts prend en entrée un objet qui décrit le résultat voulu (approche **déclarative**), pas les étapes pour y arriver (approche **impérative**, celle du canvas) : la bibliothèque calcule elle-même les positions, l'échelle et le rendu.

| | Canvas 2D (impératif) | ECharts (déclaratif) |
|---|---|---|
| Ce qu'on écrit | Chaque instruction de dessin (`fillRect`, `moveTo`, `lineTo`...) | Un objet de configuration (`option`) décrivant le résultat voulu |
| Mise à jour d'une valeur | Effacer puis redessiner soi-même toute la zone | `chart.setOption()` avec les nouvelles données uniquement |
| Infobulle au survol | À coder à la main (détection de position, affichage) | Incluse, activée par la clé `tooltip` |

## Initialiser un graphique sur un conteneur

`echarts.init()` attache un graphique à un élément du [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (une balise vide, avec une taille fixée en CSS) ; `setOption()` lui applique ensuite une configuration :

```javascript
const chart = echarts.init(document.querySelector('#mon-graphique'));

const option = {
    xAxis: { type: 'category', data: ['T1', 'T2', 'T3', 'T4'] },   // catégories affichées sur l'axe horizontal
    yAxis: { type: 'value' },                                      // axe vertical numérique, échelle automatique
    tooltip: {},                                                   // infobulle au survol d'une barre
    series: [{ type: 'bar', data: [120, 200, 150, 80] }]           // une "série" = un jeu de barres/points à tracer
};

chart.setOption(option);   // applique la configuration : le graphique se dessine
```

> **Bonne pratique :** un `option` reste un objet JavaScript ordinaire, généré dynamiquement à partir des données réelles (une réponse d'API, un calcul) plutôt que recopié en dur : construire ses clés (`xAxis.data`, `series[].data`) depuis les données à afficher, jamais l'inverse.

## Mettre à jour les données sans tout redessiner : `setOption()`

Un appel à `setOption()` avec un objet partiel fusionne les nouvelles valeurs à la configuration existante : seules les parties changées sont recalculées et redessinées, sans reconstruire les axes ni la légende à zéro.

```javascript
// Ajoute une cinquieme categorie et sa valeur, sans recreer tout le graphique
chart.setOption({
    xAxis: { data: ['T1', 'T2', 'T3', 'T4', 'T5'] },
    series: [{ data: [120, 200, 150, 80, 175] }]
});
```

## Adapter le graphique à la taille de son conteneur : `resize()`

Par défaut, un graphique ECharts garde la taille qu'il avait à son initialisation : redimensionner la fenêtre ne le redimensionne pas tout seul. Il faut écouter [l'événement `resize`](/?c=langages&s=javascript&p=dom-et-evenements#ecouter-des-evenements) et redemander explicitement un nouveau calcul de taille :

```javascript
window.addEventListener('resize', () => chart.resize());
```

> **Piège :** oublier cet écouteur. Le conteneur (une `<div>`) suit bien le CSS responsive de la page, mais le graphique dessiné dedans reste figé à sa taille d'origine : une zone vide apparaît à côté, ou le graphique déborde du conteneur devenu plus petit.

## Libérer la mémoire quand le graphique disparaît : `dispose()`

Dans une [application monopage (SPA)](/?c=langages&s=javascript&p=ssr-vs-csr#csr-le-serveur-envoie-une-coquille-vide), un composant de graphique est créé puis détruit à chaque navigation. Retirer la `<div>` du DOM ne suffit pas à libérer le graphique : `echarts.init()` a enregistré son propre gestionnaire de redimensionnement et alloué des ressources de rendu, qui restent actives tant que `chart.dispose()` n'a pas été appelé explicitement.

```javascript
chart.dispose();   // a appeler avant de retirer le conteneur du DOM
```

> **Piège :** un composant de graphique qui se détruit sans appeler `dispose()` accumule un graphique fantôme par navigation : l'écouteur `resize` posé plus haut continue de s'exécuter sur un graphique qui n'existe plus visuellement, une fuite mémoire classique dans une SPA à navigation fréquente.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | ECharts décrit un graphique par un objet `option` unique (`series`, `xAxis`/`yAxis`, `tooltip`) plutôt que par des instructions de dessin (approche déclarative contre impérative). `echarts.init()` l'attache à un élément du DOM, `setOption()` l'affiche ou le met à jour partiellement. |
| **Outils utilisables** | `echarts.init()`, `chart.setOption()`, `chart.resize()`, `chart.dispose()`. |
| **Pièges à éviter** | Oublier d'écouter `resize` (graphique figé à sa taille initiale). Oublier `dispose()` avant de retirer le conteneur du DOM (fuite mémoire, surtout en SPA). |
| **Bonnes pratiques** | Générer l'objet `option` dynamiquement à partir des données réelles plutôt que le recopier en dur. Mettre à jour un graphique existant via `setOption()` partiel plutôt que le recréer entièrement. |
