---
order: 4
---

# A organização dos dados em memória

A memória é um imenso array de bytes numerados. Entender como os valores são dispostos nela explica vários comportamentos confusos: por que uma struct ocupa mais espaço que a soma de seus campos, ou por que um arquivo binário escrito em uma máquina pode ser ilegível em outra.

> Este capítulo trata da **disposição** dos dados. Para a alocação (pilha, heap, `malloc`/`free`) e os bugs associados, veja o capítulo [A gestão de memória](/?c=langages-de-programmation&s=c&p=memoire) de C.

## A unidade de endereçamento é o byte

Cada **byte** (8 bits) tem seu próprio endereço. Não é possível endereçar um único bit: para ler um bit específico, é preciso carregar o byte que o contém e então aplicar uma máscara (veja [Os operadores binários](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

O processador, por sua vez, trabalha por **palavra** (*word*): 8 bytes em uma máquina de 64 bits. É essa diferença de escala entre a unidade de endereçamento e a unidade de processamento que explica tudo o que vem a seguir.

## O alinhamento

Um processador lê a memória em blocos alinhados em múltiplos do tamanho da palavra. Um valor de 4 bytes colocado em um endereço múltiplo de 4 é lido em um único acesso; se estiver dividido entre dois blocos, são necessários dois acessos, mais uma remontagem.

A regra aplicada pelos compiladores: **um valor de tamanho *n* é colocado em um endereço múltiplo de *n***.

Em algumas arquiteturas, um acesso não alinhado é simplesmente **proibido** e provoca um erro de hardware. No x86 ele funciona, mas custa mais caro. Nos dois casos, o compilador prefere alinhar.

## O preenchimento (*padding*) nas structs

Essa é a consequência mais visível do alinhamento: uma struct costuma ocupar **mais** que a soma de seus campos.

```c
struct Exemplo {
    char  a;  // 1 byte
    int   b;  // 4 bytes
    char  c;  // 1 byte
};

sizeof(struct Exemplo)   // 12, e nao 6 !
```

O que o compilador realmente faz:

```text
byte 0     : a
bytes 1-3  : PREENCHIMENTO (para alinhar b em um multiplo de 4)
bytes 4-7  : b
byte 8     : c
bytes 9-11 : PREENCHIMENTO (para que o tamanho total seja multiplo de 4)
```

O preenchimento final existe para que, em um **array** de structs, cada elemento continue alinhado.

**Consequência prática: a ordem de declaração muda o tamanho.** Agrupando os campos do maior para o menor, reduz-se o desperdício:

```c
struct Compacta {
    int   b;  // bytes 0-3
    char  a;  // byte 4
    char  c;  // byte 5
                // bytes 6-7 : preenchimento final
};              // sizeof = 8 em vez de 12
```

Em uma struct usada em milhões de exemplares, esse detalhe muda o consumo de memória em um terço, e principalmente a eficiência do cache do processador, muitas vezes mais determinante que o cálculo em si.

> Portanto, **nunca** calcule o tamanho de uma struct manualmente: use `sizeof`. E não escreva uma struct bruta em um arquivo ou na rede supondo sua disposição: o preenchimento varia de acordo com o compilador e a arquitetura. É papel da **serialização** ([JSON](/?c=infrastructure&p=json), [Protobuf](https://protobuf.dev)...) produzir um formato definido independentemente da máquina.

## A ordem dos bytes (*endianness*)

Para um valor de vários bytes, em que ordem organizá-los na memória? Duas convenções coexistem. Vamos pegar o inteiro de 32 bits `0x12345678`:

| Convenção | Bytes na memória | Usada por |
|---|---|---|
| **Little-endian** | `78 56 34 12` | x86, x86-64, ARM (por padrão) |
| **Big-endian** | `12 34 56 78` | Rede, alguns processadores (SPARC, PowerPC) |

O *little-endian* coloca o byte de **menor peso** primeiro. Isso não é nem melhor nem pior, é uma escolha histórica, mas não é universal, daí duas implicações:

- Um arquivo binário escrito em uma máquina little-endian e lido por uma big-endian dará valores errados, sem erro sinalizado: a leitura funciona, os números é que estão errados.
- Os protocolos de rede impõem o big-endian, por isso chamado de **ordem de rede**. As funções `htons()`/`ntohl()` em C servem exatamente para essa conversão.

É mais uma razão para preferir um formato serializado explícito (texto ou binário especificado) a uma cópia bruta da memória.

## O que "o endereço" realmente significa

Um ponteiro contém o endereço do **primeiro** byte de um valor. É o seu **tipo** que indica quantos bytes ler a partir daí, e como interpretá-los.

```c
int    x = 65;
int   *pi = &x;
char  *pc = (char *)&x;

*pi  // 65      -> le 4 bytes, interpreta-os como um inteiro
*pc  // 'A'     -> le 1 byte no MESMO endereco, interpreta-o como um caractere
```

É também por isso que `ponteiro + 1` avança `sizeof(tipo)` bytes e não 1: a aritmética de ponteiros conta em elementos, não em bytes. Veja o capítulo [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs).

## E nas linguagens de mais alto nível?

[Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) ou [PHP](/?c=langages-de-programmation&s=php&p=php) escondem tudo isso: você não escolhe a disposição na memória. Mas ela não desaparece, e se manifesta de outra forma:

- uma lista Python de 1.000 inteiros ocupa muito mais que 4.000 bytes, porque cada inteiro é um **objeto** com seu próprio cabeçalho;
- é exatamente por essa razão que o NumPy existe: um array NumPy armazena valores brutos contíguos, alinhados, sem cabeçalho por elemento: daí ganhos de velocidade de uma ordem de grandeza em cálculo numérico (veja [NumPy](/?c=data-science&p=numpy)).

## Resumo

| Noção | A reter |
|---|---|
| Unidade de endereçamento | O byte; um único bit não é endereçável |
| Alinhamento | Um valor de *n* bytes se coloca em um endereço múltiplo de *n* |
| Padding | Uma struct ≥ soma de seus campos; a ordem de declaração conta |
| `sizeof` | Sempre medir, nunca calcular manualmente |
| Endianness | Ordem dos bytes; a rede impõe o big-endian |
| Escrever memória bruta | Evitar: serializar em um formato definido |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | A memória se endereça por byte, mas o processador prefere ler valores alinhados em múltiplos de seu tamanho: daí o *padding* que aumenta uma struct além da soma de seus campos. A ordem dos bytes (*endianness*) varia de acordo com a arquitetura. |
| **Ferramentas úteis** | `sizeof` para medir um tamanho real, reordenar os campos de uma struct (maior para menor) para reduzir o padding. |
| **Armadilhas a evitar** | Calcular o tamanho de uma struct manualmente em vez de usar `sizeof`; escrever a memória bruta de uma struct em um arquivo/rede, sem considerar o padding nem a endianness. |
| **Boas práticas** | Serializar em um formato definido (JSON, Protobuf...) em vez de copiar a memória bruta de uma struct entre máquinas. |
