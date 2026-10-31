---
order: 15
---

# O contêiner de serviços e os provedores de serviços

Em uma aplicação, a maioria das classes precisa de outras classes: um envio de e-mail precisa de um diário, um diário precisa de um arquivo, e assim por diante. Alguém deve construir todos esses objetos, na ordem certa, uma única vez quando isso for útil, e permitir substituí-los. Este capítulo apresenta a ferramenta que faz isso: o **contêiner de serviços**, e a maneira de nele declarar objetos (os **provedores de serviços**) para injetá-los, substituí-los ou decorá-los, inclusive aqueles do **núcleo** de um framework (um **framework** é uma biblioteca de base que impõe a estrutura da aplicação e chama o código do projeto; seu **núcleo** é a parte central fornecida com ele, que o projeto não escreve).

Ele pressupõe conhecidos [as classes e a injeção de dependências básica](/?c=langages&s=php&p=poo) (receber suas dependências como parâmetros do construtor em vez de criá-las com `new`), [as funções anônimas](/?c=langages&s=php&p=methodes) (uma função sem nome, guardada em uma variável) e [o carregamento automático de classes](/?c=langages&s=php&p=autoloading). O motivo do baixo acoplamento está em [responsabilidade única e baixo acoplamento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage), e o sentido de uma dependência em [verificar o sentido das dependências](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser). Essas noções não são repetidas aqui. Os exemplos são em PHP, com um exemplo em JavaScript no final; [Drupal](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection) e [Symfony](https://symfony.com/doc/current/service_container.html) (dois frameworks PHP) são citados apenas como exemplos da mesma ideia.

## O problema: quem constrói os objetos?

Sem contêiner, cada classe cria as suas próprias dependências, ou o código que chama as monta à mão em cada lugar.

```php
<?php
// Notificador: uma classe que envia uma mensagem a alguém
class Notificador
{
    // property: a propriedade que guarda o diário usado pela classe
    private DiarioArquivo $diario;

    // o construtor é executado a cada "new Notificador()"
    public function __construct()
    {
        // new: a classe fabrica ela mesma sua dependência, fixa no código
        $this->diario = new DiarioArquivo('/var/log/app.log');
    }
}
```

Para testar `Notificador`, é preciso um arquivo real em `/var/log`; para trocar de diário, é preciso modificar a classe. O **contêiner de serviços** resolve isso: é um objeto único que conhece a receita de cada objeto compartilhado e o constrói sob demanda.

| Palavra | Definição | Exemplo |
|---|---|---|
| **Serviço** | Um objeto que presta um serviço técnico ao resto da aplicação, sem representar um dado de negócio: ele age (enviar, registrar, calcular), não descreve (um pedido, um cliente) | Um diário, um envio de e-mail, um acesso ao banco |
| **Identificador** | O nome único sob o qual um serviço é guardado no contêiner | `diario`, `notificador` |
| **Fábrica** | A função que sabe construir um serviço, com as suas próprias dependências | `fn($c) => new Notificador($c->get('diario'))` |
| **Contêiner** | O objeto que guarda as fábricas, constrói um serviço na primeira solicitação e o mantém | `$conteiner->get('diario')` |
| **Provedor de serviços** | Um bloco de código (ou de configuração) que declara um grupo de serviços no contêiner | O núcleo declara os seus, cada módulo declara os seus |
| **Injeção** | Dar a um objeto as suas dependências de fora, em vez de deixá-lo criá-las | `new Notificador($diario)` |

## Um contêiner mínimo

Para entender o que fazem os contêineres dos frameworks, escrevemos um com menos de quarenta linhas. Primeiro, duas **interfaces** (uma interface é um contrato: a lista dos métodos que uma classe deve fornecer, sem o código deles) e as classes que as usam. As classes não conhecem o contêiner.

```php
<?php
// Diario: o contrato que todo diário deve respeitar
interface Diario
{
    // escrever: recebe um texto, não devolve nada (void)
    public function escrever(string $mensagem): void;
}

// DiarioTela: um diário que exibe cada mensagem na tela
class DiarioTela implements Diario
{
    // implements: esta classe respeita o contrato Diario
    public function escrever(string $mensagem): void
    {
        // echo: exibe o texto; "\n" termina a linha
        echo "[diario] $mensagem\n";
    }
}

// Notificador: recebe um Diario, sem saber qual
class Notificador
{
    // private Diario $diario: cria e preenche a propriedade (promoção do construtor)
    public function __construct(private Diario $diario)
    {
    }

    // enviar: simula o envio e o anota no diário
    public function enviar(string $destinatario): void
    {
        // $this->diario: o diário recebido na construção
        $this->diario->escrever("Mensagem enviada a $destinatario");
    }
}
```

O próprio contêiner: três arrays (as receitas, os objetos já construídos, os objetos em construção) e três métodos.

```php
<?php
// Conteiner: guarda as receitas e fabrica os serviços sob demanda
class Conteiner
{
    // fabricas: identificador => função que constrói o serviço
    private array $fabricas = [];
    // compartilhados: identificador => true se o serviço deve ser construído uma única vez
    private array $compartilhados = [];
    // instancias: identificador => serviço já construído
    private array $instancias = [];
    // emAndamento: identificadores em construção (para detectar um ciclo)
    private array $emAndamento = [];

    // definir: acrescenta ou substitui a receita de um serviço
    public function definir(string $id, callable $fabrica, bool $compartilhado = true): void
    {
        // a nova receita toma o lugar da antiga
        $this->fabricas[$id] = $fabrica;
        // anotamos se o serviço é compartilhado
        $this->compartilhados[$id] = $compartilhado;
        // uma instância já construída com a receita antiga é esquecida
        unset($this->instancias[$id]);
    }

    // decorar: envolve o serviço $id em outro, sem tocar no seu código
    public function decorar(string $id, callable $decorador): void
    {
        // a receita antiga é guardada: ela fornece o serviço envolvido
        $interno = $this->fabricas[$id] ?? throw new RuntimeException("Desconhecido: $id");
        // a nova receita chama a antiga, depois passa o resultado ao decorador
        $envoltorio = fn(self $c) => $decorador($interno($c), $c);
        $this->definir($id, $envoltorio, $this->compartilhados[$id]);
    }

    // get: devolve o serviço, construindo-o se necessário
    public function get(string $id): object
    {
        // já construído e compartilhado: devolvemos o mesmo objeto
        if (isset($this->instancias[$id])) {
            return $this->instancias[$id];
        }
        // nenhuma receita com este identificador: erro claro
        if (!isset($this->fabricas[$id])) {
            throw new RuntimeException("Serviço desconhecido: $id");
        }
        // o identificador já está em construção: A precisa de B que precisa de A
        if (isset($this->emAndamento[$id])) {
            $caminho = implode(' -> ', array_keys($this->emAndamento)) . " -> $id";
            throw new RuntimeException("Dependência circular: $caminho");
        }
        // marcamos o identificador como em andamento
        $this->emAndamento[$id] = true;
        try {
            // chamamos a fábrica, dando-lhe o contêiner para as suas dependências
            $servico = ($this->fabricas[$id])($this);
        } finally {
            // aconteça o que acontecer, retiramos a marca
            unset($this->emAndamento[$id]);
        }
        // serviço compartilhado: guardamos; senão devolvemos sem guardar
        if ($this->compartilhados[$id]) {
            $this->instancias[$id] = $servico;
        }
        return $servico;
    }
}
```

## Declarar um serviço e injetá-lo

**Declarar** um serviço é registrar a sua receita sob um identificador. **Injetá-lo** é fazer com que a receita de outro serviço lhe passe esse serviço no construtor. Somente as fábricas conhecem o contêiner.

```php
<?php
// criamos o contêiner vazio
$conteiner = new Conteiner();
// declaração: o serviço "diario" é um DiarioTela (fn: função de seta)
$conteiner->definir('diario', fn() => new DiarioTela());
// declaração: o "notificador" pede o "diario" ao contêiner e o recebe como parâmetro
$conteiner->definir('notificador', fn(Conteiner $c) => new Notificador($c->get('diario')));
// primeira solicitação: o contêiner constrói o diário, depois o notificador
$conteiner->get('notificador')->enviar('alice@example.org');
// segunda solicitação do diário: é o mesmo objeto (=== compara a identidade de um objeto)
var_dump($conteiner->get('diario') === $conteiner->get('diario'));
```

Resultado real:

```
[diario] Mensagem enviada a alice@example.org
bool(true)
```

```
get('notificador')
  |-- receita de notificador: chama get('diario')
  |     |-- receita de diario: new DiarioTela()   --> guardado em instancias
  |     '-- devolve o diário
  '-- new Notificador($diario)                     --> guardado em instancias
```

A ordem de construção nunca é escrita pelo desenvolvedor: ela se deduz das chamadas `get` aninhadas. Um framework real faz a mesma coisa, mas lê as dependências em uma declaração em vez de em uma função.

| Forma de obter uma dependência | Quem constrói | Testável sem serviço real | Veredito |
|---|---|---|---|
| `new DiarioArquivo(...)` na classe | A própria classe | Não | Evitar para um serviço |
| Injeção pelo construtor | O contêiner (pela sua fábrica) | Sim: passa-se um dublê | A regra padrão |
| Chamada `$conteiner->get('diario')` na classe | A classe, via o contêiner | Dificilmente | Último recurso (ver as armadilhas) |

## Os provedores de serviços: agrupar as declarações

Um projeto real tem centenas de serviços. Cada parte (o núcleo, um módulo, um plugin) os declara no seu próprio **provedor de serviços**: um objeto ao qual o contêiner é confiado para nele registrar as suas receitas. A aplicação inicia chamando cada provedor, em uma ordem precisa.

```php
<?php
// ProvedorDeServicos: o contrato de um bloco de declarações
interface ProvedorDeServicos
{
    // registrar: recebe o contêiner e nele declara os seus serviços
    public function registrar(Conteiner $c): void;
}

// ProvedorNucleo: os serviços de base, fornecidos com o framework
class ProvedorNucleo implements ProvedorDeServicos
{
    public function registrar(Conteiner $c): void
    {
        // o núcleo declara um diário que escreve na tela
        $c->definir('diario', fn() => new DiarioTela());
        // e um notificador que depende desse diário
        $c->definir('notificador', fn(Conteiner $c) => new Notificador($c->get('diario')));
    }
}

// Aplicação: chama cada provedor na ordem dada
function iniciar(array $provedores): Conteiner
{
    // um contêiner novo para esta execução
    $conteiner = new Conteiner();
    // cada provedor declara os seus serviços (o último que escreve vence)
    foreach ($provedores as $provedor) {
        $provedor->registrar($conteiner);
    }
    return $conteiner;
}
```

| Pergunta | Resposta no exemplo | Em um framework real |
|---|---|---|
| Onde fica a declaração? | Em código PHP (`definir`) | Muitas vezes um arquivo de configuração (YAML): classe, argumentos, etiquetas |
| Quem a chama? | A função `iniciar` | O framework, na inicialização, ou na compilação do contêiner |
| Em que ordem? | A da lista | Núcleo primeiro, depois os módulos (muitas vezes por prioridade) |
| O que acontece no fim? | O contêiner está pronto | O contêiner é muitas vezes **compilado** (transformado em uma classe PHP otimizada) e colocado em cache |

## Substituir um serviço do núcleo

Para mudar um comportamento do núcleo, não se edita o núcleo (as atualizações apagariam a modificação): um provedor do projeto **redeclara o mesmo identificador**. Como o último que escreve vence, todos os serviços que pedem `diario` recebem a nova versão, sem que uma única linha de `Notificador` mude.

```php
<?php
// DiarioMemoria: guarda as mensagens em um array, útil para os testes
class DiarioMemoria implements Diario
{
    // mensagens: tudo o que foi escrito, na ordem
    public array $mensagens = [];

    public function escrever(string $mensagem): void
    {
        // [] = acrescenta ao fim do array
        $this->mensagens[] = $mensagem;
    }
}

// ProvedorProjeto: o provedor do projeto, chamado depois do que é do núcleo
class ProvedorProjeto implements ProvedorDeServicos
{
    public function registrar(Conteiner $c): void
    {
        // mesmo identificador "diario": a receita do núcleo é substituída
        $c->definir('diario', fn() => new DiarioMemoria());
    }
}

// somente o núcleo: o diário escreve na tela
iniciar([new ProvedorNucleo()])->get('notificador')->enviar('bob@example.org');
// núcleo e depois projeto: o diário é substituído, nada aparece na tela
$aplicacao = iniciar([new ProvedorNucleo(), new ProvedorProjeto()]);
// enviamos uma mensagem com o diário substituído
$aplicacao->get('notificador')->enviar('bob@example.org');
// a mensagem está na memória do novo diário
print_r($aplicacao->get('diario')->mensagens);
```

Resultado real:

```
[diario] Mensagem enviada a bob@example.org
Array
(
    [0] => Mensagem enviada a bob@example.org
)
```

O substituto deve respeitar **o mesmo contrato** (aqui `Diario`): senão os serviços que o usam falham na execução. Em um framework, isso se chama redefinir uma definição de serviço; o exemplo do Drupal é uma classe de provedor do módulo que modifica a definição do núcleo antes da compilação (ver [a documentação do Drupal sobre os serviços](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection)).

## Decorar um serviço: enriquecê-lo em vez de substituí-lo

Substituir descarta o serviço antigo. Um **decorador** (um padrão de projeto) é um objeto que **envolve** o serviço antigo, respeita o mesmo contrato, delega a ele o trabalho e acrescenta algo antes ou depois. O núcleo e o projeto mantêm cada um a sua parte do comportamento.

```php
<?php
// DiarioNumerado: envolve outro Diario e numera as mensagens
class DiarioNumerado implements Diario
{
    // contador: o número da próxima mensagem
    private int $contador = 1;

    // $interno: o diário envolvido, ao qual delegamos
    public function __construct(private Diario $interno)
    {
    }

    public function escrever(string $mensagem): void
    {
        // acrescentamos o número e deixamos o diário antigo fazer o seu trabalho
        $this->interno->escrever('#' . $this->contador++ . ' ' . $mensagem);
    }
}

// partimos somente do núcleo
$aplicacao = iniciar([new ProvedorNucleo()]);
// decorar: o "diario" passa a ser DiarioNumerado($diario_anterior)
$aplicacao->decorar('diario', fn(Diario $interno) => new DiarioNumerado($interno));
// o notificador do núcleo recebe o diário decorado, sem saber disso
$aplicacao->get('notificador')->enviar('carole@example.org');
$aplicacao->get('notificador')->enviar('dave@example.org');
```

Resultado real:

```
[diario] #1 Mensagem enviada a carole@example.org
[diario] #2 Mensagem enviada a dave@example.org
```

Se dois provedores decoram o mesmo serviço, os decoradores se empilham como bonecas russas: o último declarado é o mais externo. Nos frameworks, escreve-se isso na configuração com uma chave do tipo `decorates` (o Symfony e o Drupal a conhecem) em vez de código.

| Técnica | O que faz | Quando escolher | Risco |
|---|---|---|---|
| **Substituir** | Redeclarar o identificador com outra classe | O comportamento do núcleo não serve mais de jeito nenhum | Perder funções que outros módulos esperavam; outro substituto a sobrescreve |
| **Decorar** | Envolver o serviço antigo, que continua na cadeia | Queremos acrescentar (cache, registro, medição) sem perder o existente | A ordem dos decoradores importa; a interface deve ser respeitada por inteiro |
| **Alias** | Dar um segundo identificador a um serviço existente | Vários nomes designam o mesmo serviço (`logger` e `diario`) | O serviço é compartilhado: substituí-lo muda todos os nomes |
| **Estender a classe** (`extends`) | Uma classe filha redeclarada sob o identificador antigo | Uma pequena mudança em um método | Frágil: depende dos detalhes internos da classe-mãe |

## Compartilhado ou novo a cada solicitação

Por padrão, um serviço é **compartilhado**: o contêiner o constrói uma única vez e devolve o mesmo objeto depois (como mostra `===` acima). Isso é o desejado para um diário ou uma conexão com o banco. Mas um objeto que guarda um estado próprio de uma operação (um carrinho, um formulário em andamento) não deve ser compartilhado: senão duas operações se misturariam nele.

```php
<?php
// serviço não compartilhado: o terceiro argumento false pede um objeto novo a cada get
$conteiner = new Conteiner();
$conteiner->definir('diario', fn() => new DiarioMemoria(), false);
// duas solicitações: dois objetos diferentes (!== compara a identidade)
var_dump($conteiner->get('diario') !== $conteiner->get('diario'));
```

Resultado real: `bool(true)`.

| Modo | Quantos objetos | Serve para | Perigo |
|---|---|---|---|
| Compartilhado (padrão) | Um só para toda a aplicação | Diário, configuração, conexão | Um estado guardado ali vaza de uma operação para outra |
| Não compartilhado | Um por solicitação | Objeto de trabalho, de uso único | Custo de construção repetido; não pode servir de ponto de ajuste comum |

## Testar: substituir um serviço por um dublê

É o interesse mais concreto do contêiner: um teste declara, no lugar do diário real, um dublê que registra o que lhe enviam.

```php
<?php
// construímos uma aplicação normal
$aplicacao = iniciar([new ProvedorNucleo()]);
// o teste substitui o diário por um dublê que guarda as mensagens na memória
$falso = new DiarioMemoria();
$aplicacao->definir('diario', fn() => $falso);
// executamos o comportamento a testar
$aplicacao->get('notificador')->enviar('test@example.org');
// verificamos o que o notificador escreveu: true se as mensagens são as esperadas
var_dump($falso->mensagens === ['Mensagem enviada a test@example.org']);
```

Resultado real: `bool(true)`. O princípio dos testes automatizados está em [os testes unitários](/?c=tests&p=tests-unitaires); a vantagem aqui é que o teste não depende de nenhum arquivo nem de nenhuma rede.

## Os erros que o contêiner detecta

Dois serviços que se pedem um ao outro formam uma **dependência circular**: a construção de um exige o outro, sem fim. Nosso contêiner a percebe graças a `emAndamento` e nomeia o caminho.

```php
<?php
// "a" precisa de "b", e "b" precisa de "a"
$c = new Conteiner();
$c->definir('a', fn(Conteiner $c) => $c->get('b'));
$c->definir('b', fn(Conteiner $c) => $c->get('a'));
// try / catch: capturamos o erro para exibi-lo
try {
    $c->get('a');
} catch (RuntimeException $e) {
    // getMessage: o texto do erro
    echo $e->getMessage(), "\n";
}
```

Resultado real: `Dependência circular: a -> b -> a`. A verdadeira correção não está no contêiner: um ciclo sinaliza duas classes mal divididas (ver [responsabilidade única e baixo acoplamento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)). Extrai-se a parte comum para um terceiro serviço, do qual os dois dependem.

## A mesma ideia em JavaScript

Nada no princípio é próprio do PHP. Em JavaScript, um `Map` (um dicionário: pares chave, valor) faz o papel de array de receitas.

```javascript
// Conteiner: mesmo princípio que em PHP, em dez linhas
class Conteiner {
    // fabricas: identificador => função que constrói o serviço
    #fabricas = new Map();
    // instancias: identificador => serviço já construído
    #instancias = new Map();

    // definir: acrescenta ou substitui uma receita
    definir(id, fabrica) {
        // a nova receita substitui a antiga
        this.#fabricas.set(id, fabrica);
        // a instância eventualmente construída é esquecida
        this.#instancias.delete(id);
    }

    // get: devolve o serviço, construído na primeira solicitação
    get(id) {
        // já construído: devolvemos
        if (this.#instancias.has(id)) return this.#instancias.get(id);
        // sem receita: erro claro
        if (!this.#fabricas.has(id)) throw new Error(`Serviço desconhecido: ${id}`);
        // construímos, passando o contêiner à fábrica, depois guardamos
        const servico = this.#fabricas.get(id)(this);
        this.#instancias.set(id, servico);
        return servico;
    }
}

// declaração de um diário e depois de um notificador que o recebe
const c = new Conteiner();
c.definir("diario", () => ({ escrever: (m) => console.log(`[diario] ${m}`) }));
c.definir("notificador", (cont) => ({ enviar: (d) => cont.get("diario").escrever(d) }));
// uso: a construção é preguiçosa, na ordem desejada
c.get("notificador").enviar("erwan@example.org");
```

Resultado real: `[diario] erwan@example.org`. Os módulos ES e as bibliotecas de injeção (por exemplo [InversifyJS](https://inversify.io/) ou [tsyringe](https://github.com/microsoft/tsyringe)) acrescentam as mesmas funções descritas aqui; a documentação do padrão [PSR-11](https://www.php-fig.org/psr/psr-11/) fixa, do lado do PHP, a interface mínima de um contêiner (`get` e `has`).

## Em um framework real

Os frameworks retomam esse mecanismo e o declaram em configuração. A tabela relaciona cada noção deste capítulo ao seu equivalente habitual (o detalhe varia de um framework para outro: a página [do contêiner do Symfony](https://symfony.com/doc/current/service_container.html) dá um exemplo completo).

| Noção do capítulo | Equivalente comum em um framework |
|---|---|
| `definir('id', fabrica)` | Uma entrada do arquivo `services.yml`: identificador, classe, lista de argumentos |
| `$c->get('diario')` em uma fábrica | Um argumento escrito `@diario` na declaração: o framework resolve |
| Provedor de serviços | Um arquivo de declarações por módulo, mais uma classe PHP para os casos dinâmicos |
| `decorar` | Uma chave `decorates` na declaração |
| Substituir | Uma classe de provedor do módulo que modifica a definição antes da compilação |
| Ciclo detectado | Um erro na compilação do contêiner |

## As armadilhas

| Armadilha | Por que é um problema | Correção |
|---|---|---|
| Passar o contêiner inteiro a uma classe (`__construct(Conteiner $c)` e depois `$c->get(...)` em todo lugar): chama-se isso de **localizador de serviços** | As dependências reais da classe ficam invisíveis; um teste precisa preencher um contêiner inteiro; o contêiner está em todo lugar | Injetar cada dependência, uma por parâmetro; reservar o contêiner apenas às fábricas |
| Substituir um serviço do núcleo por uma classe que não respeita todo o seu contrato | Outro serviço do núcleo chama um método ausente: o erro surge longe da causa | Tipar pela interface e implementar todos os seus métodos; ou decorar em vez de substituir |
| Dois módulos substituem o mesmo identificador | O último chamado vence, sem aviso: o resultado depende da ordem | Decorar em vez de substituir; verificar a ordem dos provedores |
| Serviço compartilhado que guarda um estado próprio de uma operação | Duas operações compartilham o mesmo estado (dados de um usuário chegam a outro) | Serviço não compartilhado, ou estado passado como parâmetro do método |
| Dependência circular entre dois serviços | Construção impossível, ou contornada por uma injeção tardia que mascara uma divisão ruim | Extrair a parte comum para um terceiro serviço |
| Alterar uma declaração sem reconstruir o cache do contêiner compilado | O framework continua usando a versão antiga | Limpar o cache do framework após cada mudança de declaração |
| Construir muitas coisas pesadas no construtor (conexão, leitura de arquivo) | O serviço é construído assim que outro depende dele, mesmo que não seja usado | Construtor leve, trabalho na primeira chamada de método |
| Depender de um identificador escrito como texto (`'diario'`) sem controle | Um erro de digitação só aparece na execução | Uma constante ou o nome da classe como identificador; um teste que constrói cada serviço |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Injetar pelo construtor, nunca por `new` dentro da classe, para todo serviço | A classe declara suas necessidades e se testa com dublês |
| Tipar cada dependência por uma interface (`Diario`), não por uma classe concreta | Substituir ou decorar não quebra nada |
| Um provedor de serviços por módulo, que declara apenas os seus próprios serviços | Cada módulo continua independente e removível |
| Preferir **decorar** a **substituir** quando se quer acrescentar um comportamento | Mantém-se o trabalho do núcleo e o dos outros módulos |
| Documentar no projeto todo serviço do núcleo substituído, e o motivo | Uma atualização do núcleo pode quebrar um substituto sem que nada o sinalize |
| Passar o contêiner somente às fábricas, nunca às classes de negócio | As dependências continuam visíveis nas assinaturas |
| Manter os serviços sem estado, senão declará-los não compartilhados | Nenhum vazamento de dados entre operações |
| Testar uma inicialização completa: construir cada serviço declarado | Um ciclo, uma classe ausente ou um erro de identificador são detectados antes da publicação |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um contêiner de serviços guarda receitas (fábricas) sob identificadores e constrói cada objeto sob demanda, uma única vez se for compartilhado. Um provedor de serviços reúne as declarações de uma parte da aplicação. Injetar é fazer com que uma fábrica passe suas dependências ao construtor. Para modificar um serviço do núcleo sem editar o núcleo: redeclará-lo sob o mesmo identificador (substituir) ou envolvê-lo (decorar, que mantém o comportamento antigo). O substituto ou o decorador respeita o mesmo contrato. Um teste substitui um serviço por um dublê. Um ciclo entre serviços se corrige dividindo de outra forma. |
| **Armadilhas a evitar** | O localizador de serviços (contêiner passado às classes); um substituto que não respeita todo o contrato; dois substitutos do mesmo identificador; um serviço compartilhado que guarda um estado; uma dependência circular; um cache de contêiner esquecido; um construtor pesado; um identificador em texto não controlado. |
| **Boas práticas** | Injetar pelo construtor; tipar por uma interface; um provedor por módulo; decorar em vez de substituir; documentar as substituições do núcleo; contêiner reservado às fábricas; serviços sem estado; teste que constrói cada serviço. |

Dois assuntos vizinhos não são tratados aqui: a inversão de controle e os hooks (o framework chama o código do projeto em pontos previstos) e a arquitetura de plugins (classes descobertas pelo framework graças a uma anotação ou um atributo).
