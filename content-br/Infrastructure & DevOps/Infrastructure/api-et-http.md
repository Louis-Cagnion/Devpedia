---
order: 1
---

# As trocas de dados: API e HTTP

Dois programas rodando em máquinas diferentes (um celular e um servidor remoto, por exemplo) não compartilham memória nem arquivos: para trocar uma informação, eles precisam enviar mensagens por uma rede, seguindo regras comuns que ambos entendem. O **HTTP** (*HyperText Transfer Protocol*) é o conjunto de regras mais usado para essas trocas.

> **Analogia:** fazer um pedido em um restaurante. O cliente (o salão) envia um pedido preciso para a cozinha; a cozinha responde com um prato, ou com uma mensagem se o pedido não puder ser atendido ("em falta"). Nenhuma das duas partes precisa saber como a outra funciona internamente, apenas como formular o pedido e ler a resposta.

## Cliente e servidor: quem pede, quem responde

```text
Cliente (navegador, aplicativo, script...)          Servidor (máquina remota)

        ------------- requisicao ------------->
        <------------ resposta -----------------
```

O **cliente** é quem inicia a troca (uma requisição); o **servidor** é quem a recebe e responde. Um mesmo programa pode ser cliente em uma troca e servidor em outra.

## Uma requisição: um método, um endereço, às vezes dados

Cada requisição HTTP especifica um **método** (o que se quer fazer) e um endereço (o recurso em questão):

| Método | Papel | Exemplo |
|---|---|---|
| `GET` | Obter uma informação, sem modificá-la | Carregar uma página web, ler a lista de produtos de uma loja |
| `POST` | Enviar um novo dado, geralmente para criá-lo | Enviar um formulário, criar uma conta de usuário |
| `PUT` | Substituir um dado existente | Atualizar as informações de um perfil |
| `DELETE` | Excluir um dado | Excluir uma mensagem |

> **Cuidado:** usar `GET` para uma ação que modifica um dado (por exemplo, excluir um item via um simples endereço clicável). Um `GET` deveria poder ser repetido sem consequência (recarregar uma página não deveria mudar nada); muitas ferramentas (crawlers de site, pré-visualizações de links) disparam `GET`s automaticamente, sem intenção do usuário.
>
> **Boa prática:** reservar `GET` apenas para leitura, e usar `POST`/`PUT`/`DELETE` para qualquer ação que realmente modifique um dado.

## A resposta: um código de status, às vezes dados

O servidor sempre responde com um **código de status** (um número que indica se a requisição foi bem-sucedida, e se não, por quê):

| Código | Categoria | Exemplo |
|---|---|---|
| `200` | Sucesso | A requisição foi processada corretamente |
| `301` / `302` | Redirecionamento | O recurso solicitado está em outro endereço |
| `404` | Erro do lado do cliente | O recurso solicitado não existe |
| `500` | Erro do lado do servidor | O servidor encontrou um problema interno ao processar a requisição |

> **Cuidado:** ignorar o código de status e supor que uma requisição foi bem-sucedida simplesmente porque uma resposta chegou. Um servidor com erro (`500`) ainda assim retorna uma resposta, muitas vezes com um conteúdo que se parece muito com uma resposta normal se o código não for verificado.
>
> **Boa prática:** sempre verificar o código de status de uma resposta antes de usar seu conteúdo, e prever explicitamente um tratamento para os casos de erro em vez de codificar apenas o caminho de sucesso.

## Uma API: um servidor pensado para um programa, não para um humano

Uma **API** (*Application Programming Interface*) designa, nesse contexto, um servidor que responde com dados estruturados destinados a serem lidos por um programa, em vez de uma página web destinada a ser exibida em um navegador (veja o formato mais comum para esses dados, [JSON](/?c=infrastructure&p=json)):

```text
Requisicao:  GET https://api.exemplo.com/tempo?cidade=Curitiba

Resposta (status 200):
{
  "cidade": "Curitiba",
  "temperatura": 18,
  "condicoes": "nublado"
}
```

Um programa pode então ler diretamente `temperatura` ou `condicoes`, sem precisar extrair essas informações de uma página web feita para exibição.

> **Cuidado:** confundir "o servidor não responde" (tempo esgotado, rede caiu) com "o servidor responde com um erro" (código `4xx`/`5xx`); os dois exigem tratamentos diferentes, mas parecem uma falha semelhante do ponto de vista de quem chama, se os dois casos não forem distinguidos explicitamente no código.
>
> **Boa prática:** distinguir explicitamente, no código que chama uma API, a ausência de resposta (timeout) da rejeição explícita da requisição (código de erro); os dois exigem reações diferentes (tentar novamente, ou corrigir a requisição).

## O que reter

| | |
|---|---|
| **O que reter** | O HTTP é o protocolo mais comum para trocar dados entre um cliente e um servidor. Uma requisição especifica um método (`GET`/`POST`/`PUT`/`DELETE`); uma resposta sempre traz um código de status. Uma API é um servidor pensado para ser usado por um programa, não por um humano. |
| **Ferramentas úteis** | Um navegador (para um `GET` simples), ou uma ferramenta dedicada ([`curl`](https://curl.se), [Postman](https://www.postman.com), uma biblioteca HTTP na linguagem de sua escolha) para montar uma requisição completa. |
| **Armadilhas a evitar** | Usar `GET` para uma ação que modifica um dado. Ignorar o código de status de uma resposta. Confundir uma ausência de resposta com uma resposta de erro explícita. |
| **Boas práticas** | Reservar `GET` apenas para leitura. Verificar sistematicamente o código de status antes de usar o conteúdo de uma resposta. Tratar explicitamente os casos de erro, não apenas o caminho de sucesso. |
