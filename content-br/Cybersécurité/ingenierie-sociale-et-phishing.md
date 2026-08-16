---
order: 2
---

# Engenharia social e phishing

Nem toda falha é técnica: a **engenharia social** consiste em manipular uma pessoa, em vez de uma máquina, para que ela mesma realize a ação desejada pelo atacante (revelar uma senha, clicar em um link, autorizar um acesso). Dessa forma, ela contorna qualquer proteção técnica, por mais sólida que seja: o elo visado é humano.

## Os gatilhos psicológicos explorados

| Gatilho | Princípio | Exemplo |
|---|---|---|
| Autoridade | Obedecer a alguém que parece legítimo | Um e-mail assinado "Diretoria" ou "Suporte de TI" |
| Urgência | Impedir que a pessoa tenha tempo de verificar | "Sua conta será encerrada em 24h" |
| Medo | Levar a agir para evitar uma consequência negativa | "Foi detectada uma atividade suspeita em sua conta" |
| Confiança / familiaridade | Passar-se por um contato conhecido | Uma mensagem que parece vir de um colega ou amigo |
| Curiosidade | Despertar vontade de clicar ou abrir um anexo | "Aqui está a foto de que falamos" |

## As principais técnicas

| Técnica | Vetor | Descrição |
|---|---|---|
| **Phishing** | E-mail | Uma mensagem que imita um remetente legítimo, com um link para um site falso ou um anexo armadilhado |
| **Spear phishing** | E-mail direcionado | Um phishing personalizado para uma pessoa específica, a partir de informações reais sobre ela (nome, cargo, projeto em andamento) |
| **Vishing** (*voice phishing*) | Telefone | Uma ligação se passando por um banco, suporte técnico ou uma autoridade |
| **Smishing** (*SMS phishing*) | SMS | O mesmo princípio do phishing, por mensagem de texto |
| **Pretexting** | Qualquer um | Inventar um cenário crível (falso técnico, falsa auditoria) para obter uma informação ou um acesso |
| **Baiting** (isca) | Físico ou digital | Deixar um pendrive infectado em um local público, ou oferecer um download gratuito contaminado |
| **Tailgating** | Físico | Seguir alguém através de uma porta segura aproveitando que ela acabou de ser aberta |

O phishing é detalhado com mais profundidade, com o ângulo do typosquatting e de um certificado válido em um domínio falso, no panorama de ataques do capítulo [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite): este capítulo cobre a engenharia social como disciplina, da qual o phishing é apenas uma das técnicas.

## Um exemplo concreto de phishing

```text
De:       support@paypa1-securite.com
Assunto:  Acao necessaria: sua conta foi suspensa

Ola,

Detectamos atividade incomum em sua conta.
Clique aqui para reativa-la em 24h: http://paypa1-secure-login.com/verify

Equipe de Suporte
```

| Indício suspeito | O que ele revela |
|---|---|
| `paypa1` em vez de `paypal` | Typosquatting: um domínio visualmente parecido com o real |
| Urgência ("em 24h") | Um gatilho psicológico clássico, para impedir a verificação |
| Link exibido ≠ domínio oficial da empresa | Passar o cursor sobre o link (sem clicar) costuma revelar o destino real |
| Saudação genérica ("Olá") | Uma empresa que já conhece o cliente geralmente o chama pelo nome |

## Como se proteger

- Nunca clicar diretamente em um link recebido por e-mail/SMS para uma ação sensível (login, pagamento): abrir você mesmo o site oficial em uma nova aba, digitando o endereço ou usando um favorito já salvo.
- Verificar o endereço de envio completo, não apenas o nome exibido (frequentemente falsificável sem relação com o endereço real).
- Desconfiar de qualquer urgência ou pressão incomum: uma empresa legítima dá tempo para verificar.
- Confirmar uma solicitação incomum (transferência, acesso, informação sensível) por um segundo canal independente (ligar de volta para um número já conhecido, não o fornecido na mensagem).
- Na empresa, reportar qualquer mensagem suspeita à equipe responsável em vez de simplesmente apagá-la: o reporte também protege outros destinatários da mesma campanha.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A engenharia social manipula uma pessoa em vez de uma máquina, apoiando-se em gatilhos psicológicos (autoridade, urgência, medo, confiança). O phishing (e suas variantes vishing/smishing) é sua técnica mais difundida. |
| **Ferramentas utilizáveis** | Passar o cursor sobre um link antes de clicar, verificar o endereço de envio completo, favoritos já salvos para os sites sensíveis. |
| **Armadilhas a evitar** | Clicar diretamente em um link recebido para uma ação sensível; confiar apenas no nome exibido de um remetente; ceder a uma urgência artificial. |
| **Boas práticas** | Confirmar qualquer solicitação incomum por um segundo canal independente; reportar uma mensagem suspeita em vez de apagá-la sem dizer nada. |
