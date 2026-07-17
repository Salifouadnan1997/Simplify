# Saisie Intelligente Pro — Document d'Architecture Technique

Ce document présente l'architecture globale, les choix technologiques et l'organisation du code du projet **Saisie Intelligente Pro** intégrant **React**, **Node.js/Express** et **Supabase**.

---

## 1. Architecture Globale

L'application repose sur un modèle **full-stack découplé**, exploitant la puissance du cloud et de l'intelligence artificielle pour simplifier la saisie, l'OCR et la signature de documents légaux et contractuels.

```
   ┌────────────────────────────────────────────────────────┐
   │                       FRONTEND                         │
   │               React + TypeScript + Vite                │
   └───────────┬────────────────────────────────┬───────────┘
               │                                │
               ▼ (Appels API)                   ▼ (Appels Directs)
   ┌───────────────────────┐        ┌───────────────────────┐
   │       BACKEND         │        │    SUPABASE CLOUD     │
   │    Node.js (Express)  │        │   (Auth, DB, Storage) │
   └───────────┬───────────┘        └───────────────────────┘
               │
               ▼ (Génération de contenu)
   ┌───────────────────────┐
   │   GEMINI AI STUDIO    │
   │    (Modèles Flash)    │
   └───────────────────────┘
```

### Flux d'exécution clés :
1. **Authentification** : Connexion directe du client React à Supabase Auth (Email/Mot de passe).
2. **Saisie & OCR** : L'utilisateur utilise sa voix ou charge un document. Le client interagit avec le serveur Node.js, qui sollicite le modèle **Gemini 3.5 Flash** pour extraire le texte et structurer les variables.
3. **Persistance & Stockage** : 
   - Les métadonnées du document sont persistées dans PostgreSQL sur **Supabase Database**.
   - Les documents générés (PDF) sont envoyés au bucket `documents` sur **Supabase Storage**.
   - Les images de signature de l'utilisateur sont envoyées au bucket `signatures` sur **Supabase Storage**.

---

## 2. Choix Technologiques

| Composant | Technologie | Justification |
| :--- | :--- | :--- |
| **Interface Utilisateur** | **React 19 & TypeScript** | Composants réutilisables, typage fort éliminant les erreurs d'intégration, cycle de rendu ultra-rapide. |
| **Mise en page & Design** | **Tailwind CSS v4** | Utilisation de classes utilitaires directes, performance de build, et design responsive pixel-perfect. |
| **Moteur d'Animation** | **Framer Motion** | Transitions fluides et naturelles lors de la navigation et de l'affichage des panneaux latéraux. |
| **Serveur Backend** | **Node.js (Express)** | Intégration facile de l'écosystème JS, proxy sécurisé pour la clé d'API Gemini (qui ne doit jamais transiter côté client), et rapidité d'exécution. |
| **Base de Données** | **PostgreSQL (via Supabase)** | Base relationnelle robuste pour la gestion structurée des documents et profils utilisateurs. |
| **Stockage Fichiers** | **Supabase Storage** | Hébergement sécurisé des images de signatures et des PDF générés avec gestion des droits d'accès. |
| **Authentification** | **Supabase Auth** | Gestion sécurisée des sessions, hashage conforme aux normes industrielles et gestion automatique des tokens JWT. |

---

## 3. Structure des Dossiers du Projet

Le projet est organisé pour séparer clairement les responsabilités tout en permettant un développement local unifié :

```
/
├── frontend/                   # Code source du Client React
│   ├── src/                    # Fichiers sources React
│   │   ├── components/         # Composants d'interface (Signature, Dictation, OCR...)
│   │   ├── lib/                # Client Supabase et utilitaires de calcul
│   │   ├── App.tsx             # Composant principal d'application
│   │   └── main.tsx            # Point d'entrée de montage React
│   ├── package.json            # Dépendances et scripts de build frontend
│   ├── tsconfig.json           # Règles de compilation TypeScript frontend
│   └── tailwind.config.js      # Configuration personnalisée Tailwind CSS
│
├── backend/                    # Code source du Serveur Node.js
│   ├── src/
│   │   └── server.ts           # Point d'entrée Express (End-points OCR, Gemini, Stripe/Moneroo)
│   ├── package.json            # Dépendances et scripts de build backend
│   └── tsconfig.json           # Règles de compilation TypeScript backend
│
├── .env.example                # Modèle de configuration des variables d'environnement
├── metadata.json               # Permissions de l'application et métadonnées AI Studio
└── ARCHITECTURE.md             # Documentation d'architecture technique (ce document)
```

---

## 4. Guide de Configuration de Supabase

Pour démarrer votre instance Supabase, effectuez les configurations suivantes sur votre [Console Supabase](https://supabase.com) :

### A. Authentification
1. Allez dans **Authentication** > **Providers**.
2. Activez le fournisseur **Email** (Email/Password).
3. (Optionnel) Désactivez l'option *Confirm email* pour le développement local afin de pouvoir tester des utilisateurs instantanément.

### B. Buckets de Stockage (Storage)
Créez deux buckets distincts dans **Storage** :
1. **`documents`** :
   - *Rôle* : Stockage des documents originaux, brouillons et PDF finaux.
   - *Visibilité* : Privé (l'accès se fait via des URL signées ou des règles de sécurité sélectives).
2. **`signatures`** :
   - *Rôle* : Stockage des tracés de signature et cachets de l'utilisateur.
   - *Visibilité* : Privé (seul l'utilisateur propriétaire peut y accéder).

### C. Schéma de Base de Données (SQL Blueprint)
Exécutez ce script SQL dans l'onglet **SQL Editor** de Supabase pour créer les tables de base requises :

```sql
-- Table des profils utilisateurs
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text default 'standard' check (role in ('standard', 'admin')) not null,
  organization text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des profils additionnels
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  signature_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des documents et contrats
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  file_url text,
  meta_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sécurité Niveau Ligne (Row Level Security - RLS)
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Règles RLS pour 'users' (rôles et organisations)
create policy "Les utilisateurs voient uniquement leurs informations de profil" 
  on public.users for select using (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les utilisateurs modifient uniquement leurs informations de profil" 
  on public.users for update using (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les admins et les utilisateurs peuvent insérer de nouveaux profils" 
  on public.users for insert with check (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

-- Règles RLS pour 'profiles'
create policy "Les utilisateurs peuvent voir leur propre profil" 
  on public.profiles for select using (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les utilisateurs peuvent modifier leur propre profil" 
  on public.profiles for update using (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Insertion automatique de profil" 
  on public.profiles for insert with check (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'admin');

-- Règles RLS pour 'documents'
create policy "Les utilisateurs voient uniquement leurs documents" 
  on public.documents for select using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les utilisateurs insèrent leurs propres documents" 
  on public.documents for insert with check (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les utilisateurs modifient leurs propres documents" 
  on public.documents for update using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');

create policy "Les utilisateurs suppriment leurs propres documents" 
  on public.documents for delete using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');
```
