---
order: 6
---

# Os testes end-to-end

Os [testes de integração](/?c=tests&p=tests-dintegration) verificam se vários componentes se entendem entre si, mas geralmente continuam internos ao programa (sem interface gráfica, sem navegador real). O topo da [pirâmide de testes](/?c=tests&p=pyramide-de-test), os testes **end-to-end** (E2E, "de ponta a ponta"), vai mais longe: simular um percurso de usuário completo, exatamente como uma pessoa real o executaria.

## Simular o usuário, não o código

Um teste E2E não conhece nada da implementação interna do programa: ele conduz a aplicação como um humano faria, clicando em botões, preenchendo campos, lendo o que aparece na tela.

```text
Teste E2E: "um cliente consegue fazer um pedido do início ao fim"

  1. Abrir a página inicial do site
  2. Clicar em um produto
  3. Clicar em "Adicionar ao carrinho"
  4. Ir para a página de pagamento
  5. Preencher o formulário de entrega
  6. Confirmar o pedido
  7. Verificar se a página de confirmação aparece corretamente
```

Esse teste poderia ter falhado por causa de um bug em qualquer uma dessas sete etapas: é exatamente isso que lhe dá valor, ele verifica se o percurso realmente funciona como um todo, não apenas cada peça isoladamente.

## O preço dessa cobertura ampla

Um teste E2E roda a aplicação inteira (frequentemente em um navegador real e automatizado), o que o torna nitidamente mais lento que um teste unitário ou de integração, e mais frágil: uma mudança visual inofensiva (um botão movido, um texto reformulado) pode quebrar o teste sem que haja nenhum bug real.

> **Cilada:** identificar os elementos da página pelo seu texto exibido ou sua posição visual ("o terceiro botão", "o link que diz Continuar"). Uma simples mudança de texto ou de layout, mesmo sem bug, quebra então o teste.
>
> **Boa prática:** identificar os elementos por um atributo dedicado e estável (um `id`, um atributo `data-testid`), independente do texto exibido ou do layout, para que só uma mudança real de comportamento faça o teste falhar.

## Reservar o E2E para os percursos verdadeiramente críticos

Esse custo (lentidão, fragilidade relativa) justifica diretamente o formato da pirâmide de testes: um teste E2E por percurso realmente crítico para o usuário (criar uma conta, pagar, enviar uma mensagem), não um teste E2E para cada detalhe que um teste unitário mais rápido e mais estável já cobriria.

```text
Bom candidato para um teste E2E:
  "um cliente consegue fazer um pedido" (percurso de negócio
  crítico, envolve várias páginas e vários componentes)

Mau candidato para um teste E2E:
  "o campo email rejeita um endereço mal formatado" (já coberto,
  mais rápido e de forma mais confiável, por um teste unitário
  sobre a função de validação)
```

> **Cilada:** tentar cobrir todas as combinações possíveis com testes E2E, por falta de testes unitários suficientes sobre os mesmos casos. A suíte se torna então lenta a ponto de atrasar toda a equipe, sem um ganho proporcional de confiabilidade.
>
> **Boa prática:** manter em E2E apenas os percursos cuja falha teria um impacto real de negócio, e delegar a verificação de detalhes (validação de um campo, cálculo isolado) aos níveis mais baixos da pirâmide.

## Testes instáveis: um problema ainda mais marcado aqui

O problema dos testes **instáveis** (*flaky*, já visto no capítulo de testes unitários) atinge o E2E de forma particularmente forte: um atraso de rede variável, uma animação que ainda não terminou quando o teste tenta clicar, uma ordem de carregamento ligeiramente diferente de uma execução para outra, podem fazer um teste falhar sem nenhuma relação com um bug real.

> **Boa prática:** esperar explicitamente que um elemento esteja presente e interativo antes de agir sobre ele (em vez de uma pausa fixa de alguns segundos, que fica ou curta demais ou desnecessariamente longa), e tratar toda falha E2E repetida como um sinal a investigar, nunca como um ruído de fundo normal.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um teste end-to-end simula um percurso de usuário completo na aplicação real, sem conhecer sua implementação interna. Mais lento e mais frágil que um teste unitário ou de integração, é reservado aos percursos verdadeiramente críticos para o usuário. |
| **Ferramentas utilizáveis** | Atributos dedicados e estáveis (`data-testid`) para identificar os elementos de página. Uma espera explícita sobre a presença/interatividade de um elemento em vez de uma pausa fixa. |
| **Ciladas a evitar** | Identificar os elementos pelo seu texto ou sua posição visual. Cobrir em E2E casos já cobertos por testes unitários mais rápidos. |
| **Boas práticas** | Identificar os elementos por um atributo estável e dedicado. Reservar o E2E aos percursos cuja falha teria um impacto real de negócio. Tratar uma falha E2E repetida como um sinal a investigar. |
