---
order: 1
---

# Las grandes familias de fallos de seguridad

Un **fallo de seguridad** (o *vulnerabilidad*) es un defecto en un sistema (código, configuración, infraestructura) que permite a alguien hacer que actúe de forma distinta a la prevista. Un **ataque** es el intento de explotar ese fallo; un **exploit** es el código o método concreto usado para lograrlo.

```text
Fallo (el defecto) --explotado por--> Exploit (el metodo) --produce--> Ataque exitoso
```

## Quién ataca, y por qué

No todos los ataques vienen del mismo tipo de actor ni con el mismo objetivo:

| Actor | Motivación | Nivel de recursos |
|---|---|---|
| *Script kiddie* | Curiosidad, reputación, sin objetivo concreto | Bajo: usa herramientas ya hechas sin entenderlas a fondo |
| Cibercriminal | Beneficio económico (rescate, reventa de datos) | Variable, a menudo organizado |
| Hacktivista | Mensaje político o ideológico | Variable |
| Empleado malicioso (amenaza interna) | Venganza, beneficio personal | Acceso legítimo ya existente, a menudo el más peligroso |
| Actor estatal / APT (*Advanced Persistent Threat*) | Espionaje o sabotaje a largo plazo | Muy alto: busca discreción y paciencia |

## El zero-day: un fallo desconocido para el fabricante

Un fallo de seguridad suele seguir este ciclo de vida:

```text
Fallo introducido --> Descubierto --> Reportado al fabricante --> Corregido (parche) --> Desplegado a los usuarios
                          |
                          v
          Si se explota ANTES de ser reportado/corregido: es un "zero-day"
          (el fabricante tuvo "cero dias" para protegerse)
```

Un **zero-day** es, por tanto, un fallo explotado antes de que el fabricante del software siquiera lo conozca, y por tanto antes de que exista un parche. Es la situación más peligrosa para los usuarios: ninguna actualización puede protegerlos todavía. Una vez que el fallo se conoce y se corrige, cualquier sistema que no aplique el parche sigue expuesto, esta vez sin excusa: la información es pública, a menudo bajo un identificador **CVE** (*Common Vulnerabilities and Exposures*), un catálogo público de fallos conocidos, consultable en la [base de datos oficial de CVE](https://www.cve.org).

## Las grandes categorías de fallos en aplicaciones

| Categoría | Qué abarca | Ejemplo concreto |
|---|---|---|
| **Inyección** | Un dato no confiable se interpreta como una instrucción en vez de como un simple valor | Inyección [SQL](/?c=domain-specific-languages-dsl&p=sql), ya detallada junto a su solución en [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite) |
| **Autenticación deficiente** | Un mecanismo de inicio de sesión mal diseñado permite suplantar una identidad | Contraseña almacenada en texto plano (ver [Contraseñas y hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)) |
| **Control de acceso deficiente** | Un usuario accede a un recurso o acción que debería estarle prohibido | Editar el id en una URL (`/pedido/42` → `/pedido/43`) para ver el pedido de otro cliente, sin que el servidor vuelva a comprobar los permisos |
| **Configuración de seguridad incorrecta** | Un ajuste por defecto, demasiado permisivo u olvidado, abre un acceso no deseado | Panel de administración accesible sin autenticación, mensaje de error detallado expuesto en producción |
| **Fallo criptográfico** | Un secreto o dato sensible está mal protegido por el cifrado/hashing usado, o carece de él | Ver [Criptografía aplicada](/?c=cybersecurite&p=cryptographie-appliquee) |
| **Componentes vulnerables** | Una biblioteca o herramienta de terceros usada contiene a su vez un fallo conocido | Ver [Seguridad de las dependencias](/?c=cybersecurite&p=securite-des-dependances) |
| **Registro y monitorización insuficientes** | Un ataque en curso, o ya ocurrido, pasa desapercibido por falta de rastros utilizables | Ninguna alerta tras cientos de intentos fallidos de inicio de sesión en la misma cuenta |

Esta clasificación coincide en gran medida con el [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10), el referente estándar de la industria detallado al final de esta categoría.

## Cómo evitar dejarlos en tu propio código

Estas categorías comparten una raíz común: un dato o una situación tratados equivocadamente como confiables. Tres hábitos reducen la mayor parte de este riesgo, desarrollados en detalle en [Principios de desarrollo seguro](/?c=cybersecurite&p=principes-de-developpement-securise):

```text
// Pseudocodigo -- la misma trampa existe en cualquier lenguaje
consulta = "SELECT * FROM users WHERE nombre = '" + nombreIntroducidoPorUsuario + "'"
// Si nombreIntroducidoPorUsuario vale:  x'; DROP TABLE users; --
// la consulta realmente ejecutada ya no es la que el desarrollador preveia

consultaPreparada = "SELECT * FROM users WHERE nombre = ?"
ejecutar(consultaPreparada, [nombreIntroducidoPorUsuario])
// El dato sigue siendo un dato, nunca se interpreta como una instruccion
```

- No confiar nunca en un dato que venga del exterior (usuario, API de terceros, archivo importado) sin validarlo.
- Aplicar el **principio de mínimo privilegio**: un componente solo debe tener acceso a lo estrictamente necesario.
- Mantener las dependencias actualizadas, para no heredar un fallo ya corregido en otro lugar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un fallo de seguridad es un defecto explotable; un zero-day es un fallo explotado antes de ser conocido por el fabricante. Los fallos de aplicación se agrupan en unas pocas familias recurrentes (inyección, autenticación, control de acceso, configuración, criptografía, dependencias, registro). |
| **Herramientas utilizables** | La [base de datos CVE](https://www.cve.org) para seguir los fallos públicos conocidos. |
| **Errores a evitar** | Tratar un dato externo como confiable por defecto; dejar una dependencia o configuración por defecto sin revisar. |
| **Buenas prácticas** | Validar sistemáticamente cualquier dato externo; aplicar el principio de mínimo privilegio; mantener las dependencias actualizadas. |
