---
order: 3
---

# CDN e transmissão adaptativa: o caso Netflix

O [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) distribui as requisições entre vários servidores, mas todos esses servidores continuam situados no mesmo lugar geográfico: uma requisição enviada de outro continente sempre precisa percorrer toda essa distância. Para um conteúdo volumoso e idêntico para todo mundo (um vídeo), um ganho muito maior consiste em aproximar **o próprio conteúdo** de cada usuário, em vez de aproximar os servidores de processamento.

## O CDN: cópias do conteúdo, distribuídas pelo mundo todo

Um **CDN** (*Content Delivery Network*, rede de distribuição de conteúdo) é uma rede de servidores distribuídos geograficamente, cada um mantendo em cache uma cópia do conteúdo (um vídeo, uma imagem, um arquivo estático) o mais perto possível de seus usuários:

```text
Sem CDN:                                Com CDN:

Usuario (Toquio)                        Usuario (Toquio)
      |                                       |
      | percorre todo o trajeto               | atendido pelo no de CDN mais proximo
      v                                       v
Servidor de origem (Paris)                No de CDN (Toquio) --- copia sincronizada --- Servidor de origem (Paris)
```

| | Sem CDN | Com CDN |
|---|---|---|
| Distância percorrida | Até o servidor de origem, qualquer que seja o lugar do mundo | Até o nó de CDN mais próximo |
| Carga sobre o servidor de origem | Cada requisição, de qualquer lugar do mundo | Só para sincronizar os nós de CDN, não cada requisição de usuário |
| Adequado a | Conteúdo personalizado, específico de cada usuário | Conteúdo idêntico para todo mundo (vídeo, imagem, arquivo estático) |

A Netflix vai além de um CDN alugado de terceiros: a empresa implanta seus próprios servidores ([Open Connect](https://openconnect.netflix.com/)), instalados diretamente dentro das redes dos provedores de acesso à internet, para que o vídeo percorra o menor trajeto de rede possível antes de chegar ao usuário.

> **Cuidado:** esperar que um CDN acelere qualquer conteúdo. Um CDN só consegue colocar em cache conteúdo compartilhado, idêntico para todos; um conteúdo realmente personalizado (uma recomendação específica de uma conta, um saldo) não tem nada em comum para colocar em cache, e precisa continuar passando pelos servidores de origem, atrás do [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge).

## A transmissão adaptativa: se ajustar à conexão de cada um

Um vídeo não é enviado como um arquivo único de qualidade fixa. Ele é primeiro codificado em **vários níveis de qualidade** (resoluções e taxas de bits diferentes), e depois dividido em pequenos segmentos de poucos segundos cada:

```text
Video fonte
   ├── Qualidade baixa   (segmentos de 480p, taxa baixa)
   ├── Qualidade media   (segmentos de 720p, taxa media)
   └── Qualidade alta    (segmentos de 1080p, taxa alta)
```

O player de vídeo, no aparelho do usuário, mede continuamente a velocidade real de download e escolhe, segmento por segmento, a melhor qualidade que consegue baixar a tempo sem interromper a reprodução:

```text
Conexao medida estavel e rapida     -> baixa o proximo segmento em alta qualidade
Conexao medida que se degrada       -> muda para o proximo segmento em qualidade mais baixa
```

Esse mecanismo (padronizado sob os protocolos [HLS](https://developer.apple.com/streaming/) e [MPEG-DASH](https://www.iso.org/standard/79329.html)) explica por que um vídeo que estava rodando em alta definição pode ficar momentaneamente mais pixelado se a rede se degradar (troca de wifi, congestionamento de rede), sem nunca interromper a reprodução: cada segmento seguinte é simplesmente pedido em uma qualidade diferente, de forma transparente para o usuário.

## O que reter

| | |
|---|---|
| **O que reter** | Um CDN aproxima uma cópia do conteúdo compartilhado de cada usuário, reduzindo a distância percorrida pela requisição; ele não serve para conteúdo personalizado. A transmissão adaptativa divide um vídeo em segmentos codificados em várias qualidades, e o player escolhe a melhor qualidade sustentável de acordo com a conexão medida ao vivo. |
| **Ferramentas úteis** | Um CDN alugado (genérico) ou implantado internamente (Netflix Open Connect); os protocolos HLS e MPEG-DASH para a transmissão adaptativa. |
| **Armadilhas a evitar** | Esperar que um CDN acelere conteúdo realmente personalizado, que não tem nada em comum para colocar em cache. |
| **Boas práticas** | Reservar o CDN ao conteúdo compartilhado e estático; deixar o conteúdo personalizado passar pelos servidores de origem. |
