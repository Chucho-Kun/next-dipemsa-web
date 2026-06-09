import Image from "next/image";

export default function ProductComponent() {
  return (
    <div className="flex gap-4 py-4 border-b">
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
            <Image
            src="/fotos/1750.jpg"
            alt="Lija de agua"
            fill
            className="object-cover"
            sizes="366px"
            />
        </div>
        <div className="flex-1">
            <div className="flex justify-between">
            <div>
                <p className="font-medium">Lija de agua grano 280 de carburo de silicio</p>
                <p className="text-sm text-gray-500">1 Pieza</p>
                <p className="text-sm text-gray-500">TRUPER</p>
            </div>
            <div className="text-right">
                <p className="line-through text-gray-400">$100.00</p>
                <p className="font-bold text-lg">$89.00</p>
            </div>
            </div>
        </div>
    </div>
  )
}
