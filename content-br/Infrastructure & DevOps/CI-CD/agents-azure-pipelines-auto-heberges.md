---
order: 5
---

# Os agentes auto-hospedados do Azure Pipelines

Um [pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) descreve **o que** fazer (compilar, testar, implantar), mas é preciso uma máquina para fazer isso. No Azure Pipelines, essa máquina executa um pequeno programa, o **agente**: ele pergunta ao servidor se há trabalho, executa, e depois devolve os logs e o resultado. Este capítulo explica como instalar e rodar o **seu próprio** agente em uma máquina Windows.

| Noção | Em uma frase |
|---|---|
| Agente | O programa que executa os steps de um pipeline em uma máquina |
| Pool de agentes | Um grupo de agentes; o pipeline indica um pool (`pool:`), não um agente específico |
| Job | Conjunto de etapas confiado a um único agente do pool |
| Agente auto-hospedado | Um agente instalado na **sua** máquina, que você administra |
| Token de acesso pessoal (PAT) | Uma senha de escopo limitado, usada aqui para registrar o agente |
| Modo serviço ou interativo | O agente roda como um serviço do Windows, ou como um programa em uma sessão aberta |

## Agente da Microsoft ou agente auto-hospedado

| | Agente hospedado pela Microsoft | Agente auto-hospedado |
|---|---|---|
| Onde roda | Na Microsoft, em uma máquina recriada para cada pipeline | Na sua máquina |
| Estado entre duas execuções | Nada permanece: o agente é destruído no final | Os caches, as pastas e as ferramentas permanecem: os builds incrementais são mais rápidos |
| Softwares instalados | Os da imagem escolhida | Tudo o que você instalar nele (e que você precisa manter) |
| Acesso a uma rede interna | Não diretamente | Sim, dependendo de onde a máquina está |
| Manutenção | Nenhuma | Atualizações, permissões, disco, segurança: fica por sua conta |

Um agente auto-hospedado se justifica quando o trabalho precisa de um software ou de um acesso que o agente da Microsoft não tem (uma rede interna, um navegador com uma sessão real, um hardware específico), ou quando caches persistentes fazem diferença. Na dúvida, tente primeiro o agente hospedado pela Microsoft, mais simples (veja [Azure Pipelines e GitHub Actions](/?c=infrastructure-devops&s=ci-cd&p=azure-pipelines-vs-github-actions) para o vocabulário `pool` e `runs-on`).

## Como o agente fala com o servidor

O agente **sempre inicia** a comunicação: ele consulta o servidor por HTTPS, nunca recebe uma chamada de entrada. Portanto, **não há nenhuma porta a abrir** em direção ao agente, apenas a saída para a Internet.

```
   sua máquina                                 Azure DevOps (servidor)
  +--------------+   1. registro (PAT)        +----------------------+
  |    agente    | -------------------------> |   pool de agentes    |
  |              |   2. "tem trabalho?"       |                      |
  |              | <------------------------> |   fila de jobs       |
  |              |   (requisição longa, HTTPS)|                      |
  |              |   3. job + token curto     |                      |
  |              | <------------------------- |                      |
  |   executa    |   4. logs, resultado       |                      |
  |              | -------------------------> |                      |
  +--------------+                            +----------------------+
```

| Etapa | O que acontece |
|---|---|
| Registro | Uma pessoa autorizada adiciona o agente ao pool; as permissões dela **não** são guardadas pelo agente |
| Escuta | O agente baixa um token de escuta e consulta a fila de jobs por uma requisição HTTP "longa" (a conexão fica aberta até que haja trabalho) |
| Job | O agente recebe o trabalho e um **token próprio desse job**, de curta duração |
| Fim | O token do job é descartado; o agente volta à escuta |

## Registrar-se com um PAT

Um **token de acesso pessoal** (*PAT*, *Personal Access Token*) é uma senha substituta, de escopo limitado e com data de expiração, criada nas configurações da sua conta (veja [GitHub e as plataformas](/?c=git&p=github-et-plateformes) para o mesmo mecanismo no GitHub). Para registrar um agente:

| Ponto | Valor |
|---|---|
| Onde criá-lo | Azure DevOps > configurações do usuário > **Personal access tokens** |
| Escopo (*scope*) a marcar | **Agent Pools (read, manage)**, e **nada além disso** ("Show all scopes" para ver a lista completa) |
| Quem | Uma conta com a função de **administrador do pool** (ou proprietário da organização) |
| Quando é usado | **Somente no registro**: depois, o agente se comunica com seus próprios tokens |
| Quantos agentes | Um único PAT pode registrar vários agentes |

Consequências práticas: um PAT expirado ou excluído **não interrompe** um agente já registrado (só é preciso um novo para registrar ou remover um agente). E a conta do Windows que **executa** o agente deve ser diferente da pessoa que o registrou: a documentação recomenda identidades separadas, e a pasta do agente contém segredos (logs, credenciais de trabalho) que só devem ser mostrados aos administradores e à conta que inicia o agente.

## Instalar e configurar manualmente

Pré-requisitos: Windows 10 ou 11, ou Windows Server 2012 ou mais recente, e PowerShell 3.0 ou superior (o agente traz sua própria versão do .NET). Faça isso uma primeira vez manualmente, para ver como funciona:

| Etapa | Detalhe |
|---|---|
| 1. Baixar | Azure DevOps > Organization settings > **Agent pools** > pool **Default** > aba **Agents** > **New agent** > Windows; escolher x64 para um Windows de 64 bits |
| 2. Descompactar | Em uma pasta **sem espaço** no caminho, por exemplo `C:\agents` (não na pasta Downloads: problemas de permissão) |
| 3. Proteger a pasta | Modificável apenas pelos administradores |
| 4. Abrir o PowerShell **como administrador** | Obrigatório para instalar um serviço. Nada de PowerShell ISE, nem de terminal mintty como o git-bash |
| 5. Configurar | `config.cmd` faz perguntas (URL, tipo de autenticação, token, pool, nome do agente, pasta de trabalho, modo) |

```
cd C:\agents
.\config.cmd
```

| Pergunta do `config.cmd` | Resposta |
|---|---|
| URL do servidor | `https://dev.azure.com/{sua-organizacao}` |
| Tipo de autenticação | `PAT`, depois o token criado acima |
| Pool | `Default` ou o pool desejado |
| Nome do agente | Um nome **único** no pool |
| Pasta de trabalho | `_work` por padrão, dentro da pasta do agente |
| Modo | Serviço ou interativo (próxima seção) |

No modo interativo, o agente é iniciado em seguida com `.\run.cmd` (Ctrl+C para pará-lo). `.\run.cmd --once` aceita **um único** job e depois para de forma limpa. O agente aparece no pool, com seu estado (online, offline).

## Serviço ou interativo

| | Serviço do Windows | Interativo com abertura automática de sessão |
|---|---|---|
| Inicialização | Automática na inicialização da máquina, sem sessão aberta | Na inicialização, **depois** da abertura automática da sessão da conta escolhida |
| Gerenciado por | O gerenciador de serviços (`services.msc`) | Um programa em uma sessão visível (`run.cmd`) |
| Atualizações do agente | Melhor experiência | Possível |
| Caso de uso | O padrão: compilações, testes sem janela, implantações | Quando o trabalho precisa de uma **área de trabalho**: testes de interface, navegador com janela real |
| Conta | Network Service ou Local Service recomendadas (permissões reduzidas, senha sem expiração); no modo serviço, nome de usuário de no máximo 20 caracteres | Uma conta dedicada cuja senha é registrada para o login automático |
| Risco | Nenhuma tela a proteger | Sessão permanentemente aberta; proteção de tela desativada |

Por que dois modos? Um serviço do Windows roda na **Sessão 0**, isolada da área de trabalho (veja [Windows: serviços, sessões e permissões](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)): ele não consegue abrir uma janela visível. Um teste que controla um navegador ou um aplicativo gráfico precisa de uma sessão real: esse é o papel do modo interativo. O agente é iniciado nele na inicialização pelo **login automático** (*autologon*; a senha fica guardada nos [segredos LSA](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)).

| Armadilha do modo interativo | Por quê | Solução |
|---|---|---|
| Fechar uma sessão de Área de Trabalho Remota bloqueia a máquina | Os testes de interface em andamento falham | Devolver a sessão à tela física com `tscon` (veja [Windows: acesso remoto](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)) |
| Conta de autologon poderosa demais | Qualquer administrador da máquina pode extrair a senha | Conta **dedicada, local, com o mínimo de permissões** e máquina trancada fisicamente |
| Política de domínio | Ela pode proibir o autologon ou a proteção de tela desativada | Pedir uma exceção, ou usar uma máquina fora do domínio |

## Configurar sem responder às perguntas

Para instalar sem ninguém diante da tela (script, várias máquinas), passa-se `--unattended` **e** as respostas a todas as perguntas. Em uma janela do PowerShell como administrador, na pasta do agente:

```
# agente em modo serviço, conta integrada Network Service (nenhuma senha necessária)
.\config.cmd --unattended `
    --url https://dev.azure.com/minha-organizacao `
    --auth pat --token <token> `
    --pool Default --agent agent-build-01 `
    --runAsService --windowsLogonAccount "NT AUTHORITY\NETWORK SERVICE"
```

```
# agente interativo, iniciado pelo autologon de uma conta dedicada
.\config.cmd --unattended `
    --url https://dev.azure.com/minha-organizacao `
    --auth pat --token <token> `
    --pool Default --agent agent-ui-01 `
    --runAsAutoLogon --windowsLogonAccount "MACHINE\agent-ui" `
    --windowsLogonPassword <senha> --overwriteAutoLogon
```

(O acento grave `` ` `` no final da linha é o caractere de continuação do PowerShell: o comando continua na linha seguinte.)

| Opção | Função |
|---|---|
| `--unattended` | Nenhuma pergunta: tudo deve ser dado nas opções |
| `--url` | O endereço da organização |
| `--auth pat` / `--token` | Autenticação por token (também `SP`, `negotiate`, `alt`, `integrated`) |
| `--pool`, `--agent` | O pool a ingressar e o nome do agente |
| `--replace` | Substituir um agente do pool que tenha o mesmo nome |
| `--work` | Pasta de trabalho (própria **deste** agente) |
| `--runAsService` | Instalar o agente como serviço do Windows (permissões de administrador necessárias) |
| `--runAsAutoLogon` | Configurar o autologon e iniciar o agente na inicialização (permissões de administrador necessárias) |
| `--windowsLogonAccount` | Conta que executa o agente (`domínio\usuário`), com `--runAsService` ou `--runAsAutoLogon` |
| `--windowsLogonPassword` | A senha dela (desnecessária para contas integradas como `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Substituir o autologon já configurado na máquina |
| `--noRestart` | Não reiniciar a máquina ao final da configuração de um autologon |

Qualquer opção também pode ser dada por uma **variável de ambiente**: o nome dela em maiúsculas precedido de `VSTS_AGENT_INPUT_` (por exemplo `VSTS_AGENT_INPUT_PASSWORD` para `--password`). Isso é preferível para um segredo: um token ou uma senha escritos na linha de comando ficam no histórico do terminal e podem ser lidos por outros programas durante a execução. `.\config.cmd --help` sempre lista as opções da **sua** versão.

## Vários agentes em uma mesma máquina

É possível, mas a documentação recomenda **um único agente por máquina**: dois agentes compartilham o processador, o disco e as ferramentas instaladas, o que pode degradar o desempenho e os resultados.

| Regra | Por quê |
|---|---|
| Uma **pasta por agente** (`C:\agents\a1`, `C:\agents\a2`), com `config.cmd` iniciado a partir de cada uma | Cada agente tem sua própria configuração |
| Um **nome único** por agente (`--agent`) | Dois agentes com o mesmo nome disputam o lugar no pool: um deles acaba parando |
| Uma **pasta de trabalho por agente** (`--work`) | A pasta de trabalho pertence a um agente e não é compartilhada |
| Evitar se os jobs forem pesados em disco ou em entrada e saída | Nenhum ganho de eficiência |
| Atenção às ferramentas "únicas" (por exemplo pacotes npm compartilhados) | Um job pode atualizar uma dependência enquanto outro a usa: resultados instáveis |
| O autologon é uma configuração **da máquina** | Só uma conta abre sessão automaticamente; `--overwriteAutoLogon` substitui a que já existe |
| **Vários jobs em paralelo**: dois agentes no mesmo pool | Cada agente executa um único job por vez |
| **Dois usos separados** (robô, implantação): um pool por uso | O pipeline designa um pool; cada pool tem seus próprios agentes |
| Nunca copiar a pasta de um agente já configurado | Os dois compartilhariam credenciais e nome: um deles cai após alguns minutos de conflito. Descompactar um arquivo novo para cada agente |

## Manutenção: remover, substituir, reconfigurar

| Necessidade | Comando |
|---|---|
| Remover o agente | `.\config.cmd remove` (com `--auth PAT --token <token>` no modo sem perguntas) |
| Substituir um agente de mesmo nome | Reconfigurar com o mesmo nome e responder `Y` (ou `--replace`), **depois** remover o antigo: caso contrário, após alguns minutos de conflito, um dos dois para |
| Mudar a conta de um serviço | Reconfigurar o agente; **não** pelo console de serviços |
| Um autologon que não inicia mais o agente | Remover o agente, verificar que ele sumiu do pool, reconfigurar em uma pasta recém-descompactada |
| Apagar a pasta de um agente | Somente **depois** de `config.cmd remove`: senão o agente continua listado (offline) no pool |
| Atualização do agente | Automática: o agente se atualiza quando um job exige uma versão mais recente |
| Disco que enche | Limpar `_work` a cada job com `workspace: clean: all` no YAML do job |
| Estado de um agente em modo serviço | `services.msc`, entrada "Azure Pipelines Agent" (ou `vstsagent.…`) |

## Capacidades, exigências e diagnóstico

Cada agente anuncia suas **capacidades** (*capabilities*): nome da máquina, sistema, versões de certos softwares, variáveis de ambiente. Um pipeline declara suas **exigências** (*demands*) e o servidor só envia o job aos agentes compatíveis.

```yaml
pool:
  name: Default          # o pool, não um agente específico
  demands:
  - npm                  # só os agentes com npm instalado são candidatos
```

| Ponto | O que saber |
|---|---|
| Depois de instalar um software | **Reiniciar o agente** para que a nova capacidade apareça |
| Variáveis de ambiente | Elas viram capacidades; `VSO_AGENT_IGNORE` (lista de nomes separados por vírgulas) permite excluir algumas |
| Variáveis próprias de um agente | Um arquivo `.env` na raiz do agente, uma linha `NOME=valor` por variável, depois reiniciar |
| Um agente que não inicia | `.\run --diagnostics` executa uma série de verificações |
| Firewall | Permitir a **saída** para `dev.azure.com`, `*.dev.azure.com`, `login.microsoftonline.com` e `download.agent.dev.azure.com` (lista completa na documentação) |

> **Limite da verificação:** estes comandos do Windows não puderam ser executados aqui. A sintaxe e as opções deles foram verificadas na documentação da Microsoft: [agente Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent), [agentes](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents) e [registro por PAT](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/personal-access-token-agent-registration).

## Segurança: o agente executa o código do repositório

Um agente executa os comandos do pipeline com os direitos da conta que o faz rodar. Quem pode modificar `azure-pipelines.yml` (ou um script que ele chama) pode, portanto, executar código na sua máquina: a Microsoft diz isso explicitamente, o agente foi feito para executar código baixado, logo é um possível alvo de execução remota de código.

| Risco | Remédio |
|---|---|
| Um job lê os segredos da pasta do agente (credenciais, logs) | Pasta acessível somente aos administradores e à conta do agente |
| Uma conta poderosa demais (administrador, conta do domínio) faz o agente rodar | Conta local dedicada, com o mínimo de direitos (princípio do [menor privilégio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Um pipeline não confiável usa o agente de outro projeto | Um pool distinto por nível de confiança, com os direitos de uso do pool restringidos |
| Um repositório em que qualquer colaborador pode propor uma alteração de pipeline está ligado a um agente que enxerga a rede interna | Revisão obrigatória antes de qualquer alteração de um pipeline que use um agente auto-hospedado; agentes da rede interna fora do alcance de repositórios não controlados |

## As armadilhas

| Armadilha | O que acontece | Solução |
|---|---|---|
| PAT com escopos demais | Um token roubado dá muito mais do que o registro de um agente | Marcar apenas **Agent Pools (read, manage)** |
| Token ou senha na linha de comando | Ficam no histórico do terminal | Variáveis `VSTS_AGENT_INPUT_...`, nunca em um arquivo versionado |
| Pasta do agente legível por todos | Logs e segredos de trabalho expostos | Pasta reservada aos administradores e à conta do agente |
| Pasta com espaços | Ferramentas e scripts tratam mal os espaços | Um caminho como `C:\agents` |
| Configurar pelo PowerShell ISE, pelo git-bash ou sem elevação | Instalação do serviço impossível ou configuração incorreta | PowerShell como **administrador** |
| Conta de autologon pessoal | Qualquer pessoa com acesso à máquina a utiliza | Conta dedicada, local, mínima |
| Dois agentes com o mesmo nome | Conflito, um deles para | Um nome único por agente, `--replace` e depois remoção do antigo |
| Software instalado sem reiniciar o agente | O job fica "aguardando um agente compatível" | Reiniciar o agente |
| PAT sem data de expiração | O token continua válido embora o agente não precise mais dele | Expiração curta, revogação assim que o agente for registrado |
| Pasta de agente copiada | Mesmas credenciais e mesmo nome: um dos dois cai | Um arquivo novo por agente |
| Pasta apagada sem `config.cmd remove` | O agente continua listado (offline) no pool | Removê-lo corretamente antes |
| Um agente que executa código vindo de repositórios | É um programa feito para executar código baixado: alvo de execução remota | Permissões mínimas, máquina isolada, controle de quem escreve no pipeline |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um agente executa os jobs de um pipeline em uma máquina; ele consulta o servidor por HTTPS (nenhuma porta de entrada). Um PAT com o escopo **Agent Pools (read, manage)** só serve para o registro. Modo **serviço** por padrão; modo **interativo com autologon** somente se o job precisar de uma área de trabalho. `config.cmd --unattended` automatiza tudo; um agente por pasta, um nome único, uma pasta de trabalho própria. |
| **Ferramentas utilizáveis** | `config.cmd` (com `--unattended`, `--runAsService`, `--runAsAutoLogon`, `--replace`, `--overwriteAutoLogon`, `--noRestart`), `run.cmd` e `run.cmd --once`, `config.cmd remove`, `services.msc`, `.\run --diagnostics`, os `demands` do pipeline, `tscon` para devolver uma sessão remota à tela, `workspace: clean: all` para limpar a pasta de trabalho. |
| **Armadilhas a evitar** | PAT amplo demais, segredo na linha de comando, pasta do agente legível por todos, caminho com espaços, PowerShell sem elevação, conta de autologon pessoal, dois agentes com o mesmo nome, ferramenta instalada sem reiniciar o agente, PAT sem expiração, pasta de agente copiada, pasta apagada sem `config.cmd remove`. |
| **Boas práticas** | Tentar primeiro um agente hospedado pela Microsoft; uma conta de execução dedicada e diferente da que registra; segredos por variáveis de ambiente; um agente por máquina, salvo necessidade específica; conferir `.\config.cmd --help` para a versão instalada; PAT de expiração curta, revogado após o registro; revisão obrigatória das alterações de pipeline; um pool por nível de confiança. |
