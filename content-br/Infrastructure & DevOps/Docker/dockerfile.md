---
order: 2
---

# O Dockerfile

Um **Dockerfile** é uma receita em texto: uma sequência de instruções descrevendo como construir uma imagem, etapa por etapa. `docker build` a executa e produz a imagem correspondente.

## As instruções essenciais

```dockerfile
FROM node:20-alpine        # imagem base: Node.js 20 em uma distribuicao Alpine (minima)
WORKDIR /app                # diretorio de trabalho no conteiner para todas as instrucoes seguintes

COPY package*.json ./       # copia esses arquivos da maquina hospedeira para a imagem
RUN npm install              # executa um comando DURANTE a construcao da imagem

COPY . .                    # copia o resto do codigo fonte

ENV NODE_ENV=production     # variavel de ambiente, disponivel no build e na execucao
EXPOSE 3000                  # documenta a porta usada (nao abre nada por si so, cf. capitulo redes)

CMD ["node", "server.js"]    # comando executado quando o CONTEINER inicia, nao durante o build
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
CMD ["nginx", "-g", "daemon off;"]   # nginx fica em primeiro plano: o Docker tem um processo para monitorar
```

> **Nota:** PID 1 tem um papel particular no Linux, independentemente do Docker (cf. capítulo [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus), tópico [Bash](/?c=shells&s=bash&p=bash)): o kernel não aplica a ele a ação padrão de um sinal como `SIGTERM` se ele não instalou explicitamente seu próprio manipulador: `docker stop` pode então parecer não fazer nada em um processo que não trata esse sinal por conta própria. Também é o PID 1 quem precisa recolher (*reap*) os processos zumbis que lança; um ponto a observar se a imagem inicia vários subprocessos por conta própria.

## Cada instrução cria uma camada, e a ordem importa

Cada `RUN`/`COPY`/`ADD` adiciona uma camada, armazenada em cache: se uma instrução e tudo que a precede não mudaram desde o último build, o Docker reutiliza a camada em cache em vez de reconstruí-la.

```dockerfile
# Ordem ruim: a menor mudanca de codigo fonte invalida o cache do `npm install`
COPY . .
RUN npm install

# Ordem boa: `npm install` so e refeito se package.json realmente mudar
COPY package*.json ./
RUN npm install
COPY . .
```

É por isso que os arquivos que mudam com menos frequência (dependências) são copiados e instalados **antes** do código fonte, que muda a cada commit.

## Os builds multi-estágio

Um build multi-estágio separa o ambiente de **compilação** (pesado: compilador, ferramentas de build) do ambiente de **execução** (leve: apenas o binário final), o mesmo princípio de separar compilação e ligação em [C](/?c=langages-de-programmation&s=c&p=c) (cf. capítulo [O processo de compilação](/?c=langages-de-programmation&s=c&p=compilation)): o resultado final não precisa da cadeia de ferramentas que o produziu.

```dockerfile
# Etapa 1: compilacao, com toda a toolchain Go
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o servidor

# Etapa 2: execucao, imagem minima sem nenhuma ferramenta de compilacao
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
| **Ferramentas utilizáveis** | `FROM`/`WORKDIR`/`COPY`/`RUN`/`CMD`, builds multi-estágio, `.dockerignore`. |
| **Armadilhas a evitar** | Copiar todo o código antes de instalar as dependências (invalida o cache a cada commit); manter um contêiner "vivo" com um comando que não faz nada (`sleep infinity`) em vez de lançar o serviço de verdade em primeiro plano. |
| **Boas práticas** | Copiar os arquivos de dependências antes do resto do código fonte; usar um build multi-estágio para entregar apenas o binário final, sem a cadeia de compilação. |
