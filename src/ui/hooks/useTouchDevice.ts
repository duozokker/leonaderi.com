import { useEffect, useState } from 'react'

export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')

    const update = (): void => {
      setIsTouch(query.matches || window.innerWidth < 900)
    }

    update()

    query.addEventListener('change', update)
    window.addEventListener('resize', update)

    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return isTouch
}
