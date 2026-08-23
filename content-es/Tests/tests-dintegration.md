---
order: 5
---

# Las pruebas de integración

El capítulo sobre las [pruebas unitarias](/?c=tests&p=tests-unitaires) aísla una función de todo lo que la rodea. Pero un programa que funciona correctamente función por función puede fallar aun así una vez que esas funciones se ensamblan: es exactamente lo que cubren las pruebas de integración, el nivel intermedio de la [pirámide de pruebas](/?c=tests&p=pyramide-de-test).

## Lo que una prueba de integración verifica además

Una prueba de integración verifica que varios componentes **funcionan correctamente juntos**, generalmente implicando al menos una dependencia real (una base de datos real, una llamada de red real a un servicio, un sistema de archivos real) en lugar de un test double.

```text
Prueba unitaria:
  la función registrarUsuario() llama correctamente a
  baseDeDatos.insertar() con los argumentos correctos
  -> baseDeDatos es un test double (mock), nada se escribe realmente

Prueba de integración:
  registrarUsuario() escribe realmente una fila en una
  base de datos de prueba real, que luego se relee para
  verificar que coincide con los datos esperados
  -> verifica que el código y la base de datos realmente concuerdan
```

Una prueba unitaria puede pasar mientras una prueba de integración falla sobre el mismo código: por ejemplo, si la función llama correctamente a la base de datos, pero con una consulta [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) sintácticamente inválida que el mock nunca detecta.

## Dónde trazar el límite: qué componentes incluir

No existe una definición universal y estricta de qué cuenta como "integración": el límite depende de lo que se elija probar realmente en lugar de simular.

| Componentes implicados | Tipo de prueba |
|---|---|
| Una sola función, todo lo demás simulado | Unitaria |
| La función + una base de datos de prueba real | Integración (base de datos) |
| La función + una llamada real a una API externa | Integración (servicio externo) |
| Toda la aplicación, desde el clic del usuario hasta la respuesta final | End-to-end (capítulo siguiente) |

> **Trampa:** llamar "prueba de integración" a una prueba que en realidad simula todas sus dependencias con mocks muy detallados. Sin ninguna dependencia real implicada, esa prueba sigue siendo una prueba unitaria disfrazada, con la lentitud de una prueba de integración pero sin su beneficio real.
>
> **Buena práctica:** una prueba de integración debe implicar al menos una dependencia externa real (base de datos, servicio, sistema de archivos); de lo contrario, es una prueba unitaria, aunque lo parezca.

## Una base de datos de prueba, nunca la de producción

Las pruebas de integración que implican una base de datos necesitan su propia instancia, separada de la producción, generalmente recreada antes de cada ejecución para partir de un estado conocido (ver los [fixtures](/?c=tests&p=architecture-de-test) ya vistos en el capítulo de arquitectura de pruebas).

```text
Antes de cada prueba:
  1. Recrear la base de datos de prueba (vacía o con datos
     de partida conocidos)
  2. Ejecutar la prueba (que escribe/lee en esa base de datos)
  3. Verificar el resultado

-> Ningún dato de una prueba debe sobrevivir para contaminar la siguiente
```

> **Trampa:** ejecutar las pruebas de integración contra la base de datos de producción, por simplicidad o falta de tiempo para montar una dedicada. Una prueba que escribe datos realmente puede entonces corromper o contaminar datos reales.
>
> **Buena práctica:** usar siempre una base de datos (o un servicio) de prueba completamente separada de la producción, aunque su puesta en marcha requiera un esfuerzo inicial.

## Un nivel más lento, a usar con criterio

Una prueba de integración cuesta más que una prueba unitaria: arrancar una base de datos real, esperar una respuesta de red real, lleva tiempo. Ese coste es precisamente lo que justifica, en la pirámide de pruebas, tener menos de ellas que pruebas unitarias: reservadas a los puntos de unión entre componentes, donde una prueba unitaria por sí sola no puede dar confianza.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una prueba de integración verifica que varios componentes funcionan correctamente juntos, implicando al menos una dependencia externa real (base de datos, servicio, archivo), a diferencia de una prueba unitaria que simula todo. Usa una base de datos de prueba separada, nunca la de producción. |
| **Herramientas utilizables** | Una base de datos de prueba recreada antes de cada ejecución. Una tabla de componentes implicados para distinguir una prueba unitaria de una de integración. |
| **Trampas a evitar** | Llamar "integración" a una prueba que en realidad simula todas sus dependencias. Ejecutar pruebas contra la base de datos de producción. |
| **Buenas prácticas** | Implicar al menos una dependencia externa real en una prueba de integración. Usar una base de datos de prueba completamente separada de la producción. |
