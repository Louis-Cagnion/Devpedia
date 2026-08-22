---
order: 4
---

# Evaluador de expresiones aritméticas: gestionar la precedencia de operadores

Evaluar una cadena como `"2 + 3 * 4"` exige más que un simple recorrido de izquierda a derecha: la multiplicación debe efectuarse antes que la suma (resultado `14`, no `20`), y los paréntesis pueden forzar un orden distinto. Escribir este pequeño intérprete es un ejercicio clásico, a menudo el primer ladrillo antes de un intérprete más amplio (ver [Parsing incremental por máquina de estados](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) para otra familia de formato a interpretar).

## El problema: leer de izquierda a derecha no basta

```text
"2 + 3 * 4"

Lectura ingenua izquierda->derecha:   (2 + 3) * 4 = 20   -> incorrecto
Con precedencia de operadores:        2 + (3 * 4) = 14   -> correcto
```

Una evaluación correcta debe conocer la **precedencia** de cada operador (`*`/`/` antes que `+`/`-`) incluso antes de empezar a calcular nada.

## Dos etapas: tokenizar y luego evaluar

La cadena original nunca se evalúa carácter por carácter: primero se divide en una lista de **tokens** (números y operadores), como hace todo intérprete (ver la tokenización de un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), el mismo principio aplicado a texto natural en lugar de a una expresión).

```python
import re

def tokenizar(expresion):
    return re.findall(r"\d+\.?\d*|[()+\-*/]", expresion)

tokenizar("2 + 3 * 4")       # ['2', '+', '3', '*', '4']
tokenizar("(2 + 3) * 4")     # ['(', '2', '+', '3', ')', '*', '4']
```

## Respetar la precedencia: una función por nivel

La técnica más directa codifica cada nivel de precedencia en su propia función, cada una llamando al nivel inmediatamente superior antes de tratar su propio operador, una función que llama a los paréntesis y luego se llama a sí misma para gestionar una expresión anidada:

```text
expresion := termino (('+' | '-') termino)*
termino    := factor (('*' | '/') factor)*
factor     := NUMERO | '(' expresion ')'
```

```python
class Evaluador:
    def __init__(self, tokens):
        self.tokens = tokens
        self.posicion = 0

    def token_actual(self):
        return self.tokens[self.posicion] if self.posicion < len(self.tokens) else None

    def expresion(self):
        resultado = self.termino()
        while self.token_actual() in ("+", "-"):
            operador = self.tokens[self.posicion]
            self.posicion += 1
            derecha = self.termino()
            resultado = resultado + derecha if operador == "+" else resultado - derecha
        return resultado

    def termino(self):
        resultado = self.factor()
        while self.token_actual() in ("*", "/"):
            operador = self.tokens[self.posicion]
            self.posicion += 1
            derecha = self.factor()
            resultado = resultado * derecha if operador == "*" else resultado / derecha
        return resultado

    def factor(self):
        token = self.token_actual()
        if token == "(":
            self.posicion += 1          # consume '('
            resultado = self.expresion()
            self.posicion += 1          # consume ')'
            return resultado
        self.posicion += 1
        return float(token)

Evaluador(tokenizar("2 + 3 * 4")).expresion()        # 14.0
Evaluador(tokenizar("(2 + 3) * 4")).expresion()      # 20.0
```

`expresion()` trata el nivel de menor precedencia (`+`/`-`) pero delega cada operando a `termino()`, que primero agota todo lo prioritario (`*`/`/`) antes de devolver el control: es este orden de llamadas, no una comparación explícita de prioridades, lo que garantiza que la multiplicación se calcule antes que la suma. Un paréntesis encontrado en `factor()` relanza `expresion()` desde el nivel más bajo, lo que gestiona de forma natural cualquier profundidad de anidamiento.

> **Trampa:** hacer avanzar `self.posicion` de forma independiente en varias funciones sin que ninguna sea la fuente única de verdad sobre "dónde estamos" en la lista de tokens. Una sola variable de estado compartida (aquí `self.posicion`, un atributo de la instancia) debe avanzar de forma coherente, sin importar qué función consuma el token actual: dos posiciones que divergen producen un desfase de lectura difícil de diagnosticar.
>
> **Buena práctica:** avanzar `self.posicion` en el momento exacto en que se consume un token, nunca antes ni después, y no leerlo nunca dos veces para la misma decisión.

## Otro enfoque: conversión a notación polaca inversa

Una alternativa extendida, el algoritmo *shunting-yard* (Dijkstra), convierte primero la expresión a notación postfija (`2 3 4 * +`) mediante una pila de operadores, antes de evaluarla con una segunda pila de operandos. El resultado final es idéntico; la elección entre ambas técnicas es sobre todo una cuestión de preferencia de implementación (recursión frente a pilas explícitas) más que una diferencia de capacidad.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una expresión se tokeniza primero (números/operadores separados), y luego se evalúa mediante una función por nivel de precedencia, cada una delegando en la siguiente antes de tratar su propio operador. Un paréntesis relanza la evaluación desde el nivel más bajo. |
| **Herramientas utilizables** | Una expresión regular para la tokenización; una función por nivel de precedencia (descenso recursivo) o el algoritmo shunting-yard (pilas explícitas) para la evaluación en sí. |
| **Trampas a evitar** | Evaluar de izquierda a derecha sin tener en cuenta la precedencia de los operadores. Hacer avanzar la posición en los tokens desde varios lugares sin una fuente única de verdad. |
| **Buenas prácticas** | Hacer que la precedencia la determine el orden de llamadas entre funciones (`expresion` -> `termino` -> `factor`), no una comparación explícita de prioridades numéricas. |
