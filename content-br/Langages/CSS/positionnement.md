---
order: 4
---

# O posicionamento (position, z-index)

A propriedade `position` muda fundamentalmente a forma como um elemento é colocado na página: além do fluxo normal (cada elemento um depois do outro) que [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) e [Grid](/?c=langages-de-balisage&s=css&p=grid) já gerenciam.

## `static`: o comportamento padrão

```css
div {
    position: static;   /* valor padrao: segue o fluxo normal do documento */
}
```

Um elemento `static` ignora totalmente `top`/`left`/`right`/`bottom`: essas propriedades só têm efeito nos outros valores de `position`.

## `relative`: deslocado em relação à sua posição de origem

```css
div {
    position: relative;
    top: 10px;   /* deslocado 10px para BAIXO em relacao a sua posicao normal */
    left: 20px;  /* deslocado 20px para a DIREITA */
}
```

> **Nota:** o elemento mantém seu espaço de origem **reservado** no fluxo (os outros elementos não se movem para compensar); apenas sua exibição visual é deslocada. `position: relative` também serve muito frequentemente para uma segunda coisa: definir um ponto de referência para um filho em `position: absolute` (veja abaixo).

## `absolute`: posicionado em relação a um ancestral posicionado

```css
.container {
    position: relative;   /* torna-se o ponto de referencia */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* posicionado no canto superior direito DE .container */
}
```

Um elemento `absolute` é retirado do fluxo normal (os outros elementos se comportam como se ele não existisse mais), e posicionado em relação ao seu ancestral posicionado mais próximo (`relative`, `absolute`, `fixed` ou `sticky`); se não houver nenhum, em relação à página inteira (`<html>`).

> **Nota (armadilha clássica):** um `.badge { position: absolute; }` sem **nenhum** ancestral posicionado se posiciona em relação à página inteira, não apenas ao seu contêiner visual aparente: é por isso que `.container { position: relative; }` quase sempre acompanha um filho em `absolute`, mesmo sem nenhum deslocamento (`top`/`left`) no próprio contêiner.

## `fixed`: posicionado em relação à janela, imóvel na rolagem

```css
.banner-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Permanece na mesma posição visual **mesmo rolando a página**, usado para um menu sempre visível, uma faixa de notificação, etc. Posicionado em relação à janela do navegador (*viewport*), não em relação a um ancestral.

## `sticky`: um híbrido entre `relative` e `fixed`

```css
.cabecalho-tabela {
    position: sticky;
    top: 0;
}
```

Se comporta como `relative` enquanto o elemento está visível em seu lugar normal, e depois se torna `fixed` (grudado na borda especificada, aqui `top: 0`) assim que a rolagem o levaria para fora, usado tipicamente para um cabeçalho de tabela que permanece visível durante a rolagem do conteúdo.

## `z-index`: gerenciar a sobreposição

```css
.modal {
    position: absolute;
    z-index: 100;    /* exibido POR CIMA dos elementos com um z-index menor */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Nota:** `z-index` só tem efeito em um elemento **já posicionado** (`relative`, `absolute`, `fixed` ou `sticky`): em um elemento `static`, `z-index` é simplesmente ignorado. Um valor de `z-index` mais alto é exibido por cima de um valor menor, mas apenas em comparação com elementos que compartilham o mesmo "contexto de empilhamento" (um grupo de elementos comparados entre si para a sobreposição; um elemento posicionado com um `z-index`, uma opacidade menor que 1, ou uma transformação cria um novo contexto para seus próprios filhos: seus `z-index` se comparam ali entre si, nunca diretamente com os de fora); um detalhe que explica alguns casos em que um `z-index` bem alto não basta para passar por cima de um elemento aparentemente menos prioritário.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `position` muda como um elemento é colocado: `static` (padrão, fluxo normal), `relative` (deslocado, lugar reservado), `absolute` (retirado do fluxo, relativo a um ancestral posicionado), `fixed` (relativo à janela), `sticky` (híbrido relative/fixed). `z-index` gerencia a sobreposição, mas apenas entre elementos posicionados. |
| **Ferramentas utilizáveis** | `position`, `top`/`right`/`bottom`/`left`, `z-index`. |
| **Armadilhas a evitar** | Um `absolute` sem ancestral `relative` se posiciona em relação à página inteira, não ao contêiner visual esperado; `z-index` é ignorado em um elemento `static`. |
| **Boas práticas** | Sempre colocar `position: relative` no contêiner de um filho em `absolute`, mesmo sem deslocamento próprio nesse contêiner. |
