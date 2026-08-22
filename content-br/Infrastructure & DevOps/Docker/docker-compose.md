---
order: 5
---

# Docker Compose

Um projeto real raramente envolve um único contêiner: uma API, seu banco de dados, um cache, um **reverse proxy** (um servidor que recebe todas as requisições de entrada e as redireciona ao serviço interno correto, [Nginx](https://nginx.org) ou [Traefik](https://doc.traefik.io/traefik/) por exemplo, servindo de ponto de entrada único)... Encadear `docker run` na mão logo se torna inviável. O **Docker Compose** descreve todos esses serviços em um único arquivo declarativo no formato [**YAML**](https://yaml.org/spec/1.2.2/) (*YAML Ain't Markup Language*: um formato de texto estruturado por indentação, amplamente usado para configuração), `docker-compose.yml`, e os inicia juntos.

## Um exemplo completo

```yaml
services:
  api:
    build: .                    # constroi a imagem a partir do Dockerfile do diretorio atual
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=mysql://banco:3306/app
    depends_on:
      - banco

  banco:
    image: mysql:8               # usa diretamente uma imagem existente, sem build
    volumes:
      - dados-mysql:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=mudeisso

volumes:
  dados-mysql:
```

```bash
docker compose up -d          # constroi (se necessario) e inicia todos os servicos em segundo plano
docker compose logs -f api    # acompanha os logs de um servico especifico
docker compose down           # para e remove os conteineres (os volumes nomeados sobrevivem)
```

> **YAML é sensível à indentação**, exatamente como [Python](/?c=langages-de-programmation&s=python&p=python): duas linhas no mesmo nível devem ter a mesma indentação, e uma tabulação geralmente é inválida ali (YAML só aceita espaços). Um erro de indentação muda silenciosamente a estrutura do documento em vez de provocar um erro explícito: é o primeiro ponto a verificar em caso de comportamento inesperado.

## O que o Compose automatiza

- **A rede**: todos os serviços de um mesmo arquivo são colocados automaticamente em uma rede comum: `banco` já é alcançável pelo nome a partir de `api`, sem `docker network create` manual (veja [Volumes e redes](/?c=docker&p=volumes-et-reseaux)).
- **A ordem de inicialização**: `depends_on` inicia `banco` antes de `api`. Isso garante a ordem de **inicialização** do contêiner, não que o serviço interno (aqui o [MySQL](https://dev.mysql.com/doc/)) já esteja pronto para aceitar conexões: uma aplicação que se conecta cedo demais ainda precisa prever uma nova tentativa (cf. [Esperar sem perder tempo](/?c=performance&p=attentes-et-temps-morts), tópico Performance) em vez de supor que o banco responde já no primeiro instante.
- **Os volumes declarados uma vez**: `dados-mysql` definido no final do arquivo é criado automaticamente se ainda não existir.

## Rebuild depois de uma mudança no Dockerfile

O Compose não reconstrói uma imagem automaticamente a cada `up` se ela já existe em cache:

```bash
docker compose up -d --build   # forca a reconstrucao das imagens antes de iniciar
```

## Reinício automático em caso de falha

Por padrão, um contêiner que trava permanece parado; `restart` define a conduta a seguir:

| Valor | Comportamento |
|---|---|
| `no` (padrão) | Nunca reinicia automaticamente |
| `on-failure` | Reinicia apenas se o processo principal terminar com código de erro |
| `always` | Sempre reinicia, inclusive depois de um `docker stop` seguido de um reinício do daemon Docker |
| `unless-stopped` | Como `always`, exceto se o contêiner foi explicitamente parado (`docker stop`) antes do reinício do daemon |

```yaml
services:
  api:
    build: .
    restart: unless-stopped   # reinicia apos uma falha ou um reboot da maquina hospedeira
```

## Declarar explicitamente sua rede

O Compose cria uma rede padrão mesmo sem a seção `networks:` (cf. acima); declará-la explicitamente continua preferível assim que se quer dar um nome claro a ela ou usar várias redes distintas (ex. isolar o banco de dados do resto):

```yaml
services:
  api:
    networks:
      - minha-rede
  banco:
    networks:
      - minha-rede

networks:
  minha-rede:
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Docker Compose descreve vários serviços em um único arquivo YAML e os inicia juntos, com uma rede comum automática. `depends_on` ordena a inicialização, sem garantir que um serviço interno já esteja pronto. |
| **Ferramentas utilizáveis** | `docker compose up -d`/`logs -f`/`down`, `restart: unless-stopped`, secrets do Compose (arquivo montado, não uma variável de ambiente). |
| **Armadilhas a evitar** | Um erro de indentação YAML, que muda silenciosamente a estrutura sem erro explícito; supor que um serviço dependente já está pronto assim que inicia. |
| **Boas práticas** | Prever uma nova tentativa de conexão do lado da aplicação em vez de supor que um serviço dependente responde já no primeiro instante; declarar explicitamente as redes assim que se quer nomeá-las ou isolar algumas. |
