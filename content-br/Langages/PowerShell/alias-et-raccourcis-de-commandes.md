---
order: 14
---

# Aliases e atalhos de comandos no PowerShell

Um **atalho de comando** é um nome curto que se digita no lugar de um comando longo ou de uma sequência de comandos. No [PowerShell](/?c=langages&s=powershell&p=powershell), o shell (o programa que lê o que você digita em um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) e o executa), existem várias ferramentas para isso, da mais simples à mais poderosa. Este capítulo as apresenta **em quatro níveis**, cada um apoiado no anterior:

| Nível | Necessidade | Ferramenta | Seção |
|---|---|---|---|
| 1 | Outro nome para um único comando | O **alias** (`Set-Alias`) | [Nível 1](#nivel-1-o-alias-simples) |
| 2 | Um comando com argumentos já preenchidos | Uma **função** curta | [Nível 2](#nivel-2-argumentos-fixos-com-uma-funcao) |
| 3 | Uma pequena ferramenta de verdade: parâmetros nomeados, valores padrão, [pipeline](/?c=langages&s=powershell&p=redirections-et-pipes) | Uma função avançada, depois um alias sobre ela | [Nível 3](#nivel-3-um-atalho-complexo) |
| 4 | Fazer tudo isso conviver sem surpresas | `Get-Command`, `$PROFILE`, dot sourcing (carregar um arquivo na sessão atual) | [Nível 4](#nivel-4-convivencia-e-armadilhas) |

Uma **cmdlet** (pronuncia-se « comandlete ») é um comando nativo do PowerShell, com nome `Verbo-Substantivo`, como `Get-ChildItem`; ela é apresentada em [os comandos básicos](/?c=langages&s=powershell&p=commandes-de-base). Um **argumento** é tudo o que se escreve depois do nome de um comando; um **parâmetro** é um argumento nomeado que começa com um hífen, como `-Force` em `Get-ChildItem -Force`. A **sessão** é o período que vai da abertura da janela do terminal até o seu fechamento. Este capítulo pressupõe que você já conheça [as funções](/?c=langages&s=powershell&p=fonctions) e [as variáveis de ambiente](/?c=langages&s=powershell&p=variables-denvironnement) (que apresentam o arquivo de perfil `$PROFILE`).

## O que é um alias e por que criar um

Um **alias** é um segundo nome dado a **um** comando. A imagem mais próxima é um contato em um telefone: a entrada « Mamãe » não contém uma conversa, ela designa um número. Quando você liga para « Mamãe », o telefone disca o número. Do mesmo modo, quando você digita o alias, o PowerShell executa o comando que ele designa.

```
   Você digita:   ll -Force
                   |
                   v
   1. O PowerShell lê a primeira palavra: ll
   2. Ele encontra o alias ll, que designa a cmdlet Get-ChildItem
   3. Ele substitui ll por Get-ChildItem e mantém o resto como está
                   |
                   v
   Ele executa:   Get-ChildItem -Force
```

Cria-se um alias para digitar menos (`ll` em vez de `Get-ChildItem`), para reencontrar um nome conhecido de outro shell, ou para manter um nome curto fácil de lembrar.

## Nível 1: o alias simples

### Criar um alias: `Set-Alias` e `New-Alias`

```powershell
# Set-Alias cria um alias: -Name dá o novo nome, -Value o comando designado
Set-Alias -Name ll -Value Get-ChildItem
# ll agora faz o mesmo que Get-ChildItem: lista a pasta atual
ll
# o que é escrito depois do alias é passado ao comando: aqui, o parâmetro -Force
ll -Force
# forma curta: sem as palavras -Name e -Value, a 1ª palavra é o nome, a 2ª o comando
Set-Alias g git
# g designa o programa git (a instalar à parte): « g status » executa « git status »
g status
```

Duas cmdlets criam um alias. Elas diferem em um único caso: o nome já existe.

| | `Set-Alias` | `New-Alias` |
|---|---|---|
| O nome ainda não existe | Cria o alias | Cria o alias |
| O nome já existe | **Substitui** o alias existente, sem aviso | **Recusa** e exibe um erro |
| Com `-Force` | Desnecessário | Se comporta como `Set-Alias` |
| Para usar em | Um arquivo de perfil que se recarrega | Criar um nome que se acredita livre, sendo avisado se não estiver |

```powershell
# primeira criação: o nome ll está livre, o alias é criado
New-Alias -Name ll -Value Get-ChildItem
# segunda criação do mesmo nome: erro, pois ll já existe (nada é modificado)
New-Alias -Name ll -Value Get-ChildItem
# com -Force, New-Alias substitui o alias existente, como Set-Alias
New-Alias -Name ll -Value Get-ChildItem -Force
```

Alguns parâmetros úteis dessas duas cmdlets (a página [Set-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/set-alias) e a página [New-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/new-alias) da Microsoft trazem a lista completa):

| Parâmetro | Função |
|---|---|
| `-Name` | O nome do alias |
| `-Value` | O nome do comando designado (um nome apenas, veja [o limite central](#o-limite-central-um-nome-nunca-um-comando-com-argumentos)) |
| `-Description` | Um texto livre que lembra para que serve o alias |
| `-Option ReadOnly` | Protege o alias: modificá-lo exige depois `-Force` |
| `-Scope Global` | Escolhe o escopo em que o alias vive (veja [o nível 4](#nivel-4-convivencia-e-armadilhas)) |

### Listar e encontrar um alias: `Get-Alias`

```powershell
# sem argumento, Get-Alias lista todos os alias da sessão (os seus incluídos)
Get-Alias
# o que designa o alias ls?
Get-Alias -Name ls
# quais alias designam a cmdlet Get-ChildItem? (encontrar o alias de uma cmdlet)
Get-Alias -Definition Get-ChildItem
# um curinga (veja abaixo): todos os alias cujo nome começa com g
Get-Alias -Name g*
```

Um **curinga** (*wildcard*) é um caractere especial que substitui letras desconhecidas: `*` substitui qualquer sequência de caracteres (veja [expansão e curingas](/?c=langages&s=powershell&p=expansion-et-jokers)). `Get-Alias` exibe uma linha por alias, na forma `ll -> Get-ChildItem` na coluna do nome. Com `-Definition Get-ChildItem`, encontram-se por exemplo `gci` e, no Windows, `dir` e `ls`, além de `ll` se você o criou. A página [Get-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-alias) detalha os parâmetros.

### O limite central: um nome, nunca um comando com argumentos

Um alias só sabe designar um **nome de comando**. Ele não pode conter um comando **seguido de seus argumentos**. O erro é frequente, porque funciona em outros shells (veja [a tabela de comparação](#e-no-bash-e-no-zsh)):

```powershell
# Armadilha: colocamos um comando E um argumento em -Value
Set-Alias -Name gs -Value "git status"
# A criação não produz nenhuma mensagem: o PowerShell não verifica nada nesse momento
# Digitamos o alias: é aí que o erro aparece
gs
# Erro, em essência: o termo git status não é reconhecido como o nome de uma cmdlet,
# de uma função, de um arquivo de script ou de um programa (o texto exato varia)
```

A explicação cabe em uma frase: o PowerShell lê `"git status"` como **um único nome**, com um espaço no meio, e procura um comando que se chame assim. Não existe nenhum. O alias é criado, mas aponta para o vazio.

```powershell
# Correto: o alias designa SOMENTE o nome git
Set-Alias -Name g -Value git
# O que se digita depois do alias é acrescentado como está: esta linha executa « git status »
g status
# mas não se pode fixar « status » no próprio alias: é preciso uma função
```

| Escrita | O que o PowerShell procura | Resultado |
|---|---|---|
| `Set-Alias -Name g -Value git` | Um comando chamado `git` | Funciona; `g status` executa `git status` |
| `Set-Alias -Name gs -Value "git status"` | Um comando chamado `git status` (com o espaço) | Erro ao usar |
| `Set-Alias -Name ll -Value "Get-ChildItem -Force"` | Um comando chamado `Get-ChildItem -Force` | Erro ao usar |

Para fixar um argumento em um atalho, é preciso passar ao [nível 2](#nivel-2-argumentos-fixos-com-uma-funcao).

### Remover um alias

```powershell
# Alias: comporta-se como uma unidade virtual que contém os alias
# Remove-Item (a cmdlet que remove) então retira o alias como se apaga um arquivo
Remove-Item Alias:ll
# o alias não existe mais: este comando sinaliza um erro « não encontrado »
Get-Alias -Name ll
```

O PowerShell apresenta os alias como os arquivos de uma unidade chamada `Alias:`. Veja também [a remoção de arquivos](/?c=langages&s=powershell&p=permissions-et-fichiers) com `Remove-Item`. No PowerShell (Core), a cmdlet [Remove-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/remove-alias) faz a mesma coisa; ela não existe na versão histórica que vem com o Windows, daí a forma `Remove-Item Alias:` que funciona em todo lugar.

### O escopo: apenas a sessão atual

Um alias criado no terminal fica guardado **na memória**, na sessão. Feche a janela e reabra: o alias não existe mais.

| Onde o alias é criado | Por quanto tempo ele vive |
|---|---|
| Digitado no terminal | Até o fechamento da janela |
| Em um script executado normalmente (`.\script.ps1`) | Até o fim do script (veja [o nível 4](#nivel-4-convivencia-e-armadilhas)) |
| No arquivo de perfil `$PROFILE` | Em cada nova sessão: é a solução |

### Tornar um alias permanente com `$PROFILE`

O **perfil** é um arquivo de script que o PowerShell executa a cada início de uma sessão interativa (veja [os arquivos de configuração](/?c=langages&s=powershell&p=variables-denvironnement#arquivos-de-configuracao-perfis)). Seu caminho fica guardado na variável `$PROFILE`, e seu valor depende do sistema: é preciso sempre lê-la em vez de adivinhá-la.

```powershell
# exibe o caminho do arquivo de perfil
$PROFILE
# Test-Path retorna True (verdadeiro) se o caminho existir, False (falso) caso contrário
# -not inverte esse resultado: o bloco só é executado se o arquivo NÃO existir
if (-not (Test-Path -Path $PROFILE)) {
    # New-Item cria o arquivo; -Force cria também as pastas que faltam
    # Out-Null descarta a mensagem que New-Item exibiria
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
# Add-Content acrescenta uma linha ao fim do arquivo, sem tocar no resto
Add-Content -Path $PROFILE -Value "Set-Alias -Name ll -Value Get-ChildItem"
# o ponto seguido de um espaço (dot sourcing) executa o arquivo NA sessão atual
. $PROFILE
```

O teste `if (-not (Test-Path ...))` não é decorativo: `New-Item -Force` sobre um arquivo **que já existe** o substitui por um arquivo vazio, e portanto apaga todas as suas configurações (as condições `if` são explicadas [no capítulo dedicado](/?c=langages&s=powershell&p=conditions)). O dot sourcing é detalhado no [nível 4](#nivel-4-convivencia-e-armadilhas).

Em um perfil que se recarrega com frequência, usa-se `Set-Alias` em vez de `New-Alias`: a segunda execução de `New-Alias` sobre um nome existente exibiria um erro a cada recarregamento.

## Nível 2: argumentos fixos com uma função

Assim que o atalho precisa **conter um argumento** (`git status`, `Get-ChildItem -Force`), o alias não basta mais: é preciso uma **função**, isto é, um bloco de instruções ao qual se dá um nome (veja [as funções](/?c=langages&s=powershell&p=fonctions)). Uma função se digita como um comando, então ela faz o papel de um atalho.

```powershell
# function declara uma função chamada gs; as chaves { } envolvem suas instruções
function gs {
    # $args: variável automática que contém o que é digitado depois de gs
    # @args: distribui esta lista em argumentos separados, depois de « git status »
    git status @args
}
```

O `@` antes de `args` chama-se **splatting** (do inglês *splat*, « respingar »): em vez de passar a lista como um único bloco, o PowerShell a distribui em tantos argumentos separados, cada um com seu sentido. Para uma cmdlet, `@args` mantém até os parâmetros nomeados (`-Force` continua sendo um parâmetro), o que `$args` sozinho não garante. `$args` é uma [variável automática](/?c=langages&s=powershell&p=variables#variaveis-automaticas), isto é, criada e preenchida pelo próprio PowerShell. A página [about_Splatting](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_splatting) detalha o mecanismo.

```powershell
gs                     # executa: git status
gs --short             # executa: git status --short
gs --short --branch    # executa: git status --short --branch
```

Mesmo princípio com uma cmdlet, da qual se fixa um parâmetro:

```powershell
# a função executa Get-ChildItem com -Force (exibir também os itens ocultos)
function la {
    # -Force é fixo; tudo o que se digita depois de « la » é acrescentado em seguida
    Get-ChildItem -Force @args
}
la                     # executa: Get-ChildItem -Force
la -Recurse            # executa: Get-ChildItem -Force -Recurse
la src                 # executa: Get-ChildItem -Force src
```

| | Alias | Função curta |
|---|---|---|
| Dar outro nome a um comando | Sim | Sim |
| Fixar um ou vários argumentos | **Não** | Sim |
| Repassar o que se digita depois | Sim, automaticamente | Sim, com `@args` |
| Encadear vários comandos | Não | Sim |
| Remove-se com | `Remove-Item Alias:nome` | `Remove-Item Function:nome` |
| Encontra-se com | `Get-Alias` | `Get-Command` ou `Get-ChildItem Function:` |

Uma função digitada no terminal também vive apenas na sessão: para mantê-la, coloca-se em `$PROFILE`, como um alias.

### Outra alternativa: os valores padrão dos parâmetros

Para que uma **cmdlet** receba sempre um parâmetro, sem criar um novo nome, o PowerShell tem a variável `$PSDefaultParameterValues`. É uma **tabela associativa**: uma lista de pares `chave = valor`.

```powershell
# a chave « Get-ChildItem:Force » designa o parâmetro -Force de Get-ChildItem
# $true significa « verdadeiro »: o parâmetro fica ativado a cada chamada da cmdlet
$PSDefaultParameterValues["Get-ChildItem:Force"] = $true
# remove esta configuração
$PSDefaultParameterValues.Remove("Get-ChildItem:Force")
```

| | Função `la` | `$PSDefaultParameterValues` |
|---|---|---|
| Novo nome para digitar | Sim (`la`) | Não: mantém-se `Get-ChildItem` |
| Funciona para um programa externo como `git` | Sim | Não: apenas cmdlets e funções |
| Visível no código que a usa | Sim | Não: a configuração age nos bastidores, inclusive sobre os scripts executados na sessão |

A página [about_Parameters_Default_Values](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parameters_default_values) da Microsoft documenta esta variável.

## Nível 3: um atalho complexo

Um atalho pode virar uma pequena ferramenta: recebe **parâmetros nomeados** (com um tipo e um valor padrão), aceita valores vindos de um **pipeline** (o encadeamento `comando1 | comando2` em que a saída do primeiro se torna a entrada do segundo, veja [os pipes](/?c=langages&s=powershell&p=redirections-et-pipes)) e se comporta como uma cmdlet de verdade. Exemplo: listar os maiores arquivos de uma ou mais pastas.

```powershell
function Get-ArquivoGrande {
    # atributo: uma configuração entre colchetes colocada antes de param; esta dá à função
    # o comportamento de uma cmdlet (parâmetros comuns como -Verbose)
    [CmdletBinding()]
    param(
        # este parâmetro também pode receber seus valores do pipeline
        [Parameter(ValueFromPipeline)]
        # [string]: o tipo texto; "." designa a pasta atual (valor padrão)
        [string]$Pasta = ".",
        # [int]: o tipo número inteiro; 5 se nada for informado
        [int]$Quantidade = 5
    )
    # bloco process: executado uma vez para cada valor recebido do pipeline
    process {
        # exibido somente se a chamada contiver -Verbose
        Write-Verbose "Analisando $Pasta"
        # todos os arquivos (-File) da pasta e de suas subpastas (-Recurse)
        Get-ChildItem -Path $Pasta -File -Recurse |
            # ordena do maior para o menor, conforme a propriedade Length (o tamanho)
            Sort-Object -Property Length -Descending |
            # mantém os $Quantidade primeiros, e somente as colunas Name e Length
            Select-Object -First $Quantidade -Property Name, Length
    }
}
```

| Elemento | Função |
|---|---|
| `[CmdletBinding()]` | Acrescenta os parâmetros comuns (`-Verbose`, `-ErrorAction`...) e **recusa** um argumento que a função não declara (`$args` não existe mais, portanto não há mais `@args`) |
| `[Parameter(ValueFromPipeline)]` | O parâmetro pode receber seus valores do pipeline |
| `[string]$Pasta = "."` | Um parâmetro nomeado `-Pasta`, de tipo texto, valendo `"."` se for omitido |
| `[int]$Quantidade = 5` | Um parâmetro nomeado `-Quantidade`, de tipo inteiro, valendo `5` se for omitido |
| `process { }` | O bloco repetido para cada valor que chega do pipeline |
| `Write-Verbose` | Uma mensagem de acompanhamento, invisível a não ser com `-Verbose` |

As páginas [about_Functions_CmdletBindingAttribute](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_cmdletbindingattribute) e [about_Functions_Advanced_Parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_advanced_parameters) da Microsoft trazem todas as opções.

```powershell
Get-ArquivoGrande                                 # pasta atual, os 5 maiores arquivos
Get-ArquivoGrande -Pasta src -Quantidade 3        # parâmetros nomeados
Get-ArquivoGrande src 3                           # sem os nomes: na ordem declarada
"src", "docs" | Get-ArquivoGrande -Quantidade 3   # pipeline: uma passagem por pasta
Get-ArquivoGrande -Pasta src -Verbose             # exibe também « Analisando src »
```

O nome `Get-ArquivoGrande` segue a convenção `Verbo-Substantivo`, o que facilita encontrá-lo (`Get-Command -Verb Get`), mas é longo de digitar. Cria-se então um **alias sobre a função**: `Set-Alias` aceita o nome de uma função tanto quanto o de uma cmdlet.

```powershell
# o alias grande designa a função Get-ArquivoGrande
Set-Alias -Name grande -Value Get-ArquivoGrande
grande                 # executa: Get-ArquivoGrande
grande -Quantidade 3   # os parâmetros seguem o alias, como em uma cmdlet
"src" | grande         # o pipeline também funciona através do alias
Get-Alias -Name grande # confirma: grande -> Get-ArquivoGrande
```

A lógica fica na função; o alias é apenas o nome curto. Essa é a divisão recomendada: um nome completo para os scripts, um nome curto para digitar à mão.

## Nível 4: convivência e armadilhas

### Quem responde quando se digita um nome?

Vários comandos podem ter o mesmo nome. O PowerShell escolhe segundo uma ordem fixa (alias, depois função, depois cmdlet, depois programa), descrita em [o capítulo sobre a arquitetura de um shell](/?c=langages&s=powershell&p=architecture-dun-shell#como-o-powershell-encontra-qual-comando-lancar). Consequência direta: um alias **sempre vence** uma função de mesmo nome, e uma função vence a cmdlet. `Get-Command` ([documentação](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/get-command)) mostra quem responde.

```powershell
# gl já é um alias fornecido pelo PowerShell (ele designa Get-Location)
# achamos estar criando um atalho para « git log », mas o alias passa na frente
function gl { git log --oneline @args }
# exibe a pasta atual: foi o alias que respondeu, não a nossa função
gl
# quem responde ao nome gl? (o comando que vence)
Get-Command -Name gl
# -All mostra também os comandos mascarados, na ordem de prioridade
Get-Command -Name gl -All
# removemos a função que ficou inútil: Function: é a unidade virtual das funções
Remove-Item Function:gl
```

Antes de escolher um nome, verifica-se que ele está livre:

```powershell
# -ErrorAction SilentlyContinue: não exibir nada se nenhum comando tiver esse nome
$existente = Get-Command -Name glg -ErrorAction SilentlyContinue
# a variável fica vazia (falso) se o nome estiver livre, preenchida (verdadeiro) se não
if ($existente) { "Nome já em uso" } else { "Nome livre" }
```

| Você define | O nome já é ocupado por | O que responde em seguida |
|---|---|---|
| Uma função `gl` | O alias `gl` | O alias: sua função nunca é chamada |
| Um alias `ls` | O alias padrão `ls` (que designa `Get-ChildItem`) | O seu substitui o padrão, a não ser que o alias padrão esteja protegido |
| Uma função com nome de cmdlet (`Get-Date`) | A cmdlet | Sua função, em toda a sessão |
| Um alias com nome de programa (`git`) | O programa | Seu alias: o programa fica mascarado |

Os alias padrão (`ls`, `cp`, `cat`, `rm`...) estão listados em [os alias familiares](/?c=langages&s=powershell&p=commandes-de-base#aliases-familiares). Redefini-los é tentador, mas arriscado: seus hábitos, os exemplos encontrados na internet e os scripts dos seus colegas contam com o sentido original deles. Outra armadilha: esses alias não são iguais em toda parte. O PowerShell no Linux e no macOS deixa, para certos nomes como `ls`, o comando do sistema responder; a versão histórica que vem com o Windows chega a definir `curl` como alias de `Invoke-WebRequest`. Na dúvida, `Get-Command` dá a resposta na máquina em que você está.

### Contornar um alias ou uma função

| Eu quero | Escrita | Observação |
|---|---|---|
| A cmdlet escondida atrás de um alias | Seu nome completo: `Get-ChildItem` | O alias só é consultado pelo seu nome curto |
| A cmdlet quando uma função de mesmo nome a mascara | `Microsoft.PowerShell.Management\Get-ChildItem` | O nome é precedido pelo nome do seu módulo (o pacote que contém a cmdlet) |
| Um programa mascarado por um alias ou função | `& (Get-Command git -CommandType Application)` | `&` (operador de chamada) executa o comando designado pelo que vem depois |
| Remover a máscara para a sessão | `Remove-Item Alias:nome` ou `Remove-Item Function:nome` | Vale até a próxima sessão |
| Ver se um problema vem dos seus atalhos | `pwsh -NoProfile` | `pwsh` inicia uma nova sessão do PowerShell (Core), aqui sem ler `$PROFILE`; `powershell -NoProfile` para a versão que vem com o Windows |

### Não colocar seus atalhos em um script compartilhado

Seus alias e suas funções existem **na sua máquina**, porque o seu perfil os cria. Um script que usa `gs` ou `ll` falha na máquina de um colega, em um servidor, ou em uma tarefa agendada (um comando executado automaticamente em hora fixa) que não carrega perfil. Em um script destinado a ser compartilhado, escrevem-se os nomes completos: `Get-ChildItem`, `git status`. Os atalhos são feitos para digitar rápido à mão, não para serem lidos por outros.

Há uma segunda sutileza, do lado da definição. Um script executado normalmente roda no seu **escopo próprio** (a zona da sessão onde vivem os nomes, veja [o escopo das variáveis](/?c=langages&s=powershell&p=variables#escopo-das-variaveis)), e o que ele cria ali desaparece quando ele termina.

```powershell
# atalhos.ps1 contém a linha: Set-Alias -Name ll -Value Get-ChildItem
# execução normal: o script tem seu próprio escopo, que é destruído ao final
.\atalhos.ps1
# erro: o alias ll não existe mais
ll
# dot sourcing: o ponto, um espaço, depois o caminho; o script roda no escopo
# atual (o da sessão), e seus alias e funções permanecem ali
. .\atalhos.ps1
# desta vez, ll existe
ll
```

### Organizar o seu `$PROFILE`

Um perfil que cresce torna-se ilegível. Deixa-se nele algumas linhas, que carregam por dot sourcing um arquivo dedicado colocado no mesmo lugar.

```powershell
# --- conteúdo de $PROFILE (o arquivo de perfil) ---
# Split-Path -Parent: a pasta que contém o perfil
$pastaPerfil = Split-Path -Path $PROFILE -Parent
# Join-Path junta uma pasta e um nome de arquivo com o separador correto
$atalhos = Join-Path -Path $pastaPerfil -ChildPath "atalhos.ps1"
# carrega o arquivo somente se ele existir, para não gerar erro na inicialização
if (Test-Path -Path $atalhos) { . $atalhos }
```

```powershell
# --- conteúdo de atalhos.ps1 (na mesma pasta do perfil) ---
Set-Alias -Name ll -Value Get-ChildItem        # nível 1: alias simples
Set-Alias -Name g -Value git                   # nível 1: alias para um programa
function gs { git status @args }               # nível 2: argumento fixo
function glg { git log --oneline --graph @args }
```

Como o perfil também é carregado por dot sourcing, os alias e funções de `atalhos.ps1` permanecem disponíveis em toda a sessão. Para aplicar uma modificação sem reabrir o terminal: `. $PROFILE`.

| Arquivo | Conteúdo | Por quê |
|---|---|---|
| `$PROFILE` | As três linhas de carregamento e as configurações do ambiente (veja [as variáveis de ambiente](/?c=langages&s=powershell&p=variables-denvironnement)) | Fica curto e legível |
| `atalhos.ps1` | Todos os alias e funções pessoais | Um único lugar para reler, fazer backup, copiar para outra máquina |
| Um script compartilhado | Nenhum atalho pessoal | Ele precisa funcionar sem o seu perfil |

No Windows, o perfil e `atalhos.ps1` são scripts: a **política de execução** pode impedir o carregamento deles na inicialização. Essa configuração de segurança é descrita em [o capítulo sobre os scripts](/?c=langages&s=powershell&p=ecrire-et-executer-un-script#sem-shebang-mas-com-uma-politica-de-execucao).

## Síntese dos níveis

| Nível | Necessidade | Ferramenta | Limite |
|---|---|---|---|
| 1 | Outro nome para um comando | `Set-Alias -Name ll -Value Get-ChildItem` | Um nome apenas: nenhum argumento fixo; sessão atual somente, sem perfil |
| 2 | Um comando com argumentos fixos | `function gs { git status @args }` | Sem parâmetros nomeados nem valores padrão; sem pipeline estruturado |
| 3 | Parâmetros nomeados, valores padrão, pipeline | Função com `[CmdletBinding()]`, depois `Set-Alias` sobre ela | Mais longo para escrever; o nome completo continua a ser lembrado para os scripts |
| 4 | Vários atalhos sem conflito, recarregados a cada sessão | `Get-Command`, `$PROFILE`, dot sourcing | Um atalho pessoal não existe nas outras máquinas |

## E no Bash e no Zsh?

As mesmas perguntas se colocam no [Bash](/?c=langages&s=bash&p=bash) e no [Zsh](/?c=langages&s=zsh&p=zsh) (dois outros shells, comuns no Linux e no macOS), com uma diferença de fundo: o comando `alias` deles guarda um **texto** que substitui a palavra digitada antes que a linha seja analisada. Esse texto pode, portanto, conter argumentos, o que é impossível no PowerShell.

| | PowerShell | Bash | Zsh |
|---|---|---|---|
| Criar | `Set-Alias -Name ll -Value Get-ChildItem` | `alias ll='ls -la'` | `alias ll='ls -la'` |
| Conteúdo do alias | Um nome de comando apenas | Um texto qualquer, com argumentos | Igual ao Bash |
| Alias com argumento fixo | Impossível: uma função | `alias gs='git status'` funciona | Igual ao Bash |
| Listar | `Get-Alias` | `alias` | `alias` |
| Remover | `Remove-Item Alias:ll` | `unalias ll` | `unalias ll` |
| Quem responde ao nome | `Get-Command nome` | `type -a nome` | `type -a nome` ou `whence -a nome` |
| Contornar | Nome completo, `&` | `\nome` ou `command nome` | Igual ao Bash |
| Tornar permanente | Arquivo `$PROFILE` | `~/.bashrc` (veja [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement)) | `~/.zshrc` (veja [os arquivos de inicialização](/?c=langages&s=zsh&p=fichiers-de-demarrage)) |
| Em um script | Ausente, salvo definição no script ou dot sourcing | Não expandido por padrão em um script | Definido em `~/.zshrc`, lido somente por um shell interativo: um script não o vê |
| Necessidade de lógica ou parâmetros | Função (níveis 2 e 3) | Função (veja [as funções do Bash](/?c=langages&s=bash&p=fonctions)) | Função |

Os alias avançados próprios do Bash e do Zsh não são tratados aqui: eles pertencem aos capítulos [Alias avançados no Bash](/?c=langages&s=bash&p=alias-avances) e [Alias avançados no Zsh](/?c=langages&s=zsh&p=alias-avances).

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| `Set-Alias -Name gs -Value "git status"` | O alias designa apenas um nome: o erro só aparece no uso | Uma função: `function gs { git status @args }` |
| Alias criado no terminal | Perdido ao fechar a sessão | Acrescentá-lo ao arquivo `$PROFILE` |
| `New-Alias` em um perfil recarregado | Erro a cada recarregamento, pois o nome já existe | `Set-Alias` no perfil |
| `New-Item -Force` sobre um `$PROFILE` existente | O arquivo é substituído por um arquivo vazio | Testar antes com `Test-Path` |
| Função sem `@args` | O que se digita depois do atalho é ignorado | Terminar a linha com `@args` |
| `[CmdletBinding()]` combinado com `$args` | Um argumento não declarado é recusado, e `$args` não está mais disponível | Declarar cada parâmetro em `param()` |
| Função com o nome de um alias existente (`gl`) | O alias passa na frente: a função nunca é executada | `Get-Command -Name nome` antes de escolher |
| Redefinir `ls`, `cp`, `cat`, `rm`... | Os hábitos e os exemplos online perdem o sentido | Escolher um novo nome livre |
| Supor os mesmos alias em toda parte | Conforme o sistema e a versão, um nome designa outro comando, ou nenhum | Verificar com `Get-Command` na máquina em questão |
| Atalhos em um script compartilhado | Eles não existem nas máquinas dos outros, nem em uma tarefa agendada | Escrever os nomes completos nos scripts |
| Alias definido em um script executado normalmente | Ele desaparece ao fim do script | Dot sourcing (`. .\arquivo.ps1`) |
| `$PSDefaultParameterValues` esquecido | Altera o comportamento de todas as cmdlets envolvidas, scripts incluídos | Reservá-lo para uma configuração assumida, anotando-o em `atalhos.ps1` |
| Perfil bloqueado pela política de execução | O arquivo é ignorado na inicialização, e os atalhos faltam | Ajustar a política como no capítulo sobre os scripts |
| Perfil pesado demais | Cada abertura do terminal fica mais lenta | Colocar nele apenas o útil |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um alias para um simples renomeio, uma função assim que um argumento é fixo | Cada ferramenta permanece no seu domínio |
| Terminar as funções-atalho com `@args` | O que se digita depois do atalho chega até o comando |
| Para um atalho rico: uma função `Verbo-Substantivo` com `[CmdletBinding()]`, depois um alias curto | Um nome completo para os scripts, um nome curto para a mão |
| Verificar o nome com `Get-Command` antes de criá-lo | Nenhuma máscara involuntária |
| `Set-Alias` no perfil, `New-Alias` para um nome que se acredita livre | Recarregamento sem erro; aviso se o nome já estiver ocupado |
| Guardar todos os atalhos em `atalhos.ps1`, carregado por dot sourcing a partir de `$PROFILE` | Um perfil curto, atalhos fáceis de fazer backup |
| Escrever os nomes completos em todo script compartilhado | O script funciona em todas as máquinas |
| Testar com `pwsh -NoProfile` quando um comportamento parecer estranho | Descartar os atalhos como causa |
| Manter o perfil leve | Um terminal que abre rápido |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **alias** é um segundo nome para **um** comando: `Set-Alias -Name ll -Value Get-ChildItem` (substitui um alias existente) ou `New-Alias` (recusa, salvo com `-Force`); `Get-Alias` lista e encontra (`-Definition` para partir de uma cmdlet); `Remove-Item Alias:ll` remove. Ele vive na sessão e se torna permanente por `$PROFILE`. O limite central: `-Value` é um **nome de comando**, nunca um comando seguido de argumentos; `Set-Alias -Name gs -Value "git status"` procura um comando chamado « git status » e falha ao ser usado. Com argumentos fixos, escreve-se uma **função** (`function gs { git status @args }`, com `@args` repassando o que se digita depois). Para um atalho complexo: função com `[CmdletBinding()]`, parâmetros nomeados e tipados com valores padrão, `[Parameter(ValueFromPipeline)]` e bloco `process`, depois `Set-Alias` sobre o seu nome. Um alias vence uma função, que vence uma cmdlet: `Get-Command nome -All` mostra quem responde. O perfil carrega por dot sourcing um arquivo `atalhos.ps1`. Bash e Zsh guardam um texto inteiro em `alias`, com argumentos. |
| **Armadilhas a evitar** | Pôr um argumento em `-Value`; achar que um alias sobrevive à sessão; `New-Alias` em um perfil recarregado; `New-Item -Force` em um perfil existente; função sem `@args`; `[CmdletBinding()]` com `$args`; função mascarada por um alias do mesmo nome; redefinir `ls`, `cp`, `cat`; atalhos pessoais em um script compartilhado; alias definido em um script sem dot sourcing; perfil bloqueado pela política de execução. |
| **Boas práticas** | Alias para renomear, função para fixar argumentos, função avançada mais alias para uma ferramenta de verdade; `Get-Command` antes de nomear; `Set-Alias` no perfil; todos os atalhos em `atalhos.ps1`; nomes completos nos scripts compartilhados; `pwsh -NoProfile` para descartar seus atalhos num diagnóstico. |
