---
order: 8
---

# Governança de dados para documentos escaneados

[Governança de dados para um sistema de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) estabelece os princípios gerais (classificar um dado, rastrear quem pediu o quê, respeitar o direito ao esquecimento) para um dado que passa por um LLM, essencialmente **texto**. Este capítulo retoma esses mesmos princípios para uma **imagem** de documento escaneado, onde uma diferença muda tudo: apagar um dado pessoal em uma imagem não é a mesma operação que apagá-lo em texto.

## Classificar um documento antes de enviá-lo a um modelo de visão

O princípio de classificação por sensibilidade (pública/interna/pessoal/secreta, veja o [capítulo geral](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) se aplica tal como está a um documento escaneado, com uma nuance já observada em [a arbitragem local vs cloud para um modelo de visão](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision): a imagem completa de um documento frequentemente expõe **mais** informação do que o pipeline realmente busca extrair dela (toda a página, não apenas o campo útil).

> **Cuidado:** classificar um documento apenas pelo campo que se busca extrair dele (um valor, por exemplo), ignorando o resto da imagem enviada ao modelo. Uma nota fiscal escaneada integralmente pode conter, além do valor buscado, um endereço, um número de conta ou uma assinatura, igualmente expostos a um fornecedor terceiro.
>
> **Boa prática:** classificar um documento de acordo com **tudo** o que a imagem realmente contém, não apenas o campo visado pela extração.

## Apagar um dado pessoal em uma imagem: uma operação diferente

Em um banco de dados textual, substituir um valor equivale a sobrescrever uma string por outra (veja o [`DELETE` clássico](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)). Um dado pessoal visível em uma imagem escaneada (um nome manuscrito, uma assinatura, um número de documento de identidade) não tem um equivalente tão simples: ele precisa ser **localizado** e então **ocultado visualmente**, não simplesmente substituído em um banco:

| | Dado pessoal em texto | Dado pessoal em uma imagem escaneada |
|---|---|---|
| Como localizá-lo | Uma busca de string, ou uma coluna conhecida no banco | Uma [detecção de área](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (uma caixa delimitadora em volta da área a ocultar) |
| Como apagá-lo | Substituir o valor (ou removê-lo) no campo em questão | Cobrir a área detectada com um bloco opaco (*redaction*), diretamente nos pixels da imagem |
| Risco se feito mal | Um valor esquecido em um campo secundário | Uma área mal detectada (muito pequena) deixa parte do dado visível apesar da "correção" |

> **Cuidado:** desfocar uma área contendo um dado pessoal em vez de cobri-la com um bloco opaco. Um desfoque às vezes continua reversível (técnicas de reconstrução podem recuperar parte da informação desfocada, principalmente em um texto impresso com fonte regular): isso não é uma exclusão confiável.
>
> **Boa prática:** cobrir a área em questão com um bloco opaco que substitui definitivamente os pixels originais, nunca um desfoque ou efeito visual reversível.

## Retenção: o texto extraído não é o único lugar onde o dado existe

O princípio já visto (um dado pessoal pode ser copiado em vários lugares sem que um único `DELETE` baste, veja o [capítulo geral](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) ganha uma dimensão adicional com um documento escaneado: a **imagem fonte** em si é uma cópia do dado, distinta do texto que foi extraído dela.

| Lugar onde o dado pode ter sido copiado | Exclusão disparada pela exclusão do texto extraído? |
|---|---|
| Texto extraído, armazenado no banco | Sim, por definição |
| Imagem fonte do escaneamento (armazenamento bruto, antes ou depois do OCR) | Não: a imagem permanece intacta, com o dado ainda visível dentro dela |
| Registros de chamada a um OCR terceiro (veja a [deriva de versão](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Depende unicamente das condições contratuais do fornecedor |
| Cópias intermediárias (áreas recortadas para a releitura humana, veja [OCR em produção](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Não, exceto se o procedimento de exclusão as cobrir explicitamente |

> **Cuidado:** responder a um pedido de direito ao esquecimento excluindo apenas o texto extraído armazenado no banco, deixando a imagem fonte do escaneamento intacta em algum lugar (um armazenamento de arquivos, um backup): o dado pessoal permanece então totalmente visível para quem quer que acesse essa imagem.
>
> **Boa prática:** fazer o procedimento de exclusão recair sobre a imagem fonte tanto quanto sobre o texto extraído, identificando explicitamente todos os lugares onde a imagem (não só seu texto) pode ter sido copiada ou arquivada.

## O que reter

| | |
|---|---|
| **O que reter** | Os princípios de governança já vistos para um LLM (classificação, rastreabilidade, retenção) se aplicam a um documento escaneado, com uma diferença de fundo: um dado pessoal em uma imagem precisa ser localizado e então ocultado visualmente (bloco opaco), não simplesmente substituído como uma string de texto. A imagem fonte é uma cópia do dado distinta do texto extraído, e precisa ser coberta por qualquer procedimento de exclusão. |
| **Ferramentas úteis** | Uma detecção de área para localizar o dado a ocultar. Um bloco opaco aplicado diretamente aos pixels para cobri-lo de forma não reversível. |
| **Armadilhas a evitar** | Classificar um documento apenas pelo campo visado, ignorando o resto da imagem. Desfocar uma área sensível em vez de cobri-la com um bloco opaco. Excluir o texto extraído sem excluir a imagem fonte correspondente. |
| **Boas práticas** | Classificar um documento de acordo com tudo o que a imagem realmente contém. Cobrir uma área sensível com um bloco opaco, nunca um desfoque reversível. Estender qualquer procedimento de exclusão à imagem fonte, não apenas ao texto extraído. |
