import supabase from "../config/supabase.js";

async function findAll() {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, receitas(*)");

  if (error) {
    throw error;
  }

  return data;
}

async function findById(id: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, receitas(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function create(favorite: { receita_id: string; note: string }) {
  const { data, error } = await supabase
    .from("favorites")
    .insert(favorite)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function update(id: string, favorite: { note: string }) {
  const { data, error } = await supabase
    .from("favorites")
    .update(favorite)
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
    .from("favorites")
    .delete()
    .eq("id", id)
    .select()
    .single();

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
};
