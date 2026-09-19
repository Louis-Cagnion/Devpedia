---
order: 10
---

# As injeções além do SQL

[As grandes famílias de falhas](/?c=securite&s=cybersecurite&p=types-de-failles) apresenta a injeção como *"um dado não confiável interpretado como uma instrução em vez de um simples valor"*, com a injeção [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) como exemplo de referência (proteção detalhada em [Protegendo seus dados](/?c=langages&s=php&p=securite)). O mesmo princípio afeta muitos outros sistemas assim que recebem um dado externo e o tratam, erroneamente, como parte do próprio código ou das próprias instruções.

## Visão geral: a mesma armadilha, um sistema alvo diferente

| Variante | Sistema alvo | Dado armadilhado típico | Defesa |
|---|---|---|---|
| Comando shell/OS | O terminal do servidor | `; rm -rf /` acrescentado a um nome de arquivo | Nunca construir um comando por concatenação de texto (detalhe abaixo) |
| LDAP | Um [diretório LDAP](https://ldap.com/basic-ldap-concepts/) (diretório de usuários/máquinas de uma empresa) | `*)(uid=*))(|(uid=*` em um campo de busca, que amplia o filtro para todas as contas | Consulta parametrizada, como em SQL |
| XPath | Um motor que consulta um documento [XML](https://developer.mozilla.org/pt-BR/docs/Web/XML/XML_introduction) | `' or '1'='1` em um identificador, que faz corresponder todos os nós do documento | Consulta parametrizada, escape dos caracteres especiais de XPath |
| Template do lado do servidor (SSTI) | Um motor de renderização como [Jinja2](https://jinja.palletsprojects.com/) ou [Twig](https://twig.symfony.com/) | `{{7*7}}` em um campo exibido como está em um template | Detalhe abaixo |
| Cabeçalho HTTP (CRLF) | O navegador ou um servidor intermediário (proxy, cache) | Quebra de linha (`\r\n`) injetada em um valor de cabeçalho de resposta | Rejeitar/escapar qualquer quebra de linha em um valor de cabeçalho gerado dinamicamente |
| Log (*log forging*) | O próprio arquivo de log, e quem o ler depois | Quebra de linha injetada em um dado registrado, que fabrica uma linha de log falsa | Escapar as quebras de linha antes de escrever um dado externo em um log |

## Injeção de comando shell/OS

Um programa que constrói um comando de sistema montando texto, e depois o transmite tal qual ao terminal, deixa o usuário adicionar suas próprias instruções nesse texto:

```python
import subprocess

# PERIGOSO: shell=True executa a string tal qual, como se fosse digitada no terminal
nome_arquivo = "foto.jpg; rm -rf /"  # fornecido pelo usuário
subprocess.run(f"convert {nome_arquivo} saída.png", shell=True)
# O comando realmente executado são DOIS comandos separados por ";":
# convert foto.jpg saída.png   E   rm -rf /

# SEGURO: cada argumento continua sendo um dado separado, nunca interpretado como shell
subprocess.run(["convert", nome_arquivo, "saida.png"])
# O nome_arquivo inteiro (incluindo o "; rm -rf /") e passado como UM Único argumento a
# convert,
# que falhara de forma limpa (arquivo não encontrado) em vez de executar qualquer coisa
```

O reflexo é o mesmo de uma consulta SQL preparada: nunca deixar um dado externo fazer parte do próprio texto do comando, sempre passá-lo separadamente, como um argumento distinto.

> **Ângulo menos evidente:** uma ferramenta de orquestração de workflows (n8n, Zapier, Airflow) frequentemente oferece um nó "Executar um comando", onde o comando é construído na CONFIGURAÇÃO do workflow em vez de no código do próprio projeto. O mesmo risco de concatenação se aplica de forma idêntica aí, mas se torna fácil de não notar em uma revisão de código clássica que examina apenas o repositório da aplicação, nunca a configuração da ferramenta de orquestração.

## SSTI: quando o motor de renderização HTML se torna um interpretador

Um motor de templates transforma um texto contendo espaços reservados (`{{ nome }}`) em uma página final, inserindo nele os valores reais. Alguns desses motores também aceitam expressões de programação reais dentro desses espaços reservados (cálculos, chamadas de função): se um dado do usuário chega diretamente ao template ANTES de sua renderização (em vez de ser apenas um valor inserido EM um espaço reservado), o motor o executa como código.

```text
Template normal, valor inserido em um espaco reservado previsto:
  "Ola {{ nome_usuário }}"  +  nome_usuario = "Louis"
  -> "Ola Louis"                                       (sem risco)

Template vulneravel, dado do usuario inserido NA estrutura do template:
  template = "Ola " + nome_usuario                       (ja e um template, nao um valor)
  se nome_usuario = "{{ 7*7 }}"
  -> o motor renderiza "Ola 49": a expressao foi EXECUTADA, nao apenas exibida
```

Um atacante que confirma esse comportamento (`{{7*7}}` exibe `49`) pode então tentar expressões mais perigosas específicas do motor usado (leitura de arquivo, execução de comando de sistema), conforme o que sua linguagem de expressão permitir.

## XXE: quando um documento XML lê o que não deveria

Um documento XML pode declarar seus próprios atalhos de texto, chamados **entidades**, e uma entidade pode apontar para um recurso EXTERNO (um arquivo local, uma URL) em vez de um simples texto:

```xml
<?xml version="1.0"?>
<!DOCTYPE dado [
  <!ENTITY arquivo_secreto SYSTEM "file:///etc/passwd">
]>
<dado>&arquivo_secreto;</dado>
```

Se o analisador XML resolve essa entidade (vai realmente ler `/etc/passwd`) antes de inserir o resultado no documento processado, o conteúdo do arquivo acaba exposto na resposta da aplicação, mesmo que nada nesse documento se pareça com um "dado" no sentido comum: é uma instrução escondida na própria sintaxe do formato.

| | |
|---|---|
| **Defesa** | Desativar a resolução de entidades externas na configuração do analisador XML utilizado (a maioria das bibliotecas modernas faz isso por padrão, mas não todas, dependendo da versão) |

## Desserialização insegura: reconstruir um objeto a partir de dados não confiáveis

**Serializar** um objeto é convertê-lo em texto/binário para armazená-lo ou enviá-lo; **desserializar** é a operação inversa: reconstruir o objeto a partir desse texto. Alguns formatos de serialização (o módulo [`pickle`](https://docs.python.org/3/library/pickle.html) do Python, `unserialize()` do PHP, ou um carregamento YAML sem restrições) permitem codificar muito mais que um simples valor: até instruções a serem executadas na reconstrução.

```python
import pickle

# PERIGOSO: pickle.loads() pode executar código arbitrario contido no dado,
# se ele vier de uma fonte não confiável (upload, parametro, mensagem recebida)
objeto = pickle.loads(dado_recebido_do_exterior)

# SEGURO: um formato de serialização que representa APENAS valores (nunca código)
import json
objeto = json.loads(dado_recebido_do_exterior)
```

| | |
|---|---|
| **Defesa** | Nunca desserializar um dado de origem externa com um formato que possa codificar código (`pickle`, `unserialize` do PHP, YAML com um carregador sem restrições); preferir um formato que represente apenas valores, como JSON |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O princípio da injeção SQL se repete de forma idêntica assim que um sistema externo (shell, diretório LDAP, documento XML, motor de templates, formato de serialização) recebe um dado e o trata erroneamente como uma instrução em vez de um simples valor. |
| **Ferramentas utilizáveis** | `subprocess.run([...])` (lista de argumentos) em vez de `shell=True`; consultas parametrizadas para LDAP/XPath; `json` em vez de `pickle`/`unserialize` para trocar dados. |
| **Armadilhas a evitar** | Construir um comando/consulta por concatenação de texto; deixar um dado do usuário chegar ao texto de um template antes de sua renderização; desserializar um dado externo com um formato capaz de codificar código; deixar um analisador XML resolver entidades externas. |
| **Boas práticas** | Sempre separar estrutura (código/consulta/comando) e dado, seja qual for o sistema alvo; desativar a resolução de entidades externas XML; escolher um formato de serialização que represente apenas valores para qualquer dado não confiável. |
