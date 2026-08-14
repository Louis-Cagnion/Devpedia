---
order: 9
---

# As bibliotecas

Uma **biblioteca** (*library*) reúne funções já compiladas, reutilizáveis por qualquer programa sem necessidade de recompilar o código-fonte: é assim que funciona, por exemplo, a biblioteca padrão C (`printf`, `malloc`...). Existem duas formas de ligar uma biblioteca a um programa: estaticamente ou dinamicamente.

## 

O código da biblioteca é **copiado diretamente** para o executável final, durante a ligação (ver capítulo sobre a compilação).

```bash
// 1. compiler chaque fichier source en .o
gcc -c calculs.c -o calculs.o

// 2. regrouper le(s) .o dans une archive statique
ar rcs libcalculs.a calculs.o

// 3. lier le programme à cette bibliothèque
gcc main.c -L. -lcalculs -o programa
```

- `ar` (*archiver*) agrupa um ou mais arquivos `.o` num único arquivo `.a`.
- `-L.` indica ao `gcc` que procure também as bibliotecas no diretório atual.
- `-lcalculs` pedido para criar um link para `libcalculs.a` (o prefixo `lib` e o sufixo `.a` estão implícitos).

| Vantagem | Desvantagem |
|---|---|
| Executável autónomo, sem necessidade de instalar dependências externas | Tamanho do executável maior |
| Não há risco de uma versão diferente da biblioteca causar falhas no programa mais tarde | Uma atualização da biblioteca obriga a recompilar o programa |

## Biblioteca dinâmica (`.so` no Linux, `.dll` no Windows)

O código da biblioteca permanece num arquivo **separado**, carregado na memória no arranque do programa (ou mesmo durante a sua execução). Assim, vários programas podem partilhar uma única cópia da biblioteca na memória.

```bash
gcc -shared -fPIC calculs.c -o libcalculs.so
gcc main.c -L. -lcalculs -o programa

// au lancement, le système doit savoir où trouver libcalculs.so :
LD_LIBRARY_PATH=. ./programa
```

- `-fPIC` (*Position Independent Code*) gera código capaz de funcionar independentemente do endereço de memória em que é carregado, necessário para uma biblioteca partilhada, carregada num local diferente consoante o programa.
- Sem o arquivo «`LD_LIBRARY_PATH`» (ou uma instalação num diretório padrão do sistema, como «`/usr/lib`»), o sistema não sabe onde procurar «`libcalculs.so`» no momento do arranque, e o programa recusa-se a iniciar.

| Vantagem | Desvantagem |
|---|---|
| Executável mais leve | Dependência externa: a biblioteca deve estar presente no computador que executa o programa |
| Uma biblioteca partilhada por vários programas poupa memória | Uma atualização incompatível da biblioteca pode danificar um programa sem que seja necessária uma recompilação |

## Resumo

| | Estática (`.a`) | Dinâmica (`.so`) |
|---|---|---|
| Copiada para o executável? | Sim | Não: carregada separadamente |
| Quando é ligada? | Na compilação | No arranque do programa (ou durante a sua execução) |
| Atualização da biblioteca | Requer a recompilação do programa | O programa beneficia da atualização sem necessidade de recompilação |
