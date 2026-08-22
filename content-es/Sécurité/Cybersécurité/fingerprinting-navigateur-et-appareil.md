---
order: 12
---

# El fingerprinting: reconocer un dispositivo sin almacenar nada en él

Un sitio suele reconocer a un visitante depositando un identificador en una [cookie](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) en su dispositivo, y luego releyéndolo en cada visita. El **fingerprinting** (o "toma de huella") alcanza un objetivo parecido —reconocer el mismo dispositivo de una visita a otra— pero sin almacenar nada en absoluto: combina una serie de detalles técnicos ya expuestos por el navegador para formar una firma casi única.

## El principio: combinar detalles anodinos, poco únicos individualmente

Tomados por separado, ninguno de los siguientes detalles identifica a nadie: millones de personas comparten la misma resolución de pantalla, o el mismo huso horario. Pero su **combinación** se vuelve rápidamente única:

| Detalle recopilado | Ejemplo de valor |
|---|---|
| Resolución de pantalla | 1920×1080 |
| Huso horario | Europe/Paris |
| Idioma del navegador | es-ES |
| Versión del navegador y del SO | Chrome 128 en Windows 11 |
| Fuentes instaladas | Lista de 340 fuentes detectadas |
| Renderizado gráfico (Canvas/WebGL) | Huella de píxeles propia de la tarjeta gráfica |

```text
Resolucion + Huso horario + Idioma + Navegador + Fuentes + Renderizado grafico
        ↓ (combinados y reducidos a un valor unico, mediante hash)
                    "huella" casi unica del dispositivo
```

> **Analogía:** ninguna de las medidas de una persona (estatura, talla de calzado, color de ojos) la identifica por sí sola entre millones de individuos, pero su combinación precisa reduce el campo a muy poca gente. El fingerprinting hace lo mismo con características técnicas del navegador.

## El canvas fingerprinting: un ejemplo concreto

Una técnica muy utilizada consiste en hacer que el navegador dibuje, en un elemento invisible de la página, un texto o una forma geométrica precisa, y luego releer los píxeles obtenidos. El resultado exacto depende de la tarjeta gráfica, del controlador y del motor de renderizado de fuentes instalado, de modo que dos máquinas diferentes producen casi siempre un resultado ligeramente distinto, incluso a partir del mismo código:

```text
1. El sitio pide al navegador: "dibuja este texto en una zona oculta"
2. El navegador dibuja, usando su tarjeta grafica y sus fuentes
3. El sitio relee los pixeles obtenidos, pixel por pixel
4. Estos pixeles se reducen a una huella unica (hash)
5. Esta huella identifica la maquina, sin haber almacenado nada en ella
```

## Por qué existe esta técnica

| Uso | Explicación |
|---|---|
| Lucha contra el fraude | Reconocer un dispositivo ya baneado incluso tras eliminar sus cookies o pasar a navegación privada |
| Detección de bots | Un navegador real produce una huella coherente y estable; un robot de automatización suele producir una huella incoherente o ausente |
| Publicidad dirigida | Seguir a un visitante de un sitio a otro, incluso si este rechaza o elimina las cookies |

> **Trampa:** creer que rechazar las cookies o navegar en modo privado impide todo seguimiento. El fingerprinting no depende de ninguna cookie: no almacena nada en el dispositivo, por lo tanto nada que eliminar ni que rechazar mediante un simple banner de consentimiento de cookies.
>
> **Buena práctica (desarrollador):** reservar el fingerprinting para usos defensivos justificados (antifraude, antibots) y documentados, nunca como forma discreta de eludir un rechazo de seguimiento expresado por otra vía (cookies rechazadas). Un uso publicitario disfrazado se expone al mismo marco legal que el seguimiento por cookies, con un rastro mucho más difícil de justificar a posteriori ante un usuario o un regulador.
>
> **Buena práctica (usuario):** algunos navegadores (Firefox, Safari) reducen activamente la precisión de la huella disponible (resultados de canvas ligeramente aleatorizados, menos detalles expuestos por defecto); una extensión de bloqueo de fingerprinting puede complementar esta protección.

## Resumen

| | |
|---|---|
| **Para recordar** | El fingerprinting reconoce un dispositivo combinando detalles técnicos ya expuestos por el navegador (pantalla, huso horario, fuentes, renderizado gráfico), sin almacenar nada en él — a diferencia de una cookie. |
| **Herramientas utilizables** | Las protecciones antifingerprinting integradas en Firefox/Safari, o una extensión dedicada. |
| **Trampas a evitar** | Creer que eliminar las cookies o navegar en privado impide todo seguimiento. |
| **Buenas prácticas** | Reservar el fingerprinting para usos defensivos justificados (fraude, bots) en lugar de para eludir discretamente un rechazo de seguimiento. |
