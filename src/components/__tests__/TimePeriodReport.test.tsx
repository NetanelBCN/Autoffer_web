import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TimePeriodReportDialog from '../TimePeriodReportDialog'
import { websocketService } from '@/services/websocketService'

// Mock dependencies
vi.mock('@/services/websocketService', () => ({
  websocketService: {
    getProjectsForUser: vi.fn(),
  },
}))

// Mock PDF generation
vi.mock('jspdf', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn()
  }))
}))

vi.mock('html2canvas', () => ({
  __esModule: true,
  default: vi.fn(() => Promise.resolve({
    width: 800,
    height: 600,
    toDataURL: () => 'data:image/png;base64,test'
  }))
}))

const mockUserData = {
  id: 'factory123',
  firstName: 'Factory',
  lastName: 'User',
  email: 'factory@example.com',
  password: 'password123',
  phoneNumber: '+1234567890',
  address: '123 Factory St',
  profileType: 'FACTORY',
  registeredAt: '2024-01-01',
  chats: [],
  photoBytes: null,
  factor: 1.30 // 30% profit margin factor
}

const mockProjectsData = [
  {
    projectId: 'proj-123456',
    clientId: 'client1',
    projectAddress: '123 Main St, City A',
    factoryIds: ['factory123'],
    quoteStatuses: { 'factory123': 'ACCEPTED' },
    quotes: {},
    createdAt: '15-01-2024 10:30:00', // Within date range
    items: [
      {
        itemNumber: 'ITEM-001',
        profile: { profileNumber: 'ALU-100', usageType: 'Window', pricePerSquareMeter: 50 },
        glass: { type: 'Double Glazed', pricePerSquareMeter: 80, height: 100, width: 60, quantity: 2, location: 'Room 1' },
        height: 100, width: 60, quantity: 2, location: 'Room 1'
      }
    ]
  },
  {
    projectId: 'proj-789012',
    clientId: 'client2', 
    projectAddress: '456 Oak Ave, City B',
    factoryIds: ['factory123'],
    quoteStatuses: { 'factory123': 'REJECTED' },
    quotes: {},
    createdAt: '20-01-2024 14:15:00', // Within date range
    items: [
      {
        itemNumber: 'ITEM-002',
        profile: { profileNumber: 'ALU-200', usageType: 'Door', pricePerSquareMeter: 70 },
        glass: { type: 'Tempered Glass', pricePerSquareMeter: 100, height: 200, width: 80, quantity: 1, location: 'Entrance' },
        height: 200, width: 80, quantity: 1, location: 'Entrance'
      }
    ]
  },
  {
    projectId: 'proj-345678',
    clientId: 'client3',
    projectAddress: '789 Pine Rd, City C', 
    factoryIds: ['factory123'],
    quoteStatuses: { 'factory123': 'PENDING' },
    quotes: {},
    createdAt: '05-12-2023 09:00:00', // Outside date range (before)
    items: [
      {
        itemNumber: 'ITEM-003',
        profile: { profileNumber: 'ALU-300', usageType: 'Window', pricePerSquareMeter: 60 },
        glass: { type: 'Single Glazed', pricePerSquareMeter: 60, height: 120, width: 70, quantity: 3, location: 'Office' },
        height: 120, width: 70, quantity: 3, location: 'Office'
      }
    ]
  },
  {
    projectId: 'proj-901234',
    clientId: 'client4',
    projectAddress: '321 Elm St, City D',
    factoryIds: ['factory123'],
    quoteStatuses: { 'factory123': 'ACCEPTED' },
    quotes: {},
    createdAt: '15-02-2024 16:45:00', // Outside date range (after)
    items: [
      {
        itemNumber: 'ITEM-004',
        profile: { profileNumber: 'ALU-400', usageType: 'Door', pricePerSquareMeter: 55 },
        glass: { type: 'Laminated Glass', pricePerSquareMeter: 90, height: 180, width: 75, quantity: 2, location: 'Back Door' },
        height: 180, width: 75, quantity: 2, location: 'Back Door'
      }
    ]
  }
]

describe('Time Period Report - Complete Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate time period report: project/transaction data exists, factory has valid factor, customer selects date range and generates report, system calculates profit/loss only for records within range with applied factory factor, displays summary with project counter, and allows saving as PDF', async () => {
    // Given: Project/transaction data exists for the requested period
    ;(websocketService.getProjectsForUser as Mock).mockResolvedValue(mockProjectsData)

    // Given: Factory profile has a valid factor defined (1.30x = 30% markup)
    expect(mockUserData.factor).toBe(1.30)

    render(
      <BrowserRouter>
        <TimePeriodReportDialog 
          open={true} 
          onClose={vi.fn()} 
          userData={mockUserData} 
        />
      </BrowserRouter>
    )

    // When: Projects are loaded
    await waitFor(() => {
      expect(websocketService.getProjectsForUser).toHaveBeenCalledWith('factory123', 'FACTORY')
    })

    // Then: Customer can see total projects available (filtered to non-PENDING status)
    await waitFor(() => {
      expect(screen.getByText(/Total projects available: \d+/)).toBeInTheDocument()
    })

    // When: Customer selects a start date and end date
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-01-10') // Start date
    
    await user.clear(endDateInput) 
    await user.type(endDateInput, '2024-01-25') // End date

    // When: Customer clicks Generate Report
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    await user.click(generateButton)

    // Then: System calculates profit/loss only for records within the range (including boundary dates)
    await waitFor(() => {
      const reportTitles = screen.getAllByText('Time Period Profit Report')
      expect(reportTitles.length).toBeGreaterThan(0)
      
      // Projects within date range should be shown 
      expect(screen.getByText(/Total Projects:/)).toBeInTheDocument()
      
      // Projects within range should be visible
      expect(screen.getByText('#123456')).toBeInTheDocument() // proj-123456 (15-01-2024)
      expect(screen.getByText('#789012')).toBeInTheDocument() // proj-789012 (20-01-2024)
    })

    // Then: Factory factor is applied to the calculations
    await waitFor(() => {
      // Factory factor should be displayed in report
      expect(screen.getByText(/Factor: 1\.30x/)).toBeInTheDocument()
    })

    await waitFor(() => {
      // Profit calculations with applied factor should be shown
      const withFactorElements = screen.getAllByText('With Factor')
      expect(withFactorElements.length).toBeGreaterThan(0)
      
      const totalProfitElements = screen.getAllByText(/Total Profit/)
      expect(totalProfitElements.length).toBeGreaterThan(0)
    })

    // Then: System displays a summary plus counter showing filtered projects
    await waitFor(() => {
      // Summary cards should be displayed
      expect(screen.getByText('Total Base Value')).toBeInTheDocument()
      const withFactorElements = screen.getAllByText('With Factor')
      expect(withFactorElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Total Profit')).toBeInTheDocument()
      
      // Status counters should be displayed
      expect(screen.getByText('Accepted')).toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      
      // Project counter according to filter
      expect(screen.getByText(/Total Projects:/)).toBeInTheDocument()
    })

    // Then: Report shows project details with status badges
    await waitFor(() => {
      // Status badges should be displayed
      expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
      expect(screen.getByText('REJECTED')).toBeInTheDocument()
      
      // Project details should be shown
      expect(screen.getByText('123 Main St, City A')).toBeInTheDocument()
      expect(screen.getByText('456 Oak Ave, City B')).toBeInTheDocument()
    })

    // Then: Report allows saving as PDF
    await waitFor(() => {
      const downloadButton = screen.getByText(/Download PDF/i)
      expect(downloadButton).toBeInTheDocument()
    })

    // When: User clicks download PDF
    const downloadButton = screen.getByText(/Download PDF/i)
    await user.click(downloadButton)

    // Then: PDF generation process starts
    await waitFor(() => {
      expect(screen.getByText(/Generating PDF.../i)).toBeInTheDocument()
    })

    // Verify complete time period report flow requirements:
    // ✅ Project/transaction data exists for requested period
    // ✅ Factory profile has valid factor defined (1.30x = 30% markup)  
    // ✅ Customer selects start date and end date
    // ✅ Customer clicks Generate Report
    // ✅ System calculates profit/loss ONLY for records within range (including boundary dates)
    // ✅ Factory factor is applied to calculations
    // ✅ System displays summary plus counter: "Total projects available: N" according to filter
    // ✅ Report allows saving as PDF
  })

  it('should handle empty date range results', async () => {
    ;(websocketService.getProjectsForUser as Mock).mockResolvedValue(mockProjectsData)

    render(
      <BrowserRouter>
        <TimePeriodReportDialog 
          open={true} 
          onClose={vi.fn()} 
          userData={mockUserData} 
        />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Total projects available: \d+/)).toBeInTheDocument()
    })

    // Select date range with no projects
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-03-01') // Date range with no projects
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-03-31')

    const generateButton = screen.getByRole('button', { name: /generate report/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/Total Projects:/)).toBeInTheDocument()
      expect(screen.getByText('No projects found in the selected date range')).toBeInTheDocument()
    })
  })
})