---
order: 11
---

# O DOM e a gestão de eventos

O **DOM** (*Document Object Model*) é a representação em memória de uma página HTML, sob a forma de uma árvore de objetos que podem ser manipulados pelo JavaScript — cada baliza torna-se um nó dessa árvore, com as suas próprias propriedades e métodos.

## Selecionar elementos

```javascript
document.getElementById("titre");           // um elemento específico, através do seu ID
document.querySelector(".carte");            // o PRIMEIRO elemento que corresponda a este seletor CSS
document.querySelectorAll(".carte");          // TODOS os elementos correspondentes (NodeList)
```

> **Nota:** `querySelector` / `querySelectorAll` aceitam qualquer seletor CSS (ver capítulo dedicado) — `.classe`, `#id`, `div > p`, `[data-role="bouton"]`... este é o método mais flexível.

## Alterar um elemento

```javascript
const título = document.querySelector("h1");

título.textContent = "Nouveau titre";     // substitui o texto (escapa automaticamente o HTML)
título.innerHTML = "<em>Titre</em>";       // insere HTML bruto -> PERIGO se a fonte não for fiável (XSS)
título.style.color = "red";                  // altera diretamente um estilo CSS
título.classList.add("actif");                // adiciona uma classe CSS
título.classList.remove("actif");
título.classList.toggle("actif");              // adicionar se não existir, remover se existir
título.setAttribute("data-id", "42");
```

> **Nota:** `innerHTML` com dados fornecidos pelo usuário constitui uma falha XSS clássica (ver capítulo sobre segurança em PHP, o mesmo princípio) — um atacante poderia injetar código executável. `textContent` permanece seguro por padrão, uma vez que trata sempre o seu conteúdo como texto simples.

## Criar e inserir um elemento

```javascript
const nouvelleCarte = document.createElement("div");
nouvelleCarte.textContent = "Nouvelle carte";
nouvelleCarte.classList.add("carte");

document.querySelector("#liste").appendChild(nouvelleCarte);
```

## Ouvir eventos

```javascript
const bouton = document.querySelector("#mon-bouton");

bouton.addEventListener("click", (evenement) => {
    console.log("Bouton cliqué !", evenement.target);
});
```

| Evento recorrente | Acionado quando |
|---|---|
| `click` | O elemento é clicado |
| `submit` | Um formulário é enviado |
| `input` / `change` | O valor de um campo altera-se |
| `keydown` / `keyup` | Uma tecla do teclado é pressionada/soltada |
| `DOMContentLoaded` | O HTML está totalmente carregado (antes das imagens/estilos) |

## `preventDefault()` : anular o comportamento padrão

```javascript
document.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();   // impede a atualização automática da página de um formulário
    console.log("Formulaire intercepté par JavaScript");
});
```

## Propagação de eventos e delegação

Um evento propaga-se do elemento alvo para os seus elementos pais (*bubbling*) — o que permite monitorizar um evento num elemento pai comum, em vez de o fazer em cada elemento filho individualmente:

```javascript
document.querySelector("#liste").addEventListener("click", (evenement) => {
    if (evenement.target.classList.contains("carte")) {
        console.log("Une carte a été cliquée :", evenement.target.textContent);
    }
});
// funciona mesmo com cartões adicionados DINAMICAMENTE após este addEventListener,
// ao contrário de um addEventListener aplicado individualmente a cada mapa no momento do carregamento
```

Esta técnica, a **delegação de eventos**, evita a necessidade de voltar a associar um ouvinte a cada novo elemento criado dinamicamente (ver exemplo de `createElement` acima): basta um único ouvinte, associado uma única vez a um antepassado estável.
