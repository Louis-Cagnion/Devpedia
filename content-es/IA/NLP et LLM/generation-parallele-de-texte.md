---
order: 11
---

# Generación paralela de texto: difusión y NCM (31/10/2026)

Un asistente como [ChatGPT](https://chatgpt.com) (asistente conversacional de OpenAI) escribe su respuesta **un trozo de palabra tras otro**, de izquierda a derecha, y no puede escribir el final antes que el principio. Este capítulo explica por qué este método es lento y presenta después dos familias de investigación que intentan producir **mucho texto a la vez**: los modelos de **difusión** y un método publicado en octubre de 2026 llamado **NCM**. El tema está en la **fase de investigación**: estos enfoques son mejores en algunas tareas concretas, quedan por detrás en la mayoría de las demás y no reemplazan a los LLM actuales. Las cifras citadas proceden del artículo de investigación, del blog de sus autores y de la ficha de un modelo, consultados el 31/10/2026; cambiarán.

El capítulo supone conocidos [los tokens y los LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (un LLM, *Large Language Model*, es un « gran modelo de lenguaje » entrenado para predecir la continuación de un texto), [el Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) y [el coste de un LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production).

## Por qué un LLM escribe lentamente

### Un token tras otro

Un **token** es un trozo de texto (en inglés, *token*): una palabra corta, una parte de una palabra o un signo de puntuación (véase [la tokenización](/?c=ia&s=nlp-llm&p=nlp-et-llm#la-tokenizacion-dividir-el-texto)). Un LLM clásico es **autorregresivo**: produce el texto token a token, calculando cada nuevo token **a partir de todos los anteriores**, incluidos los que él mismo acaba de escribir. « Regresivo » viene de la idea de apoyarse en lo que precede; « auto » indica que se trata de sus propias salidas.

El código de este capítulo está escrito en Python (véase [las variables](/?c=langages&s=python&p=variables), [las listas](/?c=langages&s=python&p=listes-et-tuples) y [los bucles](/?c=langages&s=python&p=boucles)): `print` muestra un valor, `len` da la longitud de una lista, `append` añade un elemento al final, `round` redondea un número, `abs` da el valor absoluto de un número (su distancia a cero, sin signo) y `if` ejecuta las líneas que siguen solo si la condición es verdadera. `while` repite sus líneas mientras su condición sea verdadera, y `for x in secuencia` las repite para cada elemento de la secuencia. `+=` suma un valor a una variable (`n += 1` equivale a `n = n + 1`). `lista[3]` lee el elemento de posición 3 (se cuenta desde 0). Una **tupla** como `(1, 100, 1024)` es una lista no modificable, y `for nombre, pasadas in` reparte los dos valores de cada elemento en dos variables. Los operadores `*`, `/`, `//` y `<` significan multiplicar, dividir, dividir quedándose solo con la parte entera del resultado, y « es menor que ».

```python
# El texto que nuestro modelo falso va a « producir » (un token por elemento de la lista)
frase = ["El", "gato", "duerme", "sobre", "la", "alfombra", "."]
# El texto escrito hasta ahora: vacío al principio
texto = []
# Contador de las veces que el modelo debe releer todos sus pesos
lecturas_de_pesos = 0
# Mientras el texto escrito sea más corto que la frase objetivo
while len(texto) < len(frase):
    # Cada token obliga a releer el conjunto de pesos del modelo (explicado más abajo)
    lecturas_de_pesos += 1
    # El modelo falso añade UN solo token: el siguiente de la lista
    texto.append(frase[len(texto)])
# Muestra el texto final y el número de lecturas
print(texto, lecturas_de_pesos)
```

Salida obtenida: `['El', 'gato', 'duerme', 'sobre', 'la', 'alfombra', '.'] 7`. Siete tokens, siete lecturas. No existe ningún atajo: el token 5 no puede calcularse antes que el 4, porque depende de él.

### Los pesos, la memoria y el ancho de banda

Los **pesos** (o **parámetros**) son los millones o miles de millones de números aprendidos durante el entrenamiento, que definen el comportamiento del modelo (véase [las redes de neuronas](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)). Se almacenan en la **memoria** de la tarjeta gráfica (la GPU, véase [CPU frente a GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)). Para calcular **un solo** token, el chip de cálculo debe leer **casi la totalidad** de esos pesos desde la memoria (salvo en un modelo « de mezcla de expertos », explicado con DiffusionGemma más abajo, donde solo se leen los pesos de los expertos activados).

El **ancho de banda de memoria** es la cantidad de datos que la memoria puede enviar al chip por segundo, en gigabytes por segundo (**GB/s**). Un **bit** es una cifra binaria (0 o 1), un **byte** contiene 8 bits, y un gigabyte equivale a mil millones de bytes. Analogía: un cocinero muy rápido cuyos ingredientes están en un sótano. Si tiene que subir **todo el sótano** por cada plato, lo que marca el ritmo es la subida por la escalera, no la velocidad a la que cocina. Se dice que el trabajo está limitado por la **memoria** (*memory-bound*) y no por el **cálculo** (*compute-bound*).

```
  Memoria (pesos: 16 GB)                     Chip de cálculo
  +------------------------+   lectura    +--------------------+
  | todos los pesos        | -----------> | algunas operaciones|
  +------------------------+  por token   | por peso leído     |
          ^                                +----------+---------+
          |                                           |
          +---------- token siguiente, se repite -----+
```

Una operación de cálculo cuesta muy poco frente al desplazamiento de un peso: el chip pasa la mayor parte del tiempo esperando los datos.

### Un cálculo de orden de magnitud

La fórmula es: **tiempo ≈ tamaño del modelo × número de tokens ÷ ancho de banda** (≈: aproximadamente igual a; ×: multiplicado por; ÷: dividido entre). Da un **mínimo** (el tiempo de lectura solo), porque el resto del trabajo solo puede alargarlo.

Datos del ejemplo: un modelo de **16 GB** de pesos, **1 024 tokens** que producir y una tarjeta [NVIDIA GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) (tarjeta gráfica del fabricante NVIDIA). Su ancho de banda de memoria anunciado por el fabricante es de **1 792 GB/s**. Se deduce de la ficha: el **bus** es el número de hilos que transportan bits en paralelo (aquí 512), un **pin** (patilla de conexión del chip) es uno de esos hilos, un **gigabit** es mil millones de bits, y la **GDDR7** es un tipo de memoria gráfica, aquí a 28 gigabits por segundo y por pin: 512 × 28 ÷ 8 = 1 792 (se divide entre 8 para pasar de bits a bytes). Este valor no pudo volver a verificarse en la ficha oficial de NVIDIA en la fecha de redacción: hay que comprobarlo antes de usarlo.

```python
# Ancho de banda en GB/s: 512 bits de ancho x 28 gigabits por segundo
# Todo se divide entre 8, porque un byte contiene 8 bits
ancho_de_banda = 512 * 28 / 8
# Muestra el ancho de banda utilizado
print("ancho de banda (GB/s):", ancho_de_banda)

# Tamaño del modelo en gigabytes (GB)
tamaño_modelo = 16
# Probamos tres longitudes de respuesta
for num_tokens in (1, 100, 1024):
    # Fórmula: tamaño del modelo x número de tokens / ancho de banda (resultado en segundos)
    tiempo = tamaño_modelo * num_tokens / ancho_de_banda
    # Muestra el tiempo redondeado a 3 decimales
    print(num_tokens, "tokens ->", round(tiempo, 3), "s")
# Número de tokens por segundo: una lectura completa de los pesos por token
print("tokens por segundo:", round(ancho_de_banda / tamaño_modelo, 1))
```

Salida obtenida:

```
ancho de banda (GB/s): 1792.0
1 tokens -> 0.009 s
100 tokens -> 0.893 s
1024 tokens -> 9.143 s
tokens por segundo: 112.0
```

| Magnitud | Valor | Origen |
|---|---|---|
| Tamaño de los pesos | 16 GB | Hipótesis del ejemplo |
| Ancho de banda de memoria | 1 792 GB/s | Ficha del fabricante de la RTX 5090 (valor no revalidado aquí) |
| Lectura de los pesos para un token | unos 8,9 ms | 16 ÷ 1 792 |
| Respuesta de 1 024 tokens | unos 9,1 s | 1 024 × 8,9 ms |
| Rendimiento máximo (una sola conversación) | unos 112 tokens por segundo | 1 792 ÷ 16 |

Se obtiene el orden de magnitud « unos 9 segundos ». El tiempo real es más largo (cálculo, datos de contexto, software), pero **nunca más corto** que esta lectura. Comprar un chip capaz de calcular dos veces más rápido no cambia casi nada si la memoria no envía dos veces más datos.

### La agrupación de peticiones (batch)

Un **batch** (« lote ») consiste en procesar **varias peticiones al mismo tiempo**: el chip lee los pesos **una sola vez** y luego los usa para avanzar un token en cada una de las conversaciones del lote. La lectura, que es cara, se comparte.

```python
# Retoma el ancho de banda y el tamaño del modelo del ejemplo anterior
ancho_de_banda = 1792
tamaño_modelo = 16
# Probamos varios tamaños de lote (número de conversaciones procesadas juntas)
for tamaño_lote in (1, 8, 64, 256):
    # Una lectura de los pesos produce un token por conversación del lote
    rendimiento = tamaño_lote * ancho_de_banda / tamaño_modelo
    # Muestra el rendimiento total máximo (suma de todas las conversaciones)
    print("lote", tamaño_lote, "->", round(rendimiento), "tokens/s (techo)")
```

Salida obtenida: 112, 896, 7 168 y 28 672 tokens por segundo. Son **techos teóricos** (el cálculo usa los valores del ejemplo): a partir de cierto tamaño de lote, el chip ya no tiene suficiente potencia de cálculo, y cada conversación conserva además su propia memoria de contexto (la **caché KV**: las claves y los valores de la atención, ya calculados para los tokens anteriores), que no se comparte con las demás.

| | Proveedor de [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (muchos usuarios) | Uso local (una conversación) |
|---|---|---|
| Peticiones simultáneas | Cientos, agrupadas en lotes | Una sola |
| Lecturas de pesos compartidas | Sí: un coste dividido por el tamaño del lote | No: cada token paga su lectura completa |
| Factor limitante | Más bien el cálculo, a partir de cierto lote | El ancho de banda de memoria |
| Efecto de un modelo que escribiera varios tokens por lectura | Ganancia modesta: la lectura ya está amortizada | Ganancia potencialmente grande |
| Dónde se nota la lentitud | Sobre todo en la latencia (el tiempo de espera) de cada usuario | En todo |

Por eso un proveedor es poco sensible a este cuello de botella, mientras que la misma pregunta hecha a un modelo ejecutado en el propio ordenador es lenta. Para el coste de una llamada del lado del proveedor, véase [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production).

## Los dos enfoques en paralelo

Idea común: **producir varios tokens por cada lectura de los pesos**. Una lectura sirve entonces a muchas posiciones del texto a la vez; el cálculo aumenta, pero el número de lecturas disminuye.

### La difusión de texto

La **difusión** es un método nacido para las imágenes: se parte de un resultado lleno de ruido (una imagen de píxeles aleatorios, un píxel es un punto de color de la imagen) y un modelo lo **limpia** paso a paso hasta obtener una imagen nítida. Cada paso es una **pasada de eliminación de ruido**: el modelo observa la imagen entera con ruido y produce una versión un poco menos ruidosa.

Para el texto, el principio se traslada: se parte de un **borrador completo** del texto, cuyas posiciones están enmascaradas o son aleatorias, y en **cada pasada** el modelo **reescribe todo el borrador** a la vez, haciéndolo más coherente. El número de pasadas se elige de antemano y puede ser muy inferior al número de tokens.

Ejemplo utilizable hoy: **DiffusionGemma**, modelo de la familia Gemma (modelos abiertos de Google) cuya [ficha oficial](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) describe una eliminación de ruido en paralelo de **bloques de 256 tokens**, con 15 a 20 tokens obtenidos por pasada.

### NCM: una pirámide de códigos

**NCM** significa *Next-Concept Modeling*, « modelado del concepto siguiente ». Es un método presentado el 9 de octubre de 2026 por un equipo vinculado a la Universidad de Stanford. Aquí, un « concepto » **no** es una idea en el sentido corriente: es un **código** elegido en un diccionario. Funciona en dos etapas.

**Etapa 1: fabricar un tokenizador jerárquico.** Un **tokenizador** es el programa que convierte un texto en tokens y viceversa; aquí produce una jerarquía de códigos. Se basa en un **VQ-VAE** (*Vector Quantized Variational Auto-Encoder*, « autocodificador variacional con cuantización vectorial »). Un VQ-VAE es una red neuronal de tres partes: un codificador que comprime un texto, una **cuantización** que sustituye cada resultado por el código más cercano de un **diccionario** (*codebook*, una lista fija de vectores, es decir, de listas de números; véase [los vectores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)), y un decodificador que reconstruye el texto a partir de los códigos. NCM usa una variante **residual** y **multiescala**: el primer nivel codifica el texto de forma **grosera**, el segundo codifica lo que **queda** (el residuo: el error del primero), el tercero codifica lo que queda de lo que queda, y así sucesivamente hasta el nivel más fino. Cada nivel tiene su propio diccionario. La idea procede de [VAR](https://arxiv.org/abs/2404.02905) (*Visual AutoRegressive modeling*), un método de generación de imágenes.

El siguiente ejemplo de juguete codifica **un solo número** en tres niveles, para ver el principio (los códigos reales son vectores, no números sueltos).

```python
# Un diccionario por nivel (una lista de códigos, aquí una lista de Python)
# El nivel 1 es grueso, el 3 es fino
niveles_de_codigos = [
    [0, 4, 8, 12],
    [-2, -1, 0, 1, 2],
    [-0.5, -0.25, 0, 0.25, 0.5],
]
# El número que hay que codificar
objetivo = 7.3
# Lo que hemos reconstruido hasta ahora: nada al principio
reconstrucción = 0
# Número del nivel en curso
nivel = 0
# Recorremos los diccionarios del grueso al fino
for diccionario in niveles_de_codigos:
    # Pasamos al siguiente nivel
    nivel += 1
    # El resto por codificar: lo que la reconstrucción todavía no ha alcanzado
    resto = objetivo - reconstrucción
    # Suponemos primero que el primer código del diccionario es el mejor
    mejor = diccionario[0]
    # Examinamos cada código del diccionario
    for código in diccionario:
        # abs da el valor absoluto (distancia sin signo): nos quedamos con el más cercano
        if abs(código - resto) < abs(mejor - resto):
            mejor = código
    # El código elegido se añade a la reconstrucción
    reconstrucción += mejor
    # Muestra el nivel, el código elegido, la reconstrucción acumulada y el error restante
    print(nivel, "código", mejor, "reconstrucción", reconstrucción,
          "error", round(abs(objetivo - reconstrucción), 2))
```

Salida obtenida:

```
1 código 8 reconstrucción 8 error 0.7
2 código -1 reconstrucción 7 error 0.3
3 código 0.25 reconstrucción 7.25 error 0.05
```

Cada nivel **afina** el anterior: el error pasa de 0,7 a 0,3 y luego a 0,05.

**Etapa 2: generar.** El tokenizador está **congelado** (ya no se modifica). Un Transformer predice **un nivel cada vez**: en cada pasada escribe **todos los códigos de un nivel en paralelo**, apoyándose en la reconstrucción acumulada de los niveles ya producidos. Cuando la jerarquía está completa, el decodificador del tokenizador la convierte en texto. El ejemplo del blog de los autores tiene **11 niveles**, por tanto 11 pasadas del Transformer. La jerarquía es **fija** dentro de una tarea (12 evaluaciones del modelo para el Sudoku, según el artículo).

### Las tres formas de escribir, en esquema

```
Autorregresivo: un token por pasada, de izquierda a derecha
  pasada 1 : [El] .  .  .  .  .  .
  pasada 2 : [El][gato] .  .  .  .  .
  pasada 3 : [El][gato][duerme] .  .  .  .      ... 1 pasada por token

Difusión: todo el borrador se reescribe en cada pasada
  pasada 1 : [?][?][?][?][?][?][?]    borrador muy borroso
  pasada 2 : [El][?][duerme][?][la][?][.]
  pasada 3 : [El][gato][duerme][sobre][la][alfombra][.]   ... unas pocas pasadas

NCM: un nivel de la pirámide por pasada, sobre todo el texto
  nivel 1 (grueso)    : forma general del texto
  nivel 2             : corrección del nivel 1
  ...
  nivel 11 (fino)     : detalles         -> decodificador -> texto
```

El esquema de la difusión es una ilustración de principio: las posiciones fijadas en cada pasada dependen del modelo real.

### Comparativa

| | Autorregresivo | Difusión de texto | NCM |
|---|---|---|---|
| Lo que hace una pasada | Añade un token | Reescribe todo el borrador | Escribe un nivel de códigos para todo el texto |
| Número de pasadas | Una por token | Elegido de antemano, a menudo muy inferior al número de tokens | Fija dentro de una tarea: una por nivel (11 en el ejemplo de traducción del blog) |
| Lo que se produce | Tokens | Tokens | Códigos, convertidos en texto por un decodificador |
| Orden de la escritura | De izquierda a derecha | Todas las posiciones juntas | De lo grueso a lo fino |
| Disponibilidad | En todas partes | Un modelo utilizable: DiffusionGemma | Código y pesos publicados por los autores (GitHub y Hugging Face) |
| Madurez | Muy extendida | Investigación, un primer modelo publicado | Investigación, pruebas de pequeño tamaño |

Las pasadas se cuentan fácilmente: con el modelo de 16 GB del ejemplo y una lectura de 8,9 ms por pasada, un texto de 1 024 tokens exige 1 024 pasadas en modo autorregresivo. Si una pasada de difusión diera 16 tokens (valor **inventado** para la ilustración, cercano a los 15 a 20 de la ficha de DiffusionGemma), serían necesarias 64; con 11 niveles, NCM necesita 11.

```python
# Tiempo de lectura de los pesos por pasada: 16 GB / 1 792 GB/s
tiempo_por_pasada = 16 / 1792
# Tres escenarios, cada uno una pareja (nombre, número de pasadas); los dos últimos son
# hipótesis. 1024 // 16 es la división entera: 64 pasadas de 16 tokens
escenarios = (
    ("autorregresivo", 1024),
    ("difusión, 16 tokens por pasada", 1024 // 16),
    ("NCM, 11 niveles", 11),
)
# Recorremos cada escenario
for nombre, pasadas in escenarios:
    # Tiempo total de lectura de los pesos (sin cálculo) para este escenario
    print(nombre, pasadas, "pasadas ->", round(pasadas * tiempo_por_pasada, 3), "s")
```

Salida obtenida: 9,143 s, 0,571 s y 0,098 s. Atención: es un cálculo de **solo lectura**. Un modelo NCM de este tamaño no existe (el más grande tiene 725 millones de parámetros), y cada pasada hace más cálculo que una pasada autorregresiva, porque procesa muchas posiciones. La tabla muestra el **origen** de la ganancia esperada, no una ganancia medida.

## Resultados y límites

### Lo que midió NCM

Los autores comparan NCM, en una tarjeta [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) (tarjeta de centro de datos), con el **mejor modelo de difusión de texto**. **No comparan** la velocidad con un modelo autorregresivo: el anuncio « 10 a 31 veces más rápido » se refiere a la difusión, nunca a los LLM habituales.

[**ROUGE-L**](https://aclanthology.org/W04-1013/) es una puntuación que mide el solapamiento entre un resumen producido y un resumen de referencia escrito por una persona (se basa en la secuencia común más larga de palabras de ambos, en el mismo orden). La **perplejidad** mide hasta qué punto un texto « sorprende » a un modelo de lenguaje: cuanto más baja, más previsible es el texto para él. La **perplejidad generativa** aplica esta medida a los textos que un modelo acaba de generar, medida con otro modelo, llamado de referencia (artículo, anexo E.1). Los propios autores señalan que **no mide toda la calidad**: un texto plano y repetitivo puede obtener una buena perplejidad.

| Conjunto de prueba | Tarea | Resultado anunciado frente al mejor modelo de difusión |
|---|---|---|
| [LM1B](https://arxiv.org/abs/1312.3005) (conjunto de frases) | Generar texto | 21 veces más rápido, mejor perplejidad generativa |
| [OpenWebText](https://skylion007.github.io/OpenWebTextCorpus/) (textos de la web) | Generar texto | 10 veces más rápido, calidad comparable |
| [XSum](https://arxiv.org/abs/1808.08745) (resúmenes de artículos) | Resumir | 31 veces más rápido, con **ROUGE-L igual** |

Otros puntos señalados:

| Punto | Valor |
|---|---|
| Tamaños probados | 97 M, 317 M y 725 M de parámetros (M: millones), pruebas descritas como **preliminares** |
| Entrenamiento | 4 a 5 veces menos tokens que los modelos de difusión de referencia (4,9 veces en LM1B, 4 veces en OpenWebText, entrenamiento del tokenizador y del generador acumulados) |
| Traducción (conjunto de prueba [WMT14](https://www.statmt.org/wmt14/), alemán e inglés) y resumen | « Rendimiento similar o mejor » que los mejores modelos de difusión; ninguna comparación numérica con un autorregresivo |

### El Sudoku

Un Sudoku es una cuadrícula de 9 × 9 casillas que hay que rellenar con cifras del 1 al 9, sin repetir en cada fila, columna y **bloque** (uno de los nueve cuadrados de 3 × 3 casillas); las **pistas** son las cifras ya colocadas. Un programa clásico lo resuelve por [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) (ensayo y vuelta atrás). Aquí, los modelos deben escribir la cuadrícula. **MDLM** y **DUO** son dos modelos de difusión de referencia citados por el [artículo](https://arxiv.org/abs/2610.14162). La tabla da el porcentaje de cuadrículas **completamente resueltas**, por nivel de dificultad.

| Nivel | Autorregresivo | MDLM (difusión) | DUO (difusión) | NCM |
|---|---|---|---|---|
| Fácil (40 pistas) | 14,6 % | 92,0 % | 96,3 % | 99,5 % |
| Medio (35 pistas) | 5,1 % | 77,1 % | 84,7 % | 96,5 % |
| Difícil (30 pistas) | 1,0 % | 30,2 % | 58,4 % | 86,1 % |

NCM encabeza en cada nivel, con bastantes menos **evaluaciones** del modelo (número de pasadas completas por la red para producir una cuadrícula): 12 para NCM frente a 128 para el modelo autorregresivo (artículo, tabla 3). Este resultado concierne a una tarea **concreta** y no dice nada sobre la redacción de texto libre. El modelo autorregresivo comparado es un modelo pequeño de 25 millones de parámetros, entrenado para esta tarea (artículo, tabla 3). Leer « 86,1 % frente a 1,0 % » como « NCM es 86 veces mejor que los LLM » sería, por tanto, abusivo: nada lo asimila a un asistente comercial.

### DiffusionGemma

La ficha del modelo compara la variante **26B A4B** de [DiffusionGemma](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) con la variante del mismo nombre de Gemma 4, modelo autorregresivo de la misma familia (en ese nombre, 26B evoca el tamaño total y A4B el número de parámetros activos a la vez; la ficha da exactamente 25 200 millones en total y 3800 millones activos). Son modelos llamados **de mezcla de expertos**: la red contiene numerosas subredes especializadas (los expertos) y, para cada token, solo se activan algunas. Solo se leen sus pesos, de ahí la diferencia entre parámetros totales y parámetros activos. Las pruebas son concursos o cuestionarios estándar.

| Prueba | Contenido | Gemma 4 26B A4B | DiffusionGemma 26B A4B | Diferencia |
|---|---|---|---|---|
| [AIME](https://artofproblemsolving.com/wiki/index.php/American_Invitational_Mathematics_Examination) 2026 (sin herramientas) | Problemas de matemáticas de concurso | 88,3 % | 69,1 % | 19,2 puntos porcentuales perdidos |
| [LiveCodeBench](https://livecodebench.github.io/) v6 | Problemas de programación | 77,1 % | 69,1 % | 8,0 puntos perdidos |
| [Codeforces](https://codeforces.com/) (clasificación ELO) | Concursos de programación | 1718 | 1429 | 289 puntos perdidos |
| [GPQA](https://arxiv.org/abs/2311.12022) Diamond | Preguntas de ciencias difíciles | 82,3 % | 73,2 % | 9,1 puntos perdidos |
| [MMLU Pro](https://arxiv.org/abs/2406.01574) | Conocimientos variados | 82,6 % | 77,6 % | 5,0 puntos perdidos |

« Sin herramientas » significa que el modelo no puede llamar a una calculadora ni a código. El **ELO** es un sistema de clasificación: un número más alto indica un nivel mejor. La difusión es, por tanto, **utilizable hoy**, pero a costa de una calidad inferior en cada una de estas pruebas.

En cuanto a la velocidad, la ficha menciona 15 a 20 tokens por pasada y más de 1 100 tokens por segundo y por usuario, con lotes pequeños, en una H100 en FP8 (ficha consultada el 26/10/2026; FP8 es un formato de números de 8 bits). Un artículo secundario cita 1 107 tokens por segundo frente a 303 en autorregresivo, pero estas dos cifras concretas no aparecen en la ficha: están **no verificadas** y no hay que retenerlas.

### Consecuencia para el hardware

Si una pasada produce muchos tokens, cada peso leído sirve para **muchísimos más cálculos** antes de volver a leerse. El trabajo pasaría entonces de « limitado por el ancho de banda de memoria » a « limitado por el cálculo ». Es un razonamiento, no una medida de las fuentes leídas. Acerca el uso local a un proveedor que ya procesa lotes: los chips que contarían serían entonces los que calculan rápido, un terreno distinto al de los chips diseñados contra el cuello de botella de la memoria, como la LPU presentada en [TPU, NPU, LPU y VPU](/?c=infrastructure-devops&s=infrastructure&p=tpu-npu-lpu-vpu).

| | Autorregresivo, una conversación | Generación paralela (hipótesis) |
|---|---|---|
| Cuello de botella principal | Ancho de banda de memoria | Potencia de cálculo |
| Lo que ayuda | Memoria más rápida, pesos en memoria dentro del chip | Más unidades de cálculo |
| Lectura de los pesos | Una por token | Una por pasada |

## Lo que sigue siendo incierto

| Pregunta | Estado |
|---|---|
| ¿NCM escala a modelos de varios miles de millones de parámetros? | Desconocido: pruebas hasta 725 M, descritas como preliminares por los autores |
| ¿Cuánto vale NCM frente a un LLM autorregresivo, en velocidad y en calidad? | No medido en las fuentes leídas |
| ¿La jerarquía fija limita los textos? | Límite señalado por los autores, efectos no detallados aquí |
| ¿La perplejidad generativa refleja la calidad real? | No del todo, según los autores |
| ¿Son correctas las cifras de 1 107 y 303 tokens por segundo (DiffusionGemma, autorregresivo)? | No verificadas: ausentes de la ficha, que habla de más de 1 100 tokens por segundo |
| ¿La generación paralela se generaliza más allá de unas pocas tareas? | Desconocido: DiffusionGemma pierde entre 5,0 y 19,2 puntos porcentuales en cuatro pruebas y 289 puntos de ELO en Codeforces (ficha) |

El artículo se presentó el 9 de octubre de 2026, tres semanas antes de la redacción de este capítulo: los resultados de una publicación reciente y aislada se confirman o se corrigen a menudo después, por otros equipos.

## Fuentes consultadas

| Fuente | Dirección |
|---|---|
| Artículo de investigación, « Next-Concept Modeling: Fast, Parallel Coarse-to-Fine Text Generation » (9 de octubre de 2026) | [arxiv.org/abs/2610.14162](https://arxiv.org/abs/2610.14162) (arXiv: sitio público de depósito de artículos de investigación) |
| Blog de los autores (Hazy Research) | [hazyresearch.stanford.edu/blog/2026-10-12-ncm](https://hazyresearch.stanford.edu/blog/2026-10-12-ncm) |
| Ficha oficial de DiffusionGemma | [ai.google.dev/gemma/docs/diffusiongemma/model_card](https://ai.google.dev/gemma/docs/diffusiongemma/model_card?hl=es-419) |
| Código de NCM en [GitHub](/?c=git&p=github-et-plateformes) (plataforma de alojamiento de código) | [github.com/HazyResearch/ncm](https://github.com/HazyResearch/ncm) |
| Pesos de NCM (colección en Hugging Face, indicada por el README del repositorio) | [huggingface.co/hazyresearch](https://huggingface.co/hazyresearch) |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Leer « 31 veces más rápido » como « 31 veces más rápido que ChatGPT » | La medida compara NCM con el mejor modelo de **difusión**, nunca con un autorregresivo | Leer siempre el punto de comparación |
| Concluir el fin de los LLM actuales | Los resultados son puntuales, y DiffusionGemma pierde calidad en las cinco pruebas citadas de su ficha (diferencia de 5,0 a 19,2 puntos porcentuales, 289 puntos de ELO en Codeforces) | Presentar la generación paralela como una línea de investigación |
| Generalizar el Sudoku | Una tarea concreta no predice la calidad en texto libre | Citar la tarea junto con la cifra |
| Creer que « concepto » designa una idea | En NCM, es un código de un diccionario | Decir « código » |
| Fiarse solo de la perplejidad | No mide toda la calidad | Mirar también puntuaciones de tarea (ROUGE-L, resolución) |
| Tomar un techo de rendimiento por una medida | El cálculo de solo lectura ignora el cálculo y la memoria de contexto | Medir en la máquina real |
| Retomar una cifra de un artículo secundario | No figura en la ficha oficial (caso de 1 107 y 303 tokens/s) | Remontarse a la ficha o al artículo |
| Suponer que un modelo de investigación está listo para usar | Los pesos de NCM están publicados (README del repositorio, Hugging Face), pero son pruebas de pequeño tamaño (725 M como máximo) | Leer el README y los límites antes de probarlo |
| Confundir tamaño del modelo y velocidad | A igual tamaño, el número de lecturas de pesos decide el tiempo | Contar las pasadas |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Calcular primero el orden de magnitud tamaño × tokens ÷ ancho de banda | Saber si una lentitud viene de la memoria o del cálculo |
| Indicar la fuente y la fecha de toda cifra de velocidad | Las medidas cambian rápido y dependen de la tarjeta |
| Comparar modelos del mismo tipo en la misma tarea | Evitar comparaciones que no dicen nada |
| Mantener un LLM autorregresivo en producción mientras un modelo paralelo no alcance su calidad | Las pérdidas de DiffusionGemma están medidas |
| Distinguir proveedor (lotes) y uso local (una conversación) | El cuello de botella no es el mismo |
| Leer la sección « límites » de una publicación antes de su resumen | Los autores dicen ahí lo que no está demostrado |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un LLM **autorregresivo** escribe un token cada vez y relee todos sus pesos para cada uno: está limitado por el **ancho de banda de memoria**, no por el cálculo (modelo de 16 GB, 1 024 tokens, 1 792 GB/s: al menos 9,1 s). Un proveedor amortiza estas lecturas con **lotes**; un uso local con una sola conversación no puede hacerlo. La **difusión** reescribe todo el borrador en cada **pasada de eliminación de ruido** (DiffusionGemma, utilizable, pero con 19,2 y 8,0 puntos perdidos en AIME 2026 y LiveCodeBench v6); **NCM** codifica el texto mediante un VQ-VAE residual y multiescala, y genera por pasada un nivel de códigos, de lo grueso a lo fino (« 31 veces » medido frente a la difusión, Sudoku difícil 86,1 % frente a 1,0 %, pruebas hasta 725 M de parámetros). Si la generación paralela se generaliza, el cuello de botella pasaría de la memoria al cálculo. Tema de **investigación**. |
| **Trampas que evitar** | Confundir « más rápido que la difusión » con « más rápido que un LLM »; anunciar el fin de los LLM; generalizar el Sudoku; creer que un « concepto » es una idea; juzgar solo por la perplejidad; retomar una cifra sin fuente primaria. |
| **Buenas prácticas** | Estimar el cuello de botella con la fórmula tamaño × tokens ÷ ancho de banda; fechar y citar cada cifra; comparar en la misma tarea; mantener el autorregresivo en producción mientras la calidad no sea igual; leer los límites señalados por los autores. |
