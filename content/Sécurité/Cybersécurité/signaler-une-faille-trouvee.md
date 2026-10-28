---
order: 22
---

# Signaler une faille trouvée sur un site : ce que la loi permet et la divulgation responsable (28/10/2026)

Ce chapitre donne des repères généraux et n'est pas un avis juridique : la loi varie d'un pays à l'autre et change avec le temps, et seule une personne qualifiée (avocate ou avocat, juriste) peut dire ce qui s'applique à un cas précis ; la France sert d'exemple principal, avec des repères pour l'Union européenne et les États-Unis.

Une **faille** (ou *vulnérabilité*) est un défaut d'un système qui permet de le faire agir autrement que prévu (voir [les grandes familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles)). La question traitée ici est celle de tout curieux qui apprend la sécurité : « Est-ce que je peux chercher des failles sur un site internet, puis prévenir les personnes qui le gèrent par email ou autrement, ou est-ce illégal ? » La réponse dépend moins de ce que l'on fait que de **l'autorisation** que l'on a, et de la façon dont on prévient ensuite. Les noms de sites de ce chapitre (`example.org`) sont fictifs.

## La réponse courte

| Question | Réponse courte |
|---|---|
| Puis-je chercher des failles sur un site qui n'est pas le mien ? | En général **non, pas sans autorisation**, même sans mauvaise intention : c'est le plus souvent une infraction |
| Puis-je prévenir les gestionnaires du site ? | **Oui**, c'est possible et utile, mais le signalement comporte des risques et n'efface pas ce qui a été fait avant |
| Qu'est-ce qui rend la recherche légitime ? | Une **autorisation explicite** : contrat ou mandat de test, politique de divulgation ou programme de récompense, dans son périmètre précis |
| Et si je tombe sur une faille sans la chercher ? | S'arrêter, noter le minimum, signaler **en privé** par le canal prévu, ne rien publier avant correction |

Le reste du chapitre explique chaque ligne de ce tableau.

## Pourquoi c'est illégal : l'accès non autorisé

Une image aide à comprendre. La porte d'un magasin fermé a une serrure cassée : entrer « pour prévenir le propriétaire » reste entrer dans un lieu où l'on n'a pas le droit d'être. En informatique, c'est la même logique : ce qui compte n'est ni la difficulté technique ni l'intention, mais le fait d'**avoir été autorisé** ou non.

En France, le **Code pénal** (le texte qui définit les infractions et leurs peines, consultable sur [Légifrance](https://www.legifrance.gouv.fr/), le site officiel du droit français) consacre ses articles 323-1 et suivants aux atteintes à un **système de traitement automatisé de données** (en pratique, tout système informatique : un serveur, un site, une application, une base de données).

| Article | Ce qu'il sanctionne (résumé) |
|---|---|
| 323-1 | Accéder ou se maintenir, **frauduleusement**, dans tout ou partie d'un tel système |
| 323-2 | Entraver ou fausser son fonctionnement (par exemple en le surchargeant, voir [le déni de service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| 323-3 | Introduire, extraire, détenir, reproduire, transmettre, supprimer ou modifier frauduleusement des données du système (à vérifier sur Légifrance pour la liste exacte des actes) |
| 323-3-1 | Fournir ou détenir sans motif légitime des outils conçus pour commettre ces infractions ; la loi cite la recherche et la sécurité informatique parmi les motifs légitimes (à vérifier sur Légifrance) |
| 323-7 | La tentative est punie comme l'infraction elle-même (à vérifier sur Légifrance) |

Les peines sont de la prison et de l'amende ; leurs montants changent selon l'article et la loi en vigueur : à lire sur Légifrance plutôt que dans un cours.

Trois mots demandent une précision :

| Mot | Sens |
|---|---|
| **Accès** | Entrer dans le système, même sans casser de protection : un simple essai d'identifiants, ou une adresse devinée, peut suffire |
| **Maintien** | Rester dans un système après avoir compris qu'on n'y a pas le droit : un accès arrivé par hasard devient un problème si l'on continue à explorer |
| **Frauduleusement** | En sachant qu'on n'y est pas autorisé : c'est l'élément moral de l'infraction |

### Ce que la bonne intention n'efface pas

Vouloir prévenir le propriétaire ne supprime pas l'infraction : l'intention de bien faire n'est pas une autorisation. Les juges tiennent toutefois compte du contexte, et la jurisprudence (l'ensemble des décisions des tribunaux) est nuancée : la bonne foi, l'absence de dommage et la façon de signaler pèsent sur la décision et sur la peine, sans empêcher des poursuites. Une affaire française souvent citée, celle de l'**extranet** (la partie d'un site réservée à des partenaires) d'un organisme public, jugée en appel en 2014 puis par la Cour de cassation en 2015 (la plus haute juridiction pour le pénal), montre aussi qu'un fichier **techniquement accessible** (sans mot de passe, trouvé par un moteur de recherche) n'est pas pour autant **autorisé** : continuer à y accéder en sachant qu'il n'était pas destiné au public a été jugé comme un maintien frauduleux (à vérifier sur Légifrance pour le détail de la décision).

Voici, du plus anodin au plus grave, comment un même sujet se décline. Ce tableau est une estimation pédagogique, jamais une décision de justice :

| Geste sur un site qui n'est pas le sien | Risque juridique | Pourquoi |
|---|---|---|
| Lire ce que la page envoie à tout visiteur (son **code source**, le texte reçu par le navigateur, ou un message d'erreur affiché spontanément) | Faible | Rien n'est contourné : le site a envoyé cette information à tout le monde |
| Lancer un **scanner automatique** (un programme qui envoie des centaines de requêtes de test) | Élevé | C'est un comportement d'attaque, et il peut perturber le service |
| Deviner une adresse cachée, ou changer un numéro dans l'adresse pour voir la page d'un autre | Élevé | On cherche à atteindre ce qui n'était pas destiné à soi |
| Essayer un mot de passe par défaut ou des identifiants | Élevé | C'est un accès par contournement |
| Ouvrir, lire ou télécharger des données de tiers | Très élevé | Extraction de données, avec en plus un problème de vie privée |
| Tester sur le compte d'une autre personne | Très élevé | Atteinte directe à un tiers |
| Surcharger le site pour « voir s'il tient » | Très élevé | Entrave au fonctionnement |

## Les repères hors de France

| Zone | Repères (à vérifier sur la source officielle) |
|---|---|
| Union européenne | Une **directive** (un texte que chaque État doit transcrire dans sa propre loi) de 2013, numérotée 2013/40/UE, impose de punir l'accès illégal aux systèmes d'information. La directive NIS2 (2022/2555) encourage la divulgation coordonnée et prévoit un **CSIRT** national, une équipe de réponse aux incidents qui sert d'intermédiaire de confiance. Le règlement sur la cyber-résilience (2024/2847 ; un **règlement** européen s'applique directement, sans passer par une loi nationale) demande aux fabricants de produits numériques de gérer les signalements de vulnérabilités |
| États-Unis | Le *Computer Fraud and Abuse Act* (18 U.S.C. § 1030) punit l'accès « sans autorisation » ou « en dépassant l'autorisation ». Une politique du ministère de la Justice, publiée en 2022, dit de ne pas poursuivre la recherche de sécurité de bonne foi, mais ce n'est pas une loi : elle n'empêche ni des poursuites d'un autre type ni une plainte civile |
| Ailleurs | Très variable : certains pays protègent explicitement les chercheurs, d'autres non. Plusieurs lois peuvent s'appliquer à la fois (celle de la personne, celle du pays du serveur) |

L'Union européenne regroupe des pays dont les lois ne sont pas identiques : le texte européen fixe un cadre, et c'est la loi nationale qui s'applique.

## Ce que l'on trouve typiquement par hasard

Beaucoup de signalements viennent d'une découverte fortuite. Voici les cas courants, avec le chapitre qui explique la faille :

| Ce que l'on remarque | La faille correspondante |
|---|---|
| Une page qui liste le contenu d'un dossier (un **listing de répertoire**) avec des noms de fichiers sensibles | Fichier ou sauvegarde exposé, voir [les secrets oubliés en production](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) |
| Une clé d'accès (un secret) visible dans le code de la page | Secret exposé, voir [la gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Une page d'administration ou de données affichée sans mot de passe | Contrôle d'accès défaillant, voir [l'OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| Un message d'erreur qui dévoile des détails internes (chemins, version, requête) | Fuite d'information, voir [les familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles) |
| Une version très ancienne d'un composant connue pour une faille | Dépendance vulnérable, voir [la sécurité des dépendances](/?c=securite&s=cybersecurite&p=securite-des-dependances) |

Remarquer ne fait pas franchir la ligne ; ouvrir, tester, creuser peut le faire.

## Ce que change une politique de divulgation

Une **politique de divulgation de vulnérabilités** (en anglais *VDP*, pour *Vulnerability Disclosure Policy*) est un texte public où une organisation dit comment lui signaler une faille, ce qu'elle autorise, et ce qu'elle promet en retour. Un **programme de bug bounty** (« chasse aux failles récompensée ») va plus loin : il verse une récompense, selon la gravité, à qui signale une faille valable (voir [le bug bounty et le pentest](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite)).

Ces textes donnent une **autorisation explicite**, mais **seulement** dans un périmètre précis (les adresses listées, les techniques permises) :

| Situation | Autorisation de chercher | Récompense | À savoir |
|---|---|---|---|
| Aucune politique publiée | Aucune | Aucune | Chercher reste risqué ; on peut seulement signaler une découverte fortuite |
| Politique de divulgation (VDP) | Oui, dans son périmètre | Souvent aucune (remerciements) | Lire le périmètre et les règles avant tout test |
| Programme de bug bounty | Oui, dans son périmètre | Oui, selon la gravité | Souvent géré par une plateforme intermédiaire, avec ses propres règles |
| Test d'intrusion mandaté | Oui, par contrat écrit | Rémunération du prestataire | Cadre fixé avant (périmètre, horaires, règles) |

Une politique sérieuse contient presque toujours :

| Élément | Ce qu'il dit |
|---|---|
| **Périmètre** | Les adresses et services autorisés ; tout le reste est interdit, même sous le même **nom de domaine** (la partie de l'adresse qui désigne le site, comme `example.org`) |
| Techniques interdites | Par exemple le déni de service, l'ingénierie sociale (voir [le phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)), l'accès aux données d'autres utilisateurs |
| **Clause de non-poursuite** (*safe harbor*, « port sûr ») | L'organisation promet de ne pas poursuivre qui respecte les règles |
| Contact et délais | À qui écrire, sous quel délai elle répond et corrige |

Cette clause n'engage que l'organisation qui l'écrit : elle ne lie ni la justice, ni un tiers dont les données ou les systèmes seraient touchés (à vérifier avec un juriste pour un cas précis). Les plateformes d'intermédiation les plus connues :

| Plateforme | Rôle | Adresse officielle |
|---|---|---|
| YesWeHack | Met en relation des organisations et des chercheurs ; société française | [yeswehack.com](https://www.yeswehack.com/) |
| HackerOne | Idem ; société américaine | [hackerone.com](https://www.hackerone.com/) |
| Bugcrowd | Idem ; société américaine | [bugcrowd.com](https://www.bugcrowd.com/) |
| Intigriti | Idem ; société européenne | [intigriti.com](https://www.intigriti.com/) |

### Le fichier `security.txt`

Quand une organisation n'a pas de programme, elle peut tout de même dire où lui signaler une faille. Le fichier **`security.txt`** est un petit fichier texte, défini par la norme **RFC 9116** (une **RFC** est un document technique de référence d'Internet, [lisible ici](https://www.rfc-editor.org/rfc/rfc9116)), placé à l'adresse `/.well-known/security.txt` du site. Le dossier `.well-known` (« bien connu ») est réservé aux fichiers standards que l'on cherche à un emplacement prévisible.

```text
# Les lignes qui commencent par # sont des commentaires, ignorés par les lecteurs
# Contact : où écrire (obligatoire) ; mailto: introduit une adresse email
Contact: mailto:securite@example.org
# Expires : date de fin de validité du fichier (obligatoire), format de date ISO 8601
Expires: 2027-06-30T23:00:00.000Z
# Encryption : l'adresse de la clé publique pour chiffrer le message
Encryption: https://example.org/.well-known/cle-publique.asc
# Policy : l'adresse de la politique de divulgation complète
Policy: https://example.org/politique-de-divulgation
# Preferred-Languages : les langues acceptées dans le signalement
Preferred-Languages: fr, en
# Canonical : l'adresse officielle de ce fichier, pour repérer une copie falsifiée
Canonical: https://example.org/.well-known/security.txt
```

| Champ | Rôle | Obligatoire |
|---|---|---|
| `Contact` | Adresse email, formulaire ou téléphone pour signaler | Oui |
| `Expires` | Après cette date, le fichier ne doit plus être cru : il est probablement abandonné | Oui |
| `Encryption` | Clé publique pour chiffrer le message (voir [le chiffrement asymétrique](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) | Non |
| `Policy` | Lien vers la politique de divulgation | Non |
| `Preferred-Languages` | Langues comprises | Non |
| `Canonical` | Adresse officielle du fichier | Non |
| `Acknowledgments` | Page qui remercie les personnes ayant signalé une faille | Non |

Il faut le servir en **HTTPS** (la version chiffrée d'HTTP, voir [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), pour que personne ne puisse substituer un faux contact. Attention : un `security.txt` dit **où signaler**, il n'autorise pas à tester ; l'autorisation vient de la politique qu'il référence, s'il y en a une.

## La divulgation coordonnée

**Divulguer** une faille, c'est la rendre publique. Trois attitudes existent :

| Modèle | Principe | Avantage | Risque |
|---|---|---|---|
| Divulgation immédiate (*full disclosure*) | Tout publier tout de suite | Pression maximale pour corriger | Les attaquants profitent de la faille avant le **correctif** (*patch*, la mise à jour qui la supprime) : les utilisateurs sont exposés |
| **Divulgation coordonnée** (dite « responsable ») | Signaler **en privé**, laisser un délai raisonnable pour corriger, publier après correction ou après un délai annoncé | Les utilisateurs sont protégés avant que la faille ne soit connue | Demande de la patience ; l'organisation peut traîner |
| Silence | Ne rien dire à personne | Peu de risque pour soi | La faille reste ouverte, et d'autres peuvent la trouver |

La norme **ISO/IEC 29147** décrit comment recevoir et publier les informations sur une vulnérabilité, et **ISO/IEC 30111** comment les traiter en interne ; la divulgation coordonnée est la pratique que ces normes organisent.

Le délai se fixe à l'avance et s'ajuste. Une durée de 90 jours est souvent citée dans l'industrie (par exemple par l'équipe de sécurité de Google), mais ce n'est pas une règle de loi : une faille déjà exploitée par des attaquants justifie un délai plus court, une correction complexe peut en demander un plus long. Une fois la faille corrigée et publiée, elle peut recevoir un identifiant **CVE** dans le catalogue public des failles connues (voir [les familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles)).

## En France : l'ANSSI et le CERT-FR

L'**ANSSI** (Agence nationale de la sécurité des systèmes d'information) est le service de l'État chargé de la cybersécurité ([site officiel](https://cyber.gouv.fr/)). Le **CERT-FR** est le centre gouvernemental de veille, d'alerte et de réponse aux attaques informatiques, rattaché à l'ANSSI ([site officiel](https://www.cert.ssi.gouv.fr/)). *CERT* signifie *Computer Emergency Response Team*, « équipe de réponse aux urgences informatiques ».

| Ce que l'on sait | Ce qu'il faut vérifier sur le site officiel |
|---|---|
| Le CERT-FR propose un dispositif de signalement de vulnérabilités | L'adresse exacte, le formulaire éventuel, et la clé pour chiffrer le message |
| Il publie des avis et des alertes de sécurité sur des failles connues | Qui peut signaler, et pour quels types de systèmes |
| Il peut servir d'intermédiaire quand on ne trouve aucun contact | Ce qu'il fait ensuite du signalement (transmission à l'organisation, délais) |
| Une loi de 2016 sur le numérique protège la confidentialité de qui signale de bonne foi à l'ANSSI (article L. 2321-4 du Code de la défense) | Le texte exact et sa portée : il organise le signalement, il **n'autorise pas** a posteriori un accès fait sans droit |
| La CNIL (Commission nationale de l'informatique et des libertés, [cnil.fr](https://www.cnil.fr/)) traite les violations de données personnelles | Son rôle précis selon le cas |

Hors de France, le même rôle est tenu par le CERT ou le CSIRT national, par exemple la [CISA](https://www.cisa.gov/) aux États-Unis ; au niveau européen, l'agence [ENISA](https://www.enisa.europa.eu/) publie des ressources.

## Comment signaler en pratique

### À qui écrire

On cherche dans cet ordre, en s'arrêtant au premier contact trouvé :

| Ordre | Où chercher | Remarque |
|---|---|---|
| 1 | Une page « sécurité » ou une politique de divulgation du site | Lire le périmètre et les règles avant d'écrire |
| 2 | Le fichier `/.well-known/security.txt` | Vérifier la date `Expires` |
| 3 | Une adresse dédiée (par convention `security@` suivi du nom de domaine) ou la page de contact | Éviter l'adresse du support client, lue par beaucoup de monde |
| 4 | La plateforme de bug bounty citée par l'organisation | Suivre ses règles de dépôt |
| 5 | Le CERT national (en France, le CERT-FR) | Si aucun contact n'existe ou si l'organisation ne répond pas |
| 6 | Pour une bibliothèque libre : le fichier `SECURITY.md` ou le signalement privé du dépôt de code (voir [GitHub et les plateformes](/?c=qualite-performance-et-outils&s=git&p=github-et-plateformes)) | Une faille dans une dépendance se signale à ses **mainteneurs** (les personnes qui gèrent le projet) (voir [la sécurité des dépendances](/?c=securite&s=cybersecurite&p=securite-des-dependances)) |

Jamais sur un réseau social, un forum, un commentaire public ou un ticket visible de tous : ce serait publier avant correction.

### Chiffrer quand on le peut

Si le `security.txt` ou la politique fournit une **clé publique**, le message se chiffre avec elle : seule l'organisation, qui détient la clé privée associée, pourra le lire (voir [le chiffrement asymétrique](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Le standard courant pour un email est **OpenPGP** ([openpgp.org](https://www.openpgp.org/)). Sans clé fournie, on écrit un message sobre (où, quoi, impact) et on évite d'y joindre des détails qui permettraient à un lecteur indélicat de reproduire la faille ; on propose un canal sûr pour la suite.

### Que mettre dans le message

| Repère | Contenu | Pourquoi |
|---|---|---|
| [1] Objet | Une ligne claire : « Signalement de sécurité : … » | L'email n'est pas pris pour du courrier indésirable |
| [2] Où | L'adresse (URL) précise, la date et l'heure de la découverte | Permet de retrouver le problème dans les **journaux** (les fichiers où le serveur note ce qui s'est passé) |
| [3] Quoi | Ce que l'on a vu, en une ou deux phrases | L'équipe comprend de quoi il s'agit |
| [4] Reproduire | Les étapes **minimales**, sans exploiter la faille | Prouver sans aller plus loin |
| [5] Impact | Ce qu'un attaquant pourrait faire, sans l'avoir fait | Fixer la priorité |
| [6] Données | Aucune donnée de tiers en pièce jointe, dans le texte ou en capture | Ne pas répandre de données personnelles |
| [7] Suite | Un délai de publication proposé et un contact pour répondre | Installer la divulgation coordonnée |

```text
[1] Objet : Signalement de sécurité : listing de répertoire sur www.example.org

Bonjour,

[2] Le 28/10/2026, vers 14 h (heure de Paris), j'ai remarqué que l'adresse
    https://www.example.org/sauvegarde/ affiche la liste des fichiers du dossier.
[3] Cette liste contient un fichier nommé « clients-2026.sql ».
[4] Pour le constater : ouvrir l'adresse ci-dessus dans un navigateur.
[5] Si ce fichier est bien une copie de la base de clients, n'importe qui
    pourrait la télécharger.
[6] Je n'ai ouvert ni téléchargé aucun fichier et je ne joins aucune donnée.
[7] Je propose de ne rien publier avant votre correction, ou au plus tôt dans
    90 jours sans réponse de votre part. Vous pouvez me répondre à cette adresse.

Cordialement,
Prénom Nom
```

L'exemple illustre la **preuve minimale** : la page elle-même suffit à prouver la faille, il n'est pas nécessaire d'ouvrir le fichier, et le faire changerait la nature de l'acte.

## Le parcours d'un signalement

```text
1. Découverte           par hasard, ou dans un périmètre autorisé
        |               stop : ne pas aller plus loin que nécessaire
        v
2. Preuve minimale      adresse, date, heure ; aucune donnée de tiers
        |
        v
3. Contact              politique, security.txt, plateforme ou CERT national
        |               message privé, chiffré si une clé publique est fournie
        v
4. Accusé de réception  l'organisation confirme avoir reçu le message
        |               sans réponse : relance, puis CERT national
        v
5. Correction           l'organisation corrige ; échanges sur le délai
        |
        v
6. Publication          après correction, ou après le délai annoncé
```

## Ce qu'on ne fait jamais

| Interdit | Pourquoi | Ce qui reste permis |
|---|---|---|
| Télécharger ou conserver des données de tiers | Atteinte à leur vie privée, et extraction de données au sens de la loi | Décrire ce qu'on a vu, sans copie |
| Tester sur les comptes d'autres personnes | On touche directement un tiers | Créer ses propres comptes de test, si la politique le permet |
| Provoquer un déni de service ou un test de charge | Entrave au fonctionnement du service | Rien : c'est presque toujours exclu des politiques |
| Aller plus loin que la preuve minimale (rebondir vers d'autres systèmes, s'installer, rester connecté) | Chaque pas de plus aggrave l'accès | S'arrêter dès que la faille est établie |
| Extorquer : demander de l'argent contre son silence, menacer de publier | Cela ressemble à de l'extorsion ou du chantage, des infractions graves | Accepter une récompense **prévue** par un programme de bug bounty |
| Publier avant correction ou avant le délai annoncé | Expose les utilisateurs | Publier après correction, d'un commun accord |
| Ignorer le périmètre d'un bug bounty | Hors périmètre, l'autorisation disparaît | Ne toucher que les adresses listées, ou demander par écrit |
| Piéger les personnes du site (faux messages, voir [le phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) | Hors du cadre de presque toute politique | Rester sur le seul point technique |
| Revendre la faille à des tiers | Risque pénal grave et dommages pour les utilisateurs | La signaler au propriétaire |

## Côté responsable du site

Le chapitre s'adresse aussi aux personnes qui gèrent un site : elles sont celles qui rendent un signalement facile, ou le découragent.

| Action | Pourquoi | Comment |
|---|---|---|
| Publier une politique de divulgation | Dit clairement ce qui est autorisé et à quelles conditions | Une page du site : périmètre, règles, contact, délais |
| Publier un `security.txt` | Un chercheur trouve le contact en quelques secondes | `/.well-known/security.txt`, `Expires` à renouveler |
| Surveiller l'adresse de contact | Un signalement ignoré finit parfois publié | Adresse dédiée, lue par plus d'une personne |
| Répondre vite | Un accusé de réception rassure et évite la publication hâtive | En pratique sous quelques jours ouvrés |
| Corriger et tenir au courant | Le chercheur peut alors publier avec votre accord | Donner une date de correction, même approximative |
| Remercier | Encourage les signalements futurs | Page de remerciements (`Acknowledgments`) |
| Ne pas menacer de poursuites un chercheur de bonne foi | Cela décourage tout signalement, et la faille reste ouverte | Écrire une clause de non-poursuite dans la politique |
| Notifier si des données personnelles sont touchées | Le **RGPD** (le règlement européen sur la protection des données personnelles) demande de prévenir l'autorité (en France, la CNIL) dans les 72 heures, selon le risque (article 33, à vérifier sur le site officiel) | Garder la preuve de la date de découverte |

## Que faire si je trouve une faille par hasard ?

| Situation | Que faire | Pourquoi |
|---|---|---|
| J'ai remarqué un défaut visible sans rien forcer | Noter l'adresse, la date et l'heure ; ne pas explorer ; chercher le contact | Remarquer ne fait pas franchir la ligne |
| Le site a un bug bounty ou une politique | Lire le périmètre, suivre les règles, déposer le signalement sur le canal indiqué | L'autorisation existe, mais seulement dans le périmètre |
| Je voudrais vérifier si c'est vraiment exploitable | Ne pas le faire seul ; **demander par écrit** une autorisation de test | Sans autorisation, tester est l'acte risqué |
| J'ai déjà ouvert ou téléchargé des données de tiers | M'arrêter, ne pas les diffuser ni les envoyer, ne pas en faire état dans le message, demander conseil à un avocat avant d'agir | Les copies sont une preuve contre moi et une atteinte aux tiers |
| Je ne trouve aucun contact | Écrire au CERT national (CERT-FR en France), vérifier la procédure sur son site | Il sert d'intermédiaire (à vérifier sur le site officiel) |
| Pas de réponse après plusieurs jours | Relancer par le même canal, puis passer par le CERT national ; ne pas publier | Le silence n'autorise pas la publication |
| On me menace de poursuites | Garder les échanges, ne rien publier en représailles, consulter un avocat | Publier sous la colère aggrave la situation |
| La faille est dans un système de mon employeur ou de mon client | Passer par la voie interne (responsable sécurité, contrat) | Le contrat peut déjà fixer la règle |
| Je veux m'entraîner sans risque | Utiliser un CTF ou un laboratoire à soi (voir [le CTF](/?c=securite&s=securite-offensive&p=ctf-capture-the-flag) et [l'exploitation web côté attaquant](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant)) | Le cadre est fait pour cela |

## Synthèse

Chercher des failles sur un site qui n'est pas le sien est en général illégal faute d'autorisation, même avec de bonnes intentions ; une découverte fortuite se signale, en privé, avec la preuve minimale et sans toucher aux données d'autrui. Un programme de récompense ou une politique de divulgation donne une autorisation, mais seulement dans son périmètre ; le fichier `security.txt` dit où écrire. La divulgation coordonnée laisse le temps de corriger avant de publier, et les organisations rendent tout cela possible en publiant une politique, en répondant vite et en ne menaçant pas les personnes de bonne foi. En France, le CERT-FR de l'ANSSI est le recours quand aucun contact n'existe.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| « J'ai prévenu gentiment, donc c'est légal » | Le signalement n'efface pas l'accès non autorisé qui l'a précédé, et il peut servir de preuve de cet accès |
| Croire qu'une adresse sans mot de passe est autorisée | Techniquement accessible ne veut pas dire autorisé ; continuer à y aller est un maintien frauduleux |
| « Je teste juste un peu pour être sûr » | Chaque test est un acte : la vérification est ce qui rend la situation risquée |
| Lancer un scanner « pour aider » | Un scanner agit comme une attaque et peut perturber le service |
| Demander de l'argent sur un site sans programme de récompense | Cela peut être vu comme de l'extorsion |
| Croire qu'un bug bounty autorise tout le domaine | Seuls les éléments listés dans le périmètre sont autorisés (un sous-domaine ou un prestataire tiers n'en fait pas forcément partie) |
| Croire qu'une promesse de non-poursuite lie la justice et les tiers | Elle n'engage que l'organisation qui la donne (à vérifier avec un juriste) |
| Publier après un certain nombre de jours sans prévenir | La divulgation coordonnée exige un délai annoncé et une dernière relance |
| Joindre des captures contenant des données personnelles | On répand soi-même des données qu'on devait protéger |
| Se fier à un `security.txt` périmé | Un fichier dont la date `Expires` est dépassée n'est plus garanti |
| Prendre ce chapitre pour un avis juridique | Les repères sont généraux : la loi change et chaque cas est particulier |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Lire la politique de divulgation et son périmètre **avant** de toucher à quoi que ce soit | L'autorisation n'existe que dans ce cadre |
| S'entraîner sur ses propres systèmes, des CTF ou des laboratoires prévus pour cela | Aucun risque juridique, et la même compétence |
| Noter l'adresse, la date et l'heure, et s'arrêter à la preuve minimale | Un signalement précis et sans excès |
| Écrire un message court, neutre et factuel, sans menace ni demande d'argent | Il sera pris au sérieux, et la relation reste saine |
| Chiffrer le message quand une clé publique est fournie | Seule l'organisation lit les détails |
| Garder les échanges par écrit | Une trace utile en cas de désaccord |
| Respecter le délai annoncé, et prévenir avant de publier | Le principe même de la divulgation coordonnée |
| Demander conseil à un avocat **avant** d'aller plus loin en cas de doute | Après coup, il est plus difficile de corriger |
| Côté site : publier une politique, un `security.txt`, répondre vite et ne pas menacer | Le signalement devient facile et la faille se corrige |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Chercher une faille sans autorisation sur un site qui n'est pas le sien est en général illégal, même sans mauvaise intention : en France, les articles 323-1 et suivants du Code pénal visent l'accès ou le maintien frauduleux dans un système de traitement automatisé de données. Une politique de divulgation ou un programme de bug bounty donne une autorisation explicite, dans un périmètre précis. Le fichier `security.txt` (RFC 9116, à `/.well-known/security.txt`) donne le contact de sécurité. La divulgation coordonnée consiste à signaler en privé, laisser un délai pour corriger, puis publier ; elle s'oppose à la divulgation immédiate. Le CERT-FR de l'ANSSI est le recours en France (procédure à vérifier sur le site officiel). Un bon signalement indique où, quoi, comment reproduire en bref et l'impact, sans donnée de tiers. |
| **Pièges à éviter** | Croire que prévenir gentiment rend légal ce qui a été fait ; confondre accessible et autorisé ; scanner ou tester « pour aider » ; demander de l'argent hors programme de récompense ; ignorer le périmètre ; publier avant correction ; joindre des données personnelles ; compter sur une promesse de non-poursuite comme sur une loi. |
| **Bonnes pratiques** | Lire la politique avant tout test ; s'entraîner dans un cadre prévu ; s'arrêter à la preuve minimale ; écrire un message sobre, chiffré si une clé est fournie ; respecter le délai annoncé ; demander conseil à un avocat en cas de doute ; côté site, publier une politique de divulgation et un `security.txt`, répondre vite et ne pas menacer les personnes de bonne foi. |
