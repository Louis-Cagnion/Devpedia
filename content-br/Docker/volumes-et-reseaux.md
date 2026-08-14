---
order: 4
---

# Volumes e redes

## O sistema de arquivos de um contêiner é efêmero

A camada gravável de um contêiner (veja [Os conceitos básicos](/?c=docker&p=concepts-de-base)) desaparece junto com ele: remover um contêiner perde todos os dados que ele escreveu, a menos que eles vivam em um **volume**.

```bash
docker run -v meus-dados:/var/lib/mysql mysql:8
```

Aqui, `meus-dados` é um **volume nomeado**, gerenciado pelo Docker e armazenado independentemente de qualquer contêiner: remover o contêiner não remove o volume, e um novo contêiner pode ser anexado ao mesmo volume para recuperar os dados.

## Volumes nomeados vs bind mounts

| | Volume nomeado | Bind mount |
|---|---|---|
| Localização | Gerenciado pelo Docker, caminho interno irrelevante | Um caminho **preciso** da máquina hospedeira |
| Sintaxe | `-v meus-dados:/caminho` | `-v /caminho/hospedeiro:/caminho` (caminho do hospedeiro começa com `/` ou `./`) |
| Uso típico | Dados persistentes de um banco de dados, de um serviço | Montar o código fonte em desenvolvimento para ver as mudanças sem reconstruir a imagem |

```bash
# Bind mount: o diretorio atual do hospedeiro vira /app no conteiner
docker run -v $(pwd):/app meu-app:1.0
```

> **Armadilha frequente em desenvolvimento**: um bind mount em `/app` mascara inteiramente o que a imagem havia copiado ali no momento do build: se a imagem instala dependências em `/app/node_modules` e o bind mount sobrescreve todo o `/app` com o diretório do hospedeiro (onde `node_modules` não existe necessariamente), o contêiner inicia sem suas dependências.

## Redes: os contêineres se enxergam pelo nome

Por padrão, o Docker cria uma rede **bridge**: cada contêiner recebe nela seu próprio endereço IP interno, e dois contêineres na mesma rede conseguem se alcançar diretamente **pelo nome**, sem configuração manual: o Docker resolve esse nome internamente, no mesmo princípio do [DNS](/?c=langages-de-programmation&s=php&p=securite) que traduz um nome de domínio em endereço IP na Internet.

```bash
docker network create minha-rede
docker run --network minha-rede --name banco mysql:8
docker run --network minha-rede --name api meu-app:1.0
```

A partir do contêiner `api`, conectar-se ao banco de dados se faz visando o host `banco` (ex. `mysql://banco:3306`), não um endereço IP: esse endereço mudaria a cada reinicialização, o nome, por sua vez, permanece estável.

## Publicar uma porta para fora

`EXPOSE` em um [Dockerfile](/?c=docker&p=dockerfile) apenas **documenta** uma porta; só o `-p` no `docker run` a torna realmente acessível de fora do contêiner:

```bash
docker run -p 8080:80 meu-app:1.0
# hospedeiro:8080  -->  conteiner:80
```

Dois contêineres na mesma rede já se comunicam entre si sem `-p` (eles se enxergam diretamente na rede interna); `-p` só é necessário para expor um serviço **fora** do Docker, para a máquina hospedeira ou para o exterior.

## O modo `host`: compartilhar diretamente a rede do hospedeiro

```bash
docker run --network host meu-app:1.0
```

Esse modo não cria nenhuma interface de rede própria do contêiner: ele reutiliza diretamente a da máquina hospedeira, sem passar pelo [namespace de rede](/?c=docker&p=concepts-de-base) que normalmente isola cada contêiner. Uma porta aberta pela aplicação internamente é então imediatamente uma porta aberta no próprio hospedeiro, sem mapeamento `-p` nem tradução de endereço.

> **Nota:** esse ganho de simplicidade (e um pouco de desempenho de rede) tem como custo a perda de uma das duas barreiras de isolamento vistas em [Os conceitos básicos](/?c=docker&p=concepts-de-base): um contêiner comprometido em modo `host` vê e pode potencialmente alcançar tudo que está escutando na rede do hospedeiro, exatamente como um processo comum desse mesmo hospedeiro. É por isso que esse modo geralmente é evitado para um serviço exposto publicamente, em favor da rede bridge padrão.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O sistema de arquivos de um contêiner é efêmero: só um volume (nomeado ou bind mount) persiste depois de sua remoção. Os contêineres de uma mesma rede Docker se alcançam diretamente pelo nome. |
| **Ferramentas utilizáveis** | `-v` (volume/bind mount), `docker network create`, `-p` para publicar uma porta para fora. |
| **Armadilhas a evitar** | Um bind mount que mascara um diretório já povoado pela imagem (ex. `node_modules` instalado no build, sobrescrito pelo bind mount); o modo `--network host` que remove o isolamento de rede do contêiner. |
| **Boas práticas** | Usar um volume nomeado para dados persistentes (banco de dados), um bind mount para o código fonte em desenvolvimento; evitar `--network host` para um serviço exposto publicamente. |
