# Système de Gestion de Catways et Réservations

Une application web complète pour gérer les catways (emplacements de port) et les réservations avec authentification utilisateur.

## Fonctionnalités

### Pages Principales

1. **Page d'Accueil** (`/`)
   - Présentation de l'application
   - Formulaire de connexion
   - Lien vers la documentation API

2. **Tableau de Bord** (`/dashboard`) - *Authentification requise*
   - Formulaires de gestion des utilisateurs (créer, modifier, supprimer)
   - Formulaires de gestion des catways (créer, modifier, supprimer, afficher détails)
   - Formulaires de gestion des réservations (créer, supprimer, afficher détails)
   - Liens d'accès rapide aux listes

3. **Liste des Catways** (`/catways`)
   - Affichage de tous les catways disponibles
   - Liens vers les détails de chaque catway

4. **Détails du Catway** (`/catways/:id`)
   - Informations détaillées d'un catway

5. **Liste des Réservations** (`/reservations`)
   - Affichage de toutes les réservations
   - Liens vers les détails de chaque réservation

6. **Détails de la Réservation** (`/reservations/:id`)
   - Informations détaillées d'une réservation

7. **Documentation API** (`/documentation`)
   - Documentation complète de l'API
   - Exemples de requêtes et réponses
   - Codes de réponse HTTP

## Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### Étapes

1. **Cloner ou extraire le projet**
   ```bash
   cd api-russel
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```
   API_BASE_URL=http://localhost:5000
   SESSION_SECRET=your_session_secret_key
   PORT=3000
   ```

4. **Démarrer le serveur**
   ```bash
   npm start
   ```

5. **Accéder à l'application**
   ```
   http://localhost:3000
   ```

## Mode Développement

Pour le développement avec rechargement automatique :

```bash
npm run dev
```

## Structure du Projet

```
api-russel/
├── server.js                 # Fichier principal du serveur
├── package.json             # Dépendances et scripts
├── .env                     # Variables d'environnement
├── routes/
│   ├── home.js             # Routes d'accueil et authentification
│   ├── dashboard.js        # Routes du tableau de bord
│   ├── catways.js          # Routes des catways
│   ├── reservations.js     # Routes des réservations
│   └── documentation.js    # Routes de la documentation
├── views/
│   ├── home.ejs            # Page d'accueil
│   ├── dashboard.ejs       # Tableau de bord
│   ├── catways-list.ejs    # Liste des catways
│   ├── catway-detail.ejs   # Détails du catway
│   ├── reservations-list.ejs   # Liste des réservations
│   ├── reservation-detail.ejs  # Détails de la réservation
│   ├── documentation.ejs   # Documentation API
│   └── 404.ejs             # Page d'erreur 404
└── public/
    └── css/
        └── style.css       # Feuilles de style
```

## Authentification

### Login (Simulation)
- **URL:** POST `/login`
- **Paramètres:** `username`, `password`
- **Comportement:** Une authentification simple qui crée une session utilisateur

### Logout
- **URL:** GET `/logout`
- **Effet:** Détruit la session utilisateur et redirige vers l'accueil

## Endpoints de l'Application

### Utilisateurs
- `POST /dashboard/users` - Créer un utilisateur
- `POST /dashboard/users/:id` - Modifier un utilisateur
- `POST /dashboard/users/:id/delete` - Supprimer un utilisateur

### Catways
- `POST /dashboard/catways` - Créer un catway
- `POST /dashboard/catways/:id` - Modifier un catway
- `POST /dashboard/catways/:id/delete` - Supprimer un catway
- `GET /dashboard/catway/:id` - Afficher les détails d'un catway
- `GET /catways` - Liste complète des catways
- `GET /catways/:id` - Détails d'un catway

### Réservations
- `POST /dashboard/reservations` - Créer une réservation
- `POST /dashboard/reservations/:id/delete` - Supprimer une réservation
- `GET /dashboard/reservation/:id` - Afficher les détails d'une réservation
- `GET /reservations` - Liste complète des réservations
- `GET /reservations/:id` - Détails d'une réservation

## Intégration API

Cette application web est conçue pour communiquer avec une API REST. Par défaut, elle essaie de se connecter à `http://localhost:5000`.

### Réponses Attendues

**Format de réponse pour les utilisateurs:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "createdAt": "2026-01-24T10:00:00Z",
  "updatedAt": "2026-01-24T10:00:00Z"
}
```

**Format de réponse pour les catways:**
```json
{
  "id": 1,
  "number": "A1",
  "status": "disponible",
  "createdAt": "2026-01-24T10:00:00Z",
  "updatedAt": "2026-01-24T10:00:00Z"
}
```

**Format de réponse pour les réservations:**
```json
{
  "id": 1,
  "catwayId": 1,
  "clientName": "Jean Dupont",
  "clientEmail": "jean@example.com",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-07T00:00:00Z",
  "createdAt": "2026-01-24T10:00:00Z",
  "updatedAt": "2026-01-24T10:00:00Z"
}
```

## Technologies Utilisées

- **Backend:** Node.js, Express.js
- **Templating:** EJS (Embedded JavaScript)
- **HTTP Client:** Axios
- **Session Management:** express-session
- **CSS:** Personnalisé, responsive design
- **Environment:** dotenv

## Déploiement

Pour déployer en production :

1. Modifier les variables d'environnement (notamment `API_BASE_URL` et `SESSION_SECRET`)
2. Configurer HTTPS
3. Utiliser un reverse proxy (Nginx, Apache)
4. Utiliser un gestionnaire de processus (PM2, systemd)
5. Implémenter une base de données réelle pour les sessions

## Notes de Développement

- L'authentification est actuellement simulée. À remplacer par une vraie API.
- Les messages d'erreur et de succès peuvent être améliorés avec du JavaScript côté client.
- Les formulaires du tableau de bord nécessitent une validation côté client.
- CORS peut être nécessaire si l'API est sur un domaine différent.

## Licence

Tous droits réservés © 2026 Système de Gestion de Catways
