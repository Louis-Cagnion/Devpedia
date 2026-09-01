---
order: 17
---

# Subprocessos e redirecionamento dos fluxos padrão

Um programa Python pode tanto lançar OUTRO programa (`subprocess`) quanto modificar seu próprio comportamento de exibição (`sys.stdout`/`sys.stderr`): este capítulo cobre esses dois usos do módulo padrão `sys`.

## Lançar um programa externo: `subprocess`

```python
import subprocess

resultado = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUEANTE
print(resultado.returncode)                                               # 0 = sucesso, outro valor = falha
print(resultado.stdout)                                                   # o que o programa exibiu
```

`subprocess.run()` espera o processo lançado terminar antes de continuar.

```python
processo = subprocess.Popen(["ls", "-la"])  # NAO BLOQUEANTE: retorna IMEDIATAMENTE, o processo roda em paralelo
# ... fazer outra coisa enquanto "processo" e executado ...
processo.wait()  # espera explicitamente o fim, se necessario
processo.poll()  # None se ainda em andamento, senao o codigo de retorno
```

`subprocess.run()` (o mais comum) lança um processo e ESPERA seu término antes de continuar; `subprocess.Popen()` lança um processo e retorna imediatamente um objeto que o representa, útil para lançar VÁRIOS processos em paralelo (um por site, um por arquivo...) sem esperar cada um antes de iniciar o próximo.

> **Armadilha:** com `Popen()`, nunca chamar `.wait()` nem verificar `.poll()` em nenhum lugar do programa pode deixar processos «zumbis» rodando sem serem coletados, se o programa principal terminar antes deles.

## `sys.executable`: o caminho do interpretador em execução

```python
import sys

sys.executable  # "/usr/bin/python3.12" ou "C:\...\python.exe" -> caminho ABSOLUTO do interpretador que executa ESTE codigo

subprocess.run([sys.executable, "outro_script.py"])  # relanca um script com o MESMO interpretador/ambiente
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
sys.stderr = FluxoDuplo(sys.stderr, log)  # substitui o objeto do modulo pelo duplo, sem tocar no resto do codigo

print("Erro", file=sys.stderr)  # aparece na tela E e escrito em execucao.log
```

`sys.stdout`/`sys.stderr` são simples objetos, substituíveis como qualquer outra variável de módulo: atribuir a eles um objeto que exponha `.write()`/`.flush()` intercepta silenciosamente tudo que já é escrito em outro lugar com `print(..., file=sys.stderr)`. O nome **Tee** vem do comando Unix `tee` (já visto em [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), que duplica um fluxo para vários destinos ao mesmo tempo.

> **Armadilha:** substituir `sys.stderr` muda seu comportamento para TODO o programa, incluindo código de terceiros que escreve nele; restaurar o objeto original (`sys.stderr = fluxo_duplo.original`) ao final do programa evita um efeito colateral persistente se o script for depois importado como módulo em outro lugar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `subprocess.run()` lança um processo externo e espera seu término; `subprocess.Popen()` o lança sem esperar, para paralelismo. `sys.executable` dá o caminho do interpretador em execução. `sys.stdout`/`sys.stderr` são objetos substituíveis, o que permite duplicar uma saída (padrão Tee). |
| **Ferramentas utilizáveis** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, uma classe `write()`/`flush()` atribuída a `sys.stdout`/`sys.stderr`. |
| **Armadilhas a evitar** | Um `Popen()` nunca esperado pode deixar processos zumbis. Substituir `sys.stderr` sem restaurá-lo afeta todo código executado depois no mesmo programa. |
| **Boas práticas** | Usar `sys.executable` em vez de `"python"` fixo para relançar um script. Restaurar `sys.stderr`/`sys.stdout` originais ao final do programa após um Tee. |
