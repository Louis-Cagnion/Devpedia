---
order: 7
---

# Escolher um fornecedor e colocar em produção

A escolha entre modelo auto-hospedado e API cloud (custo, exposição de dados, latência) já é detalhada em [Arbitragem local vs cloud para um modelo de visão](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision); este capítulo a aplica à síntese de voz, onde dois critérios ganham um peso particular: a latência em tempo real e uma restrição às vezes negligenciada, a infraestrutura disponível.

## Três famílias de soluções

| | Web Speech API (navegador) | Auto-hospedado (ex. [Piper](https://github.com/OHF-Voice/piper1-gpl)) | API cloud (ex. [ElevenLabs](https://elevenlabs.io)) |
|---|---|---|---|
| Custo de uso | Nenhum (delega às vozes já instaladas no dispositivo do usuário) | Custo do servidor que executa o modelo, independente do volume | Cobrado por caractere ou por minuto gerado |
| Qualidade de voz | Variável de acordo com o sistema do usuário, fora do controle do desenvolvedor | Controlada, depende do modelo escolhido | Geralmente a mais alta, incluindo a clonagem de voz |
| Infraestrutura exigida | Nenhuma (o cálculo acontece no navegador do usuário) | Um servidor (com ou sem GPU de acordo com o modelo) | Nenhuma do lado do desenvolvedor |
| Funciona offline | Sim, uma vez as vozes do sistema instaladas | Sim | Não, exige uma conexão de rede |

## Um caso concreto: a escolha feita para o próprio Devpedia

A [leitura de áudio automática do Devpedia](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) ilustra concretamente essa escolha. O Devpedia é um site **100% estático** (hospedado no GitHub Pages, sem servidor nem etapa de build): hospedar um modelo como o Piper exigiria um servidor de inferência, incompatível com essa hospedagem; uma API cloud introduziria um custo por uso, para um site consultado livremente sem modelo econômico. A **Web Speech API** foi escolhida precisamente porque não exige nem servidor nem custo de uso: o cálculo acontece inteiramente no navegador de cada visitante.

> **Cuidado:** escolher uma auto-hospedagem ou uma API cloud "por padrão", porque a qualidade de voz é superior nelas, sem verificar antes se a infraestrutura do projeto realmente permite hospedar um servidor de inferência, ou se o modelo econômico do projeto suporta um custo recorrente por uso.
>
> **Boa prática:** partir das restrições reais do projeto (infraestrutura disponível, modelo econômico) antes de comparar as opções apenas pela qualidade de voz, exatamente a mesma abordagem de escolher entre local e cloud para um modelo de visão.

## A latência em tempo real, um critério à parte

Para um uso interativo (um assistente de voz, uma tradução em tempo real), o [atraso antes do primeiro som audível](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale) prevalece sobre a qualidade percebida:

| | Web Speech API | Auto-hospedado | API cloud |
|---|---|---|---|
| Atraso antes do primeiro som | Muito baixo (cálculo local, sem ida e volta de rede) | Baixo se o servidor estiver geograficamente próximo do usuário | Variável, depende da rede e da carga do fornecedor |

> **Cuidado:** ignorar a latência de rede de uma API cloud para um uso em tempo real, baseando-se apenas em testes feitos a partir de uma conexão rápida e próxima do servidor do fornecedor.
>
> **Boa prática:** medir a latência real a partir das condições de rede representativas dos usuários visados, não apenas do ambiente de desenvolvimento.

## O que reter

| | |
|---|---|
| **O que reter** | Existem três famílias de soluções: a Web Speech API (nenhum custo nem infraestrutura, qualidade fora do controle do desenvolvedor), a auto-hospedagem (qualidade controlada, custo de infraestrutura fixo), a API cloud (qualidade mais alta, custo variável por uso, exige conexão de rede). A escolha deve partir das restrições reais do projeto (infraestrutura, modelo econômico), não apenas da qualidade de voz. |
| **Ferramentas úteis** | A Web Speech API para um site estático sem custo de uso. Piper para uma auto-hospedagem leve. ElevenLabs para uma API cloud de alta qualidade, incluindo a clonagem de voz. |
| **Armadilhas a evitar** | Escolher uma opção por padrão sem verificar as restrições reais de infraestrutura e modelo econômico. Medir a latência de uma API cloud apenas em condições de rede favoráveis. |
| **Boas práticas** | Partir das restrições reais do projeto antes de comparar as opções. Medir a latência em condições de rede representativas dos usuários visados. |
