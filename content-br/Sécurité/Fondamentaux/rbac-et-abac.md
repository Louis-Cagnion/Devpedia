---
order: 3
---

# RBAC e ABAC: duas formas de modelar a autorização

O capítulo [autenticação vs autorização](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) coloca a distinção (quem você é contra o que você tem o direito de fazer) sem dizer *como* essa segunda pergunta se modela concretamente em um sistema. **RBAC** e **ABAC** são os dois modelos de controle de acesso mais difundidos para responder a isso.

## RBAC: direitos ligados a um papel

**RBAC** (*Role-Based Access Control*) atribui permissões a **papéis**, e então atribui um ou vários papéis a cada usuário. O usuário herda as permissões de seus papéis, nunca de permissões ligadas diretamente a ele:

```text
Usuario           Papel              Permissoes

Alice        -->  contabilidade    --> ver_salarios, editar_faturas
Bob          -->  desenvolvimento  --> ver_codigo, implantar_staging
```

> **Analogia:** um crachá de acesso com um nível de segurança impresso nele ("nível 2"). Toda porta compatível com "nível 2" se abre, seja qual for o portador exato do crachá; mudar os direitos de um nível (adicionar uma porta) atualiza todos os crachás desse nível de uma vez, sem reimprimir cada crachá individualmente.

| | |
|---|---|
| Vantagem | Simples de administrar: mudar o papel de um usuário basta para mudar todos os seus direitos de uma vez |
| Limite | Uma decisão de acesso que depende de um contexto preciso (o horário, a localização, o estado de um dado) não se modela naturalmente: seria preciso criar um papel para cada combinação de contexto possível |

## ABAC: regras avaliadas sobre atributos

**ABAC** (*Attribute-Based Access Control*) substitui o papel fixo por uma **regra** avaliada a cada pedido de acesso, a partir de **atributos**: propriedades do usuário, do recurso solicitado, e do contexto do pedido:

```text
Regra: permitir SE usuario.departamento == recurso.departamento
       E hora_atual entre 9h e 18h
       E usuario.equipamento == "equipamento_profissional"

Alice, contabilidade, 14h, equipamento pro   -> solicita uma fatura "contabilidade" -> PERMITIDO
Alice, contabilidade, 22h, equipamento pro   -> solicita uma fatura "contabilidade" -> NEGADO (fora do horário)
Alice, contabilidade, 14h, equipamento pro   -> solicita uma pasta juridica         -> NEGADO (departamento diferente)
```

> **Analogia:** um segurança que verifica uma lista de condições a cada passagem, em vez de um crachá com nível fixo: ele olha quem você é, o que você está pedindo, e o contexto do momento, antes de decidir, em vez de confiar em um simples nível já impresso.

| | |
|---|---|
| Vantagem | Pode expressar regras finas e contextuais, impossíveis de representar por um simples papel |
| Limite | Mais complexo de escrever, testar e auditar: cada regra combina potencialmente vários atributos, e prever o efeito exato de uma mudança de regra se torna mais difícil que uma simples mudança de papel |

## Comparativo

| | RBAC | ABAC |
|---|---|---|
| Base da decisão | O papel atribuído ao usuário | Atributos avaliados no momento do pedido (usuário, recurso, contexto) |
| Granularidade | Grosseira (por papel) | Fina (por combinação de condições) |
| Simplicidade de administração | Alta | Mais baixa, a complexidade das regras pode crescer rápido |
| Caso de uso típico | A maioria das aplicações de negócio (papéis estáveis e pouco numerosos) | Controle de acesso sensível ao contexto (horários, localização, sensibilidade do dado) |

Os dois não se excluem: um sistema pode usar RBAC para a maioria de suas permissões, e reservar ABAC para as poucas decisões que realmente dependem do contexto.

> **Cuidado:** adicionar um papel muito específico para cada exceção encontrada em RBAC (`contabilidade_manha`, `contabilidade_predio_A`...), em vez de reconhecer que a necessidade real é contextual: o número de papéis explode e se torna tão difícil de auditar quanto um conjunto de regras ABAC mal projetado, sem ter a flexibilidade dele.
>
> **Boa prática:** manter RBAC para as permissões estáveis e pouco numerosas, e migrar para ABAC (ou um modelo híbrido) assim que uma regra depender de um atributo que muda com frequência (o horário, a localização, uma propriedade do próprio dado) em vez de multiplicar os papéis.

---

## 📋 Resumo

| | |
|---|---|
| **O que reter** | RBAC atribui permissões a papéis atribuídos ao usuário (decisão grosseira, simples de administrar). ABAC avalia uma regra sobre atributos (usuário, recurso, contexto) a cada pedido (decisão fina, mais complexa). Os dois modelos frequentemente se combinam em um mesmo sistema. |
| **Ferramentas úteis** | Um sistema de papéis para as permissões estáveis; um motor de regras ABAC para as decisões contextuais (horários, localização, sensibilidade do dado). |
| **Armadilhas a evitar** | Multiplicar os papéis RBAC para representar cada exceção contextual, em vez de migrar para ABAC. |
| **Boas práticas** | Manter RBAC para os casos estáveis e pouco numerosos; migrar para ABAC assim que uma regra depender de um atributo que muda com frequência. |
