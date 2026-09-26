---
order: 27
---

# Medir o tempo e esperar com precisão

Um programa que precisa datar um evento ou esperar uma duração precisa não pode se contentar com um simples contador de laço: a velocidade de execução depende do processador e de sua carga. Duas ferramentas padrão respondem a essa necessidade: `gettimeofday()` para ler a hora atual, `usleep()` para pausar.

## Ler a hora atual: `gettimeofday()`

```c
#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);

long milissegundos = tv.tv_sec * 1000 + tv.tv_usec / 1000;
```

`gettimeofday()` preenche uma estrutura `timeval` com dois campos: `tv_sec` (segundos decorridos desde uma referência fixa, o *epoch* Unix de 1º de janeiro de 1970) e `tv_usec` (microssegundos adicionais, entre 0 e 999999). Combinar os dois em um único valor em milissegundos (`tv_sec * 1000 + tv_usec / 1000`) simplifica depois qualquer comparação ou subtração entre dois instantes.

## Pausar: `usleep()` e sua imprecisão

`usleep(microssegundos)` pausa a thread ou processo atual, mas sua precisão real depende do escalonador do sistema: a pausa pode durar ligeiramente **mais** do que o pedido (nunca menos), já que o escalonador só garante um mínimo, não uma duração exata.

> **Cilada:** encadear vários `usleep()` sucessivos acreditando obter uma cronometragem precisa. Cada chamada individual pode ultrapassar ligeiramente, e esses pequenos excessos se acumulam a cada chamada repetida.
>
> **Boa prática:** para uma espera realmente precisa, comparar o tempo realmente decorrido (via `gettimeofday()`) com a duração desejada, dentro de um laço que chama `usleep()` de novo em pequenos incrementos até atingir a duração exata:

```c
void esperaPrecisa(long duracaoMs)
{
    long inicio = tempoAtualMs(); // gettimeofday(), veja acima

    while (tempoAtualMs() - inicio < duracaoMs) {
        usleep(1000); // reavalia a cada milissegundo em vez de um único usleep() longo
    }
}
```

Esse padrão de **espera ativa** (*busy-wait*) recalcula o tempo realmente decorrido a cada iteração em vez de confiar em um único `usleep()` da duração total: a leve imprecisão de cada `usleep(1000)` individual é corrigida pelo próprio laço, que só para quando o tempo desejado é realmente atingido.

## Medir uma duração: `clock_gettime(CLOCK_MONOTONIC)`

`gettimeofday()` lê a **hora do relógio de parede**, que pode saltar: ajuste manual, correção automática pela rede (NTP). Uma duração calculada atravessando um salto desses fica errada, até negativa. Para **medir uma duração**, usa-se um relógio **monotônico**: ele nunca volta atrás, mas o seu ponto de partida é arbitrário (muitas vezes a inicialização da máquina), então ele não dá a data.

| Relógio (`clock_gettime`) | Mede | Usar para |
|---|---|---|
| `CLOCK_REALTIME` | A hora real, como `gettimeofday()`; pode saltar | Datar um evento |
| `CLOCK_MONOTONIC` | O tempo decorrido, sem nunca voltar atrás | Cronometrar uma operação |
| `CLOCK_PROCESS_CPUTIME_ID` | O tempo de cálculo consumido pelo processo (sem as esperas) | Saber se um programa calcula ou espera |

```c
#include <stdio.h>
#include <time.h>
#include <unistd.h>

double segundos(clockid_t relogio)
{
    struct timespec t;
    clock_gettime(relogio, &t);                  // segundos + nanossegundos
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(void)
{
    double inicio = segundos(CLOCK_MONOTONIC);
    double cpu = segundos(CLOCK_PROCESS_CPUTIME_ID);
    usleep(200000);                              // espera 0,2 s sem calcular
    printf("decorrido: %.3f s\n", segundos(CLOCK_MONOTONIC) - inicio);        // 0.200 s
    printf("processador: %.3f s\n", segundos(CLOCK_PROCESS_CPUTIME_ID) - cpu); // 0.000 s
    return 0;
}
```

A diferença entre as duas medidas mostra que o programa esperou em vez de calcular: costuma ser a primeira pergunta a fazer diante de um programa lento.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `gettimeofday()` lê a hora atual (segundos + microssegundos desde o epoch Unix); `usleep()` pausa, mas sua duração real pode ultrapassar ligeiramente o valor pedido. |
| **Ferramentas utilizáveis** | Combinar `tv_sec`/`tv_usec` em um único valor em milissegundos para datar ou comparar instantes; `clock_gettime(CLOCK_MONOTONIC)` para cronometrar uma duração. |
| **Armadilhas a evitar** | Confiar em um único `usleep()` longo para uma cronometragem precisa: sua imprecisão se acumula. |
| **Boas práticas** | Iterar sobre pequenos `usleep()` reavaliando o tempo realmente decorrido em relação à duração desejada, para uma espera precisa apesar da imprecisão individual de cada `usleep()`. |
