import { Link } from 'react-router'

import z_logo from '../assets/z_logo.png'

const Header = () => {

  return (
    <header className="sticky-top z-3 bg-primary">
            <nav className="navbar navbar-expand-lg w-100 py-0">
                <div className="container-fluid mx-4">
                  <div className="d-flex flex-column align-items-center justify-content-center ms-md-4">
                    <Link to="/" className="navbar-brand me-0 py-md-1 py-2" aria-current="page">
                          <img src={z_logo} alt="Zing logo" className="img-fluid logo"/>
                      </Link>
                  </div>
                  <button className="navbar-toggler ms-auto me-md-5" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
                      <span className="navbar-toggler-icon"></span>
                  </button>
                  <div className="collapse navbar-collapse w-100 pt-1" id="navbar">
                      <div className="navbar-nav gap-2 me-lg-5 gap-lg-5 d-flex justify-content-center ms-auto">
                          <Link to="/entries" className="btn" aria-current="page"><h5 className="lead">See all entries</h5></Link>
                          <Link to="/items" className="btn" aria-current="page"><h5 className="lead">See categories</h5></Link>
                          <Link to="/" className="btn"><h5 className="lead fw-bold">Home</h5></Link>
                      </div>
                  </div>
                </div>
            </nav>
        </header>
  )
}

export default Header