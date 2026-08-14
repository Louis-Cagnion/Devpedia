---
order: 1
---

# Os seletores

Um **seletor** determina a que elementos HTML se aplica uma regra CSS: desde o mais simples (uma baliza) até ao mais preciso (uma combinação de atributos e posição na árvore do documento).

## Seletores básicos

```css
h1 { }             /* tous les éléments <h1> */
.carte { }          /* tous les éléments avec class="carte" */
#en-tete { }          /* l'unique élément avec id="en-tete" */
* { }                   /* absolument tous les éléments */
```

> **Nota:** uma «`class`» pode ser reutilizada em vários elementos, um «`id`» deve permanecer **único** em toda a página: um seletor «`#id`» visa, portanto, sempre um único elemento específico, ao contrário de «`.classe`».

## Combinadores

```css
article p { }        /* tout <p> descendant de <article>, à N'IMPORTE quelle profondeur */
article > p { }        /* tout <p> ENFANT DIRECT de <article>, pas plus profond */
h2 + p { }               /* le <p> immédiatement APRÈS un <h2>, au même niveau */
h2 ~ p { }                /* TOUS les <p> qui suivent un <h2>, au même niveau */
```

## Seletores de atributos

```css
input[type="email"] { }         /* tout <input> avec cet attribut ET cette valeur exacte */
a[href^="https"] { }              /* href qui COMMENCE par "https" */
a[href$=".pdf"] { }                 /* href qui SE TERMINE par ".pdf" */
a[href*="exemple"] { }                /* href qui CONTIENT "exemple" n'importe où */
```

## Pseudoclasses: identificar um estado

```css
a:hover { }          /* quand la souris survole l'élément */
input:focus { }        /* quand le champ a le focus (clic ou tabulation) */
li:first-child { }       /* le premier enfant de son parent */
li:last-child { }          /* le dernier enfant de son parent */
li:nth-child(2) { }          /* le 2e enfant précisément */
li:nth-child(odd) { }          /* tous les enfants impairs (1er, 3e, 5e...) */
input:disabled { }               /* un champ désactivé */
input:required { }                 /* un champ marqué "required" en HTML (cf. chapitre formulaires) */
```

## Pseudo-elementos: selecionar uma parte de um elemento

```css
p::first-line { }     /* uniquement la première ligne affichée du paragraphe */
p::before { content: "→ "; }  /* insère du contenu AVANT le texte réel du paragraphe */
p::after { content: " ✓"; }    /* insère du contenu APRÈS */
```

> **Nota:** `::before` / `::after` requerem a propriedade `content` para serem visíveis (mesmo que esteja vazia, `content: "";`), muito utilizadas para adicionar um elemento puramente decorativo (ícone, seta...) sem sobrecarregar o HTML com uma baliza adicional sem significado semântico real (ver capítulo sobre a semântica HTML5).

## A particularidade: o que acontece em caso de conflito?

```css
p { color: blue; }
.texte-important { color: red; }
#paragraphe-unique { color: green; }
```

```html
<p id="paragraphe-unique" class="texte-important">Quelle couleur ?</p>
```

Um «`id`» tem uma especificidade maior do que um «`class`», que por sua vez é mais específico do que um seletor de baliza: o parágrafo será, portanto, apresentado a **verde** (o «`#paragraphe-unique`» prevalece), independentemente da ordem em que as regras estiverem escritas no arquivo.

| Tipo de seletor | Peso (do mais fraco ao mais forte) |
|---|---|
| Seletor universal (`*`) | O mais fraco |
| Etiqueta (`p`, `div`...) | Baixa |
| Classe (`.carte`), atributo (`[type=...]`), pseudoclasse (`:hover`) | Médio |
| `id` (`#en-tete`) | Fort |
| Estilo em linha (`style="..."`) | Muito forte |
| `!important` | Sobrescreve tudo o resto (a evitar, ver capítulo sobre a cascata) |

Ver também o capítulo sobre a cascata, que detalha com precisão a ordem de resolução entre especificidade, ordem de escrita e origem da regra.
