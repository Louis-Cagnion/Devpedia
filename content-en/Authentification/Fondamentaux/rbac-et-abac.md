---
order: 3
---

# RBAC and ABAC: Two Ways to Model Authorization

The [authentication vs authorization](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) chapter lays out the distinction (who you are versus what you're allowed to do) without saying *how* that second question actually gets modeled in a system. **RBAC** and **ABAC** are the two most widespread access control models used to answer it.

## RBAC: Rights Attached to a Role

**RBAC** (*Role-Based Access Control*) assigns permissions to **roles**, then assigns one or more roles to each user. The user inherits the permissions of their roles, never permissions attached directly to them:

```text
User              Role              Permissions

Alice        -->  accounting    --> view_salaries, edit_invoices
Bob          -->  development   --> view_code, deploy_staging
```

> **Analogy:** an access badge with a security level printed on it ("level 2"). Any door compatible with "level 2" opens, regardless of who exactly is holding the badge; changing the rights of a level (adding a door) updates every badge at that level at once, without reprinting each badge individually.

| | |
|---|---|
| Advantage | Simple to administer: changing a user's role is enough to change all their rights at once |
| Limit | An access decision that depends on a precise context (the time, the location, the state of a piece of data) doesn't model naturally: a role would need to be created for every possible context combination |

## ABAC: Rules Evaluated on Attributes

**ABAC** (*Attribute-Based Access Control*) replaces the fixed role with a **rule** evaluated at every access request, based on **attributes**: properties of the user, of the requested resource, and of the request's context:

```text
Rule: allow IF user.department == resource.department
      AND current_time between 9am and 6pm
      AND user.device == "work_device"

Alice, accounting, 2pm, work device       -> requests an invoice "accounting" -> ALLOWED
Alice, accounting, 10pm, work device      -> requests an invoice "accounting" -> DENIED (outside hours)
Alice, accounting, 2pm, work device       -> requests a legal folder          -> DENIED (different department)
```

> **Analogy:** a guard who checks a list of conditions at every entry, rather than a badge with a fixed level: they look at who you are, what you're requesting, and the current context, before deciding, rather than trusting a single level already printed.

| | |
|---|---|
| Advantage | Can express fine-grained, contextual rules, impossible to represent with a simple role |
| Limit | More complex to write, test, and audit: each rule potentially combines several attributes, and predicting the exact effect of a rule change becomes harder than a simple role change |

## Comparison

| | RBAC | ABAC |
|---|---|---|
| Basis of the decision | The role assigned to the user | Attributes evaluated at the time of the request (user, resource, context) |
| Granularity | Coarse (per role) | Fine (per combination of conditions) |
| Administrative simplicity | High | Lower, rule complexity can grow quickly |
| Typical use case | Most business applications (stable, few roles) | Context-sensitive access control (hours, location, data sensitivity) |

The two aren't mutually exclusive: a system can use RBAC for most of its permissions, and reserve ABAC for the few decisions that genuinely depend on context.

> **Pitfall:** adding a very specific role for every exception encountered in RBAC (`accounting_morning`, `accounting_building_A`...), instead of recognizing that the actual need is contextual: the number of roles explodes and becomes as hard to audit as a poorly designed ABAC ruleset, without having its flexibility.
>
> **Best practice:** keep RBAC for stable, few-in-number permissions, and switch to ABAC (or a hybrid model) as soon as a rule depends on an attribute that changes often (the time, the location, a property of the data itself) rather than multiplying roles.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | RBAC assigns permissions to roles assigned to the user (coarse decision, simple to administer). ABAC evaluates a rule on attributes (user, resource, context) at every request (fine-grained decision, more complex). The two models are often combined within the same system. |
| **Tools you can use** | A role system for stable permissions; an ABAC rule engine for context-dependent decisions (hours, location, data sensitivity). |
| **Pitfalls to avoid** | Multiplying RBAC roles to represent every contextual exception, instead of switching to ABAC. |
| **Best practices** | Keep RBAC for stable, few-in-number cases; switch to ABAC as soon as a rule depends on an attribute that changes often. |
