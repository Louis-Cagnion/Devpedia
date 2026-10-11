---
order: 8
---

# ARIA dinâmico e gerenciamento do foco pelo teclado

O capítulo [Atributos data-* e acessibilidade (ARIA)](/?c=langages&s=html&p=attributs-data-et-accessibilite) apresentou `aria-label` e `aria-expanded`. **ARIA** (*Accessible Rich Internet Applications*) é um conjunto de [atributos](/?c=langages&s=html&p=structure-dun-document) [HTML](/?c=langages&s=html&p=html) que descrevem para uma **tecnologia assistiva** aquilo que a página não diz sobre si mesma. Uma tecnologia assistiva é um software ou um hardware que ajuda uma pessoa com deficiência a usar um computador; a mais comum é o **leitor de tela**, que lê a página em voz alta ou a exibe em braille.

Este capítulo trata de duas situações que o capítulo anterior não aborda: a página que muda depois de carregada (uma mensagem aparece, uma zona fica bloqueada) e o usuário que só tem o teclado. Para ele, o **foco** é o elemento que recebe as teclas em determinado momento (um link, um botão, um campo). A tecla **Tab** move o foco para o próximo elemento interativo (Shift+Tab para o anterior); um elemento é **interativo** quando é possível ativá-lo ou preenchê-lo.

Os exemplos de código supõem conhecidos [o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions), [os laços de repetição](/?c=langages&s=javascript&p=boucles), [os arrays](/?c=langages&s=javascript&p=tableaux) e [as condicionais](/?c=langages&s=javascript&p=conditions) (incluindo os operadores `?.` e `??`) em [JavaScript](/?c=langages&s=javascript&p=javascript), assim como as tags [`<p>` e `<ul>`](/?c=langages&s=html&p=balises-de-texte), [`<div>`](/?c=langages&s=html&p=semantique-html5) e [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite).

## Do HTML à tecnologia assistiva

O navegador (o software que exibe as páginas da web) transforma o HTML em [DOM](/?c=langages&s=javascript&p=dom-et-evenements). Ele aplica os estilos escritos em [CSS](/?c=langages&s=css&p=css) para a exibição. A partir do DOM, ele também constrói a **árvore de acessibilidade**: uma lista simplificada dos elementos com, para cada um, seu nome, seu **papel** (o que ele é: botão, link, aba...) e seu estado. É essa árvore, e não a tela, que a tecnologia assistiva lê.

```
HTML --> DOM --+--> exibição na tela (com os estilos)
               |
               +--> árvore de acessibilidade --> leitor de tela
                    (nome, papel, estado)

aria-* e role : modificam a árvore de acessibilidade, não a tela
inert         : bloqueia clique e foco E remove da árvore, a tela não muda
display: none : remove da tela, portanto também da árvore
```

## `aria-live`: anunciar uma mudança sem mover o foco

Um leitor de tela só lê um lugar da página por vez. Se um texto muda em outro lugar (« 12 resultados encontrados »), ele não avisa. `aria-live` declara uma **região live**: uma área cujas mudanças de conteúdo são anunciadas, sem que o foco vá até ela.

| Valor | Efeito | Quando usar |
|---|---|---|
| `off` (padrão) | Nada é anunciado, a menos que o foco esteja na área | Atualizações frequentes e não essenciais (placar ao vivo) |
| `polite` | Anunciado no próximo momento calmo (fim da frase em curso, pausa na digitação) | O caso geral: resultados, « Salvo » |
| `assertive` | Anunciado imediatamente, podendo interromper o que está sendo lido | Somente urgência: tempo quase esgotado |

```html
<!-- A região existe desde o carregamento da página, e ela está VAZIA -->
<p id="estado" aria-live="polite"></p>
```

```javascript
// Encontra a região pelo seu identificador
const estado = document.getElementById("estado");
// O texto muda: o leitor de tela o anuncia, o foco não se move
estado.textContent = "12 resultados encontrados";
```

Os anúncios só valem para uma **mudança** em uma região já conhecida pelo navegador. Criar a região já com seu conteúdo, portanto, não produz nada a anunciar:

```javascript
// Pega o contêiner de mensagens: um <div id="conteiner"> já presente na página
const conteiner = document.getElementById("conteiner");

// RUIM: a região nasce com seu texto, não há nenhuma mudança a anunciar
conteiner.innerHTML = '<p aria-live="polite">12 resultados encontrados</p>';

// BOM: a região `estado` já existia, vazia; mudamos apenas o seu texto
estado.textContent = "12 resultados encontrados";
```

O mais confiável é colocar a região no HTML original; criá-la em JavaScript exige esperar antes de preenchê-la, e o comportamento varia conforme o navegador e o leitor de tela, como detalha o [guia das regiões live](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) da MDN (*MDN Web Docs*, a documentação de referência da web, editada pela Mozilla). Por padrão, apenas a parte modificada é lida; [`aria-atomic="true"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic) faz reler a região inteira.

## `aria-current`: marcar o item atual de um conjunto

Em um grupo de elementos ligados (links `<a>` de uma zona de navegação [`<nav>`](/?c=langages&s=html&p=semantique-html5), etapas de um processo), um deles é « o atual ». Um estilo visual (negrito, sublinhado) não diz nada a um leitor de tela: `aria-current` anuncia essa informação. Apenas um elemento por conjunto recebe a marca.

| Valor | Designa | Exemplo |
|---|---|---|
| `page` | A página atual de um conjunto de páginas | Link da página exibida em um menu |
| `step` | A etapa atual de um processo | Etapa 2 de um fluxo de pedido |
| `location` | A localização atual em um ambiente | Elemento destacado em um diagrama |
| `date` | A data atual de um conjunto de datas | Hoje em um calendário |
| `time` | A hora atual de um conjunto de horários | Faixa em andamento em uma grade de horários |
| `true` | O elemento atual, sem precisão | Nenhum valor acima serve |
| `false` (padrão) | Não é o elemento atual | Equivale à ausência do atributo |

```html
<!-- <nav> : zona de navegação ; aria-label : seu nome, como visto no capítulo anterior -->
<nav aria-label="Navegação principal">
    <ul>
        <li><a href="/inicio">Início</a></li>
        <!-- aria-current="page" : o leitor de tela diz « página atual » para este link -->
        <li><a href="/curso" aria-current="page">Curso</a></li>
        <li><a href="/contato">Contato</a></li>
    </ul>
</nav>
```

Um [seletor de atributo](/?c=langages&s=css&p=selecteurs) CSS pode ler `aria-current` para estilizar o link atual:

```css
/* O seletor de atributo lê aria-current : uma única fonte para o estilo e o sentido */
nav a[aria-current="page"] {
    font-weight: bold;                 /* texto em negrito */
    border-bottom: 3px solid #1a4fd6;  /* linha azul de 3 pixels sob o link */
}
```

```javascript
// Move a marca quando a navegação muda sem recarregar a página
function marcarAtual(novo) {
    // Procura o link atualmente marcado na navegação
    const anterior = document.querySelector('nav [aria-current="page"]');
    // Remove sua marca (o `?.` não faz nada se não houver nenhuma)
    anterior?.removeAttribute("aria-current");
    // Põe a marca no novo link
    novo.setAttribute("aria-current", "page");
}
```

Para uma aba, uma opção de lista ou uma linha de tabela, a marca correta é `aria-selected` (veja mais abaixo), e não `aria-current`.

## `role`: dizer o que é um elemento quando o HTML não o diz

O atributo `role` define o papel de um elemento na árvore de acessibilidade. **Primeira regra do ARIA**: se existe um elemento HTML nativo para a necessidade, use-o em vez de um `role` (veja a « regra de ouro » do [capítulo anterior](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Um `role` muda o que é anunciado, nunca o comportamento: o teclado ainda precisa ser programado.

| Necessidade | Elemento nativo a preferir | `role` somente se não existir nenhum nativo |
|---|---|---|
| Botão | [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) | `role="button"` |
| Link | [`<a href>`](/?c=langages&s=html&p=liens-et-images) | `role="link"` |
| Zona de navegação | [`<nav>`](/?c=langages&s=html&p=semantique-html5) | `role="navigation"` |
| Mensagem urgente exibida dinamicamente | Nenhum | `role="alert"` |
| Mensagem de estado discreta | Nenhum | `role="status"` |
| Abas | Nenhum | `tablist`, `tab`, `tabpanel` |

| Papel | Significado | Comportamento live implícito |
|---|---|---|
| `alert` | Mensagem importante e urgente | `aria-live="assertive"` e `aria-atomic="true"` |
| `status` | Informação útil, não urgente | `aria-live="polite"` e `aria-atomic="true"` |
| `tablist` | Contêiner de um grupo de abas | Nenhum |
| `tab` | Uma aba, que exibe um painel | Nenhum |
| `tabpanel` | O conteúdo associado a uma aba | Nenhum |

```html
<!-- Duas regiões vazias desde o carregamento, cada uma com seu papel -->
<div id="erro" role="alert"></div>
<div id="salvamento" role="status"></div>
```

```javascript
// Interrompe a leitura em andamento: reservado ao que é urgente
document.getElementById("erro").textContent = "Endereço de e-mail inválido";
// Anunciado no próximo momento calmo, sem interromper
document.getElementById("salvamento").textContent = "Rascunho salvo";
```

`role="alert"` só se aplica a texto (nunca a um link ou um botão), deve ser usado com moderação e visa um conteúdo exibido dinamicamente, não uma mensagem já presente no carregamento da página ([página da MDN sobre o papel `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)). Os papéis de abas são implementados mais abaixo.

## `inert`: tornar uma zona morta

`inert` é um atributo **booleano** (sua simples presença o ativa; ele não tem valor: `<div inert>`). Ele torna o elemento e todos os seus descendentes **inertes**: não clicáveis, não focalizáveis (portanto pulados pelo Tab), não selecionáveis, não encontrados pela busca do navegador e ausentes da árvore de acessibilidade. Eles continuam visíveis na tela. O atributo está disponível em todos os navegadores atuais desde abril de 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)).

Seu caso de uso típico é o fundo de uma **caixa de diálogo modal**: uma janela exibida sobre a página, que bloqueia todo o resto enquanto está aberta. O nativo existe: a tag [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) aberta pelo seu método `showModal()` (um método é uma função associada a um elemento) torna o restante da página inerte, e também gerencia a tecla Esc e o foco inicial. Para um painel que não é um `<dialog>` (aqui um painel lateral [`<aside>`](/?c=langages&s=html&p=semantique-html5)), aplicamos `inert` por conta própria:

```html
<!-- Todo o fundo está agrupado em um único contêiner -->
<div id="pagina">
    <button id="abrir">Abrir o painel</button>
    <p>Conteúdo da página.</p>
</div>

<!-- O painel está FORA de #pagina : senão ele ficaria inerte junto com ela -->
<!-- hidden : atributo booleano que oculta o painel enquanto ele não estiver aberto -->
<aside id="painel" aria-label="Configurações" hidden>
    <button id="fechar">Fechar</button>
</aside>
```

```css
/* Sinal visual: sem ele, nada indica que uma zona ficou morta */
[inert] { opacity: 0.5; }
```

```javascript
// Encontra os quatro elementos pelo seu identificador
const pagina = document.getElementById("pagina");
const painel = document.getElementById("painel");
const abrir = document.getElementById("abrir");
const fechar = document.getElementById("fechar");

abrir.addEventListener("click", () => {
    pagina.inert = true;      // a propriedade `inert` põe o atributo: página bloqueada
    painel.hidden = false;    // exibe o painel (`hidden` : atributo que oculta o elemento)
    fechar.focus();           // coloca o foco no painel, fora da zona inerte
});

fechar.addEventListener("click", () => {
    pagina.inert = false;     // a página volta a ser utilizável
    painel.hidden = true;     // oculta o painel
    abrir.focus();            // devolve o foco ao botão que tinha aberto o painel
});
```

Três mecanismos « ocultam » algo, mas não do mesmo jeito. `display: none` é uma propriedade [CSS](/?c=langages&s=css&p=css) que retira o elemento da exibição; `hidden` produz o mesmo efeito por padrão; `aria-hidden="true"` retira o elemento somente da árvore de acessibilidade.

| | `inert` | `aria-hidden="true"` | `display: none` ou `hidden` |
|---|---|---|---|
| Visível na tela | Sim | Sim | Não |
| Alcançável pelo Tab / focalizável | Não | **Sim**, continua focalizável | Não |
| Clicável | Não | Sim | Não |
| Lido pelo leitor de tela | Não | Não | Não |

`aria-hidden="true"` numa zona que contém elementos focalizáveis cria portanto uma armadilha: o foco pode entrar em um elemento que o leitor de tela não expõe mais ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)). Para bloquear um fundo, `inert` é a ferramenta certa.

## `:focus-visible`: o anel de foco, só quando ajuda

O **anel de foco** é o contorno que o navegador desenha em volta do elemento que tem o foco, para que o usuário do teclado veja onde está. É um `outline`: uma propriedade CSS que traça uma linha em volta de um elemento sem alterar o seu tamanho. As [pseudoclasses](/?c=langages&s=css&p=selecteurs) `:focus` e `:focus-visible` selecionam o elemento focalizado: a primeira sempre, a segunda somente quando o navegador julga que o foco deve ficar visível.

| Situação | `:focus` | `:focus-visible` |
|---|---|---|
| Tab até um botão | Se aplica | Se aplica |
| Clique do mouse em um botão | Se aplica | Em geral não |
| Clique em um campo de digitação | Se aplica | Se aplica (o navegador sinaliza o foco em um campo) |

```css
/* RUIM: remove o anel para todo mundo, o teclado não vê mais onde está */
button:focus { outline: none; }

/* BOM: um anel nítido, somente quando o navegador julga que ele ajuda */
button:focus-visible {
    outline: 3px solid #1a4fd6;  /* linha cheia azul-escura de 3 pixels */
    outline-offset: 2px;         /* afasta a linha 2 pixels, para que ela não cole */
}
```

Suprimir o indicador de foco sem substituí-lo torna a página inutilizável pelo teclado: isso contraria o critério 2.4.7 « Foco visível » (nível AA) das WCAG, as regras de acessibilidade web de referência ([critério](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [níveis de conformidade](/?c=ui-ux&p=accessibilite-ux)). O substituto também deve ser bem contrastado, de pelo menos 3 para 1 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)); as [razões de contraste](/?c=ui-ux&p=couleur-et-contraste) são detalhadas no seu capítulo.

## Uma única parada de Tab em um grupo: o « roving tabindex »

Em uma barra de **abas** (uma fileira de botões, cada um exibindo um painel de conteúdo), deixar cada aba alcançável pelo Tab custa um pressionamento de Tab por aba para atravessá-la: dez abas, dez pressionamentos. A convenção é tratar o grupo como **uma única parada de Tab** (um lugar onde o foco para) e circular dentro dele com as setas. A técnica se chama *roving tabindex* (« tabindex itinerante ») e se baseia no atributo `tabindex`, que define se um elemento pode receber o foco e se é alcançável pelo Tab:

| `tabindex` | Foco por clique ou por `.focus()` | Alcançável pelo Tab |
|---|---|---|
| Ausente | Somente se o elemento for nativamente interativo (botão, link, campo) | Sim, se nativo |
| `0` | Sim | Sim, na ordem do HTML |
| `-1` | Sim | **Não** |
| Positivo (`1`, `2`...) | Sim | Sim, mas antes de todos os outros: a ordem do HTML é bagunçada, a evitar |

```
Sem roving tabindex (todas as abas com tabindex="0"):

  Tab -> [ HTML ] -Tab-> [ CSS ] -Tab-> [ JS ] -Tab-> [ painel ] -Tab-> resto da página

Com roving tabindex (só a aba ativa com tabindex="0"):

  Tab -> [ HTML ] -----------------------Tab------------> [ painel ] -Tab-> resto da página
           ^   |  setas esquerda/direita, Home, End
           |   v
        [ CSS ]  [ JS ]   (tabindex="-1": focalizáveis por script, pulados pelo Tab)
```

As teclas seguem o [modelo das abas do APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (*ARIA Authoring Practices Guide*, o guia de boas práticas ARIA publicado pelo W3C, a organização que padroniza a web), aqui com ativação automática: a aba que recebe o foco é exibida imediatamente, o que é recomendado quando o painel aparece sem atraso.

| Tecla | Efeito |
|---|---|
| Tab | Entra na barra na aba ativa; a partir da barra, passa para o painel |
| Seta para a direita | Aba seguinte (após a última, volta à primeira) |
| Seta para a esquerda | Aba anterior (antes da primeira, pula para a última) |
| Home / End | Primeira / última aba (opcional) |

O `<button>` nativo fornece de graça o clique, Enter e Espaço; `role="tab"` substitui apenas o que é anunciado.

| Elemento | Atributo | Papel |
|---|---|---|
| Contêiner | `role="tablist"` | Grupo de abas |
| Contêiner | `aria-label` | Nome do grupo |
| Cada aba | `role="tab"` | Uma aba |
| Cada aba | `aria-selected` | `true` na ativa, `false` nas outras |
| Cada aba | `aria-controls` | `id` do painel que ela controla |
| Cada aba | `tabindex` | `0` na ativa, `-1` nas outras |
| Cada painel | `role="tabpanel"` | Conteúdo de uma aba |
| Cada painel | `aria-labelledby` | `id` da aba: seu nome vem dela |
| Cada painel | `tabindex="0"` | Torna o painel alcançável pelo Tab a partir da barra, quando o seu conteúdo não começa com um elemento focalizável |
| Painéis inativos | `hidden` | Ocultos |

```html
<!-- O grupo de abas: uma única parada de Tab, nomeado « Linguagens da web » -->
<div role="tablist" aria-label="Linguagens da web" id="abas">
    <!-- Aba ativa: selecionada e alcançável pelo Tab (tabindex="0") -->
    <button role="tab" id="aba-html" aria-selected="true"
            aria-controls="painel-html" tabindex="0">HTML</button>
    <!-- Outras abas: não selecionadas, puladas pelo Tab (tabindex="-1") -->
    <button role="tab" id="aba-css" aria-selected="false"
            aria-controls="painel-css" tabindex="-1">CSS</button>
    <button role="tab" id="aba-js" aria-selected="false"
            aria-controls="painel-js" tabindex="-1">JavaScript</button>
</div>

<!-- Painel visível, associado à aba HTML -->
<div role="tabpanel" id="painel-html" aria-labelledby="aba-html" tabindex="0">
    O HTML descreve a estrutura da página.
</div>
<!-- Painéis das abas inativas: ocultos pelo atributo hidden -->
<div role="tabpanel" id="painel-css" aria-labelledby="aba-css" tabindex="0" hidden>
    O CSS descreve a aparência.
</div>
<div role="tabpanel" id="painel-js" aria-labelledby="aba-js" tabindex="0" hidden>
    O JavaScript descreve o comportamento.
</div>
```

```css
/* O estilo lê o estado ARIA : a aba selecionada é sublinhada */
[role="tab"][aria-selected="true"] { border-bottom: 3px solid #1a4fd6; }
```

```javascript
// A barra e a lista de suas abas (o `...` copia a lista para um array de verdade)
const barra = document.getElementById("abas");
const abas = [...barra.querySelectorAll('[role="tab"]')];

// Exibe a aba escolhida, oculta as outras e faz o Tab « viajar » até ela
function ativar(alvo) {
    for (const aba of abas) {
        // verdadeiro (booleano) para uma única aba: a que ativamos
        const ativo = aba === alvo;
        // String() converte o booleano em texto, pois um valor de atributo é um texto
        aba.setAttribute("aria-selected", String(ativo));
        // A propriedade tabIndex é o atributo tabindex: só a ativa continua no Tab
        aba.tabIndex = ativo ? 0 : -1;
        // Encontra o painel graças ao id que `aria-controls` indica
        const painel = document.getElementById(aba.getAttribute("aria-controls"));
        // Só o painel da aba ativa fica visível
        painel.hidden = !ativo;
    }
}

// Um clique em uma aba a ativa
barra.addEventListener("click", (evento) => {
    // `evento.target` : o elemento clicado ; `includes` verifica que é mesmo uma aba
    if (abas.includes(evento.target)) {
        ativar(evento.target);
    }
});

// As teclas do teclado, ouvidas em toda a barra
barra.addEventListener("keydown", (evento) => {
    const ultimo = abas.length - 1;                  // posição da última aba
    const posicao = abas.indexOf(evento.target);     // posição da aba focalizada
    let proxima = -1;                                // -1 : nenhuma tecla tratada

    if (evento.key === "ArrowRight") {
        proxima = posicao === ultimo ? 0 : posicao + 1;   // depois da última: a primeira
    } else if (evento.key === "ArrowLeft") {
        proxima = posicao === 0 ? ultimo : posicao - 1;   // antes da primeira: a última
    } else if (evento.key === "Home") {
        proxima = 0;                                 // primeira aba
    } else if (evento.key === "End") {
        proxima = ultimo;                            // última aba
    }

    if (proxima === -1) return;      // outra tecla: saímos, o Tab mantém seu papel normal
    evento.preventDefault();         // impede Home/End de rolar a página
    ativar(abas[proxima]);           // ativa a aba visada (estado, tabindex, painel)
    abas[proxima].focus();           // move o foco para ela
});
```

Segundo o [guia APG do teclado](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), os grupos de [botões de rádio](/?c=langages&s=html&p=formulaires) seguem a mesma convenção de uma única parada de Tab.

## Manter o foco quando o layout muda

O foco fica preso a um elemento preciso. Se o elemento for removido (uma lista redesenhada com `innerHTML`, uma parte da página substituída), o navegador devolve o foco ao [`<body>`](/?c=langages&s=html&p=structure-dun-document): o usuário do teclado perde a sua posição ([guia APG do teclado](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). Um elemento oculto por `display: none` também não pode mais ser focalizado.

| Situação | Estratégia |
|---|---|
| Dados atualizados, mesmos elementos | Não recriar os nós (os elementos do DOM): atualizar o texto ou os atributos deles, o foco permanece no lugar |
| Lista redesenhada inteira | Memorizar o elemento focalizado por um identificador estável (`data-id`), redesenhar, depois focar o novo elemento equivalente |
| Elemento removido | Mover o foco de propósito para um vizinho lógico (o seguinte, senão o anterior) |
| Painel ou caixa de diálogo fechado | Devolver o foco ao elemento que o tinha aberto (veja `inert`) |
| Mudança de [ponto de quebra](/?c=langages&s=css&p=responsive-et-media-queries) (*breakpoint*) | Adaptar a aparência em CSS nos mesmos elementos, em vez de destruí-los e recriá-los em JavaScript |

`document.activeElement` é a propriedade que devolve o elemento que tem o foco ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)). O exemplo usa [`dataset`](/?c=langages&s=html&p=attributs-data-et-accessibilite) para ligar cada botão à sua tarefa, as [crases](/?c=langages&s=javascript&p=strings) para inserir uma variável em um texto, e `?.` e `??` vistos nas [condicionais](/?c=langages&s=javascript&p=conditions).

```html
<!-- A lista é preenchida pelo JavaScript -->
<ul id="lista"></ul>
```

```javascript
// Cada tarefa tem um identificador estável (id): ele sobrevive aos redesenhos
let tarefas = [
    { id: 1, texto: "Escrever o capítulo" },
    { id: 2, texto: "Reler" },
    { id: 3, texto: "Publicar" },
];
const lista = document.getElementById("lista");

// Redesenha a lista inteira: os botões antigos são destruídos, novos são criados
function exibir() {
    lista.innerHTML = "";                                // esvazia a lista (destrói botões)
    for (const tarefa of tarefas) {                      // uma linha por tarefa
        const item = document.createElement("li");       // cria o item da lista
        const botao = document.createElement("button");  // cria o seu botão
        botao.dataset.id = tarefa.id;                    // data-id : liga o botão à tarefa
        botao.textContent = `Concluir : ${tarefa.texto}`; // texto
        item.appendChild(botao);                         // põe o botão no item
        lista.appendChild(item);                         // põe o item na lista
    }
}

// Refocaliza o botão de uma tarefa ; não faz nada se esse botão não existir
function focarTarefa(id) {
    lista.querySelector(`[data-id="${id}"]`)?.focus();
}

// Caso A : redesenho sem remoção, o foco deve continuar na mesma tarefa
function atualizar() {
    const memorizado = document.activeElement.dataset.id;  // 1. anota o id (ou undefined)
    exibir();                                              // 2. redesenha : foco perdido aqui
    focarTarefa(memorizado);                               // 3. foca o novo botão
}

// Caso B : um clique conclui a tarefa ; o foco passa para a tarefa vizinha
lista.addEventListener("click", (evento) => {
    if (!evento.target.dataset.id) return;                 // clique fora de um botão : sai
    const id = Number(evento.target.dataset.id);           // Number() : texto -> número
    const posicao = tarefas.findIndex((tarefa) => tarefa.id === id); // posição clicada
    tarefas = tarefas.filter((tarefa) => tarefa.id !== id); // cópia sem a tarefa concluída
    exibir();                                              // redesenha a lista
    const vizinha = tarefas[posicao] ?? tarefas[posicao - 1]; // a seguinte, senão a anterior
    if (vizinha) focarTarefa(vizinha.id);                  // se a lista não estiver vazia
});
```

Quando a última tarefa desaparece, não há mais vizinha: o foco deve então ser colocado em outro lugar, por exemplo em um botão « Adicionar tarefa ».

## Resumo das ferramentas

| Ferramenta | Natureza | Valores ou uso | Serve para |
|---|---|---|---|
| `aria-live` | Atributo ARIA | `off`, `polite`, `assertive` | Anunciar uma mudança sem mover o foco |
| `aria-atomic` | Atributo ARIA | `true` | Reler a região live inteira |
| `aria-current` | Atributo ARIA | `page`, `step`, `location`, `date`, `time`, `true`, `false` | Marcar o item atual de um conjunto |
| `aria-selected` | Atributo ARIA | `true`, `false` | Marcar a aba selecionada |
| `aria-hidden` | Atributo ARIA | `true` | Retirar da árvore de acessibilidade, sem bloquear o foco |
| `role` | Atributo HTML | `alert`, `status`, `tablist`, `tab`, `tabpanel` | Dar um papel quando nenhum elemento nativo existe |
| `inert` | Atributo booleano | Presente ou ausente | Tornar uma zona não clicável, não focalizável, não lida |
| `tabindex` | Atributo HTML | `0`, `-1` | Regular o acesso pelo Tab |
| `:focus-visible` | Pseudoclasse CSS | Com `outline` | Exibir o anel de foco pelo teclado |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Criar a região live com o seu conteúdo | Não há nenhuma mudança a anunciar. Colocá-la no HTML original, vazia, e depois mudar o seu texto |
| `aria-live` numa zona que muda sem parar | Um fluxo de anúncios sufoca o usuário. Usar `off` ou anunciar somente um resumo |
| `assertive` ou `role="alert"` em todo lugar | Cada anúncio interrompe a leitura. Reservar às emergências, senão `polite` ou `status` |
| Marcar a página ativa só com estilo | O leitor de tela não sabe disso. Adicionar `aria-current`, uma única vez por conjunto |
| `aria-current` no lugar de `aria-selected` numa aba | As duas não têm o mesmo sentido: uma aba se marca com `aria-selected` |
| Um `role` sem o comportamento que o acompanha | O papel anuncia um botão ou uma aba, mas o teclado não funciona. Preferir o elemento nativo |
| `aria-hidden="true"` em conteúdo focalizável | O foco entra ali sem que nada seja lido. Usar `inert` ou `hidden` |
| `inert` sem sinal visual, ou colocado num ancestral do painel a focar | O usuário não entende por que a zona não reage mais, e o painel fica inerte junto com ela |
| `outline: none` sem substituto | O teclado não vê mais o foco. Usar `:focus-visible` com um contorno contrastado |
| `tabindex="0"` em todas as abas, ou um `tabindex` positivo | Paradas de Tab demais, ou uma ordem que não segue mais o HTML |
| Redesenhar uma lista sem refocar | O foco cai no `<body>` e o usuário perde o seu lugar |
| Achar que um comportamento ARIA é idêntico em todo lugar | Ele varia conforme o navegador e o leitor de tela. Testar com leitores reais, não só pelo teclado |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Escolher primeiro o elemento nativo (`<button>`, `<a>`, `<dialog>`, [`<details>`](/?c=langages&s=html&p=semantique-html5)) | Ele traz papel, teclado e foco sem nenhuma linha de código ARIA |
| Declarar as regiões live no HTML original, com mensagens curtas | É o único meio confiável de elas serem observadas desde o início |
| Usar `polite` por padrão | Anunciar sem cortar a fala do usuário |
| Fazer o estado ser lido tanto pelo estilo quanto pelo ARIA (`[aria-current="page"]`, `[aria-selected="true"]`) | Uma única fonte da verdade: a aparência e o anúncio nunca divergem |
| Para uma zona modal, usar `<dialog>` ou `inert`, depois devolver o foco ao gatilho | O fundo fica bloqueado e o usuário recupera o seu lugar ao fechar |
| Substituir o anel de foco por um `:focus-visible` contrastado, nunca removê-lo | O usuário do teclado vê sempre onde está |
| Grupo de elementos ligados (abas, botões de rádio): uma parada de Tab, setas | Atravessar o grupo custa apenas um pressionamento de Tab |
| Refocar por identificador estável após um redesenho | O foco deixa de depender de um nó destruído |
| Testar só com o teclado (Tab, Shift+Tab, setas, Esc) e depois com um leitor de tela | Só esse teste revela um foco perdido ou um anúncio ausente |

## O que reter

| | |
|---|---|
| **O que reter** | `aria-live` anuncia uma mudança sem mover o foco; `aria-current` marca o item atual; `role` só se usa na falta de um elemento nativo; `inert` bloqueia uma zona inteira; `:focus-visible` desenha o foco pelo teclado; um grupo de elementos ligados é apenas uma parada de Tab (`tabindex` `0` na ativa, `-1` nas outras); o foco é memorizado e restaurado quando os elementos são recriados. |
| **Armadilhas a evitar** | Região live criada com o seu conteúdo, `assertive` abusivo, estilo sem `aria-current`, `aria-hidden` em conteúdo focalizável, `inert` invisível, `outline: none` sozinho, `tabindex="0"` em todo lugar, foco perdido após um redesenho. |
| **Boas práticas** | Elemento nativo primeiro, região live no HTML original, `polite` por padrão, `inert` ou `<dialog>` para o fundo, anel de foco contrastado, refocagem por identificador estável, teste com o teclado e com o leitor de tela. |
