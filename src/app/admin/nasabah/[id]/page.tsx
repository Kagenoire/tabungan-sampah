import { NasabahDetailClient } from "./NasabahDetailClient";

export default async function NasabahDetailPage(props: PageProps<"/admin/nasabah/[id]">) {
  const { id } = await props.params;
  return <NasabahDetailClient id={id} />;
}
