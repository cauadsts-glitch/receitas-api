import supabase from "../config/supabase.js";

async function findAll() {
  const { data, error } = await supabase.from("reviews").select("*");

  if (error) {
    throw error;
  }

  return data;
}

async function findById(id: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function findByReceita(receitaId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("receita_id", receitaId);

  if (error) {
    throw error;
  }

  return data;
}

async function create(review: {
  receita_id: string;
  author_name: string;
  rating: number;
  comment: string;
}) {
  const { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function update(
  id: string,
  review: {
    receita_id: string;
    author_name: string;
    rating: number;
    comment: string;
  },
) {
  const { data, error } = await supabase
    .from("reviews")
    .update(review)
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
    .from("reviews")
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
    .from("reviews")
    .select("*")
    .or(`author_name.ilike.%${keyword}%, comment.ilike.%${keyword}%`);

  if (error) {
    throw error;
  }

  return data;
}

export default {
  findAll,
  findById,
  findByReceita,
  create,
  update,
  remove,
  findByKeyword,
};
