import { useMemo, useState, useCallback } from 'react';

export default function Breadcrumbs({ folders, currentFolderId, onNavigate, onDrop, isDraggingAny = false }) {
  const [dragOverId, setDragOverId] = useState(null); // 'root' | folder.id | null

  // Build breadcrumb path by walking up parentId chain
  const path = useMemo(() => {
    if (!currentFolderId) return [];
    const folderMap = {};
    for (const f of folders) folderMap[f.id] = f;
    const chain = [];
    let current = folderMap[currentFolderId];
    while (current) {
      chain.unshift(current);
      current = current.parentId ? folderMap[current.parentId] : null;
    }
    return chain;
  }, [folders, currentFolderId]);

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear if leaving to an element outside the breadcrumb bar
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    if (onDrop) onDrop(e, targetFolderId);
  }, [onDrop]);

  const crumbClass = (isActive, isDragOver) => {
    if (isDragOver) return 'bg-primary/10 text-primary border border-primary/30 scale-105 shadow-sm';
    if (isActive) return 'text-primary font-semibold bg-primary/5';
    return 'text-gray-text hover:text-dark-text hover:bg-gray-50';
  };

  const isDragging = dragOverId !== null;
  // Show idle hint when something is being dragged anywhere on the page but not yet over the bar
  const showIdleHint = isDraggingAny && !isDragging;

  return (
    <div
      className={`bg-white rounded-xl border px-4 py-3 mb-4 shadow-sm transition-all duration-200 ${
        isDragging
          ? 'border-primary/40 bg-primary/[0.02] shadow-md'
          : showIdleHint
          ? 'border-dashed border-primary/50 bg-primary/[0.015] shadow-sm'
          : 'border-gray-100'
      }`}
      onDragLeave={handleDragLeave}
    >
      {/* Idle hint — shown as soon as any drag starts before user reaches the bar */}
      {showIdleHint && (
        <div className="flex items-center gap-2 mb-2 px-0.5 animate-pulse">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10 flex-shrink-0">
            <i className="fas fa-location-arrow text-primary text-[9px] -rotate-45"></i>
          </span>
          <p className="text-[11px] text-primary/80 font-medium leading-tight">
            Drag here to move to <span className="font-semibold">My Files</span> or a parent folder
          </p>
        </div>
      )}
      {isDragging && (
        <p className="text-[10px] text-primary/70 font-medium mb-1.5 flex items-center gap-1">
          <i className="fas fa-arrows-alt text-[9px]"></i>
          Drop onto a folder to move here
        </p>
      )}
      <div className="flex items-center gap-1 text-sm overflow-x-auto">
        {/* Root drop target */}
        <button
          type="button"
          onClick={() => onNavigate(null)}
          onDragOver={(e) => handleDragOver(e, 'root')}
          onDrop={(e) => handleDrop(e, null)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-150 whitespace-nowrap ${
            isDraggingAny && !isDragging && !currentFolderId
              ? 'ring-1 ring-primary/20'
              : ''
          } ${crumbClass(!currentFolderId, dragOverId === 'root')}`}
        >
          <i className={`fas fa-hdd text-xs ${dragOverId === 'root' ? 'text-primary' : ''}`}></i>
          My Files
          {dragOverId === 'root' && <i className="fas fa-download text-[9px] ml-0.5 opacity-60"></i>}
        </button>

        {path.map((folder) => (
          <div key={folder.id} className="flex items-center gap-1">
            <i className="fas fa-chevron-right text-[9px] text-gray-300 flex-shrink-0"></i>
            <button
              type="button"
              onClick={() => onNavigate(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`px-2 py-1 rounded-lg transition-all duration-150 whitespace-nowrap ${crumbClass(folder.id === currentFolderId, dragOverId === folder.id)}`}
            >
              {folder.name}
              {dragOverId === folder.id && <i className="fas fa-download text-[9px] ml-1.5 opacity-60"></i>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
