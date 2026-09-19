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

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `gettimeofday()` lê a hora atual (segundos + microssegundos desde o epoch Unix); `usleep()` pausa, mas sua duração real pode ultrapassar ligeiramente o valor pedido. |
| **Ferramentas utilizáveis** | Combinar `tv_sec`/`tv_usec` em um único valor em milissegundos para datar ou comparar instantes. |
| **Armadilhas a evitar** | Confiar em um único `usleep()` longo para uma cronometragem precisa: sua imprecisão se acumula. |
| **Boas práticas** | Iterar sobre pequenos `usleep()` reavaliando o tempo realmente decorrido em relação à duração desejada, para uma espera precisa apesar da imprecisão individual de cada `usleep()`. |
