---
order: 3
---

# Os comandos essenciais

## Construir e iniciar

```bash
docker build -t meu-app:1.0 .  # constroi uma imagem chamada "meu-app", tag "1.0", a partir do Dockerfile do diretorio atual (.)
docker run meu-app:1.0         # inicia um conteiner a partir dessa imagem
```

Opções comuns de `docker run`:

```bash
docker run -d --name servidor -p 8080:80 meu-app:1.0
```

| Opção | Efeito |
|---|---|
| `-d` | Destacado (*detached*): o contêiner roda em segundo plano, o terminal continua disponível, mesmo princípio do `&` em [Bash](/?c=shells&s=bash&p=bash) |
| `--name` | Dá um nome explícito ao contêiner, em vez de um identificador gerado aleatoriamente |
| `-p 8080:80` | Publica a porta: a porta `80` do contêiner fica acessível na porta `8080` do hospedeiro (veja [Volumes e redes](/?c=docker&p=volumes-et-reseaux)) |
| `-it` | Interativo + pseudo-terminal (*tty*): necessário para um contêiner com o qual se quer interagir diretamente (ex. um shell) |
| `--rm` | Remove automaticamente o contêiner assim que ele para: prático para um uso pontual, sem deixar contêineres parados se acumularem |
| `-e VAR=valor` | Define uma variável de ambiente no contêiner |

## Observar o que está rodando

```bash
docker ps               # conteineres em execucao
docker ps -a            # todos os conteineres, incluindo os parados
docker logs servidor    # saida padrao/erro do conteiner "servidor"
docker logs -f servidor # acompanha os logs em tempo real (equivalente a `tail -f`)
```

Um contêiner é, do ponto de vista do sistema hospedeiro, apenas mais um processo entre outros: `docker ps` é o equivalente do `ps aux` filtrado pelos processos iniciados pelo Docker (cf. capítulo [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus), tópico Bash).

## Entrar em um contêiner em execução

```bash
docker exec -it servidor sh    # abre um shell interativo dentro do conteiner "servidor"
```

Útil para inspecionar o estado de um contêiner que já está rodando (arquivos, variáveis de ambiente, processos internos) sem precisar reiniciá-lo.

## Parar e limpar

```bash
docker stop servidor    # envia SIGTERM, deixa o conteiner parar de forma limpa (cf. tabela de sinais, topico Bash)
docker kill servidor    # envia SIGKILL, parada imediata e incondicional
docker rm servidor      # remove um conteiner parado
docker rmi meu-app:1.0  # remove uma imagem
```

> **Nota:** `docker stop` seguido de `docker kill` reproduz exatamente a mesma hierarquia SIGTERM → SIGKILL vista no capítulo sobre gerenciamento de processos: o Docker não reinventa um mecanismo de parada, ele pilota o do sistema hospedeiro.

```bash
docker system prune        # remove conteineres parados, imagens nao usadas, caches de build nao usados
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `docker build`/`run` constroem e iniciam um contêiner; `docker ps`/`logs`/`exec` permitem observá-lo e entrar nele; `docker stop`/`kill`/`rm` param e removem. |
| **Ferramentas utilizáveis** | `-d` (destacado), `-p` (publicar uma porta), `-e` (variável de ambiente), `--rm` (limpeza automática). |
| **Armadilhas a evitar** | Deixar se acumularem contêineres parados e imagens não usadas sem nunca rodar `docker system prune`. |
| **Boas práticas** | Usar `--rm` para um contêiner pontual; `docker stop` (parada limpa) antes de `docker kill` (parada forçada). |
