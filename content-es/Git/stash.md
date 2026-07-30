---
order: 6
---

# El stash

`git stash` Guarda temporalmente los cambios no confirmados para recuperar una carpeta de trabajo limpia; resulta útil cuando hay que cambiar de rama con urgencia (por ejemplo, para corregir un error crítico) sin querer perder el trabajo en curso ni confirmarlo en un estado incompleto.

## Guardar los cambios

```bash
git stash                          # guarda todas las modificaciones registradas y devuelve la carpeta «limpia»
git stash push -m "en cours : formulaire de contact"  # con una nota, para poder volver a ella más adelante
git stash -u                        # Incluye también los archivos no controlados (nuevos, que nunca se han añadido).
```

Tras un «`git stash`», `git status` ya no muestra ninguna modificación, como si se acabara de realizar un «commit», salvo que no aparece nada en el historial (`git log`): las modificaciones se almacenan por separado, en una pila.

## Ver y recuperar tus stashes

```bash
git stash list
# stash@{0}: en curso: formulario de contacto
# stash@{1}: WIP en main: a3f9c1d Corrige el cálculo del descuento

git stash apply          # vuelve a aplicar el stash más reciente, SIN retirarlo de la pila
git stash apply stash@{1} # vuelve a aplicar un stash concreto
git stash pop             # vuelve a aplicar el stash más reciente y lo retira de la pila
```

> **Nota:** «`apply`» mantiene el stash en la pila tras volver a aplicarlo (útil para aplicarlo en varias ramas sucesivamente), mientras que «`pop`» lo elimina; la elección depende de si se tiene la certeza de que ya no se va a necesitar en ningún otro sitio.

## Eliminar un stash

```bash
git stash drop stash@{0}   # Elimina un stash concreto, sin volver a aplicarlo.
git stash clear             # elimina TODOS los stash de la pila
```

## Caso de uso típico

```bash
# Mientras se trabaja en «feature», aparece un error urgente en «main».
git stash push -m "travail en cours sur feature"
git checkout main
# ... corregir el error, realizar el commit, enviar los cambios...
git checkout feature
git stash pop   # Retoma exactamente donde lo habíamos dejado
```
