---
order: 20
---

# Les streams : traiter un flux de données sans tout charger en mémoire

Jusqu'ici, chaque donnée manipulée ([un texte](/?c=langages-de-programmation&s=javascript&p=strings), un tableau, la réponse d'un [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone)) est traitée comme un bloc entier, disponible en une seule fois. Un **stream** (flux) traite au contraire une donnée **morceau par morceau** (*chunk* par *chunk*), au fur et à mesure qu'elle arrive, sans jamais devoir la charger entièrement en mémoire.

## Pourquoi ne pas simplement tout charger en mémoire

| | Charger tout en mémoire | Traiter en stream |
|---|---|---|
| Principe | Attendre la donnée complète avant d'y toucher | Traiter chaque morceau dès qu'il arrive |
| Mémoire utilisée | Proportionnelle à la taille totale de la donnée | Proportionnelle à la taille d'un seul morceau |
| Premier résultat visible | Seulement une fois tout reçu | Dès le premier morceau |
| Exemple typique | Un petit fichier de config (quelques Ko) | Une vidéo, un fichier volumineux, une réponse HTTP longue |

> **Piège :** charger un contenu potentiellement volumineux entièrement en mémoire "pour simplifier" (ex. `await reponse.arrayBuffer()` sur un fichier de plusieurs gigaoctets) alors qu'il ne fait que transiter vers une autre destination (un autre fichier, une autre réponse HTTP). Le programme retient alors tout le contenu en mémoire en même temps, même s'il n'en a jamais besoin en entier à la fois.
>
> **Bonne pratique :** dès qu'une donnée ne fait que transiter (relayée, copiée, envoyée ailleurs) sans être elle-même analysée dans son intégralité, la traiter en stream plutôt que de la charger entièrement.

## Deux implémentations différentes, coexistant dans l'écosystème JavaScript

Le concept de stream existe depuis longtemps côté serveur (Node.js), et a été ajouté plus tard côté navigateur (les "Web Streams", un standard du Web). Les deux se ressemblent dans l'idée mais utilisent une API différente :

| | Node.js Streams | Web Streams |
|---|---|---|
| Origine | Spécifique à Node.js, depuis ses débuts | Standard du navigateur, aussi disponible dans Node.js récent |
| Type principal | `stream.Readable` / `stream.Writable` | `ReadableStream` / `WritableStream` |
| Où on les croise | Lecture de fichier ([`fs.createReadStream()`](https://nodejs.org/api/fs.html)), réponse HTTP Express (`res`) | Corps d'une réponse [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone) (`response.body`) |
| Style d'API | Événements (`on("data", ...)`) ou `.pipe()` | Un "lecteur" obtenu via `.getReader()`, consommé avec `await` |

## Faire communiquer les deux : un adaptateur manuel

Un même programme peut avoir besoin des deux à la fois : par exemple, relayer le corps d'une réponse `fetch()` (un `ReadableStream`, standard Web) vers une réponse HTTP Express (`res`, qui attend un flux Node.js classique). Aucune conversion automatique n'existe entre les deux : il faut lire le `ReadableStream` manuellement et réémettre chaque morceau dans un `Readable` Node.js.

```js
import { Readable } from "node:stream";

async function relayerVersReponseExpress(reponseFetch, res) {
    const lecteur = reponseFetch.body.getReader();  // "lecteur" du ReadableStream (Web)

    const flux = new Readable({
        // appelée à chaque fois que .pipe() a besoin d'un morceau de plus
        async read() {
            const { done, value } = await lecteur.read();
            if (done) {
                this.push(null);   // signale la fin du flux Node.js
            } else {
                this.push(value);  // relaie le morceau, sans jamais le stocker en entier
            }
        },
    });

    flux.pipe(res);  // branche le flux Node.js adapté sur la réponse Express
}
```

> **Piège :** oublier que `read()` d'un `ReadableStream` est asynchrone (`await`) : appeler `lecteur.read()` sans l'attendre renverrait une Promise non résolue au lieu du morceau de donnée réel.
>
> **Bonne pratique :** garder cet adaptateur générique (il ne fait que copier des morceaux d'un format vers l'autre, sans jamais lire leur contenu) pour le réutiliser partout où un `ReadableStream` doit alimenter une API qui attend un flux Node.js.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un stream traite une donnée morceau par morceau plutôt qu'en un seul bloc, sans jamais devoir la charger entièrement en mémoire. Deux implémentations coexistent en JavaScript : les Node.js Streams (historiques, côté serveur) et les Web Streams (standard du navigateur, aussi utilisés par `fetch()`). |
| **Outils utilisables** | `stream.Readable`/`Writable` et `.pipe()` côté Node.js ; `ReadableStream`/`getReader()` côté Web/`fetch()`. |
| **Pièges à éviter** | Charger un contenu volumineux entièrement en mémoire alors qu'il ne fait que transiter. Appeler `read()` d'un `ReadableStream` sans l'attendre. |
| **Bonnes pratiques** | Traiter en stream toute donnée qui ne fait que transiter. Écrire un adaptateur générique et réutilisable entre les deux implémentations plutôt qu'un cas par cas. |
