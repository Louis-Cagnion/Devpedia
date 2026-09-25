---
order: 7
---

# Windows: serviços, sessões e permissões

Este capítulo explica como o [Windows](/?c=infrastructure-devops&s=systemes-d-exploitation) organiza os programas que rodam em uma máquina: quem os inicia, em qual tela eles aparecem e com quais permissões. Essas noções ficam concretas assim que se quer rodar um programa sem supervisão (um robô que controla um navegador, um agente de implantação): dependendo de como ele é iniciado, sua janela pode ficar invisível, ou suas permissões amplas demais.

Lembrete das peças usadas aqui: um **programa** em execução se chama [processo](/?c=langages&s=powershell&p=gestion-des-processus); cada processo roda em nome de uma **conta de usuário** (uma identidade com suas permissões, veja [as permissões](/?c=langages&s=powershell&p=permissions-et-fichiers)).

## As sessões do Windows

Uma **sessão** agrupa uma área de trabalho (a tela inicial com suas janelas) e todos os programas iniciados por um usuário conectado. Várias sessões podem existir ao mesmo tempo na mesma máquina, cada uma com seu próprio número.

```text
Máquina Windows
├── Sessão 0: serviços (nenhum usuário, nenhuma tela)
├── Sessão 1: Alice, conectada na tela física  ← o console
└── Sessão 2: Bob, conectado remotamente
```

| Termo | O que é |
|---|---|
| **Sessão interativa** | Sessão de um usuário conectado, com uma área de trabalho onde suas janelas aparecem |
| **Console** | A sessão ligada à tela, ao teclado e ao mouse físicos da máquina |
| **Sessão bloqueada** | Sessão ainda aberta (programas em execução), mas escondida atrás da tela de login |

Bloquear uma sessão (teclas `Windows` + `L`) não fecha nenhum programa: eles continuam rodando. Por outro lado, a imagem não é mais enviada para nenhuma tela: um programa que depende de uma janela realmente visível (captura de tela, automação que clica em uma interface) pode então falhar ou produzir apenas imagens pretas.

```powershell
# lista as sessões da máquina com seu número e seu estado
query session
```

| Coluna exibida | Significado |
|---|---|
| `SESSIONNAME` | `services` para a sessão 0, `console` para a tela física, `rdp-tcp#…` para uma conexão remota |
| `ID` | Número da sessão |
| `STATE` | `Active` (em uso), `Disc` (desconectada, mas ainda aberta) |

## Os serviços do Windows e o isolamento da Sessão 0

Um **serviço** é um programa que o próprio Windows inicia, muitas vezes assim que a máquina liga, sem esperar que um usuário se conecte (um antivírus, um servidor web, um agente de implantação). Documentação: [Services](https://learn.microsoft.com/en-us/windows/win32/services/services).

Desde o Windows Vista, todos os serviços rodam na **Sessão 0**, uma sessão reservada que não está ligada a nenhuma tela, nem física nem remota. É o **isolamento da Sessão 0**: ele impede que um programa malicioso iniciado por um usuário envie mensagens às janelas de um serviço (que muitas vezes tem permissões elevadas).

| | Programa iniciado por um usuário | Serviço |
|---|---|---|
| Início | Quando o usuário o abre | Pelo Windows, muitas vezes na inicialização da máquina |
| Sessão | A do usuário (1, 2…) | Sempre a Sessão 0 |
| Janela | Visível na área de trabalho do usuário | Criada e desenhada na memória, mas nunca visível |
| Funciona sem usuário conectado | Não | Sim |

> **Armadilha:** rodar como serviço um programa que precisa de uma janela visível, por exemplo um robô que controla um navegador em modo janela. O programa roda sem erros, mas ninguém consegue ver nem desbloquear sua janela (um captcha a resolver à mão, por exemplo). A ferramenta que permitia dar uma olhada na Sessão 0 (*Interactive Services Detection*) foi removida no Windows 10 versão 1803 ([Interactive Services](https://learn.microsoft.com/en-us/windows/win32/services/interactive-services)).
>
> **Boa prática:** um programa que precisa exibir uma janela é iniciado em uma sessão interativa (na abertura da sessão de uma conta dedicada, veja a próxima seção), nunca como serviço.

```powershell
# lista os serviços e seu estado (Running = em execução, Stopped = parado)
Get-Service
# mostra, para cada serviço, a conta com a qual ele roda
Get-CimInstance Win32_Service | Select-Object Name, State, StartName
```

## Abrir uma sessão automaticamente (autologon) e os segredos LSA

Um programa que precisa rodar em uma sessão interativa precisa que uma sessão esteja aberta, inclusive depois de reiniciar a máquina. O **login automático** (*autologon*) conecta uma conta escolhida a cada inicialização, sem que ninguém digite a senha.

Para isso, o Windows precisa conhecer a senha da conta. Ele a guarda nos **segredos LSA**: a **LSA** (*Local Security Authority*) é o componente do Windows que verifica as identidades e guarda informações sensíveis de forma criptografada ([LSA Authentication](https://learn.microsoft.com/en-us/windows/win32/secauthn/lsa-authentication)). A ferramenta oficial [Autologon](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon) (Sysinternals) configura esse mecanismo sem gravar a senha em texto puro.

| | O que o autologon traz | O que ele custa |
|---|---|---|
| Disponibilidade | A sessão se reabre sozinha depois de cada reinicialização | A sessão fica aberta o tempo todo: qualquer pessoa com acesso físico à tela pode usá-la |
| Senha | Ninguém precisa digitá-la | Criptografada, mas recuperável por qualquer administrador da máquina |

> **Armadilha:** ativar o autologon com uma conta pessoal ou com uma conta que tem permissões em outras máquinas: um administrador desta única máquina pode extrair a senha e usá-la em outro lugar.
>
> **Boa prática:** reservar o autologon a uma conta dedicada, local, com o mínimo de permissões (princípio do [menor privilégio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)), e restringir fisicamente o acesso à máquina.

## UAC: permissões ligadas a cada processo

No Windows, as permissões não estão ligadas à sessão, mas a cada processo, por meio de um **token de acesso** (*access token*): uma ficha que o Windows anexa ao processo quando ele é iniciado e que lista a conta, seus grupos e seus privilégios ([Access Tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens)).

O **UAC** (*User Account Control*, controle de conta de usuário) faz com que até uma conta de administrador inicie seus programas com um token **filtrado**, sem as permissões de administração. Essas permissões só são concedidas a um processo específico, depois de uma confirmação ([User Account Control](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/)).

| Situação | Token do processo iniciado |
|---|---|
| Programa iniciado normalmente, mesmo por um administrador | Filtrado: permissões de usuário padrão |
| "Executar como administrador", depois confirmação | Completo, só para este processo |
| Conta padrão + credenciais de um administrador digitadas na janela do UAC | Token desse administrador, só para este processo; a conta conectada não ganha nenhuma permissão |

Analogia: uma operadora de caixa (conta padrão) chama a gerente, que digita o código dela no caixa para validar uma única operação. A gerente não entrega o código, e o caixa não fica desbloqueado para o que vier depois.

```powershell
# mostra os grupos do token do console atual;
# a linha "Mandatory Label" indica Medium (filtrado) ou High (elevado)
whoami /groups
# inicia um novo console PowerShell com um token elevado (janela do UAC)
Start-Process powershell -Verb RunAs
```

> **Armadilha:** achar que um programa herda as permissões de administrador porque a conta conectada é administradora. Sem elevação explícita, ele roda com um token filtrado e falha em qualquer ação restrita (gravar em `C:\Program Files`, alterar um serviço).
>
> **Boa prática:** elevar só o processo que precisa, no momento em que precisa, em vez de dar permissões de administração permanentes à conta.

## Contas de serviço: locais ou de domínio

Uma **conta de serviço** é uma conta de usuário dedicada a uma aplicação, e não a uma pessoa ([Service User Accounts](https://learn.microsoft.com/en-us/windows/win32/services/service-user-accounts)). Não se deve confundi-la com a conta de serviço usada entre aplicações web, vista em [a propagação de identidade](/?c=securite&s=delegation-et-federation-didentite&p=on-behalf-of): aqui, trata-se de uma verdadeira conta do Windows, que abre sessões e inicia processos.

Nas empresas, as contas costumam ser gerenciadas pelo **Active Directory** (AD): um diretório central, hospedado em servidores dedicados, que conhece todas as contas e todas as máquinas da empresa; o conjunto de máquinas que ele gerencia se chama **domínio** ([Active Directory Domain Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)).

| Tipo de conta | Existe | Se a senha for roubada |
|---|---|---|
| **Local** | Em uma única máquina | O atacante só consegue agir nessa máquina |
| **De domínio** (AD) | Em todas as máquinas do domínio | O atacante pode usá-la em qualquer lugar onde essa conta tenha permissões |

> **Boa prática:** para um programa que roda em uma única máquina, preferir uma conta local sem permissões de administração: o roubo da senha (por exemplo pelo autologon acima) só dá acesso a essa máquina.

## As políticas de grupo (GPO)

Uma **política de grupo** (*Group Policy Object*, GPO) é um conjunto de configurações definidas uma única vez pelos administradores de um domínio e aplicadas depois automaticamente a máquinas ou contas ([Group Policy overview](https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/group-policy-overview)). Exemplo: bloquear a tela depois de 10 minutos de inatividade em todas as máquinas.

Uma GPO se aplica a um grupo de máquinas ou de contas: os administradores podem, portanto, prever uma exceção, por exemplo não bloquear a sessão de uma conta de serviço cujo programa precisa de uma tela ativa.

```powershell
# mostra as políticas de grupo aplicadas à máquina e à conta atual
gpresult /r
```

> **Armadilha:** alterar à mão na máquina uma configuração que uma GPO impõe: ela é sobrescrita na próxima atualização das políticas (por padrão, a cada 90 minutos aproximadamente, e a cada reinicialização).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada sessão tem sua área de trabalho; os serviços rodam na Sessão 0, sem tela. As permissões ficam no token de cada processo (UAC), não na sessão. O autologon reabre uma sessão a cada inicialização guardando a senha nos segredos LSA. |
| **Ferramentas utilizáveis** | `query session`, `Get-Service`, `whoami /groups`, `Start-Process -Verb RunAs`, `gpresult /r`, Sysinternals Autologon. |
| **Armadilhas a evitar** | Rodar como serviço um programa que precisa de uma janela visível; ativar o autologon com uma conta de domínio; alterar à mão o que uma GPO impõe. |
| **Boas práticas** | Uma conta dedicada, local e sem permissões de administração para um programa autônomo; elevar um único processo, quando ele precisa; pedir uma exceção de GPO em vez de contorná-la. |
