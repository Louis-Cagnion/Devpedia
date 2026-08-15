---
order: 2
---

# Esperar sin perder tiempo

En un programa que dialoga con el exterior (red, navegador, disco), lo esencial del tiempo no es cálculo: es espera. Y una espera mal escrita cuesta tiempo incluso cuando no hay nada que esperar.

## El problema del retraso fijo

El reflejo más común es poner una pausa "suficientemente larga para que funcione":

```python
pagina.hacer_clic("Pagina siguiente")
time.sleep(2)              # esperemos que 2s basten
leer_los_resultados()
```

Este código tiene dos defectos opuestos, y eso es lo que lo hace traicionero:

- si la página responde en 300 ms, se **desperdician 1,7s** en cada llamada;
- si tarda 2,5s (red cargada, página voluminosa), se lee **demasiado pronto** y el resultado está incompleto: un bug intermitente, muy penoso de diagnosticar.

Un retraso fijo es una apuesta sobre una duración que no controlamos. Es o demasiado largo, o demasiado corto, y por lo general las dos cosas según el día.

## Esperar una condición, no una duración

La formulación correcta es: *esperar a que el resultado esté ahí*, con un tope de seguridad para no bloquear indefinidamente.

```python
def esperar_hasta(condicion, timeout_s=5, intervalo_ms=150):
    """Espera a que condicion() sea verdadera. Devuelve False si se supera el plazo."""
    for _ in range(int(timeout_s * 1000 / intervalo_ms)):
        if condicion():
            return True
        dormir(intervalo_ms)
    return False
```

En uso:

```python
numero_antes = contar_resultados()
pagina.hacer_clic("Pagina siguiente")

if not esperar_hasta(lambda: contar_resultados() > numero_antes):
    raise RuntimeError("La pagina siguiente nunca se cargo")
```

Se retoma en cuanto el contenido está listo (por tanto en 300 ms cuando la página es rápida) sin dejar de ser correcto cuando es lenta. El tope ya no sirve como tiempo de espera, sino como detección de fallo.

> Observe que la condición se basa en un **cambio** (`> numero_antes`) y no en una presencia. Si simplemente se esperara "¿hay resultados?", la condición ya sería verdadera con los resultados de la página anterior, y se leerían los datos antiguos creyendo leer los nuevos.

## No vigilar lo que no llegará

El caso más costoso es la espera de un evento **opcional**. Buscar un banner de cookies durante 2 segundos cuesta 2 segundos completos cada vez que no lo hay: es decir, casi siempre, una vez registrado el consentimiento.

Dos remedios se combinan:

**Memoizar lo que ya no puede cambiar.** La **memoización** consiste en guardar en memoria el resultado de una comprobación costosa para no volver a hacerla nunca más en cuanto la respuesta ya no pueda cambiar. Una vez resuelto el consentimiento para un sitio, ningún banner reaparecerá en sus otras páginas: es inútil comprobar en cada navegación.

```python
def cerrar_banner(pagina, sitios_ya_tratados):
    sitio = dominio_de(pagina.url)
    if sitio in sitios_ya_tratados:
        return                      # ya resuelto: no se pierden 2s revisando
    sitios_ya_tratados.add(sitio)
    ...
```

**Consultar una fuente autoritativa en lugar de sondear.** En lugar de vigilar la aparición de un banner, se puede preguntar directamente si el consentimiento ya existe: aquí, la presencia de una cookie:

```python
def consentimiento_ya_dado(pagina):
    return any("consent" in c["name"].lower() for c in pagina.cookies())
```

Si es así, basta una única comprobación inmediata; si no, se mantiene la vigilancia completa. El comportamiento sigue siendo correcto en ambos casos, sin apostar sobre el tiempo de aparición.

Estos dos cambios eliminaron 12,8 de los 25 segundos del programa citado como ejemplo, sin modificar ni una sola petición enviada: era espera puramente local.

## Mantener una pausa cuando tiene un rol

Cuidado con no eliminar las pausas **útiles**. Frente a un servicio remoto, un espaciamiento voluntario entre peticiones protege contra una limitación de tasa o un bloqueo. La distinción a hacer:

| Tipo de pausa | ¿Eliminar? |
|---|---|
| Esperar una duración arbitraria "por si acaso" | Sí, reemplazar por una condición |
| Volver a comprobar una información que no puede cambiar | Sí, memoizar |
| Espaciar voluntariamente peticiones hacia un mismo servicio | **No**, es una protección |

Una pausa de cortesía no es una ineficiencia: es una restricción de diseño. Eliminarla no mejora el programa, desplaza el problema hacia un fallo más difícil de diagnosticar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un retraso fijo ("`sleep(2)`") siempre es o demasiado largo (tiempo desperdiciado) o demasiado corto (bug intermitente): esperar una condición con un tope de seguridad resuelve ambos problemas a la vez. |
| **Herramientas utilizables** | Una función genérica "esperar hasta" (condición + timeout), la memoización para no volver a comprobar lo que ya no puede cambiar. |
| **Trampas a evitar** | Vigilar un evento opcional en cada iteración (un banner de cookies) sin memorizar que ya no reaparecerá. |
| **Buenas prácticas** | Consultar una fuente autoritativa (una cookie) en lugar de sondear una visualización; mantener las pausas voluntarias que protegen contra una limitación de tasa. |
