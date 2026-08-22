---
order: 4
---

# Treinar e fazer fine-tuning de um modelo de visão para um caso de negócio

Os mecanismos genéricos de treinamento ([função de perda, descida do gradiente, retropropagação](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [loop PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) se aplicam tal como são a um modelo de visão: este capítulo não os repete. Ele cobre o que é específico do treinamento de um modelo de visão para um caso de negócio preciso (reconhecer as notas fiscais de um fornecedor específico, por exemplo): partir de um modelo já treinado em vez do zero, e adaptar os dados de imagem de acordo.

## Partir de um modelo pré-treinado em vez do zero

Treinar um modelo de visão **do zero** (pesos aleatórios) exige milhões de imagens anotadas, uma necessidade já observada no capítulo sobre o treinamento genérico. Para um caso de negócio preciso, esse volume quase nunca existe: algumas centenas a alguns milhares de exemplos é mais realista, amplamente insuficiente para aprender a reconhecer formas a partir do nada.

O **transfer learning** (aprendizado por transferência) contorna esse problema: partir de um modelo já treinado em um conjunto de dados generalista muito grande (por exemplo o [ImageNet](https://www.image-net.org/), milhões de fotos, milhares de categorias), e então continuar seu treinamento com os dados específicos do caso de negócio:

```text
Treinamento generalista (ja feito, por outra pessoa, com milhoes de imagens):
Pesos aleatorios -> ... -> Modelo que reconhece bordas, texturas, formas comuns

Fine-tuning (a fazer voce mesmo, no seu proprio caso de negocio):
Modelo pre-treinado -> continuacao do treinamento com seus proprios dados -> modelo adaptado
```

As primeiras camadas de um modelo de visão aprendem padrões muito gerais (bordas, texturas, cantos), úteis para qualquer tarefa visual; só as camadas mais próximas da saída são realmente específicas da tarefa de origem. Partir de um modelo pré-treinado equivale a reutilizar essa base já aprendida, e reajustar apenas o que realmente precisa mudar.

> **Cuidado:** treinar um modelo de visão do zero para um caso de negócio com poucos dados, por não ter buscado um modelo pré-treinado equivalente. O resultado quase sempre sobreajusta (veja o [sobreajuste](/?c=data-science&p=machine-learning-scikit-learn)): o modelo memoriza os poucos exemplos disponíveis em vez de aprender um padrão geral.
>
> **Boa prática:** buscar sistematicamente um modelo pré-treinado relevante (em uma tarefa próxima) antes de considerar um treinamento do zero, reservado para os casos em que o domínio visual é tão particular que nenhum modelo existente aprendeu nada útil para ele.

## Congelar camadas: reajustar apenas o que precisa mudar

Uma vez carregado o modelo pré-treinado, existem várias estratégias, de acordo com a quantidade de dados disponível para o fine-tuning:

| Estratégia | O que é reajustado | Quando usar |
|---|---|---|
| **Congelar tudo, exceto a última camada** | Apenas a camada de saída (adaptada às novas categorias) | Muito poucos dados; o domínio visual se parece com o do pré-treinamento |
| **Congelar as primeiras camadas, reajustar as últimas** | As camadas profundas (padrões específicos), não as primeiras (padrões genéricos) | Quantidade moderada de dados; o compromisso mais comum |
| **Não congelar nada (fine-tuning completo)** | Todas as camadas | Dados abundantes; o domínio visual difere bastante do pré-treinamento (ex.: documentos escaneados em preto e branco, contra fotos coloridas) |

**Congelar** uma camada significa excluí-la do cálculo de gradiente: seus pesos permanecem fixos em seu valor pré-treinado, a retropropagação nunca os modifica.

```python
# Carregar um modelo pre-treinado e congelar seu "backbone" (as camadas de extracao de padroes)
for parametro in modelo.backbone.parameters():
    parametro.requires_grad = False   # excluido do calculo de gradiente, veja autograd

# Apenas a nova camada de saida, adicionada para este caso de negocio, continua treinavel
modelo.cabeca_de_saida = nn.Linear(tamanho_features, numero_categorias_negocio)
```

> **Cuidado:** usar a mesma taxa de aprendizado de um treinamento do zero. Uma taxa de aprendizado muito alta em fine-tuning modifica bruscamente pesos já úteis, um fenômeno chamado **esquecimento catastrófico** (*catastrophic forgetting*): o modelo perde os padrões genéricos que já tinha aprendido, sem tê-los substituído por algo melhor.
>
> **Boa prática:** usar uma taxa de aprendizado bem menor que um treinamento do zero (geralmente 10 a 100 vezes menor) para as camadas reajustadas, precisamente porque elas já partem de um bom ponto de partida em vez de valores aleatórios.

## Adaptar os dados: a aumentação específica para imagem

Com poucos exemplos disponíveis, a **aumentação de dados** (*data augmentation*) cria artificialmente variantes de cada imagem de treinamento, para expor o modelo a uma diversidade que um conjunto de dados pequeno não cobre por si só:

```python
from torchvision import transforms

aumentacao = transforms.Compose([
    transforms.RandomRotation(degrees=5),                    # leve desalinhamento do escaneamento
    transforms.ColorJitter(brightness=0.2, contrast=0.2),    # variacao de iluminacao/qualidade de escaneamento
    transforms.GaussianBlur(kernel_size=3),                  # leve desfoque (foto em vez de scanner)
])
```

Cada transformação deve corresponder a uma variação **realmente encontrada** nos dados de produção: para um documento escaneado, uma leve rotação (escaneamento mal alinhado) ou uma mudança de luminosidade (qualidade do scanner) são realistas; uma rotação de 180° ou um espelhamento horizontal quase nunca são, para texto.

> **Cuidado:** aplicar aumentações genéricas copiadas de um tutorial sobre classificação de fotos (rotação de 90°/180°, espelhamento horizontal), sem confrontá-las com as variações realmente observadas nos próprios documentos. Uma rotação de 180° ensinaria o modelo a reconhecer texto de cabeça para baixo, um caso que nunca acontece na prática: treinamento desperdiçado em um caso irrealista, em detrimento dos casos reais.
>
> **Boa prática:** escolher cada aumentação de acordo com as variações concretamente observadas em exemplos reais do caso de negócio (qualidade de escaneamento, ângulo, iluminação), não por padrão a partir de um exemplo genérico.

Veja também [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) para o loop de treinamento genérico no qual tudo o que precede se encaixa, e [OCR: do reconhecimento de padrões clássico ao deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) para um exemplo de modelo que se poderia querer fazer fine-tuning para um formato de documento específico de uma empresa.

## O que reter

| | |
|---|---|
| **O que reter** | O transfer learning parte de um modelo pré-treinado em um grande conjunto de dados generalista em vez do zero, indispensável quando os dados do caso de negócio são limitados. Congelar as primeiras camadas preserva os padrões genéricos já aprendidos; reajustar apenas as últimas camadas (ou todas, com uma taxa de aprendizado reduzida) de acordo com o volume de dados disponível. A aumentação de dados deve refletir as variações realmente encontradas, não transformações genéricas. |
| **Ferramentas úteis** | Modelos pré-treinados das bibliotecas de visão (torchvision, Hugging Face); `requires_grad = False` para congelar camadas; `torchvision.transforms` para aumentação de dados. |
| **Armadilhas a evitar** | Treinar do zero com poucos dados em vez de buscar um modelo pré-treinado. Manter uma taxa de aprendizado muito alta em fine-tuning (esquecimento catastrófico). Aplicar aumentações irrealistas para o caso de negócio real. |
| **Boas práticas** | Sempre buscar um modelo pré-treinado relevante antes de treinar do zero. Reduzir bastante a taxa de aprendizado no fine-tuning. Escolher as aumentações de acordo com as variações realmente observadas nos próprios documentos. |
