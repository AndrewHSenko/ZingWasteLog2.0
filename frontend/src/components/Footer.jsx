import { Link } from "react-router"

const Footer = ({link_one, link_one_text, link_two, link_two_text}) => {
  return (
    <footer>
        <button type="button" class="btn btn-info">
            <Link to={link_one}>{link_one_text}</Link>
        </button>
        <button type="button" class="btn btn-info">
            <Link to={link_two}>{link_two_text}</Link>
        </button>
    </ footer>
  )
}

export default Footer