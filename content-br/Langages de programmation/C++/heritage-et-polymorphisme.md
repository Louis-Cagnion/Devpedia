---
order: 4
---

# Herança e polimorfismo

A **herança** permite que uma classe reutilize (e estenda ou modifique) o comportamento de outra. O **polimorfismo** permite tratar objetos de classes diferentes de forma uniforme, através de uma interface comum: o mecanismo mais poderoso, e o mais frequentemente mal compreendido, da POO em C++.

## Herança simples

```cpp
class Animal {
public:
    Animal(std::string nome) : nome(nome) {}
    std::string falar() const { return "..."; }
protected:
    std::string nome;
};

class Cachorro : public Animal {
public:
    Cachorro(std::string nome) : Animal(nome) {}   // chama explicitamente o construtor pai
    std::string falar() const { return nome + " late"; }
};
```

## O problema sem `virtual`

```cpp
Animal *a = new Cachorro("Rex");
std::cout << a->falar();   // exibe "..." -> NAO "Rex late"!
```

> **Armadilha clássica:** sem a palavra-chave `virtual`, C++ escolhe qual versão de `falar()` chamar baseando-se no **tipo declarado** do ponteiro (`Animal*`), não no tipo real do objeto apontado (`Cachorro`): um mecanismo chamado *ligação estática*. O resultado parece "ignorar" a herança, o que costuma surpreender quem vem de uma linguagem como [PHP](/?c=langages-de-programmation&s=php&p=poo), [Python](/?c=langages-de-programmation&s=python&p=poo) ou [Java](https://docs.oracle.com/en/java/), onde esse comportamento é automático.

## Tornar um método polimórfico: `virtual`

```cpp
class Animal {
public:
    Animal(std::string nome) : nome(nome) {}
    virtual std::string falar() const { return "..."; }  // "virtual" ativa a LIGACAO DINAMICA
    virtual ~Animal() {}                                 // destrutor virtual: veja nota abaixo
protected:
    std::string nome;
};

class Cachorro : public Animal {
public:
    Cachorro(std::string nome) : Animal(nome) {}
    std::string falar() const override { return nome + " late"; }   // "override": verificado pelo compilador
};

Animal *a = new Cachorro("Rex");
std::cout << a->falar();   // "Rex late" -> a versao CORRETA e chamada, gracas a "virtual"
delete a;
```

`virtual` faz com que o método a chamar seja escolhido conforme o **tipo real** do objeto, resolvido na execução (*ligação dinâmica*) em vez de na compilação; é esse mecanismo que permite o polimorfismo: uma mesma linha de código (`a->falar()`) se comporta diferentemente conforme o objeto realmente apontado.

> **Nota:** `override` (facultativo mas fortemente recomendado) pede ao compilador para verificar que esse método realmente redefine um método `virtual` da classe pai: um erro de digitação na assinatura (número de parâmetros, `const` esquecido...) então se torna um erro de compilação, em vez de um bug silencioso em que o método pai continuaria sendo chamado sem que se percebesse.

## Por que o destrutor também deve ser `virtual`

```cpp
Animal *a = new Cachorro("Rex");
delete a;   // sem destrutor virtual: SOMENTE ~Animal() e chamado, nunca ~Cachorro()
```

Sem `virtual` no destrutor, remover um objeto `Cachorro` via um ponteiro `Animal*` executa apenas o destrutor de `Animal`: qualquer recurso próprio de `Cachorro` (memória alocada, arquivo aberto...) nunca seria liberado. Toda classe destinada a ser herdada e manipulada por ponteiro de base deve, portanto, sistematicamente declarar seu destrutor `virtual`.

## Classes abstratas: impor um contrato sem implementação

```cpp
class FormaGeometrica {
public:
    virtual double area() const = 0;   // "= 0": funcao PURAMENTE virtual, nenhuma implementacao aqui
    virtual ~FormaGeometrica() {}
};

class Circulo : public FormaGeometrica {
public:
    Circulo(double raio) : raio(raio) {}
    double area() const override { return 3.14159 * raio * raio; }
private:
    double raio;
};

FormaGeometrica *forma = new Circulo(5);                  // OK
FormaGeometrica *impossivel = new FormaGeometrica();      // ERRO: classe abstrata, nao instanciavel
```

Uma classe contendo pelo menos um método puramente virtual (`= 0`) se torna **abstrata**: ela nunca pode ser instanciada diretamente, apenas herdada: ela define um contrato ("toda forma geométrica deve saber calcular sua área") que cada classe filha deve implementar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A herança reutiliza o comportamento de uma classe pai. `virtual` ativa a ligação dinâmica (o tipo real do objeto decide o método chamado), indispensável ao polimorfismo. Uma classe abstrata (método `= 0`) impõe um contrato sem implementação. |
| **Ferramentas utilizáveis** | `virtual`, `override`, destrutor `virtual`, classes abstratas. |
| **Armadilhas a evitar** | Esquecer `virtual` em um método destinado a ser polimórfico (ligação estática silenciosa); esquecer `virtual` no destrutor de uma classe destinada a ser manipulada por ponteiro de base (vazamento de recursos). |
| **Boas práticas** | Sempre declarar `virtual` o destrutor de uma classe destinada a ser herdada; usar `override` sistematicamente para que o compilador detecte uma assinatura mal redefinida. |
