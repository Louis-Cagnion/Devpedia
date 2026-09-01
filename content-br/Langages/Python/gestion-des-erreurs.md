---
order: 7
---

# O tratamento de erros

Python sinaliza um erro lançando uma **exceção**, que interrompe a execução normal do programa a menos que seja interceptada por um bloco `try`/`except`, um mecanismo semelhante às exceções [PHP](/?c=langages-de-programmation&s=php&p=php) modernas (`throw`/`catch`).

## `try` / `except`

```python
try:
    resultado = 10 / 0
except ZeroDivisionError:
    print("Impossivel dividir por zero")
```

## Interceptar vários tipos de exceções

```python
try:
    numero = int(input("Digite um numero: "))
    resultado = 10 / numero
except ValueError:
    print("Isso nao e um numero valido")
except ZeroDivisionError:
    print("Impossivel dividir por zero")
except Exception as erro:   # pega todo o resto -> deve ficar por ULTIMO
    print(f"Erro inesperado: {erro}")
```

> **Nota:** interceptar `Exception` de forma muito ampla (ou pior, um `except:` puro, sem tipo) esconde erros de programação que deveriam, em vez disso, travar o programa para serem corrigidos: reservar para os casos em que a falha é realmente esperada e já tratada logo depois.

## `else` e `finally`

```python
try:
    arquivo = open("dados.txt")
except FileNotFoundError:
    print("Arquivo nao encontrado")
else:
    print("Arquivo aberto com sucesso")   # executado APENAS se nenhuma excecao ocorreu
    arquivo.close()
finally:
    print("Tentativa concluida")           # executado EM TODOS OS CASOS, excecao ou nao
```

`finally` é usado tipicamente para liberar um recurso (fechar um arquivo, uma conexão...) tenha havido erro ou não.

## Os modos de `open()`

`open(caminho)` (visto acima) abre por padrão em **leitura**. Um segundo argumento precisa o modo de abertura:

| Modo | Significa | Se o arquivo já existe |
|---|---|---|
| `"r"` | Leitura (padrão) | Lê seu conteúdo |
| `"w"` | Escrita | **SOBRESCREVE** todo o conteúdo existente |
| `"a"` | Anexar (*append*) | Escreve na SEQUÊNCIA, sem apagar nada |
| `"x"` | Criação exclusiva | Falha com `FileExistsError` |

```python
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("Nova linha\n")   # adicionada ao final, o conteúdo anterior permanece intacto
```

> **Armadilha:** confundir `"w"` e `"a"` faz perder silenciosamente o conteúdo existente de um arquivo (`"w"` o sobrescreve já na abertura, antes mesmo de escrever qualquer coisa). Reservar `"w"` para um arquivo que se queira substituir deliberadamente.

> **Nota:** um arquivo aberto com `"a"` para ficar aberto durante toda a duração de um programa (ex. um arquivo de log) geralmente dispensa `with`, já que o recurso NÃO deve ser liberado após um único bloco: `with` continua preferível em todos os outros casos.

## Lançar suas próprias exceções

```python
def calcular_idade(ano_nascimento):
    if ano_nascimento > 2026:
        raise ValueError("O ano de nascimento nao pode estar no futuro")
    return 2026 - ano_nascimento
```

## Criar uma exceção personalizada

```python
class SaldoInsuficienteError(Exception):
    pass

def sacar(saldo, valor):
    if valor > saldo:
        raise SaldoInsuficienteError(f"Saldo de {saldo}R$ insuficiente para sacar {valor}R$")
    return saldo - valor

try:
    sacar(100, 150)
except SaldoInsuficienteError as erro:
    print(erro)
```

Uma exceção personalizada herda de `Exception` (ou de uma subclasse mais precisa), o que permite distingui-la das outras em um `except` direcionado, em vez de depender de uma mensagem de erro genérica.

## O gerenciador de contexto `with`

`with` garante que um recurso seja liberado corretamente, **mesmo em caso de exceção**: um arquivo aberto com `with` sempre se fecha automaticamente ao sair do bloco:

```python
with open("dados.txt") as arquivo:
    conteudo = arquivo.read()
# arquivo.close() e chamado automaticamente aqui, tenha tudo corrido bem ou nao
```

> **Nota:** isso se apoia nos métodos especiais `__enter__`/`__exit__` (veja [A programação orientada a objetos](/?c=langages-de-programmation&s=python&p=poo)); qualquer classe personalizada pode definir esses dois métodos para se tornar utilizável com `with` (ex. gerenciar a abertura/fechamento de uma conexão de rede ou banco de dados).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `try`/`except`/`else`/`finally` estrutura o tratamento de erros. `with` garante que um recurso seja liberado mesmo em caso de exceção, via `__enter__`/`__exit__`. |
| **Ferramentas utilizáveis** | Exceções personalizadas (herdam de `Exception`), `with`, `raise`. |
| **Armadilhas a evitar** | Interceptar `Exception` (ou um `except:` puro) de forma muito ampla: esconde erros de programação que deveriam, em vez disso, travar o programa para serem corrigidos. |
| **Boas práticas** | Interceptar o tipo de exceção mais preciso possível; usar `with` para todo recurso que precisa ser fechado/liberado. |
