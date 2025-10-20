# ResiliBot Frontend

Modern, real-time dashboard for monitoring and managing autonomous incident response.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Material-UI 7
- **State Management**: Zustand
- **Data Fetching**: Axios + TanStack Query
- **Charts**: Recharts + D3.js
- **Testing**: Jest + Cypress

## Features

- 📊 Real-time incident monitoring dashboard
- 🤖 Agent reasoning visualization (ORPA loop)
- 🚨 Incident management with detailed views
- 📈 System health metrics and charts
- ✅ Human-in-the-loop approval workflow
- 🎨 Responsive Material-UI design
- 🔄 Auto-refresh with polling (WebSocket ready)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- ResiliBot backend API running

### Installation

```bash
# Install dependencies
npm install

# Configure API endpoint
echo "NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod" > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── incidents/          # Incidents page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── incidents/          # Incident components
│   │   ├── layout/             # Layout components
│   │   └── common/             # Shared components
│   ├── services/               # API services
│   │   └── apiService.ts       # API client
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand state management
│   ├── types/                  # TypeScript definitions
│   └── constants/              # Constants and configs
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
└── next.config.ts              # Next.js config
```

## Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run unit tests
npm test

# Run E2E tests
npm run cypress:open
```

## Key Components

### Dashboard
- **IncidentsList**: Real-time incident feed
- **SystemHealthChart**: Metrics visualization
- **MetricsCards**: Key performance indicators

### Incidents
- **IncidentDetailDialog**: Detailed incident view
- **AgentWorkDisplay**: ORPA loop visualization
- **ApprovalDialog**: Human-in-the-loop approval
- **CreateIncidentDialog**: Manual incident creation

### Layout
- **MainLayout**: Application shell
- **Sidebar**: Navigation menu

## API Integration

The frontend communicates with the backend via REST API:

```typescript
// Example API call
import { apiService } from '@/services/apiService';

// Fetch incidents
const incidents = await apiService.getIncidents();

// Get incident details
const incident = await apiService.getIncident(incidentId);

// Create incident
const newIncident = await apiService.createIncident({
  title: 'High CPU Alert',
  severity: 'HIGH',
  source: 'manual'
});
```

## Deployment

### Docker

```bash
# Build image
docker build -t resilibot-frontend .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-api.com resilibot-frontend
```

### AWS Amplify

1. Connect GitHub repository
2. Set build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Development

### Adding a New Component

```typescript
// src/components/example/ExampleComponent.tsx
import React from 'react';

interface ExampleProps {
  title: string;
}

export const ExampleComponent: React.FC<ExampleProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

### Adding a New Page

```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return <div>Example Page</div>;
}
```

### Adding API Endpoint

```typescript
// src/services/apiService.ts
export const apiService = {
  // ... existing methods
  
  async getExample() {
    const response = await axios.get(`${API_BASE_URL}/example`);
    return response.data;
  }
};
```

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
# Open Cypress
npm run cypress:open

# Run headless
npm run cypress:run
```

## Troubleshooting

### API Connection Issues

Check that:
1. Backend API is running
2. `NEXT_PUBLIC_API_URL` is set correctly
3. CORS is configured on API Gateway

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/hosnibelfeki/resilibot/issues)
- **Email**: belfkihosni@gmail.com
- **Documentation**: [Main README](../README.md)
