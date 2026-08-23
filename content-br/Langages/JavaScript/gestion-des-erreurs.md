---
order: 10
---

# O tratamento de erros

JavaScript sinaliza um erro lançando uma **exceção** (`throw`), interceptável com `try`/`catch`, um mecanismo próximo do de [PHP](/?c=langages-de-programmation&s=php&p=php) ou [Python](/?c=langages-de-programmation&s=python&p=python).

## `try` / `catch` / `finally`

```javascript
try {
    const resultado = JSON.parse("{ invalido");
} catch (erro) {
    console.log("Erro de parsing:", erro.message);
} finally {
    console.log("Tentativa concluida");   // executado em todos os casos
}
```

## Lançar seus próprios erros

```javascript
function calcularIdade(anoNascimento) {
    const anoAtual = new Date().getFullYear();
    if (anoNascimento > anoAtual) {
        throw new Error("O ano de nascimento nao pode estar no futuro");
    }
    return anoAtual - anoNascimento;
}

try {
    calcularIdade(3000);
} catch (erro) {
    console.log(erro.message);
}
```

## Criar um tipo de erro personalizado

```javascript
class SaldoInsuficienteError extends Error {
    constructor(message) {
        super(message);
        this.name = "SaldoInsuficienteError";
    }
}

function sacar(saldo, valor) {
    if (valor > saldo) {
        throw new SaldoInsuficienteError(`Saldo de ${saldo}R$ insuficiente`);
    }
    return saldo - valor;
}

try {
    sacar(100, 150);
} catch (erro) {
    if (erro instanceof SaldoInsuficienteError) {
        console.log("Saldo insuficiente:", erro.message);
    } else {
        throw erro;   // erro inesperado: deixa-lo subir em vez de mascara-lo
    }
}
```

## Erros e código assíncrono

Um `try`/`catch` clássico **não intercepta** o erro de uma função assíncrona se ela mesma não for `await`ada (veja [A programação assíncrona](/?c=langages-de-programmation&s=javascript&p=asynchrone)):

```javascript
async function carregarDados() {
    try {
        const resposta = await fetch("/api/dados");
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        console.log("Falha no carregamento:", erro.message);
    }
}
```

Para uma `Promise` não `await`ada, `.catch()` desempenha o mesmo papel:

```javascript
fetch("/api/dados")
    .then(resposta => resposta.json())
    .catch(erro => console.log("Falha:", erro.message));
```

> **Nota:** um erro lançado em uma função `async` não se torna uma exceção JavaScript clássica imediata: ele transforma a `Promise` retornada em uma promessa **rejeitada**, recuperável apenas via `await` em um `try`/`catch`, ou via `.catch()`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `try`/`catch`/`finally` intercepta uma exceção lançada por `throw`. Um erro em código assíncrono não `await`ado não sobe em um `try`/`catch` clássico: ele rejeita a Promise. |
| **Ferramentas utilizáveis** | `Error` e suas subclasses personalizadas (`extends Error`), `instanceof` para distinguir os tipos de erro, `.catch()` em uma Promise. |
| **Armadilhas a evitar** | Esperar que um `try`/`catch` intercepte o erro de uma Promise não `await`ada; ele nunca fará isso. |
| **Boas práticas** | Sempre `await` uma operação assíncrona dentro de um `try`/`catch`, ou encadear `.catch()` na Promise correspondente; deixar um erro inesperado subir em vez de mascará-lo silenciosamente. |
