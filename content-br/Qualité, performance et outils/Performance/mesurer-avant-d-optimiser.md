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

### Armadilha: tempo atribuído à função errada

Com a otimização (`-O2`), o compilador pode **integrar** uma função na que a chama (*inlining*: ele copia o corpo dela no lugar da chamada) ou criar uma **cópia especializada** dela com outro nome. O `gprof` atribui então o tempo dela a outra função. Programa de teste:

```c
#include <stdio.h>

#ifdef SEM_INTEGRACAO
# define INTEGRAVEL __attribute__((noinline))        /* proíbe a integração */
#else
# define INTEGRAVEL
#endif

static INTEGRAVEL double soma_lenta(long n)
{
    double s = 0;

    for (long i = 1; i <= n; i++)
        s += 1.0 / (double)i;                        /* o trabalho real está aqui */
    return s;
}

int main(void)
{
    double total = 0;

    for (int k = 0; k < 20; k++)
        total += soma_lenta(20000000);               /* 20 chamadas à função lenta */
    printf("%.3f\n", total);
    return 0;
}
```

| Compilação (`cc -O2 -pg`) | O que o `gprof -b -p` mostra | O que realmente aconteceu |
|---|---|---|
| Do jeito que está | 100% do tempo em `main` | `soma_lenta` foi integrada em `main`: ela não existe mais como função |
| Com `-DSEM_INTEGRACAO` | 100% em `frame_dummy`, uma única chamada | O GCC criou uma cópia `soma_lenta.constprop.0` (com o argumento constante copiado dentro), que o `gprof` não mostra: ele credita a função colocada logo antes na memória, uma rotina de inicialização do programa. E a chamada, sem efeito colateral, só é feita uma vez em vez de 20 |

`nm -n programa` (os símbolos do programa ordenados por endereço) mostra o verdadeiro culpado, logo depois:

```
0000000000001240 t frame_dummy
0000000000001250 t soma_lenta.constprop.0
```

O grafo de chamadas (`gprof -q`) não corrige nada: ele reutiliza os mesmos nomes. O `valgrind --tool=callgrind` nomeia corretamente a cópia (99,7% das instruções em `soma_lenta.constprop.0`). Vivido em um solucionador SAT: o `gprof` atribuía 11% do tempo a `now()`, uma pequena função que lê o relógio, quando na verdade ele pertencia a `cancel_until`.

## Onde o programa erra o cache: `cachegrind`

Um profiler diz **onde** o tempo vai, não **por quê**. Quando a memória é a causa (veja [A hierarquia de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#a-hierarquia-de-cache)), o [`cachegrind`](https://valgrind.org/docs/manual/cg-manual.html), uma ferramenta do Valgrind, executa o programa em um processador **simulado** e conta, por função e por linha, as leituras de dados e as **falhas de cache** (*cache misses*: um dado ausente do cache, que é preciso buscar mais longe).

Programa de teste: a mesma tabela percorrida em duas ordens diferentes.

```c
#include <stdio.h>
#include <stdlib.h>
#define N 4096                                   /* tabela de 4096 x 4096 inteiros: 64 MB */

/* noinline: mantém duas funções distintas no perfil (veja a armadilha acima) */
__attribute__((noinline)) static long soma_linhas(const int *t)
{
    long s = 0;

    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            s += t[i * N + j];                   /* células vizinhas na memória */
    return s;
}

__attribute__((noinline)) static long soma_colunas(const int *t)
{
    long s = 0;

    for (int j = 0; j < N; j++)
        for (int i = 0; i < N; i++)
            s += t[i * N + j];                   /* salto de N inteiros a cada acesso */
    return s;
}

int main(void)
{
    int *t = malloc(sizeof(int) * N * N);

    for (long k = 0; k < (long)N * N; k++)
        t[k] = 1;
    printf("%ld %ld\n", soma_linhas(t), soma_colunas(t));
    free(t);
    return 0;
}
```

```bash
gcc -O2 -g percurso.c -o percurso                      # -g: números de linha no relatório
valgrind --tool=cachegrind --cache-sim=yes ./percurso  # escreve cachegrind.out.<número>
cg_annotate cachegrind.out.<número>                    # relatório por função, depois por linha
```

| Função | Leituras (`Dr`) | Falhas do cache L1 (`D1mr`) | Falhas do último nível, a buscar na RAM (`DLmr`) | Tempo real, sem Valgrind |
|---|---|---|---|---|
| `soma_linhas` | 4,2 M | 1,0 M | 1,0 M | 3,8 ms |
| `soma_colunas` | 16,8 M | 16,8 M | 16,8 M | 105 ms |

`soma_linhas` lê 4 inteiros por instrução (o compilador agrupou as leituras) e só erra o cache uma vez por [linha de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#linhas-de-cache-a-memoria-contigua-e-gratis) de 64 bytes, ou seja, 16 inteiros. `soma_colunas` salta 16 KB a cada leitura: cada uma erra o cache, e a função é 28 vezes mais lenta para o mesmo cálculo.

| Armadilha | O que acontece | Solução |
|---|---|---|
| Esquecer `--cache-sim=yes` | Desde o Valgrind 3.21, a simulação do cache vem desativada por padrão: o relatório só conta as instruções (`Ir`), que não mostram a diferença (84 M para `soma_colunas` contra 46 M, para um tempo 28 vezes maior) | Sempre passar `--cache-sim=yes` |
| Fontes modificadas depois do perfil | O `cg_annotate` relê as fontes atuais: ele avisa (`Annotations may not be correct`), mas mostra mesmo assim as contagens, deslocadas de tantas linhas quantas foram adicionadas ou removidas | Refazer o perfil após qualquer modificação |
| Cache simulado para um único programa, sem a pré-busca do processador | O compartilhamento do cache L3 entre programas simultâneos não aparece; o processador real adivinha e carrega antecipadamente as leituras feitas em ordem, o que a simulação ignora: as falhas de `soma_linhas` custam ali bem menos do que o número delas faz pensar | Tratar as contagens como uma ordem de grandeza, confirmada por uma medição real |

Vivido no solucionador SAT: o `cachegrind` mostrou que 61% das falhas de cache na escrita vinham de uma única tabela (o nível e a razão de cada variável, reescritos a cada atribuição), uma pista que nenhum perfil por função dava. Mesmo assim, pré-carregar essa tabela com antecedência não ganhou nada (+0,4 % e +1,0 % em duas medições): o processador já absorve essas escritas falhas no seu buffer de escrita, e uma falha de cache só custa se fizer o processador esperar.

## Cronometrar uma parte de um laço: o contador de ciclos

`clock_gettime` ([Medir uma duração](/?c=langages&s=c&p=mesure-du-temps#medir-uma-duracao-clock-gettime-clock-monotonic)) cronometra bem uma operação inteira. Para saber a **parte** de algumas linhas executadas milhões de vezes, é preciso uma medição mais leve: o **contador de marca de tempo** do processador (*Time Stamp Counter*, TSC), que avança em frequência fixa e é lido em uma única instrução, `rdtsc`, disponível em C com o nome [`__rdtsc()`](https://gcc.gnu.org/onlinedocs/gcc/x86-Built-in-Functions.html).

```c
#include <stdio.h>
#include <stdlib.h>
#include <x86intrin.h>                           /* __rdtsc, _mm_lfence (só x86) */
#define N (1 << 24)                              /* 16 M inteiros: 64 MB, mais que o cache */

#ifdef BARREIRA
/* espera o fim das instruções anteriores antes de ler o contador */
# define CYCLES() (_mm_lfence(), __rdtsc())
#else
# define CYCLES() __rdtsc()
#endif

int main(int argc, char **argv)
{
    int vazio = argc > 1 && argv[1][0] == 'v';    /* ./porcao vazio: parte B sem trabalho */
    int *t = malloc(sizeof(int) * N);
    unsigned long long em_b = 0, x = 1;
    long s = 0;

    for (int k = 0; k < N; k++)
        t[k] = k;
    unsigned long long inicio = CYCLES();
    for (int k = 0; k < N; k++) {
        s += t[k];                               /* parte A: leitura em ordem */
        unsigned long long t0 = CYCLES();
        if (!vazio) {
            x = x * 6364136223846793005ULL + 1;  /* parte B: uma célula sorteada */
            s += t[x >> 40];
        }
        em_b += CYCLES() - t0;
    }
    unsigned long long total = CYCLES() - inicio;
    printf("soma %ld: parte de B %.0f %%, %.0f ciclos por passagem em B\n",
           s, 100.0 * em_b / total, (double)em_b / N);
    free(t);
    return 0;
}
```

```bash
gcc -O2 porcao.c -o porcao                    # leitura simples do contador
gcc -O2 -DBARREIRA porcao.c -o porcao_b       # uma barreira antes de cada leitura
./porcao ; ./porcao vazio ; ./porcao_b ; ./porcao_b vazio
```

| Leitura do contador | Parte B real | Parte B vazia |
|---|---|---|
| `__rdtsc()` sozinho | 22% do tempo, 26 ciclos por passagem | 50%, 25 ciclos |
| `_mm_lfence()` e depois `__rdtsc()` | 87%, 318 ciclos | 49%, 46 ciclos |

Sem barreira, a parte B parece não custar nada além de uma parte vazia. O processador executa de fato as instruções **fora de ordem**: ele lança as seguintes sem esperar o fim das anteriores, e o `rdtsc` lê o contador antes que a leitura na RAM da parte B termine. Esse custo é pago **depois** da medição, na parte A. `_mm_lfence()`, uma **barreira**, espera o fim das instruções anteriores: a parte B custa então 318 − 46 ≈ 270 ciclos, a ordem de grandeza de um acesso à RAM dada pela [hierarquia de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#a-hierarquia-de-cache).

| Armadilha | Solução |
|---|---|
| Ler o contador sem barreira: um trabalho lançado na parte medida é pago depois dela | `_mm_lfence()` antes de cada leitura do contador |
| A própria medição tem um custo (de 25 a 46 ciclos por passagem aqui): uma parte muito curta parece mais cara do que é | Medir também uma parte vazia, e subtrair o custo dela |
| O contador avança em frequência fixa, não no ritmo real do núcleo, que varia com a carga e a temperatura | Raciocinar em partes de um total medido do mesmo jeito, não em ciclos absolutos |
| `__rdtsc()` só existe nos processadores x86 (Intel, AMD) | `clock_gettime(CLOCK_MONOTONIC)` nos outros processadores |

Vivido no solucionador SAT: essa instrumentação situou um teste acrescentado à busca em cerca de 7% do tempo, ou seja, o ganho máximo que uma versão mais rápida desse teste podia trazer; a versão reescrita ganhou 6,2%.

## Comparar em contadores de trabalho, não só no tempo

Duas execuções idênticas de um mesmo programa podem diferir em **±15%** em um notebook (frequência do processador, temperatura). Um ganho de 5% medido no cronômetro fica então invisível no ruído. Quando o programa consegue contar o seu **trabalho** (nós explorados, conflitos, propagações), esses contadores são **determinísticos**: idênticos de uma execução para outra.

| O que se observa | O que significa |
|---|---|
| Contadores idênticos, tempo menor | A mudança acelera o mesmo trabalho: ganho de velocidade puro |
| Contadores menores | A mudança reduz o próprio trabalho (busca melhor) |
| Contadores diferentes, tempo dentro do ruído | Nada conclusivo: medir em mais instâncias |

## Verificar que duas versões fazem o mesmo trabalho, antes de cronometrá-las

Uma otimização **com trabalho idêntico** (reescrever código para que fique mais rápido, sem mudar nada do que ele calcula) se verifica **antes** de qualquer medição de tempo. Se as duas versões não fazem exatamente o mesmo trabalho, a diferença de tempo mistura velocidade e trabalho, e pode esconder um bug (veja [Medir também depois](#medir-tambem-depois)).

| Etapa | O que ela verifica |
|---|---|
| 1. Mesmos resultados e mesmos contadores, em muitas entradas variadas | A mudança não modifica o trabalho |
| 2. Só depois, a medição do tempo (em rodadas alternadas, seção seguinte) | O mesmo trabalho fica mais rápido |

Para automatizar a etapa 1, o programa escreve o que é determinístico (resultado, contadores) na saída padrão, e o que varia de uma execução para outra (o tempo) na [saída de erro](/?c=langages&s=bash&p=redirections-et-pipes#redirecionar-a-saida-de-erro). Um script compara então as duas versões entrada por entrada:

```bash
ok=0; total=0
for tamanho in 8 16 24 32 40; do
    for semente in 1 2 3; do                                 # semente: fixa o acaso
        ./antigo "$tamanho" "$semente" > a.txt 2> /dev/null  # resultado e contadores só
        ./novo "$tamanho" "$semente" > b.txt 2> /dev/null
        total=$((total + 1))
        if cmp -s a.txt b.txt; then                          # cmp -s: código 0 se idênticos
            ok=$((ok + 1))
        else
            echo "diferença: tamanho $tamanho, semente $semente"
        fi
    done
done
echo "$ok/$total idênticos"
```

[`cmp`](https://man7.org/linux/man-pages/man1/cmp.1.html) compara dois arquivos byte a byte; `-s` o deixa silencioso, só o [código de saída](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-saida-exit) conta. `$((...))` faz um [cálculo](/?c=langages&s=bash&p=variables#aritmetica) em Bash.

Vivido no solucionador SAT: cada otimização de velocidade passa primeiro por 49 verificações desse tipo (8 ajustes em um único processo em grades de 8 a 40 células de lado, mais o modo paralelo e um autoteste), e a medição do tempo só começa com 49 de 49.

## Medir em rodadas alternadas

Mesmo com trabalho idêntico, o tempo continua a ser medido, e a máquina **deriva** durante a medição: temperatura, frequência do processador, outro programa lançado nesse meio-tempo. Medir todas as execuções de A e depois todas as de B atribui essa deriva à diferença entre A e B (veja também [A armadilha da medição única](#a-armadilha-da-medicao-unica)).

| Ordem das medições | Se a máquina desacelera no caminho |
|---|---|
| A, A, A, depois B, B, B | B parece mais lento que A, sem ter culpa nenhuma |
| A, B, depois A, B (rodadas alternadas) | A deriva afeta A e B por igual, e a diferença entre duas rodadas de uma mesma versão mostra o ruído |

Exemplo real no solucionador SAT: 3 grades, tempo médio por grade, uma versão de referência e três variantes cujos contadores já tinham sido verificados idênticos (seção anterior), máquina em repouso (nenhuma compilação nem outro cálculo durante a medição).

| Versão | Rodada 1 | Rodada 2 | Diferença para a referência da mesma rodada |
|---|---|---|---|
| Referência | 33,8 s | 32,6 s | (base de comparação) |
| Variante a | 33,0 s | 31,4 s | −2,4% e depois −3,9% |
| Variante b2 | 33,5 s | 32,1 s | −1,1% e depois −1,6% |
| Variante b1 | 33,0 s | 32,7 s | −2,6% e depois +0,2% |

| Constatação | Conclusão |
|---|---|
| A referência ganha 3,6% entre suas duas rodadas, sem nenhuma mudança | Comparar a variante a da rodada 2 com a referência da rodada 1 daria −7,3%, o dobro do ganho real |
| a e b2 ganham nas duas rodadas | Ganhos mantidos |
| b1 muda de sinal de uma rodada para outra | Nada conclusivo: a diferença está dentro do ruído |

Para concluir a partir de várias grades e não de uma só (pareamento, teste do sinal, comparações múltiplas), veja [Comparar dois ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages).

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
| **Para lembrar** | Nunca otimizar sem ter medido: a intuição sobre "o que é lento" geralmente mira no código que parece complicado, não no que realmente custa caro. Duas versões se comparam primeiro pelos resultados e contadores, e só depois pelo tempo, em rodadas alternadas. |
| **Ferramentas utilizáveis** | Um profiler clássico (por função: `gprof`, `perf`, `valgrind --tool=callgrind`), uma instrumentação manual por fase quando o programa passa o tempo esperando; contadores de trabalho determinísticos para comparar duas versões; `cachegrind` (`--cache-sim=yes`) para as falhas de cache; `__rdtsc()` precedido de `_mm_lfence()` para a parte de um trecho de laço; `cmp -s` para comparar duas saídas. |
| **Armadilhas a evitar** | Confiar em uma medição única: o ruído (rede, cache, carga da máquina) pode ultrapassar o efeito real de uma otimização; confiar em um nome de função inesperado em um perfil do `gprof` de um programa otimizado (verificar com `nm -n` ou callgrind); `cachegrind` sem `--cache-sim=yes`, ou em fontes modificadas desde o perfil; ler o contador de ciclos sem barreira; medir A e depois B em bloco numa máquina que deriva. |
| **Boas práticas** | Sempre remedir depois de uma otimização (tempo E exatidão do resultado); fazer várias medições para distinguir um ganho real do ruído; verificar que duas versões fazem o mesmo trabalho antes de cronometrá-las; medir em rodadas alternadas, com a máquina em repouso. |
