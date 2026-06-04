import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from './AppContext'

vi.mock('../lib/courseApi', () => ({
  fetchCourse: vi.fn(),
  fetchYearData: vi.fn().mockResolvedValue({ 112: [1] }),
}))

function DatasetProbe() {
  const { dataset, setDataset } = useApp()

  return (
    <button type="button" onClick={() => setDataset({ department: '進修部' })}>
      {dataset.year}-{dataset.sem}-{dataset.department}
    </button>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('data-year', '112')
    localStorage.setItem('data-sem', '1')
    localStorage.setItem('data-department', 'main')
  })

  it('preserves the current year and semester when partially updating the dataset', () => {
    render(
      <AppProvider>
        <DatasetProbe />
      </AppProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: '112-1-main' }))

    expect(screen.getByRole('button', { name: '112-1-進修部' })).toBeInTheDocument()
    expect(localStorage.getItem('data-year')).toBe('112')
    expect(localStorage.getItem('data-sem')).toBe('1')
    expect(localStorage.getItem('data-department')).toBe('進修部')
  })
})
