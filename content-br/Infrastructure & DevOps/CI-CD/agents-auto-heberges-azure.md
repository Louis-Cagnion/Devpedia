---
order: 5
---

# Os agentes do Azure DevOps auto-hospedados

Um pipeline do Azure DevOps (veja [a sintaxe YAML dos pipelines](/?c=ci-cd&p=yaml-pipelines-azure)) não roda "dentro do Azure DevOps": ele é executado por um pequeno programa instalado em uma máquina, o **agente**. Este capítulo explica como instalar esse programa em uma máquina que você administra (um **agente auto-hospedado**), iniciá-lo e o que isso muda em termos de segurança.

## Agente, pool, job: quem executa o quê

| Termo | O que é |
|---|---|
| **Agente** | Programa instalado em uma máquina, que espera trabalho, o executa e devolve os logs |
| **Pool** | Lista de agentes com um nome; um pipeline pede um pool, não uma máquina específica |
| **Job** | Conjunto de steps confiado a um único agente do pool ([hierarquia de um pipeline](/?c=ci-cd&p=yaml-pipelines-azure)) |

```text
Azure DevOps (serviço online)              Sua máquina
┌──────────────────────────┐               ┌────────────────────────┐
│ Pipeline iniciado        │               │ Agente                 │
│ Pool "Robots": 1 job     │ <──────────── │ pergunta: "tem         │
│ em espera                │  conexão      │ trabalho para mim?"    │
└──────────────────────────┘  de saída     └────────────────────────┘
                              (HTTPS)
```

É o agente que contata o Azure DevOps, nunca o contrário: nenhuma porta precisa ser aberta para o exterior na sua máquina, basta que ela consiga alcançar `dev.azure.com` por HTTPS ([comunicação do agente](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#communication)).

## Agente da Microsoft ou auto-hospedado

| | Agente fornecido pela Microsoft | Agente auto-hospedado |
|---|---|---|
| Máquina | Máquina virtual nova a cada job, destruída depois | A sua, que permanece no lugar |
| Instalação das ferramentas | Já feita pela Microsoft (lista fixa) | Por sua conta (ferramentas, versões, licenças) |
| Acesso à rede interna | Não | Sim (banco de dados interno, servidor de implantação) |
| Janela visível, hardware específico | Não | Sim (tela, placa de vídeo, periférico) |
| Manutenção e segurança | Microsoft | Você |

Escolhe-se um agente auto-hospedado quando o job precisa de algo que o agente da Microsoft não pode oferecer: alcançar um servidor interno, usar uma ferramenta licenciada ou controlar uma interface gráfica (um robô que comanda um navegador com uma janela real, por exemplo).

## Instalar e registrar um agente

Etapas, na máquina de destino ([documentação para Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent)):

1. No Azure DevOps, abrir *Organization settings* > *Agent pools*, escolher o pool e depois *New agent*: o site fornece o link de download de um arquivo compactado.
2. Descompactar o arquivo em uma pasta **sem espaço** no caminho, por exemplo `C:\agents\robot-1`.
3. Em um console PowerShell iniciado **como administrador**, ir até essa pasta e executar `.\config.cmd`: o programa faz perguntas (endereço da organização, pool, nome do agente, modo de inicialização).
4. Para a autenticação, `config.cmd` pede um **token de acesso pessoal** (*Personal Access Token*, ou PAT: uma senha gerada, limitada a certas ações e a uma duração, já definida em [GitHub e as plataformas de hospedagem Git](/?c=git&p=github-et-plateformes)). Seu *scope* (escopo) deve ser *Agent Pools (Read & manage)*.

O PAT serve **apenas para o registro**: depois que o agente é inscrito no pool, ele usa suas próprias credenciais, guardadas em sua pasta. A conta que registra o agente deve ser administradora do pool; a que o executa, não.

> **Armadilha:** criar um PAT sem data de expiração, ou com permissões amplas ("Full access"), e esquecê-lo: o token continua válido mesmo que o agente não precise mais dele.
>
> **Boa prática:** um PAT limitado ao scope *Agent Pools (Read & manage)* e que expire em poucos dias, revogado assim que o agente estiver registrado.

## Modo serviço ou modo interativo

O agente pode iniciar de duas maneiras, conforme o que seus jobs precisam fazer ([interativo ou serviço](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#interactive-or-service)). As noções de serviço e de sessão do Windows são detalhadas em [Windows: serviços, sessões e permissões](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits).

| | Modo serviço | Modo interativo |
|---|---|---|
| Inicialização | Pelo Windows, quando a máquina liga | Ao executar `run.cmd` em uma sessão aberta |
| Usuário conectado necessário | Não | Sim (uma sessão precisa estar aberta) |
| Sessão | Sessão 0, sem tela | Sessão do usuário, com área de trabalho |
| Janelas dos jobs | Invisíveis | Visíveis |
| Reinício da máquina | O agente volta sozinho | O agente só volta se uma sessão abrir sozinha (autologon) |
| Opção do `config.cmd` | `--runAsService` | `--runAsAutoLogon` (ou nenhuma opção, e depois `run.cmd` à mão) |

> **Regra de escolha:** por padrão, modo serviço (é o que a Microsoft recomenda). Modo interativo apenas se um job precisar de uma janela real (teste de interface, robô que controla um navegador visível).

Com `--runAsAutoLogon`, o `config.cmd` configura a abertura automática de sessão (o mecanismo *autologon* e seus riscos estão descritos no [capítulo sobre Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) e inscreve o agente para iniciar quando essa sessão abrir. Por padrão, a máquina reinicia ao fim da configuração.

> **Armadilha:** um agente em modo interativo depende da sua sessão. Se a sessão for fechada, ou se alguém se conectar a ela remotamente e a deslocar (veja [o acesso remoto ao Windows](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)), os jobs gráficos falham ou produzem imagens pretas, e o agente aparece como "offline" se o console for fechado.
>
> **Boa prática:** reservar uma máquina (ou uma máquina virtual) para o agente interativo, com uma conta dedicada, e nunca entrar nela com essa mesma conta.

## Configurar sem intervenção

Para instalar vários agentes, ou refazer a configuração de forma idêntica, o `config.cmd` aceita todas as respostas como opções (`--unattended`: nenhuma pergunta é feita):

```powershell
cd C:\agents\robot-1
.\config.cmd --unattended `
  --url https://dev.azure.com/minha-organizacao `
  --auth pat `
  --token $env:AGENT_PAT `
  --pool Robots `
  --agent robot-1 `
  --runAsAutoLogon `
  --windowsLogonAccount robot-1 `
  --overwriteAutoLogon
```

| Opção | Função |
|---|---|
| `--url` | Endereço da organização do Azure DevOps |
| `--auth pat`, `--token` | Tipo de autenticação e token (usado apenas no registro) |
| `--pool`, `--agent` | Pool a ser integrado e nome do agente (único no pool) |
| `--runAsService` ou `--runAsAutoLogon` | Modo de inicialização (veja a seção anterior) |
| `--windowsLogonAccount`, `--windowsLogonPassword` | Conta do Windows que executa o agente e sua senha (desnecessária para uma conta integrada como `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Substitui um autologon já configurado na máquina |
| `--noRestart` | Evita reiniciar a máquina após um `--runAsAutoLogon` |
| `--replace` | Substitui um agente de mesmo nome já inscrito no pool |

Cada opção também pode ser fornecida por uma variável de ambiente: seu nome em maiúsculas, precedido de `VSTS_AGENT_INPUT_` (por exemplo `VSTS_AGENT_INPUT_TOKEN` para `--token`) ([configuração sem intervenção](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

> **Armadilha:** escrever `--token` ou `--windowsLogonPassword` em texto claro no comando: a linha fica no histórico do console (arquivo de histórico do PowerShell), nos scripts de instalação versionados, e pode ser lida na lista de processos enquanto executa.
>
> **Boa prática:** deixar o `config.cmd` fazer suas perguntas, ou ler o segredo de uma variável de ambiente preenchida a partir de um gerenciador de segredos (veja [a gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) e depois apagar a variável.

## Vários agentes em uma mesma máquina

Uma máquina pode hospedar vários agentes, desde que **cada um tenha sua própria pasta**: cada pasta contém a configuração do agente, suas credenciais e sua pasta de trabalho `_work`, que nunca deve ser compartilhada ([opções de configuração](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

```text
C:\agents\
├── robot-1\   (agente "robot-1", pool Robots, seu próprio _work)
├── robot-2\   (agente "robot-2", pool Robots, seu próprio _work)
└── deploy-1\  (agente "deploy-1", pool Implantação, seu próprio _work)
```

| Necessidade | Solução |
|---|---|
| Dois jobs em paralelo | Dois agentes no mesmo pool |
| Separar dois usos (robô / implantação) | Dois pools, cada um com seus agentes |
| Dois agentes com permissões diferentes | Duas contas do Windows, uma por agente |

> **Armadilha:** copiar a pasta de um agente já configurado para criar um segundo: os dois compartilham as mesmas credenciais e o mesmo nome, e um deles cai após alguns minutos de conflito.
>
> **Boa prática:** descompactar um arquivo novo para cada agente, com um nome único.

## Escolher o pool a partir do YAML

O pipeline designa o pool pelo nome (no lugar de `vmImage`, que aponta para os agentes da Microsoft). Um job pode ainda exigir uma **capacidade** do agente (*demand*): cada agente anuncia o que está instalado em sua máquina (sistema, ferramentas) e o Azure DevOps só lhe confia os jobs compatíveis ([capacidades](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#capabilities)).

```yaml
jobs:
  - job: Robot
    pool:
      name: Robots
      demands:
        - Agent.OS -equals Windows_NT
    workspace:
      clean: all
    steps:
      - script: python robot.py
```

> **Armadilha:** instalar uma ferramenta na máquina depois que o agente iniciou: sua lista de capacidades só é atualizada quando o agente reinicia, e o job fica esperando com "no agent found in pool".
>
> **Boa prática:** reiniciar o agente após instalar qualquer ferramenta; diante de uma espera inexplicada, comparar os `demands` do job com a aba *Capabilities* do agente.

## Segurança: o agente executa o código do repositório

Um agente executa os comandos escritos no pipeline com as permissões da conta que o executa. Quem pode modificar o arquivo `azure-pipelines.yml` (ou um script que ele chama) pode, portanto, executar código na sua máquina; a Microsoft diz isso explicitamente: o agente foi concebido para executar código baixado, sendo assim um possível alvo de execução remota de código.

| Risco | Medida |
|---|---|
| Um job lê os segredos da pasta do agente (credenciais, logs) | Pasta do agente acessível apenas aos administradores e à conta do agente |
| Uma conta poderosa demais (administrador, conta de domínio) executa o agente | Conta local dedicada, com o mínimo de permissões (princípio do [menor privilégio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Um pipeline não confiável usa o agente de outro projeto | Um pool distinto por nível de confiança, com os direitos de uso do pool restritos |
| A conta que registra o agente é também a que o executa | Duas contas distintas |

> **Armadilha:** conectar a um agente auto-hospedado, que tem acesso à rede interna, um repositório em que qualquer colaborador pode propor uma mudança de pipeline: um simples pedido de mesclagem basta então para executar código na sua rede.
>
> **Boa prática:** exigir uma revisão antes de qualquer mudança em um pipeline que usa um agente auto-hospedado, e manter os agentes com acesso à rede interna fora do alcance de repositórios que você não controla.

## Manutenção

| Tarefa | Como |
|---|---|
| Atualização do agente | Automática: o agente se atualiza quando um job exige uma versão mais recente |
| Disco que enche | Pasta `_work` limpa a cada job por `workspace: clean: all` (veja o YAML acima) |
| Ver o estado de um agente em modo serviço | `services.msc`, entrada "Azure Pipelines Agent" (ou "vstsagent.…") |
| Diagnosticar um agente | `.\run.cmd --diagnostics` |
| Remover um agente | `.\config.cmd remove`, e depois verificar que ele sumiu do pool |

> **Armadilha:** apagar a pasta de um agente sem executar `config.cmd remove`: o agente continua listado no pool (offline) e atrapalha a leitura do estado do pool.
>
> **Boa prática:** sempre remover o agente de forma limpa antes de apagar sua pasta ou reinstalar a máquina.

---

## 📋 Resumo

| | |
|---|---|
| **O que lembrar** | Um pipeline é executado por um **agente**, programa instalado em uma máquina e agrupado em um **pool**. O agente contata o Azure DevOps (conexão de saída); um PAT serve apenas para registrá-lo. Modo serviço por padrão (inicia com a máquina, sem janela visível); modo interativo (autologon) apenas se um job exigir uma janela real. Um agente por pasta, com um nome único. |
| **Ferramentas utilizáveis** | `config.cmd` (configuração, com `--unattended` para automatizá-la), `run.cmd` (início interativo, `--diagnostics`), `services.msc` (estado do serviço), os `demands` do YAML para apontar uma capacidade, `workspace: clean: all` para limpar a pasta de trabalho. |
| **Armadilhas a evitar** | PAT sem expiração ou com permissões amplas. Segredo escrito em texto claro na linha de comando. Agente interativo cuja sessão é fechada ou deslocada. Pasta de agente copiada como está. Conta de agente poderosa demais. Repositório não controlado conectado a um agente que enxerga a rede interna. |
| **Boas práticas** | PAT limitado a *Agent Pools (Read & manage)*, de expiração curta, revogado após o registro. Conta local dedicada com o mínimo de permissões, distinta da que registra. Um pool por nível de confiança. Revisão obrigatória das mudanças de pipeline. Remoção limpa com `config.cmd remove`. |
