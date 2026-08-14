---
order: 10
---

# As ferramentas da profissão

Os capítulos anteriores cobrem conceitos (hierarquia, cor, tokens, wireframe...) independentemente de qualquer software específico. Na prática, um designer de interface passa a maior parte do tempo em uma ferramenta de design dedicada, e às vezes em uma ferramenta de animação para as interações mais avançadas; este capítulo nomeia essa paisagem de ferramentas, sem fazer um tutorial: cada uma merece um aprendizado próprio, fora do escopo deste site.

## As ferramentas de design de interface

A maioria das ferramentas desse tipo ([Figma](https://www.figma.com), [Sketch](https://www.sketch.com), Adobe XD, [Penpot](https://penpot.app)...) compartilha os mesmos conceitos básicos, sob nomes às vezes diferentes:

| Conceito | Papel | Equivalente já visto |
|---|---|---|
| Camada (*layer*) | Cada elemento (texto, forma, imagem) existe independentemente, empilhado sobre os outros | Similar ao empilhamento dos elementos HTML em um documento |
| Componente | Um elemento reutilizável (botão, cartão...), definido uma vez e instanciado em todo lugar | A [biblioteca de componentes](/?c=ui-ux&p=design-systems) de um design system |
| Auto-layout | Um contêiner que reposiciona e redimensiona seu conteúdo automaticamente segundo regras (espaçamento, alinhamento), em vez de posições fixadas à mão | [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) em CSS: o mesmo princípio, na ferramenta de design em vez de no código |

Trabalhar com componentes e auto-layout na ferramenta de design, em vez de com posições fixas, produz maquetes que já se comportam como a interface codificada se comportará (um botão que se adapta ao comprimento de seu texto, por exemplo); a distância entre a maquete e o resultado codificado se reduz.

> **Armadilha:** construir uma maquete inteiramente em posições fixas, sem componentes nem auto-layout, porque "é mais rápido dessa vez". Cada mudança posterior (um texto mais longo, um novo idioma) precisa então ser replicada manualmente em cada ocorrência em vez de em uma única definição compartilhada.
>
> **Boa prática:** construir um componente assim que um elemento aparece pela segunda vez de forma idêntica, e usar o auto-layout por padrão em vez do posicionamento fixo: os mesmos reflexos da [biblioteca de componentes](/?c=ui-ux&p=design-systems) e do uso do [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) do lado do código.

## As ferramentas de animação para interações avançadas

Uma transição simples (um botão que muda levemente de cor ao passar o mouse) se cobre diretamente em CSS. Uma interação mais elaborada (vários elementos animados em uma ordem precisa, um movimento que reage ao gesto do usuário, uma física de mola em vez de uma simples aceleração linear) ultrapassa o que as transições CSS básicas cobrem confortavelmente, e se apoia então em uma biblioteca JavaScript dedicada à animação ([GSAP](https://gsap.com), Framer Motion, entre outras):

| | Transição CSS | Biblioteca de animação JS |
|---|---|---|
| Adequada para | Uma mudança de estado simples (hover, aparição) | Sequências de várias animações coordenadas, gestos, uma física de movimento |
| Controle a partir do código | Limitado (disparado por uma mudança de estado CSS) | Fino (iniciar, pausar, encadear etapas com precisão) |
| Custo | Nenhuma dependência adicional | Uma biblioteca externa a carregar e manter |

> **Armadilha:** usar uma biblioteca de animação JavaScript para uma simples transição de estado (um hover, uma aparição) que uma transição CSS bastaria para cobrir. O custo (peso da biblioteca, complexidade de código adicional) ultrapassa amplamente o ganho em um caso tão simples.
>
> **Boa prática:** reservar uma biblioteca de animação JS para as interações que realmente ultrapassam o que as transições CSS cobrem (sequências coordenadas, gestos, física de movimento), não como reflexo padrão para qualquer animação.

## Escolher uma ferramenta: a estabilidade em vez da novidade

> **Armadilha:** trocar de ferramenta de design porque uma nova ferramenta está na moda, sem que ela resolva um problema concreto encontrado com a ferramenta atual. A troca tem um custo real: reaprendizado de toda a equipe, migração das maquetes existentes, interrupção temporária da colaboração com outras áreas (desenvolvedores, produto) já acostumadas à ferramenta em uso.
>
> **Boa prática:** escolher uma ferramenta conforme o que a equipe e o ecossistema existente já usam (interoperabilidade com as outras ferramentas do projeto, competências já adquiridas), e só trocar diante de uma necessidade concreta não coberta pela ferramenta atual, não por antecipação de uma necessidade hipotética.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | As ferramentas de design de interface (Figma e suas alternativas) compartilham os mesmos conceitos básicos (camadas, componentes, auto-layout) que já prefiguram diretamente a estrutura do código final. Uma biblioteca de animação JS (GSAP, Framer Motion) assume o controle das transições CSS para interações mais elaboradas (sequências, gestos, física de movimento). |
| **Ferramentas utilizáveis** | Uma ferramenta de design com componentes e auto-layout (Figma ou equivalente); uma biblioteca de animação JS para interações que ultrapassam uma simples transição CSS. |
| **Armadilhas a evitar** | Construir uma maquete em posições fixas sem componentes nem auto-layout. Usar uma biblioteca de animação JS para uma simples transição que uma regra CSS bastaria para cobrir. Trocar de ferramenta por moda em vez de necessidade concreta. |
| **Boas práticas** | Criar um componente assim que um elemento se repete, usar o auto-layout por padrão. Reservar uma biblioteca de animação JS para as interações realmente complexas. Escolher uma ferramenta por sua adequação à equipe existente, não por sua novidade. |
