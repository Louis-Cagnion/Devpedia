---
order: 3
---

# Os links e as imagens

Os links (`<a>`) e as imagens (`<img>`) são dois elementos fundamentais da Web — um liga documentos entre si (a própria origem da palavra *«hipertexto»*), o outro insere conteúdo visual.

## Os links

```html
<a href="https://exemple.com">Lien externe</a>
<a href="/contact">Lien relatif, vers une autre page du même site</a>
<a href="#section2">Lien vers une ancre, dans la même page</a>
<a href="mailto:contact@exemple.com">Lien qui ouvre le client mail</a>
<a href="tel:+33612345678">Lien qui propose d'appeler un numéro</a>
```

### O atributo «`target`»

```html
<a href="https://exemple.com" target="_blank" rel="noopener noreferrer">Ouvre dans un nouvel onglet</a>
```

> **Nota:** `target="_blank"` sem `rel="noopener"` permite que a nova página aberta aceda (através de JavaScript) ao objeto `window` da página original — um risco de segurança menor, mas real (*tabnabbing*). `noopener` (e `noreferrer`, que além disso impede o envio do URL original) devem acompanhar sistematicamente qualquer `target="_blank"`.

### Links relativos vs. absolutos

```html
<a href="https://exemple.com/page">Absolu : toujours la même destination, quel que soit le site</a>
<a href="/page">Relatif à la racine : dépend du domaine actuel</a>
<a href="page">Relatif au dossier courant : dépend de l'URL actuelle</a>
```

## As imagens

```html
<img src="photo.jpg" alt="Un chat noir assis sur un canapé" width="600" height="400">
```

- `src` : o caminho (relativo ou absoluto, da mesma forma que para um link) para o ficheiro de imagem.
- `alt` : um texto alternativo, exibido caso a imagem não carregue e lido por um leitor de ecrã — **nunca opcional** do ponto de vista da acessibilidade (ver capítulo dedicado). Uma imagem puramente decorativa (sem informação própria) deve ter `alt=""` (vazio, mas presente), para que o leitor de ecrã a ignore silenciosamente, em vez de anunciar um nome de ficheiro sem interesse.
- `width` /`height`: dimensões declaradas antecipadamente, que permitem ao navegador reservar o espaço necessário **antes** de a imagem ser carregada — evita um deslocamento visual do resto da página durante o carregamento (*layout shift*).

## Imagens responsivas (`srcset`)

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Un chat noir assis sur un canapé"
>
```

O navegador escolhe **automaticamente** a versão mais adequada ao tamanho real de visualização e à resolução do ecrã, entre as disponíveis — evita obrigar um telemóvel a descarregar uma imagem concebida para um ecrã grande.

## Imagens como links

```html
<a href="/produit/42">
    <img src="produit.jpg" alt="Chaise en bois, vue de face">
</a>
```

É possível inserir uma imagem dentro de um `<a>`, tornando-a clicável — o `alt` continua, portanto, a ser indispensável, uma vez que é ele que descreve o **destino** do link para um leitor de ecrã, e não apenas o conteúdo visual da imagem.
