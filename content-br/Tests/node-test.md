---
order: 13
---

# O executor de testes integrado do Node: node:test (31/10/2026)

**Node.js** ([nodejs.org](https://nodejs.org)) é o programa que executa JavaScript fora de um navegador, diretamente pelo terminal. Ele traz de fábrica um **executor de testes**: uma ferramenta que encontra os arquivos de testes, os executa, compara os resultados com os valores esperados e exibe um relatório. Ele se chama `node:test` e não exige nenhuma instalação adicional. Sua documentação oficial é [a página node:test do Node.js](https://nodejs.org/api/test.html).

Este capítulo complementa [os testes unitários](/?c=tests&p=tests-unitaires), que explicam o que é um bom teste, e [os testes end-to-end](/?c=tests&p=tests-end-to-end), que simulam um percurso completo. O capítulo sobre [testar uma interface em um navegador sem janela](/?c=tests&p=tests-navigateur-sans-fenetre) escreveu seu próprio pequeno executor à mão: o `node:test` oferece tudo isso pronto (relatório, código de saída, filtros), e pode muito bem servir de base para esse tipo de série. Ele pressupõe conhecidos [o terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam comandos), [um editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions), [os erros](/?c=langages&s=javascript&p=gestion-des-erreurs) (`throw`, `try`, `catch`) e [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) (`async`, `await`, promessas).

A data no título é a da verificação: os exemplos foram todos executados naquele dia, e certas opções (a cobertura, em especial) podem mudar de uma versão do Node para outra.

## O princípio: um comando, um relatório, um código

```text
  arquivos *.test.mjs         node --test                     terminal
 ┌───────────────────┐   ┌───────────────────────┐   ┌─────────────────────────┐
 │ test("...", ...)  │-->│ 1. procura os arquivos│-->│ ✔ teste aprovado        │
 │ test("...", ...)  │   │ 2. executa cada teste │   │ ✖ teste falhou + detalhe│
 └───────────────────┘   │ 3. conta os resultados│   │ resumo: pass / fail     │
                         └───────────┬───────────┘   └─────────────────────────┘
                                     v
                          código de saída: 0 ou 1
```

Um **teste** é uma pequena função que prepara uma situação, chama o código a verificar e compara o resultado com o que se espera. Um teste passa se não lança nenhum erro, e falha se lançar um. O **código de saída** é o número que um programa devolve ao terminar: `0` significa «tudo certo», qualquer outro valor sinaliza uma falha. É esse número, e somente ele, que um script ou um servidor de integração contínua lê para decidir se os testes passaram.

| Necessidade | O que fornece `node:test` | Equivalente a instalar em outro lugar |
|---|---|---|
| Declarar testes | `test`, `describe`, `it` | Jest, Mocha, Vitest |
| Comparar valores | `node:assert/strict` (incluído no Node) | Chai, `expect` do Jest |
| Preparar e limpar | `before`, `after`, `beforeEach`, `afterEach` | os mesmos nomes em outros lugares |
| Substituir uma função | `mock.fn`, `mock.method` | `jest.fn`, Sinon |
| Medir a cobertura | opção `--experimental-test-coverage` | nyc, c8 |
| Escolher o formato do relatório | opção `--test-reporter` | plugins de relatório |

## Preparar uma pasta e um primeiro módulo

Crie uma pasta vazia, abra nela um terminal e crie o arquivo abaixo. Um **módulo** é um arquivo JavaScript que disponibiliza ferramentas para outros arquivos: `export` torna uma função visível de fora, `import` vai buscar a de outro arquivo. A extensão `.mjs` indica ao Node que o arquivo usa essa sintaxe, sem outra configuração. A função testada calcula um preço após o desconto e recusa um percentual absurdo.

```javascript
// remise.mjs
// Calcula o preço após o desconto; recusa um percentual fora de 0 a 100
export function calcularDesconto(preco, percentual) {
    if (percentual < 0 || percentual > 100) {          // percentual impossível
        throw new RangeError("percentual fora de 0 a 100");   // erro nomeado RangeError
    }
    return preco * (1 - percentual / 100);             // 10%: preco * 0,9
}
```

## Um primeiro teste

O arquivo a seguir importa `test` de `node:test` (o prefixo `node:` designa uma ferramenta incluída no Node, em oposição a um arquivo seu), o comparador `assert` (do inglês «assert», «afirmar»), e depois a função a testar. Uma **asserção** é uma frase que afirma que algo é verdadeiro; se for falsa, ela lança um erro e o teste falha. O módulo `node:assert/strict` acrescenta o modo **estrito**: `1` e `"1"` são considerados diferentes, o que evita más surpresas.

```javascript
// remise.test.mjs
import test from "node:test";                    // a função test, fornecida pelo Node
import assert from "node:assert/strict";         // as asserções, em modo estrito
import { calcularDesconto } from "./remise.mjs"; // a função a verificar

// Arrange: os valores são escritos na chamada; Act: chamamos calcularDesconto;
// Assert: equal compara o resultado obtido (1º argumento) ao resultado esperado (2º)
test("10% de desconto sobre 100 dá 90", () => {
    assert.equal(calcularDesconto(100, 10), 90);
});
```

A estrutura Arrange / Act / Assert (preparar, agir, verificar) é detalhada no capítulo sobre [os testes unitários](/?c=tests&p=tests-unitaires). Execute em seguida:

```bash
# verifica a sintaxe dos dois arquivos, sem executar nada
node --check remise.mjs
node --check remise.test.mjs
# executa todos os testes da pasta atual
node --test
# mostra o código de saída do comando anterior
echo $?
```

Saída observada em um terminal (as durações variam de uma execução para outra):

```text
✔ 10% de desconto sobre 100 dá 90 (0.517131ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.865271
```

O código de saída mostrado por `echo $?` era `0`. As linhas `ℹ` formam o resumo: `pass` conta os aprovados, `fail` as falhas, `skipped` os testes ignorados, `todo` os testes marcados como «a fazer».

## Como o Node encontra os arquivos de teste

`node --test` sem nome de arquivo explora a pasta atual e suas subpastas. Ele não executa todos os arquivos JavaScript, apenas aqueles cujo nome segue uma convenção. Esta tabela vem de testes reais: cinco arquivos lado a lado, e apenas um não foi encontrado.

| Arquivo | Encontrado por `node --test`? | Motivo |
|---|---|---|
| `remise.test.mjs` | sim | o nome termina em `.test` |
| `mon-test.mjs` | sim | o nome termina em `-test` |
| `test/a.mjs` | sim | qualquer arquivo de uma pasta chamada `test` |
| `b.spec.mjs` | não | `.spec` não é reconhecido por padrão |
| `remise.mjs` | não | não é um arquivo de teste (ele é apenas importado) |

Para executar um arquivo específico, mesmo que ele não tenha um nome reconhecido, informe o seu caminho: `node --test b.spec.mjs` o executa (observado).

## Quando um teste falha

Vamos trocar o valor esperado por um valor falso de propósito (20% de 50 dão 40, e não 35):

```javascript
// echec.test.mjs
import test from "node:test";                    // a função test
import assert from "node:assert/strict";         // as asserções estritas
import { calcularDesconto } from "./remise.mjs"; // a função a verificar

test("20% de desconto sobre 50 dá 35 (falso de propósito)", () => {
    assert.equal(calcularDesconto(50, 20), 35);  // 40 é obtido, 35 é esperado: falha
});
```

Saída observada (início do detalhe; o restante é uma lista das chamadas internas do Node, a «pilha de chamadas», que indica onde o erro nasceu):

```text
✖ 20% de desconto sobre 50 dá 35 (falso de propósito) (0.952109ms)
ℹ tests 1
ℹ fail 1
✖ failing tests:

test at echec.test.mjs:5:1
✖ 20% de desconto sobre 50 dá 35 (falso de propósito) (0.952109ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  40 !== 35
```

A mensagem do Node está em inglês: `Expected values to be strictly equal` significa «os valores deveriam ser estritamente iguais». A linha `40 !== 35` mostra à esquerda o valor obtido e à direita o valor esperado. O código de saída era `1`: é isso que faz um servidor de integração contínua ficar vermelho.

## Organizar: `test`, `describe` e `it`

`describe` (que significa «descrever») agrupa testes em uma **suíte** (um grupo com nome); `it` (que se lê «isso deveria») declara um teste dentro dele. `it` e `test` fazem exatamente o mesmo trabalho: `describe` e `it` se leem como uma frase («descrever calcularDesconto: ele aplica 10% sobre 100»).

| Função | Papel | Exemplo de leitura |
|---|---|---|
| `test(nome, função)` | declara um teste isolado | «teste: 10% sobre 100 dá 90» |
| `it(nome, função)` | declara um teste, como `test` | «ele aplica 10% sobre 100» |
| `describe(nome, função)` | agrupa testes em uma suíte | «descrever calcularDesconto» |
| `it(nome, { skip: "motivo" }, f)` | ignora o teste e exibe o motivo | «ainda não escrito» |
| `it(nome, { todo: "motivo" }, f)` | marca «a fazer»: ele é executado, mas não conta como aprovado | «a terminar» |

Segue uma suíte completa, com os casos-limite (zero, cem, valores proibidos) vistos em [os testes unitários](/?c=tests&p=tests-unitaires). Substitua o conteúdo de `remise.test.mjs`:

```javascript
// remise.test.mjs
import { describe, it } from "node:test";        // describe agrupa, it declara um teste
import assert from "node:assert/strict";         // as asserções estritas
import { calcularDesconto } from "./remise.mjs"; // a função a verificar

describe("calcularDesconto", () => {             // a suíte leva o nome da função
    it("aplica 10% sobre 100", () => {
        assert.equal(calcularDesconto(100, 10), 90);     // caso normal
    });

    it("não muda nada com 0%", () => {
        assert.equal(calcularDesconto(80, 0), 80);       // limite inferior
    });

    it("devolve 0 com 100%", () => {
        assert.equal(calcularDesconto(80, 100), 0);      // limite superior
    });

    it("recusa um percentual negativo", () => {
        // throws espera um erro; RangeError precisa qual
        assert.throws(() => calcularDesconto(80, -5), RangeError);
    });

    it("recusa um percentual acima de 100", () => {
        assert.throws(
            () => calcularDesconto(80, 101),                   // a chamada que deve falhar
            { name: "RangeError", message: "percentual fora de 0 a 100" },   // erro exato
        );
    });
});
```

Saída observada: `describe` exibe um título `▶ calcularDesconto`, os cinco testes recuados com `✔`, e o resumo `tests 5`, `suites 1`, `pass 5`, `fail 0`.

## As asserções de `node:assert/strict`

Cada asserção compara valores e lança um erro se a comparação for falsa. Todas as da tabela foram executadas.

| Asserção | Verifica | Exemplo que passa |
|---|---|---|
| `equal(a, b)` | `a` e `b` são estritamente iguais (números, textos) | `assert.equal(1 + 1, 2)` |
| `notEqual(a, b)` | `a` e `b` são diferentes | `assert.notEqual(1, "1")` |
| `ok(valor)` | o valor é «verdadeiro» | `assert.ok("texto".includes("ex"))` |
| `deepEqual(a, b)` | dois objetos ou listas têm o mesmo **conteúdo** | `assert.deepEqual({ a: 1 }, { a: 1 })` |
| `match(texto, padrão)` | o texto corresponde a uma [expressão regular](/?c=langages&s=javascript&p=regex) | `assert.match("ref-042", /^ref-\d+$/)` |
| `throws(função, erro)` | a chamada lança o erro esperado | `assert.throws(() => JSON.parse("{"), SyntaxError)` |
| `rejects(promessa, erro)` | a promessa falha com o erro esperado | ver a seção seguinte |

Duas sutilezas, verificadas por execução. `assert.equal({ a: 1 }, { a: 1 })` **falha**: dois objetos distintos são duas «caixas» diferentes, mesmo que o conteúdo seja idêntico, e `equal` compara as caixas. Para comparar o conteúdo, use `deepEqual`. E `deepEqual` em modo estrito distingue `[1]` de `["1"]`. A lista completa está na [documentação de node:assert](https://nodejs.org/api/assert.html).

## Testar código assíncrono

Uma operação **assíncrona** devolve seu resultado mais tarde (leitura de um arquivo, chamada de rede): ela devolve uma **promessa**, um objeto que representa esse resultado futuro (veja [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone)). Se a função de um teste for declarada `async`, o Node espera que ela termine antes de julgar o teste. Crie primeiro o código a testar:

```javascript
// utilisateurs.mjs
// Busca um usuário; a "base" é aqui um simples objeto na memória
const BASE = { 1: "Ada", 2: "Linus" };                   // número -> nome

export async function buscarNome(id) {
    await new Promise((resolve) => setTimeout(resolve, 10));   // simula 10 ms de espera
    if (!(id in BASE)) {                                 // número ausente da base
        throw new Error(`usuário ${id} não encontrado`);   // em async: promessa rejeitada
    }
    return BASE[id];                                     // o nome encontrado
}
```

```javascript
// asynchrone.test.mjs
import test from "node:test";                        // a função test
import assert from "node:assert/strict";             // as asserções estritas
import { buscarNome } from "./utilisateurs.mjs";     // a função assíncrona a verificar

test("encontra Ada", async () => {                   // async: o Node espera o fim do teste
    const nome = await buscarNome(1);                // await: esperamos o resultado real
    assert.equal(nome, "Ada");                       // depois o comparamos
});

test("sinaliza um usuário desconhecido", async () => {
    // rejects verifica que uma promessa falha; o await é indispensável
    await assert.rejects(buscarNome(99), { message: "usuário 99 não encontrado" });
});
```

Saída observada: os dois testes exibem `✔` (cerca de 11 ms cada, o tempo da espera simulada) e o resumo indica `pass 2`.

## Preparar e limpar: os hooks

Um **hook** («gancho») é uma função que o executor chama automaticamente em um momento preciso, para evitar copiar a mesma preparação em cada teste. O arquivo a seguir testa um pequeno carrinho de compras, com um carrinho novo antes de cada teste:

```javascript
// panier.mjs
// Um carrinho de compras: uma lista de artigos com um total
export class Carrinho {
    artigos = [];                                    // a lista de { nome, preco }

    adicionar(nome, preco) {
        this.artigos.push({ nome, preco });          // adiciona um artigo ao final
    }

    get total() {                                    // lido como carrinho.total, sem ()
        return this.artigos.reduce((soma, artigo) => soma + artigo.preco, 0);
    }

    get tamanho() {                                  // número de artigos
        return this.artigos.length;
    }
}
```

```javascript
// hooks.test.mjs
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";             // as asserções estritas
import { Carrinho } from "./panier.mjs";             // a classe a verificar

describe("Carrinho", () => {
    let carrinho;                                    // será recriado antes de cada teste

    before(() => console.log("[before] uma vez, antes de todos os testes"));
    after(() => console.log("[after] uma vez, depois de todos os testes"));
    beforeEach(() => {
        carrinho = new Carrinho();                   // um carrinho novo para cada teste
        console.log("[beforeEach] carrinho novo");
    });
    afterEach(() => console.log("[afterEach] limpeza"));

    it("começa vazio", () => {
        assert.equal(carrinho.tamanho, 0);           // nenhum artigo no início
    });

    it("soma os preços", () => {
        carrinho.adicionar("stylo", 2);              // 2
        carrinho.adicionar("cahier", 5);             // 5
        assert.equal(carrinho.total, 7);             // 2 + 5
    });

    it("não guarda nada do teste anterior", () => {
        assert.equal(carrinho.tamanho, 0);           // o carrinho do teste anterior sumiu
    });
});
```

| Hook | Momento da chamada | Uso típico |
|---|---|---|
| `before` | uma vez, antes do primeiro teste da suíte | abrir um recurso custoso (conexão, arquivo temporário) |
| `beforeEach` | antes de cada teste | recriar um objeto novo (o carrinho) |
| `afterEach` | depois de cada teste | apagar o que o teste deixou |
| `after` | uma vez, depois do último teste | fechar o recurso aberto por `before` |

Saída observada: as 8 linhas `[before]`, `[beforeEach]`, `[afterEach]`, `[after]` aparecem na ordem esperada (um `before`, depois três vezes o par `beforeEach` e `afterEach`, depois um `after`), mas **antes** da árvore dos `✔`, pois o relatório `spec` imprime tudo em bloco ao final da suíte. Os três testes passaram.

## Substituir uma dependência por uma função espiã

Um **mock** é um componente falso que substitui um verdadeiro; uma **função espiã** (*spy*) é um mock que apenas anota como foi chamada. O capítulo sobre [mocks, stubs e fakes em detalhe](/?c=tests&p=mocks-stubs-et-fakes-en-detail) explica suas famílias e a armadilha da sobressimulação. Aqui, `mock.fn()` cria o espião: a função `lembrar` recebe `enviar` como argumento, e lhe damos um falso que não envia nada, portanto nenhum e-mail e nenhuma rede.

```javascript
// mock.test.mjs
import { describe, it, mock } from "node:test";      // mock fornece as funções espiãs
import assert from "node:assert/strict";             // as asserções estritas

// Envia um lembrete a cada atrasado pela função "enviar" recebida como argumento
function lembrar(atrasados, enviar) {
    for (const pessoa of atrasados) {                // uma mensagem por pessoa
        enviar(pessoa.email, `Olá ${pessoa.nome}, não esqueça de devolver o livro.`);
    }
    return atrasados.length;                         // número de mensagens enviadas
}

describe("lembrar", () => {
    it("envia uma mensagem por atrasado, sem rede", () => {
        const enviar = mock.fn();                    // espião: não faz nada, anota tudo
        const lista = [
            { nome: "Ada", email: "ada@example.org" },
            { nome: "Linus", email: "linus@example.org" },
        ];

        const total = lembrar(lista, enviar);        // passamos o espião no lugar do real

        assert.equal(total, 2);                      // duas pessoas, duas mensagens
        assert.equal(enviar.mock.callCount(), 2);    // o espião foi chamado duas vezes
        assert.deepEqual(enviar.mock.calls[0].arguments, [   // argumentos da 1ª chamada
            "ada@example.org",
            "Olá Ada, não esqueça de devolver o livro.",
        ]);
    });

    it("pode devolver um valor escolhido", () => {
        const dizer = mock.fn(() => "olá");          // mock.fn aceita um substituto
        assert.equal(dizer(), "olá");                // o substituto responde
        assert.equal(dizer.mock.callCount(), 1);     // e o espião contou a chamada
    });

    it("substitui fetch para evitar a rede", async (t) => {
        // fetch é a função do Node que envia uma requisição pela rede;
        // t.mock a substitui apenas durante este teste
        t.mock.method(globalThis, "fetch", async () => ({
            ok: true,                                // falsa resposta bem-sucedida
            json: async () => ({ nome: "Ada" }),     // falsa leitura do conteúdo
        }));

        const resposta = await fetch("https://exemple.invalid/api");   // endereço fictício
        const dados = await resposta.json();         // lê a falsa resposta

        assert.equal(dados.nome, "Ada");             // conteúdo da falsa resposta
        assert.equal(fetch.mock.callCount(), 1);     // uma única chamada ocorreu
    });
});

it("fetch é restaurada após o teste", () => {
    assert.equal(fetch.mock, undefined);             // sem espião: o fetch real está lá
});
```

| Ferramenta | O que faz | Restauração |
|---|---|---|
| `mock.fn()` | cria uma função espiã, com ou sem substituto | nada a restaurar: é uma função nova |
| `mock.method(objeto, "nome", substituto)` | substitui um método existente | à mão: `mock.restoreAll()` |
| `t.mock.method(...)` | idem, vinculado ao teste `t` | automática ao fim do teste |
| `espiao.mock.callCount()` | número de chamadas | não se aplica |
| `espiao.mock.calls[i].arguments` | lista dos argumentos da i-ésima chamada | não se aplica |

Saída observada: os quatro testes passaram, inclusive o último, que prova que `t.mock` devolveu o `fetch` real. O endereço `exemple.invalid` não existe: se a substituição falhasse, o teste lançaria um erro de rede em vez de passar.

## Executar somente alguns testes

| Opção ou ajuste | Efeito | Observado |
|---|---|---|
| `node --test arquivo.test.mjs` | executa somente este arquivo | sim |
| `--test-name-pattern="soma"` | executa apenas os testes cujo nome contém `soma` (padrão de [expressão regular](/?c=langages&s=javascript&p=regex)) | sim: 1 teste em 4 |
| `--test-name-pattern="^matematica"` | seleciona uma suíte inteira pelo nome | sim: os 4 testes da suíte |
| `{ only: true }` + `--test-only` | executa apenas os testes marcados `only` | sim: `um` executado, `dois` não |
| `{ skip: "motivo" }` | ignora um teste e exibe o motivo | sim: símbolo `﹣` |
| `{ todo: "motivo" }` | marca «a fazer» sem contar como aprovado | sim: contado em `todo` |

Armadilha de ordem: em um arquivo, os testes são executados na ordem em que foram escritos, mas um filtro pula alguns deles. Um teste que depende do estado deixado por outro anterior pode então passar ou falhar conforme o filtro (veja [As armadilhas](#as-armadilhas)).

## Escolher o formato do relatório e ler o código de saída

Um **relatório** (*reporter*) é o formato em que o executor escreve seus resultados. A opção `--test-reporter=<nome>` o escolhe. Observado: em um terminal, o formato padrão é `spec` (legível, com `✔` e `✖`); quando a saída é redirecionada para um arquivo ou para outro programa, o formato padrão é `tap`.

| Relatório | Aparência | Uso |
|---|---|---|
| `spec` | árvore com `✔` e `✖`, resumo no fim | leitura humana no terminal |
| `tap` | linhas `ok 1 - nome` e `not ok 1 - nome`, detalhes indentados | leitura por um programa |
| `dot` | um ponto por teste aprovado (`.....` observado para 4 testes) | suítes muito longas |

**TAP** (*Test Anything Protocol*, «protocolo para testar qualquer coisa») é um formato de texto simples, compreendido por muitas ferramentas de integração contínua. Trecho observado de `node --test --test-reporter=tap`:

```text
TAP version 13
# Subtest: matematica
ok 1 - matematica
1..1
# tests 4
# suites 1
# pass 2
# fail 0
# cancelled 0
# skipped 1
# todo 1
```

| Situação | Código de saída observado |
|---|---|
| todos os testes passam | `0` |
| pelo menos um teste falha | `1` |
| limite de cobertura não atingido | `1` |

Em um script, `node --test && echo "verde"` só exibe «verde» se o código for `0`. Em um `package.json` (o arquivo que descreve um projeto Node), a linha `"test": "node --test"` na seção `scripts` permite então executar `npm test`; esse comando não foi executado para este capítulo.

## Medir a cobertura

A [cobertura de código](/?c=tests&p=couverture-de-code) mede a parte do código executada durante os testes. O Node consegue calculá-la sem ferramenta externa, com a opção `--experimental-test-coverage` (a palavra «experimental» sinaliza que o comportamento pode mudar: por isso o capítulo tem data). Com o único teste `10% sobre 100` da seção anterior e a função `calcularDesconto`, observado:

```bash
# executa os testes e acrescenta uma tabela de cobertura ao final do relatório
node --test --experimental-test-coverage
```

```text
ℹ start of coverage report
ℹ ----------------------------------------------------------------
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ ----------------------------------------------------------------
ℹ remise.mjs      |  71.43 |    66.67 |  100.00 | 4-5
ℹ remise.test.mjs | 100.00 |   100.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ all files       |  85.71 |    80.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ end of coverage report
```

| Coluna | Significado neste exemplo |
|---|---|
| `line %` | parte das linhas executadas: 71,43% para `remise.mjs` |
| `branch %` | parte dos caminhos (os dois lados de um `if`) percorridos |
| `funcs %` | parte das funções chamadas pelo menos uma vez |
| `uncovered lines` | linhas nunca executadas: `4-5` é o `throw` do percentual proibido |

O arquivo de teste em si aparece na tabela (100%): ele distorce a média `all files`. A opção `--test-coverage-lines=90` fixa um mínimo: com 85,71%, o Node exibiu `85.71% line coverage does not meet threshold of 90%` e devolveu o código `1`; com `--test-coverage-lines=50`, o código era `0`. As opções `--test-coverage-branches` e `--test-coverage-functions` também existem (listadas por `node --help`, não testadas). Lembrete do capítulo sobre cobertura: uma porcentagem alta prova que as linhas foram executadas, não que foram verificadas.

## As armadilhas

Cada armadilha abaixo foi reproduzida.

| Armadilha | O que aconteceu | Alternativa |
|---|---|---|
| **Teste sem asserção** | um teste que calcula `2 + 2` sem comparar nada exibe `✔` e o código de saída é `0`: ele nunca pode falhar | uma asserção por comportamento; fazer o teste falhar de propósito para verificar que ele sabe falhar |
| **`await` esquecido diante de `assert.rejects`** | o teste exibe `✔` mesmo que a promessa não tenha rejeitado; o Node então sinaliza uma atividade após o fim do teste e marca o **arquivo** como falho (código `1`) | escrever `await assert.rejects(...)`; não contar com esse filtro de segurança, cuja mensagem aponta o arquivo e não a linha culpada |
| **`await` esquecido sobre um valor** | `assert.equal(buscarNome(1), "Grace")` compara uma promessa pendente com um texto: o teste falha, com `Promise { <pending> }` na mensagem | `await buscarNome(1)` antes de comparar |
| **Código executado após o fim do teste** | um `setTimeout` que falha 50 ms depois deixa seu teste em `✔`; o Node exibe uma mensagem de aviso e marca o **arquivo** como falho (código `1`) | esperar o fim da operação dentro do teste (`await`) |
| **Estado compartilhado entre testes** | um carrinho criado uma única vez para toda a suíte guarda o `stylo` do primeiro teste: o segundo (`começa vazio`) falha (`1 !== 0`); executado sozinho com `--test-name-pattern`, ele passa | recriar o objeto em `beforeEach` |
| **Arquivo não encontrado** | `b.spec.mjs` não é executado por `node --test` sem nome de arquivo | nomear o arquivo `.test.mjs` ou colocá-lo em `test/` |
| **Comparar dois objetos com `equal`** | `assert.equal({ a: 1 }, { a: 1 })` falha: são dois objetos distintos | `deepEqual` |

## Boas práticas

| Fazer | Motivo |
|---|---|
| Importar `node:assert/strict`, nunca `node:assert` sozinho | o modo estrito evita que `1` e `"1"` sejam julgados iguais |
| Nomear cada teste conforme o comportamento verificado | o relatório se torna legível sem abrir o código (veja [os testes unitários](/?c=tests&p=tests-unitaires)) |
| Escrever `async` e `await` em toda parte onde o código testado é assíncrono | o Node só espera o que lhe pedimos para esperar |
| Recriar o que é modificado em `beforeEach` | cada teste se torna independente da ordem e dos filtros |
| Usar `t.mock` em vez de `mock` para substituir um método global | a restauração é automática, mesmo se o teste falhar |
| Fazer um teste falhar de propósito antes de confiar nele | um teste que não pode falhar não prova nada |
| Executar `node --test` na integração contínua e ler seu código de saída | `0` ou `1` basta para decidir se o projeto está saudável |
| Manter o executor integrado para o código Node, e um executor de navegador para a interface | veja [o navegador sem janela](/?c=tests&p=tests-navigateur-sans-fenetre) |

## O que reter

| | |
|---|---|
| **Para lembrar** | `node:test` é o executor de testes incluído no Node: `node --test` encontra os arquivos `*.test.mjs` (ou `*-test.mjs`, ou os de uma pasta `test`), executa cada teste, exibe um resumo e devolve o código `0` (sucesso) ou `1` (falha). |
| **Ferramentas utilizáveis** | `test`, `describe`, `it` para declarar; `node:assert/strict` para comparar; `before`, `beforeEach`, `afterEach`, `after` para preparar e limpar; `mock.fn` e `t.mock.method` para substituir uma dependência sem rede; `--test-name-pattern`, `--test-only`, `--test-reporter` e `--experimental-test-coverage` para filtrar, formatar e medir. |
| **Armadilhas a evitar** | um teste sem asserção (sempre verde); um `await` esquecido (teste verde por engano ou mensagem enganosa); um estado compartilhado entre testes (resultado que depende da ordem); `equal` entre dois objetos; um arquivo de teste com nome não reconhecido. |
| **Boas práticas** | asserções estritas; um comportamento por teste, nomeado com clareza; `beforeEach` para recomeçar de um estado novo; `await` diante de toda operação assíncrona; substituições limitadas ao teste; verificar se um teste sabe falhar; confiar a decisão à integração contínua pelo código de saída. |
