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
    background-color: var(--cor-primaria, blue);   /* "blue": valor de reserva se a variavel nao existir */
}
```

## Variáveis locais a um componente

```css
.cartao {
    --margem-interna: 20px;
    padding: var(--margem-interna);
}

.cartao.compacto {
    --margem-interna: 8px;   /* redefine a variavel APENAS para os elementos com essa classe adicional */
}
```

> **Nota:** ao contrário de uma variável [Sass](https://sass-lang.com)/[Less](https://lesscss.org) (resolvidas de uma vez por todas na compilação), uma variável CSS nativa é **viva** no navegador: modificável até em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`elemento.style.setProperty('--margem-interna', '30px')`), e reavaliada dinamicamente conforme o elemento onde é consultada.

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
.botao { color: red; }   /* VENCE: mesma especificidade, mas escrita por ultimo */
```

Com especificidade estritamente igual, a regra declarada **por último** no arquivo (ou no último arquivo carregado) prevalece.

## A herança: algumas propriedades se transmitem, outras não

```css
body {
    color: #333;        /* HERDADO: todos os descendentes (p, span, li...) assumem essa cor de texto */
    border: 1px solid;  /* NAO herdado: cada elemento tem sua propria borda, ou nenhuma */
}
```

As propriedades ligadas ao **texto** (`color`, `font-family`, `font-size`, `line-height`...) geralmente são herdadas por padrão; as propriedades ligadas à **caixa** (`border`, `margin`, `padding`, `background`...) nunca são: é um mecanismo distinto da cascata, embora interaja com ela (uma regra herdada tem a especificidade mais baixa possível, facilmente sobrescrita por qualquer regra diretamente aplicada ao elemento).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As variáveis CSS (`--nome`, lidas via `var()`) evitam repetir um valor. Diante de um conflito entre regras, a cascata decide nesta ordem: `!important` > especificidade > ordem de escrita. A herança (texto sim, caixa não) é um mecanismo distinto que interage com a cascata. |
| **Ferramentas utilizáveis** | `:root` para variáveis globais, `var(--nome, valor-de-reserva)`, `elemento.style.setProperty()` para modificá-las em JavaScript. |
| **Armadilhas a evitar** | Abusar de `!important`: ele ignora toda a cascata e torna o estilo difícil de sobrescrever depois. |
| **Boas práticas** | Reservar `!important` para casos excepcionais (sobrescrever um estilo de terceiros não controlado); definir cores/espaçamentos recorrentes como variáveis em `:root` em vez de repeti-los. |
