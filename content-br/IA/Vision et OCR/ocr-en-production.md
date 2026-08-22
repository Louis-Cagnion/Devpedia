---
order: 7
---

# Colocação em produção e monitoramento de um pipeline OCR

Os capítulos anteriores cobrem o reconhecimento em si (modelo, avaliação, correção). Este cobre o que muda uma vez esse pipeline implantado continuamente, em um fluxo real de documentos em vez de um conjunto de teste fixo: as mesmas perguntas de um [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production), com respostas às vezes diferentes.

## Custo, latência, exposição de dados: já tratados, não repetir

A escolha entre API hospedada e modelo auto-hospedado para um pipeline OCR (custo por página, exposição da imagem completa a um terceiro, tolerância à latência em processamento por lote) já é detalhada em [Arbitragem local vs cloud para um modelo de visão](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): este capítulo não a repete, ele pressupõe essa escolha já feita.

## A deriva silenciosa de versão, versão OCR

O mesmo risco já visto para um LLM (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) se aplica a um OCR fornecido por terceiro: o fornecedor pode atualizar seu modelo silenciosamente, mudando o comportamento de reconhecimento em documentos idênticos, sem que nenhuma linha do pipeline tenha mudado.

> **Cuidado:** só detectar essa deriva depois que ela produziu erros visíveis posteriormente (um valor mal extraído em uma nota fiscal real, por exemplo), em vez de monitorá-la diretamente.
>
> **Boa prática:** executar regularmente novamente o conjunto de teste anotado (veja o [golden set de avaliação de OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) no pipeline em produção, em intervalos regulares e a cada mudança anunciada pelo fornecedor, para detectar uma deriva de versão antes que afete documentos reais.

## Monitorar um CER/WER continuamente, não apenas no treinamento

O CER/WER (veja o [capítulo dedicado](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) não deve ser medido apenas uma vez antes da colocação em produção: acompanhado ao longo do tempo no golden set, ele detecta uma degradação antes que se acumule silenciosamente:

```text
CER no golden set, medido semanalmente:

Semana 1 : 2,1%
Semana 2 : 2,3%
Semana 3 : 2,0%
Semana 4 : 6,8%   <- pico repentino: alerta (mudanca de fornecedor? novo formato de documento?)
```

> **Cuidado:** seguir apenas um CER/WER global agregado sobre todos os documentos processados, sem ventilá-lo por tipo de documento ou por campo. Uma degradação que afeta apenas um tipo de documento (um novo formato de nota fiscal de um determinado fornecedor, por exemplo) pode ficar escondida em uma média global estável, exatamente a mesma armadilha do score global já sinalizada no capítulo sobre avaliação.
>
> **Boa prática:** ventilar o monitoramento por tipo de documento e por campo, não apenas por uma média global, para identificar uma degradação localizada antes que se espalhe.

## Direcionar os casos incertos para uma releitura humana

O [score de confiança](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) já visto para a detecção de layout tem um equivalente para o próprio reconhecimento de texto: a maioria dos motores de OCR retorna, além do texto, um score de confiança por palavra ou por caractere reconhecido.

```text
Documento processado
      │
      ▼
Score de confianca medio do documento
      │
      ├── acima do limiar ──> processamento automatico, nenhuma intervencao
      │
      └── abaixo do limiar ──> colocado em fila para releitura humana
```

> **Cuidado:** tratar todo documento abaixo de um certo limiar de confiança como um erro bloqueante, sem alternativa, ou, ao contrário, aceitá-lo tal como está sem nenhuma verificação para não atrasar o pipeline.
>
> **Boa prática:** prever uma fila de releitura humana para os documentos abaixo do limiar de confiança, em vez de uma escolha binária entre bloquear e aceitar cegamente: o pipeline permanece amplamente automatizado, a releitura humana recaindo apenas sobre os casos realmente incertos.

## O que reter

| | |
|---|---|
| **O que reter** | O custo, a latência e a exposição de dados já são tratados na escolha local/cloud; este capítulo adiciona o que é específico do funcionamento contínuo: deriva silenciosa de versão de um OCR terceiro, monitoramento do CER/WER ao longo do tempo (ventilado por tipo de documento e por campo), e direcionamento dos documentos de baixa confiança para uma releitura humana em vez de um processamento cego. |
| **Ferramentas úteis** | Um golden set executado novamente regularmente em produção. Um painel de acompanhamento do CER/WER ao longo do tempo, ventilado por tipo de documento. Uma fila de releitura humana para os documentos abaixo de um limiar de confiança. |
| **Armadilhas a evitar** | Detectar uma deriva de versão só depois de erros visíveis posteriormente. Seguir apenas um CER/WER global sem ventilação. Tratar os documentos de baixa confiança de forma apenas binária (bloquear ou aceitar cegamente). |
| **Boas práticas** | Executar novamente o golden set em intervalos regulares e a cada mudança de fornecedor. Ventilar o monitoramento por tipo de documento e por campo. Direcionar os documentos de baixa confiança para uma releitura humana. |
