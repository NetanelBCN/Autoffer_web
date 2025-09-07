# Autoffer Web — Frontend

A comprehensive **React + TypeScript** frontend for an aluminum construction management platform, featuring real-time messaging, project management, pricing tools, and PDF report generation. Built with **Vite**, **Tailwind CSS v4**, and a complete design system.

> ✨ **Autoffer** is a B2B platform connecting aluminum suppliers with construction professionals, enabling quotation management, project collaboration, and automated pricing workflows.

---

## 🏗️ What is Autoffer?

**Autoffer Web** is the frontend for a comprehensive aluminum construction platform that facilitates:

- **Supplier-Customer Relationships**: Direct communication between aluminum suppliers and contractors
- **Project Management**: End-to-end tracking of aluminum construction projects
- **Real-time Quotation System**: Automated pricing with PDF generation and approval workflows
- **Inventory Catalog**: Searchable product database with detailed specifications
- **Business Intelligence**: Profit/loss analysis, glazing reports, and time-period analytics

The platform serves **factory users** (aluminum suppliers) and **customer users** (contractors/builders) with role-based access and specialized workflows.

---

## 🚀 Tech Stack & Architecture

### **Core Technologies**
- **Build System**: Vite 6.2.0 + React 19 + TypeScript 5.7
- **Styling**: Tailwind CSS v4 with design tokens and utility-first approach
- **UI Framework**: shadcn/ui components built on Radix primitives
- **Routing**: React Router v7.5 with protected routes and lazy loading
- **Icons**: Lucide React (1000+ consistent SVG icons)

### **State Management & Data**
- **Server State**: TanStack Query v5.72 for caching, synchronization, and background updates
- **Local State**: React Context for cart (`CartContext`) and chat (`ChatContext`)
- **WebSocket**: RSocket client for real-time messaging with Spring Boot backend
- **Form Handling**: Controlled components with TypeScript validation

### **Real-time Communication**
- **WebSocket Service**: `@rsocket/websocket-client` for persistent connections
- **Chat System**: Multi-window chat interface with unread message tracking
- **Live Updates**: Project status changes, quote approvals, inventory updates

### **PDF & Export Features**
- **PDF Generation**: jsPDF + html2canvas for client-side PDF creation
- **Report Types**: Profit/Loss, Glazing Analysis, Time Period, Manual Quotes
- **Print Optimization**: CSS print media queries and layout-specific styling

### **Testing & Quality**
- **Unit Testing**: Vitest + Testing Library with JSDOM environment
- **Component Testing**: React Testing Library for user interaction testing
- **Linting**: ESLint 9 + TypeScript ESLint with React-specific rules
- **Type Safety**: Strict TypeScript configuration with path mapping

---

## 📁 Detailed Project Structure

```
autofferWeb/
├── 📄 Configuration Files
│   ├── package.json                 # Dependencies & scripts
│   ├── vite.config.ts              # Vite build configuration
│   ├── tsconfig.json               # TypeScript compiler options
│   ├── eslint.config.js            # ESLint rules & plugins
│   └── components.json             # shadcn/ui configuration
│
├── 🌐 Entry Points
│   ├── index.html                  # SPA root template
│   └── src/
│       ├── main.tsx                # React app bootstrap
│       ├── App.tsx                 # Router setup & providers
│       └── index.css               # Tailwind imports & CSS variables
│
├── 📱 Pages (Route Components)
│   └── src/pages/
│       ├── Index.tsx               # Landing/login page
│       ├── Home.tsx                # Main dashboard
│       └── NotFound.tsx            # 404 error page
│
├── 🧩 Components
│   └── src/components/
│       ├── 🔐 Authentication
│       │   ├── LoginForm.tsx       # User authentication form
│       │   ├── LoginBanner.tsx     # Marketing banner
│       │   ├── RegisterDialog.tsx  # New user registration
│       │   └── ProtectedRoute.tsx  # Route access control
│       │
│       ├── 🧭 Navigation & Layout
│       │   ├── NavBar.tsx          # Main navigation bar
│       │   └── WaveBackground.tsx  # Animated background component
│       │
│       ├── 🛒 E-commerce & Catalog
│       │   ├── Catalog.tsx         # Product browsing interface
│       │   ├── ProductDetailsDialog.tsx  # Product information modal
│       │   └── CartDialog.tsx      # Shopping cart management
│       │
│       ├── 💬 Communication
│       │   ├── Chat.tsx            # Chat system container
│       │   ├── ChatWindow.tsx      # Individual chat interface
│       │   ├── ChatIcon.tsx        # Chat notification indicator
│       │   └── CustomerList.tsx    # Available chat contacts
│       │
│       ├── 👤 User Management
│       │   ├── MyAccount.tsx       # User profile management
│       │   ├── MyProjects.tsx      # User's project dashboard
│       │   └── FactorEditDialog.tsx # Profile editing modal
│       │
│       ├── 📊 Reports & Analytics
│       │   ├── ProfitLossReportDialog.tsx    # Financial analysis
│       │   ├── GlazingReportDialog.tsx       # Glass specification reports
│       │   ├── TimePeriodReportDialog.tsx    # Date-range analytics
│       │   └── ManualPriceOfferDialog.tsx    # Custom quote generation
│       │
│       ├── 🏢 Business Operations
│       │   ├── Operations.tsx      # Operations dashboard
│       │   ├── AluminumProjectShowcase.tsx  # Project gallery
│       │   └── SubscriptionAds.tsx # Marketing content
│       │
│       └── 🎨 UI Components (shadcn/ui)
│           ├── button.tsx          # Interactive buttons
│           ├── dialog.tsx          # Modal dialogs
│           ├── card.tsx            # Content containers
│           ├── input.tsx           # Form inputs
│           ├── select.tsx          # Dropdown selectors
│           ├── toast.tsx           # Notification system
│           ├── carousel.tsx        # Image/content carousels
│           └── ... (20+ more components)
│
├── 🔄 State Management
│   └── src/context/
│       ├── CartContext.tsx         # Shopping cart state
│       └── ChatContext.tsx         # Chat windows state
│
├── 🛠️ Services & Utilities
│   ├── src/services/
│   │   └── websocketService.ts     # RSocket WebSocket client
│   ├── src/lib/
│   │   └── utils.ts                # Utility functions (clsx, etc.)
│   └── src/hooks/
│       ├── use-mobile.tsx          # Mobile detection hook
│       └── use-toast.ts            # Toast notification hook
│
├── 🧪 Testing
│   └── src/components/__tests__/
│       ├── LoginForm.simple.test.tsx
│       ├── RegisterDialog.simple.test.tsx
│       ├── ManualPriceOffer.simple.test.tsx
│       ├── TimePeriodReport.test.tsx
│       └── ReportGeneration.test.tsx
│
└── 🖼️ Static Assets
    ├── public/vite.svg             # Vite logo
    └── src/assets/
        ├── react.svg               # React logo
        └── userpic.jpeg            # Default user avatar
```

---

## 🏃‍♂️ Getting Started

### **Prerequisites**
- **Node.js 20+** (LTS recommended)
- **npm 10+** or **yarn 1.22+**
- **Modern browser** with ES2022 support

### **Development Setup**

1. **Clone and Install**
```bash
git clone <repository-url>
cd autofferWeb
npm install
```

2. **Start Development Server**
```bash
npm run dev
```
🌐 Opens at **http://localhost:5173** with hot module replacement

3. **Run Tests (Optional)**
```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # Interactive UI
```

4. **Production Build**
```bash
npm run build         # TypeScript compilation + Vite build
npm run preview       # Preview built assets locally
```

### **Environment Configuration**
No environment variables required for basic functionality. The frontend connects to the backend via WebSocket on the default development setup.

---

## 🎯 Core Features & User Flows

### **🔐 Authentication System**
- **Landing Page** (`src/pages/Index.tsx`): Marketing banner with login form
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Types**: Factory (supplier) vs Customer (contractor) role-based access
- **Registration Flow**: New user onboarding with form validation

### **🏠 Dashboard Experience** 
- **Welcome Hero**: Personalized greeting with quick stats
- **Navigation Bar**: Home, Catalog, Operations, My Account, My Projects
- **Spotlight Carousel**: Featured products and announcements
- **Quick Actions**: Direct access to common workflows

### **🛍️ Product Catalog & Shopping**
- **Filterable Grid**: Search by supplier, product type, specifications
- **Product Details Modal**: High-res images, technical specs, pricing
- **Smart Cart**: Add/remove items with running totals and validation
- **Persistent State**: Cart contents maintained across navigation

### **💼 Project Management**
- **My Projects**: Overview of active and completed projects
- **Project Details**: Timeline, deliverables, communication history
- **Status Tracking**: Real-time updates on project milestones
- **Collaboration Tools**: Direct messaging with suppliers

### **📊 Advanced Reporting**
- **Profit/Loss Analysis**: Revenue vs costs with visual charts
- **Glazing Reports**: Glass specifications and installation requirements  
- **Time Period Reports**: Date-range performance analytics
- **Manual Quotes**: Custom pricing with PDF export
- **Print-Optimized Layouts**: Professional formatting for client delivery

### **💬 Real-time Communication**
- **Multi-window Chat**: Concurrent conversations with different suppliers
- **Unread Indicators**: Visual notifications for new messages
- **Customer List**: Browse and initiate conversations
- **Persistent Connections**: WebSocket-based real-time messaging

### **📱 Responsive Design**
- **Mobile-First**: Touch-friendly interface for tablets and phones
- **Desktop Optimization**: Multi-column layouts for large screens
- **Progressive Enhancement**: Graceful degradation for older browsers

---

## 🎨 Design System & Styling

### **Tailwind CSS v4 Architecture**
```css
/* src/index.css - Layer imports */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);

/* CSS Custom Properties for theming */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... 20+ more design tokens */
}
```

### **Component Design Philosophy**
- **Accessibility-First**: ARIA labels, keyboard navigation, screen reader support
- **Radix Primitives**: Unstyled, accessible components as foundation
- **Consistent Spacing**: 4px grid system with Tailwind spacing scale
- **Color System**: Semantic color tokens (primary, secondary, destructive, etc.)
- **Typography Scale**: Consistent font sizing with line-height ratios

### **shadcn/ui Integration**
- **30+ Pre-built Components**: Buttons, dialogs, forms, data displays
- **Customizable**: Easy theming via CSS custom properties
- **Copy-Paste Friendly**: Components can be copied and modified
- **TypeScript Native**: Full type safety and IntelliSense support

---

## 📚 Development Guidelines

### **Code Organization Principles**
- **Feature-Based Structure**: Related components grouped together
- **Separation of Concerns**: UI components separate from business logic
- **Path Aliases**: Use `@/` for clean imports (`@/components/ui/button`)
- **Consistent Naming**: PascalCase for components, camelCase for utilities

### **TypeScript Best Practices**
- **Strict Mode**: Enabled for maximum type safety
- **Interface Over Type**: Prefer interfaces for object shapes
- **Generic Components**: Reusable components with type parameters
- **Props Validation**: Strong typing for all component props

### **Testing Strategy**
- **Unit Tests**: Individual component behavior and utilities
- **Integration Tests**: User workflows and component interactions  
- **Accessibility Tests**: Screen reader compatibility and keyboard navigation
- **Visual Regression**: Consistent UI across different screen sizes

### **Performance Optimization**
- **Lazy Loading**: Route-based code splitting with React.lazy()
- **Bundle Analysis**: Vite bundle analyzer for identifying large dependencies
- **Image Optimization**: Proper sizing and lazy loading for assets
- **Memoization**: React.memo and useMemo for expensive computations

---

## 🛠️ Available Scripts

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Start development server with HMR | Daily development |
| `npm run build` | TypeScript compilation + production build | Deployment preparation |
| `npm run preview` | Serve built assets locally | Testing production builds |
| `npm run lint` | Run ESLint with auto-fix | Code quality checks |
| `npm run test` | Run tests in watch mode | Test-driven development |
| `npm run test:run` | Single test run with coverage | CI/CD pipelines |
| `npm run test:ui` | Interactive test runner | Debugging test failures |

---

## 🗂️ Key File Reference

### **Authentication & Routing**
- `src/App.tsx` - Router configuration and protected routes
- `src/components/ProtectedRoute.tsx` - Authentication guard
- `src/pages/Index.tsx` - Landing page with login
- `src/components/LoginForm.tsx` - User authentication form

### **Dashboard & Navigation**
- `src/pages/Home.tsx` - Main dashboard layout
- `src/components/NavBar.tsx` - Primary navigation
- `src/components/AluminumProjectShowcase.tsx` - Featured content

### **E-commerce Flow**
- `src/components/Catalog.tsx` - Product browsing interface
- `src/components/ProductDetailsDialog.tsx` - Product information modal
- `src/components/CartDialog.tsx` - Shopping cart management
- `src/context/CartContext.tsx` - Cart state management

### **Communication System**
- `src/components/Chat.tsx` - Chat system container
- `src/context/ChatContext.tsx` - Chat state management
- `src/services/websocketService.ts` - RSocket WebSocket client

### **Business Operations**
- `src/components/Operations.tsx` - Operations dashboard
- `src/components/*ReportDialog.tsx` - Report generation modals
- `src/components/ManualPriceOfferDialog.tsx` - Custom quotation tool

### **UI Foundation**
- `src/components/ui/` - 30+ reusable UI components
- `src/index.css` - Design tokens and Tailwind configuration
- `src/lib/utils.ts` - Utility functions and helpers

---

## 🔧 Backend Integration

This frontend works with a **Spring Boot + Kotlin** backend that provides:

- **RSocket WebSocket API**: Real-time messaging and live updates
- **RESTful Endpoints**: CRUD operations for users, projects, products
- **Authentication Service**: JWT-based session management
- **PDF Generation**: Server-side report compilation
- **File Storage**: Image and document management

**Backend Location**: `messaging-server-main/` (Spring Boot application)
**WebSocket Endpoint**: Configured in `src/services/websocketService.ts`

---

## 🚀 Deployment & Production

### **Build Optimization**
- **Tree Shaking**: Automatic removal of unused code
- **Code Splitting**: Route-based and component-based splitting
- **Asset Optimization**: Image compression and lazy loading
- **CSS Purging**: Unused Tailwind classes removed automatically

### **Production Checklist**
- [ ] Run `npm run build` successfully
- [ ] Test all routes with `npm run preview`
- [ ] Verify environment variables are set
- [ ] Check bundle size with build analyzer
- [ ] Test WebSocket connections to production backend
- [ ] Validate PDF generation functionality

---

## 🤝 Contributing

### **Development Workflow**
1. **Create Feature Branch**: `git checkout -b feature/new-component`
2. **Follow Conventions**: Use existing patterns and naming
3. **Write Tests**: Add tests for new functionality
4. **Run Quality Checks**: `npm run lint` before committing
5. **Commit Format**: `feat(component): add new functionality`
6. **Open Pull Request**: Include description and screenshots

### **Code Review Guidelines**
- **Accessibility**: Ensure ARIA labels and keyboard navigation
- **Performance**: Check for unnecessary re-renders and large bundles
- **Type Safety**: Verify strong TypeScript typing
- **Responsive Design**: Test on multiple screen sizes
- **Browser Compatibility**: Verify modern browser support

---

## 📖 Additional Resources

- **Vite Documentation**: https://vitejs.dev/
- **React Router v7**: https://reactrouter.com/
- **Tailwind CSS v4**: https://tailwindcss.com/
- **shadcn/ui Components**: https://ui.shadcn.com/
- **Radix UI Primitives**: https://www.radix-ui.com/
- **TanStack Query**: https://tanstack.com/query/
- **Vitest Testing**: https://vitest.dev/

---

**© 2025 Autoffer Web — Modern B2B Aluminum Construction Platform**
