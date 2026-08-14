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

echo Calculos::media([12, 15, 9]); // sem "new Calculos()"
?>
```

Uma classe que só tem métodos estáticos nunca serve para fazer um `new`: é um simples agrupamento de funções ligadas entre si, com um namespace para evitar colisões de nomes entre módulos ou bibliotecas (veja a seção seguinte).

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
// 1) caminho completo, absoluto a partir da raiz (o \ inicial e opcional mas explicito)
\App\Faturamento\Repository::encontrar(1);

// 2) importacao no topo do arquivo, depois nome curto
use App\Faturamento\Repository;

Repository::encontrar(1);
?>
```

`use` não carrega o próprio arquivo: ele apenas indica ao motor PHP a qual nome completo corresponde o nome curto usado mais abaixo. É um mecanismo de [autoloading](/?c=langages-de-programmation&s=php&p=autoloading) que se encarrega de encontrar e carregar o arquivo correspondente, no momento em que a classe é realmente usada.

> **Nota:** `Classe::metodo()` (com `::`) se parece com `Classe->metodo()` mas nunca é usado com uma instância: é o equivalente quase direto de um namespace + método estático em C++.

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
        $this->mailer = $mailer ?? new SmtpMailer();  // valor padrao se nada for fornecido
        $this->logger = $logger ?? new FileLogger();
    }
}

// uso normal: dependencias padrao
$servico = new ServicoNotificacao();

// para testes, ou uma necessidade pontual: dependencias substituidas explicitamente
$servico = new ServicoNotificacao(new MailerDeTeste(), new LoggerEmMemoria());
```

Os parâmetros anuláveis com um fallback `??` (veja [As funções e métodos mais úteis](/?c=langages-de-programmation&s=php&p=methodes)) tornam cada dependência **opcional**: o código chamador pode deixar o comportamento padrão, ou fornecer explicitamente uma implementação diferente, tipicamente uma versão simulada (*mock*) em um teste automatizado, sem nunca tocar no código de `ServicoNotificacao` em si.

> **Nota:** essa técnica é o que torna uma classe *testável* sem depender de um serviço externo real (envio de email real, escrita de arquivos de log reais) a cada execução dos testes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma classe reúne propriedades e métodos; `new` cria uma instância dela. Um namespace evita colisões de nomes entre módulos. A injeção de dependências recebe os objetos necessários como parâmetro em vez de criá-los ele mesmo. |
| **Ferramentas utilizáveis** | `__construct`, propriedades tipadas, métodos `static`, `namespace`/`use`. |
| **Armadilhas a evitar** | Criar diretamente (`new`) as dependências de uma classe em vez de recebê-las como parâmetro: torna a classe difícil de testar isoladamente. |
| **Boas práticas** | Tipar as propriedades para que definam um contrato real; injetar as dependências em vez de instanciá-las diretamente, para facilitar os testes. |
