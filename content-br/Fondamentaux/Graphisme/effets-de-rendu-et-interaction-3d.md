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

### A lei de Beer-Lambert: por que a opacidade segue uma exponencial

A linha `opacity += (1.0 - opacity) * ...` do loop acima acrescenta «o que falta cobrir» a cada passo: ela imita uma lei física, a lei de Beer-Lambert. Em um meio de densidade uniforme (névoa, fumaça, vidro fosco), cada fatia de mesma espessura absorve a mesma **fração** da luz que nela chega, e não a mesma quantidade. A parte da luz que atravessa (a **transmissão**) diminui, portanto, de forma exponencial com a espessura:

```text
transmissão  = exp(-densidade x espessura)   parte da luz que atravessa, entre 0 e 1
opacidade    = 1 - transmissão               parte retida: 1 - exp(-densidade x espessura)

densidade : absorção por unidade de espessura (2 = duas absorções por unidade atravessada)
```

`exp(x)` é a **função exponencial** ([ficha de referência](https://registry.khronos.org/OpenGL-Refpages/gl4/html/exp.xhtml)): o número e (cerca de 2,718281828) elevado à potência `x`. Ela vale 1 para `x = 0`, e `exp(-x)` se aproxima de 0 quando `x` cresce, sem jamais alcançá-lo nem tornar-se negativa. A opacidade permanece, portanto, sempre entre 0 e 1, por mais espesso ou denso que seja o meio. Para uma densidade de 2 (valores calculados por um script):

| Espessura | Transmissão `exp(-2 x espessura)` | Opacidade `1 - exp(-2 x espessura)` | Opacidade se apenas somássemos (`2 x espessura`) |
|---|---|---|---|
| 0 | 1,0000 | 0,0000 | 0 |
| 0,25 | 0,6065 | 0,3935 | 0,5 |
| 0,5 | 0,3679 | 0,6321 | 1 |
| 1 | 0,1353 | 0,8647 | 2 (impossível) |
| 2 | 0,0183 | 0,9817 | 4 (impossível) |
| 3 | 0,0025 | 0,9975 | 6 (impossível) |

Duas meias-espessuras se **multiplicam**: 0,3679 x 0,3679 = 0,1353, ou seja exatamente a transmissão da espessura 1 (0,135335 nos dois casos, com precisão de um milionésimo). É isso que torna o loop possível: atravessar a nuvem fatia por fatia e multiplicar as transmissões equivale a atravessar sua espessura total de uma só vez.

O loop acima aplica essa multiplicação passo a passo, mas substituindo `exp(-x)` por `1 - x`, uma boa aproximação somente quando `x` (aqui `densidade x passo`) é pequeno. Uma versão mais fiel soma a densidade ao longo de todo o raio (o total chama-se **espessura óptica**), depois aplica `exp` **uma única vez**, na saída:

```glsl
float cloud_opacity_beer(vec3 entry, vec3 dir, float thickness)   // mesmos parâmetros
{
	const int STEPS = 24;                             // número de passos, fixo
	float step_len = thickness / float(STEPS);        // comprimento de um passo
	float optica = 0.0;                               // espessura óptica acumulada
	for (int i = 0; i < STEPS && optica < 3.0; i++)   // 3.0: opacidade de cerca de 0,95
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;   // meio do passo i
		optica += density(p) * step_len * 4.0;                // soma, sem limitar
	}
	return 1.0 - exp(-optica);                        // um único exp, fora do loop
}
```

A saída antecipada testava `opacity < 0.95`; aqui, `1 - exp(-3)` vale 0,9502, daí o limite de 3 na espessura óptica. Comparação para uma densidade constante de 2 (o fator `4.0` igualado a 1, sem saída antecipada), com o resultado exato `1 - exp(-densidade x espessura)`:

| Espessura | Exato | Loop acima, 4 passos | Loop acima, 24 passos | Soma seguida de `exp`, 4 ou 24 passos |
|---|---|---|---|---|
| 0,5 | 0,6321 | 0,6836 | 0,6399 | 0,6321 |
| 1 | 0,8647 | 0,9375 | 0,8761 | 0,8647 |
| 2 | 0,9817 | 1,0000 | 0,9874 | 0,9817 |

A soma seguida de um `exp` dá o resultado exato qualquer que seja a finura do passo quando a densidade é constante; quando ela varia, o erro vem apenas da finura da amostragem. A armadilha da versão por passos é mais grave que essa diferença: com 4 passos, uma espessura de 3, a densidade constante de 2 e o fator `4.0` fixado em 1 como na comparação acima, o primeiro passo já soma `densidade x passo = 1,5`: a opacidade vale 1,5 desde a primeira volta, a saída antecipada interrompe o loop e devolve 1,5, uma opacidade impossível. Com `1.0 - exp(-optica)`, o resultado nunca sai do intervalo de 0 a 1.

> **Armadilha:** uma densidade negativa (uma função `density` mal limitada) dá `exp` de um número positivo, portanto uma opacidade negativa. Daí o `clamp(..., 0.0, 1.0)` em `density` mais acima: mantê-lo.

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

### Euler semi-implícito: por que a velocidade é atualizada antes da posição

A mola acima avança quadro a quadro: é uma **integração numérica**, uma simulação por pequenos passos em que `dt` (a duração de um quadro, em segundos, veja [o delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-delta-time-uma-velocidade-independente-da-maquina)) é o **passo de tempo**. A regra mais simples, o **método de Euler**, diz: «novo valor = valor antigo + variação por segundo x `dt`». Uma mola faz evoluir dois valores ao mesmo tempo, sua posição `pos` e sua velocidade `vel`, e a ordem das duas atualizações muda o resultado:

| Método | Ordem no passo | O que cada linha lê |
|---|---|---|
| Euler **explícito** | `pos += vel x dt`, depois `vel += accel x dt` | As duas linhas leem o estado do **início** do passo |
| Euler **semi-implícito** (o da mola acima) | `vel += accel x dt`, depois `pos += vel x dt` | A posição lê a velocidade **já atualizada**: um valor do fim do passo, daí «meio implícito» |

O teste: uma mola **sem amortecimento**, puxada até 1 e solta. Na física ela oscila eternamente com a mesma amplitude, pois sua **energia** nunca muda. A energia é a soma da energia do movimento (`0,5 x vel x vel`) e da energia do alongamento (`0,5 x stiffness x pos x pos`); aqui, 2 no início. Um bom método deve mantê-la aproximadamente constante.

```c
#include <stdio.h>                                  /* printf */

typedef struct s_spring
{
	float	pos;   /* desvio em relação à posição de repouso */
	float	vel;   /* velocidade de variação de pos, em unidades por segundo */
}	t_spring;

void	passo_explicito(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* força de restituição (sem alvo nem atrito aqui) */
	s->pos += s->vel * dt;         /* a posição primeiro, com a velocidade ANTIGA */
	s->vel += accel * dt;          /* depois a velocidade, com a posição antiga */
}

void	passo_semi_implicito(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* força de restituição, calculada uma única vez */
	s->vel += accel * dt;          /* a velocidade primeiro... */
	s->pos += s->vel * dt;         /* ...depois a posição, com a NOVA velocidade */
}

float	energia(t_spring s, float stiffness)
{
	/* energia de movimento + energia de alongamento */
	return (0.5f * s.vel * s.vel + 0.5f * stiffness * s.pos * s.pos);
}

int	main(void)
{
	t_spring	a = {1.0f, 0.0f};   /* mola puxada até 1, solta sem velocidade */
	t_spring	b = {1.0f, 0.0f};   /* mesma partida para o segundo método */
	int			n;

	for (n = 1; n <= 10000; n++)
	{
		passo_explicito(&a, 4.0f, 0.016f);        /* rigidez 4, passo de 16 ms */
		passo_semi_implicito(&b, 4.0f, 0.016f);   /* mesmos valores */
		if (n == 1 || n == 100 || n == 1000 || n == 10000)
			printf("passo %5d : explícito %.4f, semi-implícito %.4f\n",
				n, energia(a, 4.0f), energia(b, 4.0f));
	}
	return (0);
}
```

Saída real do programa (compilado com `gcc -Wall -Wextra`):

```text
passo     1 : explícito 2.0020, semi-implícito 1.9980
passo   100 : explícito 2.2155, semi-implícito 1.9963
passo  1000 : explícito 5.5657, semi-implícito 1.9708
passo 10000 : explícito 55710.1133, semi-implícito 2.0244
```

| Método | Energia após 10 000 passos (início: 2) | O que acontece |
|---|---|---|
| Euler explícito | 55710,1133 | Cada passo multiplica a energia por `1 + stiffness x dt x dt` (aqui 1,001024): a mola **ganha** energia e suas oscilações crescem sem fim |
| Euler semi-implícito | 2,0244 (entre 1,9685 e 2,0325 em toda a duração) | A energia **oscila** em torno de 2 sem derivar: a amplitude permanece estável pelo tempo que for preciso |

O fator do explícito se verifica: 1,001024 elevado à potência 1000 dá 2,7829, e 5,5657 / 2 dá de fato 2,7829. Um erro minúsculo por passo (0,1 %), repetido a cada quadro, torna-se enorme em alguns minutos. Com o amortecimento da seção anterior, o defeito persiste: com rigidez 4 e amortecimento 0,01 (mesmo passo), a energia medida após 10 000 passos vale 11240 no explícito, enquanto o atrito deveria apagá-la, e 0,41 no semi-implícito, que a apaga bem. É por isso que `spring_update` atualiza `vel` **antes** de `pos`, e por que a ordem das duas linhas não se troca «porque dá no mesmo».

O teto sobre `dt` continua necessário, mesmo no semi-implícito: esse método só é estável se `dt` for inferior a `2 / sqrt(stiffness)` (`sqrt`: a raiz quadrada). Para uma rigidez de 400, o limite medido por dicotomia (divide-se o intervalo ao meio até encontrá-lo) é 0,10000, ou seja `2 / sqrt(400)`. A função abaixo mede o maior desvio atingido em 200 passos (`isnan` testa se um valor é `NaN`, *Not a Number*, o resultado de um cálculo impossível como `inf - inf`, em que `inf` é o infinito):

```c
#include <math.h>                         /* fabsf: valor absoluto; isnan */

/* usa t_spring e passo_semi_implicito, definidos acima */
float	pos_max(float stiffness, float dt, int steps)
{
	t_spring	s = {1.0f, 0.0f};   /* partida: puxada até 1, sem velocidade */
	float		maior = 1.0f;       /* maior desvio visto, 1 no início */
	int			i;

	for (i = 0; i < steps; i++)
	{
		passo_semi_implicito(&s, stiffness, dt);   /* um passo do método */
		if (isnan(s.pos))                          /* explodiu: paramos */
			return (s.pos);
		if (fabsf(s.pos) > maior)                  /* novo recorde de desvio */
			maior = fabsf(s.pos);
	}
	return (maior);
}
```

| `dt` (rigidez 400) | Maior desvio em 200 passos | Veredito |
|---|---|---|
| 0,016 (um quadro a 60 por segundo) | 1,01305 | Estável |
| 0,050 (o teto da mola acima) | 1 | Estável |
| 0,090 | 2,29416 | Amplitude inflada |
| 0,099 | 7,08858 | Logo abaixo do limite de 0,1: muito inflada |
| 0,101 | 1,4314e+25 | Logo acima: divergência |
| 0,110 | `NaN` (exibido `-nan`) | Explodiu |
| 1,000 (um segundo de pausa) | `NaN` (exibido `-nan`) | Explodiu |

O teto de 0,05 é portanto seguro enquanto a rigidez ficar abaixo de 1600 (`2 / 0,05` = 40, e 40 ao quadrado = 1600); com uma mola mais rígida, é preciso baixar o teto.

> **Armadilha:** inverter as duas linhas de atualização não produz nenhum erro nem aviso: a mola parece funcionar, e só depois de segundos ou minutos, ou com um amortecimento fraco, a oscilação ganha amplitude. Manter `vel` antes de `pos`, depois limitar `dt` levando em conta a rigidez.

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
| **Para lembrar** | A aberração cromática simula a dispersão da luz calculando a refração 3 vezes (uma por canal de cor), com um índice de refração ligeiramente diferente a cada vez. Uma animação procedural recalcula uma posição a cada quadro via uma fórmula que depende do tempo real decorrido, sem dados externos. O picking do mouse converte um clique 2D em um raio 3D via as matrizes de projeção/visão invertidas, na ordem inversa da renderização normal. O reflexo de Fresnel (aproximação de Schlick) faz crescer a parte refletida com o ângulo de viés. O ray-marching acumula uma densidade em pequenos passos para uma nuvem interior, e a lei de Beer-Lambert (`opacidade = 1 - exp(-densidade x espessura)`) mantém a opacidade entre 0 e 1. Um objeto transparente é desenhado depois dos opacos, em duas passagens (dorso e depois frente) com `GL_SRC_ALPHA`. Uma mola amortecida alcança seu alvo sem saltos, avançada por Euler semi-implícito (a velocidade é atualizada antes da posição, o que mantém a energia estável onde o Euler explícito ganha energia a cada passo), e `tanh` limita uma deformação com suavidade. O mapeamento triplanar texturiza um objeto sem UV projetando segundo os três eixos. |
| **Ferramentas utilizáveis** | Um cubemap para o ambiente refratado e refletido, `reflect`, `mix`, `pow`, `exp` para a atenuação de Beer-Lambert. `glBlendFunc`, `glCullFace`, `glFrontFace` para a transparência. Uma fórmula temporal (`sinf(tempo * velocidade)`) ou uma mola amortecida para animar. `tanhf` para limitar. Três leituras de textura ponderadas pela normal para o triplanar. A inversa das matrizes de projeção e visão para o picking. |
| **Armadilhas a evitar** | Uma diferença grande demais entre os índices de refração (resultado irreal). Animar conforme o número de quadros em vez do tempo real decorrido. Desenhar um transparente antes dos opacos, ou inverter a ordem dos vértices (objeto preto ou vazio, sem erro). Uma mola sem teto no passo de tempo (divergência, `NaN`). Um `ray-marching` com passos demais (custo por pixel). Uma soma de opacidade sem `exp` (ela ultrapassa 1). Duas linhas de atualização da mola na ordem errada (a oscilação cresce sem erro visível). |
| **Boas práticas** | Manter os índices de refração próximos uns dos outros para um resultado crível. Sempre basear uma animação no tempo real, nunca no número de quadros decorridos. Somar a densidade ao longo do raio e aplicar `1.0 - exp(-optica)` uma única vez. Atualizar `vel` antes de `pos`, limitar `dt` abaixo de `2 / sqrt(stiffness)` em uma mola e recusar um limite nulo ou negativo para `tanh`. Com um objeto preto, testar primeiro sem `GL_CULL_FACE`. |
