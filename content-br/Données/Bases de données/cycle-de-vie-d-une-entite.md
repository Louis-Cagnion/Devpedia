---
order: 11
---

# Ciclo de vida de uma entidade, esquema por código e campo calculado

Uma **entidade** é um objeto do programa que representa uma linha de dado durável: um livro, um cliente, um pedido. Ela é criada, gravada, modificada e, um dia, excluída. O código que gerencia essas entidades (muitas vezes um [ORM](/?c=donnees&s=bases-de-donnees&p=orm), que traduz objetos em linhas de tabela, o que este capítulo não repete) chama, a cada etapa da vida delas, métodos que o projeto pode completar: são as etapas do **ciclo de vida**. Este capítulo explica o que se pode fazer nessas etapas, o que não se deve fazer de jeito nenhum, depois duas ideias vizinhas: descrever o esquema de dados numa classe em vez de num arquivo SQL, e nunca armazenar um valor que sabemos recalcular.

Os exemplos são em [PHP](/?c=langages&s=php&p=poo) e em [JavaScript](/?c=langages&s=javascript&p=poo) genéricos. Alguns frameworks (o Drupal, por exemplo) funcionam assim, mas nada aqui depende disso.

## As quatro etapas

Uma etapa do ciclo de vida é um **método de retorno** (em inglês *callback*): o código do ORM o chama por conta própria, no momento certo, sem que o projeto precise pedir. Quatro etapas cobrem quase todas as necessidades:

| Etapa | Momento | O que se pode fazer ali | O que não fazer ali |
|---|---|---|---|
| `preSave` | logo antes da gravação | limpar ou completar um valor, calcular uma data, recusar um valor inválido (lançando uma exceção) | enviar uma mensagem, chamar outro serviço: a gravação ainda não aconteceu e pode falhar |
| `postSave` | logo depois da gravação | registrar em log, esvaziar um cache, avisar outro sistema | gravar a mesma entidade de novo (laço), chamar a rede antes do fim da transação |
| `preDelete` | logo antes da exclusão | recusar a exclusão (exceção) se a entidade ainda estiver em uso | alterar outros dados de forma definitiva: a exclusão pode ser cancelada |
| `postDelete` | logo depois da exclusão | excluir os dados que dependiam da entidade, esvaziar um cache | ler a entidade como se ela ainda existisse no banco |

O percurso de uma gravação seguida de uma exclusão:

```text
save(entidade)                            delete(entidade)
    |                                          |
    v                                          v
 preSave   -- exceção ? tudo para           preDelete -- exceção ? tudo para
    |                                          |
    v                                          v
 gravação no banco                          exclusão no banco
    |                                          |
    v                                          v
 postSave                                   postDelete
```

O código a seguir é um depósito mínimo que chama as quatro etapas do ciclo de vida, para ver a ordem real. Ele pode ser executado com Node.js (a ferramenta que executa JavaScript fora de um navegador):

```javascript
// Um depósito mínimo que chama as quatro etapas do ciclo de vida
class Deposito {
  constructor() {
    this.linhas = new Map(); // a "tabela": identificador -> valores
    this.rastro = []; // a ordem dos eventos, para exibi-la
  }

  save(entidade) {
    entidade.preSave(this); // 1. antes da gravação
    this.linhas.set(entidade.id, { ...entidade.valores }); // 2. gravação
    this.rastro.push(`gravado ${entidade.id}`); // 3. registramos a gravação
    entidade.postSave(this); // 4. depois da gravação
  }

  delete(entidade) {
    entidade.preDelete(this); // 1. antes da exclusão
    this.linhas.delete(entidade.id); // 2. exclusão
    this.rastro.push(`excluído ${entidade.id}`); // 3. registramos a exclusão
    entidade.postDelete(this); // 4. depois da exclusão
  }
}

class Artigo {
  constructor(id, titulo) {
    this.id = id; // identificador da linha
    this.valores = { titulo }; // valores armazenados
  }

  preSave(deposito) {
    this.valores.titulo = this.valores.titulo.trim(); // limpar um valor
    deposito.rastro.push("preSave : título limpo");
  }

  postSave(deposito) {
    deposito.rastro.push("postSave : log gravado"); // efeito colateral local
  }

  preDelete(deposito) {
    deposito.rastro.push("preDelete : verificação"); // recusar aqui, se preciso
  }

  postDelete(deposito) {
    deposito.rastro.push("postDelete : cache esvaziado"); // limpar o que depende
  }
}

const deposito = new Deposito();
const artigo = new Artigo(1, "  Olá  ");
deposito.save(artigo);
deposito.delete(artigo);
console.log(deposito.rastro.join("\n"));
console.log(JSON.stringify([...deposito.linhas]));
```

Resultado real:

```text
preSave : título limpo
gravado 1
postSave : log gravado
preDelete : verificação
excluído 1
postDelete : cache esvaziado
[]
```

A última linha (`[]`) mostra que a "tabela" está vazia depois da exclusão.

> **Sutileza:** uma exclusão ou uma atualização feita por uma consulta SQL direta sobre muitas linhas de uma só vez, em geral, não passa por essas etapas: o ORM não vê as linhas uma a uma. Uma regra escrita em `preDelete` só protege, portanto, as exclusões feitas pela entidade.

## Os efeitos colaterais

Um **efeito colateral** é tudo o que um trecho de código altera fora do seu resultado direto: gravar num arquivo, enviar um e-mail, modificar outra entidade, chamar outro servidor. As etapas do ciclo de vida são o lugar natural para disparar esses efeitos, mas duas armadilhas voltam sem parar.

### Armadilha 1: o laço de gravação

Se `postSave` gravar de novo a mesma entidade, essa gravação dispara um novo `postSave`, que grava de novo, e assim por diante: um **laço infinito** (o programa roda sem nunca parar, ou trava por falta de memória). O código a seguir põe uma proteção de propósito (além de 5 passagens, lança um erro) para observar o problema sem travar a máquina:

```javascript
// Laço de gravação: postSave grava de novo a mesma entidade
let chamadas = 0; // conta as passagens em postSave
const linhas = new Map(); // a "tabela"

function save(entidade) {
  linhas.set(entidade.id, { ...entidade.valores }); // gravação
  entidade.postSave(); // etapa depois da gravação
}

const ruim = {
  id: 1,
  valores: { visualizacoes: 0 },
  postSave() {
    chamadas += 1; // uma passagem a mais
    if (chamadas > 5) throw new Error("laço : mais de 5 passagens");
    this.valores.visualizacoes += 1; // modificação da entidade
    save(this); // grava de novo: postSave será chamado de novo
  },
};

try {
  save(ruim);
} catch (erro) {
  console.log("Ruim :", erro.message);
}

// Correção: gravar diretamente o valor derivado, sem passar de novo por save
chamadas = 0;
const bom = {
  id: 2,
  valores: { visualizacoes: 0 },
  postSave() {
    chamadas += 1;
    const linha = linhas.get(this.id); // a linha já gravada
    linha.visualizacoes += 1; // atualização direta, nenhum evento disparado
  },
};
save(bom);
console.log("Bom : passagens =", chamadas, "linha =", JSON.stringify(linhas.get(2)));
```

Resultado real:

```text
Ruim : laço : mais de 5 passagens
Bom : passagens = 1 linha = {"visualizacoes":1}
```

| Solução | Princípio | Limite |
|---|---|---|
| Calcular em `preSave` | o valor alterado vai junto com a gravação em curso: um só registro | ainda não existe: não se conhece o identificador de uma entidade nova |
| Gravar sem passar pelo evento | uma consulta direta só na coluna em questão | também contorna as outras regras do ciclo de vida |
| Sinalizador "já tratado" | uma propriedade que interrompe a recursão na segunda passagem | esquecer de zerá-la: bloqueia os registros reais seguintes |
| Mover o efeito para outro lugar | um tratamento adiado (tarefa agendada, fila de espera) | mais código, e um atraso antes do efeito |

### Armadilha 2: a chamada de rede dentro de uma transação

Uma **transação** é um conjunto de gravações validadas juntas ou canceladas juntas: se uma falhar, nenhuma permanece. A gravação de uma entidade costuma acontecer numa transação, e `postSave` roda antes que essa transação termine. Uma **chamada de rede** (e-mail, requisição a outro servidor, veja [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) feita nesse momento causa dois problemas:

| Problema | Explicação |
|---|---|
| Mensagem enviada à toa | se a transação for cancelada depois, a gravação desaparece, mas o e-mail já saiu: o cliente recebe a confirmação de um pedido que não existe |
| Transação aberta por tempo demais | um servidor remoto lento mantém o banco bloqueado durante a espera e trava os outros usuários |

O código a seguir simula uma transação (uma cópia provisória do "banco", recopiada somente se tudo der certo) e compara duas formas de enviar uma mensagem:

```javascript
// Uma transação: tudo é validado junto, ou tudo é cancelado
const base = new Map(); // estado validado
const enviados = []; // e-mails realmente enviados

async function transacao(trabalho) {
  const copia = new Map(base); // estado provisório
  const fila = []; // ações a executar após a validação
  try {
    await trabalho(copia, (acao) => fila.push(acao));
    base.clear(); // validação: a cópia vira o estado real
    copia.forEach((v, k) => base.set(k, v));
    fila.forEach((acao) => acao()); // ações adiadas
  } catch (erro) {
    return `cancelada : ${erro.message}`; // nada é gravado, nada é enviado
  }
  return "validada";
}

const enviar = (endereco) => enviados.push(endereco); // falsa chamada de rede

// Ruim: a chamada de rede sai ANTES do fim, depois a transação falha
const r1 = await transacao(async (dados) => {
  dados.set(1, "pedido");
  enviar("a@example.com"); // enviado de verdade
  throw new Error("estoque insuficiente");
});
console.log("Ruim :", r1, "base =", base.size, "enviados =", enviados.length);

// Bom: o envio fica na fila e só sai após a validação
const r2 = await transacao(async (dados, depois) => {
  dados.set(1, "pedido");
  depois(() => enviar("b@example.com")); // adiado
  throw new Error("estoque insuficiente");
});
console.log("Bom (falha) :", r2, "base =", base.size, "enviados =", enviados.length);

const r3 = await transacao(async (dados, depois) => {
  dados.set(1, "pedido");
  depois(() => enviar("c@example.com"));
});
console.log("Bom (sucesso) :", r3, "base =", base.size, "enviados =", enviados.length);
```

Resultado real:

```text
Ruim : cancelada : estoque insuficiente base = 0 enviados = 1
Bom (falha) : cancelada : estoque insuficiente base = 0 enviados = 1
Bom (sucesso) : validada base = 1 enviados = 2
```

O primeiro teste mostra o defeito: `base = 0` (nada é gravado), mas `enviados = 1` (uma mensagem saiu mesmo assim). O segundo teste não acrescenta nenhuma mensagem (`enviados` continua em 1); só o terceiro, bem-sucedido, acrescenta uma. A mesma ideia aparece numa [fila de mensagens ou um processamento em lote](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots): colocamos a ação em espera, outro processo a executa, e podemos reexecutá-la se ela falhar.

## Um esquema de dados construído por código

O **esquema** de uma tabela é a sua descrição: quais colunas, de que tipo, com quais restrições (veja [esquemas e tabelas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) para o sentido da palavra "esquema" no banco). Tradicionalmente ele é escrito num arquivo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) (`CREATE TABLE ...`). Outra abordagem é declará-lo na classe da entidade: cada campo é um pequeno objeto, uma **definição de campo**, e o framework deduz a tabela.

| | Arquivo SQL | Definições de campos numa classe |
|---|---|---|
| Onde vive o esquema | um arquivo separado do código | a classe da entidade |
| Quem escreve o `CREATE TABLE` | o desenvolvedor, à mão | o código, deduzido dos campos |
| Acrescentar um campo | alterar o arquivo SQL e o código PHP | acrescentar uma linha na lista de campos |
| Risco principal | o código e o SQL se contradizerem | um erro de definição se propaga por toda parte |
| Outros usos possíveis | nenhum | gerar também um formulário, uma validação, uma API |

O código PHP a seguir declara três campos e depois deduz a instrução SQL. Em seguida, cria de fato a tabela num banco SQLite em memória com PDO (a biblioteca padrão do PHP para acesso a bancos, [documentação oficial](https://www.php.net/manual/pt_BR/book.pdo.php)):

```php
<?php
// Uma definição de campo: um nome, um tipo SQL e uma restrição
final class Campo
{
    public function __construct(
        public string $nome,
        public string $tipoSql,
        public bool $obrigatorio = false,
    ) {}

    // Escreve a coluna SQL que corresponde ao campo
    public function paraSql(): string
    {
        return $this->nome . ' ' . $this->tipoSql . ($this->obrigatorio ? ' NOT NULL' : '');
    }
}

// Uma entidade declara ela mesma os seus campos: o esquema vive na classe
class Livro
{
    // Lista dos campos armazenados (uma coluna cada)
    public static function campos(): array
    {
        return [
            new Campo('id', 'INTEGER PRIMARY KEY'),
            new Campo('titulo', 'TEXT', true),
            new Campo('preco_base', 'REAL', true),
        ];
    }

    // Deduz a instrução CREATE TABLE da lista dos campos
    public static function criarTabela(): string
    {
        $colunas = array_map(fn (Campo $c) => $c->paraSql(), self::campos());
        return 'CREATE TABLE livro (' . implode(', ', $colunas) . ')';
    }

    public function __construct(private array $valores) {}

    // Campo calculado: nunca armazenado, recalculado a cada leitura
    public function precoComImposto(): float
    {
        return round($this->valores['preco_base'] * 1.2, 2);
    }
}

echo Livro::criarTabela(), "\n";
$livro = new Livro(['id' => 1, 'titulo' => 'PHP', 'preco_base' => 10.0]);
echo $livro->precoComImposto(), "\n";
$sqlite = new PDO('sqlite::memory:');
$sqlite->exec(Livro::criarTabela());
$linhas = $sqlite->query('SELECT count(*) FROM livro')->fetchColumn();
echo 'tabela criada, linhas : ', $linhas, "\n";
```

Resultado real:

```text
CREATE TABLE livro (id INTEGER PRIMARY KEY, titulo TEXT NOT NULL, preco_base REAL NOT NULL)
12
tabela criada, linhas : 0
```

Vocabulário PHP do bloco: `final` proíbe herdar da classe; `public`/`private` definem quem pode ler uma propriedade; `static` vincula o método à classe, e não a uma instância; `fn (...) =>` é uma função curta aplicada a cada campo por `array_map`. Os fundamentos da [programação orientada a objetos em PHP](/?c=langages&s=php&p=poo) estão no seu próprio capítulo.

> **Armadilha:** mudar uma definição de campo só tem efeito numa tabela criada depois. Uma tabela já preenchida não se altera sozinha: é preciso mover e converter as suas linhas, o que cabe às migrações de dados seguras, tratadas em um capítulo à parte.

## O campo calculado

Um **campo calculado** parece um campo para quem o usa (`livro.precoComImposto`), mas não tem nenhuma coluna: seu valor é **recalculado a cada leitura** a partir de outros campos. Um preço com todos os impostos incluídos, um nome completo (nome e sobrenome), uma idade (a partir de uma data de nascimento) são exemplos típicos.

| | Valor armazenado | Valor calculado |
|---|---|---|
| Onde vive | uma coluna, gravada ao salvar | uma função, relida a cada acesso |
| Atualidade | desatualizado se a origem mudar sem atualização | sempre atualizado |
| Custo na leitura | uma simples leitura | um cálculo a cada vez |
| Filtrar ou ordenar em SQL | possível (e indexável com um [índice](/?c=donnees&s=bases-de-donnees&p=les-index)) | impossível diretamente: o banco não o conhece |
| Adequado para | um valor caro de produzir e raramente alterado | um valor derivado, barato de produzir |

O código a seguir mostra o valor armazenado que fica errado, e o valor calculado que continua exato. `Object.defineProperty` com `get` declara uma propriedade cujo valor é produzido por uma função a cada leitura:

```javascript
// Valor armazenado: copiado uma vez, fica desatualizado quando a origem muda
const livro = { precoBase: 10, iva: 0.2 };
livro.precoComImpostoArmazenado = livro.precoBase * (1 + livro.iva); // gravado uma única vez

// Valor calculado: uma função relida a cada acesso
Object.defineProperty(livro, "precoComImposto", {
  get() {
    return livro.precoBase * (1 + livro.iva); // recalculado a cada leitura
  },
});

livro.precoBase = 20; // a origem muda
console.log("armazenado :", livro.precoComImpostoArmazenado); // 12 : desatualizado
console.log("calculado :", livro.precoComImposto); // 24 : atualizado
console.log(JSON.stringify(livro)); // o campo calculado não é serializado
```

Resultado real:

```text
armazenado : 12
calculado : 24
{"precoBase":20,"iva":0.2,"precoComImpostoArmazenado":12}
```

A última linha mostra que um campo calculado não aparece nos dados gravados: ele não tem lugar no banco, portanto não há nada a sincronizar.

## As armadilhas

| Armadilha | Consequência | Solução |
|---|---|---|
| Regravar a entidade em `postSave` | laço infinito, travamento | calcular em `preSave`, ou gravar só a coluna por uma consulta direta |
| Chamada de rede em `postSave` | mensagem enviada para uma transação cancelada, banco bloqueado por muito tempo | colocar a ação na fila e executá-la após a validação |
| Contar com `preDelete` para proteger tudo | uma consulta SQL direta em massa o contorna | manter também uma restrição no banco (chave estrangeira) |
| Efeito colateral em `preSave` | a gravação ainda pode falhar depois | reservar `preSave` aos valores da própria entidade |
| Armazenar um valor derivado | ele fica errado assim que a origem muda | calculá-lo na leitura, ou recalculá-lo a cada gravação |
| Campo calculado caro | lento a cada leitura, sobretudo numa lista (veja o problema N+1 do [ORM](/?c=donnees&s=bases-de-donnees&p=orm)) | armazenar o resultado, com uma regra clara de atualização |
| Alterar a definição de um campo numa tabela preenchida | a tabela e o código divergem | uma migração de dados segura (capítulo vizinho) |

## Boas práticas

| Prática | Motivo |
|---|---|
| Manter cada etapa curta e rápida | ela roda a cada gravação de cada entidade |
| `preSave` para corrigir, `postSave` para reagir | o valor que sai na gravação já está certo desde a primeira passagem |
| Adiar toda chamada externa para depois da validação | nenhuma mensagem para uma gravação cancelada |
| Testar a ordem das etapas com um rastro, como no primeiro exemplo | vê-se o que é realmente chamado |
| Declarar um campo calculado em vez de duplicar um dado | uma única fonte de verdade, nada a sincronizar |
| Manter o esquema de uma só forma (código ou SQL) | evitar que um contradiga o outro |

## O que reter

| | |
|---|---|
| **Para reter** | Um ciclo de vida oferece quatro etapas de retorno: `preSave`, `postSave`, `preDelete`, `postDelete`. Um esquema pode ser declarado por definições de campos numa classe. Um campo calculado nunca é armazenado e se recalcula a cada leitura. |
| **Ferramentas utilizáveis** | Um [ORM](/?c=donnees&s=bases-de-donnees&p=orm) que chama as etapas; as transações do banco; uma fila para adiar os efeitos; um acessor (`get`, método) para um campo calculado. |
| **Armadilhas a evitar** | O laço de gravação; a chamada de rede numa transação; uma exclusão em massa que contorna `preDelete`; um valor derivado armazenado que envelhece. |
| **Boas práticas** | Corrigir em `preSave`, reagir em `postSave`, adiar a rede para depois da validação, armazenar só o que não se pode recalcular a baixo custo. |
