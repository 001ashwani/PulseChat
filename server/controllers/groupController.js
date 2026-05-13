import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const creatorId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Ensure creator is in members
    const allMemberIds = Array.from(new Set([creatorId.toString(), ...(memberIds || [])]))
      .map(id => id.toString());

    // Create members array
    const members = allMemberIds.map(userId => ({
      userId: userId === creatorId.toString() ? creatorId : userId,
      role: userId === creatorId.toString() ? 'admin' : 'member',
    }));

    const group = await Group.create({
      name,
      description: description || '',
      createdBy: creatorId,
      members,
    });

    // Create conversation for group
    const conversation = await Conversation.create({
      type: 'group',
      groupId: group._id,
      participants: allMemberIds,
    });

    res.status(201).json({
      ...group.toObject(),
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('Error in createGroup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get group info
// @route   GET /api/groups/:id
// @access  Private
export const getGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.userId._id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error('Error in getGroup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update group info (admin only)
// @route   PATCH /api/groups/:id
// @access  Private
export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    const isAdmin = group.members.some(m => 
      m.userId.toString() === userId.toString() && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update group' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error('Error in updateGroup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add members to group (admin only)
// @route   POST /api/groups/:id/members
// @access  Private
export const addMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    const isAdmin = group.members.some(m => 
      m.userId.toString() === userId.toString() && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    // Add new members
    const existingIds = group.members.map(m => m.userId.toString());
    const newMemberIds = memberIds.filter(id => !existingIds.includes(id.toString()));

    newMemberIds.forEach(id => {
      group.members.push({
        userId: id,
        role: 'member',
      });
    });

    await group.save();

    // Update conversation participants
    const conversation = await Conversation.findOne({ groupId: group._id });
    if (conversation) {
      newMemberIds.forEach(id => {
        if (!conversation.participants.includes(id)) {
          conversation.participants.push(id);
        }
      });
      await conversation.save();
    }

    const updated = await group.populate('members.userId', 'name email avatar');
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error in addMembers:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove member from group (admin or self)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = async (req, res) => {
  try {
    const { id: groupId, userId: memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin or removing self
    const isAdmin = group.members.some(m => 
      m.userId.toString() === userId.toString() && m.role === 'admin'
    );
    const isSelf = userId.toString() === memberId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Don't allow removing the creator
    if (group.createdBy.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove group creator' });
    }

    group.members = group.members.filter(m => m.userId.toString() !== memberId);
    await group.save();

    // Update conversation
    const conversation = await Conversation.findOne({ groupId: group._id });
    if (conversation) {
      conversation.participants = conversation.participants.filter(id => id.toString() !== memberId);
      await conversation.save();
    }

    res.status(200).json({ success: true, groupId, removedUserId: memberId });
  } catch (error) {
    console.error('Error in removeMember:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    User leaves group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave group. Delete group or transfer ownership first.' });
    }

    group.members = group.members.filter(m => m.userId.toString() !== userId.toString());
    await group.save();

    // Update conversation
    const conversation = await Conversation.findOne({ groupId: group._id });
    if (conversation) {
      conversation.participants = conversation.participants.filter(id => id.toString() !== userId.toString());
      await conversation.save();
    }

    res.status(200).json({ success: true, groupId });
  } catch (error) {
    console.error('Error in leaveGroup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete group (admin only)
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only creator can delete group' });
    }

    await Group.findByIdAndDelete(groupId);
    await Conversation.findOneAndDelete({ groupId });

    res.status(200).json({ success: true, groupId });
  } catch (error) {
    console.error('Error in deleteGroup:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
