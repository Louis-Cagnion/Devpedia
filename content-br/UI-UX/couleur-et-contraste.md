---
order: 2
---

# Cor e contraste

A cor é uma das alavancas da [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle): ela atrai o olho e distingue os elementos entre si. Ela merece seu próprio capítulo porque obedece a regras próprias: de harmonia, de legibilidade e de acessibilidade.

## A roda de cores e as harmonias

A **roda de cores** organiza as cores em círculo, na ordem em que degradam umas para as outras:

```roue-chromatique
label: A roda de cores
```

Sua posição relativa nesse círculo determina combinações ("harmonias") que funcionam visualmente:

| Harmonia | Como identificar na roda | Exemplo | Efeito visual |
|---|---|---|---|
| Complementar | Duas cores opostas uma à outra | Vermelho / Verde | Contraste forte, dinâmico; pode cansar o olho se usado em excesso |
| Análoga | Várias cores vizinhas | Amarelo / Verde / Azul | Suave e coerente, pouco contraste |
| Tríade | Três cores igualmente espaçadas | Vermelho / Amarelo / Azul | Vívida e equilibrada, mais difícil de dosar |

O mesmo princípio geométrico, independentemente dos nomes exatos das cores (sua posição exata na roda varia conforme o modelo de cor usado):

```roue-chromatique
hues: 30, 210
label: Complementar (opostas)
```

```roue-chromatique
hues: 90, 120, 150
label: Analoga (vizinhas)
```

```roue-chromatique
hues: 30, 150, 270
label: Triade (espacadas em 120 graus)
```

> **Armadilha:** escolher uma harmonia (por exemplo tríade) e depois usar suas cores em partes iguais. O resultado perde toda [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle) e fica berrante: nenhuma das três se distingue como a mais importante.
>
> **Boa prática:** distribuir as cores segundo uma proporção dominante/secundária/destaque; uma regra comum é o **60-30-10**: 60% de uma cor dominante neutra, 30% de uma cor secundária, 10% de uma cor de destaque reservada aos elementos que realmente devem se sobressair (um botão de ação, por exemplo).

## O contraste: legibilidade antes de tudo (WCAG)

O **WCAG** (*Web Content Accessibility Guidelines*) é um conjunto de regras de referência para acessibilidade web. Ele define uma **taxa de contraste** mínima entre um texto e seu fundo, medida automaticamente por uma ferramenta (não calculada à mão):

| Nível | Taxa mínima | Aplica-se a |
|---|---|---|
| AA | 4.5 : 1 | Texto normal (o nível mínimo geralmente recomendado) |
| AA (texto grande) | 3 : 1 | Títulos e texto de tamanho grande (≥ 18 pt, ou 14 pt em negrito) |
| AAA | 7 : 1 | Nível reforçado, recomendado para um público com baixa visão |

> **Armadilha:** um texto cinza claro sobre fundo branco, escolhido "porque fica mais suave". Visualmente discreto, mas frequentemente abaixo da taxa 4.5:1: ilegível para parte dos usuários (visão fraca, tela sob sol forte, tela mal calibrada...).
>
> **Boa prática:** verificar a taxa real com uma ferramenta dedicada (o verificador de contraste integrado às ferramentas de desenvolvedor do navegador, ou um verificador online) em vez de a olho nu.

## Nunca codificar uma informação apenas pela cor

```text
❌ Ruim: em um formulario, um campo com erro e bordado de vermelho, um campo valido de verde:
   essa e a UNICA diferenca entre os dois.

✅ Bom: o campo com erro e bordado de vermelho, E exibe um icone ⚠, E uma mensagem de texto
   ("Formato de email invalido"): tres indicios, dois dos quais nao dependem da percepcao de cores.
```

> **Armadilha:** distinguir dois estados apenas pela cor (vermelho/verde em particular). Cerca de 8% dos homens (uma proporção menor entre as mulheres) têm alguma forma de daltonismo e não percebem essa diferença.
>
> **Boa prática:** dobrar sistematicamente uma informação codificada em cor com um segundo indício que não dependa dela: ícone, texto, posição, forma ou padrão.

## Significado cultural das cores

Uma cor não evoca a mesma coisa em todo lugar, a nuançar conforme o público realmente visado, principalmente para um produto internacional:

| Cor | Associação frequente (cultura ocidental) | Nuance em outro lugar |
|---|---|---|
| Vermelho | Perigo, urgência | Cor de sorte e de festa na China |
| Branco | Pureza, casamento | Cor de luto em várias culturas do Leste Asiático |
| Verde | Natureza, validação, dinheiro (cultura dos EUA) | Associação bem mais fraca ao dinheiro fora dos Estados Unidos |

> **Boa prática:** nunca supor que uma associação é universal. Verificar junto ao público-alvo real em vez de confiar em uma única referência cultural.

> **Tendência atual (2026):** hiperpersonalização das paletas (interfaces que podem se adaptar às preferências de cada usuário) e retorno a cores marcantes, "com personalidade", em vez de tons neutros genéricos.

## Passando para a implementação

Em [CSS](/?c=langages-de-balisage&s=css&p=css), uma paleta de cores se declara como um conjunto de valores reutilizáveis em vez de repetidas a cada regra: veja [Variáveis CSS e a cascata](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A cor combina harmonias (complementar, análoga, tríade) e um contraste suficiente (taxas WCAG AA 4.5:1 / AAA 7:1) para permanecer ao mesmo tempo estética e legível por todos. |
| **Ferramentas utilizáveis** | Um verificador de contraste (integrado às ferramentas de desenvolvedor do navegador, ou online) para verificar uma taxa real em vez de a olho nu. |
| **Armadilhas a evitar** | Usar as cores de uma harmonia em partes iguais (perda de hierarquia); codificar uma informação apenas pela cor (invisível para daltônicos, ~8% dos homens). |
| **Boas práticas** | Distribuir as cores em dominante/secundária/destaque (regra do 60-30-10); dobrar toda informação codificada em cor com um segundo indício (ícone, texto, forma). |
