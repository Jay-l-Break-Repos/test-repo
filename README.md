# DocuServe

A workspace for uploading, storing, managing, and viewing documents, enabling teams or individuals to share files in a centralized repository.

## 🏗️ Architecture
```
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐
│ React Frontend  │◄──►│  FastAPI Backend  │◄──►│  PostgreSQL DB  │
│  (Port 5173)    │    │   (Port 8000)     │    │   (Port 5432)   │
└─────────────────┘    └───────────────────┘    └─────────────────┘
```

## 📋 API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/documents/upload` | Upload a new document. |
| `GET` | `/api/documents` | Retrieve a list of all documents. |
| `GET` | `/api/documents/{id}` | Retrieve metadata for a specific document. |
| `GET` | `/api/documents/{id}/view` | View the content of a specific document. |

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI
*   **ORM / DB Library**: SQLModel
*   **Database**: PostgreSQL 15
*   **Language/Runtime**: Python 3.10+
*   **Server**: Uvicorn

### Frontend
*   **Framework**: React
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **UI Libraries**: TailwindCSS, Lucide React
*   **Runtime**: Node.js

### Infrastructure
*   **Containerization**: Docker
*   **Database Server**: PostgreSQL

## 🗄️ Database Schema

### Table: `document`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key (Auto-increment) |
| `name` | String | Name of the document (Indexed) |
| `size` | Integer | Size of the document in bytes |
| `content_type` | String | MIME type of the document |
| `path` | String | File system path to the stored document |
| `owner_id` | Integer | ID of the document owner |
| `last_modified_by`| String | Username of the last modifier |
| `extracted_text` | String | Text content extracted from the document |
| `created_at` | DateTime | Timestamp of creation |

## � Quick Start

### Prerequisites
*   Docker & Docker Compose
*   Git
*   Node.js (optional, for local development)
*   AWS CLI

### 1. Clone Repository

You can clone the repository using your PAT to authenticat

```bash
git clone https://TEAM_GITHUB_USERNAME:PERSONAL_ACCESS_TOKEN@github.com/AmazonNovaAIChallenge2026/s-T00-samplerepo1-UA0000S01.git
cd s-T00-samplerepo1-UA0000S01
```

Or you can simply download the zip from the GitHub page https://github.com/AmazonNovaAIChallenge2026/s-S01-samplerepo1-UA0000S01.

### 2. Login Into ECR
Use IAM credentials to log into ECR so you can build the images in ECR.
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 238280154298.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Start Application

**Note: If on Mac execute the folowing**
```bash
export DOCKER_DEFAULT_PLATFORM=linux/arm64
```

You can use either

```bash
docker-compose up -d --build
```

or

```bash
docker compose up -d --build
```

depending on the system

### 4. Access the Application
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Database**: `localhost:5432`

### 5. Stopping the Application

You can use either

```bash
docker-compose down
```

or

```bash
docker compose down
```

depending on the system

To check that the containers are actually stopped use

```bash
docker container ls
```
