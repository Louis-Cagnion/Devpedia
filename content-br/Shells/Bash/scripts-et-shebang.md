---
order: 2
---

# Escrever e executar um script Bash

Um script Bash é um simples arquivo de texto contendo uma sequência de comandos, executados em ordem como se tivessem sido digitados um a um no terminal.

> **Unix**, o que é isso? Originalmente, um sistema operacional criado nos anos 1970, cujos princípios (tudo é arquivo, pequenas ferramentas especializadas que se combinam via pipes, um shell de linha de comando para pilotar tudo) foram depois copiados ou reimplementados por vários sistemas: Linux e macOS são hoje seus herdeiros mais comuns. Quando um capítulo diz "no Unix" ou "um sistema Unix", ele fala dessa família de sistemas e de suas convenções comuns, em oposição ao Windows por exemplo.

## O shebang

A primeira linha de um script indica ao sistema qual interpretador usar para executá-lo:

```bash
#!/bin/bash

echo "Ola"
```

`#!/bin/bash` (o "shebang") não é um comentário comum apesar do `#`: o sistema operacional o lê especificamente para saber qual programa lançar para interpretar o resto do arquivo (veja [como o kernel o detecta concretamente](/?c=shells&s=bash&p=architecture-dun-shell) para o que acontece de fato no nível do sistema).

> **Armadilha:** o shebang precisa ser os primeiríssimos caracteres do arquivo, sem exceção: nem mesmo uma linha vazia antes. O kernel só verifica os dois primeiros bytes (`#!`); uma linha vazia acima, e ele não os reconhece mais como um shebang de forma alguma.
>
> **Boa prática:** sempre fazer um script executável começar diretamente com `#!...`, nunca com um comentário ou uma linha vazia acima.

## `sh` vs `bash`

**POSIX** (*Portable Operating System Interface*) é uma norma que define, entre outras coisas, um comportamento padrão mínimo para um shell: um conjunto de funcionalidades que todo shell "compatível POSIX" precisa implementar, para que um mesmo script execute de forma idêntica em qualquer sistema Unix, seja qual for o shell realmente instalado por trás de `/bin/sh`.

`sh` designa então menos um programa preciso do que uma **norma**: na maioria dos sistemas, `/bin/sh` é na verdade um link para outro shell (frequentemente `dash` no Debian/Ubuntu, às vezes o próprio `bash` no macOS ou em modo "compatibilidade POSIX") que se comporta de forma mais restrita quando invocado sob esse nome. O `bash` (*Bourne Again SHell*) é um shell concreto, que respeita o POSIX mas adiciona a ele numerosas extensões próprias (`[[ ]]`, os arrays, `{1..5}`, `local`...) que não funcionam se o script for executado com um `sh` estritamente POSIX.

```bash
#!/bin/bash
echo "Compativel apenas com Bash"
```

```bash
#!/bin/sh
echo "Portavel para qualquer shell POSIX (dash, bash em modo sh, etc.)"
```

Na prática: usar `#!/bin/bash` (e executá-lo com `bash`) assim que o script usa uma extensão Bash, o que é o caso da maioria dos scripts deste site; reservar `#!/bin/sh` a scripts deliberadamente limitados às funcionalidades POSIX básicas, por exemplo para um script de sistema que deve funcionar mesmo em uma máquina onde `bash` não está instalado.

> **Armadilha:** escrever `#!/bin/sh` e depois usar uma extensão própria do Bash (arrays, `[[ ]]`, `local`...). O script funciona mesmo assim no teste se `/bin/sh` aponta para `bash` na máquina de desenvolvimento, e falha silenciosa ou ruidosamente em outro sistema onde `/bin/sh` é um shell mais estrito (`dash`, frequentemente).
>
> **Boa prática:** fazer o shebang corresponder ao que o script realmente usa: `#!/bin/bash` assim que uma única extensão Bash aparecer, em vez de descobrir isso em produção.

## Tornar um script executável

```bash
chmod +x script.sh  # adiciona o direito de execucao (veja Permissoes e manipulacao de arquivos)
./script.sh         # executa o script (o "./" e necessario se o diretorio atual nao esta no $PATH)
```

Alternativa sem precisar de `chmod +x`: lançar explicitamente o interpretador sobre o arquivo:

```bash
bash script.sh
```

> **Armadilha:** digitar `script.sh` sozinho, sem `./` na frente, mesmo depois de já ter feito `chmod +x`. O Bash nunca procura no diretório atual por padrão (cf. [capítulo sobre os comandos básicos](/?c=shells&s=bash&p=commandes-de-base)): sem prefixo de caminho, ele só encontra o script se seu diretório fizer parte do `$PATH`, o que quase nunca é o caso para um diretório de projeto.
>
> **Boa prática:** sempre prefixar a execução de um script local com `./`, em vez de procurar por que "o comando não existe".

## Os argumentos de um script

```bash
#!/bin/bash
echo "Script: $0"
echo "Primeiro argumento: $1"
echo "Todos os argumentos: $@"
echo "Numero de argumentos: $#"
```

```bash
./script.sh alice bob
# Script: ./script.sh
# Primeiro argumento: alice
# Todos os argumentos: alice bob
# Numero de argumentos: 2
```

`$0`, `$1`, `$@` e `$#` fazem parte de um conjunto mais amplo de **variáveis especiais**, todas lidas automaticamente pelo Bash sem nunca serem atribuídas explicitamente:

| Variável | Conteúdo |
|---|---|
| `$0` | Nome do script em execução |
| `$1`, `$2`, ... | Argumentos posicionais passados ao script/à função |
| `$@` | Todos os argumentos, cada um como uma palavra separada |
| `$*` | Todos os argumentos, reunidos em **uma única** string |
| `$#` | Número de argumentos recebidos |
| `$?` | Código de saída do último comando executado (`0` = sucesso) |
| `$$` | PID do script em execução |

> **Armadilha frequente: `$@` e `$*` se comportam de forma diferente uma vez com aspas.** Sem aspas, os dois se comportam igual. Com aspas (`"$@"` vs `"$*"`), eles divergem: `"$@"` expande cada argumento como uma palavra **separada** (`"alice" "bob"`), enquanto `"$*"` os funde em **uma única** palavra (`"alice bob"`). Para transmitir os argumentos tal como são a outro comando (ex. `comando "$@"`), `"$@"` é quase sempre a escolha certa (veja [a ordem precisa das expansões](/?c=shells&s=bash&p=architecture-dun-shell) para o que explica essa diferença: divisão em palavras, aspas).

`$?` e `$$` são detalhados mais adiante neste capítulo e no de gerenciamento de processos; veja também o capítulo sobre variáveis para seu uso dentro de uma função.

## Códigos de saída (`exit`)

Cada comando, e portanto cada script, termina com um **código de saída**: `0` significa sucesso, qualquer outro valor (1 a 255) significa uma falha, cujo sentido preciso depende do programa:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Erro: arquivo de configuracao ausente" >&2   # >&2 : envia essa mensagem para a saida de erro (stderr)
    exit 1
fi

echo "Tudo pronto"
exit 0
```

> `>&2` redireciona para a saída de erro (*stderr*) em vez da saída padrão (*stdout*): veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes) para o que são esses fluxos e como redirecioná-los em detalhe.

O script (ou o comando) que chama pode verificar esse código via `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "O script teve sucesso"
fi

# atalho equivalente, mais idiomatico:
./script.sh && echo "O script teve sucesso"
./script.sh || echo "O script falhou"
```

`&&` só executa o comando seguinte se o anterior teve sucesso (código `0`); `||` apenas se ele falhou.

> **Armadilha:** um script sem `exit` explícito termina com o código de saída de seu **último comando**: não necessariamente `0`, e não necessariamente o que era desejado. Um script que tem sucesso "globalmente" mas cuja última linha é um `echo` (que quase sempre tem sucesso) assim mascara uma falha ocorrida antes.
>
> **Boa prática:** terminar um script com um `exit` explícito (`exit 0` em caso de sucesso, um código diferente senão) em vez de deixar o código de saída depender implicitamente do último comando.

## Parar um script no primeiro erro: `set -e`

Por padrão, o Bash continua executando as linhas seguintes mesmo se um comando falhar: frequentemente indesejável em um script de automação:

```bash
#!/bin/bash
set -e   # para imediatamente o script se um comando falhar (codigo de saida nao nulo)

cd /diretorio/inexistente   # se esse diretorio nao existe, o script para aqui
echo "Esta linha nunca executa se cd falhou"
```

Outras opções reforçam a robustez de um script, frequentemente combinadas:

```bash
#!/bin/bash
set -euo pipefail
# -e : para no primeiro erro
# -u : erro se uma variavel nao definida for usada
# -o pipefail : um pipe falha se QUALQUER UMA de suas etapas falhar (nao apenas a ultima)
```

Um caso concreto onde `set -e` não é disparado, apesar de uma falha real:

```bash
set -e
comando_que_falha | grep "padrao"   # falha, mas set -e NAO para aqui sem pipefail: so grep conta
```

> **Armadilha:** `set -e` não cobre tudo que se poderia esperar. Um comando que falha **não para nada** se ele for testado por um `if`, combinado com `&&`/`||`, ou se não for o último de um pipeline (sem `pipefail`, como no exemplo acima): nesses três casos, o Bash considera a falha "esperada e já tratada", então `set -e` não é disparado.
>
> **Boa prática:** nunca contar apenas com `set -e` para um comando em um pipeline, um `if`, ou antes de `&&`/`||`: verificar `$?` explicitamente nesses casos precisos se a falha realmente deve interromper o script.

Veja também o capítulo sobre gerenciamento de processos para o que acontece depois do lançamento de um script em segundo plano.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O shebang indica ao sistema qual interpretador executa o script. `chmod +x` + `./script.sh` ou `bash script.sh` o lança. `$1`, `$@`, `$#`... dão acesso a seus argumentos. Cada script termina com um código de saída (`0` = sucesso), consultável via `$?`. |
| **Ferramentas utilizáveis** | `set -euo pipefail` no início do script para parar no primeiro erro em vez de continuar sobre um estado inconsistente. |
| **Armadilhas a evitar** | Confundir `$@` e `$*` uma vez com aspas (veja acima). Escrever `#!/bin/sh` e depois usar uma extensão Bash (arrays, `[[ ]]`...): o script falha em qualquer sistema onde `/bin/sh` não é `bash`. |
| **Boas práticas** | Sempre verificar `$?` (ou usar `&&`/`\|\|`) depois de um comando cuja falha deve mudar o comportamento do script, em vez de supor que ele teve sucesso. |
