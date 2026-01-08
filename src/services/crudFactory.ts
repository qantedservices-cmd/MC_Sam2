/**
 * Factory CRUD generique pour reduire la duplication de code API
 */

const API_URL = 'http://localhost:3001';

export interface CrudApi<T, CreateT = Omit<T, 'id'>> {
  getAll: (filter?: string) => Promise<T[]>;
  getById: (id: string) => Promise<T>;
  create: (data: CreateT) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export function createCrudApi<T extends { id: string }, CreateT = Omit<T, 'id'>>(
  endpoint: string,
  entityName: string
): CrudApi<T, CreateT> {
  return {
    async getAll(filter?: string): Promise<T[]> {
      const url = filter ? `${API_URL}/${endpoint}?${filter}` : `${API_URL}/${endpoint}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur lors de la recuperation des ${entityName}s`);
      }
      return response.json();
    },

    async getById(id: string): Promise<T> {
      const response = await fetch(`${API_URL}/${endpoint}/${id}`);
      if (!response.ok) {
        throw new Error(`${entityName} non trouve`);
      }
      return response.json();
    },

    async create(data: CreateT): Promise<T> {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Erreur lors de la creation du ${entityName}`);
      }
      return response.json();
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise a jour du ${entityName}`);
      }
      return response.json();
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression du ${entityName}`);
      }
    },
  };
}

// Helper pour les filtres par chantier
export function createChantierFilteredCrudApi<T extends { id: string; chantierId: string }, CreateT = Omit<T, 'id'>>(
  endpoint: string,
  entityName: string
) {
  const baseApi = createCrudApi<T, CreateT>(endpoint, entityName);

  return {
    ...baseApi,
    async getByChantier(chantierId: string): Promise<T[]> {
      return baseApi.getAll(`chantierId=${chantierId}`);
    },
    async deleteByChantier(chantierId: string): Promise<void> {
      const items = await baseApi.getAll(`chantierId=${chantierId}`);
      await Promise.all(items.map(item => baseApi.delete(item.id)));
    },
  };
}
