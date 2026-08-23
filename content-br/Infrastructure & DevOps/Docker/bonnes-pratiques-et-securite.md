---
order: 6
---

# Boas práticas e segurança

## Uma imagem mínima

Cada pacote instalado em uma imagem é uma **superfície de ataque** (mais um ponto de entrada potencial que um atacante poderia explorar: uma vulnerabilidade em um pacote nunca usado continua sendo uma vulnerabilidade) e um peso a mais no download. Prefira uma imagem base mínima ([`alpine`](https://alpinelinux.org), ou uma variante `-slim`) e um [build multi-estágio](/?c=docker&p=dockerfile) para entregar apenas o estritamente necessário à execução, nunca as ferramentas de compilação.

## Fixar as versões, nunca usar `latest` em produção

```dockerfile
FROM node:latest   # evitar: o conteudo real de "latest" muda com o tempo, sem avisar
FROM node:20.11.1  # reproduzivel: o mesmo Dockerfile sempre constroi a mesma coisa
```

Uma imagem `latest` que muda silenciosamente sob os pés de uma implantação falha da pior forma possível: o build tem sucesso, mas com um conteúdo diferente da última vez: seria melhor que uma versão ausente fizesse o build falhar explicitamente em vez de construir mesmo assim com um conteúdo imprevisível.

## Nunca rodar um contêiner como `root`

Por padrão, um processo em um contêiner é executado como `root`; um `USER` explícito no Dockerfile limita os danos se o contêiner for comprometido:

```dockerfile
RUN adduser -D meuapp
USER meuapp
```

Essa precaução se conecta ao [princípio do menor privilégio](/?c=domain-specific-languages-dsl&p=sql) já visto para uma conta de conexão a um banco de dados, tópico SQL: um processo nunca deveria ter mais permissões do que realmente precisa.

## Nunca embarcar um segredo em uma imagem

Um valor passado por `ENV` ou `ARG` continua legível nos metadados da imagem (`docker history`), mesmo depois de um build multi-estágio que não o copia para a imagem final: o segredo existiu em uma camada intermediária, e essa camada continua inspecionável.

```dockerfile
# EVITAR: a senha continua visivel no historico da imagem
ARG DB_PASSWORD=minhasenha123
```

Os segredos devem ser injetados **na execução** (variáveis de ambiente passadas ao `docker run -e`, arquivos montados via um volume, ou um gerenciador de segredos dedicado), nunca gravados em uma camada da imagem, o mesmo princípio de nunca commitar uma chave de API no código fonte (cf. capítulo [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite), tópico [PHP](/?c=langages-de-programmation&s=php&p=php)).

### Secrets do Docker Compose vs simples variáveis de ambiente

Uma variável de ambiente (`environment:` no Compose) continua legível por qualquer um que consiga inspecionar o contêiner (`docker inspect`, ou ler `/proc/<pid>/environ` a partir do hospedeiro), suficiente para uma configuração comum, mas pouco adequado para uma senha. Os **secrets** do Compose passam antes por um arquivo, montado somente leitura apenas nos contêineres que o declaram explicitamente:

```yaml
services:
  banco:
    secrets:
      - db_password        # montado somente leitura em /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt   # nunca commitado, cf. .gitignore
```

A aplicação lê então a senha como um arquivo comum (`cat /run/secrets/db_password`) em vez de como uma variável de ambiente: um segredo montado assim não aparece nem no `docker inspect`, nem nas variáveis de ambiente do processo.

## `.dockerignore` sistemático

Sem [`.dockerignore`](/?c=docker&p=dockerfile), um `COPY . .` embarca tudo que está no diretório, incluindo um `.env` local, um `.git/` completo, ou credenciais de configuração esquecidas. A lista mínima a excluir: `.git/`, `.env`, `node_modules/` (ou equivalente), qualquer arquivo de log.

## O isolamento de um contêiner não é o de uma máquina virtual

Um contêiner compartilha o kernel da máquina hospedeira (veja [Os conceitos básicos](/?c=docker&p=concepts-de-base)): uma falha nesse kernel, ou uma configuração incorreta (contêiner iniciado em modo privilegiado `--privileged`, socket Docker montado dentro de um contêiner) pode permitir sair dele e alcançar o hospedeiro diretamente. Uma VM opõe uma fronteira de hardware bem mais estanque. Para um serviço exposto publicamente e particularmente sensível, essa diferença deve pesar na escolha entre contêiner e VM: o Docker isola processos, não kernels.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma imagem mínima reduz a superfície de ataque. Um contêiner nunca deveria rodar como `root`, nem embarcar um segredo em suas camadas: os segredos se injetam na execução, nunca no Dockerfile. |
| **Ferramentas utilizáveis** | `USER` (usuário não-root), secrets do Docker Compose (arquivo montado), `.dockerignore`. |
| **Armadilhas a evitar** | Usar `latest` em produção (conteúdo imprevisível); passar um segredo via `ARG`/`ENV`: continua legível no histórico da imagem mesmo depois de um build multi-estágio. |
| **Boas práticas** | Fixar uma versão precisa de cada imagem base; injetar os segredos na execução (variável de ambiente na inicialização, arquivo montado, gerenciador dedicado); nunca rodar um contêiner como `root`. |
