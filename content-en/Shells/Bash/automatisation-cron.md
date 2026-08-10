---
order: 14
---

# Automating Tasks with cron

`cron` is a service that runs permanently in the background (a **daemon**) and runs commands at regular intervals, defined in advance — nightly backups, cleaning up temp files, sending periodic reports.

## The crontab file

Every user has their own **crontab**, a list of scheduled tasks, edited with:

```bash
crontab -e     # opens the crontab in the default editor
crontab -l      # displays the current crontab without opening it
crontab -r      # deletes the current user's entire crontab
```

Every line follows a 5-time-field format, followed by the command to run:

```text
┌───────────── minute (0-59)
│ ┌─────────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌─────── month (1-12)
│ │ │ │ ┌───── day of week (0-6, 0 = Sunday)
│ │ │ │ │
* * * * *  command_to_run
```

```bash
0 3 * * *        /home/user/scripts/backup.sh    # every day at 3:00 AM
*/15 * * * *      /home/user/scripts/check-space.sh # every 15 minutes
0 9 * * 1          /home/user/scripts/weekly-report.sh  # every Monday at 9:00 AM
0 0 1 * *          /home/user/scripts/purge-logs.sh     # the 1st of every month at midnight
```

A `*` means "every possible value of this field"; `*/15` on the minutes field means "every 15 minutes" (0, 15, 30, 45).

## Special strings

For common schedules, shortcuts avoid having to count fields:

| String | Equivalent |
|---|---|
| `@reboot` | Run once, at system startup |
| `@hourly` | `0 * * * *` |
| `@daily` | `0 0 * * *` |
| `@weekly` | `0 0 * * 0` |
| `@monthly` | `0 0 1 * *` |
| `@yearly` | `0 0 1 1 *` |

```bash
@reboot   /home/user/scripts/init-cache.sh
@daily     /home/user/scripts/backup.sh
```

## The minimal-environment pitfall

A command launched by cron doesn't run in the same context as a manually opened terminal: cron starts a **non-interactive** shell, which loads neither `.bashrc` nor `.bash_profile`, and its [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) is reduced to a few basic system directories — often without `/usr/local/bin`, where many manually installed tools live.

A script that works perfectly when run by hand can therefore fail silently under cron, with a `command not found` error invisible since nothing displays this output by default (see the next section). Two systematic precautions:

```bash
# To avoid: assumes "python3" is in cron's PATH
0 3 * * *   python3 backup.py

# Safer: absolute path to both the executable AND the script
0 3 * * *   /usr/bin/python3 /home/user/scripts/backup.py
```

If a specific environment variable is needed (an API key, for instance), it must be explicitly defined at the top of the crontab or inside the script itself — the usual interactive shell's environment doesn't exist here.

## Never let a cron task fail silently

By default, a cron command's output (if it produces any) is emailed to the local user — rarely configured, so usually lost. Explicitly redirecting to a log file (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes)) makes execution traceable:

```bash
0 3 * * *   /home/user/scripts/backup.sh >> /var/log/backup.log 2>&1
```

A cron task that fails with no one noticing is a silent failure — one of the costliest pitfalls in automation, since the problem is only discovered once its lack of a result becomes an incident in itself (a backup that actually hasn't run in months). A fallback command after an `||` (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes) for command chaining), or an external monitoring service notified on failure, turns this silence into an explicit signal.

## Avoiding concurrent runs with `flock`

If a task can take longer than the interval that relaunches it (e.g. every 5 minutes, but a run that sometimes takes 8 minutes), two instances can overlap. `flock` guarantees only one instance runs at a time, relying on a lock (a file) rather than an assumption about duration:

```bash
*/5 * * * *   flock -n /tmp/backup.lock /home/user/scripts/backup.sh
```

`-n` (*non-blocking*) makes a new attempt fail immediately if the lock is already held, rather than stacking up pending runs.

## `systemd timers`, an alternative on systemd-based systems

On distributions using `systemd`, **timers** cover the same need, plus explicit dependencies between services, better logging (integrated with `journalctl`), and guaranteed execution even if the machine was off at the scheduled time. More verbose to configure than a simple crontab line, they're preferred in modern server environments for this reason — `cron` remains largely sufficient for personal or occasional use.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `cron` runs commands at regular intervals defined in a crontab (5 time fields). It runs in a minimal environment (no `.bashrc`, reduced `PATH`) — very different from a manually opened terminal. |
| **Tools you can use** | `crontab -e`/`-l`, special strings (`@daily`, `@reboot`...), `flock` to avoid concurrent runs. |
| **Pitfalls to avoid** | Assuming cron's `PATH`/environment is identical to an interactive terminal's; letting a task fail silently with no output redirection. |
| **Best practices** | Use absolute paths in a cron command; systematically redirect output to a log file. |
