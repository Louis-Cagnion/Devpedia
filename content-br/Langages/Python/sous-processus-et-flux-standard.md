---
order: 17
---

# Subprocessos e redirecionamento dos fluxos padrão

Um programa Python pode tanto lançar OUTRO programa (`subprocess`) quanto modificar seu próprio comportamento de exibição (`sys.stdout`/`sys.stderr`): este capítulo cobre esses dois usos do módulo padrão `sys`.

## Lançar um programa externo: `subprocess`

```python
import subprocess

resultado = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUEANTE
# 0 = sucesso, outro valor = falha
print(resultado.returncode)
# o que o programa exibiu
print(resultado.stdout)
```

`subprocess.run()` espera o processo lançado terminar antes de continuar.

```python
# NÃO BLOQUEANTE: retorna IMEDIATAMENTE, o processo roda em paralelo
processo = subprocess.Popen(["ls", "-la"])
# ... fazer outra coisa enquanto "processo" é executado ...
processo.wait()  # espera explicitamente o fim, se necessário
processo.poll()  # None se ainda em andamento, senão o código de retorno
```

`subprocess.run()` (o mais comum) lança um processo e ESPERA seu término antes de continuar; `subprocess.Popen()` lança um processo e retorna imediatamente um objeto que o representa, útil para lançar VÁRIOS processos em paralelo (um por site, um por arquivo...) sem esperar cada um antes de iniciar o próximo.

> **Armadilha:** com `Popen()`, nunca chamar `.wait()` nem verificar `.poll()` em nenhum lugar do programa pode deixar processos «zumbis» rodando sem serem coletados, se o programa principal terminar antes deles.

## `sys.executable`: o caminho do interpretador em execução

```python
import sys

# "/usr/bin/python3.12" ou "C:\...\python.exe" -> caminho ABSOLUTO do interpretador que executa
# ESTE código
sys.executable

# relanca um script com o MESMO interpretador/ambiente
subprocess.run([sys.executable, "outro_script.py"])
```

> **Boa prática:** usar `sys.executable` em vez de um simples `"python"` fixo para relançar um script Python: `"python"` poderia apontar para uma instalação totalmente diferente (versão errada, [ambiente virtual](/?c=langages-de-programmation&s=python&p=modules-et-environnements) errado) dependendo da máquina.

## Redirecionar `sys.stdout`/`sys.stderr`: o padrão «Tee»

```python
import sys

class FluxoDuplo:  # duplica cada escrita para dois destinos
    def __init__(self, original, arquivo_log):
        self.original = original
        self.arquivo_log = arquivo_log

    def write(self, texto):
        self.original.write(texto)     # continua escrevendo na tela, como antes
        self.arquivo_log.write(texto)  # E no arquivo de log

    def flush(self):
        self.original.flush()
        self.arquivo_log.flush()

log = open("execucao.log", "a", encoding="utf-8")
# substitui o objeto do módulo pelo duplo, sem tocar no resto do código
sys.stderr = FluxoDuplo(sys.stderr, log)

print("Erro", file=sys.stderr)  # aparece na tela E é escrito em execução.log
```

`sys.stdout`/`sys.stderr` são simples objetos, substituíveis como qualquer outra variável de módulo: atribuir a eles um objeto que exponha `.write()`/`.flush()` intercepta silenciosamente tudo que já é escrito em outro lugar com `print(..., file=sys.stderr)`. O nome **Tee** vem do comando Unix `tee` (já visto em [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), que duplica um fluxo para vários destinos ao mesmo tempo.

> **Armadilha:** substituir `sys.stderr` muda seu comportamento para TODO o programa, incluindo código de terceiros que escreve nele; restaurar o objeto original (`sys.stderr = fluxo_duplo.original`) ao final do programa evita um efeito colateral persistente se o script for depois importado como módulo em outro lugar.

## Executar vários programas em paralelo, com orçamento de tempo

Para cronometrar um programa externo em muitos casos (uma bateria de medidas), duas necessidades voltam sempre: **parar** um caso que estoura o orçamento, e **executar vários ao mesmo tempo**.

| Necessidade | Ferramenta |
|---|---|
| Parar um programa longo demais | `subprocess.run(..., timeout=segundos)`: passado esse tempo, o programa é encerrado e a exceção `subprocess.TimeoutExpired` é lançada |
| Executar vários programas ao mesmo tempo | `concurrent.futures.ThreadPoolExecutor`: um grupo de threads que executam cada uma uma função |
| Cronometrar | `time.perf_counter()`, um relógio que nunca volta atrás |

**Threads** bastam aqui, embora o Python só execute uma thread de código Python por vez (o [GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock), trava global do interpretador): enquanto o programa externo roda, a thread só espera, e a espera não ocupa o GIL. Para um cálculo feito no próprio Python, seriam precisos processos (ver [O paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

```python
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

def executar(duracao):
    """Executa `sleep duracao` com orçamento de 1 s; devolve (duração, tempo real, status)."""
    inicio = time.perf_counter()
    try:
        subprocess.run(["sleep", str(duracao)], timeout=1, check=True)
        status = "OK"
    except subprocess.TimeoutExpired:
        status = "LONGO DEMAIS"              # sleep foi encerrado depois de um segundo
    return duracao, time.perf_counter() - inicio, status

inicio = time.perf_counter()
with ThreadPoolExecutor(max_workers=4) as pool:
    for duracao, tempo, status in pool.map(executar, [0.5, 2, 0.2, 0.8]):
        print(f"sleep {duracao}: {tempo:.1f} s {status}")
print(f"total: {time.perf_counter() - inicio:.1f} s")
```

Saída medida: os quatro comandos rodam ao mesmo tempo, o total vale 1,0 s, e `pool.map` devolve os resultados **na ordem das entradas**, qualquer que seja a ordem em que os comandos terminam:

```
sleep 0.5: 0.5 s OK
sleep 2: 1.0 s LONGO DEMAIS
sleep 0.2: 0.2 s OK
sleep 0.8: 0.8 s OK
total: 1.0 s
```

> **Armadilha:** quando o tempo estoura, `subprocess.run` só encerra o programa executado, **não os processos que esse programa criou**. Para um programa que cria subprocessos, é preciso agrupá-los (`start_new_session=True` com `subprocess.Popen`) e encerrar o grupo inteiro (`os.killpg`).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `subprocess.run()` lança um processo externo e espera seu término; `subprocess.Popen()` o lança sem esperar, para paralelismo. `sys.executable` dá o caminho do interpretador em execução. `sys.stdout`/`sys.stderr` são objetos substituíveis, o que permite duplicar uma saída (padrão Tee). |
| **Ferramentas utilizáveis** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, uma classe `write()`/`flush()` atribuída a `sys.stdout`/`sys.stderr`; `timeout` e `subprocess.TimeoutExpired`; `ThreadPoolExecutor` para executar vários programas ao mesmo tempo. |
| **Armadilhas a evitar** | Um `Popen()` nunca esperado pode deixar processos zumbis. Substituir `sys.stderr` sem restaurá-lo afeta todo código executado depois no mesmo programa. |
| **Boas práticas** | Usar `sys.executable` em vez de `"python"` fixo para relançar um script. Restaurar `sys.stderr`/`sys.stdout` originais ao final do programa após um Tee. |
