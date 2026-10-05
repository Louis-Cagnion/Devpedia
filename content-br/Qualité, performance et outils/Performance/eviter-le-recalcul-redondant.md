---
order: 7
---

# Evitar o recálculo redundante

Um princípio mais geral se esconde atrás de [esperar uma condição em vez de uma duração](/?c=performance&p=attentes-et-temps-morts): **nunca recalcular um resultado que nada pôde mudar desde seu último cálculo**. Onde o capítulo anterior tratava da espera (do tempo que passa), este trata do cálculo (do processador e da memória que trabalham): a mesma preguiça disciplinada, aplicada a outro tipo de custo.

## Memoizar o resultado de uma função

O caso mais direto: uma função custosa, chamada várias vezes com os mesmos argumentos, que refaz o mesmo trabalho a cada chamada.

```python
def nota_de_credito(cliente_id):
    # consulta pesada: agrega o histórico, calcula um score
    return calcular_score(recuperar_historico(cliente_id))

# chamada 3 vezes para o mesmo cliente no mesmo processamento
for pedido in pedidos_do_cliente:
    if nota_de_credito(cliente_id) < limite:
        recusar(pedido)
```

Nada muda `cliente_id` nem seu histórico entre essas três chamadas: a segunda e a terceira recalculam exatamente o que a primeira já produziu.

```python
_cache_notas = {}

def nota_de_credito(cliente_id):
    if cliente_id not in _cache_notas:
        _cache_notas[cliente_id] = calcular_score(recuperar_historico(cliente_id))
    return _cache_notas[cliente_id]
```

A **memoização** guarda em memória o resultado para uma entrada dada e o reutiliza enquanto nada pode invalidá-lo. A condição que garante sua correção não é "é mais rápido", é "a entrada não mudou": exatamente o mesmo invariante já tratado no capítulo anterior sobre o banner de cookies, aplicado aqui a um valor em vez de a um estado de exibição.

> Uma memoização sem invalidação é um bug em suspensão: se `cliente_id` pode ter seu histórico modificado durante o processamento (um pagamento que chega entre dois pedidos), o cache retorna uma resposta vencida. Memoizar é primeiro identificar o que tornaria o resultado obsoleto, antes de decidir mantê-lo.

## Recalcular apenas o que mudou

O mesmo princípio se aplica na escala de um processamento inteiro, não apenas de uma chamada de função. Se apenas uma parte dos dados mudou desde a última passagem, reprocessar tudo equivale a refazer todo o trabalho já validado só para modificar um fragmento.

```python
# a cada execução: reprocessa as 50.000 linhas do arquivo
for linha in todo_o_arquivo:
    resultados.append(processar(linha))
```

```python
# só reprocessa o que chegou desde a última passagem
ultimo_marcador = ler_marca_de_progresso()
novas_linhas = [l for l in todo_o_arquivo if l.timestamp > ultimo_marcador]

for linha in novas_linhas:
    resultados.append(processar(linha))

escrever_marca_de_progresso(novas_linhas[-1].timestamp if novas_linhas else ultimo_marcador)
```

O custo do processamento passa a ser proporcional ao que **mudou**, não ao tamanho total dos dados: um ganho que se acentua à medida que o volume já processado cresce em relação ao volume realmente novo.

## O exemplo do jogo 2D: redesenhar apenas o que se move

Um jogo 2D que gerencia ele mesmo sua memória de exibição (um array de pixels ou de tiles em memória, sem delegar a uma engine de renderização que já otimiza isso) ilustra bem o princípio na escala de uma imagem inteira.

```python
# a cada tick: redesenha toda a imagem, mesmo se só um personagem se moveu
def desenhar_frame(tela, cena):
    for x in range(tela.largura):
        for y in range(tela.altura):
            tela.definir_pixel(x, y, cena.cor_em(x, y))
```

Se um tick só move um personagem em alguns pixels, o resto do cenário é idêntico pixel a pixel ao frame anterior: recalculá-lo não muda nada no resultado, apenas no tempo gasto para obtê-lo.

```python
# só redesenha os retangulos marcados como "sujos" (modificados desde o último tick)
def desenhar_frame(tela, cena, zonas_modificadas):
    for zona in zonas_modificadas:
        for x, y in zona.pixels():
            tela.definir_pixel(x, y, cena.cor_em(x, y))
```

É a lógica do **dirty rectangle** (retângulo sujo): a própria cena sinaliza quais zonas mudaram desde a última renderização, e só essas são redesenhadas. Em um cenário 90% estático, isso reduz o custo de cada frame a uma fração do de uma renderização completa, para um resultado visualmente idêntico.

## Reparar o resultado anterior em vez de recalcular tudo

Um solucionador repete o mesmo teste centenas de milhares de vezes, sobre dados que mal mudam de um teste para o seguinte. Exemplo: a restrição "todas diferentes" é testada por um [emparelhamento bipartido](/?c=fondamentaux&s=algorithmes&p=couplage-biparti-et-theoreme-de-hall) após cada retirada de um valor possível. Refazer o emparelhamento do zero recomeça todo o trabalho embora uma única aresta tenha desaparecido.

A ideia é **guardar o emparelhamento anterior** e reparar apenas o que a mudança quebrou:

| A aresta retirada | O que se faz |
|---|---|
| Não estava no emparelhamento | Nada: o emparelhamento continua válido |
| Estava no emparelhamento | Uma única célula perde seu valor: uma única busca de caminho para recolocá-la |

```c
// Retira o valor v da célula c e depois repara o emparelhamento em vez de refazê-lo
int apos_retirada(int c, int v)
{
    dom[c][v] = 0;
    if (dono[v] == c) {          // a aresta retirada servia ao emparelhamento
        dono[v] = -1;
        valor_de[c] = -1;
        memset(vista, 0, sizeof vista);
        encontrar(c);            // uma única célula a recolocar
    }
    for (int k = 0; k < N; k++)  // uma célula sem valor: não há mais emparelhamento completo
        if (valor_de[k] < 0)
            return 0;
    return 1;
}
```

`valor_de[c]` memoriza o valor de cada célula (o `encontrar()` do capítulo sobre o emparelhamento o atualiza ao mesmo tempo que `dono`). Quando o valor retirado é recolocado, as células que ficaram sem valor tentam de novo: sem isso, o emparelhamento guardado ficaria pequeno demais para sempre.

Medido em 200 000 retiradas sucessivas, 40 células, 40 valores, cada célula aceitando 12 % dos valores:

| | Recalcular tudo | Reparar |
|---|---|---|
| Células examinadas pelas buscas | 61 566 318 | 832 601 (74 vezes menos) |
| Tempo | cerca de 1 s | algumas dezenas de ms |
| Respostas "emparelhamento completo?" | 198 112 sim | 198 112 sim, **idênticas teste a teste** (0 diferença) |

**Mesma resposta, não necessariamente o mesmo emparelhamento.** Existem vários emparelhamentos completos: o emparelhamento reparado difere do que um cálculo completo dá em 1 972 casos de 1 973 comparados. A resposta sim/não é a mesma; mas se o resto do programa depende do próprio emparelhamento (uma explicação, uma ordem, um resultado a reproduzir de forma idêntica de uma execução para outra), **volta-se ao cálculo completo** para produzir esse resultado canônico, e mantém-se a versão reparada para todos os testes que só precisam da resposta. No solucionador da pesquisa rush01, essa combinação reduziu o tempo total em 6,2 %.

> **Armadilha:** reparar um estado que não é mais válido. O invariante "o emparelhamento atual é válido para os dados atuais" deve ser restabelecido após **cada** tipo de mudança (retirada, recolocação, volta atrás de uma busca): um caso esquecido dá uma resposta errada, sem erro.
>
> **Boa prática:** manter o cálculo completo como referência em um teste e comparar as respostas teste a teste (aqui 0 diferença em 200 000) antes de medir o tempo.

## Percorrer apenas os elementos marcados: o bitmap

Quando só uma pequena parte dos elementos mudou e eles foram marcados (como os "retângulos sujos" acima), percorrer um array de indicadores de um byte por elemento custa uma leitura por elemento, marcado ou não. Um **bitmap** guarda um indicador por bit: uma palavra de 64 bits contém 64 (veja [o filtro por bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)), e `__builtin_ctzll` dá diretamente a posição do próximo bit em 1 ([funções embutidas](/?c=langages&s=c&p=operateurs-binaires)). Palavras vazias custam uma única leitura.

```c
for (uint32_t w = 0; w < N / 64; w++)
    for (uint64_t m = bitmap[w]; m; m &= m - 1)  // bits restantes da palavra
        processar(w * 64 + __builtin_ctzll(m));  // índice do bit em 1 mais baixo
```

`m &= m - 1` apaga o bit em 1 mais baixo: o laço para quando a palavra fica vazia, e `__builtin_ctzll` nunca é chamado com 0 (seu resultado seria indefinido).

Medido em 1 M de elementos, 200 percursos, mediana de 7 rodadas alternadas, mesmas somas verificadas (Intel Core Ultra 5 228V sob WSL, gcc 13.3 em `-O2`):

| Proporção de elementos marcados | Array de bytes | Bitmap | Diferença |
|---|---|---|---|
| 0,1 % | 84 ms | 2,9 ms | −97 % |
| 1 % | 63 ms | 16 ms | −74 % |
| 10 % | 67 ms | 44 ms | −35 % |
| 50 % | 68 ms | 130 ms | **+91 %** |

O ganho depende da **densidade** das marcas: com metade marcada, o bitmap é quase duas vezes mais lento, pois cada marca custa mais do que um byte lido em sequência. No solucionador da pesquisa rush01, esse percurso só ganhou 2 % do tempo total: só o programa real diz quanto vale a otimização (veja [Medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)).

> **Armadilha:** adotar o bitmap porque é mais compacto ou mais rápido no caso esparso, sem medir a densidade real das marcas do programa.
>
> **Boa prática:** medir a proporção de elementos marcados no programa real antes de escolher; o bitmap vale para marcas raras.

## Um exemplo tirado de um scraper: não confirmar o que já está provado

Um scraper de anúncios classificados comparava dois anúncios para saber se descreviam o mesmo veículo (duplicata) ou dois veículos diferentes. A verificação completa abria a página detalhada de cada anúncio para comparar cerca de dez características (quilometragem, opcionais, histórico de manutenção): uma chamada de rede e um tempo de renderização não desprezíveis.

```python
def sao_potencialmente_duplicados(anuncio_a, anuncio_b):
    # tudo já está disponível nos cartões da página de resultados
    return (
        anuncio_a.marca == anuncio_b.marca
        and anuncio_a.modelo == anuncio_b.modelo
        and abs(anuncio_a.preco - anuncio_b.preco) < 200
    )

def sao_duplicados(anuncio_a, anuncio_b):
    if not sao_potencialmente_duplicados(anuncio_a, anuncio_b):
        return False    # já decidido: marca ou modelo diferente, ou preco muito distante
    detalhe_a = abrir_pagina_anuncio(anuncio_a)
    detalhe_b = abrir_pagina_anuncio(anuncio_b)
    return comparar_especificacoes(detalhe_a, detalhe_b)
```

Assim que a comparação "leve" (os campos já presentes no cartão de resultados) estabelece que dois anúncios são diferentes, a questão **já está resolvida**: abrir as duas páginas detalhadas para confirmar isso só recalcularia, a preço alto, um resultado que o dado barato já produziu. A verificação custosa só roda no caso ambíguo, aquele em que o dado leve não basta para decidir.

> Não confundir com uma otimização da **latência de rede**. Aqui, o que se evita é um trabalho redundante do lado CPU/lógica (recalcular uma resposta já conhecida), não um atraso de E/S. As pausas voluntárias entre requisições (limite de taxa, cortesia com um servidor remoto) ou a espera de uma animação de interface não fazem parte desse princípio: continuam necessárias mesmo quando nenhum recálculo está em jogo, e removê-las expõe a um bloqueio, não a uma simples lentidão. É exatamente a distinção colocada no final de [Esperar sem perder tempo](/?c=performance&p=attentes-et-temps-morts): um atraso de proteção não é um desperdício a eliminar.

## Reaproveitar o resultado anterior: o cálculo incremental com resultado idêntico

[Recalcular apenas o que mudou](#recalcular-apenas-o-que-mudou) trata de **dados** que chegam em pequenos pedaços. O mesmo princípio vale para um **algoritmo** chamado milhões de vezes sobre uma entrada que mal mudou entre duas chamadas: em vez de recomeçar do zero, ele parte do **resultado anterior**.

Exemplo tirado do solucionador de Skyscraper. Seu teste de Hall procura, para uma linha quase preenchida, um [emparelhamento entre as casas livres e os valores que faltam](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#encontrar-um-emparelhamento-o-caminho-aumentante-algoritmo-de-kuhn). Entre dois testes da mesma linha, apenas alguns valores foram retirados: quase todos os pares do emparelhamento anterior ainda são válidos. A função abaixo os mantém e só lança uma busca de caminho aumentante para as casas que ficaram sem valor. Ela usa o arquivo `emparelhamento.h` do capítulo sobre [emparelhamentos](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin).

```c
#include <stdio.h>
#include <stdlib.h>
#include "emparelhamento.h"

static long buscas, valores_visitados;          /* contadores de trabalho */

/* Emparelha as casas partindo de detentor: os pares ainda válidos são mantidos,
   só as casas sem valor procuram um caminho aumentante. */
static int emparelhar_desde(int n, const uint64_t *dominio, int *detentor, uint64_t *falha)
{
    uint64_t mantidas = 0;                      /* casas cujo par é mantido */
    uint64_t vistas;

    for (int v = 0; v < 64; v++) {
        int i = detentor[v];

        if (i >= 0 && (dominio[i] >> v & 1) && !(mantidas >> i & 1))
            mantidas |= 1ull << i;              /* par ainda válido */
        else
            detentor[v] = -1;                   /* par vencido: o valor fica livre */
    }
    for (int i = 0; i < n; i++) {
        if (mantidas >> i & 1)
            continue;
        vistas = 0;
        buscas++;
        int ok = aumentar(i, dominio, detentor, &vistas);

        valores_visitados += __builtin_popcountll(vistas);
        if (!ok) {
            *falha = vistas;                    /* o conjunto de Hall desta falha */
            return i;
        }
    }
    return -1;
}

int main(void)
{
    enum { N = 32, EPISODES = 2000 };
    long passos = 0, divergencias = 0, trabalho[2][2] = {{0}};
    long conflitos = 0, outra_casa = 0, outro_conjunto = 0;

    srand(7);
    for (int ep = 0; ep < EPISODES; ep++) {
        uint64_t dom[N];
        int anterior[64], novo[64];
        uint64_t hall_a, hall_b, ignorado;

        for (int i = 0; i < N; i++) {           /* domínios aleatórios, 10 % dos valores */
            dom[i] = 1ull << i;                 /* o valor i é possível no início */
            for (int v = 0; v < N; v++)
                if (rand() % 100 < 10)
                    dom[i] |= 1ull << v;
        }
        for (int v = 0; v < 64; v++)
            anterior[v] = -1;
        emparelhar_desde(N, dom, anterior, &ignorado);  /* emparelhamento de partida */
        for (int passo = 0; passo < 1000; passo++) {  /* uma casa perde um valor por passo */
            int i = rand() % N, v = rand() % N;
            long r0, w0;
            int a, b;

            if (!(dom[i] >> v & 1) || (dom[i] & (dom[i] - 1)) == 0)
                continue;                       /* valor ausente, ou o último da casa */
            dom[i] &= ~(1ull << v);
            passos++;
            for (int k = 0; k < 64; k++)
                novo[k] = -1;                   /* A: cálculo completo, sem reaproveitar */
            r0 = buscas; w0 = valores_visitados;
            a = emparelhar_desde(N, dom, novo, &hall_a);
            trabalho[0][0] += buscas - r0; trabalho[0][1] += valores_visitados - w0;
            r0 = buscas; w0 = valores_visitados;
            b = emparelhar_desde(N, dom, anterior, &hall_b);  /* B: reaproveita o anterior */
            trabalho[1][0] += buscas - r0; trabalho[1][1] += valores_visitados - w0;
            if ((a < 0) != (b < 0))
                divergencias++;                 /* espera-se o mesmo veredito dos dois */
            if (b >= 0) {                       /* conflito: o episódio termina */
                conflitos++;
                outra_casa += a != b;           /* a casa que fica sem valor difere */
                outro_conjunto += hall_a != hall_b;
                break;
            }
        }
    }
    printf("%ld retiradas de valor, %ld divergências de veredito\n", passos, divergencias);
    printf("cálculo completo: %ld buscas, %ld valores visitados\n",
           trabalho[0][0], trabalho[0][1]);
    printf("emparelhamento reaproveitado: %ld buscas, %ld valores visitados\n",
           trabalho[1][0], trabalho[1][1]);
    printf("%ld conflitos: %ld com outra casa sem valor,\n", conflitos, outra_casa);
    printf("%ld com outro conjunto de valores alcançados\n", outro_conjunto);
    return divergencias != 0;
}
```

O programa retira valores um a um em domínios aleatórios e, a cada vez, refaz o cálculo de duas maneiras: **A** do zero, **B** reaproveitando o emparelhamento anterior.

```
49549 retiradas de valor, 0 divergências de veredito
cálculo completo: 1581056 buscas, 9423329 valores visitados
emparelhamento reaproveitado: 12710 buscas, 207078 valores visitados
2000 conflitos: 1725 com outra casa sem valor,
0 com outro conjunto de valores alcançados
```

| Contador (49.549 retiradas de valor) | Cálculo completo (A) | Emparelhamento reaproveitado (B) |
|---|---|---|
| Buscas de caminho aumentante lançadas | 1.581.056 | 12.710 |
| Valores visitados durante essas buscas | 9.423.329 | 207.078 |
| Divergências de veredito (existe ou não um emparelhamento) | 0 | 0 |

O reaproveitamento faz 124 vezes menos buscas, com exatamente as mesmas respostas. Três precauções o tornam seguro:

| Precaução | Por quê | No exemplo |
|---|---|---|
| O ponto de partida deve continuar válido | Um par vencido falsearia o resultado | Os pares cujo valor foi retirado são removidos antes de recomeçar |
| O veredito deve ser o mesmo a partir de qualquer ponto de partida | Senão a otimização muda a resposta | O algoritmo de Kuhn é exato a partir de qualquer emparelhamento válido: 0 divergências em 49.549 casos |
| O que depende do ponto de partida não deve vazar | Uma explicação ou uma saída que muda altera o resto do programa | Em um conflito, volta-se ao cálculo completo (veja abaixo) |

O último ponto aparece na última linha da saída. Dos 2.000 conflitos, **1.725** deixam outra casa sem valor conforme o ponto de partida, embora o conjunto de valores alcançados seja o mesmo nos 2.000. Ora, a [explicação do conflito](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#quando-nao-existe-nenhum-emparelhamento-o-conjunto-de-hall) é construída a partir dessa casa e dos detentores dos valores alcançados: ela depende, portanto, do emparelhamento de partida. O solucionador refaz então o cálculo completo original, **somente quando há conflito**: a explicação é a da versão sem reaproveitamento, a busca segue exatamente o mesmo caminho e os contadores (decisões, conflitos, propagações) permanecem idênticos nas 49 verificações do protocolo. Uma otimização com busca idêntica se mede com limpeza: só o tempo muda (veja [comparar em contadores de trabalho](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-em-contadores-de-trabalho-nao-so-no-tempo)).

> Um contador dividido por 124 não dá um programa 124 vezes mais rápido. O teste de Hall pesava **7,4 %** do tempo da busca (perfil por contador de ciclos, grade de 104 × 104: 4,7 % para construir o grafo, 2,5 % para o emparelhamento): o ganho máximo possível era, portanto, de cerca de 7 %. Medido: **6,2 %** (33,9 s contra 31,8 s com 96 × 96). Perfilar primeiro diz até onde vale a pena ir.

## Revisitar só o que está marcado: percorrer um bitmap

O [filtro por bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#filtro-por-bitmap) evita ler um elemento quando um bit indica que não há nada dentro. O mesmo bitmap serve também para **enumerar** apenas os elementos que têm algo, sem visitar os outros.

Exemplo tirado do mesmo solucionador: a cada limpeza das cláusulas aprendidas, é preciso retirar de cada lista de vigilância as cláusulas removidas. O solucionador tem 13,6 milhões de listas (uma por literal), quase todas vazias. Um bit por lista diz se ela pode conter algo. O programa abaixo compara uma varredura de todas as listas com uma varredura apenas dos bits em 1: `bits &= bits - 1` apaga o bit mais baixo da palavra, `__builtin_ctzll` dá a posição do bit a tratar (veja [percorrer os bits 1](/?c=langages&s=c&p=operateurs-binaires#percorrer-os-bits-1-as-funcoes-embutidas-do-compilador)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 13600000u                 /* número de listas, como os literais do solucionador */

typedef struct {
    int *d;                         /* as entradas da lista */
    int n, cap;
    char reserva[16];               /* espaço de uma segunda lista: 32 bytes por cabeçalho */
} lista;

static lista *listas;
static uint64_t *marca;             /* bit i: a lista i pode não estar vazia */
static long lidas;                  /* contador de trabalho: cabeçalhos de lista lidos */

/* Conta as entradas «mortas» (ímpares), que representam cláusulas removidas */
static long contar_tudo(void)
{
    long mortas = 0;

    for (unsigned i = 0; i < N; i++) {              /* todas as listas, inclusive as vazias */
        lidas++;
        for (int k = 0; k < listas[i].n; k++)
            mortas += listas[i].d[k] & 1;
    }
    return mortas;
}

static long contar_marcadas(void)
{
    long mortas = 0;

    for (unsigned palavra = 0; palavra < N / 64 + 1; palavra++)
        for (uint64_t bits = marca[palavra]; bits; bits &= bits - 1) {  /* bits em 1 */
            unsigned i = palavra * 64 + __builtin_ctzll(bits);

            lidas++;
            for (int k = 0; k < listas[i].n; k++)
                mortas += listas[i].d[k] & 1;
        }
    return mortas;
}

static double agora(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned por_mil = argc > 1 ? (unsigned)atoi(argv[1]) : 90;       /* listas não vazias */
    int *pool = malloc(sizeof(int) * N * 3);
    uint64_t estado = 88172645463325252ull;
    long esperado, encontrado = 0, tomadas = 0, esquecidas = 0, lidas_marcadas = 0;
    double melhor[2] = { 1e9, 1e9 };

    listas = calloc(N, sizeof(lista));
    marca = calloc(N / 64 + 1, sizeof(uint64_t));
    if (!pool || !listas || !marca)
        return 1;
    for (unsigned i = 0; i < N; i++) {
        estado ^= estado << 13;                     /* xorshift: um sorteio pseudoaleatório */
        estado ^= estado >> 7;
        estado ^= estado << 17;
        if (estado % 1000 < por_mil) {              /* lista não vazia, de 1 a 3 entradas */
            listas[i].n = 1 + (int)(estado / 1000 % 3);
            listas[i].d = pool + tomadas;
            for (int k = 0; k < listas[i].n; k++)
                pool[tomadas++] = (int)(estado >> (8 * k + 8));
            marca[i / 64] |= 1ull << (i % 64);      /* invariante: não vazia implica marcada */
        }
    }
    esperado = contar_tudo();
    for (int rodada = 0; rodada < 5; rodada++) {    /* 5 rodadas alternadas, conta a melhor */
        double t0 = agora();
        double duracao;

        encontrado = contar_tudo();
        duracao = agora() - t0;
        melhor[0] = duracao < melhor[0] ? duracao : melhor[0];
        t0 = agora();
        lidas = 0;
        encontrado = contar_marcadas();
        duracao = agora() - t0;
        melhor[1] = duracao < melhor[1] ? duracao : melhor[1];
        lidas_marcadas = lidas;
    }
    printf("%.1f %% de listas não vazias\n", por_mil / 10.0);
    printf("todas as listas:   %5.1f ms, %ld cabeçalhos lidos\n", melhor[0] * 1e3, (long)N);
    printf("listas marcadas:   %5.1f ms, %ld cabeçalhos lidos, mesmo resultado: %s\n",
           melhor[1] * 1e3, lidas_marcadas, encontrado == esperado ? "sim" : "NÃO");
    for (unsigned i = 0; i < N; i += 1000)          /* bug: esquece 1 marca em 1000 */
        if (listas[i].n && (marca[i / 64] >> (i % 64) & 1)) {
            marca[i / 64] &= ~(1ull << (i % 64));
            esquecidas++;
        }
    printf("com %ld marcas esquecidas: %ld entradas mortas em vez de %ld\n",
           esquecidas, contar_marcadas(), esperado);
    return 0;
}
```

```
1.0 % de listas não vazias
todas as listas:    14.1 ms, 13600000 cabeçalhos lidos
listas marcadas:     3.7 ms, 135940 cabeçalhos lidos, mesmo resultado: sim
com 129 marcas esquecidas: 135683 entradas mortas em vez de 135817
```

A mesma medição para várias proporções de listas não vazias (o melhor de 5 rodadas alternadas, máquina em repouso):

| Listas não vazias | Todas as listas | Listas marcadas | Razão |
|---|---|---|---|
| 0,1 % | 7,6 ms | 0,6 ms | ×13 |
| 1 % | 14,2 ms | 3,8 ms | ×3,7 |
| 9 % | 22,4 ms | 25,1 ms | ×0,9 |
| 30 % | 44,2 ms | 31,4 ms | ×1,4 |

O ganho não é garantido: depende da proporção de elementos que têm trabalho. Com 9 %, passar de uma lista marcada para a seguinte é um acesso aleatório em uma tabela de 435 MB, tão custoso quanto ler todas as listas de uma vez; uma leitura contínua é em parte favorecida pela pré-busca do processador (explicação provável, não isolada aqui). No solucionador, o bitmap é assim usado em dois lugares: a propagação pula as listas vazias (91 % das propagações encontram uma: 2,0 s contra 1,58 s com 48 × 48, mesmos contadores), e a purga só visita as listas marcadas (33,9 s contra 35,1 s com 96 × 96, 3,3 % a menos, busca idêntica).

> **Armadilha:** o bitmap é um **contrato**. Um bit em 0 deve garantir que o elemento está vazio; um bit em 1 não garante nada (ele volta a 0 mais tarde). Esquecer de marcar um elemento não produz nenhum erro: a última linha da saída mostra que 129 marcas esquecidas fazem faltar 134 das 135.817 entradas mortas, sem nenhuma mensagem. Convém verificar toda otimização desse tipo comparando com a varredura completa em casos pequenos.

## Escrita atômica: nunca uma leitura pela metade

Um cache memoizado em memória (seção anterior) desaparece quando o processo para; um **cache de arquivo** sobrevive a uma reinicialização, mas introduz um risco novo: um leitor concorrente pode abrir o arquivo de cache **enquanto ele ainda está sendo escrito**.

```python
# Risco: um leitor concorrente pode ler este arquivo pela metade
with open("cache.json", "w") as f:
    json.dump(resultado, f)   # se o processo for interrompido aqui, o arquivo fica corrompido
```

```python
# Escrita atômica: escrever em um arquivo temporário, depois renomea-lo
import os

caminho_tmp = "cache.json.tmp"
with open(caminho_tmp, "w") as f:
    json.dump(resultado, f)
os.replace(caminho_tmp, "cache.json")   # rename(): atômico no nível do sistema de arquivos
```

`os.replace()` (como `rename()` na maioria das linguagens) é **atômico** no nível do sistema de arquivos: a qualquer momento, `cache.json` aponta para a versão antiga completa ou para a nova versão completa, nunca para um estado intermediário. Nenhum leitor concorrente pode então jamais ver um arquivo pela metade, ao contrário de uma escrita direta interrompida no meio do caminho.

> **Armadilha:** escrever diretamente no arquivo de cache final, assumindo que uma interrupção (travamento, queda de energia) é rara o suficiente para ignorar. Um arquivo de cache corrompido pode então derrubar todos os leitores seguintes, muito depois do incidente inicial.
>
> **Boa prática:** sempre escrever em um arquivo temporário e depois renomeá-lo para o nome final, para qualquer arquivo lido por outro processo enquanto ele puder ser reescrito.

## Stale-while-revalidate: responder na hora, recalcular por trás

A memoização vista acima tem um defeito em grande escala: se o cache está vazio ou vencido, a requisição que dispara o recálculo **espera** por esse recálculo antes de responder. O padrão **stale-while-revalidate** (emprestado do cabeçalho HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)) muda essa regra: responder **imediatamente** com o valor em cache, mesmo vencido, e só recalcular em segundo plano.

```text
Cache classico (bloqueante):        Stale-while-revalidate:

requisicao -> cache vencido?        requisicao -> cache vencido?
              |  sim                               |  sim
              v                                    v
        recalcula (espera)                  responde com o valor vencido
              |                              E dispara um recalculo em segundo plano
              v                                    |
          responde                           (a proxima chamada recebe o
                                              valor atualizado)
```

```python
trava_recalculo = threading.Lock()

def valor_com_cache(chave):
    entrada = cache.get(chave)
    if entrada is None:
        # primeira chamada: não há escolha a não ser esperar
        return recalcular_e_guardar(chave)

    if entrada.esta_vencida() and trava_recalculo.acquire(blocking=False):
        threading.Thread(target=lambda: recalcular_e_guardar(chave, trava_recalculo)).start()

    return entrada.valor   # responde imediatamente, vencido ou não
```

A trava anti-concorrência (`trava_recalculo`) evita que um recálculo custoso seja disparado N vezes em paralelo enquanto já está em andamento para a mesma chave: só a primeira thread a adquiri-la dispara de fato o recálculo, as outras continuam servindo o valor vencido enquanto isso.

> **Armadilha:** aplicar stale-while-revalidate sem trava anti-concorrência, em uma chave sujeita a muitas requisições simultâneas: cada requisição que detecta o cache vencido dispara seu próprio recálculo custoso, o que pode anular todo o benefício (ou até agravar a carga em relação a um cache bloqueante clássico).
>
> **Boa prática:** nunca deixar um cache vencido fazer o usuário esperar por uma simples atualização; reservar a espera apenas para a primeira chamada, sem nenhum valor em cache.

## Streaming HTTP progressivo: quando o cálculo é inevitável

Todas as técnicas anteriores evitam um recálculo evitável. Esta se aplica ao caso contrário: um cálculo realmente **inevitável** (importar um arquivo grande, chamar um serviço externo lento) que nenhum cache pode encurtar. A única alavanca que resta é como o usuário percebe a espera.

Por padrão, um servidor PHP mantém na memória tudo o que um script produz com `echo`, e só envia ao navegador quando o script termina (ou seu buffer enche): o usuário vê uma página branca até o fim, mesmo que o script já tenha produzido um resultado útil há bastante tempo.

```php
<?php
ini_set('output_buffering', 'off');   // desativa o armazenamento em buffer da saída
ini_set('implicit_flush', true);      // força o envio imediato após cada echo
while (ob_get_level() > 0) {
    // também esvazia qualquer buffer já aberto pelo próprio PHP
    ob_end_flush();
}

foreach ($linhasAImportar as $linha) {
    importarLinha($linha);
    echo "Linha importada: {$linha->id}<br>\n";
    flush();                          // envia esse echo ao navegador imediatamente
}
```

Cada `echo` seguido de `flush()` vai para o navegador imediatamente, sem esperar o script terminar: o usuário vê uma console se enchendo em tempo real, como os logs de um terminal, em vez de uma página branca seguida de um resultado final de uma vez só.

> **Nota:** esse mecanismo é o inverso de [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm): lá, a conexão fecha imediatamente e o trabalho continua escondido por trás; aqui, a conexão fica aberta durante todo o cálculo, o que é justamente o que permite enviar cada pedaço do resultado conforme fica disponível.

> **Armadilha:** esse streaming quebra assim que um servidor intermediário (proxy, load balancer, Nginx em modo `fastcgi_buffering`) coloca seu próprio buffer de volta: verificar a configuração de toda a cadeia de rede, não só a do PHP.

## Recapitulando

| Situação | Sem o princípio | Com o princípio |
|---|---|---|
| Função pura chamada várias vezes com a mesma entrada | Recalcula a cada chamada | Memoiza o resultado, invalida se a entrada mudar |
| Processamento periódico sobre dados majoritariamente estáveis | Reprocessa tudo a cada passagem | Só reprocessa o que mudou desde a marca de progresso |
| Renderização de um frame de jogo | Redesenha toda a tela a cada tick | Só redesenha as zonas marcadas como modificadas |
| Comparação de dois registros | Abre sistematicamente o detalhe custoso | Para assim que um dado leve já decidiu |
| Cálculo repetido sobre uma entrada que muda pouco | Recomeça do zero a cada chamada | Reaproveita o resultado anterior, com retorno ao cálculo completo se o resultado deve continuar idêntico |
| Laço sobre milhões de elementos, quase nenhum com trabalho | Visita todos os elementos | Visita só os elementos marcados em um bitmap |

Nos quatro primeiros casos, o ganho não vem de um cálculo tornado mais rápido, mas de um cálculo **que não aconteceu** porque nada podia mudar seu resultado. Nos dois últimos, o cálculo acontece, mas só abrange o que mudou (o resultado anterior reaproveitado) ou o que está marcado (o bitmap).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Nunca recalcular um resultado que nada pôde mudar desde seu último cálculo: memoização, reprocessamento incremental, ou dirty rectangle aplicam todos a mesma ideia em escalas diferentes. Um cache de arquivo acrescenta duas técnicas: a escrita atômica (nunca uma leitura pela metade) e o stale-while-revalidate (responder rápido, recalcular por trás). Quando o cálculo é inevitável (nada para colocar em cache), o streaming HTTP progressivo é a única alavanca que resta para melhorar a espera percebida. Duas variantes para cálculos pesados: reaproveitar o resultado anterior (cálculo incremental, com retorno ao cálculo completo quando o resultado deve continuar idêntico) e percorrer só os elementos marcados em um bitmap. |
| **Ferramentas utilizáveis** | Um cache em memória por entrada (memoização), uma marca de progresso para só reprocessar o novo, uma comparação "leve" antes de uma verificação custosa, `rename()`/`os.replace()` para uma escrita atômica, uma trava anti-concorrência para um recálculo em segundo plano, `flush()`/`ob_end_flush()` para um streaming HTTP progressivo. Um contador de trabalho para verificar que duas versões dão os mesmos vereditos, `__builtin_ctzll` para percorrer os bits em 1. |
| **Armadilhas a evitar** | Memoizar sem identificar o que invalidaria o resultado: um cache nunca invalidado se torna uma fonte de dados vencidos. Escrever diretamente em um arquivo de cache lido por outros processos. Aplicar stale-while-revalidate sem trava anti-concorrência. Fazer streaming de uma resposta HTTP sem checar que nenhum proxy intermediário coloca seu próprio buffer de volta. Reaproveitar um ponto de partida vencido; deixar vazar o que depende do ponto de partida; esquecer uma marca em um bitmap (nenhum erro, resultados perdidos). |
| **Boas práticas** | Sempre definir a condição de invalidação antes de memoizar; distinguir um recálculo evitável (este princípio) de uma pausa voluntária de proteção (a manter); escrever um arquivo de cache por meio de um arquivo temporário renomeado; só fazer o usuário esperar na primeira chamada sem cache; fazer streaming da resposta HTTP assim que um cálculo longo e inevitável produzir resultados progressivamente. Perfilar antes: a parte da função no tempo total limita o ganho; verificar que uma versão incremental ou filtrada dá as mesmas respostas que o cálculo completo. |
