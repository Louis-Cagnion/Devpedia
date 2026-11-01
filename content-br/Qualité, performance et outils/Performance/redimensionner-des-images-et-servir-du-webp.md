---
order: 14
---

# Redimensionar imagens e servir o WebP (31/10/2026)

Em muitas páginas da web, as imagens são a parte mais pesada. Uma foto tirada com um aparelho recente tem vários **milhões de pixels** (os pequenos quadradinhos de cor que compõem uma imagem) e várias centenas de milhares de **bytes** (um **byte** é um grupo de 8 **bits**, sendo um bit um valor que vale 0 ou 1; uma letra simples ocupa um byte, veja [a organização dos dados em memória](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Um **servidor** (o computador que guarda os arquivos de um site e os envia sob pedido, veja [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) transmite em seguida esse arquivo a um **navegador** (o programa que exibe as páginas da web). Se o servidor enviar o arquivo tal qual para exibi-lo numa caixa de 400 pixels de largura num celular, fazemos o navegador baixar e processar dezenas de vezes mais dados do que o necessário.

Este capítulo mostra como **fabricar vários tamanhos** de uma mesma imagem, como **escolher o formato** mais leve que o navegador entende, como evitar que um visitante mal-intencionado abuse do sistema, e como reservar o espaço da imagem para que a página não pule durante o carregamento. Os números vêm de um teste real, feito com a linguagem [Python](/?c=langages&s=python&p=python) e sua biblioteca de imagens **Pillow** ([documentação](https://pillow.readthedocs.io/)), executado num [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam comandos). Para as tags `<img>` e o atributo `alt`, veja [Os links e as imagens](/?c=langages&s=html&p=liens-et-images); este capítulo não as repete. Reservar o espaço de uma imagem é um caso de [Carregamento adiado e espaço reservado](/?c=qualite-performance-et-outils&s=performance&p=chargement-differe-et-espace-reserve), e as respostas servidas ficam guardadas em um cache compartilhado, veja [Metadados de cache e invalidação](/?c=qualite-performance-et-outils&s=performance&p=metadonnees-de-cache-et-invalidation).

| Pergunta | Seção |
|---|---|
| Por que uma imagem grande deixa uma página lenta? | [Por que uma imagem grande custa caro](#por-que-uma-imagem-grande-custa-caro) |
| Como produzir vários tamanhos? | [Fabricar derivados](#fabricar-derivados) |
| JPEG, PNG ou WebP? | [Três formatos, três usos](#tres-formatos-tres-usos) |
| Como o navegador recebe o arquivo certo? | [Servir o arquivo certo](#servir-o-arquivo-certo) |
| Fabricar antecipadamente ou sob demanda? | [Antecipado ou sob demanda](#antecipado-ou-sob-demanda) |
| Como a página evita pular? | [Reservar o espaço](#reservar-o-espaco) |

## Por que uma imagem grande custa caro

Uma imagem exibida passa por três custos, que não se resolvem do mesmo jeito.

| Custo | O que acontece | Depende de | Se resolve com |
|---|---|---|---|
| **Peso** | O arquivo é baixado pela rede | Bytes do arquivo | Um tamanho adequado, um formato compacto |
| **Decodificação** | O navegador transforma o arquivo comprimido em uma grade de pixels | Número de pixels | Menos pixels |
| **Memória** | A grade de pixels fica na memória enquanto a imagem estiver exibida | Número de pixels, independentemente do formato | Menos pixels |

O terceiro custo surpreende: um arquivo de 18.000 bytes pode ocupar muito mais memória depois de aberto. Uma vez decodificado, cada pixel costuma ocupar 4 bytes (um para o vermelho, um para o verde, um para o azul, um para a transparência), qualquer que seja o formato original. A memória se calcula então por multiplicação:

```text
memória (bytes) = largura × altura × 4

3000 × 2000 × 4 = 24.000.000 bytes   (a imagem de teste em tamanho original)
 800 ×  533 × 4 =  1.705.600 bytes   (uma versão de 800 pixels de largura)
 400 ×  267 × 4 =    427.200 bytes   (uma versão de 400 pixels de largura)
```

Esse cálculo não é uma medição: é a aritmética do formato decodificado. Ele explica por que um formato leve não basta: **uma imagem de 3000 pixels de largura continua pesada na memória mesmo quando seu arquivo é pequeno**. É preciso então reduzir o número de pixels, e não apenas o peso do arquivo. Para decidir onde investir, vale a regra geral: [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

> **Analogia:** mandar um pôster de um metro de largura para preencher a moldura de um selo postal. O carteiro carrega o pôster (peso), o destinatário precisa desdobrá-lo (decodificação), e ele ocupa a mesa inteira enquanto olhamos o selo (memória).

## A imagem de teste

Para medir sem depender de uma foto real, o script a seguir fabrica uma imagem de 3000 × 2000 pixels: um degradê de cores, discos, um leve desfoque (`GaussianBlur`, que faz a média de cada pixel com seus vizinhos) e um grão (`effect_noise`, um ruído aleatório que imita o de um sensor fotográfico). Cada pixel é codificado em **RGB**: três valores de 0 a 255, para o vermelho, o verde e o azul. A « semente » do acaso ([`seed`](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) é fixada para obter a mesma imagem a cada execução. As funções do Pillow usadas são descritas na sua [documentação dos filtros](https://pillow.readthedocs.io/en/stable/reference/ImageFilter.html) e no seu [módulo de desenho](https://pillow.readthedocs.io/en/stable/reference/ImageDraw.html). Para executar os scripts deste capítulo, salve cada um com o nome indicado na primeira linha, todos numa mesma pasta, e execute-o a partir dessa pasta com `python3` seguido do nome do arquivo (por exemplo `python3 criar_imagem.py`); o Pillow deve estar instalado (veja a documentação dele). O Python dos blocos é explicado em outros capítulos: [variáveis](/?c=langages&s=python&p=variables) (inclusive as `tuple`, grupos de valores entre parênteses), [laços](/?c=langages&s=python&p=boucles) (`for ... in range(n)` repete n vezes), [funções](/?c=langages&s=python&p=fonctions) (`print` exibe um valor) e [módulos](/?c=langages&s=python&p=modules-et-environnements) (`import` carrega ferramentas).

```python
# criar_imagem.py : fabrica uma imagem de teste parecida com uma foto
import random                                    # sorteio de números ao acaso

from PIL import Image, ImageDraw, ImageFilter    # ferramentas de desenho do Pillow

LARGURA, ALTURA = 3000, 2000                     # dimensões em pixels
random.seed(42)                                  # mesmo acaso a cada execução

imagem = Image.new("RGB", (LARGURA, ALTURA))     # imagem vazia em vermelho-verde-azul
pincel = ImageDraw.Draw(imagem)                  # objeto que desenha sobre a imagem
for y in range(ALTURA):                          # uma linha horizontal por fileira de pixels
    t = y / ALTURA                               # posição de 0 (topo) a 1 (base)
    vermelho, verde, azul = int(60 + 80 * t), int(120 + 60 * t), int(220 - 140 * t)
    pincel.line([(0, y), (LARGURA, y)], fill=(vermelho, verde, azul))   # linha colorida

for _ in range(150):                             # 150 discos de cores variadas
    x, y = random.randrange(LARGURA), random.randrange(ALTURA)      # centro ao acaso
    r = random.randrange(20, 200)                # raio ao acaso
    cor = tuple(random.randrange(40, 230) for _ in range(3))     # vermelho, verde, azul
    pincel.ellipse([x - r, y - r, x + r, y + r], fill=cor)      # disco dentro deste quadrado

imagem = imagem.filter(ImageFilter.GaussianBlur(3))                # desfoque, raio 3 px
ruido = Image.effect_noise((LARGURA, ALTURA), 18).convert("RGB")     # ruído, desvio 18
imagem = Image.blend(imagem, ruido, 0.12)        # mistura: 88 % imagem, 12 % ruído
imagem.save("original.png")                      # salva sem perda
print(imagem.size, imagem.mode)                  # mostra as dimensões
```

Saída obtida:

```text
(3000, 2000) RGB
```

Uma câmera entrega um JPEG, e não um PNG de 7.188.291 bytes. A etapa seguinte salva, então, esta imagem em JPEG de boa qualidade (92 numa escala de 100), para simular o arquivo que recebemos de uma câmera: **885.780 bytes**. Essa é a referência « antes » de todo o capítulo. Sobre o conteúdo de um arquivo desse tipo (metadados, formato bruto), veja [Metadados EXIF e RAW](/?c=donnees&s=representation-des-donnees&p=metadonnees-exif-et-format-raw).

## Fabricar derivados

Um **derivado** é uma cópia da imagem original em outro tamanho ou em outro formato. O **original** nunca é modificado: ele continua sendo a fonte da qual se refazem todos os derivados se as regras mudarem. O princípio, usado pelos sistemas de gestão de conteúdo (CMS, apresentados no fim do capítulo) sob o nome de **estilos de imagem**, cabe em um esquema:

```text
                         +--> gato-400.webp    (celular)
original (3000 px) ------+--> gato-800.webp    (tablet, computador)
gato.jpg                 +--> gato-1200.webp   (tela larga)
                         +--> gato-400.jpg ... (reserva: navegadores sem WebP)

1. chega um pedido para "gato, 800 px, webp"
2. o derivado existe no disco? sim: devolvemos ele, pronto
3. não: fabricamos a partir do original, gravamos no disco e devolvemos
```

Um **cache** é uma reserva de resultados já calculados, guardados para não os recalcular. O **cache em disco** é a etapa 2: o arquivo fabricado é conservado, então o custo de fabricação só é pago uma vez por derivado. Três regras acompanham a fabricação:

| Regra | Por quê |
|---|---|
| Manter as **proporções** (largura e altura reduzidas do mesmo fator) | Senão a imagem parece esticada ou achatada |
| Nunca **ampliar** além do original | Ampliar não cria nenhum detalhe: o arquivo engorda à toa |
| Nomear o derivado com sua largura e seu formato (`gato-800.webp`) | Um pedido idêntico sempre cai no mesmo arquivo |

O script a seguir fabrica quatro larguras a partir da imagem de teste e salva cada uma em JPEG, em PNG, em WebP com perda e em WebP sem perda (a diferença é explicada na seção seguinte), depois levanta os pesos. `Image.LANCZOS` designa um filtro de redução que preserva os detalhes (veja os [filtros de reamostragem](https://pillow.readthedocs.io/en/stable/handbook/concepts.html#filters) do Pillow).

```python
# derivar.py : fabrica derivados e levanta o peso de cada um
import os                                        # os.path.getsize dá o peso de um arquivo
import time                                      # time.perf_counter mede uma duração

from PIL import Image                            # abertura e redimensionamento

original = Image.open("original.png").convert("RGB")   # imagem de teste, sem transparência
original.save("fonte.jpg", "JPEG", quality=92)   # o que entregaria uma câmera
print("fonte.jpg", os.path.getsize("fonte.jpg"), "bytes")     # peso de referência

for largura in (3000, 1200, 800, 400):           # as quatro larguras a fabricar
    altura = round(original.height * largura / original.width)  # proporções mantidas
    inicio = time.perf_counter()                 # início do cronômetro
    if largura == 3000:                          # tamanho original: nada a reduzir
        copia = original                         # mantém a imagem como está
    else:                                        # senão, reduz
        copia = original.resize((largura, altura), Image.LANCZOS)   # redução (Lanczos)
    duracao_ms = (time.perf_counter() - inicio) * 1000   # duração da redução em ms
    copia.save(f"d{largura}.jpg", "JPEG", quality=80)          # JPEG com perda
    copia.save(f"d{largura}.webp", "WEBP", quality=80)         # WebP com perda
    copia.save(f"d{largura}.png", "PNG")                       # PNG sem perda
    copia.save(f"d{largura}-sem-perda.webp", "WEBP", lossless=True)   # WebP sem perda
    print(
        largura, altura,                         # dimensões do derivado
        "jpg", os.path.getsize(f"d{largura}.jpg"),             # peso JPEG
        "webp", os.path.getsize(f"d{largura}.webp"),           # peso WebP com perda
        "png", os.path.getsize(f"d{largura}.png"),             # peso PNG
        "webp-sp", os.path.getsize(f"d{largura}-sem-perda.webp"),   # peso WebP sem perda
        "reducao_ms", round(duracao_ms),         # duração da redução
    )
```

Saída obtida (pesos em bytes; a duração `reducao_ms`, em milissegundos, varia um pouco de uma execução para outra):

```text
fonte.jpg 885780 bytes
3000 2000 jpg 370822 webp 87574 png 7188291 webp-sp 4939106 reducao_ms 0
1200 800 jpg 55538 webp 26410 png 988484 webp-sp 733690 reducao_ms 52
800 533 jpg 33984 webp 18432 png 420204 webp-sp 308828 reducao_ms 44
400 267 jpg 15373 webp 9576 png 111428 webp-sp 80728 reducao_ms 37
```

| Largura | Pixels | Memória decodificada (cálculo) | JPEG (qualidade 80) | WebP (qualidade 80) | Duração da redução |
|---|---|---|---|---|---|
| 3000 | 6.000.000 | 24.000.000 | 370.822 | 87.574 | nenhuma |
| 1200 | 960.000 | 3.840.000 | 55.538 | 26.410 | algumas dezenas de ms |
| 800 | 426.400 | 1.705.600 | 33.984 | 18.432 | algumas dezenas de ms |
| 400 | 106.800 | 427.200 | 15.373 | 9.576 | algumas dezenas de ms |

Para uma moldura de 400 pixels de largura, a fonte de 885.780 bytes pesa cerca de 92 vezes o WebP de 400 pixels (9.576 bytes), e a memória decodificada passa de cerca de 24 milhões de bytes para cerca de 0,4 milhão. Em uma conexão de 1 megabit por segundo (um megabit = um milhão de bits, um byte = 8 bits), o cálculo dá 7,1 segundos para a fonte e 0,08 segundo para o WebP de 400 pixels: é um cálculo de transferência teórica, sem **latência** (o tempo de espera antes da chegada dos primeiros dados) nem estabelecimento da conexão (veja [limitar as idas e vindas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) para esse custo fixo). Este teste numa máquina não mede um celular real: contam as ordens de grandeza, não as casas decimais.

## Três formatos, três usos

Um **formato de imagem** é uma convenção para escrever os pixels num arquivo. Os três comparados aqui são [**JPEG**](https://developer.mozilla.org/pt-BR/docs/Web/Media/Formats/Image_types) (*Joint Photographic Experts Group*, o formato das fotografias), [**PNG**](https://developer.mozilla.org/pt-BR/docs/Web/Media/Formats/Image_types) (*Portable Network Graphics*, o dos logotipos e capturas de tela) e [**WebP**](https://developers.google.com/speed/webp) (um formato mais recente, criado para a web). Existem duas famílias de compressão. A compressão **com perda** elimina detalhes que o olho percebe pouco, o que reduz muito o peso, mas não permite mais recuperar a imagem exata. A compressão **sem perda** mantém cada pixel idêntico, ao custo de um arquivo maior. A **transparência** (um fundo que se vê através da imagem) é codificada num quarto valor por pixel, chamado canal **alfa**.

| | JPEG | PNG | WebP |
|---|---|---|---|
| Compressão | Com perda | Sem perda | As duas, à escolha na gravação |
| Transparência (canal alfa) | Não | Sim | Sim |
| Caso típico | Fotografias | Logotipos, capturas de tela, esquemas | Fotografias e logotipos |
| Suporte pelos navegadores | Universal | Universal | Amplo hoje (veja a cautela abaixo) |

Os pesos medidos na imagem de teste redimensionada para 800 pixels (a que se parece com uma foto):

| Formato e modo | Bytes | Relação com JPEG qualidade 80 |
|---|---|---|
| JPEG, qualidade 80 | 33.984 | 1,00 |
| WebP com perda, qualidade 80 | 18.432 | 0,54 |
| WebP sem perda | 308.828 | 9,09 |
| PNG (sem perda) | 420.204 | 12,36 |

Duas lições. Primeiro, **uma foto não se põe em PNG**: doze vezes mais pesada que o JPEG, sem benefício visível. Depois, o WebP sem perda é mais leve que o PNG (mais de um quarto a menos aqui), mas continua muito longe de uma compressão com perda para uma foto. O teste seguinte verifica a **transparência** com um logotipo: um disco vermelho sobre fundo transparente. O bloco `try` / `except OSError` captura o erro que o Pillow levanta quando a gravação falha (veja [a gestão de erros em Python](/?c=langages&s=python&p=gestion-des-erreurs)).

```python
# transparencia.py : um logotipo com fundo transparente em PNG, WebP e JPEG
import os                                        # peso dos arquivos

from PIL import Image, ImageDraw                 # criação e desenho de imagens

logo = Image.new("RGBA", (400, 400), (0, 0, 0, 0))   # RGBA: vermelho, verde, azul, alfa
desenho = ImageDraw.Draw(logo)                   # objeto que desenha sobre o logotipo
desenho.ellipse([40, 40, 360, 360], fill=(220, 40, 40, 255))          # disco vermelho opaco
desenho.rectangle([150, 150, 250, 250], fill=(255, 255, 255, 255))  # quadrado central
logo.save("logo.png")                            # PNG sem perda
logo.save("logo.webp", "WEBP", lossless=True)    # WebP sem perda
logo.save("logo-com-perda.webp", "WEBP", quality=80)    # WebP com perda
try:                                             # JPEG não sabe codificar o alfa
    logo.save("logo.jpg", "JPEG")                # deve falhar
except OSError as erro:                          # o Pillow sinaliza o erro
    print("JPEG recusa:", erro)                  # mensagem exibida
for nome in ("logo.png", "logo.webp", "logo-com-perda.webp"):    # releitura dos três
    imagem = Image.open(nome)                    # abre o arquivo gravado
    print(nome, os.path.getsize(nome), imagem.mode, imagem.getpixel((5, 5)))  # canto do fundo
```

Saída obtida:

```text
JPEG recusa: cannot write mode RGBA as JPEG
logo.png 2635 RGBA (0, 0, 0, 0)
logo.webp 720 RGBA (0, 0, 0, 0)
logo-com-perda.webp 2944 RGBA (0, 0, 0, 0)
```

O pixel do canto (0, 0, 0, 0) tem alfa 0: ficou transparente nos três arquivos que suportam o alfa. O JPEG não pode levar esse logotipo: a gravação falha. Para este desenho chapado, o WebP sem perda (720 bytes) é cerca de 3,7 vezes mais leve que o PNG (2.635 bytes); o modo com perda (2.944 bytes) não ajuda aqui, porque uma forma de bordas nítidas não tem detalhe « inútil » a eliminar.

### Podemos comparar a « qualidade 80 » do JPEG e do WebP?

Não. O número de **qualidade** é uma escala própria de cada codificador (o programa que escreve o arquivo): « 80 » não tem o mesmo sentido para JPEG e para WebP. Para comparar com honestidade, é preciso medir a **fidelidade** ao original. O **PSNR** ([*peak signal-to-noise ratio*](https://scikit-image.org/docs/stable/api/skimage.metrics.html#skimage.metrics.peak_signal_noise_ratio), razão sinal-ruído de pico) o mede em **decibéis** (dB): quanto mais alto, mais a imagem se parece com o original. O decibel é uma escala [logarítmica](/?c=fondamentaux&s=mathematiques&p=le-logarithme): 10 dB a mais significam um erro médio dez vezes menor (`math.log10` calcula esse logaritmo na base 10). Ele não substitui o olhar humano (duas imagens com o mesmo PSNR podem parecer diferentes), mas dá uma referência numérica.

```python
# fidelidade.py : compara a fidelidade de JPEG e WebP ao original (800 px)
import io                                        # arquivo na memória
import math                                      # logaritmo para os decibéis

from PIL import Image, ImageChops, ImageStat     # comparação de pixels

original = Image.open("original.png").convert("RGB").resize((800, 533), Image.LANCZOS)


def psnr(a, b):
    """Devolve o PSNR em decibéis entre duas imagens de mesmo tamanho."""
    diferenca = ImageChops.difference(a, b)      # diferença pixel a pixel (valor absoluto)
    soma = sum(ImageStat.Stat(diferenca).sum2)   # soma dos quadrados das diferenças (3 cores)
    erro = soma / (3 * a.width * a.height)       # média: quadrado médio do desvio por valor
    return 10 * math.log10(255 * 255 / erro)     # fórmula do PSNR, 255 = valor máximo


for format_, qualidade in (("JPEG", 80), ("WEBP", 80), ("WEBP", 90), ("WEBP", 95)):
    buffer = io.BytesIO()                        # arquivo fictício na memória
    original.save(buffer, format_, quality=qualidade)        # codifica nesse buffer
    relida = Image.open(io.BytesIO(buffer.getvalue())).convert("RGB")   # relê o resultado
    peso = len(buffer.getvalue())                # tamanho do arquivo codificado
    print(format_, qualidade, peso, "bytes", round(psnr(original, relida), 2), "dB")
```

Saída obtida:

```text
JPEG 80 33984 bytes 35.82 dB
WEBP 80 18432 bytes 37.76 dB
WEBP 90 27104 bytes 39.53 dB
WEBP 95 39298 bytes 40.27 dB
```

Nesta imagem, o WebP de qualidade 80 é ao mesmo tempo **mais leve** (18.432 contra 33.984 bytes) e **mais fiel** (37,76 contra 35,82 dB) que o JPEG de qualidade 80. Não se deve tirar disso uma lei: a imagem é sintética (degradê, discos, grão regular), e o resultado varia com o conteúdo e com o ajuste do codificador. A regra duradoura: **escolher o formato e a qualidade medindo nas próprias imagens**, e comparar com fidelidade igual, nunca com o mesmo número de qualidade.

### E o suporte?

Os navegadores comuns leem o WebP hoje, mas este capítulo não pôde verificar isso aqui (nenhum navegador foi aberto para o teste). Para um valor atualizado, consulte a [documentação sobre os formatos de imagem](https://developer.mozilla.org/pt-BR/docs/Web/Media/Formats/Image_types) da MDN. Existem outros formatos mais recentes ([AVIF](https://developer.mozilla.org/pt-BR/docs/Web/Media/Formats/Image_types), por exemplo) que se servem pelo mesmo mecanismo apresentado abaixo: o teste deste capítulo se limita àqueles que a ferramenta local sabe produzir.

## Servir o arquivo certo

Depois de fabricados os derivados, resta enviar a cada navegador o certo: o tamanho adequado e o formato que ele entende. Há dois mecanismos, que podem se combinar: um se configura na página [HTML](/?c=langages&s=html&p=html) (a linguagem que descreve o conteúdo de uma página), o outro no servidor, que lê o cabeçalho `Accept` (uma linha da requisição, explicada mais abaixo).

| | Escolha pela página HTML (`<picture>`) | Escolha pelo servidor (cabeçalho `Accept`) |
|---|---|---|
| Quem decide | O navegador, entre os endereços listados | O servidor, a partir do pedido recebido |
| Endereços | Um por arquivo (`gato-800.webp`, `gato-800.jpg`) | Um só (`/images/gato.jpg?w=800`) |
| Cache compartilhado | Simples: um endereço, um conteúdo | Delicado: mesmo endereço, conteúdos diferentes |
| Caso típico | Páginas cujo HTML se controla | Páginas antigas, conteúdos de terceiros, HTML impossível de alterar |

### Pela página: `<picture>`, `srcset` e `sizes`

[`<picture>`](https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element/picture) agrupa várias fontes; o navegador fica com a primeira cujo tipo ele entende. `srcset` (já apresentado em [Os links e as imagens](/?c=langages&s=html&p=liens-et-images)) lista os arquivos disponíveis com a largura de cada um em pixels (`400w` quer dizer « 400 pixels de largura »). `sizes` diz ao navegador **qual largura a imagem ocupará na página**, antes mesmo de o [CSS](/?c=langages&s=css&p=css) (a linguagem que descreve a aparência de uma página) ser aplicado; `vw` é uma unidade que vale 1% da largura da janela.

```html
<!-- contêiner: várias fontes possíveis para uma só imagem -->
<picture>
  <!-- primeira fonte: WebP, que o navegador ignora se não o ler -->
  <source
    type="image/webp"
    srcset="gato-400.webp 400w, gato-800.webp 800w, gato-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
  >
  <!-- imagem de reserva: JPEG, também usada para exibir em todos os casos -->
  <img
    src="gato-800.jpg"
    srcset="gato-400.jpg 400w, gato-800.jpg 800w, gato-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
    width="800"
    height="533"
    alt="Um gato preto sentado em um sofá"
    loading="lazy"
  >
</picture>
```

| Elemento | Função |
|---|---|
| `type="image/webp"` | O **tipo MIME** (um nome padrão de formato de arquivo) da fonte: o navegador pula a fonte se não a conhecer |
| `srcset="... 400w"` | Os arquivos disponíveis e sua largura real em pixels |
| `sizes="(max-width: 600px) 100vw, 600px"` | Se a janela tiver 600 pixels ou menos, a imagem ocupa toda a largura; senão ocupa 600 pixels |
| `<img src=...>` | A reserva: obrigatória, é ela que aparece e que carrega `alt`, `width`, `height` |
| [`loading="lazy"`](https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element/img#loading) | O navegador adia o carregamento até que a imagem se aproxime da tela |

Exemplo de raciocínio do navegador: num celular cuja janela tem 390 pixels de largura e cuja tela tem 3 pixels físicos por **pixel CSS** (a unidade de comprimento da página, independente da resolução da tela; essa relação é a **densidade de pixels**), `100vw` vale 390 pixels CSS, ou seja, 1.170 pixels físicos a preencher. O menor arquivo suficiente da lista é `gato-1200`. O navegador continua livre para escolher (ele pode levar em conta também a qualidade da rede): `srcset` e `sizes` são **indicações**, não ordens. O comportamento exato num navegador real não foi observado neste capítulo.

> **Armadilha:** `loading="lazy"` na imagem mais alta da página (a que se vê sem rolar) a atrasa em vez de acelerar. Reserve-o para as imagens situadas mais abaixo.

### Pelo servidor: o cabeçalho `Accept`

Uma requisição [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) tem **cabeçalhos**, pequenas linhas « nome: valor » que descrevem o pedido. O cabeçalho [`Accept`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Accept) lista os tipos de conteúdo que o cliente sabe ler. Um navegador que lê WebP o anuncia colocando `image/webp`; é um comportamento muito difundido, mas não observado aqui: confira-o na aba « Rede » das ferramentas de desenvolvedor do navegador (o painel integrado, muitas vezes aberto pela tecla F12, que lista cada requisição). O servidor responde com o formato adequado. O teste abaixo usa o código da seção seguinte. Para reproduzi-lo, crie antes `estilos.py` e a pasta `originais/`, preparados em [a seção sobre a geração sob demanda](#a-armadilha-da-geracao-sob-demanda-exposta), depois execute `python3 servidor.py` a partir da mesma pasta. O servidor é o módulo [`http.server`](https://docs.python.org/pt-br/3/library/http.server.html) do Python; `127.0.0.1` é o endereço da própria máquina e `58431` uma **porta**, o número que distingue este servidor dos outros na máquina (veja [servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)). `GET` é o método HTTP que pede um arquivo. O bloco `try` / `except urllib.error.HTTPError` captura a resposta de erro do servidor (veja [a gestão de erros em Python](/?c=langages&s=python&p=gestion-des-erreurs)); `threading` faz o servidor rodar em segundo plano enquanto o cliente o consulta.

```python
# servidor.py : serve /images/<nome>?w=<largura> e escolhe o formato pelo Accept
import threading                                 # inicia o servidor em segundo plano
import urllib.error                              # erros HTTP do lado do cliente
import urllib.request                            # cliente HTTP da biblioteca padrão
from http.server import BaseHTTPRequestHandler, HTTPServer   # servidor HTTP mínimo
from urllib.parse import parse_qs, urlparse      # separação de um endereço

import estilos                                   # o módulo da seção seguinte

TYPES = {"webp": "image/webp", "jpeg": "image/jpeg"}     # extensão -> tipo MIME


class Gerenciador(BaseHTTPRequestHandler):
    """Responde a cada requisição GET recebida."""

    def do_GET(self):
        url = urlparse(self.path)                # separa o caminho e os parâmetros
        nome = url.path.removeprefix("/images/")     # nome do arquivo pedido
        try:                                     # w pode não ser um número
            largura = int(parse_qs(url.query).get("w", ["0"])[0])   # param. w, 0 se ausente
        except ValueError:                       # ex.: ?w=abc
            largura = 0                          # fora da lista: recusado como os outros
        caminho = estilos.servir(nome, largura, self.headers.get("Accept", ""))
        if caminho is None:                      # pedido recusado por estilos.py
            self.send_error(400, "tamanho ou arquivo recusado")  # erro 400: pedido inválido
            return                               # nada mais a enviar
        corpo = caminho.read_bytes()             # conteúdo do derivado
        self.send_response(200)                  # código 200: sucesso
        tipo_mime = TYPES[caminho.suffix[1:]]    # tipo MIME deduzido da extensão do derivado
        self.send_header("Content-Type", tipo_mime)              # formato realmente enviado
        self.send_header("Content-Length", str(len(corpo)))      # tamanho em bytes
        self.send_header("Vary", "Accept")       # a resposta depende do cabeçalho Accept
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()                       # fim dos cabeçalhos
        self.wfile.write(corpo)                  # envio do arquivo

    def log_message(self, *arguments):
        pass                                     # sem registro no teste


servidor = HTTPServer(("127.0.0.1", 58431), Gerenciador)     # escuta somente localmente
threading.Thread(target=servidor.serve_forever, daemon=True).start()   # inicia em paralelo

TESTES = (                                       # (cabeçalho Accept, valor do parâmetro w)
    ("image/webp,*/*", 800),
    ("image/png,*/*", 800),
    ("*/*", 777),
    ("*/*", "abc"),
)
for accept, largura in TESTES:
    pedido = urllib.request.Request(
        f"http://127.0.0.1:58431/images/gato.jpg?w={largura}", headers={"Accept": accept}
    )                                            # simula um navegador que anuncia Accept
    try:                                         # uma resposta de erro levanta uma exceção
        with urllib.request.urlopen(pedido) as resposta:     # envia a requisição
            corpo = resposta.read()              # lê a resposta
            print(resposta.status, resposta.headers["Content-Type"], len(corpo),
                  resposta.headers["Vary"], resposta.headers["Cache-Control"])
    except urllib.error.HTTPError as erro:       # código de erro recebido
        print(erro.code, erro.reason)            # mostra o código e o motivo
servidor.shutdown()                              # para o servidor de teste
```

Saída obtida:

```text
200 image/webp 18376 Accept public, max-age=31536000, immutable
200 image/jpeg 33981 Accept public, max-age=31536000, immutable
400 tamanho ou arquivo recusado
400 tamanho ou arquivo recusado
```

O mesmo caminho (`/images/gato.jpg?w=800`) recebeu um WebP de 18.376 bytes quando `image/webp` estava em `Accept`, e um JPEG de 33.981 bytes caso contrário. Os pesos diferem um pouco da tabela anterior porque este servidor parte do arquivo `fonte.jpg` (já comprimido) e não do PNG original. A largura 777, ausente da lista, recebeu uma recusa, assim como o valor `abc`, que não é um número.

| Cabeçalho da resposta | Função | Se for esquecido |
|---|---|---|
| [`Content-Type`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Content-Type) | Diz ao navegador qual formato ele recebe | Ele pode adivinhar errado ou recusar a exibição |
| [`Vary: Accept`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Vary) | Diz aos caches: « minha resposta muda conforme o cabeçalho `Accept` » | Um cache compartilhado pode devolver um WebP a um navegador que não o lê |
| [`Cache-Control`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Cache-Control) | Tempo durante o qual o navegador guarda o arquivo sem pedi-lo de novo | Cada visita baixa a imagem outra vez |
| [`Content-Length`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Content-Length) | Tamanho do corpo da resposta, em bytes | O navegador não sabe onde a resposta termina |

Em `public, max-age=31536000, immutable`, `public` autoriza os caches compartilhados (como uma CDN) a guardar uma cópia, `max-age=31536000` fixa a duração em segundos (31.536.000 s, ou seja, um ano), e `immutable` diz que o arquivo não vai mudar: o navegador não o verifica de novo antes do fim desse prazo.

> **Armadilha:** `Cache-Control: ... immutable` em um endereço que não muda quando o original muda. Se substituirmos `gato.jpg`, os visitantes guardam a versão antiga por um ano. Coloque uma versão ou uma impressão digital (um código calculado a partir do conteúdo do arquivo) no endereço (`gato.jpg?v=3`, ou `gato.3f9a1c.jpg`) a cada mudança do original.

> **Armadilha:** uma [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) (rede de cópias do conteúdo próximas dos visitantes) nem sempre respeita `Vary`. Verifique a configuração da que você usa, ou prefira a escolha por `<picture>`, em que cada endereço tem um só conteúdo.

## Antecipado ou sob demanda

| | Antecipado (no envio do original) | Sob demanda (na primeira requisição) |
|---|---|---|
| Quando os derivados existem | Assim que o original é gravado | Depois da primeira requisição de cada tamanho |
| Primeira visita | Rápida: o arquivo já está lá | Mais lenta: é preciso fabricá-lo (da ordem de 140 ms para WebP de 1200 px aqui) |
| Disco | Todos os derivados previstos, mesmo os nunca pedidos | Só os que foram pedidos |
| Mudar de tamanho ou formato | Refazer todos os derivados de todas as imagens | Esvaziar o cache: os derivados são refeitos sozinhos |
| Risco | Nenhum ligado aos visitantes | Um visitante pode disparar fabricações à vontade |

Na máquina do teste, a primeira chamada para um tamanho levou **da ordem de 140 ms** (abertura do original, redução, gravação) e a seguinte **menos de um milissegundo**, porque o derivado já estava no disco. O ganho do cache é, portanto, muito grande, e a fabricação só se paga uma vez. Mas a última linha da tabela é a armadilha central deste capítulo.

### A armadilha da geração sob demanda exposta

Se o endereço aceita qualquer largura (`/images/gato.jpg?w=1000`, `?w=1001`, `?w=1002`, ...), qualquer pessoa pode pedir uma largura diferente a cada requisição. Cada pedido fabrica um arquivo novo, o guarda e nunca se beneficiará do cache. É uma **negação de serviço**: um ataque que não rouba nada, mas esgota o servidor (processador, memória, disco) até que os visitantes legítimos deixem de ser atendidos. O capítulo [sobrecarga e negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) trata dessa família; a limitação do número de requisições por cliente é explicada em [segurança de APIs web](/?c=securite&s=cybersecurite&p=securite-api-web), mas não basta aqui: cada requisição, tomada isoladamente, parece normal.

A proteção é uma **lista de tamanhos permitidos**: qualquer pedido fora da lista é recusado antes de qualquer cálculo. Eis o módulo completo usado pelo servidor anterior, e seu teste.

```python
# estilos.py : derivados sob demanda, lista de tamanhos permitidos, cache em disco
import os                                        # os.replace: renomeia em um bloco
from pathlib import Path                         # manipulação de caminhos de arquivos

from PIL import Image                            # leitura e redução de imagem

PASTA_ORIGINAIS = Path("originais")              # onde vivem os originais
PASTA_CACHE = Path("cache")                      # onde vivem os derivados fabricados
LARGURAS_PERMITIDAS = (400, 800, 1200)           # únicos tamanhos que fabricamos


def escolher_formato(accept):
    """Escolhe webp se o navegador o anunciar em Accept, senão jpeg."""
    return "webp" if "image/webp" in accept else "jpeg"  # teste no texto do cabeçalho


def servir(nome, largura, accept, lista_estrita=True):
    """Devolve o caminho do derivado (fabricado se preciso), ou None se recusado."""
    if lista_estrita and largura not in LARGURAS_PERMITIDAS:    # tamanho fora da lista?
        return None                              # recusa antes de qualquer cálculo
    original = (PASTA_ORIGINAIS / nome).resolve()    # caminho real, ".." resolvidos
    if PASTA_ORIGINAIS.resolve() not in original.parents or not original.is_file():
        return None                              # fora da pasta, ou arquivo ausente
    formato = escolher_formato(accept)           # webp ou jpeg conforme o navegador
    alvo = PASTA_CACHE / f"{original.stem}-{largura}.{formato}"   # nome (largura pedida)
    if not alvo.exists():                        # ausente do cache: fabricamos
        PASTA_CACHE.mkdir(exist_ok=True)         # cria a pasta de cache se preciso
        imagem = Image.open(original).convert("RGB")     # abre o original
        largura = min(largura, imagem.width)     # nunca mais larga que o original
        altura = round(imagem.height * largura / imagem.width)   # proporções mantidas
        temporario = alvo.with_suffix(f".{os.getpid()}.tmp")     # nome único (processo)
        reduzida = imagem.resize((largura, altura), Image.LANCZOS)   # redução
        reduzida.save(temporario, formato.upper(), quality=80)   # grava o arquivo provisório
        os.replace(temporario, alvo)      # renomeia em um bloco: nunca um arquivo pela metade
    return alvo                                  # caminho do derivado pronto para uso
```

Antes de executar qualquer coisa, é preciso preparar os originais. Neste exemplo, eles ficam numa pasta `originais/`, que contém `gato.jpg`, uma cópia de `fonte.jpg` (fabricada por `derivar.py`). Os dois comandos a seguir, digitados no terminal a partir da pasta onde estão `estilos.py` e `fonte.jpg`, criam essa pasta (`mkdir`, *make directory*) e depois copiam a imagem com o nome `gato.jpg` (`cp`, *copy*).

```bash
# cria a pasta originais/ ao lado de estilos.py
mkdir originais
# copia fonte.jpg para essa pasta, com o nome gato.jpg
cp fonte.jpg originais/gato.jpg
```

O parâmetro `lista_estrita=False` existe somente para **medir o ataque**; uma aplicação real nunca oferece essa opção. O módulo também respeita a regra « nunca ampliar »: `min(largura, imagem.width)` limita a largura à do original (o arquivo guarda então no nome a largura pedida). Eis o teste.

```python
# teste_estilos.py : cache, negociação, recusa, depois 200 larguras inventadas
import shutil                                    # shutil.rmtree esvazia a pasta de cache
import time                                      # cronômetro
from pathlib import Path                         # lista dos arquivos do cache

import estilos                                   # o módulo acima

shutil.rmtree("cache", ignore_errors=True)       # parte de um cache vazio
print(estilos.servir("gato.jpg", 800, "image/webp,image/*"))     # webp anunciado
print(estilos.servir("gato.jpg", 800, "image/png,*/*"))          # webp ausente de Accept
print(estilos.servir("gato.jpg", 777, "image/webp"))             # tamanho fora da lista
print(estilos.servir("../estilos.py", 800, "image/webp"))        # saída da pasta

inicio = time.perf_counter()                     # início do cronômetro
estilos.servir("gato.jpg", 1200, "image/webp")   # primeira chamada: fabricação
frio = (time.perf_counter() - inicio) * 1000     # duração em milissegundos
inicio = time.perf_counter()                     # novo início
estilos.servir("gato.jpg", 1200, "image/webp")   # segunda chamada: já no cache
quente = (time.perf_counter() - inicio) * 1000   # duração em milissegundos
print(f"frio {frio:.1f} ms, quente {quente:.3f} ms")

shutil.rmtree("cache", ignore_errors=True)       # cache vazio antes do ataque simulado
inicio = time.perf_counter()                     # início do cronômetro
for largura in range(1000, 1200):                # 200 larguras distintas
    estilos.servir("gato.jpg", largura, "image/webp")            # com a lista
print("com lista:", len(list(Path("cache").glob("*"))), "arquivos",
      round(time.perf_counter() - inicio, 3), "s")

shutil.rmtree("cache", ignore_errors=True)       # cache vazio de novo
inicio = time.perf_counter()                     # início do cronômetro
for largura in range(1000, 1200):                # as mesmas 200 larguras
    estilos.servir("gato.jpg", largura, "image/webp", lista_estrita=False)   # sem lista
arquivos = list(Path("cache").glob("*"))         # arquivos fabricados
total_bytes = sum(f.stat().st_size for f in arquivos)   # peso total no disco
print("sem lista:", len(arquivos), "arquivos", total_bytes, "bytes",
      round(time.perf_counter() - inicio, 3), "s")
```

Saída obtida (as durações variam de uma execução para outra):

```text
cache/gato-800.webp
cache/gato-800.jpeg
None
None
frio 136.1 ms, quente 0.133 ms
com lista: 0 arquivos 0.0 s
sem lista: 200 arquivos 4893402 bytes 25.663 s
```

| Pedido | Resultado | Por quê |
|---|---|---|
| 800 px com `image/webp` em `Accept` | `gato-800.webp` | Formato anunciado pelo cliente |
| 800 px sem `image/webp` | `gato-800.jpeg` | Reserva para os clientes que não leem WebP |
| 777 px | `None` (recusa) | Largura ausente de `LARGURAS_PERMITIDAS` |
| `../estilos.py` | `None` (recusa) | O caminho sai da pasta dos originais |
| 200 larguras inventadas, com lista | 0 arquivo, 0 s | Cada pedido é recusado antes de qualquer cálculo |
| 200 larguras inventadas, sem lista | 200 arquivos, 4.893.402 bytes, cerca de 26 s | Cada pedido dispara uma fabricação completa |

200 pedidos custaram cerca de 26 segundos de cálculo e quase 5 megabytes no disco: cerca de 130 ms e 24.000 bytes cada um. Por simples proporção (cálculo, não medição), 10.000 pedidos desse tipo custariam cerca de 21 minutos de cálculo num único núcleo de processador (uma unidade de cálculo independente) e cerca de 245 megabytes de disco, para uma só imagem. Com vários milhares de originais, o disco e o processador saturam. A lista de tamanhos reduz esse custo a zero, e também limita o número de arquivos do cache: (número de originais) × (número de tamanhos) × (número de formatos).

| Defesa | O que ela impede | Limite |
|---|---|---|
| **Lista de tamanhos permitidos** | As larguras inventadas | É preciso prever antecipadamente os tamanhos úteis |
| Token assinado no endereço (um código calculado com um segredo do servidor) | Qualquer endereço não produzido pelo próprio servidor | Exige gestão de segredos ([gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Limitar o número de requisições por cliente | Um cliente único que inunda | Inútil contra milhares de clientes, ou contra uma requisição única muito custosa |
| Limitar o tamanho do original (em pixels) | Uma imagem armadilhada que explode na memória depois de decodificada | Deve ser fixado também no envio (veja [upload de arquivos](/?c=securite&s=cybersecurite&p=upload-de-fichiers)) |
| Pré-gerar no envio do original | Qualquer abuso sob demanda | Disco ocupado por derivados que nunca são servidos |

O arquivo temporário seguido de um `os.replace` resolve outra armadilha, mais discreta: duas requisições simultâneas para o mesmo derivado inexistente. Sem essa precaução, a segunda poderia ler um arquivo pela metade. Com um nome provisório único por processo (um servidor com vários fios de execução, veja [paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme), deveria também incluir o identificador do fio, ou usar o módulo `tempfile`) e uma renomeação **atômica** (que acontece num único bloco indivisível, sem estado intermediário visível), cada leitor vê ou nada, ou o arquivo completo. O nome do original (`nome`) recebido de fora é verificado contra a **travessia de caminho** (*path traversal*, um pedido como `../estilos.py` que sai da pasta prevista), detalhada em [upload de arquivos](/?c=securite&s=cybersecurite&p=upload-de-fichiers). Em `estilos.py`, `.resolve()` transforma o caminho pedido em caminho completo, apagando os `..` (veja [árvore de diretórios e caminhos](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), e `.parents` lista as pastas que contêm esse caminho: se a pasta dos originais não faz parte dela, o pedido sai da pasta prevista e é recusado (veja também [`pathlib`](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

## Reservar o espaço

Enquanto a imagem não chegou, o navegador não conhece o tamanho dela. Se não tiver nenhuma indicação, ele exibe a página com um espaço vazio e, quando a imagem chega, empurra o texto abaixo dela: é o **deslocamento de layout** ([*layout shift*](https://web.dev/articles/cls)), muito incômodo (clicamos num botão que se mudou de lugar). A solução é declarar as dimensões antecipadamente.

```html
<!-- largura e altura em pixels: o navegador calcula a proporção 800/533 -->
<img src="gato-800.jpg" width="800" height="533" alt="Um gato preto">
```

A regra de formatação abaixo é escrita em CSS.

```css
/* regra aplicada a todas as imagens */
img {
  max-width: 100%;   /* a imagem nunca ultrapassa seu contêiner */
  height: auto;      /* a altura acompanha a largura, mantendo a proporção declarada */
}
```

| Elemento | Função |
|---|---|
| `width="800" height="533"` | Informa a **proporção largura/altura** (800 / 533, cerca de 1,5) antes da chegada do arquivo |
| `max-width: 100%` | Reduz a imagem quando o contêiner é mais estreito que 800 pixels |
| `height: auto` | Recalcula a altura com a proporção, para não esmagar a imagem |
| [`aspect-ratio: 3 / 2`](https://developer.mozilla.org/pt-BR/docs/Web/CSS/aspect-ratio) (CSS) | Outra maneira de reservar o espaço quando o HTML não pode ser alterado |

Os atributos `width` e `height` não descrevem o tamanho final de exibição (quem decide é o CSS): eles apenas informam a proporção. Por isso devem corresponder à do arquivo, **todos os derivados incluídos**: se os derivados mantêm as proporções (regra da seção anterior), o mesmo par serve para todos os tamanhos. O deslocamento não foi observado num navegador para este capítulo: o mecanismo é o descrito em [Os links e as imagens](/?c=langages&s=html&p=liens-et-images).

## Um exemplo em um sistema de gestão de conteúdo: Drupal

Tudo o que precede se encontra nos **sistemas de gestão de conteúdo** (CMS, programas que permitem publicar páginas sem escrever código). O **Drupal**, um CMS escrito em [PHP](/?c=langages&s=php&p=php), é aqui apenas um exemplo: o que importa é o princípio, válido com qualquer ferramenta. Os nomes abaixo são verificados no código-fonte do Drupal 11.x; a referência é a documentação oficial ([drupal.org/docs](https://www.drupal.org/docs)).

| Princípio do capítulo | O que o Drupal propõe |
|---|---|
| Derivado em um tamanho dado | Um **estilo de imagem**: um nome (por exemplo `miniatura`) associado a uma sequência de **efeitos** (reduzir, recortar, converter) |
| Fabricação sob demanda, cache em disco | O derivado é fabricado no primeiro pedido do endereço do estilo, depois guardado na pasta de arquivos |
| Lista de tamanhos permitidos | Só existem os estilos definidos pelo administrador; o endereço de um derivado traz um **token** (parâmetro de endereço) calculado a partir do caminho e de uma chave privada do site; sem ele, o Drupal responde com um erro `404`. Esse token limita a fabricação abusiva de derivados (protege contra a geração em massa), mas não controla a origem do pedido |
| Conversão para outro formato | Um efeito de **conversão** que muda a extensão de saída, por exemplo para WebP |
| `<picture>`, `srcset`, `sizes` | O módulo **Responsive image**, que gera essas tags a partir dos estilos de imagem |
| Conversores WebP | O núcleo já sabe converter para WebP, com o efeito de conversão (`image_convert`); módulos contribuídos (por exemplo « WebP ») acrescentam, além disso, uma cópia WebP de cada derivado |

Dois avisos próprios desse tipo de ferramenta. A conversão depende da biblioteca de imagens que o PHP usa: se ela não foi compilada com suporte a WebP, o efeito não está disponível. E o ajuste « endereços não seguros » (`image.settings:allow_insecure_derivatives`, desativado por padrão) não anula o token dos caminhos que começam por `styles/`, que o exigem sempre; ele só o suprime para os outros caminhos. Ativá-lo continua desaconselhado: aumenta a exposição à geração abusiva de derivados, portanto à negação de serviço (a saturação do servidor por uma enxurrada de pedidos).

## As armadilhas

| Armadilha | Consequência | Solução |
|---|---|---|
| Enviar o original da câmera | Peso e memória desproporcionais | Fabricar derivados nas larguras realmente exibidas |
| Reduzir o peso sem reduzir os pixels | Memória sempre alta | Reduzir primeiro as dimensões, depois escolher o formato |
| Ampliar um original pequeno | Arquivo grande, imagem borrada | Limitar a largura do derivado à do original |
| Comparar « qualidade 80 » de dois formatos | Conclusão falsa | Comparar com fidelidade igual (PSNR ou olhar), ou com peso igual |
| Foto em PNG | Arquivo várias vezes mais pesado que o JPEG | PNG para logotipos, capturas e esquemas; JPEG ou WebP para fotos |
| Logotipo com transparência em JPEG | Falha na gravação, ou fundo opaco | PNG ou WebP |
| Tamanhos aceitos sem limite | Disco e processador esgotados, negação de serviço | Lista de tamanhos permitidos, verificada antes de qualquer cálculo |
| `Vary: Accept` esquecido | Um cache serve um WebP a um navegador que não o lê | Enviar `Vary: Accept`, ou passar por `<picture>` |
| `immutable` sem versão no endereço | A imagem antiga continua exibida por um ano | Colocar uma versão ou uma impressão digital no endereço |
| Nome de original não verificado | Leitura de um arquivo fora da pasta prevista | Resolver o caminho e verificar que ele continua na pasta dos originais |
| Gravar o derivado diretamente no local final | Um leitor lê um arquivo pela metade | Gravar um arquivo provisório, depois renomear |
| `width` e `height` ausentes | Deslocamento de layout na chegada da imagem | Declará-los, com `height: auto` no CSS |
| `loading="lazy"` na imagem do topo da página | Imagem principal atrasada | Reservar `lazy` para as imagens fora da tela no início |

## Boas práticas

| Prática | Detalhe |
|---|---|
| Manter o original intacto | Todos os derivados se refazem a partir dele; nunca recodificar um derivado |
| Escolher um número pequeno de larguras | Uma lista curta (por exemplo 400, 800, 1200) cobre a maioria dos usos e limita o cache |
| Oferecer o WebP com uma reserva | Uma fonte WebP, uma imagem JPEG de reserva em `<picture>` |
| Descrever o contexto com `sizes` | Sem `sizes`, o navegador supõe que a imagem ocupa toda a largura da janela |
| Medir nas próprias imagens | Cada conteúdo se comporta de um jeito; veja [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) |
| Colocar os derivados atrás de um CDN | O [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) guarda uma cópia próxima do visitante; o princípio do cache em disco é o mesmo, veja também [evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) |
| Recusar antes de calcular | A verificação do tamanho, do nome e do formato acontece antes da abertura do original |
| Declarar `width` e `height` | Para reservar o espaço e evitar o deslocamento de layout |

## O que reter

| | |
|---|---|
| **Para lembrar** | Uma imagem custa em peso, em decodificação e em memória; a memória depende dos pixels (largura × altura × 4 bytes), não do arquivo. Fabricamos derivados de várias larguras, conservados no disco. Na imagem de teste, o WebP com perda era ao mesmo tempo mais leve e mais fiel que o JPEG com o mesmo valor de qualidade; PNG e WebP mantêm a transparência, o JPEG não. O arquivo certo se escolhe por `<picture>` e `srcset`/`sizes`, ou pelo cabeçalho `Accept` com `Vary: Accept`. |
| **Armadilhas a evitar** | Gerar sob demanda qualquer tamanho: um visitante pode saturar processador e disco. Comparar valores de qualidade de formatos diferentes. Foto em PNG, logotipo transparente em JPEG. Cache de um ano num endereço que não muda. Dimensões não declaradas, que provocam deslocamento da página. |
| **Boas práticas** | Conservar o original, aceitar só uma lista de tamanhos, recusar antes de calcular, gravar por renomeação atômica, oferecer o WebP com um formato de reserva, declarar `width` e `height`, e medir nas próprias imagens. |
