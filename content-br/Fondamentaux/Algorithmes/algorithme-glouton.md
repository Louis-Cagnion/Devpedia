---
order: 4
---

# O algoritmo guloso (Greedy algorithm)

Um **algoritmo guloso** (*greedy algorithm*) resolve um problema passo a passo, escolhendo a cada passo a opção localmente melhor, sem nunca voltar atrás nem garantir um resultado globalmente ótimo.

## Exemplo: troco de moedas

Dar troco de 67 centavos com o menor número possível de moedas, dispondo de moedas de 50, 20, 10, 5, 2 e 1 centavo: a cada passo, toma-se a maior moeda que não ultrapasse o valor restante.

```text
Resta dar: 67
  -> 50 (resta 17)
  -> 10 (resta 7)
  -> 5  (resta 2)
  -> 2  (resta 0)
Resultado: 4 moedas (50 + 10 + 5 + 2)
```

Com esse sistema de moedas (1, 2, 5, 10, 20, 50), essa escolha gulosa sempre dá o número mínimo de moedas. Isso não é garantido com qualquer sistema: veja a armadilha abaixo.

## Uma escolha gulosa nem sempre é ótima

> **Armadilha:** achar que um algoritmo guloso sempre dá a melhor solução possível. Com moedas de 1, 3 e 4 centavos, dar troco de 6 centavos de forma gulosa usa uma moeda de 4 mais duas de 1 (3 moedas), enquanto duas moedas de 3 bastariam (2 moedas): a escolha localmente ótima no primeiro passo (pegar a maior moeda) leva aqui a um resultado globalmente pior.
>
> **Boa prática:** um algoritmo guloso deve ser provado correto (ou verificado empiricamente contra o sistema de moedas realmente usado) antes de ser adotado; em caso de dúvida, a **programação dinâmica** (que explora várias escolhas a cada passo e guarda a melhor depois, fora do escopo deste capítulo) garante um resultado ótimo onde o guloso não garante.

## Outros exemplos clássicos

| Problema | Escolha gulosa |
|---|---|
| Troco de moedas | Sempre pegar a maior moeda possível |
| Algoritmo de Dijkstra (caminho mais curto) | Sempre estender ao vértice não visitado mais próximo |
| Codificação de Huffman (compressão) | Sempre agrupar os dois símbolos menos frequentes |

Um algoritmo guloso costuma ser rápido e simples de implementar (uma única passada, sem retroceder); ao contrário de um algoritmo que explora várias possibilidades antes de escolher ([programação dinâmica](https://pt.wikipedia.org/wiki/Programa%C3%A7%C3%A3o_din%C3%A2mica), [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)), mais custoso mas que garante a otimalidade em casos onde o guloso falha.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um algoritmo guloso escolhe, a cada passo, a opção localmente melhor, sem voltar atrás nem garantir um resultado globalmente ótimo. |
| **Ferramentas utilizáveis** | Troco de moedas, Dijkstra, Huffman como exemplos clássicos de algoritmos gulosos. |
| **Armadilhas a evitar** | Supor que uma escolha gulosa sempre é ótima: depende inteiramente do problema (veja o contraexemplo com moedas de 1/3/4). |
| **Boas práticas** | Verificar (ou provar) que um algoritmo guloso é correto para o problema real antes de adotá-lo; caso contrário, preferir a programação dinâmica. |
