---
order: 12
---

# Programação assíncrona (callbacks, Promises, async/await)

O JavaScript é executado num **único thread** (ao contrário dos threads abordados no capítulo dedicado à linguagem C): só pode realizar uma tarefa de cada vez. No entanto, uma solicitação de rede ou um temporizador não bloqueiam todo o programa enquanto aguardam — essa é a função do modelo assíncrono, construído em torno do **ciclo de eventos** (*event loop*).

## O princípio: o ciclo de eventos

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // mesmo com 0 ms, é executado DEPOIS do resto do código síncrono
console.log("3");

// Exibir: 1, 3, 2
```

O motor JavaScript executa primeiro todo o código **síncrono** (a pilha de chamadas, *call stack*); as operações assíncronas (temporizadores, pedidos de rede, eventos) são delegadas ao ambiente de execução (navegador/Node.js), que coloca a respetiva função de retorno numa **fila**, executada apenas depois de a pilha de chamadas estar vazia. É este mecanismo que permite que um único thread se mantenha responsivo sem nunca ficar bloqueado por uma operação lenta.

## Os callbacks — e o «callback hell»

```javascript
lireFichier("a.txt", (erreurA, contenuA) => {
    lireFichier("b.txt", (erreurB, contenuB) => {
        lireFichier("c.txt", (erreurC, contenuC) => {
            console.log(contenuA, contenuB, contenuC);
        });
    });
});
```

Encadeamento de várias operações assíncronas através de callbacks aninhados torna-se rapidamente ilegível («*callback hell*») — as Promises e, posteriormente, `async` / `await`, foram introduzidas precisamente para resolver este problema.

## As Promises

Uma **Promise** representa um valor que ainda não está disponível, mas que o estará (ou falhará) mais tarde — três estados possíveis: *pending* (em espera), *fulfilled* (resolvida), *rejected* (rejeitada).

```javascript
function attendre(millisecondes) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Terminé !"), millisecondes);
    });
}

attendre(1000)
    .then(resultado => console.log(resultado))   // executado se a promessa for resolvida
    .catch(erro => console.log(erro));      // executado caso seja rejeitado
```

### Encadeamento de Promises

```javascript
lireFichierPromise("a.txt")
    .then(contenuA => lireFichierPromise("b.txt"))
    .then(contenuB => lireFichierPromise("c.txt"))
    .then(contenuC => console.log("Tout est chargé"))
    .catch(erro => console.log("Une étape a échoué :", erro));
```

### `Promise.all` : aguardar várias promessas em paralelo

```javascript
Promise.all([
    fetch("/api/utilisateurs"),
    fetch("/api/produits"),
]).then(([reponseUtilisateurs, reponseProduits]) => {
    console.log("Les deux requêtes sont terminées");
}).catch(erro => {
    console.log("Au moins une des deux requêtes a échoué :", erro);
});
```

> **Nota:** `Promise.all` lança as duas consultas **ao mesmo tempo** (não uma a seguir à outra) e aguarda que todas sejam bem-sucedidas — se uma falhar, a Promise global é imediatamente rejeitada, mesmo que a outra tenha sido bem-sucedida.

## `async` / `await`: sintaxe simplificada sobre as Promises

```javascript
async function chargerUtilisateur(id) {
    const resposta = await fetch(`/api/utilisateurs/${id}`);   // «aguarda» a Promise, sem bloquear o thread
    const dados = await resposta.json();
    return dados;
}
```

- `async` A presença de «promise» à frente de uma função faz com que esta devolva **sempre** uma Promise, implicitamente.
- `await` Só pode ser utilizada no interior de uma função `async` — «pausa» essa função (sem bloquear o resto do programa) até que a Promise seja resolvida ou rejeitada.

```javascript
// Equivalente estritamente idêntico, mas muito mais legível do que com .then() aninhados:
async function chargerTout() {
    const contenuA = await lireFichierPromise("a.txt");
    const contenuB = await lireFichierPromise("b.txt");
    const contenuC = await lireFichierPromise("c.txt");
    console.log(contenuA, contenuB, contenuC);
}
```

Consulte também o capítulo sobre gestão de erros em `try` / `catch`, que aborda o `await`, e sobre chamadas HTTP em PHP (`HttpClient`), que apresenta um equivalente síncrono de `fetch()`.
