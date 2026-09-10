---
order: 7
---

# Dividir um projeto em um grafo de dependências

Depois que um [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) é preenchido com tarefas, uma pergunta continua em aberto antes mesmo de [estimá-las](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation): em que ordem fazê-las? Uma tarefa nem sempre pode começar a qualquer momento: às vezes ela depende do resultado de outra.

## O grafo de dependências (DAG)

Um **grafo acíclico dirigido** (*DAG*, *Directed Acyclic Graph*) modela essas dependências: cada tarefa é um nó, e uma seta liga uma tarefa àquela que precisa estar terminada antes que ela possa começar. É exatamente a estrutura que uma ferramenta como o `make` constrói a partir de um Makefile, para saber quais arquivos compilar antes de quais outros, e quais podem ser compilados em paralelo.

Ordenar esse grafo para deduzir dele uma ordem de execução válida chama-se **ordenação topológica** (*topological sort*): uma ordem em que cada tarefa aparece depois de todas aquelas de que ela depende.

## Nem todas as tarefas estão em uma única linha

O erro mais frequente ao construir esse grafo manualmente é imaginar uma única lista linear ("primeiro A, depois B, depois C...") quando, na realidade, algumas tarefas não têm dependência nenhuma entre si.

```text
Modelo em uma única linha (geralmente errado):
A -> B -> C -> D

Modelo em grafo (geralmente mais próximo da realidade):
A -> C -> D
B -> C
(A e B são independentes, executáveis em paralelo;
 elas convergem apenas no nível de C)
```

Duas tarefas sem dependência uma em relação à outra podem ser conduzidas em qualquer ordem, ou até em paralelo se várias pessoas estiverem trabalhando nelas: considerá-las erroneamente como sequenciais infla artificialmente a duração percebida do projeto e esconde o trabalho realmente paralelizável.

Para identificar essas ramificações, a pergunta a se fazer para cada tarefa é: *"o que já precisa existir ou estar terminado antes que eu sequer possa começar esta aqui?"*, em vez de *"o que eu prefiro fazer antes?"* (uma questão de preferência, não de dependência real).

> **Cilada:** confundir uma dependência real (a tarefa B precisa do resultado produzido por A para funcionar) com uma simples ordem de preferência (fazer A antes de B "porque parece mais lógico"). Só a primeira justifica bloquear B enquanto A não estiver terminada.
>
> **Boa prática:** identificar explicitamente os pontos de convergência, as tarefas que precisam do resultado de várias ramificações independentes ao mesmo tempo. São elas que indicam onde ramificações conduzidas em paralelo devem se reencontrar.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um grafo acíclico dirigido (DAG) modela as dependências reais entre tarefas; uma ordenação topológica deduz dele uma ordem de execução válida. Várias tarefas independentes formam ramificações paralelas que só convergem em uma tarefa comum mais tarde. |
| **Ferramentas utilizáveis** | O DAG e a ordenação topológica, a mesma estrutura que o `make` usa para ordenar uma compilação. |
| **Ciladas a evitar** | Modelar todo o projeto como uma única linha sequencial quando algumas tarefas são independentes. Confundir uma dependência real com uma simples ordem de preferência. |
| **Boas práticas** | Perguntar-se, para cada tarefa, o que realmente precisa estar terminado antes de poder começar. Identificar explicitamente os pontos de convergência entre ramificações paralelas. |
