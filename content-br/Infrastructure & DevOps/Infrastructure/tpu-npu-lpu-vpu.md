---
order: 6
---

# Além da GPU: TPU, NPU, LPU e VPU

O capítulo [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu) opõe duas famílias de chips: o CPU, generalista, e a GPU, talhada para repetir uma mesma operação simples em milhares de dados em paralelo. Mas a GPU continua sendo bastante versátil: o mesmo chip pode tanto exibir um jogo, simular um clima quanto treinar uma [rede neural](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones). Quando uma única tarefa bem específica se repete em escala massiva (um data center que executa bilhões de vezes o mesmo tipo de cálculo, ou um produto vendido em milhões de unidades), passa a valer a pena projetar um chip que só saiba fazer **essa** tarefa, mas a execute mais rápido e com menos energia que uma GPU generalista.

```text
Generalista                                                    Ultra-especializado
   CPU        ─────────►        GPU        ─────────►   TPU / NPU / LPU / VPU
(fazer tudo,          (paralelizar uma              (uma única familia de tarefa,
 sequencial)         operacao qualquer)               em escala muito grande)
```

TPU, NPU, LPU e VPU são quatro chips nascidos desse mesmo princípio, cada um especializado em uma tarefa diferente.

## TPU (Tensor Processing Unit): o cálculo matricial da IA, ainda mais focado que a GPU

Um **TPU** (*Tensor Processing Unit*, "unidade de processamento de tensores") é um chip projetado pelo [Google](https://cloud.google.com/tpu) especificamente para um único tipo de cálculo: as operações matriciais (multiplicações e somas de grandes grades de números) que compõem quase toda a totalidade do treinamento e do uso de uma rede neural. Uma GPU sabe fazer esse cálculo, mas continua projetada para muito mais do que isso; um TPU só sabe fazer isso, o que lhe permite ir mais rápido e consumir menos energia nessa tarefa precisa, ao custo de não servir para mais nada (impossível exibir um jogo em um TPU).

> **Analogia:** se a GPU é uma linha de montagem capaz de repetir qualquer gesto simples, o TPU é uma máquina-ferramenta construída para um único gesto, e apenas um: multiplicar duas grades de números entre si. Ela não sabe fazer mais nada, mas faz isso melhor que a linha de montagem generalista.

O Google usa seus TPU em seus próprios data centers, principalmente para rodar o Search ou o Google Tradutor na escala de bilhões de requisições.

## NPU (Neural Processing Unit): a IA embarcada, na bateria

Um **NPU** (*Neural Processing Unit*, "unidade de processamento neural") é um chip presente hoje na maioria dos smartphones e notebooks recentes, dedicado a rodar um modelo de IA já treinado (a **inferência**, não o treinamento) diretamente no aparelho, com pouquíssima energia. É isso que permite a um telefone borrar o fundo de uma foto em tempo real ou reconhecer uma palavra-chave de voz ("Ei Siri", "OK Google") sem enviar nenhum dado a [um servidor remoto](/?c=infrastructure-devops&s=infrastructure&p=le-cloud): o cálculo permanece local, o que é ao mesmo tempo mais rápido (sem ida e volta pela rede) e mais respeitoso da privacidade (nada sai do aparelho).

| | GPU (data center) | NPU (aparelho pessoal) |
|---|---|---|
| Onde o cálculo acontece | Em um servidor remoto | Diretamente no telefone/notebook |
| Restrição principal | Poder de cálculo bruto | Consumo de energia (bateria) |
| Tarefa típica | Treinar um modelo | Rodar um modelo já treinado |

## LPU (Language Processing Unit): gerar texto, token por token, sem desvios

Um **LPU** (*Language Processing Unit*) é um chip projetado pela empresa [Groq](https://groq.com/blog/the-groq-lpu-explained) unicamente para a inferência de grandes modelos de linguagem (os [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): produzir o texto de resposta uma palavra (mais precisamente um [token](/?c=ia&s=nlp-llm&p=nlp-et-llm)) após a outra. Uma GPU comum precisa buscar repetidamente os pesos do modelo em uma memória externa razoavelmente lenta a cada token gerado, o que limita sua velocidade ("o muro da memória"). O LPU contorna esse problema mantendo todo o modelo em uma memória diretamente integrada ao chip, muito mais rápida, e executando os cálculos em uma ordem fixada de antemão em vez de decidida dinamicamente: essa execução previsível permite uma geração de texto particularmente rápida e regular.

## VPU (Vision Processing Unit): a visão computacional contínua, na bateria

Um **VPU** (*Vision Processing Unit*) é um chip especializado em análise de imagem e vídeo em tempo real, com custo energético mínimo. Um chip como o [Movidius Myriad X da Intel](https://www.intel.com/content/www/us/en/developer/topic-technology/edge-5g/hardware/vision-accelerator-movidius-vpu.html) consome cerca de 1,5 watt (contra várias centenas de watts de uma GPU de data center) enquanto analisa um fluxo de vídeo contínuo: é esse tipo de chip que equipa drones, câmeras de vigilância ou óculos de realidade aumentada, onde o vídeo precisa ser analisado o tempo todo sem nunca esgotar uma bateria.

## Comparativo dos cinco chips

| Chip | Especialidade | Contexto de uso típico | Exemplo concreto |
|---|---|---|---|
| **CPU** | Generalista, sequencial | Qualquer computador | Rodar um sistema operacional |
| **GPU** | Paralela, generalista | Data center, estação de trabalho | Treinar uma rede neural, renderização 3D |
| **TPU** | Cálculo matricial de IA apenas | Data center (Google) | Rodar o Google Tradutor em grande escala |
| **NPU** | Inferência de IA embarcada, baixa energia | Smartphone, notebook | Desfoque de retrato em tempo real, assistente de voz local |
| **LPU** | Inferência de LLM determinística, baixa latência | Servidor de inferência dedicado (Groq) | Geração de texto token por token muito rápida |
| **VPU** | Visão computacional, energia ultrabaixa | Drone, câmera, óculos AR/VR embarcado | Detecção de objetos contínua na bateria |

> **Cuidado:** achar que um chip mais especializado é "melhor" no absoluto. Ele é mais rápido e mais econômico em energia **apenas** na tarefa precisa para a qual foi projetado, e estritamente inutilizável fora dela (ao contrário do CPU, generalista, ou até da GPU, que continua bastante versátil).
>
> **Boa prática:** reservar um chip ultraespecializado (TPU, NPU, LPU, VPU) apenas para um volume de cálculo repetitivo grande o bastante para compensar seu custo de projeto (a escala de um data center, ou de um produto vendido em milhões de unidades); para todo o resto, um CPU ou uma GPU generalista continua sendo a escolha certa.

## O que reter

| | |
|---|---|
| **O que reter** | TPU, NPU, LPU e VPU aplicam todos o mesmo princípio de CPU vs GPU, levando a especialização ainda mais longe: um chip que só sabe fazer uma única tarefa (respectivamente cálculo matricial de IA, inferência de IA embarcada, inferência de LLM, visão computacional) vai mais rápido e consome menos que um chip generalista nessa tarefa precisa. |
| **Ferramentas úteis** | TPU disponíveis via [Google Cloud](https://cloud.google.com/tpu); NPU já integrados na maioria dos smartphones/notebooks recentes; LPU acessíveis via a API da [Groq](https://groq.com/blog/the-groq-lpu-explained); VPU presentes em módulos embarcados como o Movidius. |
| **Armadilhas a evitar** | Achar que um chip especializado é universalmente melhor que um chip generalista. |
| **Boas práticas** | Reservar cada chip ultraespecializado à escala que justifica seu custo de projeto; manter CPU/GPU para todo o resto. |
