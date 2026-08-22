---
order: 2
---

# A pirâmide de testes

Um programa pode ser testado em vários níveis: uma única função isolada, vários componentes que trabalham juntos, ou a aplicação inteira a partir da tela do usuário. Esses três níveis não têm o mesmo custo nem a mesma velocidade de execução, o que levanta uma questão real de organização: quantos testes escrever em cada nível? A **pirâmide de testes** é o modelo que responde a essa pergunta.

## Três níveis, três compromissos

| Nível | O que verifica | Velocidade | Custo de manutenção |
|---|---|---|---|
| **Teste unitário** | Uma única função ou classe, isolada do resto do programa | Muito rápido (milissegundos) | Baixo: pouco código a ajustar se o teste quebrar |
| **Teste de integração** | Vários componentes que interagem (ex. o código e um banco de dados) | Médio (depende dos componentes reais envolvidos) | Médio: depende de componentes externos que podem mudar por conta própria |
| **Teste end-to-end** (*E2E*) | A aplicação inteira, do ponto de vista do usuário (ex. um navegador clicando de verdade nos botões) | Lento (segundos a minutos) | Alto: quebra com a menor mudança de interface, frequentemente instável (*flaky*) |

Um teste unitário isola a função testada do resto do programa por meio de **mocks** ou **stubs** (substitutos fictícios das dependências externas, detalhados no capítulo sobre arquitetura de testes): é isso que o torna rápido e confiável, mas não garante que as diferentes partes do programa funcionem corretamente uma vez montadas.

## O formato piramidal: muito de rápido, pouco de lento

```text
        /\
       /E2E\          <- poucos (lentos, caros de manter)
      /------\
     /Integra-\       <- quantidade média
    /  ção     \
   /------------\
  /  Unitários   \    <- muito numerosos (rápidos, baratos)
 /----------------\
```

Essa distribuição não é arbitrária: vem diretamente da tabela acima. Como os testes unitários são rápidos e baratos, é possível se dar ao luxo de escrever muitos, o que permite verificar um grande número de casos precisos. Como os testes E2E são lentos e frágeis, mantém-se poucos, reservados aos fluxos realmente críticos (ex. "um cliente consegue fazer um pedido do início ao fim") em vez de cada detalhe.

> **Cilada:** o antipadrão do "cone de sorvete" invertido, uma pirâmide de cabeça para baixo em que a maioria dos testes são E2E lentos e poucos testes unitários existem. Resultado: uma suíte de testes que leva horas para rodar, falha frequentemente por motivos sem relação com um bug real (um atraso de rede, um elemento de interface que mudou de lugar), e que a equipe acaba ignorando ou desativando.
>
> **Boa prática:** antes de adicionar um teste E2E, perguntar-se se um teste unitário ou de integração, mais rápido e mais estável, não cobriria já o mesmo risco.

## O que a pirâmide não diz

A pirâmide dá uma proporção a buscar, não um número absoluto nem uma ordem obrigatória de escrita. Ela também não diz que um nível substitui outro: um teste unitário que verifica se uma função calcula corretamente um total, e um teste E2E que verifica se esse total aparece corretamente na tela após um clique real, não testam a mesma coisa e são complementares. Os capítulos seguintes detalham cada nível, além da organização concreta de uma suíte de testes.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Três níveis de teste (unitário, integração, end-to-end) têm custos e velocidades muito diferentes. A pirâmide de testes recomenda muitos testes unitários rápidos, menos testes de integração, e poucos testes E2E lentos reservados aos fluxos críticos. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta concreta nesta etapa: os capítulos seguintes cobrirão as ferramentas próprias de cada nível. |
| **Ciladas a evitar** | O "cone de sorvete" invertido: maioria de testes E2E lentos e frágeis, poucos testes unitários. |
| **Boas práticas** | Antes de adicionar um teste E2E, verificar se um nível mais rápido não cobre já o mesmo risco. |
