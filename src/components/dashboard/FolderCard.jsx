import { useState } from 'react';

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function FolderCard({
  folder,
  onOpen,
  onContextMenu,
  isSelected,
  onSelect,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  itemCount,
  totalSize,
  showOwner,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer group ${
        isDragOver
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
          : isSelected
          ? 'border-primary/30 ring-1 ring-primary/10 shadow-sm'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (onDragOver) onDragOver(folder.id);
      }}
      onDragLeave={() => {
        if (onDragLeave) onDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDrop) onDrop(e, folder.id);
      }}
      onDoubleClick={() => onOpen(folder.id)}
      onClick={() => onOpen(folder.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e, folder);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="h-0.5 bg-indigo-400" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          {onSelect && (
            <div className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(folder.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
            </div>
          )}

          {/* Folder icon */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-500 transition-all duration-200">
            <i className={`fas ${hovered || isDragOver ? 'fa-folder-open' : 'fa-folder'} text-lg`}></i>
          </div>

          {/* Folder info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-dark-text truncate group-hover:text-primary transition-colors">
              {folder.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {itemCount !== undefined && (
                <>
                  <span className="text-[11px] text-gray-400">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-200">&middot;</span>
                </>
              )}
              {totalSize > 0 && (
                <>
                  <span className="text-[11px] text-gray-400">{formatSize(totalSize)}</span>
                  <span className="text-gray-200">&middot;</span>
                </>
              )}
              <span className="text-[11px] text-gray-400">{formatDate(folder.createdAt)}</span>
            </div>
            {showOwner && folder.createdByEmail && (
              <div className="flex items-center gap-1.5 mt-1">
                <i className="fas fa-user text-[9px] text-gray-300"></i>
                <span className="text-[10px] text-gray-400 truncate">{folder.createdByEmail}</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
            <i className="fas fa-chevron-right text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
