---
order: 14
---

# Automating Tasks with cron

`cron` is a service that runs permanently in the background (a **daemon**) and runs commands at regular intervals, defined in advance: nightly backups, cleaning up temp files, sending periodic reports.

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

A command launched by cron doesn't run in the same context as a manually opened terminal: cron starts a **non-interactive** shell, which loads neither `.bashrc` nor `.bash_profile`, and its [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) is reduced to a few basic system directories, often without `/usr/local/bin`, where many manually installed tools live.

A script that works perfectly when run by hand can therefore fail silently under cron, with a `command not found` error invisible since nothing displays this output by default (see the next section). Two systematic precautions:

```bash
# To avoid: assumes "python3" is in cron's PATH
0 3 * * *   python3 backup.py

# Safer: absolute path to both the executable AND the script
0 3 * * *   /usr/bin/python3 /home/user/scripts/backup.py
```

If a specific environment variable is needed (an API key, for instance), it must be explicitly defined at the top of the crontab or inside the script itself: the usual interactive shell's environment doesn't exist here.

## Never let a cron task fail silently

By default, a cron command's output (if it produces any) is emailed to the local user, rarely configured, so usually lost. Explicitly redirecting to a log file (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes)) makes execution traceable:

```bash
0 3 * * *   /home/user/scripts/backup.sh >> /var/log/backup.log 2>&1
```

A cron task that fails with no one noticing is a silent failure, one of the costliest pitfalls in automation, since the problem is only discovered once its lack of a result becomes an incident in itself (a backup that actually hasn't run in months). A fallback command after an `||` (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes) for command chaining), or an external monitoring service notified on failure, turns this silence into an explicit signal.

## Avoiding concurrent runs with `flock`

If a task can take longer than the interval that relaunches it (e.g. every 5 minutes, but a run that sometimes takes 8 minutes), two instances can overlap. `flock` guarantees only one instance runs at a time, relying on a lock (a file) rather than an assumption about duration:

```bash
*/5 * * * *   flock -n /tmp/backup.lock /home/user/scripts/backup.sh
```

`-n` (*non-blocking*) makes a new attempt fail immediately if the lock is already held, rather than stacking up pending runs.

## `systemd timers`, an alternative on systemd-based systems

[`systemd`](https://www.freedesktop.org/software/systemd/man/systemd.html) is the init system used by most modern Linux distributions (Ubuntu, Debian, Fedora...): it's what starts and supervises every background service on the machine; `cron` itself is one of those services on these distributions. On a systemd-based system, **timers** cover the same need as a crontab line, with a more verbose but more explicit setup.

### Two files instead of one line

`systemd` configures each behavior in a **unit**, a text file that describes *what to do* or *when to do it*. A scheduled task needs two of them, linked by their filename:

```text
backup.service   ┐
                 ├─ same name, different extension
backup.timer     ┘
```

The `.service` file describes the command to run:

```ini
[Unit]
Description=Nightly document backup                # text shown in logs/status

[Service]
Type=oneshot                                        # runs once then stops (not a service that keeps running)
WorkingDirectory=/home/user/scripts                 # working directory before launching the command
ExecStart=/usr/bin/python3 backup.py                # absolute path, same minimal-environment pitfall as cron
```

The `.timer` file describes when to trigger the service of the same name:

```ini
[Unit]
Description=Schedules backup.service every day

[Timer]
OnCalendar=daily                                    # equivalent of @daily in cron
Persistent=true                                     # catches up a missed run if the machine was off (see below)

[Install]
WantedBy=timers.target                              # needed for "enable" to actually activate the timer
```

Both files go in `/etc/systemd/system/` (system scope, requires root) or in `~/.config/systemd/user/` (user scope, see below). Once in place:

```bash
systemctl daemon-reload              # reloads unit files after creating/editing one
systemctl enable --now backup.timer  # enables the timer at boot AND starts it right away
systemctl list-timers                # lists active timers and their next run
journalctl -u backup.service         # reads this service's logs (replaces a manual redirect to a log file)
```

### `Persistent=true`: catching up isn't automatic

This is the most important nuance to remember: without `Persistent=true`, a timer behaves exactly like `cron`: if the machine is off at the scheduled time (e.g. `OnCalendar=daily` at midnight on a laptop that's off overnight), the run is simply lost, not caught up. `Persistent=true` changes this: `systemd` tracks the last run's date on disk, and if the timer discovers at the next startup that a deadline was missed, it triggers the run immediately instead of waiting for the next scheduled time.

| | `OnCalendar` alone | `OnCalendar` + `Persistent=true` |
|---|---|---|
| Machine on at the scheduled time | Runs at the scheduled time | Runs at the scheduled time |
| Machine off at the scheduled time | Run lost (like `cron`) | Runs at the timer's next startup |

### System scope or user scope (`--user`)

A timer placed in `/etc/systemd/system/` runs independently of any open session, but requires root to create. A timer placed in `~/.config/systemd/user/` doesn't require special permissions, but relies on a `systemd` instance dedicated to that user (commands prefixed with `--user`: `systemctl --user enable --now ...`): an instance that, by default, only starts when that user opens a session, and stops when it ends.

This last point matters for catching up: a `--user` timer with `Persistent=true` can only catch up a missed run at the next login, not at the machine's mere startup, if no one logs in right away. [`loginctl`](https://www.freedesktop.org/software/systemd/man/loginctl.html) lifts this limit for a given user:

```bash
loginctl enable-linger user   # "user"'s systemd --user instance starts at boot, session open or not
```

### `cron` or `systemd timer`?

| | `cron` | `systemd timer` |
|---|---|---|
| Catch-up if machine was off | No | Yes, with `Persistent=true` |
| Logging | Email (rarely configured) or manual redirect | Built-in (`journalctl`) |
| Dependencies between tasks | Not natively supported | Yes (a unit can depend on another) |
| Configuration | One crontab line | Two files per task |
| User scope without root | Yes, natively | Yes, via `--user` (+ `loginctl enable-linger` to run outside a session) |

`cron` remains largely sufficient for personal or occasional use with no need for catch-up; `systemd` timers become preferable as soon as a missed run needs to be caught up automatically, or in modern server environments already relying on `systemd` for everything else.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `cron` runs commands at regular intervals defined in a crontab (5 time fields). It runs in a minimal environment (no `.bashrc`, reduced `PATH`), very different from a manually opened terminal. `systemd` timers cover the same need with the ability to catch up missed runs. |
| **Tools you can use** | `crontab -e`/`-l`, special strings (`@daily`, `@reboot`...), `flock` to avoid concurrent runs; `.service`/`.timer` + `systemctl (--user) enable --now` + `journalctl` on the `systemd` side. |
| **Pitfalls to avoid** | Assuming cron's `PATH`/environment is identical to an interactive terminal's; letting a task fail silently with no output redirection; assuming a `.timer` automatically catches up a missed run without `Persistent=true`; forgetting that a `--user` timer only runs during an open session, unless `loginctl enable-linger` is set. |
| **Best practices** | Use absolute paths in a cron command; systematically redirect output to a log file; add `Persistent=true` to any `.timer` where catching up matters. |
