---
order: 10
---

# Os elementos HTML

Um «`HTMLElement`» é a representação em JavaScript de uma baliza HTML no DOM. Cada baliza (`<div>`, `<p>`, `<a>`...) torna-se um objeto `HTMLElement` acessível e manipulável em JavaScript.

```javascript
const div = document.querySelector('div');
// O `div` é agora um objeto `HTMLElement`
```

---

## Criar e inserir elementos

**`document.createElement`** Cria um novo elemento HTML sem o inserir na página.
```javascript
const p = document.createElement('p');
```

**`append`** insere um ou mais elementos (ou textos) no final do conteúdo de um elemento pai.
```javascript
document.body.append(p);
document.body.append('texte brut', p, autreElement);
```

**`prepend`** insere um ou mais elementos (ou textos) no **início** do conteúdo de um elemento pai.
```javascript
parent.prepend(p);
parent.prepend('texte brut', p, autreElement);
```

**`insertAdjacentHTML`** Inserir HTML bruto numa posição específica em torno de um elemento, sem sobrescrever o conteúdo existente.
```javascript
elemento.insertAdjacentHTML('beforebegin', "<p>avant l'élément</p>");
elemento.insertAdjacentHTML('afterbegin',  "<p>au début du contenu</p>");
elemento.insertAdjacentHTML('beforeend',   "<p>à la fin du contenu</p>");
elemento.insertAdjacentHTML('afterend',    "<p>après l'élément</p>");
```

> **Nota (segurança):** tal como `innerHTML` (ver mais abaixo), `insertAdjacentHTML` interpreta o seu argumento como HTML — nunca insira dados provenientes do utilizador sem os ter submetido a um processo de escape, sob pena de uma falha XSS (ver capítulo sobre segurança em PHP, o mesmo princípio).

**`remove`** elimina o elemento do DOM.
```javascript
p.remove();
```

**`replaceWith`** substitui o elemento por um ou mais outros elementos.
```javascript
p.replaceWith(autreElement);
```

---

## Aceder aos elementos existentes

**`querySelector`** retorna o primeiro elemento que corresponda ao seletor CSS indicado, ou `null` caso não exista.
```javascript
const título = document.querySelector('h1');
const div = document.querySelector('.ma-classe');
const lien = document.querySelector('#mon-id a');
```

**`querySelectorAll`** retorna todos os elementos correspondentes sob a forma de «`NodeList`» (semelhante a um tabuleiro).
```javascript
const paragraphes = document.querySelectorAll('p');
paragraphes.forEach(p => console.log(p.textContent));
```

**`getElementById`**, **`getElementsByClassName`** e **`getElementsByTagName`** são alternativas mais antigas e menos flexíveis do que `querySelector`.
```javascript
document.getElementById('mon-id');
document.getElementsByClassName('ma-classe'); // HTMLCollection (ao vivo)
document.getElementsByTagName('p');           // HTMLCollection (ao vivo)
```

> **Nota:** uma `HTMLCollection` (retornada por `getElementsByClassName` / `getElementsByTagName`) está **ativa**: atualiza-se automaticamente se o DOM mudar, ao contrário da `NodeList` retornada por `querySelectorAll` (congelada no momento da chamada). Alterar o DOM (adicionar/remover elementos correspondentes) **enquanto** se percorre uma coleção «live» pode, portanto, fazer com que se salte ou se volte a passar por elementos de forma inesperada — uma boa razão para preferir `querySelectorAll` sempre que se pretenda alterar a página durante a percussão.

---

## Os atributos

**`setAttribute`** adiciona ou altera um atributo.
```javascript
elemento.setAttribute('class', 'ma-classe');
elemento.setAttribute('href', 'https://example.com');
```

**`getAttribute`** retorna o valor de um atributo ou «`null`» caso este não exista.
```javascript
elemento.getAttribute('class'); // 'a-minha-classe'
```

**`removeAttribute`** elimina um atributo.
```javascript
elemento.removeAttribute('class');
```

**`hasAttribute`** Verifica se um atributo existe no elemento.
```javascript
elemento.hasAttribute('class'); // true ou false
```

---

## As classes CSS

**`classList`** É um objeto dedicado à gestão das classes CSS de um elemento, mais fiável do que `className` para manipular as classes individualmente.

```javascript
elemento.classList.add('nouvelle-classe');       // adiciona
elemento.classList.remove('ancienne-classe');    // elimina
elemento.classList.toggle('active');             // adiciona se não existir, elimina se existir
elemento.classList.contains('ma-classe');        // true ou false
elemento.classList.replace('ancienne', 'nouvelle'); // substitui
```

**`className`** Dá acesso a todas as classes sob a forma de cadeia. Utilizar com precaução: a sua atribuição substitui **todas** as classes existentes.
```javascript
elemento.className;               // 'classe1 classe2'
elemento.className = 'nouvelle';  // ⚠️ substitui tudo
```

---

## O conteúdo

**`textContent`** acede ao conteúdo textual de um elemento (todas as etiquetas filhas são ignoradas). Atribuir um valor substitui todo o conteúdo por texto simples — as etiquetas HTML eventualmente presentes são escapadas e apresentadas tal como estão, nunca sendo interpretadas.
```javascript
elemento.textContent;              // «O meu texto»
elemento.textContent = 'Nouveau';  // substitui todo o conteúdo por texto
```

**`innerHTML`** acede ao conteúdo HTML interno do elemento sob a forma de cadeia de caracteres. Atribuir um valor **substitui** todo o conteúdo existente e interpreta as etiquetas HTML.
```javascript
elemento.innerHTML;                        // '<strong>O meu texto</strong>'
elemento.innerHTML = '<em>Nouveau</em>';   // ⚠️ substitui tudo, interpreta o HTML
```

> **Nota (segurança):** atribuir a `innerHTML` um dado proveniente do utilizador (não fiável) constitui uma falha clássica de XSS — o conteúdo é interpretado como HTML/JavaScript executável, e não como texto. `textContent` (acima) continua a ser seguro por predefinição, uma vez que nunca interpreta o seu conteúdo.

---

## O estilo

**`style`** permite aceder aos estilos inline do elemento. As propriedades CSS são escritas em **camelCase** (sem hífen).
```javascript
elemento.style.color = 'red';
elemento.style.backgroundColor = 'blue';  // background-color em CSS
elemento.style.fontSize = '1.2rem';       // font-size em CSS
elemento.style.borderLeft = '2px solid grey'; // border-left em CSS
```

---

## Navegar no DOM

A partir de um elemento, é possível aceder aos seus vizinhos e à sua hierarquia.

**`parentElement`** retorna o elemento pai direto.
```javascript
elemento.parentElement;
```

**`children`** retorna os elementos filhos diretos (exceto os nós de texto) na forma de `HTMLCollection`.
```javascript
elemento.children;       // [div, p, span...]
elemento.children[0];    // primeiro filho
```

**`firstElementChild`** e **`lastElementChild`** devolvem o primeiro e o último elemento filho.
```javascript
elemento.firstElementChild;
elemento.lastElementChild;
```

**`nextElementSibling`** e **`previousElementSibling`** remetem para o irmão seguinte ou anterior.
```javascript
elemento.nextElementSibling;
elemento.previousElementSibling;
```

---

## Verificar o tipo de um elemento

**`tagName`** retorna o nome da baliza em maiúsculas.
```javascript
elemento.tagName; // «DIV», «P», «SPAN»...
```

**`instanceof`** Verifica se o elemento pertence a uma interface DOM específica.
```javascript
elemento instanceof HTMLAnchorElement;  // true se for um <a>
elemento instanceof HTMLImageElement;   // true se for um <img>
```

---

## Dimensões e posição

**`getBoundingClientRect`** retorna o tamanho e a posição do elemento em relação à janela.
```javascript
const rect = elemento.getBoundingClientRect();
rect.width;   // largura
rect.height;  // altura
rect.top;     // distância a partir do topo da janela
rect.left;    // distância a partir da esquerda da janela
```

**`offsetWidth`** e **`offsetHeight`** indicam o tamanho do elemento (conteúdo + preenchimento + borda).
```javascript
elemento.offsetWidth;
elemento.offsetHeight;
```

---

## Recursos

- [MDN — HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN — Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN — Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN — Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN — insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)
