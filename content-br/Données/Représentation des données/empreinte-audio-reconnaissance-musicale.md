---
order: 8
---

# A impressão digital de áudio: reconhecer uma música em poucos segundos

O [hash perceptual](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduz uma imagem a uma pequena impressão robusta a pequenas variações (recompressão, recorte). O mesmo princípio se aplica ao som: reconhecer uma música a partir de um trecho de poucos segundos, gravado pelo microfone de um telefone em um bar barulhento, comparando-o com uma base de dezenas de milhões de faixas, em menos de um segundo. É esse o problema que a **impressão digital de áudio** resolve (popularizada pelo Shazam).

## Etapa 1: transformar o som em imagem (o espectrograma)

Um som é uma onda que varia no tempo, mas essa única dimensão (o volume a cada instante) não basta para reconhecê-lo: também é preciso saber quais **frequências** (graves, agudas) estão presentes a cada instante. Um **espectrograma** transforma o áudio em uma espécie de imagem:

```text
Frequencia (agudo)
      ▲
      │   ░░  ▓▓        ░░
      │  ░▓▓  ░░  ▓▓░░
      │  ▓▓░      ░▓▓  ░░
      └──────────────────────► Tempo
      (grave)

Eixo horizontal : o tempo
Eixo vertical   : a frequencia (grave embaixo, agudo em cima)
Intensidade (░/▓) : o volume dessa frequencia nesse instante
```

Essa imagem contém muito mais informação do que uma simples curva de volume: ela mostra precisamente quais notas/frequências soam em qual momento.

## Etapa 2: manter apenas os picos mais marcantes

Um espectrograma completo continua sensível ao ruído ambiente (conversas, ruído de fundo): comparar dois espectrogramas pixel por pixel falharia assim que um ruído qualquer se somasse ao sinal. A solução adotada pelo Shazam mantém apenas os pontos mais **intensos** do espectrograma (os picos que se destacam bastante de sua vizinhança): algumas dezenas de pontos por segundo, escolhidos para permanecerem visíveis mesmo em meio a ruído ambiente, compressão de áudio ou qualidade de microfone medíocre.

```text
Espectrograma completo         Manter apenas os picos
(sensivel ao ruido)             (robusto ao ruido)

  ░▓▓░░▓░░▓▓░░░▓░░        →        •      •
  ░░▓░▓▓░░░▓▓░▓░░                    •  •
  ▓░░▓░░▓▓░░░▓░▓▓░                •        •
```

## Etapa 3: gerar hash de pares de picos, depois buscar em uma base gigantesca

Cada pico é associado a um pico vizinho, e o par (frequência do primeiro, frequência do segundo, intervalo de tempo entre os dois) é transformado em uma impressão compacta, exatamente como um [hash perceptual](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduz uma imagem a uma sequência de bits. Essas impressões são pré-calculadas para dezenas de milhões de faixas e armazenadas em um índice imenso:

```text
Trecho gravado → picos → impressoes → busca no indice
                                              ↓
Se muitas impressoes correspondem a uma mesma faixa,
com um deslocamento temporal coerente → faixa identificada
```

A exigência de um **deslocamento temporal coerente** entre todas as impressões que correspondem é o que elimina os falsos positivos: algumas impressões podem coincidir por acaso com qualquer faixa, mas dezenas delas coincidindo com o mesmo deslocamento de tempo só podem vir da mesma gravação.

> **Cuidado:** esperar que essa técnica reconheça uma melodia cantarolada ou cantada pelo próprio usuário. A impressão digital de áudio identifica uma **gravação precisa** (os mesmos picos de frequência do original): um cover, uma versão ao vivo ou um cantarolar produzem um espectrograma diferente da gravação de estúdio, portanto impressões diferentes, mesmo que um humano reconheça de imediato "a mesma música".
>
> **Boa prática:** usar um trecho da gravação original, mesmo breve e ruidoso (poucos segundos bastam, o algoritmo só precisa de algumas dezenas de picos confiáveis); para reconhecer uma melodia cantarolada, é necessária uma técnica diferente (comparar a melodia em si, independentemente do timbre exato da gravação), fora do escopo da impressão digital de áudio clássica.

## O que reter

| | |
|---|---|
| **O que reter** | Uma impressão digital de áudio transforma o som em espectrograma, mantém apenas os picos de frequência mais marcantes (robustos ao ruído), e depois gera hash de pares de picos para encontrá-los em um índice imenso, exigindo um deslocamento temporal coerente entre as correspondências. |
| **Ferramentas úteis** | O princípio (constelação de picos + hash de pares), publicado por Avery Wang (cofundador do Shazam), é adotado pela maioria dos serviços de reconhecimento musical. |
| **Armadilhas a evitar** | Esperar um reconhecimento a partir de uma melodia cantarolada ou de um cover diferente da gravação original. |
| **Boas práticas** | Usar um trecho da gravação original, mesmo curto e ruidoso; recorrer a uma técnica dedicada (comparação de melodia) para uma melodia cantarolada. |
