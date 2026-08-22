---
order: 11
---

# Os casts em C++

Converter um valor de um tipo para outro é chamado de **cast**. Em C, existe apenas uma sintaxe: `(tipo)valor`. O C++ propõe quatro sintaxes distintas, cada uma reservada a uma intenção precisa: essa precisão permite ao compilador (e a um futuro leitor do código) saber imediatamente que tipo de conversão está em jogo, em vez de ter que adivinhar.

## Por que não simplesmente `(tipo)valor`?

O cast à moda C executa **silenciosamente** qualquer conversão solicitada, até as mais arriscadas (remover um `const`, reinterpretar bytes, descer em uma hierarquia de classes sem verificação), sem distinção visível entre uma conversão inofensiva e uma conversão perigosa:

```cpp
int inteiro = 65;
char letra = (char)inteiro;          // conversao numerica inofensiva
const char *texto = "oi";
char *modificavel = (char *)texto;   // remove um "const": bem mais arriscado, mas sintaxe identica
```

Os quatro casts do C++ tornam essa distinção explícita e, sobretudo, **pesquisável**: `grep -r "reinterpret_cast"` encontra imediatamente todos os pontos de risco de um projeto, o que um cast à moda C não permite.

## `static_cast`: as conversões conhecidas em tempo de compilação

`static_cast` cobre as conversões "normais", cuja validade pode ser verificada pelo compilador sem informação adicional em tempo de execução: conversões numéricas, conversão explícita para um tipo cujo construtor existe, ou subida (*upcast*) em uma [hierarquia de classes](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) (de uma classe derivada para sua classe base).

```cpp
double preco = 19.99;
int arredondado = static_cast<int>(preco); // conversao numerica explicita

Derivada derivada;
Base *base = static_cast<Base *>(&derivada); // upcast: sempre valido
```

## `dynamic_cast`: a descida segura em uma hierarquia

Descer (*downcast*) de uma classe base para uma classe derivada é arriscado: o ponteiro de base pode, na verdade, apontar para qualquer classe derivada da hierarquia, não necessariamente a desejada. `dynamic_cast` verifica esse ponto **em tempo de execução**, graças ao [RTTI](https://en.cppreference.com/w/cpp/language/rtti) (*Run-Time Type Information*, as informações de tipo mantidas pelas classes polimórficas):

```cpp
Base *base = obterUmObjeto(); // retorna um ponteiro para um tipo derivado desconhecido em tempo de compilacao

Derivada *derivada = dynamic_cast<Derivada *>(base);
if (derivada != nullptr) {
    // o cast funcionou: "base" realmente apontava para uma "Derivada"
} else {
    // o cast falhou: "base" apontava para outro tipo derivado
}
```

> **Nota:** `dynamic_cast` exige que a classe base contenha ao menos uma função `virtual` (veja [Herança e polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)): sem ela, nenhuma informação de tipo fica disponível em tempo de execução, e o compilador recusa a compilação.

| Alvo do `dynamic_cast` | Em caso de falha |
|---|---|
| Um ponteiro (`Derivada *`) | Retorna `nullptr` |
| Uma referência (`Derivada &`) | Lança uma [exceção](/?c=langages-de-programmation&s=cpp&p=exceptions) `std::bad_cast` |

## `const_cast`: adicionar ou remover um `const`

`const_cast` é o único dos quatro que **nunca** muda o tipo subjacente nem a representação binária do valor: ele apenas adiciona ou remove a qualificação `const`.

```cpp
void apiAntiga(char *string); // funcao externa que nunca modifica "string", mas nao declara isso

void chamar(const char *texto)
{
    apiAntiga(const_cast<char *>(texto)); // remove o "const" para satisfazer a assinatura
}
```

> **Armadilha:** usar `const_cast` para modificar um dado que foi **realmente** declarado `const` desde a origem (e não apenas passado por uma assinatura de função mal declarada): o comportamento é então indefinido. `const_cast` só se justifica para contornar uma API externa imprecisa, nunca para modificar uma constante de verdade.

## `reinterpret_cast`: reinterpretar os bytes brutos

`reinterpret_cast` é o mais perigoso dos quatro: ele reinterpreta a representação binária de um valor como se fosse de outro tipo, sem nenhuma verificação nem conversão real dos dados (ao contrário de `static_cast`, que converte um valor numérico de verdade).

```cpp
int valor = 42;
int *ponteiroInt = &valor;

uintptr_t enderecoBruto = reinterpret_cast<uintptr_t>(ponteiroInt); // o ponteiro, visto como um simples inteiro
```

Reservado para casos de baixo nível (manipulação de ponteiros brutos, interface com hardware, serialização binária): um uso fora desse contexto é quase sempre sinal de um problema de design em outro lugar.

## Visão geral

| Cast | Verificado em | Uso típico |
|---|---|---|
| `static_cast` | Tempo de compilação | Conversões numéricas, upcast em uma hierarquia |
| `dynamic_cast` | Tempo de execução | Downcast seguro em uma hierarquia polimórfica |
| `const_cast` | Nem um nem outro (sem verificação) | Adicionar/remover `const` para uma API externa |
| `reinterpret_cast` | Nem um nem outro (sem verificação) | Reinterpretação de baixo nível da representação binária |

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O C++ substitui o cast único do C por 4 casts distintos, cada um reservado a uma intenção precisa e pesquisável no código. |
| **Ferramentas utilizáveis** | `static_cast` (conversões seguras), `dynamic_cast` (downcast verificado), `const_cast` (const), `reinterpret_cast` (baixo nível). |
| **Armadilhas a evitar** | Usar `const_cast` para modificar um valor realmente `const` (comportamento indefinido); usar `reinterpret_cast` fora de um contexto de baixo nível justificado. |
| **Boas práticas** | Sempre verificar o resultado de um `dynamic_cast` em um ponteiro (`nullptr` possível); preferir o cast mais restritivo possível em vez de `reinterpret_cast` por facilidade. |
