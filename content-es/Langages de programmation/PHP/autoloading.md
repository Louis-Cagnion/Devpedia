---
order: 10
---

# La carga automática de clases

Sin autoloading, cada archivo que usa una clase debe hacer un `require` explícito del archivo que la contiene: pesado y frágil en cuanto un proyecto tiene muchas clases. `spl_autoload_register()` permite delegar esta carga al propio motor PHP.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $clase) {
    $archivo = __DIR__ . '/' . $clase . '.php';
    if (file_exists($archivo)) {
        require $archivo;
    }
});

$obj = new MiClase(); // PHP llama automáticamente al resolutor con "MiClase"
// -> ningún require manual necesario en el resto del proyecto
?>
```

`spl_autoload_register()` registra **una vez** una función "resolutor". Después, cada vez que el motor PHP encuentra un nombre de clase aún no cargado, llama automáticamente a esta función pasándole el nombre de la clase (como string), y espera a que cargue el archivo correcto. Si ninguna función registrada consigue cargar la clase, PHP lanza un error fatal "Class not found".

## La función pasada como argumento es una closure

El argumento de `spl_autoload_register()` no es ni un nombre de función ni una variable: es una **función anónima (closure)**, definida directamente en el lugar donde se usa. Equivalente en PHP de un callback de JS (`array.map(function(x) { ... })` o `x => ...`) o de una lambda de C++11. No se ejecuta en la línea donde está escrita: se almacena, y **se invoca más tarde**, cada vez que se referencia una clase desconocida.

## Hacer corresponder un namespace con una carpeta

Un resolutor más realista asocia cada **prefijo de namespace** a una carpeta base, y reconstruye la ruta del archivo a partir del nombre completo de la clase:

```php
<?php
spl_autoload_register(function (string $clase): void {
    $namespaces = [
        'App\\Modelos\\'  => __DIR__ . '/Modelos/',
        'App\\Services\\' => __DIR__ . '/Services/',
    ];

    foreach ($namespaces as $prefijo => $carpetaBase) {
        if (str_starts_with($clase, $prefijo)) {
            $ruta = $carpetaBase . str_replace('\\', '/', substr($clase, strlen($prefijo))) . '.php';
            if (file_exists($ruta)) {
                require $ruta;
            }
            return;
        }
    }
});
?>
```

Ejemplo de resolución, con `$clase = 'App\Services\Facturacion\Calculador'`:
1. `str_starts_with($clase, 'App\\Services\\')` → `true`, este prefijo coincide.
2. `substr(...)` retira el prefijo encontrado → `'Facturacion\Calculador'`.
3. `str_replace('\\', '/', ...)` transforma el separador de namespace en separador de carpeta → `'Facturacion/Calculador'`.
4. Ruta final: `.../Services/Facturacion/Calculador.php`, que debe corresponder a la ubicación real del archivo.

> **Nota:** `'App\\Modelos\\'` en una string entre comillas simples: `\\` representa **un solo** carácter `\` (debe duplicarse para escribirse literalmente): es la string `App\Modelos\`, el separador de namespace.

El `return;` después del `if` se ejecuta, exista o no el archivo (está colocado después del `if (file_exists(...))`, no dentro): como los prefijos de namespace son mutuamente excluyentes en su primer segmento, una vez encontrado el prefijo correcto, seguir probando los demás sería siempre inútil.

> **Convención imprescindible para que funcione:** el nombre del namespace + el nombre de la clase deben codificar literalmente la ruta del archivo: un archivo por clase, estructura de carpetas = estructura de namespaces.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `spl_autoload_register()` registra una función llamada automáticamente en cuanto se referencia una clase no cargada: ya no hace falta `require` manual para cada clase. |
| **Herramientas utilizables** | `spl_autoload_register()`, correspondencia prefijo de namespace → carpeta. |
| **Trampas a evitar** | No hacer corresponder exactamente la estructura de carpetas con la de los namespaces: el resolutor ya no encontraría el archivo. |
| **Buenas prácticas** | Respetar la convención "un archivo por clase, estructura de carpetas = estructura de namespaces" para que el autoloading funcione de forma predecible. |
