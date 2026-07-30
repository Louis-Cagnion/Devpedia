---
order: 7
---

# Las etiquetas

Una **etiqueta** es un puntero a una confirmación concreta, al igual que una rama; pero, a diferencia de una rama, una etiqueta **nunca** **se** **mueve** una vez creada. Suele utilizarse para marcar una versión publicada de un proyecto (`v1.0.0`, `v2.3.1`...).

## Crear una etiqueta

```bash
git tag v1.0.0                 # Etiqueta «ligera»: simple puntero, sin metadatos
git tag -a v1.0.0 -m "Première version stable"   # Etiqueta «anotada»: con autor, fecha y mensaje
```

> **Nota:** una etiqueta anotada (`-a`) suele ser preferible para una versión publicada definitiva, ya que se registra como un objeto Git independiente (con su propio mensaje y autor), a diferencia de la etiqueta ligera, que no es más que un simple alias a un hash de commit.

## Enumerar y examinar las etiquetas

```bash
git tag                     # Lista de todas las etiquetas
git tag -l "v1.*"            # filtro por patrón
git show v1.0.0               # muestra los detalles de la etiqueta (y la confirmación asociada)
```

## Etiquetar una confirmación anterior

```bash
git tag -a v0.9.0 a3f9c1d -m "Version bêta"   # Etiqueta un commit concreto, no tiene por qué ser el más reciente.
```

## Enviar etiquetas a un servidor remoto

Las etiquetas no se envían automáticamente desde un «`git push`» convencional:

```bash
git push origin v1.0.0     # busca una etiqueta concreta
git push origin --tags      # envía todas las etiquetas locales de una sola vez
```

## Eliminar una etiqueta

```bash
git tag -d v1.0.0                    # elimina localmente
git push origin --delete v1.0.0       # también elimina el lado remoto
```

## Volver a una versión etiquetada

```bash
git checkout v1.0.0
```

> **Nota:** esto coloca el repositorio en estado **«detached HEAD»** (`HEAD` apunta directamente a una confirmación, y ya no a una rama), lo cual resulta útil para examinar esta versión concreta, pero cualquier nueva confirmación que se realice en este estado no pertenecería a ninguna rama y se perdería fácilmente. Para seguir trabajando a partir de ahí, crea primero una rama: `git checkout -b nouvelle-branche v1.0.0`.
