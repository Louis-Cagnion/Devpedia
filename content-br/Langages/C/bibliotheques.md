---
order: 10
---

# As bibliotecas

Uma **biblioteca** (*library*) reúne funções já compiladas, reutilizáveis por qualquer programa sem recompilar seu código-fonte: é assim que funciona, por exemplo, a biblioteca padrão C (`printf`, `malloc`...). Existem duas formas de ligar uma biblioteca a um programa: estaticamente, ou dinamicamente.

## Biblioteca estática (`.a`)

O código da biblioteca é **copiado diretamente** no executável final, no momento da [ligação](/?c=langages-de-programmation&s=c&p=compilation).

```text
// 1. compilar cada arquivo fonte em .o
gcc -c calculos.c -o calculos.o

// 2. reunir o(s) .o em um arquivo estatico
ar rcs libcalculos.a calculos.o

// 3. ligar o programa a essa biblioteca
gcc main.c -L. -lcalculos -o programa
```

- `ar` (*archiver*) monta um ou vários arquivos `.o` em um único arquivo `.a`.
- `-L.` indica ao [`gcc`](https://gcc.gnu.org) para buscar também as bibliotecas no diretório atual.
- `-lcalculos` pede para ligar `libcalculos.a` (o prefixo `lib` e o sufixo `.a` são subentendidos).

| Vantagem | Desvantagem |
|---|---|
| Executável autônomo, nenhuma dependência externa a instalar | Tamanho do executável maior |
| Nenhum risco de uma versão diferente da biblioteca quebrar o programa depois | Uma atualização da biblioteca exige recompilar o programa |

## Biblioteca dinâmica (`.so` no Linux, `.dll` no Windows)

O código da biblioteca permanece em um arquivo **separado**, carregado em memória ao iniciar o programa (ou mesmo durante sua execução). Vários programas podem então compartilhar uma única cópia da biblioteca em memória.

```text
gcc -shared -fPIC calculos.c -o libcalculos.so
gcc main.c -L. -lcalculos -o programa

// ao iniciar, o sistema precisa saber onde encontrar libcalculos.so:
LD_LIBRARY_PATH=. ./programa
```

- `-fPIC` (*Position Independent Code*) gera código capaz de funcionar seja qual for o endereço de memória onde é carregado: necessário para uma biblioteca compartilhada, carregada em um lugar diferente conforme o programa.
- Sem `LD_LIBRARY_PATH` (ou uma instalação em um diretório do sistema padrão como `/usr/lib`), o sistema não sabe onde buscar `libcalculos.so` ao iniciar, e o programa recusa iniciar.

| Vantagem | Desvantagem |
|---|---|
| Executável mais leve | Dependência externa: a biblioteca precisa estar presente na máquina que executa o programa |
| Uma biblioteca compartilhada por vários programas economiza memória | Uma atualização incompatível da biblioteca pode quebrar um programa sem recompilação |

## Resumo

| | Estática (`.a`) | Dinâmica (`.so`) |
|---|---|---|
| Copiada no executável? | Sim | Não (carregada separadamente) |
| Quando é ligada? | Na compilação | Ao iniciar o programa (ou durante sua execução) |
| Atualização da biblioteca | Exige recompilar o programa | O programa se beneficia da atualização sem recompilação |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma biblioteca estática (`.a`) é copiada no executável na compilação; uma biblioteca dinâmica (`.so`/`.dll`) permanece separada, carregada ao iniciar, e pode ser compartilhada entre programas. |
| **Ferramentas utilizáveis** | `ar` (arquivo estático), `gcc -shared -fPIC` (biblioteca dinâmica), `-L`/`-l` para ligar. |
| **Armadilhas a evitar** | Esquecer `LD_LIBRARY_PATH` (ou uma instalação no sistema): o programa recusa iniciar, não encontrando a biblioteca dinâmica. |
| **Boas práticas** | Escolher estática para um executável autônomo sem dependência a gerenciar, dinâmica para economizar memória/tamanho quando vários programas compartilham a mesma biblioteca. |
