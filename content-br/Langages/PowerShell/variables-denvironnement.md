---
order: 4
---

# Variáveis de ambiente

Como no [Bash](/?c=shells&s=bash&p=bash), uma variável de ambiente é transmitida automaticamente aos processos filhos, mas o PowerShell a acessa via um espaço de nomes dedicado (`$env:`), distinto de suas variáveis comuns, em vez de uma simples convenção (`export`) aplicada a uma variável normal.

## Ler e modificar uma variável de ambiente

```powershell
$env:NOME = "Joao"      # cria ou modifica uma variavel de ambiente diretamente
Write-Output $env:NOME  # Joao
```

```powershell
# subscript.ps1
Write-Output $env:NOME    # exibe "Joao" se NOME foi definida pelo processo chamador, vazio senao
```

> **Nota:** como para `export` no Bash, a transmissão só funciona do pai para o filho: um subscript que modifica `$env:NOME` nunca repassa essa mudança para o script que o lançou, cada processo tendo sua própria cópia do ambiente.

## Variáveis de ambiente comuns

```powershell
$env:PATH          # lista dos diretorios onde o PowerShell procura os executaveis (separados por ";" no Windows)
$env:USERPROFILE   # diretorio pessoal do usuario atual (equivalente a $HOME)
$env:USERNAME      # nome do usuario atual
$env:COMPUTERNAME  # nome da maquina
```

## `$env:PATH`: como o PowerShell encontra um comando

Como no Bash, o PowerShell procura um executável em cada um dos diretórios listados em `$env:PATH`:

```powershell
$env:PATH
# C:\Windows\system32;C:\Windows;C:\Program Files\PowerShell\7

$env:PATH += ";C:\meu\diretorio\scripts"   # adiciona um diretorio extra a busca
```

> **Nota:** no Windows, os diretórios de `$env:PATH` são separados por `;`, ao contrário de `:` no Unix, uma diferença a ter em mente ao portar um script de um sistema para outro.

## Arquivos de configuração (perfis)

| Arquivo | Escopo |
|---|---|
| `$PROFILE` (CurrentUserCurrentHost) | Usuário atual, apenas PowerShell (Core) |
| Perfil "AllUsersAllHosts" | Todos os usuários da máquina |

```powershell
$PROFILE   # exibe o caminho do perfil atual (a criar se ainda nao existir)
```

É nesse perfil que tipicamente se adicionam as modificações de `$env:PATH`, os aliases personalizados, ou funções destinadas a estar disponíveis em cada nova sessão.

## `Set-Alias`: abreviar comandos frequentes

```powershell
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name gs -Value "git status"

ll   # equivalente a digitar "Get-ChildItem"
```

Um alias definido diretamente no console não sobrevive ao seu fechamento: para que fique disponível em cada nova sessão, precisa ser adicionado em `$PROFILE`.

## `. $PROFILE`: recarregar o perfil

Depois de uma modificação do perfil, o "dot sourcing" aplica as mudanças na sessão atual, sem precisar abrir um novo console:

```powershell
. $PROFILE
```

Esse `.` inicial (idêntico ao usado para [`source` em Bash](/?c=shells&s=bash&p=variables-denvironnement)) executa o script no contexto da sessão atual em vez de em um subprocesso isolado: sem ele, as funções e variáveis definidas no arquivo desapareceriam assim que sua execução terminasse.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma variável de ambiente PowerShell vive no espaço de nomes `$env:`, distinto das variáveis comuns; a transmissão aos processos filhos só funciona do pai para o filho, como `export` no Bash. |
| **Ferramentas utilizáveis** | `$env:PATH`, `$PROFILE`, `Set-Alias`, o dot sourcing (`. $PROFILE`). |
| **Armadilhas a evitar** | Esquecer que `;` separa os diretórios de `$env:PATH` no Windows, ao contrário de `:` no Unix. |
| **Boas práticas** | Colocar as modificações de `$env:PATH` e os aliases em `$PROFILE` para que fiquem disponíveis em cada nova sessão. |
