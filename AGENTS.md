# AGENTS.md - Justin Law Personal Website

Project coding guidelines and rules for AI agents (Codex, Cursor, etc.) working on Justin Law's personal website.

Built with Next.js, React, TypeScript, and Tailwind CSS. Features an AI-powered chatbot using HuggingFace transformers.

**Follow these rules and patterns when generating, completing, or modifying code in this project.**

## Coding Rules and Guidelines

### Project Context and Constraints
- **Static Site**: This is a Next.js static export for GitHub Pages deployment
- **No Server-Side Features**: Avoid generating code that requires server-side functionality (API routes, server actions, etc.)
- **External Dependencies**: Minimize new dependencies; prefer existing stack when possible
- **Build Target**: All code must work with static export configuration

### Technology Stack and Patterns

#### Core Technologies
- **Next.js 15.3.3**: Static export configuration, pages router (not app router)
- **React 19**: Functional components with hooks, avoid class components
- **TypeScript 5**: Strict typing, prefer interfaces over types for objects
- **Tailwind CSS 3.4+**: Utility-first styling, responsive design patterns

#### Code Style and Conventions
```typescript
// Prefer functional components with explicit typing
interface ComponentProps {
  title: string;
  isVisible?: boolean;
}

const MyComponent: React.FC<ComponentProps> = ({ title, isVisible = true }) => {
  // Use descriptive variable names
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Prefer early returns for conditional rendering
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
  );
};
```

#### File Organization Patterns
```
src/
├── components/           # Reusable UI components
│   ├── ComponentName/   # Complex components get folders
│   │   ├── index.tsx    # Main component export
│   │   └── types.ts     # Component-specific types
│   └── SimpleComponent.tsx  # Simple components as files
├── pages/               # Next.js pages (pages router)
├── styles/              # Global styles
└── utils/               # Utility functions
```

## Development Workflow and Best Practices

### Prerequisites and Setup
- Node.js v20+ is required (currently using v20.19.4)
- npm v10+ is required (currently using v10.8.2)
- Install dependencies: `npm install` (takes ~2 minutes)

### Development Commands
```bash
# Development server (hot reload)
npm run dev              # Starts on http://localhost:3000

# Production build (static export)
npm run build           # Creates static files in out/

# Code quality
npm run lint            # ESLint validation

# End-to-end tests
npm run test            # Playwright E2E tests (requires `npx playwright install` once)
# Tests live in e2e/ and mock external APIs (GitHub, Google Drive, HuggingFace)

### Continuous Integration
- `.github/workflows/ci.yml` runs lint, build, and Playwright tests on PRs touching code or tests and on pushes to `main`.
- `.github/workflows/deploy.yml` publishes the site after the CI workflow succeeds on `main`.

# Local production testing
npm run build && npx serve@latest out
```

### Code Quality Standards

#### TypeScript Best Practices
- Always use explicit types for component props and state
- Prefer interfaces over types for object definitions
- Use generic types for reusable components
- Avoid `any` type; use `unknown` if necessary

```typescript
// Good: Explicit typing
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Good: Generic component with constraints
interface ListProps<T extends { id: string }> {
  items: T[];
  onSelect: (item: T) => void;
}
```

#### React Patterns
- Use functional components with hooks
- Implement proper error boundaries for components that may fail
- Prefer composition over inheritance
- Use React.memo for performance optimization when appropriate

```typescript
// Good: Memoized component with dependency array
const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }));
  }, [data]);
  
  return <div>{/* render logic */}</div>;
});
```

#### Tailwind CSS Patterns
- Use responsive design utilities (`sm:`, `md:`, `lg:`, `xl:`)
- Prefer Tailwind utilities over custom CSS
- Group related classes logically
- Use consistent spacing scale (4, 8, 12, 16, 24, 32...)

```tsx
// Good: Organized, responsive Tailwind classes
<div className="
  flex flex-col space-y-4 
  p-4 md:p-6 lg:p-8
  bg-white shadow-lg rounded-lg
  hover:shadow-xl transition-shadow duration-200
">
```

## Project-Specific Patterns

### Component Architecture
```typescript
// AI Chatbot Component Structure
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatBoxProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage: (message: string) => Promise<void>;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onToggle, onSendMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Component implementation...
};
```

### State Management
- Use React hooks for local state
- Prefer Context API for shared state across components
- Keep state as close to where it's used as possible

```typescript
// Global app context for shared state
interface AppContextType {
  theme: 'light' | 'dark';
  user: User | null;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### Error Handling
```typescript
// Component-level error handling
const SafeComponent: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Async operation
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    loadData();
  }, []);
  
  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }
  
  return <div>{/* Normal content */}</div>;
};
```

## External Integration Patterns

### HuggingFace Transformers Integration
```typescript
// Model loading with error handling
const useTransformersModel = (modelId: string) => {
  const [model, setModel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { pipeline } = await import('@huggingface/transformers');
        const loadedModel = await pipeline('text-generation', modelId);
        setModel(loadedModel);
      } catch (err) {
        setError('Failed to load AI model');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModel();
  }, [modelId]);
  
  return { model, isLoading, error };
};
```

### GitHub API Integration
```typescript
// GitHub API calls with proper error handling
interface GitHubProfile {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
}

const fetchGitHubProfile = async (username: string): Promise<GitHubProfile> => {
  const response = await fetch(`https://api.github.com/users/${username}`);
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  return response.json();
};
```

## Build and Deployment Considerations

### Static Export Configuration
```typescript
// next.config.ts - Key configurations
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/justinthelaw.github.io' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/justinthelaw.github.io' : '',
};
```

### Performance Optimizations
- Use dynamic imports for code splitting
- Implement lazy loading for heavy components
- Optimize images and assets for web
- Minimize bundle size with tree shaking

```typescript
// Lazy loading example
const LazyComponent = lazy(() => import('./HeavyComponent'));

const App: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
};
```

## Testing and Validation

### Manual Testing Checklist
After any code changes, verify:
1. `npm run lint` passes with only the known ModelSelector.tsx warning
2. `npm run build` completes successfully
3. `npm run test` passes
4. `npm run dev` starts development server
5. Main page loads with "Justin Law" header
6. Social media icons appear in footer
7. AI Chatbot button appears and functions
8. Resume/cover letter viewer displays

### Expected Development Behaviors
- **External APIs**: GitHub API and HuggingFace may fail in sandboxed environments
- **PDF Viewer**: May show CORS errors in development
- **AI Models**: May display "Model failed to load" due to external dependencies

## Common Issues and Solutions

### Build Issues
```typescript
// Webpack configuration issues
// Fix in next.config.ts:
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    sharp$: false,
    'onnxruntime-node$': false,
  };
  return config;
}
```

### TypeScript Errors
```typescript
// Module declaration for missing types
declare module 'some-package' {
  export interface SomeInterface {
    property: string;
  }
}
```

### Styling Issues
```css
/* Global styles in globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

## Performance Expectations

### Build Metrics
- **Dependency Install**: ~2 minutes (442 packages)
- **Production Build**: ~20 seconds
- **Development Startup**: ~2 seconds
- **Linting**: ~3 seconds

### Bundle Analysis
- **Main Page**: 7.42 kB + 106 kB First Load JS
- **Framework**: 57.5 kB (React/Next.js core)
- **Application**: 38.7 kB (custom code)
- **Total**: ~102 kB shared JavaScript

## Code Generation Prompts

When generating code for this project, always consider:
1. **Static Export Compatibility**: Will this work without a server?
2. **TypeScript Compliance**: Are all types properly defined?
3. **Performance Impact**: Does this add unnecessary bundle size?
4. **Responsive Design**: Will this work on mobile devices?
5. **Accessibility**: Are proper ARIA attributes included?
6. **Error Handling**: What happens when external services fail?

Generate code that follows these patterns and maintains consistency with the existing codebase architecture and styling approaches.
