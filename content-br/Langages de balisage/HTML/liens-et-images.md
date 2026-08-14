---
order: 3
---

# Os links e as imagens

Os links (`<a>`) e as imagens (`<img>`) são dois elementos fundamentais da web: um liga documentos entre si (a própria origem da palavra "*hipertexto*"), o outro insere um conteúdo visual.

## Os links

```html
<a href="https://exemplo.com">Link externo</a>
<a href="/contato">Link relativo, para outra pagina do mesmo site</a>
<a href="#secao2">Link para uma ancora, na mesma pagina</a>
<a href="mailto:contato@exemplo.com">Link que abre o cliente de email</a>
<a href="tel:+5511987654321">Link que sugere ligar para um numero</a>
```

### O atributo `target`

```html
<a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">Abre em uma nova aba</a>
```

> **Nota:** `target="_blank"` sem `rel="noopener"` deixa a nova página aberta acessar (via JavaScript) o objeto `window` da página de origem: um risco de segurança pequeno mas real (*tabnabbing*). `noopener` (e `noreferrer`, que além disso impede o envio da URL de origem) devem acompanhar sistematicamente todo `target="_blank"`.

### Links relativos vs absolutos

```html
<a href="https://exemplo.com/pagina">Absoluto: sempre o mesmo destino, seja qual for o site</a>
<a href="/pagina">Relativo a raiz: depende do dominio atual</a>
<a href="pagina">Relativo ao diretorio atual: depende da URL atual</a>
```

## As imagens

```html
<img src="foto.jpg" alt="Um gato preto sentado em um sofa" width="600" height="400">
```

- `src`: o caminho (relativo ou absoluto, mesma lógica que para um link) para o arquivo de imagem.
- `alt`: um texto alternativo, exibido se a imagem não carregar, e lido por um leitor de tela: **nunca opcional** do ponto de vista da acessibilidade (veja [Atributos data-* e acessibilidade](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)). Uma imagem puramente decorativa (sem informação própria) deve ter `alt=""` (vazio, mas presente), para que o leitor de tela a pule silenciosamente em vez de anunciar um nome de arquivo sem interesse.
- `width`/`height`: dimensões declaradas antecipadamente, que permitem ao navegador reservar o espaço necessário **antes** de a imagem ser carregada: evita um deslocamento visual do resto da página durante o carregamento (*layout shift*).

## Imagens responsivas (`srcset`)

```html
<img
    src="foto-800.jpg"
    srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Um gato preto sentado em um sofa"
>
```

O navegador escolhe **sozinho** a versão mais adequada ao tamanho real de exibição e à resolução da tela, entre as oferecidas: evita obrigar um celular a baixar uma imagem pensada para uma tela grande.

## Imagens como links

```html
<a href="/produto/42">
    <img src="produto.jpg" alt="Cadeira de madeira, vista de frente">
</a>
```

Uma imagem pode ser colocada dentro de um `<a>`, tornando-a clicável: o `alt` continua indispensável, já que é ele que descreve o **destino** do link para um leitor de tela, não apenas o conteúdo visual da imagem.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `<a>` liga documentos (externo, relativo, âncora, email, telefone); `<img>` insere uma imagem. `alt` descreve uma imagem para um leitor de tela ou em caso de falha no carregamento: nunca opcional. |
| **Ferramentas utilizáveis** | `srcset`/`sizes` para imagens responsivas; `width`/`height` para reservar o espaço antes do carregamento. |
| **Armadilhas a evitar** | `target="_blank"` sem `rel="noopener"` (risco de segurança, *tabnabbing*); uma imagem sem `alt` (nem vazio para uma imagem decorativa, nem preenchido para uma imagem com significado). |
| **Boas práticas** | Sempre acompanhar `target="_blank"` de `rel="noopener noreferrer"`; declarar `width`/`height` para evitar um deslocamento visual (*layout shift*) no carregamento. |
