import TrademarckResults from "@/src/shared/components/TrademarckResults";

export default async function MarcaResultPage(props: PageProps<'/marca/[slug]'>) {

  const { slug } = await props.params

  return (
        <TrademarckResults slug={ slug } />
  )
}
