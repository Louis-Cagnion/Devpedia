---
order: 6
---

# Efeitos de renderização e interação 3D

Uma vez que uma cena é carregada (o [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) e exibida ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), quatro necessidades aparecem com frequência: enriquecer visualmente a renderização (um objeto de vidro, por exemplo), animá-la sem dados externos, revestir um objeto que não tem coordenadas de textura, e permitir que o usuário interaja com a cena pelo mouse. Este capítulo cobre essas quatro necessidades.

## A aberração cromática: um efeito de pós-processamento

A luz branca que atravessa um material refrativo (vidro, água) não se desvia exatamente da mesma forma conforme sua cor: é a **aberração cromática**, visível em fotografia como uma franja colorida nos contornos de alto contraste. Um motor de renderização pode simular esse efeito deliberadamente, em pós-processamento: em vez de calcular uma única vez a refração de um raio (veja [vetores e produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) para as bases do cálculo vetorial usado aqui), ela é calculada **três vezes**, uma por canal de cor, com um índice de refração ligeiramente diferente a cada vez:

```text
Raio incidente
      |
      v
  Refracao com IOR vermelho  -> amostra o canal VERMELHO do cubemap
  Refracao com IOR verde     -> amostra o canal VERDE do cubemap
  Refracao com IOR azul      -> amostra o canal AZUL do cubemap
      |
      v
Recombina os 3 canais -> o resultado final, com suas franjas coloridas
```

Um **cubemap** (uma textura composta de 6 imagens, uma por face de um cubo, representando o ambiente ao redor de um objeto) fornece a imagem refratada: cada um dos 3 raios, desviado de forma ligeiramente diferente, amostra esse mesmo cubemap em um ponto ligeiramente diferente, o que produz a separação de cores.

> **Boa prática:** manter os 3 índices de refração próximos uns dos outros (uma variação de alguns centésimos basta). Uma diferença grande demais produz um resultado que já não se parece com um vidro realista, mas sim com um artefato visual grosseiro.

## O reflexo de Fresnel: quanto mais de viés se olha, mais reflete

Em uma janela, um lago ou uma bolinha de vidro, a superfície deixa passar a luz quando se olha de frente, e age como um espelho quando se olha em ângulo rasante. É o **efeito de Fresnel**: a parte da luz **refletida** (devolvida) aumenta com o ângulo entre a direção do olhar e a **normal** (o vetor perpendicular à superfície, veja [buffers, texturas e shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)). O cálculo exato é pesado; a **aproximação de Schlick** (do nome de seu autor) basta em tempo real:

```text
F = F0 + (1 - F0) x (1 - cos(angulo))^5

F0     : parte refletida de frente (cerca de 0,04 para o vidro, ou seja, 4 %)
angulo : entre a normal e a direção para o olho; cos(angulo) = produto escalar dos dois
         (dois vetores de comprimento 1)
F      : parte refletida final, entre F0 (de frente) e 1 (totalmente de viés)
```

```glsl
vec3 n = normalize(world_normal);                    // normal da superfície, comprimento 1
vec3 v = normalize(camera_pos - world_pos);          // direção do ponto para o olho
float cos_angle = max(dot(n, v), 0.0);               // 1 de frente, 0 de viés
float fresnel = 0.04 + 0.96 * pow(1.0 - cos_angle, 5.0);   // pow(a, b): a elevado a b

vec3 mirrored = texture(env_map, reflect(-v, n)).rgb;      // o que o espelho devolve
vec3 final_color = mix(refracted_color, mirrored, fresnel);
```

`texture(env_map, direction)` lê o cubemap (declarado `uniform samplerCube env_map`) em uma direção, e `.rgb` extrai as três componentes vermelho, verde e azul do resultado (um `vec4`). `reflect(i, n)` é uma função GLSL que devolve a direção de um raio `i` depois de ricochetear em uma superfície de normal `n` (aqui `-v`, o raio que vai do olho ao ponto). `mix(a, b, t)` mistura dois valores: `a x (1 - t) + b x t`, ou seja `a` para `t = 0` e `b` para `t = 1`. O resultado: a cor refratada (a da seção anterior, com suas franjas) no centro da bolinha, e cada vez mais o ambiente refletido em direção às bordas.

## Uma nuvem no interior: o ray-marching

Para dar a um cristal um interior enevoado, nada é desenhado dentro dele: faz-se um raio **marchar** através do objeto em pequenos passos, e a cada passo acumula-se a **densidade** de uma função (0 = vazio, 1 = muito denso). É o **ray-marching** («marcha de raio»), que não deve ser confundido com o [raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage), que procura um único ponto de impacto.

```glsl
uniform float time;                                   // segundos decorridos, definidos pelo programa C

float density(vec3 p)                                 // densidade da nuvem no ponto p
{
	return clamp(sin(p.x * 3.0) * sin(p.y * 3.0 + time) * sin(p.z * 3.0), 0.0, 1.0);
}                                                     // clamp(x, 0.0, 1.0) limita x ao intervalo 0..1

float cloud_opacity(vec3 entry, vec3 dir, float thickness)   // dir: comprimento 1; thickness: espessura atravessada
{
	const int STEPS = 24;                             // número de passos, fixo
	float step_len = thickness / float(STEPS);
	float opacity = 0.0;                              // 0 = transparente, 1 = opaco
	for (int i = 0; i < STEPS && opacity < 0.95; i++)
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;      // meio do passo i
		opacity += (1.0 - opacity) * density(p) * step_len * 4.0; // soma o que falta cobrir
	}
	return opacity;
}
```

O resultado é misturado com a cor do vidro: `mix(glass_color, cloud_color, cloud_opacity(...))`.

| Escolha | Efeito | Custo ou armadilha |
|---|---|---|
| Número de passos (`STEPS`) | Quanto mais passos, mais fina é a nuvem | O custo é **por pixel**, multiplicado pelo número de passos: 24 passos em uma tela de 2 milhões de pixels dão quase 50 milhões de chamadas a `density` por quadro |
| Saída antecipada (`opacity < 0.95`) | É inútil continuar quando a nuvem já está quase opaca | Nenhum, e economiza passos |
| Deslocamento de meio passo (`+ 0.5`) | Amostra no meio do passo e não na sua borda | Sem ele, as faixas dos passos aparecem |
| Espessura atravessada | Um valor aproximado basta (por exemplo o diâmetro do objeto) | Calculá-la exatamente exige a interseção raio/objeto |

## Desenhar um objeto transparente

Um cristal deixa ver o que está atrás dele: sua cor precisa ser **misturada** com o que já está na tela. O OpenGL faz isso com o **blending** (mistura), ativado por `glEnable(GL_BLEND)`, com a fórmula escolhida por `glBlendFunc`:

```text
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) dá:

cor final = alpha x cor do fragmento + (1 - alpha) x cor já na tela

alpha: opacidade do fragmento, 4º valor da cor (vec4) devolvida pelo fragment shader;
       1 = opaco, 0 = invisível
```

Daí decorrem três regras.

- **Primeiro os objetos opacos.** O teste de profundidade (veja [a cadeia de desenho](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)) rejeita todo pixel situado atrás de um pixel já desenhado. Um vidro desenhado primeiro faria desaparecer o que está atrás dele: a mistura não teria nada para misturar. Os opacos são desenhados sem mistura, e depois a mistura é ativada para os transparentes.
- **Um cristal é desenhado em duas passagens: o interior e depois o exterior.** Uma bolinha de vidro tem uma face traseira (vista através do vidro) e uma face frontal. O **face culling** (descarte de faces) permite escolher qual delas a placa gráfica ignora: `glEnable(GL_CULL_FACE)`, depois `glCullFace(GL_FRONT)` ignora as faces frontais (desenha-se então o dorso do cristal), `glCullFace(GL_BACK)` ignora as faces traseiras (desenha-se a frente, por cima). Sem isso, faces frontais e traseiras se misturam em uma ordem qualquer e o resultado pisca.
- **A ordem dos vértices decide o que é uma face frontal.** Um triângulo está «de frente» quando seus vértices aparecem em sentido anti-horário na tela (ajuste padrão, `glFrontFace(GL_CCW)`). Uma malha cujos triângulos são listados no outro sentido tem suas faces frontais tomadas por faces traseiras: elas são descartadas na passagem errada, ou iluminadas com uma normal invertida, e o objeto aparece preto (o `max(dot(...), 0.0)` da iluminação cai para 0).

```c
glEnable(GL_CULL_FACE);                              /* descarte de faces ativado */
draw_opaque_objects();                               /* 1. os opacos, sem mistura */

glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);   /* fórmula de mistura acima */
glCullFace(GL_FRONT);                                /* 2. primeiro o dorso do cristal */
draw_crystal();
glCullFace(GL_BACK);                                 /* 3. depois sua frente, por cima */
draw_crystal();
glDisable(GL_BLEND);                                 /* para o quadro seguinte */
```

> **Armadilha:** um cristal que aparece preto ou pela metade vem quase sempre de um destes três ajustes (ordem opaco/transparente, face descartada, ordem dos vértices), sem nenhuma mensagem de erro: o OpenGL não sinaliza nada, faz o que lhe foi pedido. Teste primeiro com `GL_CULL_FACE` desativado: se o objeto reaparecer, é a ordem dos vértices.

## A animação procedural: recalcular em vez de reproduzir

Ao contrário de uma animação por **quadros-chave** (*keyframes*, posições gravadas de antemão e interpoladas), uma animação **procedural** recalcula a posição ou deformação de um objeto a cada quadro, a partir de uma fórmula que depende do tempo decorrido, sem nenhum dado externo:

```c
float altura = amplitude * sinf(tempo_decorrido * velocidade);
posicao.y = altura;   // faz um objeto "flutuar" para cima e para baixo, indefinidamente
```

Nenhum dado é armazenado para essa animação: ela é inteiramente determinada pela fórmula e pelo tempo decorrido, o que a torna trivial de manter indefinidamente (ao contrário de uma sequência de quadros-chave, necessariamente finita) e barata em memória.

> **Armadilha:** usar diretamente o número de quadros decorridos (`frame_count`) em vez de um tempo real decorrido (em segundos). Uma animação baseada no número de quadros roda mais rápido em uma máquina que exibe mais quadros por segundo, exatamente a mesma armadilha já vista para um [loop de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) baseado no tempo.

## Uma mola amortecida: um valor que alcança seu alvo com suavidade

Para que um valor (a escala de um objeto sobre o qual se passa o mouse, um deslocamento, uma deformação) alcance seu **alvo** sem um salto brusco, ele é ligado ao alvo por uma **mola**: quanto maior a diferença, mais ela puxa. Sozinha, uma mola oscilaria indefinidamente; um **amortecimento** (um atrito proporcional à velocidade) apaga aos poucos o movimento.

```c
typedef struct s_spring
{
	float pos;   /* valor atual */
	float vel;   /* velocidade de variação de pos, em unidades por segundo */
}	t_spring;

void	spring_update(t_spring *s, float target, float stiffness, float damping, float dt)
{
	float	accel;

	if (dt > 0.05f)
		dt = 0.05f;                                           /* passo limitado, veja abaixo */
	accel = stiffness * (target - s->pos) - damping * s->vel; /* puxa para o alvo, freia */
	s->vel += accel * dt;                                     /* primeiro a velocidade... */
	s->pos += s->vel * dt;                                    /* ...depois a posição */
}
```

`stiffness` (**rigidez**) mede a força de restituição por unidade de diferença; `damping` (**amortecimento**) a força de frenagem por unidade de velocidade; `dt` é o tempo decorrido desde o quadro anterior (veja [o delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-delta-time-uma-velocidade-independente-da-maquina)). O comportamento depende da relação entre os dois:

| Amortecimento | Comportamento |
|---|---|
| 0 | Oscila sem fim em torno do alvo |
| Baixo | Ultrapassa o alvo, quica, se apaga (efeito «elástico») |
| `2 x sqrt(stiffness)` (chamado **crítico**) | Alcança o alvo o mais rápido possível, sem ultrapassá-lo |
| Alto | Alcança o alvo lentamente, sem ultrapassá-lo |

> **Armadilha (o passo de tempo sem limite):** se um quadro dura muito (janela arrastada, programa suspenso por um segundo), `dt` é grande e o passo acima ultrapassa o alvo por mais que a diferença inicial: a cada quadro a diferença cresce, o valor diverge e acaba virando `inf` ou `NaN`. Daí o teto `dt <= 0.05` (50 ms): a mola recupera seu atraso ao longo de vários quadros em vez de explodir em um só.

## Limitar uma deformação com `tanh`

Uma deformação controlada pelo mouse ou por uma mola pode receber um valor arbitrariamente grande, e um objeto esticado por um fator de 1000 é inutilizável. `clamp` (cortar seco em um limite) a limita, mas cria um **cotovelo**: a deformação cresce e depois congela de uma vez. A **tangente hiperbólica**, `tanh` (em C `tanhf` de `<math.h>`, veja também [as funções de ativação](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) que a usam), é uma curva em S que fica próxima de `x` em torno de 0 e depois se achata suavemente rumo a -1 e 1:

```c
/* traz qualquer valor de volta ao intervalo ]-limit, limit[ ; limit > 0 */
float	soft_bound(float raw, float limit)
{
	return (limit * tanhf(raw / limit));
}
```

| `raw` (com `limit = 1`) | `soft_bound` |
|---|---|
| 0,1 | 0,0997 (quase inalterado) |
| 1 | 0,762 |
| 3 | 0,995 |
| 100 | 1,000 (satura) |

> **Armadilha:** um `limit` igual a 0 (divisão por zero) ou negativo (limites invertidos) dá `NaN` ou um resultado ao contrário: recusá-lo antes da chamada. E `tanhf` deixa passar um `NaN` de entrada tal qual: o limite protege de um valor enorme, não de um valor inválido.

## O mapeamento triplanar: uma textura sem coordenadas UV

Uma [textura](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) é aplicada graças às coordenadas `(u, v)` carregadas por cada vértice. Uma malha gerada por um programa, ou um `.obj` sem linhas `vt`, não as tem. O **mapeamento triplanar** (*triplanar mapping*) dispensa essas coordenadas: projeta a textura segundo **os três eixos** (uma projeção ao longo de x, uma ao longo de y, uma ao longo de z), usando duas das coordenadas da posição como `(u, v)`, e depois mistura os três resultados conforme a orientação da superfície.

```glsl
uniform sampler2D tex;                  // sampler2D: uma textura 2D que o shader pode ler
in vec3 world_pos;                      // posição do fragmento na cena
in vec3 world_normal;
out vec4 color;

void main()
{
	vec3 w = pow(abs(normalize(world_normal)), vec3(4.0));   // abs: valor absoluto de cada componente
	w /= (w.x + w.y + w.z);                                   // peso por eixo, soma igual a 1
	vec3 cx = texture(tex, world_pos.yz).rgb;                 // .yz: componentes y e z da posição, projeção ao longo de x
	vec3 cy = texture(tex, world_pos.xz).rgb;                 // ao longo de y
	vec3 cz = texture(tex, world_pos.xy).rgb;                 // ao longo de z
	color = vec4(cx * w.x + cy * w.y + cz * w.z, 1.0);
}
```

Uma face voltada para x (normal `(1, 0, 0)`) dá peso 1 à projeção ao longo de x: vê-se a textura de frente. Em uma face oblíqua, vários pesos são diferentes de zero e as projeções se fundem. Elevar à potência 4 estreita as zonas de mistura; do contrário a imagem fica borrada em todo lugar onde a normal não está alinhada.

O mesmo esquema serve para um motivo **calculado** em vez de lido de uma imagem, por exemplo tijolos: uma fiada em cada duas é deslocada meio tijolo, e as bordas de cada tijolo formam a junta.

```glsl
float brick(vec2 p)                                   // 1 = tijolo, 0 = junta
{
	p *= vec2(2.0, 4.0);                              // 2 tijolos de largura, 4 fiadas por unidade
	p.x += 0.5 * mod(floor(p.y), 2.0);                // floor: parte inteira; mod: resto da divisão
	vec2 f = fract(p);                                // fract: parte depois da vírgula, posição dentro do tijolo
	return step(0.06, f.x) * step(0.1, f.y);          // step(s, x): 0 se x < s, 1 caso contrário; 0 nas bordas
}

// em main(), no lugar das três leituras de textura:
float b = brick(world_pos.yz) * w.x + brick(world_pos.xz) * w.y + brick(world_pos.xy) * w.z;
color = vec4(mix(vec3(0.3), vec3(0.7, 0.3, 0.2), b), 1.0);   // cinza para a junta, ferrugem para o tijolo
```

| Vantagem | Limite |
|---|---|
| Nenhuma coordenada `(u, v)` a fornecer nem a consertar (sem emenda) | Três leituras de textura por pixel em vez de uma |
| Funciona em qualquer malha, mesmo deformada durante a execução | A textura não acompanha a superfície: em um objeto que gira ela fica fixa na cena, a menos que se use a posição dentro do objeto em vez da posição na cena |
| Nenhum esticamento visível nas faces paralelas aos eixos | Desfoque nas zonas de mistura, e um motivo orientado (letras) aparece às vezes invertido conforme a face |

## O picking do mouse: encontrar qual objeto 3D foi clicado

O **picking** responde a uma pergunta precisa: em qual objeto, em uma cena 3D, o usuário acabou de clicar, a partir de uma posição 2D (`x`, `y`) na tela? O princípio: transformar esse clique 2D em um **raio** no espaço 3D, e então testar qual objeto esse raio toca primeiro.

```text
Clique na tela (x, y)
      |
      v  inversa da matriz de projecao, depois da matriz de visao
Raio 3D, da camera em direcao a cena
      |
      v  intersecao raio/objeto (testa cada objeto da cena)
Objeto mais proximo tocado por esse raio -> objeto "clicado"
```

Concretamente, o clique 2D é primeiro convertido em coordenadas normalizadas (entre -1 e 1), depois a **inversa** da matriz de projeção traz esse ponto de volta ao espaço da câmera, e a **inversa** da matriz de visão o traz então de volta ao espaço do mundo: duas transformações invertidas, na ordem inversa daquela normalmente usada para exibir um objeto 3D na tela.

> **Nota:** esse mecanismo é o inverso exato do pipeline de renderização habitual (mundo → visão → projeção → tela), daí o uso de matrizes **inversas**, em ordem **inversa**.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A aberração cromática simula a dispersão da luz calculando a refração 3 vezes (uma por canal de cor), com um índice de refração ligeiramente diferente a cada vez. Uma animação procedural recalcula uma posição a cada quadro via uma fórmula que depende do tempo real decorrido, sem dados externos. O picking do mouse converte um clique 2D em um raio 3D via as matrizes de projeção/visão invertidas, na ordem inversa da renderização normal. O reflexo de Fresnel (aproximação de Schlick) faz crescer a parte refletida com o ângulo de viés. O ray-marching acumula uma densidade em pequenos passos para uma nuvem interior. Um objeto transparente é desenhado depois dos opacos, em duas passagens (dorso e depois frente) com `GL_SRC_ALPHA`. Uma mola amortecida alcança seu alvo sem saltos, e `tanh` limita uma deformação com suavidade. O mapeamento triplanar texturiza um objeto sem UV projetando segundo os três eixos. |
| **Ferramentas utilizáveis** | Um cubemap para o ambiente refratado e refletido, `reflect`, `mix`, `pow`. `glBlendFunc`, `glCullFace`, `glFrontFace` para a transparência. Uma fórmula temporal (`sinf(tempo * velocidade)`) ou uma mola amortecida para animar. `tanhf` para limitar. Três leituras de textura ponderadas pela normal para o triplanar. A inversa das matrizes de projeção e visão para o picking. |
| **Armadilhas a evitar** | Uma diferença grande demais entre os índices de refração (resultado irreal). Animar conforme o número de quadros em vez do tempo real decorrido. Desenhar um transparente antes dos opacos, ou inverter a ordem dos vértices (objeto preto ou vazio, sem erro). Uma mola sem teto no passo de tempo (divergência, `NaN`). Um `ray-marching` com passos demais (custo por pixel). |
| **Boas práticas** | Manter os índices de refração próximos uns dos outros para um resultado crível. Sempre basear uma animação no tempo real, nunca no número de quadros decorridos. Limitar `dt` em uma mola e recusar um limite nulo ou negativo para `tanh`. Com um objeto preto, testar primeiro sem `GL_CULL_FACE`. |
