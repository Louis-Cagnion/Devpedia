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

## Ler um `.obj` com tolerância

Os arquivos `.obj` vêm de programas diferentes, que nem todos seguem a mesma variante do formato. Um analisador (*parser*) robusto **aceita com amplitude** (toda variante que faça sentido) e **recusa com uma mensagem precisa** (arquivo, linha, valor errado) todo o resto, em vez de travar ou de seguir em silêncio com dados falsos.

| Variante encontrada | O que fazer |
|---|---|
| `v x y z w` (4 valores, `w` é um peso, 1.0 se ausente) | Ler `w` e depois ignorá-lo |
| `v x y z r g b` (6 valores, cor por vértice, extensão de alguns exportadores) | Guardar os 3 primeiros, ignorar ou armazenar a cor |
| `vt u`, `vt u v`, `vt u v w` (1 a 3 valores) | `v` vale 0 se faltar, `w` não serve para uma imagem 2D |
| Diretiva desconhecida (`l`, `p`, `cstype`...), linha vazia, comentário `#` | Ignorar a linha, sem erro |
| Menos valores que o previsto, texto no lugar de um número, `1e999` | Recusar, nomeando o arquivo, a linha e o valor recebido |

```c
/* Lê 3, 4 ou 6 números de uma linha "v"; devolve quantos leu, -1 se inválida. */
static int parse_vertex(const char *s, double out[6])
{
	int n = 0;
	char *end;

	while (n < 6)
	{
		errno = 0;
		out[n] = strtod(s, &end);        /* lê um número e avança até o fim dele */
		if (end == s)                    /* nada legível: fim dos números */
			break;
		if (errno || !isfinite(out[n]))  /* 1e999, inf ou nan: recusado */
			return -1;
		s = end;
		n++;
	}
	while (*s == ' ' || *s == '\t' || *s == '\r')  /* brancos do fim da linha */
		s++;
	return (*s == '\0' && (n == 3 || n == 4 || n == 6)) ? n : -1;
}
```

Testada com `"1 2 3"` (3), `"1 2 3 1.0"` (4) e `"1 2 3 0.5 0.5 0.5"` (6): válidas. `"1 2"`, `"1 2 x"`, `"1e999 0 0"` e `"1 2 3 4 5"` devolvem -1. Prefere-se `strtod` a `atof`, que devolve 0 para qualquer texto sem avisar de nada (veja [converter um texto em número](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)).

### Fins de linha e BOM

| Caso | O que contém | Consequência se não for tratado |
|---|---|---|
| LF (`\n`) | Fim de linha Unix | Nenhuma |
| CRLF (`\r\n`) | Fim de linha Windows | Um `\r` fica colado no fim da linha, ou seja, dentro do último valor lido |
| CR (`\r`) sozinho | Fim de linha dos Macs muito antigos | `fgets` só corta em `\n`: o arquivo inteiro vira uma única linha |
| BOM UTF-8 (bytes `EF BB BF` no início do arquivo) | Marca de codificação, veja [codificação de textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) | Cola-se na primeira diretiva: `\xEF\xBB\xBFv` não é `v`, a linha é tomada por uma diretiva desconhecida, **o primeiro vértice desaparece sem erro** e todos os índices das faces se deslocam uma unidade |

> **Boa prática:** ler o arquivo inteiro na memória, pular um eventual BOM e cortar nos três fins de linha (`\r\n`, `\r` e `\n`) em vez de chamar `fgets`: o mesmo código trata então arquivos de qualquer sistema.

## O formato PPM P6: uma textura sem biblioteca

O [`map_Kd` do `.mtl`](#o-arquivo-de-imagem-referenciado-pelo-mtl) designa uma imagem. O **PPM** (*Portable PixMap*, [especificação](https://netpbm.sourceforge.net/doc/ppm.html)) é o formato de imagem mais simples de ler à mão: um pequeno cabeçalho de texto, seguido dos pixels em **binário** (bytes brutos, que um editor de texto não exibe de forma legível). Sua variante **P6** guarda três canais (vermelho, verde, azul) por pixel.

```text
P6                  <- número mágico: identifica o formato
# um comentário     <- opcional: # até o fim da linha, a ser ignorado
640 480             <- largura e altura, em pixels
255                 <- maxval: valor máximo de um canal
<bytes binários>    <- largura x altura x 3 canais, linha a linha, de cima para baixo
```

| `maxval` | Bytes por canal | Para voltar a 0 a 255 |
|---|---|---|
| 1 a 255 | 1 | `valor x 255 / maxval` |
| 256 a 65535 | 2, byte mais significativo primeiro | `valor x 255 / maxval` (mesma fórmula, valor de 16 bits) |

```c
/* Lê um inteiro do cabeçalho PPM pulando brancos e comentários; -1 se ausente. */
static long read_header_int(FILE *f)
{
	int c;

	while ((c = fgetc(f)) != EOF)
	{
		if (c == '#')                    /* comentário: ignorado até o fim da linha */
			while ((c = fgetc(f)) != EOF && c != '\n' && c != '\r')
				;
		else if (!isspace(c))
			break;
	}
	if (!isdigit(c))
		return -1;
	long n = 0;
	for (; isdigit(c); c = fgetc(f))     /* o branco que termina o número é consumido */
	{
		n = n * 10 + (c - '0');
		if (n > 1000000)                 /* dimensão absurda: recusada */
			return -1;
	}
	return n;
}
```

A função principal chama `read_header_int` três vezes (largura, altura, `maxval`):

```c
/* Devolve largura x altura x 3 bytes (0 a 255), ou NULL com uma mensagem em stderr. */
unsigned char *read_ppm(const char *path, int *w, int *h)
{
	FILE *f = fopen(path, "rb");                 /* "b": modo binário, indispensável no Windows */
	if (!f)
		return fprintf(stderr, "%s: %s\n", path, strerror(errno)), NULL;
	if (fgetc(f) != 'P' || fgetc(f) != '6')
		return fprintf(stderr, "%s: não é um PPM P6\n", path), fclose(f), NULL;
	long width = read_header_int(f);             /* pula brancos e comentários, -1 se ausente */
	long height = read_header_int(f);
	long maxval = read_header_int(f);            /* consome o único branco que segue */
	if (width < 1 || height < 1 || maxval < 1 || maxval > 65535)
		return fprintf(stderr, "%s: cabeçalho inválido\n", path), fclose(f), NULL;
	size_t bytes = maxval < 256 ? 1 : 2;
	size_t count = (size_t)width * (size_t)height * 3;
	unsigned char *raw = malloc(count * bytes);
	unsigned char *out = malloc(count);
	if (!raw || !out || fread(raw, bytes, count, f) != count)
	{                                            /* truncado, ou memória insuficiente */
		fprintf(stderr, "%s: dados truncados ou memória insuficiente\n", path);
		return free(raw), free(out), fclose(f), NULL;
	}
	for (size_t i = 0; i < count; i++)
	{
		long v = bytes == 1 ? raw[i] : (raw[2 * i] << 8) | raw[2 * i + 1];
		out[i] = (unsigned char)((v * 255 + maxval / 2) / maxval);  /* arredondado ao mais próximo */
	}
	free(raw);
	fclose(f);
	*w = (int)width;
	*h = (int)height;
	return out;
}
```

Compilada com `-Wall -Wextra -pedantic` sem nenhum aviso e testada com quatro arquivos: um PPM de 8 bits com comentário e um PPM de 16 bits dão ambos o pixel vermelho `255 0 0`; um arquivo cujos dados acabam cedo demais, um arquivo `P5` (tons de cinza) e um arquivo ausente são recusados, cada um com a própria mensagem.

| Cilada | Por quê | Remédio |
|---|---|---|
| Pular todos os brancos depois de `maxval` | Um byte de pixel pode valer `0x20` ou `0x0A` (um branco): seria tomado por espaço | Consumir **um único** branco e ler os dados como estão |
| Arquivo convertido para CRLF | Cada `\n` binário vira `\r\n`: os dados crescem e se deslocam | Detectar o tamanho incoerente e recusar |
| Arquivo truncado | `fread` devolve menos que o previsto | Comparar a contagem lida com a esperada |
| `largura x altura x 3` enorme | O produto estoura ou pede gigabytes | Limitar cada dimensão, calcular em `size_t` |
| Linha de baixo primeiro | O PPM guarda a primeira linha **em cima**, o OpenGL espera a primeira linha **embaixo** | Inverter a imagem verticalmente ou inverter `v` |

## A normal de um polígono: o método de Newell

O teste de orientação do ear clipping precisa da normal da face. O cálculo ingênuo (produto vetorial das duas primeiras arestas) falha de duas maneiras: se os três primeiros vértices estão alinhados, o produto é o vetor nulo; se o primeiro canto é reentrante (ângulo interno acima de 180 graus), a normal obtida está invertida, e todo o resto do teste fica errado.

O **método de Newell** soma uma contribuição por aresta, sobre **todo** o contorno, de modo que nenhum vértice é privilegiado:

```text
para cada aresta (a -> b) do polígono:
    nx += (a.y - b.y) * (a.z + b.z)
    ny += (a.z - b.z) * (a.x + b.x)
    nz += (a.x - b.x) * (a.y + b.y)
normal = (nx, ny, nz) / comprimento      <- seu comprimento vale 2 vezes a área do polígono
```

```c
/* Normal unitária de um polígono (método de Newell); -1 se a superfície é nula. */
static int newell_normal(const double (*p)[3], int n, double out[3])
{
	double nx = 0, ny = 0, nz = 0;

	for (int i = 0; i < n; i++)
	{
		const double *a = p[i];
		const double *b = p[(i + 1) % n];      /* o último vértice liga-se ao primeiro */
		nx += (a[1] - b[1]) * (a[2] + b[2]);
		ny += (a[2] - b[2]) * (a[0] + b[0]);
		nz += (a[0] - b[0]) * (a[1] + b[1]);
	}
	double len = sqrt(nx * nx + ny * ny + nz * nz);
	if (len == 0)                              /* vértices alinhados ou coincidentes */
		return -1;
	out[0] = nx / len;
	out[1] = ny / len;
	out[2] = nz / len;
	return 0;
}
```

Testado com um polígono em L côncavo cujos três primeiros vértices estão alinhados (`(0,0) (1,0) (2,0) (2,1) (1,1) (1,2)`, no plano z = 0): o cálculo ingênuo dá o vetor nulo, Newell dá `0 0 1`. Com apenas três vértices alinhados, devolve -1: uma face de superfície nula é recusada com a própria mensagem, ela não tem normal. Para o produto vetorial, veja [Vetores e produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Tornar o ear clipping robusto

O algoritmo descrito acima é exato com números exatos; os números de ponto flutuante (veja [representação dos flutuantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)) obrigam a três precauções:

| Precaução | Por quê |
|---|---|
| Fazer os predicados (orientação, mesmo lado) em `double`, mesmo que os vértices sejam guardados em `float` | Perto de zero, um `float` inverte o sinal do produto vetorial: uma orelha válida é recusada, uma inválida é aceita |
| Comparar com uma tolerância **relativa** (`abs(produto) <= epsilon x comprimento1 x comprimento2`), nunca com uma constante absoluta | Uma constante absoluta depende da unidade do modelo (um objeto de 0,001 ou de 1000 unidades) |
| Tratar à parte o vértice **alinhado** com seus vizinhos ou situado **sobre uma aresta** do triângulo candidato | Nem dentro nem fora: o teste estrito o aceita ou recusa ao sabor do arredondamento |

O corte é feito então em **duas passagens**: uma passagem estrita (uma orelha deve ser estritamente convexa e não conter nenhum vértice interior nem vértice na sua borda); se não encontrar nenhuma orelha quando restam mais de 3 vértices, uma segunda passagem tolera os vértices situados exatamente na borda. Se ela também falhar, a face é recusada (degenerada ou que se cruza) com uma mensagem que nomeia o arquivo e a linha, em vez de entrar num laço sem fim.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um `.obj` lista instruções linha por linha (`v`, `vt`, `vn`, `f`, `s`...), com índices de vértices que começam em 1. As faces podem ter mais de 3 vértices e precisam ser trianguladas para serem desenhadas pela placa de vídeo; o ear clipping também trata faces côncavas graças a um teste de orientação E a um teste "mesmo lado" por vértice restante. Uma face geralmente combina um índice por lista e por canto (`v/vt/vn`), pois `v` e `vt` são duas listas independentes não alinhadas -- necessário para representar uma costura UV. O `.mtl` associado descreve a aparência por meio dos 4 parâmetros do modelo de Phong (ambiente, difuso, especular, brilho) e pode referenciar um arquivo de imagem (`map_Kd`) como textura. `s` controla a suavização das normais, independentemente da geometria. Um analisador aceita com amplitude (`v` com 3, 4 ou 6 valores, diretivas desconhecidas ignoradas, LF, CRLF ou CR, BOM) e recusa o resto com uma mensagem precisa. O PPM P6 é um cabeçalho de texto seguido de pixels binários (`maxval` em 1 ou 2 bytes). A normal de um polígono se calcula com o método de Newell, sobre todo o contorno. |
| **Ferramentas utilizáveis** | O modelo de Phong (`Ka`/`Kd`/`Ks`/`Ns`) para interpretar um `.mtl`. `map_Kd` para ligar um `.mtl` a um arquivo de imagem de textura. Os grupos de suavização (`s`) para escolher entre renderização plana e suavizada. A fórmula `n - 2` para verificar o número de triângulos produzido por qualquer triangulação. `strtod` para ler os números, o método de Newell para a normal, predicados em `double` para o ear clipping. |
| **Ciladas a evitar** | Índices de vértices 1-based em vez de 0-based. Faces com número variável de vértices não trianguladas. A triangulação em leque produz um resultado errado em uma face côncava, e um teste de orientação sozinho (sem o teste "mesmo lado") pode validar erroneamente uma orelha que prende outro vértice. Indexar uma coordenada de textura apenas por vértice (em vez de por par vértice/textura) quebra silenciosamente em uma costura UV. Um `.mtl` com material único não fornece uma cor por subparte. `s`/`usemtl` são diretivas de estado a acompanhar durante todo o parsing, não atributos presentes em cada linha `f`. `o` nunca afeta a numeração dos vértices, que permanece global ao arquivo mesmo com vários objetos. Um BOM colado na primeira diretiva (primeiro vértice perdido em silêncio), um `\r` residual de um arquivo CRLF, `fgets` diante de um CR sozinho. Pular todos os brancos depois do `maxval` de um PPM, não conferir o tamanho dos dados, esquecer que sua primeira linha está em cima enquanto o OpenGL espera a de baixo. Calcular a normal só com as duas primeiras arestas. Usar uma tolerância absoluta num teste geométrico. |
| **Boas práticas** | Separar a leitura bruta do arquivo e a triangulação em duas funções distintas, cada uma com responsabilidade única. Reutilizar a mesma primitiva geométrica (produto vetorial + produto escalar com a normal) para o teste de orientação e o teste "mesmo lado", em vez de duplicá-la. Verificar uma triangulação com a fórmula `n - 2` antes de considerar a divisão correta. Duplicar um vértice por par único `(v, vt[, vn])` em vez de apenas por posição, para lidar com costuras UV. Manter o estado atual (material, grupo de suavização) em variáveis atualizadas ao longo do parsing, e associá-lo a cada face lida. Ler o arquivo inteiro e cortá-lo nos três fins de linha depois de pular o BOM. Recusar uma entrada inválida nomeando o arquivo, a linha e o valor. Calcular os predicados geométricos em `double` com uma tolerância relativa, em duas passagens, e recusar a face se não existir nenhuma orelha. |
