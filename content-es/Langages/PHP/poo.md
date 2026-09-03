---
order: 8
---

# La programación orientada a objetos (POO)

La **programación orientada a objetos** (POO) organiza el código en torno a objetos que agrupan a la vez datos (propiedades) y comportamientos (métodos), en lugar de manipular arrays y funciones por separado. Una clase actúa como "molde": describe qué propiedades existirán y qué métodos estarán disponibles, y cada `new` produce una instancia independiente de ese molde.

## Declarar una clase y propiedades tipadas

```php
<?php
class Vehiculo
{
    private string $marca;
    private string $modelo;
    private int $anio;

    public function __construct(string $marca, string $modelo, int $anio)
    {
        $this->marca  = $marca;
        $this->modelo = $modelo;
        $this->anio   = $anio;
    }

    public function descripcion(): string
    {
        return "{$this->marca} {$this->modelo} ({$this->anio})";
    }
}

$v = new Vehiculo("Peugeot", "308", 2022);
echo $v->descripcion(); // "Peugeot 308 (2022)"
?>
```

- `__construct` es el nombre reservado del método que `new` invoca automáticamente.
- `$this` siempre hace referencia a la instancia actual, y se usa **siempre** con `->`, incluso para leer una propiedad (`$this->marca`) o llamar a un método (`$this->descripcion()`). La única diferencia visual entre ambos es la presencia de `()`.
- `private` = accesible únicamente desde dentro de la clase; `public` = accesible también desde fuera.

> **Nota:** a diferencia de un array, donde se puede crear una nueva clave sobre la marcha (`$arr['nueva_clave'] = 5;`, sin ninguna declaración), una propiedad de objeto **tipada** rechaza un valor del tipo incorrecto: asignar un `int` a una propiedad declarada `string` provoca un `TypeError`. Las propiedades tipadas definen un verdadero contrato: fijan qué propiedades existen y qué tipo debe contener siempre cada una.

## Métodos estáticos y clases de utilidades

Un método estático se invoca directamente sobre la clase, sin pasar por una instancia (`new`):

```php
<?php
class Calculos
{
    public static function media(array $notas): float
    {
        return array_sum($notas) / count($notas);
    }
}

echo Calculos::media([12, 15, 9]); // sin "new Calculos()"
?>
```

Una clase que solo tiene métodos estáticos nunca sirve para hacer un `new`: es un simple agrupamiento de funciones relacionadas entre sí, con un namespace para evitar colisiones de nombres entre módulos o librerías (ver sección siguiente).

## Namespaces y `use`

Un **namespace** evita que una clase `Repository` de un módulo entre en colisión con una clase `Repository` de otro:

```php
<?php
namespace App\Facturacion;

class Repository
{
    public static function encontrar(int $id): ?array
    {
        // ...
    }
}
?>
```

Desde otro archivo, hay dos formas de llamar a esta clase:

```php
<?php
// 1) ruta completa, absoluta desde la raíz (la \ inicial es opcional pero explícita)
\App\Facturacion\Repository::encontrar(1);

// 2) import al inicio del archivo, luego nombre corto
use App\Facturacion\Repository;

Repository::encontrar(1);
?>
```

`use` no carga el archivo en sí: solo indica al motor PHP a qué nombre completo corresponde el nombre corto usado más abajo. Es un mecanismo de [autoloading](/?c=langages-de-programmation&s=php&p=autoloading) el que se encarga de encontrar y cargar el archivo correspondiente, en el momento en que la clase se usa realmente.

> **Nota:** `Clase::metodo()` (con `::`) se parece a `Clase->metodo()` pero nunca se usa con una instancia: es el equivalente casi directo de un namespace + método estático en [C++](/?c=langages-de-programmation&s=cpp&p=cpp).

## Los traits: compartir código sin herencia

Un **trait** agrupa métodos reutilizables, importados en una clase mediante `use NombreDelTrait;` (la misma palabra clave `use` que para un [namespace](#namespaces-y-use), pero con un rol distinto: aquí se importa código, no solo un atajo de nombre). No es herencia (una sola clase madre posible en PHP), ni una interfaz (un trait aporta una implementación, no solo un contrato de métodos a cumplir).

```php
<?php
trait ResumenVentas
{
    public function totalVentas(): float
    {
        return array_sum($this->ventas);
    }
}

trait DetalleVentasPorCategoria
{
    public function ventasPorCategoria(): array
    {
        return array_count_values(array_column($this->ventas, 'categoria'));
    }
}

class RepositorioVentas
{
    use ResumenVentas;
    use DetalleVentasPorCategoria;

    public function __construct(private array $ventas) {}
}

$repo = new RepositorioVentas([/* ... */]);
$repo->totalVentas();            // metodo proporcionado por ResumenVentas
$repo->ventasPorCategoria();     // metodo proporcionado por DetalleVentasPorCategoria
```

| | Herencia | Interfaz | Trait |
|---|---|---|---|
| Aporta una implementación | Sí | No (solo contrato) | Sí |
| Cantidad usable por clase | Una sola clase madre | Varias interfaces | Varios traits |
| Instanciable por sí solo | No (pero la clase madre sí) | No | Nunca |

Un caso de uso concreto: una clase que crece demasiado (por ejemplo `RepositorioVentas`, con métodos de resumen y métodos de detalle agrupado a la vez) puede dividirse por responsabilidad en varios traits, sin cambiar su API pública ni su jerarquía de clases: `$repo->totalVentas()` sigue funcionando exactamente igual para el código que la llama, venga el método directamente de la clase o de un trait importado.

> **Nota:** sortear así el límite de herencia simple de PHP (una clase solo puede heredar de una única clase madre) no convierte a los traits en un sustituto de la herencia: un trait no define una relación "es un" entre dos tipos, solo comparte código entre clases que no tienen necesariamente ningún parentesco.

## Inyección de dependencias

En lugar de crear ella misma los objetos que necesita (`new`), una clase puede recibirlos "desde fuera", como parámetros de su constructor: es la **inyección de dependencias**. La clase que los recibe no necesita saber cómo se construyen esos objetos, solo qué contrato (qué métodos) cumplen.

```php
<?php
class ServicioNotificacion
{
    private Mailer $mailer;
    private Logger $logger;

    public function __construct(?Mailer $mailer = null, ?Logger $logger = null)
    {
        $this->mailer = $mailer ?? new SmtpMailer();  // valor por defecto si no se proporciona nada
        $this->logger = $logger ?? new FileLogger();
    }
}

// uso normal: dependencias por defecto
$servicio = new ServicioNotificacion();

// para tests, o una necesidad puntual: dependencias reemplazadas explícitamente
$servicio = new ServicioNotificacion(new MailerDePrueba(), new LoggerEnMemoria());
```

Los parámetros anulables con un valor de repliegue `??` (ver [Las funciones y métodos más útiles](/?c=langages-de-programmation&s=php&p=methodes)) hacen que cada dependencia sea **opcional**: el código que llama puede dejar el comportamiento por defecto, o proporcionar explícitamente una implementación diferente, típicamente una versión simulada (*mock*) en un test automatizado, sin tocar nunca el código de `ServicioNotificacion` en sí.

> **Nota:** esta técnica es lo que hace que una clase sea *testable* sin depender de un servicio externo real (envío de email real, escritura de archivos de log reales) en cada ejecución de los tests.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una clase agrupa propiedades y métodos; `new` crea una instancia de ella. Un namespace evita las colisiones de nombres entre módulos. Un trait comparte código entre clases sin pasar por la herencia. La inyección de dependencias recibe los objetos necesarios como parámetro en lugar de crearlos uno mismo. |
| **Herramientas utilizables** | `__construct`, propiedades tipadas, métodos `static`, `namespace`/`use`, traits (`trait`/`use`). |
| **Trampas a evitar** | Crear directamente (`new`) las dependencias de una clase en lugar de recibirlas como parámetro: hace que la clase sea difícil de testear de forma aislada. Confundir un trait con la herencia: no crea ninguna relación "es un" entre tipos. |
| **Buenas prácticas** | Tipar las propiedades para que definan un verdadero contrato; inyectar las dependencias en lugar de instanciarlas fijas, para facilitar los tests; dividir una clase demasiado voluminosa en traits por responsabilidad, sin cambiar su API pública. |
