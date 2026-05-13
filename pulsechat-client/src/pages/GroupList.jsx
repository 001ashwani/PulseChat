import { useMemo } from 'react';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GroupList({ groups = [], selectedGroupId, onSelectGroup, onNewGroup, loading = false }) {
  const sortedGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return [...groups].sort((a, b) => 
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }, [groups]);

  return (
    <div className="w-full h-full flex flex-col">
      <button
        onClick={onNewGroup}
        disabled={loading}
        className="m-md bg-primary text-on-primary font-label text-sm font-bold py-3 px-md rounded-lg shadow-sm hover:bg-primary-dim active:scale-95 transition-all duration-200 flex items-center justify-center gap-sm disabled:opacity-50"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        New Group
      </button>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant font-label text-sm">Loading groups...</div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant font-label text-sm px-4">
            <p className="mb-2">No groups yet</p>
            <p className="text-xs">Create one to get started!</p>
          </div>
        ) : (
          sortedGroups.map(group => {
            const isSelected = selectedGroupId === group._id;
            const memberCount = group.memberIds?.length || 0;
            const bgClass = isSelected ? 'bg-surface-container border-l-4 border-l-primary' : 'hover:bg-surface-container';
            const borderClass = isSelected ? 'border-2 border-primary' : 'border-outline-variant/30 group-hover:border-primary';
            return (
              <div
                key={group._id}
                onClick={() => onSelectGroup(group)}
                className={'p-md border-b border-outline-variant/10 cursor-pointer transition-colors ' + bgClass}
              >
                <div className="flex gap-md items-start group">
                  <div className={'w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border transition-colors ' + borderClass}>
                    {group.avatar ? (
                      <img alt={group.name} src={group.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                        {getInitials(group.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-label text-sm text-on-surface font-bold truncate">{group.name}</h3>
                    <p className="font-body text-xs text-on-surface-variant mt-xs">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
