---
order: 3
---

# A sintaxe YAML dos pipelines Azure

Um pipeline Azure DevOps é descrito em um arquivo `azure-pipelines.yml`, no formato **YAML** (veja a sintaxe básica, já coberta em [Docker Compose](/?c=docker&p=docker-compose)): este capítulo cobre apenas o que é específico à estrutura de um pipeline.

## A hierarquia de um pipeline

Um pipeline se organiza em quatro níveis aninhados, do mais amplo ao mais preciso:

```text
Pipeline
  └─ Stage    (uma grande fase, ex. "Build", "Test", "Deploy")
       └─ Job       (um conjunto de tarefas executadas na mesma maquina)
            └─ Step      (uma tarefa precisa: rodar um comando, publicar um arquivo...)
```

Os stages de um mesmo pipeline podem se encadear (um após o outro) ou rodar em paralelo; os jobs de um mesmo stage também. Os steps de um mesmo job, por sua vez, sempre são executados na ordem em que foram escritos.

## Um exemplo mínimo

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

steps:
  - script: npm install
    displayName: Instalar as dependencias
  - script: npm test
    displayName: Rodar os testes
```

- `trigger`: quando o pipeline é disparado automaticamente (aqui, a cada push em `main`).
- `pool`: qual máquina (fornecida pela Microsoft, ou a sua) executa o pipeline.
- `steps`: a lista de etapas, executadas em ordem. `script` roda um comando bruto; `displayName` é só o nome exibido nos logs de execução.

> **Armadilha:** esquecer o `trigger`. Sem ele, o comportamento padrão depende da configuração do projeto (disparo em qualquer branch, ou pipeline que nunca roda sozinho): melhor declará-lo explicitamente do que adivinhar o que a ausência desse campo vai fazer.
>
> **Boa prática:** declarar o `trigger` explicitamente, mesmo para reproduzir um comportamento que seria o padrão de qualquer forma: o arquivo continua compreensível sem precisar decorar esse padrão.

## As tasks: steps prontas para uso

Uma **task** é um step padrão pelo Azure DevOps (ou pelo marketplace) para uma ação comum, em vez de escrever o comando bruto na mão:

```yaml
steps:
  - script: npm run build
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: dist
      ArtifactName: meu-app
```

`PublishBuildArtifacts@1` é uma task oficial que publica uma pasta como resultado do pipeline (recuperável por outro stage ou por download manual): isso evita reescrever você mesmo a lógica de arquivamento e upload.

## Armadilha: colocar um segredo em texto puro no arquivo YAML

```yaml
# nunca faca isso: a senha aparece em texto puro no histórico do Git
steps:
  - script: deploy.sh --password minhaSenha123
```

> **Armadilha:** escrever uma senha, uma chave de API ou um token de acesso diretamente no `azure-pipelines.yml`. Esse arquivo é versionado no repositório [Git](/?c=git&p=git): o segredo continua visível no histórico mesmo depois de removido de uma versão posterior.
>
> **Boa prática:** armazenar os segredos em um **grupo de variáveis** (*variable group*) ou uma biblioteca dedicada do Azure DevOps, e depois referenciá-los no YAML pelo nome (`$(minhaSenha)`): o arquivo versionado nunca contém o valor em si.

## Autorizar um pipeline a usar um recurso pela primeira vez: "Permit"

Um pipeline que referencia em seu YAML um grupo de variáveis ou um Environment nunca antes usado por ESSE pipeline não inicia automaticamente no primeiro `Run`: o Azure DevOps exibe um banner *"This pipeline needs permission to access N resource(s)"* com um botão **Permit** por recurso envolvido.

```text
Run pipeline
  -> "This pipeline needs permission to access 1 resource(s)"
  -> botao Permit (caixa: "for this run and future runs")
```

Distinto da questão "quem pode ler/escrever o grupo de variáveis" (já uma boa prática de segurança de segredos): Permit é uma lista de permissões pipeline-recurso, concedida uma vez. O botão Permit em si só aparece para um administrador do recurso referenciado: outro usuário não vê botão algum, sem mensagem de erro explícita que indique o motivo.

> **Armadilha:** interpretar a ausência do botão Permit como um bug em vez de como uma falta de direitos administrativos sobre o recurso referenciado (grupo de variáveis, Environment).
>
> **Boa prática:** marcar "for this run and future runs" no primeiro Permit de um pipeline estável, para não precisar reautorizar a cada novo run.

## Os Environments do Azure DevOps: um recurso distinto, com checks de aprovação

Um `environment: OnPrem-Prod` declarado em um `deployment job` é um recurso de primeira classe, distinto de um grupo de variáveis, que pode carregar **checks**: por exemplo um aprovador nomeado, com um prazo antes que o stage continue.

```yaml
jobs:
  - deployment: DeployProd
    environment: OnPrem-Prod
    strategy:
      runOnce:
        deploy:
          steps:
            - script: ./deploy.sh
```

Um Environment não autorizado bloqueia o run com o mesmo banner "Permission needed" de um grupo de variáveis não autorizado; mas um Environment protegido por um check de aprovação bloqueia de forma diferente: o run espera a validação manual do aprovador designado, até expirar um prazo configurado.

> **Armadilha:** confundir o bloqueio por "Permit" (autorização de acesso, concedida uma vez) com o bloqueio por um check de aprovação (validação humana a cada implantação): ambos mostram um run pendente, mas a resolução é diferente.
>
> **Boa prática:** reservar os checks de aprovação para os Environments de alto risco (produção), não para um Environment de teste que só precisa de um Permit inicial.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um pipeline Azure se organiza em stages, contendo jobs, contendo steps executados em ordem. `trigger` define quando ele é disparado, `pool` em qual máquina, `steps`/`task` as ações a executar. Um grupo de variáveis ou um Environment nunca usado por um pipeline exige um Permit explícito (disponível apenas para um administrador do recurso); um Environment também pode carregar um check de aprovação humana. |
| **Ferramentas utilizáveis** | As tasks oficiais (`PublishBuildArtifacts@1` e muitas outras) para ações comuns, sem reescrever sua lógica na mão. Os Environments para carregar checks de aprovação em uma implantação sensível. |
| **Armadilhas a evitar** | Omitir o `trigger` e deixar um comportamento implícito decidir quando o pipeline é disparado. Escrever um segredo em texto puro no arquivo YAML versionado. Confundir um bloqueio Permit (autorização de acesso) com um bloqueio por check de aprovação (validação humana a cada implantação). |
| **Boas práticas** | Declarar o `trigger` explicitamente. Armazenar os segredos em um grupo de variáveis dedicado e referenciá-los pelo nome, nunca em texto puro. Marcar "for this run and future runs" no primeiro Permit de um pipeline estável. Reservar os checks de aprovação para os Environments de alto risco. |
