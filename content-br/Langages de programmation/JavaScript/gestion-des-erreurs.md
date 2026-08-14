---
order: 9
---

# Gestão de erros

O JavaScript sinaliza um erro através do lançamento de uma **exceção** (`throw`), que pode ser interceptada com `try` / `catch` — um mecanismo semelhante ao do PHP ou do Python.

## `try` / `catch` / `finally`

```javascript
try {
    const resultado = JSON.parse("{ invalide");
} catch (erro) {
    console.log("Erreur de parsing :", erro.mensagem);
} finally {
    console.log("Tentative terminée");   // executado em todos os casos
}
```

## Detectar os próprios erros

```javascript
function calculerAge(anneeNaissance) {
    const anneeCourante = new Date().getFullYear();
    if (anneeNaissance > anneeCourante) {
        throw new Error("L'année de naissance ne peut pas être dans le futur");
    }
    return anneeCourante - anneeNaissance;
}

try {
    calculerAge(3000);
} catch (erro) {
    console.log(erro.mensagem);
}
```

## Criar um tipo de erro personalizado

```javascript
class SoldeInsuffisantError extends Error {
    constructor(mensagem) {
        super(mensagem);
        this.name = "SoldeInsuffisantError";
    }
}

function retirer(saldo, montant) {
    if (montant > saldo) {
        throw new SoldeInsuffisantError(`Solde de ${saldo}€ insuffisant`);
    }
    return saldo - montant;
}

try {
    retirer(100, 150);
} catch (erro) {
    if (erro instanceof SoldeInsuffisantError) {
        console.log("Solde insuffisant :", erro.mensagem);
    } else {
        throw erro;   // erro inesperado: deixar que seja apresentado em vez de o ocultar
    }
}
```

## Erros e código assíncrono

Um `try` / `catch` clássico **não intercepta** o erro de uma função assíncrona se esta não for, por sua vez, ``await`ée` (ver capítulo sobre assíncrono):

```javascript
async function chargerDonnees() {
    try {
        const resposta = await fetch("/api/donnees");
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        console.log("Échec du chargement :", erro.mensagem);
    }
}
```

Para uma `Promise` não `await`, o site `.catch()` desempenha a mesma função:

```javascript
fetch("/api/donnees")
    .then(resposta => resposta.json())
    .catch(erro => console.log("Échec :", erro.mensagem));
```

> **Nota:** um erro gerado numa função `async` não se torna imediatamente uma exceção clássica do JavaScript — transforma a `Promise` devolvida numa promessa **rejeitada**, recuperável apenas através de `await` num `try` / `catch`, ou através de `.catch()`.
