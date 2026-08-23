---
order: 5
---

# Os formulários

Um formulário HTML coleta dados digitados pelo usuário, para enviá-los a um servidor (via `GET` ou `POST`, veja [As trocas de dados: API e HTTP](/?c=infrastructure&p=api-et-http)): é o principal ponto de entrada de qualquer dado do usuário em uma aplicação web.

## A estrutura básica

```html
<form action="/cadastro" method="POST">
    <label for="email">Endereco de email</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">Cadastrar</button>
</form>
```

- `action`: a URL para onde os dados são enviados na submissão.
- `method`: `GET` (dados visíveis na URL, para uma busca por exemplo) ou `POST` (dados no corpo da requisição, para dados sensíveis ou volumosos; veja [As trocas de dados: API e HTTP](/?c=infrastructure&p=api-et-http) para a diferença completa).
- `name` em cada campo: é esse valor, **não** `id`, que identifica o campo do lado do servidor (`$_POST['email']` em [PHP](/?c=langages-de-programmation&s=php&p=php), por exemplo).

## `<label>`: indispensável, não decorativo

```html
<label for="email">Endereco de email</label>
<input type="email" id="email" name="email">
```

O atributo `for` do `<label>` precisa corresponder ao `id` do campo: clicar no label então ativa/foca automaticamente o campo associado, e um leitor de tela anuncia esse label quando o usuário chega ao campo. Um campo **sem** `<label>` associado é um problema de acessibilidade grave, mesmo que continue visualmente compreensível para um usuário que enxerga.

## Tipos de campo (`<input>`)

```html
<input type="text" name="nome">
<input type="email" name="email">          <!-- validacao basica do formato de email pelo navegador -->
<input type="password" name="senha">       <!-- mascara a digitacao -->
<input type="number" name="idade" min="0" max="120">
<input type="date" name="nascimento">
<input type="checkbox" name="aceita" value="sim">
<input type="radio" name="genero" value="m"> <input type="radio" name="genero" value="f">
<input type="file" name="documento">
<input type="hidden" name="token" value="abc123">
```

> **Nota (segurança):** um campo oculto carregando um token (como `token` acima) é o mecanismo comum de proteção contra **CSRF** (*Cross-Site Request Forgery*); veja [A segurança](/?c=langages-de-programmation&s=php&p=securite) para o detalhe desse ataque e de sua proteção. O campo é invisível para o usuário, mas é enviado normalmente com o resto do formulário na submissão.

> **Nota:** dois botões de rádio compartilhando o mesmo `name` formam um **grupo**: apenas um pode ser selecionado por vez entre eles, ao contrário das caixas de seleção (`checkbox`), independentes umas das outras mesmo com o mesmo `name`.

## `<textarea>` e `<select>`

```html
<textarea name="mensagem" rows="5" cols="30"></textarea>

<select name="pais">
    <option value="br">Brasil</option>
    <option value="pt" selected>Portugal</option>
</select>
```

## Validação do lado do navegador

```html
<input type="email" name="email" required>
<input type="text" name="usuario" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Atributo | Papel |
|---|---|
| `required` | O campo não pode estar vazio na submissão |
| `minlength` / `maxlength` | Comprimento mínimo/máximo da digitação |
| `min` / `max` | Valor mínimo/máximo (para `number`, `date`...) |
| `pattern` | Uma [expressão regular](/?c=domain-specific-languages-dsl&p=regex) que o valor precisa respeitar |

> **Nota (segurança):** essa validação acontece **do lado do navegador**, antes mesmo do envio; ela melhora a experiência do usuário (retorno imediato), mas **nunca** substitui uma validação do lado do servidor (veja [A segurança](/?c=langages-de-programmation&s=php&p=securite)). Um usuário mal-intencionado pode contornar inteiramente o navegador (requisição HTTP direta): todo dado recebido do lado do servidor precisa ser revalidado, sem exceção.

## Submissão e método

```html
<button type="submit">Enviar</button>              <!-- submete o formulario -->
<button type="reset">Limpar</button>                <!-- esvazia todos os campos -->
<button type="button">Nao faz nada sozinho</button> <!-- util para um comportamento gerenciado em JavaScript -->
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um formulário coleta dados do usuário e os envia via `GET` (URL) ou `POST` (corpo da requisição). `name` (não `id`) identifica cada campo do lado do servidor; `<label>` é indispensável para a acessibilidade. |
| **Ferramentas utilizáveis** | Atributos de validação do navegador (`required`, `minlength`/`maxlength`, `min`/`max`, `pattern`); tipos de campo (`email`, `password`, `number`, `date`...). |
| **Armadilhas a evitar** | Confiar apenas na validação do lado do navegador: um usuário mal-intencionado pode contorná-la inteiramente; um campo sem `<label>` associado. |
| **Boas práticas** | Sempre revalidar do lado do servidor todo dado recebido, sem exceção; usar um token CSRF em todo formulário que modifica dados. |
