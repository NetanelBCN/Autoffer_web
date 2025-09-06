import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from '../LoginForm'
import { websocketService } from '@/services/websocketService'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
vi.mock('@/services/websocketService', () => ({
  websocketService: {
    loginUser: vi.fn(),
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}))

vi.mock('@/context/ChatContext', () => ({
  useChat: () => ({
    initializeUserChats: vi.fn(),
  }),
}))

const mockToast = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }
})

describe('LoginForm - Complete Login Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useToast as Mock).mockReturnValue({ toast: mockToast })
  })

  it('should complete full login flow: enter email and password, validate with server, match credentials, and navigate to home', async () => {
    // Mock successful login response
    const mockUser = { 
      id: '123', 
      email: 'test@factory.com', 
      profileType: 'FACTORY' 
    }
    ;(websocketService.loginUser as Mock).mockResolvedValue(mockUser)
    
    // Mock localStorage
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    )

    // Step 1: User enters email
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@factory.com')
    expect(emailInput).toHaveValue('test@factory.com')

    // Step 2: User enters password  
    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'password123')
    expect(passwordInput).toHaveValue('password123')

    // Step 3: User submits form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // Step 4: Validation with the server
    expect(websocketService.loginUser).toHaveBeenCalledWith({
      email: 'test@factory.com',
      password: 'password123',
    })

    // Step 5: Match between email and password of existing customer
    await waitFor(() => {
      // User data stored in localStorage
      expect(setItemSpy).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
      
      // Navigate to home screen
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
    })
  })
})