---
order: 1
---

# Os papéis em uma equipe de desenvolvimento

Um projeto na empresa raramente envolve um único tipo de pessoa: cada uma das perguntas "o que construir", "como construir" e "quando entregar" cabe a um papel diferente, e confundir esses papéis é uma fonte frequente de travamento.

## Quem faz o quê

| Papel | Responde à pergunta | Responsabilidade |
|---|---|---|
| **Product Owner (PO)** | O que construir? | Prioriza o backlog (a lista de necessidades a tratar), representa a necessidade de negócio ou do cliente |
| **Gerente de projeto / Project Manager** | Quando entregar? | Cronograma, orçamento, prazos, coordenação entre equipes |
| **Tech Lead** | Como construir? | Referência técnica, decide as escolhas de arquitetura |
| **Desenvolvedor** | - | Projeta e escreve o código |
| **QA / Testador** | Isso realmente funciona? | Verifica o comportamento antes da colocação em produção |
| **Scrum Master / Agile coach** | - | Facilita o processo, remove bloqueios, sem autoridade hierárquica sobre a equipe |

> **Analogia:** construir uma casa também separa quem decide o que a casa deve permitir fazer (o futuro morador, como o PO), quem planeja os prazos e o orçamento da obra (o gerente de projeto), e quem decide como a estrutura se sustenta (o arquiteto, como o Tech Lead). Confundir esses três papéis leva a decisões tomadas pela pessoa que não tem a informação para tomá-las.

## Quem decide em caso de desacordo

Cada papel tem a última palavra em seu próprio domínio: o PO prioriza o "o quê" (uma funcionalidade pode esperar), o Tech Lead decide o "como" (tal abordagem técnica em vez de outra), o gerente de projeto administra o "quando" (um prazo se negocia ou se desloca).

> **Armadilha:** deixar sem clareza "quem decide o quê" até que um desacordo estoure. Descobrir em plena discórdia que ninguém sabe quem tem a última palavra prolonga a resolução do próprio desacordo.
>
> **Boa prática:** esclarecer explicitamente, já na formação da equipe, quem decide sobre as questões de negócio, técnicas e de cronograma, em vez de deixar essa questão em aberto até o primeiro desacordo.

## O Scrum Master não é um chefe

> **Armadilha:** confundir o Scrum Master com um responsável que distribui tarefas ou avalia desempenho. Seu papel é facilitar o processo (conduzir os rituais, remover bloqueios), não comandar a equipe: em geral ele não tem nenhuma autoridade hierárquica sobre ela.
>
> **Boa prática:** procurar o Scrum Master para desbloquear um obstáculo de processo (uma reunião que não serve para nada, uma dependência parada), não para obter uma decisão que cabe ao PO ou ao Tech Lead.

## QA e desenvolvedor: verificações complementares, não redundantes

> **Armadilha:** um desenvolvedor que entrega sem nunca envolver o QA, pensando "compila e os testes unitários passam, então funciona". Os testes automatizados verificam o que foram escritos para verificar; o QA (ou testes mais amplos) também cobre cenários de uso reais que o desenvolvedor não pensou em testar por conta própria.
>
> **Boa prática:** tratar a validação automatizada e a validação de QA como duas redes complementares, não como duas versões da mesma rede.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Product Owner (o quê), gerente de projeto (quando), Tech Lead (como), desenvolvedor (constrói), QA (verifica), Scrum Master (facilita): papéis distintos que respondem a perguntas diferentes sobre um mesmo projeto. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: a clareza vem de definir explicitamente quem decide o quê. |
| **Armadilhas a evitar** | Deixar sem clareza quem decide o quê até o primeiro desacordo. Confundir o Scrum Master com um chefe. Pular a validação de QA confiando apenas nos testes automatizados. |
| **Boas práticas** | Esclarecer desde o início quem tem a última palavra sobre decisões de negócio, técnicas e de cronograma. Tratar testes automatizados e validação de QA como complementares. |
