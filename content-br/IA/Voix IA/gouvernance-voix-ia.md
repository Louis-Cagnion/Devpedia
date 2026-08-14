---
order: 8
---

# Governança de um pipeline de voz IA

[Governança de dados para um sistema de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) estabelece os princípios gerais (classificar um dado, rastrear quem pediu o quê, respeitar o direito ao esquecimento). Este capítulo os retoma para um pipeline de síntese de voz, onde o dado em jogo, uma **voz**, tem um status particular já sinalizado em [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix): é um dado biométrico, identificador por natureza.

## A voz como dado biométrico

Diferente de um prompt de texto, uma voz identifica diretamente uma pessoa, no mesmo nível de uma impressão digital ou de um rosto: classificar uma voz como dado "pessoal" no sentido mais comum (veja o [capítulo geral](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) subestima seu nível real de sensibilidade.

| | Dado pessoal "clássico" (nome, e-mail) | Voz |
|---|---|---|
| Pode ser trocado se comprometido | Sim (trocar de e-mail) | Não (impossível "trocar" a própria voz) |
| Reutilizável para usurpar uma identidade | Limitado (um nome só geralmente não basta) | Sim, diretamente (veja o risco de fraude já sinalizado em [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

> **Cuidado:** aplicar a uma amostra de voz as mesmas regras de classificação que a um dado pessoal "clássico" (nome, e-mail), sem considerar que uma voz comprometida nunca pode ser "trocada" como uma senha ou um e-mail.
>
> **Boa prática:** tratar toda amostra de voz identificável como um dado biométrico por si só, com um nível de proteção ao menos equivalente ao de uma impressão digital ou de uma foto de rosto.

## Rastreabilidade: qual amostra produziu qual voz clonada

Um pipeline de clonagem de voz precisa conseguir responder depois a *"qual amostra de referência serviu para produzir este áudio, com o consentimento de quem?"*, a mesma exigência de rastreabilidade de um LLM (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), com um registro adicional específico da voz: a prova do consentimento obtido (veja [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix)), mantida separadamente do próprio áudio gerado.

> **Cuidado:** manter o áudio de referência e o áudio gerado, mas não a prova do consentimento obtido no momento da clonagem. Sem essa prova, torna-se impossível demonstrar depois que essa clonagem era autorizada, principalmente em caso de contestação.
>
> **Boa prática:** registrar a prova de consentimento como um elemento de rastreabilidade por si só, distinto do próprio áudio, com o mesmo rigor da versão de um modelo ou do prompt enviado a um LLM.

## Retenção e direito ao esquecimento: várias cópias de uma mesma voz

O princípio já visto (um dado pode ser copiado em vários lugares sem que um único `DELETE` baste, veja o [capítulo geral](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) se aplica a uma voz com uma variante adicional: um **embedding de locutor** (veja [Clonar uma voz](/?c=ia&s=voix-ia&p=cloner-une-voix)) é, em si, uma representação compacta, mas ainda identificadora, dessa voz.

| Lugar onde a voz pode ter sido copiada | Exclusão disparada pela exclusão da amostra de áudio original? |
|---|---|
| Arquivo de áudio de referência, armazenado tal como está | Sim |
| Embedding de locutor, extraído dessa amostra | Não: o embedding continua existindo e continua utilizável para clonagem, mesmo depois da exclusão do áudio fonte |
| Áudio já gerado a partir dessa voz | Não: cada áudio gerado é uma cópia independente |

> **Cuidado:** responder a um pedido de exclusão apagando apenas o arquivo de áudio de referência, deixando intactos o embedding de locutor já extraído e qualquer áudio já gerado: a voz permanece então clonável ou já presente em conteúdos existentes.
>
> **Boa prática:** fazer o procedimento de exclusão recair sobre a amostra fonte, o embedding de locutor extraído dela, e os conteúdos já gerados que dependem dele, exatamente o mesmo reflexo de um embedding vetorial de RAG já sinalizado no capítulo geral.

## O que reter

| | |
|---|---|
| **O que reter** | Uma voz é um dado biométrico, nunca "trocável" uma vez comprometida, a proteger como uma impressão digital ou um rosto. A rastreabilidade de um pipeline de clonagem precisa incluir a prova de consentimento, não apenas o áudio. A exclusão precisa cobrir a amostra fonte, o embedding de locutor extraído dela, e os conteúdos já gerados a partir dela. |
| **Ferramentas úteis** | Um registro de consentimento distinto do áudio gerado. Um procedimento de exclusão que percorre amostra, embedding e conteúdos gerados. |
| **Armadilhas a evitar** | Classificar uma voz como um dado pessoal "clássico". Não registrar a prova de consentimento. Excluir apenas a amostra fonte sem o embedding nem os conteúdos já gerados. |
| **Boas práticas** | Tratar toda voz identificável como um dado biométrico por si só. Registrar a prova de consentimento separadamente. Estender a exclusão ao embedding e aos conteúdos já gerados. |
