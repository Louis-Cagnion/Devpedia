---
order: 23
---

# Desativar a verificação TLS: o que a opção realmente desliga (01/11/2026)

Quando um programa chama um endereço em `https://`, ele é o **cliente** (quem pede) e a máquina chamada é o **servidor** (quem responde), como explicado em [As trocas de dados: API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). **HTTPS** é HTTP transportado em uma conexão protegida por **TLS** (*Transport Layer Security*), o protocolo que criptografa a conversa e permite ao cliente **verificar a identidade do servidor** graças a um **certificado** (uma identidade digital que o servidor apresenta). Quase todas as ferramentas oferecem uma opção para **pular essa verificação**: `curl -k` (o [programa curl](https://curl.se/docs/manpage.html), que envia uma requisição a um endereço pelo terminal), `verify=False` (em Python) ou `verify => FALSE` (em PHP), por exemplo. Ela faz desaparecer o erro que bloqueia, em uma linha, e é exatamente isso que a torna perigosa: o programa funciona, e nada mais garante com quem ele está falando.

Este capítulo explica o que a verificação controla, por que somos tentados a desligá-la, o que ela expõe (com um laboratório executado na sua máquina, que não toca em nenhuma rede, exceto um teste facultativo com um site público, indicado no seu lugar), depois as soluções que resolvem a causa real. Ele complementa [Criptografia aplicada para desenvolvedores](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (que explica a criptografia e fabrica um certificado autoassinado) e a parte [ataques de rede](/?c=langages&s=php&p=securite#ataques-de-rede) do capítulo PHP sobre segurança (que apresenta o ataque do homem do meio em uma definição); ele não os repete. Dois capítulos vizinhos tratam de outras formas de proteger mal uma troca ou seus rastros: [Recurso REST e autenticação HTTP Basic](/?c=securite&s=cybersecurite&p=authentification-http-basic-et-ressource-rest) (o que o HTTP Basic envia a cada requisição) e [Dados pessoais nos logs e nas cópias](/?c=securite&s=cybersecurite&p=donnees-personnelles-dans-les-journaux) (o que um log guarda sem que ninguém tenha querido).

| Parte | Pergunta |
|---|---|
| [O que a verificação TLS garante](#o-que-a-verificacao-tls-garante) | O que o cliente controla exatamente, e o que a criptografia sozinha faz? |
| [Por que somos tentados a desligá-la](#por-que-somos-tentados-a-desliga-la) | Quais erros levam a escrever `verify=False`? |
| [O que o desligamento expõe](#o-que-o-desligamento-expoe) | O que um terceiro colocado entre o cliente e o servidor pode fazer? |
| [O laboratório local](#laboratorio-local-ver-o-desligamento-em-acao) | Como ver isso com os próprios olhos, sem perigo? |
| [As opções equivalentes](#o-mesmo-desligamento-em-cada-ferramenta) | Como a desativação se escreve em cada ferramenta? |
| [Um exemplo em um framework PHP](#um-exemplo-em-um-framework-php-drupal-e-guzzle) | Como ela se parece em um projeto real? |
| [As boas soluções](#as-boas-solucoes) | O que fazer no lugar, e como detectar o esquecimento? |

## O que a verificação TLS garante

TLS traz **três garantias**, das quais apenas uma é retirada pela opção que desliga a verificação, e a confusão entre elas é a fonte do perigo:

| Garantia | Pergunta à qual ela responde | Quem a oferece |
|---|---|---|
| **Confidencialidade** | Alguém que escuta o cabo consegue ler? | A criptografia da conversa |
| **Integridade** | Alguém consegue alterar uma mensagem no caminho sem que se perceba? | A criptografia autenticada (um controle de alteração anexado a cada mensagem) |
| **Autenticidade do servidor** | O servidor do outro lado é mesmo aquele que eu acho que é? | **A verificação do certificado** |

A criptografia sozinha protege contra um curioso que observa de fora. Ela não diz nada sobre o interlocutor: é perfeitamente possível criptografar com perfeição uma conversa com um desconhecido. Imagem: uma porta blindada no corredor (a criptografia) não adianta nada se a pessoa que deixamos entrar não for a que esperávamos. A verificação do certificado é a conferência do documento de identidade na porta.

### O que acontece na conexão

Dois termos do esquema: a **chave pública** é a metade não secreta de um par de chaves (a outra metade, a chave privada, nunca sai do servidor), e a **chave de sessão** é uma chave temporária, criada apenas para esta conversa, que serve para criptografar as mensagens (o capítulo [Criptografia aplicada para desenvolvedores](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) detalha as chaves).

```
 CLIENTE                                          SERVIDOR
   |  1. « Olá, quero falar com api.exemplo.org »        |
   |---------------------------------------------------->|
   |  2. Eis meu certificado (e minha chave pública)     |
   |<----------------------------------------------------|
   |                                                     |
   |  3. O CLIENTE VERIFICA (é o que se desliga) :       |
   |     a. a assinatura remonta a uma CA conhecida      |
   |     b. o nome do certificado = o nome pedido        |
   |     c. o certificado está no seu período de         |
   |        validade                                     |
   |                                                     |
   |  4. Se tudo estiver ok: troca de chave de sessão    |
   |<===================================================>|
   |  5. Conversa criptografada com essa chave           |
```

Uma **autoridade de certificação** (*certificate authority*, CA) é um organismo de confiança que assina certificados depois de verificar a identidade de quem pediu (o capítulo [Criptografia aplicada para desenvolvedores](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#o-certificado-tls-autoassinado) dá a definição completa, com a chave pública e a chave privada). Cada sistema operacional (ou cada ferramenta) traz uma lista de CAs em que acredita sem questionar: é o **repositório de confiança** (*trust store*). Um certificado é aceito se a sua assinatura **remonta**, assinatura por assinatura, até uma CA desse repositório: essa sequência de assinaturas é a **cadeia de certificados**.

| Controle do cliente | Ele verifica que... | Mensagem típica quando falha |
|---|---|---|
| **Cadeia** | A assinatura do certificado remonta a uma CA do repositório de confiança | `self-signed certificate` ; `unable to get local issuer certificate` (mensagem do OpenSSL, não reproduzida aqui) |
| **Nome** | O nome pedido (`api.exemplo.org`) consta da lista de nomes do certificado (o campo **SAN**, *Subject Alternative Name*) | `no alternative certificate subject name matches target host name` |
| **Datas** | A data de hoje está entre a data de início e a data de fim do certificado | `certificate has expired` |
| **Chave** | O servidor possui de fato a chave privada ligada ao certificado (ele prova isso durante a troca) | Falha da conexão (a mensagem varia conforme a ferramenta) |

Um certificado serve para ligar **um nome** a **uma chave pública**, e a CA garante esse vínculo. Se o cliente não confere a cadeia, qualquer pessoa pode fabricar um certificado em nome de `api.exemplo.org`; se ele não confere o nome, qualquer certificado válido (o de outro site) é aceito no lugar. Um quinto controle, a **revogação** (um certificado cancelado antes da data de fim), depende do cliente e não é detalhado aqui.

## Por que somos tentados a desligá-la

A opção não é escrita por má intenção. Ela quase sempre aparece no momento em que um erro bloqueia o trabalho e a causa real exige tempo:

| Situação | O que se vê | Causa real | Por que o desligamento tenta |
|---|---|---|---|
| Servidor de desenvolvimento com um certificado **autoassinado** (fabricado por você mesmo) | `self-signed certificate` | O certificado não remonta a nenhuma CA do repositório | « É só a minha máquina, isso não tem importância » |
| Certificado **expirado** em um servidor de teste ou interno | `certificate has expired` | Ninguém renovou o certificado | A renovação depende de outro serviço, e a entrega é amanhã |
| Chamada por um **endereço IP** ou um apelido | `no alternative certificate subject name matches...` | O certificado foi emitido para outro nome | O nome certo ainda não está no DNS (o diretório que traduz um nome em endereço) |
| Rede corporativa com um **proxy** (um intermediário por onde passam todas as chamadas) que inspeciona o tráfego | `certificate verify failed` | O proxy reemite os próprios certificados, que a ferramenta não conhece (veja [a nota sobre o proxy TLS](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#nota-um-proxy-corporativo-pode-deixar-o-composer-lento-sem-bloquea-lo)) | Todas as chamadas falham de uma vez |
| Repositório de confiança antigo (sistema antigo, contêiner mínimo) | `unable to get local issuer certificate` | A CA que assinou o certificado não está na lista | O site funciona no navegador, não no script |

Em cada um desses casos, a opção que desliga a verificação **suprime o controle** em vez de **corrigir a causa**. O erro desaparece, como uma luz de alerta que se desligaria em vez de consertar o motor. E a opção, uma vez escrita, tem a má tendência de ficar: ela é copiada para outro arquivo, aprovada na revisão sem comentário e enviada à produção. O teste que passa no desenvolvimento passa também em produção, inclusive quando não deveria.

## O que o desligamento expõe

O cenário a temer se chama **ataque do homem do meio** (*man-in-the-middle*, MITM). Um terceiro se intercala entre o cliente e o servidor: ele conversa com o cliente fazendo-se passar pelo servidor, e com o servidor verdadeiro fazendo-se passar pelo cliente.

```
 Verificação ATIVA
   CLIENTE ----> ATACANTE        O certificado do atacante não remonta a nenhuma
                   X             CA conhecida: o cliente RECUSA, a conexão para.

 Verificação DESLIGADA
   CLIENTE ====== ATACANTE ====== SERVIDOR
      conversa 1         conversa 2
      criptografada com  criptografada com
      a chave do atacante  a chave do servidor real

   O atacante decifra a conversa 1, lê ou altera, e recriptografa a conversa 2.
```

O cliente acredita falar com `api.exemplo.org`: a conversa está de fato criptografada, mas **com o atacante**. Quem pode se colocar no meio? Mais gente do que se imagina:

| Posição do atacante | Como ele se encontra entre os dois |
|---|---|
| Rede Wi-Fi pública ou compartilhada | Ele controla o ponto de acesso, ou se faz passar pelo gateway (o equipamento por onde sai todo o tráfego da rede) |
| Nome de domínio desviado | Ele corrompe a resposta do DNS para que o nome aponte para a máquina dele |
| Equipamento comprometido no trajeto | Um roteador (o equipamento que direciona o tráfego entre redes), um proxy, uma máquina de uma rede de hospedagem compartilhada |
| Provedor de acesso ou hospedagem comprometido | Ele vê passar o tráfego e pode redirecioná-lo |

Sem o desligamento, o atacante precisaria apresentar um certificado válido para `api.exemplo.org`, assinado por uma CA de confiança: isso é muito difícil de obter. **Com o desligamento, um certificado fabricado em três segundos basta.** A dificuldade do ataque cai a zero.

O que ele pode fazer depende do que o programa envia e recebe:

| O que circula | O que o atacante faz com isso |
|---|---|
| Um **token** (um texto secreto que prova a identidade de quem chama) ou uma chave de API no **cabeçalho** `Authorization` (uma linha de informação anexada à requisição) | Ele copia e chama a API no seu lugar (veja [autenticar uma API](/?c=securite&s=cybersecurite&p=securite-api-web#autenticando-uma-api-chave-ou-token-dependendo-do-cliente)) |
| Uma senha, dados pessoais | Ele os lê |
| Uma resposta (saldo, status de pagamento, configuração) | Ele a substitui por uma falsa: « pagamento aceito », « usuário autorizado » |
| Um arquivo baixado (atualização, dependência, script) | Ele o substitui por uma versão adulterada, que será executada na sua máquina |
| Uma chamada de servidor para servidor ([webhook](/?c=securite&s=cybersecurite&p=securite-des-webhooks), sincronização entre dois aplicativos, chamada a uma API parceira) | Tudo o que foi dito acima, sem que nenhum humano veja jamais um aviso |

O último caso é o mais insidioso: um **navegador** exibe uma grande tela vermelha diante de um certificado suspeito, e um humano pode desistir. Um **programa** com a opção desligada não mostra nada e nunca desiste. O tema das requisições saindo de um servidor é também o do capítulo [SSRF: contornar a lista branca](/?c=securite&s=cybersecurite&p=ssrf-en-detail): um servidor que chama outros servidores é um alvo, e a verificação TLS é uma de suas proteções.

> **Para lembrar:** o desligamento não desativa a criptografia. A conversa continua criptografada. Ele desativa a **prova da identidade do interlocutor**, portanto a única coisa que garante que a criptografia leva ao destinatário certo.

## Laboratório local: ver o desligamento em ação

Tudo o que segue acontece **na sua máquina**, no endereço `127.0.0.1` (o endereço da própria máquina, também chamado `localhost`), em uma **porta** livre (o número que distingue vários serviços na mesma máquina; aqui 7261, bem acima das portas comuns). Nenhum pacote sai para a Internet. O laboratório pede um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), um [editor de texto](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide) para criar os arquivos, e quatro ferramentas: [`openssl`](https://docs.openssl.org/3.0/man1/openssl/) (o programa de referência para fabricar certificados), `python3` (a linguagem [Python](/?c=langages&s=python&p=python)), [`curl`](https://curl.se/docs/manpage.html) (o programa que envia uma requisição a um endereço, visto acima) e `node` (o ambiente que executa [JavaScript](/?c=langages&s=javascript&p=javascript) fora do navegador). A biblioteca Python `requests` se instala com `pip install requests` (`pip` é o instalador de pacotes do Python, veja [módulos, pip e ambientes virtuais](/?c=langages&s=python&p=modules-et-environnements)). As linhas `PHP` (a linguagem [PHP](/?c=langages&s=php&p=php)) são facultativas. As mensagens e as saídas deste capítulo foram obtidas com curl 8.5, Python 3.12 (requests 2.31), Node.js 22, PHP 8.3 e OpenSSL 3.0: conforme as versões, a formulação de uma mensagem varia um pouco.

O plano, em três tempos:

| Tempo | Servidor na porta 7261 | O que se mostra |
|---|---|---|
| 1 | O servidor **A**, com o certificado A | O erro de verificação, depois as opções que o « consertam » |
| 2 | O servidor **B**, com um **outro** certificado B, no mesmo lugar | O cliente com verificação desligada não percebe nada |
| 3 | A depois B, com a fixação | Um controle mais rigoroso que a simples confiança |

O servidor B faz aqui o papel do atacante: ele tomou o lugar de A. Em uma rede real, seria o DNS corrompido, o Wi-Fi armadilhado ou o proxy que levaria o cliente até ele; o resultado do lado do cliente é o mesmo.

### Etapa 1: dois certificados autoassinados

```bash
# mkdir cria uma pasta de trabalho descartável, cd entra nela
# && : o 2º comando só roda se o 1º tiver dado certo (veja os comandos básicos)
mkdir lab-tls && cd lab-tls
# laço : duas voltas, com a variável n valendo a depois b (um certificado por volta)
# $n dá o valor de n : chave-$n.pem vira chave-a.pem, depois chave-b.pem
for n in a b; do
  # req -x509 fabrica um certificado autoassinado ; -nodes deixa a chave privada em texto puro
  # -days 30 : válido por 30 dias
  # -newkey rsa:2048 : cria ao mesmo tempo um par de chaves RSA de 2048 bits
  # -keyout / -out : os arquivos onde gravar a chave privada / o certificado
  # -subj "/CN=localhost" : CN (nome comum) = o nome do titular do certificado
  # -addext : acrescenta a lista dos nomes válidos (SAN) : localhost, 127.0.0.1
  # \ no fim da linha : o comando continua na linha seguinte
  # 2>/dev/null : descarta as mensagens de erro (o canal 2) que o openssl exibe,
  # aqui pontos de progresso (/dev/null é um arquivo lixeira)
  openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout chave-$n.pem -out cert-$n.pem \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
done
```

Os comandos `mkdir`, `cd`, `&&`, `>` e `2>/dev/null` são explicados em [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base) e [os redirecionamentos](/?c=langages&s=bash&p=redirections-et-pipes). As opções de `openssl req` são detalhadas no [capítulo sobre o certificado autoassinado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#o-certificado-tls-autoassinado) e na [documentação do OpenSSL](https://docs.openssl.org/3.0/man1/openssl-req/). Os dois certificados levam **o mesmo nome** (`localhost`) e a mesma duração, mas cada um tem **seu próprio par de chaves**: eles são indistinguíveis aos olhos, e no entanto o cliente precisa conseguir diferenciá-los.

### Etapa 2: um pequeno servidor HTTPS

Os arquivos deste laboratório (`servidor.py`, depois `cliente.py`, `cliente.mjs`, `cliente-ssl.py` e `cliente.php`) são criados com o editor de texto: colamos nele o conteúdo do bloco e o salvamos com o nome indicado, nesta mesma pasta `lab-tls`. O arquivo `servidor.py` inicia um servidor HTTPS que responde « resposta do servidor » seguido do seu nome, e que anota o cabeçalho `Authorization` recebido (o cabeçalho que serve para enviar um token de identificação, visto acima).

```python
# ssl : o módulo Python que adiciona TLS a uma conexão
import ssl
# sys : leitura dos argumentos da linha de comando
import sys
# http.server : um servidor web mínimo que vem com o Python
from http.server import BaseHTTPRequestHandler, HTTPServer

# argumentos : a porta, o arquivo do certificado, o arquivo da chave, o nome do servidor
# a, b = x, y : atribuição múltipla (a recebe x e b recebe y, veja as tuplas)
# int converte o texto da porta em número ; sys.argv[1] é o 1º argumento dado
porta, certificado, chave, nome = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]


# uma classe agrupa funções ; esta descreve como responder às requisições
class Manipulador(BaseHTTPRequestHandler):
    # do_GET é chamada a cada requisição GET recebida ; self designa a requisição atual
    def do_GET(self):
        # mostra o cabeçalho Authorization recebido
        # (o f antes do texto insere as {variáveis})
        # flush=True : grava de imediato no registro, sem esperar um buffer cheio
        print(f"[{nome}] Authorization:", self.headers.get("Authorization"), flush=True)
        # o texto devolvido (\n : quebra de linha) ; encode converte em bytes
        corpo = f"resposta do servidor {nome}\n".encode()
        # código 200 : a requisição deu certo
        self.send_response(200)
        # informa o tamanho da resposta em bytes
        self.send_header("Content-Length", str(len(corpo)))
        # termina os cabeçalhos
        self.end_headers()
        # envia o corpo da resposta
        self.wfile.write(corpo)

    # substitui o registro padrão por nada, para manter uma saída legível
    # (*args aceita quaisquer argumentos ; pass : não faz nada)
    def log_message(self, *args):
        pass


# cria o servidor : ele escuta em 127.0.0.1 (somente esta máquina) na porta dada
servidor = HTTPServer(("127.0.0.1", porta), Manipulador)
# contexto TLS do lado do servidor : ele carrega o certificado e a chave privada
contexto = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# carrega o certificado apresentado aos clientes e a chave privada que lhe corresponde
contexto.load_cert_chain(certificado, chave)
# envolve o socket (o ponto de entrada da rede) em TLS : o servidor fala HTTPS
# server_side=True : este socket é o de um servidor (que apresenta um certificado)
servidor.socket = contexto.wrap_socket(servidor.socket, server_side=True)
# espera as requisições até que o programa seja interrompido
servidor.serve_forever()
```

A atribuição múltipla da linha `porta, certificado, chave, nome = ...` é o desempacotamento de tupla visto em [as listas e as tuplas](/?c=langages&s=python&p=listes-et-tuples#desempacotamento-unpacking). A linha de comando de lançamento recebe quatro argumentos: a porta, o certificado, a chave e o nome do servidor.

```bash
# inicia o servidor A em segundo plano (&), limitado a 120 segundos pelo timeout
# > registro-a.txt : o que o servidor exibe vai para esse arquivo
timeout 120 python3 servidor.py 7261 cert-a.pem chave-a.pem A > registro-a.txt &
# $! : número do último processo iniciado em segundo plano ; guardamos para encerrá-lo
PID_A=$!
# espera um segundo para que o servidor esteja pronto para escutar
sleep 1
```

`timeout` encerra sozinho o servidor após 120 segundos, mesmo que você esqueça de fazê-lo (relance os comandos da etapa se o prazo tiver passado, veja [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout#parar-um-comando-que-demora-demais-timeout)). O `&` no fim da linha devolve o controle ao terminal deixando o servidor rodando (veja [o gerenciamento de processos](/?c=langages&s=bash&p=gestion-des-processus)), e `>` envia o que o servidor exibe para um arquivo (veja [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes)). O código Python usa [a programação orientada a objetos](/?c=langages&s=python&p=poo) e [o tratamento de erros](/?c=langages&s=python&p=gestion-des-erreurs).

### Etapa 3: a verificação falha

```bash
# -s : sem barra de progresso ; -S : mas os erros continuam exibidos
curl -sS https://localhost:7261/
# $? : o código de saída do último comando executado (aqui o curl)
echo $?
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
60
```

É exatamente o comportamento correto: o certificado A é **autoassinado**, ele não remonta a nenhuma CA do repositório de confiança, e o `curl` recusa. Ele termina com o **código de saída** 60, o último número exibido por `echo $?` (um número que todo programa devolve ao final; 0 quer dizer « sucesso », qualquer outro valor quer dizer « falha »). As outras ferramentas dizem a mesma coisa com as palavras delas:

| Ferramenta | Mensagem obtida |
|---|---|
| `curl` | `curl: (60) SSL certificate problem: self-signed certificate` |
| Python `requests` | `certificate verify failed: self-signed certificate` (o cliente Python lança o erro `CERTIFICATE_VERIFY_FAILED`) |
| Node.js (`fetch`) | `DEPTH_ZERO_SELF_SIGNED_CERT` (« certificado autoassinado, profundidade zero »: a cadeia tem um único elo) |
| PHP (extensão cURL) | `SSL certificate problem: self-signed certificate` |

### Etapa 4: a opção « conserta » o erro

```bash
# -k (ou --insecure) : o curl não verifica mais nada
curl -sS -k https://localhost:7261/
```

```
resposta do servidor A
```

O erro desapareceu, a resposta chega. Eis os mesmos testes com as outras ferramentas. O script Python, salvo em `cliente.py` (o módulo `re` das expressões regulares é apresentado em [Regex em Python](/?c=langages&s=python&p=regex-en-python)):

```python
# re : as expressões regulares, que procuram um padrão em um texto
import re
# sys : leitura dos argumentos da linha de comando
import sys
# requests : a biblioteca Python mais usada para chamar um endereço web
import requests

# primeiro argumento : o endereço a chamar
endereco = sys.argv[1]
# 2º argumento : "não" dá False (verificação desligada), senão o arquivo de confiança
verificacao = False if sys.argv[2] == "não" else sys.argv[2]
# try : tenta o bloco ; se o erro nomeado por except acontecer, o bloco except é executado
try:
    # verify=False desliga a verificação ; verify="arquivo.pem" faz a verificação com esse
    # arquivo de confiança, que substitui a lista habitual
    # timeout=5 : desiste da chamada após 5 segundos sem resposta
    resposta = requests.get(endereco, verify=verificacao, timeout=5)
    # mostra o texto recebido
    print(resposta.text.strip())
except requests.exceptions.SSLError as erro:
    # a verificação falhou : procura o padrão que segue « certificate verify failed »
    # [^(]* : todos os caracteres seguintes, até o primeiro parêntese (excluído)
    # re.search devolve o primeiro lugar do texto que corresponde ao padrão
    padrao = re.search(r"certificate verify failed: [^(]*", str(erro))
    # .group(0) : o texto encontrado inteiro ; .strip() retira os espaços do fim
    print("RECUSADO:", padrao.group(0).strip())
```

```bash
# primeiro argumento : o endereço ; segundo argumento : « não » (desligar a verificação)
python3 cliente.py https://localhost:7261/ não
```

```
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
resposta do servidor A
```

(As linhas longas demais são cortadas aqui por `[...]`; o caminho do primeiro depende da sua instalação. `urllib3` é a biblioteca HTTP sobre a qual se apoia o `requests`, veja a sua [documentação](https://urllib3.readthedocs.io/en/stable/).) O Python **avisa**: é um aviso, não um erro. Ele se intromete na saída de erro de um programa, onde se perde com facilidade, e alguns projetos o silenciam (veja [as armadilhas](#as-armadilhas)). O script JavaScript, salvo em `cliente.mjs` (a extensão `.mjs` indica ao Node.js um arquivo de módulo, o que permite `await` fora de uma função; `fetch` exige Node.js 18 ou mais recente, `node --version` mostra a versão instalada; o `await` é apresentado em [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone)):

```javascript
// process.argv : a lista dos argumentos da linha de comando
// [0] é node, [1] é o script, portanto [2] é o primeiro argumento dado pelo usuário
// const declara uma variável que não vai mudar mais
// try/catch : tenta o bloco try ; em caso de erro, o bloco catch é executado
// await : espera o resultado de uma operação assíncrona antes de continuar
const endereco = process.argv[2];
try {
  // fetch chama o endereço ; a verificação TLS é feita pelo Node.js
  const resposta = await fetch(endereco);
  // mostra o texto recebido
  console.log((await resposta.text()).trim());
} catch (erro) {
  // falha : mostra o código da causa se ele existir (?.), senão a mensagem (??)
  console.log("RECUSADO:", erro.cause?.code ?? erro.message);
}
```

Uma particularidade do Node.js: o desligamento é ajustado por uma **variável de ambiente** (um valor que o terminal passa ao programa que ele inicia, veja [variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement)), portanto **sem tocar no código**.

```bash
# verificação ativa (padrão) : o programa recusa
node cliente.mjs https://localhost:7261/
# a variável NODE_TLS_REJECT_UNAUTHORIZED=0 desliga a verificação de TODO o processo
NODE_TLS_REJECT_UNAUTHORIZED=0 node cliente.mjs https://localhost:7261/
```

```
RECUSADO: DEPTH_ZERO_SELF_SIGNED_CERT
(node:169907) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment [...]
(Use `node --trace-warnings ...` to show where the warning was created)
resposta do servidor A
```

Essa variável é a mais perigosa das opções deste capítulo: uma única linha em um arquivo de configuração, um script de inicialização ou uma definição de contêiner desliga a verificação de **cada** chamada do programa, inclusive as das bibliotecas de terceiros que não escrevemos.

### A forma correta de consertar esse erro: confiar NESTE certificado

O certificado A é conhecido: fomos nós que o fabricamos. Em vez de desligar tudo, dizemos ao cliente « confie nesse certificado »:

```bash
# --cacert : fornece o arquivo de certificados de confiança, apenas para esta chamada
curl -sS --cacert cert-a.pem https://localhost:7261/
# Python : o 2º argumento é o arquivo de confiança (verify="cert-a.pem")
python3 cliente.py https://localhost:7261/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS acrescenta certificados de confiança sem retirar nenhum
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://localhost:7261/
```

```
resposta do servidor A
resposta do servidor A
resposta do servidor A
```

Os três chamados dão certo **com** a verificação ativa. A diferença em relação ao `-k` não aparece aqui, porque é de fato o servidor A que responde. Ela vai aparecer na etapa seguinte.

#### Acrescentar ou substituir: o que faz cada opção de confiança

Essas opções não se comportam todas do mesmo jeito. Algumas **acrescentam** o certificado dado à lista de confiança habitual (a das CAs públicas), outras a **substituem**: com elas, um site público como `https://example.com/` seria recusado, pois a CA dele não está mais na lista. Teste facultativo (ele contata este site público real, o único deste capítulo) com o servidor A sempre em execução:

```bash
# curl : -o /dev/null descarta a página, -w '%{http_code}\n' mostra só o código HTTP
curl -sS -o /dev/null -w '%{http_code}\n' --cacert cert-a.pem https://example.com/
# Python : o arquivo de confiança é somente cert-a.pem
python3 cliente.py https://example.com/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS acrescenta cert-a.pem às CAs públicas
# head -c 15 mantém apenas os 15 primeiros caracteres da página
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://example.com/ | head -c 15; echo
```

```
200
RECUSADO: certificate verify failed: unable to get local issuer certificate
<!doctype html>
```

| Ferramenta | Opção | Efeito na lista de confiança | Resultado em `https://example.com/` |
|---|---|---|---|
| Python `requests` | `verify="arquivo.pem"` (ou a variável `REQUESTS_CA_BUNDLE`) | **Substitui** a lista | Recusado |
| Python (módulo `ssl`) | `create_default_context(cafile="arquivo.pem")` | **Substitui** a lista | Recusado |
| Node.js (código) | `ca: conteúdo do certificado` | **Substitui** a lista | Recusado (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) |
| Node.js (variável) | `NODE_EXTRA_CA_CERTS=arquivo.pem` | **Acrescenta** à lista | Aceito |
| `curl` | `--cacert arquivo.pem` | Substitui o **arquivo** de CAs padrão ; mas o **diretório** de CAs do sistema, lido também pelo curl do Debian e do Ubuntu, continua em uso | Aceito aqui ; recusado com, além disso, `--capath` apontando para um diretório vazio (`unable to get local issuer certificate`) |
| PHP (extensão cURL) | `CURLOPT_CAINFO` | Como o `curl`, cuja biblioteca ela reutiliza | Aceito aqui |

Para reter: só o `NODE_EXTRA_CA_CERTS` **acrescenta** de fato. Nas outras, pôr no arquivo apenas a CA do seu servidor de teste **corta o acesso aos sites públicos**; para manter os dois, copia-se nele também as CAs públicas (o arquivo do sistema, muitas vezes `/etc/ssl/certs/ca-certificates.crt` no Debian e no Ubuntu). O comportamento do `curl` depende de como ele foi compilado: não conte com o diretório do sistema.

### Etapa 5: outro servidor toma o lugar do primeiro

Paramos A e iniciamos B na **mesma porta**, com **o outro certificado** (B). Do ponto de vista do cliente, o mesmo endereço `https://localhost:7261/` responde, mas já não é a mesma máquina.

```bash
# encerra o servidor A (wait espera ele terminar, sleep deixa a porta ser liberada)
kill $PID_A; wait $PID_A 2>/dev/null; sleep 1
# inicia o servidor B : mesma porta, certificado e chave diferentes
timeout 120 python3 servidor.py 7261 cert-b.pem chave-b.pem B > registro-b.txt &
# guarda o número do processo dele e espera que ele escute
PID_B=$!
sleep 1
```

O cliente cuja verificação está **desligada**:

```bash
# -H acrescenta um cabeçalho : aqui um token de API inventado, como um cliente real enviaria
curl -sS -k -H "Authorization: Bearer token-secreto-123" https://localhost:7261/
# código de saída do curl : 0, tudo correu bem
echo $?
# Python, verificação desligada
python3 cliente.py https://localhost:7261/ não
```

```
resposta do servidor B
0
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
resposta do servidor B
```

O cliente **não percebe nada**: a resposta está bem formada, e o código de saída vale 0 (lido com `echo $?`, como na etapa 3). O único rastro fica no registro do servidor B, que o cliente nunca verá:

```bash
# exibe o que o servidor B anotou
cat registro-b.txt
```

```
[B] Authorization: Bearer token-secreto-123
[B] Authorization: None
```

O servidor B **leu o token em texto puro**. Ele poderia perfeitamente devolver uma resposta falsificada. A primeira linha vem do `curl`, a segunda do Python (que não enviava cabeçalho `Authorization`).

O cliente que **conhece o certificado correto** (o de A):

```bash
# verificação ativa, com a confiança dada ao certificado A
curl -sS --cacert cert-a.pem https://localhost:7261/
# a mesma coisa em Python
python3 cliente.py https://localhost:7261/ cert-a.pem
# a mesma coisa em Node.js
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://localhost:7261/
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
RECUSADO: certificate verify failed: self-signed certificate
RECUSADO: DEPTH_ZERO_SELF_SIGNED_CERT
```

As três ferramentas **recusam**: o certificado apresentado por B não é aquele em que elas confiam. Eis o balanço do laboratório:

| Cliente | Servidor A (legítimo) | Servidor B (impostor) |
|---|---|---|
| Verificação **desligada** (`-k`, `verify=False`) | Resposta | **Resposta também: B leu o token** |
| Verificação **sobre o certificado A** (`--cacert`, `verify="cert-a.pem"`) | Resposta | **Recusa** |

Repare que o certificado de B tem o **mesmo nome** `localhost` que o de A, e que ele também é válido no tempo: um controle de nome não o teria barrado. É a **cadeia de confiança** (saber em quem se confia) que protege aqui.

### Etapa 6: fixar uma impressão digital

Confiar em um certificado preciso é a **fixação** (*pinning*): o cliente só aceita um servidor cuja chave pública corresponde a uma impressão digital conhecida de antemão. Uma **impressão digital** é o resultado de um [hash](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-versus-criptografia-uma-confusao-frequente) (aqui SHA-256): um valor curto que muda assim que o dado muda.

```bash
# extrai a chave pública do certificado A, converte para o formato binário (DER), faz o hash
# em SHA-256 e depois grava em base64 (uma codificação de texto) ; | encadeia os comandos
# $(...) : executa o comando dentro dele e guarda o resultado em IMPRESSAO
# x509 -pubkey -noout : mostra a chave pública do certificado, mas não o próprio certificado
# pkey -pubin -outform der : lê uma chave pública (-pubin) e a envia em binário DER
# dgst -sha256 -binary : calcula a impressão digital SHA-256, em binário
# enc -base64 : transforma esse binário em texto legível
IMPRESSAO=$(openssl x509 -in cert-a.pem -pubkey -noout | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64)
# --pinnedpubkey : o curl exige que a chave pública do servidor tenha essa impressão digital
# -k é acrescentado aqui para mostrar que a fixação vale
# mesmo sem a verificação da cadeia
curl -sS -k --pinnedpubkey "sha256//$IMPRESSAO" https://localhost:7261/
```

```
curl: (90) SSL: public key does not match pinned public key
```

O servidor B (ainda em funcionamento) é recusado com o código 90. Substituímos B por A e refazemos:

```bash
# encerra B, reinicia A (registro-a2.txt), depois repete exatamente o mesmo comando curl
kill $PID_B; wait $PID_B 2>/dev/null; sleep 1
timeout 120 python3 servidor.py 7261 cert-a.pem chave-a.pem A > registro-a2.txt &
PID_A=$!
sleep 1
curl -sS -k --pinnedpubkey "sha256//$IMPRESSAO" https://localhost:7261/
# encerra este servidor A (os exemplos seguintes o reiniciam)
kill $PID_A
```

```
resposta do servidor A
```

Em um uso real, **não** se retira a verificação normal: a fixação se soma a ela. As impressões digitais mudam a cada fabricação de certificado, e é por isso que não são copiadas aqui. Os limites da fixação estão em [as boas soluções](#as-boas-solucoes).

### Os outros dois controles, com mensagens reais

O nome e a data se verificam do mesmo jeito. Esses testes usam um certificado emitido somente para o nome `outro.example`, e um certificado datado de janeiro de 2025. O primeiro se fabrica como na etapa 1, com outro `-subj`; o segundo pede `openssl ca`, cujas opções `-startdate` e `-enddate` permitem escolher as datas (`openssl req` não permite isso):

```bash
# certificado emitido para o nome outro.example (e não localhost)
openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout chave-nome.pem -out cert-nome.pem \
  -subj "/CN=outro.example" -addext "subjectAltName=DNS:outro.example" 2>/dev/null
# pedido de certificado (-new), assinado depois pelo openssl ca ;
# ele cria a chave chave-exp.pem
openssl req -new -nodes -newkey rsa:2048 -keyout chave-exp.pem -out exp.csr \
  -subj "/CN=localhost" 2>/dev/null
# arquivos de trabalho do openssl ca : o registro dos certificados emitidos
# (vazio) e um número de série
: > index.txt
echo 01 > serial.txt
# configuração mínima do openssl ca ; <<'FIN' escreve as linhas seguintes até FIN
cat > ca.cnf <<'FIN'
[ca]
default_ca = ca_lab
[ca_lab]
database = index.txt
new_certs_dir = .
serial = serial.txt
default_md = sha256
policy = regras_politica
[regras_politica]
commonName = supplied
FIN
# os nomes válidos (SAN) do certificado, lidos por -extfile
echo "subjectAltName = DNS:localhost,IP:127.0.0.1" > ext.cnf
# -selfsign : assina com a própria chave (autoassinado) ;
# válido somente em 1º de janeiro de 2025
openssl ca -batch -selfsign -config ca.cnf -keyfile chave-exp.pem -in exp.csr \
  -out cert-exp.pem -startdate 20250101000000Z -enddate 20250102000000Z \
  -extfile ext.cnf -notext
```

Para testá-los, paramos o servidor em curso e depois lançamos o servidor com um desses dois certificados (`python3 servidor.py 7261 cert-nome.pem chave-nome.pem N` ou `python3 servidor.py 7261 cert-exp.pem chave-exp.pem E`), e chamamos com `curl --cacert cert-nome.pem https://localhost:7261/` (ou `cert-exp.pem`). Mensagens obtidas:

| Situação | `curl` | Python `requests` | Node.js |
|---|---|---|---|
| Nome diferente | `SSL: no alternative certificate subject name matches target host name 'localhost'` | `certificate verify failed: Hostname mismatch, certificate is not valid for 'localhost'.` | `ERR_TLS_CERT_ALTNAME_INVALID` |
| Certificado expirado | `SSL certificate problem: certificate has expired` | `certificate verify failed: certificate has expired` | `CERT_HAS_EXPIRED` |

Nos dois casos, o cliente tinha recebido o certificado do servidor como certificado de confiança (ele era autoassinado, como A): só a propriedade testada causava o problema, e um cliente com verificação desligada (`curl -k`) aceita sem reagir, seja o nome errado ou o certificado expirado (testado nos dois casos).

## O mesmo desligamento em cada ferramenta

Cada ferramenta tem o seu nome para a mesma ideia. A tabela indica também **até onde vai** o desligamento, porque o seu alcance muda o tamanho do estrago:

| Ferramenta | Escrita que desliga | Alcance | Escrita segura no lugar |
|---|---|---|---|
| `curl` | `curl -k` ou `curl --insecure` | Uma chamada | `curl --cacert arquivo.pem` ([manual do curl](https://curl.se/docs/manpage.html)) |
| Python `requests` | `requests.get(url, verify=False)` | Uma chamada | `verify="arquivo.pem"` ([documentação do requests](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification)) |
| Python (módulo `ssl`) | `contexto.check_hostname = False` depois `contexto.verify_mode = ssl.CERT_NONE` | Todas as chamadas que usam esse contexto | `ssl.create_default_context(cafile="arquivo.pem")` ([módulo `ssl`](https://docs.python.org/3/library/ssl.html)) |
| Node.js (variável) | `NODE_TLS_REJECT_UNAUTHORIZED=0` | **Todo o processo** | `NODE_EXTRA_CA_CERTS=arquivo.pem` ([opções do Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)) |
| Node.js (código) | `https.get({ rejectUnauthorized: false })` | Uma chamada (ou um agente compartilhado) | A opção `ca: conteúdo do certificado` da mesma requisição, lido por exemplo com `fs.readFileSync("arquivo.pem")` ([módulo `https`](https://nodejs.org/api/https.html)) |
| PHP, extensão cURL | `CURLOPT_SSL_VERIFYPEER` como `false` e `CURLOPT_SSL_VERIFYHOST` como `0` | Uma chamada | `CURLOPT_CAINFO` (o arquivo de CA, veja [`curl_setopt`](https://www.php.net/curl_setopt)) |
| PHP, fluxos | `'ssl' => ['verify_peer' => false]` | Uma chamada | `'cafile'` (veja [`verify_peer` em PHP](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verificar-o-certificado-do-servidor-remoto)) |
| Guzzle (PHP) | `'verify' => FALSE` | Uma chamada, ou **todas** se definido na configuração comum | `'verify' => '/caminho/ca.pem'` ([opções do Guzzle](https://docs.guzzlephp.org/en/stable/request-options.html#verify)) |

As escritas em Python (`verify=False`, `check_hostname`, `CERT_NONE`, `cafile`), Node.js (`rejectUnauthorized`, `ca`, as duas variáveis) e PHP cURL podem todas ser testadas contra o servidor do laboratório. O servidor A foi encerrado no fim da etapa 6: primeiro o relançamos, com o mesmo comando da etapa 2.

```bash
# relança o servidor A, limitado a 120 segundos, e guarda o número do processo
timeout 120 python3 servidor.py 7261 cert-a.pem chave-a.pem A > registro-a3.txt &
PID_A=$!
# espera um segundo para que o servidor esteja pronto para escutar
sleep 1
```

Exemplo da linha « módulo `ssl` », que deve desligar primeiro o controle do **nome** e depois o da **cadeia** (senão o Python recusa alterar o contexto). Salvo em `cliente-ssl.py`, ele roda com `python3 cliente-ssl.py` (`urllib.request` é a biblioteca HTTP fornecida com o Python, [documentação](https://docs.python.org/3/library/urllib.request.html)):

```python
# ssl : o módulo Python de TLS ; urllib.request : um cliente HTTP que vem com o Python
import ssl
import urllib.request

# contexto padrão : verifica a cadeia e o nome
contexto = ssl.create_default_context()
# primeira tentativa : a verificação continua ativa
try:
    urllib.request.urlopen("https://localhost:7261/", context=contexto)
except Exception as erro:
    # mostra o motivo da recusa
    print("RECUSADO:", erro.reason.verify_message)
# desliga a verificação do nome, depois a da cadeia (nesta ordem)
contexto.check_hostname = False
contexto.verify_mode = ssl.CERT_NONE
# segunda tentativa : a conexão funciona
resposta = urllib.request.urlopen("https://localhost:7261/", context=contexto)
# mostra o texto recebido
print(resposta.read().decode().strip())
```

```
RECUSADO: self-signed certificate
resposta do servidor A
```

E o equivalente em PHP com a extensão cURL, salvo em `cliente.php`, que mostra os três casos (padrão, desligada, confiança dada). A sintaxe básica do PHP (variáveis com `$`, funções) está em [as variáveis PHP](/?c=langages&s=php&p=variables) e [as funções PHP](/?c=langages&s=php&p=methodes); `===` e o ternário `? :` estão em [as condições PHP](/?c=langages&s=php&p=conditions):

```php
<?php
// $verificacao : null mantém a verificação padrão, false a desliga,
// um caminho de arquivo dá este certificado de confiança
// string $endereco : o parâmetro deve ser um texto ; : void : a função não devolve nada
function chamar(string $endereco, $verificacao): void
{
    // curl_init prepara uma chamada ao endereço dado
    $chamada = curl_init($endereco);
    // CURLOPT_RETURNTRANSFER : curl_exec devolve o texto recebido em vez de exibi-lo
    curl_setopt($chamada, CURLOPT_RETURNTRANSFER, true);
    // === : igual E do mesmo tipo (0 === false é falso, enquanto 0 == false é verdadeiro)
    if ($verificacao === false) {
        // desliga a verificação da cadeia de certificados
        curl_setopt($chamada, CURLOPT_SSL_VERIFYPEER, false);
        // desliga a verificação do nome (0 : não compara o nome do certificado)
        curl_setopt($chamada, CURLOPT_SSL_VERIFYHOST, 0);
    } elseif ($verificacao !== null) {
        // CURLOPT_CAINFO : o arquivo dos certificados de confiança para esta chamada
        curl_setopt($chamada, CURLOPT_CAINFO, $verificacao);
    }
    // executa a chamada : devolve false em caso de falha
    $texto = curl_exec($chamada);
    // condição ? a : b (ternário) vale a se a condição for verdadeira, senão b
    // . junta dois textos ; trim retira os espaços do fim ; "\n" : quebra de linha
    // exibe portanto o texto recebido, ou a mensagem de erro do cURL
    echo $texto === false ? 'RECUSADO: ' . curl_error($chamada) : trim($texto), "\n";
}

// sem opção : a verificação continua ativa por padrão
chamar('https://localhost:7261/', null);
// com false : a verificação é desligada
chamar('https://localhost:7261/', false);
// $argv : os argumentos da linha de comando ; $argv[1] é o primeiro (o arquivo)
chamar('https://localhost:7261/', $argv[1]);
```

O servidor A relançado para o exemplo anterior ainda roda se tiver menos de 120 segundos; senão, o `timeout` o encerrou. Este comando só o relança se ele estiver parado:

```bash
# não encerra nada : apenas testa se o processo ainda existe
# || : se esse teste falhar, o bloco entre chaves relança o servidor A
kill -0 $PID_A 2>/dev/null || {
  # mesmo comando de lançamento da etapa 2
  timeout 120 python3 servidor.py 7261 cert-a.pem chave-a.pem A > registro-a4.txt &
  # guarda o novo número do processo, depois espera um segundo
  PID_A=$!; sleep 1
}
```

```bash
# contra o servidor A : o argumento é o arquivo do certificado de confiança
php cliente.php cert-a.pem
# encerra o servidor A ao fim do laboratório
# (2>/dev/null oculta o erro se ele já estiver parado)
kill $PID_A 2>/dev/null
```

```
RECUSADO: SSL certificate problem: self-signed certificate
resposta do servidor A
resposta do servidor A
```

| Chamada | Resultado |
|---|---|
| `chamar(..., null)` (verificação padrão) | Recusada: o certificado é autoassinado |
| `chamar(..., false)` (desligada) | Aceita |
| `chamar(..., 'cert-a.pem')` (confiança dada ao A) | Aceita |

## Um exemplo em um framework PHP: Drupal e Guzzle

> **Exemplo ilustrativo de um framework.** Ele mostra como o desligamento se escreve em um projeto real; os endereços e nomes são inventados, os nomes de API são verificados no código-fonte do Drupal 11.x.

**Drupal** ([drupal.org](https://www.drupal.org/)) é um **CMS** (*content management system*, sistema de gestão de conteúdo: um programa para construir e administrar um site) escrito em [PHP](/?c=langages&s=php&p=php). Ele também é um **framework**: uma caixa de ferramentas de código já escrito, sobre a qual se constrói um site sob medida. Ele oferece um serviço que devolve um **cliente HTTP** (um [objeto](/?c=langages&s=php&p=poo) que envia requisições), baseado no **Guzzle**, a biblioteca PHP de referência para isso (uma **biblioteca** é um conjunto de código reutilizável escrito por outros; veja [a documentação dela](https://docs.guzzlephp.org/en/stable/)). Uma chamada a uma API parceira se escreve assim:

```php
<?php
// serviço de um framework que devolve um cliente HTTP (aqui, um cliente Guzzle)
// \Drupal::httpClient() : :: chama a função httpClient ligada à classe \Drupal
$cliente = \Drupal::httpClient();
// $cliente->get(...) : -> chama o método get do objeto $cliente (uma requisição GET)
// [ 'chave' => valor, ... ] é um array de opções : => associa um valor a um nome
// PERIGOSO : 'verify' => FALSE desliga toda a verificação TLS para esta chamada
$resposta = $cliente->get('https://api.parceiro.example/clientes', [
  'verify' => FALSE,
  'timeout' => 10,
]);
// lê o corpo da resposta ; (string) converte em texto
$texto = (string) $resposta->getBody();
```

A linha `'verify' => FALSE` é a que se encontra, copiada de um fórum ou de um projeto antigo, quando a API parceira apresenta um certificado que faz a chamada falhar. Ela faz o mesmo que `curl -k`: nenhum controle da cadeia nem do nome. O capítulo [Fazer chamadas HTTP nativamente](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verificar-o-certificado-do-servidor-remoto) apresenta a mesma ideia com `verify_peer`.

Duas variantes agravantes, frequentes nesse tipo de projeto:

| Variante | Por que é pior |
|---|---|
| A opção definida na **configuração comum** das chamadas de saída do framework | Ela desliga a verificação para todos os módulos do site, inclusive os de terceiros, inclusive para chamadas que transportam segredos |
| A opção definida **condicionalmente** (« só se o ambiente for o de desenvolvimento ») mas a condição lê uma variável que a produção também define | O desligamento chega à produção sem que ninguém o tenha querido |

O que este exemplo deveria fazer no lugar: veja [as boas soluções](#as-boas-solucoes). No caso do Guzzle, `'verify'` aceita `TRUE` (o padrão, verificação ativa), `FALSE` (desligada) ou **o caminho de um arquivo** de CA de confiança. Segundo a [documentação](https://docs.guzzlephp.org/en/stable/faq.html), o Guzzle usa o cURL quando a extensão está disponível, mas não depende dele. Com o seu gerenciador cURL, `'verify' => FALSE` define `CURLOPT_SSL_VERIFYPEER` como falso e `CURLOPT_SSL_VERIFYHOST` como 0, as duas opções da linha « PHP, extensão cURL » da tabela anterior; com o seu gerenciador de fluxo PHP, são outras opções (`verify_peer` e `verify_peer_name`). Este exemplo não roda no laboratório: ele exige Drupal e Guzzle instalados.

## As boas soluções

A regra geral: **corrigir a causa do erro, não suprimi-lo**. Cada caso da tabela « Por que somos tentados » tem uma resposta:

| Causa do erro | Solução durável |
|---|---|
| Certificado autoassinado em desenvolvimento | Dar **este** certificado ao cliente como certificado de confiança (`--cacert`, `verify="arquivo.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`), exatamente como no laboratório. Para a máquina de um desenvolvedor, uma ferramenta como [mkcert](https://github.com/FiloSottile/mkcert) cria uma pequena CA local que o sistema aceita, evitando multiplicar as exceções. Node.js traz sua própria lista de CAs e nem sempre lê a do sistema: é preciso lhe dar a CA local com `NODE_EXTRA_CA_CERTS` (veja [a documentação do Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)); o `requests` pode ler a lista do sistema ou a sua própria, conforme a instalação |
| Certificado expirado | **Renovar**, e sobretudo **automatizar** a renovação: a [Let's Encrypt](https://letsencrypt.org/docs/) emite gratuitamente certificados de uma CA reconhecida, renováveis por um programa graças ao protocolo **ACME** (uma troca padronizada entre o servidor e a CA) |
| Nome que não corresponde | Chamar o servidor **pelo nome do certificado**, ou obter um certificado que contenha o nome realmente usado (o SAN) |
| Proxy corporativo que reemite os certificados | Acrescentar a **CA do proxy** (fornecida pela equipe de TI) ao repositório de confiança da ferramenta, em vez de desligar tudo. Com `NODE_EXTRA_CA_CERTS`, ela se acrescenta; com `--cacert` ou `verify=`, o arquivo substitui a lista (veja [acrescentar ou substituir](#acrescentar-ou-substituir-o-que-faz-cada-opcao-de-confianca)): é preciso então copiar nele também as CAs públicas |
| Repositório de confiança antigo | Atualizar o pacote de CAs do sistema ou da imagem do contêiner |
| Chamada a um parceiro que apresenta um certificado fixo conhecido | **Fixar** a impressão digital dele, além da verificação normal |

### Fixar: o que isso traz e o que custa

| | Benefício | Custo |
|---|---|---|
| **Fixação da chave pública** (como na etapa 6) | Mesmo uma CA mal-intencionada ou comprometida não consegue se passar pelo servidor | Se o servidor trocar de chave (renovação, incidente), todos os clientes fixados **param de funcionar** até que a impressão digital seja atualizada |
| **Fixar a chave e não o certificado inteiro** | Uma renovação que mantém a mesma chave continua aceita | É preciso conferir que o servidor mantém a chave |
| **Prever uma impressão digital de reserva** | Uma segunda chave, gerada antecipadamente e guardada em segurança, evita a pane no dia da troca | Um segredo a mais para guardar (veja [gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

A fixação convém a um cliente e a um servidor que controlamos (um aplicativo móvel que conversa com a própria API, dois serviços de uma mesma equipe). Convém mal a um site público de terceiros cujas chaves e renovações não controlamos.

### Nunca levar a opção desligada para a produção

Mesmo quando um desligamento é aceitável por algum tempo em uma máquina de desenvolvimento, ele não pode chegar à produção:

| Regra | Como aplicar |
|---|---|
| A verificação é **ativa por padrão** | Nunca escrever `verify=False` fixo no código: ler o ajuste na configuração, cujo padrão é « verificar » |
| O desenvolvimento não precisa do desligamento | Dar o certificado local de confiança (acima) em vez de um interruptor |
| Uma configuração de desligamento, se existir, **se recusa a iniciar** em produção | O programa para com uma mensagem clara se o ambiente for a produção e a verificação estiver desligada: é o princípio de [falhar de forma segura](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise#falhar-de-forma-segura-fail-securely) |
| Os avisos da linguagem **não** são silenciados | Não filtrar o aviso (por exemplo com `urllib3.disable_warnings` em Python, a função do `urllib3` que silencia esse aviso): ele é o último alarme |
| O segredo que passa por essa conexão é tratado como exposto | Se a verificação foi desligada em produção, renovar o token que transitou (veja [gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

### Detectar o defeito: revisão e análise estática

Esse defeito é fácil de achar, porque se escreve com padrões reconhecíveis. Na **revisão de código** (releitura por outro desenvolvedor antes da fusão), procuram-se esses padrões nas alterações. Uma **análise estática** (*SAST*, que lê o código sem executá-lo, veja [SAST: analisar o código sem executá-lo](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite#sast-analisar-o-codigo-sem-executa-lo)) pode procurá-los automaticamente a cada alteração, por exemplo em um [pipeline de integração contínua](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd). Uma regra de partida bem simples é um `grep` (a busca de texto do terminal), testada aqui em uma pequena pasta de exemplo que contém um arquivo por padrão, mais um arquivo correto:

```bash
# -r : todos os arquivos da pasta ; -n : mostra o número da linha ; -E : padrões estendidos
# -i : ignora maiúsculas e minúsculas (FALSE ou false) ; cada | separa um padrão
# \ no fim da linha : o comando continua ; o detalhe dos símbolos está na tabela
grep -rnE -i "verify[\"']?\s*(=>|=|:)\s*false|rejectUnauthorized\s*:\s*false|\
NODE_TLS_REJECT_UNAUTHORIZED|CURLOPT_SSL_VERIFY(PEER|HOST)|(^|\s)(-k|--insecure)(\s|$)|\
CERT_NONE|check_hostname\s*=\s*False|verify_peer" exemplo
```

```
exemplo/src/chamada.js:1:process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
exemplo/src/agente.js:1:const agente = { rejectUnauthorized: false };
exemplo/src/legado.php:1:curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
exemplo/src/Chamada.php:1:$cliente->get($url, ["verify" => FALSE]);
exemplo/src/cliente.py:1:resposta = requests.get(url, verify=False)
exemplo/src/backup.sh:1:curl -k https://interno.example/api
```

Os símbolos desses padrões são [expressões regulares](/?c=langages&s=python&p=regex-en-python):

| Símbolo | Significado | Exemplo no padrão |
|---|---|---|
| `\s*` | zero ou mais espaços (`\s` : um espaço, uma tabulação) | `verify\s*=` encontra `verify=` e `verify  =` |
| `["']?` | uma aspa dupla ou simples, ou nada (`?` : zero ou uma vez) | `"verify"` ou `verify` |
| `(=>\|=\|:)` | um dos três sinais `=>`, `=` ou `:` (aqui `\|` : « ou ») | `verify=false`, `'verify' => false` |
| `(PEER\|HOST)` | uma das duas palavras | `CURLOPT_SSL_VERIFYPEER` ou `...VERIFYHOST` |
| `(^\|\s)` e `(\s\|$)` | início de linha ou espaço, fim de linha ou espaço (`^` : início, `$` : fim) | `-k` sozinho, mas não o `-k` colado em `arquivo-k8s` |

Os seis padrões desligados são encontrados; o arquivo correto (`verify=True`) não é. O padrão `verify_peer` encontraria também um valor em `true` (um falso alarme a ser lido à mão). E cada resultado é apenas um **indício**: é preciso ler a linha para saber se ela vale `false` em produção. Uma regra de pipeline que bloqueia a fusão quando o padrão aparece, com uma exceção documentada caso a caso (por exemplo um teste que aponta para um servidor local), é mais confiável do que um lembrete oral.

Por fim, três indícios de execução que não devem ser ignorados: o `InsecureRequestWarning` do Python, o aviso do Node.js sobre `NODE_TLS_REJECT_UNAUTHORIZED`, e qualquer programa que aceite um certificado que um navegador recusaria.

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| « É só desenvolvimento » | A opção se copia, é aprovada na revisão e vai para a produção; o código de desenvolvimento vira código de produção | Dar o certificado local ao cliente de confiança, sem interruptor no código |
| Achar que `verify=False` desliga a criptografia | A conversa continua criptografada: a armadilha é se achar protegido quando talvez se esteja falando com um impostor | Lembrar que o desligamento suprime a prova de identidade, não a criptografia |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` em um arquivo de configuração ou em um contêiner | Desliga a verificação de **todas** as chamadas do processo, bibliotecas de terceiros inclusive | Usar `NODE_EXTRA_CA_CERTS` |
| Opção definida na configuração comum de um framework | Todos os módulos e todas as chamadas de saída são afetados, inclusive as que transportam segredos | Nenhum desligamento global; se preciso, uma CA de confiança global |
| Silenciar o aviso (`disable_warnings`) | O aviso é o único sinal que resta | Corrigir a causa, jamais o alarme |
| Desligar só o controle do nome (`verify_peer_name`, `check_hostname`) | Um certificado válido de **outro** site é aceito no lugar do correto | Corrigir o nome ou o certificado |
| Fixar o certificado inteiro sem plano de renovação | No dia em que o certificado mudar, todos os clientes caem | Fixar a chave, prever uma impressão digital de reserva |
| Achar que um certificado autoassinado criptografa pior | A criptografia é a mesma; só falta a prova de identidade | Dar esse certificado em confiança ao cliente em questão |
| Chamadas de servidor para servidor sem humano para ver um alerta | Nenhum aviso visível, ninguém desiste | Recusar em produção qualquer configuração com verificação desligada |
| Não renovar o token que passou por uma conexão não verificada | Um token já lido por um terceiro continua válido | Renová-lo depois de corrigir a conexão |

## Boas práticas

| Boa prática | Por que |
|---|---|
| Deixar a verificação ativa em todo lugar, e corrigir a causa do erro | Um erro de verificação é um diagnóstico: ele diz exatamente o que não vai bem (cadeia, nome, data) |
| Dar ao cliente o certificado ou a CA de confiança (`--cacert`, `verify="arquivo.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`) | A confiança é precisa e limitada ao que se conhece |
| Automatizar a renovação dos certificados com a Let's Encrypt ou a ferramenta da organização | Um certificado expirado não deve mais derrubar ninguém |
| Acrescentar a CA de um proxy corporativo ao repositório de confiança (sem perder as CAs públicas) em vez de desligar tudo | O proxy é de confiança, não um qualquer |
| Fixar a chave pública para um cliente e um servidor que controlamos, com uma impressão digital de reserva | Mesmo uma CA comprometida não consegue se passar pelo servidor |
| Ler o ajuste de verificação na configuração, « verificar » por padrão, e recusar iniciar em produção se estiver desligado | Um desligamento não pode chegar à produção por acidente |
| Procurar os padrões de desligamento na revisão de código e em um pipeline (análise estática, `grep`) | O defeito se escreve com padrões reconhecíveis |
| Manter os avisos da linguagem visíveis | É o último sinal se o desligamento passar mesmo assim |
| Renovar os segredos que passaram por uma conexão não verificada | Um terceiro pode tê-los lido |

## O que reter

| | |
|---|---|
| **Para lembrar** | O TLS traz a confidencialidade, a integridade **e** a prova da identidade do servidor; só a verificação do certificado (cadeia até uma CA de confiança, nome, datas) traz a última. `curl -k`, `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0` e `verify => FALSE` não desligam a criptografia, mas essa prova: um terceiro colocado entre o cliente e o servidor (DNS corrompido, Wi-Fi, proxy) apresenta o próprio certificado, e lê ou altera tudo, sem que o cliente perceba nada. O laboratório mostrou isso: um segundo servidor, com um certificado diferente, leu um token enviado pelo cliente com verificação desligada, e foi recusado pelo cliente que conhecia o certificado correto. A boa resposta corrige a causa: dar o certificado de confiança (`--cacert`, `verify="arquivo.pem"`, `NODE_EXTRA_CA_CERTS`), renovar e automatizar (Let's Encrypt), corrigir o nome, acrescentar a CA do proxy, fixar uma chave. |
| **Armadilhas a evitar** | « É só desenvolvimento »; uma variável de ambiente ou uma configuração comum que desliga todo o processo ou todo o site; silenciar o aviso; desligar só o controle do nome; fixar sem impressão digital de reserva; não renovar um token que passou por uma conexão não verificada. |
| **Boas práticas** | Verificação ativa por padrão e lida na configuração; certificado ou CA dados ao cliente em vez de desligar tudo; renovação automática dos certificados; recusa de iniciar em produção se a verificação estiver desligada; busca dos padrões de desligamento na revisão de código e por análise estática; avisos da linguagem mantidos visíveis. |
