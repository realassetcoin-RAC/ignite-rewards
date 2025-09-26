import { databaseAdapter } from "@/lib/databaseAdapter";

export interface ContactTicket {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_email: string;
  user_name?: string;
  category: string;
  tag?: string;
  subject?: string;
  description: string;
  status: string;
  priority: string;
  assigned_to?: string;
  slack_message_ts?: string;
  slack_channel?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface IssueCategory {
  id: string;
  category_key: string;
  category_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface IssueTag {
  id: string;
  category_id: string;
  tag_key: string;
  tag_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatbotConversation {
  id: string;
  session_id: string;
  user_id?: string;
  user_email?: string;
  conversation_data: any;
  ticket_id?: string;
  started_at: string;
  ended_at?: string;
  status: string;
}

export interface ChatbotInteraction {
  id: string;
  conversation_id: string;
  interaction_type: string;
  message_content?: string;
  metadata?: any;
  timestamp: string;
}

/**
 * Create a new chatbot conversation
 */
export async function createConversation(
  sessionId: string,
  userId?: string,
  userEmail?: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const { data, error } = await databaseAdapter.supabase
      .from('chatbot_conversations')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_email: userEmail,
        conversation_data: { messages: [] },
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: 'Failed to create conversation' };
    }

    return { success: true, conversationId: data?.id };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'Failed to create conversation' };
  }
}

/**
 * Add an interaction to a conversation
 */
export async function addInteraction(
  conversationId: string,
  interactionType: string,
  messageContent?: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chatbot_interactions')
      .insert({
        conversation_id: conversationId,
        interaction_type: interactionType,
        message_content: messageContent,
        metadata: metadata
      });

    if (error) {
      console.error('Error adding interaction:', error);
      return { success: false, error: 'Failed to add interaction' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding interaction:', error);
    return { success: false, error: 'Failed to add interaction' };
  }
}

/**
 * Get issue categories
 */
export async function getIssueCategories(): Promise<{
  success: boolean;
  data?: IssueCategory[];
  error?: string;
}> {
  try {
    const { data, error } = await databaseAdapter.supabase
      .from('issue_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name');

    if (error) {
      // Don't log database connection errors in browser environment as they're expected
      if (error.message !== 'Database not connected') {
        console.error('Error fetching categories:', error);
      }
      // Return fallback categories when database is not available
      const fallbackCategories = [
        { id: 1, category_name: 'General Inquiry', is_active: true },
        { id: 2, category_name: 'Technical Support', is_active: true },
        { id: 3, category_name: 'Billing Question', is_active: true },
        { id: 4, category_name: 'Feature Request', is_active: true },
        { id: 5, category_name: 'Bug Report', is_active: true }
      ];
      return { success: true, data: fallbackCategories };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    // Don't log database connection errors in browser environment as they're expected
    if (error instanceof Error && error.message !== 'Database not connected') {
      console.error('Error fetching categories:', error);
    }
    // Return fallback categories when database is not available
    const fallbackCategories = [
      { id: 1, category_name: 'General Inquiry', is_active: true },
      { id: 2, category_name: 'Technical Support', is_active: true },
      { id: 3, category_name: 'Billing Question', is_active: true },
      { id: 4, category_name: 'Feature Request', is_active: true },
      { id: 5, category_name: 'Bug Report', is_active: true }
    ];
    return { success: true, data: fallbackCategories };
  }
}

/**
 * Get issue tags for a category
 */
export async function getIssueTags(categoryId: string): Promise<{
  success: boolean;
  data?: IssueTag[];
  error?: string;
}> {
  try {
    const { data, error } = await databaseAdapter.supabase
      .from('issue_tags')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('tag_name');

    if (error) {
      console.error('Error fetching tags:', error);
      return { success: false, error: 'Failed to fetch tags' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { success: false, error: 'Failed to fetch tags' };
  }
}

/**
 * Upload file attachment
 */
export async function uploadAttachment(
  file: File,
  ticketId: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 5MB limit' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${ticketId}_${Date.now()}.${fileExt}`;
    const filePath = `contact-attachments/${fileName}`;

    // Upload to Supabase Storage
    const { /* data: _uploadData, */ error: uploadError } = await supabase.storage
      .from('contact-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('contact-attachments')
      .getPublicUrl(filePath);

    return { success: true, fileUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return { success: false, error: 'Failed to upload attachment' };
  }
}

/**
 * Create a support ticket
 */
export async function createTicket(params: {
  userEmail: string;
  userName?: string;
  category: string;
  tag?: string;
  description: string;
  attachments?: File[];
}): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  try {
    // Generate ticket ID
    const { data: ticketIdData, error: ticketIdError } = await databaseAdapter.supabase.rpc('generate_ticket_id');
    
    if (ticketIdError) {
      console.error('Error generating ticket ID:', ticketIdError);
      return { success: false, error: 'Failed to generate ticket ID' };
    }

    const ticketId = ticketIdData;

    // Create ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('contact_tickets')
      .insert({
        ticket_id: ticketId,
        user_email: params.userEmail,
        user_name: params.userName,
        category: params.category,
        tag: params.tag,
        description: params.description,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return { success: false, error: 'Failed to create ticket' };
    }

    // Upload attachments if any
    if (params.attachments && params.attachments.length > 0) {
      for (const file of params.attachments) {
        const uploadResult = await uploadAttachment(file, ticketId);
        
        if (uploadResult.success && uploadResult.fileUrl) {
          // Record attachment in database
          await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticketData.id,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              file_url: uploadResult.fileUrl
            });
        }
      }
    }

    return { success: true, ticketId: ticketId };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { success: false, error: 'Failed to create ticket' };
  }
}

/**
 * Get user's tickets
 */
export async function getUserTickets(userId?: string, userEmail?: string): Promise<{
  success: boolean;
  data?: ContactTicket[];
  error?: string;
}> {
  try {
    let query = supabase
      .from('contact_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    } else {
      return { success: false, error: 'User ID or email required' };
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return { success: false, error: 'Failed to fetch tickets' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { success: false, error: 'Failed to fetch tickets' };
  }
}

/**
 * Get ticket details with attachments
 */
export async function getTicketDetails(ticketId: string): Promise<{
  success: boolean;
  data?: ContactTicket & { attachments: TicketAttachment[] };
  error?: string;
}> {
  try {
    // Get ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('contact_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return { success: false, error: 'Ticket not found' };
    }

    // Get attachments
    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketData.id);

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
      return { success: false, error: 'Failed to fetch attachments' };
    }

    return {
      success: true,
      data: {
        ...ticketData,
        attachments: attachmentsData || []
      }
    };
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return { success: false, error: 'Failed to fetch ticket details' };
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  assignedTo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { status };
    
    if (assignedTo) {
      updateData.assigned_to = assignedTo;
    }
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('contact_tickets')
      .update(updateData)
      .eq('ticket_id', ticketId);

    if (error) {
      console.error('Error updating ticket status:', error);
      return { success: false, error: 'Failed to update ticket status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return { success: false, error: 'Failed to update ticket status' };
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(sessionId: string): Promise<{
  success: boolean;
  data?: ChatbotConversation;
  error?: string;
}> {
  try {
    const { data, error } = await databaseAdapter.supabase
      .from('chatbot_conversations')
      .select(`
        *,
        chatbot_interactions (*)
      `)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: 'Conversation not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return { success: false, error: 'Failed to fetch conversation' };
  }
}

/**
 * End conversation
 */
export async function endConversation(
  conversationId: string,
  ticketId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status: 'completed',
      ended_at: new Date().toISOString()
    };

    if (ticketId) {
      updateData.ticket_id = ticketId;
    }

    const { error } = await supabase
      .from('chatbot_conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (error) {
      console.error('Error ending conversation:', error);
      return { success: false, error: 'Failed to end conversation' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error ending conversation:', error);
    return { success: false, error: 'Failed to end conversation' };
  }
}

/**
 * Get analytics data for admin dashboard
 */
export async function getContactAnalytics(): Promise<{
  success: boolean;
  data?: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResponseTime: number;
    categoryBreakdown: { category: string; count: number }[];
    recentTickets: ContactTicket[];
  };
  error?: string;
}> {
  try {
    // Get ticket counts
    const { data: ticketCounts, error: countError } = await supabase
      .from('contact_tickets')
      .select('status')
      .in('status', ['open', 'in_progress', 'resolved', 'closed']);

    if (countError) {
      console.error('Error fetching ticket counts:', countError);
      return { success: false, error: 'Failed to fetch analytics' };
    }

    // Get category breakdown
    const { data: categoryData, error: categoryError } = await supabase
      .from('contact_tickets')
      .select('category')
      .not('category', 'is', null);

    if (categoryError) {
      console.error('Error fetching category data:', categoryError);
      return { success: false, error: 'Failed to fetch analytics' };
    }

    // Get recent tickets
    const { data: recentTickets, error: recentError } = await supabase
      .from('contact_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Error fetching recent tickets:', recentError);
      return { success: false, error: 'Failed to fetch analytics' };
    }

    // Process data
    const totalTickets = ticketCounts?.length || 0;
    const openTickets = ticketCounts?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;
    const resolvedTickets = ticketCounts?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    categoryData?.forEach(ticket => {
      const count = categoryMap.get(ticket.category) || 0;
      categoryMap.set(ticket.category, count + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));

    return {
      success: true,
      data: {
        totalTickets,
        openTickets,
        resolvedTickets,
        averageResponseTime: 24, // Placeholder - would need to calculate from actual data
        categoryBreakdown,
        recentTickets: recentTickets || []
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { success: false, error: 'Failed to fetch analytics' };
  }
}
