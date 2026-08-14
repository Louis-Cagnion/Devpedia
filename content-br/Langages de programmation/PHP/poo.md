---
order: 8
---

# A programação orientada para objetos (POO)

A **programação orientada a objetos** (POO) organiza o código em torno de objetos que agrupam simultaneamente dados (propriedades) e comportamentos (métodos), em vez de manipular tabelas e funções separadamente. Uma classe desempenha o papel de «molde»: descreve quais as propriedades que existirão e quais os métodos que estarão disponíveis, e cada `new`a produz uma instância independente desse molde.

## Declarar uma classe e propriedades tipadas

```php
<?php
class Vehicule
{
    private string $marca;
    private string $modelo;
    private int $annee;

    public function __construct(string $marca, string $modelo, int $annee)
    {
        $this->marca = $marca;
        $this->modelo = $modelo;
        $this->annee  = $annee;
    }

    public function description(): string
    {
        return "{$this->marca} {$this->modelo} ({$this->annee})";
    }
}

$v = new Vehicule("Peugeot", "308", 2022);
echo $v->description(); // «Peugeot 308 (2022)»
?>
```

- `__construct` é o nome reservado do método chamado automaticamente pel`new`o.
- `$this` refere-se sempre à instância atual e é **sempre** utilizada com `->`, incluindo para ler uma propriedade (`$this->marca`) ou chamar um método (`$this->description()`). A única diferença visual entre as duas é a presença de `()`.
- `private` = acessível apenas a partir do interior da classe; `public` = acessível também a partir do exterior.

> **Nota:** ao contrário de um array, onde é possível criar uma nova chave dinamicamente (`$arr['nouvelle_cle'] = 5;`, sem qualquer declaração), uma propriedade de objeto **tipada** rejeita um valor do tipo incorreto: atribuir um `int` a uma propriedade declarada como `string` provoca um `TypeError`. As propriedades tipadas definem um verdadeiro contrato: determinam quais as propriedades que existem e que tipo cada uma deve conter sempre.

## Métodos estáticos e classes utilitárias

Um método estático é chamado diretamente na classe, sem passar por uma instância (`new`):

```php
<?php
class Calculs
{
    public static function moyenne(array $notes): float
    {
        return array_sum($notes) / count($notes);
    }
}

echo Calculs::moyenne([12, 15, 9]); // sem «new Calculs()»
?>
```

Uma classe que contenha apenas métodos estáticos nunca serve para criar um «`new`»: trata-se de um simples conjunto de funções interligadas, com um namespace para evitar colisões de nomes entre módulos ou bibliotecas (ver secção seguinte).

## Espaços de nomes e `use`

Um **namespace** evita que uma classe `Repository` de um módulo entre em conflito com uma classe `Repository` de outro:

```php
<?php
namespace App\Facturation;

class Repository
{
    public static function trouver(int $id): ?array
    {
        // ...
    }
}
?>
```

A partir de outro arquivo, existem duas formas de chamar esta classe:

```php
<?php
// 1) caminho completo, absoluto a partir da raiz (o \ inicial é opcional, mas explícito)
\App\Facturation\Repository::trouver(1);

// 2) import no início do arquivo, seguido do nome abreviado
use App\Facturation\Repository;

Repository::trouver(1);
?>
```

`use` não carrega o arquivo propriamente dito; limita-se a indicar ao motor PHP a que nome completo corresponde o nome abreviado utilizado mais abaixo. Trata-se de um mecanismo de autocarregamento (ver capítulo dedicado) que se encarrega de localizar e carregar o arquivo correspondente, no momento em que a classe é efetivamente utilizada.

> **Nota:** `Classe::methode()` (com `::`) assemelha-se a `Classe->methode()`, mas nunca é utilizado com uma instância; é o equivalente quase direto a um namespace + método estático em C++.
