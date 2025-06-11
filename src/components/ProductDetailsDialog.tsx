import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { useState } from "react";
  import { useCart } from "@/context/CartContext";
  
  type Product = {
    id: number;
    name: string;
    image: string;
    price: number;
    short: string;
    details: string;
    supplier: string;
  };
  
  interface ProductDetailsDialogProps {
    product: Product;
    onClose: () => void;
  }
  
  const getDimensions = (details: string) => {
    const dimsMatch = details.match(/Dimensions?:\s*([^\.\n]+)/i);
    return dimsMatch ? dimsMatch[1].trim() : undefined;
  };
  
  const getRest = (details: string) => {
    const dimsMatch = details.match(/Dimensions?:\s*[^\.\n]+\.?\s*(.*)/is);
    if (dimsMatch && dimsMatch[1]) return dimsMatch[1].trim();
    return details;
  };
  
  const ProductDetailsDialog = ({ product, onClose }: ProductDetailsDialogProps) => {
    const [amount, setAmount] = useState(1);
    const { addToCart } = useCart();
  
    const dimensions = getDimensions(product.details);
    const restDetails = getRest(product.details);
  
    const handleAdd = () => {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          supplier: product.supplier,
        },
        amount
      );
      onClose();
    };
  
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-white border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center">{product.name}</DialogTitle>
            <DialogDescription className="text-center">{product.short}</DialogDescription>
          </DialogHeader>
          <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">
              Supplier: <span className="font-medium">{product.supplier}</span>
            </div>
  
            {dimensions && (
              <div className="mb-1 text-gray-900 font-medium text-sm">
                Dimensions: <span className="font-normal">{dimensions}</span>
              </div>
            )}
  
            <p className="mb-2 text-gray-700">{restDetails}</p>
            <div className="text-xl font-semibold mb-2 text-primary">${product.price.toFixed(2)}</div>
          </div>
          <div className="flex items-center justify-center mb-4 space-x-2">
            <span className="text-sm font-medium">Amount:</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
              className="border rounded px-2 py-1 w-20 text-right"
              aria-label="Amount"
            />
          </div>
          <DialogFooter className="flex-row space-x-2">
            <Button className="flex-1" variant="default" onClick={handleAdd}>
              Add to Cart
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default ProductDetailsDialog;
  