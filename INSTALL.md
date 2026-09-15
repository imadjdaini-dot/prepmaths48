# 🛠️ Guide d'installation — Prép-Maths48 (sur un nouveau PC)

Ce guide explique **comment récupérer, configurer et lancer** le projet sur une
machine vierge (Windows, macOS ou Linux), de zéro jusqu'à `http://localhost:3000`.

---

## 1. Logiciels requis (à installer une seule fois)

| Logiciel | Version | Rôle | Lien |
|----------|---------|------|------|
| **Node.js** | 18 LTS ou + (testé sur Node 20/24) | Exécuter Next.js et npm | https://nodejs.org/ (prendre la version **LTS**) |
| **PostgreSQL** | 14+ | Base de données | https://www.postgresql.org/download/ |
| **Git** | récent | Récupérer le code (optionnel si tu copies un ZIP) | https://git-scm.com/downloads |

> 💡 **Pas besoin de Docker.** On installe PostgreSQL directement sur le PC
> (installateur officiel). Sur Windows, l'installateur inclut **pgAdmin** (une
> interface graphique) et l'outil `psql` en ligne de commande.

### À retenir pendant l'installation de PostgreSQL (Windows)
1. Télécharge l'installateur sur https://www.postgresql.org/download/windows/ (lien « Download the installer » → EDB).
2. Lance-le et garde les options par défaut. **Note bien :**
   - **Mot de passe** que tu choisis pour l'utilisateur `postgres` → tu en auras besoin dans `.env`.
   - **Port** : laisse `5432`.
3. Tu peux **décocher** « Stack Builder » à la fin (inutile ici).

**Vérifier que tout est installé** (dans un terminal) :

```bash
node -v        # doit afficher v18+ (ex. v20.x ou v24.x)
npm -v
psql --version # doit afficher psql (PostgreSQL) 14+ — sinon voir la note ci-dessous
git --version  # si tu utilises Git
```

> ℹ️ Si `psql` n'est pas reconnu sous Windows, c'est qu'il n'est pas dans le PATH.
> Il se trouve par défaut dans `C:\Program Files\PostgreSQL\16\bin`. Tu peux soit
> ajouter ce dossier au PATH, soit utiliser **pgAdmin** (interface graphique) pour
> les opérations sur la base.

---

## 2. Récupérer le projet

### Option A — avec Git
```bash
git clone <URL_DU_DEPOT> prepmaths48
cd prepmaths48
```

### Option B — avec un ZIP (pas de Git)
1. Copie/décompresse le dossier du projet sur le nouveau PC.
2. Ouvre un terminal **dans le dossier du projet** (celui qui contient `package.json`).

> ⚠️ Ne copie **pas** les dossiers `node_modules/` ni `.next/` d'un PC à l'autre :
> ils sont lourds et liés à l'OS. Ils seront régénérés à l'étape suivante.

---

## 3. Installation pas à pas

### Étape 1 — Installer les dépendances
```bash
npm install
```
> Cela installe les paquets **et** génère automatiquement le client Prisma
> (script `postinstall`).

### Étape 2 — Créer la base de données

PostgreSQL démarre automatiquement comme **service Windows** après l'installation.
Il faut juste créer une base vide nommée `prepmaths48`. Choisis une méthode :

**Méthode A — en ligne de commande (`psql`)**
```bash
# Te demande le mot de passe de l'utilisateur postgres
psql -U postgres -c "CREATE DATABASE prepmaths48;"
```
Si `psql` n'est pas dans le PATH, utilise le chemin complet, par ex. :
```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE prepmaths48;"
```

**Méthode B — avec pgAdmin (interface graphique)**
1. Ouvre **pgAdmin** → connecte-toi au serveur (mot de passe `postgres`).
2. Clic droit sur **Databases** → **Create** → **Database…**
3. Nom : `prepmaths48` → **Save**.

### Étape 3 — Configurer les variables d'environnement
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux / Git Bash
cp .env.example .env
```
Ouvre `.env` et vérifie/ajuste :
- `DATABASE_URL` → **adapte le mot de passe** à celui choisi pendant l'installation de PostgreSQL.
  Format : `postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/prepmaths48?schema=public`
  (si tu as gardé `postgres` comme mot de passe, la valeur par défaut du `.env.example` fonctionne telle quelle).
- `NEXTAUTH_SECRET` → une longue chaîne aléatoire (en dev la valeur par défaut suffit). Pour générer : `openssl rand -base64 32`.
- `NEXTAUTH_URL` → `http://localhost:3000` en local.
- `VIDEO_SIGNING_KEY` → n'importe quelle chaîne en dev.

### Étape 4 — Créer les tables et les données de démo
```bash
npm run db:push      # crée les tables dans PostgreSQL
npm run db:seed      # insère cours, élève/admin de démo, etc.
```

### Étape 5 — Lancer l'application
```bash
npm run dev
```
➡️ Ouvre **http://localhost:3000**

---

## 4. Tout en une fois (copier-coller)

Une fois **Node.js et PostgreSQL installés**, la base `prepmaths48` créée
(étape 2) et le `.env` configuré, depuis le dossier du projet :

```bash
# Windows PowerShell
npm install ; npm run db:push ; npm run db:seed ; npm run dev
```

```bash
# macOS / Linux / Git Bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

---

## 5. Comptes de test (créés par `npm run db:seed`)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `admin@prepmaths48.com` | `password123` |
| **Élève** (premium actif) | `student@prepmaths48.com` | `password123` |

> La 1ʳᵉ séance de chaque cours est en **aperçu gratuit**. Pour tester l'état
> verrouillé, révoque le premium de l'élève dans **/admin/payments**.

---

## 6. Démarrages suivants

PostgreSQL tourne en **service Windows** : il démarre tout seul avec l'ordinateur.
Pour relancer le projet il suffit donc de :
```bash
npm run dev
```

> Si jamais la base ne répond pas, vérifie que le service tourne :
> ouvre **Services** (Windows) → cherche `postgresql-x64-16` → **Démarrer**.
> En ligne de commande (PowerShell admin) : `Start-Service postgresql-x64-16`.

---

## 7. Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| `Can't reach database server at localhost:5432` | Service PostgreSQL arrêté | Démarre le service `postgresql-x64-16` (voir §6) puis relance `npm run db:push` |
| `password authentication failed for user "postgres"` | Mot de passe du `.env` ≠ celui de l'installation | Corrige le mot de passe dans `DATABASE_URL` (étape 3) |
| `database "prepmaths48" does not exist` | Base pas encore créée | Refais l'étape 2 (`CREATE DATABASE prepmaths48;`) |
| `Port 3000 is already in use` | Une autre instance tourne | Ferme l'autre processus, ou lance `npm run dev -- -p 3001` |
| `Environment variable not found: DATABASE_URL` | Pas de fichier `.env` | Refais l'étape 3 (copier `.env.example` → `.env`) |
| `psql` n'est pas reconnu (Windows) | PostgreSQL pas dans le PATH | Utilise le chemin complet `C:\Program Files\PostgreSQL\16\bin\psql.exe` ou pgAdmin |
| Erreur Prisma après un `git pull` | Schéma modifié | `npm run db:push` puis, si besoin, `npm run db:seed` |
| `prisma generate` manquant / types KO | Client Prisma non généré | `npx prisma generate` (ou relance `npm install`) |

---

## 8. Aller plus loin

| Commande | Rôle |
|----------|------|
| `npm run build` | Build de production |
| `npm run start` | Démarre le build de production |
| `npm run lint` | ESLint |
| `npm run db:studio` | Interface visuelle de la base (Prisma Studio) |
| `npm run db:migrate` | Crée une migration de développement |

Pour le reste (fonctionnalités, architecture, sécurité vidéo, paiements), voir
[README.md](README.md).
