---
order: 7
---

# NPS: Measuring Customer Satisfaction and Loyalty

The **NPS** (*Net Promoter Score*) is a widely used customer satisfaction metric, far beyond tech (support, after-sales service, product experience): a concrete example of a quantitative measure that can feed into a [Key Result](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=okr) ("raise NPS from 20 to 40", for instance).

## The principle: a single question, scored from 0 to 10

NPS relies on a single question, asked after an interaction with a service: *"Would you recommend this service to a colleague or friend?"*, scored from 0 (not at all) to 10 (definitely).

| Score | Category | Counts toward the total? | Counts toward the numerator? |
|---|---|---|---|
| 0 to 6 | Detractors | Yes | Yes (negatively) |
| 7 or 8 | Passives | Yes | No |
| 9 or 10 | Promoters | Yes | Yes (positively) |

```javascript
function computeNps(scores) {   // scores: array of integers 0 to 10, one per respondent
    const total = scores.length;
    const detractors = scores.filter(score => score <= 6).length;
    const promoters = scores.filter(score => score >= 9).length;
    // passives (7-8) count toward "total", but never toward the numerator
    return ((promoters - detractors) / total) * 100;
}
```

The result always falls between -100 (all detractors) and +100 (all promoters).

> **Pitfall:** comparing the raw NPS of two companies in different industries without accounting for industry norms: average NPS varies enormously from one industry to another (an NPS of 30 can be excellent in one industry, mediocre in another).
>
> **Best practice:** track how NPS evolves for the same service over time (before/after a specific change), rather than crudely comparing it to a company in a different industry.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | NPS measures customer satisfaction/loyalty from a single question scored 0 to 10: `(% promoters [9-10] − % detractors [0-6]) × 100`, with passives [7-8] counting toward the total without affecting the result. |
| **Tools you can use** | A single standardized question, asked after an interaction with the service; the calculation can be automated (`computeNps()` above). |
| **Pitfalls to avoid** | Comparing a raw NPS across different industries without accounting for each industry's own norms. |
| **Best practices** | Track how a single service's NPS evolves over time rather than making a crude cross-industry comparison. |
