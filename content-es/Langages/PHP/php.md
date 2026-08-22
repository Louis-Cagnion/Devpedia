---
order: 3
---

# PHP

Un [lenguaje de programación](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) es un conjunto de reglas que permite escribir instrucciones que un ordenador puede ejecutar. PHP es uno de ellos, diseñado específicamente para funcionar en un servidor web y generar páginas bajo demanda.

```php
<?php
$nombre = "Devpedia";     // una variable, ver el capítulo dedicado
echo "Hola, $nombre";     // muestra: Hola, Devpedia
```

| Término | Qué significa |
|---|---|
| Alto nivel | Oculta gran parte de los detalles técnicos relacionados con la máquina, a diferencia de un lenguaje de bajo nivel como el [C](/?c=langages-de-programmation&s=c&p=c) |
| Recolector de basura (*garbage collector*) | Como en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), la memoria de los valores que dejan de usarse se libera automáticamente |
| Solicitud HTTP | El mensaje que un navegador envía a un servidor para pedir una página (ver [Los intercambios de datos: API y HTTP](/?c=infrastructure&p=api-et-http)). PHP se ejecuta del lado del servidor, precisamente para responder a estas solicitudes |

Aprender PHP permite entender cómo un servidor web procesa una solicitud e interactúa con una base de datos (ver [SQL](/?c=domain-specific-languages-dsl&p=sql)) para generar una respuesta. Sigue siendo ampliamente usado para los sitios dinámicos, los CMS ([WordPress](https://wordpress.org), [Drupal](https://www.drupal.org)) y frameworks como [Laravel](https://laravel.com) o [Symfony](https://symfony.com).
