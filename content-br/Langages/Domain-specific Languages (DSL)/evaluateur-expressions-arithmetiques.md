---
order: 4
---

# Avaliador de expressões aritméticas: gerenciar a precedência dos operadores

Avaliar uma string como `"2 + 3 * 4"` exige mais que um simples percurso da esquerda para a direita: a multiplicação deve ser feita antes da adição (resultado `14`, não `20`), e parênteses podem forçar uma ordem diferente. Escrever esse pequeno interpretador é um exercício clássico, muitas vezes a primeira peça antes de um interpretador mais amplo (veja [Parsing incremental por máquina de estados](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) para outra família de formato a interpretar).

## O problema: ler da esquerda para a direita não basta

```text
"2 + 3 * 4"

Leitura ingenua esquerda->direita:  (2 + 3) * 4 = 20   -> errado
Com precedencia dos operadores:     2 + (3 * 4) = 14   -> correto
```

Uma avaliação correta precisa conhecer a **precedência** de cada operador (`*`/`/` antes de `+`/`-`) antes mesmo de começar a calcular qualquer coisa.

## Duas etapas: tokenizar, depois avaliar

A string bruta nunca é avaliada caractere por caractere: ela é primeiro dividida em uma lista de **tokens** (números e operadores), como faz todo interpretador (veja a tokenização de um [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), o mesmo princípio aplicado a texto natural em vez de a uma expressão).

```python
import re

def tokenizar(expressao):
    return re.findall(r"\d+\.?\d*|[()+\-*/]", expressao)

tokenizar("2 + 3 * 4")       # ['2', '+', '3', '*', '4']
tokenizar("(2 + 3) * 4")     # ['(', '2', '+', '3', ')', '*', '4']
```

## Respeitar a precedência: uma função por nível

A técnica mais direta codifica cada nível de precedência em sua própria função, cada uma chamando o nível imediatamente superior antes de tratar seu próprio operador, uma função chamando os parênteses e depois se chamando novamente para lidar com uma expressão aninhada:

```text
expressao := termo (('+' | '-') termo)*
termo      := fator (('*' | '/') fator)*
fator      := NUMERO | '(' expressao ')'
```

```python
class Avaliador:
    def __init__(self, tokens):
        self.tokens = tokens
        self.posicao = 0

    def token_atual(self):
        return self.tokens[self.posicao] if self.posicao < len(self.tokens) else None

    def expressao(self):
        resultado = self.termo()
        while self.token_atual() in ("+", "-"):
            operador = self.tokens[self.posicao]
            self.posicao += 1
            direita = self.termo()
            resultado = resultado + direita if operador == "+" else resultado - direita
        return resultado

    def termo(self):
        resultado = self.fator()
        while self.token_atual() in ("*", "/"):
            operador = self.tokens[self.posicao]
            self.posicao += 1
            direita = self.fator()
            resultado = resultado * direita if operador == "*" else resultado / direita
        return resultado

    def fator(self):
        token = self.token_atual()
        if token == "(":
            self.posicao += 1           # consome '('
            resultado = self.expressao()
            self.posicao += 1           # consome ')'
            return resultado
        self.posicao += 1
        return float(token)

Avaliador(tokenizar("2 + 3 * 4")).expressao()        # 14.0
Avaliador(tokenizar("(2 + 3) * 4")).expressao()      # 20.0
```

`expressao()` trata o nível menos prioritário (`+`/`-`) mas delega cada operando a `termo()`, que primeiro esgota tudo o que é prioritário (`*`/`/`) antes de devolver o controle: é essa ordem de chamadas, não uma comparação explícita de prioridades, que garante que a multiplicação seja calculada antes da adição. Um parêntese encontrado em `fator()` reativa `expressao()` a partir do nível mais baixo, o que lida naturalmente com qualquer profundidade de aninhamento.

> **Armadilha:** fazer `self.posicao` evoluir independentemente em várias funções sem que nenhuma delas seja a fonte única de verdade sobre "onde estamos" na lista de tokens. Uma única variável de estado compartilhada (aqui `self.posicao`, um atributo da instância) precisa avançar de forma consistente, seja qual for a função que consome o token atual: duas posições que divergem produzem um desalinhamento de leitura difícil de diagnosticar.
>
> **Boa prática:** avançar `self.posicao` no exato momento em que um token é consumido, nunca antes nem depois, e nunca lê-lo duas vezes para a mesma decisão.

## Uma outra abordagem: conversão para notação polonesa reversa

Uma alternativa comum, o algoritmo *shunting-yard* (Dijkstra), converte primeiro a expressão em notação pós-fixada (`2 3 4 * +`) com o auxílio de uma pilha de operadores, antes de avaliá-la com uma segunda pilha de operandos. O resultado final é idêntico; a escolha entre as duas técnicas é sobretudo uma questão de preferência de implementação (recursão contra pilhas explícitas), não uma diferença de capacidade.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma expressão é primeiro tokenizada (números/operadores separados), depois avaliada por uma função por nível de precedência, cada uma delegando à seguinte antes de tratar seu próprio operador. Um parêntese reativa a avaliação a partir do nível mais baixo. |
| **Ferramentas utilizáveis** | Uma expressão regular para a tokenização; uma função por nível de precedência (descida recursiva) ou o algoritmo shunting-yard (pilhas explícitas) para a avaliação em si. |
| **Armadilhas a evitar** | Avaliar da esquerda para a direita sem considerar a precedência dos operadores. Fazer a posição nos tokens avançar a partir de vários lugares sem uma fonte única de verdade. |
| **Boas práticas** | Fazer a precedência ser determinada pela ordem de chamadas entre funções (`expressao` -> `termo` -> `fator`), não por uma comparação explícita de prioridades numéricas. |
