---
order: 2
---

# Variáveis CSS e a cascata

Este capítulo cobre dois mecanismos transversais do CSS: as **variáveis personalizadas** (reutilizar um valor em vários lugares), e a **cascata** (como o CSS resolve um conflito entre várias regras que miram no mesmo elemento): o "C" de CSS (*Cascading*) se refere diretamente a esse segundo mecanismo.

## As variáveis CSS (propriedades personalizadas)

```css
:root {
    --cor-primaria: #3366cc;
    --espacamento-padrao: 16px;
}

.botao {
    background-color: var(--cor-primaria);
    padding: var(--espacamento-padrao);
}
```

`:root` mira no elemento raiz do documento (`<html>`): declarar as variáveis ali as torna acessíveis **em qualquer lugar** da folha de estilo. Mudar uma única vez `--cor-primaria` atualiza instantaneamente todos os lugares que a usam, sem "buscar e substituir" no arquivo inteiro.

```css
.botao {
    /* "blue": valor de reserva se a variável não existir */
    background-color: var(--cor-primaria, blue);
}
```

## Variáveis locais a um componente

```css
.cartao {
    --margem-interna: 20px;
    padding: var(--margem-interna);
}

.cartao.compacto {
    /* redefine a variável APENAS para os elementos com essa classe adicional */
    --margem-interna: 8px;
}
```

> **Nota:** ao contrário de uma variável [Sass](https://sass-lang.com)/[Less](https://lesscss.org) (resolvidas de uma vez por todas na compilação), uma variável CSS nativa é **viva** no navegador: modificável até em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`elemento.style.setProperty('--margem-interna', '30px')`), e reavaliada dinamicamente conforme o elemento onde é consultada.

## `color-mix()`: derivar uma cor a partir de uma variável, sem declarar uma nova

```css
.botao-perigo:hover {
    background-color: color-mix(in srgb, var(--cor-perigo) 85%, black);
    /* mistura 85% de --cor-perigo com preto: uma versão levemente escurecida, ao passar o
       mouse */
}
```

`color-mix(in <espaço-de-cor>, cor1 porcentagem1, cor2)` mistura duas cores no espaço de cor indicado (`srgb` é o mais comum), sem precisar calcular nem declarar uma nova variável dedicada para cada variante (hover, desabilitado, um fundo levemente tingido...).

| | Sem `color-mix()` | Com `color-mix()` |
|---|---|---|
| Uma variante mais escura ao passar o mouse | Calcular/declarar uma segunda variável (`--cor-perigo-hover`) | `color-mix(in srgb, var(--cor-perigo) 85%, black)` |
| Um fundo levemente tingido | Uma terceira variável dedicada, ou uma cor `rgba()` fixa | `color-mix(in srgb, var(--cor-perigo) 10%, transparent)` |

> **Boa prática:** usar `color-mix()` para qualquer variante pontual de uma cor já declarada como variável (mais clara, mais escura, mais transparente), em vez de multiplicar variáveis dedicadas para cada pequena variação.

## Ler uma variável CSS a partir do JavaScript

A escrita acima (`setProperty`) tem seu inverso, a **leitura**: útil para que uma renderização que não entende CSS (desenho em `<canvas>`, gráfico em SVG gerado em JavaScript) continue sincronizada com as cores declaradas na folha de estilo, sem duplicá-las direto no código JS.

```javascript
const corPrimaria = getComputedStyle(document.documentElement)
    // "#3366cc" (string bruta, com os espaços originais)
    .getPropertyValue("--couleur-primaire")
    .trim();

console.log(corPrimaria || "#000000");        // valor de reserva se a variável não existir
```

`getComputedStyle(elemento)` retorna o estilo **final** aplicado a esse elemento depois que a cascata é resolvida (veja a seção seguinte), como um objeto consultável via `getPropertyValue()`. Diferente de `var(--nome, reserva)` em CSS, `getPropertyValue()` não tem valor de reserva integrado: retorna uma string vazia se a variável não existir, a tratar por conta própria (`|| "#000000"` acima).

> **Armadilha:** `getPropertyValue()` sempre retorna uma string bruta, com os espaços originais inclusos (`" #3366cc"` por exemplo): `.trim()` evita comparações ou concatenações erradas em silêncio por causa de um espaço invisível.

## A cascata: três critérios, nesta ordem

Diante de várias regras mirando no mesmo elemento e na mesma propriedade, o CSS as desempata nesta ordem precisa:

### 1. A importância (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignorado: a regra acima tem !important */
```

`!important` ignora todo o resto da cascata: uma regra com `!important` vence, qualquer que seja sua especificidade ou sua ordem de escrita.

> **Boa prática:** evitar `!important` no uso comum: ele torna a depuração difícil (impossível de sobrescrever de forma simples) e quebra a lógica natural da cascata. A reservar para casos bem excepcionais (frequentemente para sobrescrever um estilo de terceiros que não se controla).

### 2. A especificidade (veja [Os seletores](/?c=langages-de-balisage&s=css&p=selecteurs))

```css
#botao-principal { color: blue; }  /* especificidade: id -> mais forte */
.botao { color: red; }             /* especificidade: classe -> mais fraca */
```

O seletor mais específico vence, independentemente da ordem de escrita no arquivo.

### 3. A ordem de aparição (com especificidade igual)

```css
.botao { color: blue; }
.botao { color: red; }   /* VENCE: mesma especificidade, mas escrita por último */
```

Com especificidade estritamente igual, a regra declarada **por último** no arquivo (ou no último arquivo carregado) prevalece.

## A herança: algumas propriedades se transmitem, outras não

```css
body {
    /* HERDADO: todos os descendentes (p, span, li...) assumem essa cor de texto */
    color: #333;
    border: 1px solid;  /* NÃO herdado: cada elemento tem sua própria borda, ou nenhuma */
}
```

As propriedades ligadas ao **texto** (`color`, `font-family`, `font-size`, `line-height`...) geralmente são herdadas por padrão; as propriedades ligadas à **caixa** (`border`, `margin`, `padding`, `background`...) nunca são: é um mecanismo distinto da cascata, embora interaja com ela (uma regra herdada tem a especificidade mais baixa possível, facilmente sobrescrita por qualquer regra diretamente aplicada ao elemento).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As variáveis CSS (`--nome`, lidas via `var()`) evitam repetir um valor. Diante de um conflito entre regras, a cascata decide nesta ordem: `!important` > especificidade > ordem de escrita. A herança (texto sim, caixa não) é um mecanismo distinto que interage com a cascata. |
| **Ferramentas utilizáveis** | `:root` para variáveis globais, `var(--nome, valor-de-reserva)`, `color-mix(in srgb, ...)` para derivar uma variante de cor, `elemento.style.setProperty()` para modificá-las em JavaScript, `getComputedStyle().getPropertyValue()` para lê-las. |
| **Armadilhas a evitar** | Abusar de `!important`: ele ignora toda a cascata e torna o estilo difícil de sobrescrever depois. Esquecer `.trim()` após `getPropertyValue()`: a string retornada mantém seus espaços originais. |
| **Boas práticas** | Reservar `!important` para casos excepcionais (sobrescrever um estilo de terceiros não controlado); definir cores/espaçamentos recorrentes como variáveis em `:root` em vez de repeti-los; ler essas variáveis a partir do JS em vez de duplicar as cores direto no código, para que uma renderização Canvas/SVG continue sincronizada com a folha de estilo. |
