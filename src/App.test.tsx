import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders Vite + React heading', () => {
    render(<App />)
    expect(screen.getByText('Vite + React')).toBeInTheDocument()
  })

  it('displays initial count of 0', () => {
    render(<App />)
    expect(screen.getByText(/count is 0/i)).toBeInTheDocument()
  })

  it('increments count when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /count is 0/i })
    await user.click(button)

    expect(screen.getByText(/count is 1/i)).toBeInTheDocument()
  })

  it('increments count multiple times', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /count is/i })
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(screen.getByText(/count is 3/i)).toBeInTheDocument()
  })
})
