### README.md

# Envsens Frontend

## Project Context

Envsens is a web application designed to monitor and display environmental data collected from various sensors installed in different cities. The project encompasses user management, group permissions, and the geographical organization of countries and cities. The primary functionalities include:

- **User and Group Management**: Administrators can manage users and assign them to different groups with specific permissions.
- **Geographical Organization**: Manage countries and cities, linking them to networks and gateways.
- **Sensor Management**: Configure and manage sensors (devices) deployed across cities.
- **Environmental Data Display**: Display environmental data (e.g., pollutant levels) in graphs and tables.
- **Admin Role**: Administrators manage sensors, configure settings, and decide the data format to provide the best user experience for visitors interested in environmental data of their city or others.

## Contributors

This project is developed by students from the University of Yaoundé 1.

## Technology

The frontend is built using Next.js, a React framework that enables server-side rendering and generating static websites.

## Project Structure

```
envsens-front
└── frontend
    ├── app
    ├── jsconfig.json
    ├── next.config.mjs
    ├── node_modules
    ├── package.json
    ├── package-lock.json
    ├── public
    ├── README.md
    └── yarn.lock
```

## Installation Steps

### Prerequisites

- Node.js (version 14.x or higher)
- npm (Node package manager) or Yarn

### 1. Clone the Repository

```sh
git clone https://gitlab.com/domga/envsens-front.git
cd envsens-front/frontend
```

### 2. Install Dependencies

#### Using npm

```sh
npm install
```

#### Using Yarn

```sh
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory and add any necessary environment variables. For example:

```sh
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Run the Development Server

#### Using npm

```sh
npm run dev
```

#### Using Yarn

```sh
yarn dev
```

The development server should now be running at `http://localhost:3000/`.

### 5. Build for Production

To create an optimized production build, run:

#### Using npm

```sh
npm run build
```

#### Using Yarn

```sh
yarn build
```

### 6. Start the Production Server

After building the project, you can start the production server with:

#### Using npm

```sh
npm start
```

#### Using Yarn

```sh
yarn start
```

