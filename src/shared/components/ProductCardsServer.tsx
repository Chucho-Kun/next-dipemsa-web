import { getProductById } from "../db/queries";
import { ResultadosType } from "../db/resultados";
import ProductCard from "./ProductCard";

type Props = {
    id: string
}

export default async function ProductCardsServer({ id }: Props) {

    const producto = await getProductById( id )

  return (
    <ProductCard producto={producto} />
  )
}
