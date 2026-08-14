---
order: 6
---

# Acessibilidade básica (UX)

O capítulo [Atributos data-* e acessibilidade (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite) cobre o *como codificar* a acessibilidade. Este capítulo cobre o *porquê* do lado do projeto: decisões a tomar já na maquete, antes de escrever a menor linha de código: corrigi-las depois sempre custa mais caro.

## Os níveis de conformidade WCAG

O [WCAG](/?c=ui-ux&p=couleur-et-contraste), já encontrado no capítulo sobre cor por suas taxas de contraste, na verdade define três níveis de conformidade globais, que cobrem muito mais do que só o contraste:

| Nível | O que cobre | Uso típico |
|---|---|---|
| A | O mínimo indispensável: sem ele, parte do conteúdo fica totalmente inutilizável para alguns usuários | Raramente suficiente sozinho |
| AA | O nível geralmente visado por padrão em um projeto: bom equilíbrio entre acessibilidade real e esforço de implementação | Padrão de referência para a maioria dos sites e aplicações |
| AAA | Um nível reforçado, difícil de atingir em um site inteiro | Reservado a contextos específicos (serviços essenciais, conteúdo explicitamente destinado a um público com deficiência) |

As taxas de contraste concretas associadas a esses níveis estão detalhadas no capítulo [Cor e contraste](/?c=ui-ux&p=couleur-et-contraste).

## Tamanho mínimo das áreas clicáveis e táteis

Um **alvo tátil** (*touch target*) é a área que um dedo ou cursor precisa alcançar para ativar um elemento: ela pode ser maior que o próprio elemento visual (um ícone) sem que isso se veja.

| Referência | Tamanho mínimo recomendado |
|---|---|
| Apple ([Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)) | 44×44 px |
| Google ([Material Design](https://m3.material.io)) | 48×48 dp |
| WCAG (critério 2.5.5, nível AAA) | 44×44 px |

> **Armadilha:** botões ou links pequenos demais ou próximos demais, principalmente no mobile. O usuário toca o elemento errado: um risco maior para uma pessoa com tremor ou deficiência motora, mas que atrapalha todo mundo (em um ônibus, andando, com dedos grandes).
>
> **Boa prática:** prever uma área clicável de pelo menos 44×44px mesmo quando o elemento visual (um ícone) é menor: um espaço invisível ao redor do ícone pode ampliar a área realmente clicável sem mudar sua aparência.

## Projetar a navegação por teclado já na maquete

A **navegação por teclado** permite usar toda uma interface sem mouse: `Tab` para passar de um elemento interativo ao seguinte, `Enter`/`Espaço` para ativá-lo, `Esc` para fechar uma janela. Ela é indispensável para usuários que não conseguem usar um mouse, e também acelera o uso para qualquer pessoa.

> **Armadilha:** só pensar na navegação por teclado no momento de codificar, com a maquete já fechada. A ordem visual dos elementos, escolhida livremente na maquete, nem sempre corresponde a uma ordem de tabulação lógica: uma correção no código (reordenar manualmente, reestruturar o HTML) se torna necessária depois.
>
> **Boa prática:** definir já na maquete a ordem lógica de navegação (qual elemento recebe o foco primeiro, e depois em qual ordem). Uma ordem que segue o sentido de leitura natural (de cima para baixo, da esquerda para a direita) evita esse problema na grande maioria dos casos.

## Passando para a implementação

A implementação técnica desses princípios (atributos `tabindex`, papéis ARIA, foco visível) é coberta em [Atributos data-* e acessibilidade (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A acessibilidade UX se decide antes do código: nível WCAG visado (A/AA/AAA), áreas clicáveis suficientemente grandes (44×44px mínimo), e ordem de navegação por teclado lógica já na maquete. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: essas escolhas se fazem no projeto (maquete), antes da implementação técnica. |
| **Armadilhas a evitar** | Áreas clicáveis pequenas demais ou próximas demais, principalmente no mobile; adiar a reflexão sobre navegação por teclado até o momento de codificar. |
| **Boas práticas** | Visar o nível AA por padrão; prever áreas clicáveis de pelo menos 44×44px; definir a ordem de tabulação já na maquete, alinhada ao sentido de leitura natural. |
