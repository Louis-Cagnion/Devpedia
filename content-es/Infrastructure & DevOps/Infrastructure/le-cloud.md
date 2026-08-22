---
order: 5
---

# ¿Qué es el cloud?

Ejecutar un programa o almacenar un dato requiere una máquina física en algún sitio. El **cloud** designa el uso de máquinas remotas, poseídas y gestionadas por un proveedor externo ([Amazon AWS](https://aws.amazon.com), [Google Cloud](https://cloud.google.com), [Microsoft Azure](https://azure.microsoft.com)...), en lugar de hardware comprado y gestionado por la propia empresa.

> **Analogía:** alquilar un apartamento amueblado en lugar de comprar y mantener tu propia casa: pagas por el uso, sin poseer ni ocuparte del mantenimiento de lo que hay detrás.

## Por qué alquilar en lugar de poseer tu propio servidor

| | Servidor propio (*on-premise*) | Cloud |
|---|---|---|
| Inversión inicial | Alta (comprar el hardware por adelantado) | Baja (pagar por el uso real) |
| Ajustar la capacidad | Limitada por el hardware ya comprado | En unos clics o minutos |
| Mantenimiento del hardware | A cargo de la empresa | A cargo del proveedor cloud |
| Coste con un uso constante y previsible en el tiempo | Puede salir más barato en total | Puede salir más caro en total |

## Las grandes categorías de servicios cloud

| Categoría | Gestionado por el proveedor | Gestionado por el usuario | Ejemplo |
|---|---|---|---|
| **IaaS** (*Infrastructure as a Service*) | Hardware físico, red | Sistema operativo, aplicaciones | Una máquina virtual alquilada |
| **PaaS** (*Platform as a Service*) | + sistema operativo, entorno de ejecución | Solo el código de la aplicación | Un servicio que ejecuta directamente código proporcionado |
| **SaaS** (*Software as a Service*) | Todo, incluida la aplicación | Nada, solo el uso | Un correo en línea, un software accesible por navegador |

Cuanto más arriba está una categoría en esta tabla, más control (y responsabilidad) conserva el usuario sobre lo que corre; cuanto más abajo está, más lo gestiona todo el proveedor, al precio de menos control.

## El cloud y la IA: alquilar potencia de cálculo bajo demanda

Entrenar un modelo de deep learning requiere una o varias [GPU](/?c=infrastructure&p=cpu-vs-gpu) potentes: un hardware costoso de comprar, y raramente usado a plena capacidad de forma continua una vez terminado el entrenamiento. El cloud permite alquilar esta potencia de cálculo solo durante la duración real del entrenamiento, en lugar de invertir en hardware dedicado que luego quedaría ampliamente sin usar.

## Trampa: ¿dónde están realmente almacenados mis datos?

> **Trampa:** suponer que un dato enviado "al cloud" permanece bajo el mismo control y las mismas reglas legales que si se quedara en las instalaciones de la empresa. En realidad está almacenado en hardware perteneciente a un tercero, a veces ubicado en un país diferente, con sus propias reglas en materia de protección de datos.
>
> **Buena práctica:** verificar las condiciones contractuales y la ubicación geográfica de los datos antes de enviar un dato sensible a un servicio cloud (ver la [clasificación de datos antes del envío](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)), en lugar de suponerlo neutro por defecto.

## Trampa: el coste puede escapar al control habitual

> **Trampa:** olvidar apagar un recurso cloud alquilado después de usarlo (una máquina virtual, una GPU reservada). La facturación continúa mientras el recurso siga corriendo, incluso sin usarse: ninguna alerta de "error" se dispara porque técnicamente todo funciona como estaba previsto.
>
> **Buena práctica:** implementar alertas de coste, o incluso un apagado automático de los recursos no usados, en lugar de contar con una verificación manual regular.

## Resumen

| | |
|---|---|
| **Para recordar** | El cloud consiste en alquilar máquinas remotas gestionadas por un proveedor externo, en lugar de poseer tu propio hardware. IaaS, PaaS y SaaS se distinguen por lo que el proveedor gestiona en lugar del usuario. |
| **Herramientas utilizables** | Los principales proveedores (AWS, Google Cloud, Azure) ofrecen paneles de coste y alertas configurables. |
| **Trampas a evitar** | Suponer que un dato enviado al cloud sigue sujeto a las mismas reglas que internamente. Dejar un recurso alquilado corriendo innecesariamente después de usarlo. |
| **Buenas prácticas** | Verificar la ubicación y las condiciones contractuales antes de enviar un dato sensible. Configurar alertas de coste o un apagado automático de los recursos no usados. |
