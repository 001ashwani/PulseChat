const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'pulsechat-client', 'src', 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// NewGroupModal.jsx
const newGroupModal = require('fs').readFileSync(path.join(__dirname, 'new-group-modal.txt'), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'NewGroupModal.jsx'), newGroupModal);
console.log('✓ Created NewGroupModal.jsx');

const groupList = require('fs').readFileSync(path.join(__dirname, 'group-list.txt'), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'GroupList.jsx'), groupList);
console.log('✓ Created GroupList.jsx');

const groupInfo = require('fs').readFileSync(path.join(__dirname, 'group-info.txt'), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'GroupInfo.jsx'), groupInfo);
console.log('✓ Created GroupInfo.jsx');

const groupChat = require('fs').readFileSync(path.join(__dirname, 'group-chat.txt'), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'GroupChat.jsx'), groupChat);
console.log('✓ Created GroupChat.jsx');

console.log('\nAll 4 components created successfully!');
