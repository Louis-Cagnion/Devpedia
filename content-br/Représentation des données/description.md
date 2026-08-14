# Descrição

Um programa nunca manipula números ou texto "em si": ele manipula sua **codificação** em memória, em um número finito de bits. Essa restrição física produz comportamentos que costumam ser atribuídos erroneamente à linguagem usada, quando na verdade são comuns a todas: `0.1 + 0.2` não vale exatamente `0.3` em JavaScript, mas também não em C, em Python ou em PHP.

Esta seção explica esses mecanismos de uma vez por todas, independentemente de qualquer linguagem. Os capítulos das linguagens remetem a ela para o "porquê", e se concentram no que lhes é específico: os tipos disponíveis, as funções de comparação, os valores especiais.

Você encontrará os diferentes conceitos abaixo:
