# Gruppe Offene Synode – Website

Static site for the Gruppe Offene Synode (GOS), a faction of the Synode of the
Reformierte Kirchen Bern-Jura-Solothurn. German/French, hosted on Firebase.

- Live: https://gruppe-offene-synode.web.app
- Admin portal (events, documents, admins): https://gruppe-offene-synode.web.app/admin.html
- Chat editor (change the site by describing the change): https://gruppe-offene-synode.web.app/editor.html

## Layout

| file | purpose |
|---|---|
| `index.html` | the whole public page; every text carries a `data-i18n` key |
| `i18n.js` | DE and FR strings for those keys |
| `style.css`, `script.js` | design and behaviour; bump `?v=N` in `index.html` when changing them |
| `firestore-content.js` | loads events and documents from Firestore into the page |
| `admin.html/.js/.css` | admin portal (Google sign-in; admins listed in the `gos-admins` collection) |
| `editor.html` | shell page for the chat editor served from the home server |
| `firestore.rules`, `firestore.indexes.json`, `storage.rules` | security rules and the composite indexes the content queries need |
| `migrate-firestore.mjs` | one-off script used to copy Firestore data between Firebase projects |

## Deploy

Firebase project `gruppe-offene-synode` (see `.firebaserc`).

```
firebase deploy                      # hosting + Firestore rules/indexes + Storage rules
firebase deploy --only hosting
```

The chat editor commits and deploys on its own after every change it makes.
