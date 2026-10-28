---
order: 9
---

# La boucle de jeu avec SFML (28/10/2026)

Un jeu vidéo est un programme qui, plusieurs dizaines de fois par seconde, lit ce que fait le joueur, fait avancer son monde, puis redessine tout. Cette répétition s'appelle la **boucle de jeu**. Ce chapitre la construit pas à pas avec **SFML** (*Simple and Fast Multimedia Library*), une [bibliothèque](/?c=langages&s=c&p=bibliotheques) (du code déjà écrit qu'on réutilise) du langage [C++](/?c=langages&s=cpp&p=cpp) qui fournit l'essentiel d'un jeu 2D : une fenêtre, le dessin d'images et de formes, la lecture du clavier et de la souris, et le son.

Le chapitre suppose connus [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les conditions](/?c=langages&s=c&p=conditions), [les boucles](/?c=langages&s=c&p=boucles), [les classes et objets](/?c=langages&s=cpp&p=classes-et-objets) et [les espaces de noms](/?c=langages&s=cpp&p=espaces-de-noms) du C++. Pour ouvrir une fenêtre OpenGL sans SFML, voir [GLFW, GLAD et la boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) : la boucle y est la même, SFML en cache seulement les détails.

> **Version :** tout le code de ce chapitre est écrit pour **SFML 2** (la version 2.6.1 au 28/10/2026, [documentation officielle](https://www.sfml-dev.org/documentation/2.6.1/)). SFML 3 a changé certains noms de classes et de fonctions : le code ci-dessous ne compile pas tel quel avec lui.

## Installer SFML et compiler

SFML est découpée en **modules**, des morceaux indépendants qu'on lie au programme selon ses besoins :

| Module | Contenu | Option de liaison |
|---|---|---|
| System | temps (chronomètre), vecteurs | `-lsfml-system` |
| Window | fenêtre, événements, clavier, souris | `-lsfml-window` |
| Graphics | dessin de formes, d'images et de texte | `-lsfml-graphics` |
| Audio | sons et musique | `-lsfml-audio` |
| Network | communication réseau | `-lsfml-network` |

Sous Debian et Ubuntu, le paquet de développement s'installe depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) avec `sudo apt install libsfml-dev` ; les autres systèmes ont leur équivalent (voir la [page d'installation](https://www.sfml-dev.org/tutorials/2.6/start-linux.php) du site officiel). Le programme se compile ensuite avec `g++`, le compilateur C++ de GCC (voir [la compilation](/?c=langages&s=c&p=compilation)) :

```bash
# -std=c++17 : version du langage ; -o jeu : nom de l'exécutable produit
# -Wall -Wextra : affichent les avertissements du compilateur
# -l<nom> : lie la bibliothèque libsfml-<nom> (module Graphics, Window, System)
g++ -std=c++17 -Wall -Wextra jeu.cpp -o jeu -lsfml-graphics -lsfml-window -lsfml-system
./jeu    # lance le programme
```

## Sans boucle, le programme se termine aussitôt

Un programme C++ exécute les lignes de `main` de haut en bas, puis s'arrête. Voici le plus petit programme SFML : il ouvre une fenêtre, dessine, puis finit.

```cpp
#include <SFML/Graphics.hpp>   // en-tête de SFML : fenêtre, dessin, temps

int main()   // point d'entrée : le programme commence ici
{
    // sf:: est l'espace de noms de SFML ; RenderWindow est une fenêtre où l'on dessine
    // VideoMode(800, 600) : 800 pixels de large, 600 de haut (un pixel : un point d'écran)
    sf::RenderWindow window(sf::VideoMode(800, 600), "Ma boucle de jeu");
    window.clear(sf::Color::Black);   // remplit toute la fenêtre de noir
    window.display();                 // affiche l'image qui vient d'être dessinée
    return 0;   // fin de main : la fenêtre est détruite, le programme s'arrête
}
```

La ligne `#include` recopie un fichier d'en-tête dans le programme (voir [`#include` et les headers](/?c=langages&s=c&p=headers)) : sans lui, le compilateur ne connaît pas `sf::RenderWindow`. Une **fenêtre** est un rectangle que le système d'exploitation affiche et que l'utilisateur peut déplacer et fermer. Ici, elle apparaît quelques millisecondes (un millième de seconde) puis disparaît : rien n'empêche `main` d'arriver à sa dernière ligne. Il faut une boucle qui **ne rend la main que lorsque la fenêtre est fermée**.

## Un tour de boucle

Voici les mots qui servent dans la suite :

| Mot | Définition |
|---|---|
| **Boucle de jeu** (*game loop*) | Code répété sans fin tant que le jeu tourne ; chaque répétition est un **tour** |
| **Image** (*frame*) | Ce qui est affiché à la fin d'un tour : un tour produit une image |
| **Delta time** (*dt*) | Durée, en secondes, écoulée depuis le tour précédent ; expliqué en détail dans [le chapitre sur GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-delta-time-une-vitesse-independante-de-la-machine) |
| **Événement** (*event*) | Signal envoyé par le système quand quelque chose se produit : touche appuyée, clic, fenêtre fermée |
| **État du jeu** (*game state*) | Toutes les données qui décrivent le jeu à un instant : positions, score, vies, niveau |

Un tour enchaîne toujours les mêmes quatre étapes, dans cet ordre :

```text
              +-------------------------------------------------+
   début      | 1. TEMPS        dt = durée du tour précédent    |
   d'un tour  |                       |                         |
   ---------->|                       v                         |
              | 2. ÉVÉNEMENTS   lire clavier, souris, fermeture |
              |                       |                         |
              |                       v                         |
              | 3. MISE À JOUR  faire avancer l'état avec dt    |
              |                       |                         |
              |                       v                         |
              | 4. DESSIN       clear, draw, display            |
              +-----------------------|-------------------------+
                                      |
                  fenêtre encore ouverte ? oui : retour au début
                                      |
                                      non : fin du programme
```

| Étape | Question à laquelle elle répond | Outil SFML 2 |
|---|---|---|
| 1. Temps | Combien de temps s'est écoulé depuis le dernier tour ? | `sf::Clock`, `restart()` |
| 2. Événements | Que veut faire le joueur ? A-t-il fermé la fenêtre ? | `pollEvent`, `sf::Event` |
| 3. Mise à jour | Où sont les choses maintenant ? | du code de jeu, avec `dt` |
| 4. Dessin | À quoi ressemble le monde maintenant ? | `clear`, `draw`, `display` |

La mise à jour **modifie l'état** sans rien dessiner ; le dessin **lit l'état** sans rien modifier. Cette séparation permet de changer l'un sans toucher à l'autre.

## Une première boucle : la fenêtre qui reste ouverte

Avant d'ajouter le temps et la mise à jour, voici la boucle réduite à l'essentiel : événements et dessin.

```cpp
#include <SFML/Graphics.hpp>   // en-tête de SFML

int main()
{
    sf::RenderWindow window(sf::VideoMode(800, 600), "Ma boucle de jeu");

    // isOpen() vaut vrai tant que la fenêtre n'a pas été fermée : c'est la boucle de jeu
    while (window.isOpen()) {
        sf::Event event;   // une case vide pour recevoir un événement (type sf::Event)
        // pollEvent range dans « event » le plus ancien événement en attente et renvoie
        // vrai ; elle renvoie faux quand il n'y en a plus : le while vide toute la file
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)   // l'utilisateur a cliqué sur la croix
                window.close();                    // ferme la fenêtre : isOpen() est faux
        }
        window.clear(sf::Color::Black);   // efface l'image précédente
        window.display();                 // affiche la nouvelle image
    }
    return 0;   // atteint seulement une fois la fenêtre fermée
}
```

Un **événement** n'arrive pas directement dans le code : le système le dépose dans une **file d'attente** (une liste où l'on retire dans l'ordre d'arrivée). Plusieurs événements peuvent s'y accumuler pendant un tour (une touche appuyée, une souris déplacée) : d'où le `while` autour de `pollEvent` et non un simple `if`. Cette lecture « regarde s'il y a quelque chose, puis continue même si la file est vide » s'appelle le **polling** (« interrogation »).

## La structure `Game::run`

Un vrai jeu regroupe la boucle et l'état dans une [classe](/?c=langages&s=cpp&p=classes-et-objets), souvent nommée `Game`, dont la fonction `run` contient la boucle. Chaque étape du tour devient une fonction :

| Fonction | Étape | Rôle |
|---|---|---|
| `run()` | 1 | Mesure `dt`, puis appelle les trois autres dans l'ordre, tant que la fenêtre est ouverte |
| `processEvents()` | 2 | Vide la file d'événements (fermeture, touche Échap) |
| `update(float dt)` | 3 | Fait avancer l'état du jeu de `dt` secondes |
| `render()` | 4 | Dessine l'état et l'affiche |

Le programme complet : un carré vert que les flèches du clavier déplacent.

```cpp
#include <SFML/Graphics.hpp>   // en-tête de SFML

// Une classe regroupe l'état du jeu et les fonctions qui le font vivre
class Game {
public:   // ce qui est utilisable depuis l'extérieur de la classe
    // Constructeur : appelé à la création d'un Game ; après « : », la liste
    // d'initialisation construit chaque membre (dans l'ordre de leur déclaration plus bas)
    Game()
        : window(sf::VideoMode(800, 600), "Ma boucle de jeu"),
          player(sf::Vector2f(50.f, 50.f))   // carré de 50 x 50 pixels ; 50.f est un float
    {
        window.setFramerateLimit(60);   // plafond de 60 images par seconde (voir plus bas)
        player.setFillColor(sf::Color::Green);   // couleur de remplissage du carré
        player.setPosition(375.f, 275.f);    // coin haut gauche, pour centrer le carré
    }

    void run()   // void : la fonction ne renvoie rien
    {
        sf::Clock clock;   // chronomètre ; il démarre à sa création
        while (window.isOpen()) {   // un tour de boucle par image
            // restart() remet le chronomètre à zéro et renvoie le temps écoulé depuis le
            // dernier départ, dans un sf::Time ; asSeconds() le convertit en secondes
            float dt = clock.restart().asSeconds();
            processEvents();   // étape 2 : les événements
            update(dt);        // étape 3 : l'état du jeu
            render();          // étape 4 : l'image
        }
    }

private:   // ce qui n'est utilisable que depuis l'intérieur de la classe
    void processEvents()
    {
        sf::Event event;
        while (window.pollEvent(event)) {   // vide la file d'attente, comme plus haut
            if (event.type == sf::Event::Closed)   // clic sur la croix de la fenêtre
                window.close();
            // && : « et » ; KeyPressed : une touche vient d'être appuyée
            if (event.type == sf::Event::KeyPressed
                && event.key.code == sf::Keyboard::Escape)   // la touche Échap
                window.close();
        }
    }

    void update(float dt)   // dt : secondes écoulées depuis le tour précédent
    {
        const float speed = 200.f;   // const : ne changera plus ; 200 pixels par seconde
        // sf::Vector2f : un vecteur de deux float, x (horizontal) et y (vertical)
        sf::Vector2f direction(0.f, 0.f);   // direction voulue ; (0, 0) : aucune
        // isKeyPressed vaut vrai tant que la touche est enfoncée, à l'instant de l'appel
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
            direction.x -= 1.f;   // vers la gauche : x diminue
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
            direction.x += 1.f;   // vers la droite : x augmente
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
            direction.y -= 1.f;   // vers le haut : y diminue (l'axe y descend dans SFML)
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
            direction.y += 1.f;   // vers le bas : y augmente
        player.move(direction * speed * dt);   // déplace de direction x vitesse x dt
    }

    void render()
    {
        window.clear(sf::Color::Black);   // efface l'image précédente
        window.draw(player);              // dessine le carré à sa position actuelle
        window.display();                 // affiche l'image terminée
    }

    sf::RenderWindow window;     // la fenêtre (déclarée en premier, construite en premier)
    sf::RectangleShape player;   // le carré du joueur : une forme rectangulaire
};

int main()
{
    Game game;     // construit le jeu : la fenêtre s'ouvre
    game.run();    // la boucle tourne jusqu'à la fermeture de la fenêtre
    return 0;
}
```

Les repères de SFML 2 à connaître pour lire ce code :

| Élément | Ce que c'est |
|---|---|
| `sf::RenderWindow` | La fenêtre **sur laquelle on dessine** : elle sait aussi lire les événements (`pollEvent`) et se fermer (`close`) |
| `sf::Event` | Un événement ; son champ `type` dit lequel (`Closed`, `KeyPressed`...), et `key.code` donne la touche d'un `KeyPressed` |
| `sf::Clock` | Un chronomètre ; `restart()` le remet à zéro **et** renvoie le temps écoulé depuis son dernier départ |
| `sf::Time` | Une durée ; `asSeconds()` la donne en secondes (`float`), `asMilliseconds()` en millisecondes |
| `window.clear(couleur)` | Remplit toute la zone de dessin d'une couleur, pour effacer l'image précédente |
| `window.draw(objet)` | Dessine un objet dans une zone **invisible** (le tampon arrière, voir la ligne suivante), pas encore à l'écran |
| `window.display()` | Échange les deux tampons : l'image terminée devient visible. C'est le [double tampon](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-double-buffering-eviter-l-image-a-moitie-dessinee) (le dessin se fait dans un tampon invisible, échangé d'un coup avec celui qui est affiché), le rôle de `glfwSwapBuffers` |

Deux façons de lire le clavier coexistent, pour deux besoins différents :

| | Événement `KeyPressed` | État `isKeyPressed` |
|---|---|---|
| Où | Dans `processEvents`, par `pollEvent` | Dans `update`, à chaque tour |
| Quand | Une fois à l'appui de la touche, puis répété par le système si on la maintient (`setKeyRepeatEnabled(false)` supprime la répétition) | À chaque tour, vrai tant que la touche est enfoncée |
| Convient à | Une action ponctuelle : quitter, mettre en pause, tirer une fois | Un mouvement continu : marcher, tourner |

## La vitesse : des pixels par seconde, multipliés par le delta time

Dans `update`, `player.move(direction * speed * dt)` déplace le carré de `200 x dt` pixels. La vitesse est exprimée en **pixels par seconde** et non en pixels par image. Le principe (et son piège du pas fixe) est expliqué dans [le chapitre sur GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#le-delta-time-une-vitesse-independante-de-la-machine) ; voici seulement les chiffres pour une vitesse de 200 pixels par seconde, comparée à un pas fixe de 5 pixels par image (valeurs calculées par un programme de test) :

| Machine | `dt` | Déplacement par image (200 x `dt`) | Après 1 seconde | Pas fixe de 5 px par image après 1 s |
|---|---|---|---|---|
| 60 images par seconde | 1 / 60 = 0,0167 s | 3,33 px | 60 x 3,33 = **200 px** | 60 x 5 = 300 px |
| 30 images par seconde | 1 / 30 = 0,0333 s | 6,67 px | 30 x 6,67 = **200 px** | 30 x 5 = 150 px |

Chaque image avance moins vite quand elles sont nombreuses, mais le total par seconde reste 200 : le joueur ne voit aucune différence de vitesse entre les deux machines, sauf la fluidité.

> **Piège (entier contre flottant) :** un **flottant** (`float`) est un nombre à virgule ; un **entier** (`int`) n'en a pas et **tronque** (supprime la partie décimale : 3,33 devient 3). Avec des entiers, la vitesse dérive ou s'arrête. À 60 images par seconde, `static_cast<int>(200 * dt)` (qui convertit le nombre en entier, voir [les casts C++](/?c=langages&s=cpp&p=cast-cpp)) vaut 3 : après une seconde le carré n'a parcouru que 180 pixels au lieu de 200. À 144 images par seconde et 50 pixels par seconde, le pas vaut 0,347 px, tronqué à 0 : **le carré ne bouge jamais**. De même, `float dt = 1 / 60;` donne 0, car la division de deux entiers est entière : écrire `1.f / 60`. Garder `dt`, la vitesse et la position en `float`.

> **Piège (delta time énorme) :** après une pause (le programme suspendu, un point d'arrêt dans le débogueur), ou sur certains systèmes quand l'utilisateur déplace la fenêtre (la boucle peut se figer pendant tout le déplacement), le premier `dt` suivant peut valoir plusieurs secondes. Pour une pause de 3 secondes, le carré saute de 200 x 3 = **600 pixels** d'un coup, hors de l'écran. On **plafonne** `dt` : au-delà du plafond, le jeu ralentit pour une image au lieu de bondir. Avec un plafond de 0,1 s, le saut tombe à 200 x 0,1 = 20 pixels.

```cpp
float dt = clock.restart().asSeconds();   // durée du tour précédent, en secondes
if (dt > 0.1f)   // plus de 0,1 s : une pause a eu lieu (moins de 10 images par seconde)
    dt = 0.1f;   // on plafonne : le jeu fait comme si seulement 0,1 s s'était écoulée
```

> **Piège (chronomètre créé trop tôt) :** `sf::Clock` démarre à sa création. Créé dans le constructeur de `Game`, il compte aussi la durée du chargement de la fenêtre : le premier `dt` serait trop grand. On le crée donc juste avant la boucle, comme dans `run()`. Un même chronomètre ne doit pas non plus servir à deux usages : voir [un seul chronomètre par usage](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#un-seul-chronometre-par-usage).

## Le déplacement en diagonale : la normalisation

Dans le programme ci-dessus, appuyer sur deux flèches à la fois (droite et bas) additionne les deux directions. Un [vecteur](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) est une liste de nombres traitée comme une seule chose, ici le couple `(x, y)` ; la direction voulue est donc `(1, 0) + (0, 1) = (1, 1)`. Sa longueur (sa **norme**, voir [la norme d'un vecteur](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#la-norme-d-un-vecteur-sa-longueur)) se calcule avec le théorème de Pythagore : la **racine carrée** (le nombre qui, multiplié par lui-même, redonne le nombre de départ) de la somme des carrés des composantes.

```text
longueur((1, 0)) = racine(1 x 1 + 0 x 0) = racine(1) = 1
longueur((1, 1)) = racine(1 x 1 + 1 x 1) = racine(2) = 1,4142... soit environ 1,41
```

Le carré qui avance en diagonale parcourt donc chaque seconde 1,41 fois la distance d'un déplacement droit. Mesure sur une seconde à 60 images par seconde, vitesse 200 :

| Touches | Direction | Longueur de la direction | Distance parcourue en 1 s |
|---|---|---|---|
| Droite seule | `(1, 0)` | 1 | 200 px |
| Droite + Bas, sans correction | `(1, 1)` | 1,41 | **282,84 px** (200 sur x et 200 sur y) |
| Droite + Bas, **normalisée** | `(0,7071; 0,7071)` | 1 | 200 px (141,42 sur chaque axe) |
| Gauche + Droite | `(0, 0)` | 0 | 0 px |

**Normaliser** un vecteur (voir [le chapitre sur les vecteurs](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#la-norme-d-un-vecteur-sa-longueur)) consiste à diviser chacune de ses composantes par sa longueur : la direction reste la même, la longueur devient exactement 1. Ici, `(1 / 1,41 ; 1 / 1,41) = (0,7071 ; 0,7071)`, de longueur `racine(0,7071² + 0,7071²) = racine(1) = 1`. On normalise la direction **avant** de la multiplier par la vitesse.

La dernière ligne du tableau est le piège : gauche et droite appuyées ensemble s'annulent, la direction est le **vecteur nul** `(0, 0)`, de longueur 0. Normaliser, c'est diviser par 0 : le résultat est **NaN** (*Not a Number*, « pas un nombre », la valeur que produit `0 / 0`) ; une position qui devient NaN le reste, car tout calcul avec NaN donne NaN, et le carré **disparaît de l'écran** pour de bon. D'où une garde : on ne normalise jamais un vecteur nul.

```cpp
#include <cmath>   // fichier d'en-tête des fonctions mathématiques du C++ : std::sqrt
// ... le reste de Game est inchangé ; seule la fonction update est remplacée :

void update(float dt)
{
    const float speed = 200.f;   // pixels par seconde
    sf::Vector2f direction(0.f, 0.f);
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
        direction.x -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
        direction.x += 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
        direction.y -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
        direction.y += 1.f;

    // std::sqrt calcule la racine carrée ; la longueur est celle du théorème de Pythagore
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0.f) {   // GARDE : jamais de division par une longueur nulle
        direction /= length;   // normalise : chaque composante est divisée par la longueur
        player.move(direction * speed * dt);   // vitesse x dt, dans la direction normalisée
    }
}
```

Mesuré par un petit programme de test écrit pour ce chapitre (sans SFML) : sans garde, `(0, 0)` normalisé donne `(nan, nan)` (le signe affiché varie selon la machine) ; avec garde, `(0, 0)`.

## Une opération longue dans un tour gèle le jeu

Les événements ne sont lus qu'à l'étape 2 de **chaque** tour. Un tour qui dure 2 secondes laisse le joueur sans réponse pendant 2 secondes : aucune touche n'est traitée, la fenêtre n'est plus redessinée, et le système peut afficher « ne répond pas » et proposer de fermer le programme. Le temps disponible par tour dépend de la cadence visée :

| Images par seconde visées | Durée disponible par tour (1000 ms / images) |
|---|---|
| 30 | 33,33 ms (une milliseconde, ms, est un millième de seconde) |
| 60 | 16,67 ms |
| 144 | 6,94 ms |

Une mise à jour plus lente que ce budget fait chuter la cadence : à 50 ms par tour, le jeu tourne à 20 images par seconde. Deux remèdes :

| Remède | Principe |
|---|---|
| **Découper le travail** | Faire une petite tranche par tour (un niveau chargé sur dix à chaque image), de façon que chaque tour reste sous le budget |
| **Déléguer à un autre fil d'exécution** (*thread*) | Un **fil** est un second déroulement du programme, qui avance en même temps que le premier (voir [les threads](/?c=langages&s=c&p=threads)) : le gros calcul s'y fait pendant que la boucle continue de tourner ; en contrepartie, les deux fils ne doivent pas modifier les mêmes données en même temps |

```cpp
// Mauvais : tout le chargement dans un seul tour, la fenêtre est figée pendant 2 secondes
void update(float dt)
{
    loadAllLevels();   // fonction imaginaire, très longue
}

// Meilleur : une seule tranche par tour ; loaded et total sont deux entiers de la classe
void update(float dt)
{
    if (loaded < total)           // il reste du travail
        loadOneLevel(loaded++);   // fonction imaginaire : charge un niveau, passe au suivant
}
```

## Sans plafond d'images, la boucle consomme tout le processeur

Rien dans la boucle ne l'oblige à attendre : elle enchaîne les tours aussi vite que possible, des milliers d'images par seconde, dont presque aucune n'est visible (un écran n'affiche que 60 ou 144 images par seconde). Un **cœur** du processeur (une des unités de calcul indépendantes dont il est fait) tourne alors à 100 % pour rien : l'ordinateur chauffe, le ventilateur s'emballe, la batterie fond. Deux réglages existent dans SFML 2 :

| Réglage | Effet | Remarque |
|---|---|---|
| Aucun | Cadence maximale, un cœur à 100 % | À éviter, sauf pour mesurer les performances |
| `window.setFramerateLimit(60)` | Après chaque `display()`, le programme dort juste assez pour ne pas dépasser 60 images par seconde | Réglage simple ; la cadence réelle est approximative |
| `window.setVerticalSyncEnabled(true)` | `display()` attend le prochain rafraîchissement de l'écran : voir [la synchronisation verticale](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#la-synchronisation-verticale-vsync) | Évite le *tearing* (image coupée en deux, voir le double tampon) ; le pilote peut la désactiver |

La documentation de SFML déconseille d'activer les deux en même temps. Aucun des deux ne règle la **vitesse** du jeu : seul le delta time le fait, car la cadence réelle varie d'une machine à l'autre.

## L'ordre des étapes compte

Les quatre étapes ne sont pas interchangeables. Chaque permutation produit un défaut précis :

| Ordre fautif | Symptôme |
|---|---|
| `clear` **après** `draw` (avant `display`) | Écran vide : le dessin est effacé avant d'être affiché |
| `display` **avant** `draw` | L'image affichée a un tour de retard, parfois scintillante |
| `render` **avant** `update` | Ce qui est dessiné est l'état d'avant la mise à jour : un tour de retard |
| `update` **avant** `processEvents` | Les ordres du joueur ne sont pris en compte qu'au tour suivant : une image de latence de plus |

L'ordre de référence : temps, événements, mise à jour, puis `clear`, `draw`, `display`.

## L'alternative : la boucle pilotée par événements

Au lieu d'interroger la file d'attente à chaque tour (*polling*), le programme peut s'**endormir** jusqu'à l'arrivée d'un événement : c'est une **attente bloquante** (le programme est suspendu et ne consomme presque rien tant que rien ne se passe). SFML 2 l'offre avec `waitEvent`, qui bloque jusqu'à un événement puis le renvoie :

```cpp
// À placer dans la classe Game, à côté de run() : une boucle qui réagit, sans dt
void runEventDriven()
{
    render();           // un premier dessin, avant la première attente
    sf::Event event;
    // waitEvent endort le programme jusqu'à l'arrivée d'un événement, puis le range dans
    // « event » ; elle renvoie faux en cas d'erreur, ce qui arrête la boucle
    while (window.isOpen() && window.waitEvent(event)) {
        if (event.type == sf::Event::Closed)   // clic sur la croix
            window.close();
        if (event.type == sf::Event::KeyPressed
            && event.key.code == sf::Keyboard::Right)
            player.move(10.f, 0.f);   // un pas fixe de 10 pixels par appui : l'état change
        render();                     // on ne redessine qu'après un événement
    }
}
```

Ici, **rien ne bouge sans événement** : le carré avance d'un pas à chaque appui, jamais tout seul. Pas besoin de `dt` : le déplacement est lié à l'événement, pas au temps. Un jeu d'action a besoin du contraire (les ennemis avancent même quand le joueur ne touche à rien).

| | Boucle continue (`pollEvent`) | Boucle pilotée par événements (`waitEvent`) |
|---|---|---|
| Principe | Un tour après l'autre, sans attendre | Le programme dort jusqu'au prochain événement |
| Calcul au repos | Constant : un tour complet par image, même sans rien à faire | Presque nul : le processeur est libre |
| Si le joueur ne fait rien | Le monde continue d'avancer (ennemis, chute, animations) | Rien ne bouge |
| Delta time | Indispensable | Sans objet pour le mouvement |
| Plafond d'images | Nécessaire | Inutile : le rythme vient des événements |
| Convient à | Jeux d'action, simulations, animations | Éditeurs, jeux au tour par tour (échecs, cartes), outils |
| Piège principal | Boucle trop gourmande ou figée par un calcul long | Animation impossible, car rien ne réveille la boucle |

Les deux boucles se combinent : une application d'édition attend les événements tant que l'utilisateur n'agit pas, et passe en boucle continue le temps d'une animation.

## Les pièges

| Piège | Symptôme | Correctif |
|---|---|---|
| Pas de boucle | La fenêtre apparaît puis disparaît aussitôt | `while (window.isOpen())` autour du tour |
| Une opération longue dans un tour | Fenêtre figée, « ne répond pas » | Découper le travail ou le confier à un autre fil d'exécution |
| Pas de plafond d'images | Un cœur à 100 %, ventilateur bruyant | `setFramerateLimit(60)` **ou** `setVerticalSyncEnabled(true)`, pas les deux |
| Ordre des étapes fautif | Écran vide, images en retard, latence | Temps, événements, mise à jour, `clear`, `draw`, `display` |
| `dt` énorme après une pause ou un déplacement de la fenêtre | Le carré saute de plusieurs centaines de pixels | Plafonner `dt` (par exemple à 0,1 s) |
| Oublier `window.clear()` | Chaque image se superpose aux précédentes : traînées, image qui bave | Effacer au début de chaque rendu |
| Lire un mouvement continu dans `KeyPressed` | Un seul pas à l'appui, puis une pause, puis des pas saccadés (la répétition du système) | `isKeyPressed` dans `update` pour un mouvement continu ; `KeyPressed` pour les actions ponctuelles |
| Croire que `isKeyPressed` dépend de la fenêtre | Elle lit le clavier à tout instant : le carré bouge même si l'utilisateur tape dans une autre fenêtre | Ne tenir compte des touches que si `window.hasFocus()` vaut vrai (la fenêtre est celle qui reçoit le clavier : le *focus*) |
| Entiers dans la vitesse ou dans `dt` | Vitesse trop faible, voire nulle ; `1 / 60` vaut 0 | Tout en `float` ; écrire `1.f / 60` |
| Additionner les touches sans normaliser | Diagonale 1,41 fois plus rapide | Normaliser la direction |
| Normaliser un vecteur nul | Division par 0, NaN, carré disparu | Tester `length > 0.f` avant de diviser |
| Un seul chronomètre pour deux usages | `dt` faux | Un `sf::Clock` par usage |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Une fonction par étape (`processEvents`, `update`, `render`) | Chaque étape se lit, se teste et se modifie seule |
| `update` ne dessine pas, `render` ne modifie pas l'état | L'état reste cohérent ; on peut changer l'affichage sans toucher aux règles du jeu |
| Toutes les vitesses en unités par seconde, multipliées par `dt` | Même vitesse sur toutes les machines |
| Plafonner `dt` | Une pause ne téléporte plus les objets |
| Un plafond d'images (`setFramerateLimit` ou vsync) | Le processeur n'est pas gaspillé |
| Normaliser la direction, avec garde contre le vecteur nul | Même vitesse dans toutes les directions, jamais de NaN |
| Événement pour les actions ponctuelles, `isKeyPressed` pour les mouvements continus | Chaque besoin utilise l'outil qui lui correspond |
| Garder `update` courte ; découper ou déléguer les gros calculs | La fenêtre reste réactive |
| Choisir la boucle selon le programme : continue pour un monde qui vit seul, événementielle pour un outil | Une boucle continue sans raison gaspille la batterie |

Pour approfondir : le [tutoriel officiel sur les événements](https://www.sfml-dev.org/tutorials/2.6/window-events.php) (`pollEvent`, `waitEvent`, types d'événements), la page de [`sf::Clock`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Clock.php) (le chronomètre et `restart()`), la page de [`sf::Keyboard`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Keyboard.php) (`isKeyPressed` et les noms des touches) et la page de [`sf::Window`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Window.php) (`setFramerateLimit`, `setVerticalSyncEnabled`, `hasFocus`).

## Ce qu'il faut retenir

| À retenir | Détail |
|---|---|
| Sans boucle, le programme se termine | `main` s'arrête à sa dernière ligne : la fenêtre disparaît aussitôt |
| Un tour = quatre étapes dans cet ordre | Temps (`dt`), événements, mise à jour de l'état, dessin (`clear`, `draw`, `display`) |
| `Game::run` | La boucle `while (window.isOpen())` appelle `processEvents`, `update(dt)` et `render` ; `dt = clock.restart().asSeconds()` |
| Vitesse | En pixels par seconde, multipliée par `dt` : 200 px/s donne 3,33 px par image à 60 images par seconde et 6,67 px à 30, soit 200 px dans les deux cas |
| Diagonale | `(1, 1)` a pour longueur racine(2), environ 1,41 : le déplacement va 1,41 fois plus vite ; on normalise (division par la longueur) |
| Vecteur nul | Jamais normalisé : `length > 0.f` avant la division, sinon NaN |
| Boucle continue contre boucle pilotée par événements | `pollEvent` (le monde avance seul, coût constant) contre `waitEvent` (presque aucun calcul au repos, mais rien ne bouge sans événement) |
| Limites | Une opération longue gèle le jeu ; sans plafond d'images la boucle consomme un cœur entier ; l'ordre des étapes compte |
| Pièges de `dt` | Plafonner après une pause ; tout en `float` ; un chronomètre par usage |
| Ne pas confondre | Événement `KeyPressed` (ponctuel) et `isKeyPressed` (état continu) |
