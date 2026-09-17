---
order: 6
---

# Fractais por tempo de escape: Mandelbrot e Julia

Uma **fractal por tempo de escape** colore cada pixel de uma imagem conforme a rapidez com que uma sequência de números associada a esse pixel "escapa" rumo ao infinito, ou nunca escapa.

## O princípio: iterar e contar

Para Mandelbrot, cada pixel da imagem é transformado em um número complexo `c` (sua posição no plano). Itera-se então a fórmula `z = z² + c`, partindo de `z = 0`:

```text
z0 = 0
z1 = z0² + c
z2 = z1² + c
z3 = z2² + c
...
```

Se o módulo de `z` (sua distância à origem) ultrapassar um limiar fixo (o **raio de escape**, geralmente `2`), a sequência "escapa": ela nunca mais voltará atrás e crescerá indefinidamente. O número de iterações realizadas antes desse escape determina a cor do pixel; se `z` nunca escapa antes de um número máximo de iterações fixado, o pixel pertence ao **conjunto de Mandelbrot** e é colorido de preto.

```text
Para cada pixel (convertido em um numero complexo c):
    z = 0
    iteracoes = 0
    enquanto |z| <= raio_de_escape E iteracoes < max_iteracoes:
        z = z*z + c
        iteracoes += 1
    cor do pixel = funcao(iteracoes)
```

## Mandelbrot vs Julia

| | Mandelbrot | Julia |
|---|---|---|
| `c` | Vira a posição do pixel | Fixo, escolhido uma vez para a imagem toda |
| `z` inicial | Sempre `0` | Vira a posição do pixel |
| Resultado | Uma única imagem, o mesmo "mapa" sempre | Uma imagem diferente para cada valor de `c` escolhido |

Julia usa exatamente o mesmo laço de iteração que Mandelbrot; só muda a atribuição inicial de `c` e `z`.

## Evitar uma raiz quadrada a cada iteração

Calcular o módulo exato de `z` (`√(parte_real² + parte_imaginaria²)`) a cada iteração exigiria uma raiz quadrada por iteração e por pixel, um cálculo custoso repetido milhões de vezes. Como só importa a comparação com o raio de escape, comparar o **quadrado** do módulo com o **quadrado** do raio dá exatamente o mesmo resultado, sem nunca calcular uma raiz quadrada:

```text
parte_real² + parte_imaginaria² <= raio_de_escape²
```

> **Boa prática:** elevar ao quadrado o limiar de comparação uma única vez (`raio_de_escape * raio_de_escape`) em vez de recalcular uma raiz quadrada a cada iteração de cada pixel: um ganho de desempenho direto sobre um cálculo já repetido milhões de vezes por imagem.

> **Para ir além:** existe uma generalização com um expoente `d` não inteiro (*Multibrot*, `zᵈ + c`), calculada passando `z` para a forma polar (módulo e ângulo) e aplicando o teorema de De Moivre (`zᵈ = rᵈ·(cos(dθ) + i·sin(dθ))`): fora do escopo deste capítulo, mas o mesmo princípio de iterar e contar se aplica.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma fractal por tempo de escape itera uma fórmula (`z = z² + c` para Mandelbrot/Julia) e colore cada pixel conforme quantas iterações ocorrem antes de `z` ultrapassar um limiar fixo (ou nunca, para o conjunto em si). |
| **Ferramentas utilizáveis** | Comparar o quadrado do módulo com o quadrado do raio de escape, para evitar uma raiz quadrada por iteração. |
| **Armadilhas a evitar** | Recalcular uma raiz quadrada real a cada iteração para testar o escape, quando comparar quadrados basta. |
| **Boas práticas** | Precalcular o quadrado do raio de escape uma única vez antes do laço de renderização. |
