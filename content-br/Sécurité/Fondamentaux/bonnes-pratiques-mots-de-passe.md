---
order: 4
---

# As senhas: boas práticas para o usuário e para o site (28/10/2026)

Uma **senha** é um segredo que o usuário conhece e entrega a um site para provar quem ele é: é a prova da família "o que se sabe", apresentada em [Autenticação vs autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation). Ela continua sendo o método mais difundido e também o mais frágil. Este capítulo fala com dois leitores ao mesmo tempo: o **usuário**, que escolhe e guarda suas senhas, e o **site** (o programa que roda em um servidor e que recebe essas senhas), cujos desenvolvedores decidem o que é aceito, armazenado e registrado.

| Parte | Para quem | Questões tratadas |
|---|---|---|
| [Por que a senha é o elo fraco](#por-que-a-senha-e-o-elo-fraco) | Todos | Como as senhas são roubadas ou adivinhadas |
| [A força de uma senha](#a-forca-de-uma-senha-um-calculo) | Todos | Quantas combinações um atacante deve testar |
| [Do lado do usuário](#do-lado-do-usuario) | Usuário | Escolher, guardar, proteger e reagir a um vazamento |
| [Do lado do site](#do-lado-do-site) | Desenvolvedor | Aceitar, armazenar, limitar, redefinir, monitorar |
| [Os erros comuns](#os-erros-comuns-do-lado-do-usuario-e-do-lado-do-site) | Todos | Os erros mais frequentes e sua correção |

Este capítulo não reexplica o armazenamento de uma senha: o **hash** (transformar a senha em uma impressão de sentido único) e o **sal** (um valor aleatório acrescentado antes do hash) são detalhados em [Senhas e hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage). Os códigos JavaScript do lado do site apoiam-se em [as funções](/?c=langages&s=javascript&p=fonctions), [as condições](/?c=langages&s=javascript&p=conditions), [os arrays](/?c=langages&s=javascript&p=tableaux) e [os objetos](/?c=langages&s=javascript&p=objets).

As recomendações das normas evoluem: as citadas aqui são de 28/10/2026, e cada link oficial permite reverificar o texto em vigor.

## Por que a senha é o elo fraco

Uma senha é um segredo que humanos precisam inventar, lembrar e digitar. Quatro fraquezas humanas e técnicas decorrem disso.

| Fraqueza | O que acontece |
|---|---|
| **Reutilização** | A mesma senha serve em dez sites: basta que um só deixe vazar para que as dez contas caiam |
| **Vazamento de base de dados** | Um **vazamento** é a publicação ou a revenda de dados roubados de um site; ele contém endereços de e-mail (mensagem eletrônica) e senhas ou seus hashes |
| **Phishing** | Um site ou uma mensagem falsa leva o usuário a entregar ele mesmo a sua senha (ver [Engenharia social e phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) |
| **Escolhas previsíveis** | Os humanos escolhem `123456`, seu primeiro nome, uma data: os atacantes conhecem essas escolhas e as testam primeiro |

Essas fraquezas são exploradas por ataques precisos, que se dão em lugares diferentes:

| Ataque | Princípio | O que o impede |
|---|---|---|
| **Força bruta online** | Testar todas as combinações possíveis, uma a uma, pelo formulário de login do site | Limitação do número de tentativas, senha longa |
| **Força bruta offline** | Testar todas as combinações sobre hashes roubados, na própria máquina, sem nenhum limite imposto pelo site | Senha longa, hash lento e salgado |
| **Ataque de dicionário** | Testar primeiro uma lista de senhas prováveis (ver [o capítulo sobre hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)) | Senha sorteada ao acaso, recusa das senhas comuns pelo site |
| **Pulverização de senhas** (*password spraying*) | Testar uma única senha muito comum em milhares de contas, para ficar abaixo dos limites de bloqueio por conta | Recusa das senhas comuns, detecção do lado do site |
| **Preenchimento de credenciais** (*credential stuffing*) | Pegar os pares e-mail + senha de um vazamento e testá-los automaticamente em outros sites | Senha única por site, segundo fator |
| **Phishing** | Obter a senha da própria vítima | Gerenciador de senhas, chaves de acesso, vigilância |

O preenchimento de credenciais é o mais lucrativo para o atacante, porque a reutilização transforma o vazamento de um site em chave para todos os outros:

```text
Site A (pequeno fórum) é invadido
        |
        v
Lista roubada: alice@exemple.fr + "gato2020!"   (em texto claro, ou recuperada por dicionário)
        |
        v
Um programa testa automaticamente esse par em:
        +--> o e-mail        : acesso concedido se a Alice reutilizou a senha
        +--> o banco         : recusado se a senha for diferente ali
        +--> as redes sociais: acesso concedido se a Alice reutilizou a senha
```

Uma conta de e-mail comprometida é a mais grave: quase todos os percursos de "senha esquecida" enviam um link para esse endereço (ver [o percurso de redefinição seguro](#um-percurso-de-redefinicao-seguro)), e o atacante pode então assumir todas as outras contas.

## A força de uma senha: um cálculo

A **força** de um segredo mede-se pelo número de combinações que um atacante deveria testar, no pior caso, para encontrá-lo. Para um segredo sorteado ao acaso, o cálculo é simples: **tamanho do alfabeto elevado à potência do comprimento**. A notação `94^8` ("94 elevado a 8") quer dizer 94 × 94 × 94 × 94 × 94 × 94 × 94 × 94 (oito vezes 94). A notação científica `3,7 × 10^15` quer dizer 3,7 seguido de quinze zeros deslocados, ou seja 3 700 000 000 000 000 (cerca de 3,7 quadrilhões).

Dois segredos são comparados aqui. O **alfabeto** do primeiro é o conjunto dos 94 caracteres imprimíveis do teclado: 26 minúsculas, 26 maiúsculas, 10 algarismos e 32 símbolos. O alfabeto do segundo é uma lista de **7 776 palavras**, a do método dos dados (6^5 = 7 776, ou seja, cinco lançamentos de um dado de seis faces por palavra, ver [a lista da EFF](https://www.eff.org/dice)): cada palavra sorteada conta então como um "caractere" entre 7 776.

| Segredo sorteado ao acaso | Cálculo | Combinações | Bits |
|---|---|---|---|
| 8 minúsculas | 26^8 | 2,1 × 10^11 (208 827 064 576) | 37,6 |
| 8 caracteres entre 94 | 94^8 | 6,1 × 10^15 (6 095 689 385 410 816) | 52,4 |
| Frase de 4 palavras | 7776^4 | 3,7 × 10^15 (3 656 158 440 062 976) | 51,7 |
| Frase de 5 palavras | 7776^5 | 2,8 × 10^19 | 64,6 |
| Frase de 6 palavras | 7776^6 | 2,2 × 10^23 | 77,5 |
| 12 caracteres entre 94 | 94^12 | 4,8 × 10^23 | 78,7 |

Um **bit** é uma unidade de medida da força: cada bit a mais dobra o número de combinações (52 bits quer dizer 2^52 combinações). Esses valores podem ser recalculados com o Node.js (o ambiente que executa JavaScript fora de um navegador):

```bash
# node -e executa o código JavaScript informado entre aspas; BigInt (o sufixo n) evita
# os arredondamentos nos números muito grandes; ** é a potência
node -e "console.log((7776n ** 4n).toString())"   # exibe 3656158440062976
node -e "console.log((94n ** 8n).toString())"     # exibe 6095689385410816
```

Os tempos de ataque dependem da velocidade do atacante. Eis o tempo para **testar tudo** (em média, basta a metade), com duas velocidades de princípio: 10 bilhões de tentativas por segundo, ordem de grandeza de um hash rápido atacado por equipamento especializado, e 10 000 por segundo, ordem de grandeza de um hash lento (ver [Senhas e hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). São hipóteses para comparar, não medições.

| Segredo | A 10 bilhões de tentativas por segundo | A 10 000 tentativas por segundo |
|---|---|---|
| 8 minúsculas | 21 segundos | 242 dias |
| 8 caracteres entre 94 | 7,1 dias | 19 300 anos |
| Frase de 4 palavras | 4,2 dias | 11 600 anos |
| Frase de 5 palavras | 90 anos | 90 milhões de anos |
| Frase de 6 palavras | 700 000 anos | 700 bilhões de anos |

Quatro ensinamentos:

| Ensinamento | Explicação |
|---|---|
| **4 palavras valem quase 8 caracteres aleatórios** | 51,7 bits contra 52,4: a frase não é mais forte, mas ela se memoriza, enquanto `k7#Qx!9r` se esquece ou se anota |
| **Cada palavra a mais multiplica por 7 776** | 5 palavras são 4 664 vezes mais difíceis de achar do que 8 caracteres entre 94: o comprimento vence a complexidade |
| **O cálculo supõe um sorteio ao acaso** | Um humano que "inventa" seus 8 caracteres os escolhe nos mesmos padrões que todo mundo (`Verao2026!`): o atacante os testa bem antes do resto. Um sorteio aleatório (dados, gerador do gerenciador) é necessário |
| **O hash do site muda tudo** | O mesmo segredo passa de alguns dias a milhares de anos conforme o site armazene um hash rápido ou lento |

Daí a regra prática: **5 palavras no mínimo** para uma senha memorizada de cor, **6 palavras** ou mais para a senha mestra de um gerenciador (ver mais abaixo), e senhas aleatórias de 16 caracteres ou mais para tudo o que o gerenciador guarda no lugar do usuário.

## Do lado do usuário

### O comprimento em vez da complexidade aparente

Uma senha "complexa" segundo as regras habituais (uma maiúscula, um número, um símbolo) não é necessariamente forte: os humanos respeitam essas regras com gestos previsíveis.

| Senha | Veredito | Por quê |
|---|---|---|
| `P@ssw0rd1!` | Fraca | Trocar `a` por `@` e `o` por `0` é o primeiro reflexo testado pelos atacantes |
| `Verao2026!` | Fraca | Uma palavra, um ano, um símbolo: um padrão banal |
| `jXe8#pL2` | Média | Aleatória, mas curta (52 bits) e difícil de memorizar |
| `cavalo grampo nuvem tricô piano` | Forte | 5 palavras sorteadas ao acaso: 64,6 bits, fácil de memorizar |
| `bP4$kz7-Qw2!mTr9vX` | Forte | 18 caracteres sorteados ao acaso, guardados pelo gerenciador |

### A frase de senha

Uma **frase de senha** (*passphrase*) é uma senha feita de várias palavras, separadas por espaços ou por um hífen. O método comprovado: sortear 5 palavras **ao acaso** (com dados e a [lista da EFF](https://www.eff.org/dice), ou com o gerador de frases de um gerenciador de senhas), jamais escolhê-las por conta própria.

| A fazer | A evitar |
|---|---|
| Sortear as palavras ao acaso, sem "melhorá-las" | Escolher cinco palavras que agradam ou que têm alguma ligação entre si |
| Manter a frase como está: o número de palavras faz a força | Acrescentar um `1` e um `!` no fim "por formalidade" |
| Usar a frase para um único uso: a senha mestra ou a abertura do computador | Reutilizar a mesma frase em vários sites |
| 5 palavras no mínimo, 6 para a senha mestra | Uma citação célebre, letra de música, provérbio: eles constam nos dicionários dos atacantes |

### Uma senha única por site

O preenchimento de credenciais mostra por quê: se cada site tem a sua própria senha, o vazamento de um site dá acesso apenas a esse site. Memorizar dezenas de senhas diferentes é impossível à mão, daí o gerenciador.

### O gerenciador de senhas

Um **gerenciador de senhas** é um software (um aplicativo, uma extensão de navegador) que guarda todas as senhas em um **cofre criptografado** (um arquivo tornado ilegível pela [criptografia](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)), aberto com uma única senha: a **senha mestra**. Dois exemplos de software: [KeePassXC](https://keepassxc.org/) (o cofre continua sendo um arquivo no dispositivo) e [Bitwarden](https://bitwarden.com/) (o cofre criptografado é sincronizado entre dispositivos). Os navegadores também oferecem um, mais simples.

| O que o gerenciador faz | O que isso traz |
|---|---|
| Gera senhas aleatórias e longas | Cada site tem uma senha única que ninguém adivinha |
| Guarda tudo e preenche os formulários | O usuário não precisa mais memorizar nem digitar |
| Preenche apenas no **endereço correto** do site | Um site falso (phishing) não é reconhecido: se nada é sugerido em uma página de login que deveria ser conhecida, o endereço é suspeito |
| Assinala as senhas reutilizadas, fracas ou que apareceram em um vazamento | Fornece a lista do que deve ser trocado |
| Sincroniza entre dispositivos | O telefone e o computador têm o mesmo cofre |

O cofre só é protegido pela senha mestra: se um atacante copiar o arquivo criptografado, ele o ataca **offline**, sem limite de tentativas. Essa senha deve portanto ser:

| Exigência | Motivo |
|---|---|
| Uma frase de 6 palavras sorteadas ao acaso, ou mais | É a única barreira diante de uma força bruta offline |
| Única: nunca usada em outro lugar | Um vazamento em outro lugar não deve abrir o cofre |
| Jamais registrada no cofre nem em um arquivo não criptografado | O cofre fica fechado enquanto a senha mestra não for conhecida |
| Complementada por um segundo fator na conta do gerenciador, quando ele oferece um | Uma senha mestra roubada então não basta |

**Cópia de segurança:** a maioria dos gerenciadores não consegue recuperar uma senha mestra esquecida (é intencional: o fornecedor não a conhece). Prever então uma **chave de recuperação** impressa ou uma cópia criptografada do cofre, guardada em lugar seguro (um cofre físico, uma gaveta trancada), a ser testada uma vez. Os aparelhos do dia a dia quebram: um cofre único sem cópia é um risco.

### A autenticação multifator e as chaves de acesso

A **autenticação multifator** (MFA) exige duas provas de famílias diferentes; ela é detalhada em [Autenticação multifator](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur), com os códigos de uso único (TOTP) e as chaves de segurança físicas (FIDO2/WebAuthn).

Uma **chave de acesso** (*passkey*) vai mais longe: ela substitui a senha. Ela se baseia no mesmo princípio das chaves de segurança FIDO2/WebAuthn: um par de chaves matemáticas é criado no cadastro; a parte **privada** permanece no dispositivo (ou no gerenciador que a sincroniza), e o site recebe apenas a parte **pública**. No login, o dispositivo prova que possui a chave privada, após um gesto local (impressão digital, código do aparelho), e a prova só vale para o endereço exato do site.

| Método | Protege contra | Limite principal |
|---|---|---|
| Somente senha | Nada, se a senha vazar | Reutilização, vazamento, phishing |
| Senha e código por SMS | Uma senha roubada sozinha | Desvio do número de telefone (*SIM swapping*) |
| Senha e aplicativo TOTP | Uma senha roubada sozinha | Um site falso pode captar o código digitado |
| Chave de acesso ou chave de segurança | Vazamento e phishing: nada a roubar nem a reutilizar, e a chave recusa um site falso | Nem todos os sites a oferecem ainda (28/10/2026), é preciso prever a perda do dispositivo |

Ativar com prioridade nas contas que abrem outras: o e-mail, o gerenciador de senhas, o banco.

### Verificar se uma conta está em um vazamento

O serviço gratuito [Have I Been Pwned](https://haveibeenpwned.com/) (um serviço privado, não público) cataloga os vazamentos conhecidos: informa-se o endereço de e-mail e ele indica em quais vazamentos aparece; oferece também um alerta no cadastro e uma verificação de senhas. Para uma senha, o método foi concebido para jamais enviar a própria senha (ver [o código do site](#recusar-as-senhas-fracas-e-conhecidas)). Constar em um vazamento não significa que a conta foi atacada, mas que a senha usada então deve ser considerada conhecida.

### O que fazer após um vazamento

| Etapa | Ação | Por quê |
|---|---|---|
| 1 | Ir ao site em questão digitando você mesmo o endereço (não por um link recebido) e trocar a senha | Um e-mail "sua conta vazou, clique aqui" costuma ser phishing |
| 2 | Trocar essa senha **em todos os lugares onde foi reutilizada**, começando pelo e-mail e pelo banco | O preenchimento de credenciais a testa em todos os sites |
| 3 | Ativar o segundo fator ou uma chave de acesso | A senha sozinha não basta mais para os atacantes |
| 4 | Verificar os dispositivos conectados, os endereços de recuperação e as regras de redirecionamento do e-mail | Um atacante que já entrou deixa acessos de reserva ali |
| 5 | Acompanhar os extratos bancários e desconfiar das mensagens que seguem o vazamento | Os golpistas exploram a atualidade de um vazamento para fazer phishing |
| 6 | Se dados bancários ou de identidade estiverem envolvidos, avisar o banco ou o órgão | Solicitar o bloqueio ou acompanhar o uso desses dados |

### Nunca compartilhar nem anotar em texto claro

| Regra | Precisão |
|---|---|
| Nunca **dar** sua senha a ninguém | Nenhum suporte técnico, nenhum banco, nenhum administrador legítimo a pede: esse pedido é uma tentativa de phishing |
| Para compartilhar um acesso, usar a função de compartilhamento do gerenciador ou contas distintas | Uma senha enviada por mensagem permanece legível no histórico e nos servidores do e-mail |
| Não anotar suas senhas em arquivo, mensagem ou papel visível | Uma anotação em texto claro é lida por quem acessar o aparelho ou o escritório |
| Única exceção razoável: a chave de recuperação do gerenciador em papel, guardada em lugar seguro | Um papel trancado protege melhor do que um segredo esquecido |

### Desconfiança em relação às perguntas de segurança

Uma **pergunta de segurança** ("nome do seu primeiro animal de estimação?") serve de segundo meio para recuperar uma conta. Sua resposta é uma segunda senha, mas fraca: ela se encontra nas redes sociais ou se adivinha. Ela não conta como segundo fator (ver [Autenticação multifator](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)). Quando um site a impõe, responder com um **texto aleatório**, sem relação com a pergunta, e guardá-lo no gerenciador como uma senha.

## Do lado do site

Um site não controla o que o usuário faz, mas decide o que aceita, o que armazena, o que deixa testar e o que escreve em seus registros. Suas escolhas respondem a recomendações publicadas.

### As recomendações do NIST

O **NIST** (*National Institute of Standards and Technology*) é o organismo norte-americano de normalização. Seu documento **SP 800-63B** (*Special Publication*, volume B das diretrizes sobre identidade digital) descreve como gerenciar a autenticação e serve de referência no mundo inteiro; ele é publicado em [pages.nist.gov/800-63-4](https://pages.nist.gov/800-63-4/). Suas principais exigências sobre as senhas:

| Recomendação | Conteúdo | Por quê |
|---|---|---|
| **Comprimento mínimo** | Pelo menos 8 caracteres quando a senha é usada com um segundo fator; a revisão 4 exige 15 caracteres quando ela é usada sozinha (a verificar na fonte oficial) | O comprimento multiplica as combinações mais do que qualquer regra de composição |
| **Comprimento máximo** | Aceitar pelo menos 64 caracteres | As frases de senha e as senhas geradas são longas |
| **Todos os caracteres** | Aceitar espaços, símbolos e caracteres Unicode; não truncar silenciosamente | Uma frase de senha contém espaços; um truncamento torna o segredo mais curto do que o previsto |
| **Colagem e gerenciadores** | Permitir colar no campo | Sem colagem, o gerenciador não consegue preencher: os usuários escolhem senhas mais curtas |
| **Nenhuma regra de composição** | Não impor "uma maiúscula, um número, um símbolo" | Essas regras produzem `Password1!` em vez de segredos fortes |
| **Nenhuma troca periódica** | Não impor renovação a cada 90 dias; impor a troca apenas em caso de comprometimento comprovado | Uma troca forçada produz `Verao2026!` e depois `Outono2026!` |
| **Recusa das senhas conhecidas** | Comparar com uma lista de senhas comprometidas, comuns demais, ou construídas sobre o nome do site ou o identificador | Uma senha longa pode mesmo assim constar nas listas dos atacantes |
| **Sem perguntas de segurança nem dicas** | Não propor "nome do seu primeiro animal" | A resposta se adivinha e torna a conta tão fraca quanto a pergunta |
| **Limitação de tentativas** | Limitar as tentativas malsucedidas de uma conta (o NIST cita um teto da ordem de 100 tentativas consecutivas: a verificar na fonte oficial) | Sem limite, a força bruta online é possível |

Essas recomendações se somam à [política de senhas](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) descrita no capítulo sobre hash: elas detalham o comprimento mínimo (o capítulo vizinho cita 12 caracteres, uma escolha de site mais exigente que o piso do NIST). O **OWASP** (uma comunidade que publica guias de segurança web, ver [O OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10)) mantém as mesmas posições em sua [folha de referência sobre a autenticação](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### As recomendações da ANSSI

A **ANSSI** (Agência nacional de segurança dos sistemas de informação) é a autoridade francesa de cibersegurança. Ela publica em [cyber.gouv.fr](https://cyber.gouv.fr/) um guia intitulado "Recomendações relativas à autenticação multifator e às senhas" (a verificar na fonte oficial). Suas grandes linhas, a reverificar no texto oficial antes de se basear nelas:

| Princípio | Conteúdo |
|---|---|
| Preferir o multifator | Acrescentar um segundo fator assim que o serviço permitir (a verificar na fonte oficial) |
| Uma senha por serviço | Nunca reutilizar uma senha de um serviço em outro (a verificar na fonte oficial) |
| Senhas longas | Privilegiar o comprimento e as frases de senha (a verificar na fonte oficial) |
| Um gerenciador de senhas | Recomendado para manter uma senha única por serviço (a verificar na fonte oficial) |
| Um armazenamento não reversível | Do lado do site, senhas com hash e sal, jamais em texto claro (a verificar na fonte oficial) |

Os valores numéricos exatos (comprimento mínimo, entropia visada conforme o nível de segurança) são lidos no próprio guia: eles dependem do nível de segurança do sistema e não são retomados aqui.

### O armazenamento: lembrete e remissão

O armazenamento é tratado em detalhe em [Senhas e hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage): um hash lento e salgado, jamais a senha em texto claro, jamais uma criptografia reversível. Entre as funções adequadas, **Argon2id** (a variante do Argon2 que os guias atuais recomendam em primeiro lugar) e **bcrypt** são usadas por uma função da biblioteca da linguagem, jamais reescrita à mão. Um único ponto de atenção se acrescenta aqui: **o bcrypt só lê os 72 primeiros bytes** da senha (um **byte** é um grupo de 8 bits; um caractere acentuado ocupa frequentemente 2). Uma frase de senha longa pode então ser truncada sem erro: ler a documentação da biblioteca usada e escolher em consequência (a verificar na fonte oficial da biblioteca).

### Limitar as tentativas sem permitir a negação de serviço

Uma **negação de serviço** consiste em tornar um serviço inutilizável para os usuários legítimos (ver [Sobrecarga e negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)). Um bloqueio severo demais a provoca: se cinco tentativas ruins bloqueiam uma conta por uma hora, qualquer pessoa pode bloquear a conta da Alice errando de propósito. O princípio geral de limitação de taxa é apresentado em [Segurança de APIs web](/?c=securite&s=cybersecurite&p=securite-api-web).

| Medida | Princípio | Precaução |
|---|---|---|
| **Atraso progressivo** | Cada falha dobra a espera antes da tentativa seguinte (1 s, 2 s, 4 s, 8 s, limitado a alguns minutos) | Nada de bloqueio definitivo: a espera basta para arruinar a força bruta |
| **Contador por conta E por endereço IP** | Contar as falhas numa mesma conta e num mesmo endereço IP (o endereço que identifica uma máquina na rede) | A pulverização de senhas atinge muitas contas com poucas tentativas cada uma: o contador por IP a detecta |
| **Aparelho já conhecido** | A espera é mais branda para um navegador já usado com sucesso (um cookie assinado, ver [Sessões e cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | O verdadeiro usuário continua podendo entrar enquanto um atacante em outro lugar é retardado |
| **Teste anti-robô (CAPTCHA)** | Um **CAPTCHA** é um teste feito para distinguir um humano de um programa; ele é exigido após algumas falhas | Um CAPTCHA sozinho não é um limite: ele se contorna, mas complementa |
| **Resposta HTTP 429** | Código de status "excesso de requisições", com o cabeçalho `Retry-After` que indica quando tentar de novo (ver [As trocas de dados: API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | O contador vive do lado do **servidor**, jamais em um cookie que o cliente controla |
| **Alerta e segundo fator reforçado** | Avisar o proprietário de uma série de falhas; exigir o segundo fator em um login incomum | Evita derrubar uma conta com um bloqueio |

### Uma mensagem de erro idêntica, exista ou não a conta

Um formulário que responde "esta conta não existe" a uma tentativa e "senha incorreta" a outra revela quais contas existem (ver [Lógica de negócio e contornos automatizados](/?c=securite&s=cybersecurite&p=logique-metier-et-automatisation)). A resposta deve portanto ser **a mesma** em todos os casos, para o login e para a redefinição:

```text
Conexão
   endereço desconhecido  ->  "Identificador ou senha incorretos"
   senha incorreta        ->  "Identificador ou senha incorretos"

Redefinição
   endereço desconhecido  ->  "Se esta conta existir, um e-mail acaba de ser enviado"
   endereço conhecido     ->  "Se esta conta existir, um e-mail acaba de ser enviado"
```

O **tempo de resposta** deve também permanecer comparável: senão uma resposta rápida (nenhum hash a calcular) revela uma conta inexistente. Dois meios: calcular o hash da senha digitada mesmo assim contra um hash falso para as contas desconhecidas; enviar o e-mail de redefinição em tarefa de segundo plano em vez de antes de responder. No cadastro, "este endereço já está em uso" dá a mesma informação: a solução é responder "um e-mail de confirmação foi enviado" em todos os casos, o e-mail explicando a situação.

### Um percurso de redefinição seguro

A redefinição ("senha esquecida") é o caminho mais atacado: para um atacante, é mais fácil fazer-se enviar um acesso do que adivinhar uma senha. Uma **ficha** (*token*) é aqui uma sequência de caracteres aleatórios, que serve de prova temporária e se coloca no link enviado por e-mail.

```text
Usuário                              Site                              Caixa de e-mail
    |                                  |                                     |
 1. "Senha esquecida" (endereço)     ->|                                     |
    |                                  | 2. procura a conta (pode não existir)
    |<- 3. mesma mensagem em todos os casos: "Se esta conta existir, um e-mail é enviado"
    |                                  | 4. se a conta existir: cria uma ficha aleatória,
    |                                  |    guarda o hash, horário limite, "não usada"
    |                                  |-- 5. envia o link com a ficha ->    |
    |<---------------------------------------- 6. lê o e-mail ---------------|
 7. clica no link--------------------->| 8. verifica: hash, expiração, uso único
    |<- 9. formulário "nova senha" (mesma política do cadastro)
10. envia a nova senha---------------->| 11. faz o hash, guarda; marca a ficha "usada";
    |                                  |     fecha todas as sessões abertas
    |                                  |-- 12. e-mail "sua senha mudou" ---->|
```

| Regra | Por quê |
|---|---|
| Ficha obtida de um [gerador aleatório criptográfico](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs), de pelo menos 128 bits (o código abaixo usa 256) | Uma ficha previsível permite redefinir a conta de outra pessoa |
| Guardar apenas o **hash** da ficha, não a ficha | Um vazamento da base não dá um link de redefinição utilizável |
| **Uso único**: marcada como "usada" já na primeira passagem | Um link relido em um histórico não deve abrir nada |
| **Curta duração** (da ordem de 15 a 60 minutos) | Um e-mail esquecido em uma caixa não continua perigoso |
| Um novo pedido invalida as fichas anteriores | Um único link válido por vez |
| Nunca **enviar uma senha** por e-mail, nem uma senha "temporária" | Um e-mail circula e fica armazenado em texto claro; enviar uma senha obriga o site a conhecê-la, portanto a armazená-la em texto claro |
| Não conectar automaticamente após a troca | A troca deve permanecer uma operação distinta de um login |
| Fechar as sessões abertas após a troca | Um atacante já conectado perde o acesso |
| Link em HTTPS apenas, página sem recurso de terceiros | O endereço que contém a ficha pode ser transmitido a um terceiro por certos cabeçalhos do navegador (a verificar na [folha de referência da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)) |

Fabricar a ficha e seu hash, do lado do servidor, com o módulo `node:crypto` fornecido com o Node.js:

```javascript
const crypto = require("node:crypto");   // módulo de criptografia fornecido com o Node.js

const DURACAO_VALIDADE_MS = 30 * 60 * 1000;   // 30 minutos, em milissegundos

// Cria uma ficha de redefinição: só o seu hash é guardado do lado do servidor
function criarFichaRedefinicao() {
    // randomBytes sorteia 32 bytes (256 bits) de um gerador aleatório criptográfico
    const ficha = crypto.randomBytes(32).toString("hex");   // 64 caracteres hexadecimais
    // Uma ficha aleatória não se adivinha por dicionário: um hash rápido (SHA-256)
    // basta para o seu hash; o bcrypt seria inútil
    const resumo = crypto.createHash("sha256").update(ficha).digest("hex");
    return {
        ficha: ficha,              // enviada UMA vez por e-mail, jamais armazenada
        resumo: resumo,            // guardado no banco com os dois campos seguintes
        expiraEm: Date.now() + DURACAO_VALIDADE_MS,   // Date.now(): a hora atual em ms
        usado: false,              // passará a true já no primeiro uso
    };
}

const exemplo = criarFichaRedefinicao();
console.log(exemplo.ficha.length, exemplo.resumo.length, exemplo.usado);   // 64 64 false
```

`require` carrega um módulo, `"hex"` escreve os bytes em hexadecimal (algarismos de 0 a 9 e letras de a a f), e `SHA-256` é uma função de hash rápida, adequada aqui porque a ficha já é aleatória (o hash lento protege, por sua vez, os segredos escolhidos por humanos: ver [o capítulo sobre hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)).

### Avisar o usuário de qualquer alteração

O site envia um e-mail para o endereço **cadastrado** (não para um endereço digitado no pedido) sempre que a senha, o endereço de e-mail ou o segundo fator muda.

| O e-mail contém | O e-mail nunca contém |
|---|---|
| O que mudou e em que horário | A nova senha |
| O aparelho e a região aproximada, se o site as conhecer | Um link que conecta diretamente, sem outra verificação |
| Um link "Não fui eu" para um procedimento de recuperação da conta | A ficha de redefinição já usada |

### Registrar sem jamais escrever a senha

Um **registro** (*log*) é um arquivo em que o programa escreve o que acontece: pedidos recebidos, erros, conexões. Ele é lido pelos desenvolvedores, copiado para outras ferramentas e guardado por muito tempo: uma senha que entra ali permanece.

| A registrar | Jamais registrar |
|---|---|
| Uma tentativa de login, bem-sucedida ou não, com o identificador, o horário, o endereço IP | A senha digitada, mesmo "incorreta": um erro de digitação é muitas vezes a verdadeira senha de outro site |
| Os pedidos de redefinição, as trocas de senha | A ficha de redefinição ou o link completo |
| Os bloqueios e os alertas da limitação de tentativas | O corpo inteiro de uma requisição de login ou de cadastro |

Os vazamentos muitas vezes acontecem sem que ninguém tenha decidido: uma ferramenta que grava **todas** as requisições, um rastro de erro que exibe os parâmetros recebidos, uma ferramenta de estatísticas que copia os campos de um formulário. É preciso então **excluir** explicitamente os campos de senha desses registros. Os segredos de infraestrutura têm suas regras em [Gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

### Recusar as senhas fracas e conhecidas

A validação é escrita no **servidor** (o código que roda do lado do site): uma verificação feita só na página do navegador é contornada em poucos segundos. O código a seguir verifica o comprimento e recusa as senhas comuns ou que contêm o identificador, sem nenhuma regra de composição. Ele usa um `Set` (um conjunto de valores sem duplicata, ver [os arrays](/?c=langages&s=javascript&p=tableaux)) e a normalização **Unicode** (a norma que numera todos os caracteres, ver [A codificação de textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

```javascript
// Conjunto (Set) de senhas muito comuns, em minúsculas (lista reduzida aqui)
const SENHAS_COMUNS = new Set([
    "password", "123456", "123456789", "qwerty", "azerty",
    "minhasenha", "azertyuiop", "letmein", "iloveyou", "111111",
]);

const TAMANHO_MIN = 12;    // mínimo escolhido pelo site (o NIST exige pelo menos 8)
const TAMANHO_MAX = 128;   // limite amplo (pelo menos 64): recusa apenas o abuso

// Devolve a lista dos problemas da senha; lista vazia = "aceita"
function verificarSenha(digitada, identificador) {
    // normalize("NFKC") unifica as grafias de um mesmo caractere Unicode (um "é" pode ser
    // uma única letra ou um "e" seguido de acento) antes de contar
    const senha = digitada.normalize("NFKC");
    // [...texto] divide em caracteres inteiros: um emoji conta como 1, não como 2
    const tamanho = [...senha].length;
    const minusculas = senha.toLowerCase();   // para ignorar as maiúsculas
    const problemas = [];                     // lista vazia no início

    if (tamanho < TAMANHO_MIN) {
        problemas.push("Senha muito curta: pelo menos " + TAMANHO_MIN + " caracteres");
    }
    if (tamanho > TAMANHO_MAX) {
        problemas.push("Senha muito longa: no máximo " + TAMANHO_MAX + " caracteres");
    }
    if (SENHAS_COMUNS.has(minusculas)) {  // has: verdadeiro se estiver presente na lista
        problemas.push("Senha muito comum");
    }
    // includes: verdadeiro se um texto contém outro; recusamos o identificador dentro dela
    if (identificador && minusculas.includes(identificador.toLowerCase())) {
        problemas.push("Não deve conter o identificador");
    }
    return problemas;
}

// Nenhuma regra "uma maiúscula, um número, um símbolo": só conta o comprimento
console.log(verificarSenha("azerty", "alice"));
console.log(verificarSenha("alice-ama-os-gatos", "alice"));
console.log(verificarSenha("cavalo grampo nuvem tricô", "alice"));
```

Resultado exibido:

```text
[ 'Senha muito curta: pelo menos 12 caracteres', 'Senha muito comum' ]
[ 'Não deve conter o identificador' ]
[]
```

A lista de dez palavras é uma amostra: um site real carrega um arquivo com milhares ou milhões de senhas comuns, ou consulta um serviço que conhece os vazamentos. [Have I Been Pwned](https://haveibeenpwned.com/) oferece esse serviço sem que a senha saia do site, graças a uma técnica de **anonimato por prefixo**: calcula-se o hash SHA-1 da senha, só se envia seus 5 primeiros caracteres, o serviço devolve todos os sufixos conhecidos que começam assim, e a comparação é feita aqui. Esse hash SHA-1 serve apenas para a consulta ao serviço, jamais para o armazenamento.

```javascript
const crypto = require("node:crypto");   // módulo de criptografia fornecido com o Node.js

// Verdadeiro se a senha consta em vazamentos conhecidos do Have I Been Pwned
async function estaEmVazamento(senha) {
    // SHA-1 da senha, em hexadecimal maiúsculo (o formato esperado pelo serviço)
    const hash = crypto.createHash("sha1").update(senha).digest("hex");
    const resumo = hash.toUpperCase();
    const prefixo = resumo.slice(0, 5);   // 5 primeiros caracteres: só estes são enviados
    const sufixo = resumo.slice(5);       // o resto nunca sai do nosso servidor
    // fetch envia uma requisição HTTP; o serviço responde com os sufixos deste prefixo
    const resposta = await fetch("https://api.pwnedpasswords.com/range/" + prefixo);
    const texto = await resposta.text();  // uma linha "SUFIXO:QUANTIDADE" por sufixo
    // Procuramos nosso sufixo entre as linhas recebidas
    return texto.split("\n").some((linha) => linha.startsWith(sufixo));
}
```

Uma função `async` (declarada com essa palavra) pode esperar o resultado de uma operação lenta com `await`, sem bloquear o resto do programa; `slice(a, b)` extrai um pedaço de texto; `some` verifica que pelo menos um elemento de uma lista atende a uma condição. Essas noções são detalhadas em [o capítulo sobre a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) e [o capítulo sobre strings](/?c=langages&s=javascript&p=strings). Duas decisões de concepção a registrar na documentação do site: o que fazer se o serviço estiver inacessível (em geral, aceitar a senha em vez de bloquear o cadastro), e recusar a senha somente na criação ou na troca, e não para um usuário que já está conectado.

## Os erros comuns, do lado do usuário e do lado do site

| Lado | Erro | Consequência | Correção |
|---|---|---|---|
| Usuário | A mesma senha em vários sites | Um vazamento abre todas as contas (preenchimento de credenciais) | Uma senha única por site, guardada por um gerenciador |
| Usuário | Senha curta "complexa" (`P@ssw0rd1!`) | Encontrada pelas listas de variantes comuns | Frase de 5 palavras sorteadas ao acaso ou senha aleatória longa |
| Usuário | Senha mestra fraca ou reutilizada | O cofre inteiro cai de uma vez | Frase de 6 palavras sorteadas ao acaso, única, com um segundo fator |
| Usuário | Nenhum segundo fator no e-mail | As redefinições das outras contas passam por ele | MFA ou chave de acesso no e-mail, com prioridade |
| Usuário | Manter a mesma senha após um vazamento | O atacante já tem a lista | Trocar em todos os lugares onde foi usada, ativar o segundo fator |
| Usuário | Dar sua senha por mensagem ou telefone | Phishing bem-sucedido | Nunca a dar; passar pelo site oficial |
| Usuário | Responder com sinceridade às perguntas de segurança | Respostas encontradas nas redes sociais | Resposta aleatória guardada no gerenciador |
| Site | Regras de composição e renovação a cada 90 dias | Senhas previsíveis (`Outono2026!`) | Comprimento mínimo, recusa das senhas conhecidas, sem renovação periódica |
| Site | Proibir a colagem ou limitar a 16 caracteres | Gerenciadores e frases de senha inutilizáveis | Permitir a colagem, aceitar pelo menos 64 caracteres |
| Site | Mensagem "esta conta não existe" | Os atacantes montam a lista das contas | Mensagem idêntica em todos os casos |
| Site | Bloqueio definitivo após 5 falhas | Um atacante bloqueia a conta de outra pessoa (negação de serviço) | Atraso progressivo, contadores por conta e por endereço |
| Site | Enviar uma senha por e-mail | Ela circula e continua legível na caixa de entrada | Link com ficha aleatória, de uso único, de curta duração |
| Site | Escrever a senha nos registros | Legível por todos que leem os registros | Excluir os campos de senha de todo registro |
| Site | Armazenar em texto claro, ou com hash por SHA-256 ou MD5 | Senhas legíveis ou recuperadas em poucas horas após um vazamento | Argon2id ou bcrypt com sal (ver o capítulo sobre hash) |

## Síntese

| Assunto | O usuário | O site |
|---|---|---|
| Comprimento | Frase de senha de 5 palavras no mínimo | Aceitar pelo menos 64 caracteres, mínimo de 8 ou mais conforme o contexto |
| Complexidade | Inútil se a senha for longa e sorteada ao acaso | Não impor composição |
| Unicidade | Uma senha por site, por meio de um gerenciador | Recusar as senhas já comprometidas |
| Armazenamento | Gerenciador protegido por uma senha mestra forte | Hash lento e salgado, jamais a senha em texto claro |
| Segundo fator | MFA ou chaves de acesso em toda parte possível | Oferecer o MFA e as chaves de acesso |
| Ataques por tentativas | Senha aleatória longa | Atrasos progressivos, contadores por conta e por IP |
| Recuperação | E-mail protegido, perguntas de segurança aleatórias | Ficha de uso único e de curta duração, mensagem idêntica |
| Após um incidente | Trocar em toda parte, ativar o segundo fator | Notificar, fechar as sessões, registrar sem senha |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Acreditar que um medidor de força verde basta | Ele mede a complexidade aparente e deixa passar `Password1!` | Recusar as senhas conhecidas em vez de confiar em uma cor |
| Confiar em 4 palavras escolhidas "ao acaso" por si mesmo | Um humano não é um gerador aleatório | Sortear as palavras com dados ou um gerador |
| Senha ausente de um vazamento = senha forte | A verificação não diz que uma senha é sólida, apenas que ainda não é conhecida | Combinar verificação de vazamentos e comprimento mínimo |
| Senha mestra sem chave de recuperação | Um esquecimento torna o cofre definitivamente ilegível | Chave de recuperação guardada offline e testada |
| Recuperar uma conta por SMS ou perguntas de segurança | O caminho de recuperação vira o ponto fraco, apesar de um segundo fator sólido | A mesma exigência para a recuperação e para o login |
| Mensagem de redefinição diferente conforme a existência da conta | Enumeração das contas | Mesma mensagem, mesmo tempo de resposta |
| Truncamento silencioso das senhas longas (bcrypt: 72 bytes) | Uma frase de 100 caracteres protege tanto quanto uma de 72 bytes | Ler a documentação da biblioteca e recusar, em vez de truncar sem avisar |
| Ficha de redefinição reutilizável ou sem expiração | Um link antigo continua válido indefinidamente | Uso único, expiração, invalidação a cada novo pedido |
| Registrar as requisições inteiras em caso de bug | As senhas acabam nos registros | Excluir os campos sensíveis antes de qualquer gravação |
| Verificar a senha somente no navegador | É contornado em poucos segundos | Validar sempre do lado do servidor |
| Forçar a renovação periódica por hábito | Senhas mais previsíveis | Renovar somente após comprometimento comprovado |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Usuário: um gerenciador de senhas, uma senha aleatória por site | Elimina a reutilização sem exigir memória |
| Usuário: frase de senha de 5 palavras (6 para a senha mestra), sorteada ao acaso | Comprimento elevado e fácil de memorizar |
| Usuário: segundo fator ou chave de acesso, começando pelo e-mail | Uma senha roubada não basta mais |
| Usuário: verificar seus endereços no [Have I Been Pwned](https://haveibeenpwned.com/), agir rápido após um vazamento | O intervalo entre vazamento e ataque é curto |
| Usuário: respostas aleatórias às perguntas de segurança, guardadas no gerenciador | Elas não se adivinham mais |
| Site: mínimo de 8 caracteres ou mais, pelo menos 64 aceitos, colagem permitida | Recomendações do NIST |
| Site: recusar as senhas conhecidas ou comuns, sem regra de composição nem troca periódica | Evita senhas previsíveis |
| Site: Argon2id ou bcrypt com sal, pela biblioteca da linguagem | Ver o capítulo sobre hash |
| Site: atraso progressivo por conta e por IP, jamais bloqueio definitivo | Retarda a força bruta sem negação de serviço |
| Site: mensagem de erro e tempo de resposta idênticos | Sem enumeração das contas |
| Site: ficha de redefinição aleatória, de uso único, de 15 a 60 minutos, jamais senha por e-mail | O caminho mais atacado continua seguro |
| Site: e-mail de notificação a cada alteração, registros sem senha | Detecção rápida e nenhum novo vazamento pelos registros |

## O que reter

| | |
|---|---|
| **A reter** | A senha é o elo fraco por causa da reutilização, dos vazamentos, do phishing e das escolhas previsíveis; essas fraquezas são exploradas pela força bruta (online ou offline), pelo ataque de dicionário, pela pulverização de senhas e pelo preenchimento de credenciais. A força se calcula: 7776^4 (3,7 × 10^15) vale aproximadamente 94^8 (6,1 × 10^15), 5 palavras valem 4 664 vezes mais, desde que o sorteio seja aleatório. Do lado do usuário: frase de senha sorteada ao acaso, senha única por site, gerenciador com senha mestra forte e cópia de segurança, MFA ou chaves de acesso, verificação de vazamentos, troca em todos os lugares após um vazamento, nenhum compartilhamento, respostas aleatórias às perguntas de segurança. Do lado do site: recomendações do NIST SP 800-63B (pelo menos 8 caracteres, pelo menos 64 aceitos, colagem permitida, sem composição nem renovação periódica, recusa das senhas conhecidas) e da ANSSI, armazenamento com hash e sal, atraso progressivo sem negação de serviço, mensagem idêntica, redefinição por ficha de uso único e curta duração, notificação, registros sem senha. |
| **Armadilhas a evitar** | Senha reutilizada ou "complexa" mas curta; senha mestra fraca; e-mail sem segundo fator; perguntas de segurança sinceras; regras de composição e renovação periódica; colagem proibida; limite de comprimento baixo; mensagem de erro diferente conforme a conta; bloqueio definitivo das contas; senha enviada por e-mail; ficha reutilizável ou sem expiração; senha nos registros; truncamento silencioso; validação somente no navegador. |
| **Boas práticas** | Gerenciador e frase de senha sorteada ao acaso; segundo fator ou chave de acesso no e-mail primeiro; controle de vazamentos; troca em todos os lugares após um vazamento; do lado do site: validação no servidor (comprimento, senhas conhecidas), hash Argon2id ou bcrypt, atrasos progressivos por conta e por IP, respostas e tempos idênticos, ficha aleatória de uso único e curta duração, e-mail de notificação, registros excluindo os campos sensíveis. |
