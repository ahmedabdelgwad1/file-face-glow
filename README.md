# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Integrated Plant Diagnosis Backend

This repo is now wired to a Python backend that runs:
- Local Keras model prediction (`plant_disease_model2.keras` / `plant_disease_model.keras`)
- Optional Groq enhancement
- Final fused diagnosis

### 1) Run backend

From workspace root (`/Users/apple/Desktop/plant4`):

```sh
pip install -r file-face-glow/backend/requirements.txt
uvicorn file-face-glow.backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Run frontend

From `file-face-glow/`:

```sh
npm i
npm run dev
```

Frontend calls backend at `http://127.0.0.1:8000` by default.
To change it, set:

```sh
VITE_API_BASE_URL=http://your-host:8000
```

## Deploy to Hugging Face Spaces (Docker)

This project is ready for a single-container deployment (frontend + backend together).

### Steps

1. Create a new **Space** on Hugging Face.
2. Choose **Docker** SDK.
3. Push this `file-face-glow` folder to that Space repository.
4. In Space settings, add Secrets/Variables:
   - `GROQ_API_KEY` (optional)
   - `GROQ_VISION_MODEL` (optional)
   - `GROQ_EXTRA_PROMPT` (optional)

The app runs on port `7860` inside the container and serves:
- Frontend at `/`
- API at `/api/diagnose`
- Health check at `/health`
