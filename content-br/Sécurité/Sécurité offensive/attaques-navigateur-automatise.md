---
order: 10
---

# Atacar (e defender) um navegador automatizado

[A exploração web do lado do atacante](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant) olha para um atacante que tem SEU site como alvo. Este capítulo inverte a perspectiva, para um caso cada vez mais comum: seu próprio código pilota um navegador real (Playwright, Selenium, Puppeteer) contra páginas que você NÃO controla: um scraper que visita sites de parceiros, uma ferramenta que automatiza uma tarefa em um site de terceiros. Dessa vez, é o SEU navegador automatizado que se torna o alvo.

## Um navegador pilotado continua sendo um navegador completo

A diferença entre "ler uma página" e "exibir uma página em um navegador" importa mais do que parece: um script que só baixa o HTML de uma página (uma simples requisição HTTP) não corre nenhum risco deste capítulo, ele só obtém texto. Um navegador PILOTADO, por sua vez, executa realmente a página: JavaScript incluso, como um visitante humano, com as mesmas capacidades de um navegador normal, incluindo aquelas que seu script automatizado nunca teve intenção de usar.

```text
Requisicao HTTP simples (sem risco deste capitulo):
  Script --requisicao GET--> Servidor --devolve o HTML bruto--> Script (so le texto)

Navegador pilotado (Playwright/Selenium/Puppeteer):
  Script --controla--> Navegador real --carrega E EXECUTA a pagina-->
  a pagina pode disparar um download, abrir um popup, ler a
  area de transferencia, tentar explorar o proprio navegador --
  exatamente como diante de um visitante humano real
```

## O que uma página maliciosa pode tentar contra o piloto automático

| Vetor | O que ele explora |
|---|---|
| Download autodisparado | Uma página que força o download de um arquivo sem ação explícita; se o navegador pilotado aceita silenciosamente qualquer download (comportamento padrão frequentemente ativado para automação), o arquivo chega ao disco sem supervisão humana para notar |
| Sequestro da área de transferência | A API de área de transferência do navegador, acessível em JavaScript, permite que uma página leia ou modifique seu conteúdo em certas condições; um script que depois reutiliza essa área de transferência em outro lugar (copiar e colar automatizado de um dado obtido) herda o conteúdo injetado |
| Popup/redirecionamento inesperado | Uma página que abre uma nova janela ou redireciona agressivamente pode perturbar a lógica do script piloto (que supõe ter permanecido na página esperada), ou até levá-lo a interagir por erro com uma página diferente da prevista |
| Fingerprinting do piloto automático | Algumas páginas detectam a presença de um navegador automatizado (propriedades JavaScript específicas do Playwright/Selenium) para adaptar seu comportamento: exibir um conteúdo diferente, ou disparar uma defesa anti-bot direcionada |
| Injeção nos dados extraídos | Se o script depois confia no texto extraído da página (um título, um preço) sem tratá-lo como um dado externo não confiável, um conteúdo armadilhado pode se propagar mais adiante no sistema que recebe esse resultado (veja o princípio já exposto em [As grandes famílias de falhas](/?c=securite&s=cybersecurite&p=types-de-failles)) |

## O sinal concreto que os anti-bot leem: `navigator.webdriver`

O protocolo WebDriver, usado pelo Playwright, Selenium e ferramentas similares para pilotar um navegador, expõe por padrão uma propriedade JavaScript legível por qualquer página:

```javascript
navigator.webdriver   // true se pilotado via WebDriver, false/undefined caso contrário
```

Qualquer script da página, e portanto qualquer sistema anti-bot, pode ler essa propriedade para distinguir um visitante humano de um script, sem precisar analisar um comportamento mais sutil. A contramedida consiste em redefinir essa propriedade antes de qualquer outro script da página:

```javascript
Object.defineProperty(navigator, "webdriver", { get: () => undefined });
```

Injetada bem no início do carregamento de cada página (`context.add_init_script(...)` no Playwright), essa redefinição oculta o sinal mais direto, sem mudar nada mais no comportamento do navegador.

> **Cuidado:** ocultar `navigator.webdriver` não torna um navegador pilotado indetectável: sistemas anti-bot avançados combinam dezenas de sinais (ritmo de cliques, resolução de tela, fontes instaladas...), não apenas essa propriedade. Tratá-la como a única a corrigir dá uma falsa sensação de segurança.

## Modo headless ou janela real

Um navegador **headless** ("sem cabeça") roda sem exibir nenhuma janela: é o modo mais comum para um script, pois não precisa de tela nem de sessão aberta. Mas um navegador sem janela não se apresenta exatamente como um navegador normal: algumas versões anunciam "HeadlessChrome" em seu identificador (*User-Agent*) ou não expõem as mesmas funcionalidades. Os sistemas anti-bot usam isso para decidir se mostram uma verificação adicional (veja [o fingerprinting](/?c=securite&s=cybersecurite&p=fingerprinting-navigateur-et-appareil)).

| | Headless | Janela real |
|---|---|---|
| Recursos | Leves | Mais pesados (uma janela a desenhar) |
| Precisa de uma sessão aberta | Não | Sim (veja [as sessões do Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) |
| Impressão digital | Às vezes reconhecível | A de um navegador comum |
| Intervenção humana possível (validar uma verificação) | Não | Sim |

Uma alternativa comum: iniciar uma **janela real, mas colocá-la fora da tela visível** (`--window-position=-32000,-32000`), para manter a impressão digital de um navegador normal sem incomodar quem usa a máquina. O tamanho da página é ajustado à parte, pelo **viewport** (a área de exibição que a página acha ter): ele é imposto pelo script e não depende da resolução da tela, que só importa para um humano que olhasse a janela.

```python
navegador = p.chromium.launch(
    headless=False,                            # janela real, sem modo headless
    args=["--window-position=-32000,-32000"],  # janela colocada fora da tela visível
)
page = navegador.new_page(viewport={"width": 1280, "height": 1000})
```

> **Armadilha:** trocar de modo (janela real em desenvolvimento, headless em produção) sem testar de novo: a página pode se comportar de outra maneira (uma verificação que aparece, um layout que muda), e o script só foi validado no outro modo.
>
> **Boa prática:** testar no modo realmente usado em produção e fixar o `viewport` para que o layout não dependa da tela da máquina.

## Os captchas: uma verificação feita para barrar robôs

Um **captcha** (*Completely Automated Public Turing test to tell Computers and Humans Apart*) é um teste que a página pede para ser superado antes de continuar: reconhecer imagens, marcar uma caixa. Ele é concebido para ser fácil para um humano e difícil para um programa, e as versões recentes julgam também o comportamento e a impressão digital do navegador, e não apenas o teste exibido.

Um robô que esbarra em um captcha não deve, portanto, tentar superá-lo. O esquema habitual é **deixar um humano resolvê-lo** em uma janela real e depois reutilizar o resultado: uma vez passada a verificação, o site coloca um cookie de validação (por exemplo `cf_clearance` na Cloudflare) que o navegador devolve a cada requisição, sem novo teste, enquanto for válido.

> **Armadilha:** achar que um cookie de validação é universal. Ele costuma estar ligado ao navegador (identificador, impressão digital) e ao endereço IP que o obteve: um robô que reutiliza o mesmo cookie com outra impressão digital (por exemplo ao passar da janela real para o modo headless) volta a ser bloqueado.
>
> **Boa prática:** prever um estado "intervenção humana necessária" (notificação, janela visível) em vez de ficar em loop em silêncio; não contornar um captcha com um serviço de terceiros sem verificar se os termos de uso do site permitem.

## O perfil de navegador persistente

Por padrão, um navegador pilotado inicia com um perfil vazio, destruído ao fechar: nenhum cookie sobrevive de uma execução para outra. Um **perfil persistente** é uma pasta que conserva cookies, armazenamento local e cache. Com o Playwright, ele é pedido por `launch_persistent_context` ([documentação](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-persistent-context)):

```python
contexto = p.chromium.launch_persistent_context(
    user_data_dir=r"C:\robo\perfil",  # cookies, armazenamento local e cache guardados aqui
    headless=False,                   # mesmo modo a cada execução
    viewport={"width": 1280, "height": 1000},
)
```

O cookie de validação obtido após um captcha permanece então nessa pasta, e as execuções seguintes não veem mais a verificação.

| Ponto de atenção | Por quê |
|---|---|
| Um só navegador por vez em cada perfil | A pasta fica bloqueada enquanto um navegador a usa; uma segunda execução falha |
| O caminho depende da conta que executa | Um caminho relativo à pasta do usuário não designa a mesma pasta para outra conta (conta de serviço, agendador de tarefas): o robô parte de um perfil vazio e vê o captcha de novo |
| O conteúdo é sensível | O perfil contém sessões abertas: quem copiar a pasta pode entrar no lugar delas |

> **Armadilha:** fazer commit da pasta do perfil no [Git](/?c=git&p=git), ou deixá-la legível por todas as contas da máquina.
>
> **Boa prática:** indicar o caminho do perfil em absoluto (ou em uma variável de ambiente), excluí-lo do repositório (`.gitignore`) e reservar o acesso à conta que executa o robô.

## A depuração remota do Chrome

O Chrome pode abrir uma porta de **depuração remota** (`--remote-debugging-port=9222`): uma ferramenta, ou um script, se conecta a ela falando o **Chrome DevTools Protocol** (CDP), o protocolo que as ferramentas de desenvolvimento do navegador também usam ([documentação](https://chromedevtools.github.io/devtools-protocol/)). Isso permite ver e pilotar uma página de um Chrome sem área de trabalho (um servidor, uma máquina remota).

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\robo\perfil-debug
```

| Uso | Como |
|---|---|
| Verificar se a porta responde | `curl http://localhost:9222/json/version` (devolve a versão e o endereço do canal de controle) |
| Ver a página em outro Chrome | Abrir `chrome://inspect`, adicionar `localhost:9222` aos destinos: a página aparece, com suas ferramentas de desenvolvimento |
| Pilotar com o Playwright | `p.chromium.connect_over_cdp("http://localhost:9222")` |

Essa porta **não pede nenhuma autenticação**: quem se conectar a ela controla o navegador, inclusive as sessões abertas em seu perfil (pode ler os cookies, navegar, executar JavaScript em uma página com login feito).

> **Armadilha:** expor essa porta à rede. O Chrome só escuta por padrão em `127.0.0.1` (invisível pela rede, veja [os túneis SSH](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)); mudar o endereço de escuta ou abrir a porta no firewall dá o controle do navegador a qualquer um que a alcance.
>
> **Boa prática:** deixar a porta em `127.0.0.1` e, para acessá-la de outro computador, passar por um túnel SSH (`ssh -N -L 9222:localhost:9222 …`).

> **Armadilha:** desde o Chrome 136, a opção `--remote-debugging-port` não é mais considerada quando o perfil é o padrão do Chrome: uma pasta não padrão usa outra chave de criptografia, o que protege os dados do perfil habitual de um programa malicioso ([anúncio](https://developer.chrome.com/blog/remote-debugging-port)). Sem `--user-data-dir`, a porta não responde.
>
> **Boa prática:** sempre dar um `--user-data-dir` dedicado ao robô, distinto do perfil pessoal.

## A distinção chave: "extrair dados" contra "executar uma página"

O reflexo defensivo central cabe em uma frase: um script de automação só precisa de uma pequena parte do que um navegador completo sabe fazer (carregar uma página, ler seu conteúdo, clicar em elementos previstos). Todo o resto (downloads, popups, permissões do sistema, acesso à área de transferência) deve ser explicitamente RESTRINGIDO, nunca deixado nas configurações padrão pensadas para um uso humano interativo.

| Configuração | Comportamento padrão | Restrição recomendada para um piloto automático |
|---|---|---|
| Downloads | Frequentemente aceitos silenciosamente | Desativar, ou redirecionar para uma pasta isolada nunca executada automaticamente |
| Diálogos nativos (`alert`, `confirm`, popup) | Às vezes bloqueiam o script em espera | Interceptar sistematicamente (`page.on("dialog")` no Playwright) para fechá-los automaticamente, sem nunca deixá-los se acumular ou influenciar o script |
| Permissões do navegador (geolocalização, notificações, área de transferência) | Varia conforme o navegador | Negar toda permissão por padrão, concedendo apenas as realmente necessárias para a tarefa |
| Confiança no texto extraído | Frequentemente tratado como dado já confiável assim que "recém-extraído" | Tratar como dado externo não confiável (escapar antes de qualquer uso: exibição, consulta, log) |

> **Cuidado:** considerar o scraping uma operação sem risco porque "só estamos lendo dados públicos". O navegador que executa a página continua plenamente exposto ao que essa página tentar, independentemente da intenção do script que o pilota.
>
> **Boa prática:** configurar explicitamente o navegador pilotado com o mínimo de capacidades necessárias à tarefa (downloads desativados, diálogos interceptados, permissões negadas por padrão), e tratar qualquer dado extraído de uma página não controlada como externo e não confiável antes de reutilizá-lo em qualquer outra parte do sistema.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um navegador pilotado por um script (Playwright/Selenium/Puppeteer) executa realmente as páginas visitadas, com todas as capacidades de um navegador normal: uma página maliciosa pode tentar um download autodisparado, sequestrar a área de transferência, perturbar o script via um popup, ou detectar a própria automação via `navigator.webdriver`. O modo headless tem uma impressão digital às vezes reconhecível; um captcha é liberado por um humano em uma janela real, e o desbloqueio é reutilizado graças a um perfil persistente; a porta de depuração remota do Chrome não tem nenhuma autenticação. |
| **Ferramentas utilizáveis** | Interceptação de diálogos nativos (`page.on("dialog")`); desativação de downloads ou pasta isolada dedicada; negação de permissões do navegador por padrão; ocultação de `navigator.webdriver` via `context.add_init_script(...)`. Uma janela real colocada fora da tela e um `viewport` fixo; `launch_persistent_context` para manter um perfil; `--remote-debugging-port` e `chrome://inspect` para observar um Chrome sem área de trabalho. |
| **Armadilhas a evitar** | Deixar as configurações padrão de um navegador pensado para uso humano em um piloto automático. Confiar em um dado extraído de uma página não controlada sem tratá-lo como externo. Achar que um navegador pilotado fica indetectável só por ocultar `navigator.webdriver`. Validar em um modo (janela real) e executar em outro (headless). Achar que um cookie de validação de captcha vale para outra impressão digital. Um perfil de navegador versionado, legível por todos ou designado por um caminho que muda conforme a conta. Uma porta de depuração exposta à rede. |
| **Boas práticas** | Restringir explicitamente o navegador pilotado ao mínimo necessário para a tarefa. Interceptar sistematicamente todo diálogo/download inesperado. Escapar qualquer dado extraído antes de reutilizá-lo, como qualquer outro dado externo. Testar no modo de produção e fixar o `viewport`. Prever um estado "intervenção humana necessária" diante de um captcha. Perfil com caminho absoluto, fora do repositório, reservado à conta do robô. Porta de depuração apenas em `127.0.0.1`, acessível remotamente por um túnel SSH, com um `--user-data-dir` dedicado. |
