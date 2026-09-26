---
order: 17
---

# Subprocesos y redirección de los flujos estándar

Un programa Python puede tanto lanzar OTRO programa (`subprocess`) como modificar su propio comportamiento de visualización (`sys.stdout`/`sys.stderr`): este capítulo cubre estos dos usos del módulo estándar `sys`.

## Lanzar un programa externo: `subprocess`

```python
import subprocess

resultado = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUEANTE
# 0 = éxito, otro valor = fallo
print(resultado.returncode)
# lo que el programa mostró
print(resultado.stdout)
```

`subprocess.run()` espera a que termine el proceso lanzado antes de continuar.

```python
# NO BLOQUEANTE: devuelve INMEDIATAMENTE, el proceso corre en paralelo
proceso = subprocess.Popen(["ls", "-la"])
# ... hacer otra cosa mientras "proceso" se ejecuta ...
proceso.wait()  # espera explícitamente a que termine, si hace falta
proceso.poll()  # None si sigue en curso, si no el código de retorno
```

`subprocess.run()` (el más habitual) lanza un proceso y ESPERA a que termine antes de continuar; `subprocess.Popen()` lanza un proceso y devuelve inmediatamente un objeto que lo representa, útil para lanzar VARIOS procesos en paralelo (uno por sitio, uno por archivo...) sin esperar a cada uno antes de iniciar el siguiente.

> **Trampa:** con `Popen()`, no llamar nunca a `.wait()` ni comprobar `.poll()` en ninguna parte del programa puede dejar procesos «zombis» corriendo sin ser recogidos, si el programa principal termina antes que ellos.

## `sys.executable`: la ruta del intérprete en curso

```python
import sys

# "/usr/bin/python3.12" o "C:\...\python.exe" -> ruta ABSOLUTA del intérprete que ejecuta ESTE
# código
sys.executable

# relanza un script con el MISMO intérprete/entorno
subprocess.run([sys.executable, "otro_script.py"])
```

> **Buena práctica:** usar `sys.executable` en lugar de un simple `"python"` fijo para relanzar un script Python: `"python"` podría apuntar a una instalación completamente distinta (versión equivocada, [entorno virtual](/?c=langages-de-programmation&s=python&p=modules-et-environnements) equivocado) según la máquina.

## Redirigir `sys.stdout`/`sys.stderr`: el patrón «Tee»

```python
import sys

class FlujoDoble:  # duplica cada escritura hacia dos destinos
    def __init__(self, original, archivo_log):
        self.original = original
        self.archivo_log = archivo_log

    def write(self, texto):
        self.original.write(texto)      # sigue escribiendo en pantalla, como antes
        self.archivo_log.write(texto)   # Y en el archivo de log

    def flush(self):
        self.original.flush()
        self.archivo_log.flush()

log = open("ejecucion.log", "a", encoding="utf-8")
# reemplaza el objeto del módulo por el doble, sin tocar el resto del código
sys.stderr = FlujoDoble(sys.stderr, log)

print("Error", file=sys.stderr)  # se muestra en pantalla Y se escribe en ejecución.log
```

`sys.stdout`/`sys.stderr` son simples objetos, reemplazables como cualquier otra variable de módulo: asignarles un objeto que exponga `.write()`/`.flush()` intercepta silenciosamente todo lo que ya se escribe en otra parte con `print(..., file=sys.stderr)`. El nombre **Tee** viene del comando Unix `tee` (ya visto en [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), que duplica un flujo hacia varios destinos a la vez.

> **Trampa:** reemplazar `sys.stderr` cambia su comportamiento para TODO el programa, incluido código de terceros que escribe en él; restaurar el objeto original (`sys.stderr = flujo_doble.original`) al final del programa evita un efecto secundario persistente si el script se importa después como módulo en otro sitio.

## Lanzar varios programas en paralelo, con un presupuesto de tiempo

Para cronometrar un programa externo en muchos casos (un banco de medidas), vuelven dos necesidades: **detener** un caso que supera su presupuesto, y **lanzar varios a la vez**.

| Necesidad | Herramienta |
|---|---|
| Detener un programa demasiado largo | `subprocess.run(..., timeout=segundos)`: pasado ese tiempo, el programa se mata y se lanza la excepción `subprocess.TimeoutExpired` |
| Lanzar varios programas a la vez | `concurrent.futures.ThreadPoolExecutor`: un grupo de hilos que ejecutan cada uno una función |
| Cronometrar | `time.perf_counter()`, un reloj que nunca retrocede |

Aquí bastan **hilos**, aunque Python solo ejecuta un hilo de código Python a la vez (el [GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock), cerrojo global del intérprete): mientras el programa externo se ejecuta, el hilo solo espera, y la espera no ocupa el GIL. Para un cálculo hecho en el propio Python, harían falta procesos (ver [El paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

```python
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

def lanzar(duracion):
    """Lanza `sleep duracion` con 1 s de presupuesto; devuelve (duración, tiempo, estado)."""
    inicio = time.perf_counter()
    try:
        subprocess.run(["sleep", str(duracion)], timeout=1, check=True)
        estado = "OK"
    except subprocess.TimeoutExpired:
        estado = "DEMASIADO LARGO"           # sleep se mató al cabo de un segundo
    return duracion, time.perf_counter() - inicio, estado

inicio = time.perf_counter()
with ThreadPoolExecutor(max_workers=4) as pool:
    for duracion, tiempo, estado in pool.map(lanzar, [0.5, 2, 0.2, 0.8]):
        print(f"sleep {duracion}: {tiempo:.1f} s {estado}")
print(f"total: {time.perf_counter() - inicio:.1f} s")
```

Salida medida: los cuatro comandos se ejecutan a la vez, el total vale 1,0 s y `pool.map` devuelve los resultados **en el orden de las entradas**, sea cual sea el orden en que terminan los comandos:

```
sleep 0.5: 0.5 s OK
sleep 2: 1.0 s DEMASIADO LARGO
sleep 0.2: 0.2 s OK
sleep 0.8: 0.8 s OK
total: 1.0 s
```

> **Trampa:** si se supera el tiempo, `subprocess.run` solo mata el programa lanzado, **no los procesos que ese programa creó a su vez**. Para un programa que lanza subprocesos, hay que agruparlos (`start_new_session=True` con `subprocess.Popen`) y matar todo el grupo (`os.killpg`).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `subprocess.run()` lanza un proceso externo y espera a que termine; `subprocess.Popen()` lo lanza sin esperar, para paralelismo. `sys.executable` da la ruta del intérprete en curso. `sys.stdout`/`sys.stderr` son objetos reemplazables, lo que permite duplicar una salida (patrón Tee). |
| **Herramientas utilizables** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, una clase `write()`/`flush()` asignada a `sys.stdout`/`sys.stderr`; `timeout` y `subprocess.TimeoutExpired`; `ThreadPoolExecutor` para lanzar varios programas a la vez. |
| **Trampas a evitar** | Un `Popen()` nunca esperado puede dejar procesos zombis. Reemplazar `sys.stderr` sin restaurarlo afecta a todo el código ejecutado después en el mismo programa. |
| **Buenas prácticas** | Usar `sys.executable` en lugar de `"python"` fijo para relanzar un script. Restaurar `sys.stderr`/`sys.stdout` originales al final del programa tras un Tee. |
