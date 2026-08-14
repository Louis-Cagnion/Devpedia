---
order: 2
---

# CSS

CSS (*Cascading Style Sheets*) é a linguagem que descreve a **aparência** de um documento [HTML](/?c=langages-de-balisage&s=html&p=html) (cores, tamanhos, posicionamento, layout), separando deliberadamente essa apresentação da estrutura (HTML) e do comportamento (JavaScript).

Entre os conceitos essenciais do CSS, destacam-se:

- Os seletores, que miram nos elementos HTML a estilizar
- O modelo de caixa (*box model*), que rege o tamanho e o espaçamento de cada elemento
- Os sistemas de layout modernos: Flexbox (alinhamento em um eixo) e Grid (grade em duas dimensões)
- A cascata e a especificidade, que determinam qual regra se aplica quando várias se contradizem
- O *responsive design*, para que uma página se adapte a qualquer tamanho de tela

## A sintaxe básica

```css
seletor {
    propriedade: valor;
    outra-propriedade: outro-valor;
}
```

```css
h1 {
    color: blue;
    font-size: 2rem;
}
```

## Ligar uma folha de estilo a uma página HTML

```html
<link rel="stylesheet" href="styles.css">
```

```html
<style>
    h1 { color: blue; }
</style>
```

```html
<h1 style="color: blue;">Título</h1>
```

> **Nota (boa prática):** um arquivo `.css` externo (`<link>`) quase sempre é preferível: ele é armazenado em cache pelo navegador, reutilizável em várias páginas, e separa claramente estrutura e apresentação. O estilo em linha (`style="..."` diretamente em uma tag) tem a especificidade mais alta (veja [Variáveis CSS e a cascata](/?c=langages-de-balisage&s=css&p=variables-et-cascade)), o que o torna difícil de sobrescrever depois, a reservar para casos bem pontuais, frequentemente gerados dinamicamente em JavaScript.
