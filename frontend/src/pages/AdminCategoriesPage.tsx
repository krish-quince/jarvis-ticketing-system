import AdminMasterManager from "./AdminMasterManager";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/masterService";

const AdminCategoriesPage = () => (
  <AdminMasterManager
    title="Ticket Categories"
    description="Add or remove ticket and KB categories, and control the category list used by ticket routing."
    idKey="category_id"
    defaultItem={{
      category_name: "",
      category_description: "",
    }}
    fields={[
      {
        key: "category_name",
        label: "Category name",
        required: true,
      },
      {
        key: "category_description",
        label: "Description",
      },
    ]}
    fetchItems={getCategories}
    createItem={createCategory}
    updateItem={updateCategory}
    deleteItem={deleteCategory}
  />
);

export default AdminCategoriesPage;
