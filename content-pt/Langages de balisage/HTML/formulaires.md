---
order: 5
---

# Os formulários

Um formulário HTML recolhe os dados introduzidos pelo usuário, para os enviar para um servidor (através de `GET` ou `POST`, ver o capítulo sobre variáveis globais em PHP) — este é o principal ponto de entrada de todos os dados do usuário numa aplicação web.

## A estrutura básica

```html
<form action="/inscription" method="POST">
    <label for="email">Adresse email</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">S'inscrire</button>
</form>
```

- `action` : o URL para o qual os dados são enviados no momento do envio.
- `method` : `GET` (dados visíveis no URL, por exemplo, para uma pesquisa) ou `POST` (dados no corpo da solicitação, para dados sensíveis ou de grande volume — ver o capítulo sobre variáveis globais em PHP para conhecer a diferença completa).
- `name` em cada campo: é este valor, **e** n`id`**o**, que identifica o campo do lado do servidor (por exemplo, `$_POST['email']` em PHP).

## `<label>` : indispensável, não é meramente decorativa

```html
<label for="email">Adresse email</label>
<input type="email" id="email" name="email">
```

O atributo «`for`» do «`<label>`» deve corresponder ao «`id`» do campo — clicar no rótulo ativa/focaliza automaticamente o campo associado, e um leitor de tela anuncia esse rótulo quando o usuário chega ao campo. Um campo **sem** um `<label>` associado constitui um problema grave de acessibilidade, mesmo que continue a ser visualmente compreensível para um usuário com visão.

## Tipos de campos (`<input>`)

```html
<input type="text" name="nom">
<input type="email" name="email">          <!-- validation basique du format email par le navigateur -->
<input type="password" name="motdepasse">  <!-- masque la saisie -->
<input type="number" name="age" min="0" max="120">
<input type="date" name="naissance">
<input type="checkbox" name="accepte" value="oui">
<input type="radio" name="genre" value="h"> <input type="radio" name="genre" value="f">
<input type="file" name="document">
<input type="hidden" name="token" value="abc123">
```

> **Nota:** dois botões de opção que partilham o mesmo `name` formam um **grupo** — apenas um pode ser selecionado de cada vez entre eles, ao contrário das caixas de seleção (`checkbox`), que são independentes umas das outras, mesmo com o mesmo `name`.

## `<textarea>` e `<select>`

```html
<textarea name="message" rows="5" cols="30"></textarea>

<select name="pays">
    <option value="fr">France</option>
    <option value="be" selected>Belgique</option>
</select>
```

## Validação no lado do navegador

```html
<input type="email" name="email" required>
<input type="text" name="pseudo" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Atributo | Função |
|---|---|
| `required` | O campo não pode ficar em branco no momento do envio |
| `minlength` / `maxlength` | Comprimento mínimo/máximo da entrada |
| `min` / `max` | Valor mínimo/máximo (para `number`, `date`...) |
| `pattern` | Uma expressão regular (ver capítulo dedicado) que o valor deve respeitar |

> **Nota (segurança):** esta validação ocorre **no lado do navegador**, antes mesmo do envio — melhora a experiência do usuário (resposta imediata), mas **nunca** substitui uma validação do lado do servidor (ver capítulo sobre segurança em PHP). Um usuário mal-intencionado pode contornar completamente o navegador (pedido HTTP direto) — todos os dados recebidos no lado do servidor devem ser revalidados, sem exceção.

## Apresentação e método

```html
<button type="submit">Envoyer</button>    <!-- soumet le formulaire -->
<button type="reset">Réinitialiser</button> <!-- vide tous les champs -->
<button type="button">Ne fait rien seul</button>  <!-- utile pour un comportement géré en JavaScript -->
```
