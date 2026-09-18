---
order: 12
---

# O DOM e o gerenciamento de eventos

O **DOM** (*Document Object Model*) é a representação em memória de uma página [HTML](/?c=langages-de-balisage&s=html&p=html), na forma de uma árvore de objetos manipuláveis por JavaScript: cada tag se torna um nó dessa árvore, com suas próprias propriedades e métodos.

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
titulo.innerHTML = "<em>Titulo</em>"; // insere HTML bruto -> PERIGO se a fonte não for confiável (XSS)
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
    evento.preventDefault();   // impede o recarregamento de página padrão de um formulário
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
// funciona até mesmo para cards adicionados DINAMICAMENTE após esse addEventListener,
// ao contrário de um addEventListener colocado individualmente em cada card no carregamento
```

Essa técnica, a **delegação de eventos**, evita ter que reanexar um listener a cada novo elemento criado dinamicamente (veja o exemplo de `createElement` acima): um único listener, colocado uma vez em um ancestral estável, é suficiente.

Nem todo evento se propaga por bolhas: `toggle` (disparado por um [`<details>`](/?c=langages-de-balisage&s=html&p=semantique-html5#lt-details-gt-lt-summary-gt-um-conteudo-recolhivel-sem-javascript)), além de `focus`, `blur` e `scroll` historicamente, ficam confinados ao elemento em que foram disparados. Para interceptá-los por delegação, é preciso escutar na fase de **captura** (o percurso inverso: do `document` até o elemento visado, antes das bolhas), com um terceiro argumento `true`:

```javascript
document.addEventListener("toggle", (evento) => {
    console.log("Um details mudou de estado:", evento.target.open);
}, true);  // fase de captura obrigatória: "toggle" não borbulha
```

| Fase | Sentido do percurso | Disparada por padrão? |
|---|---|---|
| Captura | Do `document` até o elemento visado | Não: apenas com `true` (ou `{ capture: true }`) como 3º argumento |
| Bolhas (*bubbling*) | Do elemento visado até o `document` | Sim |

## Alterar a URL sem recarregar a página

A API `history` do navegador altera a URL exibida na barra de endereço sem recarregar a página nem disparar nenhuma navegação de rede:

```javascript
const params = new URLSearchParams();
params.set("domaine", "atlas");

history.replaceState(null, "", `${window.location.pathname}?${params}`);
// URL exibida: .../page?domaine=atlas, sem recarregar e sem nova entrada no histórico
```

Os três argumentos são sempre os mesmos: um `state` (dado associado a essa entrada do histórico, recuperável depois via o evento `popstate`; `null` quando não usado aqui), um título (ignorado pela maioria dos navegadores) e a nova URL (que precisa ficar na mesma origem, senão o navegador lança um erro).

| Método | Efeito no histórico | Caso de uso típico |
|---|---|---|
| `history.pushState(...)` | Adiciona uma nova entrada: o botão "Voltar" do navegador retorna a ela | Trocar de "página" em uma [aplicação de página única](/?c=langages-de-programmation&s=javascript&p=ssr-vs-csr#csr-o-servidor-envia-uma-casca-vazia) sem recarregar |
| `history.replaceState(...)` | Substitui a entrada atual: nenhuma entrada nova é criada | Sincronizar a URL com um estado já exibido na tela (um filtro, uma aba ativa), sem poluir o histórico de navegação |

> **Nota:** diferente de `window.location.href = "..."`, nem `pushState` nem `replaceState` recarregam a página: o JavaScript já carregado continua executando, só a URL visível muda.

## Fullscreen e Clipboard: duas APIs disparadas por uma ação do usuário

Duas APIs do navegador, acessíveis em JavaScript, mas que **só podem ser usadas a partir de uma ação explícita do usuário** (um clique, uma tecla): por segurança, o navegador recusa dispará-las a partir de código que executa por conta própria.

```javascript
// Entrar em tela cheia
document.querySelector("#area-video").requestFullscreen();

// Escutar a saída da tela cheia, mesmo se o usuário a deixou
// por um atalho do navegador (Esc) em vez de um botão da página
document.addEventListener("fullscreenchange", () => {
    const emTelaCheia = document.fullscreenElement !== null;
    botaoTelaCheia.textContent = emTelaCheia ? "Sair" : "Tela cheia";
});
```

```javascript
// Copiar texto para a área de transferência (assíncrono, pode falhar: permissão negada)
async function copiar(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarConfirmacao("Copiado!");
    } catch (erro) {
        mostrarConfirmacao("Não foi possível copiar");
    }
}
```

| API | Disparada por | Ponto notável |
|---|---|---|
| Fullscreen (`requestFullscreen()`/`exitFullscreen()`) | Um clique ou tecla | O evento `fullscreenchange` é necessário porque a tela cheia pode ser deixada por um caminho que o código não disparou ele mesmo (Esc, um atalho do sistema) |
| Clipboard (`navigator.clipboard.writeText()`) | Um clique ou tecla | Sempre assíncrono (uma `Promise`), e pode falhar se o usuário/navegador negar a permissão: sempre envolver em um `try`/`catch` |

> **Boa prática:** sempre escutar `fullscreenchange` para ressincronizar o estado da interface (texto do botão, ícone) com o estado real da tela cheia, em vez de supor que só o botão da própria página pode alterá-lo.

## Armazenamento persistente no navegador: `sessionStorage` e `localStorage`

Dois mecanismos integrados no navegador para conservar um dado de texto (chave/valor) após recarregar a página, sem base de dados nem servidor:

```javascript
sessionStorage.setItem("auditoria-confirmada", "true");
localStorage.setItem("tema", "escuro");

sessionStorage.getItem("auditoria-confirmada");  // "true", ou null se ausente
localStorage.removeItem("tema");
```

| Mecanismo | Alcance | Sobrevive a... |
|---|---|---|
| `sessionStorage` | Uma única aba | Um recarregamento de página (F5) |
| `localStorage` | Todas as abas da mesma origem | O fechamento completo do navegador |

> **Armadilha:** `sessionStorage`/`localStorage` só armazenam cadeias de texto: guardar um objeto exige convertê-lo com `JSON.stringify()` ao escrever e `JSON.parse()` ao ler.

> **Atenção, segurança:** ambos os mecanismos são acessíveis a partir de qualquer script JavaScript da página, incluindo um script injetado por uma falha XSS (ver [O cross-site scripting (XSS) em detalhe](/?c=securite&s=cybersecurite&p=xss-en-detail)): nunca armazenar aí um token de sessão sensível sem avaliar esse risco.

## Gerar um arquivo para download no cliente: `Blob` e `URL.createObjectURL()`

```javascript
const conteudoCsv = "nome;valor\nlinha1;10\nlinha2;20";
const arquivo = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8" });
// URL temporária apontando para esse arquivo em memória
const url = URL.createObjectURL(arquivo);

const link = document.createElement("a");
link.href = url;
link.download = "export.csv";
link.click();  // dispara o download, sem chegar a adicioná-lo ao DOM

URL.revokeObjectURL(url);  // libera a memória uma vez iniciado o download
```

Um `Blob` (*Binary Large OBject*) representa dados brutos (texto, binário) como um arquivo, inteiramente em memória no navegador, sem nenhuma ida e volta ao servidor. `URL.createObjectURL()` atribui a ele uma URL temporária (`blob:...`) utilizável em qualquer lugar onde uma URL de arquivo seja esperada (aqui, o `href` de um link); `URL.revokeObjectURL()` a libera uma vez iniciado o download, para evitar uma fuga de memória.

> **Boa prática:** sempre chamar `URL.revokeObjectURL()` uma vez terminado o seu uso: o navegador nunca libera essa URL temporária por conta própria.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O DOM representa uma página HTML na forma de árvore manipulável. `querySelector`/`addEventListener` selecionam e reagem às interações; um evento se propaga dos filhos para os pais (*bubbling*), salvo algumas exceções (`toggle`, `focus`, `blur`, `scroll`) que exigem a fase de captura. |
| **Ferramentas utilizáveis** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`, `history.pushState`/`replaceState`, `requestFullscreen()`/`navigator.clipboard.writeText()`, `sessionStorage`/`localStorage`, `Blob`/`URL.createObjectURL()`. |
| **Armadilhas a evitar** | Atribuir um dado do usuário a `innerHTML` (falha XSS); anexar um listener a cada elemento individual em vez de delegar, o que quebra para elementos adicionados dinamicamente depois; esquecer `fullscreenchange` e supor que só o botão da própria página muda a tela cheia; escutar `toggle` sem a fase de captura (`true` como 3º argumento), já que nunca borbulha; armazenar um token sensível em `sessionStorage`/`localStorage`, legível por qualquer script (XSS). |
| **Boas práticas** | Usar a delegação de eventos (listener em um ancestral estável) em vez de um listener por elemento, especialmente se elementos forem adicionados dinamicamente. Preferir `replaceState` a `pushState` para sincronizar a URL com um estado já exibido na tela, sem poluir o histórico de navegação. Sempre envolver `clipboard.writeText()` em um `try`/`catch`. Sempre chamar `URL.revokeObjectURL()` uma vez iniciado um download `Blob`. |
