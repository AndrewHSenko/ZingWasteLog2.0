import Header from "../components/Header.jsx"
import Instructions from "../components/Instructions.jsx"
import AddEntry from "../components/AddEntry.jsx"
import Footer from "../components/Footer.jsx"

const LandingPage = () => {
  return (
    <div>
      <Header />
      <Instructions />
      <AddEntry />
      <Footer 
        link_one={"entries"}
        link_one_text={"See All Entries"}
        link_two={"items"}
        link_two_text={"See/Add Categories"}
      />
    </div>
  )
}

export default LandingPage