---
order: 12
---

# O DOM e o gerenciamento de eventos

O **DOM** (*Document Object Model*) é a representação em memória de uma página HTML, na forma de uma árvore de objetos manipuláveis por JavaScript: cada tag se torna um nó dessa árvore, com suas próprias propriedades e métodos.

## Selecionar elementos

```javascript
document.getElementById("titulo");    // um elemento preciso, pelo seu id
document.querySelector(".card");      // o PRIMEIRO elemento correspondente a esse seletor CSS
document.querySelectorAll(".card");   // TODOS os elementos correspondentes (NodeList)
```

> **Nota:** `querySelector`/`querySelectorAll` aceitam qualquer [seletor CSS](/?c=langages-de-balisage&s=css&p=selecteurs): `.classe`, `#id`, `div > p`, `[data-role="botao"]`... é o método mais flexível.

## Modificar um elemento

```javascript
const titulo = document.querySelector("h1");

titulo.textContent = "Novo titulo";   // substitui o texto (escapa automaticamente o HTML)
titulo.innerHTML = "<em>Titulo</em>"; // insere HTML bruto -> PERIGO se a fonte nao for confiavel (XSS)
titulo.style.color = "red";           // modifica um estilo CSS diretamente
titulo.classList.add("ativo");        // adiciona uma classe CSS
titulo.classList.remove("ativo");
titulo.classList.toggle("ativo");             // adiciona se ausente, remove se presente
titulo.setAttribute("data-id", "42");
```

> **Nota:** `innerHTML` com um dado vindo do usuário é uma falha XSS clássica (veja [A segurança](/?c=langages-de-programmation&s=php&p=securite), mesmo princípio): um atacante poderia injetar código executável nele. `textContent` permanece seguro por padrão, pois sempre trata seu conteúdo como texto puro.

## Criar e inserir um elemento

```javascript
const novoCard = document.createElement("div");
novoCard.textContent = "Novo card";
novoCard.classList.add("card");

document.querySelector("#lista").appendChild(novoCard);
```

## Escutar eventos

```javascript
const botao = document.querySelector("#meu-botao");

botao.addEventListener("click", (evento) => {
    console.log("Botao clicado!", evento.target);
});
```

| Evento comum | Disparado quando |
|---|---|
| `click` | O elemento é clicado |
| `submit` | Um formulário é enviado |
| `input` / `change` | O valor de um campo muda |
| `keydown` / `keyup` | Uma tecla do teclado é pressionada/solta |
| `DOMContentLoaded` | O HTML está inteiramente carregado (antes das imagens/estilos) |

## `preventDefault()`: cancelar o comportamento padrão

```javascript
document.querySelector("form").addEventListener("submit", (evento) => {
    evento.preventDefault();   // impede o recarregamento de pagina padrao de um formulario
    console.log("Formulario interceptado pelo JavaScript");
});
```

## Propagação de eventos e delegação

Um evento se propaga do elemento visado para seus pais (*bubbling*), o que permite escutar um evento em um pai comum em vez de em cada filho individualmente:

```javascript
document.querySelector("#lista").addEventListener("click", (evento) => {
    if (evento.target.classList.contains("card")) {
        console.log("Um card foi clicado:", evento.target.textContent);
    }
});
// funciona ate mesmo para cards adicionados DINAMICAMENTE apos esse addEventListener,
// ao contrario de um addEventListener colocado individualmente em cada card no carregamento
```

Essa técnica, a **delegação de eventos**, evita ter que reanexar um listener a cada novo elemento criado dinamicamente (veja o exemplo de `createElement` acima): um único listener, colocado uma vez em um ancestral estável, é suficiente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O DOM representa uma página HTML na forma de árvore manipulável. `querySelector`/`addEventListener` selecionam e reagem às interações; um evento se propaga dos filhos para os pais (*bubbling*). |
| **Ferramentas utilizáveis** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`. |
| **Armadilhas a evitar** | Atribuir um dado do usuário a `innerHTML` (falha XSS); anexar um listener a cada elemento individual em vez de delegar, o que quebra para elementos adicionados dinamicamente depois. |
| **Boas práticas** | Usar a delegação de eventos (listener em um ancestral estável) em vez de um listener por elemento, especialmente se elementos forem adicionados dinamicamente. |
