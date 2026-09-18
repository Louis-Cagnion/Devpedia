---
order: 17
---

# Intercepter un setter de propriété native : `Object.defineProperty`

Le [chapitre précédent](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence) note une limite de `MutationObserver` : écrire `monSelect.value = "x"` ne déclenche aucune mutation détectable, puisque ça ne touche ni un attribut HTML ni la structure du DOM. Ce chapitre couvre la technique qui permet malgré tout de réagir à ce genre d'écriture : **redéfinir le setter** de la propriété elle-même.

## Le problème concret

Un composant "select personnalisé" (un `<select>` natif caché, remplacé visuellement par un menu déroulant maison) doit garder son affichage synchronisé avec la valeur réelle du `<select>`. Le problème : cette valeur peut être modifiée depuis n'importe quel code existant du projet (`select.value = "x"`), sans qu'aucun de ces appelants n'ait besoin d'être modifié pour prévenir le composant.

```text
Code existant, n'importe ou dans le projet :
    monSelect.value = "Renault";
                |
                v
    Aucun evenement 'change' declenche (ce n'est pas une action utilisateur)
    Aucune mutation DOM detectable (ni attribut, ni structure)
                |
                v
    L'affichage du menu deroulant maison reste desynchronise
```

## La solution : redéfinir le setter, garder le getter natif

`Object.defineProperty()` permet de remplacer le getter et/ou le setter d'une propriété existante par une fonction personnalisée. Ici, seul le setter a besoin d'être intercepté ; le getter natif est conservé tel quel :

```javascript
// Recupere le getter/setter natifs AVANT de les remplacer, pour pouvoir les rappeler ensuite
const proprieteNative = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

Object.defineProperty(monSelect, 'value', {
    get() {
        return proprieteNative.get.call(monSelect);   // comportement natif inchange
    },
    set(nouvelleValeur) {
        proprieteNative.set.call(monSelect, nouvelleValeur);   // ecrit reellement la valeur
        synchroniserAffichage();                                // + declenche la synchro
    },
    configurable: true,
});
```

`Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')` récupère le getter/setter natifs de `<select>` **avant** de les écraser : sans cette étape, le nouveau setter n'aurait aucun moyen d'écrire réellement la valeur, seulement de réagir à son changement.

> **Piège :** oublier `configurable: true`. Sans cette option, `Object.defineProperty()` rend la propriété définitivement figée : impossible de la redéfinir une seconde fois (par exemple pour un test, ou un autre composant qui voudrait faire la même chose), et une tentative lève une erreur.

## Portée de l'interception

Cette technique redéfinit la propriété sur **une instance précise** (`monSelect`), pas sur `HTMLSelectElement.prototype` : tous les autres `<select>` de la page gardent leur comportement natif inchangé, seul celui explicitement transformé en composant personnalisé est concerné.

> **Bonne pratique :** toujours cibler l'instance précise plutôt que le prototype partagé (`HTMLSelectElement.prototype`) pour ce genre d'interception. Modifier le prototype changerait le comportement de **tous** les `<select>` de la page, y compris ceux qui n'ont rien à voir avec le composant concerné.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `Object.defineProperty()` remplace le getter/setter d'une propriété existante, ce qui permet de réagir à une écriture qu'un `MutationObserver` ne peut pas détecter (une propriété JS assignée directement, sans passer par un attribut HTML). |
| **Outils utilisables** | `Object.defineProperty()`, `Object.getOwnPropertyDescriptor()` pour conserver le comportement natif avant de le remplacer. |
| **Pièges à éviter** | Oublier `configurable: true` (rend la propriété impossible à redéfinir ensuite). Modifier le prototype partagé plutôt qu'une instance précise. |
| **Bonnes pratiques** | Toujours récupérer le descripteur natif avant de le remplacer, pour pouvoir encore écrire la vraie valeur depuis le nouveau setter. Cibler l'instance, jamais le prototype partagé, pour une interception localisée à un seul élément. |
