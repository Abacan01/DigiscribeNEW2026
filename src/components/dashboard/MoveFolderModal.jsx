import { useState, useMemo } from 'react';

function buildTree(folders, excludeIds = new Set()) {
  const children = {};
  const roots = [];

  for (const f of folders) {
    if (excludeIds.has(f.id)) continue;
    const parentId = f.parentId || '__root__';
    if (!children[parentId]) children[parentId] = [];
    children[parentId].push(f);
  }

  // Sort each level by name
  for (const key of Object.keys(children)) {
    children[key].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return { roots: children['__root__'] || [], children };
}

function FolderTreeNode({ folder, children: childMap, selectedId, onSelect, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const kids = childMap[folder.id] || [];
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {kids.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} text-[9px]`}></i>
          </button>
        ) : (
          <span className="w-4" />
        )}
        <i className={`fas ${expanded && kids.length > 0 ? 'fa-folder-open' : 'fa-folder'} text-xs text-indigo-400`}></i>
        <span className="text-sm truncate">{folder.name}</span>
        {isSelected && <i className="fas fa-check text-[10px] text-primary ml-auto"></i>}
      </div>
      {expanded && kids.map((kid) => (
        <FolderTreeNode
          key={kid.id}
          folder={kid}
          children={childMap}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function MoveFolderModal({ isOpen, onClose, onSelect, folders, excludeIds = [], title = 'Move to Folder' }) {
  const [selectedId, setSelectedId] = useState(null); // null means root
  const [loading, setLoading] = useState(false);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const tree = useMemo(() => buildTree(folders, excludeSet), [folders, excludeSet]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSelect(selectedId);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="p-6 pb-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <i className="fas fa-arrows-alt text-indigo-500"></i>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-text">{title}</h2>
            <p className="text-xs text-gray-text">Select a destination folder</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Folder tree */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          {/* Root option */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
              selectedId === null
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedId(null)}
          >
            <span className="w-4" />
            <i className="fas fa-hdd text-xs text-gray-400"></i>
            <span className="text-sm">Root (My Files)</span>
            {selectedId === null && <i className="fas fa-check text-[10px] text-primary ml-auto"></i>}
          </div>

          {tree.roots.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              children={tree.children}
              selectedId={selectedId}
              onSelect={setSelectedId}
              depth={0}
            />
          ))}

          {tree.roots.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-folder text-gray-200 text-2xl mb-2"></i>
              <p className="text-xs text-gray-400">No folders available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 border-t border-gray-100 flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-text hover:text-dark-text transition-colors rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="btn-gradient text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fas fa-check text-xs"></i>
            )}
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
