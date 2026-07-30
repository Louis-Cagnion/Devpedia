---
order: 6
---

# As funções

Uma função em Python é declarada com «`def`». As funções são **objetos de primeira classe**: podem ser armazenadas numa variável, passadas como argumento a outra função ou devolvidas por uma função — exatamente como qualquer outro valor.

## Declarar e chamar uma função

```python
def addition(a, b):
    return a + b

resultado = addition(2, 3)   # 5
```

## Parâmetros predefinidos

```python
def saluer(nome, mensagem="Bonjour"):
    return f"{mensagem} {nome}"

saluer("Jean")               # «Olá, Jean»
saluer("Jean", "Salut")       # «Olá, Jean»
```

> **Armadilha clássica: nunca utilizar um objeto mutável (lista, dicionário) como valor por predefinição.** O valor por predefinição é avaliado **apenas uma vez**, na definição da função — e não em cada chamada:

```python
def ajouter_a_liste(elemento, lista=[]):  # PERIGO: esta lista é PARTILHADA entre todas as chamadas
    lista.append(elemento)
    return lista

ajouter_a_liste(1)   # [1]
ajouter_a_liste(2)   # [1, 2] -> não [2]! A mesma lista por predefinição foi reutilizada
```

Boas práticas:

```python
def ajouter_a_liste(elemento, lista=None):
    if lista is None:
        lista = []   # uma NOVA lista, criada a cada chamada
    lista.append(elemento)
    return lista
```

## `*args` e `**kwargs`: um número variável de argumentos

```python
def somme(*números):          # *args: agrupa os argumentos posicionais em excesso numa tupla
    return sum(números)

somme(1, 2, 3, 4)   # 10

def afficher_infos(**options):  # **kwargs: agrupa os argumentos nomeados em excesso num dicionário**
    for chave, valor in options.items():
        print(f"{chave} : {valor}")

afficher_infos(nome="Jean", idade=25)
```

## Argumentos apenas por palavra-chave

Um «`*`» isolado na assinatura obriga a que tudo o que se segue seja passado por nome, nunca por posição:

```python
def creer_utilisateur(nome, *, email, actif=True):
    return {"nom": nome, "email": email, "actif": actif}

creer_utilisateur("Jean", email="jean@exemple.com")   # OK
creer_utilisateur("Jean", "jean@exemple.com")           # TypeError: o e-mail deve ter um nome
```

## As funções lambda

Uma função anónima, limitada a uma única expressão (sem «`return`» explícito, sem bloco de várias linhas):

```python
double = lambda x: x * 2
double(5)   # 10

# utilização típica: como argumento de uma função que espera um callback
números = [5, 2, 8, 1]
nombres_tries = sorted(números, key=lambda x: -x)  # ordenação decrescente
```

## Closures e `nonlocal`

Uma função aninhada pode ler as variáveis da função que a engloba — para as **alterar**, é necessário utilizar `nonlocal`:

```python
def contador():
    total = 0

    def incrementer():
        nonlocal total   # Sem isto, «total += 1» criaria uma nova variável LOCAL para ser incrementada()
        total += 1
        return total

    return incrementer

compter = contador()
compter()   # 1
compter()   # 2 -> «total» foi efetivamente mantido entre as chamadas
```

Ver também o capítulo sobre decoradores, que se baseia diretamente neste mecanismo de closure.
