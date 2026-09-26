---
order: 12
---

# SSRF: contornar a lista branca

[Proteger seus dados](/?c=langages&s=php&p=securite) apresenta o princípio do SSRF (forçar o servidor a fazer uma requisição a um destino interno em nome do atacante) e sua defesa de referência: validar o host de destino contra uma lista branca explícita em vez de confiar em uma URL fornecida pelo cliente. Este capítulo cobre duas formas pelas quais essa lista branca, mesmo implantada, pode ser contornada.

## Contornar a lista branca por um redirecionamento HTTP

Uma validação que só verifica a URL de PARTIDA fornecida pelo usuário, sem verificar de novo para onde um redirecionamento HTTP leva depois, deixa uma porta aberta: o próprio atacante hospeda um redirecionamento para o seu verdadeiro alvo.

```text
1. Lista branca autorizada: apenas "images.example.com"

2. O atacante fornece: http://images.example.com/redireciona-para-alvo
   -> passa na validação: o host de partida É images.example.com

3. O servidor segue a requisição... que na verdade responde com um redirecionamento HTTP:
   HTTP/1.1 302 Found
   Location: http://169.254.169.254/latest/meta-data/

4. Se o código que faz a requisição SEGUE automaticamente esse redirecionamento
   (comportamento padrão da maioria das bibliotecas HTTP), ele alcança
   o verdadeiro alvo interno, nunca revalidado contra a lista branca
```

| | |
|---|---|
| **Armadilha** | Validar o host uma única vez, antes de enviar a requisição, supondo que o destino continua o mesmo durante toda a troca |
| **Boa prática** | Desativar o seguimento automático de redirecionamentos em toda requisição de saída construída a partir de um dado do usuário, ou revalidar o host de destino a CADA redirecionamento seguido, não só na requisição inicial |

## SSRF através de um gerador de documentos (HTML para PDF)

Uma ferramenta que transforma HTML em PDF (fatura para download, exportação de relatório) é, tecnicamente, um mininavegador: ela carrega e exibe recursos como o Chrome ou o Firefox fariam, inclusive imagens ou `iframe` referenciados por uma URL. Se o conteúdo HTML a transformar incorpora um dado do usuário não filtrado, essa funcionalidade fica exposta ao mesmo risco de SSRF que uma chamada HTTP explícita.

```html
<!-- Digitado pelo usuário em um campo previsto para uma foto de perfil -->
<img src="http://169.254.169.254/latest/meta-data/iam/security-credentials/">
<!-- ou, conforme o motor de renderização, um caminho de arquivo LOCAL em vez de URL -->
<img src="file:///etc/passwd">
```

Se o motor de renderização realmente exibe o resultado dessa requisição no PDF gerado (ou o devolve de uma forma explorável), o conteúdo de um recurso interno ou de um arquivo local acaba exposto em um documento que o atacante pode baixar depois.

| | |
|---|---|
| **Armadilha** | Considerar um gerador de PDF uma simples ferramenta de formatação, sem perceber que ele faz requisições de rede/arquivo como um navegador para resolver cada recurso referenciado no HTML |
| **Boa prática** | Desativar, na configuração do motor de renderização, o carregamento de recursos externos e o acesso ao sistema de arquivos local; na falta disso, aplicar a mesma lista branca de hosts de uma chamada SSRF clássica a toda URL inserida no conteúdo a transformar |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma lista branca de hosts protege contra um SSRF direto, mas ainda pode ser contornada por um redirecionamento HTTP não revalidado, ou por um gerador de documentos (HTML→PDF) que carrega recursos como um navegador sem que isso pareça uma "requisição de rede". |
| **Ferramentas utilizáveis** | Opção de uma biblioteca HTTP para desativar o seguimento de redirecionamentos; opção de um motor de renderização PDF para desativar o carregamento de recursos externos/arquivos locais. |
| **Armadilhas a evitar** | Validar o host só na requisição inicial, nunca depois de um redirecionamento seguido. Tratar um gerador de PDF como incapaz de fazer requisições de rede. |
| **Boas práticas** | Desativar o seguimento automático de redirecionamentos ou revalidar a cada salto. Restringir os recursos que um motor de renderização de documentos pode carregar ao estritamente necessário. |
