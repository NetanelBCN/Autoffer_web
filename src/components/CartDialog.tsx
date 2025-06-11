import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

interface CartDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CartDialog = ({ open, setOpen }: CartDialogProps) => {
  const { cart, clearCart, removeItem } = useCart();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-white border-border shadow-xl">
        <DialogHeader>
          <DialogTitle>Your Cart</DialogTitle>
        </DialogHeader>
        {cart.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Your cart is empty.</div>
        ) : (
          <div>
            <ul className="divide-y divide-gray-200 mb-3 max-h-60 overflow-auto">
              {cart.map(item => (
                <li key={item.id} className="flex items-center p-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded mr-3 border"
                  />
                  <div className="flex-1">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">Supplier: {item.supplier}</div>
                    <div className="text-xs text-gray-500">Quantity: {item.amount}</div>
                  </div>
                  <div className="ml-2 flex flex-col items-end">
                    <div className="text-sm text-gray-800 font-semibold">${(item.price * item.amount).toFixed(2)}</div>
                    <button
                      className="text-xs text-red-500 hover:underline mt-1"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between py-3 font-semibold">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => { clearCart(); setOpen(false); }} disabled={cart.length === 0}>
            Clear Cart
          </Button>
          <Button variant="default" disabled={cart.length === 0} onClick={() => setOpen(false)}>
            Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;
