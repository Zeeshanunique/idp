# Autonomous Document Intelligence - Frontend

This is the frontend application for the Autonomous Document Intelligence platform, built with Next.js, TypeScript, and Tailwind CSS.

## Overview

The Autonomous Document Intelligence platform transforms unstructured documents into structured intelligence using a team of specialized AI agents. This frontend provides a user interface for uploading documents, initiating investigations, and viewing the results.

## Features

- Modern, responsive UI built with Tailwind CSS
- File upload for document processing
- Case investigation interface
- Result visualization
- About section explaining the technology

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Development

To start the development server:

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

To build the application for production:

```
npm run build
```

### Start Production Server

To start the production server:

```
npm run start
```

## Project Structure

- `app/` - Application pages using Next.js App Router
- `components/` - Reusable UI components
- `public/` - Static assets
- `styles/` - Global styles and Tailwind configuration

## Backend Integration

The frontend connects to the Python backend running on port 8000. The API proxy is configured in `next.config.js`.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs) 