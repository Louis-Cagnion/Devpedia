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

### Um único cronômetro por uso

Um **cronômetro** designa aqui uma variável que memoriza um instante (como `ultimo_instante` acima). Quando um mesmo cronômetro serve a **dois usos** (medir a duração de uma imagem **e** espaçar as etapas de um fade, isto é, uma transição gradual de opacidade), um dos dois está errado. O caso típico:

```c
double now = glfwGetTime();

if (now - prev_time >= FADE_STEP)   /* limitador do fade: uma etapa a cada FADE_STEP */
{
	frame_time = now - prev_time;   /* desde a ultima ETAPA, nao a ultima imagem */
	prev_time = now;
	alpha += 0.05;                  /* alpha: opacidade de 0 (transparente) a 1 (opaco) */
}
position += speed * frame_time;     /* usado a CADA imagem, atualizado a cada ETAPA */
```

Aqui `FADE_STEP` vale 0,016 s. `frame_time` só é atualizado a cada etapa do fade, mas é usado a cada imagem: quanto mais imagens a máquina produz entre duas etapas, mais o movimento é multiplicado. Medido numa simulação de um segundo, velocidade de 5 unidades por segundo (a distância correta é, portanto, 5):

| FPS | Distância com um cronômetro compartilhado | Com um cronômetro por uso |
|---|---|---|
| 30 ou 60 | 5,0 | 5,0 |
| 144 | 14,8 (3 vezes demais) | 5,0 |
| 1.000 | 79,0 (16 vezes demais) | 5,0 |
| 2.500 | 199,7 (**40 vezes** demais) | 5,0 |

Numa tela de 60 Hz com vsync, o defeito não aparece (uma imagem dura mais que o passo do fade): ele surge numa tela rápida ou sem vsync. A correção se resume em três regras: Medido em um laço GLFW real (tela de 144 Hz, um movimento de 5 unidades por segundo durante 1 s): com vsync (147 quadros) o cronômetro compartilhado dá **14,70**; sem vsync (18 037 quadros) **1 434,21**, ou seja 287 vezes a mais; com um cronômetro por uso, de 4,98 a 5,00 em todos os casos.

| Regra | O que muda |
|---|---|
| **Um cronômetro por uso** | A duração da imagem é recalculada a cada imagem; nada mais mexe nela |
| **Limitar** essa duração (`MAX_FRAME_TIME`, p. ex. 0,1 s) | Uma pausa não arremessa mais o objeto longe (veja a armadilha anterior) |
| **Expressar um fade pela sua duração**, não por um número de etapas | `alpha = decorrido / FADE_DURATION` (0,5 s aqui), ou seja, o mesmo tempo em qualquer máquina; o limitador deixa de ser necessário |

```c
double now = glfwGetTime();
double frame_time = now - last_frame;     /* duracao da imagem, recalculada a cada volta */

last_frame = now;
if (frame_time > MAX_FRAME_TIME)          /* depois de uma pausa */
	frame_time = MAX_FRAME_TIME;
position += speed * frame_time;
fade_elapsed += frame_time;               /* o fade acumula tempo real */
alpha = fminf(fade_elapsed / FADE_DURATION, 1.0f);   /* fminf: limita a 1 */
```

> **Armadilha (medir numa única cadência):** um movimento mantido (tecla pressionada, rotação contínua) que parece certo a 60 FPS pode estar errado em outra cadência. Medi-lo em **várias cadências**: com vsync e depois sem. Sem vsync, o Mesa é ajustado pela [variável de ambiente](/?c=shells&s=bash&p=variables-denvironnement) `vblank_mode=0` e o driver da NVIDIA por `__GL_SYNC_TO_VBLANK=0` (`vblank_mode=0 ./programa`). O ângulo ou a distância percorridos após um segundo devem ser os mesmos em todos os casos. Medido em um notebook com duas placas: `vblank_mode=0` desativa de fato o vsync do Mesa (17 447 quadros em 1 s em vez de 147), mas `__GL_SYNC_TO_VBLANK=0` não teve **nenhum efeito** quando a renderização é delegada à placa NVIDIA (`__NV_PRIME_RENDER_OFFLOAD=1`: 169 quadros em vez de 147); `glfwSwapInterval(0)` no programa funciona em todo lugar (7 556 quadros com NVIDIA, 17 244 com Mesa). Outro limite da igualdade de distâncias: um quadro mais longo que `MAX_FRAME_TIME` é limitado, então o tempo excedente se perde (uma parada de cerca de 0,3 s ao iniciar o driver NVIDIA deu 3,81 em vez de 5).

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

### Consultar o driver gráfico e a tela

O **driver** (o software do fabricante que faz o OpenGL conversar com a placa) sabe dizer quem é e o que aceita. `glGetString` devolve um texto, `glGetIntegerv` um inteiro:

| Consulta | O que fornece |
|---|---|
| `glGetString(GL_VENDOR)` | o fabricante do driver |
| `glGetString(GL_RENDERER)` | o nome da placa (e muitas vezes do driver) |
| `glGetString(GL_VERSION)` | a versão do OpenGL fornecida, seguida do driver |
| `glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, ...)` | o número máximo de atributos por vértice (posição, normal...) |
| `glGetIntegerv(GL_MAX_GEOMETRY_OUTPUT_VERTICES, ...)` | o máximo do `max_vertices` de um [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-shaders-os-programas-da-placa-de-video) |
| `glGetIntegerv(GL_MAX_ELEMENTS_INDICES, ...)` | uma **sugestão** (número de índices recomendado por chamada de desenho), nunca um limite: ultrapassá-la não produz erro algum, apenas um desenho possivelmente mais lento |

```c
/* Mostra fabricante, placa e versão do OpenGL; devolve 0, ou -1 se o driver não responde. */
static int print_gl_info(void)
{
	const char *vendor = (const char *)glGetString(GL_VENDOR);      /* GLubyte * convertido em texto */
	const char *renderer = (const char *)glGetString(GL_RENDERER);
	const char *version = (const char *)glGetString(GL_VERSION);

	if (!vendor || !renderer || !version)          /* NULL: sem contexto ativo, ou constante recusada */
	{
		fprintf(stderr, "glGetString devolveu NULL: sem contexto ativo, ou constante recusada\n");
		return -1;
	}
	printf("Fabricante: %s\nPlaca: %s\nOpenGL: %s\n", vendor, renderer, version);
	return 0;
}
```

**A memória da placa não tem consulta padrão.** Só as **extensões** (funções opcionais, próprias de um fabricante, que o driver pode ou não fornecer) a informam: `GL_NVX_gpu_memory_info` na NVIDIA, `GL_ATI_meminfo` na AMD. `glfwExtensionSupported("GL_NVX_gpu_memory_info")` diz se o driver a possui. Sem ela, o único sinal de falta de memória é `GL_OUT_OF_MEMORY`, a ser lido com `glGetError()` (veja acima).

**A tela se pergunta ao GLFW**, não ao OpenGL: uma janela maior que a tela fica em parte fora da vista do usuário.

```c
/* Verdadeiro (1) se uma janela width x height cabe na tela principal, 0 se não, -1 se a tela é desconhecida. */
static int window_fits_screen(int width, int height)
{
	GLFWmonitor *monitor = glfwGetPrimaryMonitor();   /* NULL: nenhuma tela detectada */
	const GLFWvidmode *mode = monitor ? glfwGetVideoMode(monitor) : NULL;   /* NULL em caso de falha */

	if (!mode)
	{
		fprintf(stderr, "tela principal nao encontrada: tamanho da janela nao verificado\n");
		return -1;
	}
	if (width > mode->width || height > mode->height)   /* mode->width e ->height: tamanho da tela */
	{
		fprintf(stderr, "janela %d x %d maior que a tela (%d x %d)\n",
			width, height, mode->width, mode->height);
		return 0;
	}
	return 1;
}
```

> **Armadilha:** `glfwGetVideoMode` dá o tamanho em **coordenadas de tela**, que diferem dos pixels numa tela de alta densidade (HiDPI, por exemplo uma tela que mostra 2 pixels por unidade); `glfwGetFramebufferSize` dá o tamanho da janela em pixels. Com várias telas, `glfwGetPrimaryMonitor` designa apenas a tela principal: a janela pode abrir em outra.

---

## Como o OpenGL conhece a máquina: do programa ao hardware

O OpenGL não é um programa: é uma **especificação**, um documento (mantido pelo consórcio [Khronos](https://www.khronos.org/opengl/)) que descreve cada função, seus parâmetros e seu comportamento. Nenhum código acompanha esse documento: cada fabricante escreve o seu no seu **driver** (o software que traduz as chamadas do OpenGL em ordens que a sua placa entende). Daí o `glGetString(GL_VENDOR)` (veja acima), e um mesmo programa que se comporta de forma diferente de uma máquina para outra.

No Linux, uma chamada como `glClear` atravessa estas camadas:

```
O programa                   chama glClear, glDrawArrays...
      │  GLAD e glfwGetProcAddress encontram o endereço de cada função
      ▼
Biblioteca de acesso         libGL.so.1 (GLVND): escolhe qual driver usar
      ▼
Driver OpenGL                Mesa (AMD, Intel) ou o driver proprietário da NVIDIA
      ▼
Kernel do Linux              driver do kernel (amdgpu, i915, nvidia...) via DRM
      ▼
Hardware                     a placa, conectada ao barramento PCI
```

| Camada | Papel |
|---|---|
| **Biblioteca de acesso** (`libGL`) | Ponto de entrada único. O **[GLVND](https://github.com/NVIDIA/libglvnd)** (*GL Vendor-Neutral Dispatch*, « despachante neutro ») permite que vários drivers convivam e escolhe o que corresponde à placa em uso. |
| **Driver OpenGL** | Executa de fato as funções. O **[Mesa](https://www.mesa3d.org/)** é o driver livre (`radeonsi` para AMD, `iris` para Intel, `llvmpipe` para desenhar com o processador quando não há placa); a NVIDIA fornece o seu próprio driver proprietário. |
| **Driver do kernel** | O [kernel](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#espaco-de-usuario-vs-espaco-de-kernel) (o núcleo do sistema, o único autorizado a falar com o hardware) tem um driver por família de placas. O **[DRM](https://docs.kernel.org/gpu/drm-uapi.html)** (*Direct Rendering Manager*) é o subsistema que permite que vários programas compartilhem a placa; ele é exposto por arquivos em `/dev/dri`. |
| **Hardware** | A placa de vídeo, conectada ao barramento **PCI** (o circuito que liga a placa-mãe às suas placas de expansão). |

Cada camada pode ser observada a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (`grep` mantém apenas as linhas que contêm um padrão; o `|` envia a saída do comando da esquerda para o da direita: veja os [redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
lspci | grep -iE "vga|3d"              # lspci lista os dispositivos PCI: a(s) placa(s) de vídeo
ls /dev/dri                            # arquivos do DRM: cardN (um por placa), renderDN (cálculo sem tela)
lsmod | grep -E "amdgpu|i915|nouveau|nvidia"   # lsmod lista os drivers carregados no kernel
glxinfo -B | grep -i renderer          # glxinfo (pacote mesa-utils): o driver OpenGL realmente em uso
```

O `GL_RENDERER` empilha, aliás, várias dessas camadas em um único texto. Forma típica sob o Mesa, que se apoia no [LLVM](https://llvm.org/) (valores de exemplo):

```
AMD Radeon RX 6600 (radeonsi, navi23, LLVM 15.0.6, DRM 3.54, 6.1.0-18-amd64)
 │                  │        │       │               │        └ versão do kernel
 │                  │        │       │               └ versão do DRM
 │                  │        │       └ LLVM: biblioteca que compila os shaders para a placa
 │                  │        └ chip da placa
 │                  └ driver Mesa
 └ nome da placa
```

### Quando não há placa: `llvmpipe`

Numa [máquina virtual](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos), num [contêiner](/?c=infrastructure-devops&s=docker&p=concepts-de-base), no [WSL](https://learn.microsoft.com/pt-br/windows/wsl/) sem driver gráfico ou numa sessão remota, o Mesa recorre ao `llvmpipe`: o processador desenha no lugar da placa. O programa funciona, mas devagar, e o `GL_RENDERER` começa por `llvmpipe`. Dá para forçá-lo a fim de simular uma máquina sem placa, por meio de uma **variável de ambiente** (um ajuste com nome que o shell transmite aos programas que ele inicia, veja as [variáveis de ambiente](/?c=shells&s=bash&p=variables-denvironnement)):

```bash
LIBGL_ALWAYS_SOFTWARE=1 ./programa     # a variável vale apenas para esta execução
```

### Várias placas de vídeo

Um notebook costuma ter uma placa **integrada** (dentro do processador, econômica) e uma placa **dedicada** (potente). Por padrão o sistema escolhe a primeira; a outra é designada por variável de ambiente, durante uma única execução:

| Driver | Executar na placa dedicada |
|---|---|
| Mesa (AMD, Intel) | `DRI_PRIME=1 ./programa` |
| NVIDIA proprietário | `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia ./programa` |

As duas placas não têm os mesmos limites (`GL_MAX_TEXTURE_SIZE`...) nem a mesma versão do OpenGL: o que o programa lê na inicialização depende da placa que criou o contexto.

Medido em um notebook com duas placas (AMD integrada, NVIDIA dedicada), com um programa que pede um contexto OpenGL 3.3 «core» e lê `GL_RENDERER`, `GL_VERSION` e `GL_MAX_TEXTURE_SIZE`:

| Execução | `GL_RENDERER` | `GL_VERSION` | `GL_MAX_TEXTURE_SIZE` |
|---|---|---|---|
| padrão | `AMD Radeon 680M (radeonsi, rembrandt, LLVM 20.1.2, DRM 3.64, 7.0.0-34-generic)` | `4.6 (Core Profile) Mesa 25.2.8` | 16384 |
| `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia` | `NVIDIA GeForce RTX 3070 Laptop GPU/PCIe/SSE2` | `3.3.0 NVIDIA 595.91.07` | 32768 |
| `LIBGL_ALWAYS_SOFTWARE=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |
| `DRI_PRIME=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |

A placa muda tudo o que o programa lê, versão incluída (a NVIDIA devolve a versão pedida, o Mesa a mais alta que oferece). A última linha é uma armadilha: `DRI_PRIME=1` supõe que a placa dedicada também use um driver Mesa. Aqui ela é NVIDIA proprietária: o Mesa não consegue carregar `nvidia-drm` (mensagens `glx: failed to create dri3 screen` e `failed to load driver: nvidia-drm`) e **volta para `llvmpipe`** sem parar. Verificar `GL_RENDERER` em vez de acreditar que a placa dedicada está em uso.

### E no Windows e no macOS?

| Sistema | Quem fornece o OpenGL |
|---|---|
| **Linux** | As camadas acima (GLVND, Mesa ou driver NVIDIA, kernel). |
| **Windows** | O `opengl32.dll` redireciona para o driver do fabricante, instalado com os drivers da placa. Sem ele, o Windows recorre a uma versão por software limitada ao OpenGL 1.1. |
| **macOS** | O próprio sistema fornece o OpenGL, congelado na versão 4.1 e abandonado pela Apple. |

> **Armadilha:** um driver ausente ou antigo demais nem sempre provoca uma falha: `glfwCreateWindow` devolve `NULL`, ou `gladLoadGLLoader` falha, ou a versão lida é inferior à esperada. Convém mostrar a causa real do GLFW em vez de uma mensagem genérica:

```c
GLFWwindow *window = glfwCreateWindow(800, 600, "scop", NULL, NULL);

if (!window)                                /* driver ausente, antigo, ou versao pedida nao fornecida */
{
	const char *description = NULL;         /* texto do GLFW que explica a falha */

	glfwGetError(&description);             /* le o ultimo erro do GLFW (description pode ficar NULL) */
	fprintf(stderr, "nao foi possivel criar a janela: %s\n", description ? description : "causa desconhecida");
	return -1;
}
```

Medido pedindo OpenGL 9.9 (uma versão que não existe) sob X11: `fenetre impossible : GLX: Failed to create context: BadMatch (invalid parameter attributes)`.

Boa prática: testar nas duas placas de um notebook, e com `LIBGL_ALWAYS_SOFTWARE=1`, antes de dizer que o programa « funciona em qualquer lugar ».

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O GLFW cria a janela e seu contexto OpenGL; o GLAD então carrega as funções OpenGL modernas via `glfwGetProcAddress()`. O double buffering (`glfwSwapBuffers()`) evita que uma imagem desenhada pela metade seja exibida. Um loop de renderização repete: eventos, limpeza, desenho, troca de buffers. O delta time (duração da imagem anterior, via `glfwGetTime()`) torna as velocidades independentes dos FPS; o vsync (`glfwSwapInterval(1)`) ajusta a exibição à tela. Os limites da placa (tamanho de textura, de área de desenho) mudam de uma máquina para outra: eles são lidos; o OpenGL só sinaliza um erro por um indicador lido com `glGetError()`. `glGetString` identifica o driver; a memória da placa não tem consulta padrão (extensões); o tamanho da tela se pergunta ao GLFW. O OpenGL é apenas uma especificação: o código vem do driver do fabricante (Mesa ou NVIDIA no Linux), que fala com o kernel (DRM) e depois com a placa; sem placa, o `llvmpipe` desenha com o processador; com várias placas, uma variável de ambiente escolhe a placa. Um cronômetro por uso: a duração de uma imagem é recalculada a cada imagem, um fade se expressa pela sua duração. |
| **Ferramentas utilizáveis** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`, `glGetString`, `glfwGetPrimaryMonitor`/`glfwGetVideoMode`, `glfwExtensionSupported`, `glfwGetError`, `lspci`, `lsmod`, `glxinfo -B`, `LIBGL_ALWAYS_SOFTWARE`, `DRI_PRIME`. |
| **Armadilhas a evitar** | Chamar o GLAD antes de `glfwMakeContextCurrent()`. Apontar `-I` para o nível de pasta errado para os headers gerados pelo GLAD. Esquecer `glClear()` antes de redesenhar. Mover um objeto uma distância fixa por imagem. Atualizar o delta time apenas em intervalos regulares. Deixar um delta gigante depois de uma pausa. Supor um limite da placa em vez de lê-lo, chamar `glGetIntegerv` sem contexto ativo, ler um único erro em vez de esvaziar a pilha, repetir a mesma mensagem a cada imagem. Mostrar o resultado de `glGetString` sem testar `NULL`, tomar `GL_MAX_ELEMENTS_INDICES` por um limite, abrir uma janela maior que a tela, confundir coordenadas de tela e pixels numa tela HiDPI. Concluir que o programa funciona em qualquer lugar após testar uma única placa, ou não mostrar a causa de uma falha de `glfwCreateWindow`. Um mesmo cronômetro para a duração da imagem e o limitador de um fade (movimento até 40 vezes mais rápido sem vsync), um fade expresso em número de etapas. |
| **Boas práticas** | Vendorar um arquivo gerado de uma vez por todas (como o do GLAD) em vez de depender dele a cada build; reservar essa prática a arquivos que não mudam com regularidade. Expressar as velocidades em unidades por segundo, recalcular o delta time a cada imagem e limitá-lo; nunca se apoiar no vsync para regular a velocidade. Comparar uma imagem com o limite da placa antes de enviá-la, com uma mensagem que nomeie a imagem, suas dimensões e o limite. Repetir `glGetError()` até `GL_NO_ERROR` e nomear a etapa controlada. Registrar fabricante, placa e versão na inicialização para reconhecer a máquina de um relatório de bug; verificar o tamanho de janela pedido contra o da tela. Testar em cada placa de um notebook e com `LIBGL_ALWAYS_SOFTWARE=1`. Medir um movimento mantido em várias cadências, com e sem vsync. |
