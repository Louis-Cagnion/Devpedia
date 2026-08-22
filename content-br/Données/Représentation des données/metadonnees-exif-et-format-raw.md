---
order: 6
---

# Metadados EXIF e formato RAW: o que uma foto contém além da imagem

Uma foto digital não é apenas uma grade de pixels. Como [qualquer arquivo](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire), é uma sequência de bytes, mas essa sequência é organizada em duas partes distintas: os dados da própria imagem, e um bloco de **metadados** (informações sobre a foto, não a foto em si) inserido no mesmo arquivo.

## JPEG vs RAW: duas formas de armazenar a imagem em si

| | JPEG | RAW |
|---|---|---|
| Conteúdo | Imagem já **processada** (balanço de branco, nitidez, contraste aplicados) e **comprimida** (com perdas) pelo aparelho | Dados quase brutos do sensor, antes de qualquer processamento, não comprimidos ou comprimidos sem perdas |
| Tamanho do arquivo | Pequeno (poucos MB) | Grande (dezenas de MB) |
| Editável depois | Limitado: as decisões do aparelho (balanço de branco etc.) já estão fixadas nos pixels | Amplo: todas as decisões continuam ajustáveis em pós-processamento, sem perda de qualidade |
| Extensão típica | `.jpg` | `.cr2` (Canon), `.nef` (Nikon), `.arw` (Sony), ou o formato aberto `.dng` ([Adobe DNG](https://helpx.adobe.com/camera-raw/digital-negative.html)) |

> **Analogia:** o JPEG é uma foto já revelada e recortada pelo fotógrafo; o RAW é o negativo bruto, que contém tudo o que o sensor captou, para revelar por conta própria depois.

## EXIF: um bloco de metadados inserido no arquivo

O formato **EXIF** (*Exchangeable Image File Format*, um [padrão técnico](https://www.cipa.jp/e/std/std-sec.html) comum à maioria das câmeras e smartphones) define um bloco de metadados inserido no início do arquivo de imagem (tanto JPEG quanto RAW), além dos próprios pixels:

| Campo EXIF típico | Exemplo de valor |
|---|---|
| Modelo do aparelho | iPhone 15 Pro |
| Data e hora da captura | 2026-08-22 14:32:07 |
| Tempo de exposição, abertura, ISO | 1/125s, f/2.8, ISO 100 |
| Coordenadas GPS (se ativadas) | 48.8566° N, 2.3522° E |
| Orientação do aparelho | Retrato |

Esse bloco é legível por qualquer software que saiba lê-lo (visualizador de imagens, rede social, editor), independentemente dos pixels da foto.

> **Cuidado:** compartilhar uma foto on-line sem saber que ela ainda contém suas coordenadas GPS do EXIF. Uma foto tirada em casa e postada publicamente pode assim revelar um endereço preciso a quem quer que inspecione o arquivo, mesmo que nada na imagem em si sugira isso.
>
> **Boa prática:** a maioria das redes sociais remove automaticamente o EXIF das fotos publicadas, mas um arquivo enviado diretamente (e-mail, mensageria, upload em um site) o mantém intacto — verificar antes de qualquer envio de uma foto cuja localização não deva ser compartilhada, usando a ferramenta do próprio sistema operacional ou um utilitário dedicado à remoção de EXIF.

## O que reter

| | |
|---|---|
| **O que reter** | Um arquivo de imagem contém duas coisas distintas: os pixels (JPEG processado/comprimido, ou RAW quase bruto) e um bloco de metadados EXIF (aparelho, configurações, data, às vezes GPS), legível independentemente da imagem. |
| **Ferramentas úteis** | O formato aberto [DNG da Adobe](https://helpx.adobe.com/camera-raw/digital-negative.html) para um RAW legível por vários softwares; um utilitário de remoção de EXIF antes de compartilhar uma foto sensível. |
| **Armadilhas a evitar** | Compartilhar uma foto achando que ela só revela o que é visível na imagem, esquecendo seus metadados EXIF (GPS principalmente). |
| **Boas práticas** | Verificar e remover o EXIF de uma foto antes de qualquer envio direto (fora das redes sociais, que já fazem isso) se sua localização ou data não devem ser conhecidas. |
