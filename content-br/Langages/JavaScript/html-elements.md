---
order: 11
---

# Os HTMLElements

Um `HTMLElement` é a representação em JavaScript de uma tag HTML no DOM. Cada tag (`<div>`, `<p>`, `<a>`...) se torna um objeto `HTMLElement` acessível e manipulável em JavaScript.

```javascript
const div = document.querySelector('div');
// div agora é um objeto HTMLElement
```

## Criar e inserir elementos

| Método | Efeito |
|---|---|
| `document.createElement(tag)` | Cria um novo elemento, sem inseri-lo na página |
| `parent.append(...)` | Insere um ou mais elementos (ou textos) no **final** do conteúdo do pai |
| `parent.prepend(...)` | Insere um ou mais elementos (ou textos) no **início** do conteúdo do pai |
| `element.insertAdjacentHTML(posicao, html)` | Insere HTML bruto em uma posição precisa, sem sobrescrever o conteúdo existente |
| `element.remove()` | Remove o elemento do DOM |
| `element.replaceWith(...)` | Substitui o elemento por um ou mais outros |

```javascript
const p = document.createElement('p');
document.body.append(p);
document.body.append('texto puro', p, outroElemento);

parent.prepend(p);

element.insertAdjacentHTML('beforebegin', "<p>antes do elemento</p>");
element.insertAdjacentHTML('afterbegin',  "<p>no início do conteúdo</p>");
element.insertAdjacentHTML('beforeend',   "<p>no final do conteúdo</p>");
element.insertAdjacentHTML('afterend',    "<p>depois do elemento</p>");

p.remove();
p.replaceWith(outroElemento);
```

> **Cuidado (segurança):** assim como `innerHTML` (veja mais abaixo), `insertAdjacentHTML` interpreta seu argumento como HTML: inserir um dado vindo do usuário sem tê-lo escapado abre uma falha XSS (veja [A segurança](/?c=langages-de-programmation&s=php&p=securite), mesmo princípio).
>
> **Boa prática:** nunca passar um dado do usuário não escapado para `insertAdjacentHTML`/`innerHTML`; usar `createElement` + `textContent` quando o conteúdo vem do usuário.

## Acessar os elementos existentes

| Método | Retorna |
|---|---|
| `document.querySelector(seletor)` | O primeiro elemento correspondente ao seletor CSS, ou `null` |
| `document.querySelectorAll(seletor)` | Todos os elementos correspondentes, na forma de uma `NodeList` (congelada) |
| `document.getElementById(id)` | O elemento com esse id (alternativa mais antiga, menos flexível) |
| `document.getElementsByClassName(classe)` | Os elementos com essa classe, na forma de uma `HTMLCollection` (**viva**) |
| `document.getElementsByTagName(tag)` | Os elementos desse tipo de tag, na forma de uma `HTMLCollection` (**viva**) |

```javascript
const titulo = document.querySelector('h1');
const link = document.querySelector('#meu-id a');

const paragrafos = document.querySelectorAll('p');
paragrafos.forEach(p => console.log(p.textContent));
```

> **Cuidado:** uma `HTMLCollection` (retornada por `getElementsByClassName`/`getElementsByTagName`) é **viva**: ela se atualiza automaticamente se o DOM mudar, ao contrário da `NodeList` retornada por `querySelectorAll` (congelada no momento da chamada). Modificar o DOM (adicionar/remover elementos correspondentes) **enquanto** se percorre uma coleção viva pode, portanto, saltar ou repassar por elementos de forma inesperada.
>
> **Boa prática:** preferir `querySelectorAll` sempre que houver previsão de modificar a página durante o percurso da coleção.

## Os atributos

| Método | Efeito |
|---|---|
| `element.setAttribute(nome, valor)` | Adiciona ou modifica um atributo |
| `element.getAttribute(nome)` | Retorna o valor de um atributo, ou `null` se ele não existir |
| `element.removeAttribute(nome)` | Remove um atributo |
| `element.hasAttribute(nome)` | Testa a existência de um atributo (`true`/`false`) |

```javascript
element.setAttribute('class', 'minha-classe');
element.setAttribute('href', 'https://example.com');

element.getAttribute('class');   // 'minha-classe'
element.hasAttribute('class');    // true

element.removeAttribute('class');
```

## As classes CSS

**`classList`** é um objeto dedicado à gestão das classes CSS de um elemento, mais confiável que `className` para manipular as classes individualmente.

```javascript
element.classList.add('nova-classe');           // adiciona
element.classList.remove('classe-antiga');      // remove
element.classList.toggle('active');             // adiciona se ausente, remove se presente
element.classList.contains('minha-classe');     // true ou false
element.classList.replace('antiga', 'nova');    // substitui
```

**`className`** dá acesso a todas as classes na forma de string. Usar com cautela: atribuir a ele substitui **todas** as classes existentes.
```javascript
element.className;               // 'classe1 classe2'
element.className = 'nova';      // ⚠️ substitui tudo
```

## O conteúdo

| Propriedade | Conteúdo | Atribuição |
|---|---|---|
| `textContent` | O texto do elemento, tags filhas ignoradas | Substitui tudo por texto puro; qualquer tag HTML fornecida é escapada, nunca interpretada |
| `innerHTML` | O HTML interno do elemento, na forma de string | Substitui tudo **e interpreta** as tags HTML fornecidas |

```javascript
element.textContent;               // 'Meu texto'
element.textContent = 'Novo';      // substitui todo o conteúdo por texto

element.innerHTML;                          // '<strong>Meu texto</strong>'
element.innerHTML = '<em>Novo</em>';        // substitui tudo, interpreta o HTML
```

> **Cuidado (segurança):** atribuir a `innerHTML` um dado vindo do usuário (não confiável) é uma falha XSS clássica: o conteúdo é interpretado como HTML/JavaScript executável de verdade, não como texto.
>
> **Boa prática:** preferir `textContent` a `innerHTML` sempre que o conteúdo esperado for texto puro; ele continua seguro por padrão, já que nunca interpreta seu conteúdo.

## O estilo

`style` dá acesso aos estilos inline do elemento. As propriedades CSS se escrevem em **camelCase** (sem hífen):

```javascript
element.style.color = 'red';
element.style.backgroundColor = 'blue';       // background-color em CSS
element.style.fontSize = '1.2rem';             // font-size em CSS
element.style.borderLeft = '2px solid grey';    // border-left em CSS
```

## Navegar no DOM

A partir de um elemento, é possível acessar seus vizinhos e sua hierarquia:

| Propriedade | Retorna |
|---|---|
| `parentElement` | O elemento pai direto |
| `children` | Os elementos filhos diretos (não os nós de texto), na forma de `HTMLCollection` |
| `firstElementChild` / `lastElementChild` | O primeiro / último elemento filho |
| `nextElementSibling` / `previousElementSibling` | O irmão seguinte / anterior |

```javascript
element.parentElement;

element.children;        // [div, p, span...]
element.children[0];      // primeiro filho

element.firstElementChild;
element.nextElementSibling;
```

## Verificar o tipo de um elemento

```javascript
element.tagName;   // 'DIV', 'P', 'SPAN'... -> o nome da tag, em maiúsculas

element instanceof HTMLAnchorElement;   // true se for um <a>
element instanceof HTMLImageElement;    // true se for um <img>
```

`tagName` retorna uma simples string; `instanceof` testa diretamente a pertinência a uma interface DOM precisa.

## Dimensões e posição

| Propriedade | Retorna |
|---|---|
| `getBoundingClientRect()` | Um objeto `{ width, height, top, left, ... }`: tamanho e posição em relação à janela |
| `offsetWidth` / `offsetHeight` | Tamanho do elemento (conteúdo + padding + borda) |

```javascript
const rect = element.getBoundingClientRect();
rect.width;    // largura
rect.top;       // distância a partir do topo da janela

element.offsetWidth;
```

## Recursos

- [MDN (*Mozilla Developer Network*, a documentação de referência da web): HTMLElement](https://developer.mozilla.org/pt-BR/docs/Web/API/HTMLElement)
- [MDN: Document.querySelector](https://developer.mozilla.org/pt-BR/docs/Web/API/Document/querySelector)
- [MDN: Element.classList](https://developer.mozilla.org/pt-BR/docs/Web/API/Element/classList)
- [MDN: Element.setAttribute](https://developer.mozilla.org/pt-BR/docs/Web/API/Element/setAttribute)
- [MDN: insertAdjacentHTML](https://developer.mozilla.org/pt-BR/docs/Web/API/Element/insertAdjacentHTML)

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um `HTMLElement` representa uma tag HTML manipulável em JavaScript: criá-lo (`createElement`), selecioná-lo (`querySelector`), modificar seu conteúdo (`textContent`/`innerHTML`), seus atributos, suas classes ou seu estilo. |
| **Ferramentas úteis** | `querySelector`/`querySelectorAll`, `classList`, `setAttribute`/`getAttribute`, `getBoundingClientRect`. |
| **Armadilhas a evitar** | Atribuir um dado do usuário não escapado a `innerHTML`/`insertAdjacentHTML` (falha XSS); modificar uma `HTMLCollection` viva enquanto se a percorre. |
| **Boas práticas** | Preferir `textContent` a `innerHTML` sempre que o conteúdo for texto puro; preferir `querySelectorAll` (congelada) a `getElementsByClassName`/`getElementsByTagName` (viva) se o DOM for modificado durante o percurso. |
