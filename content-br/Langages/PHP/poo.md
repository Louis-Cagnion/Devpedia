---
order: 8
---

# A programação orientada a objetos (POO)

A **programação orientada a objetos** (POO) organiza o código em torno de objetos que reúnem tanto dados (propriedades) quanto comportamentos (métodos), em vez de manipular arrays e funções separadamente. Uma classe desempenha o papel de "molde": ela descreve quais propriedades existirão e quais métodos estarão disponíveis, e cada `new` produz uma instância independente desse molde.

## Declarar uma classe e propriedades tipadas

```php
<?php
class Veiculo
{
    private string $marca;
    private string $modelo;
    private int $ano;

    public function __construct(string $marca, string $modelo, int $ano)
    {
        $this->marca  = $marca;
        $this->modelo = $modelo;
        $this->ano    = $ano;
    }

    public function descricao(): string
    {
        return "{$this->marca} {$this->modelo} ({$this->ano})";
    }
}

$v = new Veiculo("Peugeot", "308", 2022);
echo $v->descricao(); // "Peugeot 308 (2022)"
?>
```

- `__construct` é o nome reservado do método chamado automaticamente por `new`.
- `$this` sempre se refere à instância atual, e é usado **sempre** com `->`, inclusive para ler uma propriedade (`$this->marca`) ou chamar um método (`$this->descricao()`). A única diferença visual entre os dois é a presença de `()`.
- `private` = acessível apenas de dentro da classe; `public` = acessível também de fora.

> **Nota:** ao contrário de um array, onde é possível criar uma nova chave na hora (`$arr['nova_chave'] = 5;`, sem nenhuma declaração), uma propriedade de objeto **tipada** recusa um valor do tipo errado: atribuir um `int` a uma propriedade declarada `string` dispara um `TypeError`. As propriedades tipadas definem um contrato real: elas fixam quais propriedades existem e qual tipo cada uma deve sempre conter.

## Métodos estáticos e classes utilitárias

Um método estático é chamado diretamente na classe, sem passar por uma instância (`new`):

```php
<?php
class Calculos
{
    public static function media(array $notas): float
    {
        return array_sum($notas) / count($notas);
    }
}

echo Calculos::media([12, 15, 9]); // sem "new Cálculos()"
?>
```

Uma classe que só tem métodos estáticos nunca serve para fazer um `new`: é um simples agrupamento de funções ligadas entre si, com um namespace para evitar colisões de nomes entre módulos ou bibliotecas (veja a seção seguinte).

## `static` em variável local: um segundo sentido para a mesma palavra-chave

A palavra-chave `static` tem um segundo uso, sem relação com os métodos estáticos vistos acima: colocada antes de uma variável **local** dentro de uma função, faz com que essa variável mantenha seu valor de uma chamada para outra, em vez de ser reiniciada a cada execução.

```php
<?php
function rotuloMesEmFrances(DateTimeImmutable $data): string
{
    static $meses = [
        1 => 'Janvier', 2 => 'Février',   3 => 'Mars',     4 => 'Avril',
        5 => 'Mai',     6 => 'Juin',      7 => 'Juillet',  8 => 'Août',
        9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
    ];

    return $meses[(int) $data->format('n')] . ' ' . $data->format('Y');
}

echo rotuloMesEmFrances(new DateTimeImmutable('2026-09-15')); // "Septembre 2026"
?>
```

- Sem `static`, `$meses` seria reconstruído na memória a cada chamada de `rotuloMesEmFrances()`, mesmo que seu conteúdo nunca mude.
- Com `static`, o PHP inicializa `$meses` uma única vez, na primeiríssima execução da função; as chamadas seguintes reutilizam diretamente o valor já guardado na memória.

> **Nota:** não confundir com `public static function` visto acima: aqui `static` se aplica a uma **variável**, não a um método, a palavra-chave muda de sentido conforme o que ela precede. Uma variável estática não é compartilhada entre requisições HTTP simultâneas: cada processo PHP recomeça com seu próprio valor, reiniciado do zero.

## Namespaces e `use`

Um **namespace** evita que uma classe `Repository` de um módulo entre em colisão com uma classe `Repository` de outro:

```php
<?php
namespace App\Faturamento;

class Repository
{
    public static function encontrar(int $id): ?array
    {
        // ...
    }
}
?>
```

A partir de outro arquivo, duas formas de chamar essa classe:

```php
<?php
// 1) caminho completo, absoluto a partir da raiz (o \ inicial é opcional mas explícito)
\App\Faturamento\Repository::encontrar(1);

// 2) importação no topo do arquivo, depois nome curto
use App\Faturamento\Repository;

Repository::encontrar(1);
?>
```

`use` não carrega o próprio arquivo: ele apenas indica ao motor PHP a qual nome completo corresponde o nome curto usado mais abaixo. É um mecanismo de [autoloading](/?c=langages-de-programmation&s=php&p=autoloading) que se encarrega de encontrar e carregar o arquivo correspondente, no momento em que a classe é realmente usada.

> **Nota:** `Classe::metodo()` (com `::`) se parece com `Classe->metodo()` mas nunca é usado com uma instância: é o equivalente quase direto de um namespace + método estático em [C++](/?c=langages-de-programmation&s=cpp&p=cpp).

## A herança: `extends`, redefinição e `parent::`

Uma classe pode **herdar** de outra com `extends`: a classe filha recebe todas as propriedades e métodos da sua classe mãe, e pode acrescentar outros ou **redefini-los** (escrever sua própria versão de um método já presente na mãe). A herança expressa uma relação "é um": um carro *é um* veículo. O PHP só permite uma classe mãe ([Object Inheritance](https://www.php.net/manual/en/language.oop5.inheritance.php)).

```php
<?php
class Veiculo
{
    protected int $rodas;
    protected string $motor = "gasolina";

    public function __construct(int $rodas)
    {
        $this->rodas = $rodas;
    }

    public function descrever(): string
    {
        return "{$this->rodas} rodas, motor a {$this->motor}";
    }
}

class Carro extends Veiculo
{
    public function __construct()
    {
        // chama o construtor da classe mãe
        parent::__construct(4);
    }

    // redefine descrever() reaproveitando a versão da mãe
    public function descrever(): string
    {
        return "Carro: " . parent::descrever();
    }
}

echo (new Carro())->descrever(); // "Carro: 4 rodas, motor a gasolina"
?>
```

`parent::` designa a classe mãe: `parent::descrever()` chama a versão dela do método, mesmo quando a filha a redefiniu. Sem essa chamada, o construtor da mãe não é executado quando a filha declara o seu.

A visibilidade decide quem pode acessar um membro, inclusive a partir de uma classe filha:

| Visibilidade | Dentro da própria classe | Em uma classe filha | Fora da classe |
|---|---|---|---|
| `public` | Sim | Sim | Sim |
| `protected` | Sim | Sim | Não |
| `private` | Sim | Não | Não |

Uma classe filha que redeclara uma propriedade ou um método herdado pode manter a visibilidade ou **ampliá-la** (`protected` para `public`), nunca **restringi-la** (`protected` para `private`). O PHP rejeita então a classe assim que ela é carregada, com um erro fatal que nenhum `try`/`catch` consegue interceptar:

```php
<?php
class Carro extends Veiculo
{
    // Fatal error: Access level to Carro::$motor must be protected
    // (as in class Veiculo) or weaker
    private string $motor = "diesel";
}
?>
```

> **Armadilha:** redeclarar em uma classe filha uma propriedade herdada para mudar seu valor, passando-a para `private` por hábito. Toda página que carrega essa classe falha, qualquer que seja o ambiente.
>
> **Boa prática:** para mudar o valor de uma propriedade herdada, redeclará-la com a mesma visibilidade, ou atribuí-la no construtor da filha; para reaproveitar o comportamento da mãe, chamar `parent::` em vez de copiar o código dela.

## Os traits: compartilhar código sem herança

Um **trait** reúne métodos reutilizáveis, importados em uma classe via `use NomeDoTrait;` (a mesma palavra-chave `use` do [namespace](#namespaces-e-use), mas com papel diferente: aqui se importa código, não apenas um atalho de nome). Não é herança (apenas uma classe mãe possível em PHP), nem uma interface (um trait fornece uma implementação, não apenas um contrato de métodos a cumprir).

```php
<?php
trait ResumoVendas
{
    public function totalVendas(): float
    {
        return array_sum($this->vendas);
    }
}

trait DetalheVendasPorCategoria
{
    public function vendasPorCategoria(): array
    {
        return array_count_values(array_column($this->vendas, 'categoria'));
    }
}

class RepositorioVendas
{
    use ResumoVendas;
    use DetalheVendasPorCategoria;

    public function __construct(private array $vendas) {}
}

$repo = new RepositorioVendas([/* ... */]);
$repo->totalVendas();            // método fornecido por ResumoVendas
$repo->vendasPorCategoria();     // método fornecido por DetalheVendasPorCategoria
```

| | Herança | Interface | Trait |
|---|---|---|---|
| Fornece uma implementação | Sim | Não (apenas contrato) | Sim |
| Quantidade usável por classe | Uma única classe mãe | Várias interfaces | Vários traits |
| Instanciável sozinho | Não (mas a classe mãe sim) | Não | Nunca |

Um caso de uso concreto: uma classe que cresce demais (por exemplo `RepositorioVendas`, com métodos de resumo e métodos de detalhe agrupado ao mesmo tempo) pode ser dividida por responsabilidade em vários traits, sem mudar sua API pública nem sua hierarquia de classes: `$repo->totalVendas()` continua funcionando exatamente igual para o código chamador, venha o método diretamente da classe ou de um trait importado.

> **Nota:** contornar assim o limite de herança simples do PHP (uma classe só pode herdar de uma única classe mãe) não torna os traits um substituto da herança: um trait não define uma relação "é um" entre dois tipos, apenas compartilha código entre classes que não têm necessariamente nenhum parentesco.

## Injeção de dependências

Em vez de criar ela mesma os objetos de que precisa (`new`), uma classe pode recebê-los "de fora", como parâmetros de seu construtor: é a **injeção de dependências**. A classe que os recebe não precisa saber como esses objetos são construídos, apenas qual contrato (quais métodos) eles respeitam.

```php
<?php
class ServicoNotificacao
{
    private Mailer $mailer;
    private Logger $logger;

    public function __construct(?Mailer $mailer = null, ?Logger $logger = null)
    {
        $this->mailer = $mailer ?? new SmtpMailer();  // valor padrão se nada for fornecido
        $this->logger = $logger ?? new FileLogger();
    }
}

// uso normal: dependências padrão
$servico = new ServicoNotificacao();

// para testes, ou uma necessidade pontual: dependências substituidas explicitamente
$servico = new ServicoNotificacao(new MailerDeTeste(), new LoggerEmMemoria());
```

Os parâmetros anuláveis com um fallback `??` (veja [As funções e métodos mais úteis](/?c=langages-de-programmation&s=php&p=methodes)) tornam cada dependência **opcional**: o código chamador pode deixar o comportamento padrão, ou fornecer explicitamente uma implementação diferente, tipicamente uma versão simulada (*mock*) em um teste automatizado, sem nunca tocar no código de `ServicoNotificacao` em si.

> **Nota:** essa técnica é o que torna uma classe *testável* sem depender de um serviço externo real (envio de email real, escrita de arquivos de log reais) a cada execução dos testes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma classe reúne propriedades e métodos; `new` cria uma instância dela. Um namespace evita colisões de nomes entre módulos. `extends` cria uma relação "é um": a filha herda da mãe, pode redefinir seus métodos e chamar a versão original deles com `parent::`. Um trait compartilha código entre classes sem passar pela herança. A injeção de dependências recebe os objetos necessários como parâmetro em vez de criá-los ele mesmo. |
| **Ferramentas utilizáveis** | `__construct`, propriedades tipadas, métodos `static`, variável local `static` (valor mantido entre chamadas), `namespace`/`use`, traits (`trait`/`use`), `extends`/`parent::`, visibilidade `protected`. |
| **Armadilhas a evitar** | Criar diretamente (`new`) as dependências de uma classe em vez de recebê-las como parâmetro: torna a classe difícil de testar isoladamente. Confundir um trait com herança: ele não cria nenhuma relação "é um" entre tipos. Confundir `static` em um método (não exige instância) com `static` em uma variável local (valor mantido entre chamadas): mesma palavra-chave, dois efeitos diferentes. Restringir em uma classe filha a visibilidade de um membro herdado: erro fatal no carregamento. |
| **Boas práticas** | Tipar as propriedades para que definam um contrato real; injetar as dependências em vez de instanciá-las diretamente, para facilitar os testes; dividir uma classe grande demais em traits por responsabilidade, sem mudar sua API pública; chamar `parent::` em vez de copiar o código da classe mãe. |
