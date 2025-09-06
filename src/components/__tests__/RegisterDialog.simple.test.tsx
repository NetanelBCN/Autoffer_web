import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import RegisterDialog from '../RegisterDialog'
import { websocketService } from '@/services/websocketService'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
vi.mock('@/services/websocketService', () => ({
  websocketService: {
    registerUser: vi.fn(),
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
  }
})

describe('RegisterDialog - Complete Registration Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useToast as Mock).mockReturnValue({ toast: mockToast })
  })

  it('should complete full registration flow: fill all required fields, create account, and redirect to home', async () => {
    // Mock successful registration response
    const mockUser = { 
      id: '123', 
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@factory.com', 
      profileType: 'FACTORY' 
    }
    ;(websocketService.registerUser as Mock).mockResolvedValue(mockUser)
    
    // Mock localStorage and dialog close
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const mockOnClose = vi.fn()
    
    render(
      <BrowserRouter>
        <RegisterDialog open={true} onClose={mockOnClose} />
      </BrowserRouter>
    )

    // Step 1: User fills in First Name
    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.type(firstNameInput, 'John')
    expect(firstNameInput).toHaveValue('John')

    // Step 2: User fills in Last Name
    const lastNameInput = screen.getByLabelText(/last name/i)
    await user.type(lastNameInput, 'Doe')
    expect(lastNameInput).toHaveValue('Doe')

    // Step 3: User fills in Unique Email Address
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'john.doe@factory.com')
    expect(emailInput).toHaveValue('john.doe@factory.com')

    // Step 4: User fills in Password
    const passwordInput = screen.getByLabelText(/^password/i)
    await user.type(passwordInput, 'password123')
    expect(passwordInput).toHaveValue('password123')

    // Step 5: User fills in Confirm Password
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    await user.type(confirmPasswordInput, 'password123')
    expect(confirmPasswordInput).toHaveValue('password123')

    // Step 6: User fills in Phone Number
    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '+1 (555) 123-4567')
    expect(phoneInput).toHaveValue('+1 (555) 123-4567')

    // Step 7: User fills in Address
    const addressInput = document.getElementById('address')
    if (addressInput) {
      await user.type(addressInput, '123 Factory St, Industrial City')
      expect(addressInput).toHaveValue('123 Factory St, Industrial City')
    }

    // Step 8: Account Type is pre-selected as "FACTORY" (default)
    const selectTrigger = screen.getByRole('combobox')
    expect(selectTrigger).toHaveTextContent('Factory')

    // Step 9: User clicks Create Account button
    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    await user.click(createAccountButton)

    // Step 10: A new account is created successfully
    expect(websocketService.registerUser).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@factory.com',
      password: 'password123',
      phoneNumber: '+1 (555) 123-4567',
      address: '123 Factory St, Industrial City',
      profileType: 'FACTORY',
    })

    // Step 11: User is redirected to the home screen
    await waitFor(() => {
      // Success toast shown
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'success',
        title: 'Registration Successful!',
        description: 'Welcome John! You have been registered and logged in.',
      })
      
      // User data stored in localStorage
      expect(setItemSpy).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
      
      // Dialog is closed
      expect(mockOnClose).toHaveBeenCalled()
      
      // Navigate to home screen
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
    })
  })
})