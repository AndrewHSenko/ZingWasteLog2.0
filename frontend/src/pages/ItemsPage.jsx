import Search from "../components/Search"
import Footer from "../components/Footer"

const ItemsPage = () => {
  return (
    <div>
      <Search />
      <Footer 
        link_one={"/"}
        link_one_text={"Go Back"}
        link_two={"/entries"}
        link_two_text={"See All Entries"}
      />
    </div>
  )
}

export default ItemsPage