---
order: 15
---

# La Web Speech API : reconnaissance et synthèse vocales dans le navigateur

La **Web Speech API** est une API du **navigateur lui-même** (pas une bibliothèque tierce à installer) : elle expose directement en JavaScript la **reconnaissance vocale** (transformer une voix captée par le micro en texte) et la **synthèse vocale** (transformer un texte en voix), sans passer par un service externe.

| | Reconnaissance vocale | Synthèse vocale |
|---|---|---|
| Rôle | Voix → texte | Texte → voix |
| Interface JavaScript | `SpeechRecognition` (`webkitSpeechRecognition` sur certains navigateurs) | `speechSynthesis` |
| Exemple d'usage | Saisir une recherche à la voix | Lire un texte à voix haute (l'audio de lecture de ce site, par exemple, s'appuie sur `speechSynthesis` en repli) |

## La reconnaissance vocale : un modèle événementiel

Contrairement au [modèle par Promise vu dans la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone), la reconnaissance vocale ne renvoie pas un résultat unique attendu avec `await` : elle déclenche des **événements**, potentiellement plusieurs fois, au fil de ce qu'elle capte.

```javascript
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!Recognition) {
    // Repli obligatoire : l'API n'existe pas sur ce navigateur
    afficherRechercheClassique();
} else {
    const reconnaissance = new Recognition();
    reconnaissance.lang = "fr-FR";

    reconnaissance.onresult = (evenement) => {
        const texte = evenement.results[0][0].transcript;
        lancerRecherche(texte);
    };

    reconnaissance.onerror = (evenement) => {
        console.log("Erreur de reconnaissance :", evenement.error);
        afficherRechercheClassique();   // repli en cas d'echec (micro refuse, etc.)
    };

    reconnaissance.start();
}
```

| Callback | Déclenché quand |
|---|---|
| `onresult` | Un résultat (texte transcrit) est disponible |
| `onerror` | Une erreur survient (micro refusé, réseau, langue non supportée...) |
| `onend` | La session d'écoute se termine, avec ou sans résultat |

## La synthèse vocale : une file d'attente d'énoncés

```javascript
const enonce = new SpeechSynthesisUtterance("Bonjour, ceci est un test.");
enonce.lang = "fr-FR";
enonce.rate = 1.2;   // vitesse de lecture

speechSynthesis.speak(enonce);   // ajoute l'enonce a la file d'attente et la lit
```

`speechSynthesis.speak()` empile l'énoncé dans une **file d'attente** interne au navigateur : appeler `speak()` plusieurs fois de suite ne les lit pas en même temps, mais les uns après les autres.

## Support navigateur inégal

> **Piège :** utiliser `SpeechRecognition` sans vérifier sa présence (`window.SpeechRecognition || window.webkitSpeechRecognition`). Certains navigateurs n'exposent l'API que sous le nom préfixé `webkitSpeechRecognition`, d'autres ne l'exposent pas du tout : sans vérification, le script plante silencieusement (`undefined is not a constructor`) sur les navigateurs non supportés.
>
> **Bonne pratique :** toujours vérifier la présence de l'API avant de l'utiliser, et prévoir un repli fonctionnel (un champ de recherche texte classique) plutôt que de rendre la fonctionnalité vocale obligatoire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La Web Speech API expose reconnaissance (`SpeechRecognition`) et synthèse (`speechSynthesis`) vocales directement dans le navigateur. La reconnaissance fonctionne par événements (`onresult`, `onerror`), pas par Promise. |
| **Outils utilisables** | `SpeechRecognition`/`webkitSpeechRecognition`, `SpeechSynthesisUtterance`, `speechSynthesis.speak()`. |
| **Pièges à éviter** | Utiliser l'API sans vérifier sa présence (préfixe `webkit`, ou absence totale sur certains navigateurs) ; ignorer `onerror`. |
| **Bonnes pratiques** | Toujours prévoir un repli fonctionnel si l'API est absente ou échoue ; gérer explicitement `onerror`, pas seulement le cas de succès. |
