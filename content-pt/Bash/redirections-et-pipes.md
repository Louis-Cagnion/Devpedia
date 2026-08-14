---
order: 8
---

# Redirecionamentos e pipes

Cada comando Unix comunica, por padrão, através de três fluxos: a entrada** padrão** (`stdin`, o que lê), a **saída padrão** (`stdout`, o que normalmente apresenta) e a **saída de erros** (`stderr`, para onde vão as mensagens de erro). As redireções e os pipes permitem redirecionar estes fluxos para um arquivo ou para outro comando, em vez de para o terminal.

> **Nota:** estes «fluxos» são, na realidade, **descritores de arquivos** numerados (`0`, `1`, `2`) — consulte o capítulo sobre chamadas do sistema e descritores de arquivos (secção C) para saber o que realmente acontece ao nível do sistema operativo quando estes são redirecionados.

## Redirecionar a saída para um arquivo

```bash
echo "Bonjour" > arquivo.txt    # substitui o arquivo.txt (ou cria-o) com este conteúdo
echo "Encore" >> arquivo.txt    # adiciona ao final do arquivo.txt, sem sobrescrever
```

> **Nota:** `>` substitui silenciosamente o conteúdo existente do arquivo de destino — um erro comum é utilizar `>` quando se pretendia `>>`, perdendo o conteúdo anterior sem aviso prévio.

## Redirecionar a entrada a partir de um arquivo

```bash
sort < lista.txt   # lê o arquivo «liste.txt» como entrada padrão do comando «sort», em vez de aguardar uma entrada do teclado
```

## Redirecionar a saída de erros

Os fluxos estão numerados: `0` = entrada padrão, `1` = saída padrão, `2` = saída de erro.

```bash
commande_qui_echoue 2> erreurs.log     # apenas a saída de erro é registada no arquivo erros.log
commande 1> saída.log 2> erreurs.log  # separa a saída normal e os erros em dois arquivos
commande > tout.log 2>&1               # redireciona o stdout para o arquivo «tout.log» e, em seguida, o stderr para o mesmo destino do stdout
commande &> tout.log                    # Atalho do Bash equivalente a «> tudo.log 2>&1»
```

> **Nota:** a ordem é importante para `2>&1`. `2>&1 > arquivo` não funciona como esperado: nessa altura, `2` ainda é redirecionado para o terminal (a saída padrão naquele momento), e apenas `1` é redirecionado posteriormente para `arquivo`. É necessário escrever `> arquivo 2>&1`: primeiro redirecionar `1` para `arquivo` e, em seguida, fazer com que `2` aponte para o mesmo destino que `1` **nesse preciso momento**.

## `/dev/null` : ignorar uma saída

Um arquivo especial que «engole» tudo o que nele se escreve, sem nunca armazenar nada — útil para eliminar um fluxo de que não se precisa:

```bash
commande_bruyante > /dev/null 2>&1   # ignora qualquer saída normal E qualquer erro
```

## Os pipes (`|`): encadeamento de comandos

Um pipe liga a saída padrão de um comando à entrada padrão do comando seguinte:

```bash
ls -l | grep ".txt"          # mantém apenas as linhas que contenham «.txt»
grep "404" access.log | wc -l   # conta as linhas que contêm «404» no arquivo
ps aux | sort -k 3 -nr | head -5      # Os 5 processos que mais consomem CPU
```

Cada comando de um pipe é executado simultaneamente, sendo que a saída de um alimenta a entrada do seguinte à medida que avança — não se trata de uma execução sequencial com armazenamento intermédio.

## `tee` : redirecionar mantendo a apresentação

`tee` grava a saída tanto num arquivo **como** na saída padrão (útil para visualizar um resultado enquanto o guarda):

```bash
ls -l | tee resultats.txt   # exibe o resultado na tela e guarda-o no arquivo resultats.txt
```

## Resumo dos símbolos

| Símbolo | Efeito |
|---|---|
| `>` | Redireciona a saída padrão, sobrescreve o arquivo |
| `>>` | Redireciona a saída padrão, acrescenta no final |
| `<` | Redireciona a entrada padrão a partir de um arquivo |
| `2>` | Redireciona a saída de erros |
| `&>` | Redireciona a saída padrão e de erro para o mesmo destino |
| `\|` | Liga a saída de um comando à entrada do seguinte |
