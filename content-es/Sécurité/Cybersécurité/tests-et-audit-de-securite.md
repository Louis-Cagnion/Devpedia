---
order: 10
---

# Pruebas y auditoría de seguridad

Una prueba funcional clásica verifica que un programa hace lo que se supone que debe hacer; una prueba de seguridad verifica, además, que **no hace nada más** de lo previsto, incluso ante una entrada deliberadamente maliciosa. Varias familias de herramientas y métodos cubren este objetivo, en distintos momentos del ciclo de desarrollo.

## SAST: analizar el código sin ejecutarlo

El **SAST** (*Static Application Security Testing*) analiza el propio código fuente, sin ejecutarlo, buscando patrones conocidos como peligrosos: una consulta [SQL](/?c=domain-specific-languages-dsl&p=sql) construida por concatenación en lugar de una consulta preparada, un secreto fijo en el código (ver [Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets)), una función de hashing inadecuada para una contraseña (ver [Contraseñas y hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)).

```text
Codigo fuente  -->  Analizador SAST  -->  Lista de patrones de riesgo detectados,
(nunca se ejecuta)                        con el archivo y la linea correspondientes
```

Como nunca ejecuta el código, una herramienta SAST se integra pronto y automáticamente, por ejemplo en cada `git push` dentro de un [pipeline de CI/CD](/?c=ci-cd&p=pipeline-cicd), incluso antes de que corra una prueba funcional.

## DAST: atacar la aplicación en funcionamiento

El **DAST** (*Dynamic Application Security Testing*) hace lo contrario: lanza realmente la aplicación (normalmente una API o un sitio web desplegado en un entorno de pruebas) y le envía solicitudes diseñadas para revelar un fallo, exactamente como lo haría un atacante, pero de forma automatizada y sistemática.

| | SAST | DAST |
|---|---|---|
| Qué examina | El código fuente | La aplicación en ejecución |
| Momento típico | Temprano, en cada cambio de código | En un entorno desplegado (pruebas, preproducción) |
| Detecta | Patrones de código de riesgo | Un comportamiento realmente explotable, incluidos fallos de configuración invisibles solo con el código |
| Limitación | Puede señalar un patrón de riesgo que en realidad no es explotable (falso positivo) | Solo cubre las rutas de la aplicación realmente ejercitadas durante la prueba |

## El fuzzing: bombardear un programa con entradas inesperadas

El **fuzzing** consiste en enviar a un programa una gran cantidad de entradas aleatorias, malformadas o límite (cadenas extremadamente largas, caracteres especiales, valores fuera de rango), con la esperanza de provocar un fallo, una excepción no gestionada, o un comportamiento revelador de un problema:

```text
Programa objetivo: analizador de archivos CSV

Entradas probadas automaticamente por el fuzzer:
  ""                          (vacia)
  "a,b,c\n" * 1000000         (archivo enorme)
  "\x00\xFF\x00\xFF"          (bytes no textuales)
  "a,\"b\nc\",d"               (comillas y salto de linea anidados)

-> Si alguna de estas entradas hace fallar al analizador, el fuzzer
   aisla la entrada exacta responsable, para corregirla antes de que
   un archivo malicioso real produzca el mismo efecto en produccion.
```

Un fallo provocado por una entrada no prevista suele ser el síntoma de un problema más amplio (desbordamiento de memoria, denegación de servicio) que una simple relectura del código pasaría por alto.

## El pentest: un ataque simulado por un profesional

Una **prueba de intrusión** (*pentest*, *penetration testing*) consiste en contratar a una persona o equipo para atacar realmente un sistema, con las mismas técnicas que usaría un atacante real, pero dentro de un marco legal definido de antemano:

| Elemento del marco | Función |
|---|---|
| Alcance (*scope*) | Define con precisión qué se puede probar (qué sistemas, qué técnicas), para no impactar nunca un sistema fuera del alcance |
| Reglas de compromiso | Fija los límites (horarios permitidos, técnicas prohibidas como una denegación de servicio real) |
| Informe final | Enumera los fallos encontrados, su gravedad, y recomendaciones para corregirlos |

> **Error común:** confundir un pentest autorizado con una intrusión real. Sin un mandato escrito y un alcance definido de antemano, la misma acción es ilegal, incluso con buenas intenciones.

### El bug bounty: una variante abierta y continua

Un **programa de bug bounty** invita a cualquier investigador de seguridad externo a reportar un fallo encontrado dentro de un alcance definido, a cambio de una recompensa proporcional a su gravedad. A diferencia de un pentest puntual realizado por un equipo contratado, permanece abierto de forma continua, lo que multiplica el número y la diversidad de personas buscando activamente un fallo.

## Dónde encajan la auditoría de dependencias y el seguimiento de CVE

La auditoría de bibliotecas de terceros (`npm audit`, `pip-audit`, ya detallada en [Seguridad de las dependencias](/?c=cybersecurite&p=securite-des-dependances)) y el seguimiento de identificadores [CVE](/?c=cybersecurite&p=types-de-failles) complementan estos métodos: SAST/DAST/fuzzing/pentest buscan fallos **en el código escrito por el propio proyecto**, mientras que la auditoría de dependencias busca fallos **ya conocidos en código escrito por otros**, reutilizado por el proyecto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El SAST analiza el código sin ejecutarlo; el DAST ataca la aplicación en funcionamiento; el fuzzing bombardea un programa con entradas inesperadas para provocar un fallo revelador; un pentest es un ataque simulado por un profesional contratado, dentro de un alcance definido. |
| **Herramientas utilizables** | Un analizador SAST/DAST integrado en el pipeline de CI/CD, un fuzzer, un programa de bug bounty para vigilancia continua. |
| **Errores a evitar** | Confundir un pentest autorizado con una intrusión real; probar la seguridad una sola vez, en lugar de un control continuo en cada cambio. |
| **Buenas prácticas** | Integrar el SAST en el pipeline de CI/CD, desde el primer commit; definir un alcance y reglas de compromiso escritas antes de cualquier pentest. |
