---
order: 3
---

# Filtrado por patrones y tipos algebraicos

## Los tipos variantes (sum types)

Un **tipo variante** enumera todas las formas posibles de un valor, cada una pudiendo llevar sus propios datos:

```ocaml
type forma =
  | Circulo of float                   (* radio *)
  | Rectangulo of float * float        (* ancho, alto *)
  | Triangulo of float * float * float (* tres lados *)
```

Un valor de tipo `forma` es **exactamente una** de estas tres posibilidades, nunca una mezcla ni otra cosa, a diferencia de una clase base con herencia (cf. capítulo [Herencia y polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme), sección [C++](/?c=langages-de-programmation&s=cpp&p=cpp)), donde el conjunto de subclases posibles permanece abierto: cualquiera puede añadir una nueva en otra parte del código.

## El filtrado por patrones (`match`)

`match` descompone un valor según su forma, y extrae directamente los datos que lleva:

```ocaml
let area forma =
  match forma with
  | Circulo radio -> Float.pi *. radio *. radio
  | Rectangulo (ancho, alto) -> ancho *. alto
  | Triangulo (a, b, c) ->
      let s = (a +. b +. c) /. 2.0 in
      sqrt (s *. (s -. a) *. (s -. b) *. (s -. c))
```

Comparado con un `switch` (cf. capítulo [Las condiciones](/?c=langages-de-programmation&s=c&p=conditions), sección [C](/?c=langages-de-programmation&s=c&p=c)), la diferencia no es solo estética: cada rama **extrae** directamente `radio`, o `ancho` y `alto`, sin acceso manual a campos (`forma.radio`) ni distinción de tipo previa.

## La exhaustividad verificada en la compilación

Si se olvida una rama, el compilador OCaml lo señala por sí mismo, sin necesidad de escribir el menor test para darse cuenta:

```ocaml
let area_incompleta forma =
  match forma with
  | Circulo radio -> Float.pi *. radio *. radio
  | Rectangulo (ancho, alto) -> ancho *. alto
  (* Warning 8: este filtrado no es exhaustivo -- el caso Triangulo no esta cubierto *)
```

Es solo una **advertencia** por defecto (el programa compila de todos modos), pero un proyecto serio suele activar la opción que convierte este tipo de advertencia en un error bloqueante, haciendo así de la exhaustividad una garantía, no una simple sugerencia. Es una diferencia estructural mayor con un `switch`/`if-elif` en C, [PHP](/?c=langages-de-programmation&s=php&p=php) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript): ahí un caso olvidado compila sin la menor advertencia, y falla solo en la **ejecución**, si y solo si ese caso preciso se presenta algún día en producción, uno de los fallos silenciosos más costosos de diagnosticar, ya que solo se manifiesta meses después de escribir el código, sobre una entrada que nadie había anticipado. En OCaml, añadir un nuevo caso a un tipo variante (`Rombo of float`) hace que inmediatamente salgan a la luz, desde la compilación, **todos** los `match` del programa entero que deberían actualizarse para gestionarlo.

## El tipo `option`, una alternativa estructural a `null`

`option` es él mismo un tipo variante, ya definido en la biblioteca estándar:

```ocaml
type 'a option = None | Some of 'a
```

```ocaml
let encontrar_usuario id =
  if id = 42 then Some "Alicia" else None

match encontrar_usuario 42 with
| Some nombre -> print_endline nombre
| None -> print_endline "Usuario no encontrado"
```

La diferencia con `None` en [Python](/?c=langages-de-programmation&s=python&p=python) (cf. capítulo [Las variables](/?c=langages-de-programmation&s=python&p=variables) para `is None`) es que el compilador **obliga** a tratar el caso `None`: el tipo de una función que puede no encontrar nada es explícitamente `string option`, nunca simplemente `string`. Es por tanto imposible olvidar verificar la ausencia de valor sin que el compilador lo señale, mientras que un [`NullPointerException`](https://docs.oracle.com/en/java/) o un `TypeError: 'NoneType' object is not subscriptable` en Python solo aparece en la ejecución, en el camino de código preciso que lo olvidó.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un tipo variante enumera todas las formas posibles de un valor; `match` descompone y extrae sus datos. El compilador verifica la exhaustividad de un `match`: un caso olvidado se detecta antes de la ejecución, no solo el día que se presenta en producción. |
| **Herramientas utilizables** | `type ... = \| ...`, `match ... with`, el tipo `option` (`Some`/`None`) como alternativa estructural a `null`. |
| **Trampas a evitar** | Dejar un `match` no exhaustivo como simple advertencia en lugar de como error bloqueante. |
| **Buenas prácticas** | Activar la opción que convierte un `match` no exhaustivo en error de compilación; usar `option` en lugar de un valor que podría estar ausente sin que el tipo lo señale. |
