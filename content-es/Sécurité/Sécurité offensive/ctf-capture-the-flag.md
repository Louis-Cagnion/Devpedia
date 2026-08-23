---
order: 5
---

# El CTF: Capture The Flag

Un **CTF** (*Capture The Flag*) es una competición de seguridad informática en la que cada reto resuelto otorga una **flag**: una cadena de caracteres que demuestra que el reto se ha resuelto correctamente (ej.: `FLAG{d3sb0rd4m13nt0_d3_buff3r}`), que se envía a una plataforma para sumar puntos. Es el formato de entrenamiento más habitual para practicar legalmente las técnicas vistas en esta categoría, sobre programas diseñados a propósito para ser atacados en lugar de sobre un sistema real.

## Dos grandes formatos

| Formato | Principio |
|---|---|
| **Jeopardy** | Retos independientes, clasificados por categoría, cada uno con sus propios puntos; los participantes eligen libremente cuáles resolver |
| **Attack-defense** | Cada equipo recibe los mismos servicios que debe mantener en funcionamiento: tiene que defenderlos (corregir sus fallos) y a la vez atacar los de los demás equipos para robar sus flags, en tiempo real |

El formato jeopardy, más sencillo de organizar y de seguir en solitario, es con diferencia el más extendido para el aprendizaje individual; el attack-defense se acerca más a un ejercicio de equipo en condiciones casi reales.

## Las categorías clásicas de un CTF jeopardy

| Categoría | Qué cubre |
|---|---|
| **Pwn** | Explotación binaria: [corrupción de memoria](/?c=securite&s=securite-offensive&p=corruption-memoire) sobre un programa proporcionado |
| **Rev** | Ingeniería inversa ([desensamblador/depurador](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie)): entender un binario para extraer de él información oculta |
| **Web** | Fallos web clásicos, véase [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10) |
| **Crypto** | Atacar una implementación criptográfica mal hecha |
| **Forensics** | Recuperar información oculta en un archivo, una captura de red, una imagen de disco |
| **Misc** | Todo lo que no encaja en otra categoría (a menudo acertijos de lógica o de programación) |

## El vínculo con el pentest y el bug bounty

Un CTF comparte el espíritu del [pentest](/?c=cybersecurite&p=tests-et-audit-de-securite) (atacar un sistema con las técnicas de un atacante real) pero en un marco totalmente ficticio y deliberadamente vulnerable, en lugar de sobre un sistema real con un mandato escrito: es el lugar donde practicar sin plantearse el marco legal en cada paso, ya que el marco es el de la propia competición.

> **Buena práctica:** empezar por CTF orientados al aprendizaje (con una corrección o resolución detallada disponible después, llamada *write-up*) en lugar de competitivos, para progresar al propio ritmo sin la presión de la clasificación.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un CTF es una competición en la que cada reto resuelto otorga una flag. El formato jeopardy (retos independientes por categoría) domina el aprendizaje individual; el attack-defense (defender los propios servicios, atacar los de los demás en tiempo real) se acerca a un ejercicio de equipo. Las categorías clásicas coinciden con los capítulos de esta sección (pwn, rev, web, crypto) más forensics y misc. |
| **Herramientas utilizables** | Una plataforma de CTF de entrenamiento con write-ups disponibles para progresar tras un reto no resuelto. |
| **Errores a evitar** | Lanzarse a un CTF competitivo antes de haber practicado los fundamentos de cada categoría a la que se aspira. |
| **Buenas prácticas** | Leer el write-up de un reto no resuelto después de la competición en lugar de abandonar: suele ser la forma más rápida de progresar. |
