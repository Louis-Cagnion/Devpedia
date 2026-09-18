---
order: 4
---

# Efeitos de renderização e interação 3D

Uma vez que uma cena é carregada (o [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) e exibida ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), três necessidades aparecem com frequência: enriquecer visualmente a renderização (um efeito de pós-processamento), animá-la sem dados externos, e permitir que o usuário interaja com ela pelo mouse. Este capítulo cobre essas três necessidades.

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

## A animação procedural: recalcular em vez de reproduzir

Ao contrário de uma animação por **quadros-chave** (*keyframes*, posições gravadas de antemão e interpoladas), uma animação **procedural** recalcula a posição ou deformação de um objeto a cada quadro, a partir de uma fórmula que depende do tempo decorrido, sem nenhum dado externo:

```c
float altura = amplitude * sinf(tempo_decorrido * velocidade);
posicao.y = altura;   // faz um objeto "flutuar" para cima e para baixo, indefinidamente
```

Nenhum dado é armazenado para essa animação: ela é inteiramente determinada pela fórmula e pelo tempo decorrido, o que a torna trivial de manter indefinidamente (ao contrário de uma sequência de quadros-chave, necessariamente finita) e barata em memória.

> **Armadilha:** usar diretamente o número de quadros decorridos (`frame_count`) em vez de um tempo real decorrido (em segundos). Uma animação baseada no número de quadros roda mais rápido em uma máquina que exibe mais quadros por segundo, exatamente a mesma armadilha já vista para um [loop de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) baseado no tempo.

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
| **Para lembrar** | A aberração cromática simula a dispersão da luz calculando a refração 3 vezes (uma por canal de cor), com um índice de refração ligeiramente diferente a cada vez. Uma animação procedural recalcula uma posição a cada quadro via uma fórmula que depende do tempo real decorrido, sem dados externos. O picking do mouse converte um clique 2D em um raio 3D via as matrizes de projeção/visão invertidas, na ordem inversa da renderização normal. |
| **Ferramentas utilizáveis** | Um cubemap para o ambiente refratado. Uma fórmula temporal (`sinf(tempo * velocidade)`) para uma animação procedural simples. A inversa das matrizes de projeção e visão para o picking. |
| **Armadilhas a evitar** | Uma diferença grande demais entre os índices de refração (resultado irreal). Animar conforme o número de quadros em vez do tempo real decorrido. |
| **Boas práticas** | Manter os índices de refração próximos uns dos outros para um resultado crível. Sempre basear uma animação no tempo real, nunca no número de quadros decorridos. |
