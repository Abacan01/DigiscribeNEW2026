function formatRelativeDate(dateString) {
  if (!dateString) return '--';
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
    return '--';
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function FolderRow({
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
  showUploadedBy = true,
}) {
  return (
    <tr
      className={`transition-colors cursor-pointer ${
        isDragOver
          ? 'bg-primary/10'
          : isSelected
          ? 'bg-primary/[0.03]'
          : 'hover:bg-gray-50/50'
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
      onClick={() => onOpen(folder.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e, folder);
      }}
    >
      <td className="text-center px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(folder.id)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-500">
            <i className="fas fa-folder text-xs"></i>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium text-dark-text truncate block max-w-[200px] hover:text-primary transition-colors">
              {folder.name}
            </span>
            {itemCount !== undefined && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-gray-text">Folder</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-indigo-50 text-indigo-600 border-indigo-200">
          <i className="fas fa-folder text-[9px]"></i>
          Folder
        </span>
      </td>
      {showUploadedBy && (
        <td className="px-4 py-3.5">
          <span className="text-sm text-gray-text">{folder.createdByEmail || '--'}</span>
        </td>
      )}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-text">{formatRelativeDate(folder.createdAt)}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-text">{totalSize > 0 ? formatSize(totalSize) : '--'}</span>
      </td>
      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(folder.id);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Open folder"
          >
            <i className="fas fa-folder-open text-[10px]"></i>
            Open
          </button>
        </div>
      </td>
    </tr>
  );
}
