---
order: 25
---

# Dados pessoais nos logs e nas cópias (31/10/2026)

Um **log** (em inglês *log*) é o arquivo em que um programa anota o que faz e o que não vai bem, uma linha por evento (veja [a inundação de logs](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inondation-de-logs) para o caso em que ele escreve demais). Lê-se um log para entender uma falha. O problema deste capítulo: de tanto anotar « o que aconteceu », o programa também anota **quem** estava envolvido, e o log se torna, sem que ninguém tenha decidido isso, um segundo arquivo de clientes.

Este capítulo responde a quatro perguntas: o que é um dado pessoal, por onde ele entra em um log, como ele se multiplica nas cópias (**satélites**, isto é, cópias mantidas em outras aplicações, veja mais abaixo; backups; agregador de logs, isto é, um serviço que reúne no mesmo lugar os logs de muitas máquinas), e como impedi-lo, mascará-lo ou apagá-lo. Os exemplos rodam em [Python](/?c=langages&s=python&p=python), que se executa a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal); eles se apoiam nas [funções](/?c=langages&s=python&p=fonctions), nas [listas e tuplas](/?c=langages&s=python&p=listes-et-tuples), nos [dicionários](/?c=langages&s=python&p=dictionnaires-et-ensembles), nos [laços](/?c=langages&s=python&p=boucles), nas [classes](/?c=langages&s=python&p=poo), no [tratamento de erros](/?c=langages&s=python&p=gestion-des-erreurs) e nos [módulos](/?c=langages&s=python&p=modules-et-environnements). Um último exemplo mostra o mesmo problema em um sistema de gerenciamento de conteúdo (Drupal), apenas a título ilustrativo. O cabeçalho de autorização que o HTTP Basic envia a cada requisição, um dos segredos que vão parar em um log, é descrito em [Recurso REST e autenticação HTTP Basic](/?c=securite&s=cybersecurite&p=authentification-http-basic-et-ressource-rest).

> **Este capítulo não é um parecer jurídico.** Ele explica princípios gerais e técnicas. O que um texto de lei impõe na sua situação (prazos exatos, bases legais, obrigações de declaração) depende do seu país, da sua atividade e dos seus contratos: isso se decide com um jurista ou, em uma organização, com o seu encarregado da proteção de dados (o **DPO**, a pessoa encarregada de zelar por esse cumprimento). Nenhum número de artigo é citado aqui, por não ser possível verificá-lo: o texto oficial está indicado mais abaixo.

| Tema vizinho | O que o outro capítulo cobre | O que este capítulo acrescenta |
|---|---|---|
| [Gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) | Onde guardar uma senha ou uma chave de [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (o identificador secreto que dá acesso a um serviço) | Impedir que eles caiam em um log |
| [Segredos esquecidos em produção](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) | Arquivo `.env` público, segredo que ficou no histórico do Git | O segredo que vaza por uma linha de log |
| [ELK, a agregação de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs) | Reunir e pesquisar nos logs de muitas máquinas | O que foi copiado para lá, e por quanto tempo |
| [Tipos de falhas](/?c=securite&s=cybersecurite&p=types-de-failles) | As grandes famílias de falhas | Um vazamento que não é um ataque: um erro de concepção |
| [Governança de dados para um sistema de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) | Classificar, conservar e apagar os dados de um sistema de IA | O caso geral de um log de aplicação comum |

## O que é um dado pessoal

Um **dado pessoal** é toda informação que se refere a uma pessoa física **identificada ou identificável**. « Identificável » é a palavra que engana: um dado não precisa trazer um nome para ser pessoal; basta que seja possível **chegar a uma pessoa**, sozinho ou cruzando-o com outra informação.

| Dado | Por que é pessoal | Onde ele se esconde em um log |
|---|---|---|
| Endereço de e-mail | Costuma designar diretamente uma pessoa (`nome.sobrenome@...`) | Mensagem de erro de envio, formulário de login malsucedido |
| [Endereço IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) | Identifica a conexão de um assinante junto ao provedor de acesso; as autoridades europeias em geral o tratam como dado pessoal | Log de acesso do **servidor web** (o programa que recebe as visitas de um site e lhes responde), linha « Conexão de ... desde ... » |
| Identificador interno (número de usuário) | Ele remete a uma linha do banco que contém o resto | Cada linha « usuário 42 fez ... » |
| Texto livre (mensagem, comentário, endereço postal) | Uma pessoa escreve nele qualquer coisa: um nome, um telefone, um problema de saúde | Corpo de uma requisição copiado para um erro |
| Identificador de sessão ou de cookie | Ele acompanha um navegador, portanto uma pessoa, de uma página para outra (veja [sessões e cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | URL ou **cabeçalho** [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (uma linha de informação anexada a uma requisição) copiado tal qual |
| Número de cartão bancário | Ele está ligado a um titular; é também um segredo a proteger | Mensagem de recusa de pagamento, corpo de requisição |

É preciso distinguir três noções que se parecem:

| Noção | Definição | Exemplo | Continua sendo um dado pessoal? |
|---|---|---|---|
| Dado diretamente identificador | Designa a pessoa sem esforço | `lea.martin@example.org` | Sim |
| Dado **pseudonimizado** | O vínculo com a pessoa é trocado por um pseudônimo; uma informação separada (uma chave, uma tabela) permite encontrá-la | `40f9f28e8e3912b3` (veja mais abaixo) | **Sim**, enquanto o vínculo puder ser refeito |
| Dado **anonimizado** | Nenhum meio razoável de encontrar a pessoa, mesmo cruzando outras fontes | « 1.200 conexões nesta terça-feira » | Não, mas a anonimização de verdade é difícil de obter |

> **Armadilha:** achar que um dado « com hash » ou « pseudonimizado » saiu do campo da proteção de dados. Enquanto alguém, em algum lugar, tiver como refazer o vínculo (a chave, a tabela de correspondência ou simplesmente a possibilidade de adivinhar a entrada), ele continua pessoal.

Um dado pessoal não é um **segredo** no sentido do capítulo sobre a [gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets): um segredo (chave de API, senha) dá poder a quem o possui; um dado pessoal diz respeito a uma pessoa. Um número de cartão é as duas coisas ao mesmo tempo. As contramedidas deste capítulo tratam as duas famílias no mesmo filtro, porque elas vazam pelos mesmos caminhos.

## Como um dado pessoal entra em um log

Ninguém escreve `log.info("aqui está o e-mail da Léa")` por má intenção. Os vazamentos quase sempre vêm de **mensagens úteis ao diagnóstico** que copiam um pouco de contexto demais.

| Canal de vazamento | O que acontece | Exemplo (inventado) |
|---|---|---|
| Mensagem que copia a requisição | O desenvolvedor quer saber « com o que falhou » e registra a entrada inteira | `Falha para a requisição {"email": "lea@example.org", "message": "..."}` |
| Rastreamento de erro com seus parâmetros | Um **rastreamento** (*stack trace*) é a lista das funções chamadas no momento de uma [exceção](/?c=langages&s=python&p=gestion-des-erreurs) (um erro sinalizado pelo programa); conforme a ferramenta, ele mostra os valores dos argumentos, ou a linha de código com os seus valores | `ValueError: invalid literal for int() with base 10: 'lea@example.org'` |
| URL com token | Uma URL de redefinição de senha contém um **token** (um valor secreto de uso único) no endereço, e o servidor web registra o endereço completo | `GET /reset?token=a1b2c3d4e5f6` |
| Corpo de requisição | Um modo de depuração registra o **corpo** de cada requisição HTTP (veja [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), inclusive o formulário de pagamento | `POST /pagamento  cartao=4111 1111 1111 1111` |
| Consulta SQL registrada com seus valores | O nível de detalhe máximo mostra a consulta [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) com os valores já inseridos | `SELECT * FROM clientes WHERE email = 'lea@example.org'` |
| Log de acesso do servidor web | Cada requisição recebida deixa o endereço IP do visitante, o endereço pedido e às vezes o identificador de login | `203.0.113.7 - lea.martin [31/Oct/2026] "GET /conta" 200` |
| Mensagem de uma biblioteca de terceiros | Uma biblioteca copia para a sua mensagem de erro o endereço do destinatário ou o cabeçalho de autorização enviado | `Envio impossível: destinatário <lea@example.org> desconhecido` |
| Ferramenta de rastreamento de erros | Um serviço externo recebe automaticamente cada exceção com o contexto da requisição | Cópia fora da sua infraestrutura |

Eis um trecho de log como se vê em muitos servidores. Cada linha contém algo que não deveria estar ali:

```text
2026-10-31 09:12:03 INFO Conexão de lea.martin@example.org desde 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr recusado
2026-10-31 09:13:10 ERROR Pagamento recusado para o cartão 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Pedido 1234 validado
```

As linhas 1 a 3 contêm, respectivamente, um endereço de e-mail e um endereço IP, um token de redefinição e um número de cartão; só a linha 4 está saudável. Quem lê esse arquivo (um colega que depura, um prestador de hospedagem, um atacante que encontrou uma falha de leitura de arquivo, veja [tipos de falhas](/?c=securite&s=cybersecurite&p=types-de-failles)) obtém essas informações sem ter atacado o banco de dados.

Três razões tornam esse risco mais sério do que parece:

| Razão | Explicação |
|---|---|
| Os logs são menos protegidos que o banco | Mais gente tem acesso a eles (desenvolvedores, suporte, hospedagem), muitas vezes em leitura livre, sem rastro de quem leu o quê |
| Eles duram muito sem que ninguém cuide deles | Um banco tem uma lógica de negócio (uma conta é apagada); um arquivo de log cresce até o disco ficar cheio |
| Eles são copiados para outros lugares automaticamente | O agregador, o backup, a ferramenta de rastreamento de erros: veja a seção seguinte |

## As cópias: cada replicação é mais uma cópia para proteger e apagar

Um dado gravado uma vez no banco raramente fica em um único lugar. O esquema a seguir mostra um caso comum: um **referencial** (o banco que faz autoridade, aquele em que se criam e corrigem as pessoas) que envia seus dados a **satélites** (cópias mantidas por outras aplicações ou outros sites, para que funcionem sem consultar o referencial a cada vez).

```
                          +-----------------------+
   Usuário      --------->|  Aplicação            |
                          |  (referencial)        |
                          +----------+------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Satélite A  |          | Satélite B     |          | Log da        |
   | (cópia)     |          | (cópia)        |          | aplicação     |
   +------+------+          +--------+-------+          +-------+-------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Backup      |          | Backup         |          | Agregador de  |
   | de A        |          | de B           |          | logs (ELK)    |
   +-------------+          +----------------+          +---------------+
```

Cada caixa desse esquema pode conter o e-mail da Léa. A tabela seguinte lista o que isso implica:

| Cópia | Quem a controla | Como apagá-la | Armadilha clássica |
|---|---|---|---|
| Referencial | A equipe da aplicação | Uma requisição de exclusão | A única cópia em que se pensa |
| Satélite | Às vezes outra equipe, às vezes um terceiro | Uma chamada de exclusão para cada um | O satélite está desligado ou com erro no momento da chamada |
| Log da aplicação | A equipe da aplicação | Reescrever o arquivo ou deixar expirar a **retenção** (o tempo durante o qual se guarda um arquivo antes de apagá-lo) | Um arquivo onde sempre se escreve na sequência, no fim do arquivo, não se corrige facilmente |
| Agregador de logs | A equipe de operações | Exclusão por consulta no índice, ou expiração | O índice guarda uma cópia do que o arquivo já perdeu |
| Backup | A operação, às vezes um prestador | Muitas vezes impossível linha a linha: espera-se a expiração | Uma restauração reintroduz uma pessoa já apagada |
| Ferramenta externa de rastreamento de erros | Um terceiro | As próprias regras de retenção | Os dados saem da sua infraestrutura |

Duas consequências práticas:

1. **Cada cópia precisa ser protegida**: controle de acesso, [criptografia](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (tornar os dados ilegíveis sem chave), tempo de conservação. Um vazamento na cópia menos vigiada vale um vazamento no banco.
2. **Cada cópia precisa poder ser apagada**, ou expirar rápido o bastante para que o apagamento seja levado em conta sem nenhuma ação. Uma cópia que não se sabe encontrar é uma cópia que não se sabe apagar.

O capítulo sobre [sistemas de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) apresenta a mesma lista de « lugares onde o dado pode ter sido copiado » para um prompt enviado a um modelo; a lógica é idêntica para um log comum.

## O que diz o RGPD, em resumo

O **RGPD** (Regulamento Geral sobre a Proteção de Dados, um regulamento da União Europeia em vigor desde 2018) fixa as regras de tratamento dos dados pessoais das pessoas que se encontram na União. Na França, a autoridade que o faz cumprir é a **CNIL** (Comissão Nacional de Informática e Liberdades). Um log que contém um e-mail é um **tratamento** de dado pessoal como outro qualquer: está sujeito aos mesmos princípios, mesmo que ninguém o tenha criado para isso.

Os princípios gerais, traduzidos para um log:

| Princípio (formulação geral) | O que isso significa para um log |
|---|---|
| **Minimização**: coletar apenas o necessário | Registrar um identificador interno em vez de um e-mail; não registrar o corpo de uma requisição |
| **Limitação da conservação**: não guardar além do necessário | Um prazo de retenção decidido, aplicado automaticamente |
| **Integridade e confidencialidade**: proteger contra o acesso não autorizado | Permissões nos arquivos, criptografia, acesso aos logs restrito |
| **Limitação das finalidades**: usar somente para o que foi coletado | Um log de erros serve para depurar, não para acompanhar o comportamento de um cliente |
| **Direito ao apagamento** (« direito ao esquecimento »): uma pessoa pode pedir a exclusão dos seus dados, sob condições | Um pedido deve atingir **todas** as cópias, logs incluídos |

O que essa tabela não diz, e que deve ser verificado: o direito ao apagamento **não é absoluto** (uma obrigação legal de guardar um dado pode prevalecer), e alguns logs de segurança podem se justificar por mais tempo que outros. Do mesmo modo, uma violação de dados pessoais pode obrigar a avisar a autoridade em um prazo curto; o capítulo [Relatar uma falha encontrada](/?c=securite&s=cybersecurite&p=signaler-une-faille-trouvee) dá o parâmetro de 72 horas e também remete ao texto oficial.

| Onde ler o texto | Endereço |
|---|---|
| O próprio regulamento (União Europeia) | [RGPD no EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| A autoridade francesa e seus guias práticos | [CNIL](https://www.cnil.fr) |

## Primeira defesa: não registrar

A melhor proteção de um dado é nunca **escrevê-lo**. Antes de mascarar, pergunte-se se o dado é útil ao diagnóstico.

| Eu gostaria de escrever | Posso escrever no lugar | Por que basta |
|---|---|---|
| O e-mail do usuário | O identificador interno (`uid 42`) | Encontra-se a pessoa no banco; se a linha for apagada do banco, o identificador não designa mais ninguém |
| O corpo completo da requisição que falhou | Os **nomes** dos campos e o tamanho deles (`campos: email, message ; message: 412 caracteres`) | Sabe-se qual campo causa o problema sem conhecer o conteúdo |
| A URL com o seu token | A URL sem a parte depois do `?` | O caminho basta para situar a página |
| A mensagem bruta de uma biblioteca | O **tipo** do erro e um código | O texto bruto pode copiar a entrada |
| O número do cartão | Os quatro últimos dígitos | Basta para o suporte reconhecer o cartão |
| O endereço IP completo | O endereço truncado (`203.0.113.0`) | Útil para identificar um grupo de endereços vizinhos abusivo, menos preciso para identificar |

A segunda alavanca é o **nível de log**. Um nível é um limite de gravidade: o programa classifica cada mensagem (da mais tagarela `DEBUG` à mais grave `CRITICAL`) e só escreve as que atingem o limite configurado. O Python numera os níveis:

| Nível | Valor Python | Uso típico | Risco para os dados |
|---|---|---|---|
| `DEBUG` | 10 | Detalhes para o desenvolvedor: consultas SQL, corpo de requisição | **O mais alto**: é aqui que mais contexto é copiado |
| `INFO` | 20 | Eventos normais: inicialização, conexão, pedido | Médio: o identificador da pessoa costuma aparecer |
| `WARNING` | 30 | Anomalia que não impede de continuar | Médio |
| `ERROR` | 40 | Uma operação falhou | Médio: a entrada com defeito costuma ser copiada |
| `CRITICAL` | 50 | O programa não pode mais continuar | Baixo em volume |

O programa a seguir registra a mesma consulta SQL no nível `DEBUG` e duas mensagens comuns, primeiro com o limite `INFO`, depois com o limite `DEBUG`. Ele usa o módulo [`logging`](https://docs.python.org/3/library/logging.html), que vem com o Python (fala-se de sua « biblioteca padrão », veja os [módulos](/?c=langages&s=python&p=modules-et-environnements)). Escreve-se cada bloco em um arquivo com o mesmo nome do seu primeiro comentário, e depois o executa com `python3 nome.py`:

```python
# niveis.py: mostra o efeito do limite de registro
import logging  # módulo de log da biblioteca padrão
import sys      # dá acesso à saída padrão (a tela do terminal)

# Escreve as mensagens na tela. O formato é um modelo de linha:
# %(levelname)s será trocado pelo nível, %(message)s pelo texto.
logging.basicConfig(stream=sys.stdout, format="%(levelname)s %(message)s")
# Obtém um log chamado "loja" (o nome serve para encontrá-lo).
log = logging.getLogger("loja")

# Testa dois limites: INFO (20) e depois DEBUG (10).
for nivel in (logging.INFO, logging.DEBUG):
    # Define o limite: toda mensagem abaixo dele é ignorada.
    log.setLevel(nivel)
    # Anuncia o limite em uso (getLevelName dá o nome de um nível).
    print("--- nível", logging.getLevelName(nivel), "---")
    # Uma mensagem DEBUG. O marcador %s é trocado pelo argumento que segue,
    # aqui o e-mail, no momento em que a mensagem é escrita.
    log.debug(
        "Consulta SQL: SELECT * FROM clientes WHERE email = %s",
        "lea@example.org",
    )
    # Uma mensagem INFO, sem dado pessoal.
    log.info("Pedido 1234 validado")
    # Uma mensagem ERROR, sem dado pessoal.
    log.error("Pagamento recusado para o pedido 1234")
```

Saída obtida:

```text
--- nível INFO ---
INFO Pedido 1234 validado
ERROR Pagamento recusado para o pedido 1234
--- nível DEBUG ---
DEBUG Consulta SQL: SELECT * FROM clientes WHERE email = lea@example.org
INFO Pedido 1234 validado
ERROR Pagamento recusado para o pedido 1234
```

> **Armadilha:** deixar o nível `DEBUG` ativo « temporariamente » em produção para caçar um bug, e depois esquecê-lo. Durante semanas, cada consulta SQL e cada corpo de requisição vai para os logs, com os dados dos clientes.
>
> **Boa prática:** o nível padrão em produção é `INFO` ou mais alto; a passagem para `DEBUG` se decide por um período curto, em uma máquina específica, e se desfaz ao fim da investigação.

## Segunda defesa: mascarar com um filtro

Quando um dado sensível ainda pode chegar a uma mensagem (porque uma biblioteca o copia, ou porque um desenvolvedor esqueceu), coloca-se no caminho do log um **filtro de mascaramento** (em inglês *redaction*): um código que relê cada mensagem **logo antes da sua gravação** e substitui os padrões sensíveis por um valor neutro.

```
   log.info("Conexão de lea@example.org")
                      |
                      v
              +-------------------+
              | Filtro de máscara |    procura: e-mail, token, cartão, IP
              +---------+---------+
                        |
                        v
        "Conexão de [MASCARADO]"  --->  arquivo / tela / agregador
```

Para reconhecer os padrões, usam-se **expressões regulares** (*regex*), uma notação que descreve a forma de um texto, por exemplo « letras, um `@`, um domínio » (veja [regex em Python](/?c=langages&s=python&p=regex-en-python)). Uma sutileza para os números de cartão: nem toda sequência de dezesseis dígitos é um cartão (um número de pedido também pode ser). Acrescenta-se então o [**controle de Luhn**](https://fr.wikipedia.org/wiki/Formule_de_Luhn), uma fórmula de verificação que os números de cartão reais respeitam: partindo da direita, dobra-se o segundo dígito, o quarto, o sexto... (o último dígito não é dobrado; subtrai-se 9 de um dobro que passa de 9), soma-se tudo, e o total deve ser múltiplo de 10. Um número de pedido qualquer costuma falhar nesse teste e continua legível. O filtro também trata o cabeçalho `Authorization: Bearer <token>`, a forma usual de apresentar um token de acesso a uma API (veja [a segurança das APIs web](/?c=securite&s=cybersecurite&p=securite-api-web)).

Os padrões do módulo abaixo usam a notação das expressões regulares. A tabela decodifica os símbolos; `re.compile(r"...")` prepara um padrão (o `r` antes das aspas pede para manter as barras invertidas como estão), e `padrao.sub(substituicao, texto)` substitui cada parte do texto que corresponde:

| Símbolo | Sentido |
|---|---|
| `[abc]`, `[^abc]` | Um caractere entre os listados; com `^`, um caractere que **não** está na lista |
| `\w`, `\d`, `\s` | Um caractere de palavra (letra, algarismo ou `_`), um dígito, um espaço; em maiúscula (`\D`), o contrário |
| `+`, `?` | Um ou mais do que precede; zero ou um (opcional) |
| `{12,18}`, `{1,3}` | De 12 a 18 vezes, de 1 a 3 vezes o que precede |
| `\.` | Um ponto literal (sem a barra, o ponto quer dizer « qualquer caractere ») |
| `\b` | Uma fronteira de palavra: o início ou o fim de uma palavra, sem consumir caractere |
| `(a\|b)` | Um grupo que memoriza o que encontra; `\|` quer dizer « ou », e `\1` designa o primeiro grupo na substituição |
| `(?:...)` | Um grupo que serve para agrupar, sem memorizar nada |
| `(?i)` | Não distinguir maiúsculas de minúsculas (no início do padrão) |

O primeiro bloco escreve o módulo de mascaramento:

```python
# mascaramento.py: mascara os dados sensíveis em um texto e em um log
import logging    # módulo de log da biblioteca padrão
import re         # expressões regulares
import traceback  # monta o texto de um rastreamento de erro

# O texto que substitui um dado mascarado.
MASCARA = "[MASCARADO]"

# Endereço de e-mail: parte local, arroba, domínio com pelo menos um ponto.
PADRAO_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")

# Parâmetro sensível de URL ou de formulário: nome=valor (token, senha).
# password e senha são dois nomes possíveis.
PADRAO_PARAMETRO = re.compile(
    r"(?i)\b(token|access_token|api_key|password|senha)=([^&\s]+)"
)

# Cabeçalho de autorização do tipo Bearer: a palavra Bearer e depois o token.
PADRAO_BEARER = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+")

# Sequência de 13 a 19 dígitos, separados ou não por um espaço ou um hífen.
PADRAO_CARTAO = re.compile(r"\b\d(?:[ -]?\d){12,18}\b")

# Endereço IPv4 (a forma de quatro números): de um a três dígitos, separados por
# pontos. O grupo \1 guarda os três primeiros números; o quarto se perde.
PADRAO_IPV4 = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b")


def soma_de_luhn_valida(digitos):
    """Diz se uma sequência de dígitos passa no controle de Luhn dos cartões."""
    # Soma dos dígitos, após dobrar um dígito sim e outro não.
    total = 0
    # reversed lê os dígitos da direita; enumerate junta a posição (0, 1, 2...).
    for posicao, digito in enumerate(reversed(digitos)):
        # Converte o caractere em número.
        valor = int(digito)
        # Posições ímpares (o 2º, o 4º... dígito contando da direita) são dobradas.
        if posicao % 2 == 1:
            valor *= 2
            # Se o dobro passar de 9, subtrai-se 9.
            if valor > 9:
                valor -= 9
        # Acrescenta o dígito à soma.
        total += valor
    # O número é válido se o total for múltiplo de 10.
    return total % 10 == 0


def mascarar_cartao(correspondencia):
    """Substitui uma sequência de dígitos somente se ela parecer um cartão."""
    # correspondencia.group(0) é o texto inteiro encontrado pelo padrão.
    # Tira espaços e hífens (tudo o que não é dígito: \D).
    digitos = re.sub(r"\D", "", correspondencia.group(0))
    # Controle de Luhn: se estiver OK, provavelmente é um cartão, mascara-se.
    if soma_de_luhn_valida(digitos):
        return MASCARA
    # Senão (número de pedido, por exemplo), o texto fica intacto.
    return correspondencia.group(0)


def mascarar(texto):
    """Aplica todas as máscaras a um texto e devolve o texto limpo."""
    # Substitui cada e-mail pela máscara.
    texto = PADRAO_EMAIL.sub(MASCARA, texto)
    # Guarda os três primeiros números do IP e troca o último por 0.
    texto = PADRAO_IPV4.sub(r"\1.0", texto)
    # Guarda o nome do parâmetro (\1) e mascara o valor dele.
    texto = PADRAO_PARAMETRO.sub(r"\1=" + MASCARA, texto)
    # Guarda a palavra Bearer e mascara o token.
    texto = PADRAO_BEARER.sub("Bearer " + MASCARA, texto)
    # As sequências de dígitos passam pelo controle de Luhn.
    return PADRAO_CARTAO.sub(mascarar_cartao, texto)


class FiltroDeMascaramento(logging.Filter):
    """Mascara os dados sensíveis de um registro antes da sua gravação."""

    def filter(self, record):
        # record é o « registro »: o objeto que o módulo fabrica para cada mensagem.
        # msg = o texto, args = os valores a inserir (os %s),
        # exc_info = a exceção em curso (tipo, valor, rastreamento), ou None se não houver.
        # getMessage() insere os argumentos na mensagem; mascara-se o resultado.
        record.msg = mascarar(record.getMessage())
        # Os argumentos já foram inseridos: esvaziam-se para não os inserir de novo.
        record.args = ()
        # Uma exceção anexada à mensagem é formatada depois pelo log.
        if record.exc_info:
            # Monta o rastreamento agora (o * desempacota a tupla exc_info
            # em três argumentos) e depois o mascara.
            rastreamento = "".join(traceback.format_exception(*record.exc_info))
            # exc_text: o texto do rastreamento que o log escreverá no lugar do seu.
            record.exc_text = mascarar(rastreamento).rstrip("\n")
        # True quer dizer: « guarda este registro e grava-o ».
        return True
```

A classe `FiltroDeMascaramento` herda de [`logging.Filter`](https://docs.python.org/3/library/logging.html#filter-objects): o módulo chama o método `filter` para cada mensagem, e a mensagem só é gravada se ele devolver `True`.

O segundo bloco reexecuta seis eventos, primeiro sem filtro, depois com o filtro posto no **gerenciador** (o *handler*, o elemento que de fato escreve a mensagem na tela ou em um arquivo):

```python
# antes_depois.py: mesmo cenário, sem e com o filtro de mascaramento
import logging  # módulo de log da biblioteca padrão
import sys      # dá acesso à saída padrão (a tela do terminal)

from mascaramento import FiltroDeMascaramento  # o filtro escrito em mascaramento.py

# Formato de uma linha: o nível e depois a mensagem.
FORMATO = "%(levelname)s %(message)s"


def fabricar_log(nome, com_filtro):
    """Cria um log que escreve na saída padrão, com ou sem filtro."""
    # Um log com nome: dois nomes diferentes dão dois logs separados.
    log = logging.getLogger(nome)
    # Deixa passar INFO e os níveis acima.
    log.setLevel(logging.INFO)
    # O gerenciador escreve na saída padrão.
    gerenciador = logging.StreamHandler(sys.stdout)
    gerenciador.setFormatter(logging.Formatter(FORMATO))
    # O filtro é posto no gerenciador: ele vê tudo o que sai.
    if com_filtro:
        gerenciador.addFilter(FiltroDeMascaramento())
    # Liga o gerenciador ao log.
    log.addHandler(gerenciador)
    return log


def cenario(log):
    """Repete eventos que deixam vazar dados pessoais."""
    # Um e-mail passado como argumento da mensagem (ele substitui o %s), e um IP
    # escrito diretamente no texto.
    log.info("Conexão de %s desde 203.0.113.7", "lea.martin@example.org")
    # Uma URL de redefinição com o seu token.
    log.warning("GET /reset?token=a1b2c3d4e5f6&lang=fr recusado")
    # Um número de cartão de teste (válido no controle de Luhn).
    log.error("Pagamento recusado para o cartão 4111 1111 1111 1111")
    # Um cabeçalho de autorização copiado.
    log.info("Chamada de API com o cabeçalho Authorization: Bearer eyJhbGciOi.abc.def")
    # Um número de pedido de 16 dígitos que NÃO é um cartão.
    log.info("Pedido nº 1234567890123456 registrado")
    # Uma exceção cuja mensagem contém o e-mail: int() tenta converter
    # um texto em número, e falha com um ValueError (erro de valor).
    try:
        int("lea.martin@example.org")
    except ValueError:
        # log.exception escreve uma mensagem ERROR seguida do rastreamento da exceção.
        log.exception("Falha de leitura")


# Primeira passagem: sem filtro.
print("--- Sem filtro ---")
cenario(fabricar_log("sem", False))
# Segunda passagem: com filtro.
print("--- Com filtro ---")
cenario(fabricar_log("com", True))
```

Executa-se `python3 antes_depois.py` na pasta que contém os dois arquivos. Saída obtida (o caminho completo do arquivo nos rastreamentos aparece abreviado como `antes_depois.py`):

```text
--- Sem filtro ---
INFO Conexão de lea.martin@example.org desde 203.0.113.7
WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr recusado
ERROR Pagamento recusado para o cartão 4111 1111 1111 1111
INFO Chamada de API com o cabeçalho Authorization: Bearer eyJhbGciOi.abc.def
INFO Pedido nº 1234567890123456 registrado
ERROR Falha de leitura
Traceback (most recent call last):
  File "antes_depois.py", line 44, in cenario
    int("lea.martin@example.org")
ValueError: invalid literal for int() with base 10: 'lea.martin@example.org'
--- Com filtro ---
INFO Conexão de [MASCARADO] desde 203.0.113.0
WARNING GET /reset?token=[MASCARADO]&lang=fr recusado
ERROR Pagamento recusado para o cartão [MASCARADO]
INFO Chamada de API com o cabeçalho Authorization: Bearer [MASCARADO]
INFO Pedido nº 1234567890123456 registrado
ERROR Falha de leitura
Traceback (most recent call last):
  File "antes_depois.py", line 44, in cenario
    int("[MASCARADO]")
ValueError: invalid literal for int() with base 10: '[MASCARADO]'
```

Leitura da comparação:

| Evento | Antes | Depois | Observação |
|---|---|---|---|
| E-mail em um argumento | `lea.martin@example.org` | `[MASCARADO]` | A mensagem continua legível |
| Endereço IP | `203.0.113.7` | `203.0.113.0` | Truncamento do último número, não supressão |
| Token na URL | `token=a1b2c3d4e5f6` | `token=[MASCARADO]` | O parâmetro `lang=fr` não é tocado |
| Cartão bancário | `4111 1111 1111 1111` | `[MASCARADO]` | Passa no controle de Luhn |
| Cabeçalho Bearer | `Bearer eyJhbGciOi.abc.def` | `Bearer [MASCARADO]` | A palavra `Bearer` fica, o token desaparece |
| Número de pedido de 16 dígitos | `1234567890123456` | `1234567890123456` | Reprova no controle de Luhn: mantido, como se deseja |
| Rastreamento de exceção | e-mail visível na mensagem de erro e na linha de código | mascarado em toda parte | Graças ao tratamento de `exc_info` |

### Os limites do mascaramento, constatados ao executar o código

Este filtro é uma **última rede**, nunca a primeira defesa. Dois esquecimentos frequentes foram reproduzidos. Lembrete: em Python, os logs formam uma hierarquia pelo nome, separado por pontos; `app.pagamento` é o **filho** de `app`, e `app` é o seu **pai**. Segundo ponto: o parâmetro `extra=` de uma chamada ao log recebe um dicionário de campos adicionais (`log.info("texto", extra={"campo": valor})`) que o formato pode exibir depois com `%(campo)s`.

```python
# armadilhas.py: dois lugares onde um filtro mal posto não mascara nada
import logging  # módulo de log da biblioteca padrão
import sys      # dá acesso à saída padrão (a tela do terminal)

from mascaramento import FiltroDeMascaramento  # o filtro escrito em mascaramento.py

# O log pai "app", com um gerenciador de tela.
pai = logging.getLogger("app")
pai.setLevel(logging.INFO)
pai.addHandler(logging.StreamHandler(sys.stdout))
# O filtro é posto no log PAI, e não no gerenciador.
pai.addFilter(FiltroDeMascaramento())

# Uma mensagem enviada diretamente ao pai: ela passa pelo filtro.
logging.getLogger("app").info("direto: lea@example.org")
# Uma mensagem enviada a um log FILHO ("app.pagamento"): o filtro é ignorado.
logging.getLogger("app.pagamento").info("filho: lea@example.org")

# Segundo caso: um campo acrescentado pelo parâmetro extra=.
gerenciador = logging.StreamHandler(sys.stdout)
# O formato mostra a mensagem, depois o campo « email » acrescentado por extra=.
gerenciador.setFormatter(logging.Formatter("%(message)s | %(email)s"))
outro = logging.getLogger("outro")
outro.setLevel(logging.INFO)
# Desta vez o filtro está bem posto no gerenciador.
gerenciador.addFilter(FiltroDeMascaramento())
outro.addHandler(gerenciador)
# O filtro mascara a mensagem, e não os campos acrescentados.
outro.info("extra", extra={"email": "lea@example.org"})
```

Saída obtida:

```text
direto: [MASCARADO]
filho: lea@example.org
extra | lea@example.org
```

| Limite | Causa | Contramedida |
|---|---|---|
| A mensagem de um log filho não é mascarada | Um filtro posto em um **log** só se aplica às mensagens enviadas **diretamente** a esse log, não aos seus filhos | Pôr o filtro em cada **gerenciador** |
| Um campo acrescentado com `extra=` não é mascarado | O filtro acima só trata a mensagem e o rastreamento | Não pôr dado pessoal em `extra`, ou estender o filtro |
| Um nome ou um texto livre não é reconhecido | Uma expressão regular sabe detectar uma forma (e-mail, cartão), não « um primeiro nome » | Não registrar o texto livre de jeito nenhum |
| Um falso positivo mascara um valor útil | Uma sequência de dígitos que passa por acaso no controle de Luhn é mascarada | Aceitar esse custo: melhor mascarar demais do que de menos |
| Um formato inesperado passa despercebido | Um endereço escrito de outra forma (`lea (at) example.org`) não é reconhecido | Manter uma lista de padrões, revisada regularmente |
| Um endereço IPv6 não é mascarado | O padrão só trata o IPv4; o IPv6, a forma recente de endereço IP, se escreve em hexadecimal separado por `:` (por exemplo `2001:db8::1`) e passa tal qual | Acrescentar um padrão IPv6, ou não registrar o endereço |
| Um número de versão é tomado por IP | `version 1.2.3.4` vira `version 1.2.3.0`: quatro números separados por pontos parecem um IPv4 | Aceitar esse falso positivo, ou restringir o padrão ao contexto (« desde ... ») |
| Os outros gerenciadores veem a mensagem já mascarada | O filtro modifica o objeto `record` compartilhado: os gerenciadores chamados **depois** daquele que porta o filtro recebem a mensagem mascarada, os chamados **antes** já a escreveram em texto claro (com três gerenciadores, dos quais o segundo porta o filtro, o primeiro escreve o e-mail em texto claro, os outros dois o mascaram) | Pôr o filtro em cada gerenciador: cada um mascara antes de escrever, qualquer que seja a ordem |
| O custo de processamento | Cada mensagem é relida por várias expressões regulares | Medir; mascarar no nível do gerenciador, depois da filtragem por nível |

> **Armadilha:** achar que um filtro de mascaramento « resolve » o problema e parar de se preocupar com o que se registra. O filtro deixa passar tudo o que não sabe descrever.
>
> **Boa prática:** combinar: não registrar o dado (seção anterior), mascarar como rede de segurança e **verificar** o resultado procurando vazamentos periodicamente nos logs existentes (veja a lista de verificação mais abaixo).

## Terceira defesa: pseudonimizar com um HMAC

Às vezes é preciso **acompanhar uma pessoa** nos logs (« todos os erros da mesma pessoa nesta semana ») sem escrever o seu e-mail. A **pseudonimização** troca a identidade por um pseudônimo estável: a mesma pessoa sempre recebe o mesmo pseudônimo, mas o pseudônimo não revela a pessoa.

O método ingênuo é um hash simples (por exemplo SHA-256, uma função que transforma um texto em um hash de tamanho fixo, veja [criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Ele tem um defeito: o conjunto de e-mails plausíveis é pequeno. Um atacante calcula o hash de cada candidato (um **ataque de dicionário**) e compara. O **HMAC** (*Hash-based Message Authentication Code*, descrito em [o capítulo de criptografia](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) combina o hash com uma **chave secreta**: sem a chave, o atacante não consegue calcular os hashes dos seus candidatos.

O código abaixo manipula **bytes** (os números de 0 a 255 nos quais um texto é armazenado, veja [a codificação dos textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)): o prefixo `b` antes das aspas (`b"..."`) cria bytes, e `.encode("utf-8")` converte um texto em bytes segundo a codificação UTF-8.

```python
# pseudonimo.py: pseudônimo estável e não reversível sem chave
import hashlib  # funções de hash (SHA-256)
import hmac     # HMAC: um hash combinado com uma chave secreta

# Chave de demonstração (em bytes, graças ao prefixo b).
# Na prática: lida de um cofre, nunca escrita no código.
CHAVE = b"chave-secreta-de-demonstracao"
# Outra chave, para mostrar que ela muda tudo.
OUTRA_CHAVE = b"outra-chave-secreta"


def pseudonimo(email, chave):
    """Devolve um pseudônimo estável: HMAC-SHA256 do e-mail normalizado, encurtado."""
    # Normaliza: tira os espaços, passa para minúsculas, converte em bytes.
    mensagem = email.strip().lower().encode("utf-8")
    # Calcula o HMAC, escreve em hexadecimal (0-9, a-f) e guarda 16 caracteres
    # (64 bits: o bastante para que duas pessoas tenham o mesmo pseudônimo muito raramente).
    return hmac.new(chave, mensagem, hashlib.sha256).hexdigest()[:16]


def hash_simples(email):
    """Devolve o hash SHA-256 do e-mail, sem chave (não usar aqui)."""
    # Mesma normalização, mas nenhuma chave.
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:16]


# Mesma pessoa, mesma chave, mas digitada de outro jeito: mesmo pseudônimo.
print("mesma pessoa, mesma chave :", pseudonimo("Lea.Martin@example.org", CHAVE))
print("mesma pessoa, digitação   :", pseudonimo(" lea.martin@example.org ", CHAVE))
# Outra pessoa: pseudônimo diferente.
print("outra pessoa              :", pseudonimo("hugo.durand@example.org", CHAVE))
# Mesma pessoa, outra chave: pseudônimo diferente.
print("mesma pessoa, outra chave :", pseudonimo("lea.martin@example.org", OUTRA_CHAVE))

# Uma lista de candidatos que o atacante testa um a um.
candidatos = ["hugo.durand@example.org", "lea.martin@example.org", "zoe.petit@example.org"]
# Os dois pseudônimos que ele encontrou em um log roubado.
alvo_simples = hash_simples("lea.martin@example.org")
alvo_hmac = pseudonimo("lea.martin@example.org", CHAVE)

print("--- Atacante sem a chave ---")
for candidato in candidatos:
    # Ele calcula o hash simples de cada candidato: conhece o algoritmo, sem chave.
    if hash_simples(candidato) == alvo_simples:
        print("SHA-256 simples : encontrado ->", candidato)
    # Para o HMAC ele precisa adivinhar a chave: testa uma chave inventada.
    if pseudonimo(candidato, b"chave-adivinhada") == alvo_hmac:
        print("HMAC            : encontrado ->", candidato)
print("fim dos testes")
```

Saída obtida:

```text
mesma pessoa, mesma chave : 40f9f28e8e3912b3
mesma pessoa, digitação   : 40f9f28e8e3912b3
outra pessoa              : ab9eafd12b865d66
mesma pessoa, outra chave : 45ca21082b55a84d
--- Atacante sem a chave ---
SHA-256 simples : encontrado -> lea.martin@example.org
fim dos testes
```

| Propriedade | Hash simples | HMAC com chave secreta |
|---|---|---|
| Mesma pessoa, mesmo pseudônimo | Sim | Sim (enquanto a chave não mudar) |
| Recuperável por teste de candidatos | **Sim** (demonstração acima) | Não, sem a chave |
| Depende de um segredo a guardar | Não | Sim: a chave deve ser guardada como um [segredo](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Efeito de uma troca de chave | Nenhum | Todos os pseudônimos mudam: perde-se o vínculo com o histórico |
| Continua sendo um dado pessoal? | Sim | Sim, enquanto a chave existir ou os candidatos puderem ser testados |

O pseudônimo do log não serve para nada sozinho: quando é preciso encontrar a pessoa (o suporte quer entender a falha de um cliente específico), recalcula-se o HMAC do e-mail dela e procura-se esse valor nos logs. Essa busca em um só sentido é justamente o que se quer. Encurtar o hash para 16 caracteres mantém as linhas legíveis, mas quanto mais curto ele for, mais duas pessoas diferentes correm o risco de obter o mesmo pseudônimo (uma **colisão**): para um número muito grande de pessoas, guarda-se mais caracteres.

> **Armadilha:** usar um hash sem chave, ou uma chave escrita no código e versionada, e achar que os logs são « anônimos ». Um atacante que os lê testa a lista de todos os e-mails que conhece.
>
> **Boa prática:** uma chave dedicada a esse uso, guardada fora do repositório e fora dos logs; uma comparação por [`hmac.compare_digest`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) quando se verifica um valor (esta função compara dois valores em um tempo que não depende do lugar onde eles diferem, o que impede adivinhar um segredo medindo os tempos de resposta), e a consciência de que um log pseudonimizado continua submetido às mesmas regras que um log em texto claro.

Um detalhe útil: **destruir a chave** torna os pseudônimos de um log impossíveis de verificar para todos, inclusive para você. É uma ferramenta de fim de vida de um log, não um apagamento garantido: diante de um pedido de apagamento, faça um jurista ou um DPO validar essa escolha.

## Quarta defesa: duração da retenção e acesso restrito

A **duração da retenção** (vista mais acima) é o tempo durante o qual se guarda um log antes de apagá-lo. Um log que nunca é apagado é um risco que só cresce. Em Python, a **rotação** (fechar o arquivo do dia, abrir um novo, apagar os mais antigos) é fornecida pela biblioteca padrão:

```python
# rotacao.py: um arquivo por dia, no máximo 30 arquivos antigos guardados
import logging           # módulo de log da biblioteca padrão
import logging.handlers  # contém os gerenciadores que fazem a rotação dos arquivos

# À meia-noite, o arquivo do dia é arquivado e um novo começa.
# backupCount=30: no máximo 30 arquivos ANTIGOS são guardados (e não 30 dias),
# os mais velhos além disso são apagados.
gerenciador = logging.handlers.TimedRotatingFileHandler(
    "app.log", when="midnight", backupCount=30, encoding="utf-8"
)
log = logging.getLogger("loja")
# Sem esta linha, o log mantém o limite padrão (WARNING, 30):
# as mensagens INFO seriam ignoradas e app.log ficaria vazio.
log.setLevel(logging.INFO)
log.addHandler(gerenciador)
# Uma mensagem INFO, que deve aparecer em app.log.
log.info("Pedido 1234 validado")
```

Depois de `python3 rotacao.py`, o arquivo `app.log` criado na pasta atual contém a linha `Pedido 1234 validado` (sem `setLevel`, ele seria criado, mas ficaria vazio). O gerenciador conta **arquivos**, não dias: a rotação só acontece na primeira escrita depois da meia-noite, e um dia sem nenhuma mensagem não produz nenhum arquivo. Trinta arquivos podem, portanto, cobrir mais de trinta dias. Para uma retenção estrita em dias, acrescenta-se uma limpeza por data (apagar os arquivos mais antigos que a duração decidida), ou deixa-se o trabalho para a ferramenta [logrotate](https://github.com/logrotate/logrotate), que faz no Linux a mesma rotação para os arquivos de qualquer programa.

| Log | Conteúdo típico | Retenção, valor de exemplo inventado | Quem decide |
|---|---|---|---|
| Log de depuração | Detalhes técnicos, consultas | Alguns dias, nunca em produção de forma permanente | A equipe técnica |
| Log da aplicação (`INFO` e acima) | Eventos e erros | Algumas semanas | A equipe, com o jurista |
| Log de acesso do servidor web | Endereços IP, URL | A fixar conforme a finalidade (segurança, estatísticas) | O DPO ou o jurista |
| Log de segurança | Conexões, falhas de autenticação | Mais longo, justificado pela finalidade | O DPO ou o jurista |
| Backup | Cópia completa | Duração do ciclo de backup, conhecida e curta | A operação |

Os valores acima são **ordens de grandeza inventadas** para ilustrar a ideia de uma duração por tipo de log, não recomendações legais: a duração adequada se justifica pela finalidade do log, e textos podem impor a guarda de certos logs (para um provedor de hospedagem ou uma operadora, por exemplo); isso deve ser verificado.

O **acesso restrito** complementa a retenção: um log que poucas pessoas podem ler vaza menos.

| Medida | Na prática | Por quê |
|---|---|---|
| Permissões sobre os arquivos | O arquivo só é legível pela conta do serviço e por um grupo de operação (veja [permissões e arquivos](/?c=langages&s=bash&p=permissions-et-fichiers)) | Outra conta da máquina não consegue lê-lo |
| Acesso ao agregador por papel | Cada equipe vê os seus logs, não os dos outros | Menos pessoas expostas |
| Rastro das leituras | Saber quem consultou os logs sensíveis | Detectar um uso anormal |
| Nenhum envio a ferramenta de terceiros sem necessidade | Os dados saem da sua infraestrutura | Você perde o controle do apagamento |
| Criptografia dos discos e dos backups | Um suporte roubado fica ilegível | Protege as cópias « em repouso » |

## Quinta defesa: propagar o apagamento a todas as cópias

Quando uma pessoa pede o apagamento dos seus dados, a operação deve **atingir cada cópia** (veja o esquema das cópias mais acima). Dois erros são frequentes: apagar só no referencial, e esquecer o caso de uma cópia momentaneamente inacessível.

A simulação a seguir monta um **referencial** (um banco [SQLite](https://www.sqlite.org/docs.html) em memória: SQLite é um motor de banco de dados que vem com o Python e não precisa de servidor, isto é, de um programa separado que fica em execução o tempo todo), dois **satélites** (cópias remotas, aqui simples dicionários) e um **log** (um arquivo de texto). Ela apaga a Léa em quatro situações e conta, a cada vez, os rastros que restam, para a Léa e para o Hugo (que nunca deve ser tocado).

O código usa dois módulos da biblioteca padrão: [`tempfile`](https://docs.python.org/3/library/tempfile.html), que cria uma pasta temporária apagada no fim, e `pathlib`, que representa um caminho de arquivo por um objeto (veja [manipular arquivos e pastas](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)). As consultas SQL usam aqui um **parâmetro** `?`: o valor é transmitido à parte da instrução, nunca colado no texto SQL, o que impede que um valor malicioso seja executado como instrução (é a [injeção SQL](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql)).

```python
# apagamento.py: um apagamento que atinge referencial, satélites e log
import sqlite3   # banco de dados SQLite, fornecido com o Python
import tempfile  # pasta temporária, apagada automaticamente no fim
from pathlib import Path  # manipulação de caminhos de arquivos


class Satelite:
    """Uma cópia remota das pessoas, organizada por identificador externo."""

    def __init__(self, nome):
        # O nome do satélite, para as mensagens (self é o objeto em criação).
        self.nome = nome
        # As cópias: identificador externo -> e-mail.
        self.copias = {}
        # Verdadeiro se o satélite responde; falso simula uma falha.
        self.alcancavel = True

    def excluir(self, identificador_externo):
        """Exclui a cópia; falha se o satélite estiver inacessível."""
        # Um satélite fora do ar não consegue excluir nada: sinaliza-se um erro.
        # O f antes das aspas (f-string) troca {self.nome} pelo seu valor.
        if not self.alcancavel:
            raise ConnectionError(f"{self.nome} não responde")
        # pop com um valor padrão: sem erro se a cópia não existir mais.
        self.copias.pop(identificador_externo, None)


def apagar_log(caminho, padroes):
    """Reescreve o log sem as linhas que contêm um dos padrões."""
    # Só fazer isso em um arquivo em que nenhum programa escreve neste momento:
    # reescrever um log « vivo » pode perder ou danificar linhas.
    # Lê todas as linhas do arquivo.
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    # Mantém as linhas que não contêm nenhum dos padrões.
    mantidas = [linha for linha in linhas if not any(padrao in linha for padrao in padroes)]
    # Reescreve o arquivo com as linhas mantidas.
    caminho.write_text("\n".join(mantidas) + "\n", encoding="utf-8")
    # Devolve o número de linhas apagadas.
    return len(linhas) - len(mantidas)


def apagar(pessoa_id, email, base, satelites, log, completo):
    """Apaga uma pessoa; com completo=False, só o referencial é atingido."""
    # Apaga a pessoa; o ? é trocado pelo valor transmitido à parte.
    base.execute("DELETE FROM pessoas WHERE id = ?", (pessoa_id,))
    # Modo « ingênuo »: para aqui (é o erro que se quer ilustrar).
    if not completo:
        return []
    # Satélites que não conseguimos alcançar.
    pendentes = []
    for satelite in satelites:
        try:
            satelite.excluir(pessoa_id)
        except ConnectionError:
            # Anota o satélite para repetir a exclusão depois.
            pendentes.append(satelite.nome)
    # Apaga também as linhas de log que citam o e-mail.
    apagar_log(log, [email])
    return pendentes


def contar(base, satelites, log, email):
    """Conta os rastros restantes do e-mail em cada armazenamento."""
    # Número de linhas do referencial que trazem este e-mail.
    na_base = base.execute(
        "SELECT COUNT(*) FROM pessoas WHERE email = ?", (email,)
    ).fetchone()[0]
    balanco = {"referencial": na_base}
    # Número de cópias do e-mail em cada satélite.
    for satelite in satelites:
        balanco[satelite.nome] = sum(copia == email for copia in satelite.copias.values())
    # Número de ocorrências do e-mail no arquivo de log.
    texto = log.read_text(encoding="utf-8")
    balanco["log"] = texto.count(email)
    return balanco


def montar_cenario(pasta):
    """Cria o referencial, dois satélites e um log que citam a Léa."""
    # Banco em memória: desaparece no fim do programa.
    base = sqlite3.connect(":memory:")
    base.execute("CREATE TABLE pessoas (id INTEGER PRIMARY KEY, email TEXT)")
    # Duas pessoas: Léa (1) e Hugo (2).
    base.execute("INSERT INTO pessoas VALUES (1, 'lea.martin@example.org')")
    base.execute("INSERT INTO pessoas VALUES (2, 'hugo.durand@example.org')")
    # Dois satélites que receberam uma cópia das duas pessoas.
    satelites = [Satelite("satélite-norte"), Satelite("satélite-sul")]
    for satelite in satelites:
        satelite.copias = {1: "lea.martin@example.org", 2: "hugo.durand@example.org"}
    # Um log de três linhas: duas citam a Léa, uma cita o Hugo.
    log = pasta / "app.log"
    log.write_text(
        "INFO Conexão de lea.martin@example.org\n"
        "ERROR Falha no envio para lea.martin@example.org\n"
        "INFO Conexão de hugo.durand@example.org\n",
        encoding="utf-8",
    )
    return base, satelites, log


def rodar(titulo, pedido, completo, sul_alcancavel):
    """Monta um cenário novo, apaga a Léa se pedido, depois mostra o que sobra."""
    print(titulo)
    # Pasta temporária: é apagada ao sair do bloco with.
    with tempfile.TemporaryDirectory() as nome_pasta:
        base, satelites, log = montar_cenario(Path(nome_pasta))
        # Simula uma eventual falha do segundo satélite.
        satelites[1].alcancavel = sul_alcancavel
        pendentes = []
        if pedido:
            pendentes = apagar(1, LEA, base, satelites, log, completo)
        print("  pendentes :", pendentes)
        print("  Léa  :", contar(base, satelites, log, LEA))
        print("  Hugo :", contar(base, satelites, log, HUGO))


# Os dois endereços usados pelos cenários.
LEA = "lea.martin@example.org"
HUGO = "hugo.durand@example.org"
# Parâmetros: (título, apagamento pedido?, completo?, satélite sul alcançável?).
rodar("1. Antes de qualquer apagamento", False, True, True)
rodar("2. Só o referencial", True, False, True)
rodar("3. Completo, satélite sul fora do ar", True, True, False)
rodar("4. Completo, todos alcançáveis", True, True, True)
```

Saída obtida:

```text
1. Antes de qualquer apagamento
  pendentes : []
  Léa  : {'referencial': 1, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 2}
  Hugo : {'referencial': 1, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 1}
2. Só o referencial
  pendentes : []
  Léa  : {'referencial': 0, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 2}
  Hugo : {'referencial': 1, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 1}
3. Completo, satélite sul fora do ar
  pendentes : ['satélite-sul']
  Léa  : {'referencial': 0, 'satélite-norte': 0, 'satélite-sul': 1, 'log': 0}
  Hugo : {'referencial': 1, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 1}
4. Completo, todos alcançáveis
  pendentes : []
  Léa  : {'referencial': 0, 'satélite-norte': 0, 'satélite-sul': 0, 'log': 0}
  Hugo : {'referencial': 1, 'satélite-norte': 1, 'satélite-sul': 1, 'log': 1}
```

| Cenário | O que mostra |
|---|---|
| 1 | O ponto de partida: a Léa está presente cinco vezes (referencial, dois satélites, duas linhas de log) |
| 2 | O apagamento « clássico » só retira a linha do referencial: a Léa continua presente em quatro outros rastros, distribuídos em três lugares (dois satélites, o log), e ninguém percebe |
| 3 | Um satélite fora do ar: a exclusão falha, **mas o programa sabe** e devolve `['satélite-sul']`, para repetir |
| 4 | O caso completo: nenhum rastro da Léa, e o Hugo está intacto |

O que a simulação não cobre, e que é preciso prever na prática:

| Caso | Dificuldade | Prática comum |
|---|---|---|
| Satélite inacessível | A exclusão não pode ser « perdida » | Uma **fila de espera** de exclusões a repetir até o sucesso, com alerta se ela ficar pendente por tempo demais |
| Backups | Não se edita um backup linha a linha | Uma retenção curta, mais um **registro dos apagamentos** repetido depois de cada restauração |
| Agregador de logs | O índice tem sua própria cópia | Exclusão por consulta no índice, ou expiração programada |
| Log pseudonimizado | A linha não contém mais o e-mail | Recalcular o HMAC do e-mail da pessoa e procurar esse valor |
| Prova | Poder dizer o que foi feito | Guardar um registro do pedido e das suas etapas **sem** copiar nele o dado apagado |
| Log em escrita | Reescrever `app.log` enquanto o programa escreve nele risca perder ou danificar linhas | Fazer primeiro a rotação do arquivo e depois limpar o antigo, ou reescrever uma cópia fora de serviço |

> **Armadilha:** considerar o apagamento concluído assim que o pedido de exclusão no banco der certo.
>
> **Boa prática:** escrever o apagamento como um percurso explícito por **todas** as cópias, que devolve um balanço (quem respondeu, quem está pendente), e testá-lo com uma simulação como esta.

## Exemplo em um sistema de gerenciamento de conteúdo: o log do Drupal

> **Exemplo ilustrativo.** **Drupal** é um sistema de gerenciamento de conteúdo (um programa para construir e administrar um site web) escrito em [PHP](/?c=langages&s=php&p=php) (veja [o site oficial](https://www.drupal.org/docs)). Este texto descreve o sistema de log dele; os nomes são verificados no código-fonte do Drupal 11.x. A ideia geral vale para qualquer aplicação.

No Drupal, um módulo escreve no log por um **canal** (um nome que indica a origem da mensagem) com **variáveis de substituição**: o texto traz marcadores (`@mail`), e um array dá os valores deles. A vantagem é evitar colar um texto não controlado na mensagem; os marcadores `@` e `%` escapam o conteúdo, e `:` serve para os endereços. O módulo `dblog` guarda essas mensagens na base, em uma tabela chamada `watchdog`; pode-se consultá-las na tela de administração. Essa tabela também guarda, para cada mensagem, informações de contexto (usuário, endereço da página pedida, endereço IP do visitante).

```php
<?php

/**
 * Exemplo genérico: lembrete enviado a um usuário.
 */
function exemplo_enviar_lembrete(int $uid, string $email): void {
  try {
    // Simula a falha no envio de uma mensagem.
    throw new \RuntimeException('Servidor de e-mail inacessível');
  }
  catch (\Exception $e) {
    // A evitar: o endereço vai para o log, em texto claro, com a sua variável.
    \Drupal::logger('exemplo')->error('Falha no envio para @mail', [
      '@mail' => $email,
    ]);
    // Melhor: um identificador interno, que não faz mais sentido depois do apagamento.
    \Drupal::logger('exemplo')->error('Falha no envio do lembrete (uid @uid)', [
      '@uid' => $uid,
    ]);
  }
}
```

| Ideia a reter | Por quê |
|---|---|
| Uma variável de substituição protege a **exibição**, não a **confidencialidade** | O marcador `@mail` evita que um código HTML seja executado na exibição, mas o valor de `$email` continua armazenado junto com a mensagem |
| A tabela do log guarda outros dados pessoais | O endereço IP e o usuário de cada mensagem são dados pessoais além do texto |
| O log no banco também é uma cópia | Ele está nos backups do banco, e muitas vezes em um satélite ou em uma exportação |
| O número de linhas guardadas se regula | Um limite e uma limpeza periódica (tarefa agendada, veja [cron](/?c=langages&s=bash&p=automatisation-cron)) servem de retenção: conferir nas configurações do módulo |
| O identificador interno vale mais que o e-mail | Depois da exclusão da pessoa, o número não leva a lugar nenhum |
| Não registrar `$e->getMessage()` às cegas | A mensagem de uma biblioteca pode copiar o endereço do destinatário |

## Verificar o que já existe: procurar os vazamentos já gravados

Colocar o filtro em funcionamento protege o futuro. Para saber o que **já** está nos logs, percorrem-se os arquivos com [`grep`](/?c=langages&s=bash&p=traitement-de-texte) (um comando que mostra as linhas que contêm um padrão; `-E` ativa as expressões regulares estendidas, `-o` mostra só a parte que corresponde, `-n` acrescenta o número da linha, `-c` conta as linhas). Os comandos a seguir foram executados sobre o trecho de log mostrado acima. O primeiro cria o arquivo `log_exemplo.log` com essas quatro linhas (`cat > arquivo <<'FIN'` escreve no arquivo tudo o que segue, até a linha `FIN`):

```bash
# Cria log_exemplo.log com as quatro linhas do trecho.
cat > log_exemplo.log <<'FIN'
2026-10-31 09:12:03 INFO Conexão de lea.martin@example.org desde 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr recusado
2026-10-31 09:13:10 ERROR Pagamento recusado para o cartão 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Pedido 1234 validado
FIN
# Os endereços de e-mail: letras, dígitos ou . _ + - antes do arroba, domínio depois.
grep -n -E -o '[[:alnum:]._+-]+@[[:alnum:].-]+\.[[:alpha:]]+' log_exemplo.log
# Número de linhas que contêm um token ou uma senha na URL.
grep -c -E '(token|password)=' log_exemplo.log
# Os endereços IPv4: quatro números de 1 a 3 algarismos separados por pontos.
grep -n -E -o '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' log_exemplo.log
```

Saída obtida:

```text
1:lea.martin@example.org
1
1:203.0.113.7
```

| Pergunta a se fazer | Como verificar |
|---|---|
| Quais endereços de e-mail circulam nos logs? | `grep` com o padrão acima, sobre uma amostra recente |
| Há tokens ou senhas nas URLs? | `grep -c -E '(token\|password)=' arquivo`: qualquer resultado diferente de zero deve ser tratado |
| Algum satélite ou backup contém uma pessoa já apagada? | Comparar a lista dos apagamentos com o conteúdo das cópias |
| Quem pode ler os logs? | Listar as permissões dos arquivos e os papéis do agregador |
| Por quanto tempo cada log é guardado? | Reler as configurações de rotação e de expiração, e compará-las com a duração decidida |
| Alguma ferramenta externa recebe logs? | Listar os envios automáticos (rastreamento de erros, monitoramento) |

## Perguntas frequentes

| Pergunta | Resposta |
|---|---|
| Meus logs estão no formato JSON (um objeto por linha): o filtro do capítulo basta? | Não. O filtro só relê o texto da mensagem (e o rastreamento). Um dado guardado em um campo do JSON (por exemplo via `extra=`) não é tocado: é preciso mascarar campo por campo, ou, melhor ainda, nunca colocar o dado ali |
| Dá para mascarar no agregador em vez de na aplicação? | Pode-se transformar as linhas antes de indexá-las (veja [ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)), mas o arquivo de origem continua em texto claro na máquina e o dado já circulou: mascarar primeiro na origem, e além disso no agregador, se preciso |
| E os endereços IPv6? | O padrão do capítulo só trata o IPv4 (veja a tabela dos limites): é preciso acrescentar um padrão IPv6, ou não registrar o endereço |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Registrar o corpo completo de uma requisição « para depurar » | Ele contém formulários, senhas, números de cartão |
| Deixar `DEBUG` ativo em produção | Consultas SQL e corpos de requisição vão para os arquivos |
| Registrar `str(exception)` sem pensar | A mensagem de uma biblioteca costuma copiar a entrada |
| Pôr um token no endereço (`?token=...`) | O servidor web e os intermediários (proxies, servidores colocados entre o visitante e o site) registram o endereço completo |
| Contar só com o filtro de mascaramento | Ele só reconhece as formas descritas, não um nome em texto livre |
| Pôr o filtro em um log pai em vez do gerenciador | Os logs filhos escapam do filtro (reproduzido acima) |
| Pôr um dado pessoal em `extra=` | O filtro apresentado só trata a mensagem e o rastreamento |
| Usar hash de um e-mail sem chave e chamar isso de « anonimização » | Um ataque de dicionário encontra o valor (reproduzido acima) |
| Guardar a chave de pseudonimização no código | Quem lê o repositório consegue recalcular os pseudônimos |
| Apagar só no referencial | Satélites, logs e o agregador continuam com a pessoa (cenário 2) |
| Ignorar um satélite fora do ar durante o apagamento | A pessoa continua nessa cópia, sem que ninguém saiba |
| Restaurar um backup sem repetir os apagamentos | Uma pessoa apagada reaparece |
| Guardar os logs « por precaução » | Quanto maior o prazo, maior a exposição |
| Enviar logs a uma ferramenta de terceiros sem ter decidido isso | Os dados saem da infraestrutura, com as regras de retenção dela |
| Tomar este capítulo por um parecer jurídico | Prazos e obrigações dependem do país e da atividade |

## Boas práticas

| Prática | Efeito |
|---|---|
| Perguntar-se, em cada linha de log, se o dado é útil ao diagnóstico | A melhor proteção é não escrever nada |
| Registrar um identificador interno, em vez de um e-mail ou um nome | Depois da exclusão no banco, a linha não designa mais ninguém |
| Registrar os nomes e tamanhos dos campos, não o conteúdo | Diagnostica-se sem ver o dado |
| Nível `INFO` ou mais alto em produção, `DEBUG` pontual | Menos contexto copiado |
| Filtro de mascaramento posto em cada gerenciador | Última rede para e-mail, token, cartão, IP |
| Pseudonimizar com um HMAC e uma chave guardada como um segredo | Acompanhar uma pessoa sem nomeá-la |
| Rotação automática com uma duração decidida por tipo de log | Os logs não se acumulam indefinidamente |
| Permissões de acesso restritas, acesso ao agregador por papel | Menos pessoas expostas, leituras rastreáveis |
| Apagamento escrito como um percurso por todas as cópias, com um balanço | Nenhum esquecimento silencioso, um satélite fora do ar é repetido |
| Registro dos apagamentos repetido depois de uma restauração | Uma pessoa apagada não volta |
| Procurar vazamentos periodicamente nos logs existentes | Detecta-se o que o filtro não viu |
| Fazer um jurista ou um DPO validar prazos e obrigações | O capítulo explica princípios, não decide por você |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **dado pessoal** é toda informação que permite chegar a uma pessoa: e-mail, endereço IP, identificador interno, texto livre. Ele entra em um log por mensagens úteis ao diagnóstico que copiam contexto demais: requisição, rastreamento, URL com token, corpo de requisição, consulta SQL, log de acesso. Cada **cópia** (satélite, backup, agregador, ferramenta externa) é mais uma cópia para proteger e apagar. O RGPD fixa, em resumo, a **minimização**, uma **conservação limitada**, a **segurança** dos dados e um **direito ao apagamento** não absoluto; o texto oficial e um jurista ou um DPO decidem os detalhes. Defesas, nesta ordem: **não registrar**, **níveis** de log, **mascaramento** por filtro (última rede), **pseudonimização** por HMAC com chave secreta (o pseudônimo continua sendo um dado pessoal enquanto o vínculo puder ser refeito), **retenção** limitada, **acesso restrito**, **apagamento propagado** a todas as cópias, com um balanço. |
| **Armadilhas a evitar** | Corpo de requisição registrado; `DEBUG` deixado em produção; `str(exception)` copiado; token na URL; filtro sozinho para se tranquilizar; filtro posto em um log pai; dado em `extra=`; hash sem chave tomado por anonimização; chave versionada junto com o código; apagamento limitado ao referencial; satélite fora do ar ignorado; backup restaurado sem repetir os apagamentos; logs guardados « por precaução »; envio automático a uma ferramenta de terceiros; este capítulo tomado por parecer jurídico. |
| **Boas práticas** | Registrar um identificador interno, não o e-mail; registrar os nomes dos campos, não os valores; `INFO` por padrão; um filtro de mascaramento em cada gerenciador; HMAC com chave guardada como um segredo; rotação automática e duração decidida por tipo de log; permissões rigorosas; apagamento escrito como um percurso por todas as cópias, com fila de repetição e registro repetido após restauração; busca periódica de vazamentos no que já existe; prazos e obrigações validados por um jurista ou um DPO. |
