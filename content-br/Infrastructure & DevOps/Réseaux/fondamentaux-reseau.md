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

## A notação CIDR: uma forma abreviada de escrever a máscara

Em vez de escrever a máscara em notação decimal com pontos (`255.255.255.192`), pode-se expressá-la como um simples número de bits em 1 a partir da esquerda: a **notação CIDR** (*Classless Inter-Domain Routing*).

```text
255.255.255.192
= 11111111.11111111.11111111.11000000  (em binario)
= 26 bits em 1 (parte de rede) + 6 bits em 0 (parte de host)
-> se escreve /26
```

Um endereço é então escrito diretamente com sua máscara anexada: `192.168.1.10/26`. Essa notação é a mais comum na prática (configuração de interface de rede, regras de firewall, tabelas de roteamento), amplamente preferida à escrita decimal com pontos da máscara.

| Máscara decimal | Notação CIDR | Bits de rede |
|---|---|---|
| `255.255.255.0` | `/24` | 24 |
| `255.255.255.128` | `/25` | 25 |
| `255.255.255.192` | `/26` | 26 |

> **Cilada:** confundir o número após a `/` com o número de endereços disponíveis. `/26` designa o número de bits de **rede**, não o número de hosts: um `/26` deixa 6 bits para a parte de host, ou seja, 2⁶ = 64 endereços (2 deles reservados, rede e broadcast).

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

## A tabela de roteamento: várias rotas possíveis

Assim que uma rede tem mais de um roteador, uma máquina deixa de contar com um único gateway e passa a usar uma **tabela de roteamento**: uma lista de entradas, cada uma associando uma sub-rede de destino ao gateway a usar para alcançá-la.

| Destino | Gateway |
|---|---|
| `10.0.0.0/24` | `192.168.1.5` |
| `172.16.0.0/16` | `192.168.1.9` |
| `0.0.0.0/0` (rota padrão) | `192.168.1.1` |

O pacote segue a entrada cuja sub-rede de destino corresponde mais precisamente ao endereço buscado. A **rota padrão** (`0.0.0.0/0`, que corresponde a qualquer endereço por não impor nenhum bit de prefixo) é usada como último recurso, quando nenhuma rota mais específica corresponde: é a generalização do gateway padrão único visto acima, para o caso de várias rotas explícitas concorrentes.

> **Boa prática:** diante de um problema de conectividade entre duas redes através de vários roteadores, verificar a tabela de roteamento de cada máquina envolvida antes de suspeitar de uma falha de hardware: uma rota ausente ou incorreta produz exatamente os mesmos sintomas que um cabo desconectado.

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
| **Para lembrar** | Um endereço IP identifica uma máquina; a máscara de sub-rede (muitas vezes escrita em notação CIDR, `/26`) distingue a parte de rede da parte de host; uma tabela de roteamento generaliza o gateway padrão para várias rotas possíveis; um switch conecta máquinas de uma mesma rede, um roteador conecta redes entre si. |
| **Ferramentas utilizáveis** | O modelo OSI para localizar um problema de rede na camada certa; DHCP para a atribuição automática de endereços; NAT para o compartilhamento de um IP público; a tabela de roteamento para diagnosticar um problema de conectividade entre várias redes. |
| **Armadilhas a evitar** | Confundir roteador e switch, ou achar que um "roteador Wi-Fi" é um único tipo de dispositivo quando na verdade combina vários. Confundir o número CIDR com o número de endereços disponíveis. |
| **Boas práticas** | Sempre verificar se duas máquinas compartilham a mesma parte de rede antes de investigar por que não se comunicam diretamente. |
