---
order: 12
---

# Testar uma interface em um navegador sem janela (29/10/2026)

Um **navegador** é o software que exibe as páginas web (Chrome, Firefox, Safari...). A **interface** de uma aplicação web é o que o usuário vê e manipula: botões, campos, textos. Testar uma interface é abrir a página em um navegador de verdade, clicar e digitar no lugar de uma pessoa e, em seguida, verificar o que aparece. Este capítulo faz isso com um navegador **sem janela** (em inglês *headless*, « sem cabeça »): um navegador de verdade, com seu motor completo (ele carrega a página, executa o seu JavaScript, calcula o layout), mas que não desenha nada na tela e que só é controlado por programa.

O controle é feito por uma **bancada de testes** escrita à mão: uma pequena ferramenta que inicia o navegador, executa os testes, sinaliza as falhas e arruma tudo depois. Ela conversa com o navegador pelo **Chrome DevTools Protocol** (*CDP*, « protocolo das ferramentas do desenvolvedor do Chrome »; um **protocolo** é um conjunto de regras que definem como dois programas dialogam) e cabe em cerca de 220 linhas de JavaScript. Escrever essa bancada uma vez permite entender o que fazem, no seu lugar, as ferramentas prontas como [Playwright](https://playwright.dev/docs/intro) e [Puppeteer](https://pptr.dev/), comparadas [mais abaixo](#playwright-puppeteer-ou-uma-bancada-caseira).

Este capítulo complementa [os testes end-to-end](/?c=tests&p=tests-end-to-end), que explicam **por que** e **quando** simular um percurso completo do usuário: aqui, vemos **como** fazê-lo funcionar na prática. Ele pressupõe conhecidos [o terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam comandos), [as tags e os atributos HTML](/?c=langages&s=html&p=structure-dun-document), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions), [o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements) (a página vista como uma árvore de elementos que o JavaScript manipula), [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) (`async`, `await` e as promessas: operações cujo resultado chega mais tarde) e [o tratamento de erros](/?c=langages&s=javascript&p=gestion-des-erreurs) (`try`, `catch`, `finally`).

| Etapa da bancada | O que acontece | Seção |
|---|---|---|
| 1. Iniciar | O Chrome começa sem janela, com um **perfil** novo (a pasta das suas configurações) e uma **porta de depuração** aberta (uma porta numerada pela qual o controlamos) | [Iniciar o Chrome sem janela](#iniciar-o-chrome-sem-janela) |
| 2. Conectar | O teste abre uma conexão [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) (um canal que permanece aberto) com a página | [O CDP](#o-cdp-comandos-json-enviados-por-websocket) |
| 3. Agir | O teste envia comandos: navegar, clicar, digitar | [A bancada, peça por peça](#a-bancada-peca-por-peca) |
| 4. Aguardar | O teste espera até o estado desejado, sem pausa fixa | [Aguardar um estado](#aguardar-um-estado-em-vez-de-dormir-um-atraso-fixo) |
| 5. Verificar | O teste lê a página e compara com o que era esperado | [Ler a página e escrever as asserções](#ler-a-pagina-e-escrever-as-assercoes) |
| 6. Diagnosticar e fechar | Uma captura de imagem é feita em caso de falha, depois o Chrome é fechado | [Capturar uma imagem](#capturar-uma-imagem-para-diagnosticar-uma-falha) |

## Por que um navegador sem janela

Para verificar que uma página funciona, existem três abordagens. Uma **requisição HTTP** (o pedido que um programa envia a um servidor para obter um arquivo, veja [a API e o HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) só recupera o texto da página: nenhum JavaScript é executado, portanto nenhum botão reage. Um navegador com janela faz tudo, mas exige uma tela. O navegador sem janela faz tudo, sem tela.

| | Requisição HTTP apenas | Navegador sem janela | Navegador com janela |
|---|---|---|---|
| Executa o JavaScript da página | Não | Sim | Sim |
| Calcula o layout, como para o usuário | Não | Sim | Sim |
| Precisa de uma tela | Não | Não | Sim |
| Pode rodar em um servidor sem tela | Sim | Sim | Somente se a máquina fornecer uma tela, mesmo fictícia |
| Uma pessoa pode vê-lo ao vivo | Não se aplica | Não: tiram-se capturas de imagem | Sim |
| Uso típico | Verificar que um endereço responde | Testes automáticos | Entender um teste ao vê-lo |

Três razões concretas motivam essa escolha.

| Motivo | Explicação |
|---|---|
| Servidor de integração contínua | A **integração contínua** (CI) é um serviço que executa os testes automaticamente a cada alteração do código (veja [o pipeline CI/CD](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd)). Suas máquinas geralmente não têm tela: o navegador precisa poder iniciar sem uma |
| Rapidez | Nenhuma janela para desenhar ou gerenciar. Na máquina de redação: o Chrome responde na sua porta 0,65 a 0,84 s após o início (quatro tentativas), e seis testes duram de 0,33 a 0,76 s cada um, ou cerca de 2,5 s no total |
| Reprodutibilidade | Um perfil novo (nenhuma extensão, nenhuma configuração pessoal) e um tamanho de página fixo dão o mesmo resultado em cada máquina. O navegador habitual do usuário nunca é tocado |

## O que ter à mão

**Node** (ou Node.js) é um programa que executa JavaScript fora de um navegador, a partir de um terminal ([documentação oficial](https://nodejs.org/docs/latest/api/)). A bancada é escrita em Node, apenas com as ferramentas fornecidas de origem: nenhum pacote para instalar (um **pacote** é um conjunto de código escrito por outros, que você baixa para usar).

| Elemento | Função | Como verificar |
|---|---|---|
| Google Chrome | O navegador controlado | O arquivo existe no seu local (tabela seguinte) |
| Node, versão recente | Executa a bancada e os testes | `node --version` mostra um número de versão |
| O `WebSocket` integrado ao Node | Conversar com o navegador sem pacote extra | `node -e "console.log(typeof WebSocket)"` mostra `function` (verificado em 29/10/2026) |
| Um terminal | Executar os comandos | Veja [o terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) |
| Uma pasta de trabalho | Recebe os três arquivos do capítulo: `contador.html`, `bancada.mjs`, `testes.mjs` | Qualquer pasta vazia |

Se `typeof WebSocket` mostrar `undefined`, a versão do Node é antiga demais: é preciso atualizá-la.

A bancada lê o caminho do Chrome em uma **variável de ambiente** chamada `CHROME_PATH` (um valor que o terminal transmite a cada programa que inicia, veja [as variáveis de ambiente em Bash](/?c=langages&s=bash&p=variables-denvironnement) e [no PowerShell](/?c=langages&s=powershell&p=variables-denvironnement)). Assim, o mesmo código funciona em todas as máquinas: só a variável muda.

| Sistema | Local habitual do Chrome |
|---|---|
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` (varia conforme a distribuição) |

```bash
# Bash (Git Bash, o terminal instalado com o Git no Windows, ou o de Linux e macOS)
# export cria uma variável para os programas iniciados depois; no Git Bash, as barras
# normais / substituem as barras invertidas \
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

```powershell
# PowerShell: $env:NOME = valor cria a variável para os programas iniciados depois
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Apenas o local do Windows foi verificado durante a redação (29/10/2026): confira os outros dois na sua máquina.

## A página a testar

Para praticar sem depender de um site existente, aqui está uma pequena página: um contador, um campo « passo » (de quanto o contador aumenta), três botões e uma área de mensagem. Ela contém duas lentidões propositais, que imitam uma aplicação real: seus botões só respondem 300 ms após o carregamento, e « Salvar » leva 400 ms para confirmar, como faria um servidor.

Salve este código com o nome `contador.html`.

```html
<!DOCTYPE html>
<!-- lang="pt-BR": a página está escrita em português do Brasil -->
<html lang="pt-BR">
<head>
    <!-- charset: a codificação, para que « ç » e « ã » apareçam corretamente -->
    <meta charset="utf-8">
    <!-- title: o título da página, que os testes podem ler com document.title -->
    <title>Contador</title>
</head>
<body>
    <h1>Contador</h1>
    <!-- output: exibe um resultado; data-testid: marcador estável para os testes -->
    <p>Valor: <output id="valor" data-testid="valor">0</output></p>
    <!-- O campo « passo »: de quanto o contador aumenta a cada adição -->
    <label>Passo: <input id="passo" type="text" value="1"></label>
    <!-- Três botões; type="button": eles não enviam nenhum formulário -->
    <button id="adicionar" type="button">Adicionar</button>
    <button id="zerar" type="button">Zerar</button>
    <button id="salvar" type="button">Salvar</button>
    <!-- role="status": área cujo texto muda para informar o usuário -->
    <p id="situacao" role="status"></p>
    <script>
        // Total do contador e acesso aos elementos da página
        let total = 0;
        const valor = document.getElementById("valor");
        const passo = document.getElementById("passo");
        const situacao = document.getElementById("situacao");

        // Soma o passo ao total (0 se o campo não contiver um número) e o exibe
        function adicionar() {
            total += Number(passo.value) || 0;   // Number converte o texto em número
            valor.textContent = total;           // exibe o novo total
        }

        // Liga os botões e o teclado, depois anuncia que a página está pronta
        function iniciar() {
            // Um clique em « Adicionar » chama a função adicionar
            document.getElementById("adicionar").addEventListener("click", adicionar);
            // Um clique em « Zerar » devolve o total a 0
            document.getElementById("zerar").addEventListener("click", () => {
                total = 0;                       // o total recomeça do zero
                valor.textContent = total;       // e a exibição também
            });
            // Um clique em « Salvar » exibe primeiro uma mensagem de espera
            document.getElementById("salvar").addEventListener("click", () => {
                situacao.textContent = "Salvando...";
                // Simula um servidor lento: a resposta chega 400 ms depois
                setTimeout(() => {
                    situacao.textContent = "Salvo: " + total;
                }, 400);
            });
            // A tecla Enter no campo « passo » age como um clique em Adicionar
            passo.addEventListener("keydown", (evento) => {
                if (evento.key === "Enter") adicionar();
            });
            document.body.dataset.pronto = "sim";   // marcador lido pelos testes
        }

        // Simula uma inicialização lenta: setTimeout chama iniciar após 300 ms,
        // então os botões só respondem a partir desse momento
        setTimeout(iniciar, 300);
    </script>
</body>
</html>
```

Os testes designam os elementos por **seletores CSS**: a escrita que designa um elemento da página, como em [os seletores CSS](/?c=langages&s=css&p=selecteurs). `#valor` designa o elemento cujo `id` é `valor`; `[data-testid="valor"]` designa aquele cujo atributo `data-testid` vale « valor » (veja [os atributos `data-`](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Os testes se apoiam nestes marcadores:

| Marcador | Elemento | Comportamento |
|---|---|---|
| `#valor` | O total exibido | Começa em `0` |
| `#passo` | O campo de entrada | Contém `1` no início; seu valor é somado a cada adição |
| `#adicionar` | Botão « Adicionar » | Soma o passo ao total (também pela tecla Enter em `#passo`) |
| `#zerar` | Botão « Zerar » | Devolve o total a `0` |
| `#salvar` | Botão « Salvar » | Exibe « Salvando... » e, 400 ms depois, « Salvo: » seguido do total |
| `#situacao` | Área de mensagem | Vazia no início |
| `data-pronto="sim"` no `<body>` | Marcador « a aplicação está pronta » | Colocado 300 ms após o carregamento |

O marcador `data-pronto` é um hábito útil: a aplicação diz por si mesma quando está pronta, o que evita adivinhar.

Uma página aberta por um endereço `file://` (um arquivo do disco, sem servidor) basta enquanto não carregar outros arquivos: veja [o servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) para os limites de `file://`.

## Iniciar o Chrome sem janela

Iniciar o Chrome equivale a iniciar um **processo**: um programa em execução, identificado por um número chamado **PID** (veja [o gerenciamento de processos em Bash](/?c=langages&s=bash&p=gestion-des-processus) e [no PowerShell](/?c=langages&s=powershell&p=gestion-des-processus)). Passam-se a ele **opções**: palavras que começam com `--` e regulam seu comportamento.

| Opção | Função |
|---|---|
| `--headless` | Inicia sem janela |
| `--remote-debugging-port=9333` | Abre uma **porta** de depuração. Uma porta é um número (de 0 a 65535) que distingue, em uma mesma máquina, os programas que aguardam conexões; `9333` é uma escolha arbitrária: qualquer número livre serve (veja [o servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) para `localhost` e as portas) |
| `--user-data-dir=<pasta>` | Indica o **perfil**: a pasta onde o navegador guarda suas configurações, seus **cookies** (pequenos arquivos pelos quais um site reconhece um visitante), seu histórico e suas **extensões** (pequenos programas acrescentados ao navegador). Uma pasta nova e vazia dá um Chrome « novinho em folha » e deixa intacto o do usuário |
| `--no-first-run` | Pula o assistente de primeira execução de um perfil novo |
| `--no-default-browser-check` | Não propõe se tornar o navegador padrão |
| `about:blank` | Endereço inicial: uma página vazia |

Na máquina de redação (29/10/2026), `--headless` sozinho basta e `--headless=new` também é aceito. O nome da opção e suas variantes mudam de uma versão do Chrome para outra: a [documentação oficial do modo sem janela](https://developer.chrome.com/docs/chromium/headless) prevalece, por isso a data no título deste capítulo. Um Chrome iniciado assim se anuncia como `HeadlessChrome` em seu identificador (seu *User-Agent*), o que foi verificado.

A bancada iniciará o Chrome ela mesma (seção [A bancada](#a-bancada-peca-por-peca)). Uma vez iniciado, o Chrome escuta a porta: é ele que servirá de guichê para o controle.

## O CDP: comandos JSON enviados por WebSocket

Um **protocolo** é um conjunto de regras de diálogo: quais mensagens podem ser enviadas, em que forma e em que ordem. HTTP é outro exemplo, veja [a API e o HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). O **Chrome DevTools Protocol** é o usado pelas ferramentas do desenvolvedor integradas ao Chrome (tecla F12) para dialogar com a página; o Chrome também o abre para programas ([documentação oficial](https://chromedevtools.github.io/devtools-protocol/)).

Duas tecnologias sustentam esse diálogo:

- o **WebSocket**, uma conexão que permanece aberta e na qual cada lado pode enviar mensagens quando quiser, detalhada em [WebSocket: a comunicação em tempo real](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel);
- o **JSON**, um formato de texto estruturado (`{ "chave": valor }`), detalhado em [o formato JSON](/?c=infrastructure-devops&s=infrastructure&p=json): cada mensagem é um pequeno texto JSON.

O Chrome também oferece um serviço HTTP minúsculo na mesma porta, para descobrir os endereços WebSocket. Eis o que `/json/version` respondeu na máquina de redação (os valores de versão são substituídos por `...`):

```text
{
  Browser: 'Chrome/...',
  'File-Path-Style': 'windows',
  'Protocol-Version': '...',
  'User-Agent': 'Mozilla/5.0 (...) AppleWebKit/... HeadlessChrome/... Safari/...',
  'V8-Version': '...',
  'WebKit-Version': '...',
  webSocketDebuggerUrl: 'ws://127.0.0.1:9333/devtools/browser/<identificador>'
}
```

`webSocketDebuggerUrl` é o endereço da conexão com o **navegador** em si. A lista dos **alvos** (páginas e outros elementos controláveis), no endereço `/json/list`, dá um endereço por alvo. Na máquina de redação, um Chrome novo listava cinco alvos, dos tipos `background_page`, `page`, `browser_ui`, `browser_ui` e `service_worker`: só o do tipo `page` é a página a controlar. Pegar o primeiro da lista seria um erro.

```text
  O teste (Node)              Chrome sem janela                   A página
  --------------              -------------------                 -------
       |                              |                              |
       | 1. GET /json/list (HTTP)     |                              |
       |----------------------------->|                              |
       |<-----------------------------|  endereços WebSocket         |
       |                              |                              |
       | 2. conexão WebSocket         |                              |
       |==============================|  (continua aberta)           |
       |                              |                              |
       | 3. {"id":1,"method":         |                              |
       |    "Page.navigate",...}      |  carrega contador.html       |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 4. {"id":1,"result":{...}}   |                              |
       |<-----------------------------|                              |
       |                              |                              |
       | 5. {"method":                |  a página carregou           |
       |    "Page.loadEventFired"}    |                              |
       |<-----------------------------|<-----------------------------|
       |                              |                              |
       | 6. {"id":2,"method":         |                              |
       |    "Runtime.evaluate",...}   |  executa JavaScript          |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 7. {"id":2,"result":         |  o valor calculado           |
       |    {"result":{"value":..}}}  |                              |
       |<-----------------------------|<-----------------------------|
```

A etapa 1 é uma requisição HTTP comum (`GET` significa « me dê este recurso »). Depois, tudo passa pela conexão WebSocket. Existem apenas três tipos de mensagem:

| Tipo | Enviada por | Contém | Reconhecível por |
|---|---|---|---|
| Comando | O teste | Um `id` escolhido pelo teste, um `method` (o nome do comando, na forma `Domínio.nome`) e `params` | A presença de `method` **e** de `id` |
| Resposta | O Chrome | O mesmo `id`, depois `result` (sucesso) ou `error` (falha) | A presença de `id` |
| Evento | O Chrome | Um `method` e `params`, nunca `id`: o Chrome avisa por conta própria | `method` **sem** `id` |

O `id` permite associar cada resposta ao seu comando, já que vários comandos podem estar em trânsito ao mesmo tempo. Eis mensagens reais trocadas na máquina de redação (as `<-` são recebidas pelo teste, as `->` enviadas; a primeira mensagem é cortada em duas linhas para caber na tela):

```text
-> {"id":101,"method":"Runtime.evaluate",
    "params":{"expression":"document.title","returnByValue":true}}
<- {"id":101,"result":{"result":{"type":"string","value":"Contador"}}}
-> {"id":102,"method":"Foo.bar"}
<- {"id":102,"error":{"code":-32601,"message":"'Foo.bar' wasn't found"}}
<- {"method":"Page.loadEventFired","params":{"timestamp":1283163.132011}}
```

Um comando desconhecido produz, portanto, uma resposta `error`. Mas atenção: uma expressão JavaScript que gera um erro **na página** não produz `error`. A resposta é um `result` que contém um campo `exceptionDetails` (observado com `document.title.comprimento.x`). A bancada abaixo verifica esse campo.

Os comandos usados neste capítulo:

| Comando | Função | Usado por |
|---|---|---|
| [`Page.navigate`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Ir para um endereço | `abrir` |
| [`Page.captureScreenshot`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Fotografar a página | `capturar` |
| [`Runtime.evaluate`](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/) | Executar JavaScript na página e devolver o valor | `avaliar` |
| [`Input.dispatchMouseEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simular o mouse (pressionar, soltar) | `clicar` |
| [`Input.dispatchKeyEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simular o teclado (tecla pressionada, depois solta) | `digitar`, `pressionarEnter` |
| [`Emulation.setDeviceMetricsOverride`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) | Fixar o tamanho da página | `conectarPagina` |
| `Runtime.enable`, `Page.enable` | Pedir para receber os eventos desses domínios | `conectarPagina` |
| [`Browser.close`](https://chromedevtools.github.io/devtools-protocol/tot/Browser/) | Fechar o navegador | `fecharNavegador` |

## A bancada, peça por peça

A bancada cabe em um arquivo `bancada.mjs`. A extensão `.mjs` indica ao Node que o arquivo é um **módulo**: um arquivo que pode importar ferramentas de outro (`import`) e oferecer ferramentas aos outros (`export`). Os blocos a seguir se juntam, em ordem, neste mesmo arquivo. Algumas construções JavaScript aparecem com frequência:

| Escrita | Significado | Exemplo da bancada |
|---|---|---|
| `texto ${valor} texto` | Um texto escrito entre crases no código, onde `${...}` insere um valor | `A porta ${porta} já está em uso` |
| `objeto?.propriedade` | Lê a propriedade se o objeto existir, senão dá `undefined` em vez de causar um erro | `detalhe.exception?.description` |
| `a ?? b` | Dá `b` se `a` valer `undefined` ou `null`, senão `a` | `detalhe.exception?.description ?? detalhe.text` |
| `{ ...objeto, chave: 1 }` | Copia todas as propriedades de um objeto para um novo | `{ type: "keyUp", ...tecla }` |
| `new Map()` | Uma tabela que associa uma chave (aqui, um número de comando) a um valor | `esperas` |
| `new Promise((aceitar, recusar) => ...)` | Fabrica uma promessa que você mesmo cumpre: `aceitar(valor)` a aceita, `recusar(erro)` a faz falhar | `enviar` |
| `(x) => x + 1` | Uma função seta: uma função escrita de forma abreviada | `(c) => c.type === "page"` |

### Os imports e o caminho do Chrome

```javascript
// O prefixo « node: » designa um módulo integrado ao Node (ferramentas prontas)
import { spawn } from "node:child_process";                  // inicia outro programa
import { existsSync } from "node:fs";                        // o arquivo existe?
import { mkdtemp, rm, writeFile } from "node:fs/promises";   // pastas e arquivos
import { tmpdir } from "node:os";                            // pasta temporária do sistema
import { join } from "node:path";                            // monta um caminho de arquivo
import net from "node:net";                                  // conexões de rede
import { setTimeout as pausa } from "node:timers/promises";  // pausa: uma promessa

export const PORTA = 9333;                     // porta de depuração desta bancada
const CHROME = process.env.CHROME_PATH;        // caminho do Chrome, dado pelo ambiente
```

### `aguardar`: esperar até que uma condição seja verdadeira

Esta função é a mais importante da bancada: ela substitui qualquer pausa fixa. Ela é explicada na seção [Aguardar um estado em vez de dormir um atraso fixo](#aguardar-um-estado-em-vez-de-dormir-um-atraso-fixo).

```javascript
// Tenta de novo condicao() até que ela devolva um valor verdadeiro, ou falha após o atraso
export async function aguardar(condicao, descricao, atraso = 5000) {
    const limite = Date.now() + atraso;        // horário (em ms) a não ultrapassar
    let ultimoErro = null;                     // último erro visto, para a mensagem final
    while (Date.now() < limite) {              // enquanto o atraso não tiver passado
        try {
            const valor = await condicao();    // testa a condição
            if (valor) return valor;           // verdadeira: devolve o que ela encontrou
        } catch (erro) {
            ultimoErro = erro;                 // ainda não está pronta: anota e tenta de novo
        }
        await pausa(50);                       // 50 ms de repouso antes da próxima tentativa
    }
    // A mensagem diz o que se esperava, e o último erro, se houve algum
    const detalhe = ultimoErro ? ` (último erro: ${ultimoErro.message})` : "";
    throw new Error(`Tempo esgotado (${atraso} ms): ${descricao}${detalhe}`);  // falha
}
```

### `portaLivre` e `iniciarNavegador`: iniciar o Chrome

`portaLivre` tenta se conectar à porta: se alguém responder, ela está ocupada. `iniciarNavegador` verifica o caminho do Chrome e a porta, cria uma pasta de perfil nova (`mkdtemp` acrescenta letras aleatórias a um nome inicial para torná-lo único), inicia o Chrome por `spawn` (que inicia um programa sem esperar o seu fim) e depois aguarda até que a porta dele responda. Para isso, `fetch` envia uma requisição HTTP (veja [a API e o HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) e devolve uma promessa da resposta; `resposta.ok` vale `true` quando o servidor respondeu com sucesso. `stdio: "ignore"` significa que as mensagens que o Chrome escreve são descartadas. A função devolve o necessário para fechar tudo depois.

```javascript
// Devolve true se ninguém escuta nesta porta da máquina
export function portaLivre(porta) {
    return new Promise((resolver) => {         // uma promessa: a resposta chegará depois
        const conexao = net.connect(porta, "127.0.0.1");   // tenta se conectar a esta porta
        conexao.on("connect", () => {          // conexão aceita: a porta está ocupada
            conexao.destroy();                 // fecha imediatamente
            resolver(false);                   // resposta: a porta não está livre
        });
        conexao.on("error", () => resolver(true));          // recusada: ninguém escuta
    });
}
```

```javascript
// Inicia o Chrome sem janela, com um perfil novo, e aguarda até que a porta dele responda
export async function iniciarNavegador(porta = PORTA) {
    // Duas verificações antes, para falhar com uma mensagem clara
    if (!CHROME || !existsSync(CHROME)) throw new Error(`CHROME_PATH inválido: ${CHROME}`);
    if (!(await portaLivre(porta))) throw new Error(`A porta ${porta} já está em uso`);
    const perfil = await mkdtemp(join(tmpdir(), "bancada-perfil-"));  // pasta nova e vazia
    const processo = spawn(CHROME, [           // inicia o Chrome com a lista de opções
        "--headless",                          // sem janela
        `--remote-debugging-port=${porta}`,    // abre a porta de depuração
        `--user-data-dir=${perfil}`,           // perfil descartável, nunca o de uma pessoa
        "--no-first-run",                      // sem assistente de primeira execução
        "--no-default-browser-check",          // não propõe ser o navegador padrão
        "about:blank",                         // página inicial: uma página vazia
    ], { stdio: "ignore" });                   // ignora as mensagens que o Chrome escreve
    // O Chrome leva um instante para iniciar: aguarda até que /json/version responda
    await aguardar(async () => {
        const resposta = await fetch(`http://127.0.0.1:${porta}/json/version`);   // pergunta
        return resposta.ok;                    // verdadeiro quando o Chrome responde
    }, "o Chrome não escuta sua porta de depuração", 10000);
    return { processo, perfil, porta };        // o necessário para fechá-lo depois
}
```

### `conectarPagina`: abrir a conversa com a página

Ela escolhe o alvo do tipo `page`, abre a conexão WebSocket e depois instala três coisas:

| Elemento | Função |
|---|---|
| `esperas` | Guarda, para cada `id` de comando enviado, a promessa que aguarda a sua resposta |
| `excecoes` | Coleta os erros JavaScript levantados na página (evento `Runtime.exceptionThrown`), para que o teste os veja |
| `enviar` | Envia um comando e devolve uma promessa da sua resposta: `await pagina.enviar("Page.navigate", ...)` |

Ela também fixa o tamanho da página em 800 × 600 pixels (um **pixel** é o menor ponto de uma tela): o motivo é explicado na seção [Capturar uma imagem](#capturar-uma-imagem-para-diagnosticar-uma-falha).

```javascript
// Conecta-se à página aberta e devolve um objeto « página » para falar com ela
export async function conectarPagina(porta = PORTA) {
    const alvo = await aguardar(async () => {
        const resposta = await fetch(`http://127.0.0.1:${porta}/json/list`);   // a lista
        const alvos = await resposta.json();   // o texto JSON vira uma lista de objetos
        return alvos.find((c) => c.type === "page");   // fica com a página de verdade
    }, "nenhuma página aberta");
    const ws = new WebSocket(alvo.webSocketDebuggerUrl);   // abre a conexão WebSocket
    await new Promise((aceitar, recusar) => {  // aguarda o estabelecimento da conexão
        ws.addEventListener("open", aceitar);  // aberta: tudo certo
        ws.addEventListener("error", () => recusar(new Error("conexão WebSocket recusada")));
    });
    let numero = 0;                            // número do último comando enviado
    const esperas = new Map();                 // número do comando -> resposta esperada
    const excecoes = [];                       // erros JavaScript ocorridos na página
    ws.addEventListener("message", (mensagem) => {
        const recebido = JSON.parse(mensagem.data);   // o texto recebido vira um objeto
        if (recebido.id !== undefined) {       // um « id »: é a resposta a um comando
            const espera = esperas.get(recebido.id);   // descobre quem estava esperando
            if (!espera) return;               // comando desconhecido desta bancada: ignora
            esperas.delete(recebido.id);       // esta resposta chegou: esquece-a
            if (recebido.error) espera.recusar(new Error(recebido.error.message)); // recusado
            else espera.aceitar(recebido.result);   // senão a promessa recebe o resultado
        } else if (recebido.method === "Runtime.exceptionThrown") {   // um evento de erro
            const detalhe = recebido.params.exceptionDetails;         // o detalhe do erro
            excecoes.push(detalhe.exception?.description ?? detalhe.text);   // guarda-o
        }
    });
    ws.addEventListener("close", () => {       // conexão perdida: nenhuma resposta mais
        for (const espera of esperas.values()) espera.recusar(new Error("conexão fechada"));
    });
    // Envia um comando CDP e devolve uma promessa da sua resposta
    function enviar(metodo, parametros = {}) {
        const id = ++numero;                   // número novo para este comando
        return new Promise((aceitar, recusar) => {
            esperas.set(id, { aceitar, recusar });   // guarda quem aguarda a resposta
            ws.send(JSON.stringify({ id, method: metodo, params: parametros }));   // envio
        });
    }
    await enviar("Runtime.enable");            // pede para receber os eventos de erro
    await enviar("Page.enable");               // e os da página
    await enviar("Emulation.setDeviceMetricsOverride", {   // fixa o tamanho da página:
        width: 800, height: 600, deviceScaleFactor: 1, mobile: false,   // 800 x 600 pixels
    });                                        // capturas idênticas em cada máquina
    return { enviar, excecoes, ws };           // objeto « página » usado pelas ferramentas
}
```

### `avaliar`, `abrir` e `textoDe`: ler e carregar

`avaliar` executa na página um texto de código JavaScript e devolve o seu valor; `returnByValue` pede o próprio valor (sem isso, o Chrome devolve uma referência a um objeto da página), `awaitPromise` aguarda o resultado de uma promessa. `abrir` distingue **dois tipos de « pronto »**: o navegador terminou de carregar a página (`document.readyState` vale `"complete"`), e a aplicação terminou de iniciar (o marcador `data-pronto` da página). Nenhum dos dois substitui o outro, como mostra a seção sobre a espera. Em `textoDe`, `JSON.stringify("#valor")` devolve o texto `"#valor"`, com as aspas: assim se pode inserir um seletor no código sem risco, mesmo que ele contenha aspas.

```javascript
// Executa JavaScript na página e devolve o seu valor (texto, número, objeto...)
export async function avaliar(pagina, expressao) {
    const resposta = await pagina.enviar("Runtime.evaluate", {
        expression: expressao,                 // o código a executar, em forma de texto
        returnByValue: true,                   // devolve o próprio valor
        awaitPromise: true,                    // se for uma promessa, aguarda o resultado
    });
    const falha = resposta.exceptionDetails;   // presente se o código levantou um erro
    if (falha) throw new Error(falha.exception?.description ?? falha.text);  // relança o erro
    return resposta.result.value;              // o valor calculado na página
}

// Abre um endereço e aguarda que a página E a aplicação estejam prontas
export async function abrir(pagina, endereco) {
    const resposta = await pagina.enviar("Page.navigate", { url: endereco });  // navega
    // Um endereço inexistente não levanta erro CDP: devolve um texto de erro
    if (resposta.errorText) throw new Error(`Navegação impossível: ${resposta.errorText}`);
    await aguardar(                            // 1. o navegador terminou de carregar a página
        () => avaliar(pagina, "document.readyState === 'complete'"),
        "carregamento da página",
    );
    await aguardar(                            // 2. a aplicação se declarou pronta
        () => avaliar(pagina, "document.body?.dataset.pronto === 'sim'"),
        "inicialização da aplicação (data-pronto)",
    );
}

// Lê o texto de um elemento (null se ele não existir)
export function textoDe(pagina, seletor) {
    const sel = JSON.stringify(seletor);       // protege as aspas do seletor
    // ?. devolve undefined se o elemento faltar; ?? null o troca por null
    return avaliar(pagina, `document.querySelector(${sel})?.textContent ?? null`);
}
```

### `clicar`, `digitar` e `pressionarEnter`: agir como um humano

Para clicar, são necessárias coordenadas. As funções `acharCentro` e `focarCampo` são executadas **na página**: a bancada as envia a ela como texto (escrever uma função dentro de um modelo de texto, `${acharCentro}`, insere o código-fonte dela). Elas rolam a página até o elemento, se preciso, e devolvem o centro do seu retângulo ou dão o foco ao campo. O **foco** é o fato de um elemento receber as teclas digitadas. Cada ação primeiro aguarda que o elemento exista, graças a `aguardar`.

O mouse envia dois eventos (pressão, depois soltura), como um clique de verdade. O teclado envia `keyDown` (a tecla é pressionada, com o texto que ela produz) e depois `keyUp` (a tecla é solta). `campo.select()` seleciona o texto já presente: a digitação seguinte o substitui, como faz uma pessoa que seleciona e digita.

```javascript
// Função executada NA página: rola até o elemento e devolve o seu centro
function acharCentro(seletor) {
    const elemento = document.querySelector(seletor);    // procura o elemento
    if (!elemento) return null;                // não encontrado: a espera tentará de novo
    elemento.scrollIntoView({ block: "center" });        // torna-o visível na tela
    const area = elemento.getBoundingClientRect();       // retângulo do elemento
    return { x: area.x + area.width / 2, y: area.y + area.height / 2 };   // seu centro
}

// Simula um clique do mouse no centro de um elemento
export async function clicar(pagina, seletor) {
    const chamada = `(${acharCentro})(${JSON.stringify(seletor)})`;   // texto do código
    const { x, y } = await aguardar(() => avaliar(pagina, chamada), `elemento ${seletor}`);
    for (const tipo of ["mousePressed", "mouseReleased"]) {   // pressão, depois soltura
        await pagina.enviar("Input.dispatchMouseEvent", {
            type: tipo, x, y, button: "left", clickCount: 1,   // botão esquerdo, um clique só
        });
    }
}

// Função executada NA página: coloca o cursor em um campo e seleciona o seu texto
function focarCampo(seletor) {
    const campo = document.querySelector(seletor);      // procura o campo
    if (!campo) return false;                  // não encontrado: a espera tentará de novo
    campo.focus();                             // dá-lhe o foco: ele recebe o teclado
    campo.select();                            // seleciona o texto: a digitação o substitui
    return true;                               // encontrado: a espera termina
}

// Digita um texto em um campo, uma tecla após a outra
export async function digitar(pagina, seletor, texto) {
    const chamada = `(${focarCampo})(${JSON.stringify(seletor)})`;   // texto do código
    await aguardar(() => avaliar(pagina, chamada), `campo ${seletor}`);   // dá o foco
    for (const letra of texto) {               // uma letra de cada vez
        const tecla = { key: letra };          // a letra pressionada
        const pressao = { type: "keyDown", text: letra, ...tecla };   // pressão + texto
        await pagina.enviar("Input.dispatchKeyEvent", pressao);       // a tecla é pressionada
        await pagina.enviar("Input.dispatchKeyEvent", { type: "keyUp", ...tecla });  // solta
    }
}

// Pressiona a tecla Enter (pressão e soltura)
export async function pressionarEnter(pagina) {
    const tecla = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 };   // a tecla
    await pagina.enviar("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", ...tecla });
    await pagina.enviar("Input.dispatchKeyEvent", { type: "keyUp", ...tecla });   // solta
}
```

### `capturar`: fotografar a página

`Page.captureScreenshot` devolve a imagem em forma de texto em **base64** (uma forma de escrever bytes usando apenas letras, algarismos, `+` e `/`, veja [Base64 no MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64)). `Buffer.from(texto, "base64")` a converte de volta em bytes (uma sequência de números de 0 a 255, a forma em que um arquivo é armazenado), que são gravados em um arquivo **PNG** (um formato de imagem sem perda).

```javascript
// Fotografa a página e a grava em um arquivo PNG
export async function capturar(pagina, arquivo) {
    const { data } = await pagina.enviar("Page.captureScreenshot", { format: "png" });  // PNG
    await writeFile(arquivo, Buffer.from(data, "base64"));   // decodifica o texto em bytes
    return arquivo;                            // devolve o caminho, útil para exibi-lo
}
```

### `fecharNavegador`: arrumar tudo

Esta função pede ao Chrome que se feche com educação, aguarda, força a parada se preciso e depois apaga a pasta do perfil. Suas limitações são explicadas na seção [Fechar o Chrome corretamente](#fechar-o-chrome-corretamente).

```javascript
// Fecha o Chrome com educação, senão à força, depois apaga o perfil temporário
export async function fecharNavegador(navegador, pagina) {
    const { processo, perfil, porta } = navegador;   // o que iniciarNavegador devolveu
    // Verdadeiro quando o processo parar
    const parado = new Promise((aceitar) => processo.once("exit", aceitar));
    pagina?.ws.close();                        // fecha primeiro a conexão com a página
    try {
        const resposta = await fetch(`http://127.0.0.1:${porta}/json/version`);   // pergunta
        const info = await resposta.json();    // contém o endereço de conexão
        const ws = new WebSocket(info.webSocketDebuggerUrl);   // conexão « navegador »
        ws.addEventListener("open", () => {    // conexão aberta: pede a parada educada
            ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));   // o comando
        });
    } catch {
        processo.kill();                       // o Chrome não responde mais: parada forçada
    }
    // Disputa entre a parada do Chrome e um atraso de 10 s; ref: false: este atraso
    // não impede o Node de terminar
    const atrasoMax = pausa(10000, "tarde demais", { ref: false });
    if ((await Promise.race([parado, atrasoMax])) === "tarde demais") processo.kill();
    await parado;                              // só continua quando o Chrome estiver parado
    // Apaga o perfil: várias tentativas, pois o Chrome libera seus arquivos com atraso
    await rm(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
```

## Ler a página e escrever as asserções

Uma **asserção** é uma verificação que falha (levantando um erro) quando um valor não é o esperado. O Node fornece `node:assert` ([documentação oficial](https://nodejs.org/api/assert.html)); a versão `node:assert/strict` compara estritamente: `"1"` (um texto) não é igual a `1` (um número). `assert.equal(real, esperado)` compara dois valores, `assert.deepEqual` compara o conteúdo de duas listas ou objetos.

Toda leitura da página passa por `avaliar`: escreve-se o JavaScript do [DOM](/?c=langages&s=javascript&p=dom-et-evenements) que se digitaria no **console** do navegador (a aba das ferramentas do desenvolvedor, tecla F12, onde se executa JavaScript à mão). Eis o que se obtém, na página de teste, após digitar `5` no campo e clicar em « Adicionar » (valores observados):

| O que se quer saber | Expressão passada a `avaliar` | Valor lido |
|---|---|---|
| O texto de um elemento | `document.querySelector("#valor").textContent` | `"5"` |
| O que contém um campo | `document.querySelector("#passo").value` | `"5"` |
| O valor de um atributo | `document.querySelector("#situacao").getAttribute("role")` | `"status"` |
| Um elemento existe? | `document.querySelector("[data-testid='valor']") !== null` | `true` |
| Um elemento está ausente? | `document.querySelector("#ausente") === null` | `true` |
| Um elemento ocupa espaço? | `document.querySelector("#adicionar").getBoundingClientRect().width > 0` | `true` |
| Um estilo calculado | `getComputedStyle(document.querySelector("h1")).fontSize` | `"32px"` |
| O número de elementos | `document.querySelectorAll("button").length` | `3` |
| O título da página | `document.title` | `"Contador"` |
| Um atributo `data-` | `document.body.dataset.pronto` | `"sim"` |
| O elemento que tem o foco | `document.activeElement.id` | `"adicionar"` |
| O tipo de endereço | `location.protocol` | `"file:"` |

Para **designar** o elemento a ler ou clicar, vários seletores são possíveis:

| Seletor | Escrita | Preferir? |
|---|---|---|
| Por identificador | `#adicionar` | Sim, se o `id` for estável e único |
| Por atributo dedicado aos testes | `[data-testid="valor"]` | Sim: independe do texto e do layout |
| Por classe | `.botao-principal` | Com cuidado: as classes servem ao estilo e mudam com frequência |
| Por texto exibido ou posição | « o terceiro botão » | Não: a menor mudança de texto quebra o teste, veja [os testes end-to-end](/?c=tests&p=tests-end-to-end) |

A bancada também registra os **erros JavaScript da página**: na máquina de redação, `setTimeout(() => { throw new Error('bum'); }, 0)` executado na página preencheu `pagina.excecoes` com `["Error: bum\n    at <anonymous>:1:26"]`. Sem isso, uma página pode exibir os números certos enquanto esconde um erro que ninguém vê.

## Aguardar um estado em vez de dormir um atraso fixo

O reflexo do iniciante é a **pausa fixa** (« esperar 2 segundos e torcer para que baste »). Ela é curta demais (o teste falha sem motivo válido: é um teste **instável**, *flaky* em inglês, veja [os testes unitários](/?c=tests&p=tests-unitaires)) ou longa demais (a série inteira fica lenta). A alternativa é aguardar o **estado** desejado, com um limite de segurança: veja também [Aguardar sem perder tempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts). O script a seguir compara as estratégias na página de teste.

```javascript
import { setTimeout as pausa } from "node:timers/promises";  // pausa: uma promessa
import {
    aguardar, clicar, conectarPagina, avaliar,
    fecharNavegador, iniciarNavegador, abrir, textoDe,
} from "./bancada.mjs";                                      // nossas ferramentas

const ENDERECO = new URL("./contador.html", import.meta.url).href;   // a página a testar
const navegador = await iniciarNavegador();                  // o Chrome inicia
const pagina = await conectarPagina();                       // conecta-se a ele

try {
    // Caso 1: clicar assim que a página carregar, sem esperar a aplicação
    await pagina.enviar("Page.navigate", { url: ENDERECO }); // carrega a página
    await aguardar(
        () => avaliar(pagina, "document.readyState === 'complete'"),
        "carregamento",
    );
    await clicar(pagina, "#adicionar");        // os botões ainda não estão ligados
    console.log("1. clique cedo demais      :", await textoDe(pagina, "#valor"));

    // Caso 2: uma pausa fixa curta demais, depois longa demais, depois a espera de um estado
    for (const atraso of [100, 2000, "estado"]) {
        await abrir(pagina, ENDERECO);         // página nova, aplicação pronta
        await clicar(pagina, "#salvar");       // o servidor simulado responde após 400 ms
        const partida = Date.now();            // horário de partida da espera
        if (atraso === "estado") {
            await aguardar(                    // aguarda o texto final, não uma duração
                // startsWith: o texto começa com « Salvo »?
                async () => (await textoDe(pagina, "#situacao")).startsWith("Salvo"),
                "confirmação",
            );
        } else {
            await pausa(atraso);               // pausa de duração fixa
        }
        const lido = await textoDe(pagina, "#situacao");       // o que a página exibe então
        const duracao = Date.now() - partida;  // duração realmente passada esperando
        const rotulo = String(atraso).padEnd(5);   // padEnd: completa com espaços
        console.log(`2. espera ${rotulo}: ${duracao} ms ->`, lido);
    }
} finally {
    await fecharNavegador(navegador, pagina);  // fecha o Chrome aconteça o que acontecer
}
```

Resultado observado na máquina de redação (a primeira de três execuções; a tabela seguinte dá a amplitude das três):

```text
1. clique cedo demais      : 0
2. espera 100  : 111 ms -> Salvando...
2. espera 2000 : 2010 ms -> Salvo: 0
2. espera estado: 434 ms -> Salvo: 0
```

| Estratégia | Duração realmente aguardada | O que o teste lê | Veredito |
|---|---|---|---|
| Clicar assim que a página está « complete », sem esperar a aplicação | 0 ms | `0`: o clique se perde, os botões ainda não estão ligados | Falha (observado 3 vezes em 3 aqui; numa aplicação cuja lentidão varia, a falha se torna intermitente) |
| Pausa fixa de 100 ms | 111 a 122 ms | `Salvando...` | Falha: curta demais |
| Pausa fixa de 2000 ms | 2006 a 2015 ms | `Salvo: 0` | Correto, mas mais de quatro vezes mais lento que o necessário |
| Espera do estado (`aguardar`) | 434 a 449 ms | `Salvo: 0` | Correto, e tão rápido quanto a página permite |

O valor lido é `Salvo: 0`, e não `Salvo: 1`, porque este script nunca clica em « Adicionar »: o total permanece em `0`.

Três regras decorrem disso:

| Regra | Por quê |
|---|---|
| Aguardar o **resultado** que se quer ler (um texto, um elemento), nunca um tempo | A duração varia de uma máquina e de um dia para outro; o resultado, não |
| Distinguir « página carregada » de « aplicação pronta » | O navegador anuncia apenas a primeira; a segunda cabe à aplicação sinalizar (`data-pronto`) |
| Sempre um limite, com uma mensagem que diga o que se esperava | Sem limite, um teste travado nunca termina; sem mensagem, não se sabe por que ele falhou |

Por exemplo, `clicar(pagina, "#inexistente")` falhou após 5048 ms com a mensagem `Tempo esgotado (5000 ms): elemento #inexistente`.

## Escrever e executar os testes

Cada teste recomeça da página de origem (`abrir` no início de `testar`): a ordem dos testes não tem então nenhuma importância, e um teste não pode perturbar outro. Um teste que falha não deve interromper os seguintes: anota-se a falha, tira-se uma captura e segue-se em frente. O programa devolve, ao final, um **código de saída**: o número que um programa devolve ao terminar. `0` significa « tudo certo », e qualquer outro valor sinaliza uma falha. Salve este código com o nome `testes.mjs`, na mesma pasta que `bancada.mjs` e `contador.html`.

```javascript
import assert from "node:assert/strict";                     // comparações que falham
import { mkdir } from "node:fs/promises";                    // criação de pasta
import { join } from "node:path";                            // monta um caminho de arquivo
import { fileURLToPath } from "node:url";                    // endereço file:// para caminho
import {
    pressionarEnter, aguardar, capturar, clicar, conectarPagina,
    fecharNavegador, iniciarNavegador, abrir, digitar, textoDe,
} from "./bancada.mjs";                                      // nossas ferramentas

// Endereço file:// da página a testar, situada ao lado deste arquivo
// (import.meta.url é o endereço do arquivo em curso; URL calcula um endereço relativo)
const ENDERECO = new URL("./contador.html", import.meta.url).href;
const PASTA_IMAGENS = fileURLToPath(new URL("./imagens/", import.meta.url));   // capturas
await mkdir(PASTA_IMAGENS, { recursive: true });            // cria a pasta das capturas

const navegador = await iniciarNavegador();                 // o Chrome inicia, sem janela
const pagina = await conectarPagina();                      // conecta-se à sua página
const falhas = [];                                          // nomes dos testes que falharam

// Executa um teste em uma página nova, com captura de imagem em caso de falha
async function testar(nome, corpo) {
    const inicio = Date.now();                 // horário de partida, para medir a duração
    try {
        await abrir(pagina, ENDERECO);         // cada teste recomeça da página de origem
        await corpo();                         // o próprio teste
        // Um erro JavaScript na página faz o teste falhar, mesmo que o resto esteja bem
        // (splice(0) esvazia a lista de erros da página e devolve o seu conteúdo)
        assert.deepEqual(pagina.excecoes.splice(0), [], "erro JavaScript na página");
        console.log(`  ok     ${nome} (${Date.now() - inicio} ms)`);   // concluído
    } catch (erro) {
        falhas.push(nome);                     // guarda o nome do teste que falhou
        const imagem = join(PASTA_IMAGENS, `falha-${falhas.length}.png`);   // arquivo
        await capturar(pagina, imagem).catch(() => {});      // catch: ignora uma falha aqui
        console.log(`  FALHA  ${nome}\n         ${erro.message}\n         imagem: ${imagem}`);
    }
}

try {
    console.log("Testes de contador.html");      // título da série
    await testar("o contador começa em 0", async () => {
        assert.equal(await textoDe(pagina, "#valor"), "0");   // lê a exibição do contador
    });
    await testar("um clique em Adicionar aumenta o contador em 1", async () => {
        await clicar(pagina, "#adicionar");    // clique do mouse no botão
        assert.equal(await textoDe(pagina, "#valor"), "1");   // um clique: o contador vale 1
    });
    await testar("o passo digitado no teclado é usado", async () => {
        await digitar(pagina, "#passo", "5");  // substitui o « 1 » do campo por « 5 »
        await clicar(pagina, "#adicionar");    // primeiro clique: 0 + 5
        await clicar(pagina, "#adicionar");    // segundo clique: 5 + 5
        assert.equal(await textoDe(pagina, "#valor"), "10");  // dois cliques de 5 dão 10
    });
    await testar("a tecla Enter no campo passo também adiciona", async () => {
        await digitar(pagina, "#passo", "2");  // o passo passa a ser 2
        await pressionarEnter(pagina);         // tecla Enter no campo
        assert.equal(await textoDe(pagina, "#valor"), "2");   // sem clique: 0 + 2
    });
    await testar("Zerar apaga o total", async () => {
        await clicar(pagina, "#adicionar");    // total: 1
        await clicar(pagina, "#adicionar");    // total: 2
        await clicar(pagina, "#zerar");        // volta a 0
        assert.equal(await textoDe(pagina, "#valor"), "0");   // o contador está em 0
    });
    await testar("Salvar confirma após um curto atraso", async () => {
        await clicar(pagina, "#adicionar");    // total: 1
        await clicar(pagina, "#salvar");       // inicia o salvamento (400 ms)
        // Aguardamos o estado desejado: o texto de confirmação, não um número de segundos
        await aguardar(
            async () => (await textoDe(pagina, "#situacao")) === "Salvo: 1",   // o texto
            "a situação « Salvo: 1 »",         // o que dirá o erro se a espera for em vão
        );
    });
} finally {
    await fecharNavegador(navegador, pagina);  // fecha o Chrome, mesmo após um erro
}

// Balanço, depois o código de saída lido por um script ou um servidor de integração contínua
console.log(falhas.length === 0 ? "Tudo verde." : `${falhas.length} teste(s) com falha.`);
process.exitCode = falhas.length === 0 ? 0 : 1;             // código de saída: 0 = sucesso
```

Um servidor de integração contínua só lê esse código para decidir se os testes passaram. Execute as verificações e depois os testes:

```bash
# node --check lê o arquivo e verifica sua sintaxe, sem executar nada
node --check bancada.mjs
node --check testes.mjs
# executa a série de testes (CHROME_PATH precisa estar definido neste terminal)
node testes.mjs
# mostra o código de saída do último programa (no PowerShell: $LASTEXITCODE)
echo $?
```

Saída observada na máquina de redação (29/10/2026):

```text
Testes de contador.html
  ok     o contador começa em 0 (373 ms)
  ok     um clique em Adicionar aumenta o contador em 1 (356 ms)
  ok     o passo digitado no teclado é usado (343 ms)
  ok     a tecla Enter no campo passo também adiciona (335 ms)
  ok     Zerar apaga o total (347 ms)
  ok     Salvar confirma após um curto atraso (760 ms)
Tudo verde.
```

O código de saída era `0`. A mesma série também foi executada no PowerShell (`$env:CHROME_PATH = ...` e depois `node testes.mjs`), com o mesmo resultado.

Um teste que nunca pode falhar não prova nada: verificamos, portanto, que a série **sabe** falhar. Vamos quebrar a página de propósito, substituindo no `contador.html` a linha `total += Number(passo.value) || 0;` por uma versão que adiciona 1 a mais:

```javascript
// Versão quebrada da função adicionar: cada adição conta 1 a mais
total += (Number(passo.value) || 0) + 1;
```

## Capturar uma imagem para diagnosticar uma falha

Eis o que a série devolveu na página quebrada (observado; o caminho da imagem foi encurtado, e a mensagem, em inglês, vem do Node: `Expected values to be strictly equal` significa « os valores deveriam ser estritamente iguais »):

```text
Testes de contador.html
  ok     o contador começa em 0 (389 ms)
  FALHA  um clique em Adicionar aumenta o contador em 1
         Expected values to be strictly equal:

'2' !== '1'

         imagem: ...\imagens\falha-1.png
  FALHA  o passo digitado no teclado é usado
         Expected values to be strictly equal:

'12' !== '10'

         imagem: ...\imagens\falha-2.png
  FALHA  a tecla Enter no campo passo também adiciona
         Expected values to be strictly equal:

'3' !== '2'

         imagem: ...\imagens\falha-3.png
  ok     Zerar apaga o total (345 ms)
  FALHA  Salvar confirma após um curto atraso
         Tempo esgotado (5000 ms): a situação « Salvo: 1 »
         imagem: ...\imagens\falha-4.png
4 teste(s) com falha.
```

O código de saída era `1`. Três constatações:

| Constatação | Explicação |
|---|---|
| Quatro testes de seis falham | Cada um lê um total errado: `2` em vez de `1`, `12` em vez de `10`, `3` em vez de `2`, e o texto `Salvo: 1` nunca chega |
| « Zerar » passa apesar do erro de programação (o **bug**) | Este teste só verifica o retorno a `0`, que a adição generosa demais não altera: um teste pode ficar verde e deixar passar um defeito, daí o interesse de ter vários |
| A última mensagem é clara | Graças à mensagem de `aguardar`, lê-se **o que era esperado**, e não um simples « falha » |

Uma captura de imagem mostra o estado da página **no momento da falha**. A do primeiro teste mostra « Valor: 2 » acima do campo « Passo: 1 » e dos três botões, sobre um fundo branco (o arquivo tem 800 × 600 pixels, cerca de 8,6 KB, dimensões lidas no seu cabeçalho): vê-se de relance que a exibição é fiel ao valor lido e que o cálculo é que está errado, já que uma única adição com passo 1 deveria dar 1. Em um servidor de integração contínua, onde ninguém olha, a captura é o único registro visual: o serviço pode guardá-la como **artefato** (um arquivo produzido pela execução e mantido depois).

O tamanho merece uma precaução. Com a opção `--window-size=800,600`, a captura media 782 × 470 pixels na máquina de redação: essa opção ajusta a janela (moldura incluída), não a página. O comando `Emulation.setDeviceMetricsOverride`, usado por `conectarPagina`, fixa o tamanho da **página**: foi ele que deu 800 × 600.

Lembre-se de excluir a pasta `imagens/` do repositório com [um arquivo `.gitignore`](/?c=qualite-performance-et-outils&s=git&p=gitignore): as capturas não se versionam (o **repositório** é a pasta cujas modificações o Git acompanha).

## Fechar o Chrome corretamente

O Chrome é um programa separado: se ele continuar aberto após o teste, ocupa a porta, a memória e uma pasta de perfil. `fecharNavegador` segue três tempos: o comando `Browser.close` (parada educada), um atraso de 10 segundos, depois `processo.kill()` (parada forçada pelo PID deste Chrome), antes de apagar o perfil. Ela é chamada a partir de um bloco `finally`, que é executado quer os testes tenham passado, falhado ou travado.

O que se observou na máquina de redação (29/10/2026):

| Situação | Observado |
|---|---|
| Parada educada (`Browser.close`), caso comum | O Chrome para menos de 3 segundos após o comando (cerca de trinta tentativas) |
| Parada educada, caso lento | Em 6 de cerca de cinquenta execuções, o Chrome só parou de 25 a 29 segundos após o início (em vez de 2 a 4), sem causa estabelecida: ele fechava seus processos filhos um a um |
| `processo.kill()` em um Chrome em funcionamento | O Chrome desaparece em 0,1 a 0,4 s |
| `processo.kill()` durante uma parada educada já lenta | Não encurtou a espera (observado 3 vezes, com atrasos de 5 a 8 segundos antes do `kill()`): é preciso prever um atraso global de teste generoso |
| Programa Node que trava ou termina sem fechar o Chrome | No Windows, o Chrome parou junto com ele (observado 3 vezes). No Linux e no macOS, o comportamento não foi verificado aqui: não conte com isso |
| Programa que se esquece de fechar o Chrome sem travar | O Node nunca termina: executado com o comando `timeout` (que interrompe um programa após uma duração dada, veja [um script que para corretamente](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) ajustado para 15 segundos, foi interrompido à força (código de saída 124) |
| Pasta de perfil após um travamento | Os perfis permanecem no disco (cerca de 10 MB cada): acumulam-se |

Um `kill()` só encerra o processo **principal** do Chrome. Seus processos filhos (um por aba, um para a rede etc.) param sozinhos logo depois: na máquina de redação, restavam alguns após um segundo, e nenhum após três segundos. No Windows, o comando `taskkill /pid <número> /t /f` ([documentação Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill)) para um processo **e** todos os seus descendentes (`/t`) à força (`/f`), sempre a partir do seu PID exato (verificado aqui no Chrome da bancada), nunca pelo seu nome: parar « todos os `chrome.exe` » fecharia também o navegador pessoal do usuário.

## Playwright, Puppeteer ou uma bancada caseira

Existem bibliotecas para este trabalho: [Playwright](https://playwright.dev/docs/intro) e [Puppeteer](https://pptr.dev/). Uma **biblioteca** é um conjunto de código escrito por outros, que se instala e se chama a partir do seu programa. Elas se apoiam nas mesmas ideias da bancada deste capítulo (um navegador controlado por um protocolo) e acrescentam tudo o que torna o uso confortável.

| Critério | Bancada caseira (este capítulo) | Puppeteer | Playwright |
|---|---|---|---|
| Instalação | Nada (Node e Chrome bastam) | Um pacote (e um navegador, conforme sua documentação) | Um pacote e os navegadores que ele baixa |
| Navegadores controlados | Chrome | Chrome em primeiro lugar | Várias famílias de navegadores, conforme sua documentação |
| Esperas automáticas antes de um clique | A escrever (`aguardar`) | Parciais, conforme a documentação | Integradas, conforme a documentação |
| Executor de testes, relatórios, rastros | A escrever | A acrescentar | Fornecidos, conforme a documentação |
| Manutenção do código de controle | Por sua conta | Por seus autores | Por seus autores |
| Interesse principal | Entender; zero dependência | Scripts Chrome (capturas, PDF) | Suítes de testes de uma equipe |

As células « conforme a documentação » indicam funções a verificar na documentação oficial vinculada, que evolui.

| Situação | Escolha recomendada |
|---|---|
| Aprender o que acontece por baixo do capô | A bancada caseira |
| Um ou dois cenários em uma página que você domina, sem poder instalar pacote | A bancada caseira |
| Uma suíte de testes que cresce, vários desenvolvedores, vários navegadores | Playwright |
| Um script isolado que controla o Chrome (capturas, geração de PDF) | Puppeteer |
| Páginas que você não controla | Uma biblioteca mantida **e** o capítulo sobre [os navegadores automatizados atacados](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Chrome continua aberto após o teste | Ele mantém a porta e a memória. No Windows, o Chrome parou com o Node durante os testes; em outros lugares, o comportamento não foi verificado. Sempre fechar em um `finally`, veja [Fechar o Chrome corretamente](#fechar-o-chrome-corretamente) |
| Porta já ocupada | Observado: iniciado em uma porta já ocupada, o Chrome inicia mesmo assim, registra `bind() returned an error` no seu registro, depois escuta no endereço `[::1]` (a escrita IPv6 da própria máquina, veja [os endereços IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) enquanto o teste se conecta a `127.0.0.1`, portanto ao outro programa. A bancada verifica a porta com `portaLivre` antes de iniciar |
| Perfil compartilhado entre dois Chrome | Observado: um segundo Chrome iniciado com a mesma pasta de perfil devolve o controle em 0,24 s e deixa o primeiro rodando, com as opções dele. Um perfil novo a cada início |
| O perfil padrão do usuário | Ele contém suas senhas, cookies e extensões: um teste nunca deve usá-lo. Sempre `--user-data-dir` apontando para uma pasta descartável |
| Perfis temporários que se acumulam | Após um travamento, a pasta permanece (cerca de 10 MB observados). Limpá-los regularmente |
| Pegar o primeiro alvo de `/json/list` | A lista também contém páginas internas do Chrome: filtrar por `type === "page"` |
| Pausa fixa em vez de uma espera | Curta demais: falha aleatória; longa demais: suíte lenta. Aguardar um estado, veja [a seção dedicada](#aguardar-um-estado-em-vez-de-dormir-um-atraso-fixo) |
| Página carregada, mas aplicação não pronta | Observado: um clique enviado assim que `readyState` vale `"complete"` se perde (o contador continua em `0`). Um marcador `data-pronto` colocado pela aplicação |
| Tamanho da página não fixado | As capturas diferem de uma máquina para outra; observado: `--window-size=800,600` deu 782 × 470. Usar `Emulation.setDeviceMetricsOverride` |
| Um erro JavaScript silencioso na página | Não faz falhar nenhuma asserção de leitura. Coletar `Runtime.exceptionThrown`, como faz a bancada |
| Uma exceção em `Runtime.evaluate` que não se olha | A resposta não é um `error`, mas um `result` com `exceptionDetails`: é preciso testá-lo, como faz `avaliar` |
| Seletor frágil (texto, posição) | A menor mudança de texto quebra o teste, veja [os testes end-to-end](/?c=tests&p=tests-end-to-end) |
| Testes que dependem uns dos outros | Uma falha em cascata mascara a causa. Cada teste reabre a página de origem |
| Uma porta de depuração aberta para outros | Quem se conecta a ela controla o navegador inteiro. A porta só é útil à máquina local: não a redirecione para o exterior (veja [os túneis SSH e o redirecionamento de porta](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)) |
| `--no-sandbox` em um **contêiner** (um ambiente isolado, veja [Docker: os conceitos básicos](/?c=infrastructure-devops&s=docker&p=concepts-de-base)) | Veja o parágrafo abaixo |
| Controlar páginas que você não controla | Uma página hostil roda com as capacidades de um navegador de verdade: veja [atacar e defender um navegador automatizado](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

**A sandbox.** O Chrome encerra cada aba em um ambiente restrito, a **sandbox** (« caixa de areia »): se uma página maliciosa explorar uma falha, ela não consegue mexer no resto do computador. Em certos contêineres, o Chrome não consegue montá-la e se recusa a iniciar. A opção `--no-sandbox` remove o obstáculo, mas **desativa essa proteção**: o código da página passa a rodar com todos os direitos do programa. Reserve-a para páginas que você mesmo escreveu, em um contêiner descartável e sem segredos. É melhor configurar o contêiner (usuário sem privilégios, veja [Docker: boas práticas e segurança](/?c=infrastructure-devops&s=docker&p=bonnes-pratiques-et-securite)) do que retirar a proteção. Essa opção não pôde ser testada durante a redação (nenhum contêiner na máquina).

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um perfil novo a cada início, apagado ao final | Nenhum rastro de um teste no seguinte, nenhum risco para o perfil do usuário |
| Verificar o caminho do Chrome e a disponibilidade da porta antes de iniciar | Uma mensagem clara vale mais que um tempo esgotado misterioso |
| Fechar o Chrome em um `finally` | O navegador é fechado mesmo que um teste trave |
| Aguardar um estado com um limite e uma mensagem | Teste rápido quando tudo vai bem, diagnóstico claro quando tudo vai mal |
| Fazer a aplicação declarar que está pronta (`data-pronto`) | Para de se adivinhar o momento certo |
| Designar os elementos por `id` ou `data-testid` | Os testes sobrevivem às mudanças de texto e de layout |
| Fixar o tamanho da página | Capturas comparáveis de uma máquina para outra |
| Recomeçar de uma página nova a cada teste | Testes independentes, em qualquer ordem |
| Coletar os erros JavaScript da página | Uma página que exibe certo mas trava em silêncio é detectada |
| Capturar uma imagem a cada falha e guardá-la como artefato | Ver o estado da página sem poder reproduzi-la |
| Fazer a série falhar de propósito uma vez | Verificar que os testes sabem detectar um bug |
| Devolver um código de saída diferente de zero em caso de falha | A integração contínua lê esse código para decidir |
| Limitar os testes de navegador aos percursos críticos | São mais lentos que os testes unitários, veja [a pirâmide de testes](/?c=tests&p=pyramide-de-test) |
| Passar ao Playwright quando a suíte crescer | As esperas automáticas, os relatórios e os rastros evitam escrevê-los você mesmo |

## O que reter

| | |
|---|---|
| **À retenir** | Um navegador sem janela é um navegador de verdade controlado sem tela: ele serve aos servidores de integração contínua. O Chrome abre uma porta de depuração; o teste conversa com o navegador pelo Chrome DevTools Protocol, mensagens JSON trocadas por uma conexão WebSocket: comandos (com um `id`), respostas (com o mesmo `id`) e eventos (sem `id`). Uma bancada mínima cabe em cerca de 220 linhas de Node: iniciar o Chrome com um perfil novo, escolher o alvo do tipo `page`, enviar `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` e `Page.captureScreenshot`, depois fechar. Espera-se um estado (nunca uma duração), verifica-se com asserções e tira-se uma captura a cada falha. |
| **Armadilhas a evitar** | Chrome órfão ou nunca fechado; porta já ocupada (o Chrome pode então escutar em outro lugar que não aquele onde o teste se conecta); perfil compartilhado ou perfil do usuário; primeiro alvo de `/json/list` pego sem filtrar; pausa fixa; página carregada, mas aplicação não pronta; tamanho da página não fixado; erro JavaScript silencioso; `--no-sandbox` fora de um contêiner descartável; seletores frágeis. |
| **Boas práticas** | Um perfil novo a cada início e um `finally` que fecha o Chrome; controlar caminho e porta antes de iniciar; esperar o estado desejado com um limite e uma mensagem; marcador `data-pronto`; `id` ou `data-testid`; tamanho da página fixado; uma página nova por teste; captura de imagem a cada falha; código de saída diferente de zero em caso de falha; verificar que a série sabe falhar; Playwright assim que a suíte crescer. |
