import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { createGroupApi } from '../api';

export default function NewGroupModal({ isOpen, onClose, onGroupCreated, contacts = [] }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    return contacts.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMembers.some(m => m._id === c._id)
    );
  }, [contacts, searchQuery, selectedMembers]);

  const handleAddMember = (contact) => {
    setSelectedMembers(prev => [...prev, contact]);
    setSearchQuery('');
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== memberId));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    if (selectedMembers.length < 1) {
      toast.error('Add at least 1 member');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createGroupApi({
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers.map(m => m._id),
      });
      
      toast.success('Group created!');
      onGroupCreated(data);
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 flex justify-between items-center p-lg border-b border-outline-variant/30 bg-surface">
          <h2 className="font-headline text-xl font-bold text-on-surface">Create Group</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-lg space-y-lg">
          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows="3"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Add Members *
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm"
                disabled={loading}
              />
              {searchQuery && filteredContacts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-outline-variant/30 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact._id}
                      type="button"
                      onClick={() => handleAddMember(contact)}
                      className="w-full px-md py-sm text-left hover:bg-surface-variant/50 transition-colors border-b border-outline-variant/10 last:border-b-0 flex items-center gap-md"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="font-label text-sm text-on-surface">{contact.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div>
              <label className="block font-label text-sm font-bold text-on-surface mb-xs">
                Selected Members ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-sm">
                {selectedMembers.map(member => (
                  <div
                    key={member._id}
                    className="bg-primary-container text-on-primary-container px-md py-xs rounded-full flex items-center gap-xs font-label text-sm"
                  >
                    <span>{member.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-md pt-lg border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface font-label text-sm font-bold py-sm px-md rounded-lg hover:bg-surface-variant/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 bg-primary text-on-primary font-label text-sm font-bold py-sm px-md rounded-lg hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-xs"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
