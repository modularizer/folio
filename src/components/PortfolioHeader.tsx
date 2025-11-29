import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { UserProfile } from '@/user/profile';
import { GitHubProfileButton } from './GitHubProfileButton';
import { LinkedInProfileButton } from './LinkedInProfileButton';
import { EmailButton } from './EmailButton';
import { Photo } from './Photo';

interface PortfolioHeaderProps {
  /**
   * User profile data
   */
  profile: UserProfile;
  
  /**
   * Optional GitHub avatar URL for enhanced GitHub button display
   */
  githubAvatarUrl?: string;
  
  /**
   * Optional GitHub username for enhanced GitHub button display
   */
  githubUsername?: string;
  
  /**
   * Optional profile picture/avatar URL to display next to the name
   * Falls back to githubAvatarUrl if not provided
   */
  avatarUrl?: string;
  
  /**
   * Optional bio text to display next to the name on wide screens
   */
  bio?: string;
  
  /**
   * Optional bio stats container to display in header on wide screens
   * This should be a React node containing the stats elements
   */
  bioStats?: React.ReactNode;
  
  /**
   * Custom container style
   */
  style?: any;
}

/**
 * Generic Portfolio Header Component
 * 
 * A responsive header component that displays user name, social links,
 * optional search bar, and optional layout toggle. Not tied to any
 * specific data source (GitHub, static data, etc.).
 * 
 * Usage:
 * <PortfolioHeader 
 *   profile={userProfile}
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   showLayoutToggle={true}
 * />
 */
export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  profile,
  githubAvatarUrl,
  githubUsername,
  avatarUrl,
  bio,
  bioStats,
  style,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  // Use provided avatarUrl, fall back to githubAvatarUrl
  const displayAvatarUrl = avatarUrl || githubAvatarUrl;

  // Helper to extract LinkedIn username from URL
  const extractLinkedInUsername = (url: string): string => {
    const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
    return match ? match[1] : 'LinkedIn';
  };

  // Helper to extract GitHub username from URL
  const extractGitHubUsername = (url: string): string => {
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : 'GitHub';
  };

  // Glass morphism styles for web
  const glassStyle = Platform.OS === 'web' ? {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } : {};

  const styles = StyleSheet.create({
    header: {
      marginBottom: 8, // Reduced spacing below header
      // On small screens, use negative margin to counteract parent padding
      // This makes the header edge-to-edge while keeping its own internal padding
      marginHorizontal: screenWidth > 768 ? 0 : -20, // Counteract parent's 20px horizontal padding on small screens
      marginTop: screenWidth > 768 ? 0 : -20, // Counteract parent's 20px top padding on small screens
    },
    headerTop: {
      flexDirection: screenWidth > 1024 ? 'row' : 'row', // Row layout on all screens, but different structure on small
      alignItems: screenWidth > 1024 ? 'center' : 'flex-start', // Align to top on small screens
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth > 768 ? 24 : 16, // Keep padding on all screens
      paddingTop: screenWidth > 768 ? 14 : 10,
      paddingBottom: screenWidth > 1000 ? 8 : (screenWidth > 768 ? 14 : 10), // Less padding on bottom for wide screens with stats
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Glass effect with dark background
      borderRadius: 12, // Keep border radius on all screens
      // Beveled effect - outer border
      borderWidth: 1,
      borderColor: theme.colors.border,
      // Beveled effect - inner highlights/shadows
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.15)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.3)',
      // Shadow for depth
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
      gap: screenWidth > 1024 ? 16 : 12, // Gap between avatar/name section and social links on small screens
      flexWrap: 'wrap', // Allow wrapping on smaller screens
      maxWidth: '100%', // Prevent overflow
      overflow: 'visible', // Allow overflow for bigger avatar
    },
    headerTopLeft: {
      flexShrink: 1, // Allow shrinking only when absolutely necessary
      marginRight: screenWidth > 1024 ? 16 : 0,
      marginBottom: screenWidth > 1024 ? 0 : 0,
      alignItems: screenWidth > 1024 ? 'flex-start' : 'flex-start', // Align to start on small screens
      minWidth: 0, // Allow shrinking if absolutely necessary
      flexDirection: 'row', // Row layout
      gap: 12,
      // No max width restriction - let it use available space
      overflow: 'visible', // Allow overflow for bigger avatar
      flex: screenWidth > 1024 ? 0 : 1, // Don't grow on desktop, but don't restrict width
      flexGrow: 0, // Don't grow
      flexBasis: 'auto', // Natural size
    },
    nameAndLinksContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      minHeight: screenWidth > 768 ? 60 : 56, // Match avatar height on small screens
    },
    avatarContainer: {
      width: screenWidth > 1024 ? 40 : screenWidth > 768 ? 60 : 56, // Bigger on small screens
      height: screenWidth > 1024 ? 40 : screenWidth > 768 ? 60 : 56, // Bigger on small screens
      borderRadius: screenWidth > 1024 ? 20 : screenWidth > 768 ? 30 : 28, // Circular
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignSelf: screenWidth > 1024 ? 'flex-start' : 'flex-start', // Align to top
      marginTop: screenWidth > 1024 ? 0 : 0, // No top margin
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    nameBioStatsContainer: {
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    nameAndBioContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Align to top to allow multi-line bio
      gap: 12,
      flex: 1,
      minWidth: 0, // Allow shrinking
      flexWrap: 'wrap', // Allow wrapping if needed
    },
    name: {
      fontSize: screenWidth > 768 ? (screenWidth > 1024 ? 32 : 28) : 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      flexShrink: 0, // Don't shrink unnecessarily - use available space
      alignSelf: screenWidth > 1024 ? 'center' : 'flex-start', // Align to start on small screens
      marginTop: screenWidth > 1024 ? 0 : 4, // Small top margin on small screens
    },
    bioInHeader: {
      fontSize: 14,
      lineHeight: 16, // Reduced from 20
      color: theme.colors.textSecondary,
      flex: 1,
      flexShrink: 1,
      paddingLeft: 20,
      maxWidth: 400,
      marginTop: 2, // Moved up 5px (from 2 to -3, from 4 to -1)
      minWidth: 0, // Allow shrinking
    },
    statsInHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      marginTop: -1, // Moved down 5px (from -6 to -1) without changing header height
    },
    headerTopCenter: {
      flex: screenWidth > 1024 ? 0 : 0, // Don't grow - use fixed width
      flexShrink: 1, // Allow shrinking when space is tight
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: screenWidth > 1024 ? 200 : '100%', // Full width on small screens
      maxWidth: screenWidth > 1024 ? 300 : '100%', // Fixed max width on desktop
      width: screenWidth > 1024 ? 300 : '100%', // Fixed width on desktop instead of flex
    },
    headerTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start', // Left align on all screens
      gap: 8,
      flexShrink: 0, // Don't shrink social buttons
      flexWrap: 'wrap', // Allow wrapping if needed
      maxWidth: '100%', // Prevent overflow
      overflow: 'hidden', // Clip overflow
      alignSelf: screenWidth > 1024 ? 'center' : 'flex-start', // Align to start on small screens
      marginTop: screenWidth > 1024 ? 0 : 'auto', // Push to bottom on small screens
      width: screenWidth > 1024 ? 'auto' : 'auto', // Auto width on small screens
    },
  });

  return (
    <View style={[styles.header, style]}>
      {/* Top row: Name, Search (on wide screens), and Social Links */}
      <View style={[styles.headerTop, glassStyle]}>
        <View style={styles.headerTopLeft}>
          {displayAvatarUrl && (
            <View style={styles.avatarContainer}>
              <Photo source={displayAvatarUrl} style={styles.avatar} />
            </View>
          )}
          {screenWidth > 1024 ? (
            <View style={styles.nameBioStatsContainer}>
              <View style={styles.nameAndBioContainer}>
                <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                  {profile.name}
                </Text>
                {screenWidth > 1000 && bio && (
                  <Text style={styles.bioInHeader} numberOfLines={2} ellipsizeMode="tail">
                    {bio}
                  </Text>
                )}
              </View>
              {screenWidth > 1000 && bioStats && (
                <View style={styles.statsInHeader}>
                  {bioStats}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.nameAndLinksContainer}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {profile.name}
              </Text>
              <View style={styles.headerTopRight}>
                {profile.github && (
                  <GitHubProfileButton
                    githubUrl={profile.github}
                    username={githubUsername || extractGitHubUsername(profile.github)}
                    avatarUrl={undefined}
                    size="medium"
                  />
                )}
                {profile.linkedin && (
                  <LinkedInProfileButton
                    linkedinUrl={profile.linkedin}
                    username={extractLinkedInUsername(profile.linkedin)}
                    avatarUrl={profile.linkedinAvatarUrl}
                    size="medium"
                  />
                )}
                {profile.email && (
                  <EmailButton
                    email={profile.email}
                    size="medium"
                  />
                )}
              </View>
            </View>
          )}
        </View>
        {screenWidth > 1024 && (
          <View style={styles.headerTopRight}>
            {profile.github && (
              <GitHubProfileButton
                githubUrl={profile.github}
                username={githubUsername || extractGitHubUsername(profile.github)}
                avatarUrl={undefined}
                size="large"
              />
            )}
            {profile.linkedin && (
              <LinkedInProfileButton
                linkedinUrl={profile.linkedin}
                username={extractLinkedInUsername(profile.linkedin)}
                avatarUrl={profile.linkedinAvatarUrl}
                size="large"
              />
            )}
            {profile.email && (
              <EmailButton
                email={profile.email}
                size="large"
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default PortfolioHeader;

