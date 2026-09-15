---
order: 18
---

# L'API JavaScript Google Maps

Afficher une carte interactive dans une page web (des marqueurs, un fond de carte navigable) demande normalement de charger une bibliothèque tierce. Ce chapitre couvre l'API JavaScript de [Google Maps](https://developers.google.com/maps/documentation/javascript), avec son chargement différé officiel, le regroupement visuel de marqueurs nombreux, et les deux façons de dessiner un marqueur.

## Charger la bibliothèque à la demande : `importLibrary()`

Une carte Google Maps complète utilise plusieurs sous-bibliothèques indépendantes (`maps` pour la carte elle-même, `marker` pour les marqueurs...), chacune inutile tant qu'elle n'est pas réellement utilisée. Plutôt que de toutes les charger d'un coup au chargement de la page, Google fournit un petit script de démarrage (*bootstrap loader*) : il ne charge le vrai script de l'API qu'au premier appel à `google.maps.importLibrary()`, et met en cache les appels suivants.

```javascript
// Charge uniquement les sous-bibliotheques demandees, la 1re fois qu'on en a besoin
const { Map } = await google.maps.importLibrary('maps');
const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
```

> **Note :** ce script de démarrage est fourni tel quel par Google (à coller dans la page), volontairement minifié et condensé en une seule expression : il n'y a pas lieu de le réécrire à la main, seulement de comprendre ce qu'il fait une fois développé, comme ci-dessus.

## Regrouper des marqueurs nombreux : le clustering

Afficher des centaines de marqueurs proches les uns des autres, à un niveau de zoom faible, rend la carte illisible (marqueurs superposés). Une bibliothèque de **clustering** (regroupement visuel) comme [`@googlemaps/markerclusterer`](https://github.com/googlemaps/js-markerclusterer) remplace un groupe de marqueurs proches par une seule pastille affichant leur nombre, qui se dégroupe automatiquement au zoom :

```javascript
const clusterer = new markerClusterer.MarkerClusterer({
    map,
    markers: listeDesMarqueurs,
});
```

Le clustering fonctionne par **position à l'écran**, recalculée à chaque changement de zoom : il n'a besoin d'aucune configuration de distance ou de seuil pour fonctionner correctement dans le cas courant.

## Disperser des marqueurs strictement colocalisés

Le clustering résout la lisibilité à distance, mais pas un cas particulier : plusieurs entrées qui partagent exactement les **mêmes** coordonnées (par exemple, plusieurs fiches d'un même établissement). Même dézoomé au maximum, un marqueur resterait invisible sous l'autre, strictement superposé, sans qu'aucun clic ne puisse jamais l'atteindre. La solution consiste à décaler chaque marqueur colocalisé selon un petit cercle, à un rayon fixe :

```javascript
const RAYON_DISPERSION = 0.00020;   // ~20m a l'equateur

function disperserColocalises(points) {
    const groupes = new Map();
    points.forEach(p => {
        const cle = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
        if (!groupes.has(cle)) groupes.set(cle, []);
        groupes.get(cle).push(p);
    });

    groupes.forEach(groupe => {
        if (groupe.length <= 1) return;
        const n = groupe.length;
        // Correction longitude selon la latitude (sinon les cercles s'etirent nord-sud)
        const echelleLongitude = 1 / Math.max(0.1, Math.cos(groupe[0].lat * Math.PI / 180));
        groupe.forEach((point, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            point.lat += RAYON_DISPERSION * Math.sin(angle);
            point.lng += RAYON_DISPERSION * Math.cos(angle) * echelleLongitude;
        });
    });
}
```

> **Piège :** oublier la correction de longitude (`echelleLongitude`). Un degré de longitude ne couvre pas la même distance réelle selon la latitude (il rétrécit en s'éloignant de l'équateur, jusqu'à valoir 0 aux pôles) : sans cette correction, le cercle de dispersion s'étire visuellement du nord au sud plutôt que de rester un vrai cercle à l'écran.

## Deux façons de dessiner un marqueur

L'API Google Maps propose deux chemins de rendu pour un marqueur, avec des capacités différentes :

| | `google.maps.Marker` (legacy) | `AdvancedMarkerElement` |
|---|---|---|
| Rendu | Image SVG fixe | Élément [HTML](/?c=langages&s=html&p=html) personnalisable (`content`) |
| Personnalisation | Limitée (icône, couleur) | Totale (CSS, animations, contenu dynamique) |
| Prérequis | Aucun | Un identifiant de style de carte (*Map ID*) configuré côté Google Cloud |

```javascript
// AdvancedMarkerElement : contenu HTML libre
const el = document.createElement('div');
el.className = 'mon-marqueur-anime';
new AdvancedMarkerElement({ map, position, content: el });

// google.maps.Marker (legacy) : rendu SVG fixe, sans prerequis de configuration
new google.maps.Marker({ map, position, icon: monIconeSvg });
```

> **Bonne pratique :** basculer dynamiquement entre les deux selon qu'un *Map ID* est configuré ou non, plutôt que de dépendre d'un seul chemin de rendu : `AdvancedMarkerElement` quand il est disponible (personnalisation complète), `google.maps.Marker` en repli sinon, sans rien casser pour un déploiement qui n'a pas encore cette configuration.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `google.maps.importLibrary()` charge chaque sous-bibliothèque à la demande, une seule fois. Un clustering regroupe visuellement des marqueurs proches ; une dispersion en cercle (avec correction de longitude) sépare des marqueurs strictement colocalisés. `AdvancedMarkerElement` permet un rendu HTML personnalisable, `google.maps.Marker` un rendu SVG fixe sans prérequis. |
| **Outils utilisables** | `google.maps.importLibrary()`, `@googlemaps/markerclusterer` (`MarkerClusterer`), `AdvancedMarkerElement`/`google.maps.Marker`. |
| **Pièges à éviter** | Charger toutes les sous-bibliothèques d'un coup plutôt qu'à la demande. Oublier la correction de longitude lors d'une dispersion de points colocalisés. |
| **Bonnes pratiques** | Regrouper les marqueurs nombreux par clustering plutôt que de les laisser se superposer visuellement. Basculer entre `AdvancedMarkerElement` et `google.maps.Marker` selon la configuration disponible, plutôt que de dépendre d'un seul chemin. |
