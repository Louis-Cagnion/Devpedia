---
order: 5
---

# Treinar e fazer fine-tuning de um modelo de síntese de voz

O [fine-tuning de um modelo de visão](/?c=ia&s=vision-et-ocr&p=fine-tuning-modele-vision) já aplica os princípios genéricos (transfer learning, congelamento de camadas, taxa de aprendizado reduzida) que se aplicam tal como são a um modelo de síntese de voz. Este capítulo cobre o que é específico da voz.

## Duas necessidades diferentes, duas abordagens diferentes

| Necessidade | Abordagem | Quantidade de dados necessária |
|---|---|---|
| Usar uma voz existente, pontualmente | [Clonagem zero-shot](/?c=ia&s=voix-ia&p=cloner-une-voix) | Alguns segundos, nenhum retreinamento |
| Uma voz de qualidade estável, reutilizada massivamente em produção | Fine-tuning dedicado | Várias horas de gravações dessa voz |

A clonagem zero-shot (veja o capítulo anterior) continua sendo uma aproximação rápida; um fine-tuning dedicado, partindo de um modelo pré-treinado e continuando seu treinamento especificamente com horas de gravação de uma determinada voz, produz um resultado mais estável e de melhor qualidade, ao custo de um trabalho de coleta de dados muito mais pesado.

> **Cuidado:** escolher um fine-tuning dedicado para uma necessidade pontual (uma única frase, um uso ocasional), quando o custo de coletar várias horas de gravações supera amplamente o benefício para esse caso de uso.
>
> **Boa prática:** reservar o fine-tuning dedicado para vozes realmente reutilizadas em grande escala (um assistente de voz de produto, um narrador recorrente), e a clonagem zero-shot para qualquer uso mais pontual.

## A qualidade dos dados de treinamento, uma questão específica do áudio

Diferente de uma imagem, cuja qualidade se julga de forma bastante direta a olho, a qualidade de uma gravação de áudio de treinamento depende de fatores fáceis de ignorar:

| Fator | Problema se for negligenciado |
|---|---|
| Ruído de fundo | O modelo aprende a reproduzir o ruído além da voz |
| Variação de volume entre gravações | O modelo produz uma voz com intensidade inconsistente de uma frase para outra |
| Diversidade das frases gravadas (fonemas cobertos) | Um fonema raro, nunca ouvido no treinamento, é mal reproduzido na geração |

> **Cuidado:** usar gravações de qualidade desigual (ruído de fundo variável, volumes diferentes) supondo que o modelo "vai fazer a média" e ainda assim produzir um resultado limpo. O modelo aprende fielmente o que vê, incluindo seus defeitos, exatamente como um modelo treinado com dados não representativos (veja [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
>
> **Boa prática:** normalizar o volume de todas as gravações antes do treinamento, e limpar o quanto possível o ruído de fundo, em vez de contar com o modelo para compensar dados de qualidade desigual.

## O que reter

| | |
|---|---|
| **O que reter** | A clonagem zero-shot atende a um uso pontual; um fine-tuning dedicado, com várias horas de gravação, produz uma voz mais estável para um uso massivo em produção. O ruído de fundo e as variações de volume nos dados de treinamento se reproduzem fielmente na voz gerada. |
| **Ferramentas úteis** | Os princípios genéricos de fine-tuning já vistos para visão (transfer learning, congelamento de camadas). Ferramentas de limpeza e normalização de áudio antes do treinamento. |
| **Armadilhas a evitar** | Escolher um fine-tuning dedicado para uma necessidade pontual. Usar gravações de qualidade desigual esperando que o modelo compense. |
| **Boas práticas** | Reservar o fine-tuning dedicado para vozes reutilizadas em grande escala. Normalizar e limpar as gravações antes do treinamento. |
