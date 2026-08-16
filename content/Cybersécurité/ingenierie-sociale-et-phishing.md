---
order: 2
---

# Ingénierie sociale et phishing

Toutes les failles ne sont pas techniques : l'**ingénierie sociale** consiste à manipuler une personne, plutôt qu'une machine, pour qu'elle accomplisse elle-même l'action recherchée par l'attaquant (révéler un mot de passe, cliquer sur un lien, autoriser un accès). Elle contourne ainsi n'importe quelle protection technique, aussi solide soit-elle : le maillon visé est humain.

## Les ressorts psychologiques exploités

| Ressort | Principe | Exemple |
|---|---|---|
| Autorité | Obéir à quelqu'un qui semble légitime | Un email signé "Direction" ou "Support informatique" |
| Urgence | Empêcher de prendre le temps de vérifier | "Votre compte sera fermé dans 24h" |
| Peur | Pousser à agir pour éviter une conséquence négative | "Une activité suspecte a été détectée sur votre compte" |
| Confiance / familiarité | Se faire passer pour un contact connu | Un message qui semble venir d'un collègue ou d'un ami |
| Curiosité | Donner envie de cliquer ou d'ouvrir une pièce jointe | "Voici la photo dont on parlait" |

## Les principales techniques

| Technique | Vecteur | Description |
|---|---|---|
| **Phishing** (hameçonnage) | Email | Un message imitant un expéditeur légitime, avec un lien vers un faux site ou une pièce jointe piégée |
| **Spear phishing** | Email ciblé | Un phishing personnalisé pour une personne précise, à partir d'informations réelles la concernant (nom, poste, projet en cours) |
| **Vishing** (*voice phishing*) | Téléphone | Un appel se faisant passer pour une banque, un support technique, ou une autorité |
| **Smishing** (*SMS phishing*) | SMS | Même principe que le phishing, par message texte |
| **Pretexting** | N'importe lequel | Inventer un scénario crédible (faux technicien, faux audit) pour obtenir une information ou un accès |
| **Baiting** (appât) | Physique ou numérique | Laisser une clé USB piégée dans un lieu public, ou proposer un téléchargement gratuit vérolé |
| **Tailgating** | Physique | Suivre quelqu'un à travers une porte sécurisée en profitant qu'il vient de l'ouvrir |

Le phishing est détaillé plus en profondeur, avec l'angle du typosquatting et du certificat valide sur un faux domaine, dans le panorama des attaques du chapitre [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) : ce chapitre-ci couvre l'ingénierie sociale comme discipline, dont le phishing n'est qu'une des techniques.

## Un exemple concret de phishing

```text
De :      support@paypa1-securite.com
Objet :   Action requise : votre compte a ete suspendu

Bonjour,

Nous avons detecte une activite inhabituelle sur votre compte.
Cliquez ici pour le reactiver sous 24h : http://paypa1-secure-login.com/verify

L'equipe Support
```

| Indice suspect | Ce qu'il révèle |
|---|---|
| `paypa1` au lieu de `paypal` | Typosquatting : un domaine visuellement proche du vrai |
| Urgence ("sous 24h") | Ressort psychologique classique, pour empêcher la vérification |
| Lien affiché ≠ domaine officiel de l'entreprise | Le survol du lien (sans cliquer) révèle souvent la vraie destination |
| Formule générique ("Bonjour") | Une entreprise qui connaît déjà le client l'appelle en général par son nom |

## Comment s'en protéger

- Ne jamais cliquer directement sur un lien reçu par email/SMS pour une action sensible (connexion, paiement) : ouvrir soi-même le site officiel dans un nouvel onglet, en tapant l'adresse ou via un favori déjà enregistré.
- Vérifier l'adresse d'expédition complète, pas seulement le nom affiché (souvent falsifiable sans lien avec l'adresse réelle).
- Se méfier de toute urgence ou pression inhabituelle : une entreprise légitime laisse le temps de vérifier.
- Vérifier une demande inhabituelle (virement, accès, information sensible) par un second canal, indépendant du message reçu (rappeler sur un numéro déjà connu, pas celui fourni dans le message).
- En entreprise, signaler tout message suspect au service concerné plutôt que de le supprimer silencieusement : un signalement protège aussi les autres destinataires de la même campagne.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'ingénierie sociale manipule une personne plutôt qu'une machine, en s'appuyant sur des ressorts psychologiques (autorité, urgence, peur, confiance). Le phishing (et ses variantes vishing/smishing) en est la technique la plus répandue. |
| **Outils utilisables** | Survol d'un lien avant de cliquer, vérification de l'adresse d'expédition complète, favoris déjà enregistrés pour les sites sensibles. |
| **Pièges à éviter** | Cliquer directement sur un lien reçu pour une action sensible ; se fier au seul nom affiché d'un expéditeur ; céder à une urgence artificielle. |
| **Bonnes pratiques** | Vérifier toute demande inhabituelle par un second canal indépendant ; signaler un message suspect plutôt que de le supprimer sans rien dire. |
