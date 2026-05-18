// To use for CatScroll Navbar
import { createContext, useContext, useState, useRef, useEffect } from 'react'

const HeaderHeightContext = createContext(60) // 60px is rough estimate of normal header

export function HeaderHeightProvider({ children }) {
    const headerRef = useRef(null)
    const [headerHeight, setHeaderHeight] = useState(0)

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight)
        }
    }, [])

    return (
        <HeaderHeightContext.Provider value={{ headerHeight, headerRef }}>
            {children}
        </HeaderHeightContext.Provider>
    )
}

export function useHeaderHeight() {
    return useContext(HeaderHeightContext)
}