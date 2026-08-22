---
order: 6
---

# El stash

`git stash` guarda temporalmente modificaciones no commiteadas, para recuperar un directorio de trabajo limpio, útil cuando hay que cambiar de rama con urgencia (ej. corregir un bug crítico) sin querer ni perder el trabajo en curso, ni commitearlo en un estado incompleto.

## Guardar las modificaciones

```bash
git stash                                          # guarda todas las modificaciones seguidas, deja el directorio "limpio"
git stash push -m "en curso: formulario de contacto"  # con un mensaje, para ubicarse mas tarde
git stash -u                                       # incluye tambien los archivos no seguidos (nuevos, nunca añadidos)
```

Tras un `git stash`, `git status` ya no muestra ninguna modificación, como si se acabara de commitear, salvo que nada aparece en el historial (`git log`): las modificaciones se almacenan aparte, en una pila.

## Ver y recuperar los stashes

```bash
git stash list
# stash@{0}: en curso: formulario de contacto
# stash@{1}: WIP on main: a3f9c1d Corrige el calculo del descuento

git stash apply            # reaplica el stash mas reciente, SIN retirarlo de la pila
git stash apply stash@{1}  # reaplica un stash concreto
git stash pop               # reaplica el stash mas reciente, Y lo retira de la pila
```

> **Nota:** `apply` mantiene el stash en la pila tras reaplicarlo (útil para aplicarlo en varias ramas sucesivamente), mientras que `pop` lo retira: la elección depende de si se tiene la certeza de no necesitarlo más en otro lugar.

## Eliminar un stash

```bash
git stash drop stash@{0}  # elimina un stash concreto, sin reaplicarlo
git stash clear           # elimina TODOS los stash de la pila
```

## Bajo el capó: un stash es un commit un poco particular

Un stash no es ni más ni menos que un commit (véase [La arquitectura interna de Git](/?c=git&p=architecture-interne) para la estructura de objeto subyacente), apuntado por la ref `refs/stash`. Su primer padre es el commit actual en el momento del stash, y un segundo padre captura el estado del índice (un tercero si se usó `-u`, para los archivos no seguidos): es esta estructura con varios padres la que `git stash apply`/`pop` interpretan para reconstruir por separado el índice y el directorio de trabajo.

> **Trampa:** una herramienta que reescribe el historial sin conocer esta convención (`git filter-branch`, véase [La arquitectura interna de Git](/?c=git&p=architecture-interne)) puede aplanar este commit a un solo padre: `apply`/`pop` se vuelven entonces inutilizables (`fatal: ... is not a stash-like commit`). El contenido sigue siendo recuperable directamente, sin embargo, ya que el tree del commit refleja el estado completo del directorio de trabajo en el momento del stash: `git checkout refs/stash -- archivo.txt`.

## ¿Por qué no simplemente cambiar de rama sin stash?

Un cambio de rama ordinario (`git checkout`/`switch`, véase [Las ramas](/?c=git&p=branches)) no guarda **nada** aparte por sí mismo: Git compara el archivo modificado con su versión en la rama destino.

| Situación | Lo que pasa sin `stash` |
|---|---|
| El archivo modificado no existe, o es idéntico, en la rama destino | Git **permite** el cambio de rama, y lleva consigo la modificación no commiteada: termina en la nueva rama, fuera de cualquier commit, sin que se haya pedido |
| El archivo modificado también difiere en la rama destino | Git **rechaza** el cambio de rama (`error: your local changes ... would be overwritten by checkout`), para nunca sobrescribir un trabajo no commiteado |

Ninguno de los dos casos corresponde a lo que realmente se quiere en el escenario de abajo: el primero mezcla silenciosamente un trabajo en curso con otra rama (fácil de commitear por error en el lugar equivocado), el segundo bloquea por completo mientras no se haga nada. `git stash` retira explícitamente la modificación de **todas** las ramas (directorio de trabajo limpio), la guarda aparte con un mensaje, luego la restituye únicamente cuando se pide, en la rama elegida: es esta puesta aparte explícita, y no el simple cambio de rama, la que garantiza no mezclar ni perder nada.

## Caso de uso típico

```bash
# en pleno trabajo en "feature", cae un bug urgente en "main"
git stash push -m "trabajo en curso en feature"
git checkout main
# ... corregir el bug, commitear, enviar ...
git checkout feature
git stash pop   # retoma exactamente donde se habia dejado
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `git stash` guarda modificaciones no commiteadas para recuperar un directorio limpio. En realidad es un commit especial con varios padres, apuntado por `refs/stash`. |
| **Herramientas utilizables** | `git stash push`/`list`/`apply`/`pop`/`drop`/`clear`. |
| **Trampas a evitar** | Una herramienta que reescribe el historial sin conocer la estructura de un stash puede romperlo (aplanado a un solo padre, `apply`/`pop` se vuelven inutilizables). |
| **Buenas prácticas** | Nombrar los stash con `-m` para ubicarse; usar `pop` solo si se tiene certeza de no necesitarlo más en otro lugar, `apply` si no. |
