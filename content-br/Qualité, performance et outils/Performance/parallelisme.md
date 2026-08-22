---
order: 4
---

# Paralelismo: encontrar a restrição real

O paralelismo é a otimização mais mal utilizada, porque parece sempre aplicável: "tenho 8 núcleos, vamos lançar 8 workers". Na prática, um programa nunca vai mais rápido do que seu **recurso mais restrito**, e adicionar workers além desse limite degrada o desempenho em vez de melhorá-lo.

## Identificar o que limita

Antes de paralelizar, é preciso saber o que se está esperando:

| O programa espera… | Paralelismo útil? |
|---|---|
| O processador (cálculo, compressão, renderização) | Até o número de núcleos, não além |
| Um disco | Pouco: a cabeça de leitura ou a fila satura rápido |
| A rede / um serviço remoto | Sim, **se** os alvos forem independentes |
| Um lock, um banco de dados único | Não: o gargalo é compartilhado, só se acaba congestionando |

O caso "rede" é o mais favorável, porque o programa passa o tempo sem fazer nada enquanto espera respostas. Mas ele carrega uma condição decisiva: **a independência dos alvos**.

## Dois alvos independentes: o paralelismo é gratuito

Em um programa que consultava dois serviços distintos um após o outro, cada um impondo seu próprio limite de taxa, processá-lo em dois processos (um por serviço) divide o tempo total por dois **sem aumentar em uma única chamada** a carga vista por cada um. É um ganho sem contrapartida: simplesmente se deixa de ficar inativo diante do serviço A enquanto nada se faz com o serviço B.

## Vários workers em um mesmo alvo: o ganho é uma transferência

Por outro lado, lançar dois workers no **mesmo** serviço dobra o ritmo das requisições que ele recebe. O paralelismo não contorna um limite de taxa: ele o **concentra**. E se esse limite existe (cota, proteção antiabuso), não se ganha tempo, compra-se um risco de bloqueio.

Esse ponto é contraintuitivo: os workers partem do mesmo lugar: mesma máquina, frequentemente mesmo endereço IP público. Do ponto de vista do serviço remoto, isso não é "vários clientes", é **um cliente duas vezes mais insistente**.

## Por que isso se torna contraproducente

Além da restrição, cada worker adicional degrada os outros:

- **Memória e processador**: vários navegadores ou interpretadores disputam a máquina. As páginas renderizam mais devagar, então cada worker se torna individualmente mais lento.
- **Efeito perverso com esperas adaptativas**: se as esperas são calibradas pelo tempo de resposta real (veja [Esperar sem perder tempo](/?c=performance&p=attentes-et-temps-morts)), tornar a renderização mais lenta **alonga mecanicamente** cada espera. O ganho por worker desmorona enquanto a carga continua aumentando.
- **Custo fixo de inicialização**: lançar um processo, um interpretador, um navegador custa alguns segundos. Em um volume pequeno de trabalho, esse custo anula o benefício: foi exatamente isso que observei: em 4 unidades de trabalho, a versão paralela era *mais lenta* que a sequencial; o ganho só aparecia a partir de várias dezenas.

Daí uma progressão típica:

| Workers | Tempo | Carga por alvo | Veredito |
|---|---|---|---|
| 1 | 33 min | 1× | referência |
| 2 (1 por alvo) | 17 min | 1× | ganho gratuito |
| 4 (2 por alvo) | 8 min | **2×** | risco comprado |
| 6 (3 por alvo) | ~7 min | **3×** | contraproducente |

A passagem de 4 para 6 ilustra o ponto: o tempo quase não baixa mais mas a carga continua crescendo linearmente: sintoma de **contenção** (vários workers disputando o mesmo recurso limitado, aqui a própria máquina: processador, memória), que anula o benefício esperado do paralelismo.

## Restrições práticas a antecipar

O paralelismo faz surgir problemas que não existiam em sequencial:

- **Recursos exclusivos**: algumas ferramentas travam seus arquivos de trabalho (um perfil de navegador, por exemplo). Cada worker precisa do seu próprio.
- **Escrita concorrente**: dois processos que escrevem no mesmo arquivo de saída o entrelaçam e o corrompem. Fazer cada worker escrever em seu próprio arquivo, e depois mesclar, é mais simples e mais robusto do que um lock compartilhado.
- **Erros silenciosos**: um worker que falha não faz o programa principal falhar. É preciso verificar explicitamente os códigos de retorno **e** que o resultado mesclado está completo. Sem essa verificação, um relatório vazio parece um sucesso.

```python
falhas = [nome for nome, proc in workers if proc.wait() != 0]
resultados = mesclar(workers)

if not resultados:
    raise SystemExit("Nenhum resultado recuperado: nada foi produzido.")
if len(resultados) < esperado:
    avisar(f"{len(resultados)} resultados de {esperado} esperados")
```

## `spawn` vs `fork`: duas formas de iniciar um worker Python

Em Python, `multiprocessing.Pool` pode iniciar cada worker de duas formas diferentes, com consequências práticas reais:

| | `fork` | `spawn` |
|---|---|---|
| Princípio | O worker copia a memória do pai tal como ela já está (*copy-on-write*) | O worker reinicia um interpretador novo, que reimporta o código e herda o ambiente do pai **no momento da criação do pool** |
| Plataformas | Linux (comportamento histórico padrão) | Windows, macOS (desde o Python 3.8), e cada vez mais o padrão no Linux também |
| Um objeto já carregado no pai (um modelo, por exemplo) | Imediatamente disponível no filho, sem recarregamento | Precisa ser recarregado em cada worker, um custo de inicialização real |

> **Cuidado:** sob `fork`, um estado do pai inconsistente (um lock retido, um buffer parcialmente escrito no momento do fork) acaba congelado tal como está no filho, uma fonte de travamentos difíceis de diagnosticar, já que nada sinaliza a inconsistência no momento do próprio fork. É por isso que o Python vem migrando progressivamente para `spawn` como padrão, mesmo no Linux, em determinados contextos.
>
> **Boa prática:** sob `spawn`, uma variável de ambiente definida logo antes da criação do pool é corretamente herdada por cada worker (o ambiente do pai é capturado nesse instante preciso); sob `fork`, aproveitar o fato de que um objeto já carregado no pai (um modelo de IA, por exemplo) fica imediatamente disponível no filho em vez de recarregá-lo desnecessariamente em cada worker.

## Uma alternativa frequentemente melhor: espalhar no tempo

Quando a restrição é uma cota, a solução nem sempre é ir mais rápido. Dividir o trabalho em lotes distribuídos ao longo do dia expõe muito menos do que um grande processamento de uma vez só, para um resultado idêntico, e não exige nenhuma paralelização. Se a latência não importa (um processamento noturno, um relatório periódico), é a escolha mais segura.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um programa nunca vai mais rápido do que seu recurso mais restrito. Paralelizar em alvos independentes é um ganho gratuito; paralelizar em um mesmo alvo concentra a carga em vez de distribuí-la. Em Python, `fork` copia a memória do pai tal como está, `spawn` reinicia um interpretador novo. |
| **Ferramentas utilizáveis** | Um worker por alvo independente, verificação explícita dos códigos de retorno e do volume de resultados obtido. A escolha `fork`/`spawn` do `multiprocessing.Pool` conforme a necessidade de compartilhar um estado já carregado. |
| **Armadilhas a evitar** | Adicionar workers além da restrição real (degrada o desempenho); supor que um worker que falha silenciosamente fará o programa principal falhar; sob `fork`, um estado do pai inconsistente no momento do fork fica congelado tal como está no filho. |
| **Boas práticas** | Identificar o recurso limitante antes de paralelizar; espalhar o trabalho no tempo em vez de paralelizar quando a restrição é uma cota e a latência importa pouco; sob `fork`, aproveitar um objeto já carregado no pai em vez de recarregá-lo em cada worker. |
