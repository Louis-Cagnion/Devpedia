---
order: 7
---

# Ferramentas avançadas de fuzzing

[Testes e auditoria de segurança](/?c=cybersecurite&p=tests-et-audit-de-securite) apresentou o princípio do **fuzzing**: bombardear um programa com entradas inesperadas para provocar uma queda reveladora de uma falha. Este capítulo vai mais fundo, do lado das ferramentas de verdade: como um fuzzer moderno (AFL, libFuzzer) faz muito melhor do que simplesmente tentar entradas aleatórias.

## O fuzzing guiado por cobertura de código

Um fuzzer puramente aleatório gera entradas sem nenhum retorno sobre seu efeito: a maioria delas nunca testa mais do que os primeiríssimos caminhos do programa (ex: uma validação de formato que rejeita a entrada antes mesmo de chegar ao código interessante). Um fuzzer **guiado por cobertura** (*coverage-guided*) instrumenta o programa para saber, a cada execução, quais linhas de código foram atingidas, e então privilegia as mutações que exploram caminhos novos, nunca atingidos antes.

```text
1. O fuzzer mantem um conjunto de entradas "interessantes" (o corpus), minimo no inicio
2. Ele muta uma entrada do corpus (muda um byte, adiciona, remove...)
3. Ele executa o programa com essa entrada mutada, medindo a cobertura de codigo atingida
4. Se essa mutacao atinge codigo nunca coberto antes -> adicionada ao corpus, vira por sua
   vez uma base para futuras mutacoes
5. Se o programa quebra -> a entrada exata responsavel e salva para analise
```

Esse ciclo explica por que um fuzzer guiado por cobertura encontra, em poucas horas, caminhos que um fuzzer puramente aleatório jamais alcançaria em vários anos: cada descoberta útil se torna o ponto de partida da seguinte, em vez de recomeçar do zero a cada tentativa.

## Os sanitizers: detectar uma corrupção mesmo sem queda

Um [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) que sobrescreve apenas um byte vizinho sem derrubar o programa permanece invisível para um fuzzer que só monitora quedas. Um **sanitizer** (ex: *AddressSanitizer*, ASan) recompila o programa com verificações adicionais que detectam esse tipo de acesso de memória inválido no momento em que ocorre, mesmo que não causasse nenhuma queda visível de outra forma:

| Sem sanitizer | Com sanitizer |
|---|---|
| O estouro sobrescreve silenciosamente um dado vizinho, o programa continua normalmente | O estouro é detectado imediatamente, o programa para com um relatório preciso (arquivo, linha, tipo de erro) |

## Triagem: distinguir um bug real de um duplicado

Uma campanha de fuzzing pode gerar milhares de quedas em poucas horas, muitas das quais compartilham na verdade a mesma causa raiz. A **triagem** consiste em agrupar essas quedas por causa real (geralmente via a pilha de chamadas no momento da queda, ver [Como um programa é executado de verdade](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)), para tratar cada bug distinto apenas uma vez, em vez de milhares de ocorrências do mesmo problema.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um fuzzer guiado por cobertura privilegia as mutações que exploram código nunca atingido, muito mais eficiente que uma tentativa puramente aleatória. Um sanitizer detecta uma corrupção de memória mesmo sem queda visível. A triagem agrupa as quedas encontradas por causa real em vez de tratá-las uma a uma. |
| **Ferramentas utilizáveis** | AFL ou libFuzzer para fuzzing guiado por cobertura; AddressSanitizer para detectar uma corrupção silenciosa. |
| **Armadilhas a evitar** | Fazer fuzzing sem sanitizer ativado: a maioria das corrupções de memória não provoca nenhuma queda imediata e passa despercebida. |
| **Boas práticas** | Começar uma campanha de fuzzing com um corpus inicial relevante (entradas válidas reais) em vez de vazio, para atingir código útil mais rapidamente. |
