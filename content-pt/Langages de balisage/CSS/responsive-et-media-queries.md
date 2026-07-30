---
order: 7
---

# O design responsivo e as media queries

O **design responsivo** consiste em conceber uma página que se adapte a qualquer tamanho de ecrã (telemóvel, tablet, computador) — uma necessidade desde que a maior parte do tráfego na Web passa a ocorrer em dispositivos móveis, e a principal razão de ser das **media queries**.

## As unidades relativas, antes mesmo das media queries

```css
div {
    width: 300px;     /* fixe, ne s'adapte à RIEN */
    width: 50%;         /* relatif au parent */
    font-size: 1.5rem;    /* relatif à la taille de police racine (<html>), indépendant du parent */
    font-size: 1.5em;      /* relatif à la taille de police du PARENT direct (peut s'accumuler en cascade) */
    width: 50vw;             /* relatif à la largeur de la fenêtre (viewport width) */
    height: 100vh;             /* relatif à la hauteur de la fenêtre (viewport height) */
}
```

> **Nota:** «`rem`» é geralmente preferível a «`em`» para os tamanhos de tipo, uma vez que se mantém previsível mesmo em componentes aninhados (um «`em`» num elemento cujo pai já tenha um «`em`» alterado acumula-se frequentemente de forma indesejada) — «`rem`» baseia-se sempre na mesma referência («`<html>`»), independentemente da profundidade do aninhamento.

## As media queries

```css
/* Style par défaut, pensé "mobile first" */
.conteneur {
    flex-direction: column;
}

/* S'applique UNIQUEMENT si la largeur d'écran atteint au moins 768px */
@media (min-width: 768px) {
    .conteneur {
        flex-direction: row;
    }
}

/* S'applique UNIQUEMENT si la largeur d'écran est de 767px maximum */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## «Mobile first» vs «desktop first»

```css
/* Approche mobile first : le style de base cible le mobile, on ÉLARGIT ensuite */
.grille { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grille { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grille { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Melhores práticas:** a abordagem «*mobile first*» (utilizar `min-width`, conceber primeiro para o ecrã mais pequeno e, em seguida, adicionar complexidade para os ecrãs maiores) é geralmente preferível ao inverso — obriga a pensar primeiro no conteúdo essencial e está em consonância com o facto de a maioria do tráfego na Web ser proveniente de dispositivos móveis.

## Pontos de interrupção (*breakpoints*) comuns

| Largura | Público-alvo típico |
|---|---|
| `< 768px` | Telemóvel |
| `768px – 1023px` | Tablet |
| `≥ 1024px` | Computador de secretária |

> **Nota:** estes valores não constituem uma norma oficial — variam consoante os projetos e os frameworks CSS. O que realmente importa é ajustar os pontos de quebra em função do próprio conteúdo (o momento em que o layout começa a apresentar problemas visuais), e não apenas reproduzir dimensões físicas precisas dos dispositivos.

## Outros recursos multimédia úteis

```css
@media (orientation: portrait) { }     /* écran plus haut que large */
@media (prefers-color-scheme: dark) { }  /* l'utilisateur a activé le mode sombre au niveau système */
@media print { }                          /* styles appliqués uniquement à l'impression */
```

Consulte também o capítulo sobre CSS Grid, cujo «`repeat(auto-fit, minmax(...))`» permite obter um comportamento responsivo **sem escrever nenhuma media query**, uma alternativa complementar que vale a pena conhecer.
