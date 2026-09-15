# Prép-Maths48

Plateforme e-learning premium dédiée aux maths du **Bac marocain** et à la préparation des **concours post-bac** (Médecine, ENSA, ENSAM, ENCG, ISCAE, ENA…).

> « Maîtrise les maths du Bac et prépare les concours en suivant un parcours clair, étape par étape. »

Type Udemy / Coursera, mais spécialisée : cours vidéo, fiches PDF, quiz corrigés, suivi de progression, espace élève et back-office admin complet.

---

## ✨ Fonctionnalités

**Élève**
- Connexion / mot de passe oublié (pas d'inscription publique : les comptes élèves sont créés par l'admin)
- Catalogue filtrable (filière, concours, niveau, gratuit/premium)
- Détail de cours avec chapitres, séances, ressources et quiz
- Lecteur vidéo sécurisé (filigrane, URLs signées, anti-téléchargement)
- Lecteur PDF protégé (téléchargement conditionnel)
- Quiz interactifs corrigés (explications + astuces) avec score et révision des erreurs
- Notes personnelles par séance
- Tableau de bord : progression globale, reprise, quiz récents, recommandations
- Statistiques détaillées et points faibles
- Profil (niveau, filière, objectif concours, ville, lycée)

**Admin**
- Tableau de bord (élèves, cours, revenus, progression moyenne)
- CRUD cours, chapitres, séances, ressources PDF, quiz + questions
- Upload de fichiers (local en dev, prêt pour S3/Bunny/R2)
- Publication / dépublication de contenu
- Gestion des élèves (rôle, accès premium manuel, activation/désactivation)
- Gestion des paiements & abonnements (validation manuelle marocaine)

---

## 🧱 Stack technique

| Domaine | Choix |
|--------|-------|
| Framework | **Next.js 14** (App Router) |
| Langage | **TypeScript** |
| UI | **Tailwind CSS** + composants maison + `lucide-react` |
| Backend | Route Handlers Next.js |
| Base de données | **PostgreSQL** |
| ORM | **Prisma** |
| Auth | **NextAuth.js** (Credentials + JWT) |
| Validation | **Zod** |
| Notifications | **sonner** |
| Hash mot de passe | **bcryptjs** |

---

## 🚀 Installation

> 📦 **Installation sur un nouveau PC ?** Suis le guide détaillé pas à pas
> (prérequis, liens de téléchargement, Windows/macOS/Linux, dépannage) :
> **[INSTALL.md](INSTALL.md)**. Résumé ci-dessous.

### 1. Prérequis
- Node.js 18+ (testé sur Node 24) — https://nodejs.org/ (version LTS)
- PostgreSQL 14+ — https://www.postgresql.org/download/
- (optionnel) Git pour cloner le dépôt

### 2. Cloner & installer
```bash
npm install
```

### 3. Base de données
Installez PostgreSQL puis créez une base `prepmaths48` :
```bash
psql -U postgres -c "CREATE DATABASE prepmaths48;"
```
(ou via pgAdmin). Ajustez le mot de passe dans `DATABASE_URL` si besoin.

### 4. Variables d'environnement
Copiez `.env.example` vers `.env` puis ajustez :
```bash
cp .env.example .env
```

### 5. Schéma + données de démo
```bash
npm run db:push      # crée les tables
npm run db:seed      # insère les données de démonstration
```

### 6. Lancer
```bash
npm run dev
```
→ http://localhost:3000

---

## 🔐 Variables `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `NEXTAUTH_SECRET` | Secret de session (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL de base (ex. `http://localhost:3000`) |
| `VIDEO_SIGNING_KEY` | Clé HMAC pour signer les URLs vidéo temporaires |
| `BUNNY_*` / `CLOUDFLARE_*` | (optionnel) intégration vidéo prod |
| `STRIPE_*` | (optionnel) paiement en ligne futur |

---

## 📜 Commandes

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (génère Prisma + build Next) |
| `npm run start` | Démarre le build de production |
| `npm run lint` | ESLint |
| `npm run db:push` | Applique le schéma Prisma à la base |
| `npm run db:migrate` | Crée une migration de développement |
| `npm run db:seed` | Remplit la base avec les données de démo |
| `npm run db:studio` | Ouvre Prisma Studio |

---

## 👤 Comptes de test (après `npm run db:seed`)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@prepmaths48.com` | `password123` |
| Élève | `student@prepmaths48.com` | `password123` |

> L'élève de démo possède un **abonnement premium ACTIF**. Pour tester les états
> verrouillés, révoque son premium dans **/admin/students** ou **/admin/payments**.
> La 1ʳᵉ séance de chaque cours reste en **aperçu gratuit**.

---

## 🗂️ Structure du projet

```
prisma/
  schema.prisma        # modèle de données complet
  seed.ts              # données de démonstration
scripts/
  make-demo-pdf.mjs    # génère les PDF de démo
src/
  app/
    (public)/          # landing, catalogue, pricing
    (auth)/            # login, forgot-password
    (student)/         # dashboard, courses, learn, resources, quiz, progress, profile
    (admin)/           # admin + CRUD
    api/               # route handlers (auth, progress, quiz, admin/* dont students, video, resources)
  components/
    layout/  ui/  courses/  dashboard/  quiz/  admin/  video/  pdf/  pricing/
  lib/
    auth.ts prisma.ts permissions.ts subscription.ts video.ts
    progress.ts queries.ts plans.ts validations.ts utils.ts admin-guard.ts
  styles/globals.css   # tokens de design (issus des maquettes)
  types/               # types + libellés des enums
```

---

## 🎬 Protection des vidéos

La protection à 100 % est impossible (enregistrement d'écran), mais des mesures
sérieuses sont en place :

- **Aucun lien direct permanent** : la source LOCAL est servie par un proxy
  `/api/video/[lessonId]` qui exige un **jeton HMAC signé temporaire** lié à
  `(lessonId, userId)` et expirant (voir `src/lib/video.ts`).
- **Vérification d'accès côté serveur** sur chaque requête (premium / aperçu).
- **Filigrane dynamique** à l'email de l'élève par-dessus la vidéo.
- **Téléchargement natif désactivé** (`controlsList="nodownload"`, menu contextuel bloqué, `Content-Disposition: inline`).
- **Compatible providers sécurisés** : Bunny Stream, Cloudflare Stream, Vimeo privé
  (changer `videoProvider` sur la séance → lecture via iframe du provider).

Les PDF suivent la même logique via `/api/resources/[id]/file` : accès vérifié,
téléchargement autorisé seulement si `allowDownload` est activé par l'admin.

---

## 💳 Paiement & abonnement

Plans : **Gratuit**, **Premium mensuel**, **Premium annuel**, **Pack concours**
(voir `src/lib/plans.ts`).

Flux **paiement manuel marocain** (opérationnel) :
1. L'élève choisit un plan → crée un abonnement `PENDING` + un paiement `PENDING`.
2. Il effectue le virement/transfert et envoie sa preuve.
3. L'admin valide dans **/admin/payments** → abonnement `ACTIVE` (dates calculées) + paiement `PAID`.

Statuts d'abonnement : `PENDING · ACTIVE · EXPIRED · CANCELLED · REJECTED`.
L'intégration Stripe est prête à brancher (variables d'env + nouveau provider).

---

## ✅ Qualité / vérifications

```bash
npx tsc --noEmit   # types OK
npm run lint       # lint OK
npm run build      # build OK
```

---

## 🛣️ Prochaines améliorations

- Paiement en ligne (Stripe / CMI) et webhooks
- Upload vidéo direct vers Bunny/Cloudflare + transcodage
- Réinitialisation de mot de passe par email (SMTP/Resend)
- Mode examen chronométré et annales par concours
- Internationalisation (arabe / darija)
- Recherche plein-texte et recommandations personnalisées
- Tests automatisés (Vitest / Playwright)
- Rôle « professeur » et analytics avancées
