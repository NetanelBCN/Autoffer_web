import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import ProductDetailsDialog from "./ProductDetailsDialog";

const products = [
  {
    id: 1,
    name: "Aluminum Sheet 2mm",
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=600&q=80",
    price: 49.99,
    short: "High quality 2mm aluminum sheet.",
    details: "Our 2mm aluminum sheet is corrosion resistant and suitable for a wide range of construction applications. Dimensions: 100x100cm. Alloy: 6061-T6.",
    supplier: "AluCo Industries"
  },
  {
    id: 2,
    name: "Aluminum Round Tube",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80",
    price: 19.49,
    short: "Sturdy round tube, 30mm diameter.",
    details: "Lightweight but strong. Ideal for structural work or crafting. Diameter: 30mm. Length: 2m. Alloy: 6063.",
    supplier: "Tubex Metals"
  },
  {
    id: 3,
    name: "Aluminum Angle Bar",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80",
    price: 13.29,
    short: "Angle bar, 40x40mm.",
    details: "Versatile for framing and supports. Size: 40x40mm, thickness: 3mm, length: 1.5m. Alloy: 6060.",
    supplier: "FramePro Supplies"
  }
];

interface CatalogProps {
  selectedSupplier?: string | null;
  searchTerm?: string;
}

const Catalog = ({ selectedSupplier, searchTerm = "" }: CatalogProps) => {
  const [activeProduct, setActiveProduct] = useState<typeof products[0] | null>(null);

  const filteredProducts = products
    .filter((product) => 
      (!selectedSupplier || product.supplier === selectedSupplier)
    )
    .filter((product) => 
      searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700">No products found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition"
              onClick={() => setActiveProduct(product)}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded-t-lg"
                loading="lazy"
              />
              <CardHeader>
                <CardTitle className="text-2xl font-semibold leading-tight break-words whitespace-normal">{product.name}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</CardDescription>
                <div className="text-sm mt-1 text-gray-500">Supplier: {product.supplier}</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{product.short}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {activeProduct && (
        <ProductDetailsDialog
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </>
  );
};

export default Catalog;