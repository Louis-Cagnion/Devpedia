---
order: 14
---

# Watermarking do conteúdo gerado por IA

Distinguir um conteúdo produzido por uma IA de um conteúdo humano se torna uma questão direta à medida que os modelos avançam: rastreabilidade para uma empresa que precisa auditar suas próprias saídas, obrigação legal via a [regulamentação europeia de IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia) (transparência exigida para todo conteúdo de risco limitado, deepfakes em particular), e combate à desinformação em larga escala. O **watermarking** (marcação) responde a essa necessidade ao integrar, no próprio conteúdo gerado, um sinal que permite identificá-lo posteriormente, mas a técnica difere radicalmente conforme se está marcando texto, uma imagem ou áudio.

## Watermarking de texto: um viés estatístico, não um caractere oculto

Não há nada a esconder em um texto: diferente de uma imagem, nenhum pixel supérfluo onde alojar um sinal invisível. A técnica se apoia, então, em outra coisa: influenciar levemente as escolhas do modelo durante a própria geração.

Um LLM escolhe cada token seguinte a partir de uma [distribuição de probabilidade sobre todo o vocabulário](/?c=ia&s=nlp-llm&p=nlp-et-llm): vários tokens candidatos têm uma probabilidade não nula em um mesmo ponto do texto, e todos formariam uma frase correta. Uma chave secreta, conhecida apenas pelo fornecedor do modelo, torna alguns desses candidatos ligeiramente mais prováveis que outros a cada etapa da geração:

```text
Distribuicao de probabilidade sobre o vocabulario, em uma posicao dada
      │
      ▼
Chave secreta -> favorece levemente certos tokens candidatos
      │
      ▼
Token escolhido (o vies permanece invisivel na leitura)
```

Isoladamente, uma única palavra não prova nada: qualquer humano poderia ter feito a mesma escolha. Repetido ao longo de centenas ou milhares de tokens, esse leve viés forma, em contrapartida, um padrão estatístico que um detector de posse da chave pode medir, sem precisar acessar o próprio modelo.

> **Cuidado:** procurar uma palavra julgada "típica de IA" (como *delve*, muito citada como suposto marcador) e ver nisso uma prova de geração por IA. Não existe nenhuma lista secreta de palavras proibidas: a preferência do modelo por certas palavras vem de seu treinamento, não de um mecanismo de marcação, e um texto marcado não precisa conter nenhuma palavra em particular.
>
> **Boa prática:** tratar esse watermarking como uma prova estatística probabilística, nunca como um veredito binário: um detector retorna um score de confiança, não uma certeza.

### As limitações próprias do texto

O sinal estatístico é frágil por razões próprias do texto, independentes de qualquer intenção de contorná-lo:

| Situação | Efeito sobre o sinal |
|---|---|
| Texto muito curto (algumas frases) | Poucos tokens demais para que um padrão estatístico emerja: a detecção não é confiável |
| Reescrita ou paráfrase | Cada palavra reformulada é uma nova escolha, independente do viés original: o sinal se apaga progressivamente |
| Resumo | O resumo é uma nova geração de tokens, não uma cópia: o sinal do texto fonte não se encontra nele |
| Tradução | Muda inteiramente o espaço de tokens candidatos (outro idioma): o sinal não sobrevive à passagem |

> **Cuidado:** apresentar um watermarking de texto como uma garantia contra qualquer uso abusivo. Um sinal tão frágil quanto um viés estatístico só é realmente confiável em um texto longo, não retocado, em seu idioma original, mas boa parte dos usos reais (copiar e colar parcial, reformulação, tradução) já o faz desaparecer.
>
> **Boa prática:** comunicar honestamente sobre essa limitação em vez de apresentar o watermarking de texto como uma solução robusta: é mais um indício estatístico, não uma prova de autenticidade no sentido criptográfico.

## Watermarking de imagem e áudio: uma marca inserida no sinal

Diferente do texto, uma imagem ou um fluxo de áudio dispõe de um espaço físico onde alojar um sinal sem alterar sua percepção: um pixel tem várias nuances possíveis, uma amostra de áudio vários valores próximos, todos percebidos de forma idêntica pelo olho ou pelo ouvido humano.

| Abordagem | Princípio | Exemplo |
|---|---|---|
| Watermark imperceptível | Um padrão codificado nos pixels ou na amostragem, invisível/inaudível para um humano, mas legível por um detector dedicado | A marcação de áudio mencionada em [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix) |
| Watermark perceptível | Uma marca visível ou audível diretamente | Uma marca d'água "gerado por IA" sobreposta a uma imagem |
| Metadados de proveniência ([C2PA](https://c2pa.org)/*Content Credentials*) | Uma cadeia de metadados assinados criptograficamente, anexada ao arquivo, que rastreia cada etapa de criação/modificação | Uma imagem cujos metadados listam: gerada por tal modelo, depois modificada por tal software |

O padrão [C2PA](https://c2pa.org) (*Coalition for Content Provenance and Authenticity*) difere das duas primeiras abordagens: ele não modifica o próprio conteúdo, apenas anexa a ele um histórico verificável. Seu ponto fraco está justamente aí: esses metadados desaparecem com uma simples exportação ou uma captura de tela, sem tocar no conteúdo visual/de áudio em si, enquanto um watermark imperceptível corretamente projetado resiste melhor.

> **Cuidado:** considerar um watermark imperceptível como definitivamente inquebrável. Uma compressão agressiva, um recorte ou um processamento de áudio intencional pode degradar ou apagar a marca, um ponto já sinalizado do lado do áudio em [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix).
>
> **Boa prática:** combinar várias camadas (watermark imperceptível e metadados C2PA) em vez de se apoiar em apenas uma, cada uma tendo um ponto de ruptura diferente.

## Uma limitação comum a todas as técnicas: detectar, não impedir

Seja texto, imagem ou áudio, o watermarking responde a uma única pergunta, *a posteriori*: esse conteúdo foi gerado por IA? Ele não responde a nenhuma outra: não impede um modelo de gerar um conteúdo problemático, não bloqueia nada no momento da geração, e só serve se um detector for efetivamente consultado depois.

> **Cuidado:** apresentar o watermarking como uma medida de segurança que impede um mau uso. É uma ferramenta de rastreabilidade a posteriori, não um mecanismo de prevenção: um conteúdo marcado pode circular livremente, servir a uma fraude ou a desinformação, sem que nenhum mecanismo intervenha antes que o mal esteja feito.
>
> **Boa prática:** situar o watermarking em uma cadeia mais ampla de rastreabilidade e responsabilização (obrigações de transparência da [regulamentação europeia de IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia), políticas de uso, moderação), nunca como uma solução isolada suficiente.

## O que reter

| | |
|---|---|
| **O que reter** | O watermarking de texto enviesa estatisticamente a escolha dos tokens graças a uma chave secreta; ele perde sua confiabilidade em um texto curto, reescrito, resumido ou traduzido. O watermarking de imagem/áudio aloja um sinal imperceptível no conteúdo, ou se apoia em metadados de proveniência assinados (C2PA). Em todos os casos, o watermarking detecta depois do fato, não impede nada no momento da geração. |
| **Ferramentas úteis** | Um detector estatístico de posse da chave secreta, para o texto. Um watermark imperceptível ou metadados C2PA, para a imagem e o áudio. |
| **Armadilhas a evitar** | Confundir uma palavra julgada "típica de IA" com uma prova de watermarking. Apresentar um watermark como uma garantia infalível ou como um mecanismo de prevenção em vez de detecção. |
| **Boas práticas** | Tratar o resultado de um detector como um score probabilístico, nunca um veredito definitivo. Combinar várias camadas de marcação (imperceptível e metadados) em vez de apenas uma. Situar o watermarking em uma cadeia mais ampla de rastreabilidade, não como solução isolada. |
