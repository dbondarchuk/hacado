---
description: Delete a catalog package that has never been sold.
---

# Deleting a package

Delete a package when you no longer offer that prepaid bundle and it has never been sold. Hacado blocks delete when the package already has purchases.

## When delete is blocked

If anyone has bought the package, delete fails with a message that the package has purchases and cannot be deleted.

![Delete blocked when the package has purchases](/img/catalog/packages/delete-blocked.png)

Manage those purchases under [Sold packages](/docs/catalog/sold-packages) instead. You can cancel a sold package for a customer without deleting the catalog definition.

## Delete one package

1. Open **Appointments → Catalog → Packages**.
2. Open the row menu on the package.
3. Click **Delete**.
4. Confirm in the dialog.

If the package has purchases, the request fails and the package stays in the list.

## Delete several packages

1. Check packages that have no purchases.
2. Click **Delete selected**.
3. Confirm in the dialog. The confirm copy notes that only packages with no purchases are removed.

## What happens next

- The package leaves the **Packages** list when delete succeeds.
- Hacado also removes it from booking availability if it was listed under **Settings → Appointments → Services and packages**.
- You cannot undo a delete. Create the package again if you still need a similar offering - see [Creating a new package](./creating-a-new-package).

### Good to know

To stop new sales without removing history, keep the catalog package and manage customer copies under [Sold packages](/docs/catalog/sold-packages).
