---
order: 4
---

# Python

Uma [linguagem de programação](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) é um conjunto de regras que permite escrever instruções que um computador pode executar. Python é uma delas, conhecida por sua sintaxe deliberadamente próxima da linguagem natural.

```python
nome = "Devpedia"          # uma variavel, veja o capitulo dedicado
print(f"Ola, {nome}")      # exibe: Ola, Devpedia
```

| Termo | O que significa |
|---|---|
| Alto nível | Esconde quase inteiramente o gerenciamento de memória e os detalhes do hardware, em favor da legibilidade |
| Dinamicamente tipado | Uma variável não declara um tipo antecipadamente: ela assume o tipo do valor que lhe é atribuído, e pode mudar durante o programa (veja [As variáveis](/?c=langages-de-programmation&s=python&p=variables)) |
| Interpretado | O código não é traduzido em instruções de máquina nativas antecipadamente: um **interpretador** (um programa que lê e executa código à medida que avança, em vez de uma única tradução prévia) o lê e executa: um compromisso de legibilidade contra a performance bruta de uma linguagem compilada como o [C](/?c=langages-de-programmation&s=c&p=c) |

> O interpretador de referência para Python se chama **CPython**. Internamente, ele traduz primeiro o código em *bytecode* (uma forma intermediária, mais próxima da máquina que o código-fonte mas ainda não instruções nativas) antes de executá-lo.

Graças à sua sintaxe acessível e sua biblioteca padrão muito rica, Python permite progredir rapidamente em problemas concretos. Ele é hoje central em vários domínios: o desenvolvimento web ([Django](https://www.djangoproject.com), [Flask](https://flask.palletsprojects.com)), a automação, e principalmente a computação científica e a inteligência artificial ([NumPy](/?c=data-science&p=numpy), [pandas](/?c=data-science&p=pandas), [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)...), veja as categorias [Data Science](/?c=data-science&p=jupyter-notebooks) e [IA](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), que se apoiam quase inteiramente nessa linguagem.
