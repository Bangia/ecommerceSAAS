import React, { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import { userLoggedOut } from "@/redux/features/auth/authSlice";
import { useAdminLoginMutation } from "@/redux/features/auth/authApi";
import { useAddProductMutation, useDeleteProductMutation, useGetAllProductsQuery, useUpdateProductMutation } from "@/redux/features/productApi";
import { useAddReviewMutation, useDeleteReviewMutation, useGetAllReviewsQuery, useUpdateReviewMutation } from "@/redux/features/reviewApi";
import { useAddTypeMutation, useDeleteTypeMutation, useGetAllTypesQuery, useUpdateTypeMutation } from "@/redux/features/typeApi";
import { useAddCategoryMutation, useDeleteCategoryMutation, useGetShowCategoryQuery, useUpdateCategoryMutation } from "@/redux/features/categoryApi";
import { useAddTestimonialMutation, useDeleteTestimonialMutation, useGetAllTestimonialsQuery, useUpdateTestimonialMutation } from "@/redux/features/testimonialApi";

const emptyProduct = { title: "", slug: "", price: "", type: "", category: "", brand: "", quantity: "", discount: "0", img: "", description: "" };
const emptyReview = { productId: "", rating: 5, comment: "" };
const emptyType = { name: "", value: "" };
const emptyCategory = { title: "", type: "" };
const emptyTestimonial = { name: "", designation: "", review: 5, desc: "", type: "beauty", image: "", status: "active" };
const getError = (error) => error?.data?.error || error?.error || "Something went wrong. Please try again.";

const AdminPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [adminLogin, { isLoading: loggingIn }] = useAdminLoginMutation();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [tab, setTab] = useState("products");
  const [product, setProduct] = useState(emptyProduct);
  const [review, setReview] = useState(emptyReview);
  const [type, setType] = useState(emptyType);
  const [category, setCategory] = useState(emptyCategory);
  const [testimonial, setTestimonial] = useState(emptyTestimonial);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [modal, setModal] = useState(null);
  const { data: productResult, isLoading: productsLoading } = useGetAllProductsQuery(undefined, { skip: !isAdmin });
  const { data: reviewResult, isLoading: reviewsLoading } = useGetAllReviewsQuery(undefined, { skip: !isAdmin });
  const { data: typeResult, isLoading: typesLoading } = useGetAllTypesQuery();
  const { data: categoryResult, isLoading: categoriesLoading } = useGetShowCategoryQuery();
  const { data: testimonialResult, isLoading: testimonialsLoading } = useGetAllTestimonialsQuery(undefined, { skip: !isAdmin });
  const [addProduct, { isLoading: addingProduct }] = useAddProductMutation();
  const [updateProduct, { isLoading: updatingProduct }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [addReview, { isLoading: addingReview }] = useAddReviewMutation();
  const [updateReview, { isLoading: updatingReview }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [addType, { isLoading: addingType }] = useAddTypeMutation();
  const [updateType, { isLoading: updatingType }] = useUpdateTypeMutation();
  const [deleteType] = useDeleteTypeMutation();
  const [addCategory, { isLoading: addingCategory }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: updatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [addTestimonial, { isLoading: addingTestimonial }] = useAddTestimonialMutation();
  const [updateTestimonial, { isLoading: updatingTestimonial }] = useUpdateTestimonialMutation();
  const [deleteTestimonial] = useDeleteTestimonialMutation();
  const products = productResult?.data || [];
  const reviews = reviewResult?.data || [];
  const types = typeResult?.data || [];
  const categories = categoryResult?.data || [];
  const testimonials = testimonialResult?.data || [];
  const notifyError = (error) => toast.error(getError(error));
  const closeModal = () => { setModal(null); setEditingProduct(null); setEditingReview(null); setEditingType(null); setEditingCategory(null); setEditingTestimonial(null); setProduct(emptyProduct); setReview(emptyReview); setType(emptyType); setCategory(emptyCategory); setTestimonial(emptyTestimonial); };

  const login = async (event) => {
    event.preventDefault();
    try { await adminLogin(credentials).unwrap(); toast.success("Welcome to your dashboard"); } catch (error) { notifyError(error); }
  };
  const saveProduct = async (event) => {
    event.preventDefault();
    const data = { ...product, price: Number(product.price), quantity: Number(product.quantity || 0), discount: Number(product.discount || 0) };
    try { if (editingProduct) await updateProduct({ id: editingProduct._id, ...data }).unwrap(); else await addProduct(data).unwrap(); toast.success(editingProduct ? "Product updated" : "Product published"); closeModal(); } catch (error) { notifyError(error); }
  };
  const saveReview = async (event) => {
    event.preventDefault();
    try { if (editingReview) await updateReview({ id: editingReview._id, rating: Number(review.rating), comment: review.comment }).unwrap(); else await addReview({ ...review, rating: Number(review.rating) }).unwrap(); toast.success(editingReview ? "Review updated" : "Review added"); closeModal(); } catch (error) { notifyError(error); }
  };
  const saveType = async (event) => {
    event.preventDefault();
    try { if (editingType) await updateType({ id: editingType._id, ...type }).unwrap(); else await addType(type).unwrap(); toast.success(editingType ? "Type updated" : "Type added"); closeModal(); } catch (error) { notifyError(error); }
  };
  const saveCategory = async (event) => {
    event.preventDefault();
    try { if (editingCategory) await updateCategory({ id: editingCategory._id, ...category }).unwrap(); else await addCategory(category).unwrap(); toast.success(editingCategory ? "Category updated" : "Category added"); closeModal(); } catch (error) { notifyError(error); }
  };
  const saveTestimonial = async (event) => {
    event.preventDefault();
    try { if (editingTestimonial) await updateTestimonial({ id: editingTestimonial._id, ...testimonial, review: Number(testimonial.review) }).unwrap(); else await addTestimonial({ ...testimonial, review: Number(testimonial.review) }).unwrap(); toast.success(editingTestimonial ? "Testimonial updated" : "Testimonial added"); closeModal(); } catch (error) { notifyError(error); }
  };
  const remove = async (action, id, message) => { if (!window.confirm(`Delete this ${message}?`)) return; try { await action(id).unwrap(); toast.success(`${message} deleted`); } catch (error) { notifyError(error); } };
  const editProduct = (item) => { setEditingProduct(item); setProduct({ ...emptyProduct, ...item }); setModal("product"); };
  const editReview = (item) => { setEditingReview(item); setReview({ productId: item.productId?._id || item.productId, rating: item.rating, comment: item.comment }); setModal("review"); };
  const editType = (item) => { setEditingType(item); setType({ name: item.name, value: item.value }); setModal("type"); };
  const editCategory = (item) => { setEditingCategory(item); setCategory({ title: item.title, type: item.type || "" }); setModal("category"); };
  const editTestimonial = (item) => { setEditingTestimonial(item); setTestimonial({ name: item.name, designation: item.designation || "", review: item.review, desc: item.desc, type: item.type || "beauty", image: item.image || "", status: item.status || "active" }); setModal("testimonial"); };

  if (!isAdmin) return <Wrapper><SEO pageTitle="Admin Login" /><main className="admin-shell admin-login-shell"><div className="admin-login-card"><Link href="/" className="admin-brand">SHOFY<span>.</span></Link><p className="admin-kicker">Store administration</p><h1>Run your catalog.</h1><p className="admin-muted">Sign in to manage products, types, categories, and customer reviews.</p><form onSubmit={login} className="admin-form"><label>Username<input type="text" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} placeholder="admin" required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Admin password" required /></label><button className="admin-primary-button" disabled={loggingIn}>{loggingIn ? "Signing in..." : "Sign in to dashboard"}</button></form><p className="admin-login-footer">Store administrator access only</p></div></main></Wrapper>;

  const isTable = tab !== "overview";
  return <Wrapper><SEO pageTitle="Admin Dashboard" /><main className="admin-shell admin-dashboard">
    <aside className="admin-sidebar"><Link href="/" className="admin-brand">SHOFY<span>.</span></Link><p className="admin-sidebar-label">Management</p>{[["overview", "Dashboard", ""], ["products", "Products", products.length], ["reviews", "Reviews", reviews.length], ["types", "Types", types.length], ["categories", "Categories", categories.length], ["testimonials", "Testimonials", testimonials.length]].map(([key, label, count]) => <button key={key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label} <b>{count}</b></button>)}<div className="admin-sidebar-bottom"><Link href="/shop">View storefront</Link><button onClick={() => dispatch(userLoggedOut())}>Sign out</button></div></aside>
    <section className="admin-main"><header className="admin-dashboard-header"><div><p className="admin-kicker">Business summary</p><h1>Good morning, {user.name || "Admin"}</h1></div><span className="admin-user-pill">{user.email}</span></header>
      {tab === "overview" && <section className="admin-overview"><h2>Store at a glance</h2><div className="admin-summary-grid"><button onClick={() => setTab("products")}><strong>{products.length}</strong><span>Total products</span></button><button onClick={() => setTab("reviews")}><strong>{reviews.length}</strong><span>Customer reviews</span></button><button onClick={() => setTab("types")}><strong>{types.length}</strong><span>Product types</span></button><button onClick={() => setTab("categories")}><strong>{categories.length}</strong><span>Categories</span></button><button onClick={() => setTab("testimonials")}><strong>{testimonials.length}</strong><span>Testimonials</span></button></div><div className="admin-welcome-band"><span>Catalog configuration</span><p>Manage what shoppers see from one workspace.</p></div></section>}
      {isTable && <><div className="admin-page-heading"><div><p className="admin-kicker">{tab === "products" ? "Catalog" : tab === "reviews" ? "Customer feedback" : tab === "testimonials" ? "Customer stories" : "Product configuration"}</p><h2>{tab[0].toUpperCase() + tab.slice(1)}</h2></div><button className="admin-primary-button admin-heading-button" onClick={() => setModal(tab === "products" ? "product" : tab === "reviews" ? "review" : tab === "types" ? "type" : tab === "categories" ? "category" : "testimonial")}>+ Add {tab === "products" ? "product" : tab === "reviews" ? "review" : tab === "types" ? "type" : tab === "categories" ? "category" : "testimonial"}</button></div><div className="admin-table-panel"><div className="admin-table-toolbar"><strong>{tab === "products" ? `${products.length} products` : tab === "reviews" ? `${reviews.length} reviews` : tab === "types" ? `${types.length} types` : tab === "categories" ? `${categories.length} categories` : `${testimonials.length} testimonials`}</strong><span>Last updated just now</span></div>
        {tab === "products" && <ProductTable products={products} loading={productsLoading} onEdit={editProduct} onDelete={(id) => remove(deleteProduct, id, "product")} />}
        {tab === "reviews" && <ReviewTable reviews={reviews} loading={reviewsLoading} onEdit={editReview} onDelete={(id) => remove(deleteReview, id, "review")} />}
        {tab === "types" && <TypeTable types={types} loading={typesLoading} onEdit={editType} onDelete={(id) => remove(deleteType, id, "type")} />}
        {tab === "categories" && <CategoryTable categories={categories} loading={categoriesLoading} onEdit={editCategory} onDelete={(id) => remove(deleteCategory, id, "category")} />}
        {tab === "testimonials" && <TestimonialTable testimonials={testimonials} loading={testimonialsLoading} onEdit={editTestimonial} onDelete={(id) => remove(deleteTestimonial, id, "testimonial")} />}
      </div></>}
    </section>
    {modal === "product" && <ProductModal form={product} setForm={setProduct} types={types} categories={categories} editing={editingProduct} loading={addingProduct || updatingProduct} onSubmit={saveProduct} onClose={closeModal} />}
    {modal === "review" && <ReviewModal form={review} setForm={setReview} products={products} editing={editingReview} loading={addingReview || updatingReview} onSubmit={saveReview} onClose={closeModal} />}
    {modal === "type" && <TypeModal form={type} setForm={setType} editing={editingType} loading={addingType || updatingType} onSubmit={saveType} onClose={closeModal} />}
    {modal === "category" && <CategoryModal form={category} setForm={setCategory} types={types} editing={editingCategory} loading={addingCategory || updatingCategory} onSubmit={saveCategory} onClose={closeModal} />}
    {modal === "testimonial" && <TestimonialModal form={testimonial} setForm={setTestimonial} types={types} editing={editingTestimonial} loading={addingTestimonial || updatingTestimonial} onSubmit={saveTestimonial} onClose={closeModal} />}
  </main></Wrapper>;
};

const Actions = ({ onEdit, onDelete, label }) => <div className="admin-actions"><button className="admin-icon-button edit" title={`Edit ${label}`} aria-label={`Edit ${label}`} onClick={onEdit}>✎</button><button className="admin-icon-button delete" title={`Delete ${label}`} aria-label={`Delete ${label}`} onClick={onDelete}>×</button></div>;
const TypeTable = ({ types, loading, onEdit, onDelete }) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Type name</th><th>Value used by products</th><th>Created</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4">Loading types...</td></tr> : types.map((item) => <tr key={item._id}><td><strong>{item.name}</strong></td><td><span className="admin-tag">{item.value}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td><td><Actions label="type" onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} /></td></tr>)}</tbody></table></div>;
const CategoryTable = ({ categories, loading, onEdit, onDelete }) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Category</th><th>Product type</th><th>Created</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4">Loading categories...</td></tr> : categories.map((item) => <tr key={item._id}><td><strong>{item.title}</strong></td><td><span className="admin-tag">{item.type || "-"}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td><td><Actions label="category" onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} /></td></tr>)}</tbody></table></div>;
const TestimonialTable = ({ testimonials, loading, onEdit, onDelete }) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Designation</th><th>Rating</th><th>Testimonial</th><th>Type</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading testimonials...</td></tr> : testimonials.map((item) => <tr key={item._id}><td><strong>{item.name}</strong></td><td>{item.designation || "-"}</td><td><span className="admin-rating">{"★".repeat(Math.max(0, Math.min(5, item.review || 0)))}</span></td><td className="admin-review-text">{item.desc}</td><td><span className="admin-tag">{item.type || "-"}</span></td><td><Actions label="testimonial" onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} /></td></tr>)}</tbody></table></div>;
const ProductTable = ({ products, loading, onEdit, onDelete }) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Type</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading products...</td></tr> : products.map((item) => <tr key={item._id}><td><div className="admin-table-product"><div className="admin-product-image">{item.img ? <img src={item.img} alt="" /> : item.title?.charAt(0)}</div><div><strong>{item.title}</strong><small>{item.slug}</small></div></div></td><td>{item.category || "-"}</td><td><span className="admin-tag">{item.type || "-"}</span></td><td>${Number(item.price || 0).toFixed(2)}</td><td>{item.quantity ?? 0}</td><td><Actions label="product" onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} /></td></tr>)}</tbody></table></div>;
const ReviewTable = ({ reviews, loading, onEdit, onDelete }) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reviewer</th><th>Product</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading reviews...</td></tr> : reviews.map((item) => <tr key={item._id}><td><strong>{item.userId?.name || item.name || "Customer"}</strong><small className="admin-block-text">{item.userId?.email || ""}</small></td><td>{item.productId?.title || "Deleted product"}</td><td><span className="admin-rating">{"★".repeat(Math.max(0, Math.min(5, item.rating || 0)))}</span><small className="admin-block-text">{item.rating}/5</small></td><td className="admin-review-text">{item.comment}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td><td><Actions label="review" onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} /></td></tr>)}</tbody></table></div>;

const ProductModal = ({ form, setForm, types, categories, editing, loading, onSubmit, onClose }) => <Modal title={editing ? "Edit product" : "Add product"} subtitle="Catalog management" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}><div className="admin-form-grid"><label>Product title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label><label>Quantity<input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required><option value="">Select type</option>{types.map((item) => <option key={item._id} value={item.value}>{item.name}</option>)}</select></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">Select category</option>{categories.filter((item) => !form.type || !item.type || item.type === form.type).map((item) => <option key={item._id} value={item.title}>{item.title}</option>)}</select></label><label>Brand<input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></label><label>Discount (%)<input type="number" min="0" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></label><label className="admin-wide-field">Image URL<input value={form.img} onChange={(event) => setForm({ ...form, img: event.target.value })} /></label><label className="admin-wide-field">Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><button className="admin-primary-button" disabled={loading}>{loading ? "Saving..." : editing ? "Save changes" : "Publish product"}</button></form></Modal>;
const ReviewModal = ({ form, setForm, products, editing, loading, onSubmit, onClose }) => <Modal title={editing ? "Edit review" : "Add review"} subtitle="Customer feedback" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}>{!editing && <label>Product<select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required><option value="">Select a product</option>{products.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>}<label>Rating<select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label><label>Review<textarea rows="5" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} required /></label><button className="admin-primary-button" disabled={loading}>{loading ? "Saving..." : editing ? "Save changes" : "Add review"}</button></form></Modal>;
const TypeModal = ({ form, setForm, editing, loading, onSubmit, onClose }) => <Modal title={editing ? "Edit type" : "Add type"} subtitle="Product configuration" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}><label>Type name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, value: form.value || event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="Home Decor" required /></label><label>Value used by products<input value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="home-decor" required /></label><button className="admin-primary-button" disabled={loading}>{loading ? "Saving..." : editing ? "Save changes" : "Add type"}</button></form></Modal>;
const CategoryModal = ({ form, setForm, types, editing, loading, onSubmit, onClose }) => <Modal title={editing ? "Edit category" : "Add category"} subtitle="Product configuration" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}><label>Category name<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="home-decor" required /></label><label>Product type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required><option value="">Select type</option>{types.map((item) => <option key={item._id} value={item.value}>{item.name}</option>)}</select></label><button className="admin-primary-button" disabled={loading}>{loading ? "Saving..." : editing ? "Save changes" : "Add category"}</button></form></Modal>;
const TestimonialModal = ({ form, setForm, types, editing, loading, onSubmit, onClose }) => <Modal title={editing ? "Edit testimonial" : "Add testimonial"} subtitle="Customer stories" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}><div className="admin-form-grid"><label>Customer name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Designation<input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} placeholder="CO Founder" /></label><label>Rating<select value={form.review} onChange={(event) => setForm({ ...form, review: event.target.value })}><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label><label>Display type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{types.map((item) => <option key={item._id} value={item.value}>{item.name}</option>)}</select></label><label className="admin-wide-field">Testimonial<textarea rows="5" value={form.desc} onChange={(event) => setForm({ ...form, desc: event.target.value })} required /></label><label className="admin-wide-field">Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="/assets/img/users/user-1.jpg" /></label></div><button className="admin-primary-button" disabled={loading}>{loading ? "Saving..." : editing ? "Save changes" : "Add testimonial"}</button></form></Modal>;
const Modal = ({ title, subtitle, onClose, children }) => <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="admin-modal"><div className="admin-modal-heading"><div><p className="admin-kicker">{subtitle}</p><h2>{title}</h2></div><button type="button" className="admin-modal-close" onClick={onClose}>×</button></div>{children}</div></div>;

export default AdminPage;