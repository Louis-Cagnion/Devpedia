---
order: 9
---

# Limitar os recursos de um programa

Um programa que consome memória demais (a **RAM**, onde o computador guarda o que os programas em execução precisam) não se limita a travar: ele pode congelar a máquina inteira. Quando a RAM enche, o sistema transborda para o **swap**, uma área do disco usada como memória de reserva, centenas de vezes mais lenta: o mouse engasga, o terminal para de responder. Se até o swap se esgota, o **kernel** (o programa central do sistema, que reparte memória, processador e disco entre todos os outros) aciona seu **OOM killer** (*Out Of Memory*, «sem memória»): ele mata um processo para liberar espaço, mas não necessariamente o culpado, às vezes a sessão gráfica inteira do usuário.

Este capítulo mostra como colocar **salvaguardas**: limites definidos antes de iniciar um programa, para que seja ele a parar ao ultrapassá-los, nunca a máquina.

## Quando são necessárias

| Situação | Por que consome tanto |
|---|---|
| Programa de teste com vazamento de memória ou um laço que aloca sem parar | Nada o detém antes de saturar a máquina |
| Teste de robustez (*fuzzing*: enviar milhares de entradas aleatórias ou malformadas) | Uma entrada patológica pode fazer a memória ou o tempo explodirem |
| Programa compilado com um detector de erros de memória ([ASan](https://clang.llvm.org/docs/AddressSanitizer.html), ou [valgrind](https://valgrind.org/docs/manual/manual.html)) | Essas ferramentas vigiam cada acesso e multiplicam a memória e o tempo várias vezes |
| Processamento de um arquivo muito grande | O tamanho da entrada não é controlado |

> **Regra:** todo programa cujo consumo máximo é desconhecido é iniciado sob um limite, mesmo «só para testar».

## Quais recursos limitar

| Recurso | O que pode dar errado | Ferramenta |
|---|---|---|
| Prioridade do processador | O programa monopoliza a CPU, o resto da máquina fica lento | `nice` |
| Fatia do processador | O programa ocupa vários núcleos permanentemente | `CPUQuota` (cgroup) |
| Memória | A RAM e depois o swap enchem, a máquina congela | `ulimit -v`, `MemoryMax` e `MemorySwapMax` (cgroup) |
| Disco | As leituras e escritas do programa atrasam todo o resto | `ionice` |
| Duração | O programa entra em laço infinito | `timeout`, `RuntimeMaxSec` (cgroup) |

## `nice` e `ionice`: passar depois dos outros

Cada [processo](/?c=langages&s=bash&p=gestion-des-processus) (um programa em execução) tem uma **prioridade**: quando vários querem o processador ao mesmo tempo, o sistema atende primeiro os mais prioritários.

```bash
# nice -n 19: prioridade mais baixa (a escala vai de -20, a mais alta, a 19)
# ionice -c3: classe «inativo» (idle), só acessa o disco se ninguém mais precisar
nice -n 19 ionice -c3 ./meu_programa
```

- `nice` **não limita nada**: o programa ainda pode usar todo o processador disponível, mas cede a vez assim que outro precisa.
- Só o `root` (a conta de administrador) pode baixar o valor de `nice` abaixo de 0, ou seja, dar mais prioridade.
- `ionice -c3` só tem efeito se o **escalonador de disco** (o componente do kernel que decide em que ordem atender os pedidos de acesso ao disco) o suportar, como é o caso do BFQ; caso contrário a instrução é ignorada sem nenhuma mensagem.

## `ulimit -v`: um limite por processo

`ulimit` define limites para o [shell](/?c=langages&s=bash&p=bash) atual (o programa que lê os comandos digitados no terminal) e para tudo o que ele inicia. A opção `-v` limita a **memória virtual** (o espaço de endereços que o programa pode reservar, mesmo sem tê-lo preenchido), em quilobytes.

```bash
# entre parênteses: cópia temporária do shell, o limite não afeta o terminal em si
( ulimit -v 200000; ./meu_programa )   # limite de cerca de 200 MB
```

Além dele, a reserva de memória falha: em C, [`malloc`](/?c=langages&s=c&p=memoire) devolve `NULL`, e um programa bem escrito para com uma mensagem. Os limites dessa ferramenta:

| Limite | Consequência |
|---|---|
| Limita o espaço **reservado**, não a memória realmente usada | Um programa pode falhar tendo escrito quase nada |
| Aplica-se a **cada** processo separadamente | Um programa que inicia dez filhos pode consumir dez vezes o limite |
| Incompatível com o ASan, que reserva um espaço virtual muito grande | O programa falha logo ao iniciar |

## cgroups e `systemd-run`: um limite para o grupo inteiro

Os **cgroups** (*control groups*) são o mecanismo do kernel que limita o consumo de um **grupo** de processos, filhos incluídos: é a peça que faz os [contêineres](/?c=infrastructure-devops&s=docker&p=concepts-de-base) funcionarem. Não é preciso manuseá-los à mão: o **systemd**, o programa que inicia e supervisiona tudo o que roda em uma máquina Linux moderna, oferece o `systemd-run`, que inicia um comando dentro de um cgroup criado para ele.

```bash
# --user  : para a conta atual, sem direitos de administrador
# --scope : executa o comando em um grupo de processos, em primeiro plano, neste terminal
systemd-run --user --scope \
	-p MemoryMax=300M \
	-p MemorySwapMax=0 \
	-p CPUQuota=50% \
	-p RuntimeMaxSec=20 \
	nice -n 19 ionice -c3 \
	./meu_programa > log.txt 2>&1
```

| Opção | Função |
|---|---|
| `MemoryMax=300M` | Limite de RAM do grupo inteiro: ao ultrapassá-lo, o kernel mata o grupo |
| `MemorySwapMax=0` | Proíbe qualquer swap: **indispensável**, sem ele o programa transborda para o disco em vez de ser morto, e é a máquina que fica lenta |
| `CPUQuota=50%` | No máximo meio núcleo (`200%`: dois núcleos) |
| `RuntimeMaxSec=20` | Duração máxima em segundos, depois disso é interrompido |

A última linha redireciona a saída do programa para um arquivo (`> log.txt`), erros incluídos (`2>&1`, veja [os redirecionamentos](/?c=langages&s=bash&p=redirections-et-pipes)). Não é um detalhe: se a máquina congelar ou a sessão for encerrada à força, o terminal e seu conteúdo desaparecem, enquanto o arquivo permite entender depois o que aconteceu.

### Verificar que o limite se aplica

Um limite que nunca se viu disparar é apenas uma hipótese. Testa-se com um programa que consome de propósito: ele reserva 1 MB por vez (`malloc`) e o **escreve** (`memset`), pois o sistema só entrega a RAM de verdade ao escrever, uma simples reserva não a consome.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MO (1024 * 1024)                 // dá o nome MO ao valor de um megabyte, em bytes

int main(void)
{
	for (int total = 1; total <= 1000; total++)
	{
		char *bloc = malloc(MO);         // pede 1 MB ao sistema
		if (bloc == NULL)                // recusado: paramos com o código 2
			return 2;
		memset(bloc, 1, MO);             // escreve nele: a RAM é realmente consumida
		printf("%d Mo\n", total);
		fflush(stdout);                  // exibe na hora, mesmo que o programa seja morto
	}
	return 0;
}
```

Iniciado sob `MemoryMax=300M` e `MemorySwapMax=0`, ele é morto antes de 300 MB, e a máquina não fica lenta.

## Ler o código de saída

Um programa que termina devolve um **código de saída** (0 = sucesso), que se lê logo depois com `echo $?`. Um código acima de 128 significa «morto por um **sinal**» (uma mensagem enviada pelo sistema a um processo, veja [o capítulo sobre processos](/?c=langages&s=bash&p=gestion-des-processus)): o número do sinal é o código menos 128.

| Código | Significado | Caso típico |
|---|---|---|
| `0` | Sucesso | O programa terminou normalmente |
| `2` | Escolhido pelo programa | O exemplo acima, `malloc` foi recusado (limite do `ulimit`) |
| `124` | Duração excedida | `timeout 60 ./meu_programa` |
| `137` | 128 + 9: sinal `SIGKILL` | Limite de memória excedido, ou OOM killer |
| `143` | 128 + 15: sinal `SIGTERM` | Parada solicitada, por exemplo no fim de `RuntimeMaxSec` |

## Vários testes em paralelo

Os limites **se somam**: três testes iniciados ao mesmo tempo com 3 GB cada um podem consumir 9 GB juntos.

| Etapa | Exemplo para uma máquina de 16 GB |
|---|---|
| 1. Reservar o necessário para manter a sessão viva (sistema, navegador, editor) | 6 GB |
| 2. Limite global para tudo o que é iniciado | 10 GB |
| 3. Número de testes × pico de memória de um teste (o máximo que ele usa em um instante) ≤ limite global | 4 testes × 2,5 GB = 10 GB |

Um teste que **mede um tempo** (comparação de velocidade, duração de uma operação) roda sempre sozinho, com a máquina em repouso: programas que dividem o processador e o disco distorcem o cronômetro. Só os testes que julgam um resultado (contagem, comparação de saídas) são iniciados juntos.

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma máquina que congela ou usa swap é uma falha: o limite é definido antes de iniciar o programa, para que seja ele a ser morto. `systemd-run --user --scope -p MemoryMax=… -p MemorySwapMax=0` limita o grupo inteiro; `nice` e `ionice` não limitam nada, apenas reduzem a prioridade. |
| **Ferramentas utilizáveis** | `systemd-run`, `nice`, `ionice`, `ulimit -v`, `timeout`, redirecionamento `> log.txt 2>&1`. |
| **Armadilhas a evitar** | `MemoryMax` sem `MemorySwapMax=0` (o swap deixa a máquina lenta); `ulimit -v` sozinho (limite por processo, e incompatível com o ASan); limites cuja soma excede a RAM disponível; saída exibida só no terminal. |
| **Boas práticas** | Testar o limite com um programa que consome de propósito; ler o código de saída (137 = morto); deixar vários GB para a sessão; cronometrar sozinho. |
