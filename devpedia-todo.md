# TODO — Devpedia

## Reste à faire

### Traductions ES/PT à rattraper (EN désormais complet, 2026-08-10)
- Le quota DeepL (1M caractères, "abonnement à vie" — probablement non renouvelable, à vérifier sur le compte) est épuisé : la traduction EN a été terminée **manuellement** (sans l'API) pour les ~130 fichiers restants, catégorie par catégorie.
- ES et PT n'ont pas bénéficié de ce rattrapage manuel : ils n'ont toujours que l'ancien sous-ensemble (le site d'avant la réécriture zéro-connaissance). Les catégories Bases de l'informatique, Performance, Représentation des données, IA (en grande partie), Data Science, Qualité et architecture du code, Mathématiques, Infrastructure, UI-UX, Docker, ainsi que Shells/Bash, PowerShell et Zsh, restent à traduire pour ces deux langues — soit à la main (comme EN), soit via `translate-content.mjs` si le quota redevient disponible.
- 6 langues manquantes en plus d'ES/PT : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Bug découvert en validant les liens internes de la version anglaise : le pipeline DeepL traduit parfois par erreur des morceaux d'URL à l'intérieur d'un lien Markdown (`?c=bases-de-l-informatique` devenu `?c=computer-basics`), cassant la navigation sans erreur visible. Corrigé ponctuellement pour EN (script de repli comparant aux liens du fichier français correspondant), mais le bug lui-même reste dans `translate-content.mjs` — à corriger avant de refaire tourner l'API sur ES/PT (protéger la portion `(...)` d'un lien Markdown comme les spans `` `code` `` le sont déjà), sous peine de devoir refaire le même correctif après coup.
- L'UI de la sidebar elle-même ("Catégories", "Sur cette page", "Rechercher...") reste en français quelle que soit la langue choisie — seul le contenu est traduit.
- À vérifier au passage : comportement du sélecteur de langue sur une page qui n'existe pas encore dans la langue cible, la page non existente doit afficher par defaut le message "cette page n'existe pas" dans la langue choisie, et doit rediriger sur la page anglaise si elle existe, sinon la page de reference francaise, meme si elle ne sera pas comprehensible pour des etrangers qui ne parlent pas francais.
- Il faudra supprimer le pipeline Deepl, aujourd'hui devenu inutilisable.
- **Restructuration IA (2026-08-13, FR seulement pour l'instant)** : la catégorie IA est passée d'une liste plate à 6 subjects (`Fondamentaux du deep learning`, `NLP et LLM`, `Applications LLM`, `Vision et OCR`, `Voix IA`, `Production et gouvernance`). `content-en/IA/` reste volontairement plat (décision explicite, pas un oubli) : un futur rattrapage EN devra reproduire la même répartition en subjects plutôt que de garder la structure plate. ES/PT n'ont pas encore de dossier IA du tout (comme les 6 autres langues manquantes) : quand cette catégorie sera traduite pour elles, l'écrire directement avec cette structure en subjects, pas à plat.

### Règle 7bis (lien obligatoire pour tout outil/jargon/concept nommé) : audit du reste du site, en cours

Ajoutée le 2026-08-13 dans `prompt.md`, appliquée aux nouveaux chapitres OCR/Voix IA et rétroactivement à toute la catégorie IA (35 fichiers, terminé, corrigé). Le reste du site (~240 fichiers, 19 autres catégories) n'a jamais été audité contre cette règle. Stratégie actée avec Louis : corriger d'abord les liens **internes** (chapitre déjà existant sur le site, juste pas lié à cet endroit) directement, sans demander ; les liens **externes** et les cas qui demandent une vraie décision (créer un chapitre, choisir un lien externe pour un terme mineur) restent listés ci-dessous pour validation avant d'être appliqués. Session interrompue par Louis en plein audit ("arrête-toi là") : reprendre exactement où c'est noté ci-dessous, pas besoin de re-auditer ce qui est déjà listé.

**Déjà audité (2 agents fiables) + corrections déjà appliquées :**
- `Git/architecture-interne.md` : lien Python et lien GitHub (interne) ajoutés.
- `Git/commandes-essentielles.md` : 2 liens GitHub (interne) ajoutés.
- `Shells/Bash/conditions.md`, `fonctions.md` : liens PHP/C (interne, vers leurs chapitres "conditions") ajoutés.
- `Shells/Bash/architecture-dun-shell.md` : 2 liens vers les chapitres C (`processus`, `appels-systeme-et-descripteurs`) ajoutés.

**Corrections internes identifiées, PAS ENCORE appliquées** (prêtes à corriger directement, pas de décision à prendre) :
- `Shells/Bash/redirections-et-pipes.md` : lien manquant vers `/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs` (phrase "voir le chapitre sur les appels système et les descripteurs de fichiers (rubrique C)").
- `Shells/Bash/traitement-de-texte.md`, `gestion-des-processus.md` : "Unix" mentionné sans lien vers `Shells/Bash/scripts-et-shebang.md` (qui l'explique déjà dans une note).
- `Shells/PowerShell/conditions.md`, `fonctions.md` : même motif PHP/C que Bash, jamais corrigé.
- `Shells/PowerShell/ecrire-et-executer-un-script.md` : référence à "un chapitre dédié en PHP" sur les exceptions — **PHP n'a pas de chapitre dédié aux exceptions** (à vérifier : couvert dans `poo.md` ou `structures-de-langage.md` ? sinon, décision à prendre : créer le chapitre, ou reformuler sans le lien).
- `Shells/Zsh/zsh.md` : "POSIX" sans lien vers `Shells/Bash/scripts-et-shebang.md` (qui l'explique).
- `Langages de programmation/C/variables.md` : "Python, JavaScript, PHP" mentionnés sans lien vers leurs chapitres respectifs (contrairement à `c.md` qui le fait systématiquement).
- `Langages de programmation/C++/heritage-et-polymorphisme.md`, `poo.md` (JS), `exceptions.md`, `stl-conteneurs.md` : mentions PHP/Python sans lien (Java reste hors périmètre, voir liens externes ci-dessous ; PHP pour les exceptions a le même problème que PowerShell ci-dessus).
- `Langages de programmation/JavaScript/conditions.md`, `poo.md` : PHP/Python sans lien.
- `Langages de programmation/OCaml/ocaml.md` : la liste "C, C++, PHP, Python, JavaScript" en ouverture, sans lien vers chacun.
- `Langages de programmation/OCaml/inference-de-types.md` : "mypy" → lien interne possible vers `Python/typage-avec-annotations.md` (qui couvre déjà mypy) plutôt qu'externe.
- `Langages de programmation/PHP/methodes.md` : "`Optional[T]` en Python" → lien interne vers `Python/typage-avec-annotations.md`.
- `Langages de programmation/Python/python.md` : "NumPy" → lien interne vers `/?c=data-science&p=numpy` ; "PyTorch" → lien interne vers `/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch` (déjà un chapitre dédié sur le site, actuellement non lié ici).

**Liens externes / décisions en attente de validation avant application :**
- Git : zlib, algorithme de Myers (Git/architecture-interne.md), GitLab (remotes.md, github-et-plateformes.md), Bitbucket (github-et-plateformes.md), Kanban (issues-et-projets-github.md, mineur).
- Bash : `bc` (variables.md). (Linux/Windows/macOS/Unix mentionnés comme contexte ambiant dans plusieurs fichiers, volontairement pas traités comme violations sauf quand un chapitre les explique déjà — voir ci-dessus.)
- PowerShell : .NET Runtime, C# (architecture-dun-shell.md, ecrire-et-executer-un-script.md, powershell.md — aucun chapitre C# sur le site).
- Zsh : powerlevel10k (prompt-et-themes.md).
- Langages de balisage : SEO (HTML/semantique-html5.md, à développer un minimum avant de lier), Sass/Less (CSS/variables-et-cascade.md).
- C : gcc (bibliotheques.md, compilation.md, makefiles.md, threads.md), Valgrind + norme C11 (memoire.md), algorithme de Kernighan (operateurs-binaires.md), norme C99 (conditions.md, variables.md).
- C++ : Java (heritage-et-polymorphisme.md, stl-conteneurs.md — pas de chapitre Java sur le site), arbre rouge-noir (stl-conteneurs.md).
- JavaScript : React, Vue, Angular, Node.js (javascript.md).
- OCaml : Jane Street, Coq, Haskell (ocaml.md), NullPointerException/Java (filtrage-par-motif-et-types-algebriques.md), algorithme de Hindley-Milner (inference-de-types.md).
- PHP : WordPress, Drupal, Laravel, Symfony (php.md, routage.md), Express, Node (routage.md), MD5, SHA-1, bcrypt (securite.md), `std::optional<T>` C++ (methodes.md, pas de chapitre C++ dédié aux templates génériques équivalent).
- Python : Django, Flask, pandas (python.md — PyTorch et NumPy passent en lien interne, voir ci-dessus), Docker (cli-avec-argparse.md), VS Code, PyCharm (typage-avec-annotations.md).

**Jamais audité du tout** (le 3e agent lancé pour ces 15 catégories a échoué, résultat inutilisable — à refaire directement, sans agent, conformément à `prompt.md`) : Bases de l'informatique, Bases de données, Représentation des données, Data Science, Qualité et architecture du code, Mathématiques, Docker, Organisation en entreprise, Infrastructure, CI-CD, Traitement de documents, Domain-specific Languages (DSL), UI-UX, Performance, `acceuil.md`.

**Questions ouvertes pour la prochaine session** (décisions prises par défaut cette session, à confirmer avec Louis plutôt qu'à considérer comme tranchées) :
- **Noms d'OS ambiants (Linux, Windows, macOS, Unix)** : décidé de ne PAS les traiter comme des violations de la règle 7bis quand ils apparaissent comme simple contexte de fond (« le shell le plus répandu sur Linux et macOS »), sauf quand un chapitre du site les explique déjà et n'est pas lié (ex. Unix dans `scripts-et-shebang.md`). À confirmer : est-ce le bon seuil, ou Louis veut-il un lien externe systématique même pour ces mentions ambiantes ?
- **Java, absent du site** : cité en comparaison dans plusieurs chapitres C++/OCaml (`ArrayList`, `NullPointerException`...) sans aucune destination interne possible. Un lien externe (docs Oracle) suffit-il durablement, ou est-ce le signe qu'un chapitre Java devrait être envisagé un jour dans "Langages de programmation" (question de fond, pas juste un lien à poser) ?
- **Profondeur des liens externes mineurs** (Kanban, SEO...) : un simple lien Wikipédia suffit-il, ou faut-il, comme le veut le principe zéro-connaissance déjà appliqué aux plateformes nommées (voir `prompt.md`, section Contexte), ajouter aussi une phrase de définition avant le lien plutôt que de ne poser que le lien ?
- **PHP sans chapitre "exceptions" dédié** : à vérifier précisément si `poo.md` ou `structures-de-langage.md` couvre déjà try/catch en PHP avant de décider (lien vers l'un des deux si oui, nouveau chapitre à créer sinon).

### Lecture audio automatique du site (texte + blocs de code)

**Implémenté, testé en conditions réelles et committé le 2026-08-12** (`js/reader.js` + câblage dans `router.js`/`sidebar.js`/`nav.js`/`index.html`/CSS, selon le plan détaillé ci-dessous). Contrainte respectée : **aucun coût d'usage de la voix** (Web Speech API du navigateur uniquement, pas d'API cloud payante à l'usage).

Un premier passage de vérification en Chrome headless (CDP) avait donné un feu vert prématuré (zéro erreur console, mais synthèse vocale jamais réellement déclenchée dans cet environnement). Un second passage en conditions réelles (extension Claude in Chrome, vraie synthèse vocale via `speechSynthesis`) a révélé un bug que le premier passage ne pouvait pas voir : ni le clic sur "⏹ Arrêter la lecture" ni un changement de page en cours de lecture n'arrêtaient réellement l'audio — la lecture repartait en boucle au lieu de s'arrêter, avec un chevauchement audio possible entre deux pages.

**Cause** : dans `speakNext()`, `utterance.onend` et `utterance.onerror` pointaient vers le même handler (`planIndex++; speakNext()`). Or `synth.cancel()` (appelé par `resetPlayback()`, donc par `stopReading()` et par `buildReadingPlan()` à chaque page) déclenche l'événement `error` (code `"interrupted"`, confirmé en direct) sur l'utterance en cours — pas `end`. Ce handler périmé s'exécutait donc juste après le reset et relançait la lecture au lieu de la laisser s'arrêter.

**Correctif** : un compteur de génération (`generation`), incrémenté à chaque `resetPlayback()`. Chaque callback `onend`/`onerror` capture la génération au moment de la création de l'utterance et vérifie qu'elle est toujours d'actualité avant d'agir — sinon il s'agit d'un callback périmé (utterance interrompue par un stop ou un changement de page) et il ne fait rien. Re-vérifié en direct après correctif : arrêt manuel et navigation en cours de lecture stoppent bien l'audio (`speechSynthesis.speaking` repasse à `false`, aucun chevauchement).

**Décisions actées :**
- **Moteur : Web Speech API** du navigateur (`SpeechSynthesisUtterance`), pas une API cloud ni un moteur auto-hébergé (Piper/Coqui) : le site est **100 % statique** (GitHub Pages, `.github/workflows/pages.yml`, aucun serveur, aucune étape de build), et la Web Speech API tourne entièrement côté client, zéro coût, zéro infra à ajouter. Un moteur auto-hébergé demanderait soit un serveur d'inférence (incompatible avec l'hébergement statique actuel), soit de pré-générer et committer des fichiers audio à chaque édition de contenu (trop de friction pour un site édité aussi souvent).
- **Blocs de code multi-lignes (` ``` `)** : la lecture s'**arrête complètement** en les rencontrant (pas de narration syllabe par syllabe), le bloc concerné est amené à l'écran (`scrollIntoView`), et un bouton explicite "Continuer après le bloc de code" relance la lecture juste après. Décidé après avoir écarté l'option "sauter silencieusement" : l'utilisateur veut le temps de lire le code lui-même avant que la voix ne reprenne.
- **Code inline (`` `comme ceci` ``)** : à l'inverse, **ne stoppe jamais** la lecture (le code inline est trop fréquent dans les phrases de Devpedia : jusqu'à 20 occurrences dans un seul chapitre, plusieurs par phrase) — il est lu à voix haute, mais dans un **`utterance.lang` anglais** (`en-US`) plutôt que la langue de la page, pour une prononciation correcte des commandes/identifiants, sans casser le flux de la phrase autour.
- **Prosodie de la page** : lue dans la langue réelle de la page courante (`document.documentElement.lang`, déjà posé par `lang.js`), pas figée en français — gère nativement les traductions EN/ES/PT existantes.
- **"Préchargement" avant lecture** : demandé pour éviter les pauses de chargement entre sections déjà rencontrées avec d'autres voix IA. Avec la Web Speech API (synthèse locale, aucun aller-retour réseau par section), ce risque n'existe quasiment pas — mais l'architecture retenue le garantit structurellement de toute façon : le plan de lecture complet (liste ordonnée de segments texte/langue + points de pause) est construit d'un coup, avant le tout premier mot prononcé, plutôt que segment par segment au fur et à mesure.
- **Emplacement du contrôle** : bas de la barre latérale droite (`.rightSidebar`) sur desktop, comme demandé. Sur mobile, `.rightSidebar` est repliée dans le menu hamburger (`.menuDiv`) : y cacher le contrôle aurait forcé à rouvrir ce menu à chaque clic, alors que "Continuer après le bloc de code" doit rester immédiatement accessible. Décidé à la place : une **barre flottante indépendante**, fixée en bas de l'écran, visible uniquement sous le point de rupture mobile (moins de 1100px), hors du menu hamburger — même état de lecture partagé entre les deux instances (desktop + mobile) via un système d'abonnement simple.

**Plan de construction du "plan de lecture"** (parcours du DOM déjà généré par `parser.js`, dans `pageDiv`) :
- Éléments "feuilles" lus comme une seule unité : `h2`-`h6`, `p`, `li`, `th`, `td` (tout le reste — `blockquote`, `ul`/`ol`, `table`/`thead`/`tbody`/`tr`, le `div.tableWrapper` — n'est qu'un conteneur structurel, parcouru mais jamais lu comme un bloc en soi).
- `pre` (bloc de code) → entrée "pause" dans le plan, jamais parcouru.
- `code` inline (hors `pre`) → son texte devient un segment séparé en anglais, extrait du texte français environnant plutôt que concaténé avec lui.
- Éléments à ignorer explicitement (UI générée par `router.js`, pas du contenu) : `.pageNav`, `.pageBreadcrumb`, `.childList`.
- Dégradation propre si `"speechSynthesis" in window` est faux : aucun contrôle affiché, plutôt qu'une erreur.

**Points d'intégration identifiés, pas encore câblés :**
- Nouveau module `js/reader.js` (autonome, n'importe que `createTag` de `tags.js` pour rester découplé de `sidebar.js`/`router.js`).
- `router.js` : appeler la construction du plan de lecture à la fin de `generatePageContent` (après `parseAppendText`), et arrêter toute lecture en cours au début de `clearCurrentPage()` (le DOM de l'ancienne page, y compris ses `pre` visés par le plan précédent, est sur le point de disparaître).
- `sidebar.js`/`nav.js` : initialiser les deux instances du contrôle (sidebar + barre flottante mobile) une fois au démarrage, une fois `.rightSidebar` créée par `initSidebars()`.
- `index.html` : ajouter le tag `<script type="module" src="js/reader.js">`.
- CSS (`base.css`/`responsive.css`) : style du bouton (à aligner sur `.returnButton`/`.nextButton`/`.prevButton` déjà existants), et la barre flottante mobile (`position: fixed`, visible uniquement sous 1100px, cachée au-dessus où `.rightSidebar` prend le relai).

À reprendre en une fois (l'essentiel du design est tranché, l'implémentation elle-même est mécanique) plutôt que de redécouper en plusieurs étapes validées séparément.

**Session du 2026-08-13 — corrections et ajouts, tous testés en conditions réelles (extension Claude in Chrome, vraie synthèse vocale) :**

- **Bug corrigé — séparateur `/` lu à voix haute** : un texte comme `` `if` / `else if` / `else` `` faisait lire la barre oblique entre deux codes inline (aucun mot à prononcer, juste de la ponctuation). `collectLeafSegments()` ignore désormais tout segment de texte tampon sans lettre ni chiffre (`HAS_SPOKEN_CONTENT`), plutôt que de cibler `/` spécifiquement.
- **Deux nouveaux boutons** : "⏮ Recommencer depuis le début" (revient toujours à la toute première entrée du plan) et "🔁 Relire le paragraphe" (rejoue le paragraphe en cours ou le dernier lu, via un `group` maintenant attaché à chaque entrée du plan). Cachés tant que la lecture n'a encore rien produit à rejouer. Présents en desktop et dans la barre flottante mobile.
- **Reprise au paragraphe visible** : le bouton principal "Écouter cette page" démarre désormais depuis le paragraphe actuellement en haut de l'écran (`findVisibleEntryIndex()`, tient compte de la hauteur de la navbar sticky via `--navbar-height`) plutôt que de toujours repartir du tout début — avec scroll automatique vers le haut du paragraphe si celui-ci était partiellement masqué sous la navbar. "Recommencer depuis le début" reste, lui, un vrai retour à l'index 0.
- **Table de prononciation des opérateurs**, construite après une recherche par 4 agents parallèles sur tout `content/` (voir le comparatif détaillé dans l'historique de conversation si besoin de le refaire) : les symboles lus caractère par caractère par le moteur TTS sont peu fiables (`!==` perd son `!`, `===` se confond avec `==`, `$1` se lit "one dollar" comme un montant). Architecture à deux niveaux dans `js/reader.js` :
  - `GLOBAL_OPERATOR_SPEECH` : symboles au sens stable partout (`==`, `===`, `!=`, `!==`, `<=`, `>=`, `&&`, `||`, `??`, `?.`, et `$` → "variable").
  - `CONTEXT_OPERATOR_SPEECH` : table par contexte (id du sujet, ou de la catégorie si pas de sujet — `appState.curSubject ?? appState.curCategory`) pour les symboles dont le sens change selon le langage : `c`, `cpp`, `php`, `python`, `ocaml`, `bash`, `powershell`, `zsh`, `domain-specific-languages-dsl` (regex, le plus dense — ancres/quantificateurs), `css`, `data-science`, `mathematiques`, `git` (marqueurs de conflit).
  - Simplification actée et documentée en commentaire : la catégorie DSL n'a pas de sujets, donc `regex.md` et `sql.md` partagent une seule table — sans risque aujourd'hui car SQL n'a aucun symbole nu en conflit, à revoir si un futur chapitre DSL réutilise un symbole différemment.
- **Flags CLI** (`set -e`, `--verbose`) : tiret(s) de préfixe transformés en "dash"/"dash dash" par une regex générique (structure, pas une liste figée), appliquée dans tous les contextes puisque le sens d'un flag est le même partout.
- **Bug corrigé — blocs de code consécutifs** : plusieurs `pre` d'affilée sans texte entre eux imposaient un clic "Continuer" par bloc avant de reprendre le texte. `collapseConsecutivePauses()` ne garde qu'un seul point de pause par groupe consécutif (sur le premier bloc).
- **Bug corrigé — dépassement de pile** : `RangeError: Maximum call stack size exceeded` observé en conditions réelles sur une section à beaucoup de très courts segments consécutifs (ex. `$0`, `$1`, `$2`...). `speakNext()` se rappelait de façon synchrone depuis le callback `onend`/`onerror`, qui peut se déclencher quasi instantanément pour un texte très court — plusieurs frames s'empilaient sans jamais rendre la main à la boucle d'événements. Corrigé en différant l'appel récursif via `setTimeout(speakNext, 0)`.

**Reste ouvert pour la prochaine session :**
- Le mot français "déréférencement" (chapitre pointeurs en C) serait mal prononcé par la voix — signalé en écoutant en direct, pas encore diagnostiqué ni corrigé (nécessite d'écouter précisément ce qui cloche : accent anglais, syllabe manquante, etc. — l'agent ne peut pas entendre l'audio lui-même, il faut le retour de Louis en direct pour itérer).
- Demande explicite de Louis : **identifier systématiquement tous les cas limites restants de la voix IA** avant de considérer le chantier clos (au-delà de ce qui a été trouvé au fil de l'eau cette session) — revue exhaustive à faire, pas juste au hasard des pages visitées.
- Les phrases choisies pour les nouveaux symboles (table ci-dessus) n'ont pas été validées mot à mot par Louis, seulement l'architecture — à revoir si certaines sonnent mal à l'oreille.