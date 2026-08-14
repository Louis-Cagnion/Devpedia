---
order: 21
---

# Arquiteturas — CNN, RNN e Transformers

A rede «totalmente conectada» do capítulo sobre os fundamentos (cada neurónio ligado a todos os da camada seguinte) não é a única forma de organizar as camadas. Dependendo do tipo de dados processados (imagem, sequência, texto), certas arquiteturas revelam-se muito mais eficientes. Este capítulo apresenta as três famílias mais influentes.

## Redes convolucionais (CNN) — para imagens

Uma rede totalmente conectada que processasse uma imagem de 1000x1000 píxeis exigiria um número enorme de pesos (um peso por pixel, por neurónio da camada seguinte) — o que é impraticável e ignora uma propriedade essencial das imagens: um motivo (uma borda, um olho, uma textura) mantém o mesmo significado **independentemente do local onde apareça** na imagem.

Uma **CNN** (*Rede Neural Convolucional*) desliza um pequeno **filtro** (uma grelha de pesos, por exemplo, 3x3) por toda a imagem, reutilizando **os mesmos pesos** em cada posição:

```
Image (extrait)         Filtre (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> une seule valeur en sortie, par position du filtre
2  0  1  1                0  1  0
```

- O mesmo filtro deteta o mesmo padrão (por exemplo, uma borda vertical) **em qualquer parte** da imagem — uma propriedade denominada invariância por translação.
- O número de pesos a aprender permanece reduzido (o tamanho do filtro), independentemente do tamanho da imagem.
- As camadas de **pooling** (por exemplo, *max pooling*) reduzem, em seguida, a resolução, mantendo apenas o valor máximo de uma pequena área, o que diminui o volume de cálculos e torna a rede mais robusta face a pequenos desvios.

A sobreposição de várias camadas convolucionais permite que as primeiras detetem padrões simples (bordas, cantos) e que as seguintes os combinem em padrões cada vez mais abstratos (formas e, posteriormente, objetos completos).

## Redes recorrentes (RNN) — para sequências

Uma frase, uma série temporal, um sinal de áudio: estes dados têm uma ordem significativa, que nem uma rede totalmente conectada nem uma CNN processam naturalmente. Uma **RNN** (*Rede Neural Recorrente*) processa uma sequência elemento a elemento, mantendo um **estado oculto** que resume o que foi visto até ao momento:

```
mot1 -> [RNN] -> état1 --\
                           +-> mot2 -> [RNN] -> état2 --\
                                                           +-> mot3 -> [RNN] -> état3 -> sortie
```

Cada etapa recebe simultaneamente o elemento atual **e** o estado oculto da etapa anterior — é isso que permite à rede «lembrar-se» do contexto anterior ao processar uma frase, por exemplo.

### O problema do gradiente que se desvanece

No caso de uma sequência longa, a retropropagação (ver capítulo sobre o gradiente descendente) tem de percorrer **todas** as etapas anteriores — o gradiente pode tornar-se extremamente pequeno (ou extremamente grande) à medida que avança, tornando muito difícil a aprendizagem de dependências **distantes** na sequência. Variantes como **o LSTM** e **o GRU** introduzem mecanismos de portas (*gates*) para controlar melhor quais as informações a reter ou a esquecer, atenuando este problema.

## Os Transformers — o mecanismo de atenção

Uma RNN processa uma sequência **de forma sequencial** (não é possível calcular o passo 5 antes do passo 4) — um grande obstáculo à paralelização em sequências longas e grandes volumes de dados. O **Transformer** (2017) substitui a recorrência por um mecanismo de atenção: cada elemento da sequência «olha» diretamente para todos os outros (incluindo para si próprio), ponderando a sua importância relativa, sem depender de um estado propagado passo a passo.

```
"Le chat qui dort sur le canapé est noir"
                                    ^
                     l'attention permet à "est noir" de se relier directement à "chat",
                     malgré la distance dans la phrase, sans passer par tous les mots intermédiaires
```

- A atenção pode ser calculada **em paralelo** para toda a sequência (ao contrário de uma RNN), o que permitiu treinar modelos muito maiores, com muito mais dados.
- É esta arquitetura que está na base dos grandes modelos de linguagem (LLM) modernos (ver capítulo sobre o NLP e os LLM).

## Comparação rápida

| Arquitetura | Tipo de dados adequado | Ponto forte | Limitação |
|---|---|---|---|
| **CNN** | Imagens, grelhas espaciais | Peso reduzido, deteta padrões locais | Menos natural para sequências longas |
| **RNN** (LSTM/GRU) | Sequências (texto, séries temporais) | Modela a ordem e a memória de curto prazo | Difícil de paralelizar, dependências distantes frágeis |
| **Transformar** | Sequências, texto e, cada vez mais, imagens também | Paralelizável, identifica dependências demoradas através da atenção | Custo elevado de memória/cálculo em sequências muito longas |

Consulte também o capítulo sobre NLP e LLM para a aplicação da arquitetura Transformer ao processamento de linguagem.
