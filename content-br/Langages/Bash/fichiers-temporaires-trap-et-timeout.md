---
order: 15
---

# Um script que limpa e para como deve: `mktemp`, `trap` e `timeout`

Um script curto se limita a encadear comandos. Um script que cria arquivos, lança comandos longos e pode ser interrompido precisa também **não deixar nada para trás** e **nunca esperar indefinidamente**. Este capítulo acompanha um caso real: o script que lança o solucionador de Skyscraper em dez grades, mostra seus tempos e pode ser parado pelo teclado.

| Problema | O que acontece | Ferramenta |
|---|---|---|
| Um arquivo temporário fica depois de um erro ou de um Ctrl-C | `/tmp` enche, sobram dados por aí | `mktemp` e `trap ... EXIT` |
| O script é interrompido antes da limpeza | A limpeza nunca acontece | `trap ... INT TERM` |
| Um comando nunca termina | O script fica bloqueado | `timeout` |
| As mensagens de erro se misturam à saída | Algumas linhas são partidas em duas | Separar a saída de erro |

## Um arquivo temporário seguro: `mktemp`

Um **arquivo temporário** só existe durante uma execução (aqui, para guardar à parte as mensagens de erro de um comando). A tentação é dar a ele um nome fixo, como `/tmp/erros.$$`, em que `$$` é o número do processo do script (veja [encerrar um processo](/?c=langages&s=bash&p=gestion-des-processus)). Esse nome é **previsível**: outro usuário da máquina pode criar de antemão nesse lugar um link para um arquivo de quem executa o script, que este sobrescreverá sem saber ([CWE-377](https://cwe.mitre.org/data/definitions/377.html)).

O `mktemp` cria o arquivo **ele mesmo**, com um nome aleatório que ainda não existe, e deixa o acesso apenas ao seu dono (veja [ler as permissões](/?c=langages&s=bash&p=permissions-et-fichiers#ler-as-permissoes-com-ls-l)):

```
$ mktemp
/tmp/tmp.LiSSKlK2Ur
$ ls -l /tmp/tmp.LiSSKlK2Ur
-rw------- 1 alice alice 0 oct.   4 21:29 /tmp/tmp.LiSSKlK2Ur
$ mktemp -d
/tmp/tmp.6jBpvLiBQT
$ ls -ld /tmp/tmp.6jBpvLiBQT
drwx------ 2 alice alice 4096 oct.   4 21:29 /tmp/tmp.6jBpvLiBQT
$ mktemp /tmp/rapport.XXXXXX
/tmp/rapport.yckOz1
```

| Comando | Resultado |
|---|---|
| `mktemp` | Um arquivo vazio, `/tmp/tmp.` seguido de dez caracteres aleatórios |
| `mktemp -d` | Uma **pasta** temporária, para guardar vários arquivos |
| `mktemp /tmp/rapport.XXXXXX` | Um nome escolhido: os `X` finais são trocados por caracteres aleatórios |
| `TMPDIR=/caminho mktemp` | Cria o arquivo nessa pasta em vez de `/tmp` |

## Apagá-lo com certeza: `trap ... EXIT`

O `trap` executa um comando quando o script recebe um sinal (veja [interceptar um sinal](/?c=langages&s=bash&p=gestion-des-processus#interceptar-um-sinal-trap) e os [sinais Unix](/?c=langages&s=c&p=signaux-unix)). O pseudossinal `EXIT` não é um sinal de verdade: designa **o fim do script**, seja qual for o motivo. O script a seguir (`demo.sh`) mostra isso em várias situações (uma linha `case` por situação):

```bash
#!/bin/bash
# uso: ./demo.sh [normal|exit3|error|output|timeout|foreground|capture|capturefg]
# Sem argumento: sleep 17. Durante a espera, digite Ctrl-C.
tmp=$(mktemp)                       # um arquivo temporário, de nome imprevisível
echo "arquivo temporário: $tmp"
trap 'rm -f "$tmp"' EXIT            # apagado na saída, seja qual for o motivo
trap 'exit 130' INT TERM            # um sinal vira uma saída normal (130 = 128 + 2)
case $1 in
    normal)     ;;                                  # o script termina sozinho
    exit3)      exit 3 ;;                           # saída voluntária com um código
    error)      set -e; false; echo "nunca" ;;     # set -e para no comando que falha
    output)     while :; do echo linha; done ;;     # escreve sem fim (SIGPIPE se o leitor sair)
    timeout)    timeout 17 sleep 17 ;;              # sleep vai para o seu próprio grupo
    foreground) timeout --foreground 17 sleep 17 ;; # sleep fica no grupo do terminal
    capture)    out=$(timeout 17 sleep 17) ;;       # a mesma coisa dentro de uma substituição
    capturefg)  out=$(timeout --foreground 17 sleep 17) ;;
    *)          sleep 17 ;;
esac
```

As cinco situações da tabela abaixo foram reproduzidas em bash 5.2 e zsh 5.9. Para o Ctrl-C, simulou-se um terminal real e enviou-se o caractere Ctrl-C como pelo teclado. Cada célula diz se o arquivo temporário é **apagado** ou **permanece**, primeiro com a linha `trap 'exit 130' INT TERM` removida («só EXIT») e depois mantida:

| Fim do script | bash, só EXIT | bash, EXIT + INT/TERM | zsh, só EXIT | zsh, EXIT + INT/TERM |
|---|---|---|---|---|
| Fim normal (`normal`) | apagado | apagado | apagado | apagado |
| `exit 3` | apagado | apagado | apagado | apagado |
| `set -e`, um comando falha (`error`) | apagado | apagado | apagado | apagado |
| SIGPIPE: o leitor da saída foi embora (`output`, lido por `head -1`) | apagado | apagado | **permanece** | **permanece** |
| Ctrl-C durante o `sleep` | apagado | apagado | **permanece** | apagado |

O que reter:

| Constatação | Explicação |
|---|---|
| Os fins «normais» (fim do script, `exit`, [`set -e`](/?c=langages&s=bash&p=scripts-et-shebang#parar-um-script-no-primeiro-erro-set-e)) sempre disparam o `EXIT` | É o caso de uso do pseudossinal |
| O **bash** executa também o `EXIT` quando um sinal mata o script | O arquivo é apagado mesmo sem `trap ... INT TERM` |
| O **zsh** não executa | Um sinal que mata o script pula a limpeza: `trap 'exit 130' INT TERM` é indispensável |
| `trap 'exit 130' INT TERM` transforma um sinal em uma saída normal | `130` segue a convenção 128 + número do sinal (SIGINT vale 2), veja [o código de saída de um processo morto por um sinal](/?c=langages&s=bash&p=architecture-dun-shell#o-codigo-de-saida-de-um-processo-morto-por-um-sinal) |
| Mesmo com essa linha, o zsh ignora o SIGPIPE | Precisa de `trap 'exit 141' PIPE` (13 + 128), verificado; no bash isso é inútil e faz aparecer uma mensagem de erro de escrita |

> Para escrever um script que se comporte igual no bash e no zsh, interceptar **sempre** `EXIT` e `INT TERM`.

### As armadilhas do `trap`

O script `armadilhas.sh` reproduz três casos, cada um em um subshell para que seu `trap EXIT` execute antes da contagem:

```bash
#!/bin/bash
# Três maneiras de lidar com arquivos temporários com trap. Cada caso roda em um
# subshell ( ... ) para que seu trap EXIT execute antes da contagem do que sobrou.
ensaio=$(mktemp -d)                      # pasta de ensaio: o mktemp cria seus arquivos ali
export TMPDIR=$ensaio
contar() { ls -A "$ensaio" | wc -l; }   # número de arquivos e pastas restantes
esvaziar() { find "$ensaio" -mindepth 1 -delete; }

echo "--- 1. dois trap EXIT: o segundo substitui o primeiro"
( a=$(mktemp); trap 'rm -f "$a"' EXIT
  b=$(mktemp); trap 'rm -f "$b"' EXIT )
echo "restam: $(contar)"; esvaziar

echo "--- 2. aspas duplas: \$c é substituída logo, quando está vazia"
( trap "rm -f $c" EXIT
  c=$(mktemp) )
echo "restam: $(contar)"; esvaziar

echo "--- 3. uma pasta de trabalho, um único trap"
( work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
  touch "$work/un" "$work/deux" "$work/trois" )
echo "restam: $(contar)"
rmdir "$ensaio"
```

```
--- 1. dois trap EXIT: o segundo substitui o primeiro
restam: 1
--- 2. aspas duplas: $c é substituída logo, quando está vazia
restam: 1
--- 3. uma pasta de trabalho, um único trap
restam: 0
```

| Armadilha | O que acontece | Remédio |
|---|---|---|
| Dois `trap ... EXIT` seguidos | O segundo **substitui** o primeiro: o primeiro arquivo permanece (caso 1) | Um único `trap`, que limpe tudo |
| Aspas duplas: `trap "rm -f $c" EXIT` | A variável é substituída **no momento do `trap`**, quando ainda está vazia: nada é apagado (caso 2) | Aspas simples: `$c` é lida na saída |
| Vários arquivos temporários | Um `trap` por arquivo: veja a primeira armadilha | Uma única **pasta** de trabalho (`mktemp -d`) e `rm -rf` nela (caso 3) |

## Parar um comando que demora demais: `timeout`

`timeout DURAÇÃO COMANDO` lança o comando e envia a ele um sinal (SIGTERM por padrão) quando a duração termina:

```
$ timeout 1 sleep 5; echo "código de saída: $?"
código de saída: 124
```

| Código de saída | Significado (verificado) |
|---|---|
| 124 | O prazo foi ultrapassado: o comando foi interrompido |
| 125 | O próprio `timeout` falhou (opção desconhecida, por exemplo) |
| 126 | O comando existe, mas não pode ser executado (`timeout 1 /etc/passwd`) |
| 127 | Comando não encontrado |
| 137 | O comando ignora o SIGTERM, `timeout -k 1 2 ...` o matou com SIGKILL (128 + 9) |
| Outro | O código do próprio comando, se terminou a tempo |

### Por que `--foreground`: para onde vai o Ctrl-C

O Ctrl-C não é enviado a um único processo: o terminal o envia a **todos os processos do grupo em primeiro plano** (veja [o controle de tarefas](/?c=langages&s=bash&p=architecture-dun-shell#o-controle-de-tarefas-jobs-ctrl-z-fg-bg)). Ora, o `timeout`, para poder parar o comando e seus filhos ao fim do prazo, se coloca **em um grupo à parte**. O script `grupos.sh` mostra os números de grupo (PGID):

```bash
#!/bin/bash
# uso: ./grupos.sh [--foreground]
# mostra o grupo de processos (PGID) do script, do timeout e do sleep
echo "script: PID $$, PGID $(ps -o pgid= -p $$ | tr -d ' ')"
timeout $1 5 sleep 5 &
sleep 0.3
ps -o pid,ppid,pgid,comm --ppid $$ | grep -e PID -e timeout   # filho do script: timeout
ps -o pid,ppid,pgid,comm --ppid $!                             # filho do timeout: sleep
wait
```

Sem `--foreground`, e depois com ele:

```
script: PID 98558, PGID 98336
    PID    PPID    PGID COMMAND
  98562   98558   98562 timeout
    PID    PPID    PGID COMMAND
  98564   98562   98562 sleep
```

```
script: PID 98662, PGID 98336
    PID    PPID    PGID COMMAND
  98666   98662   98336 timeout
    PID    PPID    PGID COMMAND
  98668   98666   98336 sleep
```

Sem `--foreground`, `timeout` e `sleep` têm um PGID diferente do do script: **já não estão em primeiro plano**, então o Ctrl-C não os alcança. Com `--foreground`, eles compartilham o grupo do script. Os mesmos casos em bash e zsh, com o Ctrl-C digitado 0,8 s após o início («> 4 s» significa que o script ainda esperava após 4 s):

| Comando no script | bash: fim | bash: arquivo | zsh: fim | zsh: arquivo | `sleep` sobreviventes (bash, zsh) |
|---|---|---|---|---|---|
| `sleep 17` | 0,0 s | apagado | 0,0 s | apagado | 0, 0 |
| `timeout 17 sleep 17` | > 4 s | permanece | > 4 s | permanece | 1, 1 |
| `timeout --foreground 17 sleep 17` | 0,0 s | apagado | 0,0 s | apagado | 0, 0 |
| `out=$(timeout 17 sleep 17)` | > 4 s | permanece | 0,1 s | apagado | 1, 1 |
| `out=$(timeout --foreground 17 sleep 17)` | 0,0 s | apagado | 0,0 s | apagado | 0, 0 |

Sem `--foreground`, o Ctrl-C **não faz nada**: o script espera os 17 segundos passarem (o arquivo temporário permanece durante esse tempo) e só então seu `trap` é executado. Dentro de `$(...)`, o zsh sai logo, mas deixa o `sleep` rodando sozinho até o fim.

> A contrapartida, indicada pelo manual do `timeout`: com `--foreground`, **os filhos do comando não são parados** quando o prazo expira, apenas o comando. Se ele lança processos que lhe sobrevivem, é preciso uma vigilância adicional (no solucionador, seus processos filhos morrem com o pai graças a `prctl(PR_SET_PDEATHSIG)`, veja [os processos órfãos](/?c=langages&s=c&p=processus)).

## Capturar a saída sem misturar os erros: o buffer de 4.096 bytes

O script original lança o solucionador assim: `output=$(timeout --foreground 90 ./solucionador "$clues" 2>"$ERRORS")`. A saída padrão vai para uma variável, a **saída de erro** (veja [redirecionar a saída de erro](/?c=langages&s=bash&p=redirections-et-pipes#redirecionar-a-saida-de-erro)) para um arquivo temporário, não para a mesma variável com `2>&1`. A razão aparece com um pequeno programa em C (`tagarela.c`, compilado com `gcc -o tagarela tagarela.c`) que escreve cem linhas e depois um aviso na saída de erro após a septuagésima:

```c
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 100; i++) {
        printf("linha %03d : 123456789 123456789 123456789 123456789 123456789\n", i);
        if (i == 70)
            fprintf(stderr, "AVISO: a linha 70 acabou de ser escrita\n");
    }
    return 0;
}
```

Um programa em C que escreve em um **terminal** esvazia seu buffer a cada linha; para um **pipe** (`|`, veja [os pipes](/?c=langages&s=bash&p=redirections-et-pipes#os-pipes-encadear-comandos)) ou um arquivo, ele acumula em um **buffer** (uma área de memória intermediária) de 4.096 bytes que esvazia de uma vez quando está cheio. A saída de erro, por sua vez, não tem buffer: uma mensagem enviada quando o buffer está pela metade chega antes do texto que a precede.

```
$ ./tagarela 2>&1 | grep -n -B1 -A1 AVISO
66-linha 066 : 123456789 123456789 123456789 123456789 123456789
67:linhAVISO: a linha 70 acabou de ser escrita
68-a 067 : 123456789 123456789 123456789 123456789 123456789
$ stdbuf -oL ./tagarela 2>&1 | grep -n -B1 -A1 AVISO
70-linha 070 : 123456789 123456789 123456789 123456789 123456789
71:AVISO: a linha 70 acabou de ser escrita
72-linha 071 : 123456789 123456789 123456789 123456789 123456789
```

No primeiro caso, o aviso caiu no meio da linha 67 (no byte número 4.096); no segundo, `stdbuf -oL` impõe um buffer por linha e cada linha chega inteira. Em um terminal não há problema nenhum, o que torna o defeito difícil de notar:

```
$ script -qec ./tagarela /dev/null | grep -n -B1 -A1 AVISO
70-linha 070 : 123456789 123456789 123456789 123456789 123456789
71:AVISO: a linha 70 acabou de ser escrita
72-linha 071 : 123456789 123456789 123456789 123456789 123456789
```

O script `capture.sh` captura a saída das duas maneiras e detecta as linhas cujo comprimento não é o de uma linha normal (61 caracteres):

```bash
#!/bin/bash
# Captura a saída de ./tagarela de duas maneiras
errors=$(mktemp)
trap 'rm -f "$errors"' EXIT

echo "--- stderr misturada com stdout (2>&1)"
out=$(./tagarela 2>&1)
echo "$out" | awk 'length($0) != 61 { print "linha danificada:", $0 }'

echo "--- stderr em um arquivo temporário"
out=$(./tagarela 2>"$errors")
echo "$out" | awk 'length($0) != 61 { print "linha danificada:", $0 }'
echo "linhas capturadas: $(echo "$out" | wc -l)"
echo "erros: $(cat "$errors")"
```

```
--- stderr misturada com stdout (2>&1)
linha danificada: linhAVISO: a linha 70 acabou de ser escrita
linha danificada: a 067 : 123456789 123456789 123456789 123456789 123456789
--- stderr em um arquivo temporário
linhas capturadas: 100
erros: AVISO: a linha 70 acabou de ser escrita
```

| Solução | Princípio | Limite |
|---|---|---|
| Saída de erro em um arquivo temporário (`2>"$errors"`) | Dois fluxos separados, nada a entrelaçar | Um arquivo a mais para limpar: `trap` |
| `stdbuf -oL comando` | Força um buffer por linha nos programas C ligados dinamicamente | Sem efeito em um programa que define o próprio buffer |
| No programa: `fflush(stdout)` após cada linha, ou `setvbuf` | O programa esvazia seu buffer sozinho | É preciso poder modificar o programa |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | `mktemp` cria um arquivo (ou, com `-d`, uma pasta) de nome aleatório e direitos restritos. `trap '...' EXIT` o limpa no fim do script, `trap 'exit 130' INT TERM` transforma um sinal em um fim normal para que a limpeza aconteça (indispensável no zsh). `timeout` para um comando que demora demais (código 124); em um script, `--foreground` mantém o comando no grupo do terminal para que o Ctrl-C o alcance. Uma saída de erro misturada à saída padrão pode partir linhas em duas. |
| **Ferramentas utilizáveis** | `mktemp`, `mktemp -d`, `trap`, `timeout` (`--foreground`, `-k`), `stdbuf -oL`, `ps -o pid,ppid,pgid,comm` para ver os grupos de processos. |
| **Armadilhas a evitar** | Um nome fixo como `/tmp/arquivo.$$`. Um segundo `trap ... EXIT` que substitui o primeiro. Aspas duplas em um `trap`. Contar só com `trap ... EXIT` no zsh. Lançar `timeout` sem `--foreground` em um script interrompível pelo teclado. Misturar `2>&1` na captura de um programa que escreve mais de 4.096 bytes. |
| **Boas práticas** | Uma única pasta de trabalho e um único `trap`. Interceptar `EXIT` e `INT TERM`. Testar o script com um Ctrl-C real e verificar o que sobra em `/tmp`. Guardar a saída de erro em um arquivo temporário. |
