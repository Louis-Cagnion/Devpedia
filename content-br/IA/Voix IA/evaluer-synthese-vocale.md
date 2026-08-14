---
order: 6
---

# Avaliar uma síntese de voz: MOS, inteligibilidade, latência

[Avaliar um OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) compara uma saída a uma referência exata conhecida (o texto real da imagem). Uma síntese de voz não tem essa sorte: não existe uma "resposta certa" única para "com o que uma voz deve se parecer", uma pergunta que continua amplamente subjetiva.

## O MOS (*Mean Opinion Score*): medir uma percepção subjetiva

O [**MOS**](https://pt.wikipedia.org/wiki/Mean_opinion_score) faz com que uma amostra de áudio seja avaliada por ouvintes humanos, em uma escala de 1 (ruim) a 5 (excelente), e então tira a média das notas:

```text
Amostra de audio gerada
      │
      ▼
Nota de varios ouvintes humanos independentes: 4, 5, 3, 4, 4
      │
      ▼
MOS = media das notas = (4+5+3+4+4) / 5 = 4.0
```

| MOS | Interpretação típica |
|---|---|
| Próximo de 5 | Percebido como uma voz humana real, quase indistinguível |
| 3 a 4 | Compreensível, mas indícios revelam uma origem sintética |
| Abaixo de 3 | Artefatos audíveis incômodos (veja a síntese concatenativa, veja [Fundamentos](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning)) |

> **Cuidado:** comparar scores MOS obtidos em condições de avaliação diferentes (número de ouvintes, instruções dadas, equipamento de escuta). Um MOS não é uma medida física absoluta como um comprimento em metros: dois protocolos de avaliação diferentes produzem scores que não se comparam diretamente, mesmo na mesma amostra de áudio.
>
> **Boa prática:** só comparar scores MOS se vierem do mesmo protocolo de avaliação (mesmas instruções, painel de ouvintes comparável), ou usar um mesmo preditor automático de MOS para os dois, nunca scores coletados em contextos heterogêneos.

## A inteligibilidade: além do natural percebido

Um áudio pode parecer "natural" (MOS alto) sem que cada palavra seja claramente compreendida, e inversamente, uma voz claramente sintética pode continuar perfeitamente compreensível. A **inteligibilidade** se mede separadamente, geralmente fazendo com que ouvintes transcrevam o áudio e comparando sua transcrição ao texto original, exatamente o mesmo cálculo de [WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) já visto para o OCR, mas aplicado ao que um humano compreendeu de ouvido em vez do que um modelo reconheceu em uma imagem.

> **Cuidado:** confiar apenas no MOS para um caso de uso em que a compreensão exata da mensagem importa mais que o natural percebido (um anúncio de segurança, um alerta). Um MOS alto não garante que uma mensagem crítica permaneça 100% inteligível.
>
> **Boa prática:** medir a inteligibilidade separadamente do MOS sempre que um caso de uso exigir uma compreensão confiável do conteúdo, não apenas uma voz agradável de ouvir.

## A latência: tempo real vs geração antecipada

| | Geração antecipada | Tempo real |
|---|---|---|
| Caso de uso típico | Audiobook, narração de vídeo | Assistente de voz, tradução em tempo real |
| O que importa | O tempo total de geração (pode levar vários segundos por frase) | O intervalo entre o envio do texto e o primeiro som audível (*time to first audio*) |
| Restrição na arquitetura | Pouca restrição: a geração pode rodar em segundo plano | Exige um fluxo (*streaming*): gerar e tocar o áudio em pequenos segmentos, sem esperar a frase inteira |

> **Cuidado:** medir apenas o tempo total de geração de uma frase inteira para julgar se um modelo é adequado a um uso em tempo real. Um modelo pode levar 2 segundos para gerar uma frase inteira ao mesmo tempo em que produz o primeiro segmento audível em 200 ms via um fluxo progressivo: é esse atraso inicial que importa para um uso interativo, não o tempo total.
>
> **Boa prática:** medir especificamente o atraso antes do primeiro som audível para um uso em tempo real, e verificar se a arquitetura escolhida realmente suporta um fluxo progressivo em vez de uma geração bloqueante da frase inteira.

## O que reter

| | |
|---|---|
| **O que reter** | O MOS mede uma percepção subjetiva de naturalidade via uma nota humana calculada em média, não comparável entre protocolos diferentes. A inteligibilidade se mede separadamente (próxima do WER, aplicado à escuta humana) e importa mais que um MOS alto para uma mensagem crítica. A latência relevante em tempo real é o atraso antes do primeiro som, não o tempo de geração total. |
| **Ferramentas úteis** | Um painel de ouvintes com um protocolo fixo para o MOS. Uma medida de WER na transcrição humana para a inteligibilidade. Uma arquitetura em fluxo (*streaming*) para um uso em tempo real. |
| **Armadilhas a evitar** | Comparar MOS vindos de protocolos diferentes. Confiar apenas no MOS para uma mensagem em que a compreensão exata importa. Julgar a latência pelo tempo de geração total em vez do atraso antes do primeiro som. |
| **Boas práticas** | Só comparar MOS com um protocolo comparável. Medir a inteligibilidade separadamente sempre que for crítica. Medir o atraso antes do primeiro som para um uso em tempo real. |
