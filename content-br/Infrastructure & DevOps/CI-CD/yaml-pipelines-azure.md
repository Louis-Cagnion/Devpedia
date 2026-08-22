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
# nunca faca isso: a senha aparece em texto puro no historico do Git
steps:
  - script: deploy.sh --password minhaSenha123
```

> **Armadilha:** escrever uma senha, uma chave de API ou um token de acesso diretamente no `azure-pipelines.yml`. Esse arquivo é versionado no repositório Git: o segredo continua visível no histórico mesmo depois de removido de uma versão posterior.
>
> **Boa prática:** armazenar os segredos em um **grupo de variáveis** (*variable group*) ou uma biblioteca dedicada do Azure DevOps, e depois referenciá-los no YAML pelo nome (`$(minhaSenha)`): o arquivo versionado nunca contém o valor em si.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um pipeline Azure se organiza em stages, contendo jobs, contendo steps executados em ordem. `trigger` define quando ele é disparado, `pool` em qual máquina, `steps`/`task` as ações a executar. |
| **Ferramentas utilizáveis** | As tasks oficiais (`PublishBuildArtifacts@1` e muitas outras) para ações comuns, sem reescrever sua lógica na mão. |
| **Armadilhas a evitar** | Omitir o `trigger` e deixar um comportamento implícito decidir quando o pipeline é disparado. Escrever um segredo em texto puro no arquivo YAML versionado. |
| **Boas práticas** | Declarar o `trigger` explicitamente. Armazenar os segredos em um grupo de variáveis dedicado e referenciá-los pelo nome, nunca em texto puro. |
