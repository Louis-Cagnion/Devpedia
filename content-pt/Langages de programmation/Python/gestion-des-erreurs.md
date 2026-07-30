---
order: 7
---

# Gestão de erros

O Python sinaliza um erro ao lançar uma **exceção**, que interrompe a execução normal do programa, a menos que seja interceptada por um bloco `try` / `except` — um mecanismo semelhante às exceções PHP modernas (`throw` / `catch`).

## `try` / `except`

```python
try:
    resultado = 10 / 0
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
```

## Interceptar vários tipos de exceções

```python
try:
    número = int(input("Entrez un nombre : "))
    resultado = 10 / número
except ValueError:
    print("Ce n'est pas un nombre valide")
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
except Exception as erro:   # captura tudo o resto -> a colocar em ÚLTIMO
    print(f"Erreur inattendue : {erro}")
```

> **Nota:** interceptar `Exception` de forma demasiado abrangente (ou, pior ainda, um `except:` sem tipo) oculta erros de programação que, em vez disso, deveriam fazer com que o programa falhasse para que fossem corrigidos — a reservar para casos em que a falha é realmente esperada e já está a ser tratada imediatamente a seguir.

## `else` e `finally`

```python
try:
    ficheiro = open("donnees.txt")
except FileNotFoundError:
    print("Fichier introuvable")
else:
    print("Fichier ouvert avec succès")   # executado APENAS se não tiver ocorrido nenhuma exceção
    ficheiro.close()
finally:
    print("Tentative terminée")            # executado EM TODOS OS CASOS, haja ou não uma exceção
```

`finally` É normalmente utilizada para libertar um recurso (fechar um ficheiro, uma ligação...) independentemente de ter ocorrido ou não um erro.

## Lançar as suas próprias exceções

```python
def calculer_age(annee_naissance):
    if annee_naissance > 2026:
        raise ValueError("L'année de naissance ne peut pas être dans le futur")
    return 2026 - annee_naissance
```

## Criar uma exceção personalizada

```python
class SoldeInsuffisantError(Exception):
    pass

def retirer(saldo, montant):
    if montant > saldo:
        raise SoldeInsuffisantError(f"Solde de {saldo}€ insuffisant pour retirer {montant}€")
    return saldo - montant

try:
    retirer(100, 150)
except SoldeInsuffisantError as erro:
    print(erro)
```

Uma exceção personalizada herda d`Exception` (ou de uma subclasse mais específica), o que permite distingui-la das outras num «`except`» específico, em vez de se basear numa mensagem de erro genérica.

## O gestor de contexto `with`

`with` garante que um recurso seja devidamente libertado, **mesmo em caso de exceção** — um ficheiro aberto com `with` fecha-se sempre automaticamente ao sair do bloco:

```python
with open("donnees.txt") as ficheiro:
    conteúdo = ficheiro.read()
# O método `fichier.close()` é chamado automaticamente aqui, independentemente de tudo ter corrido bem ou não
```

> **Nota:** isto baseia-se nos métodos especiais `__enter__` / `__exit__` (ver capítulo sobre programação orientada para objetos) — qualquer classe personalizada pode definir estes dois métodos para se tornar utilizável com `with` (por exemplo, para gerir a abertura/fecho de uma ligação de rede ou de uma base de dados).
