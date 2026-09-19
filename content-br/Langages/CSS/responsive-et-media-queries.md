---
order: 7
---

# O responsive design e as media queries

O **responsive design** consiste em projetar uma página que se adapta a qualquer tamanho de tela (celular, tablet, computador): uma necessidade desde que a maioria do tráfego web acontece no celular, e a principal razão de existir das **media queries**.

## As unidades relativas, antes mesmo das media queries

```css
div {
    width: 300px;       /* fixo, não se adapta a NADA */
    width: 50%;         /* relativo ao pai */
    font-size: 1.5rem;  /* relativo ao tamanho de fonte raiz (<html>), independente do pai */
    /* relativo ao tamanho de fonte do PAI direto (pode se acumular em cascata) */
    font-size: 1.5em;
    width: 50vw;        /* relativo a largura da janela (viewport width) */
    height: 100vh;      /* relativo a altura da janela (viewport height) */
}
```

> **Nota:** `rem` geralmente é preferido a `em` para tamanhos de fonte, pois continua previsível mesmo em componentes aninhados (um `em` em um elemento cujo pai já tem um `em` modificado se acumula de forma frequentemente indesejada); `rem` sempre se baseia na mesma referência (`<html>`), qualquer que seja a profundidade de aninhamento.

## As media queries

```css
/* Estilo padrão, pensado "mobile first" */
.container {
    flex-direction: column;
}

/* Se aplica APENAS se a largura da tela atingir pelo menos 768px */
@media (min-width: 768px) {
    .container {
        flex-direction: row;
    }
}

/* Se aplica APENAS se a largura da tela for de no máximo 767px */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## "Mobile first" vs "desktop first"

```css
/* Abordagem mobile first: o estilo base mira no celular, depois se AMPLIA */
.grade { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grade { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grade { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Boa prática:** a abordagem "*mobile first*" (usar `min-width`, estilizar primeiro para a tela menor, e depois adicionar complexidade para telas maiores) geralmente é preferida ao inverso: ela força a pensar primeiro no conteúdo essencial, e se alinha com o fato de que a maioria do tráfego web é mobile.

## Pontos de corte (*breakpoints*) comuns

| Largura | Alvo típico |
|---|---|
| `< 768px` | Celular |
| `768px – 1023px` | Tablet |
| `≥ 1024px` | Computador de mesa |

> **Nota:** esses valores **não** são uma norma oficial: variam conforme os projetos e os frameworks CSS. O que realmente importa é fazer variar seus pontos de corte em função do próprio conteúdo (o momento em que o layout começa a funcionar mal visualmente), não apenas reproduzir tamanhos de dispositivos físicos precisos.

## Outras media features úteis

```css
@media (orientation: portrait) { }           /* tela mais alta que larga */
/* o usuário ativou o modo escuro no nível do sistema */
@media (prefers-color-scheme: dark) { }
@media (prefers-reduced-motion: reduce) { }  /* o usuário pediu para reduzir as animações */
@media print { }                             /* estilos aplicados apenas na impressão */
```

`prefers-reduced-motion` responde a uma preferência de acessibilidade ajustada no nível do sistema operacional (usuário sensível a movimento, migrâneas, distúrbios vestibulares), não no nível do site:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
        /* deliberadamente NÃO "animation: none" -- veja a armadilha abaixo */
    }
}
```

> **Cuidado:** substituir a animação por `animation: none`/`transition: none` em vez de uma duração quase nula. Código pode depender dos eventos JavaScript `animationend`/`transitionend` (por exemplo, remover um elemento após terminar sua transição de saída): `none` nunca dispara esses eventos, o que quebra esse código, enquanto uma duração de `0.001ms` continua disparando-os, quase instantaneamente.
>
> **Boa prática:** reduzir uma animação a uma duração quase nula (`0.001ms`) em vez de removê-la completamente com `none`, para continuar disparando os eventos JavaScript dos quais o código pode depender.

## As container queries: medir o contêiner em vez da janela

Uma media query sempre mede a largura da **janela** inteira, o que pode ser enganoso para um componente que ocupa apenas parte da tela (um cartão em uma coluna da grade, ao lado de uma barra lateral): a janela pode estar larga enquanto o espaço realmente disponível para esse componente específico é estreito. Uma **container query** resolve exatamente esse caso medindo, não a janela, mas o contêiner direto do elemento:

```css
/* 1. Marcar um ancestral como "contêiner consultável" */
.carte-conteneur {
    container-type: inline-size;  /* apenas a largura do contêiner é acompanhada */
}

/* 2. A regra @container reage a LARGURA DESSE Contêiner, não a da janela */
@container (max-width: 860px) {
    .carte { flex-direction: column; }
}
```

| | `@media` | `@container` |
|---|---|---|
| Mede | A largura da janela inteira | A largura do ancestral mais próximo marcado com `container-type` |
| Caso de uso típico | Adaptar o layout geral da página | Adaptar um componente reutilizável, seja qual for o espaço alocado a ele |

> **Cuidado:** usar `@media` para adaptar um componente que ocupa apenas parte da tela (um cartão em uma coluna entre várias, ao lado de uma barra lateral). A janela pode continuar larga enquanto o espaço real desse componente já está estreito: o componente então nunca muda de layout, mesmo quando precisaria.
>
> **Boa prática:** usar `@container` assim que um componente precisar reagir ao espaço realmente alocado a ele, em vez do tamanho da janela inteira; reservar `@media` para uma adaptação verdadeiramente global da página.

Veja também [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), cujo `repeat(auto-fit, minmax(...))` permite obter um comportamento responsivo **sem escrever nenhuma media query**, uma alternativa complementar a conhecer.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O responsive design adapta uma página a qualquer tamanho de tela, via unidades relativas (`%`, `rem`, `vw`/`vh`) e media queries (`@media (min-width: ...)`) que aplicam um estilo apenas para certas larguras. |
| **Ferramentas utilizáveis** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme/prefers-reduced-motion)`, `@container` + `container-type` para um componente isolado. |
| **Armadilhas a evitar** | Basear seus pontos de corte em tamanhos de dispositivos precisos em vez do momento em que o layout realmente quebra visualmente. Usar `@media` para um componente que ocupa apenas parte da janela. Responder a `prefers-reduced-motion` com `animation: none` em vez de uma duração quase nula. |
| **Boas práticas** | Adotar uma abordagem *mobile first* (`min-width`, estilizar primeiro a tela menor); preferir `rem` a `em` para tamanhos de fonte, mais previsível em caso de aninhamento; usar `@container` para um componente que precisa reagir ao seu próprio espaço, não à janela; reduzir uma animação a uma duração quase nula em vez de removê-la com `none`, para não quebrar um código que dependa de `animationend`/`transitionend`. |
