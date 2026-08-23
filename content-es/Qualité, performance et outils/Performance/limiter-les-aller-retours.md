---
order: 3
---

# Limitar las idas y vueltas

Cuando dos componentes se comunican (su código y una base de datos, su código y un navegador, un cliente y un servidor), cada intercambio tiene un **coste fijo** independiente de la cantidad de datos transportada: serialización, cruce de proceso, latencia de red. Ese coste es pequeño (unos milisegundos), y eso es precisamente lo que lo vuelve peligroso: se vuelve enorme por multiplicación.

## El patrón a reconocer

El síntoma es siempre el mismo: un bucle que, en cada vuelta, vuelve a pedir algo al otro componente.

```python
# 3 idas y vueltas por anuncio
for i in range(numero_de_tarjetas):
    tarjeta = pagina.elemento(i)        # 1
    enlace = tarjeta.atributo("href")   # 2
    texto = tarjeta.texto()             # 3
```

Sobre 100 elementos, eso hace 300 intercambios. A 30 ms la ida y vuelta, se alcanzan 9 segundos, para un trabajo que no requiere ningún cálculo.

## Traer todo de una sola vez

La corrección consiste en trasladar el bucle **al lado donde están los datos**, y hacer un único intercambio:

```python
# 1 ida y vuelta, sea cual sea el numero de anuncios
tarjetas = pagina.evaluar("""() => Array.from(document.querySelectorAll('article')).map(tarjeta => ({
    href: tarjeta.querySelector('a')?.getAttribute('href'),
    texto: tarjeta.innerText,
}))""")

for tarjeta in tarjetas:                      # procesamiento local, gratuito
    analizar(tarjeta["href"], tarjeta["texto"])
```

La ganancia es **proporcional al volumen**: insignificante en 10 elementos, decisiva en 1000. Es una optimización que a menudo se justifica menos por la ganancia inmediata que por el hecho de que elimina una pendiente: el programa deja de ralentizarse linealmente a medida que crecen los datos.

## Es el mismo problema que el N+1 en base de datos

Este patrón tiene nombre en el mundo de las bases de datos: el **problema N+1**. Una consulta para recuperar una lista, luego una consulta por elemento:

```php
$clientes = $bd->query("SELECT id, nombre FROM clientes")->fetchAll();
foreach ($clientes as $cliente) {
    // 1 consulta SQL por cliente: ahi esta el "+N"
    $pedidos = $bd->query("SELECT * FROM pedidos WHERE cliente_id = {$cliente['id']}");
}
```

La corrección es estructuralmente idéntica: un único intercambio que trae todo:

```sql
SELECT c.id, c.nombre, p.*
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id;
```

Ver la sección [SQL](/?c=domain-specific-languages-dsl&p=sql) para los joins, y el capítulo [Conexiones](/?c=langages-de-programmation&s=php&p=connexions) de [PHP](/?c=langages-de-programmation&s=php&p=php) para `PDO`.

> De paso, escribir una consulta por elemento concatenando una variable en la cadena SQL acumula dos problemas: la lentitud **y** la inyección SQL. Las consultas preparadas resuelven el segundo, el join el primero.

## El mismo razonamiento en otros lugares

El patrón se encuentra en todas partes donde hay una frontera que cruzar:

- **API HTTP**: preferir un endpoint que acepte una lista de identificadores en lugar de llamar *n* veces al endpoint unitario;
- **Sistema de archivos**: leer un archivo de una sola vez en lugar de carácter por carácter (es el rol de los buffers, ver [Llamadas al sistema y descriptores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) en [C](/?c=langages-de-programmation&s=c&p=c));
- **DOM**: acumular las modificaciones y luego aplicarlas, en lugar de modificar el documento dentro de un bucle: cada escritura puede desencadenar un recálculo de layout.

## Saber cuándo no hacerlo

Traer todo de una sola vez tiene un límite: la **memoria**. Una consulta que trae un millón de filas de golpe puede saturar la memoria del proceso, mientras que el bucle ingenuo, en cambio, resistía. Entre los dos extremos se encuentra el procesamiento **por lotes**: mil elementos por intercambio en lugar de uno solo o un millón.

```python
for lote in dividir_en_lotes(identificadores, tamano=1000):
    resultados = servicio.recuperar_varios(lote)
```

La pregunta correcta no es entonces "¿un único intercambio o *n*?" sino "¿cuál es el lote más grande que puedo procesar sin riesgo?".

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada intercambio entre dos componentes (red, base de datos, DOM) tiene un coste fijo independiente del volumen: un bucle que vuelve a pedir algo en cada vuelta ("N+1") multiplica ese coste fijo por el número de elementos. |
| **Herramientas utilizables** | Traer todos los datos en un único intercambio (join SQL, evaluación agrupada del lado de la página), procesamiento por lotes para volúmenes muy grandes. |
| **Trampas a evitar** | Una consulta por elemento dentro de un bucle (problema N+1); traer un volumen tan grande que sature la memoria del proceso. |
| **Buenas prácticas** | Trasladar el bucle al lado donde están los datos en lugar de hacer idas y vueltas repetidas; dividir en lotes de tamaño razonable entre "un único intercambio" y "uno por elemento". |
