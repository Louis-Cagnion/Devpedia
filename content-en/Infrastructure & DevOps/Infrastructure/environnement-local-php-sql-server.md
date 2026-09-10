---
order: 9
---

# Setting Up a Local Environment for a PHP Application Connected to SQL Server

Developing an application that talks to a database living elsewhere (a company server, a production environment) is a recurring problem: working directly on that remote database is risky (a mistake affects real data) and often impossible (restricted network access). The usual solution is to restore a copy of the database **locally**, then run the application against it for the duration of development. This chapter covers the pitfalls encountered during this setup, with [Microsoft SQL Server](/?c=langages-de-programmation&s=domain-specific-languages-dsl&p=sql) as a concrete example.

## Restoring a `.bak` Backup Locally

SQL Server exports a database as a **`.bak`** file, a complete backup (schema + data) at a given point in time. **SSMS** (*SQL Server Management Studio*, SQL Server's official graphical administration tool) can restore it onto a local instance: *Restore Database* > *Device*, pointing to the received `.bak` file. Once restored, the database has the same name and structure as the original, but lives entirely on the local machine.

## Creating a Dedicated User Instead of `sa`

`sa` (*system administrator*) is SQL Server's built-in administrator account, with full rights over the entire instance (all databases, not just the restored one). An application should never connect using it:

```sql
CREATE LOGIN app_backoffice WITH PASSWORD = 'a-strong-password';

USE MyRestoredDatabase;
CREATE USER app_backoffice FOR LOGIN app_backoffice;
ALTER ROLE db_owner ADD MEMBER app_backoffice;
```

`app_backoffice` thereby gets full rights (`db_owner`) on the single `MyRestoredDatabase` database, without being able to touch other databases or the instance's configuration.

> **Best practice:** an application identity only needs rights on the databases it actually uses, never administration rights over the entire instance. A leak of these credentials (a configuration file committed by mistake, a log that displays them) then has an impact limited to those specific databases, rather than the whole server.

## Starting PHP's Development Server on the Right Address

`php -S` starts a built-in HTTP server, handy for developing without configuring a real web server:

```bash
php -S localhost:8000
```

> **Pitfall (Windows):** `localhost` can resolve to IPv6 (`[::1]`) rather than IPv4 (`127.0.0.1`), and PHP's built-in server then binds only to the resolved address. A browser or tool that insists on `127.0.0.1:8000` then finds nothing at that address, even though the server is indeed running on `[::1]:8000`. Fix: bind explicitly to the desired address rather than the generic name `localhost`:
> ```bash
> php -S 127.0.0.1:8000
> ```

## Missing PHP Extensions: One Blocker at a Time

`composer install` downloads and installs a PHP project's declared dependencies. If a PHP extension required by one of them is missing, the install fails -- but only on the **first** missing extension encountered, not on the complete list:

```text
1st attempt: composer install
  -> error: extension "openssl" is required

(openssl enabled)

2nd attempt: composer install
  -> error: extension "gd" is required

(gd enabled, then zip, then sodium...)
```

Each extension is re-enabled in the `php.ini` file (find out which one is in use with `php --ini`) by removing the `;` that comments out its line (`;extension=gd` becomes `extension=gd`), provided the corresponding `.dll`/`.so` file actually exists in the PHP installation's `ext/` folder.

> **Pitfall:** stopping after fixing the first error and concluding "it still doesn't work" on the second failure, without noticing that it's a **different** extension from the previous one. The error message always names the missing extension: re-read it on every new failure rather than assuming it's the same one again.

## The Hosts File: Giving `127.0.0.1` a Name

The system's **hosts** file manually maps a domain name to an IP address, before any network DNS resolution even happens:

| System | Location |
|---|---|
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| Linux/macOS | `/etc/hosts` |

```text
127.0.0.1   mydomain.local
```

Once this line is added, `http://mydomain.local:8000` refers to the local server, exactly like `http://127.0.0.1:8000`, but under a stable, readable name.

> **Pitfall:** this file can only be edited with administrator rights (access denied otherwise, even for a tool that tries to edit it automatically). On Windows, open the text editor itself as administrator before accessing it.

## Why a Stable Hostname Matters: the OAuth `redirect_uri`

An [OAuth 2.0](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) flow (used, for example, for "Log in with Google") requires declaring in advance, in the provider's administration console (Google Cloud Console, Okta admin...), the exact URL it will redirect the user back to once logged in: the **`redirect_uri`**.

> **Pitfall:** the OAuth provider rejects any request whose `redirect_uri` doesn't match **exactly, character for character**, a URL already declared on its side. A plain `localhost:8000` rarely works in practice (many providers forbid it, or the application changes port from one run to the next): giving the local server a stable name via the hosts file (`mydomain.local`) and then declaring `http://mydomain.local:8000/callback` on the provider's side solves the problem -- but both steps are necessary, adding the hostname to the hosts file without also declaring it on the provider's side isn't enough.

## Note: a Corporate Proxy Can Slow Composer Down Without Blocking It

On a corporate network filtered by a TLS proxy (which inspects encrypted traffic by reissuing its own certificates), each Composer package can fail once on direct download (`SSL routines::certificate verify failed`, the proxy's certificate not being recognized by PHP's OpenSSL configuration) before succeeding via an automatic fallback to a Git clone. This slows down `composer install` without blocking it entirely -- unusual slowness is worth checking in Composer's logs rather than being ignored.

---

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Restore a local copy (`.bak` via SSMS) rather than developing against a remote database. Create a dedicated application user (`db_owner` on the one relevant database), never `sa`. `php -S localhost` can bind to IPv6 only on Windows. `composer install` fails on one missing PHP extension at a time, not all at once. The hosts file (admin rights required) gives `127.0.0.1` a stable name, useful in particular for an OAuth `redirect_uri` that must match exactly what's declared on the provider's side. |
| **Tools you can use** | SSMS (*Restore Database* > *Device*) to restore a `.bak`. `CREATE LOGIN`/`CREATE USER`/`ALTER ROLE db_owner` for a dedicated application user. `php --ini` to locate the active `php.ini`. The hosts file for a stable local hostname. |
| **Pitfalls to avoid** | Connecting as `sa` from an application. Binding `php -S` to `localhost` rather than an explicit IPv4 address. Fixing a single missing PHP extension and assuming the problem is solved. Editing the hosts file without administrator rights. Adding a local hostname without also declaring it as a `redirect_uri` on the OAuth provider's side. |
| **Best practices** | Always restore a local copy rather than developing against production data. Limit an application account's rights to only the databases it uses. Re-read the exact name of the missing extension on every new `composer install` failure. Check Composer's logs in case of unusual slowness rather than ignoring it. |
