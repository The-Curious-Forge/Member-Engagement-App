# Member Engagement App - Docker Setup

This repository has been dockerized to make deployment and development easier. The application consists of a Node.js backend and a SvelteKit frontend.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Variables

The application uses environment variables for configuration. These are stored in the `.env` file in the root directory. Make sure to update these values as needed:

```
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CALENDAR_ID=your_google_calendar_id
```

## Running the Application

### Development Mode

To run the application in development mode with hot reloading:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start both the backend and frontend services with volumes mounted for live code reloading.

### Production Mode

To build and run the application for production:

```bash
docker-compose up --build
```

### Running in Background

To run the containers in the background:

```bash
docker-compose up -d
```

Or for development:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stopping the Application

To stop the running containers:

```bash
docker-compose down
```

Or for development:

```bash
docker-compose -f docker-compose.dev.yml down
```

## Accessing the Application

- Frontend: http://localhost:5174
- Backend API: http://localhost:3000

## Container Structure

- **Backend**: Node.js Express server running on port 3000
- **Frontend**: SvelteKit application running on port 5174

## Rebuilding Containers

If you make changes to the Dockerfiles or need to rebuild the containers:

```bash
docker-compose build
```

Or to rebuild a specific service:

```bash
docker-compose build backend
docker-compose build frontend
```

## Viewing Logs

To view the logs of the running containers:

```bash
docker-compose logs
```

To follow the logs:

```bash
docker-compose logs -f
```

To view logs for a specific service:

```bash
docker-compose logs backend
docker-compose logs frontend
```
