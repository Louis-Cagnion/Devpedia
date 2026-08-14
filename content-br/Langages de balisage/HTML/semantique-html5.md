---
order: 6
---

# A semântica do HTML5

Antes do HTML5, a estruturação de uma página baseava-se quase exclusivamente em `<div>`s genéricas, distinguidas apenas pelo seu `class`/`id`; o HTML5 introduziu etiquetas **semânticas**, que descrevem explicitamente a **função** de cada secção, compreensíveis tanto para um ser humano que leia o código como para um navegador, um motor de busca ou um leitor de tela.

## `<div>` genérico vs. etiquetas semânticas

```html
<!-- Antes do HTML5: nada diz o que e cada secao, exceto o nome da classe -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="main-content">...</div>
<div class="footer">...</div>
```

```html
<!-- HTML5: o sentido e transmitido pela propria etiqueta -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

## As principais etiquetas estruturais

```html
<body>
    <header>
        <h1>Nome do site</h1>
        <nav>
            <a href="/">Inicio</a>
            <a href="/contact">Contato</a>
        </nav>
    </header>

    <main>
        <article>
            <h2>Titulo do artigo</h2>
            <section>
                <h3>Primeira parte</h3>
                <p>...</p>
            </section>
            <section>
                <h3>Segunda parte</h3>
                <p>...</p>
            </section>
        </article>

        <aside>
            <p>Conteudo complementar, relacionado mas secundario (ex: links relacionados)</p>
        </aside>
    </main>

    <footer>
        <p>&copy; 2026, Aviso legal</p>
    </footer>
</body>
```

| Etiqueta | Função |
|---|---|
| `<header>` | Cabeçalho de uma página ou de uma secção (não necessariamente no topo da página) |
| `<nav>` | Um bloco com os principais links de navegação |
| `<main>` | O conteúdo principal e único da página (apenas um por página) |
| `<article>` | Conteúdo autónomo, que faça sentido por si só (um artigo de blogue, um comentário) |
| `<section>` | Um agrupamento temático de conteúdos, geralmente com o seu próprio título |
| `<aside>` | Conteúdo relacionado, mas secundário (uma barra lateral, uma nota) |
| `<footer>` | Rodapé de uma página ou de uma secção |

## `<article>` vs `<section>`: a distinção mais confusa

> **Nota:** `<article>` deve fazer sentido **isoladamente**, mesmo fora do seu contexto (um artigo de blogue continuaria a ser compreensível se fosse republicado noutro local); `<section>` reúne conteúdos que só fazem sentido **no seu contexto** (uma secção «Características técnicas» de uma ficha de produto não faz sentido separada do produto). Uma página pode conter vários `<article>`, podendo cada um deles, por sua vez, conter vários `<section>`.

## Por que razão a semântica é importante, para além do estilo

- **Acessibilidade** (ver capítulo dedicado): um leitor de tela pode sugerir saltar diretamente para `<nav>` ou `<main>`, algo que nenhuma `<div class="nav">` permite de forma tão fiável.
- **SEO**: os motores de busca compreendem melhor a estrutura e a importância relativa do conteúdo.
- **Legibilidade do código**: `<header>`/`<main>`/`<footer>` documentam a estrutura diretamente no HTML, sem ser necessário ler os nomes das classes CSS para adivinhar a função de cada bloco.

> **Melhores práticas:** utilizar uma etiqueta semântica sempre que esta corresponder à função real do conteúdo, e recorrer a `<div>` (puramente genérico, sem significado) apenas para um simples contêiner técnico necessário à formatação CSS, sem significado próprio.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As etiquetas semânticas do HTML5 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`) descrevem a função de uma secção, ao contrário de uma `<div>` genérica. `<article>` faz sentido isoladamente, `<section>` apenas no seu contexto. |
| **Ferramentas utilizáveis** | As 7 principais etiquetas estruturais, a combinar conforme a função real de cada secção. |
| **Armadilhas a evitar** | Confundir `<article>` e `<section>`; estruturar tudo com `<div class="...">` quando existe uma etiqueta semântica para essa função. |
| **Boas práticas** | Utilizar uma etiqueta semântica assim que ela corresponder à função real do conteúdo; reservar `<div>` para contêineres puramente técnicos, sem significado próprio. |
