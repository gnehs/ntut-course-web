import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('../state/AppContext', () => ({
  useApp: () => ({
    dataset: { year: '112', sem: '1', department: 'main' },
    setDatasetDialogOpen: vi.fn(),
    getCourses: vi.fn().mockResolvedValue([]),
    getMyCourseIds: vi.fn(() => []),
  }),
}))

vi.mock('../lib/courseApi', () => ({
  fetchCalendar: vi.fn().mockResolvedValue([]),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

describe('HomePage', () => {
  it('renders the original home navigation cards', () => {
    render(<HomePage />)
    expect(screen.getByText('112 年上學期')).toBeInTheDocument()
    expect(screen.getByText('進階搜尋')).toBeInTheDocument()
    expect(screen.getByText('我的課程')).toBeInTheDocument()
    expect(screen.getByText('尋找空教室')).toBeInTheDocument()
  })
})
