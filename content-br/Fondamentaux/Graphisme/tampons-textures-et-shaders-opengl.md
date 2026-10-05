---
order: 4
---

# Buffers, texturas e shaders do OpenGL

O [capítulo anterior](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) abre uma janela e executa um laço de renderização, mas ainda não desenha nada nela. Para exibir um objeto, é preciso enviar seus dados à **placa de vídeo** (o processador especializado em desenhar, também chamado de GPU) e fornecer a ela os pequenos programas que os transformam em pixels. Este capítulo cobre os três ingredientes: os **buffers** (os vértices), as **texturas** (as imagens) e os **shaders** (os programas).

> **Vocabulário:** no OpenGL, quase tudo é um **objeto**, isto é, um recurso guardado no lado da placa de vídeo que o programa só manipula por um **identificador inteiro** (um `GLuint`). Pede-se ao OpenGL que crie o objeto (`glGen...`), **vincula-se** (`glBind...`) para dizer "os próximos comandos visam este", e depois ele é preenchido ou configurado.

## Os buffers: VBO, EBO e VAO

Um **buffer** é uma área de memória da placa de vídeo. Três objetos trabalham juntos para descrever uma forma:

| Objeto | Nome completo | Contém | Serve para |
|---|---|---|---|
| **VBO** | *Vertex Buffer Object* | Os vértices: posição, coordenada de textura, normal... | Guardar os dados uma única vez no lado da placa |
| **EBO** | *Element Buffer Object* | **Índices**: quais vértices formam cada triângulo | Reutilizar um mesmo vértice em vários triângulos |
| **VAO** | *Vertex Array Object* | Nenhum dado: a **configuração** (qual VBO, como lê-lo, qual EBO) | Recuperar toda essa configuração com um único `glBindVertexArray` |

Por que um EBO: um quadrado (*quad*) é desenhado com 2 triângulos, ou seja, 6 vértices, embora tenha só 4 cantos. Com índices, os 4 cantos são guardados uma vez e os triângulos se escrevem `0 3 2` e `0 2 1`, como as linhas `f` de um arquivo [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong).

```c
/* x      y     z      u     v      <- 5 floats por vértice (posição e depois textura) */
float vertices[] = {
	 0.5f,  0.5f, 0.0f,  1.0f, 1.0f,   /* vértice 0: em cima à direita */
	 0.5f, -0.5f, 0.0f,  1.0f, 0.0f,   /* vértice 1: embaixo à direita */
	-0.5f, -0.5f, 0.0f,  0.0f, 0.0f,   /* vértice 2: embaixo à esquerda */
	-0.5f,  0.5f, 0.0f,  0.0f, 1.0f,   /* vértice 3: em cima à esquerda */
};
unsigned int indices[] = {0, 3, 2,  0, 2, 1};   /* dois triângulos, sentido anti-horário */

GLuint vao, vbo, ebo;
glGenVertexArrays(1, &vao);                     /* cria os três objetos (identificadores) */
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);

glBindVertexArray(vao);                         /* tudo o que segue é memorizado neste VAO */
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof vertices, vertices, GL_STATIC_DRAW);  /* cópia para a placa */
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);     /* o EBO vinculado aqui é memorizado pelo VAO */
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof indices, indices, GL_STATIC_DRAW);

/* atributo 0: 3 floats (posição), um vértice = 5 floats, leitura a partir do byte 0 */
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)0);
glEnableVertexAttribArray(0);
/* atributo 1: 2 floats (textura), a partir do byte 12 (3 floats adiante) */
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                           /* fim da gravação */

/* no laço de renderização: */
glBindVertexArray(vao);                         /* recupera toda a configuração */
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);   /* desenha 6 índices = 2 triângulos */
```

`GL_STATIC_DRAW` é uma indicação de uso: dados escritos uma vez, desenhados com frequência (o contrário, `GL_DYNAMIC_DRAW`, anuncia atualizações frequentes).

| Cilada | Por quê | Remédio |
|---|---|---|
| `sizeof` de um ponteiro em vez do array | `sizeof(ptr)` vale 8 bytes, não o tamanho dos dados: o buffer fica quase vazio | Guardar o tamanho do array ou passá-lo explicitamente (número de vértices x tamanho de um vértice) |
| Passo e deslocamento dados em número de `float` | `glVertexAttribPointer` espera **bytes** | Multiplicar por `sizeof(float)`, como acima |
| Desvincular o EBO (`glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0)`) enquanto o VAO está vinculado | O EBO faz parte do estado do VAO: é retirado do VAO | Desvincular primeiro o VAO (ou não desvincular o EBO) |
| Desenhar sem VAO vinculado | O perfil *core* do OpenGL se recusa a desenhar sem VAO | Sempre vincular um VAO antes de `glDraw...` |
| Esquecer de liberar | Os objetos continuam na memória da placa até serem excluídos | `glDeleteBuffers`, `glDeleteVertexArrays` ao encerrar |

## As texturas: uma imagem colada na superfície

Uma **textura** é uma imagem guardada no lado da placa de vídeo. Cada vértice carrega uma coordenada de textura `(u, v)` entre 0 e 1 (as colunas `u v` da tabela acima): a placa interpola essas coordenadas sobre o triângulo e lê a imagem naquele ponto para cada pixel (veja [o arquivo de imagem referenciado pelo `.mtl`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#o-arquivo-de-imagem-referenciado-pelo-mtl)). Os pixels podem ser obtidos, por exemplo, lendo um [arquivo PPM](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#o-formato-ppm-p6-uma-textura-sem-biblioteca).

```c
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);          /* linhas de pixels sem preenchimento (veja abaixo) */
GLuint tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);              /* os comandos seguintes visam esta textura */
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0,
             GL_RGB, GL_UNSIGNED_BYTE, pixels); /* envia os pixels (3 bytes cada) */
glGenerateMipmap(GL_TEXTURE_2D);                /* versões reduzidas, veja abaixo */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   /* se u sair de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);   /* se v sair de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);  /* imagem reduzida */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);                /* imagem ampliada */
```

### `GL_UNPACK_ALIGNMENT`: linhas de pixels alinhadas em 4 bytes

Por padrão, o OpenGL supõe que **cada linha de pixels começa num endereço múltiplo de 4 bytes** e lê o preenchimento que falta. Um arquivo como o PPM, por sua vez, guarda as linhas **sem nenhum preenchimento**. Com pixels de 3 bytes (vermelho, verde, azul), o desacordo aparece assim que a largura não é múltipla de 4:

| Largura (pixels) | Bytes reais por linha | Bytes lidos pelo OpenGL | Resultado |
|---|---|---|---|
| 1 | 3 | 4 | Deslocado |
| 2 | 6 | 8 | Deslocado |
| 3 | 9 | 12 | Deslocado |
| 4 | 12 | 12 | Correto |
| 5 | 15 | 16 | Deslocado |
| 6 | 18 | 20 | Deslocado |

O sintoma: uma imagem **inclinada** (cada linha escorrega um pouco mais que a anterior) e cores erradas, apenas para certas larguras. Pior, a última linha é lida até 3 bytes além do fim do array: uma leitura fora dos limites. Remédio: `glPixelStorei(GL_UNPACK_ALIGNMENT, 1)` **antes** de `glTexImage2D`, que diz "minhas linhas são compactas". Com 4 bytes por pixel (vermelho, verde, azul, transparência), a linha é sempre múltipla de 4 e o problema não existe.

### Mipmaps, filtros e repetição

Um objeto distante cobre poucos pixels na tela: a placa lê então uma imagem grande em alguns pontos ao acaso e a imagem cintila. Os **mipmaps** são cópias da textura reduzidas à metade a cada nível (1/2, 1/4, 1/8...); `glGenerateMipmap` os calcula de uma só vez (a chamar **depois** de `glTexImage2D`). A placa escolhe o nível adequado ao tamanho na tela. Custo: um terço de memória a mais (1/4 + 1/16 + ... tende a 1/3).

| Ajuste | Valor | Efeito |
|---|---|---|
| Filtro | `GL_NEAREST` | Pega o pixel mais próximo: nítido, com blocos visíveis |
| Filtro | `GL_LINEAR` | Mistura os 4 pixels vizinhos: suave |
| Filtro de redução (`MIN`) | `GL_LINEAR_MIPMAP_LINEAR` | Suave, e mistura também dois níveis de mipmap |
| Repetição | `GL_REPEAT` | A imagem se repete além de 0..1 |
| Repetição | `GL_MIRRORED_REPEAT` | Ela se repete em espelho |
| Repetição | `GL_CLAMP_TO_EDGE` | O último pixel da borda é prolongado |

> **Cilada:** o filtro de redução padrão espera mipmaps. Sem `glGenerateMipmap` nem mudança do filtro `MIN`, a textura é dita **incompleta** e aparece **preta**, sem nenhum erro. Ou se geram os mipmaps, ou se ajusta `GL_TEXTURE_MIN_FILTER` para `GL_LINEAR`. E o filtro de ampliação (`MAG`) nunca aceita um valor "mipmap": o erro `GL_INVALID_ENUM` é sinalizado no indicador de erro, não por uma falha.

## Os shaders: os programas da placa de vídeo

Um **shader** é um pequeno programa escrito em **GLSL** ([*OpenGL Shading Language*](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language), uma linguagem próxima do C) que executa na placa de vídeo, em paralelo para milhares de vértices ou de pixels ao mesmo tempo. Desenhar um triângulo atravessa uma cadeia de etapas:

```text
vértices (VBO)
   |
   v
[ vertex shader ]      uma chamada POR VÉRTICE: calcula sua posição na tela
   |
   v
montagem               agrupa os vértices em triângulos
   |
   v
[ geometry shader ]    OPCIONAL, uma chamada POR TRIÂNGULO: pode emitir 0, 1 ou vários
   |
   v
rasterização           corta cada triângulo em fragmentos (os pixels que ele cobre)
   |
   v
[ fragment shader ]    uma chamada POR FRAGMENTO: calcula sua cor
   |
   v
teste de profundidade, depois tela
```

| Etapa | Executa | Entrada | Saída |
|---|---|---|---|
| Vertex | Uma vez por vértice | Os atributos do VBO (posição, `u v`...) | A posição na tela (`gl_Position`) e valores a transmitir |
| Geometry | Uma vez por triângulo (opcional) | Os 3 vértices do triângulo | De 0 a N vértices emitidos |
| Fragment | Uma vez por pixel coberto | Os valores transmitidos, **interpolados** entre os vértices | A cor final |

Duas palavras voltam em todo shader. Um **`uniform`** é um valor fixado pelo programa C, **idêntico** para todos os vértices e pixels de um mesmo desenho (direção da luz, matriz, tempo). Um **`in`/`out`** passa um valor de uma etapa à seguinte (um `out` do vertex shader vira um `in` da seguinte, **emparelhados pelo nome**).

### Exemplo: uma normal plana por triângulo, calculada no geometry shader

A **normal** é o vetor perpendicular a uma superfície, necessário para a iluminação (veja [o modelo de Phong](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Calculada por triângulo, dá um aspecto facetado. O geometry shader recebe os 3 vértices de uma vez, então pode calculá-la sem que o arquivo a forneça:

```glsl
#version 330 core
layout(triangles) in;                           // recebe um triângulo inteiro: 3 vértices
layout(triangle_strip, max_vertices = 3) out;   // devolve um, de no máximo 3 vértices
in vec3 world_pos[];                            // posição de cada vértice (vinda do vertex shader)
out vec3 flat_normal;                           // mesma normal para os 3 vértices emitidos

void main()
{
	vec3 n = normalize(cross(world_pos[1] - world_pos[0],
	                         world_pos[2] - world_pos[0]));   // perpendicular ao triângulo
	for (int i = 0; i < 3; i++)
	{
		gl_Position = gl_in[i].gl_Position;     // posição na tela já calculada
		flat_normal = n;
		EmitVertex();                           // emite este vértice
	}
	EndPrimitive();                             // termina o triângulo
}
```

O fragment shader que a usa ilumina a face conforme o ângulo com a luz:

```glsl
#version 330 core
in vec3 flat_normal;                            // normal transmitida (mesmo valor em todo o triângulo)
uniform vec3 light_dir;                         // direção da luz, fixada pelo programa C
out vec4 color;                                 // cor final do pixel

void main()
{
	float light = max(dot(normalize(flat_normal), -light_dir), 0.0);   // 0 se a face vira as costas
	color = vec4(vec3(0.8) * light, 1.0);       // cinza x intensidade, opaco
}
```

> **Cilada:** um triângulo degenerado (três vértices alinhados) tem produto vetorial nulo, e `normalize` de um vetor nulo dá um resultado indefinido (possivelmente `NaN`): um triângulo preto ou pixels corrompidos. Além disso, o **sentido** da normal depende da ordem dos vértices (anti-horário = face frontal): uma malha do avesso tem todas as normais invertidas.

### Iluminação de dupla face: `gl_FrontFacing`

Um triângulo tem dois lados. O lado **frontal** é aquele de onde se veem seus vértices em sentido **anti-horário** na tela (*CCW*, *counter-clockwise*): quem decide é a **ordem de enrolamento** (*winding order*) dos vértices, não a geometria. Por padrão, o OpenGL considera o sentido anti-horário como a frente (ajuste `glFrontFace(GL_CCW)`); para a eliminação de faces, que se apoia na mesma noção, veja [desenhar um objeto transparente](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#desenhar-um-objeto-transparente).

A normal calculada por `cross` (o produto vetorial, veja [Vetores e produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) aponta para fora do lado frontal. Visto por trás, um triângulo tem portanto uma normal que se afasta do observador e da luz: o `dot` (produto escalar) do fragment shader acima fica negativo, `max(..., 0.0)` o leva a 0 e o pixel fica preto.

| Situação | Lado visto | Normal | Resultado com a iluminação acima |
|---|---|---|---|
| Malha fechada, vértices em sentido anti-horário | frontal | para fora | iluminado |
| Malha fechada, vértices em sentido inverso | «traseiro» (embora seja o exterior) | para dentro | **preto** |
| Superfície aberta (folha, bandeira) vista pelos dois lados | frontal e depois traseiro | de um só lado | iluminada de um lado, **preta** do outro |

Para isso, o fragment shader recebe a variável predefinida **`gl_FrontFacing`** (booleano): verdadeira se o triângulo é visto pelo lado frontal. Basta inverter a normal quando ela é falsa:

```glsl
#version 330 core
in vec3 flat_normal;                            // normal do triângulo, orientada para o lado frontal
uniform vec3 light_dir;                         // direção da luz
out vec4 color;                                 // cor final do pixel

void main()
{
	vec3 n = normalize(flat_normal);            // vetor de comprimento 1
	if (!gl_FrontFacing)                        // triângulo visto por trás
		n = -n;                                 // normal invertida: ela olha para o observador
	float light = max(dot(n, -light_dir), 0.0);
	color = vec4(vec3(0.8) * light, 1.0);
}
```

Isso supõe que a eliminação das faces traseiras (`GL_CULL_FACE`) esteja **desativada**: uma face eliminada nunca chega ao fragment shader.

> **Armadilha:** a iluminação de dupla face esconde uma malha do avesso em vez de repará-la: suas normais continuam erradas para qualquer outro uso (reflexos, sombras, eliminação de faces). Corrija o dado invertendo a ordem de dois vértices de cada triângulo. Um **espelho** (escala negativa em um único eixo) também inverte o enrolamento: um objeto virado por uma escala `-1` fica preto sem que o arquivo tenha mudado.

**Medir o resultado.** Uma malha «preta» se verifica numa captura de tela pela **proporção de pixels pretos**. Uma comparação pixel a pixel com uma imagem de referência falha: o brilho pulsa com o tempo, e duas capturas da mesma renderização diferem. Escolha um fundo que não seja preto (senão o fundo conta como preto) e conte:

```c
/* Proporção (0 a 1) de pixels quase pretos numa imagem RGB de n pixels; -1 se n vale 0. */
static double dark_ratio(const unsigned char *rgb, size_t n)
{
	size_t dark = 0;

	if (n == 0)                                 /* imagem vazia: nenhuma proporção a calcular */
		return -1;
	for (size_t i = 0; i < n; i++)
		if (rgb[3 * i] < 16 && rgb[3 * i + 1] < 16 && rgb[3 * i + 2] < 16)   /* R, G e B abaixo de 16 em 255 */
			dark++;
	return (double)dark / (double)n;
}
```

Uma malha do avesso dá uma proporção próxima da de toda a silhueta; a mesma malha corrigida (ou iluminada nas duas faces) a faz cair. Medido com os três shaders deste capítulo (o geometry shader e os dois fragment shaders, sem modificação) em um cubo de 12 triângulos renderizado em uma imagem de 256 × 256 com fundo azul, com a luz vinda do observador e a eliminação de faces desativada, em três motores (AMD Radeon 680M com Mesa, NVIDIA RTX 3070, `llvmpipe`) com resultados idênticos: vértices no sentido certo e iluminação básica, `dark_ratio` = **0,000**; vértices invertidos e iluminação básica, **0,425** (o fundo ocupa 0,575 da imagem: é exatamente a silhueta do cubo); vértices invertidos com `gl_FrontFacing`, **0,000**.

### Compilar, ligar e usar um programa

O código GLSL é **texto**, compilado em tempo de execução pelo **driver** da placa (veja [GLFW e GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Um erro de digitação só é detectado quando o programa inicia: é preciso ler o log do compilador.

```c
/* Compila um shader; em caso de falha, exibe o log do compilador e devolve 0. */
static GLuint compile_shader(GLenum type, const char *source)
{
	GLuint shader = glCreateShader(type);        /* type: GL_VERTEX_SHADER, GL_GEOMETRY_SHADER... */
	GLint ok;

	glShaderSource(shader, 1, &source, NULL);    /* entrega o texto GLSL */
	glCompileShader(shader);
	glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
	if (!ok)
	{
		char log[1024];
		glGetShaderInfoLog(shader, sizeof log, NULL, log);   /* linha e causa do erro */
		fprintf(stderr, "shader: %s\n", log);
		glDeleteShader(shader);
		return 0;
	}
	return shader;
}
```

A ligação (`glAttachShader` para cada etapa, `glLinkProgram`, depois `glGetProgramiv(..., GL_LINK_STATUS, ...)` e `glGetProgramInfoLog`) segue exatamente o mesmo esquema, com `program` no lugar de `shader`. Depois de ligado, `glUseProgram(program)` o ativa para os desenhos seguintes.

Um valor `uniform` é fixado assim, **depois** de `glUseProgram`:

```c
GLint loc = glGetUniformLocation(program, "light_dir");   /* número do slot */
if (loc == -1)
	fprintf(stderr, "uniform light_dir ausente\n");
else
	glUniform3f(loc, 0.0f, -1.0f, 0.0f);                  /* a luz cai para baixo */
```

> **Cilada:** `glGetUniformLocation` devolve **-1** se o nome não existe, e `glUniform...` com -1 é **ignorado em silêncio**. Duas causas: um erro de digitação no nome, ou uma variável que o compilador **removeu por não servir para nada** no shader. Testar `-1` e sinalizá-lo **uma única vez** (nunca a cada quadro do laço de renderização).

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um VBO guarda os vértices, um EBO os índices dos triângulos, um VAO memoriza a configuração de leitura: vincula-se e depois desenha-se. Uma textura é uma imagem no lado da placa de vídeo, lida pelas coordenadas `(u, v)`; supõe-se que suas linhas estejam alinhadas em 4 bytes, e os mipmaps evitam a cintilação à distância. Um programa GLSL encadeia um vertex shader (por vértice), um geometry shader opcional (por triângulo) e um fragment shader (por pixel); um `uniform` é idêntico para todo um desenho. O lado frontal de um triângulo é aquele em que seus vértices aparecem em sentido anti-horário; `gl_FrontFacing` permite ao fragment shader inverter a normal de uma face vista por trás. |
| **Ferramentas utilizáveis** | `glGenBuffers`/`glBufferData`/`glVertexAttribPointer`/`glDrawElements`, `glPixelStorei`, `glGenerateMipmap`, `glTexParameteri`, `glCompileShader` e seus logs, `glGetUniformLocation`. Documentação: [Vertex Specification](https://www.khronos.org/opengl/wiki/Vertex_Specification), [Texture](https://www.khronos.org/opengl/wiki/Texture), [Geometry Shader](https://www.khronos.org/opengl/wiki/Geometry_Shader). |
| **Ciladas a evitar** | `sizeof` de um ponteiro, passo e deslocamento em número de `float` em vez de bytes, EBO desvinculado antes do VAO, desenho sem VAO. Largura de textura não múltipla de 4 sem `GL_UNPACK_ALIGNMENT` em 1 (imagem inclinada, leitura fora dos limites). Textura sem mipmaps com o filtro padrão (preta, sem erro). Triângulo degenerado numa normal calculada no shader. Malha do avesso (preta com iluminação de uma só face), escala negativa que inverte o enrolamento. Uniform ausente (-1) ignorado em silêncio. |
| **Boas práticas** | Ler o log do compilador e da ligação, e exibi-lo com a causa real. Sinalizar um erro de `uniform` uma única vez. Fixar `GL_UNPACK_ALIGNMENT` antes de enviar uma imagem de linhas compactas. Gerar os mipmaps ou ajustar o filtro `MIN`. Excluir os objetos ao encerrar. Reparar uma malha do avesso invertendo dois vértices por triângulo em vez de esconder o defeito com dupla face; verificar uma renderização pela proporção de pixels pretos de uma captura. |
