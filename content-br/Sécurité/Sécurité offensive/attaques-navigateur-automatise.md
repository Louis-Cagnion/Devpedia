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
| **Para lembrar** | Um navegador pilotado por um script (Playwright/Selenium/Puppeteer) executa realmente as páginas visitadas, com todas as capacidades de um navegador normal: uma página maliciosa pode tentar um download autodisparado, sequestrar a área de transferência, perturbar o script via um popup, ou detectar a própria automação. |
| **Ferramentas utilizáveis** | Interceptação de diálogos nativos (`page.on("dialog")`); desativação de downloads ou pasta isolada dedicada; negação de permissões do navegador por padrão. |
| **Armadilhas a evitar** | Deixar as configurações padrão de um navegador pensado para uso humano em um piloto automático. Confiar em um dado extraído de uma página não controlada sem tratá-lo como externo. |
| **Boas práticas** | Restringir explicitamente o navegador pilotado ao mínimo necessário para a tarefa. Interceptar sistematicamente todo diálogo/download inesperado. Escapar qualquer dado extraído antes de reutilizá-lo, como qualquer outro dado externo. |
