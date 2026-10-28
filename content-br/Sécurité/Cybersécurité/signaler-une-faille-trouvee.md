---
order: 22
---

# Relatar uma vulnerabilidade encontrada em um site: o que a lei permite e a divulgação responsável (28/10/2026)

Este capítulo oferece referências gerais e não constitui um parecer jurídico: a lei varia de um país para outro e muda com o tempo, e somente uma pessoa qualificada (advogada ou advogado, jurista) pode dizer o que se aplica a um caso específico; a França serve de exemplo principal, com referências para a União Europeia e os Estados Unidos.

Uma **falha** (ou *vulnerabilidade*) é um defeito de um sistema que permite fazê-lo agir de outra forma que a prevista (ver [as grandes famílias de falhas](/?c=securite&s=cybersecurite&p=types-de-failles)). A questão tratada aqui é a de todo curioso que aprende segurança: "Posso procurar falhas em um site da internet, depois avisar as pessoas que o gerenciam por e-mail ou de outra forma, ou isso é ilegal?" A resposta depende menos do que se faz do que da **autorização** que se tem, e da maneira como se avisa em seguida. Os nomes dos sites deste capítulo (`example.org`) são fictícios.

## A resposta curta

| Pergunta | Resposta curta |
|---|---|
| Posso procurar falhas em um site que não é meu? | Em geral **não, não sem autorização**, mesmo sem má intenção: na maioria das vezes é uma infração |
| Posso avisar os gestores do site? | **Sim**, é possível e útil, mas o relato envolve riscos e não apaga o que foi feito antes |
| O que torna a busca legítima? | Uma **autorização explícita**: contrato ou mandato de teste, política de divulgação ou programa de recompensa, dentro do seu escopo preciso |
| E se eu topar com uma falha sem procurá-la? | Parar, anotar o mínimo, relatar **em privado** pelo canal previsto, não publicar nada antes da correção |

O restante do capítulo explica cada linha desta tabela.

## Por que é ilegal: o acesso não autorizado

Uma imagem ajuda a entender. A porta de uma loja fechada tem uma fechadura quebrada: entrar "para avisar o proprietário" continua sendo entrar em um lugar onde não se tem o direito de estar. Em informática, a lógica é a mesma: o que conta não é a dificuldade técnica nem a intenção, mas o fato de **ter sido autorizado** ou não.

Na França, o **Code pénal** (Código Penal francês, o texto que define as infrações e as suas penas, consultável no [Légifrance](https://www.legifrance.gouv.fr/), o site oficial do direito francês) dedica seus artigos 323-1 e seguintes às violações de um **sistema de tratamento automatizado de dados** (na prática, qualquer sistema informático: um servidor, um site, um aplicativo, um banco de dados).

| Artigo | O que ele pune (resumo) |
|---|---|
| 323-1 | Acessar ou se manter, **fraudulentamente**, em todo ou em parte de tal sistema |
| 323-2 | Entravar ou falsear seu funcionamento (por exemplo sobrecarregando-o, ver [a negação de serviço](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| 323-3 | Introduzir, extrair, deter, reproduzir, transmitir, suprimir ou modificar fraudulentamente dados do sistema (a verificar no Légifrance para a lista exata dos atos) |
| 323-3-1 | Fornecer ou deter, sem motivo legítimo, ferramentas concebidas para cometer essas infrações; a lei cita a pesquisa e a segurança informática entre os motivos legítimos (a verificar no Légifrance) |
| 323-7 | A tentativa é punida como a própria infração (a verificar no Légifrance) |

As penas são prisão e multa; seus valores mudam conforme o artigo e a lei em vigor: o melhor é ler no Légifrance do que em um curso.

Três termos merecem uma precisão:

| Termo | Sentido |
|---|---|
| **Acesso** | Entrar no sistema, mesmo sem quebrar nenhuma proteção: um simples teste de credenciais, ou um endereço adivinhado, pode bastar |
| **Permanência** | Continuar em um sistema depois de ter entendido que não se tem o direito de estar nele: um acesso obtido por acaso torna-se um problema se continuamos a explorar |
| **Fraudulentamente** | Sabendo que não se está autorizado: é o elemento moral da infração |

### O que a boa intenção não apaga

Querer avisar o proprietário não elimina a infração: a intenção de fazer o bem não é uma autorização. Os juízes levam, porém, o contexto em conta, e a jurisprudência (o conjunto das decisões dos tribunais) é matizada: a boa-fé, a ausência de dano e a forma de avisar pesam na decisão e na pena, sem impedir a acusação. Um caso francês muito citado, o do **extranet** (a parte de um site reservada a parceiros) de um órgão público, julgado em apelação em 2014 e depois pela *Cour de cassation* (Corte de Cassação, a mais alta instância penal) em 2015, mostra também que um arquivo **tecnicamente acessível** (sem senha, encontrado por um mecanismo de busca) não é por isso **autorizado**: continuar a acessá-lo sabendo que ele não se destinava ao público foi julgado como permanência fraudulenta (a verificar no Légifrance para o detalhe da decisão).

Eis, do mais inofensivo ao mais grave, como um mesmo assunto se desdobra. Esta tabela é uma estimativa pedagógica, jamais uma decisão judicial:

| Gesto em um site que não é seu | Risco jurídico | Por quê |
|---|---|---|
| Ler o que a página envia a qualquer visitante (seu **código-fonte**, o texto recebido pelo navegador, ou uma mensagem de erro exibida espontaneamente) | Baixo | Nada é contornado: o site enviou essa informação a todo mundo |
| Iniciar um **scanner automático** (um programa que envia centenas de requisições de teste) | Alto | É um comportamento de ataque, e pode perturbar o serviço |
| Adivinhar um endereço oculto, ou trocar um número no endereço para ver a página de outra pessoa | Alto | Procura-se alcançar o que não se destinava a si |
| Tentar uma senha padrão ou credenciais | Alto | É um acesso por contorno |
| Abrir, ler ou baixar dados de terceiros | Muito alto | Extração de dados, com ainda um problema de privacidade |
| Testar na conta de outra pessoa | Muito alto | Violação direta de um terceiro |
| Sobrecarregar o site para "ver se aguenta" | Muito alto | Entrave ao funcionamento |

## Os referenciais fora da França

| Zona | Referenciais (a verificar na fonte oficial) |
|---|---|
| União Europeia | Uma **diretiva** (um texto que cada Estado deve transpor para a sua própria lei) de 2013, numerada 2013/40/UE, impõe a punição do acesso ilegal aos sistemas de informação. A diretiva NIS2 (2022/2555) incentiva a divulgação coordenada e prevê um **CSIRT** nacional, uma equipe de resposta a incidentes que serve de intermediário de confiança. O regulamento sobre a ciber-resiliência (2024/2847; um **regulamento** europeu se aplica diretamente, sem passar por uma lei nacional) exige que os fabricantes de produtos digitais gerenciem os relatos de vulnerabilidades |
| Estados Unidos | O *Computer Fraud and Abuse Act* (18 U.S.C. § 1030) pune o acesso "sem autorização" ou "ultrapassando a autorização". Uma política do Departamento de Justiça, publicada em 2022, diz que não se deve processar a pesquisa de segurança feita de boa-fé, mas isso não é uma lei: ela não impede nem processos de outro tipo nem uma ação civil |
| Em outros lugares | Muito variável: alguns países protegem explicitamente os pesquisadores, outros não. Várias leis podem se aplicar ao mesmo tempo (a da pessoa, a do país do servidor) |

A União Europeia reúne países cujas leis não são idênticas: o texto europeu fixa um quadro, e é a lei nacional que se aplica.

## O que se encontra tipicamente por acaso

Muitos relatos vêm de uma descoberta fortuita. Eis os casos comuns, com o capítulo que explica a falha:

| O que se percebe | A falha correspondente |
|---|---|
| Uma página que lista o conteúdo de uma pasta (uma **listagem de diretório**) com nomes de arquivos sensíveis | Arquivo ou cópia de segurança exposto, ver [os segredos esquecidos em produção](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) |
| Uma chave de acesso (um segredo) visível no código da página | Segredo exposto, ver [a gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Uma página de administração ou de dados exibida sem senha | Controle de acesso falho, ver [o OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| Uma mensagem de erro que revela detalhes internos (caminhos, versão, requisição) | Vazamento de informação, ver [as famílias de falhas](/?c=securite&s=cybersecurite&p=types-de-failles) |
| Uma versão muito antiga de um componente conhecida por uma falha | Dependência vulnerável, ver [a segurança das dependências](/?c=securite&s=cybersecurite&p=securite-des-dependances) |

Notar não faz cruzar a linha; abrir, testar, investigar pode fazê-lo.

## O que muda com uma política de divulgação

Uma **política de divulgação de vulnerabilidades** (em inglês *VDP*, para *Vulnerability Disclosure Policy*) é um texto público em que uma organização diz como lhe relatar uma falha, o que autoriza e o que promete em troca. Um **programa de bug bounty** ("caça às falhas recompensada") vai além: ele paga uma recompensa, conforme a gravidade, a quem relatar uma falha válida (ver [o bug bounty e o pentest](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite)).

Esses textos dão uma **autorização explícita**, mas **somente** dentro de um escopo preciso (os endereços listados, as técnicas permitidas):

| Situação | Autorização para procurar | Recompensa | O que saber |
|---|---|---|---|
| Nenhuma política publicada | Nenhuma | Nenhuma | Procurar continua arriscado; só se pode relatar uma descoberta fortuita |
| Política de divulgação (VDP) | Sim, dentro do seu escopo | Muitas vezes nenhuma (agradecimentos) | Ler o escopo e as regras antes de qualquer teste |
| Programa de bug bounty | Sim, dentro do seu escopo | Sim, conforme a gravidade | Muitas vezes gerido por uma plataforma intermediária, com suas próprias regras |
| Teste de intrusão mandatado | Sim, por contrato escrito | Remuneração do prestador | Quadro fixado antes (escopo, horários, regras) |

Uma política séria contém quase sempre:

| Elemento | O que diz |
|---|---|
| **Escopo** | Os endereços e serviços autorizados; todo o resto é proibido, mesmo sob o mesmo **nome de domínio** (a parte do endereço que designa o site, como `example.org`) |
| Técnicas proibidas | Por exemplo a negação de serviço, a engenharia social (ver [o phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)), o acesso aos dados de outros usuários |
| **Cláusula de não processo** (*safe harbor*, "porto seguro") | A organização promete não processar quem respeita as regras |
| Contato e prazos | Para quem escrever, em que prazo ela responde e corrige |

Esta cláusula vincula somente a organização que a redige: ela não obriga nem a justiça, nem um terceiro cujos dados ou sistemas seriam afetados (a verificar com um jurista para um caso específico). As plataformas de intermediação mais conhecidas:

| Plataforma | Papel | Endereço oficial |
|---|---|---|
| YesWeHack | Põe em contato organizações e pesquisadores; empresa francesa | [yeswehack.com](https://www.yeswehack.com/) |
| HackerOne | Idem; empresa americana | [hackerone.com](https://www.hackerone.com/) |
| Bugcrowd | Idem; empresa americana | [bugcrowd.com](https://www.bugcrowd.com/) |
| Intigriti | Idem; empresa europeia | [intigriti.com](https://www.intigriti.com/) |

### O arquivo `security.txt`

Quando uma organização não tem programa, ela pode mesmo assim indicar onde lhe relatar uma falha. O arquivo **`security.txt`** é um pequeno arquivo de texto, definido pela norma **RFC 9116** (uma **RFC** é um documento técnico de referência da internet, [legível aqui](https://www.rfc-editor.org/rfc/rfc9116)), colocado no endereço `/.well-known/security.txt` do site. A pasta `.well-known` ("bem conhecido") é reservada aos arquivos padrão que se procura em um local previsível.

```text
# As linhas que começam com # são comentários, ignorados pelos leitores
# Contact: onde escrever (obrigatório); mailto: introduz um endereço de e-mail
Contact: mailto:securite@example.org
# Expires: data de fim de validade do arquivo (obrigatório), formato de data ISO 8601
Expires: 2027-06-30T23:00:00.000Z
# Encryption: o endereço da chave pública para criptografar a mensagem
Encryption: https://example.org/.well-known/chave-publica.asc
# Policy: o endereço da política de divulgação completa
Policy: https://example.org/politica-de-divulgacao
# Preferred-Languages: os idiomas aceitos no relato
Preferred-Languages: fr, en
# Canonical: o endereço oficial deste arquivo, para identificar uma cópia falsificada
Canonical: https://example.org/.well-known/security.txt
```

| Campo | Função | Obrigatório |
|---|---|---|
| `Contact` | Endereço de e-mail, formulário ou telefone para relatar | Sim |
| `Expires` | Depois dessa data, o arquivo não deve mais ser considerado confiável: provavelmente está abandonado | Sim |
| `Encryption` | Chave pública para criptografar a mensagem (ver [a criptografia assimétrica](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) | Não |
| `Policy` | Link para a política de divulgação | Não |
| `Preferred-Languages` | Idiomas compreendidos | Não |
| `Canonical` | Endereço oficial do arquivo | Não |
| `Acknowledgments` | Página que agradece às pessoas que relataram uma falha | Não |

Ele deve ser servido em **HTTPS** (a versão criptografada do HTTP, ver [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), para que ninguém possa substituí-lo por um contato falso. Atenção: um `security.txt` diz **onde relatar**; ele não autoriza testar. A autorização vem da política que ele referencia, se houver uma.

## A divulgação coordenada

**Divulgar** uma falha é torná-la pública. Existem três atitudes:

| Modelo | Princípio | Vantagem | Risco |
|---|---|---|---|
| Divulgação imediata (*full disclosure*) | Publicar tudo de imediato | Pressão máxima para corrigir | Os atacantes aproveitam a falha antes da **correção** (*patch*, a atualização que a elimina): os usuários ficam expostos |
| **Divulgação coordenada** (chamada "responsável") | Relatar **em privado**, deixar um prazo razoável para corrigir, publicar após a correção ou após um prazo anunciado | Os usuários ficam protegidos antes que a falha se torne conhecida | Exige paciência; a organização pode demorar |
| Silêncio | Não dizer nada a ninguém | Pouco risco para si | A falha permanece aberta, e outros podem encontrá-la |

A norma **ISO/IEC 29147** descreve como receber e publicar as informações sobre uma vulnerabilidade, e a **ISO/IEC 30111** como tratá-las internamente; a divulgação coordenada é a prática que essas normas organizam.

O prazo se fixa com antecedência e se ajusta. Um prazo de 90 dias é muitas vezes citado no setor (por exemplo pela equipe de segurança do Google), mas não é uma regra de lei: uma falha já explorada por atacantes justifica um prazo menor, e uma correção complexa pode exigir um prazo maior. Uma vez corrigida e publicada, a falha pode receber um identificador **CVE** no catálogo público das falhas conhecidas (ver [as famílias de falhas](/?c=securite&s=cybersecurite&p=types-de-failles)).

## Na França: a ANSSI e o CERT-FR

A **ANSSI** (Agence nationale de la sécurité des systèmes d'information, Agência nacional de segurança dos sistemas de informação) é o serviço do Estado encarregado da cibersegurança ([site oficial](https://cyber.gouv.fr/)). O **CERT-FR** é o centro governamental de vigilância, alerta e resposta a ataques informáticos, vinculado à ANSSI ([site oficial](https://www.cert.ssi.gouv.fr/)). *CERT* significa *Computer Emergency Response Team*, "equipe de resposta a emergências informáticas".

| O que se sabe | O que verificar no site oficial |
|---|---|
| O CERT-FR oferece um dispositivo de relato de vulnerabilidades | O endereço exato, o formulário eventual e a chave para criptografar a mensagem |
| Ele publica avisos e alertas de segurança sobre falhas conhecidas | Quem pode relatar, e para que tipos de sistemas |
| Ele pode servir de intermediário quando não se encontra nenhum contato | O que ele faz depois do relato (transmissão à organização, prazos) |
| Uma lei de 2016 sobre o digital protege a confidencialidade de quem relata de boa-fé à ANSSI (artigo L. 2321-4 do Code de la défense) | O texto exato e seu alcance: ele organiza o relato, ele **não autoriza** a posteriori um acesso feito sem direito |
| A CNIL (Commission nationale de l'informatique et des libertés, Comissão nacional de informática e liberdades, [cnil.fr](https://www.cnil.fr/)) trata as violações de dados pessoais | Seu papel preciso conforme o caso |

Fora da França, o mesmo papel é exercido pelo CERT ou pelo CSIRT nacional, por exemplo a [CISA](https://www.cisa.gov/) nos Estados Unidos; em nível europeu, a agência [ENISA](https://www.enisa.europa.eu/) publica recursos.

## Como relatar na prática

### A quem escrever

Procura-se nesta ordem, parando no primeiro contato encontrado:

| Ordem | Onde procurar | Observação |
|---|---|---|
| 1 | Uma página "segurança" ou uma política de divulgação do site | Ler o escopo e as regras antes de escrever |
| 2 | O arquivo `/.well-known/security.txt` | Verificar a data `Expires` |
| 3 | Um endereço dedicado (por convenção `security@` seguido do nome de domínio) ou a página de contato | Evitar o endereço do suporte ao cliente, lido por muita gente |
| 4 | A plataforma de bug bounty citada pela organização | Seguir suas regras de envio |
| 5 | O CERT nacional (na França, o CERT-FR) | Se nenhum contato existir ou se a organização não responder |
| 6 | Para uma biblioteca livre: o arquivo `SECURITY.md` ou o relato privado do repositório de código (ver [GitHub e as plataformas](/?c=qualite-performance-et-outils&s=git&p=github-et-plateformes)) | Uma falha em uma dependência se relata a seus **mantenedores** (as pessoas que gerenciam o projeto) (ver [a segurança das dependências](/?c=securite&s=cybersecurite&p=securite-des-dependances)) |

Jamais em uma rede social, um fórum, um comentário público ou um ticket visível para todos: seria publicar antes da correção.

### Criptografar quando possível

Se o `security.txt` ou a política fornecer uma **chave pública**, a mensagem se criptografa com ela: somente a organização, que detém a chave privada associada, poderá lê-la (ver [a criptografia assimétrica](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). O padrão corrente para um e-mail é o **OpenPGP** ([openpgp.org](https://www.openpgp.org/)). Sem chave fornecida, escreve-se uma mensagem sóbria (onde, o quê, impacto) e evita-se anexar detalhes que permitiriam a um leitor mal-intencionado reproduzir a falha; propõe-se um canal seguro para a continuação.

### O que colocar na mensagem

| Referência | Conteúdo | Por quê |
|---|---|---|
| [1] Assunto | Uma linha clara: "Relato de segurança: …" | O e-mail não é confundido com spam |
| [2] Onde | O endereço (URL) preciso, a data e a hora da descoberta | Permite localizar o problema nos **registros** (os arquivos em que o servidor anota o que aconteceu) |
| [3] O quê | O que se viu, em uma ou duas frases | A equipe entende do que se trata |
| [4] Reproduzir | As etapas **mínimas**, sem explorar a falha | Provar sem ir além |
| [5] Impacto | O que um atacante poderia fazer, sem tê-lo feito | Definir a prioridade |
| [6] Dados | Nenhum dado de terceiros em anexo, no texto ou em captura de tela | Não divulgar dados pessoais |
| [7] Continuação | Um prazo de publicação proposto e um contato para responder | Estabelecer a divulgação coordenada |

```text
[1] Assunto: Relato de segurança: listagem de diretório em www.example.org

Olá,

[2] Em 28/10/2026, por volta das 14h (horário de Paris), percebi que o endereço
    https://www.example.org/sauvegarde/ exibe a lista dos arquivos da pasta.
[3] Essa lista contém um arquivo chamado "clients-2026.sql".
[4] Para constatar: abrir o endereço acima em um navegador.
[5] Se esse arquivo for de fato uma cópia da base de clientes, qualquer pessoa
    poderia baixá-la.
[6] Não abri nem baixei nenhum arquivo, e não anexo nenhum dado.
[7] Proponho não publicar nada antes da sua correção, ou no mais tardar em
    90 dias sem resposta da sua parte. Você pode me responder neste endereço.

Atenciosamente,
Nome Sobrenome
```

O exemplo ilustra a **prova mínima**: a própria página basta para provar a falha, não é preciso abrir o arquivo, e fazê-lo mudaria a natureza do ato.

## O percurso de um relato

```text
1. Descoberta           por acaso, ou dentro de um escopo autorizado
        |               parar: não ir além do necessário
        v
2. Prova mínima         endereço, data, hora; nenhum dado de terceiros
        |
        v
3. Contato              política, security.txt, plataforma ou CERT nacional
        |               mensagem privada, criptografada se houver chave pública
        v
4. Confirmação de recebimento
        |               sem resposta: novo contato, depois CERT nacional
        v
5. Correção             a organização corrige; trocas sobre o prazo
        |
        v
6. Publicação           após a correção, ou após o prazo anunciado
```

## O que nunca se faz

| Proibido | Por quê | O que continua permitido |
|---|---|---|
| Baixar ou guardar dados de terceiros | Violação da privacidade deles, e extração de dados no sentido da lei | Descrever o que se viu, sem cópia |
| Testar nas contas de outras pessoas | Atinge diretamente um terceiro | Criar as próprias contas de teste, se a política permitir |
| Provocar uma negação de serviço ou um teste de carga | Entrave ao funcionamento do serviço | Nada: é quase sempre excluído das políticas |
| Ir além da prova mínima (pular para outros sistemas, instalar-se, permanecer conectado) | Cada passo a mais agrava o acesso | Parar assim que a falha estiver comprovada |
| Extorquir: pedir dinheiro em troca do silêncio, ameaçar publicar | Isso se parece com extorsão ou chantagem, infrações graves | Aceitar uma recompensa **prevista** por um programa de bug bounty |
| Publicar antes da correção ou antes do prazo anunciado | Expõe os usuários | Publicar após a correção, de comum acordo |
| Ignorar o escopo de um bug bounty | Fora do escopo, a autorização desaparece | Tocar somente nos endereços listados, ou pedir por escrito |
| Armar ciladas para as pessoas do site (mensagens falsas, ver [o phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) | Fora do quadro de quase toda política | Permanecer apenas no ponto técnico |
| Vender a falha a terceiros | Risco penal grave e danos aos usuários | Relatá-la ao proprietário |

## Do lado do responsável pelo site

O capítulo também se dirige às pessoas que gerenciam um site: são elas que tornam um relato fácil, ou o desencorajam.

| Ação | Por quê | Como |
|---|---|---|
| Publicar uma política de divulgação | Diz claramente o que é autorizado e em quais condições | Uma página do site: escopo, regras, contato, prazos |
| Publicar um `security.txt` | Um pesquisador encontra o contato em poucos segundos | `/.well-known/security.txt`, `Expires` a renovar |
| Acompanhar o endereço de contato | Um relato ignorado acaba às vezes publicado | Endereço dedicado, lido por mais de uma pessoa |
| Responder rápido | Uma confirmação de recebimento tranquiliza e evita a publicação precipitada | Na prática, em poucos dias úteis |
| Corrigir e manter informado | O pesquisador pode então publicar com a sua concordância | Informar uma data de correção, mesmo aproximada |
| Agradecer | Encoraja relatos futuros | Página de agradecimentos (`Acknowledgments`) |
| Não ameaçar de processos um pesquisador de boa-fé | Desencoraja qualquer relato, e a falha permanece aberta | Escrever uma cláusula de não processo na política |
| Notificar se dados pessoais forem atingidos | O **RGPD** (o regulamento europeu sobre a proteção de dados pessoais) exige avisar a autoridade (na França, a CNIL) em até 72 horas, conforme o risco (artigo 33, a verificar no site oficial) | Guardar a prova da data da descoberta |

## O que fazer se eu encontrar uma falha por acaso?

| Situação | O que fazer | Por quê |
|---|---|---|
| Notei um defeito visível sem forçar nada | Anotar o endereço, a data e a hora; não explorar; procurar o contato | Notar não faz cruzar a linha |
| O site tem um bug bounty ou uma política | Ler o escopo, seguir as regras, enviar o relato pelo canal indicado | A autorização existe, mas somente dentro do escopo |
| Gostaria de verificar se é realmente explorável | Não fazê-lo sozinho; **pedir por escrito** uma autorização de teste | Sem autorização, testar é o ato arriscado |
| Já abri ou baixei dados de terceiros | Parar, não divulgá-los nem enviá-los, não os mencionar na mensagem, pedir conselho a um advogado antes de agir | As cópias são uma prova contra mim e um dano aos terceiros |
| Não encontro nenhum contato | Escrever ao CERT nacional (CERT-FR na França), verificar o procedimento em seu site | Ele serve de intermediário (a verificar no site oficial) |
| Nenhuma resposta após vários dias | Retomar pelo mesmo canal, depois passar pelo CERT nacional; não publicar | O silêncio não autoriza a publicação |
| Me ameaçam com processos | Guardar as trocas, não publicar nada em represália, consultar um advogado | Publicar na raiva agrava a situação |
| A falha está em um sistema do meu empregador ou do meu cliente | Passar pela via interna (responsável de segurança, contrato) | O contrato pode já fixar a regra |
| Quero treinar sem risco | Usar um CTF ou um laboratório próprio (ver [o CTF](/?c=securite&s=securite-offensive&p=ctf-capture-the-flag) e [a exploração web do lado do atacante](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant)) | O quadro é feito para isso |

## Síntese

Procurar falhas em um site que não é seu é, em geral, ilegal por falta de autorização, mesmo com boas intenções; uma descoberta fortuita se relata, em privado, com a prova mínima e sem tocar nos dados de outrem. Um programa de recompensa ou uma política de divulgação dá uma autorização, mas somente dentro do seu escopo; o arquivo `security.txt` diz onde escrever. A divulgação coordenada deixa o tempo de corrigir antes de publicar, e as organizações tornam tudo isso possível publicando uma política, respondendo rápido e não ameaçando as pessoas de boa-fé. Na França, o CERT-FR da ANSSI é o recurso quando nenhum contato existe.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| "Avisei com gentileza, então é legal" | O relato não apaga o acesso não autorizado que o precedeu, e pode servir de prova desse acesso |
| Achar que um endereço sem senha é autorizado | Tecnicamente acessível não quer dizer autorizado; continuar a ir lá é uma permanência fraudulenta |
| "Testo só um pouco para ter certeza" | Cada teste é um ato: a verificação é o que torna a situação arriscada |
| Lançar um scanner "para ajudar" | Um scanner age como um ataque e pode perturbar o serviço |
| Pedir dinheiro em um site sem programa de recompensa | Pode ser visto como extorsão |
| Achar que um bug bounty autoriza o domínio inteiro | Somente os elementos listados no escopo são autorizados (um subdomínio ou um prestador terceiro não necessariamente faz parte) |
| Achar que uma promessa de não processo vincula a justiça e os terceiros | Ela vincula somente a organização que a dá (a verificar com um jurista) |
| Publicar após certo número de dias sem avisar | A divulgação coordenada exige um prazo anunciado e um último contato |
| Anexar capturas contendo dados pessoais | Você mesmo espalha dados que deveria proteger |
| Confiar em um `security.txt` desatualizado | Um arquivo cuja data `Expires` passou já não é garantido |
| Tomar este capítulo por um parecer jurídico | As referências são gerais: a lei muda e cada caso é particular |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Ler a política de divulgação e o seu escopo **antes** de tocar em qualquer coisa | A autorização só existe dentro desse quadro |
| Treinar nos próprios sistemas, em CTFs ou laboratórios previstos para isso | Nenhum risco jurídico, e a mesma competência |
| Anotar o endereço, a data e a hora, e parar na prova mínima | Um relato preciso e sem excesso |
| Escrever uma mensagem curta, neutra e factual, sem ameaça nem pedido de dinheiro | Será levada a sério, e a relação permanece saudável |
| Criptografar a mensagem quando uma chave pública for fornecida | Somente a organização lê os detalhes |
| Manter as trocas por escrito | Um registro útil em caso de desacordo |
| Respeitar o prazo anunciado, e avisar antes de publicar | O próprio princípio da divulgação coordenada |
| Pedir conselho a um advogado **antes** de ir mais longe em caso de dúvida | Depois, é mais difícil corrigir |
| Do lado do site: publicar uma política, um `security.txt`, responder rápido e não ameaçar | O relato se torna fácil e a falha é corrigida |

## O que reter

| | |
|---|---|
| **A reter** | Procurar uma falha sem autorização em um site que não é seu é, em geral, ilegal, mesmo sem má intenção: na França, os artigos 323-1 e seguintes do Code pénal visam o acesso ou a permanência fraudulenta em um sistema de tratamento automatizado de dados. Uma política de divulgação ou um programa de bug bounty dá uma autorização explícita, dentro de um escopo preciso. O arquivo `security.txt` (RFC 9116, em `/.well-known/security.txt`) dá o contato de segurança. A divulgação coordenada consiste em relatar em privado, deixar um prazo para corrigir e então publicar; ela se opõe à divulgação imediata. O CERT-FR da ANSSI é o recurso na França (procedimento a verificar no site oficial). Um bom relato indica onde, o quê, como reproduzir de forma breve e o impacto, sem dado de terceiros. |
| **Armadilhas a evitar** | Achar que avisar gentilmente torna legal o que foi feito; confundir acessível com autorizado; escanear ou testar "para ajudar"; pedir dinheiro fora de um programa de recompensa; ignorar o escopo; publicar antes da correção; anexar dados pessoais; contar com uma promessa de não processo como se fosse uma lei. |
| **Boas práticas** | Ler a política antes de qualquer teste; treinar em um quadro previsto; parar na prova mínima; escrever uma mensagem sóbria, criptografada se houver chave; respeitar o prazo anunciado; pedir conselho a um advogado em caso de dúvida; do lado do site, publicar uma política de divulgação e um `security.txt`, responder rápido e não ameaçar as pessoas de boa-fé. |
