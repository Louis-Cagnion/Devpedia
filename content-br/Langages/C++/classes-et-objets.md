---
order: 3
---

# As classes e objetos

Uma **classe** C++ reúne o que uma [`struct` C](/?c=langages-de-programmation&s=c&p=variables) separa em dois: os dados E as funções que os manipulam, no mesmo lugar, com além disso um controle explícito do que é visível a partir de fora.

## Declarar uma classe

```cpp
class Veiculo {
public:
    // const& : evita copiar as strings recebidas (veja As referências)
    Veiculo(const std::string &marca, const std::string &modelo) : marca(marca), modelo(modelo) {}

    std::string descricao() const {
        return marca + " " + modelo;
    }

private:
    std::string marca;
    std::string modelo;
};

Veiculo v("Peugeot", "308");
std::cout << v.descricao();   // "Peugeot 308"
```

- `public`: acessível de fora da classe.
- `private`: acessível apenas de dentro da classe (os métodos de `Veiculo`).
- `protected`: como `private`, mas também acessível às classes que herdam desta (veja [Herança e polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)).

> **Nota:** ao contrário de uma `struct` C (onde todos os dados são livremente acessíveis), uma classe C++ esconde por padrão seus membros (`private` implícito): é a **encapsulação**, o exterior só interage com o que a classe expõe voluntariamente.

## O construtor, em duas escritas

```cpp
// Lista de inicializacao (preferida): inicializa diretamente, sem passar por uma atribuicao
Veiculo(std::string marca, std::string modelo) : marca(marca), modelo(modelo) {}

// Equivalente com atribuicao no corpo (funciona, mas menos idiomatico)
Veiculo(std::string marca, std::string modelo) {
    this->marca = marca;
    this->modelo = modelo;
}
```

A lista de inicialização (depois do `:`) constrói diretamente cada membro com o valor correto, em vez de construí-lo uma primeira vez (valor padrão), e depois sobrescrevê-lo no corpo do construtor: um detalhe de desempenho que se torna significativo para objetos custosos de construir.

## O destrutor

```cpp
class GerenciadorArquivo {
public:
    GerenciadorArquivo(const std::string &caminho) {
        arquivo.open(caminho);
    }

    ~GerenciadorArquivo() {   // chamado AUTOMATICAMENTE quando o objeto sai de escopo
        arquivo.close();
    }

private:
    std::ifstream arquivo;
};
```

O destrutor (`~NomeClasse()`) executa automaticamente assim que o objeto é destruído (fim de escopo para um objeto local, `delete` para um objeto alocado dinamicamente): é a base do mecanismo [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), central em C++ para nunca esquecer de liberar um recurso.

## Métodos `const`

```cpp
std::string descricao() const {   // "const" aqui: garante que este metodo NAO modifica o objeto
    return marca + " " + modelo;
}
```

Marcar um método `const` documenta e faz o compilador respeitar que ele não modifica nenhum membro do objeto: útil em particular para permitir a chamada desse método em um objeto ele mesmo declarado `const`.

## Membros e métodos estáticos

```cpp
class Contador {
public:
    Contador() { totalCriados++; }
    static int totalCriados;   // compartilhado por TODAS as instancias, nao um por objeto
};

int Contador::totalCriados = 0;   // definicao obrigatoria fora da classe
```

Veja também [Herança e polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) e [A sobrecarga de operadores](/?c=langages-de-programmation&s=cpp&p=surcharge-d-operateurs), para estender o comportamento de uma classe além de simples métodos nomeados.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma classe reúne dados e métodos, com um controle de acesso (`public`/`private`/`protected`). O construtor inicializa o objeto, o destrutor libera seus recursos automaticamente ao fim de seu escopo. |
| **Ferramentas utilizáveis** | Lista de inicialização (`: membro(valor)`), métodos `const`, membros/métodos `static`. |
| **Armadilhas a evitar** | Esquecer que uma classe esconde seus membros por padrão (`private` implícito), ao contrário de uma `struct` C inteiramente pública. |
| **Boas práticas** | Preferir a lista de inicialização a uma atribuição no corpo do construtor; marcar `const` todo método que não modifica o objeto. |
