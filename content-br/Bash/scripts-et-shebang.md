---
order: 1
---

# Escrever e executar um script Bash

Um script Bash é um simples arquivo de texto que contém uma sequência de comandos, executados pela ordem, como se tivessem sido digitados um a um no terminal.

## O shebang

A primeira linha de um script indica ao sistema qual o interpretador a utilizar para o executar:

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (o «shebang») não é um comentário comum, apesar do `#`: o sistema operativo lê-o especificamente para saber que programa deve ser executado para interpretar o resto do arquivo. `#!/bin/sh` executaria o script com um shell POSIX mais restrito (sem certas extensões específicas do Bash, como `[[ ]]` ou as tabelas).

## Tornar um script executável

```bash
chmod +x script.sh   # adiciona o direito de execução (ver capítulo sobre permissões)
./script.sh            # executa o script (o «./» é necessário se a pasta atual não estiver no $PATH)
```

Alternativa sem necessidade de utilizar o `chmod +x`: executar explicitamente o interpretador no arquivo:

```bash
bash script.sh
```

## Os argumentos de um script

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Tous les arguments : $@"
echo "Nombre d'arguments : $#"
```

```bash
./script.sh alice bob
# Script: ./script.sh
# Primeiro argumento: alice
# Todos os argumentos: alice bob
# Número de argumentos: 2
```

## Códigos de saída (`exit`)

Cada comando, e portanto cada script, termina com um **código de saída**: «`0`» significa sucesso; qualquer outro valor (de 1 a 255) significa um falhanço, cujo significado exato depende do programa:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Erreur : fichier de config manquant" >&2   # >&2: mensagem de erro enviada para stderr
    exit 1
fi

echo "Tout est prêt"
exit 0
```

O script (ou comando) que o chama pode verificar este código através de `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "Le script a réussi"
fi

# abreviatura equivalente, mais mais natural:
./script.sh && echo "Le script a réussi"
./script.sh || echo "Le script a échoué"
```

`&&` só executa o comando seguinte se o anterior tiver sido bem-sucedido (código «`0`»); «`||`» apenas se o anterior tiver falhado.

## Interromper um script ao primeiro erro: `set -e`

Por padrão, o Bash continua a executar as linhas seguintes mesmo que um comando falhe — o que muitas vezes não é desejável num script de automatização:

```bash
#!/bin/bash
set -e   # interrompe imediatamente o script se um comando falhar (código de saída diferente de zero)

cd /pasta/inexistant   # Se esta pasta não existir, o script termina aqui
echo "Cette ligne ne s'exécute jamais si cd a échoué"
```

Outras opções reforçam a robustez de um script, sendo frequentemente combinadas:

```bash
#!/bin/bash
set -euo pipefail
# -e: interrompe ao primeiro erro
# -u: erro se for utilizada uma variável não definida
# -o pipefail: um pipe falha se QUALQUER um dos seus comandos falhar (não apenas o último)
```

Consulte também o capítulo sobre a gestão de processos para saber o que acontece após o lançamento de um script em segundo plano.
