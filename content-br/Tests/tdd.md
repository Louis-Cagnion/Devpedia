---
order: 7
---

# O TDD (Test-Driven Development)

Até agora, cada tipo de teste foi apresentado como uma verificação escrita **depois** do código, para garantir que ele funciona. O **TDD** (*Test-Driven Development*, desenvolvimento guiado por testes) inverte essa ordem: o teste é escrito **antes** do código que ele verifica, e é esse teste que guia a escrita do código, não o contrário.

## O ciclo vermelho / verde / refactor

O TDD se organiza em um ciclo curto, repetido para cada pequeno pedaço de comportamento a adicionar:

| Etapa | Cor | O que acontece |
|---|---|---|
| **1. Escrever um teste que falha** | 🔴 Vermelho | O teste descreve um comportamento que ainda não existe; ele falha forçosamente, já que o código não existe |
| **2. Escrever o código mínimo que o faz passar** | 🟢 Verde | Só o suficiente de código para o teste passar, sem antecipar necessidades futuras |
| **3. Melhorar o código sem mudar seu comportamento** | 🔵 Refactor | Limpar, clarificar, eliminar duplicação; os testes já escritos garantem que o comportamento continua idêntico |

```text
Ciclo TDD para "calcularDesconto(preco, porcentagem)":

1. Vermelho : escrever test_calcularDesconto_aplica_10_porcento()
              -> falha, a função ainda não existe

2. Verde    : escrever calcularDesconto() com o estritamente
              necessário para fazer passar ESTE teste específico
              -> o teste passa

3. Refactor : limpar o código se necessário (renomear uma
              variável, simplificar um cálculo), reexecutando o
              teste a cada mudança para verificar que ele continua
              passando
```

Esse ciclo se repete então para o próximo comportamento a adicionar (por exemplo, tratar uma porcentagem igual a zero), mantendo cada iteração deliberadamente curta.

> **Cilada:** escrever, na etapa verde, mais código do que o estritamente necessário para fazer passar o teste em curso (antecipar um caso ainda não testado). O código não coberto por um teste nessa etapa continua sem verificação, apesar da aparência de rigor do TDD.
>
> **Boa prática:** na etapa verde, escrever o código mais simples possível que faça o teste passar, generalizando-o mais tarde apenas quando um novo teste realmente exigir isso.

## Por que escrever o teste primeiro muda algo

Escrever o teste antes do código obriga a responder uma pergunta precisa antes de codificar qualquer coisa: qual é o resultado esperado, exatamente, para esta entrada específica? Essa clarificação tem um efeito direto no design do código: uma função pensada para ser testada facilmente (entradas e saídas claras, poucas dependências ocultas) é também, em geral, uma função mais simples de entender e reutilizar.

> **Cilada:** achar que o TDD garante sozinho um código de boa qualidade, independentemente da reflexão de design. O TDD estrutura o ritmo de escrita, mas não substitui os [critérios de qualidade de código](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) habituais (responsabilidade única, baixo acoplamento).
>
> **Boa prática:** usar o TDD como uma ferramenta entre outras para chegar a um código testável e bem projetado, não como uma garantia automática que dispense pensar na arquitetura.

## O TDD não é obrigatório para ter testes

Escrever os testes depois do código (a ordem mais comum, e a seguida implicitamente nos capítulos anteriores desta seção) continua perfeitamente válida: o TDD é uma **disciplina de escrita**, não uma condição para que um teste tenha valor. Algumas situações se prestam melhor a isso do que outras: uma regra de negócio bem compreendida desde o início se presta bem ao TDD; um problema ainda difuso, onde a exploração precede a compreensão da necessidade, costuma se prestar melhor a escrever primeiro um rascunho de código, e os testes depois, uma vez estabilizado o comportamento.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O TDD escreve o teste antes do código, seguindo um ciclo curto vermelho (teste que falha) / verde (código mínimo que o faz passar) / refactor (limpeza sem mudar o comportamento). Ele estrutura o design mas não substitui os critérios de qualidade de código habituais. |
| **Ferramentas utilizáveis** | O ciclo vermelho/verde/refactor como ritmo de escrita. |
| **Ciladas a evitar** | Escrever mais código do que o necessário na etapa verde. Achar que o TDD garante sozinho um código bem projetado. |
| **Boas práticas** | Na etapa verde, escrever o código mais simples que faça o teste passar. Usar o TDD como uma ferramenta entre outras, não uma garantia automática de qualidade. |
