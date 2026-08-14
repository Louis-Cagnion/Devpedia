---
order: 1
---

# Variáveis e tipos básicos

O Python é **uma linguagem de tipagem dinâmica**: uma variável não tem um tipo declarado antecipadamente, assumindo simplesmente o tipo do valor que lhe é atribuído, e pode mudar de tipo livremente ao longo do programa (ao contrário do PHP ou do C, onde o tipo de uma propriedade/variável tipada permanece fixo uma vez declarado).

## Declarar uma variável

```python
idade = 25            # int
preço = 9.99          # float
nome = "Devpedia"      # str
actif = True          # bool
rien = None           # equivalente a null/NULL

idade = "vingt-cinq"    # perfeitamente válido: «age» torna-se um str, sem necessidade de qualquer declaração
```

> **Nota:** ao contrário do PHP (`$variable`), o Python não utiliza nenhum símbolo específico para designar uma variável: apenas um nome, em minúsculas e com sublinhados, por convenção (`nom_utilisateur`, e não `nomUtilisateur`).

## Verificar o tipo de uma variável

```python
type(idade)             # <class 'int'>
isinstance(idade, int)   # True -> preferível a type() == int para verificações condicionais
```

## Os operadores

```python
a, b = 5, 3   # atribuição múltipla numa única linha

a + b    # 8
a - b    # 2
a * b    # 15
a / b     # 1,6666... -> divisão real, sempre um float
a // b    # 1 -> divisão inteira (divisão por piso)
a % b     # 2 -> módulo
a ** b    # 125 -> potência

a == b    # False
a != b    # Verdadeiro
a and b   # Operador lógico «ET» (não «&&»)
a or b    # Operador lógico «OU» (não «||»)
not a     # NÃO lógico (não «!»)
```

> **Nota:** O Python utiliza as palavras-chave `and` / `or` / `not` em vez dos símbolos `&&` / `||` / `!` encontrados em PHP, JavaScript ou C.

## As f-strings: inserir variáveis no texto

```python
nome = "Jean"
idade = 25

print(f"{nome} a {idade} ans")           # O Jean tem 25 anos
print(f"Dans 10 ans : {idade + 10} ans") # uma expressão verdadeira, não apenas uma variável
```

As f-strings (prefixo «`f`» antes das aspas) são o método moderno recomendado, substituindo «`"{} a {} ans".format(nome, idade)`» ou a concatenação com «`+`».

## Imutabilidade das cadeias de caracteres

Tal como no PHP, uma cadeia de caracteres em Python é **imutável**: qualquer «alteração» cria, na realidade, uma nova cadeia de caracteres, nunca alterando a original na memória.

```python
texto = "bonjour"
texto.upper()      # retorna «BONJOUR», NÃO ALTERA o texto
print(texto)        # sempre «olá»

texto = texto.upper()  # É necessário reatribuir para «manter» a alteração
```

## Resumo dos tipos básicos

| Tipo | Exemplo | Equivalente em PHP |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texto"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

Consulte também os capítulos sobre listas/tuplas e dicionários/conjuntos para as estruturas de dados compostas.
