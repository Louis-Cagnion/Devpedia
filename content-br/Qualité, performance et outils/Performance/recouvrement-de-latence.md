---
order: 9
---

# Sobrepor a latência com um pool em rodízio

Quando um programa precisa processar muitos itens que envolvem cada um uma espera de rede (carregar uma página, chamar uma API, ler um arquivo remoto), o tempo total quase nunca depende do cálculo: depende do número de idas e vindas de rede e de seu encadeamento.

## O problema do processamento um a um

A versão mais simples processa cada item por completo antes de passar para o próximo:

```python
resultados = []
for item in items:
    pagina = buscar(item)          # espera de rede: ex. 800 ms
    resultados.append(extrair(pagina))
```

Se cada espera dura 800 ms e há 1000 itens, o programa roda por cerca de 13 minutos, mesmo que o cálculo em si (`extrair`) leve apenas alguns milissegundos. A CPU passa a maior parte do tempo sem fazer nada, esperando uma resposta.

## Disparar tudo de uma vez: rápido, mas perigoso

Ao contrário, iniciar as 1000 esperas ao mesmo tempo distribuiria todo o tempo de rede em uma única espera coletiva, ao custo de 1000 requisições simultâneas ao mesmo serviço. Muitos serviços web deliberadamente desaceleram ou bloqueiam um cliente que envia tantas requisições de uma vez, e um banco de dados ou servidor pode simplesmente entrar em colapso sob a carga.

## Um meio-termo: um pool limitado a N posições

A solução adotada na prática é um **pipeline**: manter sempre no máximo **N** esperas em andamento (N escolhido, por exemplo 5 ou 10), nunca mais, nunca menos enquanto restar trabalho. Concretamente, N posições numeradas de 0 a N-1 dividem o trabalho por rodízio:

```python
N = 5
posicoes = [None] * N
resultados = []

for i, item in enumerate(items):
    if posicoes[i % N] is not None:
        resultados.append(extrair(posicoes[i % N]))   # termina a rodada (i - N)
    posicoes[i % N] = buscar(item)                     # inicia a rodada i, sem esperar

for i in range(len(items) - N, len(items)):
    resultados.append(extrair(posicoes[i % N]))        # esvazia as ultimas N posições
```

Na rodada `i`, `buscar(item)` começa **antes** de `extrair(...)` da rodada `i - N` terminar de executar: o processamento de um item ocorre enquanto a espera de rede do próximo já avança. Nenhuma das duas rodadas espera pela outra, e nunca há mais de N esperas em andamento ao mesmo tempo.

| Abordagem | Esperas em andamento | Tempo total para 1000 itens a 800 ms |
|---|---|---|
| Um a um (sequencial) | 1 | ≈ 13 minutos |
| Tudo de uma vez | 1000 | O mais rápido em teoria, mas com forte risco de bloqueio pelo serviço remoto |
| Pool limitado a N=5 | 5 | ≈ 2,7 minutos, sem nunca ultrapassar 5 requisições simultâneas |

> **Boa prática:** escolher N de acordo com o que o serviço em questão tolera (documentação, uma cota conhecida, ou tentativa cautelosa), nunca ao acaso: um N grande demais reproduz o problema da versão "tudo de uma vez".

## O caso particular de 2 posições: o double buffering

Com N = 2, esse padrão tem um nome clássico: o **double buffering** (buffer duplo), usado por exemplo na renderização gráfica para preparar a próxima imagem enquanto a anterior ainda é exibida. O princípio continua rigorosamente o mesmo: duas posições que alternam entre "em preparação" e "em uso", para que nenhuma nunca bloqueie a outra.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Processar itens um a um desperdiça todo o tempo de espera de rede; disparar tudo de uma vez sobrecarrega o serviço remoto. Um pool limitado a N posições sobrepõe a espera da próxima rodada com o processamento da rodada atual, sem nunca ultrapassar N requisições simultâneas. |
| **Ferramentas utilizáveis** | Um array de N posições indexadas em rodízio (`i % N`), que inicia o trabalho da rodada `i` antes de recuperar o resultado da rodada `i - N`. |
| **Armadilhas a evitar** | Um N escolhido ao acaso, grande demais para o que o serviço remoto tolera. Esquecer de esvaziar as últimas N posições após o laço principal. |
| **Boas práticas** | Escolher N a partir de um limite conhecido ou documentado do serviço remoto. Reconhecer o caso N=2 como um double buffering, um padrão já difundido em outros lugares (renderização gráfica). |
