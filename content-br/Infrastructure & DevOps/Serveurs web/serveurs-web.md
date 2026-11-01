---
order: 9
---

# Servidores web (31/10/2026)

Quando você digita um endereço em um navegador, uma página aparece: em algum lugar, um programa recebeu o seu pedido e devolveu o conteúdo. Esse programa é um **servidor web**. Este capítulo explica o que ele faz, como se configura, como atende vários visitantes ao mesmo tempo e como ler o que ele registra em seus logs. Ele supõe que você saiba abrir um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam comandos no teclado).

A palavra "servidor" tem dois sentidos que convém distinguir desde já:

| Sentido | O que é | Exemplo |
|---|---|---|
| A máquina | Um computador ligado o tempo todo, conectado à Internet, que presta serviços | Um computador em um data center |
| O programa | Um software que espera pedidos e responde a eles | nginx, Apache, Caddy (apresentados mais adiante) |

Neste capítulo, "servidor web" designa o **programa**. Uma mesma máquina pode executar um, vários ou nenhum. O **navegador** (o software que exibe as páginas: [Firefox](https://www.mozilla.org/pt-BR/firefox/), [Chrome](https://www.google.com/intl/pt-BR/chrome/)...) desempenha o outro papel, o de **cliente**: ele pede, o servidor responde. As regras desse diálogo se chamam **HTTP** (*HyperText Transfer Protocol*); seus métodos (`GET`, `POST`...) e seus códigos de status (`200`, `404`...) são explicados em [as trocas de dados: API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) e não são repetidos aqui.

## Um programa que escuta uma porta

Uma máquina conectada a uma rede possui um **endereço IP** (um número que a identifica; veja [o endereçamento de rede](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)). Mas vários programas podem rodar na mesma máquina: como saber a quem se destina uma mensagem? Graças à **porta**, um número entre 0 e 65535 que designa um programa específico na máquina.

> **Analogia:** o endereço IP é o endereço de um prédio, a porta é o número do apartamento. A correspondência chega ao prédio e depois vai para a porta certa.

Um servidor web **escuta** uma porta: ele a reserva junto ao sistema e depois espera que um cliente se conecte a ela. É o mecanismo do [socket servidor](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) (o ponto de comunicação de rede de um programa), descrito em capítulo próprio.

```text
 CLIENTE (navegador, curl...)               MÁQUINA SERVIDORA (IP 203.0.113.10)

                                            porta 25   : outro programa
 1. abre uma conexão com a porta 80         porta 80   : [ servidor web ]  <- escuta
    ---------------------------------------->      |
 2. envia a requisição                             | 3. procura o recurso
    "GET /contact.html"                            |    (um arquivo ou um cálculo)
    ---------------------------------------->      |
                                                   | 4. monta a resposta
 5. recebe a resposta                              |    status + cabeçalhos + corpo
    <----------------------------------------      v
 6. exibe (página, imagem, dados...)
```

O endereço `203.0.113.10` é um endereço reservado à documentação: ele não existe na Internet real.

Os números de porta não são livres. Alguns são uma convenção mundial:

| Porta | Uso | Observação |
|---|---|---|
| `80` | HTTP, sem criptografia | Porta padrão: o navegador a subentende para um endereço `http://` |
| `443` | HTTPS, com criptografia (explicado na seção HTTPS mais abaixo) | Porta padrão para um endereço `https://` |
| `8080`, `8000`, `3000`... | [Servidores de desenvolvimento](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) | Simples costume, nenhuma regra |

Quando o endereço não contém porta, o navegador escolhe `80` ou `443` conforme o início do endereço. `http://exemplo.test:8080/` força a porta `8080`.

## Ver o ciclo requisição/resposta na prática

Nada substitui um servidor minúsculo que se pode ler por inteiro. O arquivo `serveur.js` abaixo põe um servidor web para rodar em cerca de quarenta linhas. Ele é escrito em [JavaScript](/?c=langages&s=javascript&p=javascript) e executado pelo **Node.js** (um programa que executa JavaScript fora do navegador). Para instalá-lo, siga as instruções do [site oficial](https://nodejs.org) e depois verifique no terminal com `node --version`: um número de versão deve aparecer. Em seguida, copie o código abaixo para um arquivo chamado `serveur.js`, criado com um [editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide). O módulo `http` usado é descrito na [documentação do Node.js](https://nodejs.org/api/http.html). Não é preciso dominar a linguagem (veja [as funções em JavaScript](/?c=langages&s=javascript&p=fonctions) para a notação `=>`): cada linha é comentada, e o que importa é o percurso.

```javascript
// http é o módulo do Node.js que sabe falar o protocolo HTTP
// require("...") carrega um módulo ; const nomeia o resultado (um valor que não muda)
const http = require("node:http");

// Uma tabela: a cada valor do cabeçalho Host corresponde o texto do site
// (\n é uma quebra de linha no texto)
const sites = {
  "a.exemplo.test": "Bem-vindo ao site A\n",
  "b.exemplo.test": "Bem-vindo ao site B\n",
};

// createServer recebe uma função chamada a CADA requisição recebida
// ((requisicao, resposta) => { ... } é uma função seta: parâmetros, seta, corpo)
const servidor = http.createServer((requisicao, resposta) => {
  // requisicao.method: o método (GET...); requisicao.url: o caminho pedido
  console.log(requisicao.method, requisicao.url, requisicao.headers.host);

  // /lento: espera um segundo antes de responder (usado mais abaixo)
  // setTimeout(função, 1000) executa a função após 1000 milissegundos (1 segundo)
  // resposta.end(texto) envia o texto e depois encerra a resposta
  if (requisicao.url === "/lento") {
    setTimeout(() => resposta.end("pronto\n"), 1000);
    return;
  }

  // /hora: uma resposta calculada a cada requisição (conteúdo dinâmico)
  // toISOString dá a data no formato 2026-10-31T20:10:43.333Z: T separa a data
  // da hora, Z significa « hora UTC » (o tempo universal, sem deslocamento)
  if (requisicao.url === "/hora") {
    resposta.end(new Date().toISOString() + "\n");
    return;
  }

  // Procura-se o site pedido graças ao cabeçalho Host, sem o número da porta
  // « a || b » vale a se existir, senão b; split(":")[0] mantém o que vem antes do « : »
  const nome = (requisicao.headers.host || "").split(":")[0];
  const texto = sites[nome];

  // Nenhum site com esse nome: status 404 ("não encontrado") e uma mensagem curta
  if (texto === undefined) {
    resposta.statusCode = 404;
    resposta.setHeader("Content-Type", "text/plain; charset=utf-8");
    resposta.end("Nenhum site com este nome\n");
    return;
  }

  // Senão: status 200 ("sucesso"), um cabeçalho que descreve o conteúdo, depois o corpo
  resposta.statusCode = 200;
  resposta.setHeader("Content-Type", "text/plain; charset=utf-8");
  resposta.end(texto);
});

// listen: o programa reserva a porta 8081 e espera as conexões
servidor.listen(8081, "127.0.0.1", () => console.log("escutando na porta 8081"));
```

O endereço `127.0.0.1` é o endereço da **própria máquina**: o servidor só pode ser alcançado a partir do seu computador. Execute-o em um primeiro terminal com `node serveur.js` (`Ctrl+C` nesse terminal o interrompe), depois consulte-o em um segundo terminal com **curl**, uma ferramenta de linha de comando que envia uma requisição HTTP e exibe a resposta (veja [a documentação dela](https://curl.se/docs/)). A opção `-i` também exibe os cabeçalhos da resposta. A opção `-H` acrescenta um cabeçalho à requisição, aqui `Host` (o papel dele é explicado na seção sobre sites virtuais).

```bash
# -i: exibe a linha de status e os cabeçalhos da resposta antes do corpo
# -H: envia o cabeçalho "Host: a.exemplo.test" na requisição
curl -i http://127.0.0.1:8081/ -H 'Host: a.exemplo.test'
```

Saída obtida:

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:19:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 20

Bem-vindo ao site A
```

A opção `-v` (*verbose*, "falante") mostra além disso a requisição enviada, precedida do sinal `>`; a resposta é precedida de `<`. Eis essas linhas para o mesmo pedido:

```text
> GET / HTTP/1.1
> Host: a.exemplo.test
> User-Agent: curl/8.5.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Date: Sat, 31 Oct 2026 20:19:13 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 20
<
```

| Linha | Nome | Papel |
|---|---|---|
| `GET / HTTP/1.1` | Linha de requisição | O método, o caminho pedido, a versão do protocolo |
| `Host: ...` | Cabeçalho de requisição | O nome do site visado (veja a seção sobre sites virtuais) |
| `User-Agent: ...` | Cabeçalho de requisição | O software que envia a requisição (aqui curl, em geral um navegador) |
| `Accept: */*` | Cabeçalho de requisição | Os tipos de conteúdo aceitos (`*/*`: todos) |
| linha vazia | Separador | Marca o fim dos cabeçalhos; o corpo vem depois |
| `HTTP/1.1 200 OK` | Linha de status | A versão, o código de status, o texto dele |
| `Content-Type` | Cabeçalho de resposta | A natureza do conteúdo (texto, imagem, página [HTML](/?c=langages&s=html&p=html)...) e a codificação (a maneira como as letras são codificadas em bytes, o **byte** sendo a unidade de tamanho de um dado) |
| `Content-Length: 20` | Cabeçalho de resposta | O tamanho do corpo em bytes (cerca de um caractere simples por byte: aqui 20, quebra de linha incluída) |
| `Connection: keep-alive` | Cabeçalho de resposta | A conexão continua aberta para a requisição seguinte |
| `Keep-Alive: timeout=5` | Cabeçalho de resposta | Ela será fechada após 5 segundos sem nova requisição |

Um **cabeçalho** (*header*) é uma linha `Nome: valor` que dá uma informação sobre a troca. O **corpo** (*body*) é o próprio conteúdo, depois da linha vazia. Último caso, um site desconhecido: o servidor responde `404`.

```bash
# O nome "inconnu.test" não consta da tabela: esperado, um status 404
curl -i http://127.0.0.1:8081/ -H 'Host: inconnu.test'
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:19:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 26

Nenhum site com este nome
```

Durante esses testes, o terminal do servidor exibiu o que faz a linha `console.log` do código, um **log** mínimo de cada requisição recebida. Eis um extrato: as quatro primeiras chamadas (site A, site desconhecido, site B, chamada com `-v`) e depois as três chamadas a `/lento` vistas mais abaixo. As chamadas a `/hora` e com `--resolve` acrescentam suas próprias linhas:

```text
escutando na porta 8081
GET / a.exemplo.test
GET / inconnu.test
GET / b.exemplo.test
GET / a.exemplo.test
GET /lento 127.0.0.1:8081
GET /lento 127.0.0.1:8081
GET /lento 127.0.0.1:8081
```

Quando o servidor não está rodando, ninguém escuta a porta: a conexão é recusada antes mesmo de existir uma requisição.

```text
curl: (7) Failed to connect to 127.0.0.1 port 8081 after 0 ms: Couldn't connect to server
```

Essa mensagem ("Failed to connect", ou seja, não foi possível conectar) **não** é, portanto, uma resposta HTTP: não há código de status. A diferença com um erro `404` ou `500` é a que descreve [o capítulo sobre HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) entre "nenhuma resposta" e "resposta de erro".

## Conteúdo estático e conteúdo dinâmico

Um servidor web pode responder de duas maneiras muito diferentes:

| | Conteúdo estático | Conteúdo dinâmico |
|---|---|---|
| O que é | Um arquivo tal como está armazenado (página [HTML](/?c=langages&s=html&p=html), imagem, folha de estilo, script) | Uma resposta calculada no momento da requisição por um programa |
| Quem produz a resposta | O servidor web sozinho: ele lê o arquivo e o envia | Um programa de aplicação ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), Node.js...) que o servidor chama |
| Duas visitas seguidas | Mesmo resultado, enquanto o arquivo não mudar | Resultado que pode variar (hora, usuário conectado, conteúdo do [banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) |
| Velocidade | Muito rápida | Depende do cálculo |
| Exemplo neste capítulo | `contact.html` servido pelo Apache | A rota `/hora` do servidor Node |

A rota `/hora` de `serveur.js` calcula a sua resposta a cada chamada. Duas chamadas com dois segundos de intervalo:

```bash
# -s: modo silencioso (o curl não exibe a barra de progresso, apenas a resposta)
curl -s http://127.0.0.1:8081/hora
# Mesma chamada, dois segundos depois
curl -s http://127.0.0.1:8081/hora
```

```text
2026-10-31T20:19:14.142Z
2026-10-31T20:19:16.151Z
```

Alguns servidores web, como o nginx, não executam eles mesmos código PHP. Eles **transmitem** a requisição a um programa dedicado e devolvem ao cliente o que este produziu. Para o PHP, esse programa é o PHP-FPM, apresentado no capítulo [Responder ao cliente e continuar trabalhando (PHP-FPM)](/?c=langages&s=php&p=php-fpm):

```text
Requisição GET /index.php?id=3
        |
        v
 Servidor web ---- arquivo .html, .css, .png ? ---> lido no disco e enviado
        |
        +-------- arquivo .php ? ----------------> transmitido ao PHP-FPM
                                                    (que executa o script)
                                                           |
        resposta enviada ao cliente  <-----------------------+
```

É também o que faz uma [renderização do lado do servidor](/?c=langages&s=javascript&p=ssr-vs-csr): a página é montada antes do envio, em vez de ser montada no navegador.

## Três servidores web comuns: nginx, Apache, Caddy

Três servidores web livres (código público e uso gratuito) estão muito difundidos, ou em progressão no caso do Caddy. Eles fazem o mesmo trabalho (escutar uma porta, responder em HTTP), mas diferem por sua história e pela maneira como são configurados:

| | nginx | Apache HTTP Server | Caddy |
|---|---|---|---|
| O que é | Servidor web conhecido por gerenciar muitas conexões com pouca memória | O mais antigo dos três, muito modular (acrescenta-se a ele funções por módulos) | Servidor web recente que ativa o HTTPS sozinho |
| Configuração | Arquivo único em blocos `{ }` | Arquivos em blocos `<...>`; ajustes locais possíveis por pasta (`.htaccess`) | Um arquivo curto, o `Caddyfile` |
| Documentação | [nginx.org](https://nginx.org/en/docs/) | [httpd.apache.org](https://httpd.apache.org/docs/current/) | [caddyserver.com](https://caddyserver.com/docs/) |

Um **módulo** é um pedaço de funcionalidade que se ativa ou não (criptografia, compressão, redirecionamentos). Um arquivo **`.htaccess`** é, no Apache, um pequeno arquivo de ajustes colocado em uma pasta do site: prático, mas o Apache precisa relê-lo a cada requisição, o que deixa mais lento.

A escolha depende do contexto: nenhum é "o certo". Em uma máquina fornecida por um hospedeiro, o servidor costuma já estar escolhido.

## Um arquivo de configuração mínimo (nginx)

Um servidor web não adivinha nada: tudo o que ele faz (quais sites, quais pastas, quais portas) está descrito em um **arquivo de configuração**, um arquivo de texto que o servidor lê ao iniciar. Cada linha dele é uma **diretiva** (um ajuste: um nome seguido do seu valor, terminado por `;` no nginx). As diretivas são organizadas em **blocos** delimitados por `{ }`, que se encaixam como bonecas russas.

Eis uma configuração completa e mínima para o nginx. Ela serve uma pasta de arquivos estáticos na porta 80. Em geral ela fica em `/etc/nginx/nginx.conf` (local que varia conforme a instalação).

```nginx
# Número de processos trabalhadores (veja mais abaixo); "auto": um por núcleo do processador
# (um núcleo é uma unidade de cálculo do chip)
worker_processes auto;
# Arquivo onde o nginx grava seus erros, com o nível mínimo "warn" (aviso)
error_log /var/log/nginx/error.log warn;

# Bloco "events": ajustes do tratamento das conexões
events {
    # Número máximo de conexões que cada trabalhador atende ao mesmo tempo
    worker_connections 1024;
}

# Bloco "http": tudo o que diz respeito ao protocolo HTTP
http {
    # Carrega a tabela que associa uma extensão (.html, .png) a um tipo de conteúdo
    include /etc/nginx/mime.types;
    # Tipo de conteúdo usado quando a extensão é desconhecida
    default_type application/octet-stream;
    # Arquivo onde o nginx registra cada requisição recebida
    access_log /var/log/nginx/access.log;

    # Bloco "server": um site web (um "site virtual", veja mais abaixo)
    server {
        # Escuta a porta 80
        listen 80;
        # Este bloco responde às requisições cujo cabeçalho Host é um destes dois nomes
        server_name exemplo.test www.exemplo.test;
        # A pasta que contém os arquivos do site
        root /var/www/exemplo;
        # Arquivo devolvido quando o endereço pedido é uma pasta ("/")
        index index.html;

        # Bloco "location": regra para os caminhos que começam por "/" (todos)
        location / {
            # Procura o arquivo ($uri), depois uma pasta de mesmo nome, senão status 404
            try_files $uri $uri/ =404;
        }
    }
}
```

`$uri` é uma **variável** do nginx: ela contém o caminho pedido pelo cliente (por exemplo `/contact.html`). Depois que o arquivo é gravado, dois comandos bastam para verificá-lo e aplicá-lo sem derrubar os visitantes em curso (`sudo` é o comando que executa o seguinte com privilégios de administrador, necessários aqui):

```bash
# -t: "test", verifica a sintaxe do arquivo de configuração sem iniciar nada
sudo nginx -t
# -s reload: pede ao nginx que releia a configuração sem parar
sudo nginx -s reload
```

Para servir PHP, acrescenta-se, dentro do bloco `server`, um bloco `location` (com `index index.php;` se o endereço pedido puder ser uma pasta) que transmite as requisições dos arquivos `.php` ao PHP-FPM, como no esquema da seção anterior:

```nginx
# Os caminhos que terminam em .php (o "~" introduz uma expressão regular)
location ~ \.php$ {
    # Retoma as variáveis habituais do protocolo FastCGI (o protocolo de diálogo
    # entre o servidor web e o PHP-FPM)
    include fastcgi_params;
    # Indica ao PHP-FPM qual script executar
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    # Transmite a requisição ao PHP-FPM, alcançável por este socket (caminho variável)
    fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

Uma **expressão regular** é um padrão de busca em um texto (veja [o capítulo dedicado](/?c=langages&s=javascript&p=regex)). O protocolo FastCGI e o socket do PHP-FPM são explicados no [capítulo PHP-FPM](/?c=langages&s=php&p=php-fpm).

### A mesma coisa com Apache e Caddy

Para comparar, eis o mesmo site no Apache. Esta configuração deriva da que foi **realmente executada** para este capítulo: apenas um dos dois sites aparece, os caminhos estão abreviados e a linha `LogFormat` é mostrada mais abaixo, na seção sobre os logs. Um arquivo de instalação comum é, ele, dividido em vários trechos:

```apache
# A pasta de trabalho do servidor (caminhos relativos, arquivos temporários)
ServerRoot "/caminho/para/apache"
# Escuta a porta 8082 da máquina local
Listen 127.0.0.1:8082
# Carrega o módulo que gerencia as conexões (veja a seção sobre os trabalhadores)
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so
# Módulo que decide quem tem direito de acessar o quê
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
# Módulo que serve index.html quando o endereço pedido é uma pasta
LoadModule dir_module /usr/lib/apache2/modules/mod_dir.so
# Módulo que associa uma extensão a um tipo de conteúdo
LoadModule mime_module /usr/lib/apache2/modules/mod_mime.so
# A tabela dos tipos de conteúdo
TypesConfig /etc/mime.types
# O arquivo dos erros
ErrorLog "/caminho/para/apache/logs/error.log"
# O nome do próprio servidor (evita um aviso na inicialização)
ServerName localhost

# Um site: o bloco é aberto para o endereço e a porta indicados
<VirtualHost 127.0.0.1:8082>
    # Responde às requisições cujo cabeçalho Host é a.exemplo.test
    ServerName a.exemplo.test
    # A pasta que contém os arquivos do site
    DocumentRoot "/caminho/para/apache/site-a"
    # O arquivo onde cada requisição é registrada, no formato "combined" (veja mais abaixo)
    CustomLog "/caminho/para/apache/logs/access-a.log" combined
    # Regras que se aplicam a esta pasta
    <Directory "/caminho/para/apache/site-a">
        # Autoriza todos a ler esta pasta
        Require all granted
    </Directory>
</VirtualHost>
```

O formato `combined` é definido no arquivo de teste por uma linha `LogFormat`. Como no nginx, testa-se antes de aplicar:

```bash
# -t: verifica a sintaxe do arquivo indicado por -f, sem iniciar o servidor
apache2 -t -f /caminho/para/apache/httpd.conf
```

```text
Syntax OK
```

No Caddy, o mesmo site cabe em duas diretivas (**não verificado**: o Caddy não está instalado na máquina de redação). O arquivo se chama `Caddyfile`:

```text
# O site: ":8080" significa "a porta 8080, sob qualquer nome"
:8080 {
    # A pasta que contém os arquivos do site ("*": para todos os caminhos)
    root * /var/www/exemplo
    # Ativa o envio dos arquivos estáticos desta pasta
    file_server
}
```

| Necessidade | nginx | Apache | Caddy |
|---|---|---|---|
| Escutar uma porta | `listen 80;` | `Listen 80` | `:80 { ... }` |
| Nome do site | `server_name` | `ServerName` | O nome no início do bloco |
| Pasta do site | `root` | `DocumentRoot` | `root *` |
| Testar a configuração | `nginx -t` | `apache2 -t` (`httpd -t` em outras distribuições) | `caddy validate` |

## Vários sites em uma mesma máquina: os sites virtuais

Um hospedeiro pode fazer rodar centenas de sites em uma única máquina, com **um único endereço IP** e **uma única porta 80**. Como o servidor sabe qual exibir? Graças ao cabeçalho **`Host`**, que o cliente envia em cada requisição com o nome do site digitado no endereço: `GET / HTTP/1.1` seguido de `Host: a.exemplo.test`. É o princípio dos **sites virtuais** (*virtual hosts* no Apache, blocos `server` no nginx): um mesmo programa se comporta como vários sites diferentes conforme o nome pedido. A documentação de referência do cabeçalho está no [MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Headers/Host).

```text
                       +---- Host: a.exemplo.test ----> site A (pasta site-a)
Requisições ---> porta 80  |
 (um único IP)         +---- Host: b.exemplo.test ----> site B (pasta site-b)
                       |
                       +---- Host: outro-nome.test ----> site padrão
```

O servidor Node da seção anterior faz exatamente isso com a sua tabela `sites`. Mesmo endereço, mesma porta, duas respostas diferentes conforme `Host`:

```bash
# Mesmo endereço e mesma porta, mas um cabeçalho Host diferente a cada chamada
curl -s -H 'Host: a.exemplo.test' http://127.0.0.1:8081/
curl -s -H 'Host: b.exemplo.test' http://127.0.0.1:8081/
```

```text
Bem-vindo ao site A
Bem-vindo ao site B
```

Com o nginx, dois sites se escrevem com dois blocos `server` dentro do bloco `http` (**não verificado**, a sintaxe é a do arquivo da seção anterior):

```nginx
server {
    # Primeiro site: responde pelo nome a.exemplo.test
    listen 80;
    server_name a.exemplo.test;
    root /var/www/site-a;
}

server {
    # Segundo site: responde pelo nome b.exemplo.test
    listen 80;
    server_name b.exemplo.test;
    root /var/www/site-b;
}
```

E quando o nome pedido não corresponde a nenhum site? Cada servidor tem uma regra de contingência. Com o teste do Apache realizado para este capítulo (dois sites virtuais `a.exemplo.test` e `b.exemplo.test`), uma requisição com `Host: inconnu.test` recebeu um status `200`: é o **primeiro** site declarado no arquivo que responde, o site padrão. O mesmo comportamento existe no nginx (o primeiro bloco `server`, a menos que outro seja designado por `listen 80 default_server;`).

> **Armadilha:** o site padrão é servido a quem conhece apenas o endereço IP, ou a um robô que testa todos os endereços. Se for um site real, ele fica exposto sob um nome que ninguém escolheu.
>
> **Boa prática:** declarar em primeiro lugar um site "lixeira" que responde um erro ou uma página vazia. Com o nginx: `server { listen 80 default_server; return 444; }` (o status `444` é próprio do nginx: ele fecha a conexão sem responder nada).

Para testar um site virtual sem comprar um nome de domínio, há duas soluções locais: o [arquivo hosts](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) do sistema, que associa um nome a um endereço IP, ou a opção `--resolve` do curl:

```bash
# Diz ao curl: o nome a.exemplo.test:8081 fica no endereço 127.0.0.1
curl -s --resolve a.exemplo.test:8081:127.0.0.1 http://a.exemplo.test:8081/
```

```text
Bem-vindo ao site A
```

Um **nome de domínio** é o nome legível de um site (`exemplo.test`). O sufixo `.test` é reservado aos testes, como o endereço `203.0.113.10` visto acima: ele não existe na Internet real. Resolver um nome em endereço é o papel do [**DNS**](https://developer.mozilla.org/fr/docs/Glossary/DNS) (*Domain Name System*): o catálogo da Internet que traduz `exemplo.test` em endereço IP. O arquivo hosts e `--resolve` contornam esse catálogo para os seus testes.

## As portas 80 e 443, e HTTPS

**HTTPS** é HTTP envolvido em uma camada de criptografia, o **TLS** (*Transport Layer Security*): o conteúdo das trocas se torna ilegível para quem interceptar o tráfego no caminho, e o cliente pode verificar que fala com o servidor certo. O HTTPS escuta tradicionalmente a porta `443`. Quanto à criptografia em si (chaves, certificados), veja [a criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee): o mesmo capítulo mostra também como fabricar um certificado autoassinado, com o comando `openssl`. Um certificado **autoassinado** é um certificado que você mesmo assina e que ninguém mais reconhece.

Um servidor HTTPS precisa de dois arquivos:

| Arquivo | Conteúdo | Deve ser protegido? |
|---|---|---|
| O certificado | A chave pública do servidor, o seu nome, e a assinatura de uma autoridade de certificação que atesta a ligação entre os dois | Não, ele é enviado a cada visitante |
| A chave privada | A chave secreta que prova que o servidor é o verdadeiro dono do certificado | **Sim, estritamente**: quem a possuir pode se passar pelo site |

O teste foi feito com o Apache, um certificado autoassinado para `a.exemplo.test` (obtido com o comando `openssl req -x509 ...` do capítulo citado acima, com a opção `-addext "subjectAltName=DNS:a.exemplo.test"` que precisa o nome coberto) e dois sites: um na porta `8082` que redireciona, outro em `8443` em HTTPS (as portas `80` e `443` exigem privilégios especiais, veja mais abaixo). Trecho da configuração:

```apache
# Porta "HTTP" do teste: responde com um redirecionamento para a versão criptografada
<VirtualHost 127.0.0.1:8082>
    ServerName a.exemplo.test
    # Redirect permanent: status 301 "movido definitivamente" para o novo endereço
    Redirect permanent / https://a.exemplo.test:8443/
</VirtualHost>

# Porta "HTTPS" do teste: serve o site
<VirtualHost 127.0.0.1:8443>
    ServerName a.exemplo.test
    DocumentRoot "/caminho/para/apache/site-a"
    # Ativa a criptografia TLS neste site
    SSLEngine on
    # O certificado, enviado a cada visitante
    SSLCertificateFile "/caminho/para/tls/certificado.pem"
    # A chave privada, que nunca sai do servidor
    SSLCertificateKeyFile "/caminho/para/tls/chave-privada.pem"
</VirtualHost>
```

Primeira requisição, em HTTP simples:

```bash
curl -s -i --resolve a.exemplo.test:8082:127.0.0.1 http://a.exemplo.test:8082/
```

```text
HTTP/1.1 301 Moved Permanently
Location: https://a.exemplo.test:8443/
```

(Extrato: a resposta contém outros cabeçalhos e um pequeno corpo HTML.) O servidor não serve a página: ele responde `301` com um cabeçalho `Location` que dá o novo endereço, e o navegador o segue. Segunda requisição, em HTTPS, com `-v` para ver a negociação TLS (**aperto de mãos**, *handshake*) e `--cacert` para dizer ao curl que confie no certificado autoassinado:

```bash
# --cacert: confia neste certificado específico, na falta de uma autoridade reconhecida
curl -sv --cacert certificado.pem --resolve a.exemplo.test:8443:127.0.0.1 \
    https://a.exemplo.test:8443/
```

Linhas relevantes da saída (extrato):

```text
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, Finished (20):
*  subject: CN=a.exemplo.test
*  subjectAltName: host "a.exemplo.test" matched cert's "a.exemplo.test"
*  SSL certificate verify ok.
< HTTP/1.1 200 OK
<h1>Site A</h1>
```

O cliente cumprimenta (*Client hello*), o servidor responde e apresenta o seu certificado, os dois entram em acordo sobre uma chave, e só então a requisição HTTP parte, já criptografada. Sem `--cacert`, a mesma chamada falha:

```text
curl: (60) SSL certificate problem: self-signed certificate
```

Este é o comportamento esperado: um certificado que ninguém reconhecido assinou não prova nada. Um navegador exibiria uma página de aviso.

| Pergunta | Resposta |
|---|---|
| Onde obter um certificado verdadeiro, gratuito? | Na **Let's Encrypt**, uma autoridade de certificação gratuita que emite certificados por um protocolo automático, [ACME](https://datatracker.ietf.org/doc/html/rfc8555) ([documentação](https://letsencrypt.org/docs/)) |
| Quem o renova? | Uma ferramenta (como o [Certbot](https://certbot.eff.org)) que fala esse protocolo e reinicia o servidor; os certificados têm curta duração, então a renovação automática é indispensável |
| E no Caddy? | O Caddy sabe pedir e renovar os certificados sozinho para um site com um nome de domínio verdadeiro (**não verificado** aqui, veja a [documentação dele](https://caddyserver.com/docs/automatic-https)) |
| O que fazer com a porta 80? | Mantê-la aberta somente para redirecionar para a 443 (e para a validação do certificado em alguns métodos) |

Redirecionamento da porta 80 para a 443 no nginx (**não verificado**):

```nginx
server {
    # A porta HTTP: não serve nenhuma página, apenas redireciona para o HTTPS
    listen 80;
    server_name exemplo.test;
    # Status 301 para o mesmo endereço em https ($host: nome recebido, $request_uri: caminho)
    return 301 https://$host$request_uri;
}
```

Um último ponto prático: no Linux, um programa comum não tem o direito de escutar uma porta abaixo de 1024. Esse limite é verificável na máquina de redação (`cat /proc/sys/net/ipv4/ip_unprivileged_port_start` exibe `1024`), e o servidor Node, executado como usuário comum depois de trocar 8081 por 80 em `listen`, reclama:

```text
Error: listen EACCES: permission denied 127.0.0.1:80
```

Por isso, segundo a documentação deles, os servidores web de produção iniciam com privilégios de administrador apenas o tempo de abrir as portas `80` e `443`, e depois confiam o trabalho a processos com privilégios reduzidos (**não verificado**: seriam necessários privilégios de administrador para reproduzir). O **firewall** da máquina também deve deixar essas portas passar: veja [o capítulo sobre UFW e firewalld](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld). No [Docker](/?c=infrastructure-devops&s=docker&p=docker), a porta é publicada com `-p 8080:80`, explicado em [o capítulo sobre volumes e redes](/?c=infrastructure-devops&s=docker&p=volumes-et-reseaux).

## Processos trabalhadores e conexões simultâneas

Um site popular recebe milhares de pedidos por segundo. O servidor não pode atender os visitantes um por um deixando todos os outros esperando. Duas ideias se combinam:

- **Vários trabalhadores** (*workers*): um **processo** é um programa em execução; um servidor web inicia vários que dividem o trabalho (veja [os processos](/?c=langages&s=c&p=processus) para o funcionamento deles). Um processo **mestre** (*master*) os inicia e os supervisiona; os trabalhadores atendem as requisições.
- **Várias conexões por trabalhador**: um trabalhador não bloqueia esperando um cliente lento. Ele monitora muitas conexões ao mesmo tempo e só cuida daquelas que têm algo a fazer. É o [laço de eventos](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) descrito no capítulo sobre sockets.

```text
               +--------------------------+
               |   processo mestre        |  inicia, supervisiona, recarrega a configuração
               +--------------------------+
                   |        |        |
              +--------+ +--------+ +--------+
              |trabal1 | |trabal2 | |trabal3 |   cada um: um laço de eventos
              +--------+ +--------+ +--------+
               /  |  \     /  |  \     /  |  \
          conexões     conexões     conexões    (centenas em cada um)
```

> **Analogia:** um garçom de restaurante que anota um pedido, o transmite à cozinha e depois vai para a mesa seguinte, em vez de ficar parado diante da cozinha esperando o prato.

O servidor Node deste capítulo é um exemplo minúsculo: ele roda em um único processo, mas a rota `/lento` espera um segundo antes de responder. Três clientes a pedem ao mesmo tempo:

```bash
# time: mede a duração do comando entre parênteses
# for i in 1 2 3; do ... done: repete o que está entre do e done para i = 1, 2, 3
# (veja o capítulo sobre os laços em Bash)
# O & lança cada requisição em paralelo; wait espera o fim delas
time (for i in 1 2 3; do curl -s http://127.0.0.1:8081/lento & done; wait)
```

```text
pronto
pronto
pronto

real    0m1,01s
```

O tempo total medido pelo `time` é de **1,01 segundo**, e não 3 segundos: o servidor não esperou o fim da primeira resposta para aceitar a segunda. As três requisições esperaram juntas.

No nginx, duas diretivas do arquivo de configuração determinam a capacidade:

| Diretiva | Papel | Valor no exemplo |
|---|---|---|
| `worker_processes` | Número de trabalhadores (na prática, um por núcleo do processador, isto é, por unidade de cálculo do chip) | `auto` |
| `worker_connections` | Número máximo de conexões por trabalhador | `1024` |

O teto teórico de conexões simultâneas é o produto deles: 4 núcleos × 1024 conexões = 4096 (**não verificado**, o nginx não está instalado; o teto real depende também do sistema, veja abaixo). Cada conexão aberta consome um [descritor de arquivo](/?c=langages&s=c&p=appels-systeme-et-descripteurs), e o sistema limita o número deles por processo (veja [os limites de recursos](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources) para os limites). Um valor de `worker_connections` acima desse limite, portanto, não serve para nada.

O Apache oferece, por sua vez, várias formas de trabalhar, chamadas **MPM** (*Multi-Processing Module*), isto é, um módulo que decide como os processos e as **threads** (linhas de execução paralelas dentro de um mesmo processo) dividem as conexões:

| MPM | Funcionamento (segundo a documentação do Apache) | Observação |
|---|---|---|
| `prefork` | Um processo por conexão, sem thread | Robusto, consome muita memória; imposto por alguns módulos antigos |
| `worker` | Vários processos, cada um com várias threads | Menos memória que `prefork` |
| `event` | Como `worker`, mas as conexões inativas são tratadas à parte para liberar as threads | Escolha comum hoje |

Na máquina de redação, o comando `apache2 -f httpd.conf -V` informa `Server MPM: event`, e o comando `ps -o pid,ppid,comm` (que lista os processos) mostra, durante o teste, um pai e vários filhos. O PID é o número de identificação de um processo, o PPID o número do seu processo pai:

```text
    PID    PPID COMMAND
  84277   84275 apache2
  84278   84277 apache2
  84279   84277 apache2
  84354   84277 apache2
```

Os processos 84278, 84279 e 84354 são os filhos do processo 84277. As descrições de `prefork` e `worker` acima são **não verificadas** aqui: apenas `event` estava disponível neste teste.

> **Armadilha:** configurar `worker_connections` muito alto sem olhar a memória disponível: cada conexão consome um pouco dela, e uma máquina saturada deixa todo o site lento. Para os ataques que visam justamente saturar um servidor, veja [a sobrecarga e a negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

## Os logs de acesso e de erro

Um servidor web grava continuamente o que faz em arquivos de texto, os **logs** (*logs*). Eles respondem à pergunta "o que aconteceu, e com quem?". Há sempre dois:

| Log | Conteúdo | Quando lê-lo |
|---|---|---|
| Log de **acesso** (*access log*) | Uma linha por requisição recebida: quem, quando, o quê, qual status | Ver quem visita, identificar os `404`, medir o tráfego |
| Log de **erros** (*error log*) | Os problemas encontrados pelo próprio servidor e a sua inicialização | Um site que responde `500`, um servidor que não inicia |

Local habitual (o do Apache é verificado na máquina de redação, os outros dois são **não verificados**):

| Servidor | Acesso | Erros |
|---|---|---|
| Apache (Debian, Ubuntu) | `/var/log/apache2/access.log` | `/var/log/apache2/error.log` |
| nginx | `/var/log/nginx/access.log` | `/var/log/nginx/error.log` |
| Caddy | Desativado por padrão, configurável no `Caddyfile` | Exibidas no terminal onde o Caddy está rodando |

### Ler uma linha do log de acesso

nginx e Apache (Debian) gravam por padrão no formato **combined** ("combinado"), e o Caddy grava em JSON. Eis dez linhas obtidas durante os testes deste capítulo: dez requisições enviadas a um site Apache de duas páginas (`/` e `/contact.html`), das quais três para páginas que não existem. O formato é definido na configuração de teste por:

```apache
# Define um formato chamado "combined": cada % é uma variável substituída por um valor
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
```

```text
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /absent.html HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /wp-login.php HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /.env HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "https://x.test/" "Mozilla"
```

Decomposição da última linha:

| Trecho | Variável | Significado |
|---|---|---|
| `127.0.0.1` | `%h` | O endereço IP do cliente |
| `-` (primeiro) | `%l` | Identidade do cliente segundo um protocolo antigo, quase sempre ausente (`-`) |
| `-` (segundo) | `%u` | Nome de usuário, se o site exige autenticação (senão `-`) |
| `[31/Oct/2026:21:14:30 +0100]` | `%t` | Data e hora da requisição, com o fuso horário |
| `"GET / HTTP/1.1"` | `%r` | A linha de requisição: método, caminho, versão |
| `200` | `%>s` | O código de status da resposta |
| `16` | `%b` | O tamanho do corpo enviado, em bytes (`-` se nenhum) |
| `"https://x.test/"` | `%{Referer}i` | A página de onde vem o visitante (`-` se desconhecida) |
| `"Mozilla"` | `%{User-Agent}i` | O software do cliente |

O cabeçalho se escreve `Referer`, com um único `r` no meio: é um erro de ortografia presente desde a origem da norma, mantido desde então.

Observe as linhas `404`: `/wp-login.php` (a página de conexão do [WordPress](https://wordpress.org), um software muito difundido para criar sites) e `/.env` (um arquivo que costuma conter as senhas e chaves de acesso de uma aplicação, veja [a gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) não existem neste site, mas robôs os pedem em toda a Internet, esperando cair em uma página de administração ou em um arquivo de segredos mal protegido. Esses `404` são portanto **normais** e sem consequência. Uma linha `/.env` com status `200`, ao contrário, seria grave: um arquivo que não deveria ser publicado foi publicado.

### Ler uma linha do log de erros

Para ver mais detalhes, o Apache aceita um **nível de registro** (`LogLevel info`): quanto mais o nível se aproxima de `debug`, mais falante é o log. Os níveis, do mais grave ao mais falante, são `emerg`, `alert`, `crit`, `error`, `warn`, `notice`, `info`, `debug` (o nginx os retoma da mesma forma: **não verificado**). Duas requisições provocam duas linhas no log de erros; a primeira corresponde a um arquivo ausente, a segunda a um endereço contendo `../` (uma tentativa de sair da pasta do site para alcançar `/etc/passwd`, o arquivo que lista as contas de um sistema Linux):

```text
[Sat Oct 31 21:07:24.865848 2026] [core:info] [pid 81231:tid 134962096056000]
    [client 127.0.0.1:52190] AH00128: File does not exist: [...]/site-a/absent.html
[Sat Oct 31 21:07:24.871139 2026] [core:error] [pid 81320:tid 134962096056000]
    [client 127.0.0.1:52192] AH10244: invalid URI path (/../../etc/passwd)
```

(Cada entrada ocupa uma única linha no arquivo real; ela foi quebrada aqui para a leitura, e o caminho de uma pasta temporária foi abreviado em `[...]`.) Os trechos, da esquerda para a direita: a hora, `[módulo:nível]`, o número do processo (`pid`) e da linha de execução (`tid`) que tratou a requisição, o cliente, um código próprio do Apache (`AH...`), depois a mensagem. Esse código é precioso: procura-se ele tal como está na [documentação](https://httpd.apache.org/docs/current/) ou na Internet.

### Pesquisar um log com comandos

Um log pode conter milhões de linhas: não se lê com os olhos. As ferramentas do [processamento de texto em Bash](/?c=langages&s=bash&p=traitement-de-texte) (`grep`, `awk`, `sort`, `uniq`) e os [pipes](/?c=langages&s=bash&p=redirections-et-pipes) (`|`, que envia a saída de um comando à entrada do seguinte) bastam. No formato `combined`, o `awk` numera as colunas separadas por espaços: `$7` é o caminho, `$9` o status.

```bash
# Acompanha o log ao vivo (Ctrl+C para parar): ver as requisições chegando
tail -f /var/log/apache2/access.log
# Conta as requisições por status: extrai a coluna 9, ordena, conta as repetições
# sort -rn: -n ordena por valor numérico, -r inverte a ordem (o maior primeiro)
awk '{print $9}' access-a.log | sort | uniq -c | sort -rn
```

```text
      7 200
      3 404
```

```bash
# Quais caminhos provocaram um 404? (coluna 9 igual a 404, exibe o caminho)
awk '$9==404 {print $7}' access-a.log | sort | uniq -c | sort -rn
```

```text
      1 /wp-login.php
      1 /.env
      1 /absent.html
```

```bash
# As três páginas mais pedidas (head -n 3: mantém as três primeiras linhas)
awk '{print $7}' access-a.log | sort | uniq -c | sort -rn | head -3
```

```text
      4 /
      3 /contact.html
      1 /wp-login.php
```

| Comando | Papel |
|---|---|
| `tail -f arquivo` | Exibe o fim do arquivo e o atualiza ao vivo (*follow*) |
| `tail -n 50 arquivo` | Exibe as 50 últimas linhas |
| `grep ' 500 ' arquivo` | Mantém as linhas que contêm o status `500` |
| `awk '{print $1}' arquivo \| sort \| uniq -c` | Conta as requisições por endereço IP |
| `sort -rn` | Ordena por número decrescente (o mais frequente primeiro) |
| `head -n 3` | Mantém as 3 primeiras linhas |

Quando os logs de dezenas de máquinas devem ser lidos juntos, centraliza-se tudo em uma ferramenta dedicada: veja [a agregação de logs com ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs).

### Os logs crescem: a rotação

Um log só faz crescer. Sem cuidado, ele acaba enchendo o disco, e um disco cheio derruba o site. A **rotação** consiste em renomear regularmente o arquivo atual (`error.log` vira `error.log.1`), começar um novo, compactar os antigos (`.gz`: arquivo compactado com gzip) e apagar os mais velhos. Na máquina de redação, a pasta do Apache mostra o resultado dessa operação:

```text
access.log   error.log   error.log.1   error.log.2.gz   error.log.3.gz
error.log.4.gz   other_vhosts_access.log
```

No Linux, é o programa [`logrotate`](https://github.com/logrotate/logrotate) que cuida disso, segundo os próprios arquivos de configuração dele (comportamento geral; a configuração dele não é detalhada aqui). Os logs de acesso contêm endereços IP de visitantes, que são **dados pessoais** no sentido do [**RGPD**](https://www.cnil.fr/fr/reglement-europeen-protection-donnees) (o regulamento europeu sobre a proteção de dados pessoais): não os guardamos indefinidamente e só damos acesso a quem precisa deles.

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Alterar a configuração e recarregar sem testar | Um erro de sintaxe pode impedir a reinicialização e derrubar o site | Sempre executar `nginx -t` ou `apache2 -t` antes do recarregamento |
| Esquecer o ponto e vírgula final de uma diretiva nginx | O arquivo é recusado, o servidor não inicia | Reler a mensagem de erro: ela dá o número da linha |
| Servir uma pasta larga demais | `root /var/www` publica tudo o que está nela, inclusive arquivos de backup ou de segredos | Publicar apenas a pasta do site, e nunca deixar nela um `.env` nem um arquivo compactado |
| Um site padrão que serve um site real | Quem conhece apenas o endereço IP vê um site que não deveria ver | Declarar um primeiro site "lixeira" (resposta vazia ou erro) |
| `EADDRINUSE` na inicialização | A porta já está ocupada por outro programa (muitas vezes a instância antiga do mesmo servidor) | Encerrar o outro programa ou mudar de porta |
| Confundir uma mensagem do curl com um status HTTP | `Failed to connect` não é um status: ninguém escuta | Verificar primeiro se o servidor está rodando e escutando a porta certa |
| Log que cresce sem fim | Um disco cheio derruba o site | Configurar a rotação e monitorar o espaço em disco |
| Chave privada legível por todos ou enviada a um repositório | Quem a lê pode se passar pelo site | Permissões restritas apenas à conta do servidor, nunca em um repositório Git |
| Certificado expirado | Os navegadores exibem um aviso ou bloqueiam o site | Renovação automática e monitoramento da data de expiração |

O erro `EADDRINUSE` se reproduz ao iniciar duas vezes o servidor deste capítulo:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:8081
```

## Boas práticas

| Prática | Motivo |
|---|---|
| Testar a configuração antes de recarregar (`nginx -t`, `apache2 -t`) | Um erro é detectado antes de produzir efeitos |
| Recarregar em vez de reiniciar (`nginx -s reload`) | Os visitantes em curso não são derrubados |
| Redirecionar sistematicamente a porta 80 para a 443 | Nenhuma página é jamais servida sem criptografia |
| Automatizar a renovação dos certificados | Um certificado que expira derruba o site, e ninguém se lembra de refazê-lo à mão |
| Manter a configuração em um repositório [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base) | Vê-se quem mudou o quê e é possível voltar atrás |
| Ler primeiro o log de erros quando um site responde `500` | Ele diz o porquê, enquanto o navegador não diz nada |
| Fazer o servidor de aplicação escutar em `127.0.0.1` quando ele não precisa ser público | Só a máquina pode alcançá-lo; o servidor web, colocado na frente, repassa as requisições (veja [o proxy reverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit)) |
| Manter o servidor web atualizado | Um servidor exposto à Internet é escaneado o tempo todo |
| Acrescentar um filtro na frente se o site estiver exposto | Veja [o firewall de aplicação (WAF)](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), que se acrescenta ao código seguro sem substituí-lo |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um servidor web é um programa que escuta uma porta (`80` para HTTP, `443` para HTTPS), recebe uma requisição e devolve uma resposta (status, cabeçalhos, corpo). Ele serve arquivos (estático) ou transmite a um programa de aplicação (dinâmico, por exemplo o PHP-FPM). O cabeçalho `Host` permite que ele hospede vários sites em um mesmo endereço. Ele reparte o trabalho entre vários processos trabalhadores que atendem, cada um, muitas conexões. Ele grava um log de acesso (uma linha por requisição) e um log de erros. |
| **Armadilhas a evitar** | Recarregar sem testar a configuração. Deixar um site padrão que serve um conteúdo real. Publicar uma pasta larga demais. Expor uma chave privada. Esquecer a rotação dos logs. Tomar um `404` de robô por um bug. |
| **Boas práticas** | Testar e depois recarregar. Passar tudo para HTTPS com renovação automática do certificado. Ler o log de erros antes de procurar em outro lugar. Monitorar o espaço em disco e manter a configuração no Git. |

## Nesta subseção

Esta subseção, "Servidores web", conta com este capítulo introdutório e com dois capítulos que o complementam:

| Capítulo | Assunto |
|---|---|
| [Códigos de status e cabeçalhos de controle](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle) | Os status HTTP em detalhe e os cabeçalhos que controlam o comportamento do cliente, como `Retry-After` |
| [Proxy reverso e limitação de taxa](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) | Colocar um servidor diante de outros servidores, e limitar o número de requisições aceitas |
