---
order: 11
---

# Permissões e manipulação de arquivos

No Linux/Unix, cada arquivo e diretório carrega **permissões** que determinam quem pode lê-lo, modificá-lo ou executá-lo. Este capítulo cobre tanto esse sistema de permissões quanto os comandos básicos para manipular arquivos e diretórios em linha de comando.

## Ler as permissões com `ls -l`

```bash
ls -l arquivo.txt
# -rw-r--r-- 1 usuario grupo 1024 28 jul 10:00 arquivo.txt
```

Os 10 primeiros caracteres se decompõem assim:

```text
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- direitos para os outros usuarios
|   |    +------- direitos para o grupo proprietario
|   +------------ direitos para o proprietario
+---------------- tipo (- = arquivo, d = diretorio, l = link simbolico)
```

Cada grupo de três caracteres representa **leitura** (`r`), **escrita** (`w`) e **execução** (`x`), nessa ordem: um `-` significa que o direito correspondente está ausente.

## `chmod`: modificar as permissões

### Notação simbólica

```bash
chmod u+x script.sh    # adiciona o direito de execucao para o proprietario (user)
chmod g-w arquivo.txt  # remove o direito de escrita para o grupo
chmod o=r arquivo.txt  # fixa os direitos dos outros como somente leitura, nada mais
chmod a+r arquivo.txt  # adiciona a leitura para todo mundo (all)
```

### Notação octal

Cada direito vale uma potência de 2: `r=4`, `w=2`, `x=1`; soma-se para cada categoria (proprietário, grupo, outros):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) para o proprietario
# 5 = r-x (4+0+1) para o grupo
# 5 = r-x (4+0+1) para os outros
```

| Valor | Direitos |
|---|---|
| `7` | `rwx` (leitura + escrita + execução) |
| `6` | `rw-` (leitura + escrita) |
| `5` | `r-x` (leitura + execução) |
| `4` | `r--` (somente leitura) |
| `0` | Nenhum direito |

> **Nota:** `chmod 644 arquivo` (leitura/escrita para o proprietário, somente leitura para o resto) é a configuração mais comum para um arquivo normal; `755` para um script ou diretório destinado a ser executado/percorrido.

## `chown`: mudar o proprietário

```bash
chown usuario arquivo.txt         # muda o proprietario
chown usuario:grupo arquivo.txt   # muda proprietario E grupo de uma vez
```

## Comandos básicos sobre arquivos

```bash
mkdir diretorio                    # cria um diretorio
mkdir -p a/b/c                     # cria toda a arvore de uma vez, sem erro se ja existir
touch arquivo.txt                  # cria um arquivo vazio (ou atualiza sua data de modificacao se existir)
cp origem.txt destino.txt          # copia um arquivo
cp -r diretorio_origem diretorio_destino  # copia recursiva, necessaria para um diretorio
mv antigo.txt novo.txt             # move OU renomeia (as duas sao a mesma operacao para mv)
rm arquivo.txt                     # remove um arquivo (definitivo, sem lixeira)
rm -r diretorio                    # remove um diretorio e todo seu conteudo
```

> **Nota:** `rm -rf` (recursivo + `-f` para ignorar confirmações/erros) é irreversível e não pede nenhuma confirmação: um alvo mal direcionado (ex. um caminho com um espaço a mais, `rm -rf ~ /diretorio` em vez de `rm -rf ~/diretorio`) pode excluir muito mais do que o previsto.

## `find`: buscar arquivos

```bash
find . -name "*.txt"                  # todos os arquivos .txt, a partir do diretorio atual
find /var/log -mtime -7               # arquivos modificados nos ultimos 7 dias
find . -type d -name "node_modules"   # todos os diretorios chamados "node_modules"
find . -name "*.tmp" -delete          # encontra E exclui em um unico comando
```

Veja também [Processamento de texto](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`) para ir mais longe na exploração do conteúdo desses arquivos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada arquivo tem permissões leitura/escrita/execução para proprietário/grupo/outros. `chmod` as modifica (notação simbólica ou octal), `chown` muda o proprietário. |
| **Ferramentas utilizáveis** | `ls -l`, `chmod`/`chown`, `mkdir`/`cp`/`mv`/`rm`, `find`. |
| **Armadilhas a evitar** | `rm -rf` sem verificar o alvo exato: irreversível, sem confirmação. |
| **Boas práticas** | `chmod 644` para um arquivo normal, `755` para um script/diretório executável; sempre verificar um comando `find ... -delete` testando-o primeiro sem `-delete`. |
