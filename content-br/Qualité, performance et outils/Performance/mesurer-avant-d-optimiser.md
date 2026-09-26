---
order: 1
---

# Medir antes de otimizar

A regra mais rentável em desempenho também é a mais ignorada: **nunca otimizar sem ter medido**. A intuição sobre "o que é lento" é confiavelmente ruim, porque se olha para o código que parece complicado em vez do código que custa caro.

## O caso típico

Em um programa de automação de navegador lento demais, minhas hipóteses eram: os carregamentos de páginas, depois a paginação, depois a extração dos dados. Um profiling revelou o seguinte:

| Etapa | Tempo | Parte |
|---|---|---|
| Espera de um banner de cookies | 12,8s | **50 %** |
| Esperas fixas após paginação | ~7,5s | 30 % |
| Carregamentos de páginas + extração | ~5s | 20 % |

Metade do tempo estava indo em observar um banner **que nunca aparecia**: o consentimento já estava registrado no perfil do navegador. Nenhuma das minhas três hipóteses era a verdadeira culpada, e a culpada real nem estava na minha lista.

## Fazer profiling por fases, não linha por linha

Um profiler clássico ([`cProfile`](https://docs.python.org/3/library/profile.html) em [Python](/?c=langages-de-programmation&s=python&p=python), a aba Performance de um navegador) dá o tempo por função. Isso é útil para cálculo, bem menos quando o programa passa o tempo **esperando**: tudo aparece sob um punhado de funções de espera, sem dizer *por que* se está esperando.

Nesse caso, instrumentar você mesmo as fases lógicas é mais informativo. O princípio: envolver as funções-chave para acumular seu tempo, sem tocar no código medido.

```python
import time

timings = []

def cronometrar(modulo, nome):
    """Substitui módulo.nome por uma versão que registra seu tempo de execução."""
    original = getattr(modulo, nome)

    def envelope(*args, **kwargs):
        inicio = time.perf_counter()
        resultado = original(*args, **kwargs)
        timings.append((nome, time.perf_counter() - inicio))
        return resultado

    setattr(modulo, nome, envelope)

cronometrar(meu_modulo, "esperar_conteudo")
cronometrar(meu_modulo, "fechar_banner")
```

Agregando depois por nome, obtém-se o número de chamadas **e** o tempo acumulado de cada uma. O número de chamadas é frequentemente a informação decisiva: uma função de 0,3s chamada 40 vezes custa mais do que uma função de 2s chamada uma vez.

> Lembre-se de exibir também o tempo **não atribuído** (total medido menos a soma das fases). Se ele for alto, sua instrumentação está perdendo o essencial e suas conclusões vão errar.

## Medir também depois

Uma otimização não remedida é uma crença. Duas verificações merecem ser sistemáticas:

- **o tempo realmente caiu**: às vezes uma mudança "obviamente mais rápida" não muda nada, porque não estava no **caminho crítico** (a sequência de etapas dependentes que sozinha determina a duração total; acelerar uma etapa fora dessa sequência não encurta nada, já que o programa espera de qualquer forma o fim das etapas que, essas sim, fazem parte dela);
- **o resultado é idêntico**: é a verificação que se esquece, e é a mais importante. Uma otimização que quebra silenciosamente a saída é muito pior do que um programa lento.

No caso acima, comparar a saída byte a byte antes e depois de cada etapa permitiu detectar uma extração que havia se tornado incompleta: um bug que nenhum cronômetro teria revelado.

## A armadilha da medição única

Uma única medição não diz nada: a rede, o cache e a carga da máquina fazem os resultados variarem dezenas de porcento. Faça várias medições e veja se a diferença entre duas configurações ultrapassa sua variação natural. Senão, você está medindo ruído.

## Os profilers nativos no Linux: `gprof` e `perf`

Um **profiler** mostra em quais funções um programa passa o tempo. Duas ferramentas clássicas para um programa compilado (em C, por exemplo):

| Ferramenta | Como usar | Limite |
|---|---|---|
| `gprof` | Compilar com `-pg`, executar o programa (ele escreve `gmon.out`) e depois `gprof -b -p programa gmon.out` | Distorce com a otimização: as chamadas que o compilador move ou funde somem do perfil |
| `perf` | `perf record ./programa` e depois `perf report`, sem recompilar (ele amostra usando os contadores do processador) | Recusado a um usuário comum se `/proc/sys/kernel/perf_event_paranoid` valer 3 ou 4 (valor padrão do Ubuntu) |

Resultado do `gprof` em um programa que chama 200 vezes uma função `lenta` e 200 vezes uma função `rapida`, dez vezes mais curta (compilado sem otimização):

```
  %   cumulative   self              self     total
 time   seconds   seconds    calls  ms/call  ms/call  name
 88.89      0.56     0.56      200     2.80     2.80  lenta
 11.11      0.63     0.07      200     0.35     0.35  rapida
```

O mesmo programa compilado com `-O1` dá um perfil vazio ("no time accumulated") e uma única chamada a `lenta`: o compilador tirou a chamada do laço. Quando o `perf` está bloqueado, `valgrind --tool=callgrind` funciona sem permissões especiais (ver [Valgrind](/?c=langages&s=c&p=memoire)), ao custo de uma execução muito mais lenta (ele simula cada instrução).

## Comparar em contadores de trabalho, não só no tempo

Duas execuções idênticas de um mesmo programa podem diferir em **±15%** em um notebook (frequência do processador, temperatura). Um ganho de 5% medido no cronômetro fica então invisível no ruído. Quando o programa consegue contar o seu **trabalho** (nós explorados, conflitos, propagações), esses contadores são **determinísticos**: idênticos de uma execução para outra.

| O que se observa | O que significa |
|---|---|
| Contadores idênticos, tempo menor | A mudança acelera o mesmo trabalho: ganho de velocidade puro |
| Contadores menores | A mudança reduz o próprio trabalho (busca melhor) |
| Contadores diferentes, tempo dentro do ruído | Nada conclusivo: medir em mais instâncias |

## Mais threads, mais lento: os programas limitados pela memória

Um programa pode ser limitado pelo **cálculo** (*CPU-bound*) ou pelos **acessos à memória** (*memory-bound*, ver [O cache da CPU](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)). No segundo caso, as threads disputam a mesma largura de banda de memória: acrescentar mais pode **deixar tudo mais lento**. Medido em um solucionador de quebra-cabeça: 577 ms com uma thread, 893 ms com 8 threads (ver também [O paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

Outras duas lições do mesmo projeto:

| Constatação | Detalhe |
|---|---|
| Lançar várias buscas diferentes em paralelo e ficar com a primeira que termina (um **portfolio**) | Muito eficaz contra as instâncias catastróficas (ver [As caudas pesadas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#as-caudas-pesadas-algumas-instancias-catastroficas)), inútil se a memória já for o gargalo |
| Validar com instâncias de outra origem | Um ganho medido em uma única família de dados pode não se generalizar (ver [Quadrados latinos e sorteio uniforme](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme)) |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Nunca otimizar sem ter medido: a intuição sobre "o que é lento" geralmente mira no código que parece complicado, não no que realmente custa caro. |
| **Ferramentas utilizáveis** | Um profiler clássico (por função: `gprof`, `perf`, `valgrind --tool=callgrind`), uma instrumentação manual por fase quando o programa passa o tempo esperando; contadores de trabalho determinísticos para comparar duas versões. |
| **Armadilhas a evitar** | Confiar em uma medição única: o ruído (rede, cache, carga da máquina) pode ultrapassar o efeito real de uma otimização. |
| **Boas práticas** | Sempre remedir depois de uma otimização (tempo E exatidão do resultado); fazer várias medições para distinguir um ganho real do ruído. |
