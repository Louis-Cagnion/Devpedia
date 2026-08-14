---
order: 1
---

# A estrutura de um documento HTML

Todo documento HTML se apoia em um esqueleto mínimo, praticamente idêntico de uma página para outra: entender cada parte desse esqueleto é o ponto de partida indispensável antes de tudo o mais.

## O esqueleto mínimo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titulo da pagina</title>
</head>
<body>
    <h1>Ola</h1>
    <p>Conteudo da pagina.</p>
</body>
</html>
```

## Linha por linha

- `<!DOCTYPE html>`: indica ao navegador que ele deve interpretar a página de acordo com os padrões HTML5 modernos (modo "*standards*"), em vez de um modo de compatibilidade histórico ("*quirks mode*") herdado de navegadores antigos.
- `<html lang="pt-BR">`: a raiz do documento; `lang` indica o idioma principal do conteúdo, usado por leitores de tela (veja [Atributos data-* e acessibilidade](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)) e motores de busca.
- `<head>`: os metadados da página, nunca exibidos diretamente no corpo visível.
  - `<meta charset="UTF-8">`: a codificação dos caracteres; sem essa linha (ou com uma codificação incorreta), caracteres acentuados ou especiais podem aparecer corrompidos.
  - `<meta name="viewport" ...>`: indispensável para uma exibição correta no celular; sem ela, um navegador móvel frequentemente exibe a página como se fosse pensada para uma tela de computador, e depois a reduz (zoom ilegível).
  - `<title>`: o texto exibido na aba do navegador e nos resultados de busca.
- `<body>`: todo o conteúdo realmente visível da página.

## Tags e atributos

```html
<a href="https://exemplo.com" target="_blank">Link</a>
```

- `<a>` e `</a>`: tag de abertura e de fechamento, que delimitam um elemento.
- `href`, `target`: **atributos**, que trazem uma informação adicional à tag (aqui, o destino do link e seu comportamento de abertura).

Algumas tags não têm conteúdo e se fecham sozinhas, sem uma tag de fechamento separada:

```html
<img src="foto.jpg" alt="Descricao da foto">
<br>
<input type="text">
```

## O aninhamento das tags

```html
<!-- Correto: fechamento na ordem inversa da abertura -->
<p>Texto em <strong>negrito <em>e italico</em></strong>.</p>

<!-- Incorreto: sobreposicao das tags -->
<p>Texto em <strong>negrito <em>e italico</strong></em>.</p>
```

Uma tag aberta por último deve ser fechada primeiro: uma sobreposição, embora frequentemente "tolerada" silenciosamente pelos navegadores, produz um resultado imprevisível e deve ser evitada.

## Os comentários

```html
<!-- Este comentario nunca e exibido na pagina -->
```

Veja também [A semântica do HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5), que detalha a organização típica do conteúdo dentro de `<body>`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um documento HTML segue um esqueleto fixo (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). As tags se aninham na ordem inversa de sua abertura; uma sobreposição produz um resultado imprevisível. |
| **Ferramentas utilizáveis** | `<meta charset>`, `<meta name="viewport">`, `<title>`: os metadados indispensáveis de todo documento. |
| **Armadilhas a evitar** | Esquecer `<meta name="viewport">`: a página então é exibida no celular como se fosse pensada para uma tela de computador, e depois reduzida de forma ilegível. |
| **Boas práticas** | Sempre fechar uma tag aberta, na ordem inversa da abertura, mesmo quando um navegador tolera silenciosamente o contrário. |
