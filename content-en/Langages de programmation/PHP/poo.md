---
order: 8
---

# Object-Oriented Programming (OOP)

**Object-oriented programming** (OOP) organizes code around objects that combine both data (properties) and behavior (methods), rather than manipulating arrays and functions separately. A class acts as a “template”: it describes which properties will exist and which methods will be available, and each in`new`s an instance independent of that template.

## Declaring a Class and Typed Properties

```php
<?php
class Vehicule
{
    private string $marque;
    private string $modele;
    private int $annee;

    public function __construct(string $marque, string $modele, int $annee)
    {
        $this->marque = $marque;
        $this->modele = $modele;
        $this->annee  = $annee;
    }

    public function description(): string
    {
        return "{$this->marque} {$this->modele} ({$this->annee})";
    }
}

$v = new Vehicule("Peugeot", "308", 2022);
echo $v->description(); // "Peugeot 308 (2022)"
?>
```

- `__construct` is the reserved name of the method automatically called by `new`.
- `$this` always refers to the current instance, and is **always** used with `->`—including when reading a property (`$this->marque`) or calling a method (`$this->description()`). The only visual difference between the two is the presence of `()`.
- `private` = accessible only from inside the classroom; `public` = also accessible from outside.

> **Note:** Unlike an array, where you can create a new key on the fly (`$arr['nouvelle_cle'] = 5;`, without any declaration), a **typed** object property will reject a value of the wrong type—assigning a `int` to a property declared as `string` triggers a `TypeError`. Typed properties define a true contract: they specify which properties exist and what type each must always contain.

## Static Methods and Utility Classes

A static method is called directly on the class, without going through an instance (`new`):

```php
<?php
class Calculs
{
    public static function moyenne(array $notes): float
    {
        return array_sum($notes) / count($notes);
    }
}

echo Calculs::moyenne([12, 15, 9]); // no "new Calculs()"
?>
```

A class that contains only static methods is never used to create a `new`: it is simply a collection of related functions, with a namespace to prevent name collisions between modules or libraries (see the next section).

## Namespaces and `use`

A **namespace** prevents a class `Repository` in one module from conflicting with a class `Repository` in another:

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

From another file, there are two ways to call this class:

```php
<?php
// 1) Full, absolute path starting from the root (the leading \ is optional but explicit)
\App\Facturation\Repository::trouver(1);

// 2) Import at the top of the file, then short name
use App\Facturation\Repository;

Repository::trouver(1);
?>
```

`use` It does not load the file itself—it simply tells the PHP engine which full filename corresponds to the short name used below. This is an autoloading mechanism (see the dedicated chapter) that is responsible for locating and loading the corresponding file when the class is actually used.

> **Note:** `Classe::methode()` (with `::`) looks like `Classe->methode()` but is never used with an instance—it is the near-exact equivalent of a namespace plus a static method in C++.
