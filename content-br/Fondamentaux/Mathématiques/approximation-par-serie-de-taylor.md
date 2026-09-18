---
order: 7
---

# A aproximação por série de Taylor

Uma **série de Taylor** aproxima uma função matemática complicada (`sin`, `cos`, `exp`...) por uma soma de termos cada vez mais precisos, calculáveis apenas com somas e multiplicações: útil quando a função nativa (`<math.h>`) não está disponível, ou para entender como ela é calculada internamente.

## O princípio: somar termos cada vez mais precisos

O desenvolvimento em série de `cos(x)` se escreve:

```text
cos(x) ≈ 1 - x²/2! + x⁴/4! - x⁶/6! + ...
```

Cada termo adicional refina a aproximação; quanto mais termos são somados, mais o resultado se aproxima do valor real de `cos(x)`. Na prática, apenas alguns termos (5, por exemplo) já bastam para uma precisão amplamente suficiente para um uso visual (coloração, animação).

## Calcular cada termo a partir do anterior

Calcular um fatorial (`6! = 720`) a cada termo, a cada chamada, seria redundante. Cada termo é deduzido do anterior por uma simples multiplicação, sem nunca recalcular um fatorial do zero:

```c
double cosseno(double x, int numeroDeTermos)
{
    double resultado = 1.0;
    double termo = 1.0;

    for (int i = 1; i <= numeroDeTermos; i++) {
        termo *= -x * x / ((2 * i - 1) * (2 * i)); // deduzido do termo anterior
        resultado += termo;
    }
    return resultado;
}
```

> **Nota:** `termo *= -x * x / ((2*i-1) * (2*i))` faz passar de um termo ao seguinte em uma única operação: o sinal alterna (`-x*x`), e dividir por `(2i-1)*(2i)` equivale a multiplicar progressivamente o denominador pelos dois fatores que faltam do fatorial seguinte, sem nunca recalculá-lo por completo.

> **Boa prática:** usar a função nativa (`cos()` de `<math.h>`) assim que ela estiver disponível: mais precisa e já otimizada. Reimplementá-la por série de Taylor só faz sentido quando a biblioteca padrão está indisponível ou proibida (restrição de um exercício, ambiente embarcado mínimo).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma série de Taylor aproxima uma função por uma soma de termos; cada termo adicional melhora a precisão, e um número limitado de termos costuma bastar para um uso prático. |
| **Ferramentas utilizáveis** | Deduzir cada termo do anterior por uma multiplicação, em vez de recalcular um fatorial a cada vez. |
| **Armadilhas a evitar** | Recalcular um fatorial completo a cada termo em vez de deduzi-lo progressivamente do anterior. |
| **Boas práticas** | Preferir a função nativa da biblioteca padrão assim que estiver disponível; reservar a reimplementação por série a um contexto que realmente a exija. |
