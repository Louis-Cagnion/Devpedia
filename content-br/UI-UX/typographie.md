---
order: 3
---

# Tipografia

O tamanho e o peso do texto já foram apresentados como alavancas de [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle). Este capítulo vai mais longe: quais fontes escolher, e como combiná-las sem prejudicar a legibilidade.

## As famílias de fontes

Toda fonte pertence a uma destas três famílias:

| Família | Característica visual | Conotação | Uso típico | Exemplos |
|---|---|---|---|---|
| Serif (com serifas) | Pequenos traços nas extremidades das letras | Confiança, tradição | Impresso, textos longos | Georgia, Times New Roman, Merriweather |
| Sans-serif (sem serifa) | Linhas limpas, sem decoração | Moderno, clean | Interfaces na tela (a maioria dos sites) | Helvetica, Arial, Inter, Roboto |
| Monospace | Cada caractere ocupa exatamente a mesma largura | Técnico, preciso | Código, dados tabulares | Courier New, Fira Code, Consolas |

> **Por que isso importa:** uma fonte mal escolhida envia um sinal contrário à mensagem. Uma fonte manuscrita em um site bancário, por exemplo, contradiz a seriedade esperada do conteúdo, mesmo que o texto continue perfeitamente legível.

## Hierarquia tipográfica: uma escala, não tamanhos aleatórios

Os tamanhos e pesos usados em um site devem seguir uma escala definida antecipadamente, não ser escolhidos caso a caso:

| Elemento | Tamanho indicativo | Peso |
|---|---|---|
| Título principal (`h1`) | 32-48px | Negrito (700) |
| Subtítulo (`h2`) | 24-32px | Semi-negrito (600) |
| Título de seção (`h3`) | 18-24px | Semi-negrito (600) |
| Corpo de texto | 16px | Normal (400) |
| Texto secundário | 14px | Normal (400) |

> **Armadilha:** usar mais de 2-3 fontes diferentes em um mesmo projeto. Cada fonte adicional acrescenta ruído visual e dilui a [hierarquia](/?c=ui-ux&p=hierarchie-visuelle) em vez de reforçá-la.
>
> **Boa prática:** limitar-se a 2-3 fontes por projeto: tipicamente uma para os títulos, uma para o corpo de texto, e eventualmente uma monospace reservada para código ou dados.

## Legibilidade: comprimento de linha, entrelinha, espaçamento

Três ajustes determinam se um texto se lê confortavelmente ou cansa o olho:

| Ajuste | Valor recomendado | Efeito se mal ajustado |
|---|---|---|
| Comprimento de linha | ~50-75 caracteres | Longo demais: o olho perde o fio ao voltar para a linha seguinte. Curto demais: a leitura fica picada por quebras de linha frequentes demais |
| Entrelinha (*line-height*) | 1.4 a 1.6 vezes o tamanho do texto | Apertado demais: as linhas se sobrepõem visualmente. Espaçado demais: o texto perde sua coesão, parece desconexo |
| Espaçamento de letras | Valor padrão da fonte, exceto caso particular | Um espaçamento apertado em um título em maiúsculas reduz a legibilidade; abri-lo levemente ajuda, ao contrário |

```text
❌ Longo demais (pagina em largura total, mais de 100 caracteres por linha): o olho precisa
   percorrer uma distancia grande demais para reencontrar o inicio da linha seguinte.

✅ Correto (~65 caracteres por linha): o olho reencontra facilmente o inicio
   da linha seguinte, a leitura permanece fluida em todo o comprimento do texto.
```

## O pairing: combinar duas fontes

O **pairing** consiste em escolher uma fonte para os títulos e outra para o corpo de texto:

| Títulos | Corpo de texto | Por que funciona |
|---|---|---|
| Playfair Display (serif) | Inter (sans-serif) | Contraste marcado entre as duas: cada uma permanece identificável em seu papel |
| Montserrat (sans-serif, negrito) | Open Sans (sans-serif, normal) | Mesmo estilo geral, distinção pelo peso em vez da forma das letras |

> **Armadilha:** combinar duas fontes que se parecem quase idênticas, sem ser iguais. O resultado parece um erro (a fonte errada aplicada por engano) em vez de uma escolha intencional.
>
> **Boa prática:** buscar um contraste nítido entre as duas fontes (estilos claramente diferentes), ou na falta disso permanecer na mesma família jogando com o peso, nunca um meio-termo ambíguo.

> **Tendência atual (2026):** uma tipografia ousada e superdimensionada, às vezes deliberadamente "desordenada", usada como elemento central da identidade visual em vez de simples acabamento do texto.

## Passando para a implementação

Como para uma paleta de cores, uma escala de tamanhos e uma lista de fontes se declaram em [CSS](/?c=langages-de-balisage&s=css&p=css) como valores reutilizáveis: veja [Variáveis CSS e a cascata](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada fonte pertence a uma família (serif, sans-serif, monospace) portadora de uma conotação. Uma escala de tamanhos/pesos coerente e uma legibilidade cuidada (comprimento de linha, entrelinha) prevalecem sobre a escolha estética das fontes em si. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: a escolha e a escala das fontes se decidem no projeto, e depois se declaram em CSS. |
| **Armadilhas a evitar** | Usar mais de 2-3 fontes em um mesmo projeto; combinar duas fontes visualmente próximas demais sem que seja uma escolha assumida. |
| **Boas práticas** | Limitar o projeto a no máximo 2-3 fontes; buscar um contraste nítido entre a fonte de título e a de corpo (ou permanecer na mesma família jogando com o peso). |
