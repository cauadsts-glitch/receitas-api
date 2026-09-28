import supabase from "../config/supabase.js";

async function findAll() {
  const { data, error } = await supabase.from("receitas").select("*");

  if (error) {
    throw error;
  }

  return data;
}

async function findById(id: string) {
  const { data, error } = await supabase
    .from("receitas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function create(receita: {
  category_id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prep_time_minutes: number;
  servings: number;
  difficulty: string;
  image: string;
  active: boolean;
}) {
  const { data, error } = await supabase
    .from("receitas")
    .insert(receita)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function update(
  id: string,
  receita: {
    category_id: string;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    prep_time_minutes: number;
    servings: number;
    difficulty: string;
    image: string;
    active: boolean;
  },
) {
  const { data, error } = await supabase
    .from("receitas")
    .update(receita)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function remove(id: string) {
  const { data, error } = await supabase
    .from("receitas")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function findByKeyword(keyword: string) {
  const { data, error } = await supabase
    .from("receitas")
    .select("*")
    .or(`title.ilike.%${keyword}%, description.ilike.%${keyword}%`);

  if (error) {
    throw error;
  }

  return data;
}

export default {
  findAll,
  findById,
  create,
  update,
  remove,
  findByKeyword,
};
