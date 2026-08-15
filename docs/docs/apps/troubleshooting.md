---
sidebar_position: 2
description: Simple fixes when an App stays on Pending, sign-in fails, or sync stops.
---

# Apps troubleshooting

Use this guide when an App shows **Pending**, sign-in loops, or suddenly stops working.

## Before you start

1. Make sure you opened the right **Hacado workspace**.
2. Try another browser or a private (incognito) window.
3. Temporarily turn off extensions that block cookies or pop-ups.

## Sign-in window closes or stays blank

**What you might see:** Sign-in never finishes, or the window flashes and closes.

**Try this:**

- Allow pop-ups for your Hacado admin site.
- Try again with strict tracking protection relaxed just for that step.
- Use another browser or device.

If it still fails, record a short screen video and contact support. Say which App you used and roughly what time you tried.

## Stuck on Pending or Disconnected

**What you might see:** The App never connects, or it worked before and now shows an error.

**Try this:**

- Open **Apps**, then **Installed apps**. Open the App and use **Reconnect**. Complete every screen.
- Check email for security messages from Google, Microsoft, Stripe, PayPal, Zoom, or your email host.
- If your company manages access to outside apps, ask IT to allow Hacado.

## Permission or access errors

**What you might see:** The other service says Hacado cannot access calendar, mail, payments, or meetings.

**Try this:**

- Use **Reconnect** and accept **all** permissions the App asks for.
- If you denied access earlier, remove the old connection at that service if needed. Then remove the App in Hacado and add it again from **Store**.

## SMTP or calendar server sign-in fails

**What you might see:** A test email does not send, or a calendar stays empty.

**Try this:**

- Copy host, port, username, and password again from your provider’s help article.
- Try the encryption option they recommend (often labelled TLS or SSL).
- Confirm the mailbox allows sign-in from apps, not only normal web login.

## Payments look connected but checkout still fails

**Try this:**

- Open Stripe, Square, or PayPal in their own dashboards and fix any alerts (identity checks, compliance, limits).
- In Hacado, check **Default apps** and booking or payment settings so the processor you expect is selected.
- Run a small test payment before you invite clients to pay.

## Still stuck

Contact **Hacado support** using the channel your plan includes. Share the App name, your workspace, when it failed, and what you tried from this page.
