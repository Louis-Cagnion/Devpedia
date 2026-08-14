---
order: 8
---

# Las clases y la programación orientada a objetos

A diferencia de [PHP](/?c=langages-de-programmation&s=php&p=poo) o [Python](/?c=langages-de-programmation&s=python&p=poo), el objeto en JavaScript no se basa fundamentalmente en clases: se basa en **prototipos**. La sintaxis `class` (desde ES6) no es más que azúcar sintáctico sobre este mecanismo más antiguo; comprender ambos ayuda a no sorprenderse ante ciertos comportamientos.

## Declarar una clase

```javascript
class Vehiculo {
    constructor(marca, modelo) {
        this.marca = marca;
        this.modelo = modelo;
    }

    descripcion() {
        return `${this.marca} ${this.modelo}`;
    }
}

const v = new Vehiculo("Peugeot", "308");
console.log(v.descripcion());   // "Peugeot 308"
```

## La herencia

```javascript
class Animal {
    constructor(nombre) {
        this.nombre = nombre;
    }
    hablar() {
        return "...";
    }
}

class Perro extends Animal {
    hablar() {
        return `${this.nombre} ladra`;
    }
}

class PerroGuardian extends Perro {
    hablar() {
        return super.hablar() + " ruidosamente";   // llama al método de la clase padre
    }
}
```

## Métodos y propiedades estáticas

```javascript
class Calculos {
    static suma(a, b) {
        return a + b;
    }
}

Calculos.suma(2, 3);   // no hace falta "new Calculos()"
```

## Getters y setters

```javascript
class Circulo {
    constructor(radio) {
        this.radio = radio;
    }

    get superficie() {              // se accede SIN paréntesis: círculo.superficie
        return Math.PI * this.radio ** 2;
    }

    set diametro(valor) {        // "círculo.diámetro = 10" llama a este método
        this.radio = valor / 2;
    }
}

const c = new Circulo(5);
console.log(c.superficie);  // calculado al vuelo, como un atributo
c.diametro = 10;            // equivale a c.radio = 5
```

## Campos privados (`#`)

```javascript
class CuentaBancaria {
    #saldo = 0;   // el "#" hace que esta propiedad sea inaccesible desde fuera de la clase

    depositar(importe) {
        this.#saldo += importe;
    }

    get saldo() {
        return this.#saldo;
    }
}

const cuenta = new CuentaBancaria();
cuenta.depositar(100);
console.log(cuenta.saldo);   // 100
console.log(cuenta.#saldo);  // SyntaxError: #saldo no es accesible aquí
```

## Lo que se esconde detrás de `class`: el prototipo

```javascript
console.log(typeof Vehiculo);                     // "function" -> una clase ES una función especial
console.log(v.__proto__ === Vehiculo.prototype);  // true
```

Cada objeto de JavaScript lleva una referencia oculta (`__proto__`) hacia otro objeto, su **prototipo**: cuando una propiedad/método no se encuentra directamente en el objeto, JavaScript la busca automáticamente en su prototipo, luego en el prototipo de ese prototipo, etc. (la "cadena de prototipos"). `descripcion()` en realidad solo está definida **una única vez**, en `Vehiculo.prototype`, y es compartida por todas las instancias, no duplicada en cada objeto creado por `new Vehiculo(...)`.

> **Nota:** esta distinción explica por qué modificar `Vehiculo.prototype.descripcion` afecta **inmediatamente** a todos los objetos ya creados: no poseen su propia copia del método, la buscan dinámicamente en el prototipo compartido en cada llamada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `class` es azúcar sintáctico sobre los prototipos: un método se define una única vez en `Clase.prototype`, compartido por todas las instancias. `extends` gestiona la herencia, `#` los campos privados. |
| **Herramientas utilizables** | `static` (métodos/propiedades de clase), `get`/`set` (accesores calculados), campos privados `#nombre`. |
| **Trampas a evitar** | Olvidar `super.metodo()` en una clase hija que quiere extender (en lugar de reemplazar) el comportamiento del padre. |
| **Buenas prácticas** | Usar `#` para cualquier dato que nunca deba manipularse directamente desde fuera de la clase. |
