// INTEGRATION GUIDE FOR GROUP CHAT FUNCTIONALITY
// This document explains how to integrate the 4 group components into the existing Chat.jsx

// FILE: pulsechat-client/src/pages/Chat.jsx

// 1. ADD IMPORTS at the top (after existing imports):
/*
import NewGroupModal from './NewGroupModal';
import GroupList from './GroupList';
import GroupInfo from './GroupInfo';
import GroupChat from './GroupChat';
import { getGroupApi, getAllGroupsApi } from '../api';
*/

// 2. ADD STATE VARIABLES in the Chat component (around line 42):
/*
  // Group-related state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('messages'); // 'messages' or 'groups'
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsInfoVisible, setGroupsInfoVisible] = useState(false);
*/

// 3. ADD useEffect to load groups (add after existing useEffect hooks):
/*
  useEffect(() => {
    if (!user) return;
    setLoadingGroups(true);
    getAllGroupsApi()
      .then(({ data }) => setGroups(data || []))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoadingGroups(false));
  }, [user]);
*/

// 4. UPDATE the sidebar navigation buttons (around line 302-309):
// Change the "Chats" and "Contacts" buttons to toggle between messages and groups view:
/*
  <button 
    onClick={() => { setViewMode('messages'); setGroupsInfoVisible(false); }}
    className={`w-full font-bold flex items-center gap-4 py-3 px-4 rounded-lg active:scale-95 transition-transform ${viewMode === 'messages' ? 'text-on-primary-container bg-primary-container' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'}`}
  >
    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
    <span className="font-label text-sm">Chats</span>
  </button>
  <button 
    onClick={() => { setViewMode('groups'); setGroupsInfoVisible(false); }}
    className={`w-full font-bold flex items-center gap-4 py-3 px-4 rounded-lg active:scale-95 transition-transform ${viewMode === 'groups' ? 'text-on-primary-container bg-primary-container' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'}`}
  >
    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>group</span>
    <span className="font-label text-sm">Groups</span>
  </button>
*/

// 5. MODIFY the sidebar content area (around line 378-422):
// Replace the chat list with conditional rendering based on viewMode:
/*
  {viewMode === 'messages' ? (
    // Existing messages list code...
  ) : (
    // Groups list
    <GroupList 
      groups={groups}
      selectedGroupId={selectedGroup?._id}
      onSelectGroup={setSelectedGroup}
      onNewGroup={() => setShowGroupModal(true)}
      loading={loadingGroups}
    />
  )}
*/

// 6. MODIFY the main content area (around line 426):
// Replace the main content conditional rendering:
/*
  <main className="flex-1 flex flex-col min-w-0 relative bg-surface-bright">
    {viewMode === 'messages' ? (
      // Existing messages chat code (selectedUser ? ...)
    ) : (
      // Groups view
      selectedGroup ? (
        <GroupChat 
          groupId={selectedGroup._id}
          onBack={() => setSelectedGroup(null)}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-on-surface-variant">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl mb-4">group</span>
            <p>Select a group or create a new one</p>
          </div>
        </div>
      )
    )}
  </main>
*/

// 7. ADD RIGHT SIDEBAR for group info (if needed, can be placed after main):
/*
  {viewMode === 'groups' && selectedGroup && groupsInfoVisible && (
    <GroupInfo
      group={selectedGroup}
      currentUserId={user._id}
      onGroupUpdated={() => {
        // Refresh group data
        getAllGroupsApi().then(({ data }) => {
          setGroups(data);
          const updated = data.find(g => g._id === selectedGroup._id);
          setSelectedGroup(updated);
        });
      }}
      onLeaveGroup={() => {
        setSelectedGroup(null);
        setGroupsInfoVisible(false);
        getAllGroupsApi().then(({ data }) => setGroups(data));
      }}
      onDelete={() => {
        setSelectedGroup(null);
        setGroupsInfoVisible(false);
        getAllGroupsApi().then(({ data }) => setGroups(data));
      }}
    />
  )}
*/

// 8. ADD the modal at the end of the component (before the closing div):
/*
  <NewGroupModal
    isOpen={showGroupModal}
    onClose={() => setShowGroupModal(false)}
    onGroupCreated={(newGroup) => {
      setGroups(prev => [newGroup, ...prev]);
      setSelectedGroup(newGroup);
      setViewMode('groups');
    }}
    contacts={users}
  />
*/

// 9. ADD API function if not present in api/index.js:
// Add to pulsechat-client/src/api/index.js:
/*
export const getAllGroupsApi = () => api.get('/groups');
*/

console.log('Group chat integration guide created. See comments above for integration steps.');
