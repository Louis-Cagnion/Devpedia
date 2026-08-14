---
order: 4
---

# Herança e polimorfismo

**A herança** permite que uma classe reutilize (e amplie ou modifique) o comportamento de outra. O **polimorfismo** permite tratar objetos de classes diferentes de forma uniforme, através de uma interface comum, o mecanismo mais poderoso, e muitas vezes mal compreendido, da POO em C++.

## Herança simples

```cpp
class Animal {
public:
    Animal(std::string nome) : nome(nome) {}
    std::string parler() const { return "..."; }
protected:
    std::string nome;
};

class Chien : public Animal {
public:
    Chien(std::string nome) : Animal(nome) {}   // chama explicitamente o construtor pai
    std::string parler() const { return nome + " aboie"; }
};
```

## O problema sem o «`virtual`»

```cpp
Animal *a = new Chien("Rex");
std::cout << a->parler();   // exibe «...» -> NÃO «O Rex ladra»!
```

> **Armadilha clássica:** sem a palavra-chave «`virtual`», o C++ escolhe qual a versão de «`parler()`» a chamar com base no **tipo declarado** do ponteiro (`Animal*`), e não no tipo real do objeto apontado (`Chien`), um mecanismo denominado *ligação estática*. O resultado parece «ignorar» a herança, o que muitas vezes surpreende quem vem de uma linguagem como PHP, Python ou Java, onde este comportamento é automático.

## Tornar um método polimórfico: `virtual`

```cpp
class Animal {
public:
    Animal(std::string nome) : nome(nome) {}
    virtual std::string parler() const { return "..."; }   // «virtual» ativa a LIGAÇÃO DINÂMICA
    virtual ~Animal() {}   // destruidor virtual: ver nota abaixo
protected:
    std::string nome;
};

class Chien : public Animal {
public:
    Chien(std::string nome) : Animal(nome) {}
    std::string parler() const override { return nome + " aboie"; }   // «override»: verificado pelo compilador
};

Animal *a = new Chien("Rex");
std::cout << a->parler();   // «Rex ladra» -> a versão CORRETA é chamada, graças a «virtual»
delete a;
```

`virtual` permite escolher o método a ser chamado em função do **tipo real** do objeto, determinado em tempo de execução (*ligação dinâmica*) em vez de em tempo de compilação: é este mecanismo que permite o polimorfismo: uma mesma linha de código (`a->parler()`) comporta-se de forma diferente consoante o objeto efetivamente apontado.

> **Nota:** `override` (opcional, mas fortemente recomendado) solicita ao compilador que verifique se este método redefine efetivamente um método `virtual` da classe pai: um erro de digitação na assinatura (número de parâmetros, `const` esquecido...) torna-se, assim, um erro de compilação, em vez de um bug silencioso em que o método pai continuaria a ser chamado sem que nos apercebêssemos.

## Por que é que o destrutor também deve ser`virtual`

```cpp
Animal *a = new Chien("Rex");
delete a;   // sem destruidor virtual: APENAS ~Animal() é chamado, nunca ~Cão()
```

Sem `virtual` no destrutor, a eliminação de um objeto `Chien` através de um ponteiro `Animal*` executa apenas o destrutor de `Animal`: quaisquer recursos próprios de `Chien` (memória alocada, arquivo aberto...) nunca seriam libertados. Qualquer classe destinada a ser herdada e manipulada através de um ponteiro à classe base deve, portanto, declarar sistematicamente o seu destruidor `virtual`.

## Classes abstratas: impor um contrato sem implementação

```cpp
class FormeGeometrique {
public:
    virtual double aire() const = 0;   // "= 0": função PURAMENTE virtual, sem implementação aqui
    virtual ~FormeGeometrique() {}
};

class Cercle : public FormeGeometrique {
public:
    Cercle(double rayon) : rayon(rayon) {}
    double aire() const override { return 3.14159 * rayon * rayon; }
private:
    double rayon;
};

FormeGeometrique *forme = new Cercle(5);   // OK
FormeGeometrique *impossible = new FormeGeometrique();   // ERRO: classe abstrata, não instanciável
```

Uma classe que contenha pelo menos um método puramente virtual (`= 0`) torna-se **abstrata**: nunca pode ser instanciada diretamente, apenas herdada, define um contrato («toda a forma geométrica deve saber calcular a sua área») que cada classe filha deve implementar.
