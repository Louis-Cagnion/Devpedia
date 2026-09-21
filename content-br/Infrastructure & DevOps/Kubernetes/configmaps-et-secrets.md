---
order: 3
---

# ConfigMaps e Secrets: tirar a configuração da imagem

## O problema: uma imagem não deveria conter sua configuração

Uma [imagem Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) deve permanecer idêntica entre ambientes (desenvolvimento, homologação, produção). Se a URL do banco de dados ou a senha de um serviço externo estivessem fixas dentro dela, seria preciso reconstruir uma imagem diferente para cada ambiente, e um segredo acabaria versionado junto com o resto do código.

## ConfigMap: a configuração não sensível

Um **ConfigMap** armazena pares chave/valor de configuração (a URL de uma API, um nível de log, um nome de ambiente) fora da imagem, injetados no pod na inicialização como variáveis de ambiente ou arquivos montados:

```text
ConfigMap (chave: valor)  -->  injetado no pod na inicializacao
API_URL: https://api.exemplo.com
LOG_LEVEL: info
```

Mudar um valor do ConfigMap nunca exige reconstruir a imagem: só o pod reinicia com a nova configuração.

## Secret: a mesma ideia, para dados sensíveis

Um **Secret** segue o mesmo princípio de um ConfigMap, reservado a dados sensíveis (uma senha, uma chave de API, um certificado). O Kubernetes os armazena e transmite separadamente do resto da configuração, para permitir um controle de acesso mais rígido do que em um ConfigMap comum.

> **Cuidado:** um Secret básico do Kubernetes é apenas codificado em Base64, não criptografado por padrão: não é um cofre, apenas um mecanismo separado dos ConfigMaps para aplicar permissões distintas. Uma criptografia real em repouso ou um gerenciador de segredos dedicado continuam necessários para dados realmente críticos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um ConfigMap externaliza a configuração não sensível de uma imagem, um Secret faz o mesmo para dados sensíveis; ambos são injetados no pod na inicialização, sem nunca exigir reconstruir a imagem. |
| **Ferramentas utilizáveis** | `kubectl get configmaps`/`kubectl get secrets` para listar a configuração externalizada de um cluster. |
| **Armadilhas a evitar** | Escrever uma configuração ou um segredo fixo na imagem em vez de em um ConfigMap/Secret. Tratar um Secret básico do Kubernetes como um armazenamento criptografado. |
| **Boas práticas** | Externalizar sistematicamente qualquer configuração que varie entre ambientes. Reservar dados realmente críticos a um gerenciador de segredos dedicado em vez de a um Secret básico do Kubernetes. |
