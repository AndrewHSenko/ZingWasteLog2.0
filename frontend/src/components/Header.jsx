import { Link } from 'react-router'

const Header = () => {
  return (
    <header>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container">
            <Link class="navbar-brand active fs-1" to="/">Waste Log</Link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarOtherPages" aria-controls="navbarOtherPages" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarOtherPages">
              <div class="navbar-nav">
                <a class="nav-link bg-red-400" href="#">Features</a>
                <a class="nav-link" href="#">Pricing</a>
                <a class="nav-link disabled" aria-disabled="true">Disabled</a>
              </div>
            </div>
          </div>
        </nav>
    </header>
  )
}

export default Header