---
order: 5
---

# Les traitements longs

Passé quelques minutes d'exécution, un programme change de nature. Ce n'est plus une commande qu'on lance et dont on voit le résultat : c'est un traitement qui peut être interrompu, qu'il faut pouvoir surveiller, et dont un échec coûte cher. À cette échelle, la robustesse devient une question de performance — reprendre un travail de 20 minutes est un gain bien plus grand que d'en gratter 10 %.

## Sauvegarder au fur et à mesure

Un programme qui accumule ses résultats en mémoire et n'écrit qu'à la fin perd **tout** en cas de coupure : plantage, réseau, mise en veille de la machine. Écrire chaque résultat dès qu'il est obtenu change complètement le comportement en cas d'incident.

Le format le plus simple pour cela est le **JSON Lines** : un objet JSON complet par ligne. Contrairement à un tableau JSON, il n'a pas besoin d'être refermé pour rester lisible — un fichier tronqué en plein milieu reste exploitable jusqu'à sa dernière ligne complète.

```python
class EtatDAvancement:
    def __init__(self, chemin, reprise=False):
        self.chemin = Path(f"{chemin}.partiel")
        self.resultats = []
        if reprise and self.chemin.exists():
            self.resultats = [json.loads(ligne) for ligne
                              in self.chemin.read_text(encoding="utf-8").splitlines() if ligne.strip()]
        else:
            self.chemin.unlink(missing_ok=True)
        self.faits = {cle(r) for r in self.resultats}

    def ajouter(self, resultat):
        self.resultats.append(resultat)
        self.faits.add(cle(resultat))
        with self.chemin.open("a", encoding="utf-8") as f:
            f.write(json.dumps(resultat, ensure_ascii=False) + "\n")
```

La boucle principale saute alors ce qui est déjà fait :

```python
restant = [t for t in taches if not etat.est_fait(t)]
```

Deux détails qui font la différence à l'usage :

- **Filtrer avant de compter.** Si l'on saute des éléments à l'intérieur de la boucle, les compteurs de progression et l'estimation de fin deviennent faux (ils incluent du travail qui n'a rien coûté). Calculer d'abord la liste de ce qui reste rend les deux exacts.
- **Séparer l'état du livrable.** Ce fichier est de la mécanique interne, pas un résultat : lui donner un nom explicite (`.partiel`) et le supprimer à la fin évite qu'on le prenne pour la sortie. Le garder distinct du livrable évite aussi qu'un outil externe (un tableur, par exemple) le réenregistre dans un format qui casserait la reprise.

## Donner à voir l'avancement

Un traitement de 20 minutes sans affichage est indiscernable d'un programme bloqué. Afficher l'avancement et une estimation du temps restant coûte quelques lignes :

```python
def temps_restant(debut, faits, total):
    if faits < 2:                      # pas encore de cadence mesurable
        return ""
    restant = (time.monotonic() - debut) / faits * (total - faits)
    return f" ~{int(restant)}s restantes" if restant < 90 else f" ~{round(restant / 60)} min restantes"
```

Utilisez `time.monotonic()` et non `time.time()` : le second peut reculer (synchronisation d'horloge, changement d'heure) et produire des durées négatives.

## Ne jamais réussir à moitié en silence

C'est le point le plus important, et le plus facile à rater. Un traitement long échoue rarement d'un bloc : il échoue **partiellement**. Une page sur cinquante ne se charge pas, un élément manque. Si le programme se contente de continuer, il produit un résultat incomplet qui a toutes les apparences d'un résultat complet.

Le réflexe dangereux est le `break` ou le `except` silencieux :

```python
try:
    charger_la_suite()
except Timeout:
    break              # on sort avec des donnees partielles, sans rien signaler
```

Le correctif n'est pas d'empêcher l'échec — c'est impossible — mais de garantir qu'il soit **visible**. La méthode la plus fiable est de vérifier un **invariant** à la fin — une propriété qui doit toujours être vraie à ce point du programme, quel que soit le chemin emprunté pour y arriver (ici : "le nombre d'éléments obtenus correspond au nombre annoncé") — indépendamment de la raison de l'échec :

```python
if total_annonce is not None and len(charge) < total_annonce:
    marquer_incomplet(f"{len(charge)} elements sur {total_annonce} annonces")
```

Cette vérification attrape tous les cas, y compris ceux qu'on n'avait pas prévus (changement de mise en page du site, lenteur inhabituelle). Elle repose sur un principe simple : le programme sait souvent **combien** il devrait obtenir. Comparer l'obtenu à l'attendu est presque toujours possible, et c'est ce qui distingue un résultat fiable d'un résultat plausible.

> Sur un traitement de plusieurs centaines d'unités, un statut explicite du type `INCOMPLET` est plus utile qu'une exception : il préserve les données déjà collectées tout en signalant qu'elles sont à reprendre. Ce qui est inacceptable, c'est le troisième cas : incomplet et classé `OK`.

## Vérifier le contenu produit, pas le code de retour

Les deux bugs les plus sérieux que j'ai rencontrés sur ce genre de programme sortaient tous les deux avec un **code de retour 0** : une extraction incomplète classée comme correcte, et un rapport final entièrement vide après fusion de résultats parallèles. Aucun test de "est-ce que ça plante ?" ne les aurait vus.

La leçon est directe : pour un traitement long et non surveillé, testez le **contenu** de la sortie (le nombre d'éléments, la présence des sections attendues), pas seulement le fait que le programme se termine.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un traitement de plusieurs minutes doit pouvoir reprendre après une coupure (sauvegarde au fur et à mesure), afficher son avancement, et détecter un échec partiel plutôt que de le masquer silencieusement. |
| **Outils utilisables** | Le format JSON Lines pour une sauvegarde incrémentale résiliente, `time.monotonic()` pour une estimation de durée fiable, une vérification d'invariant en fin de traitement. |
| **Pièges à éviter** | Un `except`/`break` silencieux qui laisse un résultat partiel sans le signaler ; ne vérifier que le code de retour, pas le contenu réel produit. |
| **Bonnes pratiques** | Comparer le nombre d'éléments obtenus au nombre attendu ; séparer le fichier d'état interne (`.partiel`) du livrable final. |
