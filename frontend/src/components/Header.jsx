import { useHeaderHeight } from '../HeaderHeightContext.jsx'
import { Link } from 'react-router'

import z_logo from '../assets/z_logo.png'

const Header = () => {
  const { headerRef } = useHeaderHeight()

  return (
    <header ref={headerRef} className="sticky-top z-2 bg-primary">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mx-3 flex-nowrap w-100">
                <Link to="/" className="navbar-brand" aria-current="page">
                    <img src={z_logo} alt="Eatery logo" className="w-75"/>
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
            </div>
            <div className="collapse navbar-collapse w-100 pt-2 justify-content-end pe-lg-5 me-lg-5" id="navbar">
                <div className="navbar-nav gap-2 gap-lg-5 flex-row">
                    <Link to="/" className="btn border-1 border-dark mx-auto d-lg-block d-none" aria-current="page"><p className="fs-1">Home</p></Link>
                    <Link to="entries" className="btn border-1 border-dark mx-auto">All Entries</Link>
                    <Link to="/" className="btn border-1 border-dark mx-auto d-lg-none" aria-current="page">Home</Link>
                    <Link to="items" className="btn border-1 border-dark mx-auto">All Items</Link>
                </div>
            </div>
        </div>
      </nav>
    </header>
  )
}

export default Header