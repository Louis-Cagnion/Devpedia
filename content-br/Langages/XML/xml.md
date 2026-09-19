---
order: 13
---

# XML

**XML** (*eXtensible Markup Language*) é, como o [HTML](/?c=langages&s=html&p=html), uma linguagem de marcação: dados organizados em tags aninhadas, cada uma podendo ter atributos. Ao contrário do HTML, cujas tags (`<p>`, `<div>`...) têm um significado fixado de antemão pelo navegador, o XML não impõe nenhuma tag específica: cada formato baseado em XML define seus próprios nomes de tags, conforme os dados que descreve.

```xml
<anuncio>
    <referencia>REF-001</referencia>
    <veiculo marca="Renault">
        <modelo>Clio</modelo>
    </veiculo>
</anuncio>
```

| Termo | O que significa |
|---|---|
| Elemento | Uma tag de abertura/fechamento e tudo o que ela contém (`<referencia>REF-001</referencia>`) |
| Atributo | Um par chave="valor" dentro de uma tag de abertura (`marca="Renault"`) |
| Documento bem formado | Cada tag aberta é fechada corretamente, na ordem certa, sem sobreposição (`<a><b></a></b>` é inválido) |

> **Nota:** XML e [JSON](/?c=langages&s=php&p=http) respondem à mesma necessidade (trocar dados estruturados entre sistemas), mas o XML continua comum em fluxos mais antigos (catálogos de fornecedores, exportações de negócio) montados antes da generalização do JSON.

## Ler um arquivo XML: DOM vs streaming

Duas formas de ler um arquivo XML se diferenciam pelo uso de memória:

| Abordagem | Princípio | Memória usada | Uso típico |
|---|---|---|---|
| **DOM** (*Document Object Model*) | Carrega o arquivo inteiro em uma árvore navegável, em memória | Proporcional ao tamanho do arquivo inteiro | Arquivo pequeno, necessidade de ir e vir entre várias partes do documento |
| **Streaming** (ex. `XMLReader` em PHP) | Lê o arquivo sequencialmente, um nó por vez, sem nunca carregá-lo inteiro | Constante, seja qual for o tamanho do arquivo | Arquivo grande (dezenas de milhares de entradas), processado uma vez, em ordem |

```php
<?php
$leitor = new XMLReader();
$leitor->open('catalogo.xml');

while ($leitor->read()) {
    if ($leitor->nodeType === XMLReader::ELEMENT && $leitor->localName === 'anuncio') {
        $no  = $leitor->expand();           // expande ESTE elemento em um mini-DOM local
        $doc = new DOMDocument();
        $doc->appendChild($doc->importNode($no, true));
        // ... extrair os dados de $doc, e passar para o próximo anuncio
    }
}
$leitor->close();
?>
```

`expand()` combina as duas abordagens: o arquivo inteiro continua sendo lido em streaming (memória constante), mas cada elemento individual vira uma pequena árvore DOM clássica, mais simples de consultar (`getElementsByTagName()`...) que uma varredura manual nó a nó.

> **Boa prática:** streaming para um arquivo grande processado uma única vez em ordem (uma importação de catálogo, por exemplo); DOM para um arquivo pequeno ou uma necessidade de navegação livre entre suas partes (subir a um ancestral, comparar dois ramos distantes).

## A falha XXE (*XML External Entity*)

O formato XML permite declarar uma **entidade externa**: um atalho que, uma vez usado no documento, é substituído pelo conteúdo de um recurso externo (um arquivo local, uma URL) no momento da análise:

```xml
<?xml version="1.0"?>
<!DOCTYPE anuncio [
  <!ENTITY vazamento SYSTEM "file:///etc/passwd">
]>
<anuncio>
    <referencia>&vazamento;</referencia>
</anuncio>
```

Se um parser XML resolve essa entidade sem restrição, `&vazamento;` é substituído pelo conteúdo do arquivo `/etc/passwd` (em um sistema Unix), que passa então a ficar acessível nos dados extraídos: é a falha **XXE**. Qualquer serviço que aceite XML fornecido por terceiros (uma importação de arquivo, uma API) está exposto, assim que o conteúdo XML não é garantido 100% confiável.

> **Armadilha:** achar que um simples controle do conteúdo de texto ("o arquivo parece um anúncio válido") basta para descartar uma XXE. A declaração `<!DOCTYPE ...>` pode estar em qualquer lugar no início do documento, sem mudar nada na aparência dos dados úteis que vêm depois.

### Se proteger: desativar a resolução de entidades externas

```php
<?php
libxml_set_external_entity_loader(fn () => null);

$leitor = new XMLReader();
$leitor->open('arquivo_fornecido_por_terceiros.xml');
?>
```

`libxml_set_external_entity_loader()` substitui, para todo o processo PHP, o mecanismo que busca o conteúdo de uma entidade externa por uma função que nunca retorna nada (`null`): toda entidade externa declarada no documento é então ignorada, em vez de resolvida.

> **Boa prática:** chamar essa função antes de ler qualquer documento XML cuja origem não seja 100% garantida (fornecido por um parceiro, enviado por um usuário...), mesmo que o formato esperado normalmente não preveja nenhuma entidade externa: a proteção não custa nada para um documento legítimo, que simplesmente não declara nenhuma.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | XML organiza dados em tags aninhadas com nomes livres e atributos. Ler um arquivo XML é feito em DOM (tudo em memória, navegação livre) ou em streaming (memória constante, leitura sequencial); `expand()` combina os dois. Uma entidade externa XML mal controlada permite ler um arquivo arbitrário do servidor (falha XXE). |
| **Ferramentas utilizáveis** | `XMLReader` (streaming) e `DOMDocument` (árvore completa) em PHP, `expand()` para combinar os dois, `libxml_set_external_entity_loader()` para desativar as entidades externas. |
| **Armadilhas a evitar** | Carregar um arquivo XML muito grande inteiramente em DOM (memória proporcional ao arquivo). Achar que um controle do conteúdo de texto basta para descartar uma XXE. |
| **Boas práticas** | Streaming para um processamento sequencial de grande volume, DOM para uma necessidade de navegação livre. Desativar sistematicamente a resolução de entidades externas antes de ler um documento XML de origem não garantida. |
