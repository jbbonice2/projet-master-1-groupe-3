# Django Project Setup with PostgreSQL and PostGIS

This guide will help you set up the backend for a Django project using PostgreSQL with the PostGIS extension for geographical data support.

## Prerequisites

- Python 3.x
- PostgreSQL
- pip (Python package installer)

## Step-by-Step Setup

### 1. Install PostgreSQL and PostGIS

#### On Ubuntu
```sh
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
```

#### On macOS (using Homebrew)
```sh
brew update
brew install postgresql postgis
brew services start postgresql
```

### 2. Configure PostgreSQL

#### Switch to the PostgreSQL user
```sh
sudo -i -u postgres
```

#### Open PostgreSQL prompt
```sh
psql
```

#### Create a new database user
```sql
CREATE USER envsens_user WITH PASSWORD 'someThing';
```

#### Create a new database
```sql
CREATE DATABASE envsens;
```

#### Add the PostGIS extension to your database
```sql
\c envsens
CREATE EXTENSION postgis;
```

#### Grant all privileges on the database to the user
```sql
GRANT ALL PRIVILEGES ON DATABASE envsens TO envsens_user;
```

#### Exit PostgreSQL prompt
```sql
\q
```

### 3. Clone the Repository

```sh
git clone https://gitlab.com/domga/envsens-back.git
cd envsens-back/EnvSensBackend
```

### 4. Create and Activate a Virtual Environment

#### On Ubuntu/macOS
```sh
python3 -m venv env
source env/bin/activate
```

#### On Windows
```sh
python -m venv env
.\env\Scripts\activate
```

### 5. Install Required Python Packages

```sh
pip install -r requirements.txt
```



### .6 Run Migrations

```sh
python manage.py makemigrations
python manage.py migrate
```

### 7. Create a Superuser

```sh
python manage.py createsuperuser
```

Follow the prompts to set up your superuser.

### 8. Run the Development Server

```sh
python manage.py runserver
```

Your Django application should now be running at `http://127.0.0.1:8000/`.

