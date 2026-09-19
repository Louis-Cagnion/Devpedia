---
order: 15
---

# Lógica de negócio e contornos automatizados

Os capítulos anteriores cobrem falhas TÉCNICAS (um dado mal validado, um acesso mal verificado). Esta família é diferente: o código pode ser tecnicamente impecável e continuar explorável, porque a REGRA DE NEGÓCIO em si está incompleta ou mal colocada. Nenhum scanner automático detecta essas falhas: é preciso conhecer o negócio da aplicação para saber o que testar.

## Mass assignment: aceitar mais campos do que o previsto

Um endpoint que atualiza um objeto aceitando diretamente TODOS os campos recebidos na requisição (em vez de uma lista explícita de campos permitidos) deixa o cliente enviar um campo que ele nunca deveria poder modificar por conta própria.

```php
// PERIGOSO: aceita todos os campos recebidos, incluindo os que um formulário
// legitimo nunca exporia
$usuario->update($_POST);
// Se o cliente adicionar discretamente "role=admin" a sua requisição de edição de perfil,
// e a tabela "usuários" tiver de fato uma coluna "role"...
// esse campo e atualizado como qualquer outro, sem distinção

// SEGURO: lista branca explícita dos campos que ESTE endpoint pode modificar
$campos_permitidos = ['nome', 'email', 'bio'];
$dados = array_intersect_key($_POST, array_flip($campos_permitidos));
$usuario->update($dados);
```

> **Boa prática:** definir explicitamente, para cada endpoint, a lista de campos que ele tem permissão de modificar, em vez de transmitir tal qual qualquer dado recebido para a atualização de um objeto.

## Salami slicing: acumular numerosos ganhos pequenos e insignificantes

O nome vem das finas fatias de salame: uma fraude que retira, a cada operação, um valor individualmente tão pequeno que nenhum controle unitário o percebe, mas que se torna significativo depois de repetido em grande escala. Caso clássico: um arredondamento de cálculo (divisão, taxa, conversão) sistematicamente truncado no mesmo sentido em vez de arredondado corretamente, cujo resíduo é redirecionado para uma conta controlada pelo atacante.

```text
1.000.000 transacoes x 0,004 centavo "perdido" a cada arredondamento = 4000 centavos = 40 euros
-> invisivel transacao por transacao, significativo na escala do volume processado
```

> **Cuidado:** testar uma regra de cálculo financeiro com um único valor de referência, que nunca revela um desvio que só aparece em grande escala ou em uma distribuição de valores variados.
>
> **Boa prática:** testar uma lógica de arredondamento/distribuição em um grande volume de valores variados verificando a soma acumulada em vez de um único caso; garantir que um resíduo de arredondamento seja sempre contabilizado em algum lugar rastreável, nunca perdido silenciosamente nem redirecionado sem rastro.

## Enumeração de usuários: uma mensagem de erro demasiado precisa

Um formulário de login (ou de redefinição de senha) que distingue "senha incorreta" de "esta conta não existe" revela, sem conceder acesso, quais contas realmente existem.

| Resposta | O que revela |
|---|---|
| "Nenhuma conta associada a este email" | Confirma que o email NÃO está cadastrado (informação útil para um atacante sobre outros emails testados) |
| "Senha incorreta" | Confirma que a conta EXISTE, restringindo o resto do ataque a adivinhar apenas a senha |
| "Credenciais inválidas" (mesma mensagem nos dois casos) | Não revela nada além de um par email/senha incorreto, sem especificar qual |

Essa informação, gratuita para o atacante, economiza uma etapa inteira de um ataque de força bruta ou de um phishing direcionado (saber QUEM tem uma conta antes mesmo de tentar entrar nela).

> **Boa prática:** devolver uma mensagem de erro estritamente idêntica, exista ou não o email, tanto no formulário de login QUANTO no de redefinição de senha.

## Race condition / TOCTOU: explorar o intervalo entre verificar e agir

**TOCTOU** (*time-of-check to time-of-use*) nomeia o intervalo, mesmo que muito curto, entre o momento em que o código VERIFICA que uma condição é verdadeira e o momento em que AGE em consequência. Se o estado pode mudar durante essa janela, duas requisições simultâneas podem passar ambas pela verificação antes que qualquer uma das duas tenha agido ainda.

```text
Codigo vulneravel (uso de um cupom de uso unico):

  Requisicao A                        Requisicao B
  -------------                       -------------
  1. Verifica: o cupom "PROMO"
     ja foi usado? NAO
                                       2. Verifica: o cupom "PROMO"
                                          ja foi usado? NAO
                                          (estado ainda nao alterado por A)
  3. Marca "PROMO" como usado
     aplica o desconto
                                       4. Marca "PROMO" como usado
                                          aplica o desconto UMA 2a VEZ
```

As duas requisições, enviadas com poucos milissegundos de diferença (frequentemente automatizadas de propósito para isso), passam ambas pela verificação ANTES que qualquer uma tenha tido tempo de marcar o cupom como usado.

> **Boa prática:** tornar a operação "verificar e depois agir" ATÔMICA (uma única etapa indivisível, garantida pelo próprio banco de dados: uma restrição de unicidade, uma atualização condicional em uma única consulta) em vez de duas etapas separadas no código da aplicação, onde outra requisição sempre pode se intercalar entre as duas.

## Falsificação por homógrafo Unicode

Dois caracteres podem ser exibidos de forma idêntica ou quase idêntica na tela, sendo, para o computador, caracteres totalmente DIFERENTES (pontos de código [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) distintos). Um nome de usuário ou domínio escolhido com esses caracteres engana o olho humano sem provocar um conflito de unicidade no banco de dados.

```text
"admin"  (caracteres latinos padrao)
"аdmin"  (o "а" e cirilico, U+0430, visualmente identico ao "a" latino U+0061)

-> Os dois textos PARECEM identicos a vista, mas sao dois valores
   DIFERENTES para uma comparacao de string classica: um atacante pode
   criar "аdmin" ao lado de uma conta real "admin" ja existente, sem conflito
```

> **Boa prática:** normalizar (veja as funções de normalização Unicode padrão, ex. NFKC) e/ou restringir o conjunto de caracteres permitido para qualquer identificador destinado a ser comparado por sua unicidade (nome de usuário, subdomínio), em vez de aceitar qualquer caractere Unicode.

## Contorno de filtro por codificação

Um filtro de validação que decodifica ou normaliza um dado UMA ÚNICA VEZ antes de verificá-lo pode ser contornado com uma camada adicional de codificação, revelada apenas em um processamento posterior.

```text
Filtro que bloqueia o caractere "/" (path traversal):
  Entrada recebida diretamente:       ../secret          -> bloqueada (contem "/")
  Entrada codificada duas vezes:      %252e%252e%252f     -> decodificada UMA vez da
                                                              "%2e%2e%2f" (ainda nao
                                                              contem um "/" literal)
                                                           -> passa pelo filtro
                                       depois uma camada POSTERIOR (servidor web,
                                       framework) a decodifica uma SEGUNDA vez
                                                           -> se torna "../secret"
                                                              DEPOIS do filtro
```

> **Boa prática:** decodificar completamente um dado (até ficar estável, sem mais mudanças em uma nova decodificação) ANTES de validá-lo, nunca validar uma codificação intermediária esperando que nenhuma camada posterior a decodifique novamente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma falha de lógica de negócio continua explorável mesmo com um código tecnicamente limpo: um endpoint que aceita campos demais (mass assignment), um desvio de arredondamento acumulado em grande escala (salami slicing), um intervalo explorável entre verificação e ação (TOCTOU), uma mensagem de erro demasiado precisa (enumeração), um identificador visualmente enganoso (homógrafo Unicode), ou um filtro aplicado antes de uma codificação adicional. |
| **Ferramentas utilizáveis** | Lista branca explícita de campos modificáveis por endpoint; restrição de unicidade ou atualização condicional no banco para uma operação atômica; normalização Unicode (NFKC) em qualquer identificador comparado por sua unicidade. |
| **Armadilhas a evitar** | Transmitir qualquer dado recebido tal qual para a atualização de um objeto. Testar um cálculo financeiro com um único caso em vez de um grande volume. Separar "verificar" e "agir" em duas etapas não atômicas. Uma mensagem de erro que distingue conta inexistente de senha incorreta. Validar um dado antes de sua decodificação completa. |
| **Boas práticas** | Lista branca de campos por endpoint. Teste de desvio acumulado em um grande volume de valores. Tornar atômica toda operação sensível de "verificar e depois agir". Mensagem de erro genérica e idêntica em caso de falha de autenticação. Normalização/restrição do conjunto de caracteres para um identificador único. Decodificação completa antes da validação, nunca o contrário. |
