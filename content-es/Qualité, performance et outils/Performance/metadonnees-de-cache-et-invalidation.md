---
order: 12
---

# Metadatos de caché e invalidación (31/10/2026)

[Evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) muestra cómo guardar el resultado de una función para no volver a calcularlo. Este capítulo trata el paso siguiente: una **caché compartida** por todos los visitantes de un sitio (las personas que consultan sus páginas con su navegador, el programa que muestra las páginas web, desde un servidor, la computadora que las envía), donde la verdadera dificultad no es guardar una respuesta sino saber **cuándo deja de ser correcta**. La respuesta se apoya en tres informaciones, los **metadatos de caché**, y en una manera de usarlas, la **invalidación**.

## Una entrada de caché y su clave

Una **caché** es una reserva donde se guarda el resultado de un trabajo costoso para volver a servirlo sin rehacer el trabajo. Una **entrada** es una respuesta guardada. Se encuentra gracias a su **clave**, un texto que sirve de etiqueta de almacenamiento, como el número de un casillero. Una lectura que encuentra la entrada es un **acierto** (*cache hit*); una lectura que no la encuentra es un **fallo** (*cache miss*), y entonces hay que **recalcular** la respuesta, es decir, rehacer el trabajo, antes de guardarla para la próxima vez. El patrón «buscar, si no calcular y guardar» se llama *cache-aside*; se describe en [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

```text
visitante ──> servidor ──> ¿la caché tiene la clave « articulo:7|idioma=es » ?
                           │
                sí (acierto)│                no (fallo)
                   ┌────────┘                    └────────┐
                   v                                      v
           devuelve la entrada                  recalcula (lento), guarda,
           (rápido, gratis)                     luego devuelve
```

¿Dos visitantes que piden «la misma página» reciben de verdad la misma respuesta? No siempre: la página puede cambiar según el idioma, según el usuario conectado, según la dirección pedida. Todo se decide, pues, en tres preguntas, que los metadatos de caché plantean a cada entrada.

## Los tres metadatos

| Metadato | Pregunta a la que responde | Función | Ejemplo | Equivalente HTTP |
|---|---|---|---|---|
| **Contexto** | ¿Qué hace variar la respuesta? | Entra en la **clave**: una variante por valor | `idioma=es`, `idioma=en`; `rol=admin` | Cabecera `Vary` (enumera las cabeceras de la petición que hacen variar la respuesta, como el idioma; la dirección pedida ya está en la clave) |
| **Etiqueta** (*tag*) | ¿De qué datos depende la respuesta? | Permite **invalidar** solo las entradas afectadas | `articulo:7`, `lista`, `config` | Ninguno (algunos CDN ofrecen un mecanismo propio de su producto) |
| **Duración de vida** (*max-age*) | ¿Durante cuánto tiempo sigue siendo aceptable la respuesta? | Fija el instante en que la entrada **caduca** por sí misma | 3600 segundos; 0 = caducada de inmediato (nada reutilizable) | `Cache-Control: max-age=N` |

La palabra [**HTTP**](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) designa el lenguaje que hablan un navegador y un servidor web para intercambiar páginas; sus reglas de caché (las cabeceras `Vary` y `Cache-Control`, líneas de información que acompañan a cada respuesta) se describen en la [norma RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (un RFC es un documento de normalización de Internet). Una **CDN** (red de servidores que guardan copias de las páginas cerca de los visitantes) aplica las mismas reglas: véase [CDN y difusión adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative). Una **duración de vida** también se llama **TTL** (*Time To Live*), explicado en [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

Estas tres informaciones cumplen papeles muy distintos, de ahí el interés de no confundirlas:

| Si falta... | Lo que pasa | Gravedad |
|---|---|---|
| Un **contexto** | Un visitante recibe la respuesta prevista para otro (página en inglés para un lector en español, datos de otra cuenta) | Respuesta falsa para el visitante, a veces fuga de datos |
| Una **etiqueta** | El contenido cambia pero la entrada sigue sirviéndose hasta el final de su duración | Respuesta caducada |
| Una **duración de vida** | La entrada queda para siempre, o desaparece demasiado pronto para servir | Respuesta caducada o caché inútil |

## Una caché con etiquetas, contextos y duración de vida

El programa siguiente, en [Python](/?c=langages&s=python&p=python), construye de verdad estos tres metadatos. Las mediciones de este capítulo vienen de su ejecución (ejecución del 31/10/2026). Tres nociones de Python sirven aquí: una **clase** es un molde que agrupa datos y las funciones que los manipulan (véase [la programación orientada a objetos](/?c=langages&s=python&p=poo)), `self` designa el objeto en curso, y un **conjunto** (`set`) es una colección sin duplicados (véase [los diccionarios y los conjuntos](/?c=langages&s=python&p=dictionnaires-et-ensembles)). Una cadena que empieza por `f"` inserta los valores entre llaves dentro del texto. El **reloj** es simulado: el programa suma segundos en lugar de esperar. `hora` es un diccionario en lugar de una simple variable: una función puede modificar el contenido de un diccionario, pero no reemplazar el valor de una variable definida fuera de ella sin una instrucción especial. Recorrer un diccionario con `for k in d` da sus claves, `d.items()` da sus pares (clave, valor) que `c, e` reciben uno a uno, y `[x for ... if ...]` construye una lista con solo los elementos retenidos. El módulo `threading` (tareas que se ejecutan al mismo tiempo, véase [el paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) solo sirve para la sección sobre la avalancha.

```python
import random                                  # tiradas al azar, para simular visitas
import threading                               # tareas simultáneas, para la avalancha (abajo)
import time                                    # pausa de 50 ms que simula un cálculo lento


hora = {"t": 0.0}                              # reloj simulado, en segundos


def ahora():                                   # devuelve la hora simulada
    return hora["t"]                           # evitamos esperar de verdad


class Cache:                                   # una caché con etiquetas y duración de vida
    def __init__(self):                        # se llama al crear la caché
        self.entradas = {}                     # clave -> entrada guardada
        self.aciertos = 0                      # lecturas que han hallado una entrada válida
        self.fallos = 0                        # lecturas que no han hallado nada utilizable
        self.calculos = 0                      # recálculos realizados
        self.tiempo_calculo = 0.0              # segundos de trabajo simulado gastados

    def clave(self, nombre, contexto):         # fabrica la clave de una entrada
        valores = [f"{k}={contexto[k]}" for k in sorted(contexto)]  # sorted: orden fijo
        return "|".join([nombre] + valores)    # ej. "articulo:7|idioma=es"

    def leer(self, nombre, contexto):          # busca una entrada todavía válida
        entrada = self.entradas.get(self.clave(nombre, contexto))  # None si falta la clave
        if entrada is None or entrada["expira_en"] <= ahora():  # ausente o caducada
            self.fallos += 1                   # contamos un fallo
            return None                        # nada utilizable
        self.aciertos += 1                     # contamos un acierto
        return entrada["valor"]                # la respuesta guardada

    def escribir(self, nombre, contexto, valor, etiquetas, duracion):  # guarda una respuesta
        self.entradas[self.clave(nombre, contexto)] = {  # la clave distingue cada variante
            "valor": valor,                    # la respuesta
            "etiquetas": set(etiquetas),       # aquello de lo que depende
            "expira_en": ahora() + duracion,   # instante de caducidad
        }

    def servir(self, nombre, contexto, etiquetas, duracion, coste=0.05):  # leer o recalcular
        valor = self.leer(nombre, contexto)    # primero la caché
        if valor is None:                      # fallo: hay que recalcular
            self.calculos += 1                 # un recálculo más
            self.tiempo_calculo += coste       # cuesta trabajo
            valor = f"respuesta de {nombre}"   # el resultado del cálculo (simulado)
            self.escribir(nombre, contexto, valor, etiquetas, duracion)  # lo guardamos
        return valor                           # en ambos casos, lo devolvemos

    def invalidar(self, etiquetas):            # elimina las entradas que llevan la etiqueta
        apuntadas = set(etiquetas)             # conjunto: colección sin duplicados
        # & conserva los elementos comunes a los dos conjuntos: la entrada queda afectada
        # c, e: la clave y la entrada de cada par que devuelve .items()
        eliminadas = [c for c, e in self.entradas.items() if e["etiquetas"] & apuntadas]
        for c in eliminadas:                   # para cada entrada afectada
            del self.entradas[c]               # la eliminamos
        return len(eliminadas)                 # número de entradas eliminadas

    def purgar(self):                          # vacía toda la caché
        n = len(self.entradas)                 # cuántas entradas había
        self.entradas.clear()                  # eliminamos todo
        return n                               # número de entradas eliminadas
```

Cada entrada guarda así **tres cosas** además de su valor: sus etiquetas, su instante de caducidad y su clave, que contiene los contextos. `invalidar` recorre todas las entradas para encontrar las que llevan la etiqueta: es simple y suficiente aquí, pero una caché real mantiene más bien un índice «etiqueta hacia claves» para no recorrerlo todo en cada escritura.

## Invalidar por etiqueta en lugar de purgar todo

Una entrada puede dejar de ser correcta de tres maneras, y cada una exige una respuesta distinta:

| Manera de retirar una entrada | Cómo | Ventaja | Inconveniente |
|---|---|---|---|
| **Expiración** (duración de vida) | La entrada caduca sola al cabo de `max-age` | Ninguna acción que escribir | La respuesta es falsa hasta la caducidad |
| **Invalidación dirigida** (por etiqueta) | Una escritura elimina las entradas que llevan la etiqueta de los datos modificados | Precisa: solo se recalcula lo necesario | Hay que haber **etiquetado** bien cada entrada |
| **Purga total** | Se vacía toda la caché | Fácil, nunca una respuesta caducada | Todo se recalcula de golpe |

Experimento: un sitio de 20 artículos en 2 idiomas, es decir, 40 páginas de artículo y 2 páginas de inicio (la lista de artículos), o sea 42 entradas. Tras 2 000 visitas para llenar la caché (el calentamiento), modificamos el artículo 7 y luego observamos 300 visitas. La página de inicio lleva la etiqueta `lista` porque muestra los títulos; el artículo 7 modificado afecta, pues, a 4 entradas (la página del artículo y el inicio, en los dos idiomas).

```python
IDIOMAS = ["es", "en"]                         # el contexto «idioma» tiene 2 valores
NUM_ARTICULOS = 20                             # el sitio tiene 20 artículos


def peticion(cache, azar):                     # simula la visita de un lector
    hora["t"] += 0.01                          # 100 visitas por segundo
    idioma = azar.choice(IDIOMAS)              # el idioma del lector
    n = azar.randrange(NUM_ARTICULOS)          # entero de 0 a 19: el artículo pedido
    if azar.random() < 0.3:                    # tirada entre 0 y 1: 3 veces de cada 10
        cache.servir("inicio", {"idioma": idioma}, {"lista"}, 3600)
    else:                                      # si no: la página de un artículo
        cache.servir(f"articulo:{n}", {"idioma": idioma}, {f"articulo:{n}"}, 3600)


def fase(cache, azar, numero):                 # juega `numero` visitas y mide
    r0, e0, c0 = cache.aciertos, cache.fallos, cache.calculos  # 3 variables, 1 línea
    for _ in range(numero):                    # una visita cada vez
        peticion(cache, azar)                  # el lector llega
    aciertos = cache.aciertos - r0             # aciertos solo de esta fase
    fallos = cache.fallos - e0                 # fallos solo de esta fase
    tasa = 100 * aciertos / (aciertos + fallos)  # porcentaje de acierto
    return tasa, cache.calculos - c0           # tasa y número de recálculos


def ensayo(estrategia):                        # un experimento completo
    hora["t"] = 0.0                            # el reloj vuelve a cero
    cache, azar = Cache(), random.Random(1)    # 2 variables, 1 línea; semilla 1
    fase(cache, azar, 2000)                    # calentamiento: la caché se llena
    tasa, recalculos = fase(cache, azar, 300)  # 300 visitas sin modificación
    print(f"{estrategia:<22} sin modif. : {tasa:5.1f} %  recálculos : {recalculos}")
    if estrategia == "invalidación dirigida":  # modificamos el artículo 7...
        eliminadas = cache.invalidar({"articulo:7", "lista"})  # ...y sus dependientes
    else:                                      # si no: purga total
        eliminadas = cache.purgar()            # vaciamos todo
    tasa, recalculos = fase(cache, azar, 300)  # 300 visitas tras la modificación
    print(f"{'':<22} tras modif. : {tasa:5.1f} %  recálculos : {recalculos}"
          f"  (entradas eliminadas : {eliminadas})")


ensayo("invalidación dirigida")                # lanza los dos experimentos
ensayo("purga total")
```

Dentro de los `f"..."` de `print`, `:<22` alinea el texto a la izquierda en 22 caracteres y `:5.1f` escribe un número con un decimal. Las tiradas al azar (`random.Random(1)`) parten de una **semilla**: con la misma semilla, cada ejecución saca los mismos números, así que las dos estrategias reciben exactamente las mismas visitas.

Resultado obtenido:

```text
invalidación dirigida  sin modif. : 100.0 %  recálculos : 0
                       tras modif. :  98.7 %  recálculos : 4  (entradas eliminadas : 4)
purga total            sin modif. : 100.0 %  recálculos : 0
                       tras modif. :  86.3 %  recálculos : 41  (entradas eliminadas : 42)
```

| | Invalidación dirigida | Purga total |
|---|---|---|
| Entradas eliminadas | 4 de 42 | 42 de 42 |
| Recálculos en las 300 visitas siguientes | 4 | 41 |
| Tasa de acierto tras la modificación | 98,7 % | 86,3 % |

El programa escribe los decimales con punto a la inglesa (`98.7`), y el texto con coma (98,7). La purga total elimina más de diez veces más entradas (42 frente a 4) para el mismo cambio, y los 41 recálculos que siguen se concentran **al principio**: 23 caen en las primeras 50 visitas y 33 en las primeras 100 (medido con las mismas visitas); volvemos a ello más abajo.

## Los metadatos suben: unir y tomar el mínimo

Una página rara vez es una sola entrada: está hecha de **trozos** (una cabecera, una lista, un bloque «Hola, María»). La página entera depende de todo lo que depende cada uno de sus trozos. Los metadatos de un trozo **suben** entonces hacia la página (se dice que se **propagan**, en inglés *bubbling*) según tres reglas:

| Metadato | Regla de fusión | Por qué |
|---|---|---|
| Contextos | **Unión** de los de todos los trozos | Si un trozo varía según el usuario, la página entera varía según el usuario |
| Etiquetas | **Unión** de las de todos los trozos | La página debe invalidarse en cuanto cambie uno de sus datos |
| Duración de vida | **Mínimo** de las duraciones | La página caduca en cuanto caduca su trozo más frágil |

```python
def fusionar(*hijos):                          # *hijos: tantos trozos como se quiera
    return {                                   # cada trozo tiene sus propios metadatos
        "contextos": set().union(*(e["contextos"] for e in hijos)),  # unión de los contextos
        "etiquetas": set().union(*(e["etiquetas"] for e in hijos)),  # idem
        "duracion": min(e["duracion"] for e in hijos),  # la duración más corta gana
    }


def mostrar(meta):                             # muestra: contextos | etiquetas | duración
    contextos = sorted(meta["contextos"])      # ordena para una visualización estable
    etiquetas = sorted(meta["etiquetas"])      # idem
    print(f"{contextos} | {etiquetas} | duración {meta['duracion']}")  # columnas con |


cabecera = {"contextos": {"idioma"}, "etiquetas": {"config"}, "duracion": 3600}
lista = {"contextos": {"idioma"}, "etiquetas": {"articulo:7", "lista"}, "duracion": 600}
saludo = {"contextos": {"usuario"}, "etiquetas": {"usuario:42"}, "duracion": 3600}
hora_exacta = {"contextos": set(), "etiquetas": set(), "duracion": 0}  # «hora exacta»

mostrar(fusionar(cabecera, lista))             # página sin contexto por usuario
mostrar(fusionar(cabecera, lista, saludo))     # un bloque por usuario se añade
mostrar(fusionar(cabecera, lista, hora_exacta))  # un bloque de duración 0 se añade
```

En `fusionar`, `set()` crea un conjunto vacío y `.union(a, b, ...)` devuelve la unión de varios conjuntos. La expresión `(e["contextos"] for e in hijos)` produce un conjunto por trozo, y el `*` delante de ella los desempaqueta en tantos argumentos separados para `union`.

Resultado obtenido:

```text
['idioma'] | ['articulo:7', 'config', 'lista'] | duración 600
['idioma', 'usuario'] | ['articulo:7', 'config', 'lista', 'usuario:42'] | duración 600
['idioma'] | ['articulo:7', 'config', 'lista'] | duración 0
```

Cada línea da los contextos, las etiquetas y, al final, la duración de la página fusionada. Léanse las tres líneas de arriba abajo. Un solo trozo que varía según el usuario (`saludo`) hace variar toda la página: ya no se compartirá entre lectores. Un solo trozo de duración 0 (`hora_exacta`, que muestra la hora exacta) hace **imposible guardar toda la página**. Es una fuga de eficiencia clásica: un pequeño bloque dinámico arruina la caché de una página de cien bloques.

> **Trampa:** dejar que un detalle de visualización (la hora, un contador de visitantes) imponga una duración de 0 a una página entera. Aísle ese detalle en su propio trozo, cargado aparte, para que el resto de la página pueda seguir guardándose en caché.

## La invalidación en cada escritura: la trampa

Una **escritura** es todo suceso que cambia datos: un comentario publicado, un artículo modificado, un producto añadido al carrito. Para que la caché siga siendo correcta, cada escritura invalida las entradas que dependen de ella. Todo depende entonces de **la amplitud** de lo que invalida y de **la frecuencia** de las escrituras.

Imaginemos que cada página de artículo muestra un bloque «últimos comentarios». Dos formas de etiquetarlo:

| Variante | Etiquetas de la página de artículo | Lo que invalida un comentario |
|---|---|---|
| **amplio** | `articulo:N` **y** `comentarios` en la página entera | Todas las páginas de artículo de todos los idiomas |
| **fragmento** | `articulo:N` en la página; `comentarios` en el bloque, cargado aparte (consulta distinta): tiene su propia entrada poco costosa y no se fusiona con la de la página | Solo el bloque |

El programa mide 1 000 visitas (10 segundos simulados, 100 visitas por segundo), con una escritura cada `k` visitas. La **carga** es el tiempo de cálculo total dividido entre los 10 segundos: al 100 %, el servidor pasa todo su tiempo recalculando; por encima del 100 %, ya no llega y los visitantes esperan. Una página cuesta 0,05 s recalcularla; un bloque de comentarios, 0,005 s.

```python
def visita(cache, azar, variante):             # una visita a una página de artículo
    hora["t"] += 0.01                          # 100 visitas por segundo
    n = azar.randrange(NUM_ARTICULOS)          # el artículo pedido
    contexto = {"idioma": azar.choice(IDIOMAS)}  # el idioma del lector
    if variante == "amplio":                   # la página también depende de los comentarios
        cache.servir(f"articulo:{n}", contexto, {f"articulo:{n}", "comentarios"}, 3600)
    else:                                      # «fragmento»: bloque cargado aparte
        cache.servir(f"articulo:{n}", contexto, {f"articulo:{n}"}, 3600)
        cache.servir("comentarios", contexto, {"comentarios"}, 3600, coste=0.005)


def carga(variante, escritura_cada):           # 1000 visitas, una escritura cada k
    hora["t"] = 0.0                            # el reloj vuelve a cero
    cache, azar = Cache(), random.Random(2)    # semilla 2: tiradas reproducibles
    for i in range(1, 1001):                   # 1000 visitas = 10 segundos simulados
        visita(cache, azar, variante)          # llega un lector
        if escritura_cada and i % escritura_cada == 0:  # % : resto de la división
            cache.invalidar({"comentarios"})   # invalida la etiqueta «comentarios»
    tasa = 100 * cache.aciertos / (cache.aciertos + cache.fallos)  # acierto global
    return tasa, cache.calculos, cache.tiempo_calculo / 10 * 100  # carga en % de 10 s


print(f"{'escritura':<12}{'variante':<10}{'acierto':>9}{'recálculos':>11}{'carga':>9}")
for k in (None, 100, 20, 5, 2):                # de «nunca» a «una visita de cada dos»
    for variante in ("amplio", "fragmento"):   # etiqueta en la página, o en un bloque
        tasa, calculos, porcentaje = carga(variante, k)  # jugamos el experimento
        escritura = "ninguna" if k is None else f"1 por {k}"  # etiqueta de la fila
        print(f"{escritura:<12}{variante:<10}{tasa:>8.1f}%{calculos:>11}{porcentaje:>8.0f}%")
```

En el `if` de `carga`, `None` (sin escritura) cuenta como falso, así que la condición es falsa. En las `f"..."` de la visualización, `>` alinea a la derecha (`<` a la izquierda) y `.0f` escribe un número sin decimales.

Resultado obtenido:

```text
escritura   variante    acierto recálculos    carga
ninguna     amplio        96.0%         40      20%
ninguna     fragmento     97.9%         42      20%
1 por 100   amplio        62.7%        373     187%
1 por 100   fragmento     97.0%         60      21%
1 por 20    amplio        21.6%        784     392%
1 por 20    fragmento     93.0%        140      25%
1 por 5     amplio         5.2%        948     474%
1 por 5     fragmento     78.8%        423      39%
1 por 2     amplio         1.6%        984     492%
1 por 2     fragmento     61.8%        765      56%
```

| Escritura | Carga «amplio» | Carga «fragmento» |
|---|---|---|
| Ninguna (caché vacía al principio: solo los primeros recálculos) | 20 % | 20 % |
| 1 visita de cada 100 (un comentario por segundo) | **187 %** | 21 % |
| 1 visita de cada 20 | 392 % | 25 % |
| 1 visita de cada 5 | 474 % | 39 % |
| 1 visita de cada 2 | 492 % | 56 % |

Un solo comentario por segundo lleva al servidor del 20 % al 187 % de carga con la variante amplia: la caché se vacía más deprisa de lo que se llena. La tasa de acierto cae a 62,7 % (una escritura por cada 100 visitas), y luego a 1,6 % (una por cada 2): en este último caso, casi cada visita provoca un recálculo completo. La caché existe todavía, pero ya no sirve para nada.

### De la lentitud a la denegación de servicio

Si la escritura está **abierta a cualquiera** (formulario de comentario, botón «me gusta», añadir al carrito, envío de un formulario de contacto), un tercero malintencionado, o un simple robot demasiado celoso, puede producir la frecuencia de escritura que vacía la caché, con una **petición** (una solicitud enviada al servidor) **barata** que provoca recálculos **costosos**: es una **amplificación**. El servidor se satura sin que ninguna petición sea enorme; es una **denegación de servicio de aplicación** (dejar el servicio inutilizable por la carga que se le impone, sin romper la red). Este capítulo no detalla los ataques: el catálogo de las familias de sobrecarga, con sus defensas, está en [Sobrecarga y denegación de servicio de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

| Defensa | Principio | Efecto en el experimento |
|---|---|---|
| **Etiquetas finas** | Un trozo solo lleva las etiquetas de las que depende de verdad | Variante «fragmento»: 187 % pasa a 21 % |
| **Limitar la frecuencia de las escrituras** | Un número máximo de escrituras por usuario y por minuto | Limita la frecuencia `k` |
| **Agrupar las invalidaciones** | Invalidar una vez por segundo como máximo, no en cada escritura | Sea cual sea el número de escrituras, un solo vaciado por intervalo |
| **Servir la respuesta anterior durante el recálculo** | La entrada caducada sigue sirviéndose mientras un solo visitante la rehace | Ninguna ráfaga de recálculos (véase más abajo) |
| **Reservar las escrituras a cuentas identificadas** | Ninguna escritura anónima sobre lo que invalida una caché amplia | Reduce los posibles autores |

## Contextos demasiado finos

El error inverso al olvido de un contexto consiste en declarar **demasiados**, o en elegir un contexto con valores muy numerosos. Como cada valor de contexto crea una variante de la clave, el número de entradas posibles es el **producto** del número de páginas por el número de valores de cada contexto:

```text
entradas posibles = páginas × (valores del contexto 1) × (valores del contexto 2) × ...
```

Experimento: 20 artículos, 50 lectores conectados (2 idiomas, 3 roles), 3 000 visitas. Con solo el idioma como contexto, hay 20 × 2 = 40 claves posibles; con el identificador del lector, hasta 20 × 50 = 1 000.

```python
USUARIOS = 50                                  # 50 lectores conectados distintos
ROLES = ["lector", "editor", "admin"]          # el rol de un lector (3 valores)


def trafico_contextos(nombres):                # 3000 visitas con estos contextos
    hora["t"] = 0.0                            # el reloj vuelve a cero
    cache, azar = Cache(), random.Random(3)    # semilla 3: tiradas reproducibles
    for _ in range(3000):                      # 3000 visitas
        hora["t"] += 0.01                      # 100 visitas por segundo
        u = azar.randrange(USUARIOS)           # quién visita
        conocido = {                           # lo que la petición sabe del lector
            "idioma": IDIOMAS[u % 2],          # su idioma (u % 2 = resto de u entre 2)
            "rol": ROLES[u % 3],               # su rol (resto de u dividido entre 3)
            "usuario": f"u{u}",                # su identificador
        }
        contexto = {n: conocido[n] for n in nombres}  # solo los contextos declarados
        n = azar.randrange(NUM_ARTICULOS)      # el artículo pedido
        cache.servir(f"articulo:{n}", contexto, {f"articulo:{n}"}, 3600)
    tasa = 100 * cache.aciertos / (cache.aciertos + cache.fallos)  # acierto global
    return tasa, len(cache.entradas), cache.calculos  # tasa, entradas guardadas, recálculos


print(f"{'contextos':<24}{'acierto':>9}{'entradas':>9}{'recálculos':>11}")
for nombres in (["idioma"], ["idioma", "rol"], ["usuario"]):  # del más amplio al más fino
    tasa, entradas, calculos = trafico_contextos(nombres)  # jugamos el experimento
    print(f"{' + '.join(nombres):<24}{tasa:>8.1f}%{entradas:>9}{calculos:>11}")
```

Resultado obtenido:

```text
contextos                 acierto entradas recálculos
idioma                      98.7%       40         40
idioma + rol                96.0%      120        120
usuario                     68.3%      950        950
```

| Contextos | Entradas guardadas | Tasa de acierto | Lectura |
|---|---|---|---|
| `idioma` | 40 | 98,7 % | Pocas variantes, cada una muy reutilizada |
| `idioma + rol` | 120 | 96,0 % | Algunas variantes más, todavía eficaz |
| `usuario` | 950 | 68,3 % | Casi una entrada por visitante: cada entrada sirve poco antes de ser olvidada |

En el último caso, la caché **funciona** (nunca se equivoca) pero **casi ya no sirve**: 950 recálculos para 3 000 visitas, frente a 40. Además, ocupa más memoria. La regla: elegir como contexto la **categoría** que de verdad hace variar la respuesta (el idioma, el rol), y nunca la identidad de la persona si la página no depende de ella. Un bloque que de verdad depende del usuario se aísla en su propio trozo (véase la fusión más arriba), para que el resto de la página siga compartido.

## La avalancha sobre la caché vacía

Cuando una entrada muy solicitada desaparece (invalidada, caducada o tras un reinicio), los visitantes que llegan mientras se recalcula la encuentran todos ausente. Si cada uno lanza el recálculo por su cuenta, el servidor recibe una **ráfaga de cálculos idénticos**: es la **avalancha sobre la caché vacía** (*cache stampede*). Este fenómeno agrava la sobrecarga de la sección anterior: cuanto más lento es el recálculo, más visitantes llegan antes de que termine.

El experimento lanza 20 **hilos de ejecución** (un hilo es una secuencia de instrucciones que se desarrolla al mismo tiempo que otras, véase [el paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) que piden la misma clave vacía en el mismo instante. Un **cerrojo** es un objeto que solo un hilo a la vez puede tener: los demás esperan a que se libere. Aquí, el hilo que tiene el cerrojo recalcula; los demás, al entrar a su vez, encuentran la respuesta ya guardada y no recalculan. Las funciones del módulo `threading` se describen en la [documentación oficial de Python](https://docs.python.org/3/library/threading.html). En el código: `Thread(target=f)` crea un hilo que ejecutará `f`, `start()` lo lanza, `join()` espera a que termine; `Barrier(n)` hace esperar a cada hilo hasta que lleguen `n` hilos, y entonces los libera a todos juntos; `time.sleep(0.05)` suspende el hilo 50 milisegundos (0,05 s) para simular un cálculo lento; `with cerrojo:` mantiene el cerrojo durante el bloque; `setdefault(clave, valor)` devuelve el valor de la clave, creándola si falta. Un segundo cerrojo protege el contador de recálculos: si dos hilos sumaran 1 a la vez, una de las sumas podría perderse. Por último, `calcular` y `lector` son funciones definidas dentro de `avalancha`: así pueden usar sus variables (`cache`, `contador`, `cerrojos`).

```python
def avalancha(con_cerrojo, hilos=20):         # `hilos` lectores llegan a una clave vacía
    cache = Cache()                            # una caché vacía: todos fallan
    contador = {"n": 0}                        # recálculos realmente lanzados
    cerrojo_contador = threading.Lock()        # protege el contador compartido
    cerrojos = {}                              # un cerrojo por clave
    salida = threading.Barrier(hilos)          # todos los hilos parten en el mismo instante

    def calcular():                            # el cálculo lento
        with cerrojo_contador:                 # un solo hilo modifica el contador a la vez
            contador["n"] += 1                 # un recálculo más
        time.sleep(0.05)                       # 50 ms de trabajo
        return "página popular"                # el resultado

    def lector():                              # lo que hace cada hilo
        salida.wait()                          # espera a que todos estén listos
        if cache.leer("inicio", {}) is not None:  # ¿entrada presente?
            return                             # sí: nada que hacer
        if con_cerrojo:                        # variante protegida
            cerrojo = cerrojos.setdefault("inicio", threading.Lock())  # cerrojo de la clave
            with cerrojo:                      # un solo hilo a la vez entra aquí
                if cache.leer("inicio", {}) is None:  # otro puede haber llenado ya la caché
                    cache.escribir("inicio", {}, calcular(), {"lista"}, 60)
        else:                                  # variante ingenua: cada uno recalcula
            cache.escribir("inicio", {}, calcular(), {"lista"}, 60)

    lista_hilos = [threading.Thread(target=lector) for _ in range(hilos)]  # crea los hilos
    for h in lista_hilos:                      # lanza cada hilo
        h.start()
    for h in lista_hilos:                      # espera el final de cada hilo
        h.join()
    return contador["n"]                       # número de recálculos lanzados


print("sin cerrojo :", avalancha(False), "recálculos para 20 lectores")
print("con cerrojo :", avalancha(True), "recálculo para 20 lectores")
```

Resultado obtenido:

```text
sin cerrojo : 20 recálculos para 20 lectores
con cerrojo : 1 recálculo para 20 lectores
```

Veinte recálculos idénticos sin cerrojo, uno solo con él. Existen otras defensas, que se suman a esta:

| Defensa | Principio | Contra qué |
|---|---|---|
| **Cerrojo por clave** | Un solo visitante recalcula, los demás esperan el resultado | Ráfaga de recálculos idénticos |
| **Servir la respuesta caducada durante el recálculo** (*stale-while-revalidate*, véase [Bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | El valor anterior sigue sirviéndose unos segundos | Latencia que ven los visitantes |
| **Variar la duración de vida** | Añadir una **fluctuación** (*jitter*, variación aleatoria) de ± 10 % al `max-age` de cada entrada | Caducidades simultáneas (véase más abajo) |
| **Precalentar** | Recalcular por adelantado las páginas populares tras una purga | Primeros visitantes lentos |

La variación de la duración de vida evita otro caso de ráfaga: las entradas **escritas juntas con la misma duración** caducan **juntas**. El experimento escribe 1 000 entradas en el mismo instante, con una duración nominal de 60 segundos:

`random.uniform(a, b)` saca un número al azar entre `a` y `b`; `int(x)` conserva su parte entera, aquí el segundo en que caduca la entrada.

```python
def expiraciones_por_segundo(variacion):       # 1000 entradas escritas juntas
    azar = random.Random(4)                    # semilla 4: tiradas reproducibles
    por_segundo = {}                           # segundo -> entradas que caducan
    for _ in range(1000):                      # 1000 entradas
        duracion = 60 * azar.uniform(1 - variacion, 1 + variacion)  # 60 s ± variación
        segundo = int(duracion)                # segundo de caducidad (escritura en 0)
        por_segundo[segundo] = por_segundo.get(segundo, 0) + 1  # contamos
    return max(por_segundo.values())           # el pico de caducidades en un segundo


print("sin variación :", expiraciones_por_segundo(0.0), "expiraciones en el mismo segundo")
print("± 10 %        :", expiraciones_por_segundo(0.1), "expiraciones como mucho por segundo")
```

Resultado obtenido:

```text
sin variación : 1000 expiraciones en el mismo segundo
± 10 %        : 104 expiraciones como mucho por segundo
```

Sin variación, las 1 000 entradas caducan en el mismo segundo; con ± 10 %, como mucho 104 por segundo, es decir, diez veces menos.

## Un ejemplo en un framework: Drupal

Un **framework** es una base de código ya hecha sobre la que se construye una aplicación. [Drupal](https://www.drupal.org/docs/drupal-apis/cache-api/cache-api), un sistema de gestión de contenidos (un programa para publicar y organizar páginas) escrito en [PHP](/?c=langages&s=php&p=php), aplica los tres metadatos de este capítulo con sus propias palabras: los **contextos** (*cache contexts*), las **etiquetas** (*cache tags*) y la **duración de vida** (*max-age*), que hace **subir** desde cada trozo hacia la página según las reglas de fusión vistas más arriba.

> Los nombres de contextos, de etiquetas y de funciones de esta sección están verificados en el código fuente de Drupal 11.x.

En PHP, `[ clave => valor ]` crea un array asociativo (como un diccionario de Python) y `=>` asocia una clave con su valor. `\Drupal\Core\Cache\Cache::invalidateTags(...)` llama a la función `invalidateTags` de la clase `Cache`, situada en el espacio de nombres `\Drupal\Core\Cache` (un nombre de carpeta que evita las colisiones de nombres); `::` llama a una función ligada a la clase, sin crear un objeto.

```php
<?php
// Un « array de renderizado »: la descripción de un trozo de página.
$renderizado = [
    '#markup' => 'Lista de artículos',                    // el contenido que se muestra
    '#cache' => [                                         // los metadatos de caché
        'contexts' => ['languages:language_interface', 'user.roles'],  // varía según...
        'tags' => ['node:7', 'node_list'],                // depende de...
        'max-age' => 3600,                                // duración de vida, en segundos
    ],
];

// Tras guardar el contenido número 7: invalidamos sus etiquetas.
\Drupal\Core\Cache\Cache::invalidateTags(['node:7', 'node_list']);
```

| Noción del capítulo | Escritura en este ejemplo | Observación |
|---|---|---|
| Contexto | `languages:language_interface`, `user.roles` | La respuesta varía con el idioma de la interfaz y con los roles del usuario |
| Etiqueta | `node:7`, `node_list` | `node` es el nombre que Drupal da a un contenido; `node_list` es la etiqueta de las listas de contenidos |
| Duración de vida | `'max-age' => 3600` | En segundos; un valor de 0 impide guardar la respuesta |
| Invalidación dirigida | `Cache::invalidateTags(['node:7', 'node_list'])` | Elimina las entradas que llevan una de estas etiquetas, como `invalidar` más arriba |

La plantilla es la misma que en Python: declarar de qué depende un trozo, y dejar que el framework fusione e invalide. Las trampas de este capítulo se aplican tal cual: un trozo de duración 0 arruina toda la página, y una etiqueta demasiado amplia (`node_list` en cada página) convierte cada modificación de contenido en un vaciado masivo.

## Dónde está la caché

Los mismos tres metadatos se encuentran en cada etapa de la cadena que lleva del visitante a los datos:

| Etapa | Quién guarda la copia | Quién decide invalidarla |
|---|---|---|
| Navegador del visitante | El navegador | Sobre todo la duración de vida; no se puede alcanzar desde el servidor |
| CDN | Una red de servidores cercanos a los visitantes ([CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative)) | Una purga pedida a la CDN, o la duración de vida |
| Aplicación | La memoria del servidor o un servicio dedicado como [Redis](/?c=donnees&s=bases-de-donnees&p=redis) | El código de la aplicación, por etiqueta |
| Delante de la base de datos | El resultado de una consulta costosa, guardado para no repetirla ([Bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | El código de la aplicación, o la duración de vida |

Una caché sirve sobre todo para evitar viajes de ida y vuelta costosos; cuando no hay nada que guardar, [Limitar los viajes de ida y vuelta](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) muestra cómo agruparlos.

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Ningún contexto cuando la respuesta varía | Un visitante recibe la respuesta de otro, a veces sus datos | Declarar cada factor de variación en la clave |
| Un contexto demasiado fino (el identificador del usuario) | Casi una entrada por visitante, la caché ya no sirve (68 % en lugar de 99 % en el experimento) | Elegir la categoría (idioma, rol), aislar el bloque personal |
| Ninguna etiqueta, solo una duración | Un cambio sigue invisible hasta la caducidad | Etiquetar por dato e invalidar en la escritura |
| Una etiqueta demasiado amplia | Cada escritura vacía una caché entera: 187 % de carga por un comentario por segundo | Etiquetas finas, bloques separados |
| Purga total «por si acaso» | 42 entradas eliminadas en lugar de 4, 41 recálculos en lugar de 4 | Invalidación dirigida por etiqueta |
| Un trozo de duración 0 en una página | La duración mínima sube: toda la página se vuelve imposible de guardar | Aislar el trozo dinámico, cargarlo aparte |
| Escritura abierta a todos que invalida una caché amplia | Amplificación: petición barata, recálculos costosos, denegación de servicio de aplicación | Limitar las escrituras, agrupar las invalidaciones |
| Misma duración en entradas escritas juntas | Caducan juntas y provocan una ráfaga | Variar la duración (± 10 %) |
| Varios visitantes recalculando la misma clave | Avalancha sobre la caché vacía: 20 recálculos en lugar de uno | Cerrojo por clave, o servir el valor anterior durante el recálculo |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Declarar para cada entrada sus contextos, sus etiquetas y su duración de vida desde su creación | Los tres datos rara vez faltan juntos, pero cada uno que falta causa un defecto distinto |
| Elegir los contextos más **generales** que basten | Menos variantes, más aciertos |
| Etiquetar cada entrada con **todos** los datos de los que depende, y nada más | Invalidar lo suficiente, sin vaciar lo que no ha cambiado |
| Separar del resto de la página los trozos que cambian a menudo | Un trozo frágil no arruina a los demás |
| Invalidar por etiqueta, nunca por purga total, salvo incidente | El coste sigue a la amplitud del cambio |
| Medir la tasa de acierto y el número de recálculos tras cada escritura | Una caché vaciada con demasiada frecuencia se ve en las cifras antes de verse en los visitantes |
| Limitar la frecuencia de las escrituras que invalidan, y agrupar sus invalidaciones | Corta la amplificación en denegación de servicio |
| Cerrojo por clave y variación de la duración de vida | Evita las ráfagas de recálculos idénticos |
| Medir primero (véase [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) antes de generalizar una caché | Complica el código: debe ganar un tiempo real |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una entrada de caché se encuentra por una **clave** y lleva tres **metadatos**: el **contexto** (lo que hace variar la respuesta: idioma, rol; entra en la clave), la **etiqueta** (de qué depende, para invalidarla de forma dirigida) y la **duración de vida** (`max-age`, tras la cual caduca). Los metadatos de una página compuesta **suben**: unión de contextos, unión de etiquetas, mínimo de duraciones. La invalidación por etiqueta solo elimina lo necesario (4 entradas de 42, 98,7 % de acierto después), mientras que la purga total lo elimina todo (86,3 %, 41 recálculos). Una escritura frecuente que invalida una caché amplia la vacía más deprisa de lo que se llena: 187 % de carga por un comentario por segundo, frente a 21 % con un bloque separado. Abierta a terceros, esa escritura se convierte en una denegación de servicio de aplicación, detallada en [Sobrecarga y denegación de servicio de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Un contexto demasiado fino (uno por usuario) deja una caché correcta pero inútil (68,3 %). La avalancha sobre la caché vacía (20 recálculos idénticos) se evita con un cerrojo por clave y con una duración de vida variada. |
| **Trampas que evitar** | Contexto olvidado (respuesta de otro visitante); contexto demasiado fino; duración sin etiqueta; etiqueta demasiado amplia; purga total sistemática; trozo de duración 0 en una página; escritura pública que invalida una caché amplia; duraciones idénticas en entradas escritas juntas; recálculos concurrentes de la misma clave. |
| **Buenas prácticas** | Declarar contextos, etiquetas y duración al crearlas; contextos generales; etiquetas exactas; trozos separados para lo que cambia a menudo; invalidación dirigida; limitar y agrupar las escrituras que invalidan; cerrojo por clave y duración variada; medir la tasa de acierto y los recálculos. |
