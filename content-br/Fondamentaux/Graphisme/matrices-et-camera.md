---
order: 5
---

# Matrizes e câmera

O [capítulo anterior](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) envia vértices à placa de vídeo, mas eles aparecem como estão, chapados. Para **mover** um objeto, **girá-lo** e **vê-lo em perspectiva** a partir de uma câmera, são necessárias **matrizes**. Este capítulo constrói as três matrizes de uma renderização 3D, a câmera, a perspectiva, a rotação em torno de um eixo qualquer e o cálculo que enquadra automaticamente um objeto.

> **Pré-requisitos:** uma [matriz](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) é uma tabela de números, e multiplicar uma matriz por um [vetor](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) dá um novo vetor. Aqui, cada matriz **transforma** um ponto: ela o desloca, o gira ou o achata em direção à tela.

## Do objeto à tela: model, view, projection

Um vértice muda de **referencial** (sistema de coordenadas) quatro vezes antes de chegar a um pixel. Três matrizes fazem essas mudanças:

| Matriz | Nome usual | Passa de... para... | Contém |
|---|---|---|---|
| **M** | *model* (modelo) | o objeto → o **mundo** | Posição, rotação e escala deste objeto |
| **V** | *view* (vista) | o mundo → a **câmera** | Onde a câmera está e para onde olha |
| **P** | *projection* (projeção) | a câmera → a **tela** | Perspectiva (objetos distantes encolhem) |

```text
vértice do objeto      referencial do mundo  referencial da câmera   coordenadas de tela
  (x, y, z, 1)  --M-->   (mundo)     --V-->    (câmera)       --P-->   (clip → NDC)
```

“Clip” é o resultado bruto de `P`; ele passa a coordenadas de tela (NDC) após a divisão descrita na seção sobre a perspectiva.

O vertex shader (o [programa executado para cada vértice](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), visto no capítulo anterior) calcula `P * V * M * vértice`: lê-se **da direita para a esquerda** (primeiro M, depois V, depois P). Inverter a ordem dá um resultado errado, sem nenhum erro.

**Por que matrizes 4×4 para pontos 3D?** Um ponto `(x, y, z)` é escrito `(x, y, z, 1)`, em **coordenadas homogêneas** ([explicação](https://en.wikipedia.org/wiki/Homogeneous_coordinates)). A quarta coluna da matriz serve então para **transladar** (deslocar), algo que uma matriz 3×3 não sabe fazer. O quarto número também serve para a perspectiva (veja abaixo).

| Transformação | Matriz 4×4 (linhas) |
|---|---|
| **Translação** de `(tx, ty, tz)` | `1 0 0 tx` / `0 1 0 ty` / `0 0 1 tz` / `0 0 0 1` |
| **Escala** de `(sx, sy, sz)` | `sx 0 0 0` / `0 sy 0 0` / `0 0 sz 0` / `0 0 0 1` |
| **Rotação** de `a` em torno de Z | `cos a  -sin a  0 0` / `sin a  cos a  0 0` / `0 0 1 0` / `0 0 0 1` |

`cos a` e `sin a` são o **cosseno** e o **seno** do ângulo `a`, expresso aqui em **radianos** (uma unidade de ângulo: 180° valem π ≈ 3,14 rad e 90° valem ≈ 1,57 rad): dois números entre -1 e 1 que dão o ponto `(cos a, sin a)` alcançado ao girar `a` a partir de `(1, 0)` sobre uma circunferência de raio 1.

> **Cilada (ordem dos elementos na memória):** o OpenGL espera a matriz **coluna por coluna** (*column-major*): o elemento da linha `r` e da coluna `c` está no índice `c * 4 + r` do vetor de 16 `float`. A tabela acima se lê, portanto, `m[12]`, `m[13]`, `m[14]` para `tx`, `ty`, `tz`. Ela é enviada com `glUniformMatrix4fv(loc, 1, GL_FALSE, m)`; o `GL_FALSE` significa “não **transpor**” (trocar linhas e colunas, veja a [transposta](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transposee-echanger-lignes-et-colonnes)), porque o vetor já está na ordem certa. Uma matriz escrita linha por linha e enviada como está produz um objeto deformado ou ausente.

## A câmera: `look_at`

Uma câmera não existe de verdade: **move-se o mundo no sentido contrário**. A matriz de vista coloca a câmera na origem, voltada para o eixo **-Z**. Ela é construída a partir de três informações: a posição do olho (`eye`), o ponto olhado (`target`) e a direção para cima (`up`, geralmente `(0, 1, 0)`).

Duas operações vetoriais se repetem. **Normalizar** um vetor é dividi-lo pelo seu comprimento para que ele valha 1, mantendo sua direção (`(0, 3, 4)` vira `(0, 0,6, 0,8)`). O **produto vetorial** `a x b` de dois vetores é um terceiro vetor **perpendicular** (em ângulo reto) aos dois, nulo se `a` e `b` forem paralelos (`(1, 0, 0) x (0, 1, 0) = (0, 0, 1)`). O **produto escalar** (`vdot`, visto no [capítulo sobre vetores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) vale 0 para dois vetores perpendiculares.

```text
f = normalizar(target - eye)     frente: para onde a câmera olha
s = normalizar(f x up)           direita: perpendicular a f e a up  (x = produto vetorial)
u = s x f                        cima real: perpendicular aos outros dois
```

Essas três direções, perpendiculares entre si, formam as linhas da matriz de vista; a última coluna anula a posição do olho.

Um valor `NaN` (*Not a Number*) é o resultado especial de um `float` para um cálculo impossível (`0 / 0`): ele atravessa todos os cálculos seguintes sem erro ([detalhes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)). Daí o teste escrito `!(len > 1e-6f)` em vez de `len <= 1e-6f`: o primeiro rejeita também `NaN`, o segundo o deixa passar.

```c
typedef struct { float x, y, z; } Vec3;

/* Normaliza v. Devolve 0 (e não toca em nada) se seu comprimento for quase nulo. */
static int vnormalize(Vec3 *v)
{
	float len = sqrtf(v->x * v->x + v->y * v->y + v->z * v->z);

	if (!(len > 1e-6f))                      /* a forma “!(a > b)” rejeita também NaN */
		return 0;
	v->x /= len;
	v->y /= len;
	v->z /= len;
	return 1;
}

/* Matriz de vista (coluna por coluna). Devolve 0 se o olho estiver sobre o alvo ou se
   a direção do olhar for paralela a “up”: a direita fica então indefinida. */
int look_at(float m[16], Vec3 eye, Vec3 target, Vec3 up)
{
	Vec3 f = vsub(target, eye);              /* vsub, vcross, vdot: cálculos vetoriais básicos */
	Vec3 s, u;

	if (!vnormalize(&f))
		return 0;
	s = vcross(f, up);
	if (!vnormalize(&s))
		return 0;
	u = vcross(s, f);
	memset(m, 0, 16 * sizeof(float));
	m[0] = s.x;  m[4] = s.y;  m[8]  = s.z;   m[12] = -vdot(s, eye);
	m[1] = u.x;  m[5] = u.y;  m[9]  = u.z;   m[13] = -vdot(u, eye);
	m[2] = -f.x; m[6] = -f.y; m[10] = -f.z;  m[14] =  vdot(f, eye);
	m[15] = 1.0f;
	return 1;
}
```

Verificação por execução, com `eye = (3, 2, 5)` e `target = (1, 0, 0)`: o olho passa a `(0, 0, 0)` e o alvo a `(0, 0, -5,74)`, exatamente a distância que os separa, sobre o eixo -Z.

> **Cilada (o caso degenerado):** ao olhar **bem para cima ou bem para baixo** (`f` paralelo a `up`), o produto vetorial `f x up` vale zero e a normalização divide por zero: a matriz se enche de `NaN` e a tela fica vazia. `look_at` deve **recusar** esse caso com uma mensagem precisa, ou o chamador deve então tomar outro `up` (por exemplo `(0, 0, 1)`). O mesmo vale se `eye == target`.

## A perspectiva

A matriz de projeção achata o volume visível, uma **pirâmide truncada** (o *frustum*), dentro de um cubo. Quatro parâmetros a definem:

| Parâmetro | Papel | Domínio válido |
|---|---|---|
| `fov` | Ângulo de abertura **vertical** (*field of view*), em radianos | `0 < fov < π` |
| `aspect` | Largura / altura da janela | `aspect > 0` |
| `near` | Distância do plano **próximo**: o que está mais perto é cortado | `near > 0` |
| `far` | Distância do plano **distante**: o que está mais longe é cortado | `far > near` |

`tanf` calcula a **tangente** de um ângulo: quanto maior o ângulo de abertura, mais ela cresce, e mais “afastada” parece a cena. No Windows, `<windows.h>` define `near` e `far` como **macros** (palavras que o pré-processador substitui por texto antes da compilação, veja [cabeçalhos e macros](/?c=langages&s=c&p=headers)): os parâmetros se chamam, portanto, `near_plane` e `far_plane`.

```c
/* Matriz de projeção em perspectiva (coluna por coluna). Devolve 0 se um parâmetro
   sair do seu domínio. */
int perspective(float m[16], float fov, float aspect, float near_plane, float far_plane)
{
	float f;

	if (!(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f)
		|| !(near_plane > 0.0f) || !(far_plane > near_plane))
		return 0;
	f = 1.0f / tanf(fov / 2.0f);             /* grande ângulo de abertura: f pequeno, cena “afastada” */
	memset(m, 0, 16 * sizeof(float));
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far_plane + near_plane) / (near_plane - far_plane);
	m[11] = -1.0f;                           /* copia -z em w: é isso que cria a perspectiva */
	m[14] = 2.0f * far_plane * near_plane / (near_plane - far_plane);
	return 1;
}
```

**Onde está a perspectiva?** O resultado `(x, y, z, w)` de `P * V * M * vértice` ainda não é a tela: a placa de vídeo o divide por `w` (a **divisão de perspectiva**). Como `m[11] = -1`, `w` vale a **distância** até a câmera: quanto mais longe um ponto, mais se divide, mais ele encolhe. Após a divisão, `z` fica entre -1 (plano próximo) e +1 (plano distante), é o espaço **NDC** (*normalized device coordinates*). Medido com `near = 0,1` e `far = 100`: um ponto em `z = -0,1` dá -1, um ponto em `z = -100` dá +1.

> **Cilada (as violações do domínio):** cada uma quebra a imagem **sem erro do OpenGL**.
>
> | Violação | Consequência |
> |---|---|
> | `near = 0` | Divisão por zero: matriz infinita, nada na tela |
> | `near > far` | Profundidade invertida: o objeto distante passa na frente |
> | `fov = π` ou `0` | `tan` infinita ou nula: imagem vazia |
> | `aspect = 0` (janela reduzida a uma linha) | Divisão por zero |
> | `near` minúsculo | Profundidade **inutilizável**: em `z = -50`, a profundidade normalizada já vale 0,998, então quase todo o objeto cai sobre poucos valores vizinhos, e duas superfícies próximas “brigam” (*z-fighting*, cintilação) |
>
> Para `near` e `far`, é melhor uma razão `far / near` razoável (alguns milhares no máximo) do que um `near` “o menor possível”.

Um cálculo como `near = distância - raio` pode valer 0 (ou até ficar negativo) quando a câmera encosta no objeto: a seção sobre o enquadramento, mais abaixo, explica o remédio.

## Girar um objeto: a rotação acumulada

Para uma rotação com o mouse, a tentação é manter o objeto orientado por **uma única matriz 3×3** `R` e, a cada imagem, multiplicá-la por uma pequena rotação `d`: `R = d * R`. Cada produto arredonda os `float`; as três linhas de `R`, que deveriam continuar perpendiculares e de comprimento 1 (diz-se que a matriz é **ortonormal**), **derivam** lentamente: a matriz deforma (inclina, estica) o objeto em vez de apenas girá-lo.

| Número de pequenas rotações (0,01 rad) | Desvio medido em relação a uma rotação verdadeira |
|---|---|
| 100 | 0,000004 |
| 10 000 | 0,00014 |
| 100 000 | 0,0014 |
| 1 000 000 | 0,014 |

O remédio: **reortonormalizar** de vez em quando, isto é, endireitar as linhas (procedimento de **Gram-Schmidt**, [detalhes](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)).

```c
/* Endireita uma matriz de rotação 3×3 (linhas) que derivou: linhas de comprimento 1,
   perpendiculares. Após a chamada no caso acima, o desvio volta a 1e-7. */
void reorthonormalize(float r[3][3])
{
	Vec3 a = {r[0][0], r[0][1], r[0][2]};
	Vec3 b = {r[1][0], r[1][1], r[1][2]};
	Vec3 c;
	float d;

	vnormalize(&a);                          /* 1ª linha: comprimento 1 */
	d = vdot(b, a);
	b = (Vec3){b.x - d * a.x, b.y - d * a.y, b.z - d * a.z};   /* tira de b sua parte paralela a a */
	vnormalize(&b);
	c = vcross(a, b);                        /* 3ª linha: perpendicular às outras duas */
	r[0][0] = a.x; r[0][1] = a.y; r[0][2] = a.z;
	r[1][0] = b.x; r[1][1] = b.y; r[1][2] = b.z;
	r[2][0] = c.x; r[2][1] = c.y; r[2][2] = c.z;
}
```

> **Alternativa:** um **quaternion** ([apresentação](https://en.wikipedia.org/wiki/Quaternion)) representa uma rotação com 4 números em vez de 9 e é endireitado dividindo-o por sua norma (seu comprimento). Escolher uma matriz continua razoável desde que se reortonormalize.

## Girar em torno de um eixo qualquer: a fórmula de Rodrigues

Girar em torno de X, Y ou Z é simples (tabela acima). Para um **eixo qualquer** `k` (vetor de comprimento 1) e um ângulo `θ`, a **fórmula de Rodrigues** ([detalhes](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula)) dá a matriz diretamente:

| Termo | Valor (com `c = cos θ`, `s = sin θ`, `t = 1 - c`) |
|---|---|
| Diagonal | `c + t·k.x²`, `c + t·k.y²`, `c + t·k.z²` |
| Fora da diagonal | `t·k.a·k.b` mais ou menos `s·k.c`, onde `c` é o **terceiro** eixo (a, b, c = x, y, z em ordem cíclica); os sinais são os do código abaixo |

```c
/* Rotação de ângulo “angle” (radianos) em torno de “axis” (normalizado aqui), linhas r[linha][coluna]. */
void rotation_from_axis_angle(float r[3][3], Vec3 axis, float angle)
{
	float c = cosf(angle), s = sinf(angle), t = 1.0f - c;
	Vec3 k = axis;

	vnormalize(&k);
	r[0][0] = c + t * k.x * k.x;        r[0][1] = t * k.x * k.y - s * k.z;  r[0][2] = t * k.x * k.z + s * k.y;
	r[1][0] = t * k.x * k.y + s * k.z;  r[1][1] = c + t * k.y * k.y;        r[1][2] = t * k.y * k.z - s * k.x;
	r[2][0] = t * k.x * k.z - s * k.y;  r[2][1] = t * k.y * k.z + s * k.x;  r[2][2] = c + t * k.z * k.z;
}
```

Verificação: 90° em torno de `(0, 0, 1)` leva `(1, 0, 0)` a `(0, 1, 0)` (a menos do ruído de arredondamento: `-4e-8`).

> **Cilada:** o eixo deve ter **comprimento 1**, senão a matriz deixa de ser uma rotação. A função o normaliza sozinha; um eixo nulo (`(0, 0, 0)`) continua nulo e produz uma matriz errada, a recusar antes.

## Recuperar o eixo e o ângulo de uma rotação

A operação inversa, útil para comparar duas orientações ou animar entre elas, extrai o ângulo do **traço** (a soma dos elementos da diagonal, `r00 + r11 + r22`, onde `rij` é o elemento da linha `i` e da coluna `j`, contando a partir de 0) e o eixo das diferenças entre elementos simétricos em relação à diagonal (`r21 - r12`, ...). `acos` (arco cosseno) recupera o ângulo cujo cosseno se conhece, mas só aceita valores entre -1 e 1:

| Etapa | Fórmula |
|---|---|
| Ângulo | `θ = acos((r00 + r11 + r22 - 1) / 2)` |
| Eixo (caso geral) | `k` tem a direção de `(r21 - r12, r02 - r20, r10 - r01)`, depois normalizado |

Três ciladas, todas encontradas na prática:

| Caso | Problema | Remédio |
|---|---|---|
| O resultado de `(traço - 1) / 2` passa de 1 em `1e-7` | `acos` devolve `NaN` | **Limitar** o valor a `[-1, 1]` antes do `acos` |
| `θ ≈ 0` | O eixo é **indefinido** (nenhuma rotação: qualquer eixo serve) | Devolver um eixo padrão e sinalizar “sem rotação” |
| `θ ≈ 180°` | `sin θ ≈ 0`: o vetor `(r21 - r12, ...)` se anula, o eixo vira ruído | Usar `(R + I) / 2 = k·kᵀ`: a coluna de maior diagonal vale `k_i · k` |

Na última linha, `I` é a **matriz identidade** (uns na diagonal, zeros no resto: ela não muda nada) e `k·kᵀ` a matriz 3×3 cujo elemento `(i, j)` vale `k_i · k_j`.

```c
/* Extrai eixo e ângulo de uma rotação 3×3. Devolve 0 se o ângulo for quase nulo (eixo arbitrário). */
int axis_angle_from_rotation(float r[3][3], Vec3 *axis, float *angle)
{
	float cos_a = (r[0][0] + r[1][1] + r[2][2] - 1.0f) / 2.0f;
	Vec3 k;

	if (cos_a > 1.0f)                        /* o arredondamento pode sair de [-1, 1] */
		cos_a = 1.0f;
	if (cos_a < -1.0f)
		cos_a = -1.0f;
	*angle = acosf(cos_a);
	k = (Vec3){r[2][1] - r[1][2], r[0][2] - r[2][0], r[1][0] - r[0][1]};
	if (*angle < 1e-4f) {
		*axis = (Vec3){0.0f, 0.0f, 1.0f};
		return 0;
	}
	if (3.14159265f - *angle < 1e-3f) {      /* meia-volta: essas diferenças se anulam */
		int i = 0;

		for (int d = 1; d < 3; d++)          /* coluna de maior diagonal: a mais confiável */
			if (r[d][d] > r[i][i])
				i = d;
		k = (Vec3){(r[0][i] + (i == 0)) / 2.0f, (r[1][i] + (i == 1)) / 2.0f,
			(r[2][i] + (i == 2)) / 2.0f};
	}
	vnormalize(&k);
	*axis = k;
	return 1;
}
```

Testado com 4 eixos (entre eles `(0, 0, -1)` e `(-1, 0, 0)`) e 6 ângulos (de `1e-5` a `π`): o eixo recuperado é o certo, **a menos do sinal** (a 180°, um eixo e seu oposto descrevem a mesma rotação). A 0°, nenhum eixo é definido: a função sinaliza isso.

## Enquadrar automaticamente um objeto

Para que um objeto qualquer **caiba na imagem** ao ser carregado, calcula-se a **caixa envolvente** (*bounding box*): a menor caixa, de faces paralelas aos eixos, que contém todos os vértices (`min` e `max` em cada coordenada). Dela se deduz uma **esfera envolvente**:

| Valor | Cálculo |
|---|---|
| Centro (o ponto a olhar, `target`) | `(min + max) / 2` |
| Raio | A metade da diagonal (do canto `min` ao canto `max`): `norma(max - min) / 2` |
| Distância da câmera | `raio / sin(meio-ângulo)`: a esfera toca então as bordas da imagem |
| `far` | `distância + raio` |
| `near` | `distância - raio`, **limitado** por um mínimo (ex. `far × 0,001`) |

O **meio-ângulo** é o da dimensão mais **estreita**: se a janela for mais alta que larga (`aspect < 1`), é o ângulo horizontal `atan(tan(fov / 2) × aspect)` que limita, e não `fov / 2` (`atan`, o arco tangente, é o inverso de `tan`).

```c
/* Distância e planos para enquadrar uma esfera de raio “radius”. Devolve 0 se um parâmetro
   estiver fora do domínio (raio nulo: objeto reduzido a um ponto, nada a enquadrar). */
int frame_sphere(float radius, float fov, float aspect,
	float *distance, float *near_plane, float *far_plane)
{
	float half_v = fov / 2.0f;
	float half_h = atanf(tanf(half_v) * aspect);   /* meio-ângulo horizontal */
	float half = fminf(half_v, half_h);            /* o mais estreito dos dois */

	if (!(radius > 0.0f) || !(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f))
		return 0;
	*distance = radius / sinf(half);
	*far_plane = *distance + radius;
	*near_plane = fmaxf(*distance - radius, *far_plane * 1e-3f);   /* nunca ≤ 0 */
	return 1;
}
```

Exemplo com números: raio 2, `fov = 1` rad, `aspect = 0,5` (janela duas vezes mais alta que larga): meio-ângulo retido 0,267 rad (o horizontal), distância 7,59, `near = 5,59`, `far = 9,59`.

> **Cilada (o vértice fantasma):** um único vértice que **nenhuma face usa** (resto de uma exportação, uma linha `v` esquecida) aumenta a caixa: o centro se desloca, o raio infla, o objeto aparece minúsculo e mal centralizado. Calcular a caixa **sobre os vértices realmente usados**, ou remover antes os vértices órfãos.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Três matrizes: M (objeto → mundo), V (mundo → câmera), P (câmera → tela), aplicadas da direita para a esquerda (`P * V * M * vértice`). O OpenGL lê as matrizes **coluna por coluna**. A vista é construída com `look_at` (frente, direita, cima); a perspectiva divide por `w` e exige `0 < near < far`, `0 < fov < π`, `aspect > 0`. Uma rotação acumulada deriva: ela é endireitada. Rodrigues dá a rotação em torno de um eixo qualquer; a extração eixo/ângulo tem dois casos-limite (0° e 180°). O enquadramento vem da esfera envolvente. |
| **Ferramentas utilizáveis** | `glUniformMatrix4fv`, `tanf`/`atanf`/`acosf`, produto vetorial e escalar. Documentação: [Viewing and Transformations](https://www.khronos.org/opengl/wiki/Viewing_and_Transformations), [Rodrigues](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula), [coordenadas homogêneas](https://en.wikipedia.org/wiki/Homogeneous_coordinates). |
| **Ciladas a evitar** | Matriz enviada linha por linha, ordem `M * V * P` invertida. `look_at` olhando para cima (produto vetorial nulo, `NaN`). `near = 0` ou `near > far` (matriz infinita, profundidade invertida), `near` minúsculo (profundidade achatada, cintilação). Rotação acumulada nunca endireitada. `acos` de um valor ligeiramente acima de 1. Eixo de uma rotação de 0° ou 180° lido sem caso particular. Caixa envolvente falseada por um vértice órfão. |
| **Boas práticas** | Validar cada parâmetro (`!(a > b)` rejeita também `NaN`) e nomear a causa na mensagem. Limitar antes do `acos`. Reortonormalizar uma rotação acumulada. Calcular `near` e `far` a partir do raio e limitá-los. Testar `look_at` e `perspective` nos casos-limite antes de ligá-los à renderização. |
