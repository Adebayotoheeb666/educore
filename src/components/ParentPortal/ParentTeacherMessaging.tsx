import { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Clock,
  Search,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  subjectName?: string;
  className?: string;
  profileImage?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'teacher';
  content: string;
  attachmentUrl?: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherImage?: string;
  subject?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export const ParentTeacherMessaging = ({ childId }: { childId: string }) => {
  const { user, schoolId } = useAuth();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch child's teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!childId || !schoolId) return;

      try {
        // Get staff assignments for classes where this student is enrolled
        const { data: studentClasses, error: classError } = await supabase
          .from('student_classes')
          .select('class_id')
          .eq('student_id', childId)
          .eq('school_id', schoolId);

        if (classError) throw classError;

        const classIds = studentClasses?.map((sc) => sc.class_id) || [];

        if (classIds.length === 0) {
          setTeachers([]);
          return;
        }

        // Get staff assignments for those classes
        const { data: assignments, error: assignmentError } = await supabase
          .from('staff_assignments')
          .select('staff_id, class_id, subjects(name)')
          .in('class_id', classIds)
          .eq('school_id', schoolId);

        if (assignmentError) throw assignmentError;

        // Get staff details
        const staffIds = [...new Set(assignments?.map((a) => a.staff_id) || [])];

        if (staffIds.length === 0) {
          setTeachers([]);
          return;
        }

        const { data: staffData, error: staffError } = await supabase
          .from('users')
          .select('id, full_name, email, profile_image')
          .in('id', staffIds)
          .eq('role', 'staff');

        if (staffError) throw staffError;

        const teachersList = staffData?.map((staff) => {
          const assignment = assignments.find((a) => a.staff_id === staff.id);
          return {
            id: staff.id,
            fullName: staff.full_name,
            email: staff.email,
            subjectName: (assignment as any)?.subjects?.[0]?.name,
            profileImage: staff.profile_image,
          };
        }) || [];

        setTeachers(teachersList);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    fetchTeachers();
  }, [childId, schoolId]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !schoolId) return;

      setLoading(true);
      try {
        // For now, create a simple conversation list based on teachers
        // In a production system, you'd query actual conversations from a table
        const conversationsList: Conversation[] = teachers.map((teacher) => ({
          id: `${user.id}-${teacher.id}`,
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          teacherImage: teacher.profileImage,
          subject: teacher.subjectName,
          lastMessage: undefined,
          lastMessageTime: undefined,
          unreadCount: 0,
        }));

        if (conversationsList.length > 0) {
          setSelectedTeacherId(conversationsList[0].teacherId);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, schoolId, teachers]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedTeacherId || !user) return;

      try {
        // Fetch messages between parent and teacher
        // This assumes a messages table with sender_id, receiver_id, and content
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedTeacherId}),and(sender_id.eq.${selectedTeacherId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        const messagesList = (data || []).map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          content: msg.content,
          attachmentUrl: msg.attachment_url,
          timestamp: msg.created_at,
          read: msg.read,
        }));

        setMessages(messagesList);

        // Mark messages as read
        if (messagesList.some((m) => !m.read && m.senderId === selectedTeacherId)) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', selectedTeacherId);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedTeacherId, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedTeacherId || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        sender_name: user.email?.split('@')[0] || 'Parent',
        sender_role: 'parent',
        receiver_id: selectedTeacherId,
        content: messageText,
        school_id: schoolId,
        created_at: new Date().toISOString(),
        read: false,
      });

      if (error) throw error;

      setMessageText('');
      // Message will be fetched on next poll
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 text-gray-400 mb-4">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-lg font-bold">No Teachers Available</h3>
        </div>
        <p className="text-center text-gray-500">
          Your child hasn't been assigned to any classes yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-full min-h-[600px]">
        {/* Teachers List */}
        <div className="lg:col-span-1 bg-white/5 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-bold text-white mb-3">Teachers</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTeachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors ${selectedTeacherId === teacher.id
                  ? 'bg-teal-500/20 border-l-2 border-l-teal-500'
                  : 'hover:bg-white/5'
                  }`}
              >
                <p className="font-bold text-white text-sm">{teacher.fullName}</p>
                {teacher.subjectName && (
                  <p className="text-xs text-gray-400 mt-1">{teacher.subjectName}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">{teacher.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-3 flex flex-col">
          {selectedTeacherId && (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">
                    {teachers.find((t) => t.id === selectedTeacherId)?.fullName}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {teachers.find((t) => t.id === selectedTeacherId)?.subjectName}
                  </p>
                </div>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <MessageSquare className="w-12 h-12 opacity-50" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'parent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-lg p-3 ${msg.senderRole === 'parent'
                          ? 'bg-teal-500 text-white'
                          : 'bg-white/10 text-gray-100'
                          }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-2 opacity-70">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageText.trim()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
