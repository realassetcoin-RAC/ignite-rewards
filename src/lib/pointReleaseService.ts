import { databaseAdapter } from '@/lib/databaseAdapter';

export interface PointReleaseDelay {
  id: string;
  user_id: string;
  transaction_id: string;
  points_amount: number;
  release_date: string;
  is_released: boolean;
  created_at: string;
}

export interface PointReleaseResult {
  success: boolean;
  releasedPoints: number;
  message: string;
  error?: string;
}

export interface PointReleaseStats {
  totalPendingPoints: number;
  totalReleasedPoints: number;
  pendingReleases: number;
  nextReleaseDate?: string;
}

export class PointReleaseService {
  private static readonly RELEASE_DELAY_DAYS = 30;

  /**
   * Create a point release delay record for a transaction
   */
  static async createPointReleaseDelay(
    userId: string,
    transactionId: string,
    pointsAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + this.RELEASE_DELAY_DAYS);

      const { error } = await supabase
        .from('point_release_delays')
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          points_amount: pointsAmount,
          release_date: releaseDate.toISOString(),
          is_released: false
        });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating point release delay:', error);
      return {
        success: false,
        error: 'Failed to create point release delay'
      };
    }
  }

  /**
   * Process point releases for a specific user
   */
  static async processUserPointReleases(userId: string): Promise<PointReleaseResult> {
    try {
      // Get all pending releases for the user that are due
      const { data: pendingReleases, error: fetchError } = await supabase
        .from('point_release_delays')
        .select('*')
        .eq('user_id', userId)
        .eq('is_released', false)
        .lte('release_date', new Date().toISOString())
        .order('release_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!pendingReleases || pendingReleases.length === 0) {
        return {
          success: true,
          releasedPoints: 0,
          message: 'No points ready for release'
        };
      }

      let totalReleasedPoints = 0;
      const releaseIds: string[] = [];

      // Process each pending release
      for (const release of pendingReleases) {
        try {
          // Add points to user's account
          const { error: pointsError } = await supabase
            .from('loyalty_points')
            .insert({
              user_id: userId,
              points: release.points_amount,
              source: 'point_release',
              description: `Points released from transaction after ${this.RELEASE_DELAY_DAYS}-day delay`,
              transaction_id: release.transaction_id
            });

          if (pointsError) {
            console.error(`Error adding points for release ${release.id}:`, pointsError);
            continue; // Skip this release but continue with others
          }

          // Mark release as completed
          const { error: updateError } = await supabase
            .from('point_release_delays')
            .update({ is_released: true })
            .eq('id', release.id);

          if (updateError) {
            console.error(`Error updating release ${release.id}:`, updateError);
            continue;
          }

          totalReleasedPoints += release.points_amount;
          releaseIds.push(release.id);

        } catch (error) {
          console.error(`Error processing release ${release.id}:`, error);
          continue;
        }
      }

      // Send email notification if points were released
      if (totalReleasedPoints > 0) {
        await this.sendPointReleaseNotification(userId, totalReleasedPoints, releaseIds.length);
      }

      return {
        success: true,
        releasedPoints: totalReleasedPoints,
        message: `Successfully released ${totalReleasedPoints} points from ${releaseIds.length} transactions`
      };

    } catch (error) {
      console.error('Error processing point releases:', error);
      return {
        success: false,
        releasedPoints: 0,
        message: 'Failed to process point releases',
        error: 'Processing error'
      };
    }
  }

  /**
   * Process all pending point releases (background job)
   */
  static async processAllPendingReleases(): Promise<{
    success: boolean;
    totalReleased: number;
    processedUsers: number;
    errors: string[];
  }> {
    try {
      // Get all pending releases that are due
      const { data: pendingReleases, error: fetchError } = await supabase
        .from('point_release_delays')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .eq('is_released', false)
        .lte('release_date', new Date().toISOString())
        .order('release_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!pendingReleases || pendingReleases.length === 0) {
        return {
          success: true,
          totalReleased: 0,
          processedUsers: 0,
          errors: []
        };
      }

      // Group releases by user
      const releasesByUser = pendingReleases.reduce((acc, release) => {
        if (!acc[release.user_id]) {
          acc[release.user_id] = [];
        }
        acc[release.user_id].push(release);
        return acc;
      }, {} as Record<string, typeof pendingReleases>);

      let totalReleased = 0;
      let processedUsers = 0;
      const errors: string[] = [];

      // Process releases for each user
      for (const [userId] of Object.entries(releasesByUser)) {
        try {
          const result = await this.processUserPointReleases(userId);
          if (result.success) {
            totalReleased += result.releasedPoints;
            processedUsers++;
          } else {
            errors.push(`User ${userId}: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        totalReleased,
        processedUsers,
        errors
      };

    } catch (error) {
      console.error('Error processing all pending releases:', error);
      return {
        success: false,
        totalReleased: 0,
        processedUsers: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get point release statistics for a user
   */
  static async getUserPointReleaseStats(userId: string): Promise<PointReleaseStats> {
    try {
      // Get pending releases
      const { data: pendingReleases, error: pendingError } = await supabase
        .from('point_release_delays')
        .select('points_amount, release_date')
        .eq('user_id', userId)
        .eq('is_released', false)
        .order('release_date', { ascending: true });

      if (pendingError) {
        throw pendingError;
      }

      // Get released points
      const { data: releasedPoints, error: releasedError } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', userId)
        .eq('source', 'point_release');

      if (releasedError) {
        throw releasedError;
      }

      const totalPendingPoints = pendingReleases?.reduce((sum, release) => sum + release.points_amount, 0) || 0;
      const totalReleasedPoints = releasedPoints?.reduce((sum, point) => sum + point.points, 0) || 0;
      const pendingReleasesCount = pendingReleases?.length || 0;
      const nextReleaseDate = pendingReleases?.[0]?.release_date;

      return {
        totalPendingPoints,
        totalReleasedPoints,
        pendingReleases: pendingReleasesCount,
        nextReleaseDate
      };

    } catch (error) {
      console.error('Error getting point release stats:', error);
      return {
        totalPendingPoints: 0,
        totalReleasedPoints: 0,
        pendingReleases: 0
      };
    }
  }

  /**
   * Get all pending releases for a user with details
   */
  static async getUserPendingReleases(userId: string): Promise<PointReleaseDelay[]> {
    try {
      const { data, error } = await supabase
        .from('point_release_delays')
        .select(`
          *,
          loyalty_transactions!inner(
            transaction_amount,
            transaction_date,
            merchants!inner(business_name)
          )
        `)
        .eq('user_id', userId)
        .eq('is_released', false)
        .order('release_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user pending releases:', error);
      return [];
    }
  }

  /**
   * Cancel a point release delay (for refunds/cancellations)
   */
  static async cancelPointReleaseDelay(
    transactionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the release record
      const { data: release, error: fetchError } = await supabase
        .from('point_release_delays')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('is_released', false)
        .single();

      if (fetchError || !release) {
        return {
          success: false,
          error: 'Point release delay not found'
        };
      }

      // Mark as cancelled (we'll use a custom field or update the record)
      const { error: updateError } = await supabase
        .from('point_release_delays')
        .update({
          is_released: true, // Mark as "released" but with 0 points
          // Add a comment or reason field if needed
        })
        .eq('id', release.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling point release delay:', error);
      return {
        success: false,
        error: 'Failed to cancel point release delay'
      };
    }
  }

  /**
   * Send email notification for point release
   */
  private static async sendPointReleaseNotification(
    userId: string,
    pointsReleased: number,
    transactionCount: number
  ): Promise<void> {
    try {
      // Get user details
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Error getting user details for notification:', userError);
        return;
      }

      // Get email template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', 'point_release')
        .single();

      if (templateError || !template) {
        console.error('Error getting email template:', templateError);
        return;
      }

      // Prepare email content
      const subject = template.subject.replace('{{points_released}}', pointsReleased.toString());
      const htmlContent = template.html_content
        .replace('{{user_email}}', user.email)
        .replace('{{points_released}}', pointsReleased.toString())
        .replace('{{transaction_count}}', transactionCount.toString())
        .replace('{{transaction_date}}', new Date().toLocaleDateString());

      // Send email notification
      const { error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          to_email: user.email,
          template_name: 'point_release',
          subject,
          html_content: htmlContent,
          text_content: template.text_content,
          variables: {
            user_email: user.email,
            points_released: pointsReleased,
            transaction_count: transactionCount,
            transaction_date: new Date().toLocaleDateString()
          },
          priority: 'normal',
          status: 'pending'
        });

      if (emailError) {
        console.error('Error sending point release notification:', emailError);
      }

    } catch (error) {
      console.error('Error in point release notification:', error);
    }
  }

  /**
   * Get system-wide point release statistics
   */
  static async getSystemPointReleaseStats(): Promise<{
    totalPendingPoints: number;
    totalReleasedToday: number;
    pendingReleasesCount: number;
    averageReleaseTime: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get pending releases
      const { data: pendingReleases, error: pendingError } = await supabase
        .from('point_release_delays')
        .select('points_amount')
        .eq('is_released', false);

      if (pendingError) {
        throw pendingError;
      }

      // Get releases completed today
      const { data: todayReleases, error: todayError } = await supabase
        .from('point_release_delays')
        .select('points_amount, created_at')
        .eq('is_released', true)
        .gte('created_at', today.toISOString());

      if (todayError) {
        throw todayError;
      }

      const totalPendingPoints = pendingReleases?.reduce((sum, release) => sum + release.points_amount, 0) || 0;
      const totalReleasedToday = todayReleases?.reduce((sum, release) => sum + release.points_amount, 0) || 0;
      const pendingReleasesCount = pendingReleases?.length || 0;

      // Calculate average release time (simplified)
      const averageReleaseTime = this.RELEASE_DELAY_DAYS;

      return {
        totalPendingPoints,
        totalReleasedToday,
        pendingReleasesCount,
        averageReleaseTime
      };

    } catch (error) {
      console.error('Error getting system point release stats:', error);
      return {
        totalPendingPoints: 0,
        totalReleasedToday: 0,
        pendingReleasesCount: 0,
        averageReleaseTime: 0
      };
    }
  }
}
