---
order: 7
---

# Le NPS : mesurer la satisfaction et la fidélité client

Le **NPS** (*Net Promoter Score*) est une métrique de satisfaction client largement utilisée, bien au-delà de la tech (support, service après-vente, expérience produit) : un exemple concret de mesure quantitative qui peut alimenter un [Key Result](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=okr) ("faire passer le NPS de 20 à 40", par exemple).

## Le principe : une seule question, notée de 0 à 10

Le NPS repose sur une seule question, posée après une interaction avec un service : *"Recommanderiez-vous ce service à un collègue ou un ami ?"*, notée de 0 (pas du tout) à 10 (tout à fait).

| Note | Catégorie | Compte dans le total ? | Compte au numérateur ? |
|---|---|---|---|
| 0 à 6 | Détracteurs | Oui | Oui (négativement) |
| 7 ou 8 | Neutres | Oui | Non |
| 9 ou 10 | Promoteurs | Oui | Oui (positivement) |

```javascript
function calculerNps(notes) {   // notes : tableau d'entiers de 0 a 10, une note par repondant
    const total = notes.length;
    const detracteurs = notes.filter(note => note <= 6).length;
    const promoteurs = notes.filter(note => note >= 9).length;
    // les neutres (7-8) comptent dans "total", mais jamais au numerateur
    return ((promoteurs - detracteurs) / total) * 100;
}
```

Le résultat est toujours compris entre -100 (tous détracteurs) et +100 (tous promoteurs).

> **Piège :** comparer le NPS brut de deux entreprises de secteurs différents sans tenir compte des normes du secteur : le NPS moyen varie énormément d'un secteur à l'autre (un NPS de 30 peut être excellent dans un secteur, médiocre dans un autre).
>
> **Bonne pratique :** suivre l'évolution du NPS d'un même service dans le temps (avant/après un changement précis), plutôt que de le comparer brutalement à celui d'une entreprise d'un autre secteur.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le NPS mesure la satisfaction/fidélité client à partir d'une seule question notée de 0 à 10 : `(% promoteurs [9-10] − % détracteurs [0-6]) × 100`, les neutres [7-8] comptant dans le total sans influencer le résultat. |
| **Outils utilisables** | Une seule question standardisée, posée après une interaction avec le service ; le calcul peut être automatisé (`calculerNps()` ci-dessus). |
| **Pièges à éviter** | Comparer un NPS brut entre secteurs différents sans tenir compte des normes propres à chaque secteur. |
| **Bonnes pratiques** | Suivre l'évolution du NPS d'un même service dans le temps plutôt qu'une comparaison intersectorielle brute. |
