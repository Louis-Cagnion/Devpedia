---
order: 1
---

# Vocabulário de testes de software (QA, ISTQB)

Antes de escrever o menor teste, é preciso um vocabulário comum: sem ele, "testar o código" pode significar dez coisas diferentes dependendo de quem fala. Este capítulo estabelece os termos que o resto da seção vai reutilizar, com base nos padronizados pelo **ISTQB** (*International Software Testing Qualifications Board*), o órgão de referência que certifica testadores e harmoniza esse vocabulário na indústria. **QA** (*Quality Assurance*, garantia de qualidade) designa, de forma mais ampla, o conjunto de atividades voltadas a garantir a qualidade de um software, do qual os testes são apenas uma parte.

## Os blocos básicos de um teste

| Termo | Definição |
|---|---|
| **Caso de teste** (*test case*) | Uma situação precisa a verificar: uma entrada dada, uma ação, e o resultado esperado |
| **Plano de teste** (*test plan*) | O documento que descreve a estratégia geral de testes: o que testar, com quais meios, em qual ordem |
| **Dados de teste** (*test data*) | Os valores concretos usados para executar um caso de teste (ex. um email válido, um mal formatado) |
| **Resultado esperado** (*expected result*) | O que o programa deve produzir se tudo funcionar corretamente, definido antes da execução do teste |
| **Resultado obtido** (*actual result*) | O que o programa realmente produz na execução, comparado ao resultado esperado para julgar se o teste passa |

```text
Caso de teste: "Login com senha correta"
  Dados de teste: email="alice@exemplo.com", senha="boaSenha123"
  Ação: enviar o formulário de login
  Resultado esperado: redirecionamento para o painel
  Resultado obtido: (observado na execução, comparado ao esperado)
```

> **Cilada:** escrever um caso de teste sem um resultado esperado preciso ("verificar que funciona"). Sem uma referência clara, é impossível dizer objetivamente se o teste passou ou falhou.
>
> **Boa prática:** sempre formular o resultado esperado antes de executar o teste, nunca depois de ver o que o programa produziu.

## Passar ou falhar, e o que vem depois

Um caso de teste **passa** (*pass*) quando o resultado obtido corresponde ao resultado esperado, e **falha** (*fail*) caso contrário. Uma falha não significa automaticamente "bug no programa": o próprio teste pode estar mal escrito (resultado esperado errado, dados de teste inválidos).

| Termo | Definição |
|---|---|
| **Anomalia / bug** (*defect*) | Uma discrepância confirmada entre o comportamento do programa e seu comportamento pretendido, geralmente registrada em uma ferramenta de acompanhamento (um ticket) |
| **Não regressão** (*regression*) | O fato de uma modificação no código quebrar um comportamento que antes funcionava; um **teste de não regressão** é um teste executado novamente após cada mudança para detectar esse caso |
| **Critério de saída** (*exit criteria*) | A condição que define que uma fase de testes terminou (ex. "100% dos casos de teste críticos passam", "cobertura de código ≥ 80%") |

> **Cilada:** achar que um teste que falha é forçosamente um bug a corrigir no programa. O próprio teste pode estar errado (resultado esperado equivocado, dados de teste mal escolhidos).
>
> **Boa prática:** antes de corrigir o programa, verificar se o teste está falhando pelo motivo certo, relendo seu resultado esperado e seus dados de teste.

## Quem escreve e executa os testes

| Termo | Definição |
|---|---|
| **Teste manual** | Uma pessoa executa os passos do caso de teste manualmente e compara o resultado ela mesma |
| **Teste automatizado** | Um programa executa o caso de teste e compara automaticamente o resultado obtido com o esperado |
| **Testador** (*tester*) | A pessoa (ou equipe) responsável por projetar e executar os testes, distinta dos desenvolvedores nos projetos que têm esse papel dedicado |

Em muitas equipes atuais, os próprios desenvolvedores escrevem boa parte dos testes automatizados (em particular os testes unitários, vistos em um capítulo futuro); o papel de testador dedicado se concentra então nos testes que exigem um olhar externo ou uma visão de conjunto do produto.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O ISTQB padroniza o vocabulário dos testes de software; QA designa de forma mais ampla o conjunto de atividades de garantia de qualidade. Um caso de teste compara um resultado obtido com um resultado esperado definido previamente. Um teste que falha não é necessariamente um bug no programa. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta prática nesta etapa: este capítulo estabelece o vocabulário, os capítulos seguintes abordarão a pirâmide de testes e a arquitetura de testes. |
| **Ciladas a evitar** | Escrever um caso de teste sem um resultado esperado preciso. Corrigir o programa antes de verificar se o próprio teste está correto. |
| **Boas práticas** | Formular o resultado esperado antes de executar o teste. Verificar o teste antes de corrigir o programa em caso de falha. |
