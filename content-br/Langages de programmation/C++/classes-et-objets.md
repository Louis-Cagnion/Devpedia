---
order: 3
---

# As classes e os objetos

Uma **classe** C++ reúne num único local aquilo que um «`struct`» C (ver capítulo dedicado) separa em duas partes: os dados E as funções que os manipulam, além de proporcionar um controle explícito do que é visível a partir do exterior.

## Declarar uma classe

```cpp
class Vehicule {
public:
    // const&: evita a cópia das cadeias de caracteres recebidas (ver capítulo sobre referências)
    Vehicule(const std::string &marca, const std::string &modelo) : marca(marca), modelo(modelo) {}

    std::string description() const {
        return marca + " " + modelo;
    }

private:
    std::string marca;
    std::string modelo;
};

Vehicule v("Peugeot", "308");
std::cout << v.description();   // «Peugeot 308»
```

- `public` : acessível a partir do exterior da sala de aula.
- `private` : acessível apenas a partir do interior da classe (os métodos de «`Vehicule`»).
- `protected` : tal como a `private`, mas também acessível às classes que herdam desta (ver capítulo sobre herança).

> **Nota:** ao contrário de um `struct` em C (onde todos os dados são de acesso livre), uma classe em C++ oculta, por padrão, os seus membros (`private` implícito): isto é o que se designa por **encapsulamento**: o exterior interage apenas com o que a classe expõe voluntariamente.

## O construtor, em duas formas de escrita

```cpp
// Lista de inicialização (preferida): inicializa diretamente, sem passar por uma atribuição
Vehicule(std::string marca, std::string modelo) : marca(marca), modelo(modelo) {}

// Equivalente com atribuição no corpo (funciona, mas é menos idiomático)
Vehicule(std::string marca, std::string modelo) {
    this->marca = marca;
    this->modelo = modelo;
}
```

A lista de inicialização (após o `:`) constrói diretamente cada membro com o valor correto, em vez de o construir uma primeira vez (valor por padrão) e, em seguida, sobrescrevê-lo no corpo do construtor, um pormenor de desempenho que se torna significativo para objetos cuja construção é dispendiosa.

## O destrutor

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &caminho) {
        arquivo.open(caminho);
    }

    ~GestionnaireFichier() {   // chamada AUTOMATICAMENTE quando o objeto sai do âmbito
        arquivo.close();
    }

private:
    std::ifstream arquivo;
};
```

O `~NomClasse()` é executado automaticamente assim que o objeto é destruído (fim do âmbito, no caso de um objeto local, ou «`delete`», no caso de um objeto alocado dinamicamente): esta é a base do mecanismo RAII (ver capítulo dedicado), fundamental em C++ para garantir que nunca se esqueça de libertar um recurso.

## Métodos`const`

```cpp
std::string description() const {   // «const» aqui: garante que este método NÃO altera o objeto
    return marca + " " + modelo;
}
```

Marcar um método como «`const`» documenta e garante que o compilador assegure que o mesmo não altere nenhum membro do objeto, útil, em particular, para permitir a chamada deste método num objeto que também tenha sido declarado como «`const`».

## Membros e métodos estáticos

```cpp
class Contador {
public:
    Contador() { totalCrees++; }
    static int totalCrees;   // partilhada por TODAS as instâncias, e não uma por objeto
};

int Contador::totalCrees = 0;   // definição obrigatória fora da classe
```

Consulte também o capítulo sobre herança e polimorfismo, bem como sobre a sobrecarga de operadores, para alargar o comportamento de uma classe para além de simples métodos nomeados.
