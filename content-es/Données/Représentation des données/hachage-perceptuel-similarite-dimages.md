---
order: 7
---

# El hash perceptual: reconocer imágenes similares, no idénticas

Una [función de hash criptográfico](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) tiene una propiedad precisa: cambiar un solo píxel de una imagen cambia por completo su resultado. Perfecto para detectar que un archivo ha sido alterado al bit, inútil para responder a una pregunta diferente: "¿estas dos fotos muestran lo mismo, aunque una haya sido recortada, recomprimida o ligeramente retocada?" Ese es el papel del **hash perceptual** (*perceptual hashing*, a menudo abreviado pHash): una función de hash diseñada para producir resultados **cercanos** cuando las imágenes son visualmente cercanas, al contrario que una función criptográfica o una [tabla hash](/?c=langages&s=c&p=tables-de-hachage) clásica.

| | Hash criptográfico | Hash perceptual |
|---|---|---|
| Objetivo | Detectar la más mínima alteración | Detectar un parecido visual |
| Cambia un píxel | Resultado totalmente diferente | Resultado casi idéntico |
| Dos imágenes visualmente cercanas | Resultados sin relación | Resultados cercanos (pocos bits diferentes) |
| Uso típico | Verificar la integridad de un archivo | Detectar duplicados, una imagen ya vista en otro lugar |

## El principio, versión simplificada: el *average hash* (aHash)

Uno de los métodos más simples reduce una imagen a una huella de 64 bits en cuatro pasos:

```text
1. Reducir la imagen a una rejilla minuscula (8x8 pixeles), en escala de grises
2. Calcular el brillo promedio de esos 64 pixeles
3. Para cada pixel: 1 si es mas claro que el promedio, 0 si es mas oscuro
4. Concatenar estos 64 bits: esa es la huella perceptual de la imagen
```

Reducir la imagen a una rejilla tan tosca elimina deliberadamente los detalles finos (compresión, ligero recorte, filtro de color) mientras conserva la estructura general clara/oscura de la imagen: dos fotos del mismo sujeto producen entonces una huella casi idéntica, incluso después de estas modificaciones.

## Comparar dos huellas: la distancia de Hamming

Dos huellas perceptuales se comparan contando el número de bits diferentes entre ellas (la **distancia de Hamming**):

```text
Imagen A : 1 0 1 1 0 0 1 0 ...
Imagen B : 1 0 1 1 0 1 1 0 ...
                    ↑
         1 solo bit diferente → imagenes casi identicas

Imagen C : 0 1 0 0 1 1 0 1 ...
         → casi todos los bits diferentes → imagenes sin relacion
```

Cuanto menor es la distancia, más cercanas son visualmente las dos imágenes; un umbral (por ejemplo, menos de 10 bits diferentes de 64) permite decidir automáticamente si dos imágenes cuentan como "la misma", sin nunca compararlas píxel por píxel.

## Para qué sirve

| Uso | Explicación |
|---|---|
| Detección de duplicados | Encontrar fotos ya presentes en una biblioteca, incluso recomprimidas o redimensionadas |
| Búsqueda de imagen inversa | Encontrar el origen de una imagen hallada en línea |
| Moderación de contenido | Bloquear automáticamente una imagen ya reportada, incluso republicada en un formato ligeramente diferente |

> **Trampa:** usar el hash perceptual como mecanismo de seguridad (autenticación, prueba de integridad). Está diseñado para tolerar pequeñas variaciones, no para resistir una manipulación deliberada: alguien que conozca el algoritmo puede modificar ligeramente una imagen para que produzca una huella diferente (o, al contrario, hacer coincidir la huella de dos imágenes distintas), algo que un hash criptográfico hace inviable por diseño.
>
> **Buena práctica:** reservar el hash perceptual para usos de similitud y deduplicación, nunca para un uso de seguridad; para verificar que un archivo no ha sido alterado, usar un hash criptográfico como SHA-256, que responde a una necesidad diferente.

## Resumen

| | |
|---|---|
| **Para recordar** | El hash perceptual produce huellas cercanas para imágenes visualmente cercanas, al contrario que un hash criptográfico que cambia radicalmente ante el menor píxel modificado. La distancia de Hamming entre dos huellas mide su parecido. |
| **Herramientas utilizables** | Varias bibliotecas de imágenes ya implementan aHash/pHash/dHash, sin tener que reescribir el algoritmo uno mismo. |
| **Trampas a evitar** | Usar un hash perceptual como mecanismo de seguridad o de prueba de integridad. |
| **Buenas prácticas** | Reservar el hash perceptual para la similitud/deduplicación; mantener un hash criptográfico para la integridad. |
