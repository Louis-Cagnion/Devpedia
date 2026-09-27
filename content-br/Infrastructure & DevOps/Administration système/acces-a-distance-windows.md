---
order: 8
---

# Windows: acesso remoto (RDP, tscon, shadowing)

Este capítulo se apoia nas [sessões do Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#as-sessoes-do-windows): uma sessão agrupa uma área de trabalho e os programas de um usuário conectado, e o **console** é a sessão exibida na tela física da máquina. Conectar-se remotamente desloca uma sessão de uma tela para outra, o que importa assim que um programa sem supervisão (um robô que pilota um navegador, um teste de interface) precisa de uma janela realmente exibida.

## A Área de Trabalho Remota (RDP)

A **Área de Trabalho Remota** permite usar uma máquina Windows a partir de outra, como se estivéssemos sentados diante dela: a tela dela aparece em uma janela, e o teclado e o mouse a pilotam. Ela se baseia no protocolo **RDP** (*Remote Desktop Protocol*), que escuta por padrão na [porta](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement#executar-um-servidor-local) 3389 da máquina remota ([Enable Remote Desktop on your PC](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/remote-desktop-allow-access)).

| Papel | Edições do Windows possíveis |
|---|---|
| Máquina à qual nos conectamos (host) | Pro, Enterprise, Education, Windows Server; nunca Home |
| Máquina a partir da qual nos conectamos (cliente) | Todas, inclusive Home |

O host é ativado em **Configurações > Sistema > Área de Trabalho Remota** (permissões de administrador necessárias); os membros do grupo Administradores e as contas adicionadas à lista podem então se conectar. Do lado do cliente, o aplicativo **Conexão de Área de Trabalho Remota** também é aberto pela linha de comando, com o nome [`mstsc`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc):

```powershell
# abre uma conexão para a máquina chamada pc-robo (pede uma conta e uma senha)
mstsc /v:pc-robo
```

## Conectar-se "toma" a sessão

Se a conta usada para se conectar já tem uma sessão aberta no console, a Área de Trabalho Remota não cria uma segunda sessão: ela **desloca** a sessão existente para a janela de conexão. A tela física passa então a exibir a tela de entrada do Windows.

```text
Antes            Sessão 1 (conta robô) ──► tela física (console)
Conexão RDP      Sessão 1 (conta robô) ──► janela mstsc do operador
                 tela física           ──► tela de entrada
Janela fechada   Sessão 1 (conta robô) ──► nenhuma tela: desconectada e bloqueada
```

| Etapa | Programas da conta robô | Exibição das janelas deles |
|---|---|---|
| Antes da conexão | Rodando | Na tela física |
| Durante a conexão | Rodando | Na janela do operador |
| Depois de fechar a janela | Ainda rodando | Em lugar nenhum: a sessão está desconectada (`Disc` em `query session`) e bloqueada |

> **Armadilha:** fechar a janela da Área de Trabalho Remota depois de verificar o robô. Os programas dele continuam rodando, mas sem tela: uma automação que clica em uma interface ou tira capturas de tela falha a partir desse momento. A Microsoft aponta isso para os testes de interface lançados por um agente de implantação ([Configure for UI testing](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/ui-testing-considerations)).

## Devolver a sessão ao console: `tscon`

O [`tscon`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tscon) liga uma sessão a outra tela. Com `/dest:console`, ele devolve a sessão à tela física em vez de deixá-la desconectada: a janela da Área de Trabalho Remota se fecha, e os programas recuperam uma tela, sem bloqueio.

```powershell
# lista as sessões; a linha marcada com ">" é a sessão atual, o número dela está na coluna ID
query session
# devolve a sessão número 1 à tela física (executar como administrador)
tscon 1 /dest:console
```

O número muda de uma conexão para outra. A Microsoft propõe um arquivo em lote que o encontra sozinho, a salvar com um nome terminado em `.bat` e a executar a partir de um atalho configurado em "Executar como administrador":

```text
rem para cada sessão da conta conectada, lê o número (3ª coluna) e a envia ao console
for /f "skip=1 tokens=3" %%s in ('query user %USERNAME%') do (
  %windir%\System32\tscon.exe %%s /dest:console
)
```

| | Fechar a janela da Área de Trabalho Remota | `tscon … /dest:console` |
|---|---|---|
| Sessão da conta | Desconectada, sem tela | Exibida na tela física |
| Bloqueio | Sim | Não |
| Programas que precisam de uma janela visível | Falham | Continuam |
| Permissões necessárias | Nenhuma | Administrador (veja [a elevação UAC](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#uac-permissoes-ligadas-a-cada-processo)) |

> **Armadilha:** esquecer que a máquina fica **desbloqueada**: qualquer pessoa que passe diante da tela física usa a sessão, com as permissões da conta. Reservar isso a uma máquina em uma sala fechada, com uma conta dedicada de permissões mínimas.
>
> **Armadilha:** `tscon` para a sessão de **outra** conta falha sem a senha dessa conta (parâmetro `/password`), mesmo para um administrador.

## Observar uma sessão sem tomá-la: o shadowing

O **shadowing** ("seguir como uma sombra") exibe, em uma janela da Área de Trabalho Remota, a sessão de outra conta **sem deslocá-la**: ela fica na tela dela, o operador a observa ao mesmo tempo e pode assumir o controle. Ele não precisa nem da senha dela, nem de fechar nada ao sair.

```powershell
# lista as sessões da máquina remota pc-robo, para encontrar o número (ID) a observar
query session /server:pc-robo
# observa a sessão 1 de pc-robo, com o controle, sem pedir autorização
mstsc /v:pc-robo /shadow:1 /control /noConsentPrompt
```

| Parâmetro do `mstsc` | Efeito |
|---|---|
| `/shadow:<ID>` | Número da sessão a observar |
| `/control` | Autoriza teclado e mouse; sem ele, apenas se observa |
| `/noConsentPrompt` | Não pede o consentimento do usuário observado, se a política da máquina permitir |

Três condições precisam ser atendidas na máquina observada:

| Condição | Detalhe |
|---|---|
| Política que autorize o shadowing | [Política de grupo](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#as-politicas-de-grupo-gpo) "Set rules for remote control of Remote Desktop Services user sessions" (nome em inglês, em Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Connections). Cinco níveis: nenhum controle, controle total ou apenas observação, cada um com ou sem a autorização do usuário ([Session Shadowing](https://learn.microsoft.com/en-us/archive/technet-wiki/19804.remote-desktop-services-session-shadowing)). Por padrão: controle total **com** autorização |
| Permissões do operador | Administrador da máquina, ou permissão de controle remoto concedida à conta dele (regra documentada para o antigo comando [`shadow`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/shadow), que o `mstsc /shadow` substitui desde o Windows Server 2012 R2) |
| Acesso de rede | O shadowing não passa apenas pela porta 3389: ele também usa o compartilhamento de arquivos do Windows ([SMB](https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview), porta 445) e [portas atribuídas na hora](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/default-dynamic-port-range-tcpip-chang). Um [firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) que só abre a 3389 o bloqueia; o Windows traz para isso uma regra integrada, chamada "Remote Desktop - Shadow (TCP-In)" em inglês |

> **Armadilha:** usar `/noConsentPrompt` quando a política exige a autorização do usuário. Uma solicitação aparece na sessão observada, e na de um robô não há ninguém para aceitá-la: o operador não vê nada.
>
> **Boa prática:** a observação sem autorização permite espionar uma sessão: reservá-la por política às contas de operadores que precisam dela, apenas nas máquinas envolvidas.

| | Conexão clássica e depois `tscon` | Shadowing |
|---|---|---|
| Senha da conta observada | Necessária (conectamos com ela) | Desnecessária (o operador usa a dele) |
| Sessão do robô durante a intervenção | Deixa a tela física | Fica na tela dela |
| Ao sair | `tscon` obrigatório, senão a sessão fica bloqueada | Basta fechar a janela |
| Ajustes prévios | Área de Trabalho Remota ativada | Política de grupo, permissões do operador, aberturas de rede |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Conectar-se pela Área de Trabalho Remota com uma conta desloca a sessão dela para a janela de conexão; fechar essa janela a deixa desconectada e bloqueada, sem tela. `tscon … /dest:console` a devolve à tela física; o shadowing a mostra a um operador sem deslocá-la. |
| **Ferramentas utilizáveis** | `mstsc /v:<máquina>`, `query session` (com `/server:<máquina>` a distância), `tscon <ID> /dest:console` como administrador, `mstsc /shadow:<ID> /control /noConsentPrompt`, a política de grupo de controle remoto. |
| **Armadilhas a evitar** | Fechar a janela da Área de Trabalho Remota sobre a sessão de um robô; esquecer que o `tscon` deixa a máquina desbloqueada; `/noConsentPrompt` contrariado pela política; um firewall que só abre a porta 3389 ao shadowing. |
| **Boas práticas** | Para verificar um robô, preferir o shadowing a uma conexão com a conta dele; senão, sempre sair pelo `tscon`; reservar o shadowing sem autorização aos operadores e máquinas que precisam dele. |
