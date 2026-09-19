---
order: 2
---

# O Dockerfile

Um **Dockerfile** é uma receita em texto: uma sequência de instruções descrevendo como construir uma imagem, etapa por etapa. `docker build` a executa e produz a imagem correspondente.

## As instruções essenciais

```dockerfile
FROM node:20-alpine        # imagem base: Node.js 20 em uma distribuição Alpine (mínima)
# diretório de trabalho no conteiner para todas as instruções seguintes
WORKDIR /app

COPY package*.json ./       # copia esses arquivos da maquina hospedeira para a imagem
RUN npm install              # executa um comando DURANTE a construção da imagem

COPY . .                    # copia o resto do código fonte

ENV NODE_ENV=production     # variável de ambiente, disponível no build e na execução
# documenta a porta usada (não abre nada por si só, cf. capítulo redes)
EXPOSE 3000

CMD ["node", "server.js"]    # comando executado quando o CONTEINER inicia, não durante o build
```

| Instrução | Papel |
|---|---|
| `FROM` | Imagem base sobre a qual construir (sempre a primeira instrução) |
| `WORKDIR` | Muda o diretório atual para o resto do Dockerfile: evita `cd` repetidos |
| `COPY` | Copia arquivos do hospedeiro para a imagem |
| `RUN` | Executa um comando no momento da construção, seu resultado é capturado em uma nova camada |
| `ENV` | Define uma variável de ambiente, persistente na imagem e para o contêiner |
| `EXPOSE` | Documenta a porta em que a aplicação escuta (apenas informativo) |
| `CMD` | Comando padrão na inicialização do contêiner, substituível pela linha de comando |
| `ENTRYPOINT` | Como `CMD`, mas não substituível: útil para forçar um executável fixo e deixar apenas seus argumentos variarem |

> **`RUN` vs `CMD`**: `RUN` é executado uma vez, **durante** a construção da imagem (instalar pacotes, compilar código) e seu resultado fica congelado em uma camada. `CMD` nunca é executado durante o build: ele só registra o comando a ser lançado **a cada inicialização** de um contêiner a partir dessa imagem.

`RUN` executa seu comando via um shell (cf. capítulo [Scripts e shebang](/?c=shells&s=bash&p=scripts-et-shebang)): as mesmas armadilhas se aplicam, principalmente a injeção de comando se um valor externo for interpolado sem cuidado em uma instrução `RUN`.

## O contêiner vive exatamente enquanto seu processo principal (PID 1)

O processo lançado por `CMD`/`ENTRYPOINT` recebe o PID 1 dentro do contêiner (cf. os [namespaces](/?c=docker&p=concepts-de-base)): assim que ele termina, o contêiner para, qualquer que seja o número de outros processos ainda ativos internamente.

É por isso que um comando que nunca termina mas por outro lado não faz **nada** (`tail -f /dev/null`, `sleep infinity`, `while true; do sleep 1; done`) é um reflexo ruim para "manter o contêiner vivo": isso mascara o problema real (o serviço que se quer realmente rodar parou, ou nunca foi iniciado) em vez de resolvê-lo. A boa prática é lançar diretamente, como PID 1, o serviço desejado **em primeiro plano** (*foreground*); a maioria dos daemons tem uma opção dedicada para isso, que os impede de se destacar em segundo plano como fariam nativamente (`nginx -g 'daemon off;'`, por exemplo):

```dockerfile
# nginx fica em primeiro plano: o Docker tem um processo para monitorar
CMD ["nginx", "-g", "daemon off;"]
```

> **Nota:** PID 1 tem um papel particular no Linux, independentemente do Docker (cf. capítulo [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus), tópico [Bash](/?c=shells&s=bash&p=bash)): o kernel não aplica a ele a ação padrão de um sinal como `SIGTERM` se ele não instalou explicitamente seu próprio manipulador: `docker stop` pode então parecer não fazer nada em um processo que não trata esse sinal por conta própria. Também é o PID 1 quem precisa recolher (*reap*) os processos zumbis que lança; um ponto a observar se a imagem inicia vários subprocessos por conta própria.

## Combinar `ENTRYPOINT` e `CMD`: preparação fixa, comando substituível

A tabela acima apresenta `CMD` e `ENTRYPOINT` como duas alternativas separadas, mas um Dockerfile pode combinar as duas:

```dockerfile
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
```

O Docker então chama `ENTRYPOINT`, passando a ele `CMD` (ou qualquer comando dado ao `docker run`) como argumentos: `/entrypoint.sh` recebe `node server.js` como parâmetros.

```bash
#!/bin/sh
# preparação fixa, executada a cada início do conteiner
chown -R app:app /data

exec "$@"   # substitui este script pelo comando recebido
```

`exec "$@"` (veja [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell)) substitui o processo atual do script pelo comando recebido como argumentos, em vez de lançá-lo como subprocesso: o comando final herda diretamente o PID 1 (veja acima) em vez de permanecer um filho do script bash, que de outra forma continuaria sendo ele o PID 1.

> **Cilada:** omitir `exec` antes de `"$@"`. Sem ele, o script bash continua sendo PID 1 e o comando real (`node server.js`) roda como filho: `docker stop` então mira o script em vez do serviço real, que pode nunca receber corretamente o sinal de parada.
>
> **Boa prática:** esse padrão (preparação fixa no entrypoint, comando variável em `CMD`) mantém uma etapa de configuração comum (permissões, migrações...) enquanto deixa `CMD` substituível na linha de comando (`docker run minha-imagem outro-comando` substituiria `CMD` sem tocar no entrypoint).

## Cada instrução cria uma camada, e a ordem importa

Cada `RUN`/`COPY`/`ADD` adiciona uma camada, armazenada em cache: se uma instrução e tudo que a precede não mudaram desde o último build, o Docker reutiliza a camada em cache em vez de reconstruí-la.

```dockerfile
# Ordem ruim: a menor mudanca de código fonte inválida o cache do `npm install`
COPY . .
RUN npm install

# Ordem boa: `npm install` só e refeito se package.json realmente mudar
COPY package*.json ./
RUN npm install
COPY . .
```

É por isso que os arquivos que mudam com menos frequência (dependências) são copiados e instalados **antes** do código fonte, que muda a cada commit.

## Os builds multi-estágio

Um build multi-estágio separa o ambiente de **compilação** (pesado: compilador, ferramentas de build) do ambiente de **execução** (leve: apenas o binário final), o mesmo princípio de separar compilação e ligação em [C](/?c=langages-de-programmation&s=c&p=c) (cf. capítulo [O processo de compilação](/?c=langages-de-programmation&s=c&p=compilation)): o resultado final não precisa da cadeia de ferramentas que o produziu.

```dockerfile
# Etapa 1: compilação, com toda a toolchain Go
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o servidor

# Etapa 2: execução, imagem mínima sem nenhuma ferramenta de compilação
FROM alpine:3.19
COPY --from=builder /app/servidor /usr/local/bin/servidor
CMD ["servidor"]
```

Apenas o binário `servidor` é copiado da etapa `builder` para a imagem final: o compilador [Go](https://go.dev) (várias centenas de MB) nunca faz parte da imagem entregue.

## `.dockerignore`

Funciona como o [`.gitignore`](/?c=git&p=gitignore) mas para `docker build`: os arquivos listados nunca são enviados ao motor Docker para a construção da imagem, quer um `COPY . .` os tivesse copiado ou não.

```text
node_modules/
.git/
*.log
.env
```

Excluir `node_modules/` acelera o build (menos dados a transmitir); excluir `.env` evita que um segredo local acabe embarcado em uma imagem (veja [Boas práticas e segurança](/?c=docker&p=bonnes-pratiques-et-securite)).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um Dockerfile descreve a construção de uma imagem, instrução por instrução. Cada instrução cria uma camada em cache; a ordem importa para maximizar o reaproveitamento do cache. O contêiner vive exatamente enquanto seu processo PID 1. |
| **Ferramentas utilizáveis** | `FROM`/`WORKDIR`/`COPY`/`RUN`/`CMD`, builds multi-estágio, `.dockerignore`. `ENTRYPOINT` + `CMD` combinados via `exec "$@"` para uma preparação fixa seguida de um comando substituível. |
| **Armadilhas a evitar** | Copiar todo o código antes de instalar as dependências (invalida o cache a cada commit); manter um contêiner "vivo" com um comando que não faz nada (`sleep infinity`) em vez de lançar o serviço de verdade em primeiro plano. Omitir `exec` antes de `"$@"` em um script de entrypoint. |
| **Boas práticas** | Copiar os arquivos de dependências antes do resto do código fonte; usar um build multi-estágio para entregar apenas o binário final, sem a cadeia de compilação. |
