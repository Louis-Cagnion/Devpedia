---
order: 1
---

# Hierarquia visual

Diante de uma tela, ninguém lê na ordem do código-fonte: o olho salta espontaneamente para certos elementos antes de outros. A **hierarquia visual** é a técnica que decide essa ordem no lugar do acaso.

**Hierarquia visual**: organizar os elementos de uma tela para que o olho vá primeiro para o que mais importa, e depois para o resto em uma ordem desejada.

> **Analogia:** a capa de um jornal. O título principal é enorme, o subtítulo menor, o corpo do texto ainda menor. Ninguém precisa ser instruído sobre o que ler primeiro: o tamanho sozinho já indica isso.

**Por que isso importa:** sem hierarquia, todos os elementos têm o mesmo peso visual. O usuário precisa então ler tudo para encontrar a informação que procura: em um site ou aplicativo, esse tempo perdido se traduz diretamente em abandono.

## As alavancas da hierarquia

Um elemento se destaca em relação aos outros através de uma combinação dessas alavancas:

| Alavanca | Efeito | Exemplo |
|---|---|---|
| Tamanho | Maior = percebido como mais importante | Um título `h1` maior que o texto corrente |
| Peso / espessura | Mais espesso (negrito) = atrai o olho | Uma palavra-chave em **negrito** em um parágrafo |
| Cor | Uma cor que se destaca do resto atrai a atenção | Um botão de ação colorido no meio de uma página em tons de cinza |
| Contraste | Um elemento nítido sobre um fundo que o opõe se destaca | Texto escuro sobre fundo claro, ou o inverso |
| Espaçamento | Mais espaço vazio ao redor de um elemento = ele fica isolado, logo notado | Um título cercado de margem em vez de colado ao texto seguinte |
| Posição | Um elemento colocado no topo ou à esquerda (leitura ocidental) é visto primeiro | O logo e o menu principal no topo de uma página |

```text
<h1>Titulo principal</h1>         → grande, negrito: lido primeiro
<p>Texto de introducao.</p>       → tamanho normal: lido em seguida
<small>Notas legais</small>       → pequeno, discreto: lido por ultimo, se necessario
```

Essas alavancas se combinam: um título grande E negrito E isolado por espaço se destaca muito mais do que um título que tem apenas um desses três trunfos.

## Um ponto focal por tela: primário, secundário, terciário

Em uma dada tela, cada elemento se classifica em um destes três papéis:

| Papel | Função na tela | Exemplo |
|---|---|---|
| Primário | O único elemento que o usuário deve ver primeiro | O botão "Cadastrar-se" de uma página inicial |
| Secundário | O que sustenta ou explica o primário | O subtítulo que descreve a oferta |
| Terciário | O detalhe consultado apenas se necessário | As notas legais, um link "saiba mais" |

> **Armadilha:** querer destacar tudo ao mesmo tempo: um título enorme, vários botões coloridos, texto em negrito em todo lugar. Resultado: nada mais se destaca, a tela vira uma bagunça visual onde o olho não sabe mais para onde ir (a *sobrecarga visual*).
>
> **Boa prática:** escolher um único elemento primário por tela antes de projetar qualquer outra coisa. Todo o resto se hierarquiza depois abaixo dele, nunca no seu nível.

## Padrões de leitura: F-pattern e Z-pattern

Estudos de rastreamento ocular (*eye-tracking*) mostram que o olho segue trajetórias recorrentes conforme o tipo de página.

**F-pattern**: para uma página densa em texto (artigo, resultados de busca, lista de produtos):

```text
█████████████████████████    ← 1a linha: percorrida por inteiro
████████████
█
████████████████             ← 2a linha: percorrida, mais curta
████
█                             ← depois o olho desce principalmente
█                                pela margem esquerda,
█                                lendo pouco do resto de cada linha
```

O usuário lê por inteiro as primeiras linhas, depois se contenta em escanear o início das linhas seguintes descendo. Consequência prática: colocar a informação mais importante nas primeiras palavras de cada título ou parágrafo.

**Z-pattern**: para uma página simples e pouco densa (página inicial, landing page):

```text
[Logo]──────────────────────►[Menu / Login]
                                            ╱
                                 ╱
                     ╱
           ╱
  ╱
[Argumento chave]───────────►[Botao de acao]
```

O olho parte do canto superior esquerdo, varre para a direita, desce em diagonal, e depois varre uma última vez para a direita: é ali que se coloca naturalmente o botão de ação principal (o ponto primário definido acima).

> **Armadilha:** aplicar um Z-pattern a uma página densa em texto (ou o inverso). O padrão de leitura depende da densidade de conteúdo, não de uma preferência estética: uma escolha errada empurra o usuário a ler na ordem desejada pelo designer, não na que vem naturalmente a ele.

> **Tendência atual (2026):** depois de vários anos de layouts muito experimentais, a tendência volta para hierarquias legíveis e previsíveis, mais próximas desses padrões clássicos do que de uma composição surpreendente: a novidade visual cede espaço à rapidez de compreensão.

## Passando para a implementação

Este capítulo permanece deliberadamente independente de uma linguagem: as alavancas acima (tamanho, espaçamento, posição...) se traduzem concretamente em CSS via [O modelo de caixa](/?c=langages-de-balisage&s=css&p=box-model) (espaçamento, dimensões) e [O posicionamento](/?c=langages-de-balisage&s=css&p=positionnement) (posicionamento dos elementos na tela).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A hierarquia visual organiza uma tela para que o olho vá primeiro para o que importa. Ela se obtém via alavancas (tamanho, peso, cor, contraste, espaçamento, posição) e se apoia em um único elemento primário por tela. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: a hierarquia se decide no momento do projeto (esboço, maquete) e depois se traduz em código (CSS, principalmente). |
| **Armadilhas a evitar** | Destacar vários elementos ao mesmo tempo (sobrecarga visual, nada mais se destaca); aplicar um padrão de leitura (F ou Z) que não corresponde à densidade real do conteúdo. |
| **Boas práticas** | Escolher um único elemento primário por tela antes de hierarquizar o resto; combinar várias alavancas (tamanho + espaçamento + posição) em vez de uma só para reforçar um elemento importante. |
