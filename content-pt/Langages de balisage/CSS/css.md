# CSS

CSS (*Cascading Style Sheets*) é a linguagem que descreve a **aparência** de um documento HTML (ver secção dedicada) — cores, tamanhos, posicionamento, disposição —, separando deliberadamente essa apresentação da estrutura (HTML) e do comportamento (JavaScript).

Entre os conceitos essenciais do CSS, destacam-se, nomeadamente:

- Os seletores, que identificam os elementos HTML a que se pretende aplicar estilos
- O modelo de caixa (*box model*), que rege o tamanho e o espaçamento de cada elemento
- Os sistemas modernos de disposição de páginas: Flexbox (alinhamento num eixo) e Grid (grelha bidimensional)
- A hierarquia e a especificidade, que determinam qual a regra que se aplica quando várias se contradizem
- O *design responsivo*, para que uma página se adapte a todos os tamanhos de tela

## A sintaxe básica

```css
selecteur {
    propriete: valeur;
    autre-propriete: autre-valeur;
}
```

```css
h1 {
    color: blue;
    font-size: 2rem;
}
```

## Associar uma folha de estilo a uma página HTML

```html
<link rel="stylesheet" href="styles.css">
```

```html
<style>
    h1 { color: blue; }
</style>
```

```html
<h1 style="color: blue;">Titre</h1>
```

> **Nota (melhores práticas):** um arquivo `.css` externo (`<link>`) é quase sempre preferível — é armazenado em cache pelo navegador, pode ser reutilizado em várias páginas e separa claramente a estrutura da apresentação. O estilo em linha (`style="..."` diretamente numa baliza) tem a mais alta especificidade (ver capítulo sobre a cascata), o que torna difícil sobrepor-lhe estilos posteriormente — deve ser reservado para casos muito pontuais, frequentemente gerados dinamicamente em JavaScript.
