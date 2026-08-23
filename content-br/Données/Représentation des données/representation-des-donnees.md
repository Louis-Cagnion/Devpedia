---
order: 3
---

# Représentation des données

Um programa nunca manipula números ou texto "em si": ele manipula sua **codificação** em memória, em um número finito de bits. Essa restrição física produz comportamentos que costumam ser atribuídos erroneamente à linguagem usada, quando na verdade são comuns a todas: `0.1 + 0.2` não vale exatamente `0.3` em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), mas também não em [C](/?c=langages-de-programmation&s=c&p=c), em [Python](/?c=langages-de-programmation&s=python&p=python) ou em [PHP](/?c=langages-de-programmation&s=php&p=php).

Esta seção explica esses mecanismos de uma vez por todas, independentemente de qualquer linguagem. Os capítulos das linguagens remetem a ela para o "porquê", e se concentram no que lhes é específico: os tipos disponíveis, as funções de comparação, os valores especiais.

Você encontrará os diferentes conceitos abaixo:
