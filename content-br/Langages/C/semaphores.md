---
order: 26
---

# Os semáforos POSIX

Um **semáforo** é um contador protegido, compartilhado entre threads ou entre processos, que limita o número de acessos simultâneos a um recurso. Diferente de um [mutex](/?c=langages-de-programmation&s=c&p=threads) (trava binária, limitada a um mesmo processo/mesmas threads), um semáforo conta de 0 a N e pode ser compartilhado entre processos distintos.

## `sem_wait()`/`sem_post()`: decrementar e incrementar

- `sem_wait()` decrementa o contador; se o contador já está em 0, ele **bloqueia** até que outra thread/processo o libere.
- `sem_post()` incrementa o contador, acordando potencialmente uma thread/processo em espera.

```c
#include <semaphore.h>

sem_t semaforo;

// contador inicial em 3 (0 = compartilhado entre threads do mesmo processo)
sem_init(&semaforo, 0, 3);

sem_wait(&semaforo); // decrementa; bloqueia se ja estiver em 0
// ... secao que nao deve ultrapassar 3 acessos simultaneos ...
sem_post(&semaforo); // incrementa, acorda uma eventual thread em espera
```

## Um semáforo nomeado, compartilhado entre processos (`sem_open`)

Diferente de `sem_init()` (limitado a um mesmo processo), `sem_open()` cria ou abre um semáforo **nomeado**, visível para qualquer processo que reabra o mesmo nome:

```c
#include <semaphore.h>
#include <fcntl.h>

sem_t *garfos = sem_open("/garfos", O_CREAT, 0644, 5); // 5 garfos disponiveis

sem_wait(garfos); // pega um garfo (bloqueia se os 5 ja estiverem tomados)
// ... usar o recurso compartilhado ...
sem_post(garfos); // devolve o garfo

sem_close(garfos);     // libera o descritor local a este processo
// destroi o objeto nomeado do sistema (uma unica vez, ao final do programa)
sem_unlink("/garfos");
```

| Função | Papel |
|---|---|
| `sem_open()` | Cria ou abre um semáforo nomeado, compartilhado entre processos |
| `sem_wait()` | Decrementa o contador, bloqueia se já está em 0 |
| `sem_post()` | Incrementa o contador, acorda uma thread/processo em espera |
| `sem_close()` | Libera o descritor local a este processo (o semáforo nomeado persiste) |
| `sem_unlink()` | Destrói definitivamente o objeto nomeado do sistema |

> **Cilada:** chamar `sem_unlink()` a partir de cada processo que usa o semáforo. Um semáforo nomeado deve ser destruído uma única vez (normalmente pelo último processo a parar, ou um processo dedicado), senão um processo ainda ativo acaba usando um nome que não existe mais.
>
> **Boa prática:** usar um semáforo contado (`sem_open` com um valor inicial > 1) para representar um pool de recursos limitado (ex. 5 garfos compartilhados entre vários processos); um semáforo inicializado em 1 serve como trava de exclusão mútua entre processos, equivalente a um mutex mas utilizável entre processos separados (onde um mutex `pthread` clássico não é).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um semáforo é um contador protegido (0 a N) que limita o número de acessos simultâneos a um recurso, utilizável entre threads (`sem_init`) ou entre processos separados via um nome compartilhado (`sem_open`). |
| **Ferramentas utilizáveis** | `sem_wait()`/`sem_post()` para decrementar/incrementar; `sem_open()`/`sem_close()`/`sem_unlink()` para um semáforo nomeado compartilhado entre processos. |
| **Armadilhas a evitar** | Chamar `sem_unlink()` a partir de vários processos, quando o objeto nomeado só deve ser destruído uma vez. |
| **Boas práticas** | Um semáforo contado para um pool de recursos limitado; um semáforo em 1 como trava de exclusão mútua entre processos. |
