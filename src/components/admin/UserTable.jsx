import { useState } from 'react';

export default function UserTable({ users, onDeleteUser, onToggleAdmin, loading }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleDelete = async (uid) => {
    setActionLoading(uid);
    try {
      await onDeleteUser(uid);
    } catch {
      // Error handled by parent
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  };

  const handleToggleAdmin = async (uid, currentIsAdmin) => {
    setActionLoading(uid);
    try {
      await onToggleAdmin(uid, !currentIsAdmin);
    } catch {
      // Error handled by parent
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
          <p className="text-sm text-gray-text mt-3">Loading users...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-gray-400 text-2xl"></i>
          </div>
          <p className="text-sm font-medium text-dark-text">No users found</p>
          <p className="text-xs text-gray-text mt-1">Create a new user above to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-users text-primary"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-text">Users</h3>
            <p className="text-xs text-gray-text">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-8 py-3 text-xs font-semibold text-gray-text uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-text uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-text uppercase tracking-wider">Created</th>
              <th className="text-right px-8 py-3 text-xs font-semibold text-gray-text uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary uppercase">
                        {user.email?.[0] || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dark-text truncate max-w-[200px]">{user.email}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      <i className="fas fa-shield-halved text-[10px]"></i>
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-text">
                      <i className="fas fa-user text-[10px]"></i>
                      User
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-text">{formatDate(user.createdAt)}</span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleAdmin(user.uid, user.role === 'admin')}
                      disabled={actionLoading === user.uid}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        user.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                      title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    >
                      {actionLoading === user.uid ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className={`fas ${user.role === 'admin' ? 'fa-user-minus' : 'fa-user-shield'}`}></i>
                      )}
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>

                    {confirmDelete === user.uid ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(user.uid)}
                          disabled={actionLoading === user.uid}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.uid ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-check"></i>
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-text hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.uid)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <i className="fas fa-trash-alt"></i>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4 sm:p-6 pt-0 space-y-3">
        {users.map((user) => (
          <div key={user.uid} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary uppercase">
                    {user.email?.[0] || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark-text truncate">{user.email}</p>

                </div>
              </div>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary flex-shrink-0">
                  <i className="fas fa-shield-halved text-[10px]"></i>
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-text flex-shrink-0">
                  <i className="fas fa-user text-[10px]"></i>
                  User
                </span>
              )}
            </div>

            <p className="text-xs text-gray-text mb-3">
              <i className="fas fa-calendar-alt mr-1.5"></i>
              Created {formatDate(user.createdAt)}
            </p>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleToggleAdmin(user.uid, user.role === 'admin')}
                disabled={actionLoading === user.uid}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  user.role === 'admin'
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {actionLoading === user.uid ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className={`fas ${user.role === 'admin' ? 'fa-user-minus' : 'fa-user-shield'}`}></i>
                )}
                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </button>

              {confirmDelete === user.uid ? (
                <>
                  <button
                    onClick={() => handleDelete(user.uid)}
                    disabled={actionLoading === user.uid}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === user.uid ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-check"></i>
                    )}
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-text hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(user.uid)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <i className="fas fa-trash-alt"></i>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
