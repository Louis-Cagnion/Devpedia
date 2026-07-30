---
order: 8
---

# La programación orientada a objetos (POO)

La **programación orientada a objetos** (POO) organiza el código en torno a objetos que agrupan tanto datos (propiedades) como comportamientos (métodos), en lugar de manipular matrices y funciones por separado. Una clase actúa como «molde»: describe qué propiedades existirán y qué métodos estarán disponibles, y cada e`new`a genera una instancia independiente de ese molde.

## Declarar una clase y propiedades tipadas

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

- `__construct` Es el nombre reservado del método que `new` invoca automáticamente.
- `$this` Siempre hace referencia a la instancia actual y **siempre** se utiliza con `->`, incluso para leer una propiedad (`$this->marca`) o llamar a un método (`$this->description()`). La única diferencia visual entre ambos es la presencia de `()`.
- `private` = accesible únicamente desde dentro del aula; `public` = accesible también desde fuera.

> **Nota:** a diferencia de un array, en el que se puede crear una nueva clave sobre la marcha (de forma `$arr['nouvelle_cle'] = 5;`e, sin necesidad de declaración alguna), una propiedad de objeto **tipada** rechaza un valor del tipo incorrecto; asignar un `int` a una propiedad declarada `string` provoca un `TypeError`. Las propiedades tipadas definen un verdadero contrato: establecen qué propiedades existen y qué tipo debe contener cada una de ellas en todo momento.

## Métodos estáticos y clases de utilidades

Un método estático se invoca directamente sobre la clase, sin pasar por una instancia (`new`):

```php
<?php
class Calculs
{
    public static function moyenne(array $notes): float
    {
        return array_sum($notes) / count($notes);
    }
}

echo Calculs::moyenne([12, 15, 9]); // No hay «new Calculs()»
?>
```

Una clase que solo tiene métodos estáticos nunca sirve para crear un e`new`: es simplemente un conjunto de funciones relacionadas entre sí, con un espacio de nombres para evitar colisiones de nombres entre módulos o bibliotecas (véase la siguiente sección).

## Espacios de nombres y `use`

Un **espacio de nombres** evita que una clase `Repository` de un módulo entre en conflicto con una clase `Repository` de otro:

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

Desde otro archivo, hay dos formas de llamar a esta clase:

```php
<?php
// 1) ruta completa y absoluta desde la raíz (la barra inicial es opcional, pero explícita)
\App\Facturation\Repository::trouver(1);

// 2) Importación al principio del archivo, seguida del nombre corto
use App\Facturation\Repository;

Repository::trouver(1);
?>
```

`use` No carga el archivo en sí, sino que simplemente indica al motor PHP a qué nombre completo corresponde el nombre abreviado que se utiliza más abajo. Se trata de un mecanismo de autocarga (véase el capítulo dedicado a este tema) que se encarga de localizar y cargar el archivo correspondiente en el momento en que la clase se utiliza realmente.

> **Nota:** «`Classe::methode()`» (con «`::`») se parece a «`Classe->methode()`», pero nunca se utiliza con una instancia; es el equivalente casi directo a un espacio de nombres + método estático en C++.
