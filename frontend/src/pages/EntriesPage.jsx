import Search from "../components/Search"
import Footer from "../components/Footer"

const EntriesPage = () => {
  return (
    <div>
      <Search />
      <Footer 
        link_one={"/"}
        link_one_text={"Go Back"}
        link_two={"/items"}
        link_two_text={"See/Add Categories"}
      />
    </div>
  )
}

export default EntriesPage