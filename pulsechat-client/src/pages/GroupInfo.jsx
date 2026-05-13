import { useState } from 'react';
import toast from 'react-hot-toast';
import { addGroupMembersApi, removeGroupMemberApi, leaveGroupApi, deleteGroupApi } from '../api';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GroupInfo({ group, currentUserId, onGroupUpdated, onLeaveGroup, onDelete, isLoading = false }) {
  const [actionLoading, setActionLoading] = useState(null);

  const isCreator = group.createdBy === currentUserId;
  const isAdmin = group.admins?.includes(currentUserId) || isCreator;

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    
    setActionLoading(`remove-${userId}`);
    try {
      await removeGroupMemberApi(group._id, userId);
      toast.success('Member removed');
      onGroupUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    
    setActionLoading('leave');
    try {
      await leaveGroupApi(group._id);
      toast.success('Left group');
      onLeaveGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    
    setActionLoading('delete');
    try {
      await deleteGroupApi(group._id);
      toast.success('Group deleted');
      onDelete();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-l border-outline-variant/30 bg-surface">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-lg border-b border-outline-variant/30">
          {group.avatar && (
            <img alt={group.name} src={group.avatar} className="w-full h-32 object-cover rounded-lg mb-md" />
          )}
          <h2 className="font-headline text-xl font-bold text-on-surface mb-xs">{group.name}</h2>
          {group.description && (
            <p className="font-body text-sm text-on-surface-variant">{group.description}</p>
          )}
          <p className="font-label text-xs text-on-surface-variant mt-md">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="p-lg border-b border-outline-variant/30">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label text-sm font-bold text-on-surface">Members ({group.memberIds?.length || 0})</h3>
          </div>

          <div className="space-y-xs">
            {(group.memberIds || []).map(memberId => {
              const isMe = memberId === currentUserId;
              const isGroupAdmin = group.admins?.includes(memberId);
              return (
                <div key={memberId} className="flex items-center justify-between p-sm bg-surface-container rounded-lg">
                  <div className="flex items-center gap-sm flex-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                      {memberId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-label text-xs text-on-surface font-bold">{isMe ? 'You' : memberId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    {isGroupAdmin && (
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">Admin</span>
                    )}
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={actionLoading === `remove-${memberId}`}
                        className="text-error hover:text-error-dim text-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-lg border-b border-outline-variant/30 space-y-md text-sm">
          <div>
            <p className="font-label text-xs text-on-surface-variant font-bold mb-xs">Group ID</p>
            <p className="font-body text-xs text-on-surface font-mono break-all">{group._id}</p>
          </div>
        </div>
      </div>

      <div className="p-lg border-t border-outline-variant/30 space-y-sm">
        <button
          onClick={handleLeaveGroup}
          disabled={actionLoading === 'leave' || isLoading}
          className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-label text-sm font-bold py-2 px-md rounded-lg hover:bg-surface-variant/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Leave Group
        </button>
        {isCreator && (
          <button
            onClick={handleDeleteGroup}
            disabled={actionLoading === 'delete' || isLoading}
            className="w-full bg-error/10 border border-error/30 text-error font-label text-sm font-bold py-2 px-md rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Group
          </button>
        )}
      </div>
    </div>
  );
}
