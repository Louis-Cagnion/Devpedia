---
order: 3
---

# O ciclo de vida de um projeto

Um projeto sempre passa pelas mesmas grandes etapas, da ideia inicial até seu uso real, seja a equipe trabalhando em [cascata ou em agilidade](/?c=organisation-en-entreprise&p=methodologies-agile-scrum-kanban).

## As etapas

```text
Levantamento de necessidades -> Especificacao -> Desenvolvimento -> Testes -> Implantacao -> Manutencao
```

- **Levantamento de necessidades**: entender o que o cliente ou a área de negócio quer, frequentemente vago no início ("facilitar o acompanhamento de pedidos") antes de ser detalhado.
- **Especificação**: formalizar essa necessidade em tickets ou user stories utilizáveis (veja [Documentação e comunicação em equipe](/?c=organisation-en-entreprise&p=documentation-et-communication-equipe)).
- **Desenvolvimento**: escrever o código que atende à especificação.
- **Testes**: verificar se o comportamento obtido realmente corresponde à necessidade, não apenas se o código roda sem erro.
- **Implantação**: colocar a versão em produção, frequentemente automatizada por um [pipeline CI/CD](/?c=ci-cd&p=pipeline-cicd).
- **Manutenção**: corrigir os bugs descobertos em uso real, evoluir o produto; geralmente a fase mais longa do ciclo de vida completo.

## Cascata contra agilidade: uma vez, ou em loop

Em cascata, essas etapas acontecem uma única vez, em ordem, sobre o projeto inteiro. Em agilidade (Scrum ou Kanban), elas se repetem a cada incremento: cada sprint (ou cada tarefa, em Kanban) passa por sua própria mini-especificação, desenvolvimento, testes e implantação.

> **Armadilha:** subestimar a manutenção, tratando-a como um imprevisto depois que o projeto é "entregue". Um produto realmente utilizado gera bugs descobertos em uso real e pedidos de evolução continuamente: isso não é uma anomalia, é a continuação normal e esperada do ciclo de vida.
>
> **Boa prática:** orçar tempo de manutenção já no planejamento inicial (uma parte da capacidade da equipe reservada continuamente, por exemplo), em vez de descobri-la como surpresa depois da colocação em produção.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um projeto sempre passa por levantamento de necessidades, especificação, desenvolvimento, testes, implantação e manutenção, uma vez em cascata ou em loop a cada incremento em agilidade. |
| **Ferramentas utilizáveis** | Um pipeline CI/CD para automatizar a implantação; tickets/user stories para formalizar a especificação. |
| **Armadilhas a evitar** | Tratar a manutenção como um imprevisto depois da colocação em produção em vez de como uma fase normal do ciclo de vida. |
| **Boas práticas** | Orçar tempo de manutenção já no planejamento inicial. |
