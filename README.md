# Scrutin — Plateforme de vote électronique

Site HTML/CSS/JS vanilla + Firebase (Firestore + Auth), avec un espace
**électeur** et un espace **organisateur (admin)**.

## Structure du projet

```
evote/
├── index.html                 Accueil (choix électeur / organisateur)
├── electeur-login.html        Identification (nom, prénom, CIN)
├── electeur-vote.html         Bulletin de vote
├── electeur-confirmation.html Confirmation après le vote
├── admin-login.html           Connexion organisateur
├── admin-dashboard.html       Tableau de bord (élection, candidats, électeurs, résultats)
├── css/style.css
├── js/
│   ├── firebase-config.js     Clés Firebase (à compléter)
│   ├── utils.js
│   ├── electeur-login.js
│   ├── electeur-vote.js
│   ├── admin-login.js
│   └── admin-dashboard.js
└── firestore.rules            Règles de sécurité à publier
```

## 1. Créer le projet Firebase

1. https://console.firebase.google.com → **Ajouter un projet**.
2. Dans **Paramètres du projet > Général**, ajoute une application **Web**.
3. Copie l'objet `firebaseConfig` fourni et colle-le dans `js/firebase-config.js`
   à la place des valeurs `REMPLACE_MOI`.

## 2. Activer l'authentification (organisateurs)

1. **Authentication > Sign-in method** → active **E-mail/Mot de passe**.
2. **Authentication > Users > Add user** → crée un compte pour chaque
   organisateur (ex : toi et Cheikh). C'est ce compte qui sert à se
   connecter sur `admin-login.html`.

Il n'y a pas d'auto-inscription admin dans le site : c'est volontaire, pour
que seuls les comptes créés par toi puissent administrer le scrutin.

## 3. Activer Firestore

1. **Firestore Database** → **Créer une base de données** (mode production).
2. **Règles** → colle le contenu de `firestore.rules` puis **Publier**.

### Modèle de données

| Collection  | Doc ID          | Champs |
|---|---|---|
| `config`    | `actuelle`      | `titre`, `description`, `statut` (`brouillon`/`ouverte`/`fermee`) |
| `candidats` | auto            | `nom`, `description`, `photoUrl`, `voix`, `ordre` |
| `electeurs` | CIN normalisé   | `nom`, `prenom`, `aVote`, `dateVote` |

Le document `config/actuelle` est créé automatiquement dès que tu
enregistres le titre de l'élection depuis le tableau de bord.

## 4. Index Firestore

La page de vote trie les candidats par `ordre` et la page résultats par
`voix` : ce sont des tris sur un seul champ, donc **aucun index composite
n'est nécessaire**.

## 5. Tester en local

Comme le projet utilise `fetch`/Firestore SDK, ouvre-le via un petit
serveur local plutôt qu'en `file://` :

```bash
npx serve .
# ou
python3 -m http.server 5500
```

## 6. Déployer sur Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # dossier public = evote/ (racine du projet)
firebase deploy
```

## Utilisation

1. Connecte-toi sur **Espace organisateur** → onglet **Élection** : saisis
   un titre, enregistre, puis ajoute des **candidats**.
2. Onglet **Liste électorale** : ajoute les électeurs un par un ou en bloc
   (`Nom;Prénom;CIN`, une ligne par personne).
3. Clique **Ouvrir le scrutin** quand tu es prêt.
4. Les électeurs vont sur **Espace électeur**, s'identifient avec
   nom + prénom + numéro de CIN (exactement comme inscrits), puis votent.
5. Onglet **Résultats** : suivi en direct du nombre de votants, du taux de
   participation et du score de chaque candidat. **Fermer le scrutin**
   verrouille les votes et fait apparaître le vainqueur.

## Sécurité / vie privée

- Le vote est **secret** : une fois le vote enregistré, seul le compteur
  du candidat augmente — aucune trace du choix n'est associée à
  l'électeur dans la base.
- Un électeur ne peut voter qu'une fois : la transition
  `aVote: false → true` est vérifiée à la fois côté application (avant
  d'afficher le bulletin) et côté règles Firestore (impossible à
  contourner depuis la console développeur du navigateur).
- Les règles Firestore limitent précisément ce qu'un visiteur non connecté
  peut écrire (uniquement cette transition de vote, sans pouvoir changer
  nom/prénom ni ajouter des voix arbitraires).
