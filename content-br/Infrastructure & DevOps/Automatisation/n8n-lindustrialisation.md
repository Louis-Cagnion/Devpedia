---
order: 5
---

# n8n: colocando em produção

Construir um fluxo de trabalho que funciona é uma coisa; fazê-lo rodar de forma confiável em produção, com várias pessoas contribuindo, é outra. Este capítulo cobre o que muda entre "funciona na minha máquina" e uma implantação industrializada do n8n.

## Self-hosted ou n8n Cloud: retomando a questão com mais detalhe

O capítulo sobre a [automação por fluxo de trabalho visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) já apresentava a distinção SaaS/self-hosted. Para o n8n especificamente, cada opção desloca a responsabilidade de forma diferente:

| | n8n Cloud | Self-hosted |
|---|---|---|
| **Infraestrutura** | Gerenciada inteiramente pelo n8n | Responsabilidade do usuário |
| **Atualizações** | Automáticas, gerenciadas pelo n8n | A aplicar por conta própria |
| **Controle** | Limitado ao que a plataforma oferece | Total sobre a configuração e a implantação |
| **Custo** | Assinatura paga (teste gratuito limitado no tempo) | Edição Community gratuita para a maioria das funcionalidades |

Nenhuma das duas é universalmente melhor: o n8n Cloud remove a carga operacional, o self-hosted remove a dependência de terceiros e os custos recorrentes, ao preço da manutenção.

## Duas noções de "variável" que não devem ser confundidas

A palavra "variável" designa dois mecanismos distintos no n8n, com usos diferentes:

| | Variável de ambiente | Variável do n8n (`$vars`) |
|---|---|---|
| **Configura o quê** | A própria instância n8n (banco de dados, segurança, portas) | Um valor reutilizável dentro dos fluxos de trabalho |
| **Definida onde** | No nível do sistema operacional/contêiner que hospeda o n8n | Na interface do n8n (menu Variables) |
| **Usada como** | Lida pelo n8n na inicialização | Referenciada em um fluxo de trabalho via `$vars.nomeDaVariavel` |
| **Exemplo** | `NODES_EXCLUDE`, a configuração do banco de dados | Uma URL de API que muda entre ambientes |

> **Cilada:** confundir as duas e tentar definir uma variável de ambiente do sistema para um valor que na realidade só é útil dentro de um fluxo de trabalho (ou o contrário). As duas têm um ciclo de vida e um modo de configuração diferentes.
>
> **Boa prática:** reservar as variáveis de ambiente para a configuração da própria instância, e as variáveis do n8n (`$vars`) para qualquer valor que um fluxo de trabalho precise ler sem ficar fixo em seus parâmetros.

## As credentials: próprias de cada instância

Como visto no capítulo sobre o [formato JSON de um fluxo de trabalho](/?c=infrastructure-devops&s=automatisation&p=n8n-le-format-json-dun-workflow), um export contém apenas uma referência a uma credential, nunca o segredo em si: cada instância n8n (dev, staging, produção) mantém, portanto, suas próprias credentials, armazenadas e criptografadas separadamente, a serem reconfiguradas manualmente assim que um fluxo de trabalho é importado em uma nova instância.

## Ambientes dev/prod: instâncias separadas

O n8n não oferece uma única instância com um seletor "dev/prod" integrado: cada ambiente é uma **instância n8n distinta**, com suas próprias credentials e seu próprio histórico de execuções. Fazer um fluxo de trabalho passar de um ambiente para outro se faz de duas formas:

| Método | Funcionamento |
|---|---|
| **Export/import manual** | Baixar o JSON da instância de origem, importá-lo na instância de destino (visto no capítulo anterior) |
| **Source Control ([Git](/?c=qualite-performance-et-outils&s=git&p=git))** | Uma instância n8n se conecta a uma branch de um repositório Git; um mesmo fluxo de trabalho versionado pode ser enviado de um ambiente para outro seguindo o fluxo Git habitual (dev → staging → produção) |

> **Cilada:** enviar uma mudança diretamente para produção sem passar por um ambiente intermediário, em particular para um fluxo de trabalho que toca dados reais (um banco de dados de produção, um envio de email para clientes reais).
>
> **Boa prática:** fazer toda mudança passar por um ambiente de dev/staging antes da produção, assim como em qualquer implantação de código.

## Supervisão das execuções

A aba **Executions** (acessível a partir da página inicial ou de um fluxo de trabalho específico) lista todas as execuções passadas, com seu status. Para uma execução com falha, existem duas opções de recuperação: **"Retry with original workflow"** (repete a execução exatamente como ela ocorreu, sem levar em conta uma correção feita desde então) e **"Retry with currently saved workflow"** (repete os mesmos dados de entrada, mas com a versão atual do fluxo de trabalho, após a correção).

Uma configuração complementar, **"Retry on Fail"**, disponível em cada nó individualmente, reinicia automaticamente esse nó um número determinado de vezes em caso de falha, útil para absorver um erro transitório (um serviço externo temporariamente indisponível) sem intervenção humana.

Combinado com o error workflow visto no [capítulo sobre o catálogo de funcionalidades](/?c=infrastructure-devops&s=automatisation&p=n8n-catalogue-des-fonctionnalites), esses mecanismos cobrem o essencial da supervisão de uma implantação em produção: ser notificado de uma falha, entender por que ela ocorreu, e repeti-la sem começar do zero.

## Segurança do editor: restringir nós sensíveis

Em uma instância self-hosted compartilhada por várias pessoas que não são todas igualmente confiáveis, alguns nós representam um risco real: o nó **Execute Command**, por exemplo, executa um comando shell arbitrário no servidor que hospeda o n8n. A variável de ambiente `NODES_EXCLUDE` retira um ou vários nós da lista dos utilizáveis na instância:

```text
NODES_EXCLUDE=["n8n-nodes-base.executeCommand", "n8n-nodes-base.readWriteFile"]
```

O nó Execute Command está, aliás, **bloqueado por padrão** em uma instalação self-hosted recente, precisamente por essa razão; é preciso permiti-lo explicitamente (`NODES_EXCLUDE=[]`) para que fique disponível.

> **Cilada:** permitir o Execute Command (ou um nó equivalente igualmente poderoso) em uma instância compartilhada sem ter pensado em quem realmente pode criar fluxos de trabalho nela. Um nó capaz de executar comandos de sistema concede, de fato, um acesso equivalente ao do próprio servidor.
>
> **Boa prática:** manter os nós mais sensíveis bloqueados por padrão, e só permiti-los para uma necessidade identificada, em uma instância onde todos os usuários merecem uma confiança equivalente à que se concederia a um acesso direto ao servidor.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O n8n Cloud e o self-hosted deslocam a responsabilidade da infraestrutura de forma diferente, sem opção universalmente melhor. As variáveis de ambiente configuram a instância, as variáveis do n8n (`$vars`) configuram valores dentro dos fluxos de trabalho. As credentials continuam próprias de cada instância. Os ambientes dev/prod são instâncias n8n separadas, sincronizadas por export/import ou Source Control Git. |
| **Ferramentas utilizáveis** | A aba Executions e suas opções de retry; a configuração "Retry on Fail" por nó; a variável de ambiente `NODES_EXCLUDE` para bloquear nós sensíveis como Execute Command. |
| **Ciladas a evitar** | Confundir variáveis de ambiente e variáveis do n8n. Enviar uma mudança diretamente para produção sem passar por um ambiente intermediário. Permitir um nó poderoso (Execute Command) em uma instância compartilhada sem refletir sobre a confiança concedida aos usuários. |
| **Boas práticas** | Reservar cada tipo de variável ao seu uso próprio. Fazer toda mudança passar por dev/staging antes da produção. Manter os nós sensíveis bloqueados por padrão, permitidos apenas para uma necessidade identificada. |
