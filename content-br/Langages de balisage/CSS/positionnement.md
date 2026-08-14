---
order: 4
---

# O posicionamento (posição, z-index)

A propriedade `position` altera fundamentalmente a forma como um elemento é posicionado na página, para além do fluxo normal (cada elemento a seguir ao outro) já gerido pelo Flexbox e pelo Grid (ver capítulos dedicados).

## `static` : o comportamento por padrão

```css
div {
    position: static;   /* valeur par défaut : suit le flux normal du document */
}
```

Um elemento `static` ignora completamente `top` / `left` / `right` / `bottom`: estas propriedades só têm efeito sobre os outros valores de `position`.

## `relative` : deslocado em relação à sua posição original

```css
div {
    position: relative;
    top: 10px;     /* décalé de 10px vers le BAS par rapport à sa position normale */
    left: 20px;      /* décalé de 20px vers la DROITE */
}
```

> **Nota:** o elemento mantém a sua posição original **reservada** no fluxo (os outros elementos não se deslocam para compensar): apenas a sua apresentação visual é deslocada. O comando «`position: relative`» também é frequentemente utilizado para um segundo objetivo: definir um ponto de referência para um elemento filho em «`position: absolute`» (ver mais abaixo).

## `absolute` : posicionado em relação a um antepassado posicionado

```css
.conteneur {
    position: relative;   /* devient le point de référence */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* positionné dans le coin supérieur droit DE .conteneur */
}
```

Um elemento `absolute` é retirado do fluxo normal (os outros elementos comportam-se como se ele já não existisse) e posicionado em relação ao seu antepassado mais próximo (`relative`, `absolute`, `fixed` ou `sticky`); caso não exista nenhum, em relação à página inteira (`<html>`).

> **Nota (armadilha clássica):** um elemento `.badge { position: absolute; }` sem **nenhum** antepassado posicionado posiciona-se em relação a toda a página, e não apenas ao seu contentor visual visível: é por isso que `.conteneur { position: relative; }` acompanha quase sistematicamente um elemento filho com `absolute`, mesmo sem qualquer deslocamento (`top` / `left`) no próprio contentor.

## `fixed` : posicionado em relação à janela, fixo durante a deslocamento

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Permanece na mesma posição visual **mesmo ao percorrer a página**: utilizado para um menu sempre visível, uma barra de notificações, etc. Posicionado em relação à janela do navegador (*viewport*), e não em relação a um elemento pai.

## `sticky` : um híbrido entre `relative` e `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Comporta-se como «`relative`» enquanto o elemento estiver visível na sua posição normal e, em seguida, passa a ser «`fixed`» (fixado à margem especificada, neste caso «`top: 0`») assim que a rolagem o fizer sair dessa posição: utilizado normalmente para um cabeçalho de tabela que permanece visível durante a rolagem do conteúdo.

## `z-índice` : gerir a sobreposição

```css
.modale {
    position: absolute;
    z-index: 100;    /* affiché AU-DESSUS des éléments avec un z-index plus faible */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Nota:** `z-índice` só tem efeito num elemento **já posicionado** (`relative`, `absolute`, `fixed` ou `sticky`): num elemento `static`, `z-índice` é simplesmente ignorado. Um valor mais elevado de «`z-índice`» é exibido por cima de um valor mais baixo, mas apenas em comparação com elementos que partilham o mesmo «contexto de pilha», um pormenor que explica certos casos em que um valor muito elevado de «`z-índice`» não é suficiente para se sobrepor a um elemento aparentemente com menor prioridade.
