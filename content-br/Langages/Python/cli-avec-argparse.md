---
order: 14
---

# Construir uma CLI com `argparse`

Uma **CLI** (*Command-Line Interface*, interface de linha de comando) é um programa pilotado inteiramente por comandos digitados em um [terminal](/?c=bases-de-l-informatique&p=le-terminal), em vez de cliques em uma interface gráfica: `git`, `ls`, ou o script `pdf_parser process relatorio.pdf --marca peugeot` deste capítulo são exemplos disso. Um script Python lançado dessa forma recebe seus argumentos em `sys.argv` (uma simples lista de strings), exatamente como `$1`/`$2` em [Bash](/?c=shells&s=bash&p=scripts-et-shebang). Lê-los um por um na mão logo se torna penoso assim que é preciso lidar com opções, valores padrão, ou produzir uma mensagem de ajuda correta. O **`argparse`** (módulo da biblioteca padrão) constrói tudo isso a partir de uma descrição declarativa dos argumentos esperados.

## Argumentos posicionais e opcionais

```python
import argparse

parser = argparse.ArgumentParser(prog="conversor")
parser.add_argument("arquivo", help="Caminho do arquivo a converter")     # posicional: obrigatorio, identificado pela posicao
parser.add_argument("--formato", default="json", help="Formato de saida")  # opcional: identificado pelo nome, "--" na frente

args = parser.parse_args()
print(args.arquivo, args.formato)
```

```bash
python conversor.py relatorio.csv                # arquivo="relatorio.csv", formato="json" (valor padrao)
python conversor.py relatorio.csv --formato=xml  # arquivo="relatorio.csv", formato="xml"
```

| | Posicional | Opcional |
|---|---|---|
| Sintaxe de declaração | `add_argument("nome")` | `add_argument("--nome")` |
| Identificado por | Sua posição no comando | Seu nome, precedido de `--` |
| Obrigatório por padrão? | Sim | Não, exceto `required=True` explícito |
| Acesso em `args` | `args.nome` | `args.nome` (o `--` não aparece no nome do atributo) |

## Tipos, valores padrão, flags booleanas

```python
parser.add_argument("--repeticoes", type=int, default=1)  # converte automaticamente a string recebida em int
parser.add_argument("--verboso", action="store_true")      # flag booleana: presente -> True, ausente -> False

args = parser.parse_args(["--repeticoes", "3", "--verboso"])
print(args.repeticoes, args.verboso)   # 3 True
```

> **Armadilha:** sem `type=int`, `args.repeticoes` continua sendo uma **string** (`"3"`), mesmo que "pareça" um número: `args.repeticoes * 2` daria `"33"` (repetição de string), não `6`.
>
> **Boa prática:** sempre especificar `type=` assim que um argumento espera algo diferente de uma string bruta; o próprio `argparse` lança um erro claro se a conversão falhar (ex. `--repeticoes abc`), em vez de deixar uma conversão manual falhar mais adiante no programa com uma mensagem confusa.

## A ajuda gerada automaticamente

`argparse` constrói `--help` sem escrever nada a mais, a partir dos `help=` fornecidos em cada argumento:

```bash
python conversor.py --help
# usage: conversor [-h] [--formato FORMATO] arquivo
#
# positional arguments:
#   arquivo            Caminho do arquivo a converter
#
# options:
#   -h, --help         show this help message and exit
#   --formato FORMATO  Formato de saida
```

> **Boa prática:** sempre fornecer `help=` em cada argumento, inclusive os que parecem óbvios no momento de escrever: é esse texto que aparecerá para um usuário que descobre a ferramenta meses depois, sem o contexto que o autor tinha em mente.

## As subcommands: várias ações em um único programa

Uma ferramenta que oferece várias ações distintas (`git commit`, `git push`, [`docker run`](/?c=docker&p=commandes-essentielles)...) as agrupa em **subcommands**, cada uma com seus próprios argumentos. `add_subparsers` constrói essa divisão:

```python
import argparse

parser = argparse.ArgumentParser(prog="pdf_parser")
subcommands = parser.add_subparsers(dest="command", required=True)

process_parser = subcommands.add_parser("process", help="Processa um PDF")
process_parser.add_argument("pdf_path", help="Caminho para o PDF a processar")
process_parser.add_argument("--marca", required=True, help="Identificador da marca")

args = parser.parse_args()

if args.command == "process":
    print(f"Processando {args.pdf_path} para a marca {args.marca}")
```

```bash
pdf_parser process relatorio.pdf --marca peugeot
# Processando relatorio.pdf para a marca peugeot

pdf_parser process relatorio.pdf
# error: the following arguments are required: --marca
```

- `dest="command"` nomeia o atributo (`args.command`) que vai conter o nome da subcommand efetivamente usada (`"process"` aqui), para poder testá-la depois com um `if`.
- Cada subcommand criada por `add_parser(...)` é um `ArgumentParser` por si só: tem seus próprios argumentos, independentes dos de outras subcommands.

> **Armadilha:** omitir `required=True` em `add_subparsers()`. Um programa lançado sem nenhuma subcommand deixa então `args.command` como `None`, sem que nenhum erro seja lançado pelo próprio `argparse`: o programa continua rodando, potencialmente até um lugar bem mais adiante onde a ausência de comando acaba causando uma falha confusa.
>
> **Boa prática:** declarar sistematicamente `required=True` em `add_subparsers()` assim que pelo menos uma subcommand for obrigatória para o programa fazer sentido; o `argparse` então se recusa a iniciar sem um comando especificado, com uma mensagem de erro explícita em vez de uma falha silenciosa mais adiante.

## Tornar uma CLI testável: nunca ler `sys.argv` diretamente

`parser.parse_args()` sem argumento lê `sys.argv` diretamente: prático para o uso real, mas impossível de testar unitariamente sem lançar um subprocesso de verdade. A solução: aceitar os argumentos como parâmetro, com `None` como padrão para cair em `sys.argv` apenas em uso real:

```python
import sys

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pdf_parser")
    # ... declaracao dos argumentos ...
    args = parser.parse_args(argv)   # argv=None -> argparse le sys.argv sozinho ; senao, usa a lista fornecida
    # ... logica do programa ...
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

> **Nota:** `sys.exit(x)` é um atalho que internamente levanta ele mesmo `raise SystemExit(x)`: as duas sintaxes são estritamente equivalentes. `raise SystemExit("mensagem")` é útil em uma função que NÃO é `main()`, para parar o programa imediatamente com uma mensagem de erro limpa, sem precisar importar `sys` só para isso.

Um teste pode então chamar `main(["process", "test.pdf", "--marca", "peugeot"])` diretamente, sem nunca invocar um terminal de verdade, e verificar o valor inteiro retornado (`0` = sucesso, outro valor = falha) exatamente como o [código de saída](/?c=shells&s=bash&p=scripts-et-shebang) de um script [Bash](/?c=shells&s=bash&p=bash).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `argparse` constrói um analisador de argumentos (posicionais, opcionais, tipados) a partir de uma descrição declarativa, com `--help` gerado automaticamente. `add_subparsers` agrupa várias ações distintas em um único programa. |
| **Ferramentas utilizáveis** | `add_argument` (`type=`, `default=`, `action="store_true"`, `required=`), `add_subparsers(dest=..., required=True)`. |
| **Armadilhas a evitar** | Esquecer `type=` em um argumento numérico (continua sendo uma string). Omitir `required=True` em `add_subparsers()`: `args.command` pode continuar `None` sem erro imediato. |
| **Boas práticas** | Sempre fornecer `help=` em cada argumento. Tornar `main()` testável aceitando `argv` como parâmetro em vez de ler `sys.argv` diretamente. |
