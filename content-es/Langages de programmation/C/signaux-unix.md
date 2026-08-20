---
order: 19
---

# Las señales UNIX

Una **señal** es una notificación asíncrona enviada a un proceso: a diferencia de una llamada a función clásica, puede llegar en **cualquier momento** de la ejecución, interrumpiendo el código en curso para ejecutar un tratamiento dedicado antes de retomar donde el proceso se había quedado. El sistema operativo utiliza este mecanismo para avisar a un proceso de un evento (Ctrl-C pulsado en el teclado, un [proceso](/?c=langages-de-programmation&s=c&p=processus) hijo terminado), o para permitir que un proceso avise a otro.

## Las señales comunes

| Señal | Disparador habitual | Comportamiento por defecto |
|---|---|---|
| `SIGINT` | Ctrl-C en el teclado | Termina el proceso |
| `SIGTERM` | Solicitud de parada limpia (`kill <pid>`) | Termina el proceso |
| `SIGKILL` | `kill -9 <pid>` | Termina el proceso, **no puede interceptarse** |
| `SIGCHLD` | Un proceso hijo termina | Ignorada por defecto |
| `SIGUSR1` / `SIGUSR2` | Enviada manualmente por otro proceso (`kill -SIGUSR1 <pid>`) | Termina el proceso (pero prevista para ser redefinida) |

> **Nota:** `SIGKILL` (y `SIGSTOP`) son las dos únicas señales que un proceso nunca puede interceptar ni ignorar: garantizan que un proceso siga siendo siempre detenible desde el exterior, incluso si intenta bloquear todas las demás señales.

## Interceptar una señal con `signal()`

`signal()` reemplaza el comportamiento por defecto de una señal por una función (un **handler**), llamada automáticamente en cuanto llega la señal:

```c
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

volatile sig_atomic_t recu = 0;

void handler(int sig)
{
    recu = 1;   // el handler casi no hace nada: ver "handler minimo" mas abajo
}

int main(void)
{
    signal(SIGINT, handler);   // Ctrl-C ya no detiene el programa, llama a handler() en su lugar

    while (!recu) {
        pause();   // espera una senal sin consumir CPU
    }

    printf("Senal recibida, parada limpia.\n");
    return 0;
}
```

Sin `signal(SIGINT, handler)`, un Ctrl-C habría terminado el programa inmediatamente (comportamiento por defecto de `SIGINT`); con él, el programa intercepta la señal y decide por sí mismo qué hacer.

## Comunicarse entre procesos por señal (IPC)

`SIGUSR1`/`SIGUSR2` no tienen ningún sentido predefinido: un programa puede utilizarlas como mecanismo de comunicación entre procesos (*IPC*, *Inter-Process Communication*), estableciendo su propia convención. Ejemplo: transmitir un bit a la vez, `SIGUSR1` para `0`, `SIGUSR2` para `1`:

```c
// Lado emisor (conoce el PID del receptor)
kill(pid_recepteur, bit ? SIGUSR2 : SIGUSR1);

// Lado receptor: un handler por bit posible
void handler(int sig)
{
    bit_recu = (sig == SIGUSR2) ? 1 : 0;
    // acumular este bit en un byte en construccion...
}
```

Cada carácter transmitido requiere entonces 8 señales (una por bit), reconstruyendo el receptor el byte poco a poco. Es más lento que un [descriptor de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) clásico, pero funciona sin ningún canal de comunicación previo, solo se necesita el PID del destinatario.

## Escribir un handler seguro

Un handler se ejecuta interrumpiendo el código normal del programa, potencialmente **en pleno medio** de otra función (incluida una función de la biblioteca estándar): por lo tanto, no puede comportarse como una función ordinaria.

> **Trampa:** llamar a una función no **async-signal-safe** dentro de un handler, como `printf()`. Si la señal llega mientras el programa ya está en medio de una llamada a `printf()` (con el búfer interno en proceso de modificación), una segunda llamada a `printf()` desde el handler corrompe ese estado interno compartido, un bug que solo aparece rara vez y de forma no reproducible.
>
> **Buena práctica:** un handler debe seguir siendo mínimo: modificar una variable de tipo `sig_atomic_t` (el único tipo cuya lectura/escritura está garantizada como atómica frente a una interrupción) y nada más. El programa lee esa variable **fuera** del handler, en su bucle principal, para reaccionar a la señal de forma segura.

`volatile sig_atomic_t` combina dos garantías necesarias aquí: `sig_atomic_t` asegura que la variable se lee y se escribe en una sola operación indivisible (nunca a medio modificar); `volatile` impide que el compilador optimice su lectura suponiendo, erróneamente, que solo puede cambiar dentro del flujo normal del programa.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una señal interrumpe un proceso en cualquier momento para ejecutar un handler, a diferencia de una llamada a función clásica. `SIGUSR1`/`SIGUSR2` no tienen sentido predefinido y pueden servir como canal de comunicación entre procesos. |
| **Herramientas utilizables** | `signal()` para interceptar una señal, `kill()` para enviar una, `volatile sig_atomic_t` para comunicarse entre un handler y el resto del programa. |
| **Trampas a evitar** | Llamar a una función no async-signal-safe (como `printf()`) dentro de un handler. |
| **Buenas prácticas** | Mantener un handler mínimo (modificar una sola variable `sig_atomic_t`) y tratar la señal en el bucle principal del programa, nunca en el propio handler. |
