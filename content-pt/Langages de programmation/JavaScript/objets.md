---
order: 6
---

# Os objetos

Um objeto em JavaScript é uma estrutura que permite armazenar dados sob a forma de pares chave/valor. Ao contrário de um array, a ordem não é o elemento importante: acede-se a um valor através do seu nome (a chave), e não através de um índice numérico.

Pode ser criada de duas formas diferentes:
```javascript
    // literal, a mais comum
    const obj1 = { nome: 'Jean', idade: 25 };

    // com o construtor Object
    const obj2 = new Object();
    obj2.nome = 'Jean';

    // Um valor pode ser de qualquer tipo, incluindo uma função ou outro objeto
    const obj3 = {
        nome: 'Jean',
        adresse: { cidade: 'Paris', code: 75000 },
        direBonjour: function () { console.log('bonjour'); }
    };
```

### Aceder e alterar as propriedades

Existem duas formas de aceder a uma propriedade de um objeto: a notação com ponto e a notação com colchetes (útil quando o nome da chave é dinâmico ou contém caracteres especiais).
```javascript
    const obj = { nome: 'Jean', idade: 25 };

    obj.nome; // «Jean»
    obj['nom']; // «Jean», equivalente a obj.nom

    // adição ou alteração de uma propriedade
    obj.cidade = 'Paris';
    obj.idade = 26;

    // eliminação de uma propriedade
    delete obj.idade;
```

### Os métodos estáticos da classe Object

Ao contrário dos protótipos de string ou de array, estas funções não são utilizadas diretamente no objeto, mas sim num`Object`o, passando-lhe o objeto como parâmetro.

```javascript
    const obj = { nome: 'Jean', idade: 25 };
```

**`Object.keys`** Devolve um array que contém apenas as chaves do objeto.
```javascript
    Object.keys(obj); // ['nome', 'idade']
```

**`Object.values`** retorna um array que contém apenas os valores do objeto.
```javascript
    Object.values(obj); // ['Jean', 25]
```

**`Object.entries`** retorna um array de pares «`[chave, valor]`», útil para percorrer um objeto com um ciclo ou «`forEach`».
```javascript
    Object.entries(obj); // [['nome', 'Jean'], ['idade', 25]]
```

**`Object.assign`** copia as propriedades de um ou mais objetos de origem para um objeto de destino e devolve esse objeto de destino. Frequentemente utilizado para fundir objetos ou criar uma cópia dos mesmos.
```javascript
    const copie = Object.assign({}, obj); // cópia de obj
    const fusion = Object.assign({}, obj, { cidade: 'Paris' }); // { nome: 'Jean', idade: 25, cidade: 'Paris' }
```

**`Object.freeze`** Impede qualquer modificação do objeto (adição, eliminação ou alteração de propriedade). Qualquer tentativa de modificação é ignorada silenciosamente (ou provoca um erro no modo estrito).
```javascript
    Object.freeze(obj);
    obj.idade = 30; // não tem qualquer efeito, a idade do objeto permanece em 25
```

**`Object.fromEntries`** faz o inverso de `Object.entries`: transforma um tabuleiro de pares `[chave, valor]` num objeto.
```javascript
    Object.fromEntries([['nom', 'Jean'], ['age', 25]]); // { nome: 'Jean', idade: 25 }
```

### Verificar uma propriedade

**`hasOwnProperty`** É um protótipo disponível diretamente num objeto: devolve «`true`» se a chave indicada existir no próprio objeto (e não for herdada).
```javascript
    obj.hasOwnProperty('nom'); // true
    obj.hasOwnProperty('inconnu'); // false
```

**O operador `in`** também verifica a existência de uma chave, mas incluindo as propriedades herdadas.
```javascript
    'nom' in obj; // true
```

### A desestruturação e o spread

A **desestruturação** permite extrair diretamente determinadas propriedades de um objeto para variáveis, utilizando os nomes das chaves.
```javascript
    const obj = { nome: 'Jean', idade: 25 };
    const { nome, idade } = obj; // nome = 'Jean', idade = 25

    // É possível renomear uma variável durante a desestruturação
    const { nome: prenom } = obj; // nome = 'Jean'
```

O **spread** (`...`) permite «desdobrar» um objeto, o que é útil para o copiar ou para fundir vários objetos entre si.
```javascript
    const copie = { ...obj }; // cópia independente de obj
    const fusion = { ...obj, cidade: 'Paris' }; // { nome: 'Jean', idade: 25, cidade: 'Paris' }
```
