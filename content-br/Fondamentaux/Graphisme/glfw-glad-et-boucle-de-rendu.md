---
order: 3
---

# Abrir uma janela OpenGL moderna: GLFW, GLAD e o loop de renderização

O [capítulo sobre raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) desenhava pixels um a um, sem placa gráfica. Uma engine 3D moderna delega em vez disso o cálculo à própria placa gráfica, por meio de uma API como **OpenGL**. Antes de poder enviar a ela o menor triângulo (veja o [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)), é preciso primeiro obter uma janela, um contexto gráfico, e um loop que exiba uma imagem após a outra. Este capítulo cobre essa etapa, com duas bibliotecas quase onipresentes nesse contexto: **GLFW** (janelamento) e **GLAD** (carregamento das funções OpenGL).

## GLFW: a janela e seu contexto OpenGL

O [GLFW](https://www.glfw.org) cumpre, para OpenGL, um papel parecido ao do MinilibX/X11 visto no capítulo anterior: pedir ao sistema operacional uma janela, receber os eventos de teclado/mouse. Mas o GLFW também cria um **contexto OpenGL**: o espaço onde a placa gráfica guarda todo o seu estado (texturas carregadas, programa de shader ativo...) para aquela janela específica.

```c
GLFWwindow *janela = glfwCreateWindow(800, 600, "Titulo", NULL, NULL);
// ativa esse contexto para todas as chamadas OpenGL seguintes
glfwMakeContextCurrent(janela);
```

## Carregar as funções OpenGL modernas: GLAD

Na maioria dos sistemas, apenas uma pequena parte do OpenGL (uma versão antiga, fixa) é diretamente ligada ao programa na compilação. As funções **modernas** precisam ser pedidas ao driver gráfico em tempo de execução, uma a uma, via `glfwGetProcAddress()`: uma **OpenGL Loading Library** como o [GLAD](https://glad.dav1d.de) automatiza essa etapa para toda a versão de OpenGL escolhida, em vez de chamar `glfwGetProcAddress()` na mão para cada função usada.

```c
if (!gladLoadGLLoader((GLADloadproc) glfwGetProcAddress)) {
    fprintf(stderr, "Não foi possível carregar o OpenGL\n");
    exit(1);
}
```

> **Nota:** o GLAD deve ser chamado **depois** de `glfwMakeContextCurrent()`, nunca antes: sem contexto ativo, não há nada contra o que resolver as funções pedidas.

## O arquivo do GLAD: gerado, depois "vendorado"

Ao contrário de uma biblioteca do sistema clássica, o GLAD não se instala via um gerenciador de pacotes: seu [gerador online](https://glad.dav1d.de) produz um `.c`/`.h` sob medida, para a versão de OpenGL e o sistema escolhidos. Esse arquivo gerado é então commitado diretamente no repositório do projeto, uma prática chamada **vendoring**.

> **Armadilha:** um `-I` apontado para o nível de pasta errado para esse arquivo gerado quebra a compilação exatamente como para qualquer outro header (veja [`#include` e `-I`](/?c=langages&s=c&p=headers) para o mecanismo preciso de resolução).
>
> **Boa prática:** o vendoring evita uma dependência de um gerenciador de pacotes externo e garante que todos compilem exatamente com o mesmo arquivo gerado, ao custo de commitar código que não foi escrito por quem mantém o projeto: reservar isso para um caso como este (um arquivo gerado de uma vez por todas, nunca editado à mão depois), não para uma biblioteca que muda com regularidade.

## O double buffering: evitar a imagem desenhada pela metade

Desenhar diretamente na tela, pixel a pixel, expõe um problema: se a tela atualiza enquanto a imagem está desenhada só pela metade, o usuário vê por um instante uma imagem incoerente (*tearing*). O **double buffering** evita isso desenhando sempre em um buffer invisível, trocado com o buffer exibido só depois que a imagem fica completa:

```text
Buffer da frente (exibido na tela)     Buffer de tras (sendo desenhado)
        |                                      |
        |          glfwSwapBuffers()           |
        +---------------- troca --------------->
        (o buffer de tras vira o buffer da frente, de uma vez)
```

```c
// troca os dois buffers, nunca um desenho pixel a pixel direto na tela
glfwSwapBuffers(janela);
```

## O loop de renderização

Assim como o loop de eventos do capítulo anterior, um loop de renderização OpenGL roda enquanto a janela permanece aberta, geralmente nesta forma fixa:

```c
while (!glfwWindowShouldClose(janela)) {
    glfwPollEvents();                              // 1. coletar os eventos (teclado, mouse...)
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  // 2. apagar a imagem anterior
    // 3. desenhar a nova imagem (buffer de tras)
    desenharCena();
    // 4. exibi-la de uma vez (double buffering)
    glfwSwapBuffers(janela);
}
```

> **Armadilha:** esquecer `glClear()` antes de redesenhar. Sem apagar, cada nova imagem se sobrepõe às anteriores em vez de substituí-las, deixando um rastro visual.

## O delta time: uma velocidade independente da máquina

Uma volta do loop de renderização produz uma imagem (um *frame*). O número de imagens por segundo, os **FPS** (*frames per second*), depende da máquina: 30 em um computador modesto, 144 em uma tela rápida. Se o objeto avança uma distância fixa a cada volta do loop, sua velocidade real acompanha então os FPS:

```c
posicao += 0.1;   // 0,1 unidade (a medida de comprimento da cena) por imagem: a velocidade depende do número de imagens
```

| FPS da máquina | Imagens em 1 segundo | Distância percorrida em 1 segundo |
|---|---|---|
| 30 | 30 | 30 × 0,1 = 3 unidades |
| 60 | 60 | 60 × 0,1 = 6 unidades |
| 144 | 144 | 144 × 0,1 = 14,4 unidades |

O **delta time** é o tempo decorrido entre a imagem anterior e a imagem atual, em segundos (por exemplo 0,0069 s a 144 FPS). Multiplicar cada deslocamento por essa duração torna a velocidade independente dos FPS: a velocidade é expressa em unidades **por segundo**, e cada imagem só avança a fração de segundo que durou.

```c
double ultimo_instante = glfwGetTime();   // double = número decimal; aqui, segundos decorridos desde a inicialização do GLFW
double velocidade = 5.0;                  // 5 unidades por segundo, seja qual for a máquina

while (!glfwWindowShouldClose(janela)) {
    double agora = glfwGetTime();                // instante desta imagem
    double delta = agora - ultimo_instante;      // duração da imagem anterior, em segundos
    ultimo_instante = agora;                     // memoriza para a próxima volta

    posicao += velocidade * delta;               // 144 FPS: 5 × 0,0069; 30 FPS: 5 × 0,033
    // ... eventos, limpeza, desenho, glfwSwapBuffers() como acima
}
```

> **Armadilha:** atualizar o delta time apenas em intervalos regulares (por exemplo «somente se 0,01 s se passaram»). Entre duas atualizações, o valor desatualizado é aplicado a cada imagem: a 144 FPS (uma imagem dura 0,0069 s, menos que esse limite), o deslocamento é somado com mais frequência do que o tempo passa e tudo vai rápido demais (cerca de 1,5 vez em um caso encontrado). O delta time é recalculado a **cada** imagem.
>
> **Armadilha:** depois de uma pausa (janela arrastada, programa suspenso), o primeiro delta pode valer vários segundos e lançar o objeto muito longe de uma só vez. Limita-se então o valor, por exemplo `if (delta > 0.1) delta = 0.1;`.

## A sincronização vertical (vsync)

A tela se atualiza a uma frequência fixa, expressa em hertz (Hz, atualizações por segundo): 60 Hz, 144 Hz... Sem nenhuma regra, o loop de renderização roda o mais rápido possível, muito além do que a tela consegue mostrar: imagens são desperdiçadas, a placa de vídeo esquenta, e a troca de buffers pode cair no meio de uma atualização (*tearing*, visto acima). A **sincronização vertical** (*vsync*) faz `glfwSwapBuffers()` esperar até a próxima atualização da tela:

```c
glfwMakeContextCurrent(janela);   // o contexto já deve estar ativo
glfwSwapInterval(1);              // 1 = esperar 1 atualização por troca (vsync); 0 = não esperar
```

| Ajuste | FPS obtidos | Efeito |
|---|---|---|
| `glfwSwapInterval(1)` | iguais à frequência da tela (60 em uma tela de 60 Hz) | sem tearing, placa de vídeo poupada |
| `glfwSwapInterval(0)` | tão altos quanto a máquina permitir | tearing possível, útil para medir o desempenho |

> **Boa prática:** nunca contar com o vsync para regular a velocidade. O driver gráfico (o software que faz o sistema conversar com a placa de vídeo) ou o usuário podem forçá-lo a ficar desligado, e os FPS mudam de uma tela para outra: só o delta time garante a mesma velocidade em todo lugar. O vsync regula a exibição, o delta time regula o movimento.

## Os limites da placa de vídeo e `glGetError`

Cada placa de vídeo tem seus **limites**: tamanho máximo de uma textura, tamanho máximo da **área de desenho** (o *viewport*, o retângulo da janela onde o OpenGL escreve os pixels)... Eles mudam de uma máquina para outra: um programa que funciona na máquina do autor pode falhar na de outra pessoa, sem que o código tenha mudado. Eles são **lidos** em vez de supostos, com `glGetIntegerv(constante, &valor)` (a função que lê um inteiro do estado do OpenGL; `GLint` é o tipo inteiro do OpenGL, de 32 bits em todas as máquinas).

| Constante | O que fornece | Se for ultrapassada |
|---|---|---|
| `GL_MAX_TEXTURE_SIZE` | lado máximo, em pixels, de uma [textura](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#as-texturas-uma-imagem-colada-na-superficie) | o envio da imagem é recusado, a textura fica inutilizável (lida como preta) |
| `GL_MAX_VIEWPORT_DIMS` | **dois** inteiros: largura e altura máximas da área de desenho | a especificação não garante nada: desenho truncado conforme o driver |

```c
/* Verdadeiro se uma imagem width x height cabe numa textura desta placa; mensagem se não. */
static int texture_fits(int width, int height)
{
	GLint max_size = 0;

	if (width <= 0 || height <= 0)                 /* dimensões degeneradas: causa à parte */
	{
		fprintf(stderr, "imagem de %d x %d: dimensoes nulas ou negativas\n", width, height);
		return 0;
	}
	glGetIntegerv(GL_MAX_TEXTURE_SIZE, &max_size); /* um inteiro; contexto ativo obrigatório */
	if (width > max_size || height > max_size)
	{
		fprintf(stderr, "imagem %d x %d grande demais: esta placa aceita no maximo %d por lado\n",
			width, height, max_size);
		return 0;
	}
	return 1;
}

GLint max_viewport[2] = {0, 0};
glGetIntegerv(GL_MAX_VIEWPORT_DIMS, max_viewport); /* aqui dois valores: um vetor de 2 inteiros */
```

> **Armadilha:** `glGetIntegerv`, como toda função OpenGL, só funciona **depois de** [`glfwMakeContextCurrent()` e do carregamento do GLAD](#carregar-as-funcoes-opengl-modernas-glad): antes, o ponteiro da função é nulo e o programa trava.

**O OpenGL quase nunca sinaliza um erro por um valor de retorno.** Uma chamada recusada (tamanho grande demais, estado errado) não trava e não mostra nada: ela levanta um **indicador de erro** interno, que o programa lê com `glGetError()`. Essa função devolve um código e zera o indicador; `GL_NO_ERROR` (0) significa «nada pendente».

| Código | Significado habitual |
|---|---|
| `GL_INVALID_ENUM` | constante desconhecida passada a uma função |
| `GL_INVALID_VALUE` | valor numérico fora da faixa (tamanho grande demais, negativo) |
| `GL_INVALID_OPERATION` | chamada não permitida no estado atual (ordem errada, objeto não ligado) |
| `GL_OUT_OF_MEMORY` | a placa (ou o driver) ficou sem memória |
| `GL_INVALID_FRAMEBUFFER_OPERATION` | desenho para um buffer de imagem incompleto |

Os erros **se acumulam** e `glGetError()` devolve **um por chamada**: repete-se até esvaziar, senão o erro lido vem de uma chamada anterior e não da última.

```c
/* Nome legível de um código de erro do OpenGL. */
static const char *gl_error_name(GLenum err)
{
	switch (err)
	{
	case GL_INVALID_ENUM: return "GL_INVALID_ENUM";
	case GL_INVALID_VALUE: return "GL_INVALID_VALUE";
	case GL_INVALID_OPERATION: return "GL_INVALID_OPERATION";
	case GL_OUT_OF_MEMORY: return "GL_OUT_OF_MEMORY";
	case GL_INVALID_FRAMEBUFFER_OPERATION: return "GL_INVALID_FRAMEBUFFER_OPERATION";
	default: return "codigo desconhecido";
	}
}

/* Lê e mostra todos os erros pendentes, com a etapa `where`; devolve quantos. */
static int check_gl_errors(const char *where)
{
	int count = 0;
	GLenum err;

	while ((err = glGetError()) != GL_NO_ERROR)   /* cada leitura retira um erro da pilha */
	{
		fprintf(stderr, "OpenGL: %s durante '%s'\n", gl_error_name(err), where);
		count++;
	}
	return count;
}
```

Uso: `check_gl_errors("glTexImage2D");` logo depois da chamada suspeita, para nomear a etapa defeituosa (um `check_gl_errors("antes")` colocado antes esvazia o conteúdo antigo).

> **Armadilha:** num laço de renderização, um mesmo problema se repetiria a **cada imagem** (60 mensagens por segundo que afogam todo o resto). Sinalizar cada causa **uma única vez** (lista limitada dos códigos já mostrados), ou controlar só na inicialização e em modo de depuração.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O GLFW cria a janela e seu contexto OpenGL; o GLAD então carrega as funções OpenGL modernas via `glfwGetProcAddress()`. O double buffering (`glfwSwapBuffers()`) evita que uma imagem desenhada pela metade seja exibida. Um loop de renderização repete: eventos, limpeza, desenho, troca de buffers. O delta time (duração da imagem anterior, via `glfwGetTime()`) torna as velocidades independentes dos FPS; o vsync (`glfwSwapInterval(1)`) ajusta a exibição à tela. Os limites da placa (tamanho de textura, de área de desenho) mudam de uma máquina para outra: eles são lidos; o OpenGL só sinaliza um erro por um indicador lido com `glGetError()`. |
| **Ferramentas utilizáveis** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`. |
| **Armadilhas a evitar** | Chamar o GLAD antes de `glfwMakeContextCurrent()`. Apontar `-I` para o nível de pasta errado para os headers gerados pelo GLAD. Esquecer `glClear()` antes de redesenhar. Mover um objeto uma distância fixa por imagem. Atualizar o delta time apenas em intervalos regulares. Deixar um delta gigante depois de uma pausa. Supor um limite da placa em vez de lê-lo, chamar `glGetIntegerv` sem contexto ativo, ler um único erro em vez de esvaziar a pilha, repetir a mesma mensagem a cada imagem. |
| **Boas práticas** | Vendorar um arquivo gerado de uma vez por todas (como o do GLAD) em vez de depender dele a cada build; reservar essa prática a arquivos que não mudam com regularidade. Expressar as velocidades em unidades por segundo, recalcular o delta time a cada imagem e limitá-lo; nunca se apoiar no vsync para regular a velocidade. Comparar uma imagem com o limite da placa antes de enviá-la, com uma mensagem que nomeie a imagem, suas dimensões e o limite. Repetir `glGetError()` até `GL_NO_ERROR` e nomear a etapa controlada. |
