import ProductsPanel from "../../ProductsPanel";

export default function AdminProductsPage() {
  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">Products</h1>
      <p className="text-sm text-secondary-text mb-5">Add, edit, hide or delete products and photos. To change many prices quickly, use Update prices.</p>
      <ProductsPanel />
    </>
  );
}
