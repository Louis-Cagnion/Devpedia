---
order: 2
---

# O formato Wavefront .obj e o modelo de Phong

O [capítulo anterior](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) simula a 3D a partir de um mapa 2D, sem nunca carregar uma malha real. Uma engine de renderização 3D moderna (OpenGL, Vulkan, Metal) parte, ao contrário, de um objeto modelado em uma ferramenta como o Blender, exportado em um arquivo de texto que precisa ser lido e transformado em dados utilizáveis pela placa de vídeo.

## O formato .obj: uma instrução por linha

Um arquivo **.obj** (formato Wavefront) lista, uma linha de cada vez, os dados geométricos de um objeto. Cada linha começa com uma palavra-chave que indica o tipo de instrução:

| Prefixo | Conteúdo | Exemplo |
|---|---|---|
| `v` | Um vértice, em coordenadas x y z | `v 0.232406 -1.216630 1.133818` |
| `vt` | Uma coordenada de textura (para projetar uma imagem sobre a superfície) | `vt 0.5 0.8` |
| `vn` | Um vetor normal (orientação de uma superfície, útil para a iluminação) | `vn 0.0 1.0 0.0` |
| `o` | O nome do objeto que começa nesta linha | `o Cube` |
| `f` | Uma face, que liga vários vértices já declarados | `f 16 2 3 17` |
| `mtllib` / `usemtl` | Referência a um arquivo de materiais e o material a aplicar | `mtllib 42.mtl` |
| `s` | Ativa/desativa a suavização das normais para as faces seguintes (grupo de suavização) | `s off` ou `s 1` |

> **Cilada:** os índices usados em uma linha `f` começam em **1**, não em 0. `f 16 2 3 17` designa o 16º vértice declarado por uma linha `v`, não o 17º. É uma fonte clássica de erro de desvio de um (*off-by-one*) para quem escreve seu primeiro analisador desse formato, já que a indexação usual de arrays começa em 0 na maioria das linguagens.

## Faces com número variável de vértices

Uma linha `f` não liga necessariamente três vértices: um modelador 3D costuma exportar faces com 4 vértices (quadriláteros, ou *quads*), ou até mais. Só que a placa de vídeo só sabe desenhar nativamente triângulos (uma superfície com mais de 3 vértices não tem garantia de ser plana). É preciso então **triangular**: dividir cada face de 4+ vértices em vários triângulos, uma etapa por si só do processamento do arquivo, distinta da sua simples leitura.

```text
Face lida do arquivo:                Uma vez triangulada:
f 1 2 3 4                            triângulo 1 2 3
(um quad, 4 vértices)                triângulo 1 3 4
```

Esse método (ligar sistematicamente o primeiro vértice a cada par de vértices seguintes) chama-se **triangulação em leque** (*fan triangulation*). É simples e rápido, mas pressupõe que a face seja **convexa**: em uma face côncava, um dos triângulos produzidos pode cobrir uma área que não faz parte da forma real (o triângulo "atravessa" o entalhe côncavo em vez de contorná-lo).

Para uma face potencialmente côncava, o algoritmo de referência é o **ear clipping** (*recorte de orelhas*): em vez de fixar um vértice de referência, ele remove um vértice de cada vez, só o aceitando se o triângulo que ele forma com seus dois vizinhos permanecer bem orientado (produto vetorial local comparado à normal da face, veja [Vetores e produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) E não contiver nenhum outro vértice da face. Como o polígono encolhe a cada remoção, uma [lista duplamente encadeada circular](/?c=langages-de-programmation&s=c&p=listes-chainees) é uma estrutura bem adequada para implementá-lo: cada remoção exige apenas reconectar os dois vizinhos do vértice removido, sem deslocar nenhum array.

> **Boa prática:** manter a leitura do arquivo (preencher uma estrutura com os dados brutos) e a triangulação em duas funções separadas em vez de fundidas. Cada uma passa a ter apenas um motivo para mudar (veja [responsabilidade única e acoplamento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)), e a triangulação pode ser testada independentemente do parser.

### Verificar que nenhum vértice fica preso na orelha

Apenas o teste de orientação não basta: um triângulo corretamente orientado ainda pode "engolir" outro vértice do polígono, que deveria ficar do lado de fora. É preciso então um segundo teste, aplicado a cada vértice restante do polígono (fora os 3 vértices do triângulo candidato): o **teste do mesmo lado** (*same-side test*), que verifica se um determinado ponto está dentro de um triângulo.

Princípio: um ponto `P` está dentro do triângulo `(A, B, C)` se, e somente se, estiver do mesmo lado de cada uma das 3 arestas. Esse teste reutiliza exatamente a mesma primitiva geométrica do teste de orientação (produto vetorial de dois vetores, produto escalar com a normal de referência): apenas os pontos comparados mudam de uma chamada para outra.

```text
lado 1 = (B-A) × (P-A) . normal
lado 2 = (C-B) × (P-B) . normal
lado 3 = (A-C) × (P-C) . normal

P está dentro se os 3 resultados tiverem o mesmo sinal (todos positivos, ou todos negativos)
```

> **Boa prática:** uma única função utilitária (produto vetorial de 2 vetores + produto escalar com a normal) basta para implementar tanto o teste de orientação QUANTO os 3 testes de lado: apenas os pontos passados como parâmetro mudam. Evite duplicar esse cálculo em várias funções.

### Verificar uma triangulação: a fórmula `n - 2`

Não importa o algoritmo (leque ou ear clipping) nem a forma do polígono (convexo ou côncavo): triangular um polígono simples com `n` vértices sempre produz exatamente `n - 2` triângulos (consequência direta do [teorema das duas orelhas](https://en.wikipedia.org/wiki/Two_ears_theorem) de Meisters (1975), que garante que todo polígono simples que não seja um triângulo possui pelo menos duas "orelhas" recortáveis). Uma contagem diferente de `n - 2` na saída é prova certa de um bug; uma contagem correta não prova, por si só, que a divisão é geometricamente correta (isso deve ser verificado à parte, por exemplo traçando o polígono e suas diagonais).

## O arquivo .mtl e o modelo de Phong

Um `.obj` geralmente referencia um arquivo **.mtl** que descreve a aparência das superfícies:

```text
newmtl Material
Ns 96.078431
Ka 0.000000 0.000000 0.000000
Kd 0.640000 0.640000 0.640000
Ks 0.500000 0.500000 0.500000
illum 2
```

| Campo | Significado |
|---|---|
| `Ka` | Cor ambiente: a cor percebida mesmo sem luz direta |
| `Kd` | Cor difusa: a cor de base da superfície sob luz direta |
| `Ks` | Cor especular: a cor do reflexo brilhante |
| `Ns` | Expoente especular (*shininess*): quanto mais alto, menor e mais nítido o reflexo |

Esses quatro valores correspondem exatamente aos termos do **modelo de Phong** (*Phong reflection model*), um algoritmo clássico de iluminação em síntese de imagem que decompõe a luz recebida por uma superfície em três componentes combinados: ambiente, difuso e especular.

> **Cilada:** um arquivo `.mtl` geralmente define apenas um único material (portanto uma única cor) para todo o objeto. Se a necessidade é distinguir visualmente subpartes diferentes (por exemplo, uma cor por face), essa informação precisa vir de outro lugar: o `.mtl` não a fornece.

## A indexação combinada `v/vt/vn` e a costura UV

Os exemplos anteriores (`f 16 2 3 17`) mostram apenas um índice por vértice, o da posição (`v`). Uma linha `f` real geralmente referencia várias listas ao mesmo tempo, um índice por canto de face e por lista, separados por `/`:

| Sintaxe | Referência |
|---|---|
| `f 1 2 3` | Apenas posição (usado até aqui para simplificar) |
| `f 1/1 2/2 3/3` | Posição **e** coordenada de textura |
| `f 1/1/1 2/2/2 3/3/3` | Posição, textura **e** normal |
| `f 1//1 2//2 3//3` | Posição e normal, sem textura (o `//` deixa o índice de textura vazio) |

Por que um índice por lista em vez de um único índice compartilhado: `v` (posições) e `vt` (coordenadas de textura) são duas listas independentes, preenchidas separadamente pela ferramenta de exportação, e não têm motivo algum para ter o mesmo tamanho nem a mesma ordem. Um índice único não poderia designar ao mesmo tempo "o 5º vértice" e "a 5ª coordenada de textura" se essas duas listas não estiverem alinhadas termo a termo.

> **Costura UV (*UV seam*):** um mesmo vértice 3D (um único índice `v`) pode precisar de uma coordenada de textura diferente dependendo da face que o referencia. Exemplo concreto: as 3 faces de um cubo que se encontram em um canto compartilham esse vértice, mas cada face é desdobrada em um local diferente da imagem 2D usada como textura -- portanto com um `vt` diferente. Um índice `v` único combinado a um índice `vt` por canto de face permite representar esse caso; um índice único compartilhado entre posição e textura não permitiria.

> **Cilada:** armazenar as coordenadas de textura indexadas apenas por vértice (um array `vt_do_vertice[indice_v]`) quebra silenciosamente em uma costura UV: cada face que referencia esse vértice com um `vt` diferente sobrescreve o valor anterior, só a última escrita sobrevive. O dado precisa ser indexado por **par** (`v`, `vt`), não por `v` sozinho -- por isso uma engine de renderização geralmente duplica os vértices em cada costura UV encontrada (um vértice único enviado à placa de vídeo por par `(v, vt[, vn])` distinto, em vez de um vértice por posição).

## O arquivo de imagem referenciado pelo `.mtl`

O `.mtl` não descreve apenas cores sólidas: a linha `map_Kd` referencia nele um arquivo de imagem (PNG, JPEG...) usado como textura difusa:

```text
newmtl Material
map_Kd caisse.png
Kd 0.640000 0.640000 0.640000
```

No momento de desenhar um triângulo, cada coordenada `vt` (um par `(u, v)` com `u` e `v` entre 0 e 1) designa um ponto dessa imagem, qualquer que seja sua resolução real em pixels: `(0, 0)` um canto da imagem, `(1, 1)` o canto oposto. A placa de vídeo interpola essas coordenadas entre os 3 vértices de um triângulo para saber, pixel a pixel, qual ponto da imagem exibir. Se `map_Kd` estiver ausente, `Kd` continua sendo a única cor usada, e os `vt` do arquivo não têm então nenhum efeito visual.

## Os grupos de suavização (`s`)

`s` não afeta a geometria: ele controla apenas o cálculo das **normais** usadas para a iluminação.

- `s off` (equivalente a `s 0`): cada face mantém sua própria normal plana -> renderização com facetas visíveis (*flat shading*).
- `s 1`, `s 2`... : as faces que compartilham o mesmo número de grupo têm suas normais promediadas nos vértices que têm em comum -> renderização suavizada (*smooth shading*, também chamada de *Gouraud shading*).

```text
s 1
f 1 2 5
f 2 3 5
f 3 4 5
f 4 1 5
```

As 4 faces acima compartilham todas o vértice `5` e o mesmo grupo de suavização: sua normal será a média das 4 normais de face, dando um aspecto arredondado a essa ponta em vez de uma aresta bem definida.

> **Cilada:** `s`, assim como `usemtl`, é uma **diretiva de estado**: aplica-se a todas as linhas `f` seguintes, até a próxima `s`/`usemtl` encontrada no arquivo. Um parser precisa então manter em memória "qual grupo de suavização e qual material estão ativos neste momento" ao longo da leitura, e associá-los a cada face no momento em que ela é lida: essa informação nunca aparece na própria linha `f`.

## `o` não é uma diretiva de estado como `s`/`usemtl`

`o` (e seu primo `g`, para subgrupos) apenas rotula um conjunto de geometria sob um nome de objeto, para fins de organização. Ao contrário de `s`/`usemtl`, ele não muda **nada** na interpretação das linhas seguintes.

> **Cilada:** a numeração dos vértices (`v`) permanece **global a todo o arquivo**: ela nunca reinicia em 1 a cada novo `o`. Em um arquivo com vários objetos, as faces do segundo objeto continuam então a numeração do primeiro:
> ```text
> o Cube1
> v 0 0 0
> v 1 0 0
> v 0 1 0
>
> o Cube2
> v 5 5 5   <- 4º vértice do ARQUIVO, não o 1º do Cube2
> v 6 5 5
> v 5 6 5
>
> f 4 5 6   <- faz referência aos vértices do Cube2
> ```
> Reiniciar um contador de vértices a cada `o` quebra silenciosamente a indexação de todas as faces assim que um arquivo contém mais de um objeto.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um `.obj` lista instruções linha por linha (`v`, `vt`, `vn`, `f`, `s`...), com índices de vértices que começam em 1. As faces podem ter mais de 3 vértices e precisam ser trianguladas para serem desenhadas pela placa de vídeo; o ear clipping também trata faces côncavas graças a um teste de orientação E a um teste "mesmo lado" por vértice restante. Uma face geralmente combina um índice por lista e por canto (`v/vt/vn`), pois `v` e `vt` são duas listas independentes não alinhadas -- necessário para representar uma costura UV. O `.mtl` associado descreve a aparência por meio dos 4 parâmetros do modelo de Phong (ambiente, difuso, especular, brilho) e pode referenciar um arquivo de imagem (`map_Kd`) como textura. `s` controla a suavização das normais, independentemente da geometria. |
| **Ferramentas utilizáveis** | O modelo de Phong (`Ka`/`Kd`/`Ks`/`Ns`) para interpretar um `.mtl`. `map_Kd` para ligar um `.mtl` a um arquivo de imagem de textura. Os grupos de suavização (`s`) para escolher entre renderização plana e suavizada. A fórmula `n - 2` para verificar o número de triângulos produzido por qualquer triangulação. |
| **Ciladas a evitar** | Índices de vértices 1-based em vez de 0-based. Faces com número variável de vértices não trianguladas. A triangulação em leque produz um resultado errado em uma face côncava, e um teste de orientação sozinho (sem o teste "mesmo lado") pode validar erroneamente uma orelha que prende outro vértice. Indexar uma coordenada de textura apenas por vértice (em vez de por par vértice/textura) quebra silenciosamente em uma costura UV. Um `.mtl` com material único não fornece uma cor por subparte. `s`/`usemtl` são diretivas de estado a acompanhar durante todo o parsing, não atributos presentes em cada linha `f`. `o` nunca afeta a numeração dos vértices, que permanece global ao arquivo mesmo com vários objetos. |
| **Boas práticas** | Separar a leitura bruta do arquivo e a triangulação em duas funções distintas, cada uma com responsabilidade única. Reutilizar a mesma primitiva geométrica (produto vetorial + produto escalar com a normal) para o teste de orientação e o teste "mesmo lado", em vez de duplicá-la. Verificar uma triangulação com a fórmula `n - 2` antes de considerar a divisão correta. Duplicar um vértice por par único `(v, vt[, vn])` em vez de apenas por posição, para lidar com costuras UV. Manter o estado atual (material, grupo de suavização) em variáveis atualizadas ao longo do parsing, e associá-lo a cada face lida. |
