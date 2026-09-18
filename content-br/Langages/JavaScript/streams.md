---
order: 20
---

# Streams: processar um fluxo de dados sem carregá-lo todo na memória

Até agora, todo dado manipulado ([um texto](/?c=langages-de-programmation&s=javascript&p=strings), um array, a resposta de um [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone)) foi tratado como um bloco inteiro, disponível de uma só vez. Um **stream** (fluxo) trata, ao contrário, um dado **pedaço por pedaço** (*chunk* por *chunk*), à medida que ele chega, sem nunca precisar carregá-lo inteiramente na memória.

## Por que não simplesmente carregar tudo na memória

| | Carregar tudo na memória | Processar em stream |
|---|---|---|
| Princípio | Esperar o dado completo antes de tocá-lo | Processar cada pedaço logo que ele chega |
| Memória usada | Proporcional ao tamanho total do dado | Proporcional ao tamanho de um único pedaço |
| Primeiro resultado visível | Só depois de receber tudo | Já a partir do primeiro pedaço |
| Exemplo típico | Um pequeno arquivo de configuração (alguns KB) | Um vídeo, um arquivo volumoso, uma resposta HTTP longa |

> **Armadilha:** carregar um conteúdo potencialmente volumoso inteiramente na memória "para simplificar" (ex. `await resposta.arrayBuffer()` em um arquivo de vários gigabytes) quando ele só está transitando para outro destino (outro arquivo, outra resposta HTTP). O programa então retém todo o conteúdo na memória ao mesmo tempo, mesmo que nunca precise dele inteiro de uma vez.
>
> **Boa prática:** assim que um dado só está transitando (retransmitido, copiado, enviado a outro lugar) sem ser analisado em sua totalidade, processá-lo em stream em vez de carregá-lo inteiro.

## Duas implementações diferentes, coexistindo no ecossistema JavaScript

O conceito de stream existe há muito tempo do lado do servidor (Node.js), e foi adicionado mais tarde do lado do navegador (os "Web Streams", um padrão da Web). Os dois compartilham a mesma ideia mas usam uma API diferente:

| | Node.js Streams | Web Streams |
|---|---|---|
| Origem | Específico do Node.js, desde seus primórdios | Padrão do navegador, também disponível no Node.js recente |
| Tipo principal | `stream.Readable` / `stream.Writable` | `ReadableStream` / `WritableStream` |
| Onde são encontrados | Leitura de arquivo ([`fs.createReadStream()`](https://nodejs.org/api/fs.html)), resposta HTTP Express (`res`) | Corpo de uma resposta [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone) (`response.body`) |
| Estilo de API | Eventos (`on("data", ...)`) ou `.pipe()` | Um "leitor" obtido via `.getReader()`, consumido com `await` |

## Fazer os dois se comunicarem: um adaptador manual

Um mesmo programa pode precisar dos dois ao mesmo tempo: por exemplo, retransmitir o corpo de uma resposta `fetch()` (um `ReadableStream`, padrão Web) para uma resposta HTTP Express (`res`, que espera um fluxo Node.js clássico). Nenhuma conversão automática existe entre os dois: é preciso ler o `ReadableStream` manualmente e reemitir cada pedaço em um `Readable` do Node.js.

```js
import { Readable } from "node:stream";

async function retransmitirParaRespostaExpress(respostaFetch, res) {
    const leitor = respostaFetch.body.getReader();  // "leitor" do ReadableStream (Web)

    const fluxo = new Readable({
        // chamada a cada vez que .pipe() precisa de mais um pedaço
        async read() {
            const { done, value } = await leitor.read();
            if (done) {
                this.push(null);   // sinaliza o fim do fluxo Node.js
            } else {
                this.push(value);  // retransmite o pedaço, sem nunca armazená-lo inteiro
            }
        },
    });

    fluxo.pipe(res);  // conecta o fluxo Node.js adaptado à resposta Express
}
```

> **Armadilha:** esquecer que `read()` de um `ReadableStream` é assíncrono (`await`): chamar `leitor.read()` sem esperá-lo devolveria uma Promise não resolvida em vez do pedaço de dado real.
>
> **Boa prática:** manter esse adaptador genérico (ele só copia pedaços de um formato para o outro, sem nunca ler seu conteúdo) para reutilizá-lo em qualquer lugar onde um `ReadableStream` precise alimentar uma API que espera um fluxo Node.js.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um stream processa um dado pedaço por pedaço em vez de em um único bloco, sem nunca precisar carregá-lo inteiramente na memória. Duas implementações coexistem em JavaScript: os Node.js Streams (históricos, do lado do servidor) e os Web Streams (padrão do navegador, também usados por `fetch()`). |
| **Ferramentas utilizáveis** | `stream.Readable`/`Writable` e `.pipe()` do lado do Node.js; `ReadableStream`/`getReader()` do lado Web/`fetch()`. |
| **Armadilhas a evitar** | Carregar um conteúdo volumoso inteiramente na memória quando ele só está transitando. Chamar `read()` de um `ReadableStream` sem esperá-lo. |
| **Boas práticas** | Processar em stream todo dado que só esteja transitando. Escrever um adaptador genérico e reutilizável entre as duas implementações em vez de um caso a caso. |
