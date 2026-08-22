---
order: 6
---

# As funções

Uma função Python é declarada com `def`. As funções são **objetos de primeira classe**: podem ser armazenadas em uma variável, passadas como argumento a outra função, ou retornadas por uma função, exatamente como qualquer outro valor.

## Declarar e chamar uma função

```python
def adicao(a, b):
    return a + b

resultado = adicao(2, 3)   # 5
```

## Parâmetros padrão

```python
def saudar(nome, mensagem="Ola"):
    return f"{mensagem} {nome}"

saudar("Joao")           # "Ola Joao"
saudar("Joao", "Oi")      # "Oi Joao"
```

> **Armadilha clássica: nunca usar um objeto mutável (lista, dict) como valor padrão.** O valor padrão é avaliado **apenas uma vez**, na definição da função, não a cada chamada:

```python
def adicionar_a_lista(elemento, lista=[]):  # PERIGO: essa lista e COMPARTILHADA entre todas as chamadas
    lista.append(elemento)
    return lista

adicionar_a_lista(1)  # [1]
adicionar_a_lista(2)  # [1, 2] -> nao [2]! a mesma lista padrao foi reutilizada
```

A boa prática:

```python
def adicionar_a_lista(elemento, lista=None):
    if lista is None:
        lista = []   # uma NOVA lista, criada a cada chamada
    lista.append(elemento)
    return lista
```

## `*args` e `**kwargs`: um número variável de argumentos

```python
def soma(*numeros):           # *args: agrupa os argumentos posicionais excedentes em uma tupla
    return sum(numeros)

soma(1, 2, 3, 4)   # 10

def exibir_informacoes(**opcoes):  # **kwargs: agrupa os argumentos nomeados excedentes em um dict
    for chave, valor in opcoes.items():
        print(f"{chave}: {valor}")

exibir_informacoes(nome="Joao", idade=25)
```

## Argumentos apenas por palavra-chave

Um `*` sozinho na assinatura obriga tudo que segue a ser passado por nome, nunca por posição:

```python
def criar_usuario(nome, *, email, ativo=True):
    return {"nome": nome, "email": email, "ativo": ativo}

criar_usuario("Joao", email="joao@exemplo.com")  # OK
criar_usuario("Joao", "joao@exemplo.com")        # TypeError: email deve ser nomeado
```

## As funções lambda

Uma função anônima, limitada a uma única expressão (sem `return` explícito, sem bloco multi-linha):

```python
dobro = lambda x: x * 2
dobro(5)   # 10

# uso tipico: como argumento de uma funcao que espera um callback
numeros = [5, 2, 8, 1]
numeros_ordenados = sorted(numeros, key=lambda x: -x)  # ordem decrescente
```

## Closures e `nonlocal`

Uma função aninhada pode ler as variáveis da função envolvente; para **modificá-las**, `nonlocal` é necessário:

```python
def contador():
    total = 0

    def incrementar():
        nonlocal total   # sem isso, "total += 1" criaria uma nova variavel LOCAL a incrementar()
        total += 1
        return total

    return incrementar

contar = contador()
contar()  # 1
contar()  # 2 -> "total" foi realmente preservado entre as chamadas
```

Veja também [Os decoradores](/?c=langages-de-programmation&s=python&p=decorateurs), que se apoia diretamente nesse mecanismo de closure.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função Python é um objeto de primeira classe (armazenável, passável como argumento). `*args`/`**kwargs` gerenciam um número variável de argumentos; uma closure mantém acesso às variáveis de sua função envolvente. |
| **Ferramentas utilizáveis** | Parâmetros padrão, argumentos apenas por palavra-chave (`*`), lambdas, `nonlocal`. |
| **Armadilhas a evitar** | Usar um objeto mutável (lista, dict) como valor padrão: ele é compartilhado entre todas as chamadas, não recriado a cada vez. |
| **Boas práticas** | Usar `None` como valor padrão para um parâmetro mutável, depois criar o objeto real dentro da função. |
