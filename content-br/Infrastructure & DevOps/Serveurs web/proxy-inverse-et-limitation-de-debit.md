---
order: 2
---

# Proxy reverso e limitação de taxa

Um site recebe **requisições** (pedidos enviados por um navegador ou um programa, o **cliente**) e responde a elas: é o princípio do [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). O programa que executa o código do site e produz as respostas é chamado aqui de **servidor de aplicação**. O papel de um [servidor web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web) (o programa que escuta as requisições que chegam a uma máquina e lhes responde) é apresentado em um capítulo à parte.

Este capítulo responde a duas perguntas que surgem assim que o site sai do computador do seu autor:

- **Quem deve receber as requisições primeiro?** Resposta: um **proxy reverso**, um intermediário colocado na frente dos servidores de aplicação.
- **Como impedir que um único cliente ocupe todo o espaço?** Resposta: a **limitação de taxa** (*rate limiting*), que limita o número de requisições aceitas por cliente e por período.

Os dois assuntos estão ligados por uma armadilha: atrás de um proxy, a aplicação não enxerga mais o [endereço IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#o-endereco-ip-identificar-uma-maquina) real do cliente (o número que identifica a máquina dele na rede), e a limitação de taxa erra o alvo. A última parte trata disso.

| Parte | Pergunta | Ferramenta estudada |
|---|---|---|
| [Proxy direto e proxy reverso](#proxy-direto-contra-proxy-reverso) | Quem está escondido, e de quem? | Diagramas |
| [O que faz um proxy reverso](#o-que-faz-um-proxy-reverso) | Quais serviços ele presta? | TLS, distribuição, cache, compressão |
| [Um exemplo com nginx](#um-exemplo-com-nginx) | Como é a configuração? | `upstream`, `proxy_pass`, `proxy_set_header` |
| [A limitação de taxa](#a-limitacao-de-taxa) | Como contar as requisições? | Balde de fichas, `limit_req` |
| [A armadilha do endereço visto atrás de um proxy](#a-armadilha-do-endereco-visto-atras-de-um-proxy) | Quem é realmente o cliente? | `X-Forwarded-For` |

Os blocos de código JavaScript são executados com **Node.js** (um programa que executa JavaScript fora do navegador, [documentação oficial](https://nodejs.org/docs/latest/api/)) a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). As palavras *função*, *classe* e *variável* são explicadas em [as funções JavaScript](/?c=langages&s=javascript&p=fonctions), [as classes](/?c=langages&s=javascript&p=poo) e [a variável](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable). O bloco `/** ... */` colocado acima de uma função é um comentário de documentação: `@brief` resume o que a função faz, `@param` descreve um valor que ela recebe, `@returns` o valor que ela devolve. Entre chaves, indica-se o tipo do valor: `number` = número, `boolean` = verdadeiro ou falso, `string` = texto, `Set<string>` = conjunto de textos, `{{autorizada: boolean, espera: number}}` = objeto que agrupa um verdadeiro ou falso e um número. Os testes `if`, os objetos `{ ... }`, os laços `for` e os arrays `[ ... ]` são explicados em [as condições](/?c=langages&s=javascript&p=conditions), [os objetos](/?c=langages&s=javascript&p=objets), [os laços de repetição](/?c=langages&s=javascript&p=boucles) e [os arrays](/?c=langages&s=javascript&p=tableaux); uma **função de seta** `(a) => ...` é uma escrita curta de função (veja [as funções](/?c=langages&s=javascript&p=fonctions)). Os arquivos `.mjs` são módulos JavaScript: executam-se com `node nome.mjs` e podem trocar código por `import` e `export`. Os comandos Bash do capítulo são explicados no local, com links para [os redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes), [o processamento de texto](/?c=langages&s=bash&p=traitement-de-texte), [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base), [os scripts e o shebang](/?c=langages&s=bash&p=scripts-et-shebang) e [as permissões](/?c=langages&s=bash&p=permissions-et-fichiers).

## Proxy direto contra proxy reverso

Um **proxy** (palavra inglesa, que significa « intermediário ») é um programa que se intercala entre um cliente e um servidor: ele recebe a requisição no lugar do servidor e depois a transmite. Existem duas variantes, conforme o lado da rede que ele protege.

```
PROXY DIRETO (forward proxy) : ele protege os clientes

  Rede da empresa                                Internet
  +----------+
  | PC 1     |--+
  +----------+  |   +-------+
                +-->| Proxy |-------------------------> Site web
  +----------+  |   +-------+                           (vê o proxy,
  | PC 2     |--+                                        não os PCs)
  +----------+

PROXY REVERSO (reverse proxy) : ele protege os servidores

  Internet                                  Hospedagem
  +----------+
  | Cliente A|--+                           +-----------+
  +----------+  |   +---------+        +--->| Aplic 1   |
                +-->| Proxy   |--------+    +-----------+
  +----------+  |   | reverso |        |    +-----------+
  | Cliente B|--+   +---------+        +--->| Aplic 2   |
  +----------+   (os clientes veem          +-----------+
                  o proxy, não as aplicações)
```

| | Proxy direto | Proxy reverso |
|---|---|---|
| Fica na frente de | Os **clientes** (computadores de uma rede interna) | Os **servidores** (aplicações) |
| Quem ele esconde? | Os clientes, aos olhos dos servidores da Internet | Os servidores, aos olhos dos clientes |
| Quem sabe que ele existe? | O cliente (ele é configurado para usá-lo) | Ninguém do lado do cliente: ele acredita estar falando com o site |
| Quem o instala? | A organização que gerencia os computadores | A equipe que gerencia o site |
| Usos típicos | Filtrar os sites visitados, registrar cada requisição em um arquivo (o log), guardar em memória as páginas pedidas com frequência | Criptografia, distribuição de carga, cache, proteção |
| Exemplos de software | [Squid](https://www.squid-cache.org/) | [nginx](https://nginx.org/), [HAProxy](https://www.haproxy.org/), [Traefik](https://doc.traefik.io/traefik/), [Caddy](https://caddyserver.com/) |

Um endereço web como `https://exemplo.com.br/publico/a.css` se lê em partes: o **nome de domínio** (`exemplo.com.br`, o nome legível da máquina, [explicação do MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)), o **caminho** (`/publico/a.css`, o que é pedido nesta máquina) e, quando está escrita, a **porta** (o número que distingue vários serviços em uma mesma máquina; sem ela, o HTTPS usa a 443).

O resto do capítulo fala apenas do proxy reverso, aquele que um desenvolvedor de sites instala. Em um projeto com vários contêineres, ele aparece como mais um serviço (veja [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)). Sua parente próxima, o [gateway de API](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices#o-gateway-de-api-api-gateway), lê o conteúdo de cada requisição para encaminhá-la (direcioná-la ao serviço certo); o proxy reverso, por sua vez, só observa, em geral, o endereço, o nome de domínio e o caminho.

## O que faz um proxy reverso

Colocado na entrada, o proxy reverso vê passar todas as requisições e todas as respostas. Ele aproveita para prestar cinco serviços, que cada aplicação não precisa mais implementar por conta própria.

```
Cliente ==(1) HTTPS cifrado=> +------------------------------+
                              |        PROXY REVERSO         |
                              |  (1) descriptografa (TLS)    |
                              |  (3) responde pelo cache     |-- sem cache --+
                              |  (5) comprime a resposta     |               |
                              +--------------+---------------+               |
                                             | (2) escolhe o servidor        |
                                  +----------+----------+                    |
                                  v                     v                    |
                            +-----------+         +-----------+              |
                            | Aplic 1   |         | Aplic 2   |<-------------+
                            +-----------+         +-----------+
                            (4) endereços privados, invisíveis da Internet
```

| Serviço | O que faz | Por que é útil | Para aprofundar |
|---|---|---|---|
| Terminação TLS | Recebe a conexão criptografada (HTTPS), a descriptografa e depois fala em texto claro com as aplicações | Um único lugar guarda o certificado e sua chave privada; as aplicações não têm nenhum código de criptografia | [Criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#o-certificado-tls-autoassinado) |
| Distribuição de carga | Envia cada requisição para um dos servidores de aplicação | Vários servidores dividem o tráfego; um servidor parado é evitado | [Autoscaling e distribuição de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#o-balanceador-de-carga-load-balancer) |
| Cache | Guarda a resposta a uma requisição e a reproduz igual para os clientes seguintes | A aplicação não é mais solicitada por uma página que não mudou | [CDN e transmissão adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative#o-cdn-copias-do-conteudo-distribuidas-pelo-mundo-todo) para a versão distribuída pelo mundo |
| Ocultação dos servidores | Só o proxy tem um endereço público; as aplicações ficam na rede privada | Uma aplicação não pode ser atacada diretamente pela Internet | [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), que costuma ser instalado nesse mesmo lugar |
| Compressão | Reduz o tamanho das respostas (por exemplo com **gzip**, um formato de compressão) antes de enviá-las | Menos dados na rede, páginas mais rápidas de carregar | [Documentação do módulo gzip do nginx](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) |

**TLS** (*Transport Layer Security*) é o protocolo que criptografa a conexão; **HTTPS** é o HTTP transportado em uma conexão TLS. Um **certificado** é o documento que comprova que o servidor é mesmo o do nome de domínio pedido. Um **cache** é uma memória que guarda uma resposta para reproduzi-la sem refazer o trabalho que a produziu.

Esses serviços têm um custo: o proxy se torna um **ponto único de falha** (*single point of failure*), isto é, um elemento cuja queda para tudo, mesmo que as aplicações por trás estejam bem. Protege-se contra isso executando vários proxies idênticos, distribuídos eles mesmos por um endereço virtual (um endereço IP que passa automaticamente de um proxy para outro quando o primeiro cai) ou por um serviço do provedor de hospedagem (veja [a distribuição de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#o-balanceador-de-carga-load-balancer)).

## Um exemplo com nginx

**nginx** (pronuncia-se « engine X », [site oficial](https://nginx.org/)) é um software que serve como servidor web e proxy reverso. Sua configuração é um arquivo de texto feito de **diretivas**: um nome, valores, um ponto e vírgula final (`gzip on;`). Chaves `{ }` agrupam diretivas em **blocos**. Um **cabeçalho** (*header*) é uma linha `Nome: valor` anexada a uma requisição ou a uma resposta para descrevê-la (o nome de domínio pedido, o idioma aceito...). Os cabeçalhos de controle e os códigos de status têm seu [capítulo dedicado](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle).

| Bloco ou diretiva | Papel |
|---|---|
| `upstream nome { ... }` | Declara um grupo de servidores de aplicação sob um nome (« a montante » do proxy) |
| `server { ... }` | Descreve um site: porta de escuta, nome de domínio, certificado |
| `location caminho { ... }` | Regras aplicadas às requisições cujo endereço começa por esse caminho |
| `proxy_pass endereço;` | Transmite a requisição a esse endereço, ou a um grupo `upstream` |
| `proxy_set_header Nome valor;` | Acrescenta ou substitui um cabeçalho da requisição transmitida |

A configuração a seguir faz a terminação TLS, distribui entre duas aplicações, comprime e transmite as informações sobre o cliente. Os endereços `10.0.0.11` e `10.0.0.12` são endereços de rede privada inventados (veja [o endereço IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#o-endereco-ip-identificar-uma-maquina)); `3000` é a porta em que cada aplicação escuta.

```nginx
# upstream : grupo nomeado « aplicacao », os servidores entre os quais o nginx distribui
upstream aplicacao {
    # primeira aplicação, endereço privado e porta 3000
    server 10.0.0.11:3000;
    # segunda aplicação ; sem outro ajuste, o nginx os usa em revezamento
    server 10.0.0.12:3000;
}

# server : um site
server {
    # escuta a porta 443 (a do HTTPS) e ativa o TLS
    listen 443 ssl;
    # este bloco responde às requisições que pedem este nome de domínio
    server_name exemplo.com.br;

    # arquivo do certificado (o documento de identidade do site) seguido dos certificados
    # intermediários (os das entidades que garantem a assinatura dele): é a « cadeia completa »
    ssl_certificate     /etc/ssl/exemplo.com.br/fullchain.pem;
    # arquivo da chave privada (o segredo que prova que o certificado é mesmo nosso):
    # só deve ser legível pelo nginx
    ssl_certificate_key /etc/ssl/exemplo.com.br/privkey.pem;

    # ativa a compressão das respostas
    gzip on;
    # tipos MIME a comprimir: um tipo MIME é a etiqueta do formato de um conteúdo
    # (text/css = folha de estilo) ; o texto comprime bem, as imagens já menos
    gzip_types text/css application/javascript application/json;

    # Host : nome de domínio pedido pelo cliente, copiado sem a porta
    proxy_set_header Host $host;
    # X-Real-IP : endereço do cliente, como o nginx o vê ($remote_addr)
    proxy_set_header X-Real-IP $remote_addr;
    # X-Forwarded-For : cadeia dos endereços percorridos, com o do cliente no fim
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # X-Forwarded-Proto : protocolo usado pelo cliente (https aqui)
    proxy_set_header X-Forwarded-Proto $scheme;

    # location / : todos os endereços do site
    location / {
        # transmite a requisição a um dos servidores do grupo « aplicacao »
        proxy_pass http://aplicacao;
    }
}
```

Um **tipo MIME** ([documentação do MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/MIME_types)) escreve-se `categoria/formato`, por exemplo `application/json` para dados JSON. Os nomes que começam com `$` (`$host`, `$remote_addr`, `$scheme`) são **variáveis** do nginx: ele as substitui a cada requisição pelo valor do momento. Os cabeçalhos acrescentados são indispensáveis, porque a aplicação não vê mais o cliente, e sim o proxy:

| Cabeçalho | O que a aplicação não saberia sem ele |
|---|---|
| `Host` | O nome de domínio pedido. Sem `proxy_set_header Host`, o nginx envia o nome do grupo (`aplicacao`) |
| `X-Forwarded-For` | O endereço do cliente e os dos proxies atravessados (detalhe [mais abaixo](#a-armadilha-do-endereco-visto-atras-de-um-proxy)) |
| `X-Forwarded-Proto` | Se o cliente chegou por `https`; a aplicação, recebida em `http` pelo proxy, não consegue adivinhar isso e corre o risco de gerar links em `http` |
| `X-Real-IP` | O endereço do par direto do nginx (a máquina que se conecta a ele), quando só um proxy está em jogo; o padrão `Forwarded` ([RFC 7239](https://www.rfc-editor.org/rfc/rfc7239)) pretende substituir a família `X-Forwarded-*` |

### O que foi testado

O nginx foi executado em uma imagem **Docker** (veja [os conceitos básicos do Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base)), sem instalá-lo na máquina. A configuração acima foi validada por `nginx -t` (o comando que verifica a sintaxe de um arquivo sem iniciar o servidor) com um [certificado autoassinado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#o-certificado-tls-autoassinado) (assinado pelo próprio titular, portanto sem entidade garantidora), depois executada de verdade: os endereços `10.0.0.x:3000` foram substituídos por dois pequenos servidores locais (portas 18431 e 18433) que devolvem os cabeçalhos que recebem. O formato do log é personalizado por estas duas diretivas, colocadas no bloco `http` (o bloco que contém os blocos `server`):

```nginx
# log_format : define um formato de linha nomeado « acompanhamento » : endereço do cliente,
# código da resposta, endereço do servidor de aplicação escolhido
log_format acompanhamento '$remote_addr $status $upstream_addr';
# access_log : escreve uma linha por requisição neste arquivo, no formato « acompanhamento »
access_log /var/log/nginx/acesso.log acompanhamento;
```

Registro (log) do nginx para quatro requisições consecutivas:

```text
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
```

As duas aplicações são de fato revezadas. Eis os cabeçalhos que a aplicação recebeu para uma requisição chegada em HTTPS (trecho: os cabeçalhos que o nginx acrescentou):

```text
host: 127.0.0.1            <- Host copiado
x-real-ip: 127.0.0.1       <- endereço do cliente visto pelo nginx
x-forwarded-for: 127.0.0.1 <- cadeia de endereços: aqui só o cliente
x-forwarded-proto: https   <- o cliente estava em HTTPS
```

> **Armadilha:** um `location` que contém sua própria diretiva `proxy_set_header` não herda mais as do bloco `server`. Teste com `X-Real-IP` definido no nível `server` e um `location /outro/` que acrescenta `Host`: a aplicação recebeu `Host`, mas não mais `X-Real-IP`.
>
> **Boa prática:** definir todos os `proxy_set_header` no mesmo nível, ou agrupá-los em um arquivo incluído por cada `location` com a diretiva `include`, que insere o conteúdo de outro arquivo:

```nginx
# dentro de cada location : insere os proxy_set_header comuns, escritos neste arquivo
include /etc/nginx/proxy-headers.conf;
```

### Adicionar um cache

Para as páginas que não mudam de um visitante para outro, o proxy pode guardar a resposta. A diretiva `proxy_cache_path` fica fora do bloco `server`, as outras em um `location` dedicado:

```nginx
# proxy_cache_path : pasta de armazenamento, 10 MB de índice na memória (keys_zone),
# 100 MB no máximo de respostas, e remoção de uma resposta não pedida há 10 minutos
proxy_cache_path /var/cache/nginx/paginas keys_zone=paginas:10m max_size=100m inactive=10m;

# no bloco « server » existente:
location /publico/ {
    # guarda as respostas na zona « paginas »
    proxy_cache paginas;
    # guarda as respostas de código 200 por 1 minuto
    proxy_cache_valid 200 1m;
    # acrescenta à resposta HIT (servida pelo cache) ou MISS (vinda da aplicação)
    add_header X-Cache $upstream_cache_status;
    # transmite à aplicação as requisições que o cache não sabe servir
    proxy_pass http://aplicacao;
}
```

Três requisições seguidas em `/publico/a.css` deram `MISS`, `HIT`, `HIT`, e a aplicação contou apenas **uma** chamada: as duas últimas respostas vinham do cache. Uma requisição a um arquivo JSON com `Accept-Encoding: gzip` recebeu `Content-Encoding: gzip`, prova de que a compressão está ativa.

> **Armadilha:** guardar em cache uma resposta **personalizada** (a página « minha conta » de um usuário conectado). O cache a reproduziria para outro visitante. O nginx guarda as respostas sob uma chave construída a partir do endereço pedido: se dois visitantes pedem o mesmo endereço, recebem a mesma resposta.
>
> **Boa prática:** colocar `proxy_cache` apenas em caminhos públicos (arquivos estáticos, páginas idênticas para todos) e dar ao cache uma duração curta.

## A limitação de taxa

A **limitação de taxa** (*rate limiting*) consiste em recusar as requisições de um cliente que envia demais, por exemplo mais de 5 por segundo. A **taxa** é esse número de requisições relacionado a um intervalo de tempo.

| Motivo | Exemplo |
|---|---|
| Se proteger contra força bruta | Um programa testa milhares de senhas no formulário de login (veja [a segurança de APIs web](/?c=securite&s=cybersecurite&p=securite-api-web#limitando-a-taxa-de-requisicoes-rate-limiting)) |
| Absorver um bug do lado do cliente | Um aplicativo móvel que chama a API em loop depois de um erro |
| Manter o serviço justo | Um cliente que baixa todo o catálogo não desacelera os outros |
| Controlar os custos | Cada requisição dispara uma chamada cobrada a um serviço de terceiros (veja [a sobrecarga e a negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Complementar um WAF | Um [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif) filtra por padrão de ataque, a limitação de taxa filtra por quantidade: uma requisição válida, repetida um milhão de vezes, passa pelo primeiro filtro, mas não pelo segundo |

A limitação de taxa não substitui o [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#o-problema-um-unico-servidor-tem-capacidade-limitada), que acrescenta servidores para absorver um tráfego legítimo: ela serve apenas para recusar o excesso de um cliente determinado.

### Onde colocá-la: proxy ou aplicação

| | No proxy reverso | Na aplicação |
|---|---|---|
| Vantagem | Recusa antes de qualquer trabalho da aplicação; uma única regra para todas as aplicações | Conhece a conta conectada, o plano tarifário, o custo real de cada rota |
| Limite | Só conhece o que a requisição contém (endereço, cabeçalhos) | Cada instância (cada cópia do programa em execução) tem seus contadores: com 3 instâncias, um cliente pode obter 3 vezes o limite |
| Remédio para o limite | Complementar com uma regra na aplicação | Compartilhar os contadores em um [armazenamento em memória como o Redis](/?c=donnees&s=bases-de-donnees&p=redis) |

Na prática, combinam-se os dois: um limite amplo no proxy, limites finos na aplicação.

### Duas formas de contar: janela fixa e balde de fichas

A **janela fixa** divide o tempo em faixas (por exemplo de 10 segundos) e conta as requisições de cada faixa: acima do limite, recusa até a faixa seguinte. O **balde de fichas** (*token bucket*) funciona como uma reserva: um balde contém no máximo *N* fichas, cada requisição pega uma, e o balde se enche a velocidade constante. Balde vazio, a requisição é recusada, com o código **429** (« muitas requisições », detalhado mais abaixo). Uma **rajada** é um grupo de requisições enviadas quase todas ao mesmo tempo.

```
        fichas acrescentadas a velocidade constante (ex. 1 por segundo)
                          |
                          v
                    +-----------+  <- capacidade máxima: 5 fichas
                    |  o o o o  |     (o excedente é perdido)
                    |  o o      |
                    +-----+-----+
                          |
         cada requisição retira UMA ficha:
           ficha disponível -> requisição aceita
           balde vazio      -> requisição recusada (429)
```

| | Janela fixa | Balde de fichas |
|---|---|---|
| Princípio | Um contador zerado a cada faixa | Uma reserva de fichas que se recarrega continuamente |
| Memória por cliente | Um contador e um número de faixa | Um número de fichas e um instante |
| Rajada permitida | O limite inteiro de uma vez, no início da faixa | No máximo a capacidade do balde, depois o ritmo da taxa |
| Principal defeito | **Efeito de fronteira**: 5 requisições no fim da faixa + 5 no início da seguinte = 10 requisições em uma fração de segundo | Dois ajustes a entender (capacidade e taxa) |
| Espera antes de tentar de novo | Até o fim da faixa | O tempo para receber uma ficha, calculável exatamente |
| Usado por | Cotas mensais ou diárias | Limites por segundo ou por minuto em uma API |

A **janela deslizante** (variante da janela fixa que recalcula a cota continuamente) é apresentada em [a segurança de APIs web](/?c=securite&s=cybersecurite&p=securite-api-web#limitando-a-taxa-de-requisicoes-rate-limiting). O mesmo princípio de limitação existe também no navegador, sob o nome de *throttle* (veja [debounce e throttle](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence#debounce-e-throttle-duas-formas-de-limitar-a-frequencia-de-uma-funcao)).

### Um balde de fichas em JavaScript

O tempo é passado como parâmetro (`agora`, em segundos) em vez de ser lido dentro da função: o comportamento se torna reproduzível, portanto testável.

Salve esta classe no arquivo `seau.mjs`.

```js
/**
 * @brief Balde de fichas: cada requisição pega uma ficha, o balde se enche com o tempo.
 *
 * @param {number} capacidade - inteiro de pelo menos 1
 * @param {number} taxa - número estritamente positivo (fichas por segundo)
 */
// export : torna a classe usável por outro arquivo ; class : um modelo de objetos
export class BaldeDeFichas {
  // constructor : chamado por « new » na criação de um balde
  constructor(capacidade, taxa) {
    // this designa o balde em criação: nele ficam guardados os seus ajustes
    // tamanho máximo do balde = tamanho da maior rajada aceita
    this.capacidade = capacidade;
    // velocidade de enchimento, em fichas por segundo
    this.taxa = taxa;
    // o balde começa cheio
    this.fichas = capacidade;
    // instante da última retirada (null = « nada » : não houve nenhuma)
    this.ultimoInstante = null;
  }

  /**
   * @brief Tenta retirar uma ficha no instante dado.
   *
   * @param {number} agora - segundos, nunca inferior à chamada anterior
   *
   * @returns {{autorizada: boolean, espera: number}} espera em segundos até uma ficha
   */
  retirar(agora) {
    // !== quer dizer « diferente de » : exceto na primeira chamada, o balde é recarregado
    if (this.ultimoInstante !== null) {
      // fichas ganhas desde a última chamada: duração decorrida x taxa
      const ganhas = (agora - this.ultimoInstante) * this.taxa;
      // Math.min mantém o menor dos dois números: o balde não transborda
      this.fichas = Math.min(this.capacidade, this.fichas + ganhas);
    }
    // guarda este instante para o próximo cálculo
    this.ultimoInstante = agora;
    // >= quer dizer « maior ou igual a »
    if (this.fichas >= 1) {
      // resta pelo menos uma ficha : -= 1 retira uma, e a requisição é aceita
      this.fichas -= 1;
      // { ... } é um objeto : dois valores guardados sob os nomes autorizada e espera
      return { autorizada: true, espera: 0 };
    }
    // falta (1 - fichas) ficha: nesta taxa, ela chegará dentro deste prazo
    return { autorizada: false, espera: (1 - this.fichas) / this.taxa };
  }
}
```

Ensaio, a salvar em `essai-seau.mjs`: um balde de capacidade 5, enchido a 1 ficha por segundo, recebe 7 requisições simultâneas, depois 4 requisições três segundos depois.

```js
// import : pega a classe escrita no arquivo seau.mjs
import { BaldeDeFichas } from "./seau.mjs";

// descreve o resultado de uma retirada em uma linha
function linha(instante, numero, veredito) {
  // operador ? : : se o acesso for autorizado escreve « ok », senão « recusada »
  const estado = veredito.autorizada ? "ok" : "recusada";
  // os ${...} inserem o valor de uma variável no texto entre crases
  return `t=${instante} s  requisição ${numero}: ${estado} (espera ${veredito.espera} s)`;
}

// balde de capacidade 5, enchido a 1 ficha por segundo
const balde = new BaldeDeFichas(5, 1);
// laço for : repete o bloco para i = 1 a 7 (i++ soma 1 a i a cada volta) ;
// 7 requisições no mesmo instante (t = 0 s)
for (let i = 1; i <= 7; i++) {
  // console.log exibe uma linha no terminal
  console.log(linha(0, i, balde.retirar(0)));
}
// 3 segundos depois, 3 fichas foram acrescentadas: 4 requisições
for (let i = 1; i <= 4; i++) {
  console.log(linha(3, i, balde.retirar(3)));
}
```

Saída obtida (arquivos `seau.mjs` e `essai-seau.mjs`, comando `node essai-seau.mjs`):

```text
t=0 s  requisição 1: ok (espera 0 s)
t=0 s  requisição 2: ok (espera 0 s)
t=0 s  requisição 3: ok (espera 0 s)
t=0 s  requisição 4: ok (espera 0 s)
t=0 s  requisição 5: ok (espera 0 s)
t=0 s  requisição 6: recusada (espera 1 s)
t=0 s  requisição 7: recusada (espera 1 s)
t=3 s  requisição 1: ok (espera 0 s)
t=3 s  requisição 2: ok (espera 0 s)
t=3 s  requisição 3: ok (espera 0 s)
t=3 s  requisição 4: recusada (espera 1 s)
```

A rajada de 5 passa, a 6ª é recusada com uma espera de 1 s, exatamente o tempo de produzir uma ficha; após 3 s o balde recuperou 3 fichas. Uma requisição recusada não consome nada.

### O efeito de fronteira da janela fixa, medido

Mesmo limite para os dois métodos (5 requisições a cada 10 segundos, ou seja 0,5 ficha por segundo); 5 requisições chegam em 9,9 s, outras 5 em 10,1 s. O script é salvo em `fixe.mjs` e executado com `node fixe.mjs`.

```js
// import : a classe BaldeDeFichas vista acima
import { BaldeDeFichas } from "./seau.mjs";

/**
 * @brief Contador de janela fixa: no máximo `limite` requisições por faixa de `duracao` s.
 *
 * @param {number} limite - inteiro de pelo menos 1
 * @param {number} duracao - número estritamente positivo (segundos)
 */
class JanelaFixa {
  constructor(limite, duracao) {
    // número de requisições permitidas por faixa, e duração de uma faixa (this : ver acima)
    this.limite = limite;
    this.duracao = duracao;
    // número da faixa em curso e número de requisições já vistas nela
    this.faixa = null;
    this.contagem = 0;
  }

  /**
   * @brief Conta uma requisição no instante dado.
   *
   * @param {number} agora - segundos
   *
   * @returns {boolean} true se a requisição for aceita
   */
  retirar(agora) {
    // Math.floor arredonda para o inteiro inferior: 9,9 / 10 dá 0 ; 10,1 / 10 dá 1
    const faixa = Math.floor(agora / this.duracao);
    // nova faixa (!== : « diferente de ») : a contagem recomeça do zero
    if (faixa !== this.faixa) {
      this.faixa = faixa;
      this.contagem = 0;
    }
    // conta esta requisição, depois aceita-a enquanto o limite não for ultrapassado
    this.contagem += 1;
    // <= quer dizer « menor ou igual a »
    return this.contagem <= this.limite;
  }
}

// 5 requisições por faixa de 10 s, contra um balde de 5 fichas recarregado a 0,5 ficha/s
const janela = new JanelaFixa(5, 10);
const balde = new BaldeDeFichas(5, 0.5);
// contadores das requisições aceitas por cada método
let aceitasJanela = 0;
let aceitasBalde = 0;
// 5 requisições em t = 9,9 s (fim da faixa), depois 5 em t = 10,1 s (início da seguinte) ;
// for...of : percorre a lista, t recebe cada valor por vez
for (const t of [9.9, 9.9, 9.9, 9.9, 9.9, 10.1, 10.1, 10.1, 10.1, 10.1]) {
  // += 1 soma 1 ao contador quando o método aceita a requisição
  if (janela.retirar(t)) aceitasJanela += 1;
  if (balde.retirar(t).autorizada) aceitasBalde += 1;
}
console.log(`janela fixa: ${aceitasJanela} requisições aceitas em 0,2 s`);
console.log(`balde de fichas: ${aceitasBalde} requisições aceitas em 0,2 s`);
```

```text
janela fixa: 10 requisições aceitas em 0,2 s
balde de fichas: 5 requisições aceitas em 0,2 s
```

A janela fixa deixa passar o **dobro** do limite em torno da fronteira entre duas faixas; o balde só deixa passar a sua capacidade.

### Ligar o balde a um servidor HTTP

O servidor abaixo, a salvar em `app.mjs`, cria um balde por cliente, recusa com o código **429** quando o balde está vazio e acrescenta o cabeçalho `Retry-After` (o número de segundos a esperar antes de tentar de novo). O sentido exato desse código e desse cabeçalho é detalhado em [o capítulo sobre os códigos de status e os cabeçalhos de controle](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle); aqui basta saber que 429 significa « muitas requisições ».

O servidor importa uma função `enderecoCliente`, que decide qual endereço contar para cada requisição. Ela é escrita na última parte; por enquanto, o arquivo `adresse.mjs` contém uma versão provisória que devolve o endereço da conexão:

```js
// versão provisória: devolve sempre o endereço da conexão ; o « par » é a
// máquina que abriu a conexão conosco (o cliente, ou um proxy colocado na frente)
export function enderecoCliente(par) {
  // return devolve o valor a quem chamou a função
  return par;
}
```

```js
// node:http é o módulo do Node.js que sabe escutar requisições HTTP
import http from "node:http";
// performance.now() dá um tempo em milissegundos que nunca volta atrás
import { performance } from "node:perf_hooks";
import { BaldeDeFichas } from "./seau.mjs";
import { enderecoCliente } from "./adresse.mjs";

// porta de escuta, lida em uma variável de ambiente ; Number converte o texto em número
const PORTA = Number(process.env.PORT);
// chaves de API conhecidas (exemplos inventados) ; um Set é um conjunto sem repetições,
// e .has(x) responde à pergunta « x faz parte dele? » (documentação: MDN, Set)
const CHAVES = new Set(["chave-alice", "chave-bob"]);
// ?? usa o valor da direita se o da esquerda estiver ausente ; split corta o texto
// a cada vírgula ; filter(Boolean) retira os pedaços vazios ; new Set(...) faz disso
// um conjunto
const CONFIAVEIS = new Set((process.env.FIABLES ?? "").split(",").filter(Boolean));
// cada chave de limitação recebe um balde de 3 fichas, enchido a 1 ficha por segundo
const CAPACIDADE = 3;
const TAXA = 1;
// um balde por chave de limitação, criado na primeira requisição ; uma Map associa um valor
// a uma chave : .set(chave, valor) o acrescenta, .get(chave) o relê,
// .has(chave) testa sua presença
const baldes = new Map();

// createServer : a função de seta (req, res) => { ... } (uma função escrita com =>)
// é chamada a cada requisição recebida (req) para lhe responder (res)
const servidor = http.createServer((req, res) => {
  // endereço do cliente, segundo as regras de confiança vistas adiante
  const endereco = enderecoCliente(
    req.socket.remoteAddress,
    req.headers["x-forwarded-for"],
    CONFIAVEIS,
  );
  // cabeçalho X-Api-Key enviado pelo cliente (undefined se estiver ausente)
  const chaveApi = req.headers["x-api-key"];
  // chave de API conhecida: limita-se pela chave ; senão, pelo endereço
  const chave = CHAVES.has(chaveApi) ? `chave:${chaveApi}` : `ip:${endereco}`;
  // primeira requisição desta chave: cria-se o seu balde
  if (!baldes.has(chave)) baldes.set(chave, new BaldeDeFichas(CAPACIDADE, TAXA));
  // relógio monotônico em segundos: nunca volta atrás, ao contrário da hora do sistema
  const veredito = baldes.get(chave).retirar(performance.now() / 1000);
  if (!veredito.autorizada) {
    // Retry-After é escrito em segundos inteiros: Math.ceil arredonda para cima, String
    // converte o número em texto ; writeHead envia o código e os cabeçalhos da resposta
    res.writeHead(429, { "Retry-After": String(Math.ceil(veredito.espera)) });
    res.end(`muitas requisições para ${chave}\n`);
    return;
  }
  // senão a requisição passa (código 200 por padrão)
  res.end(`ok para ${chave}\n`);
});

// escuta apenas na máquina local : 127.0.0.1 designa sempre a sua própria máquina
servidor.listen(PORTA, "127.0.0.1");
```

Lançamento em um primeiro terminal (sintaxe do Bash, veja [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement)), depois cinco requisições com **curl** (uma ferramenta que envia uma requisição HTTP pelo terminal, [documentação](https://curl.se/docs/)) a partir de um segundo terminal. A opção `-s` suprime as mensagens de andamento, `-i` exibe o cabeçalho da resposta. O `|` (*pipe*) envia a saída do curl ao `grep`, que só mantém as linhas que correspondem a um padrão: `-E` ativa os padrões estendidos, `^` significa « início da linha » e um `|` dentro do padrão significa « ou », portanto as linhas que começam por `HTTP` (o código de status) ou por `Retry-After` (veja [os redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes) e [o processamento de texto](/?c=langages&s=bash&p=traitement-de-texte)). `for i in 1 2 3 4 5; do ... done` repete os comandos uma vez por valor (veja [os laços de repetição](/?c=langages&s=bash&p=boucles)):

```bash
# lança o servidor na porta 18431 (PORT é lida pelo programa)
PORT=18431 node app.mjs
# segundo terminal: cinco requisições seguidas a partir do mesmo endereço
for i in 1 2 3 4 5; do
  curl -si http://127.0.0.1:18431/ | grep -E "^HTTP|^Retry-After"
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
Retry-After: 1
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

Os três primeiros passam (capacidade 3), os dois seguintes são recusados com `Retry-After: 1`.

### Por endereço IP ou por chave de API

A **chave de limitação** é o que designa « um cliente »: é preciso escolher o que se conta.

| Chave | Vantagem | Limite |
|---|---|---|
| Endereço IP | Disponível para qualquer visitante, mesmo anônimo | Várias pessoas atrás do mesmo endereço público (um escritório, uma escola, uma caixa de internet: veja [NAT](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#dois-mecanismos-complementares-dhcp-e-nat)) compartilham um balde; um atacante que dispõe de muitos endereços obtém um balde por endereço |
| Chave de API (identificador dado a cada desenvolvedor ou aplicação cliente) | Precisa: acompanha o cliente real, qualquer que seja o endereço | Apenas para os clientes que possuem uma; uma chave vazada é usada por qualquer pessoa |
| Conta de usuário | Acompanha a pessoa | Exige estar conectado; não protege o próprio formulário de login |

O servidor acima limita por chave de API quando ela é conhecida, senão por endereço. Teste (`X-Api-Key` é o cabeçalho em que o cliente envia sua chave; `-H` acrescenta um cabeçalho à requisição; `--interface` faz a requisição sair de um endereço local escolhido: no Linux, todo endereço `127.x.y.z` designa a sua própria máquina, o que permite simular vários clientes; `head -n 1` mantém apenas a primeira linha da resposta):

```bash
# chave conhecida, enviada a partir de dois endereços alternados: um único balde para a chave
for a in 127.0.0.4 127.0.0.5 127.0.0.4 127.0.0.5; do
  curl -si --interface $a -H "X-Api-Key: chave-alice" http://127.0.0.1:18431/ | head -n 1
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
```

Dois endereços diferentes, uma só cota: a da chave. Uma chave **desconhecida** (`chave-x1`, `chave-x2`, `chave-x3`, `chave-x4`, enviadas a partir do mesmo endereço) cai no limite por endereço: 3 respostas 200, depois 429. Se o servidor criasse um balde para toda chave recebida, um atacante obteria um balde novo inventando uma chave a cada requisição.

> **Armadilha:** guardar todos os baldes na memória sem nunca apagá-los. Cada endereço ou chave vista cria uma entrada; um atacante que muda de endereço faz a tabela crescer até saturar a memória.
>
> **Boa prática:** apagar os baldes inativos (um balde cheio há muito tempo equivale a um balde novo) e limitar o número de entradas.

### A mesma limitação no nginx

O proxy sabe limitar sem escrever uma linha de código da aplicação. As diretivas `limit_req_zone` e `limit_req_status` ficam fora do bloco `server` (no mesmo nível que `upstream`), `limit_req` em um `location`:

```nginx
# limit_req_zone : cria uma zona de contadores na memória (10 MB), um por valor de chave
# $binary_remote_addr : endereço do cliente, em forma compacta ; rate : 1 requisição/segundo
limit_req_zone $binary_remote_addr zone=por_ip:10m rate=1r/s;
# mesmo princípio com a chave de API ; uma requisição sem o cabeçalho X-Api-Key não é contada
limit_req_zone $http_x_api_key zone=por_chave:10m rate=1r/s;
# código devolvido quando o limite é ultrapassado (503 se a diretiva estiver ausente)
limit_req_status 429;

# no bloco « server » existente:
location /api/ {
    # aplica a zona por_ip ; burst=3 : até 3 requisições de antecedência ; nodelay : sem fila
    limit_req zone=por_ip burst=3 nodelay;
    # mesma regra pela chave de API: os dois limites se aplicam
    limit_req zone=por_chave burst=3 nodelay;
    # transmite à aplicação o que passou pelos limites
    proxy_pass http://aplicacao;
}

# quando o nginx decide um 429, ele passa pelo bloco nomeado « limite » abaixo
error_page 429 @limite;
location @limite {
    # always : o cabeçalho é acrescentado mesmo em um código de erro
    add_header Retry-After 1 always;
    # responde 429 com um texto curto
    return 429 "Muitas requisições\n";
}
```

| Ajuste | Efeito |
|---|---|
| `rate=1r/s` | Velocidade de recarga: 1 requisição por segundo (`r/m` para por minuto) |
| `burst=3` | Número de requisições de antecedência toleradas além do ritmo |
| `nodelay` | As requisições da rajada passam de imediato; sem ele, o nginx as faz **esperar** para respeitar o ritmo |
| `$binary_remote_addr` | Chave = endereço do cliente, guardado em poucos bytes; mais econômico que `$remote_addr` (texto) |
| `$http_x_api_key` | Chave = valor do cabeçalho `X-Api-Key` (o nginx monta `$http_` + nome do cabeçalho em minúsculas, com os hífens trocados por `_`) |

Resultados observados com este arquivo (7 requisições rápidas em `/api/x` a partir de um mesmo endereço):

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
```

Quatro aceitas e depois recusas: `burst=3` dá **1 + 3** requisições de imediato, ou seja um balde de capacidade 4 recarregado a 1 por segundo. O log de erros do nginx registra cada recusa (`limiting requests, excess: 3.961 by zone "por_ip"`). A resposta 429 trazia de fato `Retry-After: 1`. Com a chave `k1` enviada a partir de dois endereços alternados, a 5ª requisição foi recusada pela zona `por_chave` (log: `by zone "por_chave"`).

A documentação do nginx descreve o algoritmo dele como um « leaky bucket » (*balde que vaza*), primo do balde de fichas; o comportamento medido (1 + `burst` requisições de imediato, depois o ritmo `rate`) é o de um balde de fichas com capacidade `burst + 1`. Sem `nodelay`, com `burst=3` e requisições enviadas em sequência, cada uma foi atrasada em cerca de 1 segundo (medições: 0,99 s para as requisições 2 a 5) em vez de ser recusada.

> **Armadilha:** achar que `limit_req_zone $http_x_api_key` protege tudo. As requisições **sem** o cabeçalho `X-Api-Key` têm uma chave vazia, que o nginx não conta: é preciso manter a zona `por_ip` ao lado.
>
> **Boa prática:** sempre um limite por endereço como rede de segurança, e o limite por chave além dele para os clientes identificados.

## A armadilha do endereço visto atrás de um proxy

Toda conexão de rede tem duas pontas, e o servidor vê o endereço de **quem fala com ele diretamente**, chamado de **par** (*peer*). Atrás de um proxy, o par da aplicação é sempre o proxy.

```
Sem proxy

Cliente A (198.51.100.7) --> Aplicação
   a aplicação vê 198.51.100.7

Com um proxy reverso

Cliente A (198.51.100.7) --+
                           +--> Proxy (10.0.0.2) --> Aplicação
Cliente B (203.0.113.9)  --+
   a aplicação vê 10.0.0.2 para A E para B
```

Consequência direta para a limitação de taxa: todos os clientes compartilham **um único balde**, o do endereço do proxy, e o primeiro que consome as fichas bloqueia os outros. Para medir isso, um pequeno proxy faz o papel do nginx: recebe a requisição, acrescenta o endereço do cliente a `X-Forwarded-For` e depois a transmite à aplicação. Ele é salvo em `proxy.mjs`; a transmissão do conteúdo usa `pipe`, explicado em [os streams](/?c=langages&s=javascript&p=streams).

```js
// node:http : o módulo HTTP do Node.js
import http from "node:http";

// porta de escuta do proxy e porta da aplicação atrás dele
const PORTA = Number(process.env.PORT);
const MONTANTE = Number(process.env.AMONT);

http.createServer((req, res) => {
  // endereço de quem acaba de chamar este proxy
  const visto = req.socket.remoteAddress;
  // cadeia já recebida, se outro proxy passou antes (undefined caso contrário)
  const cadeia = req.headers["x-forwarded-for"];
  // um proxy acrescenta ao fim da cadeia o endereço que viu ; ... copia os cabeçalhos
  const cabecalhos = {
    ...req.headers,
    "x-forwarded-for": cadeia ? `${cadeia}, ${visto}` : visto,
  };
  // refaz a requisição para a aplicação, com os cabeçalhos completados
  const opcoes = { host: "127.0.0.1", port: MONTANTE, path: req.url, headers: cabecalhos };
  const montante = http.request(opcoes, (resposta) => {
    // copia o código e os cabeçalhos da resposta, depois o conteúdo (pipe : liga um fluxo
    // de leitura a um fluxo de escrita, veja os streams)
    res.writeHead(resposta.statusCode, resposta.headers);
    resposta.pipe(res);
  });
  // a requisição é transmitida tal qual à aplicação
  req.pipe(montante);
}).listen(PORTA, "127.0.0.1");
```

Os ensaios precisam de um pequeno script Bash, `client.sh`, que faz o papel do cliente. Ele envia o número de requisições pedido a partir do endereço local dado (`--interface`, como acima) e mostra para cada uma o código de resposta e o texto recebido. Um terceiro argumento, opcional, acrescenta um cabeçalho `X-Forwarded-For` a cada requisição. Os comandos que seguem o `curl` ficam na mesma linha: `tr -d '\r'` retira os retornos de carro (`\r`), caractere invisível que termina cada linha de uma resposta HTTP e que, sem ele, faria a linha de status ser sobrescrita pelo resto da exibição no terminal; `sed -n '1p;$p'` só mostra a primeira e a última linha; `paste -sd'|'` junta as linhas em uma só, separadas por `|`; o último `sed` troca esse `|` por três espaços. `$1`, `$2` e `$3` são os argumentos dados ao script; `seq 1 N` produz os números de 1 a N; `$(...)` é substituído pelo resultado do comando que ele contém; uma `\` no fim de linha continua o comando na linha seguinte. O arquivo é salvo com o nome `client.sh`; `chmod +x client.sh` o torna executável (veja [os scripts e o shebang](/?c=langages&s=bash&p=scripts-et-shebang) e [as permissões](/?c=langages&s=bash&p=permissions-et-fichiers)).

```bash
#!/bin/bash
# $1 : endereço local de partida, $2 : número de requisições
# $3 (opcional) : início do endereço escrito em X-Forwarded-For, seguido de 1, 2, 3...
s="ção"
# a sequência && só executa se o teste for verdadeiro ; -gt : « maior que »
[ "$2" -gt 1 ] && s="ções"
echo "cliente $1: $2 requisi$s"
for i in $(seq 1 "$2"); do
  # vetor vazio, que recebe a opção -H (acrescentar um cabeçalho) se $3 for dado
  xff=()
  [ -n "$3" ] && xff=(-H "X-Forwarded-For: $3.$i")
  # -s : silencioso, -i : mostra o cabeçalho, --interface : endereço de partida da requisição
  # tr retira os \r do fim de linha ; sed guarda a primeira linha (status) e a última
  # (corpo) ; paste as junta
  curl -si --interface "$1" "${xff[@]}" http://127.0.0.1:18432/ \
    | tr -d '\r' | sed -n '1p;$p' | paste -sd'|' | sed 's/|/   /'
done
```

O proxy é salvo no arquivo `proxy.mjs`. Primeiro ensaio: a aplicação roda com a versão provisória de `enderecoCliente` (que devolve sempre o par), e o proxy escuta na porta 18432, diante dela. Em três terminais, lança-se a aplicação (porta 18431), o proxy (`PORT` é a sua porta de escuta, `AMONT` a da aplicação), depois o cliente `127.0.0.2` envia 3 requisições e o cliente `127.0.0.3` apenas uma:

```bash
# terminal 1 : a aplicação, na porta 18431
PORT=18431 node app.mjs
# terminal 2 : o proxy, na porta 18432, que transmite à aplicação da porta 18431
PORT=18432 AMONT=18431 node proxy.mjs
# terminal 3 : 3 requisições do cliente 127.0.0.2, depois 1 requisição do cliente 127.0.0.3
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```

```text
cliente 127.0.0.2: 3 requisições
HTTP/1.1 200 OK   ok para ip:127.0.0.1
HTTP/1.1 200 OK   ok para ip:127.0.0.1
HTTP/1.1 200 OK   ok para ip:127.0.0.1
cliente 127.0.0.3: 1 requisição
HTTP/1.1 429 Too Many Requests   muitas requisições para ip:127.0.0.1
```

O cliente `127.0.0.3`, que ainda não tinha enviado nada, é recusado: a aplicação contou todo mundo sob o endereço `127.0.0.1`, o do proxy.

### X-Forwarded-For: a cadeia de endereços

A solução é o cabeçalho `X-Forwarded-For` (« encaminhado para », [descrição no MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)). Cada proxy **acrescenta ao fim** o endereço de quem lhe falou:

```
Cliente (198.51.100.7) --> Proxy 1 (10.0.0.1) --> Proxy 2 (10.0.0.2) --> Aplicação

Cabeçalho recebido pela aplicação: X-Forwarded-For: 198.51.100.7, 10.0.0.1
Par visto pela aplicação:          10.0.0.2

  198.51.100.7 : acrescentado pelo Proxy 1 (ele viu o cliente)
  10.0.0.1     : acrescentado pelo Proxy 2 (ele viu o Proxy 1)
  10.0.0.2     : NÃO está no cabeçalho: é o par, a aplicação o vê sozinha
```

O cabeçalho é **escrito pelos proxies, mas também por qualquer cliente**: um cliente mal-intencionado pode **forjá-lo** (fabricá-lo por completo), por exemplo enviando `X-Forwarded-For: 1.1.1.1` para se passar por outro endereço. Ele só é digno de confiança se vier de um proxy **conhecido**. Daí a regra:

1. Se o par não for um proxy confiável, ignora-se o cabeçalho e usa-se o par.
2. Se o par for um proxy confiável, lê-se a cadeia **da direita para a esquerda** e guarda-se o primeiro endereço que não é um proxy confiável. O que está à esquerda desse endereço foi escrito pelo cliente, portanto não é confiável.

```js
/**
 * @brief Determina o endereço do verdadeiro cliente, atrás de zero, um ou vários proxies.
 *
 * Exemplo: par 10.0.0.2 (confiável), cabeçalho "1.2.3.4, 10.0.0.1" -> 1.2.3.4
 *
 * @param {string} par - endereço IP da máquina que abriu a conexão
 * @param {string|undefined} cabecalho - valor bruto de X-Forwarded-For, ou undefined
 * @param {Set<string>} confiaveis - endereços dos proxies cujo cabeçalho aceitamos
 *
 * @returns {string} endereço retido para identificar o cliente
 */
export function enderecoCliente(par, cabecalho, confiaveis) {
  // ! quer dizer « não », || « ou » : par desconhecido ou sem cabeçalho, usa-se o par
  // (um par desconhecido pode escrever qualquer coisa no cabeçalho)
  if (!confiaveis.has(par) || !cabecalho) return par;
  // divide "a, b, c" em uma lista de endereços ; map aplica a função (a) => a.trim() a cada
  // elemento, e trim retira os espaços em volta
  const cadeia = cabecalho.split(",").map((a) => a.trim());
  // subimos pela direita: cada proxy confiável acrescentou o endereço que viu ;
  // as posições de uma lista começam em 0, então a última é comprimento - 1 ; i-- retira 1
  // de i a cada volta, e cadeia[i] lê o elemento na posição i
  for (let i = cadeia.length - 1; i >= 0; i--) {
    // primeiro endereço que não é um proxy confiável = o cliente
    if (!confiaveis.has(cadeia[i])) return cadeia[i];
  }
  // a cadeia inteira é confiável: o cliente é o primeiro endereço
  return cadeia[0];
}
```

Seis casos testados (dois proxies confiáveis, `10.0.0.1` e `10.0.0.2`), num arquivo `cas.mjs` executado com `node cas.mjs`:

```js
// a função que acabamos de escrever
import { enderecoCliente } from "./adresse.mjs";

// dois proxies confiáveis: 10.0.0.1 e 10.0.0.2
const confiaveis = new Set(["10.0.0.1", "10.0.0.2"]);
// cada caso: um nome, o endereço da conexão, o cabeçalho recebido, os proxies confiáveis
const casos = [
  ["par desconhecido, cabeçalho forjado", "203.0.113.9", "1.1.1.1", confiaveis],
  ["par confiável, um proxy", "10.0.0.2", "198.51.100.7", confiaveis],
  ["par confiável, início forjado", "10.0.0.2", "1.1.1.1, 198.51.100.7", confiaveis],
  ["dois proxies confiáveis", "10.0.0.2", "198.51.100.7, 10.0.0.1", confiaveis],
  ["par confiável, sem cabeçalho", "10.0.0.2", undefined, confiaveis],
  ["nenhum proxy confiável", "10.0.0.2", "198.51.100.7", new Set()],
];
// for...of percorre a lista ; os colchetes à esquerda extraem os 4 valores de cada caso
for (const [nome, par, cabecalho, lista] of casos) {
  console.log(`${nome} -> ${enderecoCliente(par, cabecalho, lista)}`);
}
```

```text
par desconhecido, cabeçalho forjado -> 203.0.113.9
par confiável, um proxy -> 198.51.100.7
par confiável, início forjado -> 198.51.100.7
dois proxies confiáveis -> 198.51.100.7
par confiável, sem cabeçalho -> 10.0.0.2
nenhum proxy confiável -> 10.0.0.2
```

| Caso | Endereço retido | Motivo |
|---|---|---|
| Par desconhecido que envia um cabeçalho | O par | O cabeçalho vem de um desconhecido: ele é ignorado |
| Par confiável, um proxy | O cliente do cabeçalho | O proxy confiável escreveu esse endereço |
| Cliente que forja o início da cadeia | O cliente verdadeiro | A leitura da direita para a esquerda para no primeiro endereço não confiável, acrescentado pelo proxy |
| Par confiável sem cabeçalho | O par | Nada para ler |
| Nenhum proxy declarado confiável | O par | Ajuste prudente: vê-se sempre o proxy |

Segundo ensaio, com a função completa. Substitui-se o conteúdo de `adresse.mjs` pela função `enderecoCliente` acima, depois para-se a aplicação (`Ctrl+C` no terminal 1) e a reinicia-se com `FIABLES=127.0.0.1` (o endereço do proxy de teste). Esse reinício também zera todos os baldes. O proxy, por sua vez, continua rodando:

```bash
# terminal 1 : reinicia a aplicação ; FIABLES lista os proxies cujo cabeçalho aceitamos
FIABLES=127.0.0.1 PORT=18431 node app.mjs
# terminal 3 : mesmas requisições do primeiro ensaio
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```

```text
cliente 127.0.0.2: 3 requisições
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
cliente 127.0.0.3: 1 requisição
HTTP/1.1 200 OK   ok para ip:127.0.0.3
```

Cada cliente tem agora o seu balde. Por fim, o cliente `127.0.0.2` envia pelo proxy cinco requisições com um `X-Forwarded-For` **diferente** a cada vez (`1.1.1.1`, `1.1.1.2`...) para tentar obter cinco baldes novos. Mas o balde de `127.0.0.2` acaba de ser esvaziado pelo ensaio anterior, e ele se enche à razão de 1 ficha por segundo. Disparadas logo em seguida, as cinco seriam todas recusadas (`429`), sem provar nada sobre a falsificação. É preciso então esperar 3 segundos, o tempo de as 3 fichas voltarem (`sleep 3` pausa o terminal por 3 segundos):

```bash
# espera 3 segundos para que o balde se encha
sleep 3
# cinco requisições com um X-Forwarded-For diferente: 1.1.1.1, 1.1.1.2, ...
./client.sh 127.0.0.2 5 1.1.1
```

```text
cliente 127.0.0.2: 5 requisições
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   muitas requisições para ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   muitas requisições para ip:127.0.0.2
```

A aplicação vê `1.1.1.i, 127.0.0.2`, retém `127.0.0.2` e responde `200`, `200`, `200`, `429`, `429`. A falsificação falha.

### O equivalente no nginx: o módulo realip

Quando o próprio nginx está atrás de outro proxy, cabe a ele encontrar o endereço do cliente antes de aplicar `limit_req` (senão a zona `por_ip` conta o endereço do proxy da frente). O módulo *realip* ([documentação](https://nginx.org/en/docs/http/ngx_http_realip_module.html)) aplica a mesma regra que `enderecoCliente`:

```nginx
# no bloco « server », antes dos « location » :
# os pares desta rede privada (10.x.x.x, endereços inventados) são proxies confiáveis
set_real_ip_from 10.0.0.0/8;
# lê o endereço do cliente neste cabeçalho em vez da conexão
real_ip_header X-Forwarded-For;
# pula os endereços de confiança partindo da direita
real_ip_recursive on;
```

(A notação `10.0.0.0/8` é a [notação CIDR](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#a-notacao-cidr-uma-forma-abreviada-de-escrever-a-mascara).) Com esta configuração (adaptada à rede de teste: `127.0.0.1/32`), atrás do pequeno proxy, um cliente em `127.0.0.2` que envia `X-Forwarded-For: 1.1.1.i` foi contado sob `127.0.0.2`: `200`, `200`, `200`, `200`, `429`, `429` (rajada de 3, ou seja 4 requisições de imediato).

Segundo ensaio: uma conexão direta a partir de `127.0.0.2` (par não confiável) com um cabeçalho forjado era contada sob `127.0.0.2` também. A zona ainda estava esgotada pelo ensaio anterior, daí seis `429` seguidos: o cabeçalho forjado não deu um balde novo.

> **Armadilha:** depois de `real_ip_header`, a variável `$remote_addr` contém o endereço do **cliente** e não mais o da conexão. Com `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, o nginx acrescenta então o endereço do cliente uma segunda vez: a aplicação recebeu `1.1.1.1, 127.0.0.2, 127.0.0.2` em vez de `1.1.1.1, 127.0.0.2`. O endereço da conexão continua disponível em `$realip_remote_addr`.
>
> **Boa prática:** deixar a aplicação ler a cadeia da direita para a esquerda com a lista dos seus proxies confiáveis, e não deduzir o número de proxies do número de endereços da cadeia.

| Versão do endereço | Onde lê-la | Confiável? |
|---|---|---|
| Par da conexão | `req.socket.remoteAddress` em Node.js, `$remote_addr` no nginx sem `realip` | Sim: é a conexão real |
| Início de `X-Forwarded-For` | Primeiro endereço da lista | Não: escrito pelo cliente |
| Fim de `X-Forwarded-For` | Último endereço da lista | Sim se o par for um proxy confiável, porque ele o acrescentou |
| Endereço retido por `enderecoCliente` ou `realip` | Resultado da regra acima | Sim, desde que a lista de proxies confiáveis esteja exata |

Para que essa regra baste, a aplicação só deve aceitar conexões vindas do proxy: um [firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) que bloqueie o acesso direto completa o dispositivo. Exemplo com ufw, se o proxy estiver em `10.0.0.2` e a aplicação na porta 3000:

```bash
# autoriza somente o proxy (10.0.0.2) a acessar a porta 3000 desta máquina
sudo ufw allow from 10.0.0.2 to any port 3000 proto tcp
# recusa os outros acessos a essa porta (a regra de autorização, criada antes, vem primeiro)
sudo ufw deny 3000/tcp
```

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Ler o endereço da conexão atrás de um proxy | Todos os clientes trazem o endereço do proxy e dividem um balde | Ler `X-Forwarded-For` somente se o par for um proxy confiável |
| Confiar em `X-Forwarded-For` sem condição | Qualquer cliente escreve o endereço que quiser e contorna o limite | Ignorar o cabeçalho se o par não for confiável; ler a cadeia da direita para a esquerda |
| Pegar o primeiro endereço da cadeia | É aquele que um cliente pode forjar | Parar no primeiro endereço não confiável, partindo da direita |
| Deixar a aplicação acessível diretamente | Um atacante contorna o proxy, os limites e o WAF | Firewall: aceitar apenas conexões do proxy |
| Um único proxy, sem redundância | A queda dele para o site inteiro | Pelo menos dois proxies idênticos |
| Guardar em cache uma página personalizada | Um visitante recebe a página de outro | `proxy_cache` apenas em caminhos públicos |
| `proxy_set_header` dentro de um `location` | Os cabeçalhos do bloco `server` não são mais herdados | Colocar todos os cabeçalhos no mesmo nível, ou incluí-los |
| Esquecer os WebSockets e os tempos limite | Sem `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;` e `proxy_set_header Connection "upgrade";`, uma conexão [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) falha; após `proxy_read_timeout` (60 s por padrão), o nginx corta uma resposta lenta demais | Acrescentar essas três diretivas para os caminhos WebSocket e ajustar o prazo |
| Esquecer `Host` | A aplicação recebe o nome do grupo `upstream` | `proxy_set_header Host $host;` |
| Limitar apenas por chave de API | As requisições sem chave escapam da zona | Manter um limite por endereço além dele |
| Um balde por chave recebida, sem validação | Um atacante inventa uma chave nova a cada requisição | Criar um balde próprio apenas para as chaves conhecidas |
| Baldes nunca apagados | A memória cresce com o número de endereços vistos | Purgar os baldes inativos, limitar o número deles |
| Contador em cada instância | Com *n* instâncias, um cliente obtém *n* vezes o limite | Contador compartilhado (Redis) ou limite no proxy |
| Relógio do sistema para medir o tempo | Uma mudança de hora pode fazer o tempo voltar atrás | Um relógio monotônico (`performance.now()`) |
| `Retry-After` não inteiro | O cabeçalho é escrito em segundos inteiros | Arredondar para cima (`Math.ceil`) |
| Janela fixa para um limite por segundo | O dobro do limite passa perto da fronteira | Balde de fichas para os limites curtos |
| Contar também as requisições recusadas | Um cliente educado que insiste nunca mais se recupera | Uma recusa não consome nenhuma ficha |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Terminar TLS no proxy e recriptografar até as aplicações se a rede interna não for segura | Um único lugar cuida dos certificados; o tráfego interno continua protegido quando preciso |
| Transmitir `Host`, `X-Forwarded-For` e `X-Forwarded-Proto` | A aplicação conhece o domínio, o cliente e o protocolo de origem |
| Declarar explicitamente a lista dos proxies confiáveis | A confiança é uma escolha escrita, não um padrão |
| Limitar por endereço no proxy, depois por chave ou por conta na aplicação | Cada camada vê o que conhece |
| Ajustar a capacidade do balde à rajada legítima e a taxa à média | Um usuário normal nunca atinge o limite |
| Responder 429 com `Retry-After` em vez de cortar a conexão | Os clientes bem escritos sabem quando voltar |
| Testar o comportamento com relógios simulados e endereços forjados | Os casos-limite se verificam sem esperar nem atacar |
| Monitorar o número de recusas | Um pico de recusas sinaliza um bug do cliente ou um ataque |
| Rodar `nginx -t` antes de cada recarregamento | Um erro de sintaxe não derruba o site |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **proxy reverso** é um intermediário colocado na frente dos servidores de aplicação: ele termina o TLS, distribui a carga, mantém um cache, esconde os servidores e comprime. Um **proxy direto** protege, ao contrário, os clientes. A **limitação de taxa** limita as requisições por cliente; o **balde de fichas** aceita uma rajada igual à sua capacidade e depois segue o ritmo da taxa, enquanto a janela fixa deixa passar o dobro do limite perto da fronteira (10 requisições aceitas contra 5 no ensaio). Uma resposta **429** com `Retry-After` diz quando tentar de novo. Atrás de um proxy, a aplicação vê o endereço do proxy: o endereço do cliente se lê em `X-Forwarded-For`, somente se o par for um proxy conhecido, da direita para a esquerda. |
| **Armadilhas a evitar** | Ler o endereço da conexão atrás de um proxy; acreditar em `X-Forwarded-For` quando o par é desconhecido, ou pegar o primeiro endereço dele; deixar a aplicação acessível sem passar pelo proxy; guardar em cache uma página personalizada; limitar apenas por chave de API; criar um balde para qualquer chave inventada; manter os baldes sem purgá-los; contar em cada instância separadamente; perder os `proxy_set_header` dentro de um `location`. |
| **Boas práticas** | Transmitir `Host`, `X-Forwarded-For` e `X-Forwarded-Proto`; declarar a lista dos proxies confiáveis; limitar por endereço no proxy e por chave na aplicação; balde de fichas para os limites curtos; 429 com `Retry-After`; contadores compartilhados quando há várias instâncias; `nginx -t` antes de qualquer recarregamento. |
