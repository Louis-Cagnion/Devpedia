---
order: 7
---

# O NPS: medir a satisfação e a fidelidade do cliente

O **NPS** (*Net Promoter Score*) é uma métrica de satisfação do cliente amplamente usada, muito além da tecnologia (suporte, pós-venda, experiência de produto): um exemplo concreto de medida quantitativa que pode alimentar um [Key Result](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=okr) ("elevar o NPS de 20 para 40", por exemplo).

## O princípio: uma única pergunta, com nota de 0 a 10

O NPS se baseia em uma única pergunta, feita após uma interação com um serviço: *"Você recomendaria este serviço a um colega ou amigo?"*, com nota de 0 (nada) a 10 (totalmente).

| Nota | Categoria | Conta no total? | Conta no numerador? |
|---|---|---|---|
| 0 a 6 | Detratores | Sim | Sim (negativamente) |
| 7 ou 8 | Neutros | Sim | Não |
| 9 ou 10 | Promotores | Sim | Sim (positivamente) |

```javascript
function calcularNps(notas) {   // notas: array de inteiros de 0 a 10, uma por respondente
    const total = notas.length;
    const detratores = notas.filter(nota => nota <= 6).length;
    const promotores = notas.filter(nota => nota >= 9).length;
    // os neutros (7-8) contam no "total", mas nunca no numerador
    return ((promotores - detratores) / total) * 100;
}
```

O resultado sempre fica entre -100 (todos detratores) e +100 (todos promotores).

> **Cuidado:** comparar o NPS bruto de duas empresas de setores diferentes sem considerar as normas do setor: o NPS médio varia enormemente de um setor para outro (um NPS de 30 pode ser excelente em um setor, mediano em outro).
>
> **Boa prática:** acompanhar a evolução do NPS de um mesmo serviço ao longo do tempo (antes/depois de uma mudança específica), em vez de compará-lo bruscamente ao de uma empresa de outro setor.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O NPS mede a satisfação/fidelidade do cliente a partir de uma única pergunta com nota de 0 a 10: `(% promotores [9-10] − % detratores [0-6]) × 100`, contando os neutros [7-8] no total sem influenciar o resultado. |
| **Ferramentas utilizáveis** | Uma única pergunta padronizada, feita após uma interação com o serviço; o cálculo pode ser automatizado (`calcularNps()` acima). |
| **Armadilhas a evitar** | Comparar um NPS bruto entre setores diferentes sem considerar as normas próprias de cada setor. |
| **Boas práticas** | Acompanhar a evolução do NPS de um mesmo serviço ao longo do tempo em vez de uma comparação intersetorial brusca. |
