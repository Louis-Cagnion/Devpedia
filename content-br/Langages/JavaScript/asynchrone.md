---
order: 13
---

# A programação assíncrona (callbacks, Promises, async/await)

JavaScript executa em uma **única thread** (ao contrário das [threads](/?c=langages-de-programmation&s=c&p=threads) em C): só pode fazer uma coisa por vez. Ainda assim, uma requisição de rede ou um timer não bloqueiam o programa inteiro esperando: é o papel do modelo assíncrono, construído em torno do **loop de eventos** (*event loop*).

## O princípio: o loop de eventos

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // mesmo com 0ms, executa DEPOIS do resto do codigo sincrono
console.log("3");

// Exibe: 1, 3, 2
```

O motor JavaScript executa todo o código **síncrono** primeiro (a pilha de chamadas, *call stack*); as operações assíncronas (timers, requisições de rede, eventos) são delegadas ao ambiente de execução (navegador/Node.js), que coloca seu callback em uma **fila de espera**, executada somente depois que a pilha de chamadas for esvaziada. É esse mecanismo que permite a uma única thread permanecer responsiva sem nunca ser bloqueada por uma operação lenta.

## Os callbacks e o "callback hell"

```javascript
lerArquivo("a.txt", (erroA, conteudoA) => {
    lerArquivo("b.txt", (erroB, conteudoB) => {
        lerArquivo("c.txt", (erroC, conteudoC) => {
            console.log(conteudoA, conteudoB, conteudoC);
        });
    });
});
```

Encadear várias operações assíncronas por callbacks aninhados rapidamente se torna ilegível ("*callback hell*"): as Promises, e depois `async`/`await`, foram introduzidas precisamente para resolver esse problema.

## As Promises

Uma **Promise** representa um valor ainda não disponível, mas que estará (ou falhará) mais tarde; três estados possíveis: *pending* (pendente), *fulfilled* (resolvida), *rejected* (rejeitada).

```javascript
function esperar(milissegundos) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Concluido!"), milissegundos);
    });
}

esperar(1000)
    .then(resultado => console.log(resultado))  // executado se a promessa for resolvida
    .catch(erro => console.log(erro));          // executado se ela for rejeitada
```

### Encadear Promises

```javascript
lerArquivoPromise("a.txt")
    .then(conteudoA => lerArquivoPromise("b.txt"))
    .then(conteudoB => lerArquivoPromise("c.txt"))
    .then(conteudoC => console.log("Tudo foi carregado"))
    .catch(erro => console.log("Uma etapa falhou:", erro));
```

### `Promise.all`: esperar várias promessas em paralelo

```javascript
Promise.all([
    fetch("/api/usuarios"),
    fetch("/api/produtos"),
]).then(([respostaUsuarios, respostaProdutos]) => {
    console.log("As duas requisicoes terminaram");
}).catch(erro => {
    console.log("Pelo menos uma das duas requisicoes falhou:", erro);
});
```

> **Nota:** `Promise.all` dispara as duas requisições **ao mesmo tempo** (não uma após a outra) e espera que todas sejam concluídas: se uma falhar, a Promise global é imediatamente rejeitada, mesmo que a outra tenha tido sucesso.

## `async`/`await`: açúcar sintático por cima das Promises

```javascript
async function carregarUsuario(id) {
    const resposta = await fetch(`/api/usuarios/${id}`);   // "espera" a Promise, sem bloquear a thread
    const dados = await resposta.json();
    return dados;
}
```

- `async` antes de uma função faz com que ela **sempre** retorne uma Promise, implicitamente.
- `await` só pode ser usado dentro de uma função `async`: ele "pausa" essa função (sem bloquear o resto do programa) até que a Promise seja resolvida ou rejeitada.

```javascript
// Equivalente estritamente identico, mas bem mais legivel que com .then() aninhados:
async function carregarTudo() {
    const conteudoA = await lerArquivoPromise("a.txt");
    const conteudoB = await lerArquivoPromise("b.txt");
    const conteudoC = await lerArquivoPromise("c.txt");
    console.log(conteudoA, conteudoB, conteudoC);
}
```

Veja também [O tratamento de erros](/?c=langages-de-programmation&s=javascript&p=gestion-des-erreurs) para `try`/`catch` em torno de um `await`, e [As trocas HTTP em PHP](/?c=langages-de-programmation&s=php&p=http) (cURL) para um equivalente síncrono do `fetch()`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | JavaScript executa todo o código síncrono antes de processar a fila de eventos assíncronos (timers, rede). As Promises (`then`/`catch`) e depois `async`/`await` estruturam esse código sem callbacks aninhados. |
| **Ferramentas utilizáveis** | `Promise`, `Promise.all`, `async`/`await`, `.then()`/`.catch()`. |
| **Armadilhas a evitar** | O "callback hell" (callbacks aninhados ilegíveis); esquecer que um `throw` em uma função `async` rejeita a Promise em vez de lançar uma exceção imediata. |
| **Boas práticas** | Preferir `async`/`await` a `.then()` encadeados pela legibilidade; usar `Promise.all` para disparar várias operações independentes em paralelo em vez de em série. |
