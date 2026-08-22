---
order: 1
---

# Fundamentos de rede

Uma **rede de computadores** é um conjunto de máquinas conectadas entre si, capazes de trocar dados. Antes de entender como dois programas se comunicam (veja [Sockets e E/S não bloqueante](/?c=reseaux&p=sockets-et-io-non-bloquante)), é preciso entender como uma máquina é identificada nessa rede, e como seus dados encontram o caminho até o destino certo.

## O endereço IP: identificar uma máquina

Um **endereço IP** (*Internet Protocol*) identifica de forma única uma máquina em uma rede, um pouco como um número de telefone identifica um interlocutor. A versão mais difundida, **IPv4**, é escrita na forma de 4 números entre 0 e 255, separados por pontos:

```text
192.168.1.10
 |    |  | |
 └────┴──┴─┴─ 4 blocos de 8 bits (0-255) = 32 bits no total
```

> **Nota:** o IPv4 permite apenas ~4,3 bilhões de endereços distintos, um número já insuficiente para todos os dispositivos conectados no mundo. O **IPv6**, sua versão mais recente (endereços de 128 bits, ex.: `2001:0db8::1`), resolve esse problema, mas ainda não está universalmente implantado; este capítulo se concentra no IPv4, amplamente dominante na prática.

## A máscara de sub-rede: dividir um endereço em duas partes

Um endereço IP sozinho não diz quais máquinas estão na **mesma** rede local. A **máscara de sub-rede** (*subnet mask*) responde a essa pergunta: ela divide o endereço IP em uma parte **de rede** (idêntica para todas as máquinas da mesma rede local) e uma parte **de host** (única para cada máquina dessa rede).

```text
Endereco IP  :  192.168.1  .  10
Mascara      :  255.255.255.0
                └─────────┘ └┘
                  parte        parte
                  de rede       de host
```

| Elemento | Papel | Exemplo |
|---|---|---|
| Parte de rede | Identifica a própria rede local | `192.168.1` |
| Parte de host | Identifica uma máquina precisa dentro dessa rede | `10` |

Duas máquinas cuja parte de rede (uma vez aplicada a máscara) é idêntica podem se comunicar **diretamente**, sem passar por um roteador. Se a parte de rede for diferente, seus dados obrigatoriamente precisam passar por um roteador para se encontrarem.

## O gateway padrão: a saída da rede local

O **gateway padrão** (*default gateway*) é o endereço IP para o qual uma máquina envia seus dados sempre que o destino **não** está na sua rede local (parte de rede diferente). Quase sempre, é o endereço do roteador local.

```text
Computador (192.168.1.10)
        |
        | destino na mesma rede (192.168.1.x) -> envio direto
        | destino fora da rede (ex: um site)   -> envio para o gateway
        v
Gateway / roteador (192.168.1.1) --------> resto da Internet
```

## Roteador vs switch: dois dispositivos, dois papéis

Esses dois dispositivos conectam máquinas entre si, mas em escalas diferentes:

| | Switch | Roteador |
|---|---|---|
| Conecta | Várias máquinas **de uma mesma rede local** | Várias **redes** distintas entre si |
| Decisão tomada com base em | O endereço físico da placa de rede (endereço *MAC*) | O endereço IP (parte de rede) |
| Exemplo de uso | Conectar os computadores de um mesmo escritório | Conectar a rede de uma casa ao resto da Internet |

> **Armadilha:** confundir os dois por causa da caixa fornecida por um provedor de acesso à Internet (frequentemente chamada de "roteador Wi-Fi" ou "modem-roteador"): ela na verdade combina um roteador, um switch e um ponto de acesso Wi-Fi em um único aparelho.

## As camadas OSI: uma divisão em responsabilidades

O **modelo OSI** divide toda comunicação de rede em 7 camadas empilhadas, cada uma cuidando apenas de um aspecto preciso e se apoiando na camada abaixo dela:

| Camada | Papel | Exemplo |
|---|---|---|
| 7. Aplicação | O protocolo usado pelo próprio programa | HTTP, DNS |
| 6. Apresentação | Formato dos dados (criptografia, codificação) | TLS |
| 5. Sessão | Abertura/encerramento de uma conversa entre duas máquinas | - |
| 4. Transporte | Divisão em pacotes, confiabilidade do envio | TCP, UDP |
| 3. Rede | Endereçamento IP e roteamento entre redes | IP, o roteador |
| 2. Enlace | Endereçamento físico (MAC) dentro de uma mesma rede local | Ethernet, o switch |
| 1. Física | O meio físico do sinal | Cabo, Wi-Fi |

Na prática, um desenvolvedor lida sobretudo com as camadas 3 a 7: o [uso de uma socket](/?c=reseaux&p=sockets-et-io-non-bloquante) acontece no nível da camada de transporte (TCP/UDP), enquanto uma [API HTTP](/?c=infrastructure&p=api-et-http) se situa no nível da camada de aplicação.

## Dois mecanismos complementares: DHCP e NAT

Dois serviços automatizam parte do que este capítulo acabou de explicar manualmente:

- O **[DHCP](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)** (*Dynamic Host Configuration Protocol*) atribui automaticamente um endereço IP, uma máscara e um gateway a cada máquina que entra na rede, em vez de configurá-los manualmente.
- O **[NAT](https://en.wikipedia.org/wiki/Network_address_translation)** (*Network Address Translation*) permite que várias máquinas de uma rede local, cada uma com seu próprio endereço IP privado, compartilhem um único endereço IP público para sair para a Internet: é isso que o roteador de uma casa faz para todos os dispositivos do domicílio.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um endereço IP identifica uma máquina; a máscara de sub-rede distingue a parte de rede da parte de host; o gateway leva para fora da rede local; um switch conecta máquinas de uma mesma rede, um roteador conecta redes entre si. |
| **Ferramentas utilizáveis** | O modelo OSI para localizar um problema de rede na camada certa; DHCP para a atribuição automática de endereços; NAT para o compartilhamento de um IP público. |
| **Armadilhas a evitar** | Confundir roteador e switch, ou achar que um "roteador Wi-Fi" é um único tipo de dispositivo quando na verdade combina vários. |
| **Boas práticas** | Sempre verificar se duas máquinas compartilham a mesma parte de rede antes de investigar por que não se comunicam diretamente. |
