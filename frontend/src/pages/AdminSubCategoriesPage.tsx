import { useEffect, useMemo, useState } from "react";
import AdminMasterManager from "./AdminMasterManager";
import {
  createSubCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
  updateSubCategory,
} from "../services/masterService";
import { getUsers } from "../services/userService";

type CategoryOption = {
  category_id: number;
  category_name: string;
};

type UserOption = {
  user_code: string;
  first_name?: string;
  last_name?: string;
};

const AdminSubCategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [categoryData, userData] = await Promise.all([
        getCategories(),
        getUsers(),
      ]);

      setCategories(categoryData || []);
      setUsers(userData || []);
    };

    loadOptions();
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.category_id,
        label: category.category_name,
      })),
    [categories],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.user_code,
        label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.user_code,
      })),
    [users],
  );

  const fetchItems = async () => {
    const activeCategories: CategoryOption[] = categories.length
      ? categories
      : await getCategories();
    const entries = await Promise.all(
      activeCategories.map(async (category) => {
        const subcategories = await getSubCategories(category.category_id);
        return subcategories.map((subcategory: any) => ({
          ...subcategory,
          category_id: category.category_id,
        }));
      }),
    );

    return entries.flat();
  };

  return (
    <AdminMasterManager
      title="Ticket Subcategories"
      description="Add, update, remove, and route subcategories under ticket categories."
      idKey="subcategory_id"
      defaultItem={{
        category_id: "",
        subcategory_name: "",
        subcategory_description: "",
        assigned_user_code: "",
      }}
      fields={[
        {
          key: "category_id",
          label: "Category",
          type: "select",
          options: categoryOptions,
          required: true,
        },
        {
          key: "subcategory_name",
          label: "Subcategory name",
          required: true,
        },
        {
          key: "subcategory_description",
          label: "Description",
        },
        {
          key: "assigned_user_code",
          label: "Routing assignee",
          type: "multiselect",
          options: userOptions,
        },
      ]}
      fetchItems={fetchItems}
      createItem={createSubCategory}
      updateItem={updateSubCategory}
      deleteItem={deleteSubCategory}
    />
  );
};

export default AdminSubCategoriesPage;
