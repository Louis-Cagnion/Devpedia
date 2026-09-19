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

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O GLFW cria a janela e seu contexto OpenGL; o GLAD então carrega as funções OpenGL modernas via `glfwGetProcAddress()`. O double buffering (`glfwSwapBuffers()`) evita que uma imagem desenhada pela metade seja exibida. Um loop de renderização repete: eventos, limpeza, desenho, troca de buffers. |
| **Ferramentas utilizáveis** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`. |
| **Armadilhas a evitar** | Chamar o GLAD antes de `glfwMakeContextCurrent()`. Apontar `-I` para o nível de pasta errado para os headers gerados pelo GLAD. Esquecer `glClear()` antes de redesenhar. |
| **Boas práticas** | Vendorar um arquivo gerado de uma vez por todas (como o do GLAD) em vez de depender dele a cada build; reservar essa prática a arquivos que não mudam com regularidade. |
