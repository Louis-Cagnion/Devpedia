---
order: 7
---

# O responsive design e as media queries

O **responsive design** consiste em projetar uma página que se adapta a qualquer tamanho de tela (celular, tablet, computador): uma necessidade desde que a maioria do tráfego web acontece no celular, e a principal razão de existir das **media queries**.

## As unidades relativas, antes mesmo das media queries

```css
div {
    width: 300px;       /* fixo, nao se adapta a NADA */
    width: 50%;         /* relativo ao pai */
    font-size: 1.5rem;  /* relativo ao tamanho de fonte raiz (<html>), independente do pai */
    font-size: 1.5em;   /* relativo ao tamanho de fonte do PAI direto (pode se acumular em cascata) */
    width: 50vw;        /* relativo a largura da janela (viewport width) */
    height: 100vh;      /* relativo a altura da janela (viewport height) */
}
```

> **Nota:** `rem` geralmente é preferido a `em` para tamanhos de fonte, pois continua previsível mesmo em componentes aninhados (um `em` em um elemento cujo pai já tem um `em` modificado se acumula de forma frequentemente indesejada); `rem` sempre se baseia na mesma referência (`<html>`), qualquer que seja a profundidade de aninhamento.

## As media queries

```css
/* Estilo padrao, pensado "mobile first" */
.container {
    flex-direction: column;
}

/* Se aplica APENAS se a largura da tela atingir pelo menos 768px */
@media (min-width: 768px) {
    .container {
        flex-direction: row;
    }
}

/* Se aplica APENAS se a largura da tela for de no maximo 767px */
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
@media (orientation: portrait) { }       /* tela mais alta que larga */
@media (prefers-color-scheme: dark) { }  /* o usuario ativou o modo escuro no nivel do sistema */
@media print { }                         /* estilos aplicados apenas na impressao */
```

Veja também [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), cujo `repeat(auto-fit, minmax(...))` permite obter um comportamento responsivo **sem escrever nenhuma media query**, uma alternativa complementar a conhecer.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O responsive design adapta uma página a qualquer tamanho de tela, via unidades relativas (`%`, `rem`, `vw`/`vh`) e media queries (`@media (min-width: ...)`) que aplicam um estilo apenas para certas larguras. |
| **Ferramentas utilizáveis** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme)`. |
| **Armadilhas a evitar** | Basear seus pontos de corte em tamanhos de dispositivos precisos em vez do momento em que o layout realmente quebra visualmente. |
| **Boas práticas** | Adotar uma abordagem *mobile first* (`min-width`, estilizar primeiro a tela menor); preferir `rem` a `em` para tamanhos de fonte, mais previsível em caso de aninhamento. |
