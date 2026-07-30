---
order: 9
---

# La carga automática de clases

Sin la carga automática, cada archivo que utiliza una clase debe realizar una llamada explícita a `require` para cargar el archivo que la contiene, lo cual resulta engorroso y propenso a errores cuando un proyecto tiene muchas clases. `spl_autoload_register()` permite delegar esta tarea al propio motor de PHP.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $classe) {
    $archivo = __DIR__ . '/' . $classe . '.php';
    if (file_exists($archivo)) {
        require $archivo;
    }
});

$obj = new MaClasse(); // PHP llama automáticamente al resolutor con «MaClasse».
// -> No es necesario incluir ninguna referencia al manual en ninguna otra parte del proyecto.
?>
```

`spl_autoload_register()` Registra **una vez** una función «resolver». A continuación, cada vez que el motor PHP encuentra un nombre de clase que aún no se ha cargado, llama automáticamente a esta función pasándole el nombre de la clase (en forma de cadena) y espera a que cargue el archivo correcto. Si ninguna de las funciones registradas consigue cargar la clase, PHP genera un error fatal «Class not found».

## La función pasada como argumento es un cierre.

El argumento de `spl_autoload_register()` no es ni un nombre de función ni una variable: es una **función anónima (closure)**, definida directamente en el lugar donde se utiliza. Equivalente en PHP a una callback de JS (`matriz.map(function(x) { ... })` o `x => ...`) o a una lambda de C++11. No se ejecuta en la línea en la que está escrita: se almacena y **se invoca más tarde**, cada vez que se hace referencia a una clase desconocida.

## Asignar un espacio de nombres a una carpeta

Un resolutor más realista asocia cada **prefijo de espacio de nombres** a una carpeta raíz y reconstruye la ruta del archivo a partir del nombre completo de la clase:

```php
<?php
spl_autoload_register(function (string $classe): void {
    $namespaces = [
        'App\\Modeles\\'  => __DIR__ . '/Modeles/',
        'App\\Services\\' => __DIR__ . '/Services/',
    ];

    foreach ($namespaces as $prefixe => $dossierBase) {
        if (str_starts_with($classe, $prefixe)) {
            $ruta = $dossierBase . str_replace('\\', '/', substr($classe, strlen($prefixe))) . '.php';
            if (file_exists($ruta)) {
                require $ruta;
            }
            return;
        }
    }
});
?>
```

Ejemplo de resolución, con `$classe = 'App\Services\Facturation\Calculateur'`:
1. `str_starts_with($classe, 'App\\Services\\')` → `true`; este prefijo es el correcto.
2. `substr(...)` elimina el prefijo coincidente → `'Facturation\Calculateur'`.
3. `str_replace('\\', '/', ...)` transforma el separador de espacio de nombres en separador de carpeta → `'Facturation/Calculateur'`.
4. Ruta final: `.../Services/Facturation/Calculateur.php` — que debe corresponder a la ubicación real del archivo.

> **Nota:** «`'App\\Modeles\\'`» en una cadena entre comillas simples: «`\\`» representa **un único** carácter «`\`» (debe duplicarse para escribirse literalmente); es la cadena «`App\Modeles\`», el separador de espacio de nombres.

El `return;`, situado después del `if`, se ejecuta independientemente de si el archivo existe o no (se encuentra después del `if (file_exists(...))`, no dentro de él): dado que los prefijos de los espacios de nombres son mutuamente excluyentes en su primer segmento, una vez encontrado el prefijo correcto, seguir comprobando los demás sería siempre inútil.

> **Convención imprescindible para que funcione:** el nombre del espacio de nombres + el nombre de la clase deben codificar literalmente la ruta del archivo —un archivo por clase, estructura de carpetas = estructura de espacios de nombres.
