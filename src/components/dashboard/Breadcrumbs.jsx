import { useMemo } from 'react';

export default function Breadcrumbs({ folders, currentFolderId, onNavigate }) {
  // Build breadcrumb path by walking up parentId chain
  const path = useMemo(() => {
    if (!currentFolderId) return [];

    const folderMap = {};
    for (const f of folders) {
      folderMap[f.id] = f;
    }

    const chain = [];
    let current = folderMap[currentFolderId];
    while (current) {
      chain.unshift(current);
      current = current.parentId ? folderMap[current.parentId] : null;
    }
    return chain;
  }, [folders, currentFolderId]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 shadow-sm">
      <div className="flex items-center gap-1 text-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
            !currentFolderId
              ? 'text-primary font-semibold bg-primary/5'
              : 'text-gray-text hover:text-dark-text hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-hdd text-xs"></i>
          My Files
        </button>

        {path.map((folder) => (
          <div key={folder.id} className="flex items-center gap-1">
            <i className="fas fa-chevron-right text-[9px] text-gray-300"></i>
            <button
              type="button"
              onClick={() => onNavigate(folder.id)}
              className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                folder.id === currentFolderId
                  ? 'text-primary font-semibold bg-primary/5'
                  : 'text-gray-text hover:text-dark-text hover:bg-gray-50'
              }`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
