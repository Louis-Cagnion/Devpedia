---
order: 11
---

# Permissões e manipulação de arquivos

O Windows não usa o modelo de permissões Unix (proprietário/grupo/outros, `rwx`) visto no capítulo equivalente do Bash: ele se apoia em **listas de controle de acesso** (ACL, *Access Control List*), mais refinadas mas mais verbosas. Este capítulo cobre esse sistema assim como os comandos básicos para manipular arquivos e diretórios.

## Ler as permissões com `Get-Acl`

```powershell
Get-Acl arquivo.txt | Format-List
```

Ao contrário dos 10 caracteres compactos do `ls -l` (`-rw-r--r--`), uma ACL do Windows lista explicitamente cada usuário ou grupo e os direitos concedidos a ele:

```text
Owner   : DESKTOP\usuario
Access  : DESKTOP\usuario Allow  FullControl
          BUILTIN\Users    Allow  ReadAndExecute
```

Cada linha de acesso associa uma **identidade** (usuário ou grupo) a um **direito** (`FullControl`, `Modify`, `ReadAndExecute`...); pode haver um número arbitrário delas, ao contrário das três categorias fixas do Unix (proprietário/grupo/outros).

## `Set-Acl`: modificar as permissões

```powershell
$acl = Get-Acl arquivo.txt
$regra = New-Object System.Security.AccessControl.FileSystemAccessRule("DESKTOP\joao", "ReadAndExecute", "Allow")
$acl.SetAccessRule($regra)
Set-Acl arquivo.txt $acl
```

> **Nota:** ao contrário de `chmod 755` (um único comando, um único número), modificar uma ACL do Windows exige recuperar a ACL existente, construir uma regra, e depois reaplicá-la, mais verboso mas permitindo conceder direitos diferentes a um número arbitrário de usuários em um mesmo arquivo, o que o modelo Unix não permite nativamente.

## `icacls`: o equivalente em linha de comando clássica

Mais próximo em espírito de `chmod`/`chown`, `icacls` continua muito usado na prática por sua concisão:

```powershell
icacls arquivo.txt /grant "joao:(R,W)"  # concede leitura+escrita ao usuario joao
icacls arquivo.txt /remove "joao"       # remove todos os direitos explicitos de joao
```

## Comandos básicos sobre arquivos

```powershell
New-Item -ItemType Directory -Path diretorio       # cria um diretorio
New-Item -ItemType Directory -Path a\b\c -Force    # cria toda a arvore de uma vez
New-Item -ItemType File -Path arquivo.txt          # cria um arquivo vazio
Copy-Item origem.txt destino.txt                    # copia um arquivo
Copy-Item -Recurse diretorio_origem diretorio_dest  # copia recursiva, necessaria para um diretorio
Move-Item antigo.txt novo.txt                       # move OU renomeia, como mv no Bash
Remove-Item arquivo.txt                             # remove um arquivo (vai para a lixeira por padrao no explorador, mas nao aqui)
Remove-Item -Recurse diretorio                      # remove um diretorio e todo seu conteudo
```

> **Nota:** como `rm -rf` no Bash, `Remove-Item -Recurse -Force` é irreversível na linha de comando (ao contrário de uma exclusão via o explorador do Windows, que passa pela lixeira): um alvo mal direcionado pode excluir muito mais do que o previsto, sem confirmação nem recurso.

## `Get-ChildItem -Recurse`: buscar arquivos (equivalente de `find`)

```powershell
Get-ChildItem -Path . -Filter "*.txt" -Recurse                                                       # todos os arquivos .txt, recursivamente
Get-ChildItem -Path C:\logs -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }  # modificados recentemente
Get-ChildItem -Recurse -Directory -Filter "node_modules"                                             # todos os diretorios chamados "node_modules"
Get-ChildItem -Recurse -Filter "*.tmp" | Remove-Item                                                 # encontra E exclui em uma unica cadeia
```

Veja também [Processamento de texto e objetos](/?c=shells&s=powershell&p=traitement-de-texte) (`Select-String`, `-replace`, `ConvertFrom-Json`) para ir mais longe na exploração do conteúdo desses arquivos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Windows usa ACLs (listas de controle de acesso) em vez do modelo proprietário/grupo/outros do Unix, mais verboso mas permitindo direitos diferentes para um número arbitrário de usuários. |
| **Ferramentas utilizáveis** | `Get-Acl`/`Set-Acl`, `icacls` (mais conciso), `New-Item`/`Copy-Item`/`Move-Item`/`Remove-Item`. |
| **Armadilhas a evitar** | `Remove-Item -Recurse -Force` é irreversível na linha de comando, ao contrário de uma exclusão via o explorador (lixeira). |
| **Boas práticas** | Usar `icacls` para uma modificação rápida e legível de ACL, `Get-Acl`/`Set-Acl` quando um controle fino por script é necessário. |
