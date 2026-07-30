# TODO — Refactor dark mode Devpedia

## ✅ Fait (session précédente)
- [x] Classes CSS stables ajoutées dans `parser.js` et `router.js` (`.page`, `.pageTitle`, `.content-list`, `.returnButton`, `.childList`, `.childButton`)
- [x] `init.css` : reset global, scrollbar custom, focus-visible
- [x] `base.css` : nouvelle palette dark (variables `--bg`, `--text`, `--accent`, etc.), navbar, listes, boutons
- [x] `responsive.css` : menu mobile, grille `.childList`

## ✅ Vérifié / testé (session précédente)
- [x] Rechargé le site et vérifié visuellement toutes les pages (accueil, catégorie, sujet, chapitre) — RAS sur le rendu
- [x] `.acceuilDiv` : confirmé qu'elle ne sert plus au style (remplacée par `.page`). Reste générée dynamiquement (`${pageId}Div`) comme identifiant technique utilisé par `clearCurrentPage` — comportement voulu
- [x] Menu burger mobile testé (`.menuDiv.visible`, `.NavBarButton`) : fonctionne bien, se ferme au clic sur une catégorie
- [x] Contraste `--text-muted` sur `--bg-elevated` calculé : ratio ~5.44:1, conforme WCAG AA
- [x] Breakpoints responsive testés à plusieurs largeurs (500px, 770px, 1200px, 1500px, 1600px)
- [x] Recherche de couleurs codées en dur : trouvé et corrigé

## ✅ Nettoyage
- [x] Supprimé `.burger { display: none; }` dans `base.css` (classe morte)
- [x] Remplacé la couleur dupliquée `rgba(136, 192, 208, 0.25)` par `color-mix(in srgb, var(--accent) 25%, transparent)`
- [x] `${...}Div` / `${...}List` : vérifiés, identifiants dynamiques voulus
- [x] Cohérence des noms de classes JS/CSS vérifiée : RAS

## 🐛 Bugs trouvés et corrigés
- [x] Débordement horizontal de la navbar entre ~851px et ~1300px : `.categories` peut rétrécir/scroller horizontalement en interne
- [x] Blocs de code markdown non parsés : support des fences ajouté dans `parser.js` + coloration via `highlight.js` (thème `vs2015`, vendorisé localement)
- [x] Titres de chapitres redondants nettoyés dans 24 fichiers `.md`, `struct.json` régénéré
- [x] Bouton "DSL" bascule automatiquement vers l'abréviation quand la place manque (`getShortLabel` dans `nav.js`)

## ✅ Retouches visuelles demandées
- [x] Catégories recentrées dans la navbar
- [x] Fond noir de la coloration syntaxique étendu à tout le bloc `pre`
- [x] Hauteur des boutons de chapitres uniformisée par ligne dans les grilles multi-colonnes

## ✅ Priorisation pédagogique des chapitres
- [x] Champ `order` (frontmatter) ajouté sur chaque chapitre pour Bash, Git, CSS, HTML, C, C++, JavaScript, PHP, Python
- [x] `generate-struct.js` trie par `order`, repli sur l'ordre alphabétique sinon

## ✅ Simplification du système de titres
- [x] `title:` en frontmatter supprimé, remplacé par `# Titre` markdown classique
- [x] `parser.js` et `generate-struct.js` simplifiés (un seul mécanisme : headings markdown)
- [x] Migration automatisée sur 125 fichiers `.md`
- [x] Support des titres `##`-`#####` inline dans le corps du texte
- [x] Support des citations markdown `> texte` (98 fichiers concernés)
- [x] Règle ajoutée à `/best-practice` pour repérer ce type de double-mécanisme redondant

## ✅ Relecture orthographique
- [x] Tout le contenu `.md` relu (5 passes en parallèle par domaine) ; ~20 fautes corrigées

## ✅ Sidebars de navigation
- [x] Sidebar gauche (desktop, ≥1100px) : arborescence catégories → sujets → chapitres, repliable, onglet "Introduction"
- [x] Sidebar droite (desktop) : sommaire "Sur cette page", cliquable avec ancres
- [x] Menu burger mobile : arborescence + sommaire de page dans un seul bouton
- [x] Navbar pleine largeur, sidebars sous la navbar (`--navbar-height` dynamique)
- [x] Catégorie/chapitre courant mis en surbrillance dans les deux sidebars et le menu mobile
- [x] Repère visuel (bordure verticale) sous chaque catégorie ouverte
- [x] Nouveaux fichiers/rôles : `js/sidebar.js`, `router.js` expose `navigateToSubject`/`navigateToChapter`/`findSubject`

## ✅ Recherche + repli de sidebar
- [x] Barre de recherche fonctionnelle (`js/search.js`) : titres catégories/sujets/chapitres, insensible aux accents, résultats avec contexte
- [x] Cliquer sur une catégorie/sujet déjà ouvert(e) la replie sans changer de page

## ✅ Traduction automatique multilingue
- [x] Script `scripts/translate-content.mjs` : traduit `content/` vers `content-<lang>/` via l'API DeepL, uniquement le langage naturel (commentaires de code selon le langage, jamais le code lui-même)
  - Détection de commentaires par langage, évite les faux positifs dans les chaînes
  - Spans code/gras/italique convertis en balises XML pour DeepL (`tag_handling: xml`, `ignore_tags: code`)
  - Cache par hash de contenu, traduction incrémentale
  - Génère aussi `structure/struct-<lang>.json` et `structure/languages.json`
  - Gère les erreurs 429 (rate limit) avec réessai/backoff
  - Nécessite un `.env` local (`DEEPL_API_KEY=...`)
- [x] Bouton "Langue" dans la navbar (`js/lang.js`), choix mémorisé (`localStorage`)
- [x] `router.js`/`utils.js` : routes via `getContentDir()`, `folder` (réel) séparé de `label` (traduit)
- [x] Anglais traduit et testé de bout en bout (`content-en/`, 125 fichiers)
- [x] Bug corrigé : span de code contenant littéralement `*` cassait le rendu italique/gras
- [x] Titres mal désambiguïsés par DeepL corrigés à la main pour l'anglais ; paramètre `context` ajouté à l'API
- [x] Espagnol et portugais brésilien traduits par l'utilisateur (`content-es/`, `content-pt/`)

## 🔄 Chantier en cours — strings de code, glossaire de variables, nouvelles langues (démarré, non terminé)

Découpage validé, à faire étape par étape (prévenir à chaque étape terminée) :

1. [x] **Finaliser la gestion des strings dans le code** (`translate-content.mjs`)
   - Variables Bash (`$var`, `${var}`, `$(commande)`) exclues de la traduction à l'intérieur des chaînes (double guillemets uniquement, simple guillemet n'interpole pas)
   - Template literals JS multi-lignes (`` ` `` ouvert sur une ligne, fermé plus loin) désormais détectés — avant, le texte français à l'intérieur n'était jamais traduit
   - Testé sur `strings.md`, comportement confirmé correct
2. [x] **Formatter le texte**
   - [x] Tableaux markdown convertis en vraies balises `<table>` (`js/parser.js` : détection ligne d'en-tête + ligne de séparation `|---|---|`, alignement via `:--:`/`--:`/`:--`), stylées dans `base.css`, enveloppées dans `.tableWrapper` pour le scroll horizontal
   - [x] Bug d'affichage "(`date`)" corrigé : le parser gère maintenant l'échappement backslash (`` \` ``, `\*`...) et les spans de code double-backtick (`` `` `code` `` ``) qui peuvent contenir un backtick littéral — testé et confirmé sur `variables.md`
   - [x] Lignes vides désormais préservées à l'intérieur des blocs de code (le filtrage des lignes vides est maintenant conscient de l'état "dans un bloc ```") — testé sur `fonctions.md`
   - Suggestion d'utiliser la fonction de parsing markdown d'un autre repo (libft/JS) non explorée cette fois-ci (repo non accessible depuis cette machine) ; le parser existant a été corrigé/étendu directement à la place
3. [x] **Glossaire de noms de variables** (empêcher DeepL de mal traduire les identifiants)
   - Portée choisie par l'utilisateur : glossaire ciblé sur les noms récurrents (nom, valeur, fichier, erreur, tableau, résultat, utilisateur, etc.)
   - `scripts/build-variable-glossary.mjs` créé et exécuté → génère `scripts/variable-glossary.json` (FR → 9 langues : en, es, pt, de, ru, zh, ar, id, ja)
   - `scripts/fix-variable-glossary.mjs` : vérifié que le script s'était bien terminé — `variable-glossary.json` est complet et correct pour toutes les entrées (plus aucun mot laissé non traduit)
   - **Intégré dans `translate-content.mjs`** :
     - Les identifiants correspondant à une entrée du glossaire (comparaison insensible aux accents, puisque le vrai code n'a pas d'identifiants accentués — `âge` en JSON matche `age` dans le code) sont renommés vers la langue cible, aussi bien dans les blocs de code que dans les spans `` `code` `` isolés en prose
     - Les références interpolées à l'intérieur d'une chaîne bash (`"Bonjour $nom"`, `"${nom}"`) sont renommées en cohérence avec la déclaration correspondante (`nom="Jean"` → `name="Jean"` **et** `$nom` → `$name`), sans toucher au texte naturel de la chaîne (toujours traduit par DeepL séparément)
     - Testé sur un jeu de lignes représentatif (déclaration, interpolation simple `$var`/`${var}`, ligne 100% code sans chaîne, commentaire) : comportement confirmé correct
   - Suggestion d'utiliser la fonction de parsing markdown d'un repo externe (libft/JS) non retenue pour l'instant (voir échange en session) — pas nécessaire tant qu'aucun autre bug de rendu ne justifie une réécriture complète du parser
   - Reste (point 4 ci-dessous) : les traductions déjà générées (EN, ES, PT) ont été produites AVANT cette intégration et contiennent donc encore les identifiants français dans leur code — un nouveau run de `translate-content.mjs` sur ces 3 langues appliquera le glossaire (le cache de traduction ne re-traduira que si le fichier source a changé, donc forcer une invalidation du cache ou un run ciblé sera nécessaire)
4. [x] Vérifier/corriger le code déjà traduit (EN, ES, PT)
   - **Aucun appel DeepL nécessaire** : créé `scripts/apply-variable-glossary.mjs`, qui réutilise `segmentBody()` de `translate-content.mjs` pour ré-appliquer le glossaire sur des fichiers déjà traduits, sans jamais rappeler l'API (quota préservé)
   - Exécuté sur `content-en`, `content-es`, `content-pt` (73-79 fichiers modifiés par langue selon les cas)
   - **Bugs trouvés et corrigés en cours de route** (via revue par agent + vérifications manuelles) :
     - Les blocs de code **sans langage déclaré** (` ``` ` nu) ne permettaient pas d'isoler les commentaires du code ; le glossaire pouvait donc corrompre des mots français ordinaires à l'intérieur de commentaires en clair (ex: "chaîne" → "string" dans un commentaire narratif). Corrigé en désactivant le glossaire pour ces blocs (`translate-content.mjs`)
     - `LINE_COMMENT_MARKERS` ne reconnaissait qu'un seul marqueur par langage (`//` pour PHP) alors que PHP accepte aussi `#` ; un commentaire PHP en `#` n'était donc pas isolé et se faisait partiellement traduire par le glossaire. Corrigé : chaque langage peut désormais avoir plusieurs marqueurs (ajout aussi de `sql: ["--"]`, absent jusque-là)
     - Entrée `modele` du glossaire mal traduite (EN "example" au lieu de "model", idem DE/ZH/ID/JA) — héritage du script de traduction du glossaire lui-même ; corrigée directement dans `variable-glossary.json`
     - Perte de la casse lors du renommage (`NOM` → `name` au lieu de `NAME`, cassant la convention des constantes PHP) ; corrigé avec une fonction `matchCase` qui préserve MAJUSCULES/Capitalisé
     - Ambiguïté ponctuelle non généralisable : `` `Shift+Entrée` `` (touche clavier) renommé en `` `Shift+Input` `` par le glossaire (qui traduit "entrée" → "input" dans le sens donnée) ; corrigé à la main pour cette occurrence précise (risque résiduel pour d'autres homonymes du même type, non détecté ailleurs par la revue)
   - **Chapitre C retaggé (option a choisie) :** les 170 blocs de code sans tag de langage du chapitre C (16 fichiers) ont été classés (`c`, `bash` ou `makefile` selon leur contenu réel, diagrammes ASCII laissés sans tag) et retaggés **uniquement dans `content-en`/`content-es`/`content-pt`** (le source `content/` FR n'est pas touché, donc aucun coût de quota, ni maintenant ni pour les futures langues). Le glossaire a ensuite été réappliqué : code et prose disent maintenant la même chose (ex: "compteur"/"counter" cohérent partout)
   - **Nouveaux bugs trouvés et corrigés pendant cette passe** :
     - `LINE_COMMENT_MARKERS` ne connaissait pas `makefile` → ajouté (`#`)
     - `bibliotheques.md` : deux blocs tagués `bash` utilisent en réalité des commentaires en style `//` (non standard en bash) → corrompait 2 commentaires FR dans les 3 langues ; corrigés à la main (le marqueur `bash` reste `#` uniquement, ce cas isolé ne justifie pas un changement global)
     - `tables-de-hachage.md` (EN uniquement) : le struct `Entree` (= une entrée de table de hachage) a été renommé `Input` au lieu de `Entry` — nouvelle ambiguïté du mot « entrée » (déjà vu avec "Shift+Entrée"), corrigée à la main. ES/PT n'ont pas ce problème : « entrada » couvre naturellement les deux sens dans ces langues
     - `fonctions-variadiques.md` (EN/ES/PT) : un commentaire déjà traduit citait l'ancien nom du paramètre entre guillemets (`"nombre"`) resté obsolète après le renommage en `number`/`número` ; corrigé à la main dans les 3 langues
   - Chaque étape validée par une revue de diff dédiée (agent) + vérifications manuelles ciblées avant de considérer le point clos
5. [ ] Langues encore manquantes à traduire : allemand (de), russe (ru), chinois simplifié (zh), arabe (ar), indonésien (id), japonais (ja) — bloqué par le quota DeepL restant (cf. section "Reste à faire")
6. [x] Adapter l'affichage/sélecteur de langue pour les écritures non-latines (arabe RTL, chinois/japonais CJK)
   - `js/lang.js` : nouvelle fonction `applyDocumentLanguage(langCode)`, appelée au démarrage (`nav.js`) — pose `<html lang>` et `<html dir="rtl">` (uniquement pour `ar`, seule langue RTL prévue parmi les 6 à venir)
   - CSS : toutes les propriétés physiques directionnelles (`padding-left/right`, `margin-left/right`, `border-left/right`, `text-align: left`) converties en propriétés logiques (`padding-inline-start`, `border-inline-start`, `text-align: start`, etc.) dans `base.css`/`responsive.css` — se retournent automatiquement selon `dir`, sans règles `[dir="rtl"]` dupliquées
   - Bug trouvé en testant (simulation `document.dir = "rtl"` en console, aucune langue RTL n'existe encore réellement) : les blocs de code suivaient aussi le sens RTL, ce qui est faux (le code doit toujours se lire de gauche à droite). Corrigé : `code`/`pre` forcés en `direction: ltr` — comportement standard (GitHub, MDN en arabe font pareil)
   - Flèche du bouton "Retour" rendue dynamique (`←`/`→` selon `dir`) dans `router.js`
   - CJK (zh/ja) : aucun changement nécessaire, les navigateurs gèrent nativement la casse/le retour à la ligne CJK avec `font-family: sans-serif`
   - Sidebars gauche/droite : **pas** de bascule physique de position (rester "arborescence à gauche / sommaire à droite" même en RTL) — décision volontaire pour limiter la portée, seuls le texte/bordures/listes sont mirroités
7. [x] Bouton de langue explicite : `🌐 <langue actuelle>` + `title="Language / Langue"` (`js/lang.js`). Le changement de langue par défaut (EN plutôt que FR) n'a pas été fait — décision produit à part, pas juste un changement d'affichage
8. [x] Changement de langue sans perte de page : `router.js` expose `rememberCurrentPageForLanguageSwitch()` (appelé juste avant le `location.reload()` dans `lang.js`, sauvegarde catégorie/sujet/page courants dans `sessionStorage`) et `resumePendingNavigation()` (appelé au démarrage à la place de `loadCategory('acceuil')`, restaure la page dans la nouvelle langue via les mêmes ids — `folder`/id ne sont jamais traduits, seul `label` l'est). Testé : bascule FR → EN depuis "Bash > Les conditions" reste bien sur "Conditions" traduit
9. [x] Navbar rendue `position: sticky; top: 0;` (`base.css`) ; menu mobile (`.menuDiv.visible`) passé en `position: fixed` ancré à `top: var(--navbar-height)` pour rester correctement positionné sous la navbar sticky même après un scroll (`responsive.css`)
   - Non testé en conditions réelles à largeur mobile : le redimensionnement fiable de la fenêtre Chrome reste impossible sur cette machine (limitation déjà connue, cf. section "Reste à faire" plus bas) ; changement vérifié par lecture de code uniquement pour cette partie

## 🔲 Reste à faire / pistes non traitées
- [x] `git` installé et ajouté au PATH utilisateur Windows (MinGit portable, `%LOCALAPPDATA%\Programs\MinGit`, sans droits admin — winget avait une source cassée nécessitant un accès admin pour la réparer). **Nécessite un nouveau terminal/redémarrage de session pour être visible** : le changement de PATH est bien persisté dans le registre, mais les processus déjà lancés (dont cette session en cours) gardent leur environnement figé
- [ ] Nouvelle section de contenu dédiée aux **lignes de commande** (regrouper Bash, `sh`, PowerShell, et tout ce qui s'y apparente) — actuellement Bash a sa propre catégorie isolée ; l'utilisateur souhaite en particulier une partie sur PowerShell
- [ ] highlight.js figé en 11.9.0, vendorisé localement ; penser à mettre à jour de temps en temps
- [ ] Mode mobile testé par intermittence (CSS injecté + redimensionnement de fenêtre) faute de pouvoir redimensionner Chrome de façon fiable ; un test manuel sur un vrai téléphone reste utile
- [ ] Réseau de la machine avec inspection TLS d'entreprise (Cato Networks) : scripts Node appelant une API externe nécessitent `NODE_EXTRA_CA_CERTS` pointant vers un bundle avec le certificat racine Cato Networks, sans quoi `fetch` échoue avec `SELF_SIGNED_CERT_IN_CHAIN`
- [ ] Quota DeepL API Free (1M caractères, crédit unique non renouvelable) partiellement consommé (EN + ES + PT) ; à surveiller avant de traduire les 6 langues suivantes
- [ ] L'UI de la sidebar elle-même ("Catégories", "Sur cette page", "Introduction", "Rechercher...") reste en français quelle que soit la langue choisie — seul le contenu est traduit

## 📖 Notions à expliquer / documenter (repérées en lisant les fichiers)
- [x] POSIX — défini dans une nouvelle section "`sh` vs `bash`" (`scripts-et-shebang.md`)
- [x] Différence entre `sh` et `bash` — partie complète ajoutée dans `scripts-et-shebang.md`
- [x] Contexte arithmétique explicite en Bash — encart explicatif ajouté dans `variables.md`
- [x] Tableau des variables spéciales déplacé dans `scripts-et-shebang.md`, juste après l'exemple des arguments d'un script (`variables.md` renvoie vers ce chapitre, plus de doublon)
- [x] Définition d'Unix ajoutée en intro de `scripts-et-shebang.md` (premier chapitre du domaine)
- [x] Fonctionnement de `sed` détaillé (notion d'adresse/commande, `-n`/`p`, pourquoi `g`) dans `traitement-de-texte.md`
- [x] `fg`/`bg` (foreground/background) et convention des abréviations de drapeaux expliqués dans `gestion-des-processus.md` et `traitement-de-texte.md`
- [x] Distinction `kill` vs `pkill` et `grep` vs `pgrep` ajoutée (encarts dans `gestion-des-processus.md` et `traitement-de-texte.md`)