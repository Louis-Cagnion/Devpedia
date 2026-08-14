---
order: 2
---

# Os espaços de nomes (namespaces)

Um **espaço de nomes** (*namespace*) agrupa identificadores (funções, classes, variáveis) sob um prefixo comum, para evitar colisões de nomes entre diferentes partes de um projeto ou diferentes bibliotecas — a mesma necessidade que os namespaces já abordados em PHP (ver capítulo dedicado).

## Declarar e utilizar um namespace

```cpp
namespace Facturation {
    class Facture {
    public:
        double montant;
    };

    double calculerTVA(double montant) {
        return montant * 0.20;
    }
}

Facturation::Facture f;                    // acesso completo, através de «::»
double tva = Facturation::calculerTVA(100);
```

## `using namespace` : importar sem prefixo

```cpp
using namespace Facturation;

Facture f;              // já não é necessário o prefixo «Facturação::»
double tva = calculerTVA(100);
```

> **Nota (melhores práticas):** A utilização de «`using namespace X;`» no início de um arquivo de cabeçalho (`.h`) é geralmente desaconselhada — impõe essa importação a **todos** os arquivos que incluam esse cabeçalho, com o risco de colisão de nomes que já não é possível controlar. Reserve «`using namespace`» para o interior de um arquivo `.cpp` específico, nunca num cabeçalho partilhado.

## `std` : o namespace da biblioteca padrão

```cpp
std::vector<int> números;   // «vector» encontra-se no namespace «std», daí o prefixo
std::cout << "Bonjour";      // O mesmo se aplica a «custo»
```

```cpp
// Num OUTRO bloco/arquivo, após «using namespace std;»:
using namespace std;          // permite utilizar «vector», «cout»... sem prefixo

vector<int> autresNombres;
cout << "Bonjour";
```

É exatamente por esta razão que todo o código dos capítulos anteriores (STL, exceções...) utiliza o prefixo `std::` — `vector`, `map`, `cout`, `runtime_error`... estão todos declarados no namespace `std` da biblioteca padrão.

## Importação seletiva

```cpp
using std::cout;   // Importa APENAS «cout», e não todo o namespace std

cout << "Bonjour";      // funciona
vector<int> v;             // ERRO: «vector» requer sempre std:: (não importado)
```

Um compromisso entre a complexidade do prefixo sistemático e o risco de um «`using namespace`» completo — importar apenas o que é realmente utilizado, de forma específica.

## Espaços de nomes aninhados

```cpp
namespace Entreprise {
    namespace Facturation {
        class Facture { /* ... */ };
    }
}

// equivalente mais conciso a partir do C++17:
namespace Entreprise::Facturation {
    class Facture { /* ... */ };
}

Entreprise::Facturation::Facture f;
```
