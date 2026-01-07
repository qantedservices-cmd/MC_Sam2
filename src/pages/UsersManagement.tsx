import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Check, X, Loader2, Search, Shield } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getChantiers } from '../services/api';
import type { User, UserRole, Chantier } from '../types';
import { USER_ROLES } from '../types';
import { useToast } from '../contexts/ToastContext';

export default function UsersManagement() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'lecteur' as UserRole,
    chantierIds: [] as string[],
    actif: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, chantiersData] = await Promise.all([
        getUsers(),
        getChantiers()
      ]);
      setUsers(usersData);
      setChantiers(chantiersData);
    } catch (error) {
      showError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        chantierIds: user.chantierIds || [],
        actif: user.actif
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        nom: '',
        prenom: '',
        role: 'lecteur',
        chantierIds: [],
        actif: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData: Partial<User> = {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          role: formData.role,
          chantierIds: formData.chantierIds,
          actif: formData.actif
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser(editingUser.id, updateData);
        showSuccess('Utilisateur modifie avec succes');
      } else {
        await createUser({
          email: formData.email,
          password: formData.password,
          nom: formData.nom,
          prenom: formData.prenom,
          role: formData.role,
          chantierIds: formData.chantierIds,
          actif: formData.actif,
          createdAt: new Date().toISOString().split('T')[0]
        });
        showSuccess('Utilisateur cree avec succes');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur ${user.prenom} ${user.nom} ?`)) return;

    try {
      await deleteUser(user.id);
      showSuccess('Utilisateur supprime');
      loadData();
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { actif: !user.actif });
      showSuccess(user.actif ? 'Utilisateur desactive' : 'Utilisateur active');
      loadData();
    } catch (error) {
      showError('Erreur lors de la mise a jour');
    }
  };

  const filteredUsers = users.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">{users.length} utilisateur(s) au total</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Utilisateur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.prenom} {user.nom}</p>
                      <p className="text-sm text-gray-500">
                        {user.chantierIds?.length === 0 ? 'Tous les chantiers' : `${user.chantierIds?.length || 0} chantier(s)`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'gestionnaire' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'utilisateur' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {USER_ROLES[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      user.actif
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {user.actif ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {user.actif ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun utilisateur trouve
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucun utilisateur trouve
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.prenom} {user.nom}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(user)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    user.actif
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.actif ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {user.actif ? 'Actif' : 'Inactif'}
                </button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'gestionnaire' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'utilisateur' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {USER_ROLES[user.role]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.chantierIds?.length === 0 ? 'Tous les chantiers' : `${user.chantierIds?.length || 0} chantier(s)`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!editingUser}
                  minLength={6}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(USER_ROLES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chantiers accessibles
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Laissez vide pour donner acces a tous les chantiers
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                  {chantiers.map(chantier => (
                    <label key={chantier.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.chantierIds.includes(chantier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, chantierIds: [...prev.chantierIds, chantier.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, chantierIds: prev.chantierIds.filter(id => id !== chantier.id) }));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">{chantier.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData(prev => ({ ...prev, actif: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label htmlFor="actif" className="text-sm text-gray-700">Compte actif</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
