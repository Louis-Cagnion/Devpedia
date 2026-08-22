---
order: 14
---

# SSR vs CSR: onde o HTML é construído?

O [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) de uma página pode ser construído em dois lugares fundamentalmente diferentes: no **servidor**, antes de enviar a resposta ([SSR](https://developer.mozilla.org/pt-BR/docs/Glossary/SSR), *Server-Side Rendering*), ou no **navegador**, por JavaScript executado após o recebimento de uma página mínima ([CSR](https://developer.mozilla.org/pt-BR/docs/Glossary/CSR), *Client-Side Rendering*). Essa escolha muda radicalmente o que o navegador recebe primeiro, e o que um mecanismo de busca vê ao visitar a página.

## CSR: o servidor envia uma casca vazia

Com o CSR, típico de uma aplicação de página única (SPA), o servidor responde com um [HTML](/?c=infrastructure&p=api-et-http) praticamente vazio e um script JavaScript volumoso; é esse script, uma vez baixado e executado, que constrói todo o conteúdo da página no [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements):

```text
Servidor -> <html><body><div id="app"></div><script src="app.js"></script></body></html>

Navegador:
1. Recebe o HTML quase vazio -> nada exibido
2. Baixa e executa app.js
3. app.js constroi o conteudo no DOM, geralmente apos chamar uma API
4. A pagina se torna visivel e interativa
```

O conteúdo real só aparece após o download **e** a execução do JavaScript, um atraso que depende diretamente do tamanho do script e da capacidade do dispositivo que o executa.

## SSR: o servidor já envia o HTML preenchido

Com o SSR, o próprio servidor executa o código de renderização a cada requisição (ou na construção do site, dependendo da implementação), e devolve um [HTML](/?c=infrastructure&p=api-et-http) já preenchido com conteúdo:

```text
Servidor -> executa a renderizacao -> <html><body><h1>Bem-vindo Alice</h1>...</body></html>

Navegador:
1. Recebe um HTML ja completo -> exibicao imediata do conteudo
2. Baixa e executa o JavaScript restante (hidratacao, veja abaixo)
3. A pagina se torna interativa
```

O conteúdo é exibido assim que a resposta é recebida, antes mesmo de o JavaScript terminar de carregar.

## Comparação

| | CSR | SSR |
|---|---|---|
| Primeira exibição do conteúdo | Após download + execução do JS | Imediata, já no HTML recebido |
| Carga no servidor | Baixa (serve arquivos estáticos + uma API) | Mais alta (executa a renderização a cada requisição, ou na construção) |
| Indexação (SEO) | Um robô de indexação que não executa JS só vê uma página vazia | O conteúdo já está presente no HTML recebido |
| Interatividade após carregado | Idêntica | Idêntica, após a hidratação |

## A hidratação: reconectar o JavaScript a um HTML já presente

Após uma renderização SSR, a página exibida ainda é apenas [HTML](/?c=infrastructure&p=api-et-http) estático: nenhum manipulador de evento está anexado ainda. A **hidratação** é a etapa em que o JavaScript é executado para reconectar esse HTML existente aos [eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) que o tornam interativo, sem reconstruir o conteúdo já exibido.

> **Armadilha:** uma renderização SSR que produz um HTML ligeiramente diferente do que o JavaScript produziria ao reconstruí-lo por conta própria (uma data formatada de forma diferente conforme o fuso horário do servidor, um dado que mudou entre a renderização no servidor e a hidratação no cliente). O framework detecta a divergência e pode tanto ignorá-la silenciosamente quanto descartar toda a renderização do servidor para reconstruir a página inteiramente no lado do cliente, perdendo o principal benefício do SSR.
>
> **Boa prática:** garantir que a renderização produza exatamente o mesmo resultado no servidor e no cliente, a partir dos mesmos dados; injetar explicitamente na página os dados usados na renderização do servidor, para que o JavaScript de hidratação os reutilize tal como estão, em vez de recalculá-los de forma diferente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O CSR constrói o conteúdo no navegador após a execução do JavaScript (primeira exibição atrasada, carga baixa no servidor); o SSR constrói o HTML no lado do servidor antes do envio (exibição imediata, melhor indexação, carga mais alta no servidor). A hidratação reconecta o JavaScript a um HTML SSR já exibido, sem reconstruí-lo. |
| **Ferramentas utilizáveis** | Os frameworks com renderização SSR integrada (Next.js, Nuxt e equivalentes) para combinar exibição imediata e interatividade após a hidratação. |
| **Armadilhas a evitar** | Uma renderização no servidor que produz um resultado diferente da renderização no cliente durante a hidratação, forçando uma reconstrução completa no lado do cliente. |
| **Boas práticas** | Garantir uma renderização idêntica entre servidor e cliente a partir dos mesmos dados; transmitir explicitamente esses dados ao cliente em vez de recalculá-los durante a hidratação. |
