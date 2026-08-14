---
order: 10
---

# Permissões e manipulação de arquivos

No Linux/Unix, cada arquivo e pasta possui **permissões** que determinam quem pode lê-los, alterá-los ou executá-los. Este capítulo aborda tanto este sistema de permissões como os comandos básicos para manipular arquivos e pastas na linha de comandos.

## Ler as permissões com o comando «`ls -l`»

```bash
ls -l arquivo.txt
# -rw-r--r-- 1 usuário grupo 1024 28 de julho 10:00 arquivo.txt
```

Os primeiros 10 caracteres são os seguintes:

```
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- droits pour les autres utilisateurs
|   |    +------- droits pour le groupe propriétaire
|   +------------ droits pour le propriétaire
+---------------- type (- = fichier, d = dossier, l = lien symbolique)
```

Cada grupo de três caracteres representa **a leitura** (`r`), **a escrita** (`w`) e **a execução** (`x`), por esta ordem — um `-` significa que o direito correspondente não existe.

## `chmod` : alterar as permissões

### Notação simbólica

```bash
chmod u+x script.sh    # adiciona o direito de execução ao proprietário (usuário)
chmod g-w arquivo.txt   # retira o direito de escrita ao grupo
chmod o=r arquivo.txt   # define os direitos dos outros como «apenas leitura», nada mais
chmod a+r arquivo.txt   # adiciona a leitura para todos (all)
```

### Notação octal

Cada permissão corresponde a uma potência de 2: `r=4`, `w=2`, `x=1` — somam-se os valores para cada categoria (proprietário, grupo, outros):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) para o proprietário
# 5 = r-x (4+0+1) para o grupo
# 5 = r-x (4+0+1) para os restantes
```

| Valor | Direitos |
|---|---|
| `7` | `rwx` (leitura + escrita + execução) |
| `6` | `rw-` (leitura + escrita) |
| `5` | `r-x` (leitura + execução) |
| `4` | `r--` (somente leitura) |
| `0` | Sem direitos |

> **Nota:** «`chmod 644 arquivo`» (leitura/gravação para o proprietário, apenas leitura para os restantes) é a configuração mais comum para um arquivo normal; «`755`» para um script ou uma pasta destinada a ser executada/navegada.

## `chown` : alterar o proprietário

```bash
chown usuário arquivo.txt           # alterar o proprietário
chown usuário:grupo arquivo.txt    # Alterar o proprietário E o grupo de uma só vez
```

## Comandos básicos relativos a arquivos

```bash
mkdir pasta              # cria uma pasta
mkdir -p a/b/c              # cria toda a estrutura de diretórios de uma só vez, sem erros, caso já exista
touch arquivo.txt           # cria um arquivo vazio (ou atualiza a data de modificação, caso já exista)
cp fonte.txt destination.txt        # copia um arquivo
cp -r dossier_source dossier_dest    # cópia recursiva, necessária para uma pasta
mv ancien.txt nouveau.txt   # muda OU renomeia (ambas são a mesma operação para o comando «mv»)
rm arquivo.txt              # elimina um arquivo (definitivamente, sem passar pela lixeira)
rm -r pasta               # elimina uma pasta e todo o seu conteúdo
```

> **Nota:** `rm -rf` (recursivo + `-f` para ignorar confirmações/erros) é irreversível e não requer qualquer confirmação — um destino mal especificado (por exemplo, um caminho com um espaço a mais, `rm -rf ~ /pasta` em vez de `rm -rf ~/pasta`) pode eliminar muito mais do que o previsto.

## `find` : pesquisar arquivos

```bash
find . -name "*.txt"                 # todos os arquivos .txt, a partir da pasta atual
find /var/log -mtime -7               # arquivos alterados nos últimos 7 dias
find . -type d -name "node_modules"   # todas as pastas denominadas «node_modules»
find . -name "*.tmp" -delete          # Encontra E elimina com um único comando
```

Consulte também o capítulo sobre processamento de texto (`grep`, `sed`, `awk`) para aprofundar a exploração do conteúdo destes arquivos.
