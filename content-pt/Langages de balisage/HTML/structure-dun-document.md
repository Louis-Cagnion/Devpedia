---
order: 1
---

# A estrutura de um documento HTML

Qualquer documento HTML assenta numa estrutura mínima, praticamente idêntica de uma página para outra — compreender cada parte dessa estrutura é o ponto de partida indispensável para tudo o resto.

## A estrutura mínima

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titre de la page</title>
</head>
<body>
    <h1>Bonjour</h1>
    <p>Contenu de la page.</p>
</body>
</html>
```

## Linha a linha

- `<!DOCTYPE html>` : indica ao navegador que deve interpretar a página de acordo com os padrões HTML5 modernos (modo «*padrões*»), em vez de um modo de compatibilidade histórico («*modo quirks*») herdado dos navegadores mais antigos.
- `<html lang="fr">` : a raiz do documento; `lang` indica a língua principal do conteúdo — utilizada por leitores de tela (ver capítulo sobre acessibilidade) e motores de busca.
- `<head>` : os metadados da página, que nunca são apresentados diretamente no corpo visível.
  - `<meta charset="UTF-8">` : a codificação dos caracteres — sem esta linha (ou com uma codificação incorreta), os caracteres acentuados ou especiais podem ser apresentados de forma incorreta.
  - `<meta name="viewport" ...>` : indispensável para uma visualização correta em dispositivos móveis — sem ela, um navegador móvel apresenta frequentemente a página como se tivesse sido concebida para uma tela de computador e, em seguida, reduz-a (zoom ilegível).
  - `<title>` : o texto apresentado no separador do navegador e nos resultados da pesquisa.
- `<body>` : todo o conteúdo efetivamente visível da página.

## Etiquetas e atributos

```html
<a href="https://exemple.com" target="_blank">Lien</a>
```

- `<a>` e `</a>`: balizas de abertura e de fecho, que delimitam um elemento.
- `href`, `target`: **atributos** que fornecem informações adicionais à baliza (neste caso, o destino do link e o seu comportamento de abertura).

Algumas etiquetas não têm conteúdo e fecham-se a si próprias, sem uma etiqueta de fecho separada:

```html
<img src="photo.jpg" alt="Description de la photo">
<br>
<input type="text">
```

## O aninhamento de tags

```html
<!-- Correct : fermeture dans l'ordre inverse de l'ouverture -->
<p>Texte en <strong>gras <em>et italique</em></strong>.</p>

<!-- Incorrect : chevauchement des balises -->
<p>Texte en <strong>gras <em>et italique</strong></em>.</p>
```

Uma baliza aberta em último lugar deve ser fechada em primeiro lugar — uma sobreposição, embora muitas vezes «tolerada» silenciosamente pelos navegadores, produz um resultado imprevisível e deve ser evitada.

## Os comentários

```html
<!-- Ce commentaire n'est jamais affiché sur la page -->
```

Ver também o capítulo sobre a semântica do HTML5, que detalha a organização típica do conteúdo dentro de um`<body>`o.
