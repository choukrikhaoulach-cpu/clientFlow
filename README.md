# ClientFlow

Application CRM et de facturation full-stack pour freelances, consultants et petites agences.

**Projet personnel - demonstration de competences full-stack.**

## A propos

ClientFlow permet de gerer clients, projets, taches, factures, paiements et notes depuis un tableau de bord unique. L application inclut une authentification JWT, une isolation multi-utilisateurs des donnees, et une architecture Flask + React.

## Fonctionnalites

### Authentification et securite
- Inscription / connexion par email et mot de passe
- Hachage securise des mots de passe (Werkzeug)
- Authentification par jetons JWT (Flask-JWT-Extended)
- Isolation complete des donnees par utilisateur

### Gestion clients
- Liste des clients avec recherche
- Fiches clients detaillees avec historique de revenus
- Creation, modification, suppression

### Projets et taches
- Suivi des projets avec statuts (Planification, En cours, Termine, En attente)
- Budgets et dates limites par projet
- Taches avec priorites, dates d echeance et filtres par statut

### Factures et paiements
- Generateur de factures avec lignes dynamiques
- Calcul automatique sous-total / taxe / total
- Mise en page prete a imprimer (Print / Save as PDF)
- Enregistrement des paiements avec mise a jour automatique du statut de facture

### Tableau de bord
- Statistiques cles : nombre de clients, projets actifs, factures en attente, chiffre d affaires
- Graphique d evolution du chiffre d affaires sur 6 mois
- Activite recente, factures recentes, taches a venir

### Autres
- Notes libres avec liaison optionnelle a un client
- Page de parametres : edition du profil, changement de mot de passe, preferences
- UI responsive : sidebar pliable, tableaux transformes en cartes sur mobile
- Kit UI reutilisable : boutons, inputs, selects, modales, toasts, etats de chargement / vide / erreur

## Stack technique

### Backend
- **Python 3.11+**
- **Flask 3.0.3**
- **Flask-SQLAlchemy 3.1.1** (ORM)
- **Flask-JWT-Extended 4.6.0** (authentification)
- **Flask-CORS 4.0.1**
- **Werkzeug 3.0.4** (securite mots de passe)
- **SQLite** (developpement local) / **PostgreSQL** (production)
- **Gunicorn** (serveur de production)

### Frontend
- **React 18**
- **Vite 8**
- **React Router 6**
- **Axios** (appels API)
- **Framer Motion** (animations)
- **Recharts** (graphiques)
- **Lucide React** (icones)

## Architecture
clientflow/
├── backend/
│ ├── app.py # Point d entree Flask
│ ├── config.py # Configuration
│ ├── models.py # Modeles SQLAlchemy
│ ├── routes/ # Endpoints API (auth, clients, projects, invoices...)
│ ├── extensions.py # Extensions Flask
│ ├── errors.py # Gestion centralisee des erreurs
│ ├── validators.py # Validation des entrees
│ ├── requirements.txt
│ └── .env.example
├── frontend/
│ ├── src/
│ │ ├── pages/ # Pages React
│ │ ├── components/ # Composants reutilisables
│ │ ├── context/ # Auth, Theme
│ │ └── api/ # Client Axios
│ ├── package.json
│ └── .env.example
├── .gitignore
├── LICENSE.txt
└── README.md

text

## Installation

### Prerequis

- Python 3.11+
- Node.js 18+

### Backend

1. Aller dans le dossier backend
cd backend

text

2. Creer un environnement virtuel
python -m venv venv
venv\Scripts\activate # Windows
source venv/bin/activate # macOS / Linux

text

3. Installer les dependances
pip install -r requirements.txt

text

4. Configurer l environnement
copy .env.example .env # Windows
cp .env.example .env # macOS / Linux

text

Puis editer `.env` avec tes vraies valeurs (notamment `JWT_SECRET_KEY`).

5. Lancer le serveur
python app.py

text

Le backend ecoute sur `http://localhost:5000`.

### Frontend

1. Aller dans le dossier frontend
cd frontend

text

2. Installer les dependances
npm install

text

3. Configurer l environnement
copy .env.example .env.local

text

4. Lancer le serveur de developpement
npm run dev

text

Le frontend ecoute sur `http://localhost:5173`.

## Variables d environnement

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de la base de donnees (SQLite en dev, PostgreSQL en prod) |
| `JWT_SECRET_KEY` | Cle secrete pour signer les jetons JWT (obligatoire, longue et aleatoire) |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | Duree de validite des jetons (defaut : 24h) |
| `FRONTEND_ORIGIN` | URL du frontend autorisee par CORS |
| `FLASK_ENV` | `development` ou `production` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l API backend |

## Auteur

**Khaoula Choukri**
- LinkedIn : https://www.linkedin.com/in/khaoula-choukri
- GitHub : https://github.com/choukrikhaoulach-cpu

## Licence

Voir le fichier `LICENSE.txt`.