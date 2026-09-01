---
order: 17
---

# Subprocesos y redirección de los flujos estándar

Un programa Python puede tanto lanzar OTRO programa (`subprocess`) como modificar su propio comportamiento de visualización (`sys.stdout`/`sys.stderr`): este capítulo cubre estos dos usos del módulo estándar `sys`.

## Lanzar un programa externo: `subprocess`

```python
import subprocess

resultado = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUEANTE
print(resultado.returncode)                                               # 0 = éxito, otro valor = fallo
print(resultado.stdout)                                                   # lo que el programa mostró
```

`subprocess.run()` espera a que termine el proceso lanzado antes de continuar.

```python
proceso = subprocess.Popen(["ls", "-la"])  # NO BLOQUEANTE: devuelve INMEDIATAMENTE, el proceso corre en paralelo
# ... hacer otra cosa mientras "proceso" se ejecuta ...
proceso.wait()  # espera explícitamente a que termine, si hace falta
proceso.poll()  # None si sigue en curso, si no el código de retorno
```

`subprocess.run()` (el más habitual) lanza un proceso y ESPERA a que termine antes de continuar; `subprocess.Popen()` lanza un proceso y devuelve inmediatamente un objeto que lo representa, útil para lanzar VARIOS procesos en paralelo (uno por sitio, uno por archivo...) sin esperar a cada uno antes de iniciar el siguiente.

> **Trampa:** con `Popen()`, no llamar nunca a `.wait()` ni comprobar `.poll()` en ninguna parte del programa puede dejar procesos «zombis» corriendo sin ser recogidos, si el programa principal termina antes que ellos.

## `sys.executable`: la ruta del intérprete en curso

```python
import sys

sys.executable  # "/usr/bin/python3.12" o "C:\...\python.exe" -> ruta ABSOLUTA del intérprete que ejecuta ESTE código

subprocess.run([sys.executable, "otro_script.py"])  # relanza un script con el MISMO intérprete/entorno
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
sys.stderr = FlujoDoble(sys.stderr, log)  # reemplaza el objeto del módulo por el doble, sin tocar el resto del código

print("Error", file=sys.stderr)  # se muestra en pantalla Y se escribe en ejecucion.log
```

`sys.stdout`/`sys.stderr` son simples objetos, reemplazables como cualquier otra variable de módulo: asignarles un objeto que exponga `.write()`/`.flush()` intercepta silenciosamente todo lo que ya se escribe en otra parte con `print(..., file=sys.stderr)`. El nombre **Tee** viene del comando Unix `tee` (ya visto en [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), que duplica un flujo hacia varios destinos a la vez.

> **Trampa:** reemplazar `sys.stderr` cambia su comportamiento para TODO el programa, incluido código de terceros que escribe en él; restaurar el objeto original (`sys.stderr = flujo_doble.original`) al final del programa evita un efecto secundario persistente si el script se importa después como módulo en otro sitio.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `subprocess.run()` lanza un proceso externo y espera a que termine; `subprocess.Popen()` lo lanza sin esperar, para paralelismo. `sys.executable` da la ruta del intérprete en curso. `sys.stdout`/`sys.stderr` son objetos reemplazables, lo que permite duplicar una salida (patrón Tee). |
| **Herramientas utilizables** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, una clase `write()`/`flush()` asignada a `sys.stdout`/`sys.stderr`. |
| **Trampas a evitar** | Un `Popen()` nunca esperado puede dejar procesos zombis. Reemplazar `sys.stderr` sin restaurarlo afecta a todo el código ejecutado después en el mismo programa. |
| **Buenas prácticas** | Usar `sys.executable` en lugar de `"python"` fijo para relanzar un script. Restaurar `sys.stderr`/`sys.stdout` originales al final del programa tras un Tee. |
